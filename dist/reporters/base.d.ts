import type { TestCase, TestResult, FileResult, RunSummary } from "../types.js";
/**
 * Base interface for all test framework reporters
 *
 * Defines the contract that all reporters must follow, using
 * the Observer pattern to notify about test execution lifecycle
 * events. All methods are optional, allowing reporters to implement
 * only the events they need.
 *
 * Available events:
 * - Start/end of complete execution
 * - Start/end of each test file
 * - Start/end of each individual test
 * - Start/end of each test suite
 *
 * @interface Reporter
 *
 * @example
 * class CustomReporter implements Reporter {
 *   name = "custom";
 *
 *   onTestEnd(result: TestResult) {
 *     if (result.status === 'failed') {
 *       console.error(`Test failed: ${result.test.name}`);
 *     }
 *   }
 * }
 */
export interface Reporter {
    /** Reporter identifier name (e.g.: "default", "verbose", "dot") */
    name: string;
    /**
     * Called when the execution of all tests is about to begin
     *
     * @param {number} totalFiles - Total number of test files that will be executed
     */
    onStart?(totalFiles: number): void;
    /**
     * Called when the execution of all tests has finished
     *
     * @param {RunSummary} summary - Complete summary with execution metrics
     */
    onEnd?(summary: RunSummary): void;
    /**
     * Called before starting to run a test file
     *
     * @param {string} filePath - Absolute path of the test file
     */
    onFileStart?(filePath: string): void;
    /**
     * Called after finishing running a test file
     *
     * @param {FileResult} result - Complete result of the file execution
     */
    onFileEnd?(result: FileResult): void;
    /**
     * Called before running each individual test
     *
     * @param {TestCase} test - Definition of the test that will be executed
     */
    onTestStart?(test: TestCase): void;
    /**
     * Called after running each individual test
     *
     * @param {TestResult} result - Test execution result (passed/failed/skipped)
     */
    onTestEnd?(result: TestResult): void;
    /**
     * Called when a test suite is started
     *
     * @param {string} name - Suite name (full path with " > " as separator)
     */
    onSuiteStart?(name: string): void;
    /**
     * Called when a test suite is finished
     *
     * @param {string} name - Name of the suite that was completed
     */
    onSuiteEnd?(name: string): void;
}
/**
 * Abstract base class for reporter implementation
 *
 * Provides default empty implementations for all methods
 * of the Reporter interface, allowing subclasses to implement
 * only the methods they want to customize.
 *
 * Follows the Template Method pattern combined with Observer,
 * where each method is an optional hook that can be
 * overridden by subclasses.
 *
 * @abstract
 * @class BaseReporter
 * @implements {Reporter}
 *
 * @example
 * class SimpleReporter extends BaseReporter {
 *   name = "simple";
 *
 *   onStart(totalFiles: number) {
 *     console.log(`Running ${totalFiles} test files...`);
 *   }
 *
 *   onTestEnd(result: TestResult) {
 *     const icon = result.status === 'passed' ? '✓' : '✗';
 *     console.log(`${icon} ${result.test.name}`);
 *   }
 *
 *   onEnd(summary: RunSummary) {
 *     console.log(`Done: ${summary.totalPassed} passed, ${summary.totalFailed} failed`);
 *   }
 * }
 */
export declare abstract class BaseReporter implements Reporter {
    /**
     * Reporter name - must be defined by each subclass
     *
     * @abstract
     */
    abstract name: string;
    /** @inheritdoc */
    onStart?(totalFiles: number): void;
    /** @inheritdoc */
    onEnd?(summary: RunSummary): void;
    /** @inheritdoc */
    onFileStart?(filePath: string): void;
    /** @inheritdoc */
    onFileEnd?(result: FileResult): void;
    /** @inheritdoc */
    onTestStart?(test: TestCase): void;
    /** @inheritdoc */
    onTestEnd?(result: TestResult): void;
    /** @inheritdoc */
    onSuiteStart?(name: string): void;
    /** @inheritdoc */
    onSuiteEnd?(name: string): void;
}
//# sourceMappingURL=base.d.ts.map