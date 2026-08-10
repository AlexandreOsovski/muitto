/**
 * Tiny fixture module used by test/coverage.test.ts to exercise the
 * --coverage feature end to end.
 *
 * Deliberately NOT a *.test.ts / *.spec.ts file, so MUITTO's own test
 * discovery ignores it (it's "code under test", not a test file), and
 * coverage.test.ts calls only some of its branches so the resulting
 * report has a genuinely partial (not 0%, not 100%) percentage to check.
 */

/** Adds two numbers. Always exercised by the test. */
export function add(a: number, b: number): number {
  return a + b;
}

/**
 * Classifies a number's sign. The test only ever passes a positive
 * number, so the "non-positive" branch is intentionally left uncovered.
 */
export function classify(x: number): string {
  if (x > 0) {
    return "positive";
  } else {
    return "non-positive";
  }
}

/** Never called by the test — should show up as 0% covered. */
export function neverCalled(): string {
  return "nope";
}
