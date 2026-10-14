import { configDefaults, defineConfig } from 'vitest/config';

/**
 * The server-face test runs in two projects of its own, one per time zone, and the unit project leaves it out
 * (plan, spec correction 3). Both write the same test names to one snapshot file, so a zone that changes a byte
 * of a part's server HTML fails against the other. `provide` names the zone each project sets, so the test can
 * prove its run moved Intl's zone.
 */
const FACE = 'test/server-face.test.tsx';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, FACE],
        },
      },
      {
        extends: true,
        test: { name: 'face-utc', include: [FACE], env: { TZ: 'UTC' }, provide: { zone: 'UTC' } },
      },
      {
        extends: true,
        test: {
          name: 'face-tehran',
          include: [FACE],
          env: { TZ: 'Asia/Tehran' },
          provide: { zone: 'Asia/Tehran' },
        },
      },
    ],
  },
});
