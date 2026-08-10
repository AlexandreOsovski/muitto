import { describe, it, expect } from "../../../dist/index.js";
import { appendFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Companion test file for the globalSetup/globalTeardown ordering fixture
 * (see global-setup.ts / global-teardown.ts in this same directory).
 * Appends to the shared run.log so ordering relative to the global hooks
 * can be verified end-to-end via the real CLI.
 */
const LOG = join(process.cwd(), "run.log");

describe("sample A", () => {
  it("runs between globalSetup and globalTeardown", () => {
    appendFileSync(LOG, "test-a\n");
    expect(1 + 1).toBe(2);
  });
});
