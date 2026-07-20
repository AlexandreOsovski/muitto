import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { __getRegistry } from "../index.js";
import { DefaultReporter } from "../reporters/default.js";
import { ResultCollector } from "./collector.js";
import { PerformanceTimer } from "./timer.js";
import { loadConfig, getTestFiles } from "../config/loader.js";
/** Regex pattern to identify test files (fallback) */
const DEFAULT_PATTERN = /\.(test|spec)\.(ts|js|mjs|cjs)$/;
/** Directories ignored during file discovery */
const IGNORED_DIRS = new Set([
    "node_modules", "dist", ".git", "coverage", "build", ".next", ".nuxt"
]);
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
export async function runTests(options = {}) {
    const cwd = process.cwd();
    // Load configuration from all sources
    const loadOptions = {
        files: options.files,
        pattern: options.pattern,
        testMatch: options.testMatch,
        timeout: options.timeout,
        reporter: options.reporter ? options.reporter.name : undefined,
        coverage: options.coverage,
        grep: options.grep || options.filter,
        bail: options.bail
    };
    const config = loadConfig(cwd, loadOptions);
    const reporter = options.reporter || new DefaultReporter();
    const collector = new ResultCollector();
    const timer = new PerformanceTimer();
    const timeoutMs = options.timeout ?? config.timeout ?? 5000;
    const filter = options.filter ?? options.grep ?? config.grep ?? "";
    // Get test files (auto-discovery or explicit)
    let files = options.files || [];
    if (files.length === 0) {
        files = getTestFiles(config, cwd);
    }
    else {
        // Resolve explicit file paths
        files = files.map(f => resolve(cwd, f));
    }
    // If no files found, show helpful message
    if (files.length === 0) {
        console.log('No test files found.');
        console.log('Looking for patterns:');
        config.pattern.forEach((p) => console.log(`  - ${p}`));
        process.exit(0);
    }
    collector.start();
    timer.start();
    // Notifies the reporter that execution is about to begin
    reporter.onStart?.(files.length);
    // Runs each test file sequentially
    for (const file of files) {
        reporter.onFileStart?.(file);
        const result = await runSingleFile(file, {
            timeoutMs,
            filter,
            reporter,
            bail: options.bail
        });
        collector.addFileResult(result);
        reporter.onFileEnd?.(result);
        // Bail mode: stops if a failure was found
        if (options.bail && result.results.some((r) => r.status === "failed")) {
            break;
        }
    }
    const summary = collector.getSummary();
    reporter.onEnd?.(summary);
    return summary;
}
/**
 * Runs a single test file in isolation
 *
 * Responsible for:
 * 1. Dynamically importing the test module (with cache busting)
 * 2. Extracting tests and hooks from the global registry
 * 3. Handling collection errors (syntax, import, etc)
 * 4. Running the file's tests
 *
 * @async
 * @param {string} filePath - Absolute path of the test file
 * @param {Object} options - Execution options
 * @param {number} options.timeoutMs - Timeout per test
 * @param {string} options.filter - Test name filter
 * @param {Reporter} options.reporter - Reporter instance
 * @param {boolean} [options.bail] - Whether to stop on first error
 * @returns {Promise<FileResult>} File execution result
 *
 * @example
 * const result = await runSingleFile('/tests/math.test.ts', {
 *   timeoutMs: 5000,
 *   filter: '',
 *   reporter: new DefaultReporter()
 * });
 */
async function runSingleFile(filePath, options) {
    const timer = new PerformanceTimer();
    timer.start();
    const fileUrl = pathToFileURL(resolve(filePath)).href;
    let tests = [];
    let hooksBySuiteKey = new Map();
    let collectError;
    try {
        /**
         * Imports the module with a unique query string to avoid module
         * caching between runs in watch mode
         */
        const moduleUrl = `${fileUrl}?t=${Date.now()}-${Math.random()}`;
        await import(moduleUrl);
        // Extracts tests and hooks from the global registry and clears for the next file
        const reg = __getRegistry();
        tests = reg.tests.splice(0, reg.tests.length).map((t) => ({ ...t, filePath }));
        hooksBySuiteKey = new Map(reg.hooksBySuiteKey);
        reg.hooksBySuiteKey.clear();
    }
    catch (err) {
        collectError = err;
    }
    // If there was a collection error, returns result with error
    if (collectError) {
        return {
            filePath,
            results: [],
            durationMs: timer.getDuration(),
            collectError,
        };
    }
    const results = await executeTests(tests, hooksBySuiteKey, options);
    return {
        filePath,
        results,
        durationMs: timer.getDuration(),
    };
}
/**
 * Runs the list of tests from a file with their lifecycle hooks
 *
 * Manages the complete execution flow including:
 * - Test filtering (by name or only flag)
 * - Execution of beforeAll/afterAll hooks per suite
 * - Execution of beforeEach/afterEach hooks per test
 * - Individual timeout control
 * - Skip and only logic
 * - Bail mode (stop on first error)
 *
 * @async
 * @param {TestCase[]} tests - List of tests to run
 * @param {Map<string, any>} hooksBySuiteKey - Map of hooks organized by suite key
 * @param {Object} options - Execution options
 * @param {number} options.timeoutMs - Timeout per test
 * @param {string} options.filter - Test name filter
 * @param {Reporter} options.reporter - Reporter instance
 * @param {boolean} [options.bail] - Whether to stop on first error
 * @returns {Promise<TestResult[]>} Array with each test's results
 *
 * @example
 * const results = await executeTests(tests, hooksMap, {
 *   timeoutMs: 5000,
 *   filter: 'auth',
 *   reporter: new DefaultReporter()
 * });
 */
async function executeTests(tests, hooksBySuiteKey, options) {
    /** Checks if there is any test with the only flag for exclusive mode */
    const hasOnly = tests.some((t) => t.only);
    const results = [];
    /** Controls which suites have already had beforeAll executed */
    const suitesRun = new Set();
    for (const test of tests) {
        // Applies name filter (on test or suite)
        if (options.filter &&
            !test.name.includes(options.filter) &&
            !test.suite.join(" > ").includes(options.filter)) {
            continue;
        }
        const suiteKey = test.suite.join(" > ");
        const hooks = hooksBySuiteKey.get(suiteKey);
        /**
         * Runs the suite's beforeAll the first time a test
         * from that suite is encountered. If beforeAll fails, marks the test
         * as failed and optionally stops in bail mode
         */
        if (hooks && !suitesRun.has(suiteKey)) {
            suitesRun.add(suiteKey);
            try {
                await runHookChain(hooks.beforeAll);
            }
            catch (err) {
                results.push({ test, status: "failed", durationMs: 0, error: err });
                if (options.bail)
                    return results;
                continue;
            }
        }
        /**
         * Skip logic:
         * - Test explicitly marked as skip
         * - Or there is a test with only and this one is not marked
         */
        if (test.skip || (hasOnly && !test.only)) {
            results.push({ test, status: "skipped", durationMs: 0 });
            continue;
        }
        // Runs the individual test
        options.reporter.onTestStart?.(test);
        const testTimer = new PerformanceTimer();
        testTimer.start();
        try {
            // Lifecycle: beforeEach -> test -> afterEach
            if (hooks)
                await runHookChain(hooks.beforeEach);
            await withTimeout(test.fn, options.timeoutMs);
            if (hooks)
                await runHookChain(hooks.afterEach);
            const result = {
                test,
                status: "passed",
                durationMs: testTimer.getDuration(),
            };
            results.push(result);
            options.reporter.onTestEnd?.(result);
        }
        catch (err) {
            const result = {
                test,
                status: "failed",
                durationMs: testTimer.getDuration(),
                error: err,
            };
            results.push(result);
            options.reporter.onTestEnd?.(result);
            // Bail mode: returns immediately on first error
            if (options.bail)
                return results;
        }
    }
    /**
     * Runs afterAll for all suites that were executed
     * Errors in afterAll don't fail the suite, they are just ignored
     */
    for (const key of suitesRun) {
        const hooks = hooksBySuiteKey.get(key);
        if (hooks) {
            try {
                await runHookChain(hooks.afterAll);
            }
            catch {
                // afterAll errors don't fail the suite
            }
        }
    }
    return results;
}
/**
 * Runs a chain of hooks sequentially
 *
 * Hooks are optional functions that run before/after tests or suites.
 * Each hook in the chain is executed in order and can be synchronous or asynchronous.
 *
 * @async
 * @param {Array<() => void | Promise<void>>} hooks - Array of hook functions
 * @returns {Promise<void>}
 *
 * @example
 * await runHookChain([
 *   async () => { await db.connect(); },
 *   () => { console.log('setup complete'); }
 * ]);
 */
async function runHookChain(hooks) {
    for (const hook of hooks) {
        await hook();
    }
}
/**
 * Runs a function with a timeout
 *
 * Creates a race between the function and a timer. If the function doesn't complete
 * within the specified time, the promise is rejected with a timeout error.
 *
 * @async
 * @param {() => void | Promise<void>} fn - Function to be executed with timeout
 * @param {number} ms - Maximum time in milliseconds
 * @returns {Promise<void>} Promise that resolves when the function completes or rejects on timeout
 *
 * @example
 * await withTimeout(async () => {
 *   await slowOperation();
 * }, 5000); // 5 second timeout
 */
function withTimeout(fn, ms) {
    return new Promise((resolve, reject) => {
        // Sets up timer that will reject the promise after the time limit
        const timer = setTimeout(() => {
            reject(new Error(`Test timeout: exceeded ${ms}ms`));
        }, ms);
        /**
         * Runs the function wrapped in Promise.resolve() to
         * ensure it works with both synchronous and asynchronous functions
         */
        Promise.resolve()
            .then(fn)
            .then(() => {
            clearTimeout(timer);
            resolve();
        })
            .catch((err) => {
            clearTimeout(timer);
            reject(err);
        });
    });
}
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
export function discoverTestFiles(root, pattern) {
    const found = [];
    /**
     * Internal recursive function to traverse directories
     *
     * @param {string} dir - Current directory being traversed
     */
    function walk(dir) {
        let entries;
        try {
            entries = readdirSync(dir);
        }
        catch {
            // Ignores directories without read permission
            return;
        }
        for (const entry of entries) {
            // Skips ignored directories
            if (IGNORED_DIRS.has(entry))
                continue;
            const fullPath = join(dir, entry);
            let stat;
            try {
                stat = statSync(fullPath);
            }
            catch {
                // Ignores inaccessible files (broken symlinks, permissions, etc)
                continue;
            }
            if (stat.isDirectory()) {
                walk(fullPath);
            }
            else if (stat.isFile() && pattern.test(entry)) {
                found.push(fullPath);
            }
        }
    }
    /**
     * List of common test directories to look for
     * Follows popular conventions from various frameworks and communities
     */
    const testDirs = ["test", "tests", "__tests__", "spec", "specs"];
    let foundTestDir = false;
    // Searches first in standardized test directories
    for (const dir of testDirs) {
        const fullPath = join(root, dir);
        try {
            if (statSync(fullPath).isDirectory()) {
                walk(fullPath);
                foundTestDir = true;
            }
        }
        catch {
            // Directory doesn't exist, continues to the next
        }
    }
    /**
     * If no standardized test directory was found,
     * performs recursive search from the root (useful for projects
     * that place tests alongside source code)
     */
    if (!foundTestDir) {
        walk(root);
    }
    // Returns sorted files for deterministic execution
    return found.sort();
}
//# sourceMappingURL=runner.js.map