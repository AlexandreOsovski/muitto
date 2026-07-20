import type { TestCase, TestFn, HookFn } from "./types.js";
import { expect } from "./assert.js";
/**
 * Interface that defines the lifecycle hooks of a test suite
 *
 * @interface SuiteHooks
 *
 * @author alexandreosovski
 */
interface SuiteHooks {
    /** Hooks executed before each test */
    beforeEach: HookFn[];
    /** Hooks executed after each test */
    afterEach: HookFn[];
    /** Hooks executed once before all tests in the suite */
    beforeAll: HookFn[];
    /** Hooks executed once after all tests in the suite */
    afterAll: HookFn[];
}
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
export declare function describe(name: string, fn: () => void): void;
export declare namespace describe {
    var skip: (name: string, fn: () => void) => void;
    var only: (name: string, fn: () => void) => void;
}
/**
 * Alias for describe (modern Jest style)
 * @see describe
 */
export declare const suite: typeof describe;
/**
 * Alias for describe (BDD style - Behavior Driven Development)
 * @see describe
 */
export declare const context: typeof describe;
/**
 * Interface for the it/test function with all modifiers
 *
 * @interface ItFn
 */
interface ItFn {
    /** Defines an individual test */
    (name: string, fn: TestFn): void;
    /** Skips this test (will not be executed) */
    skip: (name: string, fn: TestFn) => void;
    /** Runs only this test (exclusive mode) */
    only: (name: string, fn: TestFn) => void;
    /** Marks a test as TODO (pending implementation) */
    todo: (name: string) => void;
    /**
     * Parameterized tests: runs the same test for each table item
     * Supports arrays, objects, and primitive values
     */
    each: <T>(table: T[]) => (name: string, fn: (...args: any[]) => void | Promise<void>) => void;
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
export declare const it: ItFn;
/** Alias for it (Jest style) */
export declare const test: ItFn;
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
export declare function beforeEach(fn: HookFn): void;
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
export declare function afterEach(fn: HookFn): void;
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
export declare function beforeAll(fn: HookFn): void;
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
export declare function afterAll(fn: HookFn): void;
/** Alias for beforeEach */
export declare const setup: typeof beforeEach;
/** Alias for afterEach */
export declare const teardown: typeof afterEach;
/** Alias for beforeAll */
export declare const before: typeof beforeAll;
/** Alias for after */
export declare const after: typeof afterAll;
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
export declare function assert(condition: boolean, message?: string): asserts condition;
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
export declare function fail(message?: string): never;
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
export declare function expectSnapshot(value: unknown, name?: string): void;
/**
 * Interface for mocked functions
 *
 * @interface MockFn
 * @template T - Original function type
 */
interface MockFn<T extends (...args: any[]) => any> {
    /** Executes the mocked function */
    (...args: Parameters<T>): ReturnType<T>;
    /** Information about mock calls and results */
    mock: {
        /** Arguments of each call */
        calls: Parameters<T>[];
        /** Results of each call (return or throw) */
        results: {
            type: "return" | "throw";
            value: any;
        }[];
        /** This instances of each call */
        instances: any[];
        /** Resets all mock information */
        reset: () => void;
    };
    /** Sets a new implementation for the mock */
    mockImplementation: (fn: T) => void;
    /** Sets a fixed return value */
    mockReturnValue: (value: ReturnType<T>) => void;
    /** Sets a return value as a resolved Promise */
    mockResolvedValue: (value: Awaited<ReturnType<T>>) => void;
    /** Sets a return value as a rejected Promise */
    mockRejectedValue: (error: any) => void;
    /** Clears call history but keeps implementation */
    mockClear: () => void;
    /** Completely resets the mock (history + implementation) */
    mockReset: () => void;
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
export declare function fn<T extends (...args: any[]) => any = (...args: any[]) => any>(implementation?: T): MockFn<T>;
/**
 * Interface for spy functions
 * Extends MockFn with the ability to restore the original function
 *
 * @interface SpyFn
 * @extends MockFn
 */
interface SpyFn<T extends (...args: any[]) => any> extends MockFn<T> {
    /** Restores the original function on the object */
    mockRestore: () => void;
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
export declare function spyOn<T extends object, K extends keyof T>(obj: T, methodName: K & string): SpyFn<T[K] extends (...args: any[]) => any ? T[K] : never>;
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
export declare function useFakeTimers(): {
    /**
     * Advances time by ms and executes expired callbacks
     *
     * @param {number} ms - Milliseconds to advance
     *
     * @example
     * setTimeout(() => done(), 500);
     * timers.advanceTimersByTime(500); // done() is called
     */
    advanceTimersByTime(ms: number): void;
    /**
     * Advances time to the next timer and executes it
     *
     * @throws {Error} If there are no pending timers
     */
    advanceTimersToNextTimer(): void;
    /**
     * Runs all pending timers immediately
     */
    runAllTimers(): void;
    /**
     * Returns the number of pending timers
     * @returns {number}
     */
    getTimerCount(): number;
    /**
     * Restores original timers and Date
     */
    restore(): void;
};
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
export declare function retry(fn: () => void | Promise<void>, options?: {
    times?: number;
    delay?: number;
}): Promise<void>;
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
export declare function tag(tagName: string): (_target: any, _propertyKey?: string) => void;
/**
 * Returns the internal registry for use by the runner
 *
 * This function is used internally by the runner to access
 * the tests and hooks registered during file import.
 *
 * @returns {Object} Registry with tests and hooks
 * @internal
 */
export declare function __getRegistry(): {
    tests: TestCase[];
    hooksBySuiteKey: Map<string, SuiteHooks>;
};
export { expect };
export type { TestFn, HookFn, MockFn, SpyFn } from "./types.js";
//# sourceMappingURL=index.d.ts.map