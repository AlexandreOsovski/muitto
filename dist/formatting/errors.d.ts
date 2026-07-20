/**
 * Formats an error for friendly console display
 *
 * Supports specialized formatting for:
 * - AssertionError: shows expected vs received with diff
 * - Generic errors: shows name, message, and formatted stack trace
 * - Non-Error values: simple string conversion
 *
 * The stack trace is formatted with highlighting for test files
 * and dimming for internal framework files
 *
 * @param {unknown} error - Error to be formatted
 * @returns {string} Color-formatted representation of the error
 *
 * @example
 * // Assertion error
 * formatError(new AssertionError('Values differ', { expected: 1, received: 2 }))
 *
 * @example
 * // Generic error
 * formatError(new Error('Something went wrong'))
 *
 * @example
 * // Non-Error value
 * formatError('plain error string')
 *
 * @author alexandreosovski
 */
export declare function formatError(error: unknown): string;
/**
 * Formats a complete test failure for console display
 *
 * Generates complete output including:
 * - Header with test name and suite
 * - Formatted error message
 * - File and line location (if available)
 *
 * Ideal for use in failure reports and execution summaries
 *
 * @param {string} testName - Name of the failed test
 * @param {string} suiteName - Test suite name
 * @param {unknown} error - Error that caused the failure
 * @param {string} filePath - Path of the file where the test is located
 * @param {number} [line] - Line number where the failure occurred (optional)
 * @returns {string} Formatted representation of the test failure
 *
 * @example
 * formatTestFailure(
 *   'should validate email',
 *   'Auth > Login',
 *   new AssertionError('Invalid email'),
 *   '/tests/auth.test.ts',
 *   42
 * )
 * // FAIL Auth > Login > should validate email()
 * //
 * // Assertion Error:
 * // ...
 * //   at /tests/auth.test.ts:42
 */
export declare function formatTestFailure(testName: string, suiteName: string, error: unknown, filePath: string, line?: number): string;
//# sourceMappingURL=errors.d.ts.map