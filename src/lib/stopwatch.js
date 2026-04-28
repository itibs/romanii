import { writable } from 'svelte/store';

const initialState = {
  hasStarted: false,
  elapsedTime: 0
};

export function createStopwatch() {
  let startTime = 0;
  let interval = 0;

  const state = writable({ ...initialState });

  function start() {
    startTime = new Date().getTime();
    clearInterval(interval);
    state.set({
      hasStarted: true,
      elapsedTime: 0
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

  function reset() {
    clearInterval(interval);
    startTime = 0;
    state.set({ ...initialState });
  }

  return {
    state,
    start,
    stop,
    reset
  };
}
