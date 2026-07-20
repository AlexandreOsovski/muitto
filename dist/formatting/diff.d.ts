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
export declare function generateDiff(expected: unknown, received: unknown, path?: string): string;
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
export declare function deepEqual(a: unknown, b: unknown): boolean;
//# sourceMappingURL=diff.d.ts.map