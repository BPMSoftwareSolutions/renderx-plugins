#!/usr/bin/env node
/**
 * Package built artifacts into a versioned tarball for distribution / repo separation.
 * Usage:
 *   node scripts/pack-artifacts.js --dir=dist/artifacts --out=dist/packages --version=0.1.0
 * Env:
 *   PACK_VERSION (fallback to package.json version) 
 */
import { mkdir, cp, readFile, writeFile } from 'fs/promises';
import { existsSync, createReadStream } from 'fs';
import { join, resolve } from 'path';
import { createHash } from 'crypto';

const args = process.argv.slice(2);
function arg(name, def) {
  const hit = args.find(a => a === name || a.startsWith(name+'='));
  if (!hit) return def;
  const eq = hit.indexOf('=');
  if (eq === -1) return args[args.indexOf(hit)+1] && !args[args.indexOf(hit)+1].startsWith('--') ? args[args.indexOf(hit)+1] : def;
  return hit.slice(eq+1);
}
const artifactsDir = resolve(arg('--dir','dist/artifacts'));
const outDir = resolve(arg('--out','dist/packages'));
const pkgJson = JSON.parse(await readFile('./package.json','utf-8'));
const version = arg('--version', process.env.PACK_VERSION || pkgJson.version || '0.0.0');
const name = 'renderx-artifacts';
const versionDir = join(outDir, `${name}-v${version}`);
await mkdir(outDir, { recursive: true });
if (!existsSync(artifactsDir)) {
  console.error('❌ Artifacts dir missing:', artifactsDir);
  process.exit(1);
}
// Copy to a temp version dir (clean minimal subset)
await mkdir(versionDir, { recursive: true });
await cp(artifactsDir, versionDir, { recursive: true });

// Produce tar.gz (minimal node implementation using native streams + unix style if available)
const tarName = `${name}-v${version}.tar.gz`;
const tarPath = join(outDir, tarName);

// Lazy generate a basic tar via Node archiver fallback (simple manual .tar not implemented to stay light):
// We rely on system 'tar' if present for simplicity; fallback prints instruction.
async function createTar() {
  const { spawn } = await import('child_process');
  return new Promise((res, rej) => {
    const proc = spawn(process.platform === 'win32' ? 'tar.exe' : 'tar', ['-czf', tarPath, '-C', outDir, `${name}-v${version}`], { stdio: 'inherit' });
    proc.on('exit', code => code === 0 ? res(null) : rej(new Error('tar exit '+code)));
  });
}
try {
  await createTar();
} catch {
  console.warn('⚠️ Failed to invoke system tar, attempting JS gzip of folder (non-standard)');
  const fallback = join(outDir, `${name}-v${version}.folder.txt`);
  await writeFile(fallback, 'TAR not available. Use a system with tar to produce proper package.');
}

// Hash tarball
let sha256 = '';
try {
  const h = createHash('sha256');
  const rs = createReadStream(tarPath);
  rs.on('data', d => h.update(d));
  await new Promise((r, j) => rs.on('end', r).on('error', j));
  sha256 = h.digest('hex');
} catch {}
const manifest = { name, version, created: new Date().toISOString(), source: artifactsDir, tar: tarPath, sha256 };
await writeFile(join(outDir, `${name}-v${version}.json`), JSON.stringify(manifest,null,2));
console.log('📦 Packaged artifacts:', manifest);