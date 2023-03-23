<script>
    /**
	 * @type {string[]}
	 */
    export let verses;
    export let startIdx = 1;
</script>

<table>
    {#each verses as verse, i}
        <tr>{i+startIdx}. {verse}</tr>
    {/each}
</table>