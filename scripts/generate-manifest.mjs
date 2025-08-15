import { promises as fs } from "fs";
import path from "path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const manifestPath = path.join(root, "dist", "manifest.json");

// Basic UI slot hints derived by convention (if needed, hand-maintain plugins/manifest.json)
const slotHints = {
  "component-library-plugin": { slot: "left", export: "LibraryPanel" },
  "control-panel-plugin": { slot: "right", export: "ControlPanelPanel" },
  "canvas-ui-plugin": { slot: "center", export: "CanvasPage" },
  // Header plugins (dist names)
  header: undefined,
  "header-left": { slot: "header-left", export: "HeaderLeft" },
  "header-center": { slot: "header-center", export: "HeaderCenter" },
  "header-right": { slot: "header-right", export: "HeaderRight" },
};

async function main() {
  const entries = await fs.readdir(distDir, { withFileTypes: true });
  const plugins = [];
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const name = ent.name;
    const ui = slotHints[name] ? { ui: slotHints[name] } : undefined;
    plugins.push({
      name: name.replace(/-/g, " "),
      path: `${name}/`,
      version: "0.1.0",
      description: `${name} bundle`,
      autoMount: true,
      ...(ui || {}),
    });
  }
  const manifest = { version: "0.1.0", plugins };
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.log("wrote", manifestPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
