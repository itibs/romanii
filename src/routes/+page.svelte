<script>
    import SequentialTraining from '/src/components/SequentialTraining.svelte';
    import {chapters} from '/src/data/verses';

    let bookName = '1 Ioan'
    let start = {
        chapter: 5,
        verse: 1
    }
    let bookEntries = Object.entries(chapters)
</script>

<h1>Romanii</h1>
<label for="books">Cartea:</label>
<select bind:value={bookName}>
    {#each bookEntries as [name, chapter]}
        <option value={name}>{name}</option>
    {/each}
</select>
<SequentialTraining bookName={bookName} chapters={chapters[bookName]} start={start}/>
<br><br>
<a href="/randomverses">Versete aleatoare</a>
