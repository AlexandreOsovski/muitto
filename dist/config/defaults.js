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
export function getDefaultConfig() {
    const possiblePatterns = [
        'src/**/*.{test,spec}.ts',
        'src/**/*.{test,spec}.js',
        'test/**/*.{test,spec}.ts',
        'test/**/*.{test,spec}.js',
        '__tests__/**/*.{test,spec}.ts',
        '__tests__/**/*.{test,spec}.js',
        '**/__tests__/**/*.ts',
        '**/__tests__/**/*.js',
        '**/?(*.)+(spec|test).ts',
        '**/?(*.)+(spec|test).js'
    ];
    return {
        pattern: possiblePatterns,
        testMatch: [
            '**/__tests__/**/*.ts',
            '**/__tests__/**/*.js',
            '**/?(*.)+(spec|test).ts',
            '**/?(*.)+(spec|test).js'
        ],
        testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/build/'],
        timeout: 5000,
        reporter: 'default',
        coverage: false
    };
}
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
export function findTestFiles(config, cwd) {
    const { glob } = require('glob');
    const files = [];
    for (const pattern of config.pattern) {
        const matches = glob.sync(pattern, {
            cwd,
            ignore: config.testPathIgnorePatterns,
            absolute: true,
            nodir: true
        });
        files.push(...matches);
    }
    // Remove duplicates and return
    return [...new Set(files)].sort();
}
//# sourceMappingURL=defaults.js.map