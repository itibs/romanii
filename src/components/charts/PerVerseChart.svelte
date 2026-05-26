<script>
    // @ts-nocheck

    /**
     * Renders a multi-series chart of per-verse times for one or more runs.
     * Each run is shown as a colored polyline + dots, and the most-recent
     * run is also rendered as filled bars in the background so it is easy
     * to see which segments of the chapter are slow.
     */

    export let runs = [];
    export let verseLabels = [];

    const palette = [
        '#e15759', // current run / red
        '#4e79a7', // blue
        '#f28e2b', // orange
        '#76b7b2', // teal
        '#59a14f', // green
        '#edc948', // yellow
        '#b07aa1', // purple
        '#ff9da7', // pink
        '#9c755f', // brown
        '#bab0ac'  // gray
    ];

    let hoverIdx = -1;

    $: maxVerses = Math.max(0, ...runs.map((r) => (r && r.verseTimes ? r.verseTimes.length : 0)));
    $: maxTime = (() => {
        let m = 0;
        for (const r of runs) {
            if (!r || !r.verseTimes) continue;
            for (const t of r.verseTimes) if (t > m) m = t;
        }
        return m === 0 ? 1 : m;
    })();

    // Axis ticks for Y
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
    $: yMax = niceCeil(maxTime * 1.05);
    $: yTicks = (() => {
        const ticks = [];
        const steps = 5;
        for (let i = 0; i <= steps; i++) ticks.push((yMax * i) / steps);
        return ticks;
    })();

    // Chart geometry
    const width = 720;
    const height = 320;
    const margin = { top: 16, right: 16, bottom: 56, left: 48 };
    $: innerW = width - margin.left - margin.right;
    $: innerH = height - margin.top - margin.bottom;

    $: xStep = maxVerses > 0 ? innerW / maxVerses : 0;

    function xCenter(i) {
        return margin.left + xStep * (i + 0.5);
    }
    function yPos(v) {
        return margin.top + innerH - (v / yMax) * innerH;
    }

    function labelFor(i) {
        if (verseLabels && verseLabels[i]) return verseLabels[i];
        return String(i + 1);
    }

    function polylinePoints(verseTimes) {
        return verseTimes
            .map((t, i) => `${xCenter(i)},${yPos(t)}`)
            .join(' ');
    }

    // Pick a label rotation when there are many bars
    $: rotateLabels = maxVerses > 12;
</script>

{#if runs.length === 0 || maxVerses === 0}
    <p><em>Nu există date pentru grafic.</em></p>
{:else}
    <div class="chart-wrap">
        <svg viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" class="chart">
            <!-- Y grid + ticks -->
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

            <!-- Bars for the most recent run (runs[0]) -->
            {#if runs[0]}
                {#each runs[0].verseTimes as t, i}
                    <rect
                        x={margin.left + xStep * i + xStep * 0.18}
                        y={yPos(t)}
                        width={Math.max(1, xStep * 0.64)}
                        height={Math.max(0, margin.top + innerH - yPos(t))}
                        class="bar"
                        class:hover={hoverIdx === i}
                        on:mouseenter={() => (hoverIdx = i)}
                        on:mouseleave={() => (hoverIdx = -1)}
                    >
                        <title>{labelFor(i)}: {t.toFixed(2)}s</title>
                    </rect>
                {/each}
            {/if}

            <!-- Polylines for every selected run -->
            {#each runs as run, ri}
                {#if run && run.verseTimes && run.verseTimes.length > 0}
                    <polyline
                        points={polylinePoints(run.verseTimes)}
                        fill="none"
                        stroke={palette[ri % palette.length]}
                        stroke-width={ri === 0 ? 2.5 : 1.5}
                        stroke-opacity={ri === 0 ? 1 : 0.85}
                        stroke-dasharray={ri === 0 ? '' : '4 3'}
                    />
                    {#each run.verseTimes as t, i}
                        <circle
                            cx={xCenter(i)}
                            cy={yPos(t)}
                            r={ri === 0 ? 3.5 : 2.5}
                            fill={palette[ri % palette.length]}
                        >
                            <title>{labelFor(i)}: {t.toFixed(2)}s</title>
                        </circle>
                    {/each}
                {/if}
            {/each}

            <!-- X axis labels -->
            {#each Array(maxVerses) as _, i}
                <text
                    x={xCenter(i)}
                    y={margin.top + innerH + (rotateLabels ? 10 : 16)}
                    class="tick"
                    text-anchor={rotateLabels ? 'end' : 'middle'}
                    transform={rotateLabels ? `rotate(-45 ${xCenter(i)} ${margin.top + innerH + 10})` : ''}
                >
                    {labelFor(i)}
                </text>
            {/each}

            <!-- Axes -->
            <line x1={margin.left} x2={margin.left + innerW} y1={margin.top + innerH} y2={margin.top + innerH} class="axis" />
            <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + innerH} class="axis" />

            <!-- Axis titles -->
            <text x={margin.left + innerW / 2} y={height - 4} class="axis-title" text-anchor="middle">Verset</text>
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
    .bar {
        fill: rgba(225, 87, 89, 0.18);
        stroke: rgba(225, 87, 89, 0.45);
        stroke-width: 1;
        transition: fill 0.15s ease;
    }
    .bar.hover {
        fill: rgba(225, 87, 89, 0.4);
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
