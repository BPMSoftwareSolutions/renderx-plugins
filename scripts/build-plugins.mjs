import { promises as fs } from 'fs';
import path from 'path';

// Simple copy-based build: plugins/** -> dist/<plugin>/index.js
const root = process.cwd();
const pluginsDir = path.join(root, 'plugins');
const distDir = path.join(root, 'dist');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function copyIfExists(src, dest) {
  try {
    const content = await fs.readFile(src, 'utf8');
    await ensureDir(path.dirname(dest));
    await fs.writeFile(dest, content, 'utf8');
    console.log('copied', src, '->', dest);
  } catch (e) {
    if (e.code === 'ENOENT') return; // skip
    throw e;
  }
}

async function main() {
  await ensureDir(distDir);
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
  for (const ent of entries) {
    if (!ent.isDirectory()) continue;
    const pluginName = ent.name;
    const srcIndex = path.join(pluginsDir, pluginName, 'index.js');
    const destIndex = path.join(distDir, pluginName, 'index.js');
    await copyIfExists(srcIndex, destIndex);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

