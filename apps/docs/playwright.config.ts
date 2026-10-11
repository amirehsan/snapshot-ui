import { defineConfig, devices } from '@playwright/test';

// Override with DOCS_E2E_PORT to run e2e in two checkouts at once. An empty
// value means the default, and anything that is not a port fails loudly.
const requested = process.env.DOCS_E2E_PORT ?? '';
const requestedPort = requested === '' ? '3100' : requested;
const PORT = Number(requestedPort);
if (!/^\d+$/.test(requestedPort) || PORT < 1 || PORT > 65535) {
  throw new Error(`DOCS_E2E_PORT must be an integer from 1 to 65535, got "${requestedPort}".`);
}
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
    // Ready once the homepage answers.
    url: `http://127.0.0.1:${String(PORT)}/`,
    reuseExistingServer: !isCI,
  },
});
