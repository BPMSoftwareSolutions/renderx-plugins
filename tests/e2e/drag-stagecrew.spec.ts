import { test, expect } from '@playwright/test';
import { chromium, Page, LaunchOptions } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

const PORT = process.env.PORT ? Number(process.env.PORT) : 5007;

function findChromiumExecutable(): string | null {
  // Prefer explicit env override
  if (process.env.CHROMIUM_EXECUTABLE && fs.existsSync(process.env.CHROMIUM_EXECUTABLE)) return process.env.CHROMIUM_EXECUTABLE;
  try {
    const home = os.homedir();
    const base = path.join(home, '.cache', 'ms-playwright');
    if (!fs.existsSync(base)) return null;
    const entries = fs.readdirSync(base).filter((d) => d.startsWith('chromium-'));
    entries.sort(); // pick latest
    const latest = entries[entries.length - 1];
    const candidate = path.join(base, latest, 'chrome-linux', 'chrome');
    if (fs.existsSync(candidate)) return candidate;
  } catch {}
  // Try common system paths for option #2
  const systemCandidates = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'];
  for (const c of systemCandidates) { try { if (fs.existsSync(c)) return c; } catch {} }
  return null;
}

function timestamp() {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}_${pad(d.getHours())}-${pad(d.getMinutes())}-${pad(d.getSeconds())}`;
}

async function saveConsoleLog(logs: string[]) {
  const dir = path.resolve(process.cwd(), 'docs/logs');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const p = path.join(dir, `console.${timestamp()}.log`);
  fs.writeFileSync(p, logs.join('\n'), 'utf8');
  return p;
}

test.describe('E2E: Drag StageCrew commits appear in console logs', () => {
  let browser: any;

  test.beforeAll(async () => {
    const execPath = findChromiumExecutable();
    const launchOptions: LaunchOptions = execPath ? { executablePath: execPath } : {};
    browser = await chromium.launch(launchOptions);
  });

  test.afterAll(async () => {
    await browser?.close();
  });

  test('drag emits StageCrew beginBeat/update/commit and saves log', async () => {
    const context = await browser.newContext();
    const page: Page = await context.newPage();
    const consoleLines: string[] = [];

    page.on('console', (msg) => {
      consoleLines.push(`[console] ${msg.type().toUpperCase()}: ${msg.text()}`);
    });

    await page.goto(`http://localhost:${PORT}/tests/e2e/drag-stagecrew.html`);

    // Wait for completion marker
    await page.waitForFunction(() => Array.isArray((window as any).__logs__) && (window as any).__logs__.some((l: string) => /\[E2E\] done/.test(l)), null, { timeout: 5000 });

    // Save and assert logs
    const logPath = await saveConsoleLog(consoleLines);

    const hasBegin = consoleLines.some(l => /\[StageCrew beginBeat\]/.test(l));
    const hasUpdate = consoleLines.some(l => /\[StageCrew update\]/.test(l));
    const hasCommit = consoleLines.some(l => /\[StageCrew commit\]/.test(l));

    expect(hasBegin && hasUpdate && hasCommit).toBe(true);

    // Expose log path for manual review
    console.log(`[E2E] logs saved to: ${logPath}`);
  });
});

