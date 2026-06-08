import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from '@playwright/test';

// Playwright n'hérite pas de .env.local — charge-le pour test.skip(autologin) en local.
function loadEnvLocal() {
  const path = join(process.cwd(), '.env.local');
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq).trim();
    if (process.env[key] !== undefined) continue;
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}
loadEnvLocal();

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5005',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    // Wait on the critical-path entry route so its first (cold) compile happens
    // during server-start, not inside the first test — important on CI runners.
    url: 'http://localhost:5005/admin/hearst/simulator',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
