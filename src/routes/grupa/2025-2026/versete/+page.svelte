<script>
	import { verses } from "/src/data/grupa_verses";
	import WrittenText from "/src/components/WrittenText.svelte";

	const verses2025_2026 = verses['2025-2026'];
</script>

<a href="/grupa/2025-2026">Înapoi</a>
<br><br>
<WrittenText
	verses={verses2025_2026
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={false}
/>
<br>

<a href="/grupa/2025-2026">Înapoi</a>