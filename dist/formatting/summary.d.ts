import type { RunSummary } from "../types.js";
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
export declare function formatSummary(summary: RunSummary): string;
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
export declare function printSummary(summary: RunSummary): void;
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
export declare function formatDuration(ms: number): string;
//# sourceMappingURL=summary.d.ts.map