<script>
    /**
	 * @type {string[]}
	 */
    export let verses;
    export let startIdx = 1;
    export let showVerseNumbers = true;
    /** When set, shown instead of the sequential index (e.g. "3:22"). */
    export let labels = /** @type {string[] | null} */ (null);
</script>

<table>
    <tbody>
        {#each verses as verse, i}
            <tr><td>{#if showVerseNumbers}{labels && labels[i] ? labels[i] : i + startIdx}.&nbsp;{/if}{verse}</td></tr>
        {/each}
    </tbody>
</table>