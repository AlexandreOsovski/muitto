/**
 * Test execution results collector
 *
 * Responsible for aggregating and summarizing the results of all test
 * files during a run, providing consolidated metrics such as
 * total passed, failed, and skipped tests.
 *
 * @class ResultCollector
 *
 * @example
 * const collector = new ResultCollector();
 * collector.start();
 * collector.addFileResult(fileResult1);
 * collector.addFileResult(fileResult2);
 * const summary = collector.getSummary();
 * console.log(`${summary.totalPassed} tests passed`);
 */
export class ResultCollector {
    /** List of results per test file */
    fileResults = [];
    /** Timestamp of when the run started */
    startTime = 0;
    /**
     * Starts a new results collection
     *
     * Resets the internal state, clearing previous results
     * and recording the execution start time
     *
     * @returns {void}
     *
     * @example
     * collector.start();
     * // Run the tests...
     * const summary = collector.getSummary();
     */
    start() {
        this.startTime = Date.now();
        this.fileResults = [];
    }
    /**
     * Adds a test file result to the collector
     *
     * @param {FileResult} result - Result from running a test file
     * @returns {void}
     *
     * @example
     * const fileResult = {
     *   filePath: '/tests/math.test.ts',
     *   results: [
     *     { status: 'passed', test: {...} },
     *     { status: 'failed', test: {...}, error: new Error() }
     *   ]
     * };
     * collector.addFileResult(fileResult);
     */
    addFileResult(result) {
        this.fileResults.push(result);
    }
    /**
     * Generates a consolidated summary of all collected results
     *
     * Calculates total metrics including:
     * - Total passed tests
     * - Total failed tests (including file collection errors)
     * - Total skipped tests
     * - Total execution duration
     * - Start and end timestamps
     *
     * @returns {RunSummary} Object with the complete run summary
     *
     * @example
     * const summary = collector.getSummary();
     * // {
     * //   files: [...],
     * //   totalPassed: 10,
     * //   totalFailed: 2,
     * //   totalSkipped: 1,
     * //   durationMs: 1234,
     * //   startTime: 1234567890000,
     * //   endTime: 1234567891234
     * // }
     */
    getSummary() {
        /**
         * Counts passed tests
         * Iterates through all results from all files
         */
        const totalPassed = this.fileResults
            .flatMap((f) => f.results)
            .filter((r) => r.status === "passed").length;
        /**
         * Counts failed tests
         * Includes both individual test failures and
         * file collection errors (collectError)
         */
        const totalFailed = this.fileResults
            .flatMap((f) => f.results)
            .filter((r) => r.status === "failed").length +
            this.fileResults.filter((f) => f.collectError).length;
        /**
         * Counts skipped tests
         * Tests that were intentionally skipped during execution
         */
        const totalSkipped = this.fileResults
            .flatMap((f) => f.results)
            .filter((r) => r.status === "skipped").length;
        return {
            files: this.fileResults,
            totalPassed,
            totalFailed,
            totalSkipped,
            durationMs: Date.now() - this.startTime,
            startTime: this.startTime,
            endTime: Date.now(),
        };
    }
    /**
     * Returns all file results collected so far
     *
     * Useful for inspection or incremental processing of results
     * during execution, without generating a complete summary
     *
     * @returns {FileResult[]} Array with the results of each file
     *
     * @example
     * const fileResults = collector.getFileResults();
     * fileResults.forEach(file => {
     *   console.log(`${file.filePath}: ${file.results.length} tests`);
     * });
     */
    getFileResults() {
        return this.fileResults;
    }
}
//# sourceMappingURL=collector.js.map