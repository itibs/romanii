<script>
    // @ts-nocheck

    /**
     * Renders the trend of total run time over time.
     * Runs are plotted in chronological order on the X axis (oldest to newest)
     * and total time on the Y axis. The Y range is tight to the actual data
     * (both min and max) so a series of e.g. 150–200s runs doesn't waste
     * 75% of the chart on whitespace below 150s.
     */
    export let runs = [];
    /** Optional run id to highlight; defaults to the chronologically latest. */
    export let highlightId = '';

    $: chrono = [...runs].sort((a, b) => a.timestamp - b.timestamp);
    $: effectiveHighlightId = highlightId || (chrono.length ? chrono[chrono.length - 1].id : '');

    function niceTickStep(rough) {
        if (rough <= 0) return 1;
        const pow = Math.pow(10, Math.floor(Math.log10(rough)));
        const norm = rough / pow;
        let nice;
        if (norm < 1.5) nice = 1;
        else if (norm < 3) nice = 2;
        else if (norm < 7) nice = 5;
        else nice = 10;
        return nice * pow;
    }

    $: times = chrono.map((r) => r.totalTime || 0).filter((t) => isFinite(t));
    $: minTotal = times.length > 0 ? Math.min(...times) : 0;
    $: maxTotal = times.length > 0 ? Math.max(...times) : 1;

    $: yAxis = (() => {
        if (times.length === 0) return { yMin: 0, yMax: 1, step: 0.5, ticks: [0, 0.5, 1] };

        const range = maxTotal - minTotal;
        const padding = range > 0 ? range * 0.12 : Math.max(0.5, maxTotal * 0.1);
        const rawMin = Math.max(0, minTotal - padding);
        const rawMax = maxTotal + padding;

        const span = rawMax - rawMin;
        const step = niceTickStep(span / 5);
        const yMin = Math.max(0, Math.floor(rawMin / step) * step);
        const yMax = Math.ceil(rawMax / step) * step;
        const ticks = [];
        for (let v = yMin; v <= yMax + step / 2; v += step) ticks.push(v);
        return { yMin, yMax, step, ticks };
    })();
    $: yMin = yAxis.yMin;
    $: yMax = yAxis.yMax;
    $: yTicks = yAxis.ticks;

    const width = 720;
    const height = 240;
    const margin = { top: 16, right: 16, bottom: 48, left: 56 };
    $: innerW = width - margin.left - margin.right;
    $: innerH = height - margin.top - margin.bottom;

    $: xStep = chrono.length > 1 ? innerW / (chrono.length - 1) : 0;

    function xPos(i) {
        if (chrono.length === 1) return margin.left + innerW / 2;
        return margin.left + xStep * i;
    }
    function yPos(v) {
        const denom = yMax - yMin || 1;
        return margin.top + innerH - ((v - yMin) / denom) * innerH;
    }

    function fmtDate(ts) {
        try {
            const d = new Date(ts);
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        } catch (e) {
            return '';
        }
    }

    function fmtTick(v) {
        if (v >= 100) return `${v.toFixed(0)}s`;
        if (v >= 10) return `${v.toFixed(0)}s`;
        return `${v.toFixed(1)}s`;
    }

    $: plotPoints = chrono.map((r, i) => ({
        id: r.id,
        x: xPos(i),
        y: yPos(r.totalTime),
        totalTime: r.totalTime,
        timestamp: r.timestamp
    }));
    $: polylinePoints = plotPoints.map((p) => `${p.x},${p.y}`).join(' ');

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
                    {fmtTick(t)}
                </text>
            {/each}

            {#key polylinePoints}
                {#if plotPoints.length > 1}
                    <polyline points={polylinePoints} fill="none" stroke="#4e79a7" stroke-width="2" />
                {/if}
            {/key}

            {#each plotPoints as p (p.id)}
                <circle
                    cx={p.x}
                    cy={p.y}
                    r={p.id === effectiveHighlightId ? 5.5 : 3.5}
                    fill={p.id === effectiveHighlightId ? '#e15759' : '#4e79a7'}
                    stroke="#fff"
                    stroke-width="1"
                >
                    <title>{fmtDate(p.timestamp)}: {p.totalTime.toFixed(2)}s</title>
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
