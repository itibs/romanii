<script>
    import VersesInput from '/src/components/VersesInput.svelte';
    import WrittenText from '/src/components/WrittenText.svelte';

    export let bookName;
    export let chapters;

    export let start = {
        chapter: 1,
        verse: 1,
    }

    $: if (bookName !== undefined) {
        discoveredVerseText = ''
    }

    let chapterIdx = start.chapter-1;
    /**
     * @type {string[]}
     */
    let crtChapter = [];
    $: crtChapter = chapterIdx < chapters.length ? chapters[chapterIdx] : [];

    $: verseIdx = start.verse-1;
    $: if (verseIdx < 0) {
        verseIdx = 0;
    }

    let crtVerse = '';
    $: crtVerse = verseIdx < crtChapter.length ? crtChapter[verseIdx] : '';

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
        chapterIdx = i;
        verseIdx = start.verse - 1;
        discoveredVerseText = '';
    }

    let discoveredVerseText = '';
</script>

<h2>{bookName} - Capitolul {chapterIdx+1}</h2>
<WrittenText startIdx={start.verse} verses={crtChapter.slice(start.verse-1, verseIdx).concat(verseIdx < crtChapter.length ? [discoveredVerseText] : [])}></WrittenText>
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
<p>Începând cu versetul <input type=number bind:value={startVerseInput}></p>
<button on:click={jumpToChapter(chapterIdx)}>
    Resetează capitolul
</button>