/**
 * High-precision timer for performance measurement
 *
 * Provides timing functionalities with support for:
 * - High-resolution time measurement (microseconds)
 * - Named markers for partial measurements
 * - Friendly duration formatting
 * - Slow test detection
 * - Fallback to Date.now() in environments without Performance API
 *
 * @class PerformanceTimer
 *
 * @example
 * const timer = new PerformanceTimer();
 * timer.start();
 * // ... code to be measured ...
 * const duration = timer.getDuration();
 * console.log(timer.formatDuration(duration)); // "123ms"
 *
 * @example
 * // Using markers for partial measurements
 * timer.start();
 * timer.mark('setup');
 * // ... setup ...
 * timer.mark('execution');
 * // ... execution ...
 * const setupTime = timer.getDuration('setup'); // time from setup until now
 * const execTime = timer.getDuration('execution'); // time from execution until now
 */
export declare class PerformanceTimer {
    /** Timestamp of when the timer was started */
    private startTime;
    /** Map of named markers with their respective timestamps */
    private marks;
    /**
     * Starts the timer and clears all previous markers
     *
     * Records the current moment as a reference point for
     * all subsequent measurements
     *
     * @returns {void}
     *
     * @example
     * const timer = new PerformanceTimer();
     * timer.start();
     * // ... operation ...
     * console.log(timer.getDuration()); // ms since start()
     */
    start(): void;
    /**
     * Creates a named marker with the current timestamp
     *
     * Useful for measuring partial times within a larger operation.
     * Markers can be used later with getDuration()
     * to calculate specific intervals.
     *
     * @param {string} name - Marker name for future reference
     * @returns {void}
     *
     * @example
     * timer.start();
     * // ... initialization ...
     * timer.mark('init-complete');
     * // ... processing ...
     * const initTime = timer.getDuration('init-complete');
     */
    mark(name: string): void;
    /**
     * Calculates the duration since the start or since a specific marker
     *
     * @param {string} [startMark] - Marker name to calculate duration from
     * @returns {number} Duration in milliseconds (with microsecond precision)
     *
     * @example
     * const totalTime = timer.getDuration(); // since start()
     * const partialTime = timer.getDuration('checkpoint'); // since 'checkpoint' marker
     */
    getDuration(startMark?: string): number;
    /**
     * Returns the timestamp of when the timer was started
     *
     * @returns {number} Timestamp in milliseconds of the timer start
     *
     * @example
     * const startTimestamp = timer.getStartTime();
     * console.log(`Timer started at: ${new Date(startTimestamp).toISOString()}`);
     */
    getStartTime(): number;
    /**
     * Checks if the total duration exceeds a specified threshold
     *
     * Useful for identifying slow tests or operations that may
     * need optimization
     *
     * @param {number} [threshold=100] - Threshold in milliseconds (default: 100ms)
     * @returns {boolean} True if the duration exceeds the threshold
     *
     * @example
     * const timer = new PerformanceTimer();
     * timer.start();
     * await heavyOperation();
     *
     * if (timer.isSlow(200)) {
     *   console.warn('Operation took more than 200ms!');
     * }
     */
    isSlow(threshold?: number): boolean;
    /**
     * Formats a duration in milliseconds for friendly display
     *
     * Formatting rules:
     * - < 1ms: displays "<1ms"
     * - < 1000ms: displays in milliseconds (e.g.: "523ms")
     * - ≥ 1000ms: displays in seconds with 2 decimal places (e.g.: "1.52s")
     *
     * @param {number} ms - Duration in milliseconds
     * @returns {string} Formatted duration string
     *
     * @example
     * timer.formatDuration(0.5);    // "<1ms"
     * timer.formatDuration(523);    // "523ms"
     * timer.formatDuration(1523);   // "1.52s"
     * timer.formatDuration(5000);   // "5.00s"
     */
    formatDuration(ms: number): string;
}
//# sourceMappingURL=timer.d.ts.map