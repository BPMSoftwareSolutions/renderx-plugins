import fs from "fs";
import path from "path";

/**
 * Policy (2): If a plugin references upsertStyleTag, it must also provide a fallback
 * (e.g., overlayInjectGlobalCSS/overlayInjectInstanceCSS) or guard that path.
 */

describe("Policy: BeatTxn API — upsert usage requires fallback", () => {
  const pluginsRoot = path.resolve(process.cwd(), "plugins");

  function listFiles(dir: string): string[] {
    const out: string[] = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) out.push(...listFiles(p));
      else if (/\.(js|ts)$/i.test(entry.name)) out.push(p);
    }
    return out;
  }

  test("files with upsertStyleTag also reference overlayInject* or typeof-guard", () => {
    const files = listFiles(pluginsRoot);
    const offenders: Array<{ file: string }>=[];

    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      if (/plugins\\manifest\.json$/.test(f)) continue;

      const usesUpsert = /\.upsertStyleTag\s*\(/.test(text);
      if (!usesUpsert) continue;

      const hasFallback = /overlayInject(Global|Instance)CSS/.test(text);
      const hasGuard = /typeof\s+[\w$.]+\.upsertStyleTag\s*===\s*['"]function['"]/.test(text);

      if (!hasFallback && !hasGuard) {
        offenders.push({ file: path.relative(pluginsRoot, f) });
      }
    }

    expect({ offenders }).toEqual({ offenders: [] });
  });
});

