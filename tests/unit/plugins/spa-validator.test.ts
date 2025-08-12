import { loadRenderXPlugin } from "../../utils/renderx-plugin-loader";
import fs from "fs";
import path from "path";

// This test enforces that plugins do not call console.* or eventBus.emit directly.
// Use context.logger or orchestrated sequences via conductor.play instead.

describe("SPA Validator - No direct console or eventBus.emit in plugins", () => {
  const pluginRoots = path.resolve(__dirname, "../../../plugins");

  const scanFile = (filePath: string) => fs.readFileSync(filePath, "utf8");

  const forbid = [
    /\beventBus\.emit\s*\(/,
    /\bconsole\.(log|info|warn|error)\s*\(/,
  ];

  test("no forbidden calls in plugin sources", () => {
    const entries = fs.readdirSync(pluginRoots, { withFileTypes: true });
    const offenders: Array<{ file: string; match: string }> = [];
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const dir = path.join(pluginRoots, ent.name);
      const stack = [dir];
      while (stack.length) {
        const cur = stack.pop()!;
        const stats = fs.statSync(cur);
        if (stats.isDirectory()) {
          for (const child of fs.readdirSync(cur)) stack.push(path.join(cur, child));
          continue;
        }
        if (!cur.endsWith(".js")) continue;
        const src = scanFile(cur);
        for (const re of forbid) {
          const m = src.match(re);
          if (m) offenders.push({ file: path.relative(pluginRoots, cur), match: m[0] });
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});

