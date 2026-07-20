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
}
//# sourceMappingURL=base.js.map