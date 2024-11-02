<script>
	import { verses } from "/src/data/grupa_verses";
	import WrittenText from "/src/components/WrittenText.svelte";

	const verses2023 = verses['2023']
</script>

<a href="/concursgrupa">Înapoi</a>
<br>
<h2>Stagiul 1</h2>
<br>
<WrittenText
	verses={verses2023
		.slice(0, 13)
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={false}
/>

<h2>Stagiul 2</h2>
<WrittenText
	verses={verses2023
		.slice(13, 26)
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={false}
/>

<h2>Stagiul 3</h2>
<WrittenText
	verses={verses2023
		.slice(26, 39)
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={false}
/>

<h2>Stagiul 4</h2>
<WrittenText
	verses={verses2023
		.slice(39, 51)
		.map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {
			return fullVerse.ref + ' - ' + fullVerse.verse;
		})}
	showVerseNumbers={false}
/>
<br><br>
<a href="/concursgrupa">Înapoi</a>