import { promises as fs } from "fs";
import path from "path";
import { pathToFileURL } from "url";

const root = process.cwd();
const pkgPath = path.join(root, "package.json");
const pluginsManifestPath = path.join(root, "plugins", "manifest.json");

export async function syncPluginsManifestVersion() {
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf8"));
  const version = pkg.version || "0.1.0";

  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(pluginsManifestPath, "utf8"));
  } catch (e) {
    throw new Error(
      `Could not read or parse plugins/manifest.json at ${pluginsManifestPath}: ${e?.message || e}`
    );
  }

  // Update root version
  manifest.version = version;

  // Update per-plugin versions, if present
  if (Array.isArray(manifest.plugins)) {
    manifest.plugins = manifest.plugins.map((p) => ({
      ...p,
      version,
    }));
  }

  await fs.writeFile(
    pluginsManifestPath,
    JSON.stringify(manifest, null, 2),
    "utf8"
  );
  console.log(
    `Updated plugins/manifest.json versions to ${version} (root + ${
      Array.isArray(manifest.plugins) ? manifest.plugins.length : 0
    } plugins)`
  );
}

async function main() {
  await syncPluginsManifestVersion();
}

// Run only when executed directly via Node, not when imported for tests
const invokedPathUrl = pathToFileURL(process.argv[1] || "").href;
if (import.meta.url === invokedPathUrl) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}

