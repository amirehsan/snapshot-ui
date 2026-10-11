import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${String(PORT)}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The production build, served by plain node so it runs anywhere.
    command: `node node_modules/next/dist/bin/next start -p ${String(PORT)} -H 127.0.0.1`,
    // Ready once a docs page answers: the site has no page at `/` until the homepage lands.
    url: `http://127.0.0.1:${String(PORT)}/docs`,
    reuseExistingServer: !isCI,
  },
});
