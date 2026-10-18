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
import BreadcrumbsBasic from './breadcrumbs-basic';
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
import DataTableBasic from './data-table-basic';
import DataTableBulkActions from './data-table-bulk-actions';
import DataTableColumnOptions from './data-table-column-options';
import DataTableColumns from './data-table-columns';
import DataTableFigures from './data-table-figures';
import DataTableFiltered from './data-table-filtered';
import DataTablePhone from './data-table-phone';
import DataTableSelection from './data-table-selection';
import DataTableStates from './data-table-states';
import DataTableTransactions from './data-table-transactions';
import DatePickerBasic from './date-picker-basic';
import DatePickerPresets from './date-picker-presets';
import DatePickerReviewGrid from './date-picker-review-grid';
import DateRangePickerBasic from './date-range-picker-basic';
import DateRangePickerPresets from './date-range-picker-presets';
import DateRangePickerStates from './date-range-picker-states';
import DateRangePickerUrl from './date-range-picker-url';
import DescriptionListActions from './description-list-actions';
import DescriptionListBasic from './description-list-basic';
import DescriptionListCard from './description-list-card';
import DescriptionListValues from './description-list-values';
import DensityControls from './density-controls';
import DialogBasic from './dialog-basic';
import DialogDanger from './dialog-danger';
import DialogLong from './dialog-long';
import DocumentsRecipe from './documents-recipe';
import DrawerEnd from './drawer-end';
import DrawerNavigation from './drawer-navigation';
import EmptyStateBasic from './empty-state-basic';
import EmptyStateInCard from './empty-state-in-card';
import EyebrowHeading from './eyebrow-heading';
import FieldChangedUnlabelled from './field-changed-unlabelled';
import LengthCounter from './field-counter';
import FieldParts from './field-parts';
import FieldStates from './field-states';
import FileButtonBasic from './file-button-basic';
import FileDropZoneErrors from './file-drop-zone-errors';
import FileDropZonePage from './file-drop-zone-page';
import FileDropZoneReceipt from './file-drop-zone-receipt';
import FilterBarBasic from './filter-bar-basic';
import FilterBarUrl from './filter-bar-url';
import FilterBarWrapped from './filter-bar-wrapped';
import FilterChipCustom from './filter-chip-custom';
import FilterChipMultiple from './filter-chip-multiple';
import FilterChipSingle from './filter-chip-single';
import FilterChipStates from './filter-chip-states';
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
import PageHeaderBasic from './page-header-basic';
import PageHeaderDocuments from './page-header-documents';
import PaginationButtons from './pagination-buttons';
import PaginationCursor from './pagination-cursor';
import PaginationInARow from './pagination-in-a-row';
import PaginationLinks from './pagination-links';
import PaginationNarrow from './pagination-narrow';
import PaginationPageSize from './pagination-page-size';
import PaginationPersian from './pagination-persian';
import PaginationSiblings from './pagination-siblings';
import PopoverBasic from './popover-basic';
import PopoverMatchWidth from './popover-match-width';
import ProgressBarBasic from './progress-bar-basic';
import ProgressBarIndeterminate from './progress-bar-indeterminate';
import RadioGroupBasic from './radio-group-basic';
import RadioGroupHorizontal from './radio-group-horizontal';
import RadioGroupStates from './radio-group-states';
import RadioGroupValidation from './radio-group-validation';
import SaveBarForm from './save-bar-form';
import SaveBarInSidePanel from './save-bar-in-side-panel';
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
import SidePanelBasic from './side-panel-basic';
import SidePanelFooter from './side-panel-footer';
import SidebarCollapsed from './sidebar-collapsed';
import SidebarDrawer from './sidebar-drawer';
import SidebarGroups from './sidebar-groups';
import SidebarLongLabels from './sidebar-long-labels';
import SkeletonCard from './skeleton-card';
import SkeletonShapes from './skeleton-shapes';
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
import UploadListStatuses from './upload-list-statuses';

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
  'breadcrumbs-basic': BreadcrumbsBasic,
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
  'data-table-basic': DataTableBasic,
  'data-table-bulk-actions': DataTableBulkActions,
  'data-table-column-options': DataTableColumnOptions,
  'data-table-columns': DataTableColumns,
  'data-table-figures': DataTableFigures,
  'data-table-filtered': DataTableFiltered,
  'data-table-phone': DataTablePhone,
  'data-table-selection': DataTableSelection,
  'data-table-states': DataTableStates,
  'data-table-transactions': DataTableTransactions,
  'date-picker-basic': DatePickerBasic,
  'date-picker-presets': DatePickerPresets,
  'date-picker-review-grid': DatePickerReviewGrid,
  'date-range-picker-basic': DateRangePickerBasic,
  'date-range-picker-presets': DateRangePickerPresets,
  'date-range-picker-states': DateRangePickerStates,
  'date-range-picker-url': DateRangePickerUrl,
  'description-list-actions': DescriptionListActions,
  'description-list-basic': DescriptionListBasic,
  'description-list-card': DescriptionListCard,
  'description-list-values': DescriptionListValues,
  'density-controls': DensityControls,
  'dialog-basic': DialogBasic,
  'dialog-danger': DialogDanger,
  'dialog-long': DialogLong,
  'documents-recipe': DocumentsRecipe,
  'drawer-end': DrawerEnd,
  'drawer-navigation': DrawerNavigation,
  'empty-state-basic': EmptyStateBasic,
  'empty-state-in-card': EmptyStateInCard,
  'eyebrow-heading': EyebrowHeading,
  'field-changed-unlabelled': FieldChangedUnlabelled,
  'field-counter': LengthCounter,
  'field-parts': FieldParts,
  'field-states': FieldStates,
  'file-button-basic': FileButtonBasic,
  'file-drop-zone-errors': FileDropZoneErrors,
  'file-drop-zone-page': FileDropZonePage,
  'file-drop-zone-receipt': FileDropZoneReceipt,
  'filter-bar-basic': FilterBarBasic,
  'filter-bar-url': FilterBarUrl,
  'filter-bar-wrapped': FilterBarWrapped,
  'filter-chip-custom': FilterChipCustom,
  'filter-chip-multiple': FilterChipMultiple,
  'filter-chip-single': FilterChipSingle,
  'filter-chip-states': FilterChipStates,
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
  'page-header-basic': PageHeaderBasic,
  'page-header-documents': PageHeaderDocuments,
  'pagination-buttons': PaginationButtons,
  'pagination-cursor': PaginationCursor,
  'pagination-in-a-row': PaginationInARow,
  'pagination-links': PaginationLinks,
  'pagination-narrow': PaginationNarrow,
  'pagination-page-size': PaginationPageSize,
  'pagination-persian': PaginationPersian,
  'pagination-siblings': PaginationSiblings,
  'popover-basic': PopoverBasic,
  'popover-match-width': PopoverMatchWidth,
  'progress-bar-basic': ProgressBarBasic,
  'progress-bar-indeterminate': ProgressBarIndeterminate,
  'radio-group-basic': RadioGroupBasic,
  'radio-group-horizontal': RadioGroupHorizontal,
  'radio-group-states': RadioGroupStates,
  'radio-group-validation': RadioGroupValidation,
  'save-bar-form': SaveBarForm,
  'save-bar-in-side-panel': SaveBarInSidePanel,
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
  'side-panel-basic': SidePanelBasic,
  'side-panel-footer': SidePanelFooter,
  'sidebar-collapsed': SidebarCollapsed,
  'sidebar-drawer': SidebarDrawer,
  'sidebar-groups': SidebarGroups,
  'sidebar-long-labels': SidebarLongLabels,
  'skeleton-card': SkeletonCard,
  'skeleton-shapes': SkeletonShapes,
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
  'upload-list-statuses': UploadListStatuses,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
