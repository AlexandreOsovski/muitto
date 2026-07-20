import type { TestCase, TestFn, HookFn } from "./types.js";
import { expect } from "./assert.js";

// ---------------------------------------------------------------------------
// Internal state of the test file being loaded.
//
// FIX: registry and hooksBySuiteKey are stored on `globalThis` keyed by
// Symbol.for(...) instead of as plain module-scope variables. Symbol.for
// uses the runtime's global symbol registry, which is shared across the
// whole process no matter how many times/ways this module gets loaded
// (e.g. once via a plain relative import from the runner, and again via
// a loader like tsx resolving the bare "muitto" specifier from inside a
// test file). This guarantees describe/it always register into the SAME
// array/map that the runner reads via __getRegistry(), even if the
// module ends up loaded as two separate instances in the same process.
// ---------------------------------------------------------------------------

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

const REGISTRY_KEY = Symbol.for("muitto.registry");
const HOOKS_KEY = Symbol.for("muitto.hooksBySuiteKey");

const g = globalThis as any;

if (!g[REGISTRY_KEY]) g[REGISTRY_KEY] = [];
if (!g[HOOKS_KEY]) g[HOOKS_KEY] = new Map<string, SuiteHooks>();

/**
 * Global test registry for the current file
 * Cleared on each new file imported by the runner
 */
const registry: TestCase[] = g[REGISTRY_KEY];

/**
 * Stack of active suites (for nested describe support)
 * Allows tracking which suite hierarchy the test is being defined in
 */
const suiteStack: string[] = [];

/**
 * Map of hooks by suite key
 * The key is the full suite path (e.g.: "Auth > Login > validate")
 */
const hooksBySuiteKey: Map<string, SuiteHooks> = g[HOOKS_KEY];

/**
 * Returns the current suite key based on the suite stack
 *
 * @returns {string} Key in the format "Suite > SubSuite > SubSubSuite"
 * @example
 * // When inside describe('Auth', () => { describe('Login', () => { ... }) })
 * currentSuiteKey() // "Auth > Login"
 */
function currentSuiteKey(): string {
  return suiteStack.join(" > ");
}

/**
 * Ensures a hooks record exists for the suite key
 * If it doesn't exist, creates a new one with empty arrays
 *
 * @param {string} key - Suite key
 * @returns {SuiteHooks} Suite hooks object
 */
function ensureHooks(key: string): SuiteHooks {
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
export function describe(name: string, fn: () => void): void {
  suiteStack.push(name);
  try {
    fn();
  } finally {
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
 * Interface for the describe function with skip and only methods
 *
 * @interface DescribeFn
 */
interface DescribeFn {
  (name: string, fn: () => void): void;
  /** Skips all tests within this suite */
  skip: (name: string, fn: () => void) => void;
  /** Runs only the tests within this suite (exclusive mode) */
  only: (name: string, fn: () => void) => void;
}

/**
 * Skip version of describe: registers the suite but marks all tests as skip
 *
 * @example
 * describe.skip('WIP Feature', () => {
 *   it('should work', () => { ... }); // Will be ignored
 * });
 */
describe.skip = (name: string, fn: () => void): void => {
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
  } finally {
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
describe.only = (name: string, fn: () => void): void => {
  suiteStack.push(name);
  try {
    fn();
    const key = currentSuiteKey();
    registry.forEach((t) => {
      if (t.suite.join(" > ") === key) {
        t.only = true;
      }
    });
  } finally {
    suiteStack.pop();
  }
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

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
 * Registers a test in the global registry
 *
 * @param {string} name - Test name
 * @param {TestFn} fn - Test function
 * @param {Object} opts - Test options
 * @param {boolean} [opts.skip] - Whether the test should be skipped
 * @param {boolean} [opts.only] - Whether the test is exclusive
 * @param {boolean} [opts.todo] - Whether it's a TODO test
 */
function register(name: string, fn: TestFn, opts: { skip?: boolean; only?: boolean; todo?: boolean }): void {
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
function formatTestValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Array]';
    }
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
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
export const it: ItFn = Object.assign(
  (name: string, fn: TestFn) => register(name, fn, {}),
  {
    /**
     * Skip version: test registered but not executed
     * @example
     * it.skip('WIP test', () => { ... });
     */
    skip: (name: string, fn: TestFn) => register(name, fn, { skip: true }),

    /**
     * Only version: only this test will be executed
     * @example
     * it.only('critical test', () => { ... });
     */
    only: (name: string, fn: TestFn) => register(name, fn, { only: true }),

    /**
     * Marks a test as TODO (appears as skip in results)
     * @example
     * it.todo('Implement authentication');
     */
    todo: (name: string) => register(name, () => {
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
    each: <T>(table: T[]) => (name: string, fn: (...args: any[]) => void | Promise<void>) => {
      table.forEach((row, index) => {
        let testName = name;
        let args: any[];

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
        } else if (typeof row === 'object' && row !== null) {
          /**
           * For objects: replaces $property with values
           * Ignores $numbers to avoid conflicts
           */
          testName = testName.replace(/\$(\w+)/g, (match, key) => {
            if (/^\d+$/.test(key)) return match;

            if (key in (row as any)) {
              return formatTestValue((row as any)[key]);
            }
            return match;
          });

          args = [row];
        } else {
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
  }
);

/** Alias for it (Jest style) */
export const test: ItFn = it;

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
export function beforeEach(fn: HookFn): void {
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
export function afterEach(fn: HookFn): void {
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
export function beforeAll(fn: HookFn): void {
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
export function afterAll(fn: HookFn): void {
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
export function assert(condition: boolean, message?: string): asserts condition {
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
export function fail(message?: string): never {
  throw new Error(message || "Test failed");
}

// ---------------------------------------------------------------------------
// Snapshot testing (basic)
// ---------------------------------------------------------------------------

/** Internal snapshot storage */
const snapshots = new Map<string, string>();

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
export function expectSnapshot(value: unknown, name?: string): void {
  const key = name || `${currentSuiteKey()} > snapshot_${snapshots.size}`;
  const serialized = JSON.stringify(value, null, 2);

  if (snapshots.has(key)) {
    const existing = snapshots.get(key);
    if (existing !== serialized) {
      throw new Error(`Snapshot "${key}" does not match:\nExpected:\n${existing}\nReceived:\n${serialized}`);
    }
  } else {
    snapshots.set(key, serialized);
  }
}

// ---------------------------------------------------------------------------
// Mock functions
// ---------------------------------------------------------------------------

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
    results: { type: "return" | "throw"; value: any }[];
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
export function fn<T extends (...args: any[]) => any = (...args: any[]) => any>(implementation?: T): MockFn<T> {
  let impl = implementation || ((() => {}) as unknown as T);

  const mockFn = function(this: any, ...args: Parameters<T>): ReturnType<T> {
    mockFn.mock.calls.push(args);
    mockFn.mock.instances.push(this);

    try {
      const result = impl.apply(this, args);
      mockFn.mock.results.push({ type: "return", value: result });
      return result;
    } catch (error) {
      mockFn.mock.results.push({ type: "throw", value: error });
      throw error;
    }
  } as MockFn<T>;

  mockFn.mock = {
    calls: [],
    results: [],
    instances: [],
    reset: () => {
      mockFn.mock.calls = [];
      mockFn.mock.results = [];
      mockFn.mock.instances = [];
      impl = implementation || ((() => {}) as unknown as T);
    },
  };

  mockFn.mockImplementation = (newImpl: T) => {
    impl = newImpl;
  };

  mockFn.mockReturnValue = (value: ReturnType<T>) => {
    impl = ((() => value) as unknown) as T;
  };

  mockFn.mockResolvedValue = (value: Awaited<ReturnType<T>>) => {
    impl = ((() => Promise.resolve(value)) as unknown) as T;
  };

  mockFn.mockRejectedValue = (error: any) => {
    impl = ((() => Promise.reject(error)) as unknown) as T;
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

// ---------------------------------------------------------------------------
// Spy
// ---------------------------------------------------------------------------

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
export function spyOn<T extends object, K extends keyof T>(
  obj: T,
  methodName: K & string
): SpyFn<T[K] extends (...args: any[]) => any ? T[K] : never> {
  const original = obj[methodName] as any;

  if (typeof original !== "function") {
    throw new Error(`spyOn: ${String(methodName)} is not a function`);
  }

  const spy = fn(original) as SpyFn<any>;
  obj[methodName as keyof T] = spy as any;

  spy.mockRestore = () => {
    obj[methodName as keyof T] = original;
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
  const timers: Array<{ callback: () => void; time: number; id: number }> = [];
  let nextId = 1;

  /**
   * Date mock that uses controlled artificial time
   */
  globalThis.Date = class extends Date {
    constructor(...args: any[]) {
      if (args.length === 0) {
        super(now);
      } else {
        super(...(args as [any]));
      }
    }

    static now() {
      return now;
    }
  } as any;

  /**
   * setTimeout mock that schedules callbacks in artificial time
   */
  globalThis.setTimeout = ((callback: () => void, delay: number) => {
    const id = nextId++;
    timers.push({ callback, time: now + delay, id });
    timers.sort((a, b) => a.time - b.time);
    return id;
  }) as any;

  /**
   * clearTimeout mock that removes callbacks from the queue
   */
  globalThis.clearTimeout = ((id: number) => {
    const index = timers.findIndex((t) => t.id === id);
    if (index !== -1) timers.splice(index, 1);
  }) as any;

  /**
   * setInterval mock (basic support)
   */
  globalThis.setInterval = ((callback: () => void, delay: number) => {
    const id = nextId++;
    const interval = { callback, time: now + delay, id, delay };
    timers.push(interval);
    return id;
  }) as any;

  /**
   * clearInterval mock
   */
  globalThis.clearInterval = ((id: number) => {
    const index = timers.findIndex((t) => t.id === id);
    if (index !== -1) timers.splice(index, 1);
  }) as any;

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
    advanceTimersByTime(ms: number) {
      const target = now + ms;
      while (timers.length > 0 && timers[0].time <= target) {
        const timer = timers.shift()!;
        now = timer.time;
        timer.callback();
        // Reschedules intervals
        if ((timer as any).delay) {
          timers.push({
            callback: timer.callback,
            time: now + (timer as any).delay,
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
export async function retry(
  fn: () => void | Promise<void>,
  options: { times?: number; delay?: number } = {}
): Promise<void> {
  const times = options.times ?? 3;
  const delay = options.delay ?? 100;

  for (let attempt = 1; attempt <= times; attempt++) {
    try {
      await fn();
      return;
    } catch (error) {
      if (attempt === times) throw error;
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
const tags = new Map<string, string[]>();

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
export function tag(tagName: string) {
  return function (_target: any, _propertyKey?: string) {
    const testName = _propertyKey || "unknown";
    if (!tags.has(testName)) {
      tags.set(testName, []);
    }
    tags.get(testName)!.push(tagName);
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
export function __getRegistry(): {
  tests: TestCase[];
  hooksBySuiteKey: Map<string, SuiteHooks>;
} {
  return { tests: registry, hooksBySuiteKey };
}

export { expect };
export type { TestFn, HookFn, MockFn, SpyFn } from "./types.js";
