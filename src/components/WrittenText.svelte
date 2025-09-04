<script>
    /**
	 * @type {string[]}
	 */
    export let verses;
    export let startIdx = 1;
    export let showVerseNumbers = true;
</script>

<table>
    <tbody>
        {#each verses as verse, i}
            <tr><td>{#if showVerseNumbers}{i+startIdx}.&nbsp;{/if}{verse}</td></tr>
        {/each}
    </tbody>
</table>