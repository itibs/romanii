<script>
    import ConcursGrupa from '/src/components/ConcursGrupa.svelte';
    import {verses} from '/src/data/grupa_verses';

    let first = 0;
    let nrVerses = 10;
    $: selectedVerses = verses.slice(first, first + nrVerses - 1)
</script>

<h1>Concurs grupa liceenilor</h1>
<label for="input">First</label>
<input type="number" bind:value={first}>
<label for="input">Nr verses</label>
<input type="number" bind:value={nrVerses}>
<ConcursGrupa verses={selectedVerses}/>
