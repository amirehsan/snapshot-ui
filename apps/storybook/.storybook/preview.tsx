import type { Decorator, Preview } from '@storybook/react-vite';
import '@fontsource-variable/sofia-sans';
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';

/** Applies the toolbar globals to <html>, so tokens, the page background and portals all follow. */
const withTokens: Decorator = (Story, { globals }) => {
  const root = document.documentElement;
  root.dataset.theme = String(globals.theme ?? 'light');
  root.dataset.shape = String(globals.shape ?? 'rounded');
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    shape: {
      description: 'Corner shape',
      toolbar: {
        title: 'Shape',
        icon: 'component',
        items: [
          { value: 'rounded', title: 'Rounded' },
          { value: 'soft', title: 'Soft' },
          { value: 'square', title: 'Square' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    shape: 'rounded',
  },
  decorators: [withTokens],
  parameters: {
    layout: 'centered',
    // Story tests fail on any axe violation, including color contrast, which
    // a real browser can measure.
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};

export default preview;
