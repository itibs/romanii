import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	bestVerseTime,
	comparePace,
	formatSignedSeconds,
	paceTone,
	paceToneLabel,
	pickFastestRun,
	sumThrough
} from './recordComparison.js';

/** @param {{ verseTimes: number[], totalTime: number, timestamp?: number }} partial */
function run(partial) {
	return { timestamp: 1, ...partial };
}

describe('pickFastestRun', () => {
	it('returns undefined for empty or invalid lists', () => {
		assert.equal(pickFastestRun([]), undefined);
		assert.equal(pickFastestRun(/** @type {any} */ (null)), undefined);
		assert.equal(pickFastestRun([run({ totalTime: NaN, verseTimes: [1] })]), undefined);
		assert.equal(pickFastestRun([run({ totalTime: 10, verseTimes: [] })]), undefined);
	});

	it('picks the lowest totalTime and breaks ties by earlier timestamp', () => {
		const slow = run({ totalTime: 20, verseTimes: [10, 10], timestamp: 1 });
		const fastEarly = run({ totalTime: 12, verseTimes: [5, 7], timestamp: 2 });
		const fastLate = run({ totalTime: 12, verseTimes: [6, 6], timestamp: 9 });
		assert.equal(pickFastestRun([slow, fastLate, fastEarly]), fastEarly);
	});
});

describe('bestVerseTime / sumThrough', () => {
	it('returns the lowest time for a verse index across runs', () => {
		const a = run({ totalTime: 11, verseTimes: [5, 6] });
		const b = run({ totalTime: 12, verseTimes: [4, 8] });
		assert.equal(bestVerseTime([a, b], 0), 4);
		assert.equal(bestVerseTime([a, b], 1), 6);
		assert.equal(bestVerseTime([a, b], 2), null);
	});

	it('sums through an index or returns null when data is missing', () => {
		assert.equal(sumThrough([1.5, 2, 3], 1), 3.5);
		assert.equal(sumThrough([1.5, 2], 2), null);
		assert.equal(sumThrough([1, NaN], 1), null);
	});
});

describe('comparePace', () => {
	const record = run({ totalTime: 10, verseTimes: [4, 6], timestamp: 1 });
	const other = run({ totalTime: 12, verseTimes: [3, 9], timestamp: 2 });

	it('returns null without current times or previous runs', () => {
		assert.equal(comparePace([], [record]), null);
		assert.equal(comparePace([4], []), null);
	});

	it('compares this verse to the local verse best and total to the chapter record', () => {
		// Verse 1 just finished in 3.5s. Verse PB is 3s (from `other`), so +0.5s.
		// Cumulative 3.5 vs record 4.0, so -0.5s ahead of the chapter record.
		const first = comparePace([3.5], [record, other]);
		assert.deepEqual(first, {
			verseIndex: 0,
			verseDelta: 0.5,
			cumulativeDelta: -0.5
		});

		// Verse 2 in 5.0s (PB 6s from record) and cumulative 8.5 vs record 10.
		const second = comparePace([3.5, 5], [record, other]);
		assert.deepEqual(second, {
			verseIndex: 1,
			verseDelta: -1,
			cumulativeDelta: -1.5
		});
	});

	it('omits a side when the record has no time for that verse', () => {
		const shortRecord = run({ totalTime: 4, verseTimes: [4] });
		const result = comparePace([4, 5], [shortRecord]);
		assert.equal(result && result.verseDelta, null);
		assert.equal(result && result.cumulativeDelta, null);
		assert.equal(result, null);
	});
});

describe('formatSignedSeconds / paceTone', () => {
	it('formats signed seconds to two decimals', () => {
		assert.equal(formatSignedSeconds(-0.421), '-0.42s');
		assert.equal(formatSignedSeconds(1.156), '+1.16s');
		assert.equal(formatSignedSeconds(0.001), '0.00s');
		assert.equal(formatSignedSeconds(null), '');
	});

	it('maps deltas to ahead / behind / even and Romanian labels', () => {
		assert.equal(paceTone(-0.02), 'ahead');
		assert.equal(paceTone(0.02), 'behind');
		assert.equal(paceTone(0.001), 'even');
		assert.equal(paceToneLabel('ahead'), 'înainte');
		assert.equal(paceToneLabel('behind'), 'în urmă');
		assert.equal(paceToneLabel('even'), 'egal');
	});
});
