/**
 * Core type definitions for the Muitto test framework
 *
 * This module defines all TypeScript interfaces and types used throughout
 * the test runner, including test definitions, results, mocks, matchers,
 * reporters, and configuration options.
 *
 * @module types
 *
 * @author alexandreosovski
 */
/**
 * Test function signature - can be synchronous or asynchronous
 * @callback TestFn
 * @returns {void | Promise<void>}
 */
export type TestFn = () => void | Promise<void>;
/**
 * Hook function signature for lifecycle hooks
 * @callback HookFn
 * @returns {void | Promise<void>}
 */
export type HookFn = () => void | Promise<void>;
/**
 * Represents a single test case definition
 *
 * @interface TestCase
 *
 * @example
 * const testCase: TestCase = {
 *   name: 'should add numbers',
 *   fn: () => { expect(1 + 1).toBe(2); },
 *   suite: ['Math', 'Addition'],
 *   skip: false,
 *   only: false,
 *   filePath: '/tests/math.test.ts'
 * };
 */
export interface TestCase {
    /** Display name of the test */
    name: string;
    /** Test function to execute */
    fn: TestFn;
    /** Hierarchy of suites containing this test (outermost first) */
    suite: string[];
    /** If true, this test will be skipped during execution */
    skip: boolean;
    /** If true, only this test (and other 'only' tests) will run */
    only: boolean;
    /** Absolute path to the file containing this test */
    filePath: string;
    /** Optional tags for categorizing and filtering tests */
    tags?: string[];
    /** Custom timeout in milliseconds for this specific test */
    timeout?: number;
    /** Number of retry attempts if the test fails */
    retry?: number;
}
/**
 * Result of executing a single test
 *
 * @interface TestResult
 */
export interface TestResult {
    /** The test definition that was executed */
    test: TestCase;
    /** Execution status */
    status: "passed" | "failed" | "skipped";
    /** Duration of the test execution in milliseconds */
    durationMs: number;
    /** Error object if the test failed */
    error?: unknown;
    /** Which retry attempt produced this result (undefined = first attempt) */
    retryAttempt?: number;
}
/**
 * Result of executing all tests in a single file
 *
 * @interface FileResult
 */
export interface FileResult {
    /** Absolute path to the test file */
    filePath: string;
    /** Results for each test in the file */
    results: TestResult[];
    /** Total duration of the file execution in milliseconds */
    durationMs: number;
    /** Error that prevented test collection (syntax error, import failure, etc.) */
    collectError?: unknown;
}
/**
 * Complete summary of a test run
 *
 * @interface RunSummary
 *
 * @example
 * const summary: RunSummary = {
 *   files: [fileResult1, fileResult2],
 *   totalPassed: 42,
 *   totalFailed: 2,
 *   totalSkipped: 3,
 *   durationMs: 1234,
 *   startTime: 1699200000000,
 *   endTime: 1699200001234
 * };
 */
export interface RunSummary {
    /** Results for each test file that was executed */
    files: FileResult[];
    /** Total number of tests that passed */
    totalPassed: number;
    /** Total number of tests that failed */
    totalFailed: number;
    /** Total number of tests that were skipped */
    totalSkipped: number;
    /** Total execution duration in milliseconds */
    durationMs: number;
    /** Timestamp when the run started (milliseconds since epoch) */
    startTime?: number;
    /** Timestamp when the run ended (milliseconds since epoch) */
    endTime?: number;
}
/**
 * Result of a single mock function invocation
 *
 * @interface MockResult
 */
export interface MockResult {
    /** Whether the call returned normally or threw an error */
    type: "return" | "throw";
    /** The returned value or thrown error */
    value: any;
}
/**
 * Context object tracking mock function usage
 *
 * @interface MockContext
 */
export interface MockContext {
    /** Arguments passed to each call of the mock function */
    calls: any[][];
    /** Results for each call to the mock function */
    results: MockResult[];
    /** The `this` context for each call */
    instances: any[];
    /** Resets all mock state (calls, results, instances) back to empty */
    reset: () => void;
}
/**
 * Mock function interface for creating test doubles
 *
 * @interface MockFn
 * @template T - The original function type being mocked
 *
 * @example
 * const mockFn: MockFn<(x: number) => number> = fn();
 * mockFn.mockReturnValue(42);
 * mockFn(10); // returns 42
 * expect(mockFn).toHaveBeenCalledWith(10);
 */
export interface MockFn<T extends (...args: any[]) => any> {
    /** Invokes the mocked function */
    (...args: Parameters<T>): ReturnType<T>;
    /** Mock metadata tracking calls and results */
    mock: MockContext;
    /** Replaces the current implementation with a new function */
    mockImplementation: (fn: T) => void;
    /** Sets a fixed return value (ignores input arguments) */
    mockReturnValue: (value: ReturnType<T>) => void;
    /** Sets the return value as a resolved promise */
    mockResolvedValue: (value: Awaited<ReturnType<T>>) => void;
    /** Sets the return value as a rejected promise */
    mockRejectedValue: (error: any) => void;
    /** Clears call history but keeps the current implementation */
    mockClear: () => void;
    /** Completely resets the mock: clears history and removes implementation */
    mockReset: () => void;
}
/**
 * Spy function that wraps an existing method for observation
 *
 * @interface SpyFn
 * @extends MockFn
 * @template T - The function type being spied on
 *
 * @example
 * const obj = { greet: (name: string) => `Hello ${name}` };
 * const spy = spyOn(obj, 'greet');
 * obj.greet('World');
 * expect(spy).toHaveBeenCalledWith('World');
 * spy.mockRestore(); // restores original method
 */
export interface SpyFn<T extends (...args: any[]) => any> extends MockFn<T> {
    /** Restores the original function on the host object */
    mockRestore: () => void;
}
/**
 * API for controlling fake timers in tests
 *
 * @interface FakeTimers
 *
 * @example
 * const timers = useFakeTimers();
 * setTimeout(() => console.log('done'), 1000);
 * timers.advanceTimersByTime(1000); // 'done' is logged
 * timers.restore();
 */
export interface FakeTimers {
    /** Advances the mock clock by the specified milliseconds */
    advanceTimersByTime: (ms: number) => void;
    /** Advances the clock to the next scheduled timer and executes it */
    advanceTimersToNextTimer: () => void;
    /** Executes all pending timers immediately */
    runAllTimers: () => void;
    /** Returns the number of timers currently scheduled */
    getTimerCount: () => number;
    /** Restores the original timer functions and Date */
    restore: () => void;
}
/**
 * Options for snapshot matching
 *
 * @interface SnapshotOptions
 */
export interface SnapshotOptions {
    /** Custom name for this snapshot (auto-generated if not provided) */
    name?: string;
    /** If true, updates the stored snapshot instead of comparing */
    update?: boolean;
}
/**
 * Matchers for snapshot testing
 *
 * @interface SnapshotMatcher
 */
export interface SnapshotMatcher {
    /** Asserts that a value matches a stored snapshot */
    toMatchSnapshot: (options?: SnapshotOptions) => void;
    /** Asserts that a value matches an inline snapshot string */
    toMatchInlineSnapshot: (snapshot: string) => void;
}
/**
 * Configuration options for test retry behavior
 *
 * @interface RetryOptions
 *
 * @example
 * await retry(async () => {
 *   await expectCondition();
 * }, { times: 5, delay: 100, backoff: 'exponential' });
 */
export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    times?: number;
    /** Delay between retries in milliseconds (default: 100) */
    delay?: number;
    /** Backoff strategy: fixed, linear, or exponential */
    backoff?: "fixed" | "linear" | "exponential";
    /** Callback invoked on each retry attempt */
    onRetry?: (attempt: number, error: Error) => void;
}
/**
 * Collection of lifecycle hooks for a test suite
 *
 * @interface SuiteHooks
 */
export interface SuiteHooks {
    /** Hooks executed before each individual test */
    beforeEach: HookFn[];
    /** Hooks executed after each individual test */
    afterEach: HookFn[];
    /** Hooks executed once before any tests in the suite */
    beforeAll: HookFn[];
    /** Hooks executed once after all tests in the suite */
    afterAll: HookFn[];
}
/**
 * Describe block function with skip and only modifiers
 *
 * @interface DescribeFn
 *
 * @example
 * describe('My Suite', () => { ... });
 * describe.skip('Skipped Suite', () => { ... });
 * describe.only('Focused Suite', () => { ... });
 */
export interface DescribeFn {
    /** Defines a test suite */
    (name: string, fn: () => void): void;
    /** Skips all tests within this suite */
    skip: (name: string, fn: () => void) => void;
    /** Runs only this suite (exclusive mode) */
    only: (name: string, fn: () => void) => void;
}
/**
 * Test definition function with modifiers for skip, only, todo, and each
 *
 * @interface ItFn
 *
 * @example
 * it('works', () => { ... });
 * it.skip('WIP', () => { ... });
 * it.only('critical', () => { ... });
 * it.todo('implement later');
 * it.each([1, 2, 3])('value $value', (n) => { ... });
 */
export interface ItFn {
    /** Defines an individual test */
    (name: string, fn: TestFn): void;
    /** Registers but does not execute this test */
    skip: (name: string, fn: TestFn) => void;
    /** Runs only this test, skipping others without the 'only' flag */
    only: (name: string, fn: TestFn) => void;
    /** Marks a test as pending implementation */
    todo: (name: string) => void;
    /** Creates parameterized tests from a data table */
    each: <T>(table: T[]) => (name: string, fn: (...args: any[]) => void | Promise<void>) => void;
}
/**
 * Discriminated union of all possible test lifecycle events
 *
 * @typedef {Object} ReporterEvent
 *
 * @example
 * function handleEvent(event: ReporterEvent) {
 *   switch (event.type) {
 *     case 'test_end': console.log(event.result.status); break;
 *     case 'summary': console.log(event.summary.totalPassed); break;
 *   }
 * }
 */
export type ReporterEvent = 
/** Execution of all tests is about to begin */
{
    type: "start";
    total: number;
}
/** A test file is about to be executed */
 | {
    type: "file_start";
    filePath: string;
}
/** A test file has finished executing */
 | {
    type: "file_end";
    result: FileResult;
}
/** An individual test is about to start */
 | {
    type: "test_start";
    test: TestCase;
}
/** An individual test has finished */
 | {
    type: "test_end";
    result: TestResult;
}
/** A test suite is being entered */
 | {
    type: "suite_start";
    name: string;
}
/** A test suite has been completed */
 | {
    type: "suite_end";
    name: string;
}
/** A lifecycle hook is about to execute */
 | {
    type: "hook_start";
    hookType: "beforeAll" | "afterAll" | "beforeEach" | "afterEach";
}
/** A lifecycle hook has finished executing */
 | {
    type: "hook_end";
    hookType: "beforeAll" | "afterAll" | "beforeEach" | "afterEach";
}
/** Final summary of the entire test run */
 | {
    type: "summary";
    summary: RunSummary;
};
/**
 * Reporter interface for handling test events
 *
 * @typedef {Object} Reporter
 */
export type Reporter = {
    /** Primary event handler receiving all test lifecycle events */
    onEvent: (event: ReporterEvent) => void;
    /** Called when test execution begins */
    onStart?: () => void;
    /** Called when test execution completes */
    onEnd?: (summary: RunSummary) => void;
};
/**
 * Configuration options for the Muitto test runner
 *
 * @interface MuittoConfig
 *
 * @example
 * // muitto.config.ts
 * const config: MuittoConfig = {
 *   timeoutMs: 10000,
 *   bail: true,
 *   parallel: true,
 *   maxConcurrency: 4
 * };
 * export default config;
 */
export interface MuittoConfig {
    /** Root directory for test discovery */
    root?: string;
    /** Regex pattern to identify test files */
    pattern?: RegExp;
    /** Default timeout per test in milliseconds */
    timeoutMs?: number;
    /** Filter tests by name pattern */
    filter?: string;
    /** Default number of retry attempts for failing tests */
    retry?: number;
    /** Stop execution on the first failing test */
    bail?: boolean;
    /** Run test files in parallel */
    parallel?: boolean;
    /** Maximum number of concurrent test files (parallel mode) */
    maxConcurrency?: number;
    /** Array of reporter instances */
    reporters?: Reporter[];
    /** Function executed once before all tests */
    globalSetup?: () => void | Promise<void>;
    /** Function executed once after all tests */
    globalTeardown?: () => void | Promise<void>;
    /** Directory for storing snapshot files */
    snapshotDir?: string;
    /** Update existing snapshots instead of comparing */
    updateSnapshots?: boolean;
}
/**
 * Result returned by a worker from parallel test execution
 *
 * @interface WorkerResult
 */
export interface WorkerResult {
    /** Path to the test file that was executed */
    filePath: string;
    /** Test results from the executed file */
    results: TestResult[];
    /** Execution duration in milliseconds */
    durationMs: number;
    /** Error that occurred during test collection (if any) */
    collectError?: unknown;
}
/**
 * Message sent to a worker to execute a test file
 *
 * @interface WorkerMessage
 */
export interface WorkerMessage {
    /** Type of message */
    type: "run_file";
    /** Path to the test file to execute */
    filePath: string;
    /** Execution options */
    options: {
        /** Timeout per test in milliseconds */
        timeoutMs: number;
        /** Test name filter */
        filter: string;
    };
}
/**
 * Response from a worker after executing a test file
 *
 * @interface WorkerResponse
 */
export interface WorkerResponse {
    /** Type of response */
    type: "file_result";
    /** Result of the file execution */
    result: WorkerResult;
}
/**
 * Code coverage report generated during test execution
 *
 * @interface CoverageReport
 *
 * @example
 * const report: CoverageReport = {
 *   lines: { total: 500, covered: 450, skipped: 0, pct: 90 },
 *   statements: { total: 520, covered: 468, skipped: 0, pct: 90 },
 *   functions: { total: 50, covered: 48, skipped: 0, pct: 96 },
 *   branches: { total: 100, covered: 85, skipped: 0, pct: 85 },
 *   files: { ... }
 * };
 */
export interface CoverageReport {
    /** Line coverage metrics */
    lines: {
        total: number;
        covered: number;
        skipped: number;
        pct: number;
    };
    /** Statement coverage metrics */
    statements: {
        total: number;
        covered: number;
        skipped: number;
        pct: number;
    };
    /** Function coverage metrics */
    functions: {
        total: number;
        covered: number;
        skipped: number;
        pct: number;
    };
    /** Branch coverage metrics */
    branches: {
        total: number;
        covered: number;
        skipped: number;
        pct: number;
    };
    /** Per-file detailed coverage data */
    files: Record<string, {
        /** Line numbers that were covered */
        lines: number[];
        /** Function names mapped to execution counts */
        functions: Record<string, number>;
        /** Branch IDs mapped to execution counts */
        branches: Record<string, number[]>;
    }>;
}
/**
 * Collection of assertion matchers available via expect()
 *
 * @interface Matchers
 * @template T - The type of the value being tested
 *
 * @example
 * expect(value).toBe(expected);
 * expect(value).not.toBe(otherValue);
 * expect(array).toContain(item);
 * expect(fn).toThrow(Error);
 */
export interface Matchers<T> {
    /** Strict equality using Object.is */
    toBe(expected: T): void;
    /** Deep equality comparison */
    toEqual(expected: T): void;
    /** Asserts value is truthy */
    toBeTruthy(): void;
    /** Asserts value is falsy */
    toBeFalsy(): void;
    /** Asserts value is null */
    toBeNull(): void;
    /** Asserts value is undefined */
    toBeUndefined(): void;
    /** Asserts value is not undefined */
    toBeDefined(): void;
    /** Asserts value is NaN */
    toBeNaN(): void;
    /** Asserts value is greater than n */
    toBeGreaterThan(n: number): void;
    /** Asserts value is greater than or equal to n */
    toBeGreaterThanOrEqual(n: number): void;
    /** Asserts value is less than n */
    toBeLessThan(n: number): void;
    /** Asserts value is less than or equal to n */
    toBeLessThanOrEqual(n: number): void;
    /** Asserts a number is close to another within a precision */
    toBeCloseTo(n: number, precision?: number): void;
    /** Asserts a collection contains an item */
    toContain(item: unknown): void;
    /** Asserts value has a specific length */
    toHaveLength(length: number): void;
    /** Asserts an object has a (nested) property, optionally with a value */
    toHaveProperty(path: string, value?: unknown): void;
    /** Asserts value is an instance of a constructor */
    toBeInstanceOf(ctor: abstract new (...args: any[]) => any): void;
    /** Asserts a function throws an error */
    toThrow(match?: string | RegExp | Error): void;
    /** Asserts a string matches a pattern */
    toMatch(pattern: string | RegExp): void;
    /** Asserts value is one of a list of acceptable values */
    toBeOneOf(values: unknown[]): void;
    /** Asserts value satisfies a custom predicate */
    toSatisfy(predicate: (value: T) => boolean): void;
    /** Asserts a mock function has returned at least once */
    toHaveReturned(): void;
    /** Asserts a mock function has returned a specific number of times */
    toHaveReturnedTimes(times: number): void;
    /** Asserts a mock function was called at least once */
    toHaveBeenCalled(): void;
    /** Asserts a mock function was called a specific number of times */
    toHaveBeenCalledTimes(times: number): void;
    /** Asserts a mock function was called with specific arguments */
    toHaveBeenCalledWith(...args: unknown[]): void;
    /** Asserts the last call to a mock function had specific arguments */
    toHaveBeenLastCalledWith(...args: unknown[]): void;
    /** Asserts the nth call to a mock function had specific arguments */
    toHaveBeenNthCalledWith(n: number, ...args: unknown[]): void;
    /** Asserts a value matches a stored snapshot */
    toMatchSnapshot(options?: SnapshotOptions): void;
    /** Negates all subsequent matchers */
    not: Matchers<T>;
}
/**
 * The expect function with asymmetric matcher factory methods
 *
 * @interface Expect
 *
 * @example
 * expect(value).toBe(42);
 * expect.objectContaining({ id: expect.any(Number) });
 */
export interface Expect {
    /** Creates matchers for asserting on a value */
    <T>(actual: T): Matchers<T>;
    /** Registers custom matchers */
    extend: (matchers: Record<string, (...args: any[]) => void>) => void;
    /** Creates an asymmetric matcher matching any instance of a type */
    any: (constructor: any) => any;
    /** Creates an asymmetric matcher matching any non-null/undefined value */
    anything: () => any;
    /** Creates an asymmetric matcher for arrays containing specific elements */
    arrayContaining: (arr: unknown[]) => unknown[];
    /** Creates an asymmetric matcher for objects containing specific properties */
    objectContaining: (obj: Record<string, unknown>) => Record<string, unknown>;
    /** Creates an asymmetric matcher for strings containing a substring */
    stringContaining: (str: string) => string;
    /** Creates an asymmetric matcher for strings matching a pattern */
    stringMatching: (pattern: string | RegExp) => string | RegExp;
}
/**
 * Phases of the test lifecycle
 *
 * @typedef {string} TestLifecycle
 */
export type TestLifecycle = "beforeAll" | "afterAll" | "beforeEach" | "afterEach" | "beforeTest" | "afterTest";
/**
 * Represents a single lifecycle hook
 *
 * @interface LifecycleHook
 */
export interface LifecycleHook {
    /** Which phase of the lifecycle this hook belongs to */
    phase: TestLifecycle;
    /** The hook function to execute */
    fn: HookFn;
    /** The suite key this hook is associated with */
    suiteKey: string;
}
/**
 * Interface for custom test environments
 *
 * @interface TestEnvironment
 *
 * @example
 * class BrowserEnvironment implements TestEnvironment {
 *   async setup() {
 *     // launch browser
 *   }
 *   async teardown() {
 *     // close browser
 *   }
 *   getGlobals() {
 *     return { page, browser };
 *   }
 * }
 */
export interface TestEnvironment {
    /** Called before tests run in this environment */
    setup: () => void | Promise<void>;
    /** Called after all tests complete in this environment */
    teardown: () => void | Promise<void>;
    /** Returns global variables available to tests in this environment */
    getGlobals: () => Record<string, unknown>;
}
export type { TestCase as TestCaseType, TestResult as TestResultType, FileResult as FileResultType, RunSummary as RunSummaryType, MockFn as MockFnType, SpyFn as SpyFnType, FakeTimers as FakeTimersType, Matchers as MatchersType, Expect as ExpectType, Reporter as ReporterType, MuittoConfig as MuittoConfigType, CoverageReport as CoverageReportType, };
//# sourceMappingURL=types.d.ts.map