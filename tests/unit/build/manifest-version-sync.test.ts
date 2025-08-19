import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

/**
 * Verifies that running the sync script updates plugins/manifest.json
 * to match the version in package.json (both top-level and per-plugin).
 */
describe("Build: plugins/manifest.json version sync", () => {
  const repoRoot = path.resolve(__dirname, "../../../");
  const pkgPath = path.join(repoRoot, "package.json");
  const manifestPath = path.join(repoRoot, "plugins", "manifest.json");
  let originalManifestText: string;

  beforeAll(() => {
    originalManifestText = fs.readFileSync(manifestPath, "utf8");
  });

  afterAll(() => {
    // Restore original manifest so the test is not destructive to the workspace
    fs.writeFileSync(manifestPath, originalManifestText, "utf8");
  });

  test("sync script sets manifest + plugin versions to package.json version", () => {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    const expectedVersion: string = pkg.version;

    // Execute the sync script with Node
    const syncScriptPath = path.join(
      repoRoot,
      "scripts",
      "update-plugins-manifest.mjs"
    );
    execFileSync(process.execPath, [syncScriptPath], { cwd: repoRoot });

    const updated = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    expect(updated.version).toBe(expectedVersion);
    const plugins = Array.isArray(updated.plugins) ? updated.plugins : [];
    for (const p of plugins) {
      expect(p.version).toBe(expectedVersion);
    }
  });
});
