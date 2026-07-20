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
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { getDefaultConfig, findTestFiles } from './defaults.js';
/**
 * Loads configuration from package.json if available
 *
 * Looks for a "muitto" property in package.json
 *
 * @param {string} cwd - Current working directory
 * @returns {Partial<TestConfig>} Configuration from package.json
 *
 * @example
 * // package.json
 * {
 *   "muitto": {
 *     "testMatch": ["src/**\/*.spec.ts"],
 *     "timeout": 10000
 *   }
 * }
 */
function loadFromPackageJson(cwd) {
    try {
        const packagePath = resolve(cwd, 'package.json');
        if (!existsSync(packagePath))
            return {};
        const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
        return packageJson.muitto || {};
    }
    catch (_) {
        return {};
    }
}
/**
 * Loads configuration from .muittorc.json if available
 *
 * @param {string} cwd - Current working directory
 * @returns {Partial<TestConfig>} Configuration from .muittorc.json
 *
 * @example
 * // .muittorc.json
 * {
 *   "pattern": ["src/**\/*.spec.ts"],
 *   "reporter": "verbose"
 * }
 */
function loadFromRcFile(cwd) {
    try {
        const rcPath = resolve(cwd, '.muittorc.json');
        if (!existsSync(rcPath))
            return {};
        return JSON.parse(readFileSync(rcPath, 'utf-8'));
    }
    catch (_) {
        return {};
    }
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
export function loadConfig(cwd, options = {}) {
    // Start with defaults
    const config = getDefaultConfig();
    // Load from package.json
    const packageConfig = loadFromPackageJson(cwd);
    Object.assign(config, packageConfig);
    // Load from .muittorc.json (overrides package.json)
    const rcConfig = loadFromRcFile(cwd);
    Object.assign(config, rcConfig);
    // Start with config and add options
    const result = {
        ...config,
        ...options
    };
    // Ensure pattern is always an array
    if (options.pattern) {
        result.pattern = Array.isArray(options.pattern) ? options.pattern : [options.pattern];
    }
    return result;
}
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
export function getTestFiles(config, cwd) {
    // If files were explicitly provided, use them
    if (config.files && config.files.length > 0) {
        return config.files.map((f) => resolve(cwd, f));
    }
    // Otherwise discover test files
    return findTestFiles(config, cwd);
}
//# sourceMappingURL=loader.js.map