import { defineConfig, devices } from '@playwright/test';

// Its own port, so it can run beside the visual tests.
const PORT = 6011;
const isCI = Boolean(process.env.CI);

/** The concentric-corner audit: measures every story in every shape, with no screenshots. */
export default defineConfig({
  testDir: './tests/concentric',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  // The runner has four cores, and the audit waits on the page more than it computes.
  workers: isCI ? 4 : undefined,
  reporter: isCI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    colorScheme: 'light',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `node node_modules/http-server/bin/http-server storybook-static -a 127.0.0.1 -p ${PORT} -s -c-1`,
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: !isCI,
  },
});
