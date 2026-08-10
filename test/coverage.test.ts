import { describe, it, expect } from "../dist/index.js";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Regression test for the --coverage feature (src/core/coverage.ts).
 *
 * Exercises the real V8-based coverage pipeline — startCoverage() ->
 * run some code -> stopCoverage() -> buildCoverageReport() — against
 * test/fixtures/mathUtils.ts, a small fixture with one fully-exercised
 * function, one partially-exercised branch, and one never-called
 * function, then asserts the resulting percentages are genuinely
 * partial: not 0%, not 100%.
 *
 * The pipeline runs in a child process spawned from
 * test/fixtures/coverageProbe.mjs rather than in this test's own
 * process — see that file's header comment for why (V8's precise
 * coverage state is process-global, so nesting a second
 * start/stopPreciseCoverage cycle inside a test that might itself be
 * running under `muitto --coverage` could cut off the outer run's
 * tracking early).
 */
describe("--coverage", () => {
  it("reports partial line, function, and branch coverage for a fixture module", () => {
    const probePath = resolve(__dirname, "fixtures/coverageProbe.mjs");
    const stdout = execFileSync(process.execPath, [probePath], { encoding: "utf-8" });
    const report = JSON.parse(stdout);

    const file = report.files["test/fixtures/mathUtils.ts"];
    expect(file).toBeDefined();

    // add() and classify()'s "positive" branch ran; neverCalled() and
    // classify()'s "non-positive" branch never did.
    expect(file.functions.total).toBe(3);
    expect(file.functions.covered).toBe(2);
    expect(file.functions.pct).toBeGreaterThan(0);
    expect(file.functions.pct).toBeLessThan(100);

    // Some lines covered, some not — never 0% and never 100%.
    expect(file.lines.covered).toBeGreaterThan(0);
    expect(file.lines.covered).toBeLessThan(file.lines.total);
    expect(file.lines.pct).toBeGreaterThan(0);
    expect(file.lines.pct).toBeLessThan(100);

    // classify()'s "else" branch never ran.
    expect(file.branches.total).toBeGreaterThan(0);
    expect(file.branches.covered).toBe(0);

    // Aggregate report-level totals roll up the single file's numbers.
    expect(report.lines.total).toBe(file.lines.total);
    expect(report.functions.covered).toBe(file.functions.covered);
  });
});
