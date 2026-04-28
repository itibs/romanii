<script>
	import VersesInput from '/src/components/VersesInput.svelte';
	import WrittenText from '/src/components/WrittenText.svelte';
	import ScoreSubmitForm from '/src/components/ScoreSubmitForm.svelte';
	import { createStopwatch } from '/src/lib/stopwatch.js';

	export let round;
	export let verses;
    /**
	 * @type {boolean}
	 */
     export let trainingMode;

    let eligibleForScoring = false;
	let scoreResetSignal = 0;

	let resetVersesInput = () => 0;

	const stopwatch = createStopwatch();
	const stopwatchState = stopwatch.state;
	$: timerStarted = $stopwatchState.hasStarted;
	$: elapsedTime = $stopwatchState.elapsedTime;

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

    $: if (!timerStarted && discoveredVerseText.length > 0) {
        if (!trainingMode) {
            eligibleForScoring = true;
        }
        stopwatch.start();
    }

    $: if (timerStarted && verseIdx == verses.length) {
        stopwatch.stop();
    }

    $: if (trainingMode) {
        eligibleForScoring = false;
    }

    function reset() {
        stopwatch.reset();
		scoreResetSignal++;
        verseIdx = 0;
        discoveredVerseText = '';
		eligibleForScoring = false;
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
<br />
{#key crtVerse}
	<VersesInput
		inputText={crtVerse}
		fnVerseDone={() => {
			if (verseIdx < verses.length) {
				verseIdx++;
			}
			discoveredVerseText = '';
		}}
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
