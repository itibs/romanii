<script>
	import { submitScore } from '/src/lib/scoreApi.js';

	/** @type {number} */
	export let score;
	/** @type {string} */
	export let round;
	export let resetSignal = 0;

	let userName = '';
	let submitted = false;
	let previousResetSignal = resetSignal;

	$: if (resetSignal !== previousResetSignal) {
		previousResetSignal = resetSignal;
		submitted = false;
	}

	async function handleSubmit() {
		const response = await submitScore(score, userName, round);
		if (response !== undefined) {
			submitted = true;
		}
	}
</script>

{#if !submitted}
	<br /><br />
	<h3>Trimite scor</h3>
	<label for="userName">Nume:</label>
	<input bind:value={userName} />
	<button on:click={handleSubmit}>Trimite</button>
{/if}
