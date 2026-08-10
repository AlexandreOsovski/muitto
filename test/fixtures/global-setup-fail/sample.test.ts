import { describe, it, expect } from "../../../dist/index.js";

/**
 * Companion test file for the globalSetup-failure fixture (see
 * global-setup-throws.ts). This test must exist for discovery to find at
 * least one file — otherwise the CLI exits early on "no test files found"
 * before ever reaching the globalSetup call, and the fixture wouldn't prove
 * anything. It should never actually execute: globalSetup throws first.
 */
describe("should never run", () => {
  it("never executes because globalSetup aborts the run first", () => {
    expect(true).toBe(true);
  });
});
