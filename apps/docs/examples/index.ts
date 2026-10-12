import type { ComponentType } from 'react';
import BadgeCounts from './badge-counts';
import BadgeTones from './badge-tones';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import CheckboxBasic from './checkbox-basic';
import CheckboxGroupExample from './checkbox-group';
import CheckboxSelectAll from './checkbox-select-all';
import CheckboxStates from './checkbox-states';
import CheckboxValidation from './checkbox-validation';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
import FieldParts from './field-parts';
import FieldStates from './field-states';
import HeadingSizes from './heading-sizes';
import IconButtonLink from './icon-button-link';
import IconButtonStates from './icon-button-states';
import IconButtonVariants from './icon-button-variants';
import KbdKeys from './kbd-keys';
import LinkInline from './link-inline';
import LinkStates from './link-states';
import RadioGroupBasic from './radio-group-basic';
import RadioGroupHorizontal from './radio-group-horizontal';
import RadioGroupStates from './radio-group-states';
import RadioGroupValidation from './radio-group-validation';
import SpinnerSizes from './spinner-sizes';
import TextAreaBasic from './text-area-basic';
import TextAreaCounter from './text-area-counter';
import TextAreaStates from './text-area-states';
import TextFieldBasic from './text-field-basic';
import TextFieldStates from './text-field-states';
import TextFieldValidation from './text-field-validation';
import TextTones from './text-tones';
import ThemeShapes from './theme-shapes';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'badge-counts': BadgeCounts,
  'badge-tones': BadgeTones,
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'checkbox-basic': CheckboxBasic,
  'checkbox-group': CheckboxGroupExample,
  'checkbox-select-all': CheckboxSelectAll,
  'checkbox-states': CheckboxStates,
  'checkbox-validation': CheckboxValidation,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
  'field-parts': FieldParts,
  'field-states': FieldStates,
  'heading-sizes': HeadingSizes,
  'icon-button-link': IconButtonLink,
  'icon-button-states': IconButtonStates,
  'icon-button-variants': IconButtonVariants,
  'kbd-keys': KbdKeys,
  'link-inline': LinkInline,
  'link-states': LinkStates,
  'radio-group-basic': RadioGroupBasic,
  'radio-group-horizontal': RadioGroupHorizontal,
  'radio-group-states': RadioGroupStates,
  'radio-group-validation': RadioGroupValidation,
  'spinner-sizes': SpinnerSizes,
  'text-area-basic': TextAreaBasic,
  'text-area-counter': TextAreaCounter,
  'text-area-states': TextAreaStates,
  'text-field-basic': TextFieldBasic,
  'text-field-states': TextFieldStates,
  'text-field-validation': TextFieldValidation,
  'text-tones': TextTones,
  'theme-shapes': ThemeShapes,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
