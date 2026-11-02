<script>
	import { verses } from "/src/data/grupa_verses";
	import WrittenText from "/src/components/WrittenText.svelte";

	const verses2026_2027 = verses['2026-2027'];

	const stages = {
		'Versete 2026-2027.1': {
			description: 'Versetele 1-10',
			first: 0,
			nrVerses: 10
		},
	};
</script>

<a href="/grupa/2026-2027">Înapoi</a>
<br><br>

{#each Object.entries(stages) as [stageName, stage]}
	<h2>{stageName} — {stage.description}</h2>
	<WrittenText
		verses={verses2026_2027
			.slice(stage.first, stage.first + stage.nrVerses)
			.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
				return fullVerse.ref + ' - ' + fullVerse.verse;
			})}
		startIdx={stage.first + 1}
		showVerseNumbers={true}
	/>
	<br>
{/each}

<a href="/grupa/2026-2027">Înapoi</a>
