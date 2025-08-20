import fs from "fs";
import path from "path";

/**
 * Policy: Browser-facing plugins must be ESM-only (no require()).
 * This test scans key plugin directories for require( usage and fails if found.
 */

describe("Policy: ESM-only in browser-facing plugins", () => {
  const roots = [
    "plugins/canvas-ui-plugin",
    "plugins/canvas-selection-plugin",
    "plugins/canvas-drag-plugin",
    "plugins/canvas-resize-plugin",
  ];

  function readAllFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        out.push(...readAllFiles(p));
      } else if (/\.(js|ts)$/i.test(entry.name)) {
        out.push(p);
      }
    }
    return out;
  }

  test("no require() usage in browser plugins", () => {
    const files: string[] = roots.flatMap((r) => readAllFiles(path.join(process.cwd(), r)));
    const offenders: string[] = [];
    const requireRegex = /(^|[^.])\brequire\s*\(/;
    for (const f of files) {
      const content = fs.readFileSync(f, "utf8");
      if (requireRegex.test(content)) {
        offenders.push(f);
      }
    }
    expect({ offenders }).toEqual({ offenders: [] });
  });
});

