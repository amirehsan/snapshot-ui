import { defineConfig } from '@playwright/test';
import base from './playwright.config';

// Temporary: the installed Chromium is older than Playwright expects. Deleted after the review.
export default defineConfig({
  ...base,
  projects: (base.projects ?? []).map((project) => ({
    ...project,
    use: {
      ...project.use,
      launchOptions: { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' },
    },
  })),
});
