import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { controlFontSizePx } from './inputZoom.js';

describe('controlFontSizePx', () => {
  it('stays at 16px on a phone, a desktop, and a zoomed-in page', () => {
    assert.equal(controlFontSizePx(390, 390, 1, true), 16);
    assert.equal(controlFontSizePx(1440, 1440, 1, false), 16);
    assert.equal(controlFontSizePx(800, 1440, 1, false), 16);
    assert.equal(controlFontSizePx(980, 390, 2.6, true), 16);
  });

  it('grows the field when a desktop layout is fitted onto a phone', () => {
    assert.equal(controlFontSizePx(980, 390, 1, true), 41);
    assert.equal(controlFontSizePx(980, 1920, 1, true), 40);
  });

  it('does not treat a wide touch tablet as a shrunken phone', () => {
    assert.equal(controlFontSizePx(1024, 1024, 1, true), 16);
    assert.equal(controlFontSizePx(980, 1920, 1, false), 16);
  });

  it('never goes under 16px or over 64px', () => {
    assert.equal(controlFontSizePx(0, 0, 1, false), 16);
    assert.equal(controlFontSizePx(390, 390, 0, true), 16);
    assert.equal(controlFontSizePx(4000, 320, 1, true), 64);
  });
});
