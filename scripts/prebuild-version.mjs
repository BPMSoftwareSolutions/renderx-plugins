import { promises as fs } from "fs";
import path from "path";

/**
 * Prebuild helper that optionally sets the package.json version if provided.
 *
 * Supports:
 *   - Explicit version:
 *       --pkg-version 1.2.3
 *       --pkg-version=1.2.3
 *       --pv --v1.2.3 | --pv --v 1.2.3 | --pv --v=1.2.3
 *       env PKG_VERSION=1.2.3
 *       env npm_config_pkg_version=1.2.3
 *   - Bumps (when --pv is present):
 *       --pv --major   (X.Y.Z -> (X+1).0.0)
 *       --pv --minor   (X.Y.Z -> X.(Y+1).0)
 *       --pv --revision (patch) (X.Y.Z -> X.Y.(Z+1))
 *
 * NPM run forwarding:
 *   npm run build -- --pv --revision
 *   npm run build -- --pv --v2.0.4
 *   (prebuild receives args; also parses npm_config_argv.remain as a fallback)
 */

const root = process.cwd();
const pkgPath = path.join(root, "package.json");

function parseJson(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function collectArgTokens(argv) {
  const tokens = [];
  // 1) Direct argv (when npm forwards args to pre/post scripts)
  for (let i = 2; i < argv.length; i++) tokens.push(argv[i]);

  // 2) npm_config_argv (when args are only attached to `npm run build -- ...`)
  const npmc = parseJson(process.env.npm_config_argv || "");
  if (npmc && Array.isArray(npmc.cooked)) {
    const cooked = npmc.cooked.map(String);
    const dashdash = cooked.indexOf("--");
    if (dashdash >= 0) {
      for (let i = dashdash + 1; i < cooked.length; i++) tokens.push(cooked[i]);
    } else {
      // Fallback: include any cooked entries that look like flags
      for (const t of cooked) if (t.startsWith("--")) tokens.push(t);
    }
  }
  // 3) remain rarely holds flags, but include just in case
  if (npmc && Array.isArray(npmc.remain)) {
    for (const t of npmc.remain)
      if (String(t).startsWith("--")) tokens.push(String(t));
  }
  return tokens;
}

function parseArgs(argv) {
  const out = { pv: false, major: false, minor: false, revision: false };
  const tokens = collectArgTokens(argv);

  for (let i = 0; i < tokens.length; i++) {
    const a = tokens[i];
    if (!a) continue;

    if (a === "--pv") out.pv = true;
    if (a === "--major") out.major = true;
    if (a === "--minor") out.minor = true;
    if (a === "--revision" || a === "--patch") out.revision = true;

    if (a === "--pkg-version" && i + 1 < tokens.length) {
      out.pkgVersion = tokens[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--pkg-version=")) {
      out.pkgVersion = a.split("=")[1];
      continue;
    }

    if (a === "--v" && i + 1 < tokens.length) {
      out.pkgVersion = tokens[i + 1];
      i++;
      continue;
    }
    if (a.startsWith("--v=")) {
      out.pkgVersion = a.split("=")[1];
      continue;
    }
    if (a.startsWith("--v") && a.length > 3) {
      // Allow --v1.2.3 style
      out.pkgVersion = a.slice(3);
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
  return (
    typeof v === "string" && /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/.test(v)
  );
}

function bumpSemver(version, kind) {
  const m = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!m) return null;
  let [_, maj, min, pat] = m;
  let M = parseInt(maj, 10);
  let mnr = parseInt(min, 10);
  let pch = parseInt(pat, 10);
  if (kind === "major") {
    M += 1;
    mnr = 0;
    pch = 0;
  } else if (kind === "minor") {
    mnr += 1;
    pch = 0;
  } else if (kind === "revision") {
    pch += 1;
  } else {
    return null;
  }
  return `${M}.${mnr}.${pch}`;
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
        const backoff = 25 * Math.pow(2, attempt);
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
  const args = parseArgs(process.argv);

  let nextVersion = args.pkgVersion;
  let action = "explicit";

  if (!nextVersion && args.pv && (args.major || args.minor || args.revision)) {
    const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
    const current = String(pkg.version || "0.0.0");
    const kind = args.major ? "major" : args.minor ? "minor" : "revision";
    const bumped = bumpSemver(current, kind);
    if (!bumped) {
      console.error(`[#prebuild-version] Cannot bump version from ${current}`);
      process.exit(1);
    }
    nextVersion = bumped;
    action = `bump:${kind}`;
  }

  if (!nextVersion) {
    // Nothing to do
    console.log("[prebuild-version] No version change requested; skipping.");
    return;
  }

  if (!isValidSemverLike(nextVersion)) {
    console.error(`[prebuild-version] Invalid version: ${nextVersion}`);
    process.exit(1);
  }

  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  pkg.version = nextVersion;
  const text = JSON.stringify(pkg, null, 2) + "\n";
  await writeFileWithRetry(pkgPath, text);
  console.log(
    `[prebuild-version] Set package.json version to ${nextVersion} (${action})`
  );
}

maybeSetVersion().catch((e) => {
  console.error(e);
  process.exit(1);
});
