import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { chapters, portionLabel, verseRefs } from './verses_izbanda.js';

describe('1 și 2 Petru pentru Izbânda', () => {
	it('împarte cărțile pe porțiunile din schema de lectură', () => {
		assert.deepEqual(
			chapters['1 Petru'].map((portion) => portion.length),
			[25, 25, 28, 27]
		);
		assert.deepEqual(
			chapters['2 Petru'].map((portion) => portion.length),
			[21, 22, 18]
		);
	});

	it('pune câte o referință capitol:verset pentru fiecare verset', () => {
		for (const book of ['1 Petru', '2 Petru']) {
			assert.equal(verseRefs[book].length, chapters[book].length);
			chapters[book].forEach((portion, i) => {
				assert.equal(verseRefs[book][i].length, portion.length);
				for (const ref of verseRefs[book][i]) {
					assert.match(ref, /^\d+:\d+$/);
				}
			});
		}

		const crossing = verseRefs['1 Petru'][2];
		assert.equal(crossing[0], '3:1');
		assert.equal(crossing[21], '3:22');
		assert.equal(crossing[22], '4:1');
		assert.equal(crossing[27], '4:6');

		const closing = verseRefs['1 Petru'][3];
		assert.equal(closing[0], '4:7');
		assert.equal(closing[12], '4:19');
		assert.equal(closing[13], '5:1');
		assert.equal(closing[26], '5:14');

		assert.equal(verseRefs['2 Petru'][0][0], '1:1');
		assert.equal(verseRefs['2 Petru'][0][20], '1:21');
		assert.equal(verseRefs['2 Petru'][2][17], '3:18');
	});

	it('arată numărul capitolului când porțiunea este capitolul întreg', () => {
		assert.deepEqual(
			verseRefs['1 Petru'].map((refs, i) => portionLabel(refs, i + 1)),
			['1', '2', '3:1–4:6', '4:7–5:14']
		);
		assert.deepEqual(
			verseRefs['2 Petru'].map((refs, i) => portionLabel(refs, i + 1)),
			['1', '2', '3']
		);
		assert.equal(portionLabel(null, 4), '4');
	});

	it('ține textul corect la trecerea dintre capitole', () => {
		const crossing = chapters['1 Petru'][2];
		assert.match(crossing[0], /^Tot astfel, nevestelor/);
		assert.match(crossing[21], /^care stă la dreapta lui Dumnezeu/);
		assert.match(crossing[22], /^Astfel dar, fiindcă Hristos a pătimit/);
		assert.match(crossing[27], /^Căci tocmai în vederea aceasta/);

		const closing = chapters['1 Petru'][3];
		assert.match(closing[0], /^Sfârşitul tuturor lucrurilor/);
		assert.match(closing[12], /^Aşa că cei ce suferă/);
		assert.match(closing[13], /^Sfătuiesc pe prezbiterii/);
		assert.match(closing[26], /Pacea să fie cu voi/);

		assert.match(chapters['1 Petru'][0][0], /^Petru, apostol/);
		assert.match(chapters['1 Petru'][0][24], /^dar Cuvântul Domnului rămâne în veac/);
		assert.match(chapters['2 Petru'][0][0], /^Simon1 Petru/);
		assert.match(chapters['2 Petru'][2][17], /A Lui să fie slava acum şi în ziua veşniciei/);
	});

	it('nu schimbă cărțile care erau deja pentru Izbânda', () => {
		assert.deepEqual(
			Object.keys(chapters),
			['Galateni', 'Efeseni', 'Iacov', 'Predica de pe munte', '1 Petru', '2 Petru']
		);
		assert.equal(verseRefs['Galateni'], undefined);
		assert.equal(chapters['Galateni'].length, 6);
		assert.equal(chapters['Predica de pe munte'].length, 5);
	});
});
