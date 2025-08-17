import { promises as fs } from "fs";
import path from "path";

// Copy-based build: replicate plugin directory trees to dist/<plugin>/...
const root = process.cwd();
const pluginsDir = path.join(root, "plugins");
const distDir = path.join(root, "dist");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function cleanDir(p) {
  // Remove directory recursively if it exists
  await fs.rm(p, { recursive: true, force: true });
}

async function copyFileBinary(src, dest) {
  const buf = await fs.readFile(src);
  await ensureDir(path.dirname(dest));
  await fs.writeFile(dest, buf);
  console.log("copied", src, "->", dest);
}

async function copyDir(srcDir, destDir) {
  await ensureDir(destDir);
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  for (const ent of entries) {
    const srcPath = path.join(srcDir, ent.name);
    const destPath = path.join(destDir, ent.name);
    if (ent.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (ent.isFile()) {
      // copy all plugin files: .js, .css, .json, etc.
      await copyFileBinary(srcPath, destPath);
    }
  }
}

async function main() {
  // Clean dist to avoid stale artifacts
  await cleanDir(distDir);
  await ensureDir(distDir);
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const pluginName = ent.name;
    const srcPluginDir = path.join(pluginsDir, pluginName);
    const destPluginDir = path.join(distDir, pluginName);
    await copyDir(srcPluginDir, destPluginDir);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
