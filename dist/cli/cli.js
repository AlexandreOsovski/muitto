#!/usr/bin/env node
import { resolve } from "node:path";
import { statSync } from "node:fs";
import { createRequire } from "node:module";
import { runTests, discoverTestFiles } from "../core/runner.js";
import { color } from "../colors.js";
import { HelpSystem, predefinedOptions } from "./help.js";
import { watchMode } from "./watch.js";
import { DefaultReporter, DotReporter, VerboseReporter, } from "../reporters/default.js";
import { JsonReporter } from "../reporters/json.js";
import { JunitReporter } from "../reporters/junit.js";
/** Regex pattern to identify test files */
const DEFAULT_PATTERN = /\.(test|spec)\.(ts|js|mjs|cjs)$/;
/** Reads the package.json version at runtime so the CLI never drifts from it */
const require = createRequire(import.meta.url);
const pkg = require("../../package.json");
/**
 * Parses command line arguments and returns a CliArgs object
 *
 * @param {string[]} argv - Array of command line arguments
 * @returns {CliArgs} Object with parsed options
 *
 * @example
 * parseArgs(['test.js', '--watch', '--timeout', '10000'])
 * // Returns: { files: ['test.js'], watch: true, timeoutMs: 10000, ... }
 */
function parseArgs(argv) {
    const args = {
        files: [],
        watch: false,
        coverage: false,
        reporter: "default",
        updateSnapshots: false,
        timeoutMs: 5000,
        bail: false,
        help: false,
        version: false,
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case "--watch":
            case "-w":
                args.watch = true;
                break;
            case "--coverage":
                args.coverage = true;
                break;
            case "--grep":
                args.grep = argv[++i];
                break;
            case "--reporter":
                args.reporter = argv[++i] || "default";
                break;
            case "--output":
            case "-o":
                args.outputFile = argv[++i];
                break;
            case "--update-snapshots":
                args.updateSnapshots = true;
                break;
            case "--timeout":
            case "-t":
                args.timeoutMs = Number(argv[++i]) || 5000;
                break;
            case "--bail":
                args.bail = true;
                break;
            case "--pattern":
            case "-p":
                args.pattern = new RegExp(argv[++i]);
                break;
            case "--help":
            case "-h":
                args.help = true;
                break;
            case "--version":
            case "-v":
                args.version = true;
                break;
            default:
                if (!arg.startsWith("-")) {
                    args.files.push(arg);
                }
                else {
                    console.error(color.red(`Unknown option: ${arg}`));
                    console.error("Use --help for available options");
                    process.exit(1);
                }
        }
    }
    return args;
}
/**
 * Returns the reporter instance based on the provided name
 *
 * @param {string} name - Reporter name (default, dot, verbose, json, junit)
 * @param {string} [outputFile] - Optional destination file for reporters that support it (json, junit)
 * @returns {Reporter} Corresponding reporter instance
 *
 * @example
 * getReporter('verbose') // Returns new VerboseReporter()
 * getReporter('json', './report.json') // Returns new JsonReporter({ outputFile: './report.json' })
 */
function getReporter(name, outputFile) {
    switch (name.toLowerCase()) {
        case "dot":
            return new DotReporter();
        case "verbose":
            return new VerboseReporter();
        case "json":
            return new JsonReporter({ outputFile });
        case "junit":
            return new JunitReporter({ outputFile });
        case "default":
        default:
            return new DefaultReporter();
    }
}
/**
 * CLI main function
 *
 * Responsible for:
 * - Parsing command line arguments
 * - Displaying help or version if requested
 * - Discovering test files
 * - Running tests in watch mode or single execution
 * - Displaying detailed results in case of failures
 *
 * @async
 * @returns {Promise<void>}
 */
async function main() {
    const args = parseArgs(process.argv.slice(2));
    // Show help
    if (args.help) {
        const helpSystem = new HelpSystem();
        helpSystem.addOptions(predefinedOptions);
        helpSystem.setVersion(pkg.version);
        console.log(helpSystem.render());
        process.exit(0);
    }
    // Show version
    if (args.version) {
        console.log(`mutto v${pkg.version}`);
        process.exit(0);
    }
    // Collect test files
    let files;
    if (args.files.length > 0) {
        files = [];
        for (const fileOrDir of args.files) {
            const resolved = resolve(fileOrDir);
            try {
                const stat = statSync(resolved);
                if (stat.isDirectory()) {
                    const discovered = discoverTestFiles(resolved, args.pattern ?? DEFAULT_PATTERN);
                    files.push(...discovered);
                }
                else if (stat.isFile()) {
                    files.push(resolved);
                }
            }
            catch {
                console.error(color.red(`Path not found: ${fileOrDir}`));
                process.exit(1);
            }
        }
    }
    else {
        files = discoverTestFiles(process.cwd(), args.pattern ?? DEFAULT_PATTERN);
    }
    files = [...new Set(files)];
    if (files.length === 0) {
        console.log(color.yellow("No test files found."));
        console.log(color.dim(`Pattern: ${args.pattern ?? DEFAULT_PATTERN}`));
        process.exit(0);
    }
    const reporter = getReporter(args.reporter, args.outputFile);
    const runOptions = {
        files,
        timeoutMs: args.timeoutMs,
        filter: args.grep,
        reporter,
        bail: args.bail,
    };
    // Watch mode
    if (args.watch) {
        await watchMode(runOptions);
        return;
    }
    // Single execution
    const summary = await runTests(runOptions);
    // If there are failures, show detailed summary (only meaningful for the default-style reporters)
    if (summary.totalFailed > 0 &&
        (reporter.name === "default" || reporter.name === "verbose")) {
        console.log("");
        console.log(color.red(color.bold("─".repeat(50))));
        console.log(color.red(color.bold("  FAILURES")));
        console.log(color.red(color.bold("─".repeat(50))));
        console.log("");
        // Show each failure with details
        for (const file of summary.files) {
            const failures = file.results.filter((r) => r.status === "failed");
            if (failures.length > 0) {
                for (const failure of failures) {
                    const suiteName = failure.test.suite.join(" > ");
                    const testName = failure.test.name;
                    console.log(color.red(color.bold(`FAIL ${suiteName ? suiteName + " > " : ""}${testName}()`)));
                    console.log("");
                    // Show formatted error
                    if (failure.error instanceof Error) {
                        const error = failure.error;
                        // If it has expected/received (AssertionError)
                        if (error.expected !== undefined) {
                            console.log(color.bold("  Expected:"));
                            console.log(color.green("    " + formatValue(error.expected)));
                            console.log("");
                            console.log(color.bold("  Received:"));
                            console.log(color.red("    " + formatValue(error.received)));
                            console.log("");
                        }
                        // Error message
                        console.log(color.dim("  " + error.message));
                        console.log("");
                        // Summarized stack trace
                        if (error.stack) {
                            const stackLines = error.stack.split("\n");
                            const relevantLine = stackLines.find((line) => line.includes(".test.") || line.includes(".spec."));
                            if (relevantLine) {
                                console.log(color.dim("  at " +
                                    relevantLine.trim().replace(/^at\s+/, "")));
                                console.log("");
                            }
                        }
                    }
                    else {
                        console.log(color.red("  " + String(failure.error)));
                        console.log("");
                    }
                    console.log("");
                }
            }
        }
    }
    process.exit(summary.totalFailed > 0 ? 1 : 0);
}
/**
 * Formats a value for readable display in error messages
 *
 * @param {unknown} value - Value to be formatted
 * @returns {string} Formatted representation of the value
 *
 * @example
 * formatValue("hello") // Returns: '"hello"'
 * formatValue(undefined) // Returns: 'undefined'
 * formatValue([1, 2, 3]) // Returns: '[\n  1,\n  2,\n  3\n]'
 */
function formatValue(value) {
    if (typeof value === "string")
        return `"${value}"`;
    if (value === undefined)
        return "undefined";
    if (value === null)
        return "null";
    if (Number.isNaN(value))
        return "NaN";
    if (typeof value === "function")
        return "[Function]";
    if (Array.isArray(value)) {
        try {
            return JSON.stringify(value, null, 2);
        }
        catch {
            return String(value);
        }
    }
    if (typeof value === "object") {
        try {
            return JSON.stringify(value, null, 2);
        }
        catch {
            return String(value);
        }
    }
    return String(value);
}
// Run the main function and catch fatal errors
main().catch((err) => {
    console.error(color.red("Fatal error:"));
    console.error(err);
    process.exit(1);
});
//# sourceMappingURL=cli.js.map