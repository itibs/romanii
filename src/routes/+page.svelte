<script>
    import SequentialTraining from '/src/components/SequentialTraining.svelte';
    import ScoreBoard from '/src/components/concursgrupa/ScoreBoard.svelte';
    import {chapters} from '/src/data/verses';

    let bookName = 'Evrei'
    let start = {
        chapter: 6,
        verse: 1
    }
    let bookEntries = Object.entries(chapters)

    let competitiveMode = false;
    let exitedCompetitiveMode = false;
    let competitionResetSignal = 0;
    let chapterIdx = start.chapter - 1;
    let hasChapterProgress = false;

    $: selectedRound = `homepage:${bookName}:${chapterIdx + 1}`;
    $: selectedChapterTitle = `${bookName} ${chapterIdx + 1}`;

    function handleCompetitiveModeChange() {
        if (competitiveMode) {
            if (
                exitedCompetitiveMode &&
                hasChapterProgress &&
                !confirm('Progresul se va reseta deoarece modul competitiv poate începe doar de la versetul 1. Continui?')
            ) {
                competitiveMode = false;
                return;
            }

            start.verse = 1;
            competitionResetSignal += 1;
            return;
        }

        exitedCompetitiveMode = true;
    }
</script>

<h1>Romanii</h1>
<label for="books">Cartea:</label>
<select bind:value={bookName}>
    {#each bookEntries as [name, chapter]}
        <option value={name}>{name}</option>
    {/each}
</select>
<br><br>
<label for="competitiveMode" style="font-weight: bold">Mod competitiv:</label>
<input id="competitiveMode" type="checkbox" bind:checked={competitiveMode} on:change={handleCompetitiveModeChange} />
<br>
{#if competitiveMode}
    <p>Modul competitiv începe întotdeauna de la versetul 1 și permite trimiterea scorului la finalul capitolului.</p>
    <ScoreBoard round={selectedRound} title={`Clasament ${selectedChapterTitle}`} />
{/if}
<SequentialTraining
    bookName={bookName}
    chapters={chapters[bookName]}
    start={start}
    bind:chapterIdx
    bind:hasProgress={hasChapterProgress}
    competitiveMode={competitiveMode}
    competitionResetSignal={competitionResetSignal}
    round={selectedRound}
/>
<br><br>
<a href="/randomverses">Versete aleatoare</a>
