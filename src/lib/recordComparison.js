/**
 * Compare the current competitive attempt with local run history:
 *  - this verse vs the best stored time for that verse
 *  - cumulative time vs the local chapter record (fastest complete run)
 *
 * Negative deltas mean the current attempt is ahead (faster).
 */

/**
 * @typedef {Object} RunLike
 * @property {number} totalTime
 * @property {number[]} verseTimes
 * @property {number} [timestamp]
 */

/**
 * @typedef {Object} PaceComparison
 * @property {number} verseIndex
 * @property {number | null} verseDelta
 * @property {number | null} cumulativeDelta
 */

/**
 * Fastest complete run (lowest totalTime). Tie-break: earlier timestamp.
 * @param {RunLike[]} runs
 * @returns {RunLike | undefined}
 */
export function pickFastestRun(runs) {
	if (!Array.isArray(runs) || runs.length === 0) return undefined;

	/** @type {RunLike | undefined} */
	let best;
	for (const run of runs) {
		if (!run || !Array.isArray(run.verseTimes) || run.verseTimes.length === 0) continue;
		const total = Number(run.totalTime);
		if (!isFinite(total)) continue;
		if (!best) {
			best = run;
			continue;
		}
		const bestTotal = Number(best.totalTime);
		if (total < bestTotal) {
			best = run;
			continue;
		}
		if (total === bestTotal) {
			const ts = Number(run.timestamp);
			const bestTs = Number(best.timestamp);
			if (isFinite(ts) && isFinite(bestTs) && ts < bestTs) {
				best = run;
			}
		}
	}
	return best;
}

/**
 * Best (lowest) stored time for a verse index across all runs.
 * @param {RunLike[]} runs
 * @param {number} verseIndex
 * @returns {number | null}
 */
export function bestVerseTime(runs, verseIndex) {
	if (!Array.isArray(runs) || verseIndex < 0) return null;
	let best = Infinity;
	for (const run of runs) {
		const t = Number(run && run.verseTimes ? run.verseTimes[verseIndex] : NaN);
		if (!isFinite(t) || t < 0) continue;
		if (t < best) best = t;
	}
	return best === Infinity ? null : best;
}

/**
 * Sum of times[0..index], or null if any entry is missing.
 * @param {number[]} times
 * @param {number} index
 * @returns {number | null}
 */
export function sumThrough(times, index) {
	if (!Array.isArray(times) || index < 0 || index >= times.length) return null;
	let sum = 0;
	for (let i = 0; i <= index; i++) {
		const t = Number(times[i]);
		if (!isFinite(t)) return null;
		sum += t;
	}
	return sum;
}

/**
 * @param {number[]} currentTimes times for verses completed so far (last = verse just finished)
 * @param {RunLike[]} previousRuns local history for this round, excluding the in-progress attempt
 * @returns {PaceComparison | null}
 */
export function comparePace(currentTimes, previousRuns) {
	if (!Array.isArray(currentTimes) || currentTimes.length === 0) return null;
	if (!Array.isArray(previousRuns) || previousRuns.length === 0) return null;

	const verseIndex = currentTimes.length - 1;
	const currentVerse = Number(currentTimes[verseIndex]);
	if (!isFinite(currentVerse)) return null;

	const verseBest = bestVerseTime(previousRuns, verseIndex);
	const verseDelta = verseBest == null ? null : currentVerse - verseBest;

	const record = pickFastestRun(previousRuns);
	const recordCum = record ? sumThrough(record.verseTimes, verseIndex) : null;
	const currentCum = sumThrough(currentTimes, verseIndex);
	const cumulativeDelta =
		recordCum == null || currentCum == null ? null : currentCum - recordCum;

	if (verseDelta == null && cumulativeDelta == null) return null;
	return { verseIndex, verseDelta, cumulativeDelta };
}

/**
 * @param {number | null | undefined} delta
 */
export function formatSignedSeconds(delta) {
	if (delta == null || !isFinite(delta)) return '';
	const rounded = Math.round(delta * 100) / 100;
	if (rounded === 0) return '0.00s';
	const sign = rounded > 0 ? '+' : '-';
	return `${sign}${Math.abs(rounded).toFixed(2)}s`;
}

/**
 * @param {number | null | undefined} delta
 * @returns {'ahead' | 'behind' | 'even' | 'unknown'}
 */
export function paceTone(delta) {
	if (delta == null || !isFinite(delta)) return 'unknown';
	const rounded = Math.round(delta * 100) / 100;
	if (rounded === 0) return 'even';
	return rounded < 0 ? 'ahead' : 'behind';
}

/**
 * @param {'ahead' | 'behind' | 'even' | 'unknown'} tone
 */
export function paceToneLabel(tone) {
	if (tone === 'ahead') return 'înainte';
	if (tone === 'behind') return 'în urmă';
	if (tone === 'even') return 'egal';
	return '';
}
