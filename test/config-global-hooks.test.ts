/**
 * Regression coverage for the globalSetup/globalTeardown config plumbing
 * (src/config/loader.ts::loadConfig). Full end-to-end ordering (setup runs
 * once before any file, teardown once after all files, a throwing
 * globalSetup aborts the run with zero tests executed, a throwing
 * globalTeardown fails the run after results are reported) is validated
 * manually against the real CLI — see test/fixtures/global-hooks,
 * test/fixtures/global-setup-fail and test/fixtures/global-teardown-fail.
 *
 * Driving that through muitto's own DSL would require recursively invoking
 * runTests() from inside a running test, which shares process-global
 * registry/hook state (see src/index.ts) with the outer test run — doable,
 * but fragile and indirect for what it proves. What IS safe and valuable to
 * assert here, at the DSL level, is the config merge itself: that
 * loadConfig() picks these fields up from .muittorc.json, that explicit
 * options can override them, and — most importantly — that a caller
 * building an options object with `globalSetup`/`globalTeardown` explicitly
 * set to `undefined` (exactly what the CLI does when no matching flag was
 * passed) does NOT clobber a value already defined by the config file. That
 * exact clobbering bug already happened once for other fields (timeout,
 * reporter, coverage, bail, grep — see CHANGELOG 1.4.11) and is guarded by
 * the `definedOptions` filter in loadConfig(); this locks in that the new
 * fields inherit that protection.
 */
/**
 * Imports from `dist/` (the compiled output), not `src/`, so this test can
 * run via the project's own `npm test` script (`node dist/cli/cli.js`),
 * which — unlike `npm run dev` / `bin/index.js` — does not register a
 * TypeScript loader and therefore can't dynamically `import()` .ts sources
 * directly. Run `npm run build` before `npm test` for this file to resolve.
 */
import { describe, it, expect } from "../dist/index.js";
import { loadConfig } from "../dist/config/loader.js";
import { resolve } from "node:path";

const fixtureCwd = resolve(process.cwd(), "test/fixtures/global-hooks");

describe("loadConfig: globalSetup / globalTeardown", () => {
  it("reads globalSetup/globalTeardown from .muittorc.json", () => {
    const config = loadConfig(fixtureCwd);
    expect(config.globalSetup).toBe("./global-setup.ts");
    expect(config.globalTeardown).toBe("./global-teardown.ts");
  });

  it("is undefined by default when no config file sets it", () => {
    const config = loadConfig(resolve(process.cwd(), "test"));
    expect(config.globalSetup).toBeUndefined();
    expect(config.globalTeardown).toBeUndefined();
  });

  it("does not get clobbered when the caller explicitly passes undefined (e.g. CLI flags not set)", () => {
    const config = loadConfig(fixtureCwd, {
      globalSetup: undefined,
      globalTeardown: undefined,
    });
    expect(config.globalSetup).toBe("./global-setup.ts");
    expect(config.globalTeardown).toBe("./global-teardown.ts");
  });

  it("lets an explicitly provided option override the config file value", () => {
    const config = loadConfig(fixtureCwd, {
      globalSetup: "./override-setup.ts",
    });
    expect(config.globalSetup).toBe("./override-setup.ts");
    expect(config.globalTeardown).toBe("./global-teardown.ts");
  });
});
