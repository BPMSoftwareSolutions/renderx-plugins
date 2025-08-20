import fs from "fs";
import path from "path";

/**
 * Policy (1): Handlers must not call txn.upsertStyleTag/removeStyleTag directly
 * without a runtime guard (typeof txn.upsertStyleTag === 'function').
 *
 * Scope: all plugin source files under plugins/** (non-test files)
 */

describe("Policy: BeatTxn API usage — no raw upserts without guard", () => {
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

  test("files using upsertStyleTag/removeStyleTag must guard the call", () => {
    const files = listFiles(pluginsRoot);
    const offenders: Array<{ file: string; lines: number[]; snippet: string }>=[];

    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      // skip generated or manifest
      if (/plugins\\manifest\.json$/.test(f)) continue;

      const usesUpsert = /\.upsertStyleTag\s*\(/.test(text);
      const usesRemove = /\.removeStyleTag\s*\(/.test(text);
      if (!usesUpsert && !usesRemove) continue;

      const hasGuard = /typeof\s+[\w$.]+\.upsertStyleTag\s*===\s*['"]function['"]/.test(
        text
      );

      if (!hasGuard) {
        // collect line numbers for context
        const lines = text.split(/\r?\n/);
        const hitLines: number[] = [];
        lines.forEach((ln, i) => {
          if (ln.match(/\.upsertStyleTag\s*\(/) || ln.match(/\.removeStyleTag\s*\(/)) hitLines.push(i + 1);
        });
        offenders.push({ file: path.relative(pluginsRoot, f), lines: hitLines, snippet: hitLines.map(n=>`${n}`).join(",") });
      }
    }

    expect({ offenders }).toEqual({ offenders: [] });
  });
});

