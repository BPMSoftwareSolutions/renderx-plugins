import fs from "fs";
import path from "path";

describe("SPA Validator - No global DOM events or direct console/eventBus in plugins", () => {
  const pluginRoots = path.resolve(__dirname, "../../../plugins");

  const forbidden = [
    /\bwindow\.addEventListener\s*\(/,
    /\bdocument\.addEventListener\s*\(/,
    /\bdispatchEvent\s*\(/,
    /\bnew\s+CustomEvent\s*\(/,
    /\bwindow\.(on\w+)\b/,
    /\bdocument\.(on\w+)\b/,
    /\beventBus\.emit\s*\(/,
    /\bconsole\.(log|info|warn|error)\s*\(/,
  ];

  const allowExt = new Set([".js", ".ts", ".jsx", ".tsx"]);

  function listFiles(dir: string): string[] {
    const acc: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) acc.push(...listFiles(full));
      else if (allowExt.has(path.extname(entry.name))) acc.push(full);
    }
    return acc;
  }

  test("plugins must not use global DOM events; rely on conductor play()/callbacks", () => {
    const files = listFiles(pluginRoots);
    const offenders: Array<{ file: string; line: number; match: string }> = [];

    for (const file of files) {
      const text = fs.readFileSync(file, "utf8");
      const lines = text.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const re of forbidden) {
          if (re.test(line)) {
            offenders.push({
              file: path.relative(pluginRoots, file),
              line: i + 1,
              match: line.trim(),
            });
            break;
          }
        }
      }
    }

    // Fail by default to force refactor; set ALLOW_SPA_GLOBAL_EVENTS=true to temporarily bypass
    const allow =
      String(process.env.ALLOW_SPA_GLOBAL_EVENTS || "").toLowerCase() ===
      "true";
    if (allow) {
      // eslint-disable-next-line no-console
      console.warn(
        "SPA Validator bypassed via ALLOW_SPA_GLOBAL_EVENTS=true",
        offenders
      );
      expect(true).toBe(true);
      return;
    }

    const msg =
      "SPA Validator: forbidden global DOM event usage detected in plugins. Refactor to conductor play()/callbacks.\n" +
      JSON.stringify(offenders, null, 2);
    if (offenders.length) {
      throw new Error(msg);
    }
    expect(offenders).toEqual([]);
  });
});
