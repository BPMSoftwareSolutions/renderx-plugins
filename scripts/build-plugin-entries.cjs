const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Helper function to recursively copy directories
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      // Copy all files except TypeScript files (we'll compile those separately)
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }
}

// Helper function to compile TypeScript files in a directory
function compileTypeScriptFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      compileTypeScriptFiles(srcPath, destPath);
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      // Compile TypeScript file
      const outFile = path.join(destDir, entry.name.replace(/\.tsx?$/, '.js'));
      try {
        esbuild.buildSync({
          entryPoints: [srcPath],
          bundle: false,
          platform: 'browser',
          format: 'esm',
          outfile: outFile,
          sourcemap: false,
          minify: false,
          target: ['esnext'],
          jsx: 'automatic', // For .tsx files
        });
      } catch (error) {
        console.warn(`⚠️ Failed to compile ${srcPath}:`, error.message);
      }
    }
  }
}

const pluginsRoot = path.resolve(__dirname, '../plugins');
const outRoot = path.resolve(__dirname, '../dist/artifacts/plugins');

// Clean the output directory
if (fs.existsSync(outRoot)) {
  fs.rmSync(outRoot, { recursive: true, force: true });
}
fs.mkdirSync(outRoot, { recursive: true });

const pluginDirs = fs.readdirSync(pluginsRoot).filter(dir => {
  const dirPath = path.join(pluginsRoot, dir);
  return fs.statSync(dirPath).isDirectory();
});

console.log('🔧 Building plugin directories with full module trees...');

for (const dir of pluginDirs) {
  const srcDir = path.join(pluginsRoot, dir);
  const destDir = path.join(outRoot, dir);

  // Copy all non-TypeScript files first
  copyDir(srcDir, destDir);

  // Then compile all TypeScript files
  compileTypeScriptFiles(srcDir, destDir);

  console.log(`✅ Built ${dir}/ with full module tree`);
}

console.log('✅ All plugin directories built to dist/artifacts/plugins');
