const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const packagesRoot = path.resolve(__dirname, '../packages');
const packageDirs = fs.readdirSync(packagesRoot).filter(dir => {
  const entry = path.join(packagesRoot, dir, 'src', 'index.ts');
  return fs.existsSync(entry);
});

console.log('🔧 Building packages TypeScript to JavaScript...');

for (const dir of packageDirs) {
  const entry = path.join(packagesRoot, dir, 'src', 'index.ts');
  const outdir = path.join(packagesRoot, dir, 'src');
  
  if (fs.existsSync(entry)) {
    esbuild.buildSync({
      entryPoints: [entry],
      bundle: false,
      platform: 'node',
      format: 'esm',
      outdir,
      outExtension: { '.js': '.js' },
      sourcemap: false,
      minify: false,
      target: ['node18'],
      // Keep TypeScript types as comments for debugging
      keepNames: true,
    });
    console.log(`✅ Built ${dir}/src/index.js`);
  } else {
    console.warn(`⚠️ Missing entry: ${entry}`);
  }
}

console.log('✅ All package TypeScript files compiled to JavaScript');
