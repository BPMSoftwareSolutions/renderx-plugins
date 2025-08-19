import { promises as fs } from "fs";
import path from "path";

/**
 * Prebuild helper that optionally sets the package.json version if provided.
 * Usage options (any one):
 *   node ./scripts/prebuild-version.mjs --pkg-version 1.2.3
 *   node ./scripts/prebuild-version.mjs --pkg-version=1.2.3
 *   PKG_VERSION=1.2.3 node ./scripts/prebuild-version.mjs
 *   npm run build -- --pkg-version=1.2.3   (relies on npm exposing npm_config_pkg_version)
 */

const root = process.cwd();
const pkgPath = path.join(root, "package.json");

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a) continue;
    if (a === "--pkg-version" && i + 1 < argv.length) {
      out.pkgVersion = argv[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--pkg-version=")) {
      out.pkgVersion = a.split("=")[1];
      continue;
    }
  }
  // Fallbacks via env
  if (!out.pkgVersion && process.env.PKG_VERSION) {
    out.pkgVersion = process.env.PKG_VERSION;
  }
  if (!out.pkgVersion && process.env.npm_config_pkg_version) {
    out.pkgVersion = process.env.npm_config_pkg_version;
  }
  return out;
}

function isValidSemverLike(v) {
  // Minimal check: allow numbers and dot + optional pre-release/build strings
  // We rely on npm/yarn publish to further validate. Keep permissive for internal builds.
  return (
    typeof v === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(v)
  );
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function writeFileWithRetry(file, text, tries = 6) {
  let attempt = 0;
  let lastErr;
  while (attempt < tries) {
    try {
      await fs.writeFile(file, text, "utf8");
      return;
    } catch (e) {
      lastErr = e;
      if (e && (e.code === "EBUSY" || e.code === "EPERM")) {
        const backoff = 25 * Math.pow(2, attempt); // 25ms, 50ms, 100ms, ...
        await delay(backoff);
        attempt++;
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

async function maybeSetVersion() {
  const { pkgVersion } = parseArgs(process.argv);
  if (!pkgVersion) {
    console.log("[prebuild-version] No --pkg-version provided; skipping.");
    return;
  }
  if (!isValidSemverLike(pkgVersion)) {
    console.error(`[prebuild-version] Invalid version: ${pkgVersion}`);
    process.exit(1);
  }

  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  pkg.version = pkgVersion;
  const text = JSON.stringify(pkg, null, 2) + "\n";
  await writeFileWithRetry(pkgPath, text);
  console.log(`[prebuild-version] Set package.json version to ${pkgVersion}`);
}

maybeSetVersion().catch((e) => {
  console.error(e);
  process.exit(1);
});
