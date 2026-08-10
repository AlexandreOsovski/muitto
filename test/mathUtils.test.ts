import { describe, it, expect } from "../dist/index.js";
import { add, classify } from "./fixtures/mathUtils.ts";

/**
 * Ordinary regression tests for the fixtures/mathUtils.ts helper used by
 * coverage.test.ts. Not about coverage itself — just makes sure the
 * fixture's own logic is correct, same as any other MUITTO test file.
 */
describe("mathUtils", () => {
  it("adds two numbers", () => {
    expect(add(2, 3)).toBe(5);
  });

  it("classifies positive numbers", () => {
    expect(classify(1)).toBe("positive");
  });

  it("classifies non-positive numbers", () => {
    expect(classify(-1)).toBe("non-positive");
    expect(classify(0)).toBe("non-positive");
  });
});
