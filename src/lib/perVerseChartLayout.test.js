import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
	BAR_SLOT_PAD,
	BAR_SLOT_WIDTH,
	CHART_WIDTH,
	MARGIN,
	axisLabelsFor,
	barWidth,
	barX,
	displayLabel,
	innerSize,
	selectXLabelIndices,
	xCenter,
	xStep
} from './perVerseChartLayout.js';

describe('per-verse chart layout', () => {
	const { innerW } = innerSize();

	it('places each label at the horizontal center of its bar', () => {
		for (const count of [1, 8, 12, 13, 14, 28, 39, 51]) {
			const step = xStep(count, innerW);
			for (let i = 0; i < count; i++) {
				const labelX = xCenter(i, MARGIN.left, step);
				const barCenter = barX(i, MARGIN.left, step) + barWidth(step) / 2;
				assert.ok(
					Math.abs(labelX - barCenter) < 1e-9,
					`verse ${i + 1}/${count}: label x=${labelX} bar center=${barCenter}`
				);
			}
		}
	});

	it('keeps bars inside the plot (padding + width = one slot)', () => {
		assert.equal(BAR_SLOT_PAD * 2 + BAR_SLOT_WIDTH, 1);
		const step = xStep(20, innerW);
		assert.equal(barX(0, MARGIN.left, step), MARGIN.left + step * BAR_SLOT_PAD);
		assert.ok(barX(19, MARGIN.left, step) + barWidth(step) <= MARGIN.left + innerW + 1e-9);
	});

	it('shows every verse number when they fit under the bars', () => {
		const labels = Array.from({ length: 8 }, (_, i) => String(i + 1));
		assert.deepEqual(selectXLabelIndices(8, innerW, labels), [0, 1, 2, 3, 4, 5, 6, 7]);
	});

	it('thins labels on long chapters instead of stacking them on the y-axis', () => {
		const labels = Array.from({ length: 39 }, (_, i) => String(i + 1));
		const idxs = selectXLabelIndices(39, innerW, labels);
		assert.equal(idxs[0], 0);
		assert.equal(idxs[idxs.length - 1], 38);
		assert.ok(idxs.length < 39);
		assert.ok(idxs.length >= 2);
		for (let i = 1; i < idxs.length; i++) {
			assert.ok(idxs[i] > idxs[i - 1]);
		}
	});

	it('thins long biblical refs so they cannot overflow into the y-axis', () => {
		const labels = [
			'Psalmul 73:25',
			'Psalmul 73:28',
			'2 Cronici 16:9a',
			'Filipeni 3:8',
			'1 Timotei 1:12',
			'Isaia 55:6',
			'Isaia 55:7',
			'Evrei 11:26',
			'Ioan 9:31',
			'Ioan 9:39',
			'Romani 1:21',
			'1 Ioan 5:1',
			'Psalmul 27:4'
		];
		const idxs = selectXLabelIndices(labels.length, innerW, labels);
		assert.equal(idxs[0], 0);
		assert.equal(idxs[idxs.length - 1], labels.length - 1);
		assert.ok(idxs.length < labels.length);
	});

	it('uses the run’s stored labels so a chapter change cannot mis-pair numbers', () => {
		const run = { verseLabels: ['10', '11', '12'] };
		assert.deepEqual(axisLabelsFor(3, run, ['1', '2', '3']), ['10', '11', '12']);
		assert.deepEqual(axisLabelsFor(3, null, ['1', '2', '3']), ['1', '2', '3']);
		assert.deepEqual(axisLabelsFor(4, run, []), ['10', '11', '12', '4']);
	});

	it('truncates overlong tick text', () => {
		assert.equal(displayLabel('Psalmul 73:25', 8), 'Psalmul…');
		assert.equal(displayLabel('12', 8), '12');
	});

	it('fits the default chart width', () => {
		assert.equal(MARGIN.left + innerW + MARGIN.right, CHART_WIDTH);
	});
});
