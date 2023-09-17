<script>
    /**
	 * @type {string[]}
	 */
    export let verses;
    export let startIdx = 1;
    export let showVerseNumbers = true;
</script>

<table>
    {#each verses as verse, i}
        <tr>{#if showVerseNumbers}{i+startIdx}. {/if}{verse}</tr>
    {/each}
</table>