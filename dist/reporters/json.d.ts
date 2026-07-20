import { BaseReporter } from "./base.js";
import type { RunSummary } from "../types.js";
/**
 * Configuration options for the JSON reporter
 *
 * @interface JsonReporterOptions
 */
export interface JsonReporterOptions {
    /** If provided, writes the report to this file path instead of stdout */
    outputFile?: string;
    /** Whether to pretty-print the JSON (2-space indent). Default: true */
    pretty?: boolean;
}
/**
 * Reporter that outputs the full run summary as a single JSON document
 *
 * Useful for CI pipelines, custom tooling, or piping results into
 * other programs. Writes to stdout by default, or to a file when
 * `outputFile` is provided.
 *
 * @class JsonReporter
 * @extends {BaseReporter}
 *
 * @example
 * const reporter = new JsonReporter({ outputFile: "./report.json" });
 * await runTests({ reporter });
 */
export declare class JsonReporter extends BaseReporter {
    name: string;
    private options;
    constructor(options?: JsonReporterOptions);
    /**
     * Called once at the end of the run; builds and emits the JSON report
     *
     * @param {RunSummary} summary - Complete run summary
     */
    onEnd(summary: RunSummary): void;
    /**
     * Converts the internal RunSummary into the public JSON report shape
     *
     * @param {RunSummary} summary - Complete run summary
     * @returns {JsonReport} Serializable report object
     * @private
     */
    private buildReport;
    /**
     * Converts a single FileResult into its JSON representation
     *
     * @param {FileResult} file - Result of a single test file
     * @returns {JsonFileResult} Serializable file result
     * @private
     */
    private buildFileResult;
    /**
     * Converts a single TestResult into its JSON representation
     *
     * @param {TestResult} result - Result of a single test
     * @returns {JsonTestResult} Serializable test result
     * @private
     */
    private buildTestResult;
    /** @private */
    private errorMessage;
    /** @private */
    private errorStack;
}
//# sourceMappingURL=json.d.ts.map