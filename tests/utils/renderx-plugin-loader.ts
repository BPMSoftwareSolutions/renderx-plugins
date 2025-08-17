import fs from "fs";
import path from "path";

function mapLegacyPath(p: string) {
  // Support old tests that reference RenderX/public/plugins/**
  return p.replace(/^RenderX\/(public\/)?plugins\//, "plugins/");
}

// Minimal ESM import resolver for tests: recursively loads modules and converts ESM to CommonJS-like
export function loadRenderXPlugin(relativePathFromRepoRoot: string): any {
  const cache = new Map<string, any>();

  function resolveFile(fromAbs: string, spec: string): string {
    const baseDir = path.dirname(fromAbs);
    let target = spec;
    if (spec.startsWith(".")) {
      target = path.resolve(baseDir, spec);
    } else if (spec.startsWith("plugins/")) {
      target = path.resolve(__dirname, "../../", spec);
    } else if (spec.startsWith("/")) {
      target = spec;
    } else {
      // Not expected in tests; allow fallback relative to repo root
      target = path.resolve(__dirname, "../../", spec);
    }
    if (!/\.m?js$/i.test(target)) {
      if (fs.existsSync(target + ".js")) return target + ".js";
      if (fs.existsSync(target + ".json")) return target + ".json";
    }
    return target;
  }

  function transpileAndEval(absPath: string): any {
    if (cache.has(absPath)) return cache.get(absPath);
    const raw = fs.readFileSync(absPath, "utf8");

    // Build import prelude and strip import lines
    let importPrelude: string[] = [];
    const codeNoImports = raw.replace(
      /^\s*import\s+([^;]+?)\s+from\s+["']([^"']+)["'];?/gm,
      (_full, bindings: string, spec: string) => {
        const normalized = String(bindings).trim();
        const resolved = `require(${JSON.stringify(spec)})`;
        // Named imports
        if (normalized.startsWith("{")) {
          const inner = normalized.replace(/[{}]/g, "").trim();
          const renamed = inner.replace(/\bas\b/g, ":");
          importPrelude.push(`const { ${renamed} } = ${resolved};`);
          return "";
        }
        // Namespace import: import * as NS from 'x'
        const nsMatch = normalized.match(/^\*\s+as\s+(\w+)$/);
        if (nsMatch) {
          importPrelude.push(`const ${nsMatch[1]} = ${resolved};`);
          return "";
        }
        // Default or default + named (fallback to .default or module object)
        const defMatch = normalized.match(/^(\w+)\s*(,\s*\{([^}]+)\})?$/);
        if (defMatch) {
          const def = defMatch[1];
          const named = defMatch[3];
          importPrelude.push(
            `const ${def} = (${resolved}).default ?? ${resolved};`
          );
          if (named) {
            const renamed = named.replace(/\bas\b/g, ":");
            importPrelude.push(`const { ${renamed} } = ${resolved};`);
          }
          return "";
        }
        return "";
      }
    );

    // Handle re-exports: export { A, B as C } from '...';
    let reexportPrelude: string[] = [];
    const codeNoImportsNoReexp = codeNoImports.replace(
      /^\s*export\s*\{\s*([^}]+)\s*\}\s*from\s*["']([^"']+)["'];?/gm,
      (_full, names: string, spec: string) => {
        const aliasPairs = names
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .map((part) => {
            const m = part.match(/^(\w+)\s+as\s+(\w+)$/);
            return m ? { from: m[1], to: m[2] } : { from: part, to: part };
          });
        const modIdent = `__reexp_${Math.random().toString(36).slice(2, 8)}`;
        const resolved = `require(${JSON.stringify(spec)})`;
        reexportPrelude.push(`const ${modIdent} = ${resolved};`);
        aliasPairs.forEach(({ from, to }) => {
          reexportPrelude.push(`moduleExports.${to} = ${modIdent}.${from};`);
        });
        return "";
      }
    );

    // Transform exports to moduleExports assignments
    const transformed = (
      importPrelude.join("\n") +
      "\n" +
      reexportPrelude.join("\n") +
      "\n" +
      codeNoImportsNoReexp
    )
      // export const X = ...
      .replace(/export const (\w+)\s*=\s*/g, "moduleExports.$1 = ")
      // export async function X(...) { ... }
      .replace(
        /export\s+async\s+function\s+(\w+)\s*\(/g,
        "moduleExports.$1 = async function $1("
      )
      // export function X(...) { ... }
      .replace(
        /export\s+function\s+(\w+)\s*\(/g,
        "moduleExports.$1 = function $1("
      )
      // export default ...
      .replace(/export default\s+/g, "moduleExports.default = ");

    const moduleExports: any = {};
    const scopedRequire = (spec: string) => {
      // Allow Node built-ins and external packages to use native require
      if (
        !spec.startsWith(".") &&
        !spec.startsWith("/") &&
        !spec.startsWith("plugins/")
      ) {
        try {
          return require(spec);
        } catch {}
      }
      const target = resolveFile(absPath, spec);
      // If resolution didn't change and it's still a bare spec, fall back to native require
      if (target === spec && !/[\\/]/.test(spec)) {
        return require(spec);
      }
      return transpileAndEval(target);
    };
    const moduleObj: any = { exports: moduleExports };
    const fn = new Function(
      "module",
      "exports",
      "moduleExports",
      "fetch",
      "require",
      "__dirname",
      "__filename",
      transformed
    );
    const thisDir = path.dirname(absPath);
    fn(
      moduleObj,
      moduleObj.exports,
      moduleExports,
      (global as any).fetch,
      scopedRequire,
      thisDir,
      absPath
    );
    const result = moduleObj.exports || moduleExports;
    cache.set(absPath, result);
    return result;
  }

  const mapped = mapLegacyPath(relativePathFromRepoRoot);
  const abs = path.resolve(__dirname, "../../", mapped);
  return transpileAndEval(abs);
}

export function createTestLogger() {
  return {
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
