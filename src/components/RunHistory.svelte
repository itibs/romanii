<script>
    // @ts-nocheck
    import { runHistoryStore, deleteRun, clearRound, formatTimestamp } from '/src/lib/runHistory.js';
    import PerVerseChart from '/src/components/charts/PerVerseChart.svelte';
    import TotalTimeChart from '/src/components/charts/TotalTimeChart.svelte';

    export let round = '';
    export let title = 'Istoric încercări';
    /** @type {string[]} */
    export let verseLabels = [];
    /** @type {number[]} */
    export let verseWordCounts = [];
    /** Optional latest run id to auto-highlight after a finish. */
    export let highlightRunId = '';

    let expanded = false;
    /** @type {'wpm' | 'seconds'} */
    let metric = 'wpm';
    /** @type {Set<string>} */
    let selectedIds = new Set();

    const palette = [
        '#e15759', '#4e79a7', '#f28e2b', '#76b7b2',
        '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
        '#9c755f', '#bab0ac'
    ];

    $: hasWordCounts = verseWordCounts && verseWordCounts.length > 0;
    $: if (!hasWordCounts && metric === 'wpm') {
        metric = 'seconds';
    }

    $: allRuns = (($runHistoryStore || {})[round] || [])
        .slice()
        .sort((a, b) => b.timestamp - a.timestamp);

    // Total WPM for a run, given the current chapter's verseWordCounts.
    function totalWpm(run) {
        if (!hasWordCounts || !run || run.totalTime <= 0) return null;
        const totalWords = verseWordCounts.reduce((a, b) => a + (b || 0), 0);
        if (totalWords <= 0) return null;
        return (totalWords / run.totalTime) * 60;
    }

    // Auto-select latest run + any newly-finished run
    let lastSelectedSignature = '';
    $: {
        const signature = allRuns.map((r) => r.id).join('|');
        if (signature !== lastSelectedSignature) {
            lastSelectedSignature = signature;
            const next = new Set(selectedIds);
            for (const id of [...next]) {
                if (!allRuns.find((r) => r.id === id)) next.delete(id);
            }
            if (allRuns[0]) next.add(allRuns[0].id);
            if (highlightRunId && allRuns.find((r) => r.id === highlightRunId)) {
                next.add(highlightRunId);
            }
            selectedIds = next;
        }
    }

    let prevHighlight = '';
    $: if (highlightRunId && highlightRunId !== prevHighlight) {
        prevHighlight = highlightRunId;
        expanded = true;
    }

    $: chartedRuns = (() => {
        const picked = allRuns.filter((r) => selectedIds.has(r.id));
        return picked;
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
                <div class="chart-header">
                    <h4>{metric === 'wpm' ? 'Viteza pe verset (cuv/min)' : 'Timp pe verset (secunde)'}</h4>
                    {#if hasWordCounts}
                        <div class="metric-toggle" role="tablist" aria-label="Unitate de măsură">
                            <button
                                class="small"
                                class:active={metric === 'wpm'}
                                on:click={() => (metric = 'wpm')}
                                title="Cuvinte pe minut (normalizat după lungimea versetului)"
                            >cuv/min</button>
                            <button
                                class="small"
                                class:active={metric === 'seconds'}
                                on:click={() => (metric = 'seconds')}
                                title="Timp brut pe verset"
                            >secunde</button>
                        </div>
                    {/if}
                </div>
                <p class="hint">
                    {#if metric === 'wpm'}
                        Barele sunt ultima încercare. <strong>Mai înalt = mai rapid.</strong>
                        <span class="legend-color">🟢 verde = cel mai rapid verset, 🔴 roșu = cel mai lent</span>.
                        Lungimea versetului este normalizată, așa că un verset lung dar tipărit rapid nu mai arată „lent”.
                    {:else}
                        Barele sunt ultima încercare. <strong>Mai înalt = mai lent.</strong>
                        <span class="legend-color">🟢 verde = cel mai rapid verset (timp mic), 🔴 roșu = cel mai lent</span>.
                        Versetele lungi apar în mod natural ca bare mai înalte.
                    {/if}
                    Bifează încercări din listă pentru a le compara.
                </p>
                <PerVerseChart
                    runs={chartedRuns}
                    verseLabels={verseLabels}
                    verseWordCounts={verseWordCounts}
                    metric={metric}
                />

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
                            {#if hasWordCounts}
                                <th>cuv/min</th>
                            {/if}
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
                                            {#if i === 0}
                                                <span class="swatch swatch-gradient" title="Gradient: roșu = mai slab, verde = mai bun"></span>
                                            {:else}
                                                <span class="swatch" style="background: {colorFor(run.id)}"></span>
                                            {/if}
                                        {/if}
                                    </label>
                                </td>
                                <td>{formatTimestamp(run.timestamp)}{i === 0 ? ' (ultima)' : ''}</td>
                                <td class="num">{run.totalTime.toFixed(2)}</td>
                                {#if hasWordCounts}
                                    <td class="num">{totalWpm(run) !== null ? totalWpm(run).toFixed(1) : '-'}</td>
                                {/if}
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
    .chart-header {
        display: flex;
        align-items: baseline;
        gap: 12px;
        flex-wrap: wrap;
    }
    .chart-header h4 {
        margin: 0;
    }
    .metric-toggle {
        display: inline-flex;
        gap: 0;
        border: 1px solid #c0c0c0;
        border-radius: 4px;
        overflow: hidden;
    }
    .metric-toggle button.small {
        background: transparent;
        border: none;
        border-radius: 0;
        padding: 2px 10px;
        cursor: pointer;
    }
    .metric-toggle button.small + button.small {
        border-left: 1px solid #c0c0c0;
    }
    .metric-toggle button.small.active {
        background: rgba(225, 87, 89, 0.15);
        font-weight: bold;
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
    .swatch-gradient {
        width: 28px;
        background: linear-gradient(
            to right,
            hsl(0, 75%, 50%),
            hsl(60, 75%, 50%),
            hsl(120, 75%, 50%)
        );
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
    :global(body.dark-mode) .metric-toggle {
        border-color: #3a4c61;
    }
    :global(body.dark-mode) .metric-toggle button.small + button.small {
        border-left-color: #3a4c61;
    }
    :global(body.dark-mode) .metric-toggle button.small.active {
        background: rgba(225, 87, 89, 0.25);
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
