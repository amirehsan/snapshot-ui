import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: [
    '../../../packages/react/src/**/*.stories.@(ts|tsx)',
    '../../../packages/charts/src/**/*.stories.@(ts|tsx)',
    // Stories that need both packages, which neither package's own stories may import together.
    '../stories/**/*.stories.@(ts|tsx)',
  ],
  // Vazirmatn for the Persian stories, served with no network for the baselines (public/fonts/vazirmatn).
  staticDirs: ['../public'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    // Babel based, so it needs no TypeScript JS API and works with TypeScript 7.
    reactDocgen: 'react-docgen',
  },
  // The 1.1 MB iframe chunk is Storybook's own runtime. This limit is a ceiling, not a disable.
  viteFinal: (config) => mergeConfig(config, { build: { chunkSizeWarningLimit: 1500 } }),
};

export default config;
