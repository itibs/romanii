<script>
	import { verses } from "/src/data/grupa_verses";
	import WrittenText from "/src/components/WrittenText.svelte";

	const verses2025_2026 = verses['2025-2026'];

	const stages = {
		'Versete 2025-2026.1': {
			description: 'Versetele 1-12',
			first: 0,
			nrVerses: 12
		},
		'Versete 2025-2026.2': {
			description: 'Versetele 13-22',
			first: 12,
			nrVerses: 10
		},
		'Versete 2025-2026.3': {
			description: 'Versetele 23-33',
			first: 22,
			nrVerses: 11
		},
	};
</script>

<a href="/grupa/2025-2026">Înapoi</a>
<br><br>

{#each Object.entries(stages) as [stageName, stage]}
	<h2>{stageName} — {stage.description}</h2>
	<WrittenText
		verses={verses2025_2026
			.slice(stage.first, stage.first + stage.nrVerses)
			.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
				return fullVerse.ref + ' - ' + fullVerse.verse;
			})}
		startIdx={stage.first + 1}
		showVerseNumbers={true}
	/>
	<br>
{/each}

<a href="/grupa/2025-2026">Înapoi</a>