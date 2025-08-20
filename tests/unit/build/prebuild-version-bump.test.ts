import fs from "fs";
import os from "os";
import path from "path";
import { execFileSync } from "child_process";

describe("Build: prebuild bump modes (--pv --major/minor/revision) and --vX.Y.Z", () => {
  const repoRoot = path.resolve(__dirname, "../../../");
  const prebuildScript = path.join(repoRoot, "scripts", "prebuild-version.mjs");

  function withTempPkgJson(baseVersion: string, run: (cwd: string, pkgPath: string) => void) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "rx-prebuild-bump-"));
    const tmpPkgPath = path.join(tmpDir, "package.json");
    fs.writeFileSync(
      tmpPkgPath,
      JSON.stringify({ name: "tmp", version: baseVersion }, null, 2) + "\n",
      "utf8"
    );
    try {
      run(tmpDir, tmpPkgPath);
    } finally {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    }
  }

  test("--pv --revision bumps patch", () => {
    withTempPkgJson("1.2.3", (cwd, pkgPath) => {
      execFileSync(process.execPath, [prebuildScript, "--pv", "--revision"], { cwd, stdio: "inherit" });
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      expect(pkg.version).toBe("1.2.4");
    });
  });

  test("--pv --minor bumps minor and resets patch", () => {
    withTempPkgJson("1.2.3", (cwd, pkgPath) => {
      execFileSync(process.execPath, [prebuildScript, "--pv", "--minor"], { cwd, stdio: "inherit" });
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      expect(pkg.version).toBe("1.3.0");
    });
  });

  test("--pv --major bumps major and resets minor/patch", () => {
    withTempPkgJson("1.2.3", (cwd, pkgPath) => {
      execFileSync(process.execPath, [prebuildScript, "--pv", "--major"], { cwd, stdio: "inherit" });
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      expect(pkg.version).toBe("2.0.0");
    });
  });

  test("--pv --v2.0.4 sets explicit version", () => {
    withTempPkgJson("1.2.3", (cwd, pkgPath) => {
      execFileSync(process.execPath, [prebuildScript, "--pv", "--v2.0.4"], { cwd, stdio: "inherit" });
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      expect(pkg.version).toBe("2.0.4");
    });
  });
});

