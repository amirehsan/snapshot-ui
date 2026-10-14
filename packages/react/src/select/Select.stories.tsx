import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Briefcase,
  Car,
  Coffee,
  Film,
  Gift,
  GraduationCap,
  HeartPulse,
  House,
  Landmark,
  Plane,
  Shirt,
  ShoppingCart,
  Undo2,
  Utensils,
  Wifi,
  Zap,
} from 'lucide-react';
import { useLayoutEffect, type ComponentType, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { PickerOption, PickerSection } from '../picker';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { tokenColor, washColor } from '../stories/paint';
import { Select, type SelectBaseProps } from './Select';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/**
 * Resolves once the open list's popover has been placed and has entered, and every transition on it has
 * finished, so a play reads its boxes at rest.
 */
async function atRest(): Promise<HTMLElement> {
  const popover = await waitFor(async () => {
    const found = only('.select-popover');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    popover.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return popover;
}

/** The option with this name, in the open list. */
const option = (name: string): HTMLElement => within(document.body).getByRole('option', { name });

/** Six of a household budget's categories: two with hints, three with this month's totals. */
const SIX = (
  <>
    <PickerOption
      id="groceries"
      icon={<ShoppingCart />}
      description="Supermarkets and markets"
      end="$1,204.50"
    >
      Groceries
    </PickerOption>
    <PickerOption id="rent" icon={<House />} end="$2,100.00">
      Rent
    </PickerOption>
    <PickerOption id="transport" icon={<Car />} description="Fuel, fares and parking" end="$318.20">
      Transport
    </PickerOption>
    <PickerOption id="utilities" icon={<Zap />}>
      Utilities
    </PickerOption>
    <PickerOption id="dining" icon={<Utensils />}>
      Dining out
    </PickerOption>
    <PickerOption id="health" icon={<HeartPulse />}>
      Health
    </PickerOption>
  </>
);

/** Fourteen categories in two sections, enough for the filter. */
const FOURTEEN = (
  <>
    <PickerSection title="Spending">
      <PickerOption id="groceries" icon={<ShoppingCart />} end="$1,204.50">
        Groceries
      </PickerOption>
      <PickerOption id="rent" icon={<House />} end="$2,100.00">
        Rent
      </PickerOption>
      <PickerOption id="transport" icon={<Car />}>
        Transport
      </PickerOption>
      <PickerOption id="utilities" icon={<Zap />}>
        Utilities
      </PickerOption>
      <PickerOption id="dining" icon={<Utensils />}>
        Dining out
      </PickerOption>
      <PickerOption id="cafe" icon={<Coffee />}>
        Café
      </PickerOption>
      <PickerOption id="health" icon={<HeartPulse />}>
        Health
      </PickerOption>
      <PickerOption id="travel" icon={<Plane />}>
        Travel
      </PickerOption>
      <PickerOption id="clothing" icon={<Shirt />}>
        Clothing
      </PickerOption>
      <PickerOption id="internet" icon={<Wifi />}>
        Internet
      </PickerOption>
      <PickerOption id="entertainment" icon={<Film />}>
        Entertainment
      </PickerOption>
      <PickerOption id="education" icon={<GraduationCap />}>
        Education
      </PickerOption>
    </PickerSection>
    <PickerSection title="Income">
      <PickerOption id="salary" icon={<Briefcase />} end="$6,400.00">
        Salary
      </PickerOption>
      <PickerOption id="refunds" icon={<Undo2 />}>
        Refunds
      </PickerOption>
    </PickerSection>
  </>
);

/**
 * Answers `(pointer: coarse)` with true, as a phone does, while it is mounted, and puts the browser's own
 * `matchMedia` back as it leaves. Every other query is the browser's.
 */
function CoarsePointerScope({ children }: { children: ReactNode }): ReactNode {
  useLayoutEffect(() => {
    const own = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    const browser = window.matchMedia.bind(window);
    window.matchMedia = (media: string): MediaQueryList =>
      media === '(pointer: coarse)'
        ? {
            matches: true,
            media,
            onchange: null,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
            addListener: () => undefined,
            removeListener: () => undefined,
            dispatchEvent: () => false,
          }
        : browser(media);
    return () => {
      // The browser's own, whether it sat on the window or on its prototype.
      if (own) Object.defineProperty(window, 'matchMedia', own);
      else Reflect.deleteProperty(window, 'matchMedia');
    };
  }, []);
  return children;
}

/**
 * Axe's settings for every Select story: the Menu's row rule, and the scrollable-region check skipped on the list
 * alone, still skipping what axe skips by default. With a filter the field keeps focus and owns the list through
 * aria-activedescendant, as a combobox owns its popup, so the list is no tab stop and the arrows scroll it, as
 * CommandPalette's does; without one the options take real focus. Contrast runs everywhere: the placeholder is
 * the trigger's text, in slate.
 */
const SELECT_A11Y = {
  config: {
    rules: [
      ...MENU_ROW_A11Y.config.rules,
      { id: 'scrollable-region-focusable', selector: '*:not(select, textarea, .select-list)' },
    ],
  },
};

const meta = {
  title: 'Components/Select',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: Select as ComponentType<SelectBaseProps>,
  args: { label: 'Category', children: SIX },
  parameters: {
    // The open stories open a list, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '520px' } },
    a11y: SELECT_A11Y,
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(24rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<SelectBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A label and nothing chosen: the placeholder and the chevron, both slate, at the ends of the field's pill. The
 * placeholder is the trigger's visible text, so it meets text contrast, unlike an input's taupe placeholder.
 */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvas, canvasElement }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose an option Category' });
    await expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    const value = find(canvasElement, '.select-value');
    await expect(value).toHaveAttribute('data-placeholder');
    await expect(getComputedStyle(value).color).toBe(tokenColor('--color-slate'));
    await expect(getComputedStyle(find(canvasElement, '.select-chevron')).color).toBe(
      tokenColor('--color-slate'),
    );
    await expect(trigger.getBoundingClientRect().height).toBe(
      parseFloat(getComputedStyle(trigger).getPropertyValue('--size-field')),
    );
  },
};

/** The chosen option's icon and label in ink, with no hint, end value or check. */
export const WithValue: Story = {
  args: { defaultValue: 'groceries' },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole('button', { name: 'Groceries Category' })).toBeInTheDocument();
    const value = find(canvasElement, '.select-value');
    await expect(getComputedStyle(value).color).toBe(tokenColor('--color-ink'));
    await expect(value.querySelector('.menu-item-icon svg')).not.toBeNull();
    await expect(value.querySelector('.menu-item-end, .menu-item-description, .menu-item-check')).toBeNull();
  },
};

/**
 * The open list: the Menu's float panel at least as wide as the trigger, the chosen row the ink pill with its
 * check, slate hints and ink totals, and the chevron turned up.
 */
export const Open: Story = {
  tags: ['density'],
  args: { defaultValue: 'groceries', defaultOpen: true },
  play: async ({ canvasElement }) => {
    const popover = await atRest();
    const trigger = find(canvasElement, '.select-trigger');
    await expect(popover.getBoundingClientRect().width).toBeGreaterThanOrEqual(
      trigger.getBoundingClientRect().width - 0.5,
    );
    await expect(option('Groceries')).toHaveAttribute('data-selected', 'true');
    await expect(find(option('Groceries'), '.menu-item-check')).toBeVisible();
    await expect(getComputedStyle(find(canvasElement, '.select-chevron')).rotate).toBe('180deg');
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/** Fourteen options in two sections show the filter, focused, over a hairline, with a slate placeholder. */
export const Filterable: Story = {
  args: { children: FOURTEEN, defaultOpen: true },
  play: async () => {
    await atRest();
    const filter = within(document.body).getByRole('searchbox', { name: 'Filter' });
    await waitFor(() => expect(filter).toHaveFocus());
    await expect(getComputedStyle(filter, '::placeholder').color).toBe(tokenColor('--color-slate'));
    // A field inside a popup is one step smaller: the control size, not the field size.
    await expect(filter.getBoundingClientRect().height).toBe(
      parseFloat(getComputedStyle(filter).getPropertyValue('--size-control')),
    );
    await expect(within(document.body).getAllByRole('option')).toHaveLength(14);
  },
};

/** The filter keeps nothing, and the list says so in slate. */
export const FilterNoMatches: Story = {
  args: { children: FOURTEEN, defaultOpen: true },
  play: async () => {
    await atRest();
    const filter = within(document.body).getByRole('searchbox', { name: 'Filter' });
    await waitFor(() => expect(filter).toHaveFocus());
    await userEvent.keyboard('zzz');
    const empty = await waitFor(() => only('.picker-empty'));
    await expect(empty).toHaveTextContent('No matches');
    await expect(getComputedStyle(empty).color).toBe(tokenColor('--color-slate'));
  },
};

/**
 * A changed Select with its chip and light orange edge, an invalid one with its error, a disabled one, whose value
 * is the disabled text, taupe.
 */
export const States: Story = {
  render: (): ReactElement => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Select label="Category" defaultValue="rent" isChanged>
        {SIX}
      </Select>
      <Select label="Budget category" isInvalid errorMessage="Choose a category">
        {SIX}
      </Select>
      <Select label="Archived category" defaultValue="transport" isDisabled>
        {SIX}
      </Select>
    </div>
  ),
  play: async ({ canvas }) => {
    const changed = canvas.getByRole('button', { name: 'Rent Category' });
    await expect(getComputedStyle(changed).borderTopColor).toBe(tokenColor('--color-signal-light'));
    const field = changed.closest('.select');
    if (!field) throw new Error('No field');
    await expect(find(field, '.field-changed')).toBeVisible();
    await expect(changed).toHaveAccessibleDescription('Changed');
    const invalid = canvas.getByRole('button', { name: 'Choose an option Budget category' });
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(canvas.getByText('Choose a category')).toBeVisible();
    const disabled = canvas.getByRole('button', { name: 'Transport Archived category' });
    await expect(disabled).toBeDisabled();
    await expect(getComputedStyle(find(disabled, '.select-chevron')).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(find(disabled, '.select-value')).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(disabled).cursor).toBe('not-allowed');
  },
};

/** Disabled with nothing chosen, the placeholder is the disabled text, taupe, and not the resting slate. */
export const DisabledPlaceholder: Story = {
  tags: ['no-visual'],
  args: { label: 'Closed category', isDisabled: true },
  play: async ({ canvas }) => {
    const trigger = canvas.getByRole('button', { name: 'Choose an option Closed category' });
    const value = find(trigger, '.select-value');
    await expect(value).toHaveAttribute('data-placeholder');
    await expect(getComputedStyle(value).color).toBe(tokenColor('--color-taupe'));
  },
};

/** Keyboard focus firms the edge to ink and draws the ring outside it. */
export const KeyboardFocus: Story = {
  args: { defaultValue: 'groceries' },
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const trigger = find(canvasElement, '.select-trigger');
    await expect(trigger).toHaveFocus();
    await expect(getComputedStyle(trigger).outlineStyle).toBe('solid');
    await expect(getComputedStyle(trigger).borderTopColor).toBe(tokenColor('--color-ink'));
  },
};

/**
 * In right to left the label and the value start at the right, the chevron sits at the left, unmirrored, and
 * the open list aligns to the trigger's right edge, its start.
 */
export const RightToLeft: Story = {
  render: (): ReactElement => (
    <I18nProvider locale="fa-IR">
      {/* Room at the left, the line's end, so the list keeps its 12px from the screen's edge and aligns to the
          trigger's right edge, its start. */}
      <div dir="rtl" lang="fa" style={{ paddingInlineEnd: '1.5rem' }}>
        <Select label="دسته" defaultValue="groceries" defaultOpen>
          <PickerOption id="groceries" icon={<ShoppingCart />} description="فروشگاه و بازار" end="۱٬۲۰۴ دلار">
            خرید روزانه
          </PickerOption>
          <PickerOption id="rent" icon={<House />} end="۲٬۱۰۰ دلار">
            اجاره
          </PickerOption>
          <PickerOption id="salary" icon={<Landmark />}>
            حقوق
          </PickerOption>
          <PickerOption id="gifts" icon={<Gift />}>
            هدیه
          </PickerOption>
        </Select>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const popover = await atRest();
    const trigger = find(canvasElement, '.select-trigger').getBoundingClientRect();
    const chevron = find(canvasElement, '.select-chevron').getBoundingClientRect();
    const value = find(canvasElement, '.select-value').getBoundingClientRect();
    await expect(chevron.right).toBeLessThanOrEqual(value.left + 0.5);
    await expect(Math.abs(popover.getBoundingClientRect().right - trigger.right)).toBeLessThan(1);
    await expect(getComputedStyle(find(canvasElement, '.select-chevron svg')).scale).toBe('none');
  },
};

/** The keys, closed and open. */
export const Keys: Story = {
  tags: ['no-visual'],
  args: { onChange: fn() },
  play: async ({ args, canvasElement }) => {
    const trigger = find(canvasElement, '.select-trigger');
    const value = find(canvasElement, '.select-value');
    await userEvent.tab();
    await expect(trigger).toHaveFocus();
    // Closed: a letter, then Right and Left, choose without opening.
    await userEvent.keyboard('u');
    await expect(value).toHaveTextContent('Utilities');
    await userEvent.keyboard('{ArrowRight}');
    await expect(value).toHaveTextContent('Dining out');
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await expect(value).toHaveTextContent('Transport');
    await expect(args.onChange).toHaveBeenLastCalledWith('transport');
    await expect(within(document.body).queryByRole('listbox')).toBeNull();
    // Open: the arrows stop at the ends, Home and End jump, a letter finds, Enter chooses and closes.
    await userEvent.keyboard('{ArrowDown}');
    await atRest();
    await waitFor(() => expect(option('Transport')).toHaveFocus());
    await userEvent.keyboard('{End}');
    await expect(option('Health')).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    await expect(option('Health')).toHaveFocus();
    await userEvent.keyboard('{Home}');
    await expect(option('Groceries')).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}');
    await expect(option('Groceries')).toHaveFocus();
    await userEvent.keyboard('r');
    await expect(option('Rent')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
    await expect(value).toHaveTextContent('Rent');
    // React Aria holds focus in the open list's popover, so Tab stays in the list, as in the Menu; Escape closes
    // it and gives focus back to the trigger.
    await userEvent.keyboard(' ');
    await atRest();
    await waitFor(() => expect(option('Rent')).toHaveFocus());
    await userEvent.tab();
    await expect(within(document.body).getByRole('listbox').contains(document.activeElement)).toBe(true);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    await waitFor(() => expect(trigger).toHaveFocus());
  },
};

/**
 * On a coarse pointer the filter does not take focus as the list opens, so a phone's keyboard does not cover the
 * list; focus is in the list, and the filter is one tap away. The decorator answers `(pointer: coarse)` with
 * true and puts the browser's own answer back when the story leaves.
 */
export const CoarsePointer: Story = {
  tags: ['no-visual'],
  args: { children: FOURTEEN },
  decorators: [
    (Story) => (
      <CoarsePointerScope>
        <Story />
      </CoarsePointerScope>
    ),
  ],
  play: async ({ canvasElement }) => {
    find(canvasElement, '.select-trigger').click();
    const popover = await atRest();
    const filter = within(document.body).getByRole('searchbox', { name: 'Filter' });
    await waitFor(() => expect(popover.contains(document.activeElement)).toBe(true));
    await expect(filter).not.toHaveFocus();
    await expect(within(document.body).getByRole('listbox').contains(document.activeElement)).toBe(true);
    // The arrows move through the options, which take real focus here, and Enter chooses one.
    await userEvent.keyboard('{ArrowDown}');
    const active = await waitFor(() => {
      const focused = document.activeElement;
      if (!(focused instanceof HTMLElement) || focused.getAttribute('role') !== 'option')
        throw new Error('No option has focus');
      return focused;
    });
    const name = find(active, '.menu-item-label').textContent;
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
    await expect(find(canvasElement, '.select-value')).toHaveTextContent(name);
  },
};

/** A plain form submits the chosen key under the Select's name, through React Aria's hidden select. */
export const FormSubmit: Story = {
  tags: ['no-visual'],
  render: (): ReactElement => (
    <form
      aria-label="Budget"
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Select label="Category" name="category" defaultValue="rent">
        {SIX}
      </Select>
    </form>
  ),
  play: async ({ canvas, canvasElement }) => {
    const form = find(canvasElement, 'form') as HTMLFormElement;
    await expect(new FormData(form).get('category')).toBe('rent');
    await userEvent.click(canvas.getByRole('button', { name: 'Rent Category' }));
    await atRest();
    await userEvent.click(option('Utilities'));
    await waitFor(() => expect(new FormData(form).get('category')).toBe('utilities'));
  },
};

/** Under the pointer a row takes the Menu's 5% wash and no ring. */
export const PointerWash: Story = {
  tags: ['no-visual'],
  play: async ({ canvasElement }) => {
    await userEvent.click(find(canvasElement, '.select-trigger'));
    await atRest();
    const rent = option('Rent');
    await userEvent.hover(rent);
    await waitFor(() => expect(rent).toHaveAttribute('data-hovered', 'true'));
    await expect(getComputedStyle(rent).backgroundColor).toBe(washColor());
    await expect(getComputedStyle(rent).outlineStyle).toBe('none');
    await userEvent.unhover(rent);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(document.body).queryByRole('listbox')).toBeNull());
  },
};
