<script>
    // @ts-nocheck

    /**
     * Renders a multi-series chart of per-verse times for one or more runs.
     *
     * Two metrics are supported:
     *  - 'wpm'     — words per minute (verseWordCounts[i] / verseTimes[i] * 60).
     *                Higher bars = faster. Verse length is normalised out,
     *                which is what we want when long verses look slow simply
     *                because there are more words to type.
     *  - 'seconds' — raw time per verse. Lower bars = faster.
     *
     * The most-recent run is rendered as filled bars in the background and
     * a thick polyline; other selected runs are dashed polylines.
     */

    export let runs = [];
    export let verseLabels = [];
    /** @type {number[]} */
    export let verseWordCounts = [];
    /** @type {'wpm' | 'seconds'} */
    export let metric = 'wpm';

    const palette = [
        '#e15759', '#4e79a7', '#f28e2b', '#76b7b2',
        '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
        '#9c755f', '#bab0ac'
    ];

    let hoverIdx = -1;

    $: effectiveMetric = (metric === 'wpm' && verseWordCounts && verseWordCounts.length > 0)
        ? 'wpm'
        : 'seconds';

    function computeValue(verseTimes, i, m, wc) {
        const t = verseTimes[i];
        if (t === undefined || t === null) return null;
        if (m === 'wpm') {
            const w = wc && wc[i];
            if (!w || t <= 0) return null;
            return (w / t) * 60;
        }
        return t;
    }

    function computeTooltip(verseTimes, i, m, wc, label) {
        const t = verseTimes[i];
        const w = wc && wc[i];
        const v = computeValue(verseTimes, i, m, wc);
        if (v === null) return `${label}: -`;
        if (m === 'wpm') {
            return `${label}: ${v.toFixed(1)} cuv/min (${(t || 0).toFixed(2)}s, ${w} cuv)`;
        }
        return `${label}: ${(t || 0).toFixed(2)}s`;
    }

    function labelFor(i) {
        if (verseLabels && verseLabels[i]) return verseLabels[i];
        return String(i + 1);
    }

    // Build the rendered series fully reactively so any change to runs /
    // metric / verseWordCounts forces a re-render.
    $: series = runs.map((run, ri) => {
        if (!run || !run.verseTimes) return null;
        const points = run.verseTimes.map((_, i) => {
            const v = computeValue(run.verseTimes, i, effectiveMetric, verseWordCounts);
            return {
                idx: i,
                value: v,
                tooltip: computeTooltip(run.verseTimes, i, effectiveMetric, verseWordCounts, labelFor(i))
            };
        });
        return { runId: run.id || ri, color: palette[ri % palette.length], isLatest: ri === 0, points };
    }).filter((s) => s !== null);

    $: maxVerses = Math.max(0, ...series.map((s) => s.points.length));

    $: allValues = (() => {
        const vals = [];
        for (const s of series) {
            for (const p of s.points) {
                if (p.value !== null && isFinite(p.value)) vals.push(p.value);
            }
        }
        return vals;
    })();

    // Robust Y-axis upper bound — protects against single outliers.
    $: maxValue = (() => {
        if (allValues.length === 0) return 1;
        const sorted = [...allValues].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)] || 1;
        const p90Idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.9));
        const p90 = sorted[p90Idx] || median;
        const peak = sorted[sorted.length - 1] || median;
        const robust = Math.max(median * 4, p90 * 1.15, 1);
        if (peak <= robust * 1.5) return Math.max(robust, peak);
        return robust;
    })();

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
    $: yMax = niceCeil(maxValue * 1.05);
    $: yTicks = (() => {
        const ticks = [];
        const steps = 5;
        for (let i = 0; i <= steps; i++) ticks.push((yMax * i) / steps);
        return ticks;
    })();

    const width = 720;
    const height = 320;
    const margin = { top: 16, right: 16, bottom: 56, left: 56 };
    $: innerW = width - margin.left - margin.right;
    $: innerH = height - margin.top - margin.bottom;

    $: xStep = maxVerses > 0 ? innerW / maxVerses : 0;

    function xCenter(i) {
        return margin.left + xStep * (i + 0.5);
    }
    function yPos(v) {
        const clamped = Math.min(v, yMax);
        return margin.top + innerH - (clamped / yMax) * innerH;
    }

    $: rotateLabels = maxVerses > 12;

    $: yTickFormatter = effectiveMetric === 'wpm'
        ? (t) => `${t.toFixed(0)}`
        : (t) => `${t.toFixed(1)}s`;
    $: yAxisTitle = effectiveMetric === 'wpm' ? 'Cuvinte / minut' : 'Secunde';

    function polylinePoints(points) {
        const pts = [];
        for (const p of points) {
            if (p.value === null) continue;
            pts.push(`${xCenter(p.idx)},${yPos(p.value)}`);
        }
        return pts.join(' ');
    }
</script>

{#if series.length === 0 || maxVerses === 0}
    <p><em>Nu există date pentru grafic.</em></p>
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
                    {yTickFormatter(t)}
                </text>
            {/each}

            {#if series[0]}
                {#each series[0].points as p (p.idx)}
                    {#if p.value !== null}
                        <rect
                            x={margin.left + xStep * p.idx + xStep * 0.18}
                            y={yPos(p.value)}
                            width={Math.max(1, xStep * 0.64)}
                            height={Math.max(0, margin.top + innerH - yPos(p.value))}
                            class="bar"
                            class:hover={hoverIdx === p.idx}
                            on:mouseenter={() => (hoverIdx = p.idx)}
                            on:mouseleave={() => (hoverIdx = -1)}
                        >
                            <title>{p.tooltip}</title>
                        </rect>
                    {/if}
                {/each}
            {/if}

            {#each series as s, ri (s.runId)}
                <polyline
                    points={polylinePoints(s.points)}
                    fill="none"
                    stroke={s.color}
                    stroke-width={s.isLatest ? 2.5 : 1.5}
                    stroke-opacity={s.isLatest ? 1 : 0.85}
                    stroke-dasharray={s.isLatest ? '' : '4 3'}
                />
                {#each s.points as p (p.idx)}
                    {#if p.value !== null}
                        <circle
                            cx={xCenter(p.idx)}
                            cy={yPos(p.value)}
                            r={s.isLatest ? 3.5 : 2.5}
                            fill={s.color}
                        >
                            <title>{p.tooltip}</title>
                        </circle>
                    {/if}
                {/each}
            {/each}

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

            <line x1={margin.left} x2={margin.left + innerW} y1={margin.top + innerH} y2={margin.top + innerH} class="axis" />
            <line x1={margin.left} x2={margin.left} y1={margin.top} y2={margin.top + innerH} class="axis" />

            <text x={margin.left + innerW / 2} y={height - 4} class="axis-title" text-anchor="middle">Verset</text>
            <text
                x={-(margin.top + innerH / 2)}
                y={12}
                class="axis-title"
                text-anchor="middle"
                transform="rotate(-90)"
            >{yAxisTitle}</text>
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
