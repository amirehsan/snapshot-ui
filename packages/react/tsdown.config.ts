import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  tsconfig: 'tsconfig.build.json',
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  // One output module per source module. This is what keeps each file's
  // "use client" directive; bundled mode strips it.
  unbundle: true,
  dts: true,
  // true emits a .d.ts.map reference with no map file.
  sourcemap: false,
  // Rolldown warns about every directive it cannot vouch for when bundling.
  // scripts/check-use-client.js verifies the output instead.
  suppressWarnings: [/MODULE_LEVEL_DIRECTIVE/],
  deps: {
    neverBundle: [/^react($|\/)/, /^react-dom($|\/)/, /^react-aria-components($|\/)/, /^lucide-react($|\/)/],
  },
});
