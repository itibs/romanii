<script>
    import VersesInput from '/src/components/VersesInput.svelte';
    import WrittenText from '/src/components/WrittenText.svelte';
    import { shouldRefetchScores } from '/src/stores/scoresStore.js';

    export let bookName;
    export let chapters;
    export let useRollingSumVerseIdx;
    export let competitiveMode = false;
    export let round = '';
    export let competitionResetSignal = 0;

    export let start = {
        chapter: 1,
        verse: 1,
    }

    $: if (bookName !== undefined) {
        resetChapter();
    }

    let rollingSumVerseIdx = 0;
    $: if (useRollingSumVerseIdx) {
        let sum = 0;
        for (let i = 0; i < chapterIdx; i++) {
            sum += chapters[i].length;
        }
        rollingSumVerseIdx = sum;
    }

    export let chapterIdx = start.chapter-1;
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
        if (competitiveMode) {
            startVerseInput = 1;
            start.verse = 1;
        } else if (startVerseInput < 1) {
            start.verse = 1;
        } else if (startVerseInput > crtChapter.length) {
            start.verse = crtChapter.length;
        } else {
            start.verse = startVerseInput;
        }
    }

    const jumpToChapter = (/** @type {number} */ i) => () => {
        chapterIdx = i;
        resetChapter();
    }

    let discoveredVerseText = '';

    let resetVersesInput = () => 0;
    let userName = '';
    let submittedScore = false;
    let eligibleForScoring = false;

    let timerStarted = false;
    let startTime = 0;
    let endTime = null;
    let interval = 0;
    let elapsedTime = 0;

    let previousCompetitionResetSignal = competitionResetSignal;

    $: if (competitionResetSignal !== previousCompetitionResetSignal) {
        previousCompetitionResetSignal = competitionResetSignal;
        resetChapter();
    }

    $: if (!competitiveMode) {
        eligibleForScoring = false;
    }

    $: if (!timerStarted && competitiveMode && discoveredVerseText.length > 0) {
        timerStarted = true;
        startTimer();
    }

    $: if (timerStarted && verseIdx == crtChapter.length) {
        stopTimer();
    }

    function resetChapter() {
        stopTimer();
        elapsedTime = 0;
        endTime = null;
        verseIdx = start.verse - 1;
        discoveredVerseText = '';
        submittedScore = false;
        eligibleForScoring = false;
        timerStarted = false;
        resetVersesInput();
    }

    function startTimer() {
        startTime = new Date().getTime();
        eligibleForScoring = competitiveMode;
        elapsedTime = 0;
        interval = setInterval(() => {
            elapsedTime = (new Date().getTime() - startTime) / 1000;
        }, 100);
    }

    function stopTimer() {
        if (!timerStarted) {
            return;
        }

        endTime = new Date().getTime();
        clearInterval(interval);
        elapsedTime = (endTime - startTime) / 1000;
    }

    /**
	 * @param {number} score
	 * @param {string} name
	 * @param {string} scoreRound
	 */
    async function submitScore(score, name, scoreRound) {
        if (name === '') {
            alert('Numele nu poate fi gol');
            return;
        }

        if (score < 0.01) {
            alert('Timpul nu poate fi 0');
            return;
        }

        const response = await fetch(
            'https://dz5rd0lqnb.execute-api.eu-central-1.amazonaws.com/Prod/scores',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    score,
                    name,
                    round: scoreRound
                })
            }
        );

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const responseData = await response.json();
        submittedScore = true;
        shouldRefetchScores.set(true);

        return responseData;
    }
</script>

<h2>{bookName} - Capitolul {chapterIdx+1}</h2>
<WrittenText startIdx={rollingSumVerseIdx+start.verse} verses={crtChapter.slice(start.verse-1, verseIdx).concat(verseIdx < crtChapter.length ? [discoveredVerseText] : [])}></WrittenText>
<br>
{#key crtVerse}
    <VersesInput inputText={crtVerse} fnVerseDone={() => {verseIdx++; discoveredVerseText = ''}} bind:discoveredText={discoveredVerseText} disableNextButton={competitiveMode} bind:reset={resetVersesInput}></VersesInput>
{/key}
<br>
<br>
<h3>Alege capitolul</h3>
<table>
    <tbody>
        <tr>
        {#each chapters as chapter, i}
            <td>
                <button on:click={jumpToChapter(i)}>
                    {i+1}
                </button>
            </td>
        {/each}
        </tr>
    </tbody>
</table>
{#if !competitiveMode}
    <p>Începând cu versetul <input type=number bind:value={startVerseInput}></p>
{/if}
{#if competitiveMode}
    <div class="timer">
        Timp: {elapsedTime} secunde
    </div>
{/if}
{#if eligibleForScoring && !submittedScore && verseIdx == crtChapter.length}
    <br><br>
    <h3>Trimite scor</h3>
    <label for="userName">Nume:</label>
    <input bind:value={userName} />
    <button on:click={() => submitScore(elapsedTime, userName, round)}>Trimite</button>
{/if}
<button on:click={jumpToChapter(chapterIdx)}>
    Resetează capitolul
</button>