<script>
	import { onMount } from 'svelte';
	import { shouldRefetchScores } from '/src/stores/scoresStore.js';
	import Icon from '../Icon.svelte';

	export let round = 'Runda1';

	/**
	 * @type {string | any[]}
	 */
	let scores = [];

	async function fetchData() {
		const response = await fetch(
			'https://dz5rd0lqnb.execute-api.eu-central-1.amazonaws.com/Prod/scores?round=' + round
		);
		const data = await response.json();
		scores = data['body'].slice(0, 10); // Limit to top 10 scores
	}

	onMount(fetchData);

	// Subscribe to store and refetch scores when the value changes
	shouldRefetchScores.subscribe((/** @type {boolean} */ value) => {
		if (value) {
			fetchData();
			shouldRefetchScores.set(false); // Reset the flag after fetching
		}
	});
</script>

<table class="scoreboard">
	<thead>
		<tr>
			<th colspan="3">Clasament {round}</th>
		</tr>
		<tr>
			<th>Loc</th>
			<th>Nume</th>
			<th>Scor (secunde)</th>
		</tr>
	</thead>
	<tbody>
		{#each scores as score, i}
			<tr>
				<td>#{i + 1}</td>
				<td>
					{#if i == 0}
						<Icon name="gold-medal" />
					{:else if i == 1}
						<Icon name="silver-medal" />
					{:else if i == 2}
						<Icon name="bronze-medal" />
					{/if}
					{score.name}
				</td>
				<td>{score.score}</td>
			</tr>
		{/each}

		{#if scores.length === 0}
			<tr>
				<td colspan="3">Fii primul care adaugă un scor</td>
			</tr>
		{/if}
	</tbody>
</table>

<style>
	.scoreboard {
		border-collapse: collapse;
	}

	.scoreboard th,
	.scoreboard td {
		padding: 5px;
		border: 1px solid #fff;
		text-align: left;
	}
	.scoreboard td:last-child {
		text-align: right;
	}
</style>
