<script>
    import { onMount } from 'svelte';
    import { applyControlFontSize } from '/src/lib/inputZoom.js';

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
    /** Called when the user types or asks for the next word. */
    export let onActivity = () => {};
    export const reset = () => {
        wordIdx = 0;
    }

    // Set before the field is focused, so the first tap does not zoom.
    applyControlFontSize(true);

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

    const nextWordButtonPressed = (skipActivity = false) => {
        if (skipActivity !== true) {
            onActivity();
        }
        if (disableNextButton) {
            nextButtonDisabled = true;
            setTimeout(() => {
                nextButtonDisabled = false;
            }, 3000)
        }
        
        nextWord();
        // The click moved focus onto the button. Put it back on the capture
        // field so the next key still types, without scrolling the verse away.
        field?.focus({ preventScroll: true });
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
        onActivity();
        
        if (crtWord.length == 0) { return; }

        if (!nextButtonDisabled && c === ' ') {
            nextWordButtonPressed(true);
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

    /** @type {HTMLInputElement | undefined} */
    let field;

    const keepFieldInView = () => {
        if (!field) return;
        const visibleBottom = (window.visualViewport?.height ?? window.innerHeight) - 12;
        const overflow = field.getBoundingClientRect().bottom - visibleBottom;
        if (overflow > 0) {
            window.scrollBy(0, overflow);
        }
    };

    const onFocus = () => {
        requestAnimationFrame(() => {
            keepFieldInView();
            requestAnimationFrame(keepFieldInView);
        });
    };

    /** @param {KeyboardEvent} event */
    const onWindowKeyDown = (event) => {
        if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
        const target = event.target;
        if (target instanceof HTMLElement && target.closest('a, input, textarea, select, [contenteditable="true"]')) {
            return;
        }
        if (target instanceof HTMLElement && target.closest('button') && (event.key === ' ' || event.key === 'Enter')) {
            return;
        }
        if (event.key !== ' ' && event.key.length !== 1) return;
        event.preventDefault();
        userInput = event.key;
        checkInput();
        field?.focus({ preventScroll: true });
    };

    onMount(() => {
        applyControlFontSize(true);
        const active = document.activeElement;
        if (!active || active === document.body || active === document.documentElement) {
            field?.focus({ preventScroll: true });
        }

        const onResize = () => {
            if (document.activeElement === field) keepFieldInView();
        };
        window.visualViewport?.addEventListener('resize', onResize);
        window.addEventListener('keydown', onWindowKeyDown);
        return () => {
            window.visualViewport?.removeEventListener('resize', onResize);
            window.removeEventListener('keydown', onWindowKeyDown);
        };
    });
</script>

<input
    bind:this={field}
    class="key-capture"
    bind:value={userInput}
    on:input={checkInput}
    on:focus={onFocus}
    autocomplete="off"
    autocapitalize="none"
    autocorrect="off"
    spellcheck="false"
    aria-label="Prima literă a cuvântului"
>
<br><br>
<button on:click={nextWordButtonPressed} disabled={nextButtonDisabled}>
    Cuvântul următor
</button>
(Poți apăsa tasta SPACE pentru cuvântul următor)

<style>
    /*
      Full width and at least 16px, so iOS and Android desktop-site mode
      have nothing small to zoom into. The typed letter is cleared at once;
      the verse above is what has to stay on screen.
    */
    .key-capture {
        box-sizing: border-box;
        width: 12rem;
        max-width: 100%;
        padding: 0.5rem 0.65rem;
        font-size: var(--control-font-size, 16px);
        line-height: 1.3;
        scroll-margin-top: 8rem;
        scroll-margin-bottom: 35vh;
    }

    @media (pointer: coarse) {
        .key-capture {
            display: block;
            width: 100%;
        }
    }

    :global(html[data-overview-layout]) .key-capture {
        display: block;
        width: 100%;
    }
</style>