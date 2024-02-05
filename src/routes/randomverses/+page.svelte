<script>
    import VersesInput from '/src/components/VersesInput.svelte';
    import WrittenText from '/src/components/WrittenText.svelte';
    import {chapters} from '/src/data/verses';

    /**
	 * @param {any[]} arr
	 */
    function shuffle(arr) {
        var len = arr.length;
        var d = len;
        var array = [];
        var k, i;
        for (i = 0; i < d; i++) {
            k = Math.floor(Math.random() * len);
            array.push(arr[k]);
            arr.splice(k, 1);
            len = arr.length;
        }
        for (i = 0; i < d; i++) {
            arr[i] = array[i];
        }
        return arr;
    }

    let start = {
        chapter: 14,
        verse: 1,
    }

    let chapterIdx = start.chapter-1;
    /**
	 * @type {string[]}
	 */
    $: crtChapter = chapterIdx < chapters.length ? chapters[chapterIdx] : [];

    $: chapterVerses = crtChapter.map((val, idx) => {return {verse: val, idx: idx+1}});
    $: randomizedVerses = shuffle(chapterVerses)

    $: verseIdx = start.verse-1;
    $: if (verseIdx < 0) {
        verseIdx = 0;
    }

    let crtVerse = '';
    $: crtVerse = verseIdx < crtChapter.length ? randomizedVerses[verseIdx].verse : '';

    let writtenText = '';
    $: writtenText = discoveredVerseText;

    let startVerseInput = start.verse;
    $: {
        if (startVerseInput < 1) {
            start.verse = 1;
        } else if (startVerseInput > crtChapter.length) {
            start.verse = crtChapter.length;
        } else {
            start.verse = startVerseInput;
        }
    }

    const jumpToChapter = (/** @type {number} */ i) => () => {
        if (i === chapterIdx) {
            randomizedVerses = shuffle(chapterVerses);
        } else {
            chapterIdx = i;
        }
        verseIdx = start.verse - 1;
        discoveredVerseText = '';
    }

    let discoveredVerseText = '';
</script>

<h1>Romanii - versete aleatoare</h1>
<WrittenText verses={randomizedVerses.slice(start.verse-1, verseIdx).map((/** @type {{ idx: string; verse: string; }} */ fullVerse) => {return fullVerse.idx + '. ' + fullVerse.verse})} showVerseNumbers={false} style="color: grey"></WrittenText>
{#if randomizedVerses[verseIdx]}
<h2>Romani {chapterIdx+1}:{randomizedVerses[verseIdx].idx}</h2>
{/if}
<WrittenText startIdx={start.verse} verses={[discoveredVerseText]} showVerseNumbers={false}></WrittenText>
<br>
{#key crtVerse}
    <VersesInput inputText={crtVerse} fnVerseDone={() => {verseIdx++; discoveredVerseText = ''}} bind:discoveredText={discoveredVerseText}></VersesInput>
{/key}
<br>
<br>
<h3>Alege capitolul</h3>
<table>
    <tr>
    {#each chapters as chapter, i}
        <td>
            <button on:click={jumpToChapter(i)}>
                {i+1}
            </button>
        </td>
    {/each}
    </tr>
</table>
<br>
<br>
<button on:click={jumpToChapter(chapterIdx)}>
    Resetează capitolul
</button>
<br><br>
<a href="/">Pagina principală</a>
