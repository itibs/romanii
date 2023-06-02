<script>
    import WrittenText from '../components/WrittenText.svelte';
    import {chapters} from '../data/verses'

    let start = {
        chapter: 6,
        verse: 1,
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
    $: crtVerseWords = crtVerse.split(' ').filter(x => x.length > 0);

    let wordIdx = 0;
    let crtWord = '';
    $: crtWord = wordIdx < crtVerseWords.length ? crtVerseWords[wordIdx] : '';

    let writtenText = '';
    $: writtenText = crtChapter.slice(0, verseIdx).map((v, i) => (i+1) + ". " + v).join("\n");

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

    const nextWord = () => {
        wordIdx++;
        if (wordIdx >= crtVerseWords.length) {
            wordIdx = 0;
            verseIdx++;
        }
    }

    const nextChapter = () => {
        chapterIdx++;
        verseIdx = 0;
        wordIdx = 0;
    }

    const jumpToChapter = (/** @type {number} */ i) => () => {
        chapterIdx = i;
        verseIdx = start.verse - 1;
        wordIdx = 0;
    }

    let userInput = ''

    const normalizeLetter = (/** @type {string} */ c) => {
        c = c.toLowerCase();
        if ("ăâ".includes(c)) {
            c = "a";
        }
        if ("țţ".includes(c)) {
            c = "t";
        }
        if ("șş".includes(c)) {
            c = "s";
        }
        if (c == "î") {
            c = "i";
        }
        return c;
    }

    const checkInput = () => {
        if (userInput.length == 0) { return; }
        let c = userInput[0];
        userInput = userInput.substring(1);

        let i = 0;
        while (i < crtWord.length && !crtWord[i].match(/[a-zăâțţșşî]/i)) {
            i++;
        }
        if (i == crtWord.length) {
            nextWord();
        }

        let normalizedActual = normalizeLetter(c)
        let normalizedExpected = normalizeLetter(crtWord[i])
        if (normalizedActual == normalizedExpected) {
            nextWord();
        }
    }
</script>

<h1>Romanii</h1>
<h2>Capitolul {chapterIdx+1}</h2>
<WrittenText startIdx={start.verse} verses={crtChapter.slice(start.verse-1, verseIdx).concat(verseIdx < crtChapter.length ? [crtVerseWords.slice(0, wordIdx).join(' ')] : [])}></WrittenText>
<br>
<input bind:value={userInput} on:input={checkInput}>
<br><br>
<button on:click={nextWord}>
    Cuvântul următor
</button>
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
<p>Începând cu versetul <input type=number bind:value={startVerseInput} style="width: 50pt"></p>
<button on:click={jumpToChapter(chapterIdx)}>
    Resetează capitolul
</button>