<script>
    import RandomTraining from '/src/components/RandomTraining.svelte';
    import {chapters} from '/src/data/verses';

    let bookName = '1 Ioan'
    let start = {
        chapter: 1,
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
<RandomTraining bookName={bookName} chapters={chapters[bookName]} start={start}/>
<br><br>
<a href="/">Pagina principală</a>
