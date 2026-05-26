<script>
    // @ts-nocheck

    /**
     * Renders the trend of total run time over time.
     * Runs are plotted in chronological order on the X axis (oldest to newest)
     * and total time on the Y axis.
     */
    export let runs = [];
    export let highlightId = '';

    $: chrono = [...runs].sort((a, b) => a.timestamp - b.timestamp);

    function niceCeil(v) {
        if (v <= 0) return 1;
        const pow = Math.pow(10, Math.floor(Math.log10(v)));
        const n = v / pow;
        let nice;
        if (n <= 1) nice = 1;
        else if (n <= 2) nice = 2;
        else if (n <= 5) nice = 5;
        else nice = 10;
        return nice * pow;
    }

    $: maxTotal = chrono.reduce((m, r) => Math.max(m, r.totalTime || 0), 0);
    $: yMax = niceCeil(Math.max(1, maxTotal * 1.05));
    $: yTicks = (() => {
        const ticks = [];
        const steps = 5;
        for (let i = 0; i <= steps; i++) ticks.push((yMax * i) / steps);
        return ticks;
    })();

    const width = 720;
    const height = 240;
    const margin = { top: 16, right: 16, bottom: 48, left: 48 };
    $: innerW = width - margin.left - margin.right;
    $: innerH = height - margin.top - margin.bottom;

    $: xStep = chrono.length > 1 ? innerW / (chrono.length - 1) : 0;

    function xPos(i) {
        if (chrono.length === 1) return margin.left + innerW / 2;
        return margin.left + xStep * i;
    }
    function yPos(v) {
        return margin.top + innerH - (v / yMax) * innerH;
    }

    function fmtDate(ts) {
        try {
            const d = new Date(ts);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    $: line = chrono.map((r, i) => `${xPos(i)},${yPos(r.totalTime)}`).join(' ');

    // Show up to ~8 evenly-spaced x labels
    $: xLabelIdxs = (() => {
        if (chrono.length <= 8) return chrono.map((_, i) => i);
        const out = [];
        const step = Math.max(1, Math.floor(chrono.length / 7));
        for (let i = 0; i < chrono.length; i += step) out.push(i);
        if (out[out.length - 1] !== chrono.length - 1) out.push(chrono.length - 1);
        return out;
    })();
</script>

{#if chrono.length === 0}
    <p><em>Nu există date pentru graficul de evoluție.</em></p>
{:else}
    <div class="chart-wrap">
        <svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" class="chart">
            {#each yTicks as t}
                <line
                    x1={margin.left}
                    x2={margin.left + innerW}
                    y1={yPos(t)}
                    y2={yPos(t)}
                    class="grid"
                />
                <text x={margin.left - 6} y={yPos(t)} class="tick" text-anchor="end" dominant-baseline="middle">
                    {t.toFixed(1)}s
                </text>
            {/each}

            {#if chrono.length > 1}
                <polyline points={line} fill="none" stroke="#4e79a7" stroke-width="2" />
            {/if}

            {#each chrono as r, i}
                <circle
                    cx={xPos(i)}
                    cy={yPos(r.totalTime)}
                    r={r.id === highlightId ? 5.5 : 3.5}
                    fill={r.id === highlightId ? '#e15759' : '#4e79a7'}
                    stroke="#fff"
                    stroke-width="1"
                >
                    <title>{fmtDate(r.timestamp)}: {r.totalTime.toFixed(2)}s</title>
                </circle>
            {/each}

            {#each xLabelIdxs as i}
                <text
                    x={xPos(i)}
                    y={margin.top + innerH + 16}
                    class="tick"
                    text-anchor="middle"
                >
                    {fmtDate(chrono[i].timestamp)}
                </text>
            {/each}

            <line x1={margin.left} x2={margin.left + innerW} y1={margin.top + innerH} y2={margin.top + innerH} class="axis" />
            <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + innerH} class="axis" />

            <text x={margin.left + innerW / 2} y={height - 4} class="axis-title" text-anchor="middle">Data</text>
            <text
                x={-(margin.top + innerH / 2)}
                y={12}
                class="axis-title"
                text-anchor="middle"
                transform="rotate(-90)"
            >Secunde</text>
        </svg>
    </div>
{/if}

<style>
    .chart-wrap {
        width: 100%;
        max-width: 760px;
    }
    .chart {
        width: 100%;
        height: auto;
        font-family: inherit;
    }
    .grid {
        stroke: #d0d0d0;
        stroke-width: 1;
        stroke-dasharray: 2 2;
    }
    .axis {
        stroke: #8a8a8a;
        stroke-width: 1;
    }
    .tick {
        fill: #555;
        font-size: 11px;
    }
    .axis-title {
        fill: #444;
        font-size: 12px;
        font-weight: bold;
    }
    :global(body.dark-mode) .grid {
        stroke: #2c3a4a;
    }
    :global(body.dark-mode) .axis {
        stroke: #6a7c92;
    }
    :global(body.dark-mode) .tick {
        fill: #b9c3cf;
    }
    :global(body.dark-mode) .axis-title {
        fill: #d7d7d7;
    }
</style>
