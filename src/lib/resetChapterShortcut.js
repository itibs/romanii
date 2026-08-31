/**
 * Ctrl+Space resets the current chapter.
 * Shift/Alt/Meta are excluded so the shortcut stays unambiguous.
 *
 * @param {KeyboardEvent} event
 */
export function isResetChapterShortcut(event) {
	if (!event.ctrlKey || event.altKey || event.metaKey || event.shiftKey || event.repeat) {
		return false;
	}

	return event.code === 'Space' || event.key === ' ';
}

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
