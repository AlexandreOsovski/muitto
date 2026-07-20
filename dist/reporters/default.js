import { BaseReporter } from "./base.js";
import { color, symbols, divider } from "../colors.js";
import { formatTestFailure } from "../formatting/errors.js";
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
export class DefaultReporter extends BaseReporter {
    name = "default";
    /** Path of the currently executing file */
    currentFile = "";
    /** Threshold in ms to consider a test as slow */
    slowThreshold = 100;
    /** Last processed suite (to avoid repetitions) */
    lastSuite = "";
    /**
     * Called at the start of all test execution
     * Displays header with framework name and version
     *
     * @param {number} totalFiles - Total number of test files found
     */
    onStart(totalFiles) {
        console.log(color.bold(color.cyan("\nMUITTO v1.0.0")));
        console.log(color.dim(`Found ${totalFiles} test file(s)\n`));
    }
    /**
     * Called before running each test file
     * Displays the file's relative path for easier navigation
     *
     * @param {string} filePath - Absolute path of the test file
     */
    onFileStart(filePath) {
        this.currentFile = filePath;
        console.log(color.bold(color.blue(`\nRUN  ${this.relativePath(filePath)}`)));
    }
    /**
     * Called after running all tests in a file
     *
     * If there was a collection error (syntax, import), displays the error.
     * If there were test failures, displays each formatted failure
     * with full details using formatTestFailure.
     *
     * @param {FileResult} result - Complete result of the file execution
     */
    onFileEnd(result) {
        // Collection error prevents any test in the file from running
        if (result.collectError) {
            console.log(color.red(`\n${symbols.fail} Failed to load ${this.relativePath(result.filePath)}`));
            console.log(color.red(String(result.collectError)));
            return;
        }
        // Displays each failure with detailed formatting
        const failed = result.results.filter((r) => r.status === "failed");
        if (failed.length > 0) {
            console.log("");
            for (const failure of failed) {
                console.log(formatTestFailure(failure.test.name, failure.test.suite.join(" > "), failure.error, this.relativePath(failure.test.filePath)));
            }
        }
    }
    /**
     * Called before each individual test
     * In default mode, doesn't display anything to avoid visual pollution
     *
     * @param {TestCase} test - Definition of the test to be executed
     */
    onTestStart(test) {
        // Doesn't show anything in default mode to avoid clutter
    }
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
    onTestEnd(result) {
        const icon = this.getIcon(result.status);
        const name = result.test.name;
        const duration = result.durationMs;
        let line = `  ${icon} ${name}`;
        // Highlights slow tests in yellow with warning
        if (result.status === "passed" && duration > this.slowThreshold) {
            line += color.yellow(` ⚠ slow test (${duration.toFixed(0)}ms)`);
        }
        else if (result.status !== "skipped" && duration > 0) {
            // Shows normal duration in dim
            line += color.dim(` (${duration.toFixed(0)}ms)`);
        }
        // Skipped tests appear completely in dim
        if (result.status === "skipped") {
            line = color.dim(line);
        }
        console.log(line);
    }
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
    onEnd(summary) {
        console.log("");
        console.log(divider.light);
        console.log("");
        const { totalPassed, totalFailed, totalSkipped } = summary;
        // Main count with highlight
        if (totalPassed > 0) {
            console.log(color.bold(color.green(`PASS ${totalPassed}`)));
        }
        if (totalSkipped > 0) {
            console.log(color.bold(color.yellow(`SKIP ${totalSkipped}`)));
        }
        if (totalFailed > 0) {
            console.log(color.bold(color.red(`FAIL ${totalFailed}`)));
        }
        console.log("");
        /**
         * File-level stats: a file that threw a collectError never got to run
         * its tests, so it's reported as a failed file rather than "passed".
         */
        const passedFiles = summary.files.filter((f) => !f.collectError).length;
        const failedFiles = summary.files.filter((f) => f.collectError).length;
        const fileParts = [];
        if (passedFiles > 0)
            fileParts.push(`${passedFiles} passed`);
        if (failedFiles > 0)
            fileParts.push(`${failedFiles} failed`);
        console.log(color.dim(`Test Files  ${fileParts.join(" | ")}`));
        console.log(color.dim(`Tests       ${totalPassed} passed` +
            (totalSkipped > 0 ? ` | ${totalSkipped} skipped` : "") +
            (totalFailed > 0 ? ` | ${totalFailed} failed` : "")));
        console.log(color.dim(`Duration    ${this.formatDuration(summary.durationMs)}`));
        console.log("");
        // Final status message
        if (totalFailed > 0) {
            console.log(color.red(color.bold("✖ Some tests failed\n")));
        }
        else {
            console.log(color.green(color.bold("✨ All tests passed\n")));
        }
    }
    /**
     * Returns the icon corresponding to the test status
     *
     * @param {"passed" | "failed" | "skipped"} status - Test status
     * @returns {string} Corresponding icon (✓, ✗, ○)
     * @private
     */
    getIcon(status) {
        switch (status) {
            case "passed":
                return symbols.pass;
            case "failed":
                return symbols.fail;
            case "skipped":
                return symbols.skip;
        }
    }
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
    relativePath(filePath) {
        const cwd = process.cwd();
        return filePath.startsWith(cwd)
            ? filePath.slice(cwd.length + 1)
            : filePath;
    }
    /**
     * Formats duration in milliseconds for display
     *
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration (e.g.: "523ms", "1.52s")
     * @private
     */
    formatDuration(ms) {
        if (ms < 1000)
            return `${ms.toFixed(0)}ms`;
        return `${(ms / 1000).toFixed(2)}s`;
    }
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
export class DotReporter extends BaseReporter {
    name = "dot";
    /**
     * Displays a character for each executed test
     * Uses process.stdout.write for real-time output without line breaks
     *
     * @param {TestResult} result - Result of the executed test
     */
    onTestEnd(result) {
        switch (result.status) {
            case "passed":
                process.stdout.write(color.green("."));
                break;
            case "failed":
                process.stdout.write(color.red("F"));
                break;
            case "skipped":
                process.stdout.write(color.yellow("*"));
                break;
        }
    }
    /**
     * At the end, delegates the summary to DefaultReporter
     * maintaining consistency in the final presentation
     *
     * @param {RunSummary} summary - Complete execution summary
     */
    onEnd(summary) {
        console.log("\n");
        // Reuses the full DefaultReporter format for the summary
        new DefaultReporter().onEnd(summary);
    }
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
 */
export class VerboseReporter extends BaseReporter {
    name = "verbose";
    /**
     * Indicates that a test is being executed
     * Useful for identifying slow or stuck tests
     *
     * @param {TestCase} test - Test that will be executed
     */
    onTestStart(test) {
        console.log(color.dim(`  RUNS ${test.name}...`));
    }
}
//# sourceMappingURL=default.js.map