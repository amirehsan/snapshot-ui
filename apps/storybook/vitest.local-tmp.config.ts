import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

// Temporary: the installed Chromium is older than Playwright expects. Deleted after the review.
const configDir = path.join(import.meta.dirname, '.storybook');
const launchOptions = { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' };

export default defineConfig({
  test: {
    testTimeout: 30_000,
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir })],
        test: {
          name: 'storybook',
          setupFiles: ['./.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        extends: true,
        plugins: [storybookTest({ configDir, initialGlobals: { theme: 'dark' } })],
        test: {
          name: 'storybook-dark',
          setupFiles: ['./.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions }),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
