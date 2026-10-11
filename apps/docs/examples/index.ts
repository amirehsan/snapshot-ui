import type { ComponentType } from 'react';
import BadgeCounts from './badge-counts';
import BadgeTones from './badge-tones';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import EyebrowHeading from './eyebrow-heading';
import HeadingSizes from './heading-sizes';
import KbdKeys from './kbd-keys';
import LinkInline from './link-inline';
import LinkStates from './link-states';
import SpinnerSizes from './spinner-sizes';
import TextTones from './text-tones';
import ThemeShapes from './theme-shapes';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'badge-counts': BadgeCounts,
  'badge-tones': BadgeTones,
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'eyebrow-heading': EyebrowHeading,
  'heading-sizes': HeadingSizes,
  'kbd-keys': KbdKeys,
  'link-inline': LinkInline,
  'link-states': LinkStates,
  'spinner-sizes': SpinnerSizes,
  'text-tones': TextTones,
  'theme-shapes': ThemeShapes,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
