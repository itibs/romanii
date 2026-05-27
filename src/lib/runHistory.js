import { writable } from 'svelte/store';

const STORAGE_KEY = 'competitive-run-history-v1';
const MAX_RUNS_PER_ROUND = 200;

/**
 * @typedef {Object} Run
 * @property {string} id
 * @property {string} round
 * @property {number} timestamp - epoch ms when the run finished
 * @property {number} totalTime - total seconds for the run
 * @property {number[]} verseTimes - seconds spent on each verse, in order
 * @property {string[]} [verseLabels] - optional labels for each verse (e.g. verse refs / numbers)
 * @property {number[]} [verseWordCounts] - typable words per verse, used to derive words-per-minute stats
 */

const isBrowser = typeof window !== 'undefined' && typeof localStorage !== 'undefined';

/**
 * @returns {Record<string, Run[]>}
 */
function readAll() {
  if (!isBrowser) return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed;
  } catch (e) {
    console.warn('Failed to read run history from localStorage', e);
    return {};
  }
}

/**
 * @param {Record<string, Run[]>} data
 */
function writeAll(data) {
  if (!isBrowser) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to write run history to localStorage', e);
  }
}

/** Reactive store reflecting the current full history. */
export const runHistoryStore = writable(readAll());

function refreshStore() {
  runHistoryStore.set(readAll());
}

function generateId() {
  return (
    Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8)
  );
}

/**
 * @param {string} round
 * @returns {Run[]}
 */
export function getRuns(round) {
  const all = readAll();
  const runs = all[round] || [];
  return [...runs].sort((a, b) => b.timestamp - a.timestamp);
}

/**
 * @param {Omit<Run, 'id' | 'timestamp'> & { timestamp?: number; id?: string }} run
 * @returns {Run | undefined}
 */
export function saveRun(run) {
  if (!isBrowser) return undefined;
  if (!run || !run.round) return undefined;
  if (!Array.isArray(run.verseTimes) || run.verseTimes.length === 0) return undefined;

  const all = readAll();
  const list = all[run.round] || [];

  /** @type {Run} */
  const stored = {
    id: run.id || generateId(),
    round: run.round,
    timestamp: run.timestamp || Date.now(),
    totalTime: run.totalTime,
    verseTimes: run.verseTimes.map((t) => Math.max(0, Number(t) || 0)),
    verseLabels: run.verseLabels ? [...run.verseLabels] : undefined,
    verseWordCounts: run.verseWordCounts ? run.verseWordCounts.map((n) => Math.max(0, Number(n) || 0)) : undefined
  };

  list.push(stored);
  list.sort((a, b) => b.timestamp - a.timestamp);
  if (list.length > MAX_RUNS_PER_ROUND) {
    list.length = MAX_RUNS_PER_ROUND;
  }

  all[run.round] = list;
  writeAll(all);
  refreshStore();
  return stored;
}

/**
 * @param {string} round
 * @param {string} runId
 */
export function deleteRun(round, runId) {
  const all = readAll();
  const list = all[round];
  if (!list) return;
  const next = list.filter((r) => r.id !== runId);
  if (next.length === list.length) return;
  if (next.length === 0) {
    delete all[round];
  } else {
    all[round] = next;
  }
  writeAll(all);
  refreshStore();
}

/**
 * @param {string} round
 */
export function clearRound(round) {
  const all = readAll();
  if (!(round in all)) return;
  delete all[round];
  writeAll(all);
  refreshStore();
}

/**
 * Format an epoch ms timestamp as a short, locale-aware string.
 * @param {number} ts
 */
export function formatTimestamp(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch (e) {
    return String(ts);
  }
}
