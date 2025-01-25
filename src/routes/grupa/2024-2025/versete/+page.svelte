<script>
	import { verses } from "/src/data/grupa_verses";
	import WrittenText from "/src/components/WrittenText.svelte";

	const verses2024_2025 = verses['2024-2025'];
</script>

<a href="/grupa/2024-2025">Înapoi</a>
<br><br>
<WrittenText
	verses={verses2024_2025
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={false}
/>
<br>

<a href="/grupa/2024-2025">Înapoi</a>