import type { ComponentType } from 'react';
import BadgeCounts from './badge-counts';
import BadgeTones from './badge-tones';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import CardNested from './card-nested';
import CardParts from './card-parts';
import CheckboxBasic from './checkbox-basic';
import CheckboxGroupExample from './checkbox-group';
import CheckboxSelectAll from './checkbox-select-all';
import CheckboxStates from './checkbox-states';
import CheckboxValidation from './checkbox-validation';
import CollapsibleCardActions from './collapsible-card-actions';
import CollapsibleCardBasic from './collapsible-card-basic';
import CollapsibleCardChanged from './collapsible-card-changed';
import CollapsibleCardRemembered from './collapsible-card-remembered';
import CommandPaletteAsync from './command-palette-async';
import CommandPaletteBasic from './command-palette-basic';
import ConfirmDialogBasic from './confirm-dialog-basic';
import ConfirmDialogDanger from './confirm-dialog-danger';
import ConfirmDialogHook from './confirm-dialog-hook';
import DialogBasic from './dialog-basic';
import DialogDanger from './dialog-danger';
import DialogLong from './dialog-long';
import DrawerEnd from './drawer-end';
import DrawerNavigation from './drawer-navigation';
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
import MenuBasic from './menu-basic';
import MenuLinks from './menu-links';
import MenuSelection from './menu-selection';
import PopoverBasic from './popover-basic';
import PopoverMatchWidth from './popover-match-width';
import RadioGroupBasic from './radio-group-basic';
import RadioGroupHorizontal from './radio-group-horizontal';
import RadioGroupStates from './radio-group-states';
import RadioGroupValidation from './radio-group-validation';
import SegmentedControlBasic from './segmented-control-basic';
import SegmentedControlStacking from './segmented-control-stacking';
import SegmentedControlStates from './segmented-control-states';
import SheetBasic from './sheet-basic';
import SheetMore from './sheet-more';
import SheetSnapPoints from './sheet-snap-points';
import SpinnerSizes from './spinner-sizes';
import SwitchBasic from './switch-basic';
import SwitchSettings from './switch-settings';
import SwitchStates from './switch-states';
import TextAreaBasic from './text-area-basic';
import TextAreaCounter from './text-area-counter';
import TextAreaStates from './text-area-states';
import TextFieldBasic from './text-field-basic';
import TextFieldStates from './text-field-states';
import TextFieldValidation from './text-field-validation';
import TextNumerals from './text-numerals';
import TextTones from './text-tones';
import ThemeShapes from './theme-shapes';
import ToastAction from './toast-action';
import ToastBasic from './toast-basic';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'badge-counts': BadgeCounts,
  'badge-tones': BadgeTones,
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'card-nested': CardNested,
  'card-parts': CardParts,
  'checkbox-basic': CheckboxBasic,
  'checkbox-group': CheckboxGroupExample,
  'checkbox-select-all': CheckboxSelectAll,
  'checkbox-states': CheckboxStates,
  'checkbox-validation': CheckboxValidation,
  'collapsible-card-actions': CollapsibleCardActions,
  'collapsible-card-basic': CollapsibleCardBasic,
  'collapsible-card-changed': CollapsibleCardChanged,
  'collapsible-card-remembered': CollapsibleCardRemembered,
  'command-palette-async': CommandPaletteAsync,
  'command-palette-basic': CommandPaletteBasic,
  'confirm-dialog-basic': ConfirmDialogBasic,
  'confirm-dialog-danger': ConfirmDialogDanger,
  'confirm-dialog-hook': ConfirmDialogHook,
  'dialog-basic': DialogBasic,
  'dialog-danger': DialogDanger,
  'dialog-long': DialogLong,
  'drawer-end': DrawerEnd,
  'drawer-navigation': DrawerNavigation,
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
  'menu-basic': MenuBasic,
  'menu-links': MenuLinks,
  'menu-selection': MenuSelection,
  'popover-basic': PopoverBasic,
  'popover-match-width': PopoverMatchWidth,
  'radio-group-basic': RadioGroupBasic,
  'radio-group-horizontal': RadioGroupHorizontal,
  'radio-group-states': RadioGroupStates,
  'radio-group-validation': RadioGroupValidation,
  'segmented-control-basic': SegmentedControlBasic,
  'segmented-control-stacking': SegmentedControlStacking,
  'segmented-control-states': SegmentedControlStates,
  'sheet-basic': SheetBasic,
  'sheet-more': SheetMore,
  'sheet-snap-points': SheetSnapPoints,
  'spinner-sizes': SpinnerSizes,
  'switch-basic': SwitchBasic,
  'switch-settings': SwitchSettings,
  'switch-states': SwitchStates,
  'text-area-basic': TextAreaBasic,
  'text-area-counter': TextAreaCounter,
  'text-area-states': TextAreaStates,
  'text-field-basic': TextFieldBasic,
  'text-field-states': TextFieldStates,
  'text-field-validation': TextFieldValidation,
  'text-numerals': TextNumerals,
  'text-tones': TextTones,
  'theme-shapes': ThemeShapes,
  'toast-action': ToastAction,
  'toast-basic': ToastBasic,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
