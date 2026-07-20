import { color } from "../colors.js";

/**
 * Interface representing a line in the comparison diff
 *
 * @interface DiffLine
 *
 * @author alexandreosovski
 */
interface DiffLine {
  /** Line type: added, removed, unchanged, or header */
  type: "added" | "removed" | "unchanged" | "header";
  /** Textual content of the line */
  value: string;
  /** Optional path indicating the location in the object (e.g.: "user.address.street") */
  path?: string;
}

/**
 * Generates a visual representation of the diff between two values
 *
 * Main function that compares two values (expected vs received) and generates
 * a color-formatted string showing the differences. Supports deep comparison
 * of objects, arrays, and primitive types.
 *
 * @param {unknown} expected - Expected value
 * @param {unknown} received - Received value
 * @param {string} [path=""] - Current path in the object (for internal recursion)
 * @returns {string} Formatted string with colored diff
 *
 * @example
 * generateDiff({ name: "John" }, { name: "Jane" })
 * // Returns:
 * // - "John"  (in red)
 * // + "Jane"  (in green)
 *
 * @example
 * generateDiff([1, 2], [1, 2, 3])
 * // Returns diff showing the added element
 */
export function generateDiff(
  expected: unknown,
  received: unknown,
  path: string = ""
): string {
  const lines: DiffLine[] = [];

  // Different types: shows full values
  if (typeof expected !== typeof received) {
    lines.push({ type: "removed", value: `- ${formatValue(expected)}`, path });
    lines.push({ type: "added", value: `+ ${formatValue(received)}`, path });
    return formatDiffLines(lines);
  }

  // Special handling for null
  if (expected === null || received === null) {
    if (expected !== received) {
      lines.push({ type: "removed", value: `- ${formatValue(expected)}`, path });
      lines.push({ type: "added", value: `+ ${formatValue(received)}`, path });
    }
    return formatDiffLines(lines);
  }

  // Element-by-element array comparison
  if (Array.isArray(expected) && Array.isArray(received)) {
    return generateArrayDiff(expected, received, path);
  }

  // Property-by-property object comparison
  if (typeof expected === "object" && typeof received === "object") {
    return generateObjectDiff(
      expected as Record<string, unknown>,
      received as Record<string, unknown>,
      path
    );
  }

  // Different primitive values
  if (expected !== received) {
    lines.push({ type: "removed", value: `- ${formatValue(expected)}`, path });
    lines.push({ type: "added", value: `+ ${formatValue(received)}`, path });
  }

  return formatDiffLines(lines);
}

/**
 * Generates detailed diff for arrays, comparing element by element
 *
 * Iterates through both arrays up to the greater length, identifying:
 * - Added elements (present only in received)
 * - Removed elements (present only in expected)
 * - Changed elements (different between arrays)
 * - Nested objects/arrays are compared recursively
 *
 * @param {unknown[]} expected - Expected array
 * @param {unknown[]} received - Received array
 * @param {string} path - Current path for key prefix
 * @returns {string} Formatted string with array diff
 *
 * @example
 * generateArrayDiff([1, 2, 3], [1, 4, 3], 'data')
 * // Shows diff at index [1]: -2 +4
 */
function generateArrayDiff(
  expected: unknown[],
  received: unknown[],
  path: string
): string {
  const lines: DiffLine[] = [];
  const maxLen = Math.max(expected.length, received.length);

  for (let i = 0; i < maxLen; i++) {
    const currentPath = path ? `${path}[${i}]` : `[${i}]`;

    if (i >= expected.length) {
      // Added element (didn't exist in expected)
      lines.push({
        type: "added",
        value: `+ ${formatValue(received[i])}`,
        path: currentPath
      });
    } else if (i >= received.length) {
      // Removed element (no longer exists in received)
      lines.push({
        type: "removed",
        value: `- ${formatValue(expected[i])}`,
        path: currentPath
      });
    } else if (typeof expected[i] === "object" && typeof received[i] === "object") {
      // Both are objects: compare recursively
      lines.push(
        ...parseDiffLines(
          generateDiff(expected[i], received[i], currentPath)
        )
      );
    } else if (!deepEqual(expected[i], received[i])) {
      // Different values at the same index
      lines.push({
        type: "removed",
        value: `- ${formatValue(expected[i])}`,
        path: currentPath
      });
      lines.push({
        type: "added",
        value: `+ ${formatValue(received[i])}`,
        path: currentPath
      });
    }
    // Equal values are omitted from the diff
  }

  return formatDiffLines(lines);
}

/**
 * Generates detailed diff for objects, comparing property by property
 *
 * Analyzes all keys from both objects, identifying:
 * - Added properties (present only in received)
 * - Removed properties (present only in expected)
 * - Changed properties (different values for the same key)
 * - Nested objects are compared recursively
 * - Keys are sorted alphabetically for consistency
 *
 * @param {Record<string, unknown>} expected - Expected object
 * @param {Record<string, unknown>} received - Received object
 * @param {string} path - Current path for key prefix
 * @returns {string} Formatted string with object diff
 *
 * @example
 * generateObjectDiff(
 *   { name: "John", age: 30 },
 *   { name: "Jane", age: 30 },
 *   'user'
 * )
 * // Shows diff in user.name: -"John" +"Jane"
 */
function generateObjectDiff(
  expected: Record<string, unknown>,
  received: Record<string, unknown>,
  path: string
): string {
  const lines: DiffLine[] = [];

  // Collects and sorts all keys from both objects
  const allKeys = Array.from(
    new Set([...Object.keys(expected), ...Object.keys(received)])
  ).sort();

  for (const key of allKeys) {
    const currentPath = path ? `${path}.${key}` : key;
    const expectedVal = expected[key];
    const receivedVal = received[key];

    if (!(key in expected)) {
      // New property (didn't exist in expected)
      lines.push({
        type: "added",
        value: `+ ${key}: ${formatValue(receivedVal)}`,
        path: currentPath
      });
    } else if (!(key in received)) {
      // Removed property (no longer exists in received)
      lines.push({
        type: "removed",
        value: `- ${key}: ${formatValue(expectedVal)}`,
        path: currentPath
      });
    } else if (
      typeof expectedVal === "object" &&
      expectedVal !== null &&
      typeof receivedVal === "object" &&
      receivedVal !== null
    ) {
      // Both are non-null objects: compare recursively
      lines.push(
        ...parseDiffLines(
          generateDiff(expectedVal, receivedVal, currentPath)
        )
      );
    } else if (!deepEqual(expectedVal, receivedVal)) {
      // Different values for the same key
      lines.push({
        type: "removed",
        value: `- ${key}: ${formatValue(expectedVal)}`,
        path: currentPath
      });
      lines.push({
        type: "added",
        value: `+ ${key}: ${formatValue(receivedVal)}`,
        path: currentPath
      });
    }
    // Equal properties are omitted from the diff
  }

  return formatDiffLines(lines);
}

/**
 * Converts a diff string into an array of DiffLine objects
 *
 * Useful for processing recursive diff results and integrating them
 * into the main diff. Each line is classified by its prefix.
 *
 * @param {string} diff - Diff string generated by generateDiff
 * @returns {DiffLine[]} Array of parsed lines
 *
 * @example
 * const lines = parseDiffLines("- old value\n+ new value");
 * // [
 * //   { type: 'removed', value: '- old value' },
 * //   { type: 'added', value: '+ new value' }
 * // ]
 */
function parseDiffLines(diff: string): DiffLine[] {
  if (!diff) return [];

  return diff
    .split("\n")
    .filter((line) => line.trim()) // Removes empty lines
    .map((line) => {
      if (line.startsWith("+ ")) return { type: "added" as const, value: line };
      if (line.startsWith("- ")) return { type: "removed" as const, value: line };
      return { type: "unchanged" as const, value: line };
    });
}

/**
 * Formats diff lines with colors for terminal display
 *
 * Applies ANSI color coding based on each line's type:
 * - Green for additions
 * - Red for removals
 * - Bold cyan for headers
 * - Gray/dim for unchanged lines
 *
 * @param {DiffLine[]} lines - Array of diff lines
 * @returns {string} String formatted with ANSI colors
 *
 * @example
 * const formatted = formatDiffLines([
 *   { type: 'removed', value: '- old' },
 *   { type: 'added', value: '+ new' }
 * ]);
 * // Returns string with ANSI color codes
 */
function formatDiffLines(lines: DiffLine[]): string {
  if (lines.length === 0) return "";

  return lines
    .map((line) => {
      switch (line.type) {
        case "added":
          return color.green(line.value);
        case "removed":
          return color.red(line.value);
        case "header":
          return color.bold(color.cyan(line.value));
        default:
          return color.dim(line.value);
      }
    })
    .join("\n");
}

/**
 * Formats a value for readable display in diffs
 *
 * Formatting rules:
 * - Strings: in double quotes
 * - null/undefined: literal text
 * - Functions: "[Function]"
 * - Arrays: single-line JSON
 * - Objects: indented JSON
 * - Others: string conversion
 *
 * @param {unknown} value - Value to be formatted
 * @returns {string} Formatted representation of the value
 *
 * @example
 * formatValue("hello")           // '"hello"'
 * formatValue(null)              // 'null'
 * formatValue([1, 2, 3])        // '[1,2,3]'
 * formatValue({ name: "John" }) // '{\n  "name": "John"\n}'
 */
function formatValue(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "function") return "[Function]";
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

/**
 * Deep equality comparison between two values
 *
 * Supports comparison of:
 * - Primitive types (using Object.is to include NaN and -0)
 * - Date objects (compares timestamps)
 * - Regular expressions (compares string representation)
 * - Arrays (compares elements recursively)
 * - Objects (compares properties recursively)
 * - Nested objects at any depth
 *
 * @param {unknown} a - First value for comparison
 * @param {unknown} b - Second value for comparison
 * @returns {boolean} True if values are deeply equal
 *
 * @example
 * deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })  // true
 * deepEqual({ a: 1 }, { a: 1, b: 2 })                    // false
 * deepEqual(new Date('2026-07-20'), new Date('2026-07-20')) // true
 * deepEqual(/abc/, /abc/)                                  // true
 * deepEqual(NaN, NaN)                                      // true (via Object.is)
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  // Object.is handles NaN, -0, and reference equality
  if (Object.is(a, b)) return true;

  // Specialized comparison for Date
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() === b.getTime();
  }

  // Specialized comparison for RegExp
  if (a instanceof RegExp && b instanceof RegExp) {
    return a.toString() === b.toString();
  }

  // Array comparison
  if (Array.isArray(a) || Array.isArray(b)) {
    // If only one is an array, they are not equal
    if (!Array.isArray(a) || !Array.isArray(b)) return false;
    // Different lengths cannot be equal
    if (a.length !== b.length) return false;
    // Compares each element recursively
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  // Object comparison
  if (typeof a === "object" && a !== null && typeof b === "object" && b !== null) {
    const aKeys = Object.keys(a as object);
    const bKeys = Object.keys(b as object);
    // Different number of keys = different objects
    if (aKeys.length !== bKeys.length) return false;
    // All keys and values must be equal
    return aKeys.every((key) =>
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key]
      )
    );
  }

  // Different types or different primitive values
  return false;
}
