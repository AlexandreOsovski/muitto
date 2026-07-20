import { color, divider } from "../colors.js";
/**
 * Formats the test execution summary for console display
 *
 * Generates rich visual output including:
 * - Count of passed, failed, and skipped tests
 * - Test file statistics
 * - Detailed metrics by category
 * - Total execution duration
 * - Final status message with icons
 *
 * The format follows the style of popular test runners (Jest, Vitest)
 * with extensive use of colors and alignment for easier reading
 *
 * @param {RunSummary} summary - Complete test execution summary
 * @returns {string} Formatted string with the execution summary
 *
 * @example
 * const summary = await runTests(options);
 * console.log(formatSummary(summary));
 * //
 * // ─────────────────────────────────────────────
 * // ✓ PASS 8
 * // ○ SKIP 2
 * // ✗ FAIL 1
 * //
 * // Test Files  3 passed | 1 failed
 * // Tests       8 passed | 2 skipped | 1 failed
 * // Duration    2.34s
 * //
 * // ✖ Some tests failed
 */
export function formatSummary(summary) {
    const { totalPassed, totalFailed, totalSkipped, durationMs, files } = summary;
    const total = totalPassed + totalFailed + totalSkipped;
    const lines = [];
    // Top divider line to separate from test output
    lines.push("");
    lines.push(divider.light);
    lines.push("");
    /**
     * Main count with icons and colors
     * Each result type has its own icon and color:
     * ✓ PASS (green), ○ SKIP (yellow), ✗ FAIL (red)
     */
    if (totalPassed > 0) {
        lines.push(color.bold(color.green(`✓ PASS ${totalPassed}`)));
    }
    if (totalSkipped > 0) {
        lines.push(color.bold(color.yellow(`○ SKIP ${totalSkipped}`)));
    }
    if (totalFailed > 0) {
        lines.push(color.bold(color.red(`✗ FAIL ${totalFailed}`)));
    }
    lines.push("");
    /**
     * Test file details
     * Counts files that ran successfully vs files with collection errors
     */
    const passedFiles = files.filter((f) => !f.collectError).length;
    const failedFiles = files.filter((f) => f.collectError).length;
    const fileParts = [];
    if (passedFiles > 0) {
        fileParts.push(color.green(`${passedFiles} passed`));
    }
    if (failedFiles > 0) {
        fileParts.push(color.red(`${failedFiles} failed`));
    }
    lines.push(color.dim(`Test Files  ${fileParts.join(" | ")}`));
    /**
     * Individual test details
     * Separated by category: passed, skipped, failed
     * Uses the " | " separator between categories for visual consistency
     */
    const testParts = [];
    if (totalPassed > 0) {
        testParts.push(color.green(`${totalPassed} passed`));
    }
    if (totalSkipped > 0) {
        testParts.push(color.yellow(`${totalSkipped} skipped`));
    }
    if (totalFailed > 0) {
        testParts.push(color.red(`${totalFailed} failed`));
    }
    lines.push(color.dim(`Tests       ${testParts.join(" | ")}`));
    // Formatted total duration (e.g.: "2.34s", "523ms", "<1ms")
    lines.push(color.dim(`Duration    ${formatDuration(durationMs)}`));
    lines.push("");
    /**
     * Final status message with appropriate icon and color
     * - Failures: ✖ Some tests failed (red)
     * - No tests: ⚠ No tests found (yellow)
     * - Success: ✨ All tests passed (green)
     */
    if (totalFailed > 0) {
        lines.push(color.red(color.bold("✖ Some tests failed")));
    }
    else if (total === 0) {
        lines.push(color.yellow(color.bold("⚠ No tests found")));
    }
    else {
        lines.push(color.green(color.bold("✨ All tests passed")));
    }
    lines.push("");
    return lines.join("\n");
}
/**
 * Prints the formatted summary directly to the console
 *
 * Convenience function that combines formatSummary() with console.log()
 *
 * @param {RunSummary} summary - Complete test execution summary
 * @returns {void}
 *
 * @example
 * const summary = await runTests(options);
 * printSummary(summary);
 * // Equivalent to: console.log(formatSummary(summary));
 */
export function printSummary(summary) {
    console.log(formatSummary(summary));
}
/**
 * Formats a duration in milliseconds for friendly display
 *
 * Formatting scales:
 * - < 1ms: "<1ms" (extremely fast operations)
 * - < 1000ms: "523ms" (milliseconds, no decimal places)
 * - ≥ 1000ms: "1.52s" (seconds, with 2 decimal places)
 *
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration string
 *
 * @example
 * formatDuration(0.5);    // "<1ms"
 * formatDuration(523);    // "523ms"
 * formatDuration(1523);   // "1.52s"
 * formatDuration(5000);   // "5.00s"
 * formatDuration(60000);  // "60.00s"
 */
export function formatDuration(ms) {
    if (ms < 1)
        return "<1ms";
    if (ms < 1000)
        return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}
//# sourceMappingURL=summary.js.map