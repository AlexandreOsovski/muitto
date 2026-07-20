/**
 * Configuration loader for MUITTO
 *
 * Loads configuration from multiple sources in order of priority:
 * 1. Command line arguments (highest priority)
 * 2. .muittorc.json file
 * 3. muitto section in package.json
 * 4. Default configuration (lowest priority)
 *
 * @module config/loader
 *
 * @author alexandreosovski
 */
import { TestConfig } from './defaults.js';
/**
 * Options that can be passed via command line or API
 *
 * @interface LoadOptions
 */
export interface LoadOptions {
    /** Specific files to test (bypasses discovery) */
    files?: string[];
    /** Custom glob pattern to find tests */
    pattern?: string | string[];
    /** Custom test match patterns */
    testMatch?: string[];
    /** Timeout per test in milliseconds */
    timeout?: number;
    /** Reporter name */
    reporter?: string;
    /** Enable coverage */
    coverage?: boolean;
    /** Filter by test name */
    grep?: string;
    /** Stop on first failure */
    bail?: boolean;
}
/**
 * Loads and merges all configuration sources
 *
 * Priority order (highest to lowest):
 * 1. Options passed directly (from CLI or API)
 * 2. .muittorc.json
 * 3. package.json (muitto section)
 * 4. Default configuration
 *
 * @param {string} cwd - Current working directory
 * @param {LoadOptions} [options={}] - Options passed directly
 * @returns {TestConfig & LoadOptions} Merged configuration
 *
 * @example
 * const config = loadConfig(process.cwd(), {
 *   files: ['src/test.spec.ts'],
 *   timeout: 10000
 * });
 */
export declare function loadConfig(cwd: string, options?: LoadOptions): TestConfig & LoadOptions;
/**
 * Gets test files based on configuration and options
 *
 * @param {TestConfig & LoadOptions} config - Loaded configuration
 * @param {string} cwd - Current working directory
 * @returns {string[]} Array of test file paths
 *
 * @example
 * const config = loadConfig(process.cwd());
 * const files = getTestFiles(config, process.cwd());
 */
export declare function getTestFiles(config: TestConfig & LoadOptions, cwd: string): string[];
//# sourceMappingURL=loader.d.ts.map