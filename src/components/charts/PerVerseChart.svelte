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
     * The most-recent run is rendered as filled bars (colour-coded by
     * per-verse "goodness": green = best, red = worst) plus a polyline.
     * Other selected runs are dashed polylines in palette colours.
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

    // Tight Y-axis bound: pick a "nice" tick step around max/5, ceil max to a
    // multiple of that step. Avoids the huge whitespace caused by the old
    // robust scaling while still producing readable tick labels.
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

    $: maxValue = allValues.length > 0 ? Math.max(...allValues) : 1;
    $: yAxis = (() => {
        if (maxValue <= 0) return { yMax: 1, ticks: [0, 1] };
        const step = niceTickStep(maxValue / 5);
        const yMax = Math.ceil(maxValue / step) * step;
        const ticks = [];
        for (let v = 0; v <= yMax + step / 2; v += step) ticks.push(v);
        return { yMax, ticks, step };
    })();
    $: yMax = yAxis.yMax;
    $: yTicks = yAxis.ticks;

    // --- Per-bar colour coding (latest run only) ---
    $: latestValueRange = (() => {
        if (!series[0]) return { min: 0, max: 0 };
        const vals = series[0].points.map((p) => p.value).filter((v) => v !== null && isFinite(v));
        if (vals.length === 0) return { min: 0, max: 0 };
        return { min: Math.min(...vals), max: Math.max(...vals) };
    })();

    function goodnessFor(value) {
        if (value === null || !isFinite(value)) return 0.5;
        const { min, max } = latestValueRange;
        if (max <= min) return 0.5;
        const t = (value - min) / (max - min);
        return effectiveMetric === 'wpm' ? t : 1 - t;
    }

    function barFill(value) {
        if (value === null) return 'rgba(150,150,150,0.15)';
        const g = goodnessFor(value);
        const hue = 120 * g;
        return `hsla(${hue}, 75%, 50%, 0.55)`;
    }
    function barStroke(value) {
        if (value === null) return 'rgba(150,150,150,0.3)';
        const g = goodnessFor(value);
        const hue = 120 * g;
        return `hsl(${hue}, 75%, 35%)`;
    }
    function dotColor(value) {
        if (value === null) return '#999';
        const g = goodnessFor(value);
        const hue = 120 * g;
        return `hsl(${hue}, 75%, 35%)`;
    }

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
        : (t) => (t >= 10 ? `${t.toFixed(0)}s` : `${t.toFixed(1)}s`);
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
                            fill={barFill(p.value)}
                            stroke={barStroke(p.value)}
                            stroke-width="1"
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
                {#if !s.isLatest}
                    <polyline
                        points={polylinePoints(s.points)}
                        fill="none"
                        stroke={s.color}
                        stroke-width="1.5"
                        stroke-opacity="0.85"
                        stroke-dasharray="4 3"
                    />
                    {#each s.points as p (p.idx)}
                        {#if p.value !== null}
                            <circle
                                cx={xCenter(p.idx)}
                                cy={yPos(p.value)}
                                r="2.5"
                                fill={s.color}
                            >
                                <title>{p.tooltip}</title>
                            </circle>
                        {/if}
                    {/each}
                {/if}
            {/each}

            {#if series[0]}
                {#each series[0].points as p (p.idx)}
                    {#if p.value !== null}
                        <circle
                            cx={xCenter(p.idx)}
                            cy={yPos(p.value)}
                            r="3.5"
                            fill={dotColor(p.value)}
                            stroke="#fff"
                            stroke-width="1"
                        >
                            <title>{p.tooltip}</title>
                        </circle>
                    {/if}
                {/each}
            {/if}

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
        transition: filter 0.15s ease;
    }
    .bar.hover {
        filter: brightness(0.85);
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
    :global(body.dark-mode) .bar.hover {
        filter: brightness(1.15);
    }
</style>
