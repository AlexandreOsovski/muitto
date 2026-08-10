/**
 * Code coverage instrumentation using Node's built-in V8 inspector
 *
 * MUITTO measures coverage with the `node:inspector` Profiler domain
 * (precise, block-level coverage) instead of an external library like
 * istanbul/nyc/c8. This keeps the zero-runtime-dependency guarantee: no
 * package outside Node itself is involved.
 *
 * High-level flow:
 * 1. {@link startCoverage} opens an in-process inspector session and asks
 *    V8 to start tracking precise, block-level execution counts for every
 *    script loaded from then on.
 * 2. The runner imports and executes test files as usual — nothing about
 *    test execution changes.
 * 3. {@link stopCoverage} asks V8 for the accumulated coverage data: for
 *    every loaded script, a list of functions, each with a list of byte
 *    ranges and how many times that range executed.
 * 4. {@link buildCoverageReport} converts those byte ranges into the
 *    line/function/branch metrics developers actually care about.
 *
 * @module core/coverage
 *
 * @author alexandreosovski
 */

import inspector from "node:inspector";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import type { CoverageMetric, CoverageReport, FileCoverage } from "../types.js";
import { color, divider } from "../colors.js";

/**
 * Directories coverage never reports on, mirroring
 * `ALWAYS_IGNORED_DIRS` in config/defaults.ts (kept as a separate literal
 * here to avoid coupling the two modules over an internal constant).
 */
const COVERAGE_IGNORED_DIRS = new Set([
  "node_modules", "dist", ".git", "coverage", "build", ".next", ".nuxt"
]);

/**
 * A single byte-offset range within a script, as reported by V8's
 * Profiler.takePreciseCoverage, along with how many times it executed.
 *
 * @interface V8Range
 */
interface V8Range {
  /** Byte offset (inclusive) where this range starts */
  startOffset: number;
  /** Byte offset (exclusive) where this range ends */
  endOffset: number;
  /** Number of times this range was executed */
  count: number;
}

/**
 * Coverage data for a single function (or, for the entry with an empty
 * `functionName`, the whole top-level module body) within a script.
 *
 * @interface V8FunctionCoverage
 */
interface V8FunctionCoverage {
  /** Function name, or "" for the synthetic top-level entry */
  functionName: string;
  /** Ranges within this function, outermost first */
  ranges: V8Range[];
  /** Whether V8 tracked block-level (not just function-level) granularity */
  isBlockCoverage: boolean;
}

/**
 * Coverage data for a single loaded script (module), as returned by
 * Profiler.takePreciseCoverage.
 *
 * @interface V8ScriptCoverage
 */
interface V8ScriptCoverage {
  /** V8-internal script identifier */
  scriptId: string;
  /** The script's URL (a `file://...` URL for locally loaded modules) */
  url: string;
  /** Per-function coverage within this script */
  functions: V8FunctionCoverage[];
}

/**
 * Handle returned by {@link startCoverage}, opaque to callers — pass it
 * straight to {@link stopCoverage} once the run is done.
 *
 * @interface CoverageSession
 */
export interface CoverageSession {
  /** The underlying inspector session (kept alive between start/stop) */
  session: inspector.Session;
}

/**
 * Sends an inspector protocol command and resolves with its result,
 * wrapping the callback-based `session.post` API in a Promise.
 *
 * @param {inspector.Session} session - Connected inspector session
 * @param {string} method - Protocol method name (e.g. "Profiler.enable")
 * @param {object} [params] - Optional method parameters
 * @returns {Promise<any>} Resolves with the command's result payload
 */
function post(session: inspector.Session, method: string, params?: object): Promise<any> {
  return new Promise((resolvePromise, reject) => {
    const callback = (err: Error | null, result: any) => {
      if (err) reject(err);
      else resolvePromise(result);
    };
    if (params) session.post(method, params, callback);
    else session.post(method, callback);
  });
}

/**
 * Starts V8 precise coverage tracking for the current process
 *
 * Opens a new inspector session, enables the Profiler domain, and starts
 * precise (call-count) coverage with block-level detail. Must be called
 * before any of the test files under coverage are imported/executed, so
 * that V8 tracks their execution from the very first line.
 *
 * @async
 * @returns {Promise<CoverageSession>} Handle to pass to {@link stopCoverage}
 *
 * @example
 * const handle = await startCoverage();
 * // ... run test files ...
 * const raw = await stopCoverage(handle);
 */
export async function startCoverage(): Promise<CoverageSession> {
  const session = new inspector.Session();
  session.connect();
  await post(session, "Profiler.enable");
  await post(session, "Profiler.startPreciseCoverage", { callCount: true, detailed: true });
  return { session };
}

/**
 * Stops V8 coverage tracking and returns the accumulated raw data
 *
 * @async
 * @param {CoverageSession} handle - Handle returned by {@link startCoverage}
 * @returns {Promise<V8ScriptCoverage[]>} Raw per-script coverage data
 */
export async function stopCoverage(handle: CoverageSession): Promise<V8ScriptCoverage[]> {
  const { result } = await post(handle.session, "Profiler.takePreciseCoverage");
  await post(handle.session, "Profiler.stopPreciseCoverage");
  handle.session.disconnect();
  return result as V8ScriptCoverage[];
}

/**
 * Builds a `{total, covered, skipped, pct}` metric from raw counts
 *
 * @param {number} total - Total countable items
 * @param {number} covered - Items executed at least once
 * @returns {CoverageMetric} Metric with `pct` derived from total/covered
 */
function metric(total: number, covered: number): CoverageMetric {
  return {
    total,
    covered,
    skipped: 0,
    pct: total === 0 ? 100 : Math.round((covered / total) * 1000) / 10,
  };
}

/**
 * Builds the byte-offset -> line-number index for a source file
 *
 * @param {string} source - Full source text of the file
 * @returns {number[]} Byte offset where each line starts (index 0 = line 1)
 */
function buildLineStarts(source: string): number[] {
  const starts = [0];
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "\n") starts.push(i + 1);
  }
  return starts;
}

/**
 * Finds the count in effect at a given byte offset
 *
 * V8's ranges for a script form a tree (nested ranges override their
 * parent's count for the sub-interval they cover — e.g. an `if` branch
 * that didn't run gets its own zero-count range inside the function's
 * otherwise-executed range). The *narrowest* range containing a given
 * offset is therefore always the most specific, and correctly reflects
 * the true execution count at that exact point without needing full
 * interval subtraction across the whole tree.
 *
 * @param {V8Range[]} ranges - All ranges from every function in the script
 * @param {number} offset - Byte offset to look up
 * @returns {number} Execution count in effect at that offset (0 if none)
 */
function countAtOffset(ranges: V8Range[], offset: number): number {
  let best: V8Range | null = null;
  for (const range of ranges) {
    if (offset >= range.startOffset && offset < range.endOffset) {
      if (!best || (range.endOffset - range.startOffset) < (best.endOffset - best.startOffset)) {
        best = range;
      }
    }
  }
  return best ? best.count : 0;
}

/**
 * Converts one script's raw V8 coverage into per-file metrics
 *
 * Line coverage is approximated by taking, for each non-blank line, the
 * offset of its first non-whitespace character and checking the count in
 * effect there (see {@link countAtOffset}). This is a common lightweight
 * approximation for V8-based coverage tools: it doesn't require parsing
 * the source into an AST to find "real" statement boundaries, at the cost
 * of occasionally mis-classifying a line whose only executable content
 * starts after other (non-executable) characters not at the line's start.
 * Blank lines are excluded from the total entirely.
 *
 * Function coverage counts every named function entry (the synthetic
 * top-level "" entry is excluded) and considers it covered if its own
 * declared range (`ranges[0]`) executed at least once.
 *
 * Branch coverage is a heuristic, not a real AST-based analysis: V8 gives
 * a function more than one range only when it has internal block
 * structure (e.g. an `if`/`else`, a loop body, a `switch` case). Each
 * range beyond the function's own outer range is treated as one "branch",
 * covered if its count is greater than 0. This under- and over-counts
 * relative to what a proper branch-coverage tool would report (it doesn't
 * distinguish `if` from `switch` from logical `&&`/`||` short-circuits,
 * and loop bodies show up as a single "branch" regardless of iteration
 * count) — but it's a genuine, non-fabricated signal, not a placeholder,
 * and needs no additional instrumentation beyond what line/function
 * coverage already parses.
 *
 * @param {string} source - Full source text of the file
 * @param {V8FunctionCoverage[]} functions - Per-function coverage from V8
 * @returns {FileCoverage} Aggregated line/statement/function/branch metrics
 */
function computeFileCoverage(source: string, functions: V8FunctionCoverage[]): FileCoverage {
  const lineStarts = buildLineStarts(source);
  const lines = source.split("\n");

  const allRanges: V8Range[] = [];
  for (const fn of functions) {
    allRanges.push(...fn.ranges);
  }

  let totalLines = 0;
  let coveredLines = 0;
  const uncoveredLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i].replace(/\r$/, "");
    if (raw.trim() === "") continue;

    const leadingWhitespace = raw.length - raw.trimStart().length;
    const offset = lineStarts[i] + leadingWhitespace;

    totalLines++;
    if (countAtOffset(allRanges, offset) > 0) {
      coveredLines++;
    } else {
      uncoveredLines.push(i + 1);
    }
  }

  const namedFunctions = functions.filter((fn) => fn.functionName !== "");
  const coveredFunctions = namedFunctions.filter((fn) => (fn.ranges[0]?.count ?? 0) > 0).length;

  let branchTotal = 0;
  let branchCovered = 0;
  for (const fn of functions) {
    for (let i = 1; i < fn.ranges.length; i++) {
      branchTotal++;
      if (fn.ranges[i].count > 0) branchCovered++;
    }
  }

  const lineMetric = metric(totalLines, coveredLines);

  return {
    lines: lineMetric,
    // Approximated with line coverage — see the module-level doc comment.
    statements: lineMetric,
    functions: metric(namedFunctions.length, coveredFunctions),
    branches: metric(branchTotal, branchCovered),
    uncoveredLines,
  };
}

/**
 * Converts raw V8 coverage data (from {@link stopCoverage}) into a
 * {@link CoverageReport}
 *
 * Scripts are only included when their URL is a `file://` path that
 * resolves under `cwd`, isn't inside one of the always-ignored
 * directories (node_modules, dist, .git, coverage, build, .next, .nuxt —
 * same list used for test discovery), and isn't one of the test files
 * themselves (coverage measures the code *under* test, not the tests).
 *
 * @param {V8ScriptCoverage[]} raw - Raw per-script coverage from V8
 * @param {string} cwd - Run's working directory; only files under it count
 * @param {Set<string>} excludedAbsolutePaths - Absolute paths to exclude
 *   (typically the test files themselves, resolved by the runner)
 * @returns {CoverageReport} Aggregated coverage report
 */
export function buildCoverageReport(
  raw: V8ScriptCoverage[],
  cwd: string,
  excludedAbsolutePaths: Set<string>
): CoverageReport {
  const files: Record<string, FileCoverage> = {};
  const cwdWithSep = cwd.endsWith(sep) ? cwd : cwd + sep;

  for (const script of raw) {
    if (!script.url.startsWith("file://")) continue;

    let absPath: string;
    try {
      // Strip any query string (test files are imported with a
      // cache-busting `?t=...` suffix by the runner) before resolving.
      absPath = fileURLToPath(script.url.split("?")[0]);
    } catch {
      continue;
    }

    if (!absPath.startsWith(cwdWithSep)) continue;
    if (excludedAbsolutePaths.has(absPath)) continue;

    const relPath = relative(cwd, absPath).split(sep).join("/");
    const segments = relPath.split("/");
    if (segments.some((segment) => COVERAGE_IGNORED_DIRS.has(segment))) continue;

    // A file already imported once (e.g. re-exported and evaluated again
    // under a different scriptId) keeps its first-seen coverage entry.
    if (relPath in files) continue;

    let source: string;
    try {
      source = readFileSync(absPath, "utf-8");
    } catch {
      continue;
    }

    files[relPath] = computeFileCoverage(source, script.functions);
  }

  const aggregate = (key: "lines" | "statements" | "functions" | "branches"): CoverageMetric => {
    let total = 0;
    let covered = 0;
    for (const file of Object.values(files)) {
      total += file[key].total;
      covered += file[key].covered;
    }
    return metric(total, covered);
  };

  return {
    lines: aggregate("lines"),
    statements: aggregate("statements"),
    functions: aggregate("functions"),
    branches: aggregate("branches"),
    files,
  };
}

/**
 * Picks a color for a coverage percentage: green at/above 80%, yellow
 * at/above 50%, red below that — matching common coverage tool conventions.
 *
 * @param {number} pct - Percentage (0-100)
 * @returns {(text: string) => string} Color function to apply
 */
function colorForPct(pct: number): (text: string) => string {
  if (pct >= 80) return color.green;
  if (pct >= 50) return color.yellow;
  return color.red;
}

/**
 * Formats a coverage metric as a fixed-width percentage string
 *
 * @param {CoverageMetric} m - Metric to format
 * @returns {string} Colored, right-aligned percentage (e.g. " 87.5%")
 */
function formatPct(m: CoverageMetric): string {
  const text = `${m.pct.toFixed(1)}%`.padStart(6);
  return colorForPct(m.pct)(text);
}

/**
 * Prints a human-readable coverage summary to stdout
 *
 * Shows a per-file table (path, line %, function %) followed by overall
 * totals for lines, statements, functions, and branches. Intended to read
 * similarly to the existing reporters in `src/reporters/` — plain text
 * with a light divider, no external table-formatting library.
 *
 * @param {CoverageReport} report - Report built by {@link buildCoverageReport}
 */
export function printCoverageReport(report: CoverageReport): void {
  console.log("");
  console.log(divider.light);
  console.log(color.bold(color.cyan("Coverage Summary")));
  console.log(divider.light);
  console.log("");

  const entries = Object.entries(report.files).sort(([a], [b]) => a.localeCompare(b));

  if (entries.length === 0) {
    console.log(color.dim("No coverable files were found."));
  } else {
    const pathWidth = Math.max(4, ...entries.map(([path]) => path.length));

    console.log(
      color.dim(
        `  ${"File".padEnd(pathWidth)}   ${"Lines".padStart(6)}   ${"Funcs".padStart(6)}`
      )
    );
    console.log(color.dim(`  ${"-".repeat(pathWidth)}   ${"-".repeat(6)}   ${"-".repeat(6)}`));

    for (const [path, file] of entries) {
      console.log(
        `  ${path.padEnd(pathWidth)}   ${formatPct(file.lines)}   ${formatPct(file.functions)}`
      );
    }
  }

  console.log("");
  console.log(color.bold("All files"));
  console.log(`  Lines:      ${formatPct(report.lines)}  (${report.lines.covered}/${report.lines.total})`);
  console.log(`  Statements: ${formatPct(report.statements)}  (${report.statements.covered}/${report.statements.total})`);
  console.log(`  Functions:  ${formatPct(report.functions)}  (${report.functions.covered}/${report.functions.total})`);
  console.log(
    `  Branches:   ${formatPct(report.branches)}  (${report.branches.covered}/${report.branches.total})` +
    color.dim(" (approximate)")
  );
  console.log("");
}

/**
 * Writes the coverage report as JSON to `<cwd>/coverage/coverage-summary.json`
 *
 * Creates the `coverage/` directory if it doesn't already exist, so CI
 * pipelines can consume the file without a separate setup step.
 *
 * @param {CoverageReport} report - Report to persist
 * @param {string} cwd - Directory the `coverage/` folder is created under
 * @returns {string} Absolute path of the file that was written
 */
export function writeCoverageReport(report: CoverageReport, cwd: string): string {
  const dir = resolve(cwd, "coverage");
  mkdirSync(dir, { recursive: true });
  const outPath = resolve(dir, "coverage-summary.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf-8");
  return outPath;
}
