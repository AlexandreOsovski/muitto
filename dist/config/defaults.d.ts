/**
 * Default configuration for MUITTO test runner
 *
 * Provides intelligent test file discovery with multiple common patterns
 * and sensible defaults for different project structures
 *
 * @module config/defaults
 *
 * @author alexandreosovski
 */
/**
 * Configuration interface for test discovery and execution
 *
 * @interface TestConfig
 */
export interface TestConfig {
    /** Array of glob patterns to find test files */
    pattern: string[];
    /** Alternative test match patterns (compatible with Jest) */
    testMatch: string[];
    /** Patterns to ignore during test discovery */
    testPathIgnorePatterns: string[];
    /** Default timeout per test in milliseconds */
    timeout: number;
    /** Default reporter name */
    reporter: string;
    /** Whether coverage is enabled by default */
    coverage: boolean;
}
/**
 * Returns the default configuration with intelligent test discovery
 *
 * Searches for test files in common locations:
 * - src/**\/*.spec.ts (NestJS/TS projects)
 * - src/**\/*.test.ts (General TS projects)
 * - test/**\/*.spec.ts (E2E tests)
 * - __tests__/**\/*.ts (React/Node projects)
 * - **\/__tests__/**\/*.ts (Universal pattern)
 *
 * @returns {TestConfig} Default configuration object
 *
 * @example
 * const config = getDefaultConfig();
 * console.log(config.pattern); // ['src/**\/*.spec.ts', ...]
 */
export declare function getDefaultConfig(): TestConfig;
/**
 * Finds all test files matching the configured patterns
 *
 * Uses glob to discover test files, removes duplicates,
 * and filters out ignored paths
 *
 * @param {TestConfig} config - Test configuration with patterns
 * @param {string} cwd - Current working directory to search from
 * @returns {string[]} Array of absolute paths to test files
 *
 * @example
 * const config = getDefaultConfig();
 * const files = findTestFiles(config, process.cwd());
 * console.log(`Found ${files.length} test files`);
 */
export declare function findTestFiles(config: TestConfig, cwd: string): string[];
//# sourceMappingURL=defaults.d.ts.map