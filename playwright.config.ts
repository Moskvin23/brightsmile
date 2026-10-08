import { defineConfig } from '@playwright/test';

const PORT = 3100;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  expect: { timeout: 15_000 }, // the first request to a route compiles it in dev mode
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  // locally the installed Chrome is used; in CI Playwright's own Chromium (npx playwright install chromium)
  use: { baseURL: `http://localhost:${PORT}`, channel: process.env.CI ? undefined : 'chrome', viewport: { width: 1400, height: 850 } },
  webServer: { command: `npx next dev -p ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI, timeout: 120_000 },
});
