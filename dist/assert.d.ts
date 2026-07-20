import type { Matchers } from "./types.js";
/**
 * Specialized error for assertion failures in tests
 *
 * Carries detailed information about the failed comparison,
 * including expected and received values, the operator used,
 * and whether to display a visual diff.
 *
 * @class AssertionError
 * @extends {Error}
 *
 * @example
 * throw new AssertionError('Values differ', {
 *   expected: 42,
 *   received: 43,
 *   operator: 'toBe'
 * });
 */
export declare class AssertionError extends Error {
    /** Expected value in the assertion */
    expected: unknown;
    /** Actually received value */
    received: unknown;
    /** Comparison operator used (e.g.: "toBe", "toEqual") */
    operator: string;
    /** Whether to display a visual diff between expected and received */
    showDiff: boolean;
    /**
     * @param {string} message - Descriptive error message
     * @param {Object} [options] - Options with assertion details
     * @param {unknown} [options.expected] - Expected value
     * @param {unknown} [options.received] - Received value
     * @param {string} [options.operator="toBe"] - Comparison operator
     * @param {boolean} [options.showDiff=true] - Whether to show diff
     */
    constructor(message: string, options?: {
        expected?: unknown;
        received?: unknown;
        operator?: string;
        showDiff?: boolean;
    });
}
/**
 * Interface for asymmetric matchers
 *
 * Asymmetric matchers allow partial matching verification,
 * such as expect.any(String) or expect.objectContaining({ id: 1 }).
 * They are used together with toEqual and other equality matchers.
 *
 * @interface AsymmetricMatcher
 */
interface AsymmetricMatcher {
    /** Unique symbol that identifies objects as asymmetric matchers */
    $$typeof: symbol;
    /**
     * Checks if a value matches the asymmetric pattern
     * @param {unknown} value - Value to be checked
     * @returns {boolean} True if the value matches
     */
    asymmetricMatch(value: unknown): boolean;
    /**
     * Returns string representation of the matcher for error messages
     * @returns {string} Matcher description
     */
    toAsymmetricMatcher(): string;
}
/**
 * Interface of the expect function and its static methods
 *
 * @interface ExpectFunction
 */
interface ExpectFunction {
    /** Creates matchers for a value */
    <T>(actual: T): Matchers<T>;
    /** Registers custom matchers */
    extend(matchers: Record<string, (...args: any[]) => void>): void;
    /** Creates asymmetric matcher for any instance of a type */
    any(constructor: any): AsymmetricMatcher;
    /** Creates matcher that matches any non-null value */
    anything(): AsymmetricMatcher;
    /** Creates matcher for array containing specific elements */
    arrayContaining(arr: unknown[]): AsymmetricMatcher;
    /** Creates matcher for object containing specific properties */
    objectContaining(obj: Record<string, unknown>): AsymmetricMatcher;
    /** Creates matcher for string containing specific substring */
    stringContaining(str: string): AsymmetricMatcher;
    /** Creates matcher for string matching a pattern */
    stringMatching(pattern: string | RegExp): AsymmetricMatcher;
}
/**
 * Main expect function for performing assertions in tests
 *
 * Basic usage:
 * ```ts
 * expect(value).toBe(expected);
 * expect(value).not.toBe(otherValue);
 * ```
 *
 * Asymmetric matchers:
 * ```ts
 * expect({ name: "John", age: 30 }).toEqual(
 *   expect.objectContaining({ name: "John" })
 * );
 * ```
 *
 * @constant {ExpectFunction}
 *
 * @example
 * // Basic assertions
 * expect(2 + 2).toBe(4);
 * expect([1, 2, 3]).toContain(2);
 *
 * @example
 * // With negation
 * expect(42).not.toBe(43);
 *
 * @example
 * // Asymmetric matchers
 * expect({ id: 1, name: "Test" }).toEqual(
 *   expect.objectContaining({ id: expect.any(Number) })
 * );
 */
export declare const expect: ExpectFunction;
export {};
//# sourceMappingURL=assert.d.ts.map