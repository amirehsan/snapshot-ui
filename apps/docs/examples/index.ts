import type { ComponentType } from 'react';
import AppShellBasic from './app-shell-basic';
import AppShellCollapsed from './app-shell-collapsed';
import AppShellPhone from './app-shell-phone';
import AvatarBesideName from './avatar-beside-name';
import AvatarFallback from './avatar-fallback';
import AvatarSizes from './avatar-sizes';
import BadgeCounts from './badge-counts';
import BadgeTones from './badge-tones';
import BottomTabBarBasic from './bottom-tab-bar-basic';
import BottomTabBarMore from './bottom-tab-bar-more';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import CalendarBasic from './calendar-basic';
import CalendarPersian from './calendar-persian';
import CalendarRange from './calendar-range';
import CalendarUnavailable from './calendar-unavailable';
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
import ComboBoxAsync from './combo-box-async';
import ComboBoxBasic from './combo-box-basic';
import ComboBoxStates from './combo-box-states';
import CommandPaletteAsync from './command-palette-async';
import CommandPaletteBasic from './command-palette-basic';
import ConfirmDialogBasic from './confirm-dialog-basic';
import ConfirmDialogDanger from './confirm-dialog-danger';
import ConfirmDialogHook from './confirm-dialog-hook';
import DensityControls from './density-controls';
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
import LineChartBasic from './line-chart-basic';
import LineChartCompare from './line-chart-compare';
import LineChartGaps from './line-chart-gaps';
import LineChartRtl from './line-chart-rtl';
import LinkInline from './link-inline';
import LinkStates from './link-states';
import MenuBasic from './menu-basic';
import MenuLinks from './menu-links';
import MenuSelection from './menu-selection';
import MeterBasic from './meter-basic';
import MeterOver from './meter-over';
import MeterPace from './meter-pace';
import MultiSelectBasic from './multi-select-basic';
import MultiSelectMany from './multi-select-many';
import MultiSelectStates from './multi-select-states';
import NumberFieldBasic from './number-field-basic';
import NumberFieldMoney from './number-field-money';
import NumberFieldNegative from './number-field-negative';
import NumberFieldPersian from './number-field-persian';
import NumberFieldStates from './number-field-states';
import NumberFieldUrl from './number-field-url';
import PaginationButtons from './pagination-buttons';
import PaginationCursor from './pagination-cursor';
import PaginationLinks from './pagination-links';
import PaginationNarrow from './pagination-narrow';
import PaginationPersian from './pagination-persian';
import PaginationSiblings from './pagination-siblings';
import PopoverBasic from './popover-basic';
import PopoverMatchWidth from './popover-match-width';
import RadioGroupBasic from './radio-group-basic';
import RadioGroupHorizontal from './radio-group-horizontal';
import RadioGroupStates from './radio-group-states';
import RadioGroupValidation from './radio-group-validation';
import SearchFieldBasic from './search-field-basic';
import SearchFieldStates from './search-field-states';
import SearchFieldToolbar from './search-field-toolbar';
import SegmentedControlBasic from './segmented-control-basic';
import SegmentedControlStacking from './segmented-control-stacking';
import SegmentedControlStates from './segmented-control-states';
import SelectBasic from './select-basic';
import SelectDetails from './select-details';
import SelectFilter from './select-filter';
import SelectStates from './select-states';
import SheetBasic from './sheet-basic';
import SheetMore from './sheet-more';
import SheetSnapPoints from './sheet-snap-points';
import SidebarCollapsed from './sidebar-collapsed';
import SidebarDrawer from './sidebar-drawer';
import SidebarGroups from './sidebar-groups';
import SidebarLongLabels from './sidebar-long-labels';
import SparklineTile from './sparkline-tile';
import SparklineVariants from './sparkline-variants';
import SpinnerSizes from './spinner-sizes';
import StatTileBasic from './stat-tile-basic';
import StatTileLink from './stat-tile-link';
import StatTileTones from './stat-tile-tones';
import StatTileTrend from './stat-tile-trend';
import SwitchBasic from './switch-basic';
import SwitchSettings from './switch-settings';
import SwitchStates from './switch-states';
import TabsBasic from './tabs-basic';
import TabsChanged from './tabs-changed';
import TabsLinks from './tabs-links';
import TabsOverflow from './tabs-overflow';
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
import TooltipBasic from './tooltip-basic';
import TooltipShortcut from './tooltip-shortcut';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'app-shell-basic': AppShellBasic,
  'app-shell-collapsed': AppShellCollapsed,
  'app-shell-phone': AppShellPhone,
  'avatar-beside-name': AvatarBesideName,
  'avatar-fallback': AvatarFallback,
  'avatar-sizes': AvatarSizes,
  'badge-counts': BadgeCounts,
  'badge-tones': BadgeTones,
  'bottom-tab-bar-basic': BottomTabBarBasic,
  'bottom-tab-bar-more': BottomTabBarMore,
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'calendar-basic': CalendarBasic,
  'calendar-persian': CalendarPersian,
  'calendar-range': CalendarRange,
  'calendar-unavailable': CalendarUnavailable,
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
  'combo-box-async': ComboBoxAsync,
  'combo-box-basic': ComboBoxBasic,
  'combo-box-states': ComboBoxStates,
  'command-palette-async': CommandPaletteAsync,
  'command-palette-basic': CommandPaletteBasic,
  'confirm-dialog-basic': ConfirmDialogBasic,
  'confirm-dialog-danger': ConfirmDialogDanger,
  'confirm-dialog-hook': ConfirmDialogHook,
  'density-controls': DensityControls,
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
  'line-chart-basic': LineChartBasic,
  'line-chart-compare': LineChartCompare,
  'line-chart-gaps': LineChartGaps,
  'line-chart-rtl': LineChartRtl,
  'link-inline': LinkInline,
  'link-states': LinkStates,
  'menu-basic': MenuBasic,
  'menu-links': MenuLinks,
  'menu-selection': MenuSelection,
  'meter-basic': MeterBasic,
  'meter-over': MeterOver,
  'meter-pace': MeterPace,
  'multi-select-basic': MultiSelectBasic,
  'multi-select-many': MultiSelectMany,
  'multi-select-states': MultiSelectStates,
  'number-field-basic': NumberFieldBasic,
  'number-field-money': NumberFieldMoney,
  'number-field-negative': NumberFieldNegative,
  'number-field-persian': NumberFieldPersian,
  'number-field-states': NumberFieldStates,
  'number-field-url': NumberFieldUrl,
  'pagination-buttons': PaginationButtons,
  'pagination-cursor': PaginationCursor,
  'pagination-links': PaginationLinks,
  'pagination-narrow': PaginationNarrow,
  'pagination-persian': PaginationPersian,
  'pagination-siblings': PaginationSiblings,
  'popover-basic': PopoverBasic,
  'popover-match-width': PopoverMatchWidth,
  'radio-group-basic': RadioGroupBasic,
  'radio-group-horizontal': RadioGroupHorizontal,
  'radio-group-states': RadioGroupStates,
  'radio-group-validation': RadioGroupValidation,
  'search-field-basic': SearchFieldBasic,
  'search-field-states': SearchFieldStates,
  'search-field-toolbar': SearchFieldToolbar,
  'segmented-control-basic': SegmentedControlBasic,
  'segmented-control-stacking': SegmentedControlStacking,
  'segmented-control-states': SegmentedControlStates,
  'select-basic': SelectBasic,
  'select-details': SelectDetails,
  'select-filter': SelectFilter,
  'select-states': SelectStates,
  'sheet-basic': SheetBasic,
  'sheet-more': SheetMore,
  'sheet-snap-points': SheetSnapPoints,
  'sidebar-collapsed': SidebarCollapsed,
  'sidebar-drawer': SidebarDrawer,
  'sidebar-groups': SidebarGroups,
  'sidebar-long-labels': SidebarLongLabels,
  'sparkline-tile': SparklineTile,
  'sparkline-variants': SparklineVariants,
  'spinner-sizes': SpinnerSizes,
  'stat-tile-basic': StatTileBasic,
  'stat-tile-link': StatTileLink,
  'stat-tile-tones': StatTileTones,
  'stat-tile-trend': StatTileTrend,
  'switch-basic': SwitchBasic,
  'switch-settings': SwitchSettings,
  'switch-states': SwitchStates,
  'tabs-basic': TabsBasic,
  'tabs-changed': TabsChanged,
  'tabs-links': TabsLinks,
  'tabs-overflow': TabsOverflow,
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
  'tooltip-basic': TooltipBasic,
  'tooltip-shortcut': TooltipShortcut,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
