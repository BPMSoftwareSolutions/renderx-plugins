import { build } from "esbuild";
import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const distSrcDir = path.join(root, "dist");
const publicPluginsDir = path.join(root, "dist", "public", "plugins");

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function findPluginEntries() {
  const entries = [];
  const dirs = await fs.readdir(distSrcDir, { withFileTypes: true });
  for (const ent of dirs) {
    if (!ent.isDirectory()) continue;
    const pluginDir = path.join(distSrcDir, ent.name);
    const entry = path.join(pluginDir, "index.js");
    try {
      const stat = await fs.stat(entry);
      if (stat.isFile()) entries.push({ name: ent.name, entry });
    } catch {}
  }
  return entries;
}

async function buildPluginBundles() {
  const entries = await findPluginEntries();
  await ensureDir(publicPluginsDir);
  for (const { name, entry } of entries) {
    const outFile = path.join(publicPluginsDir, name, "index.js");
    await ensureDir(path.dirname(outFile));
    console.log("bundling", entry, "->", outFile);
    await build({
      entryPoints: [entry],
      bundle: true,
      format: "iife",
      platform: "browser",
      target: ["es2018"],
      outfile: outFile,
      define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production") },
      logLevel: "silent",
    });
  }
}

async function main() {
  await buildPluginBundles();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

