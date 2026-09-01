/**
 * Ctrl+Backspace (Windows/Linux) or Cmd+Backspace (Mac) resets the current chapter.
 * Shift and Alt are excluded so the shortcut stays unambiguous.
 *
 * @param {KeyboardEvent} event
 */
export function isResetChapterShortcut(event) {
	const hasModifier = event.ctrlKey || event.metaKey;
	if (!hasModifier || event.altKey || event.shiftKey || event.repeat) {
		return false;
	}

	return event.code === 'Backspace' || event.key === 'Backspace';
}

export const RESET_CHAPTER_SHORTCUT_HINT = 'Ctrl+Backspace / Cmd+Backspace';

/**
 * @param {() => void} onReset
 * @returns {() => void} unsubscribe
 */
export function listenForResetChapterShortcut(onReset) {
	/** @param {KeyboardEvent} event */
	const onKeyDown = (event) => {
		if (!isResetChapterShortcut(event)) {
			return;
		}

		event.preventDefault();
		onReset();
	};

	window.addEventListener('keydown', onKeyDown, true);
	return () => window.removeEventListener('keydown', onKeyDown, true);
}
