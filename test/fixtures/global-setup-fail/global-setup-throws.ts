/**
 * Fixture globalSetup module that always throws, used to manually verify
 * that a globalSetup failure aborts the whole run before any test file
 * is imported/executed, and results in a non-zero CLI exit code.
 */
export default function globalSetup(): void {
  throw new Error("boom: cannot connect to fake db");
}
