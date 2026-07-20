import type { TestCase, TestResult, FileResult, RunSummary } from "../types.js";
/**
 * Events that reporters can receive during test execution
 *
 * Defines a typed event system using discriminated union,
 * where each event has a specific type and carries the
 * relevant data for that moment in the lifecycle.
 *
 * This type allows reporters to implement both the traditional
 * interface (individual methods) and the event-based
 * interface (generic onEvent method).
 *
 * @typedef {Object} ReporterEvent
 *
 * @example
 * // Usage with onEvent
 * reporter.onEvent({ type: "test_start", test: myTestCase });
 * reporter.onEvent({ type: "test_end", result: myTestResult });
 *
 * @example
 * // Pattern matching with discriminated union
 * switch (event.type) {
 *   case "start": // event.total is available
 *   case "file_start": // event.filePath is available
 *   case "test_end": // event.result is available
 * }
 *
 * @author alexandreosovski
 */
export type ReporterEvent = 
/** Start of execution of all tests */
{
    type: "start";
    total: number;
}
/** Start of execution of a test file */
 | {
    type: "file_start";
    filePath: string;
}
/** End of execution of a test file */
 | {
    type: "file_end";
    result: FileResult;
}
/** Start of an individual test */
 | {
    type: "test_start";
    test: TestCase;
}
/** End of an individual test */
 | {
    type: "test_end";
    result: TestResult;
}
/** Start of a test suite */
 | {
    type: "suite_start";
    name: string;
}
/** End of a test suite */
 | {
    type: "suite_end";
    name: string;
}
/** Start of execution of a lifecycle hook */
 | {
    type: "hook_start";
    hookType: "beforeAll" | "afterAll" | "beforeEach" | "afterEach";
}
/** End of execution of a lifecycle hook */
 | {
    type: "hook_end";
    hookType: "beforeAll" | "afterAll" | "beforeEach" | "afterEach";
}
/** Final execution summary */
 | {
    type: "summary";
    summary: RunSummary;
};
/**
 * Base interface for all test framework reporters
 *
 * Defines the complete contract that a reporter can implement,
 * offering two implementation approaches:
 *
 * 1. **Individual methods**: Implement specific callbacks for
 *    each lifecycle event (onStart, onTestEnd, etc.)
 *
 * 2. **Generic event**: Implement the onEvent method that receives
 *    all events at a single point, useful for reporters that
 *    need unified logic or advanced routing
 *
 * All methods are optional, allowing minimalist reporters
 * that implement only the events they need.
 *
 * @interface Reporter
 *
 * @example
 * // Implementation with individual methods
 * class SimpleReporter implements Reporter {
 *   readonly name = "simple";
 *
 *   onTestEnd(result: TestResult) {
 *     console.log(`${result.status}: ${result.test.name}`);
 *   }
 * }
 *
 * @example
 * // Implementation with generic event
 * class EventDrivenReporter implements Reporter {
 *   readonly name = "event-driven";
 *
 *   onEvent(event: ReporterEvent) {
 *     switch (event.type) {
 *       case "test_end":
 *         this.handleTestEnd(event.result);
 *         break;
 *       case "summary":
 *         this.printSummary(event.summary);
 *         break;
 *     }
 *   }
 * }
 */
export interface Reporter {
    /**
     * Unique reporter name
     * Used for identification and selection via CLI (--reporter <name>)
     */
    readonly name: string;
    /**
     * Called when test execution starts
     *
     * @param {number} totalFiles - Total number of files that will be executed
     */
    onStart?(totalFiles: number): void;
    /**
     * Called when test execution ends
     *
     * @param {RunSummary} summary - Complete summary with final metrics
     */
    onEnd?(summary: RunSummary): void;
    /**
     * Called when a test file starts executing
     *
     * @param {string} filePath - Absolute file path
     */
    onFileStart?(filePath: string): void;
    /**
     * Called when a test file finishes executing
     *
     * @param {FileResult} result - Complete file result
     */
    onFileEnd?(result: FileResult): void;
    /**
     * Called when an individual test starts
     *
     * @param {TestCase} test - Definition of the test that will be executed
     */
    onTestStart?(test: TestCase): void;
    /**
     * Called when an individual test ends
     *
     * @param {TestResult} result - Test execution result
     */
    onTestEnd?(result: TestResult): void;
    /**
     * Called when a test suite starts
     *
     * @param {string} name - Full suite name (with " > " as separator)
     */
    onSuiteStart?(name: string): void;
    /**
     * Called when a test suite ends
     *
     * @param {string} name - Full name of the finished suite
     */
    onSuiteEnd?(name: string): void;
    /**
     * Generic method to receive all events
     *
     * Provides a unified alternative to individual methods.
     * When implemented, receives all lifecycle events
     * in a single callback, allowing centralized logic.
     *
     * @param {ReporterEvent} event - Test lifecycle event
     *
     * @example
     * onEvent(event: ReporterEvent) {
     *   // Log all events for debugging
     *   console.log(`[${event.type}]`, event);
     * }
     */
    onEvent?(event: ReporterEvent): void;
}
/**
 * Abstract base class for reporter implementation
 *
 * Provides:
 * 1. Empty implementations for all callback methods
 * 2. Default implementation of onEvent that delegates to specific
 *    methods using pattern matching with discriminated union
 *
 * This allows subclasses to:
 * - Implement only the methods they want (inheriting empty ones)
 * - Have automatic support for onEvent without additional code
 * - Override onEvent if they need different logic
 *
 * @abstract
 * @class BaseReporter
 * @implements {Reporter}
 *
 * @example
 * class MyReporter extends BaseReporter {
 *   readonly name = "my-reporter";
 *
 *   // I only need to implement what interests me
 *   onTestEnd(result: TestResult) {
 *     // This method will be called automatically
 *     // both via direct callback and via onEvent
 *   }
 * }
 */
export declare abstract class BaseReporter implements Reporter {
    /**
     * Reporter name - must be defined by each subclass
     * @abstract
     */
    abstract readonly name: string;
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
    /**
     * Default implementation of the generic event handler
     *
     * Automatically routes events to the corresponding
     * specific methods. This ensures that reporters
     * that implement only individual methods also
     * work when called via onEvent.
     *
     * Subclasses can override this method to:
     * - Add common logic to all events (logging, metrics)
     * - Modify routing to specific methods
     * - Implement completely custom handling
     *
     * @param {ReporterEvent} event - Event to be processed
     *
     * @example
     * // Overriding to add logging
     * onEvent(event: ReporterEvent) {
     *   console.debug(`[${new Date().toISOString()}] ${event.type}`);
     *   super.onEvent(event); // Maintains default behavior
     * }
     */
    onEvent?(event: ReporterEvent): void;
}
/**
 * Interface for reporter configuration
 *
 * Allows specifying not only the reporter type,
 * but also custom options and output files.
 * Mainly used in file-based configurations
 * (e.g.: muitto.config.ts) or programmatic APIs.
 *
 * @interface ReporterConfig
 *
 * @example
 * // Simple configuration
 * const config: ReporterConfig = {
 *   type: "json"
 * };
 *
 * @example
 * // Configuration with options and output file
 * const config: ReporterConfig = {
 *   type: "junit",
 *   options: {
 *     suiteName: "My Test Suite",
 *     includeConsoleOutput: true
 *   },
 *   outputFile: "./reports/junit.xml"
 * };
 */
export interface ReporterConfig {
    /**
     * Reporter type (e.g.: "default", "dot", "verbose", "json", "junit")
     */
    type: string;
    /**
     * Reporter-specific options
     * Each reporter can define its own options
     */
    options?: Record<string, unknown>;
    /**
     * Path to output file
     * Used by reporters that generate files (json, junit)
     */
    outputFile?: string;
}
/**
 * Interface for reporter factories (Factory Pattern)
 *
 * Allows registration and dynamic creation of reporters,
 * facilitating framework extensibility with custom
 * or third-party reporters.
 *
 * Each factory is responsible for:
 * 1. Creating instances of the reporter it represents
 * 2. Declaring which reporter types it supports
 *
 * @interface ReporterFactory
 *
 * @example
 * // Factory implementation
 * class JsonReporterFactory implements ReporterFactory {
 *   supports(type: string): boolean {
 *     return type === "json";
 *   }
 *
 *   create(config?: ReporterConfig): Reporter {
 *     return new JsonReporter(config?.options);
 *   }
 * }
 *
 * @example
 * // Registration and usage
 * const registry = new ReporterRegistry();
 * registry.register(new JsonReporterFactory());
 * const reporter = registry.create({ type: "json" });
 */
export interface ReporterFactory {
    /**
     * Creates a new reporter instance
     *
     * @param {ReporterConfig} [config] - Optional configuration for the reporter
     * @returns {Reporter} New configured reporter instance
     */
    create(config?: ReporterConfig): Reporter;
    /**
     * Checks if this factory supports the specified reporter type
     *
     * Used to route creation to the correct factory in a registry
     *
     * @param {string} type - Reporter type (e.g.: "json", "junit")
     * @returns {boolean} True if this factory can create reporters of the specified type
     */
    supports(type: string): boolean;
}
//# sourceMappingURL=types.d.ts.map