#!/usr/bin/env node
import { readFileSync } from 'fs';
import { join } from 'path';
import { verify } from 'crypto';

const root = process.cwd();
const dir = join(root, 'dist', 'artifacts');
function fail(msg) { console.error('❌', msg); process.exit(1); }
try {
  const integrity = readFileSync(join(dir,'artifacts.integrity.json'));
  const sig = JSON.parse(readFileSync(join(dir,'artifacts.signature.json'),'utf-8'));
  const ok = verify(null, integrity, sig.publicKey, Buffer.from(sig.signature,'base64'));
  if (!ok) fail('Signature verification failed');
  console.log('✅ Signature verified (algorithm', sig.algorithm + ')');
} catch (e) {
  fail('Verification error: ' + (e?.message || e));
}