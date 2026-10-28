<script>
    // @ts-nocheck
    import { createEventDispatcher } from 'svelte';

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

    import {
        CHART_HEIGHT,
        CHART_WIDTH,
        MARGIN,
        axisLabelsFor,
        barWidth,
        barX,
        displayLabel,
        innerSize,
        maxCharsForLabel,
        selectXLabelIndices,
        xCenter as xCenterAt,
        xStep as xStepFor
    } from '/src/lib/perVerseChartLayout.js';

    export let runs = [];
    export let verseLabels = [];
    /** @type {number[]} */
    export let verseWordCounts = [];
    /** @type {'wpm' | 'seconds'} */
    export let metric = 'wpm';
    /** When true, a drag on the chart selects verses and offers to train them. */
    export let enableTrain = false;

    const palette = [
        '#e15759', '#4e79a7', '#f28e2b', '#76b7b2',
        '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
        '#9c755f', '#bab0ac'
    ];

    let hoverIdx = -1;

    $: hasAnyWordCounts = (verseWordCounts && verseWordCounts.length > 0)
        || (runs || []).some((r) => r && r.verseWordCounts && r.verseWordCounts.length > 0);
    $: effectiveMetric = (metric === 'wpm' && hasAnyWordCounts) ? 'wpm' : 'seconds';

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

    $: series = runs.map((run, ri) => {
        if (!run || !run.verseTimes) return null;
        const wc = (run.verseWordCounts && run.verseWordCounts.length > 0)
            ? run.verseWordCounts
            : verseWordCounts;
        const runLabels = (run.verseLabels && run.verseLabels.length) ? run.verseLabels : verseLabels;
        const points = run.verseTimes.map((_, i) => {
            const v = computeValue(run.verseTimes, i, effectiveMetric, wc);
            const label = (runLabels && runLabels[i]) ? runLabels[i] : String(i + 1);
            return {
                idx: i,
                value: v,
                tooltip: computeTooltip(run.verseTimes, i, effectiveMetric, wc, label)
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

    const width = CHART_WIDTH;
    const height = CHART_HEIGHT;
    const margin = MARGIN;
    const { innerW, innerH } = innerSize(width, height, margin);

    $: xStep = xStepFor(maxVerses, innerW);
    $: axisLabels = axisLabelsFor(maxVerses, runs && runs[0], verseLabels);
    $: xLabelIdxs = selectXLabelIndices(maxVerses, innerW, axisLabels);
    $: labelMaxChars = maxCharsForLabel(innerW, xLabelIdxs.length);

    // Reactive so SVG x/y attributes recompute when chapter length (xStep) or
    // scale (yMax) changes. Hidden closures were leaving labels at the previous
    // chapter's positions while the bars moved.
    $: xAt = (i) => xCenterAt(i, margin.left, xStep);
    $: yAt = (v) => {
        const clamped = Math.min(v, yMax);
        return margin.top + innerH - (clamped / yMax) * innerH;
    };

    $: yTickFormatter = effectiveMetric === 'wpm'
        ? (t) => `${t.toFixed(0)}`
        : (t) => (t >= 10 ? `${t.toFixed(0)}s` : `${t.toFixed(1)}s`);
    $: yAxisTitle = effectiveMetric === 'wpm' ? 'Cuvinte / minut' : 'Secunde';

    function polylinePoints(points, xFn, yFn) {
        const pts = [];
        for (const p of points) {
            if (p.value === null) continue;
            pts.push(`${xFn(p.idx)},${yFn(p.value)}`);
        }
        return pts.join(' ');
    }

    const dispatch = createEventDispatcher();

    /** @type {SVGSVGElement | undefined} */
    let svgEl;
    let dragging = false;
    let selA = -1;
    let selB = -1;

    $: selStart = selA < 0 || selB < 0 ? -1 : Math.min(selA, selB);
    $: selEnd = selA < 0 || selB < 0 ? -1 : Math.max(selA, selB);
    $: trainLabel = selStart === selEnd
        ? 'Antrenează-te pentru acest verset'
        : 'Antrenează-te pentru aceste versete';
    $: selectionCaption = selStart < 0
        ? ''
        : (selStart === selEnd
            ? 'Versetul ' + (axisLabels[selStart] || (selStart + 1))
            : 'Versetele ' + (axisLabels[selStart] || (selStart + 1)) + '–' + (axisLabels[selEnd] || (selEnd + 1)));

    let labelSig = '';
    $: {
        const sig = String(maxVerses) + '|' + (verseLabels || []).join('\n');
        if (sig !== labelSig) {
            labelSig = sig;
            selA = -1;
            selB = -1;
            dragging = false;
        }
    }

    function eventIndex(event, clamp) {
        if (!svgEl || xStep <= 0) return -1;
        const ctm = svgEl.getScreenCTM();
        if (!ctm) return -1;
        const pt = svgEl.createSVGPoint();
        pt.x = event.clientX;
        pt.y = event.clientY;
        const svgPoint = pt.matrixTransform(ctm.inverse());
        let i = Math.floor((svgPoint.x - margin.left) / xStep);
        if (clamp) {
            if (i < 0) i = 0;
            if (i >= maxVerses) i = maxVerses - 1;
            return maxVerses > 0 ? i : -1;
        }
        if (i < 0 || i >= maxVerses) return -1;
        return i;
    }

    function onPointerDown(event) {
        if (!enableTrain) return;
        const i = eventIndex(event, false);
        if (i < 0) return;
        event.preventDefault();
        dragging = true;
        selA = i;
        selB = i;
        hoverIdx = i;
        if (event.currentTarget.setPointerCapture) {
            try {
                event.currentTarget.setPointerCapture(event.pointerId);
            } catch (e) {
                // Synthetic or unsupported pointer events still select without capture.
            }
        }
    }

    function onPointerMove(event) {
        const i = eventIndex(event, dragging);
        if (i >= 0) hoverIdx = i;
        if (!dragging || i < 0) return;
        selB = i;
    }

    function onPointerUp(event) {
        if (!dragging) return;
        const i = eventIndex(event);
        if (i >= 0) selB = i;
        dragging = false;
        hoverIdx = -1;
    }

    function confirmTrain() {
        if (selStart < 0) return;
        dispatch('train', { from: selStart, to: selEnd });
        selA = -1;
        selB = -1;
    }
</script>

{#if series.length === 0 || maxVerses === 0}
    <p><em>Nu există date pentru grafic.</em></p>
{:else}
    <div class="chart-wrap">
        <svg bind:this={svgEl} viewBox="0 0 {width} {height}" preserveAspectRatio="xMidYMid meet" class="chart">
            {#each yTicks as t}
                <line
                    x1={margin.left}
                    x2={margin.left + innerW}
                    y1={yAt(t)}
                    y2={yAt(t)}
                    class="grid"
                />
                <text x={margin.left - 6} y={yAt(t)} class="tick" text-anchor="end" dominant-baseline="middle">
                    {yTickFormatter(t)}
                </text>
            {/each}

            {#if enableTrain && selStart >= 0}
                <rect
                    x={margin.left + xStep * selStart}
                    y={margin.top}
                    width={xStep * (selEnd - selStart + 1)}
                    height={innerH}
                    class="selection"
                />
            {/if}

            {#if series[0]}
                {#each series[0].points as p (p.idx)}
                    {#if p.value !== null}
                        <rect
                            x={barX(p.idx, margin.left, xStep)}
                            y={yAt(p.value)}
                            width={barWidth(xStep)}
                            height={Math.max(0, margin.top + innerH - yAt(p.value))}
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
                        points={polylinePoints(s.points, xAt, yAt)}
                        fill="none"
                        stroke={s.color}
                        stroke-width="1.5"
                        stroke-opacity="0.85"
                        stroke-dasharray="4 3"
                    />
                    {#each s.points as p (p.idx)}
                        {#if p.value !== null}
                            <circle
                                cx={xAt(p.idx)}
                                cy={yAt(p.value)}
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
                            cx={xAt(p.idx)}
                            cy={yAt(p.value)}
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

            {#each Array.from({ length: maxVerses }, (_, i) => i) as i (i)}
                <line
                    x1={xAt(i)}
                    x2={xAt(i)}
                    y1={margin.top + innerH}
                    y2={margin.top + innerH + 4}
                    class="axis"
                />
            {/each}
            {#each xLabelIdxs as i (i)}
                <text
                    x={xAt(i)}
                    y={margin.top + innerH + 16}
                    class="tick"
                    text-anchor="middle"
                >
                    {displayLabel(axisLabels[i], labelMaxChars)}
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

            {#if enableTrain}
                <rect
                    x={margin.left}
                    y={margin.top}
                    width={innerW}
                    height={innerH + 40}
                    class="hit"
                    on:pointerdown={onPointerDown}
                    on:pointermove={onPointerMove}
                    on:pointerup={onPointerUp}
                    on:pointercancel={onPointerUp}
                    on:pointerleave={() => { if (!dragging) hoverIdx = -1; }}
                />
            {/if}
        </svg>
        {#if enableTrain}
            <p class="hover-tip">
                {#if hoverIdx >= 0 && series[0] && series[0].points[hoverIdx]}
                    {series[0].points[hoverIdx].tooltip}
                {:else}
                    Trage cu mouse-ul peste bare ca să alegi un verset sau un interval.
                {/if}
            </p>
            {#if selStart >= 0}
                <div class="train-row">
                    <span>{selectionCaption}</span>
                    <button type="button" on:click={confirmTrain}>{trainLabel}</button>
                </div>
            {/if}
        {/if}
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
    .selection {
        fill: rgba(78, 121, 167, 0.22);
        stroke: #4e79a7;
        stroke-width: 1;
        pointer-events: none;
    }
    .hit {
        fill: transparent;
        cursor: crosshair;
        touch-action: none;
    }
    .hover-tip {
        min-height: 1.2em;
        margin: 4px 0;
        color: #555;
        font-size: 0.9em;
    }
    .train-row {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin: 4px 0 10px;
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
    :global(body.dark-mode) .selection {
        fill: rgba(78, 121, 167, 0.35);
        stroke: #8eb4d8;
    }
    :global(body.dark-mode) .hover-tip {
        color: #9aa6b4;
    }
</style>
