import { expect } from "./assert.js";
/**
 * Global test registry for the current file
 * Cleared on each new file imported by the runner
 */
const registry = [];
/**
 * Stack of active suites (for nested describe support)
 * Allows tracking which suite hierarchy the test is being defined in
 */
const suiteStack = [];
/**
 * Map of hooks by suite key
 * The key is the full suite path (e.g.: "Auth > Login > validate")
 */
const hooksBySuiteKey = new Map();
/**
 * Returns the current suite key based on the suite stack
 *
 * @returns {string} Key in the format "Suite > SubSuite > SubSubSuite"
 * @example
 * // When inside describe('Auth', () => { describe('Login', () => { ... }) })
 * currentSuiteKey() // "Auth > Login"
 */
function currentSuiteKey() {
    return suiteStack.join(" > ");
}
/**
 * Ensures a hooks record exists for the suite key
 * If it doesn't exist, creates a new one with empty arrays
 *
 * @param {string} key - Suite key
 * @returns {SuiteHooks} Suite hooks object
 */
function ensureHooks(key) {
    let hooks = hooksBySuiteKey.get(key);
    if (!hooks) {
        hooks = { beforeEach: [], afterEach: [], beforeAll: [], afterAll: [] };
        hooksBySuiteKey.set(key, hooks);
    }
    return hooks;
}
// ---------------------------------------------------------------------------
// Test blocks
// ---------------------------------------------------------------------------
/**
 * Defines a test suite (describe block)
 *
 * Groups related tests and other suites, allowing nesting.
 * During callback execution, all registered tests (it/test)
 * inherit the current suite name.
 *
 * @param {string} name - Test suite name
 * @param {() => void} fn - Function containing tests and sub-suites
 *
 * @example
 * describe('Calculator', () => {
 *   it('should add numbers', () => {
 *     expect(1 + 1).toBe(2);
 *   });
 *
 *   describe('subtraction', () => {
 *     it('should subtract numbers', () => {
 *       expect(5 - 3).toBe(2);
 *     });
 *   });
 * });
 */
export function describe(name, fn) {
    suiteStack.push(name);
    try {
        fn();
    }
    finally {
        suiteStack.pop();
    }
}
/**
 * Alias for describe (modern Jest style)
 * @see describe
 */
export const suite = describe;
/**
 * Alias for describe (BDD style - Behavior Driven Development)
 * @see describe
 */
export const context = describe;
/**
 * Skip version of describe: registers the suite but marks all tests as skip
 *
 * @example
 * describe.skip('WIP Feature', () => {
 *   it('should work', () => { ... }); // Will be ignored
 * });
 */
describe.skip = (name, fn) => {
    suiteStack.push(name);
    try {
        fn();
        // Marks all tests registered in this block as skip
        const key = currentSuiteKey();
        registry.forEach((t) => {
            if (t.suite.join(" > ") === key) {
                t.skip = true;
            }
        });
    }
    finally {
        suiteStack.pop();
    }
};
/**
 * Only version of describe: runs only this suite, ignoring others
 *
 * @example
 * describe.only('Critical Feature', () => {
 *   it('must work', () => { ... }); // Only this test will run
 * });
 *
 * describe('Other Feature', () => {
 *   it('should work too', () => { ... }); // Will be ignored
 * });
 */
describe.only = (name, fn) => {
    suiteStack.push(name);
    try {
        fn();
        const key = currentSuiteKey();
        registry.forEach((t) => {
            if (t.suite.join(" > ") === key) {
                t.only = true;
            }
        });
    }
    finally {
        suiteStack.pop();
    }
};
/**
 * Registers a test in the global registry
 *
 * @param {string} name - Test name
 * @param {TestFn} fn - Test function
 * @param {Object} opts - Test options
 * @param {boolean} [opts.skip] - Whether the test should be skipped
 * @param {boolean} [opts.only] - Whether the test is exclusive
 * @param {boolean} [opts.todo] - Whether it's a TODO test
 */
function register(name, fn, opts) {
    registry.push({
        name,
        fn,
        suite: [...suiteStack],
        skip: opts.skip ?? false,
        only: opts.only ?? false,
        filePath: "", // filled in by the runner after import
    });
}
/**
 * Formats a value for use in parameterized test names
 *
 * @param {unknown} value - Value to be formatted
 * @returns {string} String representation of the value
 *
 * @example
 * formatTestValue(42)        // "42"
 * formatTestValue([1,2,3])   // "[1,2,3]"
 * formatTestValue({a:1})     // '{"a":1}'
 */
function formatTestValue(value) {
    if (typeof value === 'string')
        return value;
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    if (value === null)
        return 'null';
    if (value === undefined)
        return 'undefined';
    if (Array.isArray(value)) {
        try {
            return JSON.stringify(value);
        }
        catch {
            return '[Array]';
        }
    }
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        }
        catch {
            return '[Object]';
        }
    }
    return String(value);
}
/**
 * Defines an individual test
 *
 * Main function for creating tests, with support for:
 * - .skip: ignores the test
 * - .only: runs only this test
 * - .todo: marks as pending
 * - .each: parameterized tests with data table
 *
 * @constant {ItFn}
 *
 * @example
 * // Basic test
 * it('should work', () => {
 *   expect(true).toBe(true);
 * });
 *
 * @example
 * // Parameterized test with array
 * it.each([
 *   [1, 2, 3],
 *   [4, 5, 9],
 * ])('should add $1 + $2 = $3', (a, b, expected) => {
 *   expect(a + b).toBe(expected);
 * });
 * // Generates: "should add 1 + 2 = 3 #1", "should add 4 + 5 = 9 #2"
 *
 * @example
 * // Parameterized test with objects
 * it.each([
 *   { name: 'John', age: 30 },
 *   { name: 'Jane', age: 25 },
 * ])('user $name should be adult', ({ name, age }) => {
 *   expect(age).toBeGreaterThan(18);
 * });
 * // Generates: "user John should be adult #1", "user Jane should be adult #2"
 *
 * @example
 * // Parameterized test with primitive values
 * it.each([1, 2, 3])('should be positive: $value', (num) => {
 *   expect(num).toBeGreaterThan(0);
 * });
 */
export const it = Object.assign((name, fn) => register(name, fn, {}), {
    /**
     * Skip version: test registered but not executed
     * @example
     * it.skip('WIP test', () => { ... });
     */
    skip: (name, fn) => register(name, fn, { skip: true }),
    /**
     * Only version: only this test will be executed
     * @example
     * it.only('critical test', () => { ... });
     */
    only: (name, fn) => register(name, fn, { only: true }),
    /**
     * Marks a test as TODO (appears as skip in results)
     * @example
     * it.todo('Implement authentication');
     */
    todo: (name) => register(name, () => {
        throw new Error(`TODO: ${name}`);
    }, { skip: true }),
    /**
     * Parameterized tests: runs the same test for each row in the table
     *
     * Supports three data formats:
     * 1. Arrays: uses $1, $2, $3... to access indices
     * 2. Objects: uses $property to access fields
     * 3. Primitives: uses $value to access the value
     *
     * @param {T[]} table - Data table for parameterization
     * @returns {Function} Function that accepts test name and test function
     */
    each: (table) => (name, fn) => {
        table.forEach((row, index) => {
            let testName = name;
            let args;
            if (Array.isArray(row)) {
                /**
                 * For arrays: replaces $1, $2, $3... with values
                 * Indices are 1-based (compatible with Jest/Vitest)
                 * $value is replaced with the formatted array
                 */
                testName = testName.replace(/\$(\d+)/g, (_, num) => {
                    const idx = parseInt(num) - 1;
                    return idx < row.length ? formatTestValue(row[idx]) : `$${num}`;
                });
                testName = testName.replace(/\$value/g, formatTestValue(row));
                args = row;
            }
            else if (typeof row === 'object' && row !== null) {
                /**
                 * For objects: replaces $property with values
                 * Ignores $numbers to avoid conflicts
                 */
                testName = testName.replace(/\$(\w+)/g, (match, key) => {
                    if (/^\d+$/.test(key))
                        return match;
                    if (key in row) {
                        return formatTestValue(row[key]);
                    }
                    return match;
                });
                args = [row];
            }
            else {
                /**
                 * For primitive values: $value and $1 are replaced
                 */
                testName = testName.replace(/\$value/g, String(row));
                testName = testName.replace(/\$1/g, String(row));
                args = [row];
            }
            // Adds index only if there is more than one test case
            const fullTestName = table.length > 1 ? `${testName} #${index + 1}` : testName;
            register(fullTestName, () => {
                return fn(...args);
            }, {});
        });
    },
});
/** Alias for it (Jest style) */
export const test = it;
// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
/**
 * Registers a hook that runs before each test in the current suite
 *
 * @param {HookFn} fn - Function to be executed (can be async)
 *
 * @example
 * describe('Database', () => {
 *   beforeEach(async () => {
 *     await db.clear();
 *     await db.seed();
 *   });
 *
 *   it('should query users', async () => {
 *     const users = await db.getUsers();
 *     expect(users).toHaveLength(1);
 *   });
 * });
 */
export function beforeEach(fn) {
    ensureHooks(currentSuiteKey()).beforeEach.push(fn);
}
/**
 * Registers a hook that runs after each test in the current suite
 *
 * @param {HookFn} fn - Function to be executed (can be async)
 *
 * @example
 * afterEach(async () => {
 *   await db.disconnect();
 * });
 */
export function afterEach(fn) {
    ensureHooks(currentSuiteKey()).afterEach.push(fn);
}
/**
 * Registers a hook that runs once before all tests in the suite
 *
 * @param {HookFn} fn - Function to be executed (can be async)
 *
 * @example
 * beforeAll(async () => {
 *   await server.start();
 * });
 */
export function beforeAll(fn) {
    ensureHooks(currentSuiteKey()).beforeAll.push(fn);
}
/**
 * Registers a hook that runs once after all tests in the suite
 *
 * @param {HookFn} fn - Function to be executed (can be async)
 *
 * @example
 * afterAll(async () => {
 *   await server.stop();
 * });
 */
export function afterAll(fn) {
    ensureHooks(currentSuiteKey()).afterAll.push(fn);
}
/** Alias for beforeEach */
export const setup = beforeEach;
/** Alias for afterEach */
export const teardown = afterEach;
/** Alias for beforeAll */
export const before = beforeAll;
/** Alias for after */
export const after = afterAll;
// ---------------------------------------------------------------------------
// Custom assertions
// ---------------------------------------------------------------------------
/**
 * Basic assertion that throws an error if the condition is false
 *
 * @param {boolean} condition - Condition to be checked
 * @param {string} [message] - Optional error message
 * @throws {Error} If the condition is false
 *
 * @example
 * assert(user.isActive, 'User must be active');
 * assert(response.status === 200);
 */
export function assert(condition, message) {
    if (!condition) {
        throw new Error(message || "Assertion failed");
    }
}
/**
 * Forces a test to fail with an optional message
 *
 * @param {string} [message] - Descriptive failure message
 * @throws {Error} Always throws an error
 *
 * @example
 * if (!user) {
 *   fail('User not found');
 * }
 */
export function fail(message) {
    throw new Error(message || "Test failed");
}
// ---------------------------------------------------------------------------
// Snapshot testing (basic)
// ---------------------------------------------------------------------------
/** Internal snapshot storage */
const snapshots = new Map();
/**
 * Checks if a value matches the stored snapshot
 *
 * On first run, saves the snapshot.
 * On subsequent runs, compares with the saved value.
 *
 * @param {unknown} value - Value to be compared with the snapshot
 * @param {string} [name] - Optional name for the snapshot
 * @throws {Error} If the value doesn't match the snapshot
 *
 * @example
 * test('user profile', () => {
 *   const profile = getUserProfile();
 *   expectSnapshot(profile, 'user-profile');
 * });
 */
export function expectSnapshot(value, name) {
    const key = name || `${currentSuiteKey()} > snapshot_${snapshots.size}`;
    const serialized = JSON.stringify(value, null, 2);
    if (snapshots.has(key)) {
        const existing = snapshots.get(key);
        if (existing !== serialized) {
            throw new Error(`Snapshot "${key}" does not match:\nExpected:\n${existing}\nReceived:\n${serialized}`);
        }
    }
    else {
        snapshots.set(key, serialized);
    }
}
/**
 * Creates a mocked function for testing
 *
 * Allows:
 * - Tracking calls and arguments
 * - Setting custom behaviors
 * - Verifying interactions with the mock
 *
 * @param {T} [implementation] - Optional function implementation
 * @returns {MockFn<T>} Mocked function with control API
 *
 * @example
 * const mockFn = fn((x: number) => x * 2);
 * mockFn(5);
 * expect(mockFn.mock.calls).toHaveLength(1);
 * expect(mockFn.mock.results[0].value).toBe(10);
 *
 * @example
 * const fetchMock = fn();
 * fetchMock.mockResolvedValue({ data: 'test' });
 * const result = await fetchMock('/api/data');
 * expect(result).toEqual({ data: 'test' });
 *
 * @example
 * const errorMock = fn();
 * errorMock.mockRejectedValue(new Error('Network error'));
 * await expect(() => errorMock()).toThrow('Network error');
 */
export function fn(implementation) {
    let impl = implementation || (() => { });
    const mockFn = function (...args) {
        mockFn.mock.calls.push(args);
        mockFn.mock.instances.push(this);
        try {
            const result = impl.apply(this, args);
            mockFn.mock.results.push({ type: "return", value: result });
            return result;
        }
        catch (error) {
            mockFn.mock.results.push({ type: "throw", value: error });
            throw error;
        }
    };
    mockFn.mock = {
        calls: [],
        results: [],
        instances: [],
        reset: () => {
            mockFn.mock.calls = [];
            mockFn.mock.results = [];
            mockFn.mock.instances = [];
            impl = implementation || (() => { });
        },
    };
    mockFn.mockImplementation = (newImpl) => {
        impl = newImpl;
    };
    mockFn.mockReturnValue = (value) => {
        impl = (() => value);
    };
    mockFn.mockResolvedValue = (value) => {
        impl = (() => Promise.resolve(value));
    };
    mockFn.mockRejectedValue = (error) => {
        impl = (() => Promise.reject(error));
    };
    mockFn.mockClear = () => {
        mockFn.mock.calls = [];
        mockFn.mock.results = [];
        mockFn.mock.instances = [];
    };
    mockFn.mockReset = () => {
        mockFn.mock.reset();
    };
    return mockFn;
}
/**
 * Creates a spy on an object method
 *
 * Allows monitoring calls to existing methods without losing
 * the original implementation. The original method is preserved
 * and can be restored with mockRestore().
 *
 * @param {T} obj - Object containing the method
 * @param {K & string} methodName - Name of the method to be spied on
 * @returns {SpyFn} Spy that monitors calls
 * @throws {Error} If the property is not a function
 *
 * @example
 * const calculator = {
 *   add: (a: number, b: number) => a + b
 * };
 *
 * const spy = spyOn(calculator, 'add');
 * calculator.add(1, 2);
 *
 * expect(spy).toHaveBeenCalledWith(1, 2);
 * expect(spy.mock.results[0].value).toBe(3);
 *
 * spy.mockRestore(); // Restores original function
 */
export function spyOn(obj, methodName) {
    const original = obj[methodName];
    if (typeof original !== "function") {
        throw new Error(`spyOn: ${String(methodName)} is not a function`);
    }
    const spy = fn(original);
    obj[methodName] = spy;
    spy.mockRestore = () => {
        obj[methodName] = original;
    };
    return spy;
}
// ---------------------------------------------------------------------------
// Timer mocks
// ---------------------------------------------------------------------------
/**
 * Replaces real timers with mocked versions for test control
 *
 * Allows:
 * - Artificially controlling the advance of time
 * - Executing pending timers on demand
 * - Checking timer state
 * - Restoring original timers
 *
 * @returns {Object} Mocked timers control API
 *
 * @example
 * const timers = useFakeTimers();
 *
 * setTimeout(() => console.log('later'), 1000);
 * timers.advanceTimersByTime(1000); // Executes the callback
 *
 * console.log(timers.getTimerCount()); // 0
 * timers.restore(); // Restores original timers
 */
export function useFakeTimers() {
    /** Saves original references for restoration */
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    const originalSetInterval = globalThis.setInterval;
    const originalClearInterval = globalThis.clearInterval;
    const originalDate = globalThis.Date;
    let now = Date.now();
    /** Timer queue sorted by execution time */
    const timers = [];
    let nextId = 1;
    /**
     * Date mock that uses controlled artificial time
     */
    globalThis.Date = class extends Date {
        constructor(...args) {
            if (args.length === 0) {
                super(now);
            }
            else {
                super(...args);
            }
        }
        static now() {
            return now;
        }
    };
    /**
     * setTimeout mock that schedules callbacks in artificial time
     */
    globalThis.setTimeout = ((callback, delay) => {
        const id = nextId++;
        timers.push({ callback, time: now + delay, id });
        timers.sort((a, b) => a.time - b.time);
        return id;
    });
    /**
     * clearTimeout mock that removes callbacks from the queue
     */
    globalThis.clearTimeout = ((id) => {
        const index = timers.findIndex((t) => t.id === id);
        if (index !== -1)
            timers.splice(index, 1);
    });
    /**
     * setInterval mock (basic support)
     */
    globalThis.setInterval = ((callback, delay) => {
        const id = nextId++;
        const interval = { callback, time: now + delay, id, delay };
        timers.push(interval);
        return id;
    });
    /**
     * clearInterval mock
     */
    globalThis.clearInterval = ((id) => {
        const index = timers.findIndex((t) => t.id === id);
        if (index !== -1)
            timers.splice(index, 1);
    });
    return {
        /**
         * Advances time by ms and executes expired callbacks
         *
         * @param {number} ms - Milliseconds to advance
         *
         * @example
         * setTimeout(() => done(), 500);
         * timers.advanceTimersByTime(500); // done() is called
         */
        advanceTimersByTime(ms) {
            const target = now + ms;
            while (timers.length > 0 && timers[0].time <= target) {
                const timer = timers.shift();
                now = timer.time;
                timer.callback();
                // Reschedules intervals
                if (timer.delay) {
                    timers.push({
                        callback: timer.callback,
                        time: now + timer.delay,
                        id: timer.id,
                    });
                    timers.sort((a, b) => a.time - b.time);
                }
            }
            now = target;
        },
        /**
         * Advances time to the next timer and executes it
         *
         * @throws {Error} If there are no pending timers
         */
        advanceTimersToNextTimer() {
            if (timers.length === 0) {
                throw new Error("No more pending timers");
            }
            this.advanceTimersByTime(timers[0].time - now);
        },
        /**
         * Runs all pending timers immediately
         */
        runAllTimers() {
            while (timers.length > 0) {
                this.advanceTimersToNextTimer();
            }
        },
        /**
         * Returns the number of pending timers
         * @returns {number}
         */
        getTimerCount() {
            return timers.length;
        },
        /**
         * Restores original timers and Date
         */
        restore() {
            globalThis.setTimeout = originalSetTimeout;
            globalThis.clearTimeout = originalClearTimeout;
            globalThis.setInterval = originalSetInterval;
            globalThis.clearInterval = originalClearInterval;
            globalThis.Date = originalDate;
        },
    };
}
// ---------------------------------------------------------------------------
// Retry
// ---------------------------------------------------------------------------
/**
 * Re-executes a function in case of failure (retry)
 *
 * Useful for tests that depend on asynchronous conditions
 * that may take time to stabilize.
 *
 * @param {() => void | Promise<void>} fn - Function to be executed with retry
 * @param {Object} [options] - Retry options
 * @param {number} [options.times=3] - Maximum number of attempts
 * @param {number} [options.delay=100] - Delay in ms between attempts
 * @returns {Promise<void>}
 * @throws {Error} The last error if all attempts fail
 *
 * @example
 * await retry(async () => {
 *   const status = await checkService();
 *   expect(status).toBe('ready');
 * }, { times: 5, delay: 200 });
 */
export async function retry(fn, options = {}) {
    const times = options.times ?? 3;
    const delay = options.delay ?? 100;
    for (let attempt = 1; attempt <= times; attempt++) {
        try {
            await fn();
            return;
        }
        catch (error) {
            if (attempt === times)
                throw error;
            if (delay > 0) {
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }
    }
}
// ---------------------------------------------------------------------------
// Tagged tests
// ---------------------------------------------------------------------------
/** Map of tags associated with tests */
const tags = new Map();
/**
 * Decorator to add tags to tests
 *
 * Allows categorizing and filtering tests by tags.
 *
 * @param {string} tagName - Tag name
 * @returns {Function} Decorator function
 *
 * @example
 * class UserTests {
 *   @tag('slow')
 *   @tag('integration')
 *   testUserCreation() {
 *     // slow integration test
 *   }
 * }
 */
export function tag(tagName) {
    return function (_target, _propertyKey) {
        const testName = _propertyKey || "unknown";
        if (!tags.has(testName)) {
            tags.set(testName, []);
        }
        tags.get(testName).push(tagName);
    };
}
/**
 * Returns the internal registry for use by the runner
 *
 * This function is used internally by the runner to access
 * the tests and hooks registered during file import.
 *
 * @returns {Object} Registry with tests and hooks
 * @internal
 */
export function __getRegistry() {
    return { tests: registry, hooksBySuiteKey };
}
export { expect };
//# sourceMappingURL=index.js.map