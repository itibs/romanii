<script>
    // @ts-nocheck
    import { runHistoryStore, deleteRun, clearRound, formatTimestamp } from '/src/lib/runHistory.js';
    import PerVerseChart from '/src/components/charts/PerVerseChart.svelte';
    import TotalTimeChart from '/src/components/charts/TotalTimeChart.svelte';

    export let round = '';
    export let title = 'Istoric încercări';
    /** @type {string[]} */
    export let verseLabels = [];
    /** Optional latest run id to auto-highlight after a finish. */
    export let highlightRunId = '';

    let expanded = false;
    /** @type {Set<string>} */
    let selectedIds = new Set();

    const palette = [
        '#e15759', '#4e79a7', '#f28e2b', '#76b7b2',
        '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
        '#9c755f', '#bab0ac'
    ];

    $: allRuns = (($runHistoryStore || {})[round] || [])
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp);

    // Auto-select latest run + any newly-finished run
    let lastSelectedSignature = '';
    $: {
        const signature = allRuns.map((r) => r.id).join('|');
        if (signature !== lastSelectedSignature) {
            lastSelectedSignature = signature;
            const next = new Set(selectedIds);
            // Keep selections that still exist
            for (const id of [...next]) {
                if (!allRuns.find((r) => r.id === id)) next.delete(id);
            }
            // Always include latest run if any
            if (allRuns[0]) next.add(allRuns[0].id);
            // Include newly-finished run if provided
            if (highlightRunId && allRuns.find((r) => r.id === highlightRunId)) {
                next.add(highlightRunId);
            }
            selectedIds = next;
        }
    }

    // Auto-expand panel when a run is just saved
    let prevHighlight = '';
    $: if (highlightRunId && highlightRunId !== prevHighlight) {
        prevHighlight = highlightRunId;
        expanded = true;
    }

    // Build the ordered list of runs to chart. Latest selected run (by timestamp)
    // is first so PerVerseChart can render it as the highlighted/bar series.
    $: chartedRuns = (() => {
        const picked = allRuns.filter((r) => selectedIds.has(r.id));
        return picked; // already sorted desc by timestamp
    })();

    function toggleSelected(id) {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        selectedIds = next;
    }

    function selectOnly(id) {
        selectedIds = new Set([id]);
    }

    function compareLatestVsRun(id) {
        if (!allRuns[0]) return;
        selectedIds = new Set([allRuns[0].id, id]);
    }

    function onDelete(id) {
        if (!confirm('Sigur vrei să ștergi această încercare?')) return;
        deleteRun(round, id);
    }

    function onClearAll() {
        if (!confirm('Sigur vrei să ștergi tot istoricul pentru această rundă?')) return;
        clearRound(round);
        selectedIds = new Set();
    }

    function colorFor(id) {
        const idx = chartedRuns.findIndex((r) => r.id === id);
        if (idx < 0) return '#999';
        return palette[idx % palette.length];
    }

    function formatDelta(run) {
        if (!run || !allRuns[0] || allRuns[0].id === run.id) return '';
        const diff = run.totalTime - allRuns[0].totalTime;
        const sign = diff > 0 ? '+' : '';
        return `(${sign}${diff.toFixed(2)}s vs ultimul)`;
    }
</script>

{#if allRuns.length > 0}
    <div class="run-history">
        <button class="header-button" on:click={() => (expanded = !expanded)}>
            <span class="caret">{expanded ? '▾' : '▸'}</span>
            <strong>{title}</strong>
            <span class="count">({allRuns.length})</span>
        </button>

        {#if expanded}
            <div class="panel">
                <h4>Timp pe verset</h4>
                <p class="hint">
                    Bara roșie reprezintă ultima încercare. Bifează încercări din listă pentru a le compara.
                </p>
                <PerVerseChart runs={chartedRuns} verseLabels={verseLabels} />

                {#if allRuns.length > 1}
                    <h4>Evoluția timpului total</h4>
                    <TotalTimeChart runs={allRuns} highlightId={allRuns[0].id} />
                {/if}

                <h4>Încercări precedente</h4>
                <table class="runs-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th>Data</th>
                            <th>Total (s)</th>
                            <th>Δ</th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each allRuns as run, i (run.id)}
                            <tr class:latest={i === 0}>
                                <td>
                                    <label class="legend-cell">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(run.id)}
                                            on:change={() => toggleSelected(run.id)}
                                        />
                                        {#if selectedIds.has(run.id)}
                                            <span class="swatch" style="background: {colorFor(run.id)}"></span>
                                        {/if}
                                    </label>
                                </td>
                                <td>{formatTimestamp(run.timestamp)}{i === 0 ? ' (ultima)' : ''}</td>
                                <td class="num">{run.totalTime.toFixed(2)}</td>
                                <td class="delta">{formatDelta(run)}</td>
                                <td>
                                    {#if i !== 0}
                                        <button class="small" on:click={() => compareLatestVsRun(run.id)}>
                                            Compară cu ultima
                                        </button>
                                    {:else}
                                        <button class="small" on:click={() => selectOnly(run.id)}>
                                            Doar ultima
                                        </button>
                                    {/if}
                                </td>
                                <td>
                                    <button class="small danger" on:click={() => onDelete(run.id)}>
                                        Șterge
                                    </button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>

                <div class="footer-actions">
                    <button class="small danger" on:click={onClearAll}>
                        Șterge tot istoricul
                    </button>
                    <span class="hint">Istoricul este salvat local în acest browser.</span>
                </div>
            </div>
        {/if}
    </div>
{/if}

<style>
    .run-history {
        margin: 12px 0;
        max-width: 780px;
    }
    .header-button {
        background: none;
        border: 1px solid #c0c0c0;
        padding: 6px 10px;
        cursor: pointer;
        text-align: left;
        border-radius: 4px;
    }
    .caret {
        display: inline-block;
        width: 1em;
    }
    .count {
        color: #888;
        margin-left: 6px;
    }
    .panel {
        margin-top: 10px;
        padding: 10px 12px;
        border: 1px solid #d8d8d8;
        border-radius: 6px;
    }
    .panel h4 {
        margin: 14px 0 6px;
    }
    .panel h4:first-child {
        margin-top: 0;
    }
    .hint {
        color: #666;
        font-size: 0.9em;
        margin: 0 0 8px;
    }
    .runs-table {
        border-collapse: collapse;
        width: 100%;
        font-size: 0.95em;
    }
    .runs-table th,
    .runs-table td {
        padding: 4px 8px;
        border-bottom: 1px solid #e5e5e5;
        text-align: left;
    }
    .runs-table td.num {
        text-align: right;
        font-variant-numeric: tabular-nums;
    }
    .runs-table td.delta {
        color: #666;
        font-size: 0.9em;
    }
    .runs-table tr.latest td {
        background: rgba(225, 87, 89, 0.06);
        font-weight: bold;
    }
    .legend-cell {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }
    .swatch {
        display: inline-block;
        width: 12px;
        height: 12px;
        border-radius: 2px;
        border: 1px solid rgba(0, 0, 0, 0.15);
    }
    button.small {
        font-size: 0.85em;
        padding: 2px 8px;
    }
    button.danger {
        color: #b3261e;
    }
    .footer-actions {
        margin-top: 10px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
    }
    :global(body.dark-mode) .header-button {
        border-color: #3a4c61;
    }
    :global(body.dark-mode) .panel {
        border-color: #3a4c61;
    }
    :global(body.dark-mode) .runs-table th,
    :global(body.dark-mode) .runs-table td {
        border-bottom-color: #2c3a4a;
    }
    :global(body.dark-mode) .runs-table tr.latest td {
        background: rgba(225, 87, 89, 0.12);
    }
    :global(body.dark-mode) .hint,
    :global(body.dark-mode) .count {
        color: #9aa6b4;
    }
    :global(body.dark-mode) .runs-table td.delta {
        color: #9aa6b4;
    }
</style>
