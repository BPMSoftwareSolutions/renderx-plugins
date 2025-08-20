import { spawnSync } from "child_process";
import path from "path";

const root = process.cwd();
const node = process.execPath;

function run(cmd, args = [], opts = {}) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: root,
    shell: !!opts.shell,
  });
  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function runNpm(args = []) {
  const cli = process.env.npm_execpath;
  if (cli) {
    // Use Node to execute npm CLI directly for better cross-platform reliability
    run(node, [cli, ...args]);
  } else {
    // Fallback to npm on PATH; enable shell for Windows to locate npm.cmd
    run(process.platform === "win32" ? "npm.cmd" : "npm", args, {
      shell: process.platform === "win32",
    });
  }
}

function main() {
  // Forward all args passed to this wrapper directly to prebuild-version
  const forward = process.argv.slice(2);

  // 1) Prebuild (with args)
  run(node, [path.join(root, "scripts", "prebuild-version.mjs"), ...forward]);

  // 2) Build pipeline
  runNpm(["run", "build:plugins"]);
  runNpm(["run", "build:manifest"]);
  runNpm(["run", "build:sync-plugins-manifest"]);
  run(node, [path.join(root, "scripts", "build-bundles.mjs")]);
}

main();
