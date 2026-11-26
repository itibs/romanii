/**
 * Font size for the verse field so mobile browsers don't zoom it on focus.
 *
 * iOS Safari zooms a focused field whose CSS font-size is under 16px.
 * Android in desktop-site mode fits a wide layout onto the phone, then
 * zooms a field whose text is tiny on screen. 16px is the floor; anything
 * above that counters the shrink of a desktop layout on a small screen.
 *
 * @param {number} innerWidth Layout viewport width, in CSS pixels.
 * @param {number} screenWidth `screen.width`, in CSS pixels.
 * @param {number} [pinchScale] `visualViewport.scale` (1 when the user has not pinched).
 * @param {boolean} [coarsePhone] Touch phone with no hover, even if the UA is desktop.
 * @returns {number}
 */
export function controlFontSizePx(innerWidth, screenWidth, pinchScale = 1, coarsePhone = false) {
  const minPx = 16;
  const maxPx = 64;
  if (!(innerWidth > 0) || !(pinchScale > 0)) return minPx;

  let reference = screenWidth > 0 ? screenWidth : innerWidth;
  // Desktop-site mode sometimes reports a desktop screen width. A touch
  // phone showing a wide layout is still a phone; use a phone-sized reference.
  if (coarsePhone && innerWidth >= 800 && reference > innerWidth * 1.15) {
    reference = 400;
  }

  const effective = innerWidth / reference / pinchScale;
  if (!(effective > 1.05)) return minPx;
  return Math.min(maxPx, Math.max(minPx, Math.ceil(minPx * effective)));
}

/**
 * @returns {boolean}
 */
export function isCoarsePhone() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(pointer: coarse) and (hover: none)').matches;
}

/**
 * @param {boolean} [force] Update even while a field is focused.
 */
export function applyControlFontSize(force = false) {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const active = document.activeElement;
  if (!force && active instanceof HTMLElement && active.matches('input, textarea, select')) {
    return;
  }

  const pinch = window.visualViewport?.scale || 1;
  const size = controlFontSizePx(window.innerWidth, window.screen?.width || 0, pinch, isCoarsePhone());
  const next = size + 'px';
  const root = document.documentElement;
  if (root.style.getPropertyValue('--control-font-size') !== next) {
    root.style.setProperty('--control-font-size', next);
  }
  // A desktop layout fitted onto a phone. The field spans that layout so
  // the browser cannot zoom into a box narrower than the verse.
  root.toggleAttribute('data-overview-layout', size > 16);
}

/**
 * Keep the verse field's font large enough across rotation and pinch.
 * Skips updates while a field is focused so the keyboard animation
 * doesn't resize the control under the caret.
 * @returns {() => void}
 */
export function installControlFontSize() {
  applyControlFontSize(true);
  const onChange = () => applyControlFontSize(false);
  window.addEventListener('resize', onChange);
  window.visualViewport?.addEventListener('resize', onChange);
  return () => {
    window.removeEventListener('resize', onChange);
    window.visualViewport?.removeEventListener('resize', onChange);
  };
}
