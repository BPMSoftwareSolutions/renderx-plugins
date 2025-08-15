import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const manifestPath = path.join(root, "dist", "manifest.json");

// UI slot hints by relative path (posix-style, trailing slash)
const slotHintsByRelPath = {
  "component-library-plugin/": { slot: "left", export: "LibraryPanel" },
  "control-panel-plugin/": { slot: "right", export: "ControlPanelPanel" },
  "canvas-ui-plugin/": { slot: "center", export: "CanvasPage" },
  // Header plugins (nested under header/)
  "header/left/": { slot: "header-left", export: "HeaderLeft" },
  "header/center/": { slot: "header-center", export: "HeaderCenter" },
  "header/right/": { slot: "header-right", export: "HeaderRight" },
};

async function fileExists(p) {
  try {
    const s = await fs.stat(p);
    return s.isFile();
  } catch {
    return false;
  }
}

async function collectPluginRelPaths(dir, relBase = "") {
  const list = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const abs = path.join(dir, ent.name);
    const rel = relBase ? `${relBase}/${ent.name}` : ent.name;
    // Include dir if it has an index.js (plugin entry)
    if (await fileExists(path.join(abs, "index.js"))) {
      list.push(`${rel}/`);
    }
    // Recurse to find nested plugin entries (e.g., header/*/index.js)
    const nested = await collectPluginRelPaths(abs, rel);
    for (const n of nested) list.push(n);
  }
  return list;
}

async function main() {
  const relPaths = await collectPluginRelPaths(distDir, "");
  // De-duplicate
  const uniqueRelPaths = Array.from(new Set(relPaths));
  const plugins = uniqueRelPaths.map((relPath) => {
    const ui = slotHintsByRelPath[relPath]
      ? { ui: slotHintsByRelPath[relPath] }
      : undefined;
    const name = relPath.replace(/\/$/, "");
    const last = name.split("/").pop() || name;
    const isHeaderUi =
      /^(header\/left\/|header\/center\/|header\/right\/)$/i.test(relPath);
    return {
      name: last.replace(/-/g, " "),
      path: relPath,
      version: "0.1.0",
      description: `${name} bundle`,
      autoMount: isHeaderUi ? false : true,
      ...(ui || {}),
    };
  });
  const manifest = { version: "0.1.0", plugins };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("wrote", manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
