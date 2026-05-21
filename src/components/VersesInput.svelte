<script>
    /**
	 * @type {string}
	 */
    export let inputText;
    export let discoveredText = '';
    export let disableNextButton = false;
    /**
	 * @type {() => void}
	 */
    export let fnVerseDone;
    export const reset = () => {
        wordIdx = 0;
    }

    let nextButtonDisabled = false;

    $: inputWords = inputText.split(' ').filter(x => x.length > 0);

    let wordIdx = 0;
    let crtWord = '';
    $: crtWord = wordIdx < inputWords.length ? inputWords[wordIdx] : '';

    const wordHasLetter = (/** @type {string} */ word) => {
        for (let i = 0; i < word.length; i++) {
            if (word[i].match(/[a-zăâțţșşî]/i)) {
                return true;
            }
        }
        return false;
    };

    const nextWordButtonPressed = () => {
        if (disableNextButton) {
            nextButtonDisabled = true;
            setTimeout(() => {
                nextButtonDisabled = false;
            }, 3000)
        }
        
        nextWord();
    }
    const nextWord = () => {
        do {
            wordIdx++;
            if (wordIdx >= inputWords.length) {
                discoveredText = inputWords.join(' ');
                fnVerseDone();
                return;
            }
        } while (!wordHasLetter(inputWords[wordIdx]));

        discoveredText = inputWords.slice(0, wordIdx).join(' ');
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
        let c = userInput.slice(-1);
        userInput = '';
        
        if (crtWord.length == 0) { return; }

        if (!nextButtonDisabled && c === ' ') {
            nextWordButtonPressed();
        }

        if (!wordHasLetter(crtWord)) {
            nextWord();
            return;
        }

        let i = 0;
        while (i < crtWord.length && !crtWord[i].match(/[a-zăâțţșşî]/i)) {
            i++;
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
<button on:click={nextWordButtonPressed} disabled={nextButtonDisabled}>
    Cuvântul următor
</button>
(Poți apăsa tasta SPACE pentru cuvântul următor)