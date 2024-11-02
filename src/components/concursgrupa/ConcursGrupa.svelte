<script>
	import VersesInput from '/src/components/VersesInput.svelte';
	import WrittenText from '/src/components/WrittenText.svelte';
	import { shouldRefetchScores } from '/src/stores/scoresStore.js';

	export let round;
	export let verses;
    /**
	 * @type {boolean}
	 */
     export let trainingMode;

	let userName = '';
	let submittedScore = false;
    let eligibleForScoring = false;

	let resetVersesInput = () => 0;

	// countdown vars
    let timerStarted = false;
	/**
	 * @type {number}
	 */
	let startTime = 0;
	let endTime = null;
	let interval = 0;
	let elapsedTime = 0;

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
        timerStarted = true;
        startTimer();
    }

    $: if (timerStarted && verseIdx == verses.length) {
        stopTimer();
    }

    $: if (trainingMode) {
        eligibleForScoring = false;
    }

	/**
	 * @param {number} score
	 * @param {string} name
	 * @param {string} round
	 */
	async function submitScore(score, name, round) {
		if (name === '') {
			alert('Numele nu poate fi gol');
			return;
		}
        if (score < 0.01) {
            alert('Timpul nu poate fi 0')
            return;
        }
		const data = {
			score,
			name,
			round
		};

		const response = await fetch(
			'https://dz5rd0lqnb.execute-api.eu-central-1.amazonaws.com/Prod/scores',
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(data)
			}
		);

		if (!response.ok) {
			throw new Error(`API request failed with status ${response.status}`);
		}

		const responseData = await response.json();
		submittedScore = true;

		// Indicate that scores need to be refetched
		shouldRefetchScores.set(true);

		return responseData; // Handle successful response and return data if needed
	}

	function startTimer() {
		startTime = new Date().getTime();
        if (!trainingMode) {
            eligibleForScoring = true;
        }
		elapsedTime = 0;
		interval = setInterval(() => {
			elapsedTime = (new Date().getTime() - startTime) / 1000;
		}, 100);
	}

	function stopTimer() {
		endTime = new Date().getTime();
		clearInterval(interval);
		elapsedTime = (endTime - startTime) / 1000;
	}

    function reset() {
        stopTimer();
        elapsedTime = 0;
        verseIdx = 0;
        discoveredVerseText = '';
        submittedScore = false;
        timerStarted = false;
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

{#if eligibleForScoring && !submittedScore && verseIdx == verses.length}
	<br /><br />
    <h3>Trimite scor</h3>
    <label for="userName">Nume:</label>
	<input bind:value={userName} />
	<button on:click={() => submitScore(elapsedTime, userName, round)}>Trimite</button>
{/if}
<br><br>
<div class="timer">
	Timp: {elapsedTime} secunde
</div>
<br>
<button on:click={reset}>Reset</button>
