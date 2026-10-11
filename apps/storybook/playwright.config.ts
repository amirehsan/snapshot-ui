import { defineConfig, devices } from '@playwright/test';

const PORT = 6007;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/visual',
  // No {platform} in the path: baselines are only ever made in the CI image.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    colorScheme: 'light',
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Plain node, so the same command runs on a laptop and inside the CI image.
    command: `node node_modules/http-server/bin/http-server storybook-static -a 127.0.0.1 -p ${PORT} -s -c-1`,
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: !isCI,
  },
});
