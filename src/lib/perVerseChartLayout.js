/**
 * Layout helpers for the per-verse bar chart.
 *
 * Labels must stay on the x-axis, centered under the bar they name.
 * Dense chapters skip some labels instead of rotating them into the plot
 * (which made numbers look like they were climbing the y-axis).
 */

export const CHART_WIDTH = 720;
export const CHART_HEIGHT = 320;
export const MARGIN = { top: 16, right: 16, bottom: 48, left: 56 };

export const BAR_SLOT_PAD = 0.18;
export const BAR_SLOT_WIDTH = 0.64;

export function innerSize(width = CHART_WIDTH, height = CHART_HEIGHT, margin = MARGIN) {
	return {
		innerW: width - margin.left - margin.right,
		innerH: height - margin.top - margin.bottom
	};
}

export function xStep(verseCount, innerW) {
	return verseCount > 0 ? innerW / verseCount : 0;
}

/** Horizontal center of verse slot i — same as the bar's center. */
export function xCenter(i, marginLeft, step) {
	return marginLeft + step * (i + 0.5);
}

export function barX(i, marginLeft, step) {
	return marginLeft + step * i + step * BAR_SLOT_PAD;
}

export function barWidth(step) {
	return Math.max(1, step * BAR_SLOT_WIDTH);
}

/** Approximate px width of an 11px-font tick label. */
export function estimateLabelWidthPx(label) {
	const len = String(label ?? '').length;
	return Math.max(12, len * 6.5 + 6);
}

/**
 * Which verse indices get an x-axis label, so text stays readable and
 * centered under its bar. Always includes the first and last verse.
 *
 * @param {number} verseCount
 * @param {number} innerW
 * @param {string[]} [labels]
 * @returns {number[]}
 */
export function selectXLabelIndices(verseCount, innerW, labels = []) {
	if (verseCount <= 0) return [];
	if (verseCount === 1) return [0];

	let widest = 12;
	for (let i = 0; i < verseCount; i++) {
		const text = labels[i] != null && labels[i] !== '' ? labels[i] : String(i + 1);
		widest = Math.max(widest, estimateLabelWidthPx(text));
	}
	const minPx = Math.min(90, widest);

	if (innerW / verseCount >= minPx) {
		return Array.from({ length: verseCount }, (_, i) => i);
	}

	const maxLabels = Math.max(2, Math.floor(innerW / minPx));
	const stride = Math.max(1, Math.ceil((verseCount - 1) / (maxLabels - 1)));
	const idxs = [];
	for (let i = 0; i < verseCount; i += stride) idxs.push(i);
	if (idxs[idxs.length - 1] !== verseCount - 1) idxs.push(verseCount - 1);
	return idxs;
}

/**
 * Truncate a tick label so it fits in the horizontal budget of one shown tick.
 * @param {unknown} label
 * @param {number} maxChars
 */
export function displayLabel(label, maxChars) {
	const s = String(label ?? '');
	if (!maxChars || s.length <= maxChars) return s;
	if (maxChars <= 1) return s.slice(0, 1);
	return s.slice(0, maxChars - 1) + '…';
}

export function maxCharsForLabel(innerW, shownCount) {
	if (shownCount <= 0) return 8;
	return Math.max(2, Math.floor(innerW / shownCount / 6.5));
}

/**
 * Axis labels for `count` slots. Prefer the latest run's stored labels so a
 * chapter change cannot pair the new chapter's numbers with the old run's bars.
 *
 * @param {number} count
 * @param {{ verseLabels?: string[] } | null | undefined} latestRun
 * @param {string[]} fallbackLabels
 * @returns {string[]}
 */
export function axisLabelsFor(count, latestRun, fallbackLabels = []) {
	const fromRun = latestRun && Array.isArray(latestRun.verseLabels) ? latestRun.verseLabels : null;
	const source = fromRun && fromRun.length ? fromRun : fallbackLabels || [];
	const out = [];
	for (let i = 0; i < count; i++) {
		const raw = source[i];
		out.push(raw != null && raw !== '' ? String(raw) : String(i + 1));
	}
	return out;
}
