import { describe, it, expect } from "../../../dist/index.js";

/**
 * Companion test file for the globalTeardown-failure fixture (see
 * global-teardown-throws.ts). This test passes normally; the point of the
 * fixture is that a throwing globalTeardown still fails the whole run
 * (non-zero exit) even though every test passed.
 */
describe("passes fine", () => {
  it("passes normally before globalTeardown fails the run", () => {
    expect(true).toBe(true);
  });
});
