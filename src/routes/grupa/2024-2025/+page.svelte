<script>
	// @ts-nocheck

	import ScoreBoard from '/src/components/concursgrupa/ScoreBoard.svelte';
	import ConcursGrupa from '/src/components/concursgrupa/ConcursGrupa.svelte';
	import { verses } from '/src/data/grupa_verses';

	const verses2024_2025 = verses['2024-2025'];

    let trainingMode = false;

	let stages = {
		'Versete 2024-2025.1': {
			description: 'Versetele 1-10',
			first: 0,
			nrVerses: 10
		},
		'Versete 2024-2025.2': {
			description: 'Versetele 11-20',
			first: 10,
			nrVerses: 10
		},
		'Versete 2024-2025.3': {
			description: 'Versetele 21-31',
			first: 20,
			nrVerses: 11
		},
	};

	let selectedStage = Object.keys(stages)[2];

	$: selectedVerses = verses2024_2025.slice(
		stages[selectedStage].first,
		stages[selectedStage].first + stages[selectedStage].nrVerses
	);

	function handleSelect(event) {
		selectedStage = event.target.value;
		selectedVerses = verses2024_2025.slice(
			stages[selectedStage].first,
			stages[selectedStage].first + stages[selectedStage].nrVerses
		);
	}
</script>

<h1>Training grounds grupa liceenilor</h1>
<table class="scoreboards">
	<tr>
		{#each Object.entries(stages) as stage}
			<td>
				<ScoreBoard round={stage[0]} />
			</td>
			<td>&nbsp;&nbsp;&nbsp;&nbsp;</td>
		{/each}
	</tr>
</table>

<h2>Selectează stagiul</h2>
<select class="dropdown" on:change={handleSelect}>
	{#each Object.keys(stages) as stage}
		<option value={stage} selected={stage === selectedStage}>{stage} ({stages[stage].description})</option>
	{/each}
</select>
<br><br>
<label for="trainingMode" style="font-weight: bold">Mod antrenament:</label>
<input type="checkbox" bind:checked={trainingMode} /><br>
În modul antrenament poți folosi Cuvântul următor de câte ori vrei. Altfel, după fiecare folosire redevine disponibil după 3 secunde.<br>
{#if trainingMode}
    <div style='color: red'>Atenție! Nu poți trimite scorul decât dacă ai început să scrii fără mod antrenament activat și nu l-ai activat pe parcurs!</div>
{/if}

<ConcursGrupa verses={selectedVerses} round={selectedStage} trainingMode={trainingMode} />

<br><br>
<a href="/grupa/2024-2025/versete">Vezi toate versetele</a>

<style>
	.scoreboards td {
		vertical-align: top;
	}
</style>
