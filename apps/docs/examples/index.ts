import type { ComponentType } from 'react';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import EyebrowHeading from './eyebrow-heading';
import HeadingSizes from './heading-sizes';
import SpinnerSizes from './spinner-sizes';
import TextTones from './text-tones';
import ThemeShapes from './theme-shapes';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'eyebrow-heading': EyebrowHeading,
  'heading-sizes': HeadingSizes,
  'spinner-sizes': SpinnerSizes,
  'text-tones': TextTones,
  'theme-shapes': ThemeShapes,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
