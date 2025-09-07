#!/usr/bin/env node
/**
 * Cross-manifest validator: schemaVersion consistency + pluginId references.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { ARTIFACT_SCHEMA_VERSION } from '@renderx/schema-contract';

const root = process.cwd();
const artifactsDir = join(root, 'dist', 'artifacts');
function load(name) {
  try { return JSON.parse(readFileSync(join(artifactsDir, name),'utf-8')); } catch { return null; }
}
const interaction = load('interaction-manifest.json');
const topics = load('topics-manifest.json');
const layout = load('layout-manifest.json');
const manifestSet = load('manifest-set.json');

const schemaVersions = [interaction?.schemaVersion, topics?.schemaVersion, layout?.schemaVersion, manifestSet?.schemaVersion].filter(Boolean);
const uniqueSchema = Array.from(new Set(schemaVersions));
let failed = false;
if (uniqueSchema.length > 1) {
  console.error('❌ Inconsistent schemaVersion values:', uniqueSchema);
  failed = true;
}
const schemaVersion = uniqueSchema[0];
if (!schemaVersion) {
  console.error('❌ Missing schemaVersion in artifacts');
  failed = true;
}
// Compare with expected (non-fatal unless mismatch?)
if (schemaVersion && schemaVersion !== ARTIFACT_SCHEMA_VERSION) {
  console.warn('⚠️ Artifact schemaVersion', schemaVersion, 'differs from contract', ARTIFACT_SCHEMA_VERSION);
  globalThis.__artifactWarnings = (globalThis.__artifactWarnings||[]).concat([{ type:'schema-mismatch', value: schemaVersion }]);
}
// Collect pluginIds from sequences (interaction manifest) and topics manifest (if they embed plugin metadata)
const sequencePluginIds = new Set();
try {
  const routes = interaction?.routes || {};
  for (const r of Object.values(routes)) {
    // @ts-ignore
    if (r?.pluginId) sequencePluginIds.add(r.pluginId);
  }
} catch {}
// Plugin manifest (source or copied) for runtime plugin IDs
let pluginManifest = null;
try { pluginManifest = JSON.parse(readFileSync(join(root,'public','plugins','plugin-manifest.json'),'utf-8')); } catch {}
try { if (!pluginManifest) pluginManifest = JSON.parse(readFileSync(join(root,'json-plugins','plugin-manifest.json'),'utf-8')); } catch {}
const runtimePluginIds = new Set();
if (pluginManifest && Array.isArray(pluginManifest.plugins)) {
  for (const p of pluginManifest.plugins) runtimePluginIds.add(p.id);
}
// Report missing plugin sequence coverage
// Allowlist (comma separated env) for plugins intentionally lacking sequences (e.g., pure UI header plugins)
const allowlist = (process.env.RENDERX_SEQUENCE_COVERAGE_ALLOW || '').split(',').map(s=>s.trim()).filter(Boolean);
const missingSequences = Array.from(runtimePluginIds).filter(id => !allowlist.includes(id) && !Array.from(sequencePluginIds).some(seqId => seqId.toLowerCase().includes(id.replace(/plugin$/i,'').toLowerCase().replace(/[-]/g,''))));
if (missingSequences.length) {
  console.warn('⚠️ Plugins without obvious sequence coverage (heuristic):', missingSequences);
  globalThis.__artifactWarnings = (globalThis.__artifactWarnings||[]).concat([{ type:'coverage', items: missingSequences }]);
}
if (!failed) console.log('✅ Artifacts validation passed (schemaVersion', schemaVersion, ')');
// --- Strict Mode Escalation ---
const strict = process.env.RENDERX_VALIDATION_STRICT === '1';
if (strict && (globalThis.__artifactWarnings?.length || 0) > 0) {
  console.error(`RENDERX_VALIDATION_STRICT=1 escalating ${globalThis.__artifactWarnings.length} warnings to error.`);
  process.exit(1);
}
// Optional signature requirement
if (process.env.RENDERX_REQUIRE_SIGNATURE === '1') {
  try {
    const { readFileSync } = await import('fs');
    const { join } = await import('path');
    const sigPath = join(artifactsDir, 'artifacts.signature.json');
    const integPath = join(artifactsDir, 'artifacts.integrity.json');
    const integBuf = readFileSync(integPath);
    const sig = JSON.parse(readFileSync(sigPath, 'utf-8'));
    const { verify } = await import('crypto');
    const ok = verify(null, integBuf, sig.publicKey, Buffer.from(sig.signature,'base64'));
    if (!ok) {
      console.error('❌ Signature verification failed under RENDERX_REQUIRE_SIGNATURE=1');
      process.exit(1);
    }
    console.log('🔏 Signature verified (enforced).');
  } catch (e) {
    console.error('❌ Required signature missing or unreadable:', e?.message || e);
    process.exit(1);
  }
}
process.exit(failed ? 1 : 0);
