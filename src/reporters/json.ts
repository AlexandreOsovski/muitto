import { writeFileSync } from "node:fs";
import { BaseReporter } from "./base.js";
import type { FileResult, RunSummary, TestResult } from "../types.js";

/**
 * Configuration options for the JSON reporter
 *
 * @interface JsonReporterOptions
 *
 * @author alexandreosovski
 */
export interface JsonReporterOptions {
  /** If provided, writes the report to this file path instead of stdout */
  outputFile?: string;
  /** Whether to pretty-print the JSON (2-space indent). Default: true */
  pretty?: boolean;
}

/** Shape of a single test result in the JSON report */
interface JsonTestResult {
  name: string;
  suite: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number;
  error?: {
    message: string;
    stack?: string;
  };
}

/** Shape of a single test file's results in the JSON report */
interface JsonFileResult {
  filePath: string;
  durationMs: number;
  collectError?: string;
  tests: JsonTestResult[];
}

/** Top-level shape of the JSON report, loosely modeled after Jest's --json output */
interface JsonReport {
  success: boolean;
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numSkippedTests: number;
  numTotalTestFiles: number;
  startTime: number;
  endTime: number;
  durationMs: number;
  testFiles: JsonFileResult[];
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
export class JsonReporter extends BaseReporter {
  name = "json";

  private options: JsonReporterOptions;

  constructor(options: JsonReporterOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Called once at the end of the run; builds and emits the JSON report
   *
   * @param {RunSummary} summary - Complete run summary
   */
  onEnd(summary: RunSummary): void {
    const report = this.buildReport(summary);
    const indent = this.options.pretty === false ? undefined : 2;
    const json = JSON.stringify(report, null, indent);

    if (this.options.outputFile) {
      writeFileSync(this.options.outputFile, json, "utf8");
      console.log(`JSON report written to ${this.options.outputFile}`);
    } else {
      console.log(json);
    }
  }

  /**
   * Converts the internal RunSummary into the public JSON report shape
   *
   * @param {RunSummary} summary - Complete run summary
   * @returns {JsonReport} Serializable report object
   * @private
   */
  private buildReport(summary: RunSummary): JsonReport {
    const testFiles: JsonFileResult[] = summary.files.map((file) =>
      this.buildFileResult(file)
    );

    return {
      success: summary.totalFailed === 0,
      numTotalTests:
        summary.totalPassed + summary.totalFailed + summary.totalSkipped,
      numPassedTests: summary.totalPassed,
      numFailedTests: summary.totalFailed,
      numSkippedTests: summary.totalSkipped,
      numTotalTestFiles: summary.files.length,
      startTime: summary.startTime ?? Date.now(),
      endTime: summary.endTime ?? Date.now(),
      durationMs: summary.durationMs,
      testFiles,
    };
  }

  /**
   * Converts a single FileResult into its JSON representation
   *
   * @param {FileResult} file - Result of a single test file
   * @returns {JsonFileResult} Serializable file result
   * @private
   */
  private buildFileResult(file: FileResult): JsonFileResult {
    return {
      filePath: file.filePath,
      durationMs: file.durationMs,
      collectError: file.collectError
        ? this.errorMessage(file.collectError)
        : undefined,
      tests: file.results.map((r) => this.buildTestResult(r)),
    };
  }

  /**
   * Converts a single TestResult into its JSON representation
   *
   * @param {TestResult} result - Result of a single test
   * @returns {JsonTestResult} Serializable test result
   * @private
   */
  private buildTestResult(result: TestResult): JsonTestResult {
    return {
      name: result.test.name,
      suite: result.test.suite.join(" > "),
      status: result.status,
      durationMs: result.durationMs,
      error: result.error
        ? {
            message: this.errorMessage(result.error),
            stack: this.errorStack(result.error),
          }
        : undefined,
    };
  }

  /** @private */
  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /** @private */
  private errorStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
  }
}
