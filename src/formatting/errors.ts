import { color } from "../colors.js";
import { generateDiff } from "./diff.js";
import { AssertionError } from "../assert.js";

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
export function formatError(error: unknown): string {
  // Non-Error values are converted directly
  if (!(error instanceof Error)) {
    return color.red(String(error));
  }

  // Special handling for assertion errors
  if (error instanceof AssertionError) {
    return formatAssertionError(error);
  }

  const parts: string[] = [];

  // Error name in bold + message
  parts.push(color.red(color.bold(`${error.name}:`)) + " " + error.message);

  // Formats stack trace if available
  if (error.stack) {
    // Removes the first line (error message) and formats the rest
    const stackLines = error.stack.split("\n").slice(1);
    const formattedStack = stackLines
      .map((line) => {
        const trimmed = line.trim();
        /**
         * Highlights test files in cyan to make it easier
         * to identify where the error occurred
         */
        if (trimmed.includes(".test.") || trimmed.includes(".spec.")) {
          return color.cyan("  at " + trimmed.replace(/^at\s+/, ""));
        }
        // Internal framework files in dim
        return color.dim("  at " + trimmed.replace(/^at\s+/, ""));
      })
      .join("\n");

    if (formattedStack) {
      parts.push(formattedStack);
    }
  }

  return parts.join("\n");
}

/**
 * Formats an AssertionError with detailed expected vs received display
 *
 * Generates rich output including:
 * - "Assertion Error" header
 * - Expected value (in green)
 * - Received value (in red)
 * - Visual diff for complex objects/arrays
 * - Descriptive error message
 *
 * @param {AssertionError} error - Assertion error with expected and received
 * @returns {string} Formatted string with assertion details
 *
 * @example
 * const error = new AssertionError('Objects differ', {
 *   expected: { name: "John" },
 *   received: { name: "Jane" }
 * });
 * console.log(formatAssertionError(error));
 * // Assertion Error:
 * // Expected:
 * //   { "name": "John" }
 * // Received:
 * //   { "name": "Jane" }
 * // Diff:
 * // - "John"
 * // + "Jane"
 */
function formatAssertionError(error: AssertionError): string {
  const parts: string[] = [];

  parts.push(color.red(color.bold("Assertion Error:")));
  parts.push("");

  // Shows expected and received if available
  if (error.expected !== undefined || error.received !== undefined) {
    parts.push(color.bold("Expected:"));
    parts.push(color.green("  " + stringify(error.expected)));
    parts.push("");
    parts.push(color.bold("Received:"));
    parts.push(color.red("  " + stringify(error.received)));
    parts.push("");

    /**
     * Generates visual diff only when both are non-null objects/arrays
     * The diff shows exactly which properties/elements differ
     */
    if (
      typeof error.expected === "object" &&
      typeof error.received === "object" &&
      error.expected !== null &&
      error.received !== null
    ) {
      const diff = generateDiff(error.expected, error.received);
      if (diff) {
        parts.push(color.bold("Diff:"));
        parts.push(diff);
        parts.push("");
      }
    }
  }

  // Descriptive message in dim (less emphasis)
  parts.push(color.dim(error.message));

  return parts.join("\n");
}

/**
 * Converts a value to its string representation for display
 *
 * Formatting rules:
 * - Strings: in double quotes
 * - undefined: "undefined"
 * - null: "null"
 * - NaN: "NaN"
 * - Functions: "[Function]"
 * - Arrays: indented JSON
 * - Objects: indented JSON
 * - Others: toString() conversion
 *
 * @param {unknown} value - Value to be converted to string
 * @returns {string} String representation of the value
 *
 * @example
 * stringify("hello")           // '"hello"'
 * stringify(undefined)         // 'undefined'
 * stringify([1, 2, 3])        // '[\n  1,\n  2,\n  3\n]'
 * stringify({ a: 1 })         // '{\n  "a": 1\n}'
 * stringify(NaN)              // 'NaN'
 */
function stringify(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (value === undefined) return "undefined";
  if (value === null) return "null";
  if (Number.isNaN(value)) return "NaN";
  if (typeof value === "function") return "[Function]";
  if (Array.isArray(value)) return JSON.stringify(value, null, 2);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      // Fallback for objects with circular references
      return String(value);
    }
  }
  return String(value);
}

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
export function formatTestFailure(
  testName: string,
  suiteName: string,
  error: unknown,
  filePath: string,
  line?: number
): string {
  const parts: string[] = [];

  // Failure header in red and bold
  parts.push(color.red(color.bold(`\nFAIL ${suiteName ? suiteName + " > " : ""}${testName}()`)));
  parts.push("");

  // Formatted error body
  parts.push(formatError(error));

  // File location information
  if (filePath) {
    const location = line ? `${filePath}:${line}` : filePath;
    parts.push("");
    parts.push(color.dim(`  at ${location}`));
  }

  parts.push("");

  return parts.join("\n");
}
