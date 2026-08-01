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

import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Configuration interface for test discovery and execution
 *
 * @interface TestConfig
 */
export interface TestConfig {
  /** Array of glob patterns to find test files */
  pattern: string[];
  /** Alternative test match patterns */
  testMatch: string[];
  /** Patterns to ignore during test discovery */
  testPathIgnorePatterns: string[];
  /** Default timeout per test in milliseconds */
  timeout: number;
  /** Default reporter name */
  reporter: string;
  /** Whether coverage is enabled by default */
  coverage: boolean;
  /** Whether to overwrite snapshots instead of comparing them */
  updateSnapshots: boolean;
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
export function getDefaultConfig(): TestConfig {
  /**
   * Note: only plain glob syntax (**, *, ?, {a,b}) is supported by the
   * matcher in findTestFiles() — no extglob (`?(...)`, `+(...)`). The
   * catch-all patterns below use `**\/*.{test,spec}.ts` (brace expansion)
   * instead, which already covers a .test.ts/.spec.ts file anywhere.
   */
  const possiblePatterns = [
    'src/**/*.{test,spec}.ts',
    'src/**/*.{test,spec}.js',
    'test/**/*.{test,spec}.ts',
    'test/**/*.{test,spec}.js',
    '__tests__/**/*.{test,spec}.ts',
    '__tests__/**/*.{test,spec}.js',
    '**/__tests__/**/*.ts',
    '**/__tests__/**/*.js',
    '**/*.{test,spec}.ts',
    '**/*.{test,spec}.js'
  ];

  return {
    pattern: possiblePatterns,
    testMatch: [
      '**/__tests__/**/*.ts',
      '**/__tests__/**/*.js',
      '**/*.{test,spec}.ts',
      '**/*.{test,spec}.js'
    ],
    testPathIgnorePatterns: ['/node_modules/', '/dist/', '/coverage/', '/build/'],
    timeout: 5000,
    reporter: 'default',
    coverage: false,
    updateSnapshots: false
  };
}

/**
 * Directories that are never walked into during discovery,
 * regardless of what testPathIgnorePatterns says.
 */
const ALWAYS_IGNORED_DIRS = new Set([
  'node_modules', 'dist', '.git', 'coverage', 'build', '.next', '.nuxt'
]);

/**
 * Escapes a single character for safe use inside a RegExp
 */
function escapeRegExpChar(char: string): string {
  return char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Compiles a glob-style pattern (as used in `pattern`/`testMatch` config)
 * into a RegExp matched against a forward-slash-normalized relative path.
 *
 * Supports the subset of glob syntax actually used by MUITTO's defaults:
 * - `**` matches any number of path segments (including zero)
 * - `*` matches anything except a path separator
 * - `?` matches a single character except a path separator
 * - `{a,b,c}` matches any of the comma-separated alternatives
 *
 * @param {string} pattern - Glob pattern, e.g. "src/**\/*.{test,spec}.ts"
 * @returns {RegExp} Compiled, anchored regular expression
 */
function globToRegExp(pattern: string): RegExp {
  const normalized = pattern.replace(/\\/g, '/').replace(/^\.\//, '');
  let re = '';
  let i = 0;

  while (i < normalized.length) {
    const char = normalized[i];

    if (char === '*') {
      if (normalized[i + 1] === '*') {
        let j = i + 2;
        if (normalized[j] === '/') j++;
        re += '(?:.*/)?';
        i = j;
        continue;
      }
      re += '[^/]*';
      i++;
      continue;
    }

    if (char === '?') {
      re += '[^/]';
      i++;
      continue;
    }

    if (char === '{') {
      const end = normalized.indexOf('}', i);
      if (end === -1) {
        re += '\\{';
        i++;
        continue;
      }
      const alternatives = normalized
        .slice(i + 1, end)
        .split(',')
        .map((alt) => alt.split('').map(escapeRegExpChar).join(''));
      re += `(?:${alternatives.join('|')})`;
      i = end + 1;
      continue;
    }

    re += escapeRegExpChar(char);
    i++;
  }

  return new RegExp(`^${re}$`);
}

/**
 * Checks whether a relative path matches any of the given glob patterns
 *
 * @param {string} relPath - Path relative to cwd, using forward slashes
 * @param {string[]} patterns - Glob patterns to match against
 * @returns {boolean} True if relPath matches at least one pattern
 */
function matchesAnyPattern(relPath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => globToRegExp(pattern).test(relPath));
}

/**
 * Finds all test files matching the configured patterns
 *
 * Uses native Node.js fs module to traverse directories, matching each
 * discovered file against `config.pattern` (and `config.testMatch` as an
 * additional set of accepted patterns) so that custom patterns supplied via
 * .muittorc.json / package.json actually take effect instead of being
 * purely cosmetic.
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
export function findTestFiles(config: TestConfig, cwd: string): string[] {
  const files: string[] = [];
  const ignorePatterns = config.testPathIgnorePatterns || [];
  const matchPatterns = [
    ...(config.pattern || []),
    ...(config.testMatch || []),
  ];

  /**
   * Checks if a path should be ignored based on testPathIgnorePatterns
   */
  function shouldIgnore(filePath: string): boolean {
    const normalized = filePath.replace(/\\/g, '/');
    for (const ignore of ignorePatterns) {
      if (normalized.includes(ignore)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Recursively walks through directories
   */
  function walk(dir: string): void {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      // Skip inaccessible directories
      return;
    }

    for (const entry of entries) {
      if (ALWAYS_IGNORED_DIRS.has(entry)) continue;

      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }

      if (stat.isDirectory()) {
        walk(fullPath);
      } else if (stat.isFile()) {
        const relPath = relative(cwd, fullPath).replace(/\\/g, '/');
        if (shouldIgnore(relPath)) continue;
        if (matchPatterns.length > 0 && matchesAnyPattern(relPath, matchPatterns)) {
          files.push(fullPath);
        }
      }
    }
  }

  walk(cwd);
  return files.sort();
}
