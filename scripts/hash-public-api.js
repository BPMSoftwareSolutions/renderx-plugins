#!/usr/bin/env node
/**
 * Generates a stable hash of the public API allowlist + public-api.ts contents.
 * Emits public-api.hash.json and optionally validates against existing baseline when --check.
 */
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const args = process.argv.slice(2);
const check = args.includes('--check');
const root = process.cwd();
const apiFile = join(root, 'packages', 'host-sdk', 'public-api.ts');
const validatorFile = join(root, 'scripts', 'validate-public-api.js');
const baselineFile = join(root, 'public-api.hash.json');

function hashText(t){ return createHash('sha256').update(t.replace(/\r\n/g,'\n'),'utf-8').digest('hex'); }

let apiSrc = '';
let validatorSrc = '';
try { apiSrc = readFileSync(apiFile,'utf-8'); } catch {}
try { validatorSrc = readFileSync(validatorFile,'utf-8'); } catch {}

const digest = hashText(apiSrc + '\n--validator--\n' + validatorSrc);
const payload = { generated: new Date().toISOString(), sha256: digest };
if (!check) {
  writeFileSync(baselineFile, JSON.stringify(payload,null,2));
  console.log('🧾 Public API hash generated:', digest);
  process.exit(0);
}
let baseline = null;
try { baseline = JSON.parse(readFileSync(baselineFile,'utf-8')); } catch {}
if (!baseline) {
  console.error('❌ Baseline missing. Run without --check first to establish.');
  process.exit(1);
}
if (baseline.sha256 !== digest) {
  console.error('❌ Public API hash mismatch. Expected', baseline.sha256, 'got', digest);
  process.exit(1);
}
console.log('✅ Public API hash matches baseline:', digest);
