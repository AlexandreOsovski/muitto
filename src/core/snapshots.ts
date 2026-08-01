/**
 * Disk-persisted snapshot store for MUITTO
 *
 * Single shared implementation used by both `expectSnapshot()` (index.ts)
 * and `expect(value).toMatchSnapshot()` (assert.ts), so snapshot testing
 * behaves like Jest/Vitest: values are compared against a `.snap` file
 * committed alongside the test file, not just against values seen earlier
 * in the same process. Without this, "snapshot testing" could only catch
 * regressions within a single run — never across commits or CI runs.
 *
 * @module core/snapshots
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, basename, join } from "node:path";

/**
 * In-memory state for a single test file's snapshot file
 *
 * @interface SnapshotFileState
 */
interface SnapshotFileState {
  /** Absolute path to the .snap file on disk */
  path: string;
  /** Snapshots as loaded from disk at the start of the run */
  stored: Map<string, string>;
  /** New or updated snapshots not yet flushed to disk */
  pending: Map<string, string>;
  /** Whether `pending` has changes that still need to be written */
  dirty: boolean;
}

/** One state entry per test file path */
const filesByTestPath = new Map<string, SnapshotFileState>();

/** Absolute path of the test file currently executing */
let currentTestFilePath = "";
/** Suite/test identity used to build a stable default snapshot name */
let currentTestId = "";
/** Resets to 0 every time setSnapshotContext() is called for a new test */
let autoCounter = 0;
/** Global --update-snapshots mode: overwrite instead of comparing */
let globalUpdateMode = false;

/**
 * Sets whether snapshots should be overwritten instead of compared
 * Driven by the CLI's --update-snapshots flag / config.updateSnapshots
 *
 * @param {boolean} update
 */
export function setUpdateMode(update: boolean): void {
  globalUpdateMode = update;
}

/**
 * Called by the runner immediately before executing each test, so
 * default (unnamed) snapshot keys are scoped to that specific test
 * instead of colliding across the whole file/process.
 *
 * @param {string} testFilePath - Absolute path of the file being executed
 * @param {string} testId - Stable identity for the current test (e.g. "Suite > test name")
 */
export function setSnapshotContext(testFilePath: string, testId: string): void {
  currentTestFilePath = testFilePath;
  currentTestId = testId;
  autoCounter = 0;
}

function snapshotFilePathFor(testFilePath: string): string {
  return join(dirname(testFilePath), "__snapshots__", `${basename(testFilePath)}.snap`);
}

function loadState(testFilePath: string): SnapshotFileState {
  const existing = filesByTestPath.get(testFilePath);
  if (existing) return existing;

  const snapPath = snapshotFilePathFor(testFilePath);
  const stored = new Map<string, string>();

  if (existsSync(snapPath)) {
    try {
      const raw = JSON.parse(readFileSync(snapPath, "utf-8"));
      for (const [key, value] of Object.entries(raw)) {
        if (typeof value === "string") stored.set(key, value);
      }
    } catch {
      // Corrupt/unreadable snapshot file: treat as empty, will be rewritten on next write
    }
  }

  const state: SnapshotFileState = { path: snapPath, stored, pending: new Map(), dirty: false };
  filesByTestPath.set(testFilePath, state);
  return state;
}

/** Result of comparing a value against its stored snapshot */
export interface SnapshotMatchResult {
  /** Whether the value matches the stored snapshot (or was just created) */
  pass: boolean;
  /** Previously stored serialized value, when the match failed */
  expected?: string;
  /** The snapshot key that was actually used (useful for error messages) */
  key: string;
}

/**
 * Compares a serialized value against its stored snapshot, creating it
 * on first run.
 *
 * @param {string} serialized - Pre-serialized representation of the value
 * @param {string} [name] - Explicit snapshot name (auto-generated if omitted)
 * @param {boolean} [forceUpdate] - Overwrite regardless of the global update mode
 * @returns {SnapshotMatchResult}
 */
export function matchSnapshot(serialized: string, name?: string, forceUpdate?: boolean): SnapshotMatchResult {
  const filePath = currentTestFilePath || "unknown";
  const state = loadState(filePath);
  const key = name || `${currentTestId} > ${++autoCounter}`;

  if (globalUpdateMode || forceUpdate) {
    state.pending.set(key, serialized);
    state.dirty = true;
    return { pass: true, key };
  }

  const existing = state.pending.has(key) ? state.pending.get(key) : state.stored.get(key);

  if (existing === undefined) {
    state.pending.set(key, serialized);
    state.dirty = true;
    return { pass: true, key };
  }

  if (existing === serialized) {
    return { pass: true, key };
  }

  return { pass: false, expected: existing, key };
}

/**
 * Writes any pending snapshot changes for a test file to disk.
 * Safe to call even when nothing changed (no-op).
 *
 * @param {string} testFilePath - Absolute path of the test file that just finished
 */
export function flushSnapshots(testFilePath: string): void {
  const state = filesByTestPath.get(testFilePath);
  if (!state || !state.dirty) return;

  const merged: Record<string, string> = {};
  for (const [key, value] of state.stored) merged[key] = value;
  for (const [key, value] of state.pending) merged[key] = value;

  mkdirSync(dirname(state.path), { recursive: true });
  writeFileSync(state.path, JSON.stringify(merged, null, 2) + "\n", "utf-8");

  state.stored = new Map(Object.entries(merged));
  state.pending.clear();
  state.dirty = false;
}
