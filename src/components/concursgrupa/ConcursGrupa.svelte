<script>
	import VersesInput from '/src/components/VersesInput.svelte';
	import WrittenText from '/src/components/WrittenText.svelte';
	import ScoreSubmitForm from '/src/components/ScoreSubmitForm.svelte';
	import RunHistory from '/src/components/RunHistory.svelte';
	import { createStopwatch } from '/src/lib/stopwatch.js';
	import { saveRun, runHistoryStore } from '/src/lib/runHistory.js';
	import { countWords } from '/src/lib/verseWords.js';
	import { comparePace } from '/src/lib/recordComparison.js';
	import VersePaceFlash from '/src/components/VersePaceFlash.svelte';

	export let round;
	export let verses;
    /**
	 * @type {boolean}
	 */
     export let trainingMode;
    export let showVersePace = false;

    let eligibleForScoring = false;
	let scoreResetSignal = 0;
	let runSavedForThisAttempt = false;
	let lastSavedRunId = '';
	/** @type {{ id: string, verseDelta: number | null, cumulativeDelta: number | null, verseLabel?: string } | null} */
	let paceFlash = null;

	$: previousRuns = (($runHistoryStore || {})[round] || []);

	let resetVersesInput = () => 0;

	const stopwatch = createStopwatch();
	const stopwatchState = stopwatch.state;
	$: timerStarted = $stopwatchState.hasStarted;
	$: elapsedTime = $stopwatchState.elapsedTime;
	$: splits = $stopwatchState.splits;

	let verseIdx = 0;
	$: if (verses) {
		reset();
	}
	$: if (verseIdx < 0) {
		reset();
	}

	let crtVerse = '';
	$: crtVerse = verseIdx < verses.length ? verses[verseIdx].verse : '';

	let writtenText = '';
	$: writtenText = discoveredVerseText;

	let discoveredVerseText = '';

	$: verseLabels = verses.map((v, i) => (v && v.ref) ? v.ref : String(i + 1));
	$: verseWordCounts = verses.map((v) => countWords(v && v.verse ? v.verse : ''));

    $: if (!timerStarted && discoveredVerseText.length > 0) {
        if (!trainingMode) {
            eligibleForScoring = true;
        }
        runSavedForThisAttempt = false;
        stopwatch.start();
    }

    $: if (timerStarted && verseIdx == verses.length) {
        stopwatch.stop();
        if (eligibleForScoring && !runSavedForThisAttempt && round) {
            runSavedForThisAttempt = true;
            const saved = saveRun({
                round,
                totalTime: elapsedTime,
                verseTimes: splits.slice(0, verses.length),
                verseLabels,
                verseWordCounts
            });
            if (saved) {
                lastSavedRunId = saved.id;
            }
        }
    }

    $: if (trainingMode) {
        eligibleForScoring = false;
    }

    $: if (trainingMode || !showVersePace) {
        paceFlash = null;
    }

    function handleVerseDone() {
        const verseTime = stopwatch.split();
        if (showVersePace && !trainingMode && round) {
            const currentTimes = [...(splits || []).slice(0, verseIdx), verseTime];
            const comparison = comparePace(currentTimes, previousRuns);
            paceFlash = comparison
                ? {
                    ...comparison,
                    id: `${Date.now()}-${verseIdx}`,
                    verseLabel: verseLabels[verseIdx] || String(verseIdx + 1)
                }
                : null;
        }
        if (verseIdx < verses.length) {
            verseIdx++;
        }
        discoveredVerseText = '';
    }

    function reset() {
        stopwatch.reset();
		scoreResetSignal++;
        verseIdx = 0;
        discoveredVerseText = '';
		eligibleForScoring = false;
		runSavedForThisAttempt = false;
		paceFlash = null;
		resetVersesInput();
    }
</script>

<h2>{round}</h2>
<WrittenText
	verses={verses
		.slice(0, verseIdx)
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={true}
/>
{#if verses[verseIdx]}
	<h3>{verseIdx + 1}. {verses[verseIdx].ref}</h3>
{/if}
<WrittenText startIdx="0" verses={[discoveredVerseText]} showVerseNumbers={false} />
{#if showVersePace && !trainingMode && (previousRuns.length > 0 || paceFlash)}
	<VersePaceFlash flash={paceFlash} />
{/if}
<br />
{#key crtVerse}
	<VersesInput
		inputText={crtVerse}
		fnVerseDone={handleVerseDone}
		bind:discoveredText={discoveredVerseText}
		disableNextButton={!trainingMode}
		bind:reset={resetVersesInput}
	/>
{/key}

{#if eligibleForScoring && verseIdx == verses.length}
	<ScoreSubmitForm score={elapsedTime} {round} resetSignal={scoreResetSignal} />
{/if}
<br><br>
<div class="timer">
	Timp: {elapsedTime} secunde
</div>
<br>
<button on:click={reset}>Reset</button>

{#if round}
	<RunHistory
		round={round}
		title={`Istoric pentru ${round}`}
		verseLabels={verseLabels}
		verseWordCounts={verseWordCounts}
		highlightRunId={lastSavedRunId}
	/>
{/if}
