import { writeFileSync } from "node:fs";
import { BaseReporter } from "./base.js";
import type { FileResult, RunSummary, TestResult } from "../types.js";

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
export class JunitReporter extends BaseReporter {
  name = "junit";

  private options: JunitReporterOptions;

  constructor(options: JunitReporterOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * Called once at the end of the run; builds and emits the XML report
   *
   * @param {RunSummary} summary - Complete run summary
   */
  onEnd(summary: RunSummary): void {
    const xml = this.buildXml(summary);

    if (this.options.outputFile) {
      writeFileSync(this.options.outputFile, xml, "utf8");
      console.log(`JUnit report written to ${this.options.outputFile}`);
    } else {
      console.log(xml);
    }
  }

  /**
   * Builds the full <testsuites> XML document
   *
   * @param {RunSummary} summary - Complete run summary
   * @returns {string} Full XML document as a string
   * @private
   */
  private buildXml(summary: RunSummary): string {
    const suiteName = this.options.suiteName ?? "muitto";
    const total =
      summary.totalPassed + summary.totalFailed + summary.totalSkipped;
    const timestamp = new Date(summary.startTime ?? Date.now()).toISOString();

    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    lines.push(
      `<testsuites name="${this.escape(suiteName)}" tests="${total}" ` +
        `failures="${summary.totalFailed}" skipped="${summary.totalSkipped}" ` +
        `time="${(summary.durationMs / 1000).toFixed(3)}">`
    );

    for (const file of summary.files) {
      lines.push(this.buildFileSuite(file, timestamp));
    }

    lines.push("</testsuites>");
    return lines.join("\n");
  }

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
  private buildFileSuite(file: FileResult, timestamp: string): string {
    const lines: string[] = [];
    const total = file.results.length;
    const failed = file.results.filter((r) => r.status === "failed").length;
    const skipped = file.results.filter((r) => r.status === "skipped").length;
    const durationSec = (file.durationMs / 1000).toFixed(3);

    const testsAttr = file.collectError ? 1 : total;
    const failuresAttr = file.collectError ? 1 : failed;

    lines.push(
      `  <testsuite name="${this.escape(file.filePath)}" tests="${testsAttr}" ` +
        `failures="${failuresAttr}" skipped="${skipped}" time="${durationSec}" ` +
        `timestamp="${timestamp}">`
    );

    if (file.collectError) {
      const message = this.errorMessage(file.collectError);
      lines.push(
        `    <testcase name="collect error" classname="${this.escape(
          file.filePath
        )}">`
      );
      lines.push(`      <failure message="${this.escape(message)}">`);
      lines.push(this.escape(message));
      lines.push("      </failure>");
      lines.push("    </testcase>");
    } else {
      for (const result of file.results) {
        lines.push(this.buildTestCase(result, file.filePath));
      }
    }

    lines.push("  </testsuite>");
    return lines.join("\n");
  }

  /**
   * Builds a single <testcase> element for one test result
   *
   * @param {TestResult} result - Result of a single test
   * @param {string} filePath - Path of the file the test belongs to (used as classname)
   * @returns {string} XML for this test's <testcase>
   * @private
   */
  private buildTestCase(result: TestResult, filePath: string): string {
    const name = [...result.test.suite, result.test.name].join(" > ");
    const timeSec = (result.durationMs / 1000).toFixed(3);
    const classname = this.escape(filePath);
    const escapedName = this.escape(name);

    if (result.status === "passed") {
      return `    <testcase name="${escapedName}" classname="${classname}" time="${timeSec}" />`;
    }

    if (result.status === "skipped") {
      return (
        `    <testcase name="${escapedName}" classname="${classname}" time="${timeSec}">\n` +
        `      <skipped />\n` +
        `    </testcase>`
      );
    }

    const message = this.errorMessage(result.error);
    const stack = this.errorStack(result.error);

    return [
      `    <testcase name="${escapedName}" classname="${classname}" time="${timeSec}">`,
      `      <failure message="${this.escape(message)}">`,
      this.escape(stack ?? message),
      "      </failure>",
      "    </testcase>",
    ].join("\n");
  }

  /** @private */
  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /** @private */
  private errorStack(error: unknown): string | undefined {
    return error instanceof Error ? error.stack : undefined;
  }

  /**
   * Escapes XML-reserved characters in a string
   *
   * @param {string} value - Raw text to escape
   * @returns {string} XML-safe text
   * @private
   */
  private escape(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");
  }
}
