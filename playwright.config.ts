import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: ['**/*.spec.ts'],
  reporter: [['list']],
  use: {
    // We launch browser manually in tests, so keep default minimal context options
    headless: true,
  },
});

