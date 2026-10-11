import type { ComponentType } from 'react';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import SpinnerSizes from './spinner-sizes';
import ThemeShapes from './theme-shapes';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'spinner-sizes': SpinnerSizes,
  'theme-shapes': ThemeShapes,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
