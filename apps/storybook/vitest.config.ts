import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

const configDir = path.join(import.meta.dirname, '.storybook');

export default defineConfig({
  test: {
    // CI runs four browsers beside the unit tests, and WebKit stalls first on a busy runner; locally the default holds.
    testTimeout: process.env.CI ? 30_000 : 15_000,
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
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        // The same stories again with the dark tokens, so axe checks both themes.
        extends: true,
        plugins: [storybookTest({ configDir, initialGlobals: { theme: 'dark' } })],
        test: {
          name: 'storybook-dark',
          setupFiles: ['./.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      {
        // Stories tagged webkit again in WebKit, the engine a phone runs.
        extends: true,
        plugins: [storybookTest({ configDir, tags: { include: ['webkit'] } })],
        test: {
          name: 'storybook-webkit',
          // One file at a time: WebKit slows the timers and animations of a page that is not in front.
          fileParallelism: false,
          setupFiles: ['./.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'webkit' }],
          },
        },
      },
      {
        // Stories tagged firefox again in Firefox, so a key guard is proved in the third engine too (risk R3).
        extends: true,
        plugins: [storybookTest({ configDir, tags: { include: ['firefox'] } })],
        test: {
          name: 'storybook-firefox',
          // Not one file at a time as in WebKit: run that way, Firefox stopped moving focus into a story.
          setupFiles: ['./.storybook/vitest.setup.ts'],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'firefox' }],
          },
        },
      },
    ],
  },
});
