import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    // CI runs these beside four browser projects, so a busy runner gets more time; locally the default holds.
    testTimeout: process.env.CI ? 15_000 : 5_000,
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.{ts,tsx}'],
  },
});
