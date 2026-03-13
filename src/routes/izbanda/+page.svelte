<script>
    import SequentialTraining from '/src/components/SequentialTraining.svelte';
    import {chapters} from '/src/data/verses_izbanda';

    let bookName = 'Iacov'
    let start = {
        chapter: 1,
        verse: 1
    }
    let bookEntries = Object.entries(chapters)
</script>

<h1>Izbanda</h1>
<label for="books">Cartea:</label>
<select bind:value={bookName}>
    {#each bookEntries as [name, chapter]}
        <option value={name}>{name}</option>
    {/each}
</select>
<SequentialTraining bookName={bookName} chapters={chapters[bookName]} start={start}/>
<br><br>
<a href="/randomverses">Versete aleatoare</a>
