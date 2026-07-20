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
export class BaseReporter {
    /** @inheritdoc */
    onStart(totalFiles) { }
    /** @inheritdoc */
    onEnd(summary) { }
    /** @inheritdoc */
    onFileStart(filePath) { }
    /** @inheritdoc */
    onFileEnd(result) { }
    /** @inheritdoc */
    onTestStart(test) { }
    /** @inheritdoc */
    onTestEnd(result) { }
    /** @inheritdoc */
    onSuiteStart(name) { }
    /** @inheritdoc */
    onSuiteEnd(name) { }
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
    onEvent(event) {
        /**
         * Routing based on event type (discriminated union)
         * Each case extracts specific data and calls the corresponding method
         */
        switch (event.type) {
            case "start":
                this.onStart?.(event.total);
                break;
            case "file_start":
                this.onFileStart?.(event.filePath);
                break;
            case "file_end":
                this.onFileEnd?.(event.result);
                break;
            case "test_start":
                this.onTestStart?.(event.test);
                break;
            case "test_end":
                this.onTestEnd?.(event.result);
                break;
            case "suite_start":
                this.onSuiteStart?.(event.name);
                break;
            case "suite_end":
                this.onSuiteEnd?.(event.name);
                break;
            case "summary":
                this.onEnd?.(event.summary);
                break;
            // Hook events are ignored by default
            // Subclasses can add specific handling
        }
    }
}
//# sourceMappingURL=types.js.map