import { writable } from 'svelte/store';

const initialState = {
  hasStarted: false,
  elapsedTime: 0,
  splits: /** @type {number[]} */ ([])
};

export function createStopwatch() {
  let startTime = 0;
  let interval = 0;
  let lastSplitElapsed = 0;

  const state = writable({ ...initialState, splits: [] });

  function start() {
    startTime = new Date().getTime();
    lastSplitElapsed = 0;
    clearInterval(interval);
    state.set({
      hasStarted: true,
      elapsedTime: 0,
      splits: []
    });

    interval = setInterval(() => {
      state.update((current) => ({
        ...current,
        elapsedTime: (new Date().getTime() - startTime) / 1000
      }));
    }, 100);
  }

  function stop() {
    const endTime = new Date().getTime();
    clearInterval(interval);
    state.update((current) => {
      if (!current.hasStarted) {
        return current;
      }

      return {
        ...current,
        elapsedTime: (endTime - startTime) / 1000
      };
    });
  }

  /**
   * Record a split. Returns the seconds elapsed since the previous split
   * (or since start, for the first split).
   * @returns {number}
   */
  function split() {
    if (startTime === 0) {
      return 0;
    }
    const now = new Date().getTime();
    const totalElapsed = (now - startTime) / 1000;
    const delta = Math.max(0, totalElapsed - lastSplitElapsed);
    lastSplitElapsed = totalElapsed;
    state.update((current) => ({
      ...current,
      elapsedTime: totalElapsed,
      splits: [...(current.splits || []), delta]
    }));
    return delta;
  }

  function reset() {
    clearInterval(interval);
    startTime = 0;
    lastSplitElapsed = 0;
    state.set({ ...initialState, splits: [] });
  }

  return {
    state,
    start,
    stop,
    split,
    reset
  };
}
