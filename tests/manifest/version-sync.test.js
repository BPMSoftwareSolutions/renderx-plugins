const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const root = process.cwd();

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: 'inherit' });
}

describe('manifest generation', () => {
  test('uses package.json version for manifest and plugin entries', () => {
    // Act: regenerate manifest fresh
    run('node ./scripts/generate-manifest.mjs');

    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
    const manifest = JSON.parse(fs.readFileSync(path.join(root, 'dist', 'manifest.json'), 'utf8'));

    expect(manifest.version).toBe(pkg.version);
    for (const p of manifest.plugins) {
      expect(p.version).toBe(pkg.version);
    }
  });
});

