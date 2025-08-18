/* @jest-environment node */
import { build } from "esbuild";
import path from "path";

function pluginEntry(rel: string) {
  return path.resolve(process.cwd(), rel);
}

describe("Plugins bundle compatibility (esbuild)", () => {
  const entries = [
    "plugins/canvas-ui-plugin/index.js",
    "plugins/canvas-drag-plugin/index.js",
    "plugins/canvas-resize-plugin/index.js",
    "plugins/canvas-selection-plugin/index.js",
    "plugins/canvas-create-plugin/index.js",
    "plugins/component-library-plugin/index.js",
    "plugins/control-panel-plugin/index.js",
    "plugins/library-drag-plugin/index.js",
    "plugins/library-drop-plugin/index.js",
    "plugins/theme-management-plugin/index.js",
  ];

  for (const entry of entries) {
    test(`${entry} bundles to iife`, async () => {
      const result = await build({
        entryPoints: [pluginEntry(entry)],
        bundle: true,
        format: "iife",
        platform: "browser",
        target: ["es2018"],
        write: false,
        define: { "process.env.NODE_ENV": JSON.stringify("test") },
        logLevel: "silent",
      });
      expect(result.outputFiles && result.outputFiles.length).toBeGreaterThan(0);
    });
  }
});

