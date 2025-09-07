#!/usr/bin/env node

/**
 * Phase 1 helper: build consolidated artifact directory from local json-* sources.
 * Usage: node scripts/build-artifacts.js --srcRoot=. --outDir=dist/artifacts
 */

import { mkdir, cp, writeFile } from 'fs/promises';
import { createHash } from 'crypto';
import { join } from 'path';
import { ARTIFACT_SCHEMA_VERSION } from '../packages/schema-contract/src/index.js';
// Lazy-load chokidar only if watch mode requested to avoid cost in CI
import { buildInteractionManifest, buildTopicsManifest } from '../packages/manifest-tools/src/index.js';
import { promises as fs } from 'fs';

const __dirname = new URL('.', import.meta.url).pathname;
const rootDir = join(__dirname, '..');
const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.findIndex(a => a === name || a.startsWith(name + '='));
  if (i === -1) return def;
  const eq = args[i].indexOf('=');
  if (eq > -1) return args[i].slice(eq + 1);
  const nxt = args[i + 1];
  if (nxt && !nxt.startsWith('--')) return nxt;
  return def;
}
const srcRoot = getArg('--srcRoot', rootDir);
const outDir = getArg('--outDir', join(rootDir, 'dist', 'artifacts'));
const withIntegrity = args.includes('--integrity');
const withSign = args.includes('--sign');
const watch = args.includes('--watch');

async function readJsonSafe(p) { try { return JSON.parse(await fs.readFile(p,'utf-8')); } catch { return null; } }

async function collect(dir) {
  try { const ents = await fs.readdir(dir); return ents.filter(f=>f.endsWith('.json')).map(f=>readJsonSafe(join(dir,f))); } catch { return []; }
}

async function buildOnce() {
  console.log('🧱 Building artifacts from', srcRoot, '→', outDir);
  await mkdir(outDir, { recursive: true });
  const paths = {
    components: join(srcRoot, 'json-components'),
    sequences: join(srcRoot, 'json-sequences'),
    interactions: join(srcRoot, 'json-interactions'),
    topics: join(srcRoot, 'json-topics'),
    plugins: join(srcRoot, 'json-plugins'),
    layout: join(srcRoot, 'json-layout'),
  };

  // Copy trees
  async function copyTree(rel) {
    const from = paths[rel];
    try {
      await cp(from, join(outDir, rel), { recursive: true });
      console.log('✅ Copied', rel);
    } catch {}
  }
  await Promise.all(['components','sequences','interactions','topics','plugins','layout'].map(copyTree));

  // Rebuild synthesized manifests for portability
  // Interaction
  const interactionCats = await Promise.all(await collect(paths.interactions));
  const componentFiles = await Promise.all(await collect(paths.components));
  function extractOverrides(json) {
    return json?.integration?.routeOverrides || json?.routeOverrides || json?.integration?.interactions?.routeOverrides || {}; }
  const overrides = componentFiles.map(extractOverrides);
  const schemaVersion = ARTIFACT_SCHEMA_VERSION;
  const interactionManifest = {
    schemaVersion,
    ...buildInteractionManifest(interactionCats.filter(Boolean), overrides)
  };
  await writeFile(join(outDir, 'interaction-manifest.json'), JSON.stringify(interactionManifest,null,2));

  // Topics
  const topicCats = await Promise.all(await collect(paths.topics));
  const topicsManifest = {
    schemaVersion,
    ...buildTopicsManifest(topicCats.filter(Boolean))
  };
  await writeFile(join(outDir, 'topics-manifest.json'), JSON.stringify(topicsManifest,null,2));

  // Layout (copy single file if present)
  const layout = await readJsonSafe(join(paths.layout,'layout.json'));
  if (layout) {
    const layoutOut = { schemaVersion, ...layout };
    await writeFile(join(outDir,'layout-manifest.json'), JSON.stringify(layoutOut,null,2));
  }

  // Summary file
  const summary = {
    schemaVersion,
    version: '1.0.0',
    counts: {
      interactionRoutes: Object.keys(interactionManifest.routes).length,
      topics: Object.keys(topicsManifest.topics).length,
      components: componentFiles.filter(Boolean).length,
    }
  };
  await writeFile(join(outDir,'manifest-set.json'), JSON.stringify(summary,null,2));
  if (withIntegrity) {
    const files = ['interaction-manifest.json','topics-manifest.json','layout-manifest.json','manifest-set.json'];
    const integrity = { generated: new Date().toISOString(), files: {}, aggregate: '' };
    const agg = createHash('sha256');
    for (const f of files) {
      try {
        const p = join(outDir,f);
        const buf = await fs.readFile(p);
        const h = createHash('sha256').update(buf).digest('hex');
        integrity.files[f] = { hash: h, bytes: buf.length };
        agg.update(h);
      } catch {}
    }
    integrity.aggregate = agg.digest('hex');
    await writeFile(join(outDir,'artifacts.integrity.json'), JSON.stringify(integrity,null,2));
    console.log('🔐 Integrity file emitted');

    if (withSign) {
      try {
        // Simple ephemeral Ed25519 key pair (Node >= 19). In a real flow, the private key lives in CI secret storage.
        const { generateKeyPairSync, sign } = await import('crypto');
        let privPem = process.env.RENDERX_SIGNING_PRIVATE_PEM;
        let pubPem = process.env.RENDERX_SIGNING_PUBLIC_PEM;
        if (!privPem || !pubPem) {
          const kp = generateKeyPairSync('ed25519');
            privPem = kp.privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
            pubPem = kp.publicKey.export({ type: 'spki', format: 'pem' }).toString();
            await writeFile(join(outDir,'SIGNING_NOTE.txt'), 'Ephemeral key pair generated (dev mode). For production, inject RENDERX_SIGNING_PRIVATE_PEM / RENDERX_SIGNING_PUBLIC_PEM.');
        }
        const integrityBuf = await fs.readFile(join(outDir,'artifacts.integrity.json'));
        const signature = sign(null, integrityBuf, privPem).toString('base64');
        const sigObj = { algorithm: 'ed25519', signedAt: new Date().toISOString(), signature, publicKey: pubPem };
        await writeFile(join(outDir,'artifacts.signature.json'), JSON.stringify(sigObj,null,2));
        console.log('✍️  Signature scaffold emitted (artifacts.signature.json)');
      } catch (e) {
        console.warn('⚠️ Signature scaffold failed:', e?.message || e);
      }
    }
  }
  console.log('✨ Artifact build complete');
}
async function run() {
  await buildOnce();
  if (watch) {
    console.log('👀 Entering watch mode (rebuilt on JSON changes)');
    const { default: chokidar } = await import('chokidar');
    const watchDirs = [
      'json-components',
      'json-sequences',
      'json-interactions',
      'json-topics',
      'json-plugins',
      'json-layout'
    ].map(d => join(srcRoot, d));
    const watcher = chokidar.watch(watchDirs, {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 100, pollInterval: 25 }
    });
    let pending = false;
    async function rebuild() {
      if (pending) return; // debounce burst changes
      pending = true;
      setTimeout(async () => {
        try {
          console.log('🔁 Change detected — rebuilding artifacts...');
          await buildOnce();
          console.log('✅ Rebuild complete. Watching...');
        } catch (e) {
          console.error('⚠️ Rebuild failed', e);
        } finally {
          pending = false;
        }
      }, 120);
    }
    watcher.on('add', rebuild).on('change', rebuild).on('unlink', rebuild).on('error', e => console.error('Watcher error', e));
    const shutdown = () => {
      console.log('\n🛑 Watch mode shutting down');
      watcher.close().then(()=>process.exit(0));
    };
    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }
}
run().catch(e=>{ console.error('Artifact build failed', e); process.exit(1); });
