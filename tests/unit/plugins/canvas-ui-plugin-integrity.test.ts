import fs from 'fs';
import path from 'path';

/**
 * Module Integrity test for Canvas UI Plugin (browser ESM compatibility)
 * - No local function declarations that redeclare imported helper names
 * - All relative import specifiers include .js extension
 */

describe('Canvas UI Plugin - Module Integrity (ESM)', () => {
  const filePath = path.resolve(__dirname, '../../../../RenderX/public/plugins/canvas-ui-plugin/index.js');
  let source = '';

  beforeAll(() => {
    source = fs.readFileSync(filePath, 'utf8');
  });

  test('all relative import specifiers include .js extension', () => {
    const importRe = /(^|\n)\s*import\s+[^;]*?from\s+['\"]([^'\"]+)['\"]/g;
    const missing: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(source))) {
      const spec = m[2];
      if (spec.startsWith('.')) {
        if (!/\.js(\?|$)/.test(spec)) {
          missing.push(spec);
        }
      }
    }
    expect(missing).toEqual([]);
  });

  test('no function declarations redeclare imported helper names', () => {
    const importRe = /(^|\n)\s*import\s+([^;]*?)\s+from\s+['\"][^'\"]+['\"]/g;
    const importedNames = new Set<string>();
    let m: RegExpExecArray | null;

    while ((m = importRe.exec(source))) {
      const clause = m[2].trim();
      // Only care about named imports: { a, b as c }
      const braceMatch = clause.match(/\{([^}]+)\}/);
      if (braceMatch) {
        const inside = braceMatch[1];
        const parts = inside.split(',').map((s) => s.trim()).filter(Boolean);
        for (const p of parts) {
          // handle aliases: name as alias
          const segs = p.split(/\s+as\s+/i).map((s) => s.trim());
          if (segs[0]) importedNames.add(segs[0]);
        }
      }
    }

    // For each imported name, assert there is no local function declaration with same name
    const offenders: string[] = [];
    for (const name of importedNames) {
      const fnDecl = new RegExp(`(^|\n)\\s*function\\s+${name}\\s*\\(`);
      if (fnDecl.test(source)) {
        offenders.push(name);
      }
    }
    expect(offenders).toEqual([]);
  });
});

