/**
 * Helpers for counting "typable" words in a verse — those are the ones the
 * user must actually type a letter for. Words made entirely of punctuation
 * are auto-skipped by VersesInput, so they should not be counted when
 * deriving words-per-minute statistics.
 */

const LETTER_RE = /[a-zăâțţșşî]/i;

/**
 * @param {string} word
 */
export function wordHasLetter(word) {
  if (typeof word !== 'string' || word.length === 0) return false;
  return LETTER_RE.test(word);
}

/**
 * Count the number of letter-containing words in a verse string.
 * @param {string} verse
 */
export function countWords(verse) {
  if (typeof verse !== 'string') return 0;
  return verse.split(' ').filter((w) => w.length > 0 && wordHasLetter(w)).length;
}
