<script>
    import { onMount, tick } from 'svelte';
    import VersesInput from '/src/components/VersesInput.svelte';
    import WrittenText from '/src/components/WrittenText.svelte';
    import ScoreSubmitForm from '/src/components/ScoreSubmitForm.svelte';
    import RunHistory from '/src/components/RunHistory.svelte';
    import { createStopwatch } from '/src/lib/stopwatch.js';
    import { saveRun, runHistoryStore } from '/src/lib/runHistory.js';
    import { countWords } from '/src/lib/verseWords.js';
    import { comparePace } from '/src/lib/recordComparison.js';
    import VersePaceFlash from '/src/components/VersePaceFlash.svelte';
    import { listenForResetChapterShortcut, RESET_CHAPTER_SHORTCUT_HINT } from '/src/lib/resetChapterShortcut.js';

    export let bookName;
    export let chapters;
    /**
     * Optional biblical refs aligned with `chapters` (e.g. "4:7").
     * Used when a portion crosses chapter boundaries.
     * @type {string[][] | null}
     */
    export let verseRefs = null;
    export let useRollingSumVerseIdx;
    export let competitiveMode = false;
    export let showVersePace = false;
    export let round = '';
    export let competitionResetSignal = 0;
    export let hasProgress = false;

    export let start = {
        chapter: 1,
        verse: 1,
    }

    let rollingSumVerseIdx = 0;
    $: if (useRollingSumVerseIdx) {
        let sum = 0;
        for (let i = 0; i < chapterIdx; i++) {
            sum += chapters[i].length;
        }
        rollingSumVerseIdx = sum;
    }

    export let chapterIdx = start.chapter-1;
    let previousBookName = '';
    $: if (bookName !== previousBookName) {
        previousBookName = bookName;
        if (chapterIdx >= chapters.length) {
            chapterIdx = 0;
        }
        resetChapter();
    }
    /**
     * @type {string[]}
     */
    let crtChapter = [];
    $: crtChapter = chapterIdx < chapters.length ? chapters[chapterIdx] : [];

    let verseIdx = Math.max(start.verse - 1, 0);

    let startVerseInput = start.verse;
    $: {
        if (competitiveMode) {
            startVerseInput = 1;
            start.verse = 1;
        } else if (startVerseInput < 1) {
            start.verse = 1;
        } else if (startVerseInput > crtChapter.length) {
            start.verse = crtChapter.length || 1;
        } else {
            start.verse = startVerseInput;
        }
    }

    let rangeTiming = false;
    let includeLeadIn = false;
    let endVerseInput = 1;
    let endDefaultsFor = '';
    let leadInPhase = false;
    let leadInCompleted = false;
    let rangeTimerOn = false;
    let rangeStopped = false;

    $: chapterLength = crtChapter.length;
    $: rangeActive = rangeTiming && !competitiveMode;
    $: {
        const defaultsKey = bookName + ':' + chapterIdx + ':' + chapterLength;
        if (chapterLength > 0 && defaultsKey !== endDefaultsFor) {
            endDefaultsFor = defaultsKey;
            endVerseInput = chapterLength;
        }
    }
    $: rangeEndVerse = clampedRangeEnd(rangeActive, endVerseInput, start.verse, chapterLength);
    $: sessionLimit = rangeActive ? rangeEndVerse : chapterLength;
    $: leadInInfo = computeLeadIn(
        chapters,
        chapterIdx,
        crtChapter,
        start.verse,
        rollingSumVerseIdx,
        !!useRollingSumVerseIdx,
        verseRefs
    );
    $: leadInText = leadInInfo ? leadInInfo.text : '';
    $: leadInLabel = leadInInfo ? leadInInfo.label : '';
    $: leadInKey = leadInInfo ? leadInInfo.label : '';

    const jumpToChapter = (/** @type {number} */ i) => () => {
        chapterIdx = i;
        resetChapter();
    }

    let discoveredVerseText = '';

    let resetVersesInput = () => 0;
    let eligibleForScoring = false;
    let scoreResetSignal = 0;

    const stopwatch = createStopwatch();
    const stopwatchState = stopwatch.state;
    $: timerStarted = $stopwatchState.hasStarted;
    $: elapsedTime = $stopwatchState.elapsedTime;
    $: splits = $stopwatchState.splits;

    let previousCompetitionResetSignal = competitionResetSignal;
    let runSavedForThisAttempt = false;
    let lastSavedRunId = '';
    /** @type {{ id: string, verseDelta: number | null, cumulativeDelta: number | null, verseLabel?: string } | null} */
    let paceFlash = null;

    $: previousRuns = (($runHistoryStore || {})[round] || []);
    let sessionKey = '';

    $: chapterRefs =
        verseRefs && verseRefs[chapterIdx] && verseRefs[chapterIdx].length === crtChapter.length
            ? verseRefs[chapterIdx]
            : null;
    $: chapterVerseLabels = chapterRefs
        ? chapterRefs
        : crtChapter.map((_, i) => String(rollingSumVerseIdx + i + 1));
    $: writtenFrom = Math.max(start.verse, 1) - 1;
    $: writtenLabels = chapterRefs
        ? chapterRefs
              .slice(writtenFrom, verseIdx)
              .concat(verseIdx < sessionLimit ? [chapterRefs[verseIdx] || ''] : [])
        : null;
    $: chapterVerseWordCounts = crtChapter.map((v) => countWords(v));
    $: rangeStartLabel = chapterVerseLabels[start.verse - 1] || String(start.verse);
    $: rangeEndLabel = chapterVerseLabels[rangeEndVerse - 1] || String(rangeEndVerse);
    $: rangeRound = 'range:' + bookName + ':' + (chapterIdx + 1) + ':' + start.verse + '-' + rangeEndVerse;
    $: rangeVerseLabels = chapterVerseLabels.slice(start.verse - 1, rangeEndVerse);
    $: rangeVerseWordCounts = chapterVerseWordCounts.slice(start.verse - 1, rangeEndVerse);
    $: rangeHistoryTitle = chapterRefs
        ? rangeStartLabel === rangeEndLabel
            ? 'Istoric — ' + bookName + ' ' + rangeStartLabel
            : 'Istoric — ' + bookName + ' ' + rangeStartLabel + '–' + rangeEndLabel
        : rangeStartLabel === rangeEndLabel
            ? 'Istoric — ' + bookName + ', capitolul ' + (chapterIdx + 1) + ', versetul ' + rangeStartLabel
            : 'Istoric — ' + bookName + ', capitolul ' + (chapterIdx + 1) + ', versetele ' + rangeStartLabel + '–' + rangeEndLabel;
    $: crtVerse = leadInPhase
        ? leadInText
        : (verseIdx >= 0 && verseIdx < sessionLimit && verseIdx < crtChapter.length ? crtChapter[verseIdx] : '');
    $: rangeWritten = leadInPhase
        ? []
        : crtChapter.slice(start.verse - 1, verseIdx).concat(verseIdx < sessionLimit ? [discoveredVerseText] : []);

    $: if (competitionResetSignal !== previousCompetitionResetSignal) {
        previousCompetitionResetSignal = competitionResetSignal;
        resetChapter();
    }

    $: if (!competitiveMode) {
        eligibleForScoring = false;
        paceFlash = null;
    }

    $: if (!showVersePace) {
        paceFlash = null;
    }

    $: hasProgress = leadInCompleted || leadInPhase
        ? discoveredVerseText.length > 0 || leadInCompleted
        : (verseIdx !== Math.max(start.verse - 1, 0) || discoveredVerseText.length > 0);

    $: {
        const key = [
            bookName,
            chapterIdx,
            rangeActive ? '1' : '0',
            start.verse,
            rangeActive ? rangeEndVerse : chapterLength,
            chapterLength,
            rangeActive && includeLeadIn ? leadInKey : ''
        ].join('|');
        if (chapterLength > 0 && key !== sessionKey) {
            sessionKey = key;
            applySessionStart();
        }
        // leadInPhase is updated above, in this same pass. Refresh the
        // input verse after that, or it can stay on the previous one.
        syncTypedVerse();
    }

    function syncTypedVerse() {
        crtVerse = leadInPhase
            ? leadInText
            : (verseIdx >= 0 && verseIdx < sessionLimit && verseIdx < crtChapter.length ? crtChapter[verseIdx] : '');
        const from = Math.max(start.verse, 1) - 1;
        const partial = verseIdx < sessionLimit;
        rangeWritten = leadInPhase
            ? []
            : crtChapter.slice(from, verseIdx).concat(partial ? [discoveredVerseText] : []);
        // verseIdx is updated in this same flush, after the reactive label
        // slice has already run. Recompute here so the written line shows the
        // biblical ref of the verse actually on screen.
        writtenLabels = !chapterRefs || leadInPhase
            ? null
            : chapterRefs.slice(from, verseIdx).concat(partial ? [chapterRefs[verseIdx] || ''] : []);
    }

    $: if (!timerStarted && competitiveMode && discoveredVerseText.length > 0) {
        eligibleForScoring = competitiveMode;
        runSavedForThisAttempt = false;
        stopwatch.start();
    }

    $: if (timerStarted && !rangeActive && verseIdx == crtChapter.length) {
        stopwatch.stop();
        if (eligibleForScoring && !runSavedForThisAttempt && round) {
            runSavedForThisAttempt = true;
            const saved = saveRun({
                round,
                totalTime: elapsedTime,
                verseTimes: splits.slice(0, crtChapter.length),
                verseLabels: chapterVerseLabels,
                verseWordCounts: chapterVerseWordCounts
            });
            if (saved) {
                lastSavedRunId = saved.id;
            }
        }
    }

    $: if (rangeActive && rangeTimerOn && !leadInPhase && verseIdx === rangeEndVerse && !rangeStopped) {
        const from = start.verse - 1;
        const expected = rangeEndVerse - from;
        if (expected > 0 && splits.length >= expected) {
            rangeStopped = true;
            const times = splits.slice(0, expected);
            stopwatch.stop();
            if (!runSavedForThisAttempt) {
                runSavedForThisAttempt = true;
                const saved = saveRun({
                    round: rangeRound,
                    totalTime: times.reduce((sum, t) => sum + t, 0),
                    verseTimes: times,
                    verseLabels: rangeVerseLabels,
                    verseWordCounts: rangeVerseWordCounts,
                    untimedLeadIn: leadInCompleted
                });
                if (saved) {
                    lastSavedRunId = saved.id;
                }
            }
        }
    }

    /**
     * @param {boolean} active
     * @param {number} endInput
     * @param {number} startVerse
     * @param {number} length
     */
    function clampedRangeEnd(active, endInput, startVerse, length) {
        if (!active) return length;
        const raw = Math.floor(Number(endInput));
        const end = Number.isFinite(raw) ? raw : startVerse;
        const min = Math.max(startVerse, 1);
        const max = Math.max(length, min);
        return Math.min(Math.max(end, min), max);
    }

    /**
     * Verse immediately before the timed range, including the last verse of the previous chapter.
     * @param {string[][]} allChapters
     * @param {number} idx
     * @param {string[]} chapter
     * @param {number} startVerse
     * @param {number} rollingSum
     * @param {boolean} rolling
     * @param {string[][] | null} refs
     * @returns {{ text: string, label: string } | null}
     */
    function computeLeadIn(allChapters, idx, chapter, startVerse, rollingSum, rolling, refs) {
        if (!chapter || chapter.length === 0 || startVerse < 1) return null;
        if (startVerse > 1) {
            const text = chapter[startVerse - 2];
            if (!text) return null;
            const custom = refs && refs[idx] && refs[idx][startVerse - 2];
            return { text, label: custom || 'versetul ' + (rollingSum + startVerse - 1) };
        }
        if (idx <= 0 || !allChapters || !allChapters[idx - 1] || !allChapters[idx - 1].length) {
            return null;
        }
        const prev = allChapters[idx - 1];
        const text = prev[prev.length - 1];
        const custom = refs && refs[idx - 1] && refs[idx - 1][prev.length - 1];
        if (custom) return { text, label: custom };
        if (rolling) {
            return { text, label: 'versetul ' + rollingSum };
        }
        return { text, label: 'capitolul ' + idx + ', versetul ' + prev.length };
    }

    function applySessionStart() {
        rangeTimerOn = false;
        rangeStopped = false;
        stopwatch.reset();
        scoreResetSignal++;
        const nextIdx = Math.max(start.verse, 1) - 1;
        verseIdx = nextIdx;
        leadInPhase = !!(rangeActive && includeLeadIn && leadInInfo && leadInInfo.text);
        leadInCompleted = false;
        discoveredVerseText = '';
        eligibleForScoring = false;
        runSavedForThisAttempt = false;
        lastSavedRunId = '';
        paceFlash = null;
        resetVersesInput();
    }

    function handleRangeActivity() {
        if (!rangeActive || leadInPhase || rangeTimerOn) return;
        if (verseIdx < start.verse - 1 || verseIdx >= rangeEndVerse) return;
        rangeTimerOn = true;
        runSavedForThisAttempt = false;
        stopwatch.start();
    }

    function handleVerseDone() {
        if (leadInPhase) {
            leadInPhase = false;
            leadInCompleted = true;
            discoveredVerseText = '';
            return;
        }
        if (competitiveMode || (rangeActive && verseIdx >= start.verse - 1 && verseIdx < rangeEndVerse)) {
            const verseTime = stopwatch.split();
            if (competitiveMode && showVersePace && round) {
                const currentTimes = [...(splits || []).slice(0, verseIdx), verseTime];
                const comparison = comparePace(currentTimes, previousRuns);
                paceFlash = comparison
                    ? {
                        ...comparison,
                        id: `${Date.now()}-${verseIdx}`,
                        verseLabel: chapterVerseLabels[verseIdx] || String(verseIdx + 1)
                    }
                    : null;
            }
        }
        verseIdx++;
        discoveredVerseText = '';
    }

    function resetChapter() {
        applySessionStart();
    }

    /** @type {HTMLElement | undefined} */
    let practiceAnchor;

    /**
     * Chart indices are 0-based within the verses currently drawn.
     * A full-chapter chart starts at verse 1; a range chart starts at the range.
     * @param {CustomEvent<{ from: number, to: number }>} event
     */
    async function handleChartTrain(event) {
        const fromIdx = Number(event.detail.from);
        const toIdx = Number(event.detail.to);
        if (!Number.isFinite(fromIdx) || !Number.isFinite(toIdx)) return;
        const base = rangeActive ? start.verse : 1;
        const from = base + Math.min(fromIdx, toIdx);
        const to = base + Math.max(fromIdx, toIdx);
        competitiveMode = false;
        rangeTiming = true;
        startVerseInput = from;
        endVerseInput = to;
        await tick();
        if (practiceAnchor) {
            practiceAnchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
            const field = practiceAnchor.querySelector('input:not([type]), input[type="text"]');
            if (field instanceof HTMLElement) field.focus();
        }
    }

    onMount(() => listenForResetChapterShortcut(resetChapter));
</script>

<div bind:this={practiceAnchor}>
<h2>
    {#if chapterRefs}
        {bookName} {chapterRefs[0]}–{chapterRefs[chapterRefs.length - 1]}
    {:else}
        {bookName} - Capitolul {chapterIdx + 1}
    {/if}
</h2>
{#if leadInPhase}
    <p class="range-note">Verset anterior (netimed): {leadInLabel}. Cronometrul pornește abia la intervalul ales.</p>
    <WrittenText verses={[discoveredVerseText]} showVerseNumbers={false}></WrittenText>
{:else}
    {#if rangeActive && leadInCompleted && leadInText}
        <p class="range-note">Verset anterior (netimed): {leadInLabel}</p>
        <WrittenText verses={[leadInText]} showVerseNumbers={false}></WrittenText>
    {/if}
    <WrittenText startIdx={rollingSumVerseIdx+start.verse} verses={rangeWritten} labels={writtenLabels}></WrittenText>
{/if}
{#if competitiveMode && showVersePace && (previousRuns.length > 0 || paceFlash)}
    <VersePaceFlash flash={paceFlash} />
{/if}
<br>
{#if crtVerse && !leadInPhase && (rangeActive || chapterRefs)}
    <h3>
        {#if chapterRefs}
            {chapterRefs[verseIdx] || verseIdx + 1}
        {:else}
            Versetul {chapterVerseLabels[verseIdx] || verseIdx + 1}
        {/if}
        {#if rangeActive && rangeTimerOn}
            — {elapsedTime.toFixed(2)}s
        {/if}
    </h3>
{/if}
{#if crtVerse}
    {#key (leadInPhase ? 'lead:' + leadInLabel : 'v:' + verseIdx)}
        <VersesInput
            inputText={crtVerse}
            fnVerseDone={handleVerseDone}
            bind:discoveredText={discoveredVerseText}
            disableNextButton={competitiveMode || (rangeActive && !leadInPhase)}
            bind:reset={resetVersesInput}
            onActivity={handleRangeActivity}
        ></VersesInput>
    {/key}
{/if}
</div>
<br>
<br>
<h3>{verseRefs ? 'Alege porțiunea' : 'Alege capitolul'}</h3>
<table>
    <tbody>
        <tr>
        {#each chapters as chapter, i}
            <td>
                <button on:click={jumpToChapter(i)}>
                    {#if verseRefs && verseRefs[i] && verseRefs[i].length}
                        {verseRefs[i][0]}–{verseRefs[i][verseRefs[i].length - 1]}
                    {:else}
                        {i+1}
                    {/if}
                </button>
            </td>
        {/each}
        </tr>
    </tbody>
</table>
{#if !competitiveMode}
    <p>
        {#if rangeTiming}De la versetul{:else}Începând cu versetul{/if}
        <input class="verse-number" type="number" min="1" max={chapterLength || 1} bind:value={startVerseInput}>
        {#if chapterRefs && chapterRefs[start.verse - 1]}
            <span class="verse-ref">({chapterRefs[start.verse - 1]})</span>
        {/if}
        {#if rangeTiming}
            până la versetul
            <input class="verse-number" type="number" min="1" max={chapterLength || 1} bind:value={endVerseInput}>
            {#if chapterRefs && chapterRefs[rangeEndVerse - 1]}
                <span class="verse-ref">({chapterRefs[rangeEndVerse - 1]})</span>
            {/if}
        {/if}
    </p>
    <label class="range-option">
        <input type="checkbox" bind:checked={rangeTiming}>
        Antrenament cronometrat pe interval
    </label>
    {#if rangeTiming}
        <p class="range-note">
            {#if start.verse === rangeEndVerse}
                Se cronometrează versetul {rangeStartLabel}.
            {:else}
                Se cronometrează versetele {rangeStartLabel}–{rangeEndLabel}.
            {/if}
            Istoricul compară doar încercările pe acest interval.
        </p>
        {#if leadInLabel}
            <label class="range-option">
                <input type="checkbox" bind:checked={includeLeadIn}>
                Scrie și versetul anterior ({leadInLabel}), netimed
            </label>
            <p class="range-note">
                Versetul anterior nu intră în timp. Simulează doar cum ajungi la versetele pe care le exersezi.
            </p>
        {/if}
    {/if}
{/if}
{#if competitiveMode}
    <div class="timer">
        Timp: {elapsedTime} secunde
    </div>
{/if}
{#if rangeActive}
    <div class="timer">
        {#if leadInPhase || !rangeTimerOn}
            Timp: pornește când începi versetul {rangeStartLabel}
        {:else}
            Timp: {elapsedTime.toFixed(2)} secunde
            {#if verseIdx === rangeEndVerse}
                — interval încheiat
            {/if}
        {/if}
    </div>
{/if}
{#if eligibleForScoring && verseIdx == crtChapter.length}
    <ScoreSubmitForm score={elapsedTime} {round} resetSignal={scoreResetSignal} />
{/if}
{#if competitiveMode && round}
    <RunHistory
        round={round}
        title={chapterRefs
            ? `Istoric pentru ${bookName} ${chapterRefs[0]}–${chapterRefs[chapterRefs.length - 1]}`
            : `Istoric pentru ${bookName} - Capitolul ${chapterIdx + 1}`}
        verseLabels={chapterVerseLabels}
        verseWordCounts={chapterVerseWordCounts}
        highlightRunId={lastSavedRunId}
        enableTrain={true}
        on:train={handleChartTrain}
    />
{/if}
{#if rangeActive}
    <RunHistory
        round={rangeRound}
        title={rangeHistoryTitle}
        verseLabels={rangeVerseLabels}
        verseWordCounts={rangeVerseWordCounts}
        highlightRunId={lastSavedRunId}
        enableTrain={true}
        on:train={handleChartTrain}
    />
{/if}
<button on:click={jumpToChapter(chapterIdx)} title={RESET_CHAPTER_SHORTCUT_HINT}>
    {rangeActive ? 'Reia intervalul' : verseRefs ? 'Resetează porțiunea' : 'Resetează capitolul'}
</button>
({RESET_CHAPTER_SHORTCUT_HINT})

<style>
    .verse-number {
        width: 4.5rem;
    }
    .verse-ref {
        color: #555;
    }
    .range-option {
        display: block;
        margin: 6px 0;
    }
    .range-note {
        color: #555;
        max-width: 42rem;
        margin: 4px 0 8px;
    }
    :global(body.dark-mode) .range-note,
    :global(body.dark-mode) .verse-ref {
        color: #9aa6b4;
    }
</style>
