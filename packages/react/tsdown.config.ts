import { defineConfig } from 'tsdown';

export default defineConfig({
  // The private overlay hooks are entries of their own, so they are built, and their directive checked,
  // before any component imports them. The exports map still names only the index, so nothing exports them.
  entry: ['src/index.ts', 'src/overlay/useOverlayScope.ts', 'src/overlay/useOverlayStack.ts'],
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
