/**
 * Fixture globalTeardown module that always throws, used to manually verify
 * that a globalTeardown failure fails the whole run (non-zero CLI exit
 * code) even when every test passed, while still letting the test
 * results be reported first.
 */
export default function globalTeardown(): void {
  throw new Error("teardown boom: fake db would not shut down");
}
