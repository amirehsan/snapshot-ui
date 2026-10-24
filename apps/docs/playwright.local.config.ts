import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

// Temporary: the machine's Chromium build is older than the one Playwright expects.
export default defineConfig({
  ...base,
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' },
      },
    },
  ],
});
