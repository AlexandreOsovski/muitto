import type { RunOptions } from "../core/runner.js";
/**
 * Interface that extends run options with watch mode specific settings
 *
 * @interface WatchOptions
 * @extends {RunOptions}
 *
 * @author alexandreosovski
 */
interface WatchOptions extends RunOptions {
    /** Debounce time in milliseconds before re-running tests after a change */
    debounceMs?: number;
}
/**
 * Runs the test runner in watch mode, observing file changes
 * and re-running tests automatically
 *
 * Watch mode features:
 * - Recursively watches directories for file changes
 * - Smart debounce to avoid excessive runs
 * - Interactive interface with keyboard shortcuts
 * - Filtering of irrelevant files (node_modules, .git, dist)
 * - Support for multiple watch directories
 *
 * @async
 * @param {WatchOptions} options - Watch mode configuration options
 * @returns {Promise<void>}
 *
 * @example
 * await watchMode({
 *   files: ['./tests'],
 *   timeoutMs: 5000,
 *   debounceMs: 500
 * });
 */
export declare function watchMode(options: WatchOptions): Promise<void>;
export {};
//# sourceMappingURL=watch.d.ts.map