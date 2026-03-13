<script>
    import SequentialTraining from '/src/components/SequentialTraining.svelte';
    import { verses } from '/src/data/ps119';

    let bookName = 'Psalmul 119'
    let start = {
        chapter: 1,
        verse: 1
    }
</script>

<h1>Romanii</h1>
<SequentialTraining bookName={bookName} chapters={verses} start={start} useRollingSumVerseIdx={true}/>
<br>
