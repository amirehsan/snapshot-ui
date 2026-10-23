'use client';

import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useId, type ReactElement, type ReactNode } from 'react';
import { composeRenderProps, type Selection } from 'react-aria-components';
import { Menu, MenuItem, MenuSection, SubmenuTrigger } from '../menu';
import { Radio, RadioGroup, type RadioGroupProps } from '../radio-group';
import {
  SegmentedControl,
  SegmentedControlItem,
  type SegmentedControlBaseProps,
  type SegmentedControlProps,
} from '../segmented-control';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

/**
 * The reader's theme. `system` is no choice of their own: the page follows the system's setting, which core's
 * tokens do with no `data-theme` on `<html>`. `light` and `dark` are `data-theme` on `<html>`.
 */
export type ThemeChoice = 'system' | 'light' | 'dark';

export interface ThemeLabels {
  /** The control's or the submenu's name. @default 'Theme' */
  label: string;
  /** @default 'System' */
  system: string;
  /** @default 'Light' */
  light: string;
  /** @default 'Dark' */
  dark: string;
}

export interface ThemeSwitchProps extends Omit<
  SegmentedControlBaseProps,
  'value' | 'defaultValue' | 'onChange' | 'children' | 'isChanged'
> {
  /** The choice, from the app's cookie; `null` shows none, for a value the browser learns after hydration. */
  value: ThemeChoice | null;
  /** Called with the reader's choice. Apply it at once and keep it: the part writes nothing itself. */
  onChange: (choice: ThemeChoice) => void;
  /** `segmented` is a SegmentedControl; `radio` a RadioGroup of rows. @default 'segmented' */
  look?: 'segmented' | 'radio';
  /** Icons before each choice (Monitor, Sun, Moon), hidden from assistive technology. @default true */
  hasIcons?: boolean;
  /** The words: the control's name and the three choices. */
  labels?: Partial<ThemeLabels>;
}

export interface ThemeMenuProps {
  /** The choice, from the app's cookie; `null` checks none. */
  value: ThemeChoice | null;
  /** Called with the reader's choice, after which every level of the menu closes. */
  onChange: (choice: ThemeChoice) => void;
  /** `submenu` is a Theme item opening the three; `section` puts them in the menu under a Theme heading. @default 'submenu' */
  display?: 'submenu' | 'section';
  /** The words: the item's or the heading's name and the three choices. */
  labels?: Partial<ThemeLabels>;
}

const DEFAULT_LABELS: ThemeLabels = { label: 'Theme', system: 'System', light: 'Light', dark: 'Dark' };

/** The three, the default first, as the reader meets them. */
const CHOICES = ['system', 'light', 'dark'] as const;

const ICONS: Record<ThemeChoice, LucideIcon> = { system: Monitor, light: Sun, dark: Moon };

const isChoice = (value: unknown): value is ThemeChoice =>
  value === 'system' || value === 'light' || value === 'dark';

/** The one choice a single selection holds, or none. */
const chosen = (keys: Selection): ThemeChoice | undefined => {
  if (keys === 'all') return undefined;
  const [key] = keys;
  return isChoice(key) ? key : undefined;
};

/** A choice's icon, hidden, with the class its look sizes it by, and its word. */
function Choice({
  choice,
  words,
  icon,
}: {
  choice: ThemeChoice;
  words: ThemeLabels;
  icon: 'segmented-icon' | 'radio-icon' | null;
}): ReactNode {
  const Icon = ICONS[choice];
  return (
    <>
      {icon === null ? null : <Icon aria-hidden="true" className={icon} />}
      {words[choice]}
    </>
  );
}

/**
 * The reader's theme as a Settings row: System, Light and Dark, a segmented control by default and a radio group
 * of rows with `look="radio"`, named "Theme" unless the app names it. Controlled only: it draws `value`, `null`
 * drawing no choice, and calls `onChange`; it reads nothing from the page, writes nothing, and never shows a
 * Changed chip, since a theme applies at once and is never part of a form's save. The arrows choose, as in any
 * radio group.
 */
export function ThemeSwitch({
  value,
  onChange,
  look = 'segmented',
  hasIcons = true,
  labels,
  size,
  className,
  ...props
}: ThemeSwitchProps): ReactElement {
  const words = { ...DEFAULT_LABELS, ...labels };
  const isNamed =
    present(props.label) || props['aria-label'] !== undefined || props['aria-labelledby'] !== undefined;
  // Named by the app's label or name, else by labels.label, so each look's own name rule holds.
  const shared = {
    ...props,
    'aria-label': isNamed ? props['aria-label'] : words.label,
    value,
    onChange: (next: string) => {
      if (isChoice(next)) onChange(next);
    },
    className: composeRenderProps(className, (userClassName) => cx('theme-switch', userClassName)),
  };
  if (look === 'radio') {
    return (
      <RadioGroup {...(shared as RadioGroupProps)}>
        {CHOICES.map((choice) => (
          <Radio key={choice} value={choice}>
            <Choice choice={choice} words={words} icon={hasIcons ? 'radio-icon' : null} />
          </Radio>
        ))}
      </RadioGroup>
    );
  }
  return (
    <SegmentedControl {...(shared as SegmentedControlProps)} size={size}>
      {CHOICES.map((choice) => (
        <SegmentedControlItem key={choice} value={choice}>
          <Choice choice={choice} words={words} icon={hasIcons ? 'segmented-icon' : null} />
        </SegmentedControlItem>
      ))}
    </SegmentedControl>
  );
}

/**
 * The reader's theme inside a Menu, among its items: a Theme item showing the current choice and opening a
 * submenu of System, Light and Dark, or with `display="section"` the three under a Theme heading in the menu
 * itself. The chosen one is checked. Controlled only, as ThemeSwitch is: a choice calls `onChange` and closes
 * every level of the menu, and focus goes back to the menu's trigger.
 */
export function ThemeMenu({ value, onChange, display = 'submenu', labels }: ThemeMenuProps): ReactElement {
  const words = { ...DEFAULT_LABELS, ...labels };
  const submenuId = useId();
  const selection = {
    selectionMode: 'single',
    selectedKeys: value === null ? [] : [value],
    // A second press on the chosen item keeps it, rather than leaving no choice.
    disallowEmptySelection: true,
    onSelectionChange: (keys: Selection) => {
      const choice = chosen(keys);
      if (choice !== undefined) onChange(choice);
    },
  } as const;
  const items = CHOICES.map((choice) => {
    const Icon = ICONS[choice];
    return (
      <MenuItem key={choice} id={choice} icon={<Icon />} textValue={words[choice]}>
        {words[choice]}
      </MenuItem>
    );
  });
  if (display === 'section') {
    return (
      <MenuSection title={words.label} {...selection}>
        {items}
      </MenuSection>
    );
  }
  return (
    <SubmenuTrigger>
      <MenuItem textValue={words.label} end={value === null ? undefined : words[value]}>
        {words.label}
      </MenuItem>
      {/* React Aria names a submenu by its row, whose words hold the end value too ("Theme System"); pointing its
          labelledby at itself names it by its own aria-label, "Theme". */}
      <Menu {...selection} id={submenuId} aria-label={words.label} aria-labelledby={submenuId}>
        {items}
      </Menu>
    </SubmenuTrigger>
  );
}
