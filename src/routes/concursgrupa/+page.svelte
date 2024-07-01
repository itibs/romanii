<script>
	// @ts-nocheck

	import ScoreBoard from '/src/components/concursgrupa/ScoreBoard.svelte';
	import ConcursGrupa from '/src/components/concursgrupa/ConcursGrupa.svelte';
	import { verses } from '/src/data/grupa_verses';

    let trainingMode = false;

	let stages = {
		'Stagiul 1': {
			description: 'Versetele 1-13',
			first: 0,
			nrVerses: 13
		},
		'Stagiul 2': {
			description: 'Versetele 14-26',
			first: 13,
			nrVerses: 13
		},
		'Stagiul 3': {
			description: 'Versetele 27-39',
			first: 26,
			nrVerses: 13
		},
		'Stagiul 4': {
			description: 'Versetele 40-51',
			first: 39,
			nrVerses: 13
		},
		'Stagiul suprem': {
			description: 'Versetele 1-51',
			first: 0,
			nrVerses: 51
		}
	};

	let selectedStage = Object.keys(stages)[0];

	$: selectedVerses = verses.slice(
		stages[selectedStage].first,
		stages[selectedStage].first + stages[selectedStage].nrVerses
	);

	function handleSelect(event) {
		selectedStage = event.target.value;
		selectedVerses = verses.slice(
			stages[selectedStage].first,
			stages[selectedStage].first + stages[selectedStage].nrVerses
		);
	}
</script>

<h1>Concurs grupa liceenilor</h1>
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
În modul antrenament poți folosi Cuvântul următor de câte ori vrei.<br>
De asemenea, poți trece la următorul cuvânt doar apăsând tasta 'Space'<br>
{#if trainingMode}
    <div style='color: red'>Atenție! Nu poți trimite scorul decât dacă ai început să scrii fără mod antrenament activat și nu l-ai activat pe parcurs!</div>
{/if}

<ConcursGrupa verses={selectedVerses} round={selectedStage} trainingMode={trainingMode} />

<br><br>
<a href="/concursgrupa/versete">Vezi toate versetele</a>

<style>
	.scoreboards td {
		vertical-align: top;
	}
</style>
