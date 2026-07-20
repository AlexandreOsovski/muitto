import { BaseReporter } from "./base.js";
import type { RunSummary } from "../types.js";
/**
 * Configuration options for the JUnit reporter
 *
 * @interface JunitReporterOptions
 *
 * @author alexandreosovski
 */
export interface JunitReporterOptions {
    /** If provided, writes the XML report to this file path instead of stdout */
    outputFile?: string;
    /** Name used for the root <testsuites> element. Default: "muitto" */
    suiteName?: string;
}
/**
 * Reporter that outputs results as a JUnit-compatible XML document
 *
 * One <testsuite> per test file, one <testcase> per test. Widely
 * supported by CI systems (GitHub Actions, GitLab, Jenkins, Azure
 * DevOps) for test result visualization.
 *
 * @class JunitReporter
 * @extends {BaseReporter}
 *
 * @example
 * const reporter = new JunitReporter({ outputFile: "./junit.xml" });
 * await runTests({ reporter });
 */
export declare class JunitReporter extends BaseReporter {
    name: string;
    private options;
    constructor(options?: JunitReporterOptions);
    /**
     * Called once at the end of the run; builds and emits the XML report
     *
     * @param {RunSummary} summary - Complete run summary
     */
    onEnd(summary: RunSummary): void;
    /**
     * Builds the full <testsuites> XML document
     *
     * @param {RunSummary} summary - Complete run summary
     * @returns {string} Full XML document as a string
     * @private
     */
    private buildXml;
    /**
     * Builds a single <testsuite> block for one test file
     *
     * If the file failed to even load (collectError), emits a single
     * synthetic failing testcase representing the load failure.
     *
     * @param {FileResult} file - Result of a single test file
     * @param {string} timestamp - ISO timestamp shared across the run
     * @returns {string} XML for this file's <testsuite>
     * @private
     */
    private buildFileSuite;
    /**
     * Builds a single <testcase> element for one test result
     *
     * @param {TestResult} result - Result of a single test
     * @param {string} filePath - Path of the file the test belongs to (used as classname)
     * @returns {string} XML for this test's <testcase>
     * @private
     */
    private buildTestCase;
    /** @private */
    private errorMessage;
    /** @private */
    private errorStack;
    /**
     * Escapes XML-reserved characters in a string
     *
     * @param {string} value - Raw text to escape
     * @returns {string} XML-safe text
     * @private
     */
    private escape;
}
//# sourceMappingURL=junit.d.ts.map