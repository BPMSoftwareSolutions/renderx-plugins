#!/usr/bin/env node
/**
 * Post processing step to rewrite plugin-manifest module paths for package consumption.
 * - Convert absolute /plugins/... paths to relative ./plugins/... paths
 * - Switch .ts extensions to .js (built output under dist/artifacts/plugins)
 * - Fail (exit 1) if any ui/runtime module still ends with .ts or starts with /
 */
const fs = require("fs");
const path = require("path");

const manifestPath = path.resolve(
  __dirname,
  "../json-plugins/plugin-manifest.json"
);
const distPluginManifestPath = path.resolve(
  __dirname,
  "../dist/artifacts/plugins/plugin-manifest.json"
);

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function saveJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
}

function fixModulePath(mod) {
  if (!mod || typeof mod !== "string") return mod;
  let next = mod;
  if (next.startsWith("/plugins/")) next = "." + next; // becomes ./plugins/...
  // If it starts with plugins/ without leading dot, make it relative
  if (next.startsWith("plugins/")) next = "./" + next;
  next = next.replace(/\.ts(x)?$/i, ".js");
  return next;
}

function walkRewrite(obj, parentTrail = []) {
  if (!obj || typeof obj !== "object") return { changed: false };
  let changed = false;
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const r = walkRewrite(obj[i], parentTrail.concat([i]));
      if (r.changed) changed = true;
    }
    return { changed };
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (k === "module" && typeof v === "string") {
      const fixed = fixModulePath(v);
      if (fixed !== v) {
        obj[k] = fixed;
        changed = true;
      }
    } else if (v && typeof v === "object") {
      const r = walkRewrite(v, parentTrail.concat([k]));
      if (r.changed) changed = true;
    }
  }
  return { changed };
}

function processManifest() {
  const manifest = loadJson(manifestPath);
  const { changed } = walkRewrite(manifest);

  // Validation: collect offenders
  const offenders = [];
  function collect(obj, trail = []) {
    if (!obj || typeof obj !== "object") return;
    if (Array.isArray(obj))
      return obj.forEach((v, i) => collect(v, trail.concat([i])));
    for (const [k, v] of Object.entries(obj)) {
      if (
        k === "module" &&
        typeof v === "string" &&
        (v.endsWith(".ts") || v.startsWith("/"))
      ) {
        offenders.push({ path: trail.concat([k]).join("."), value: v });
      }
      if (v && typeof v === "object") collect(v, trail.concat([k]));
    }
  }
  collect(manifest);
  if (offenders.length) {
    console.error(
      "❌ post-fix-manifest: unresolved .ts or absolute paths remain:",
      offenders
    );
    process.exit(1);
  }
  if (changed) {
    console.log(
      "🛠️  Rewriting plugin-manifest module paths for package distribution"
    );
  }
  saveJson(distPluginManifestPath, manifest);
  console.log("✅ plugin-manifest.json written to dist/artifacts/plugins");
}

try {
  processManifest();
} catch (e) {
  console.error("post-fix-manifest failed", e);
  process.exit(1);
}
