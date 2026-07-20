import { BaseReporter } from "./base.js";
import type { TestCase, TestResult, FileResult, RunSummary } from "../types.js";
/**
 * Default reporter with detailed and hierarchical output
 *
 * Provides rich and informative output during test execution:
 * - Shows each file being executed
 * - Displays individual test results with icons
 * - Highlights slow tests (above 100ms by default)
 * - Displays detailed failures with full formatting
 * - Final summary with consolidated statistics
 *
 * Ideal for normal runs where you want to track
 * detailed test progress
 *
 * @class DefaultReporter
 * @extends {BaseReporter}
 *
 * @example
 * const reporter = new DefaultReporter();
 * await runTests({ reporter });
 */
export declare class DefaultReporter extends BaseReporter {
    name: string;
    /** Path of the currently executing file */
    private currentFile;
    /** Threshold in ms to consider a test as slow */
    private slowThreshold;
    /** Last processed suite (to avoid repetitions) */
    private lastSuite;
    /**
     * Called at the start of all test execution
     * Displays header with framework name and version
     *
     * @param {number} totalFiles - Total number of test files found
     */
    onStart(totalFiles: number): void;
    /**
     * Called before running each test file
     * Displays the file's relative path for easier navigation
     *
     * @param {string} filePath - Absolute path of the test file
     */
    onFileStart(filePath: string): void;
    /**
     * Called after running all tests in a file
     *
     * If there was a collection error (syntax, import), displays the error.
     * If there were test failures, displays each formatted failure
     * with full details using formatTestFailure.
     *
     * @param {FileResult} result - Complete result of the file execution
     */
    onFileEnd(result: FileResult): void;
    /**
     * Called before each individual test
     * In default mode, doesn't display anything to avoid visual pollution
     *
     * @param {TestCase} test - Definition of the test to be executed
     */
    onTestStart(test: TestCase): void;
    /**
     * Called after each individual test
     *
     * Displays a line with:
     * - Status icon (✓/✗/○)
     * - Test name
     * - Duration (with yellow highlight for slow tests)
     * - Skipped tests in dim
     *
     * @param {TestResult} result - Test execution result
     */
    onTestEnd(result: TestResult): void;
    /**
     * Called at the end of all test execution
     *
     * Displays complete summary with:
     * - Test count by status
     * - File statistics (passed vs failed-to-load, mirroring summary.ts)
     * - Total duration
     * - Final status message
     *
     * @param {RunSummary} summary - Complete execution summary
     */
    onEnd(summary: RunSummary): void;
    /**
     * Returns the icon corresponding to the test status
     *
     * @param {"passed" | "failed" | "skipped"} status - Test status
     * @returns {string} Corresponding icon (✓, ✗, ○)
     * @private
     */
    private getIcon;
    /**
     * Converts absolute path to relative (relative to CWD)
     *
     * Makes reading easier by removing the working directory prefix
     *
     * @param {string} filePath - Absolute file path
     * @returns {string} Path relative to current directory
     * @private
     *
     * @example
     * reporter.relativePath('/home/user/project/tests/auth.test.ts')
     * // Returns: 'tests/auth.test.ts' (if CWD is /home/user/project)
     */
    private relativePath;
    /**
     * Formats duration in milliseconds for display
     *
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration (e.g.: "523ms", "1.52s")
     * @private
     */
    private formatDuration;
}
/**
 * Minimalist "dot" style reporter
 *
 * Inspired by classic test runner style, shows:
 * - A green dot (.) for each passing test
 * - A red F for each failure
 * - A yellow asterisk (*) for skipped tests
 *
 * Ideal for large suites where you want a compact
 * view of progress, without visual pollution.
 * The final summary is the same as DefaultReporter.
 *
 * @class DotReporter
 * @extends {BaseReporter}
 *
 * @example
 * const reporter = new DotReporter();
 * await runTests({ reporter });
 * // Output: "....F..*..." (each character appears in real time)
 */
export declare class DotReporter extends BaseReporter {
    name: string;
    /**
     * Displays a character for each executed test
     * Uses process.stdout.write for real-time output without line breaks
     *
     * @param {TestResult} result - Result of the executed test
     */
    onTestEnd(result: TestResult): void;
    /**
     * At the end, delegates the summary to DefaultReporter
     * maintaining consistency in the final presentation
     *
     * @param {RunSummary} summary - Complete execution summary
     */
    onEnd(summary: RunSummary): void;
}
/**
 * Detailed reporter that shows information for each test
 *
 * Provides verbose output including:
 * - Indication of each test start (RUNS)
 * - Detailed result of each test
 * - Grouping by suite
 * - All DefaultReporter information
 *
 * Ideal for debugging or when you need to track
 * exactly what is being executed
 *
 * @class VerboseReporter
 * @extends {BaseReporter}
 *
 * @example
 * const reporter = new VerboseReporter();
 * await runTests({ reporter });
 * // Shows each test starting and its result
 *
 * @author alexandreosovski
 */
export declare class VerboseReporter extends BaseReporter {
    name: string;
    /**
     * Indicates that a test is being executed
     * Useful for identifying slow or stuck tests
     *
     * @param {TestCase} test - Test that will be executed
     */
    onTestStart(test: TestCase): void;
    /**
     * Called after each individual test
     * Shows detailed result for each test
     *
     * @param {TestResult} result - Test execution result
     */
    onTestEnd(result: TestResult): void;
    /**
     * Returns the icon corresponding to the test status
     *
     * @param {"passed" | "failed" | "skipped"} status - Test status
     * @returns {string} Corresponding icon (✓, ✗, ○)
     * @private
     */
    private getIcon;
    /**
     * At the end, delegates the summary to DefaultReporter
     * maintaining consistency in the final presentation
     *
     * @param {RunSummary} summary - Complete execution summary
     */
    onEnd(summary: RunSummary): void;
}
//# sourceMappingURL=default.d.ts.map