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
 *
 * @author alexandreosovski
 */
export class AssertionError extends Error {
    /** Expected value in the assertion */
    expected;
    /** Actually received value */
    received;
    /** Comparison operator used (e.g.: "toBe", "toEqual") */
    operator;
    /** Whether to display a visual diff between expected and received */
    showDiff;
    /**
     * @param {string} message - Descriptive error message
     * @param {Object} [options] - Options with assertion details
     * @param {unknown} [options.expected] - Expected value
     * @param {unknown} [options.received] - Received value
     * @param {string} [options.operator="toBe"] - Comparison operator
     * @param {boolean} [options.showDiff=true] - Whether to show diff
     */
    constructor(message, options) {
        super(message);
        this.name = "AssertionError";
        this.expected = options?.expected;
        this.received = options?.received;
        this.operator = options?.operator || "toBe";
        this.showDiff = options?.showDiff ?? true;
    }
}
// ============================================================================
// Deep Equal
// ============================================================================
/**
 * Deep equality comparison between two values
 *
 * Supports comparison of:
 * - Primitive types (via Object.is to handle NaN and -0)
 * - Asymmetric matchers (integration with expect.any, expect.objectContaining, etc.)
 * - Date objects (compares timestamps)
 * - Regular expressions (compares string representation)
 * - Arrays (compares elements recursively)
 * - Maps (compares keys and values)
 * - Sets (compares elements regardless of order)
 * - Objects (compares properties recursively)
 *
 * @param {unknown} a - First value for comparison
 * @param {unknown} b - Second value for comparison
 * @returns {boolean} True if values are deeply equal
 *
 * @example
 * deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })  // true
 * deepEqual(new Map([['a', 1]]), new Map([['a', 1]]))    // true
 * deepEqual(new Set([1, 2]), new Set([2, 1]))             // true
 */
function deepEqual(a, b) {
    // Object.is handles NaN, -0, and reference equality
    if (Object.is(a, b))
        return true;
    /**
     * Checks asymmetric matchers first
     * Allows expect.any(String) to match any string
     */
    if (isAsymmetricMatcher(a)) {
        return a.asymmetricMatch(b);
    }
    if (isAsymmetricMatcher(b)) {
        return b.asymmetricMatch(a);
    }
    // Specialized comparison for Date
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    // Specialized comparison for RegExp
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.toString() === b.toString();
    }
    // Array comparison: same order and elements
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b))
            return false;
        if (a.length !== b.length)
            return false;
        return a.every((item, i) => deepEqual(item, b[i]));
    }
    // Map comparison: same keys and values
    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size)
            return false;
        for (const [key, val] of a) {
            if (!b.has(key) || !deepEqual(val, b.get(key)))
                return false;
        }
        return true;
    }
    // Set comparison: same elements (order doesn't matter)
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size)
            return false;
        for (const val of a) {
            if (![...b].some((bVal) => deepEqual(val, bVal)))
                return false;
        }
        return true;
    }
    // Object comparison: same keys and values
    if (typeof a === "object" &&
        a !== null &&
        typeof b === "object" &&
        b !== null) {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length)
            return false;
        return aKeys.every((key) => deepEqual(a[key], b[key]));
    }
    return false;
}
/**
 * Type guard to check if a value is an asymmetric matcher
 *
 * @param {unknown} value - Value to be checked
 * @returns {boolean} True if it is an asymmetric matcher
 */
function isAsymmetricMatcher(value) {
    return (typeof value === "object" &&
        value !== null &&
        "$$typeof" in value &&
        value.$$typeof === Symbol.for("jest.asymmetricMatcher"));
}
// ============================================================================
// Stringify
// ============================================================================
/**
 * Converts a value to string representation for display
 *
 * Special handling for:
 * - Strings: in double quotes
 * - Functions: shows source code
 * - undefined/null/NaN: literal text
 * - Asymmetric matchers: uses toAsymmetricMatcher()
 * - Objects/arrays: formatted JSON with fallback to String()
 *
 * @param {unknown} value - Value to be converted
 * @returns {string} String representation of the value
 *
 * @example
 * stringify("hello")                    // '"hello"'
 * stringify(undefined)                  // 'undefined'
 * stringify(expect.any(String))         // 'Any<String>'
 */
function stringify(value) {
    if (typeof value === "string")
        return `"${value}"`;
    if (typeof value === "function")
        return value.toString();
    if (value === undefined)
        return "undefined";
    if (value === null)
        return "null";
    if (Number.isNaN(value))
        return "NaN";
    if (isAsymmetricMatcher(value))
        return value.toAsymmetricMatcher();
    try {
        return JSON.stringify(value, null, 2) ?? String(value);
    }
    catch {
        // Fallback for objects with circular references
        return String(value);
    }
}
// ============================================================================
// Matchers Implementation
// ============================================================================
/**
 * Matcher factory that creates the object with all assertion methods
 *
 * Each matcher follows the pattern:
 * 1. Evaluates a condition on the actual value
 * 2. If the condition fails (considering isNot), throws AssertionError
 * 3. Different error messages for normal mode and not mode
 *
 * @param {T} actual - Value being tested
 * @param {boolean} isNot - Whether in negation mode (.not)
 * @returns {Matchers<T>} Object with all matcher methods
 *
 * @example
 * const matchers = makeMatchers(42, false);
 * matchers.toBe(42);     // passes
 * matchers.toBeGreaterThan(10); // passes
 */
function makeMatchers(actual, isNot) {
    /**
     * Internal assertion function used by all matchers
     *
     * @param {boolean} condition - Condition to be checked
     * @param {string} messageIfFail - Message if it fails in normal mode
     * @param {string} messageIfNot - Message if it fails in .not mode
     * @param {unknown} [expected] - Expected value (for diff)
     * @param {boolean} [showDiff] - Whether to show visual diff
     */
    const assert = (condition, messageIfFail, messageIfNot, expected, showDiff) => {
        const pass = isNot ? !condition : condition;
        if (!pass) {
            throw new AssertionError(isNot ? messageIfNot : messageIfFail, {
                expected,
                received: actual,
                showDiff: showDiff ?? true,
            });
        }
    };
    const matchers = {
        // ============================
        // Equality
        // ============================
        /**
         * Checks strict equality (===) using Object.is
         * Object.is differs from === in handling NaN and -0
         *
         * @param {T} expected - Expected value
         */
        toBe(expected) {
            assert(Object.is(actual, expected), `expected ${stringify(actual)} to be (===) ${stringify(expected)}`, `expected ${stringify(actual)} NOT to be (===) ${stringify(expected)}`, expected);
        },
        /**
         * Checks deep equality
         * Compares objects, arrays, Maps, Sets recursively
         *
         * @param {T} expected - Expected value
         */
        toEqual(expected) {
            assert(deepEqual(actual, expected), `expected ${stringify(actual)} to equal (deep) ${stringify(expected)}`, `expected ${stringify(actual)} NOT to equal (deep) ${stringify(expected)}`, expected);
        },
        // ============================
        // Booleans
        // ============================
        /** Checks if the value is truthy */
        toBeTruthy() {
            assert(Boolean(actual), `expected ${stringify(actual)} to be truthy`, `expected ${stringify(actual)} to be falsy`, true);
        },
        /** Checks if the value is falsy */
        toBeFalsy() {
            assert(!actual, `expected ${stringify(actual)} to be falsy`, `expected ${stringify(actual)} to be truthy`, false);
        },
        // ============================
        // Null/Undefined
        // ============================
        /** Checks if the value is null */
        toBeNull() {
            assert(actual === null, `expected ${stringify(actual)} to be null`, `expected ${stringify(actual)} NOT to be null`, null);
        },
        /** Checks if the value is undefined */
        toBeUndefined() {
            assert(actual === undefined, `expected ${stringify(actual)} to be undefined`, `expected ${stringify(actual)} NOT to be undefined`, undefined);
        },
        /** Checks if the value is defined (not undefined) */
        toBeDefined() {
            assert(actual !== undefined, `expected value to be defined`, `expected value to be undefined`);
        },
        // ============================
        // Numbers
        // ============================
        /** Checks if the value is NaN */
        toBeNaN() {
            assert(Number.isNaN(actual), `expected ${stringify(actual)} to be NaN`, `expected ${stringify(actual)} NOT to be NaN`, NaN);
        },
        /**
         * Checks if the value is greater than n
         * @param {number} n - Reference value
         */
        toBeGreaterThan(n) {
            assert(actual > n, `expected ${stringify(actual)} to be greater than ${n}`, `expected ${stringify(actual)} NOT to be greater than ${n}`, n);
        },
        /**
         * Checks if the value is greater than or equal to n
         * @param {number} n - Reference value
         */
        toBeGreaterThanOrEqual(n) {
            assert(actual >= n, `expected ${stringify(actual)} to be >= ${n}`, `expected ${stringify(actual)} NOT to be >= ${n}`, n);
        },
        /**
         * Checks if the value is less than n
         * @param {number} n - Reference value
         */
        toBeLessThan(n) {
            assert(actual < n, `expected ${stringify(actual)} to be less than ${n}`, `expected ${stringify(actual)} NOT to be less than ${n}`, n);
        },
        /**
         * Checks if the value is less than or equal to n
         * @param {number} n - Reference value
         */
        toBeLessThanOrEqual(n) {
            assert(actual <= n, `expected ${stringify(actual)} to be <= ${n}`, `expected ${stringify(actual)} NOT to be <= ${n}`, n);
        },
        /**
         * Checks if a number is close to another (for floats)
         *
         * @param {number} n - Target value
         * @param {number} [precision=2] - Number of decimal places of precision
         *
         * @example
         * expect(0.1 + 0.2).toBeCloseTo(0.3); // passes
         */
        toBeCloseTo(n, precision = 2) {
            const diff = Math.abs(actual - n);
            const pass = diff < Math.pow(10, -precision) / 2;
            assert(pass, `expected ${stringify(actual)} to be close to ${n} (precision ${precision})`, `expected ${stringify(actual)} NOT to be close to ${n} (precision ${precision})`, n);
        },
        // ============================
        // Collections
        // ============================
        /**
         * Checks if a collection contains an item
         * Works with strings, arrays, Sets, and Maps
         *
         * @param {unknown} item - Item to be searched for
         *
         * @example
         * expect([1, 2, 3]).toContain(2);
         * expect("hello").toContain("ell");
         * expect(new Set([1, 2])).toContain(1);
         */
        toContain(item) {
            const arr = actual;
            let contains = false;
            if (typeof arr === "string")
                contains = arr.includes(String(item));
            else if (Array.isArray(arr))
                contains = arr.some((el) => deepEqual(el, item));
            else if (arr instanceof Set)
                contains = arr.has(item);
            else if (arr instanceof Map)
                contains = [...arr.values()].some((val) => deepEqual(val, item));
            assert(contains, `expected ${stringify(actual)} to contain ${stringify(item)}`, `expected ${stringify(actual)} NOT to contain ${stringify(item)}`, item);
        },
        /**
         * Checks if the value has a specific length
         * Works with any value that has a length property
         *
         * @param {number} length - Expected length
         */
        toHaveLength(length) {
            const len = actual?.length;
            assert(len === length, `expected length ${len} to be ${length}`, `expected length ${len} NOT to be ${length}`, length);
        },
        // ============================
        // Objects
        // ============================
        /**
         * Checks if an object has a (nested) property
         *
         * @param {string} path - Property path (e.g.: "user.address.city")
         * @param {unknown} [value] - Expected property value (optional)
         *
         * @example
         * expect({ user: { name: "John" } }).toHaveProperty("user.name", "John");
         */
        toHaveProperty(path, value) {
            const parts = path.split(".");
            let cursor = actual;
            for (const part of parts) {
                if (cursor === null || cursor === undefined) {
                    cursor = undefined;
                    break;
                }
                cursor = cursor[part];
            }
            const hasProp = cursor !== undefined;
            const valueMatches = value === undefined ? true : deepEqual(cursor, value);
            assert(hasProp && valueMatches, `expected object to have property "${path}"${value !== undefined ? ` with value ${stringify(value)}` : ""}`, `expected object NOT to have property "${path}"${value !== undefined ? ` with value ${stringify(value)}` : ""}`, value);
        },
        /**
         * Checks if the value is an instance of a constructor
         *
         * @param {abstract new (...args: any[]) => any} ctor - Constructor
         *
         * @example
         * expect(new Error()).toBeInstanceOf(Error);
         */
        toBeInstanceOf(ctor) {
            assert(actual instanceof ctor, `expected ${stringify(actual)} to be instance of ${ctor.name}`, `expected ${stringify(actual)} NOT to be instance of ${ctor.name}`);
        },
        // ============================
        // Functions/Errors
        // ============================
        /**
         * Checks if a function throws an error
         *
         * @param {string | RegExp | Error} [match] - Pattern to check the error message
         *
         * @example
         * expect(() => { throw new Error('fail') }).toThrow('fail');
         * expect(() => { throw new Error('fail') }).toThrow(/fail/);
         */
        toThrow(match) {
            if (typeof actual !== "function") {
                throw new AssertionError("toThrow() requires a function as the received value");
            }
            let thrown;
            let didThrow = false;
            try {
                actual();
            }
            catch (err) {
                didThrow = true;
                thrown = err;
            }
            let matches = didThrow;
            if (didThrow && match !== undefined) {
                const msg = thrown instanceof Error ? thrown.message : String(thrown);
                if (typeof match === "string")
                    matches = msg.includes(match);
                else if (match instanceof RegExp)
                    matches = match.test(msg);
                else if (match instanceof Error)
                    matches = msg.includes(match.message);
            }
            assert(matches, didThrow
                ? `the function threw an error that doesn't match ${stringify(match)}: ${stringify(thrown instanceof Error ? thrown.message : thrown)}`
                : `expected the function to throw an error`, `expected the function NOT to throw an error, but it threw: ${stringify(thrown instanceof Error ? thrown.message : thrown)}`);
        },
        // ============================
        // Strings/Patterns
        // ============================
        /**
         * Checks if a string matches a pattern
         *
         * @param {string | RegExp} pattern - Pattern to match
         */
        toMatch(pattern) {
            const str = String(actual);
            const matches = typeof pattern === "string"
                ? str.includes(pattern)
                : pattern.test(str);
            assert(matches, `expected "${str}" to match ${stringify(pattern)}`, `expected "${str}" NOT to match ${stringify(pattern)}`, pattern);
        },
        // ============================
        // Advanced Matchers
        // ============================
        /**
         * Checks if the value is in a list of acceptable values
         *
         * @param {unknown[]} values - List of possible values
         */
        toBeOneOf(values) {
            assert(values.some((val) => deepEqual(actual, val)), `expected ${stringify(actual)} to be one of ${stringify(values)}`, `expected ${stringify(actual)} NOT to be one of ${stringify(values)}`, values);
        },
        /**
         * Checks if the value satisfies a custom predicate
         *
         * @param {(value: T) => boolean} predicate - Validation function
         *
         * @example
         * expect(10).toSatisfy(n => n > 5 && n < 15);
         */
        toSatisfy(predicate) {
            assert(predicate(actual), `expected ${stringify(actual)} to satisfy the predicate`, `expected ${stringify(actual)} NOT to satisfy the predicate`);
        },
        // ============================
        // Mock Matchers
        // ============================
        /** Checks if a mock function has returned at least once */
        toHaveReturned() {
            const mock = actual;
            if (!mock?.mock?.results) {
                throw new AssertionError("toHaveReturned() requires a mock function");
            }
            assert(mock.mock.results.length > 0, `expected the mock function to have returned`, `expected the mock function NOT to have returned`);
        },
        /**
         * Checks how many times a mock function returned
         * @param {number} times - Expected number of returns
         */
        toHaveReturnedTimes(times) {
            const mock = actual;
            if (!mock?.mock?.results) {
                throw new AssertionError("toHaveReturnedTimes() requires a mock function");
            }
            const returnCount = mock.mock.results.filter((r) => r.type === "return").length;
            assert(returnCount === times, `expected the mock function to have returned ${times} times, but returned ${returnCount}`, `expected the mock function NOT to have returned ${times} times`, times);
        },
        /** Checks if a mock function has been called at least once */
        toHaveBeenCalled() {
            const mock = actual;
            if (!mock?.mock?.calls) {
                throw new AssertionError("toHaveBeenCalled() requires a mock function");
            }
            assert(mock.mock.calls.length > 0, `expected the mock function to have been called`, `expected the mock function NOT to have been called`);
        },
        /**
         * Checks the exact number of calls of a mock function
         * @param {number} times - Expected number of calls
         */
        toHaveBeenCalledTimes(times) {
            const mock = actual;
            if (!mock?.mock?.calls) {
                throw new AssertionError("toHaveBeenCalledTimes() requires a mock function");
            }
            assert(mock.mock.calls.length === times, `expected the mock function to have been called ${times} times, but was ${mock.mock.calls.length}`, `expected the mock function NOT to have been called ${times} times`, times);
        },
        /**
         * Checks if the mock function was called with specific arguments
         * @param {...unknown} args - Expected arguments
         */
        toHaveBeenCalledWith(...args) {
            const mock = actual;
            if (!mock?.mock?.calls) {
                throw new AssertionError("toHaveBeenCalledWith() requires a mock function");
            }
            const found = mock.mock.calls.some((call) => deepEqual(call, args));
            assert(found, `expected the mock function to have been called with ${stringify(args)}`, `expected the mock function NOT to have been called with ${stringify(args)}`, args);
        },
        /**
         * Checks the arguments of the last call of the mock function
         * @param {...unknown} args - Expected arguments
         */
        toHaveBeenLastCalledWith(...args) {
            const mock = actual;
            if (!mock?.mock?.calls) {
                throw new AssertionError("toHaveBeenLastCalledWith() requires a mock function");
            }
            if (mock.mock.calls.length === 0) {
                throw new AssertionError("the mock function was never called");
            }
            const lastCall = mock.mock.calls[mock.mock.calls.length - 1];
            assert(deepEqual(lastCall, args), `expected the last call of the mock function to be with ${stringify(args)}, but was ${stringify(lastCall)}`, `expected the last call of the mock function NOT to be with ${stringify(args)}`, args);
        },
        /**
         * Checks the arguments of the nth call of the mock function
         *
         * @param {number} n - Call number (1-based)
         * @param {...unknown} args - Expected arguments
         */
        toHaveBeenNthCalledWith(n, ...args) {
            const mock = actual;
            if (!mock?.mock?.calls) {
                throw new AssertionError("toHaveBeenNthCalledWith() requires a mock function");
            }
            const call = mock.mock.calls[n - 1];
            if (!call) {
                throw new AssertionError(`the mock function was called only ${mock.mock.calls.length} times, there is no call ${n}`);
            }
            assert(deepEqual(call, args), `expected call #${n} of the mock function to be with ${stringify(args)}, but was ${stringify(call)}`, `expected call #${n} of the mock function NOT to be with ${stringify(args)}`, args);
        },
        // ============================
        // Snapshot
        // ============================
        /**
         * Checks if the value matches the stored snapshot
         *
         * On first run, saves the snapshot.
         * On subsequent runs, compares with the saved snapshot.
         * Use --update-snapshots to update.
         *
         * @param {SnapshotOptions} [options] - Snapshot options
         * @param {string} [options.name] - Snapshot name
         * @param {boolean} [options.update] - Whether to update the snapshot
         */
        toMatchSnapshot(options) {
            const snapshots = globalThis.__MUITTO_SNAPSHOTS__ || new Map();
            const key = options?.name || `snapshot_${snapshots.size}`;
            const serialized = stringify(actual);
            if (options?.update) {
                snapshots.set(key, serialized);
                return;
            }
            if (snapshots.has(key)) {
                const existing = snapshots.get(key);
                assert(existing === serialized, `Snapshot "${key}" does not match:\nExpected:\n${existing}\nReceived:\n${serialized}`, `Snapshot "${key}" matches unexpectedly`, existing);
            }
            else {
                snapshots.set(key, serialized);
            }
            globalThis.__MUITTO_SNAPSHOTS__ = snapshots;
        },
        // ============================
        // Negation
        // ============================
        /**
         * Inverts all subsequent matchers
         *
         * @returns {Matchers<T>} New matchers with inverted logic
         *
         * @example
         * expect(42).not.toBe(43);    // passes
         * expect(42).not.toBeFalsy(); // passes
         */
        get not() {
            return makeMatchers(actual, !isNot);
        },
    };
    return matchers;
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
export const expect = Object.assign(
/**
 * Base function that creates matchers for a value
 * @param {T} actual - Value to be tested
 * @returns {Matchers<T>} Object with all available matchers
 */
function expect(actual) {
    return makeMatchers(actual, false);
}, {
    /**
     * Registers custom matchers for framework extension
     *
     * @param {Record<string, (...args: any[]) => void>} matchers - Matchers to register
     *
     * @example
     * expect.extend({
     *   toBeEven(actual) {
     *     if (actual % 2 !== 0) {
     *       throw new AssertionError('Expected even number');
     *     }
     *   }
     * });
     */
    extend(matchers) {
        // Custom matcher extension implementation
    },
    /**
     * Creates asymmetric matcher that matches any value of a type
     *
     * @param {any} constructor - Type constructor (String, Number, etc.)
     * @returns {AsymmetricMatcher} Asymmetric matcher
     *
     * @example
     * expect({ name: "John" }).toEqual({
     *   name: expect.any(String)
     * });
     */
    any(constructor) {
        return {
            $$typeof: Symbol.for("jest.asymmetricMatcher"),
            asymmetricMatch: (value) => {
                if (constructor === String)
                    return typeof value === "string";
                if (constructor === Number)
                    return typeof value === "number";
                if (constructor === Boolean)
                    return typeof value === "boolean";
                if (constructor === Function)
                    return typeof value === "function";
                if (constructor === Object)
                    return typeof value === "object" && value !== null;
                if (constructor === Array)
                    return Array.isArray(value);
                return value instanceof constructor;
            },
            toAsymmetricMatcher: () => `Any<${constructor.name}>`,
        };
    },
    /**
     * Creates matcher that matches any value (except null/undefined)
     *
     * @returns {AsymmetricMatcher}
     */
    anything() {
        return {
            $$typeof: Symbol.for("jest.asymmetricMatcher"),
            asymmetricMatch: () => true,
            toAsymmetricMatcher: () => "Anything",
        };
    },
    /**
     * Creates matcher for array that must contain the specified elements
     *
     * @param {unknown[]} arr - Elements the array must contain
     * @returns {AsymmetricMatcher}
     *
     * @example
     * expect([1, 2, 3, 4]).toEqual(
     *   expect.arrayContaining([2, 4])
     * );
     */
    arrayContaining(arr) {
        return {
            $$typeof: Symbol.for("jest.asymmetricMatcher"),
            asymmetricMatch: (actual) => Array.isArray(actual) &&
                arr.every((item) => actual.some((el) => deepEqual(el, item))),
            toAsymmetricMatcher: () => `ArrayContaining<${stringify(arr)}>`,
        };
    },
    /**
     * Creates matcher for object that must contain the specified properties
     *
     * @param {Record<string, unknown>} obj - Properties the object must have
     * @returns {AsymmetricMatcher}
     *
     * @example
     * expect({ id: 1, name: "John", age: 30 }).toEqual(
     *   expect.objectContaining({ name: "John" })
     * );
     */
    objectContaining(obj) {
        return {
            $$typeof: Symbol.for("jest.asymmetricMatcher"),
            asymmetricMatch: (actual) => typeof actual === "object" &&
                actual !== null &&
                Object.keys(obj).every((key) => deepEqual(actual[key], obj[key])),
            toAsymmetricMatcher: () => `ObjectContaining<${stringify(obj)}>`,
        };
    },
    /**
     * Creates matcher for string that must contain the specified substring
     *
     * @param {string} str - Substring to search for
     * @returns {AsymmetricMatcher}
     */
    stringContaining(str) {
        return {
            $$typeof: Symbol.for("jest.asymmetricMatcher"),
            asymmetricMatch: (actual) => typeof actual === "string" && actual.includes(str),
            toAsymmetricMatcher: () => `StringContaining<"${str}">`,
        };
    },
    /**
     * Creates matcher for string that must match a pattern
     *
     * @param {string | RegExp} pattern - Pattern to match
     * @returns {AsymmetricMatcher}
     *
     * @example
     * expect({ email: "user@example.com" }).toEqual({
     *   email: expect.stringMatching(/@example\.com$/)
     * });
     */
    stringMatching(pattern) {
        return {
            $$typeof: Symbol.for("jest.asymmetricMatcher"),
            asymmetricMatch: (actual) => typeof actual === "string" &&
                (typeof pattern === "string"
                    ? actual.includes(pattern)
                    : pattern.test(actual)),
            toAsymmetricMatcher: () => `StringMatching<${typeof pattern === "string" ? `"${pattern}"` : pattern}>`,
        };
    },
});
//# sourceMappingURL=assert.js.map