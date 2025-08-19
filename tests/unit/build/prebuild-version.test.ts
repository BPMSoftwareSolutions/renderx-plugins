import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

/**
 * Verifies that the prebuild script can set the package.json version when invoked
 * with a --pkg-version flag or via npm run args before the rest of the build runs.
 *
 * Important: use a temporary working directory to avoid interfering with other
 * parallel tests that might read/write the repo root package.json.
 */
describe("Build: prebuild sets package.json version when provided", () => {
  const repoRoot = path.resolve(__dirname, "../../../");
  const repoPkgPath = path.join(repoRoot, "package.json");
  const prebuildScript = path.join(repoRoot, "scripts", "prebuild-version.mjs");
  let originalPkgText: string;

  beforeAll(() => {
    originalPkgText = fs.readFileSync(repoPkgPath, "utf8");
  });

  afterAll(() => {
    // Restore original package.json so the test is not destructive if any test
    // accidentally wrote to the repo root.
    fs.writeFileSync(repoPkgPath, originalPkgText, "utf8");
  });

  function withTempPkgJson(run: (cwd: string, pkgPath: string) => void) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rx-prebuild-"));
    const tmpPkgPath = path.join(tmpDir, "package.json");
    fs.writeFileSync(tmpPkgPath, originalPkgText, "utf8");
    try {
      run(tmpDir, tmpPkgPath);
    } finally {
      try {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      } catch {}
    }
  }

  test("prebuild script updates package.json version from --pkg-version", () => {
    const testVersion = "9.9.9-test"; // a valid semver pre-release string

    withTempPkgJson((cwd, pkgPath) => {
      // Run the prebuild script directly with Node, passing the version flag
      execFileSync(
        process.execPath,
        [prebuildScript, "--pkg-version", testVersion],
        {
          cwd,
          stdio: "inherit",
        }
      );

      // Verify package.json version changed
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      expect(pkg.version).toBe(testVersion);
    });
  });

  test("npm run build -- --pkg-version= also works (npm_config_pkg_version)", () => {
    const testVersion = "8.8.8-rc.1";

    withTempPkgJson((cwd, pkgPath) => {
      execFileSync(process.execPath, [prebuildScript], {
        cwd,
        stdio: "inherit",
        env: { ...process.env, npm_config_pkg_version: testVersion },
      });
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      expect(pkg.version).toBe(testVersion);
    });
  });
});
