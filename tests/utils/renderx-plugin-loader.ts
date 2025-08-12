import fs from "fs";
import path from "path";

export function loadRenderXPlugin(relativePathFromRepoRoot: string): any {
  const abs = path.resolve(__dirname, "../../", relativePathFromRepoRoot);
  const code = fs.readFileSync(abs, "utf8");
  const transpiled = code
    // strip simple ESM import lines to allow eval in tests
    .replace(/^\s*import\s+[^;]+;?/gm, "")
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
  const fn = new Function("moduleExports", "fetch", transpiled);
  fn(moduleExports, (global as any).fetch);
  return moduleExports;
}

export function createTestLogger() {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}
