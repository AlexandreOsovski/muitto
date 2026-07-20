import { watch as fsWatch } from "node:fs";
import { resolve } from "node:path";
import { color, divider } from "../colors.js";
import { runTests } from "../core/runner.js";
import type { RunOptions } from "../core/runner.js";

/**
 * Interface that extends run options with watch mode specific settings
 *
 * @interface WatchOptions
 * @extends {RunOptions}
 *
 * @author alexandreosovski
 */
interface WatchOptions extends RunOptions {
  /** Debounce time in milliseconds before re-running tests after a change */
  debounceMs?: number;
}

/**
 * Runs the test runner in watch mode, observing file changes
 * and re-running tests automatically
 *
 * Watch mode features:
 * - Recursively watches directories for file changes
 * - Smart debounce to avoid excessive runs
 * - Interactive interface with keyboard shortcuts
 * - Filtering of irrelevant files (node_modules, .git, dist)
 * - Support for multiple watch directories
 *
 * @async
 * @param {WatchOptions} options - Watch mode configuration options
 * @returns {Promise<void>}
 *
 * @example
 * await watchMode({
 *   files: ['./tests'],
 *   timeoutMs: 5000,
 *   debounceMs: 500
 * });
 */
export async function watchMode(options: WatchOptions): Promise<void> {
  /** Default debounce time of 300ms if not specified */
  const debounceMs = options.debounceMs ?? 300;

  /** Timer for debounce control */
  let timeout: NodeJS.Timeout | null = null;

  /** Flag to prevent concurrent runs */
  let isRunning = false;

  /** Flag to control whether this is the first run */
  let isFirstRun = true;

  // Determine which directories to watch
  const watchDirs = new Set<string>();

  if (options.files && options.files.length > 0) {
    for (const file of options.files) {
      watchDirs.add(resolve(file));
    }
  } else {
    watchDirs.add(process.cwd());
  }

  /**
   * Runs the tests and manages execution state
   *
   * @async
   * @param {string} [changedFile] - File that triggered the re-run (optional)
   * @returns {Promise<void>}
   */
  const executeTests = async (changedFile?: string) => {
    // Prevents concurrent runs
    if (isRunning) return;

    // Shows changed file information (except on first run)
    if (!isFirstRun && changedFile) {
      console.log(color.dim("\nFile changed:"));
      console.log(`  ${color.cyan(changedFile)}`);
      console.log(color.dim("\nRe-running tests...\n"));
    }

    isRunning = true;

    try {
      await runTests(options);
    } catch (error) {
      console.error(color.red("Error running tests:"), error);
    } finally {
      isRunning = false;
      isFirstRun = false;
      // Updates the interface after each run
      showWatchInterface();
    }
  };

  // First immediate run when starting watch mode
  await executeTests();

  /**
   * Sets up filesystem watchers for each directory
   *
   * Each watcher recursively observes its directory for changes,
   * filtering irrelevant files and applying debounce before
   * re-running the tests
   */
  for (const dir of watchDirs) {
    try {
      fsWatch(dir, { recursive: true }, (eventType, filename) => {
        if (!filename) return;

        // Ignores non-relevant files to avoid unnecessary runs
        if (
          filename.includes("node_modules") ||
          filename.includes(".git") ||
          filename.includes("dist")
        ) {
          return;
        }

        // Only reacts to files that may contain tests or source code
        if (!filename.match(/\.(ts|js|mjs|cjs)$/)) return;

        // Applies debounce: cancels previous timer and creates a new one
        if (timeout) clearTimeout(timeout);

        timeout = setTimeout(() => {
          executeTests(filename);
        }, debounceMs);
      });
    } catch (error) {
      console.error(color.red(`Failed to watch ${dir}:`), error);
    }
  }

  // Sets up keyboard input for user interaction
  setupKeyboardInput(() => executeTests());
}

/**
 * Displays the watch mode interface in the console
 *
 * Shows information about the current state, usage instructions,
 * and available keyboard shortcuts for the user
 *
 * @function showWatchInterface
 */
function showWatchInterface(): void {
  console.log(divider.light);
  console.log(color.bold(color.cyan("👀 Watch Mode")));
  console.log("");
  console.log(color.dim("✓ Waiting for file changes..."));
  console.log("");
  console.log(color.dim("Press h to show help"));
  console.log(color.dim("Press q to quit"));
  console.log(color.dim("Press r to rerun all tests"));
  console.log(color.dim("Press c to clear the screen"));
  console.log(divider.light);
}

/**
 * Sets up the keyboard input handler for interactive mode
 *
 * Allows the user to control watch mode through keyboard shortcuts,
 * including test rerun, navigation, and program exit.
 *
 * Only works on TTY (interactive) terminals.
 *
 * @param {() => Promise<void>} rerunFn - Callback function to re-run the tests
 *
 * @example
 * setupKeyboardInput(async () => {
 *   await runTests(options);
 * });
 */
function setupKeyboardInput(rerunFn: () => Promise<void>): void {
  const stdin = process.stdin;

  // Only sets up if in an interactive terminal
  if (stdin.isTTY) {
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    /**
     * Keyboard event handler
     * Maps keys to specific watch mode actions
     */
    stdin.on("data", async (key: string) => {
      // Ctrl+C to exit
      if (key === "\u0003") {
        console.log(color.dim("\n\nExiting watch mode...\n"));
        process.exit(0);
      }

      switch (key.toLowerCase()) {
        case "q":
          console.log(color.dim("\n\nExiting watch mode...\n"));
          process.exit(0);
          break;
        case "h":
          showHelp();
          break;
        case "r":
          console.log(color.dim("\n\nRe-running all tests...\n"));
          await rerunFn();
          break;
        case "c":
          console.clear();
          showWatchInterface();
          break;
        case "\u000d": // Enter key
          await rerunFn();
          break;
      }
    });
  }
}

/**
 * Displays the watch mode help screen with all available shortcuts
 *
 * Clears the current screen, shows commands, and waits for any key
 * to return to the main watch mode interface
 *
 * @function showHelp
 *
 * @example
 * // Called when user presses 'h' in watch mode
 * showHelp();
 */
function showHelp(): void {
  console.clear();
  console.log(color.bold(color.cyan("\n👀 Watch Mode Help")));
  console.log("");
  console.log(color.bold("Keyboard Shortcuts:"));
  console.log(`  ${color.cyan("q")}      - Quit watch mode`);
  console.log(`  ${color.cyan("h")}      - Show this help`);
  console.log(`  ${color.cyan("r")}      - Rerun all tests`);
  console.log(`  ${color.cyan("c")}      - Clear screen`);
  console.log(`  ${color.cyan("Enter")}  - Rerun tests`);
  console.log(`  ${color.cyan("Ctrl+C")}  - Exit`);
  console.log("");
  console.log(color.dim("Press any key to return...\n"));

  /**
   * Waits for any key to return to the main interface
   * Uses once to ensure the handler is removed after the first keypress
   */
  process.stdin.once("data", () => {
    console.clear();
    showWatchInterface();
  });
}
