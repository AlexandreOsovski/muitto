#!/usr/bin/env node
/**
 * Standalone helper for test/coverage.test.ts — NOT a test file itself
 * (doesn't match any of MUITTO's test discovery patterns, so it's never
 * picked up and run on its own).
 *
 * Runs the real --coverage pipeline (core/coverage.ts's startCoverage ->
 * exercise some code -> stopCoverage -> buildCoverageReport) against
 * ./mathUtils.ts in its OWN child process, then prints the resulting
 * CoverageReport as JSON on stdout.
 *
 * This runs in a dedicated process (spawned via execFileSync from
 * coverage.test.ts) rather than sharing the parent test-runner's V8
 * isolate, because V8's precise-coverage state is process-global: if this
 * suite ever runs under `muitto --coverage` itself, calling
 * stopPreciseCoverage in-process here would prematurely cut off the
 * PARENT run's own coverage tracking. A child process can't affect the
 * parent's V8 isolate, so it's always safe regardless of how this suite
 * itself is invoked.
 */
import { pathToFileURL, fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { startCoverage, stopCoverage, buildCoverageReport } from "../../dist/core/coverage.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");

const handle = await startCoverage();

const { add, classify } = await import(pathToFileURL(resolve(here, "mathUtils.ts")).href);

add(1, 2);
classify(5); // only the "positive" branch runs — "non-positive" and neverCalled() stay uncovered

const raw = await stopCoverage(handle);

// Exclude this probe script itself — it's test-harness plumbing, not
// "code under test", same reasoning the real runner uses to exclude the
// test files it's executing.
const excluded = new Set([fileURLToPath(import.meta.url)]);
const report = buildCoverageReport(raw, repoRoot, excluded);

process.stdout.write(JSON.stringify(report));
