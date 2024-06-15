<script>
    import VersesInput from '/src/components/VersesInput.svelte';
    import WrittenText from '/src/components/WrittenText.svelte';

    export let verses;

    let verseIdx = 0;
    $: if (verses) {
        verseIdx = 0;
    }
    $: if (verseIdx < 0) {
        verseIdx = 0;
    }

    let crtVerse = '';
    $: crtVerse = verseIdx < verses.length ? verses[verseIdx].verse : '';

    let writtenText = '';
    $: writtenText = discoveredVerseText;

    let discoveredVerseText = '';
</script>

<WrittenText verses={verses.slice(0, verseIdx).map((/** @type {{ ref: string; verse: string; }} */ fullVerse) => {return fullVerse.ref + ' - ' + fullVerse.verse})} showVerseNumbers={true} style="color: grey"></WrittenText>
{#if verses[verseIdx]}
<h2>{verseIdx+1}. {verses[verseIdx].ref}</h2>
{/if}
<WrittenText startIdx=0 verses={[discoveredVerseText]} showVerseNumbers={false}></WrittenText>
<br>
{#key crtVerse}
    <VersesInput inputText={crtVerse} fnVerseDone={() => {verseIdx++; discoveredVerseText = ''}} bind:discoveredText={discoveredVerseText} disableNextButton=true></VersesInput>
{/key}
