const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();
const distDir = path.join(root, 'dist');

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

describe('build script', () => {
  test('cleans dist before copying', () => {
    // Arrange: create a stale file in dist
    fs.mkdirSync(distDir, { recursive: true });
    const staleFile = path.join(distDir, 'stale.txt');
    fs.writeFileSync(staleFile, 'stale');
    expect(fs.existsSync(staleFile)).toBe(true);

    // Act: run the build script directly
    run('node ./scripts/build-plugins.mjs');

    // Assert: stale file should be gone; known plugin artifact should exist
    expect(fs.existsSync(staleFile)).toBe(false);
    expect(fs.existsSync(path.join(distDir, 'component-library-plugin', 'index.js'))).toBe(true);
  });
});

