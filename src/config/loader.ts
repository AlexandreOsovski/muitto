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
import { getDefaultConfig, TestConfig, findTestFiles } from './defaults.js';

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
function loadFromPackageJson(cwd: string): Partial<TestConfig> {
  try {
    const packagePath = resolve(cwd, 'package.json');
    if (!existsSync(packagePath)) return {};

    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.muitto || {};
  } catch (_) {
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
function loadFromRcFile(cwd: string): Partial<TestConfig> {
  try {
    const rcPath = resolve(cwd, '.muittorc.json');
    if (!existsSync(rcPath)) return {};

    return JSON.parse(readFileSync(rcPath, 'utf-8'));
  } catch (_) {
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
export function loadConfig(cwd: string, options: LoadOptions = {}): TestConfig & LoadOptions {
  // Start with defaults
  const config = getDefaultConfig();

  // Load from package.json
  const packageConfig = loadFromPackageJson(cwd);
  Object.assign(config, packageConfig);

  // Load from .muittorc.json (overrides package.json)
  const rcConfig = loadFromRcFile(cwd);
  Object.assign(config, rcConfig);

  // Start with config and add options
  const result: any = {
    ...config,
    ...options
  };

  // Ensure pattern is always an array
  if (options.pattern) {
    result.pattern = Array.isArray(options.pattern) ? options.pattern : [options.pattern];
  }

  return result as TestConfig & LoadOptions;
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
export function getTestFiles(config: TestConfig & LoadOptions, cwd: string): string[] {
  // If files were explicitly provided, use them
  if (config.files && config.files.length > 0) {
    return config.files.map((f: string) => resolve(cwd, f));
  }

  // Otherwise discover test files
  return findTestFiles(config, cwd);
}
