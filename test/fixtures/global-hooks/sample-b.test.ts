import { describe, it, expect } from "../../../dist/index.js";
import { appendFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Second companion test file for the globalSetup/globalTeardown ordering
 * fixture — see sample-a.test.ts for context. Having two files confirms
 * globalSetup/globalTeardown each run exactly once for the whole run, not
 * once per file.
 */
const LOG = join(process.cwd(), "run.log");

describe("sample B", () => {
  it("also runs between globalSetup and globalTeardown", () => {
    appendFileSync(LOG, "test-b\n");
    expect(2 + 2).toBe(4);
  });
});
