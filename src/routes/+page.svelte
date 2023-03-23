<script>
    import WrittenText from '../components/WrittenText.svelte';
import {chapters} from '../data/verses'

    let start = {
        chapter: 0,
        verse: 0,
    }

    let end = {
        chapter: 4,
        verse: 25,
    }

    let chapterIdx = 0;
    /**
	 * @type {string[]}
	 */
    let crtChapter = [];
    $: crtChapter = chapterIdx < chapters.length ? chapters[chapterIdx] : [];

    let verseIdx = 0;
    let crtVerse = '';
    $: crtVerse = verseIdx < crtChapter.length ? crtChapter[verseIdx] : '';
    $: crtVerseWords = crtVerse.split(' ').filter(x => x.length > 0);

    let wordIdx = 0;
    let crtWord = '';
    $: crtWord = wordIdx < crtVerseWords.length ? crtVerseWords[wordIdx] : '';

    let writtenText = '';
    $: writtenText = crtChapter.slice(0, verseIdx).map((v, i) => (i+1) + ". " + v).join("\n");

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

    let userInput = ''

    const normalizeLetter = (/** @type {string} */ c) => {
        c = c.toLowerCase();
        if ("ăâ".includes(c)) {
            c = "a";
        }
        if (c == "țţ") {
            c = "t";
        }
        if (c == "șşşş") {
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

        let normalizedActual = normalizeLetter(c)
        let normalizedExpected = normalizeLetter(crtWord[0])
        if (normalizedActual == normalizedExpected) {
            nextWord();
        }
    }
</script>

<h1>Romanii</h1>
<WrittenText verses={crtChapter}></WrittenText>
<p>{writtenText}</p>
<p>Current verse: {crtVerse}</p>
<p>Current word: {crtWord}</p>
<button on:click={nextWord}>
    Next Word
</button>
<button on:click={nextChapter}>
    Next Chapter
</button>
<input bind:value={userInput} on:input={checkInput}>