<script>
    /**
	 * @type {string}
	 */
     export let inputText;
    export let discoveredText = '';
    /**
	 * @type {() => void}
	 */
     export let fnVerseDone;

    $: inputWords = inputText.split(' ').filter(x => x.length > 0);

    let wordIdx = 0;
    let crtWord = '';
    $: crtWord = wordIdx < inputWords.length ? inputWords[wordIdx] : '';

    const nextWord = () => {
        wordIdx++;
        discoveredText = inputWords.slice(0, wordIdx).join(' ')
        if (wordIdx >= inputWords.length) {
            wordIdx = 0;
            fnVerseDone();
        }
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
        
        if (c === ' ') {
            nextWord();
        }

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

<input bind:value={userInput} on:input={checkInput} autofocus>
<br><br>
<button on:click={nextWord}>
    Cuvântul următor
</button>