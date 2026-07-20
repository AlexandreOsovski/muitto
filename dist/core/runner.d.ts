import type { RunSummary } from "../types.js";
import type { Reporter } from "../reporters/base.js";
import { type LoadOptions } from "../config/loader.js";
/**
 * Interface that defines the test execution options
 *
 * @interface RunOptions
 *
 * @author alexandreosovski
 */
export interface RunOptions extends Omit<LoadOptions, 'reporter'> {
    /** List of test file paths to run */
    files?: string[];
    /** Optional filter by test or suite name */
    filter?: string;
    /** Reporter instance for result output */
    reporter?: Reporter;
    /** If true, stops execution on the first failing test */
    bail?: boolean;
}
/**
 * Runs a complete test suite
 *
 * Main function of the test runner that coordinates the entire execution flow:
 * 1. Loads configuration from package.json and .muittorc.json
 * 2. Discovers test files automatically (if not specified)
 * 3. Initializes reporter and result collector
 * 4. Runs each test file sequentially
 * 5. Supports bail mode (stop on first error)
 * 6. Generates final results summary
 *
 * @async
 * @param {RunOptions} [options={}] - Execution configuration options
 * @returns {Promise<RunSummary>} Complete summary with execution metrics
 *
 * @example
 * // Auto-discovery with default config
 * const summary = await runTests();
 *
 * @example
 * // With custom options
 * const summary = await runTests({
 *   files: ['./tests/math.test.ts'],
 *   timeout: 10000,
 *   bail: true,
 *   reporter: new VerboseReporter()
 * });
 */
export declare function runTests(options?: RunOptions): Promise<RunSummary>;
/**
 * Recursively discovers test files in a directory
 *
 * Discovery algorithm:
 * 1. First looks for common test directories (test, tests, __tests__, spec, specs)
 * 2. If found, searches only within them
 * 3. If not found, searches recursively from the root
 * 4. Ignores common directories like node_modules, dist, .git, etc
 * 5. Filters files by the specified regex pattern
 *
 * @param {string} root - Root directory to start the search
 * @param {RegExp} pattern - Regex pattern to identify test files
 * @returns {string[]} Sorted array with absolute paths of found files
 *
 * @example
 * const files = discoverTestFiles('./src', /\.test\.ts$/);
 * // ['/project/src/utils.test.ts', '/project/src/api.test.ts']
 *
 * const allFiles = discoverTestFiles(process.cwd(), DEFAULT_PATTERN);
 */
export declare function discoverTestFiles(root: string, pattern: RegExp): string[];
//# sourceMappingURL=runner.d.ts.map