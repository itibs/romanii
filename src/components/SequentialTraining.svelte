<script>
    import VersesInput from '/src/components/VersesInput.svelte';
    import WrittenText from '/src/components/WrittenText.svelte';
    import ScoreSubmitForm from '/src/components/ScoreSubmitForm.svelte';
    import { createStopwatch } from '/src/lib/stopwatch.js';

    export let bookName;
    export let chapters;
    export let useRollingSumVerseIdx;
    export let competitiveMode = false;
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

    $: verseIdx = start.verse-1;
    $: if (verseIdx < 0) {
        verseIdx = 0;
    }

    let crtVerse = '';
    $: crtVerse = verseIdx < crtChapter.length ? crtChapter[verseIdx] : '';

    let startVerseInput = start.verse;
    $: {
        if (competitiveMode) {
            startVerseInput = 1;
            start.verse = 1;
        } else if (startVerseInput < 1) {
            start.verse = 1;
        } else if (startVerseInput > crtChapter.length) {
            start.verse = crtChapter.length;
        } else {
            start.verse = startVerseInput;
        }
    }

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

    let previousCompetitionResetSignal = competitionResetSignal;

    $: if (competitionResetSignal !== previousCompetitionResetSignal) {
        previousCompetitionResetSignal = competitionResetSignal;
        resetChapter();
    }

    $: if (!competitiveMode) {
        eligibleForScoring = false;
    }

    $: hasProgress = verseIdx !== start.verse - 1 || discoveredVerseText.length > 0;

    $: if (!timerStarted && competitiveMode && discoveredVerseText.length > 0) {
        eligibleForScoring = competitiveMode;
        stopwatch.start();
    }

    $: if (timerStarted && verseIdx == crtChapter.length) {
        stopwatch.stop();
    }

    function resetChapter() {
        stopwatch.reset();
        scoreResetSignal++;
        verseIdx = start.verse - 1;
        discoveredVerseText = '';
        eligibleForScoring = false;
        resetVersesInput();
    }
</script>

<h2>{bookName} - Capitolul {chapterIdx+1}</h2>
<WrittenText startIdx={rollingSumVerseIdx+start.verse} verses={crtChapter.slice(start.verse-1, verseIdx).concat(verseIdx < crtChapter.length ? [discoveredVerseText] : [])}></WrittenText>
<br>
{#key crtVerse}
    <VersesInput inputText={crtVerse} fnVerseDone={() => {verseIdx++; discoveredVerseText = ''}} bind:discoveredText={discoveredVerseText} disableNextButton={competitiveMode} bind:reset={resetVersesInput}></VersesInput>
{/key}
<br>
<br>
<h3>Alege capitolul</h3>
<table>
    <tbody>
        <tr>
        {#each chapters as chapter, i}
            <td>
                <button on:click={jumpToChapter(i)}>
                    {i+1}
                </button>
            </td>
        {/each}
        </tr>
    </tbody>
</table>
{#if !competitiveMode}
    <p>Începând cu versetul <input type=number bind:value={startVerseInput}></p>
{/if}
{#if competitiveMode}
    <div class="timer">
        Timp: {elapsedTime} secunde
    </div>
{/if}
{#if eligibleForScoring && verseIdx == crtChapter.length}
    <ScoreSubmitForm score={elapsedTime} {round} resetSignal={scoreResetSignal} />
{/if}
<button on:click={jumpToChapter(chapterIdx)}>
    Resetează capitolul
</button>