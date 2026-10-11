import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';

const config: StorybookConfig = {
  stories: ['../../../packages/react/src/**/*.stories.@(ts|tsx)'],
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
