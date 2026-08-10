/**
 * Fixture globalSetup module for manual validation of the global
 * setup/teardown feature. Appends a line to a shared log file so the
 * ordering relative to test files and globalTeardown can be asserted.
 */
import { appendFileSync } from "node:fs";
import { join } from "node:path";

const LOG = join(process.cwd(), "run.log");

export default function globalSetup(): void {
  appendFileSync(LOG, "setup\n");
}
