import type { Meta, StoryObj } from '@storybook/react-vite';
import { Archive, Bell, Bold, Info, Italic, Link2, Pencil, Pin, Search } from 'lucide-react';
import { I18nProvider } from 'react-aria-components';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Dialog, DialogTrigger } from '../dialog';
import { IconButton } from '../icon-button';
import { frameAround } from '../stories/corner';
import { tokenColor } from '../stories/paint';
import { Tooltip, TooltipTrigger } from './Tooltip';

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * Resolves once the open tip has been placed and has entered, and every transition on it has finished, so a
 * play reads its box at rest and not 4px short of it.
 */
async function atRest(): Promise<HTMLElement> {
  const tip = await waitFor(async () => {
    const found = only('.tooltip');
    await expect(found).toHaveAttribute('data-placement');
    await expect(found).not.toHaveAttribute('data-entering');
    return found;
  });
  await Promise.all(
    tip.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
  );
  return tip;
}

/** Lets `ms` of real time pass. */
const pause = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

/** The open tip, if there is one, wherever React Aria portaled it. */
const tipOnPage = (): HTMLElement | null => within(document.body).queryByRole('tooltip');

/** A trigger's box, by its name. */
const boxOf = (name: string): DOMRect =>
  within(document.body).getByRole('button', { name }).getBoundingClientRect();

/** The box of a tip's own words: its text, beside its arrow and its chip. */
function wordsOf(tip: HTMLElement): DOMRect {
  const words = [...tip.childNodes].find(
    (node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '',
  );
  if (!words) throw new Error('No words in the tip');
  const range = document.createRange();
  range.selectNodeContents(words);
  return range.getBoundingClientRect();
}

/** The key chip of a tip, which must be there. */
function chipOf(tip: HTMLElement): HTMLElement {
  const chip = tip.querySelector<HTMLElement>('kbd.tooltip-shortcut');
  if (!chip) throw new Error('No key chip');
  return chip;
}

/** A description long enough to wrap over many lines, as the tip of an info button can be. */
const NINETY_WORDS =
  'A budget sets how much a category may spend in a month. Spending is counted from the first day of the ' +
  'month to the last, in the currency of the account it came from, converted at the rate of the day it ' +
  'cleared. What is left over rolls into the next month unless you turn rollover off, and an overspent ' +
  'budget takes the difference from the next one. Shared budgets count every member, and changes apply ' +
  'from the start of the month you make them, never to months already closed.';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  args: {
    children: 'Edit',
  },
  parameters: {
    // The visual stories hold their tips open, and a docs page that drew them inline would open them all.
    docs: { story: { inline: false, height: '240px' } },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The ink tip above an icon button, naming it: canvas text, the micro corner, the float shadow and an 8px arrow
 * pointing down at the button, 12px off it with the arrow inside that gap.
 */
export const Top: Story = {
  render: (args) => (
    // Room above the button for the tip, wherever the runner draws the story.
    <div style={{ paddingTop: 64 }}>
      <TooltipTrigger isOpen>
        <IconButton aria-label="Edit" variant="outline">
          <Pencil />
        </IconButton>
        <Tooltip {...args} />
      </TooltipTrigger>
    </div>
  ),
  play: async () => {
    const tip = await atRest();
    await expect(tip).toHaveAttribute('data-placement', 'top');
    const button = boxOf('Edit');
    const box = tip.getBoundingClientRect();
    await expect(button.top - box.bottom).toBeGreaterThanOrEqual(12 - 0.5);
    await expect(button.top - box.bottom).toBeLessThanOrEqual(12 + 0.5);
    const arrow = tip.querySelector('.tooltip-arrow svg');
    if (!arrow) throw new Error('No arrow');
    // The arrow hangs from the tip's lower edge into the gap, and stops short of the button.
    await expect(arrow.getBoundingClientRect().top).toBeGreaterThanOrEqual(box.bottom - 1.5);
    await expect(arrow.getBoundingClientRect().bottom).toBeLessThan(button.top);
  },
};

/**
 * A tip at the end, as a collapsed rail shows its names, carrying a key chip for the shortcut: canvas at 20%
 * over the ink, with the platform's modifier.
 */
export const End: Story = {
  args: { children: 'Search', placement: 'end', shortcut: 'Mod K' },
  render: (args) => (
    <div style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
      <TooltipTrigger isOpen>
        <IconButton aria-label="Search" variant="outline">
          <Search />
        </IconButton>
        <Tooltip {...args} />
      </TooltipTrigger>
    </div>
  ),
  play: async () => {
    const tip = await atRest();
    await expect(tip).toHaveAttribute('data-placement', 'right');
    const button = boxOf('Search');
    const box = tip.getBoundingClientRect();
    await expect(box.left - button.right).toBeGreaterThanOrEqual(12 - 0.5);
    const chip = chipOf(tip);
    await expect(['⌘ K', 'Ctrl K']).toContain(chip.textContent);
    // 8px between the words and the chip.
    await expect(chip.getBoundingClientRect().left - wordsOf(tip).right).toBeCloseTo(8, 0);
    const arrow = tip.querySelector('.tooltip-arrow');
    await expect(arrow).toHaveAttribute('data-placement', 'right');
    const svg = arrow?.querySelector('svg')?.getBoundingClientRect();
    await expect(svg?.width).toBeCloseTo(8, 0);
    await expect(svg?.height).toBeCloseTo(8, 0);
  },
};

/** A long description wraps at 320px over many lines, and never runs off a narrow screen. */
export const Wrapped: Story = {
  args: { children: NINETY_WORDS },
  render: (args) => (
    <TooltipTrigger isOpen>
      <IconButton aria-label="About budgets" variant="outline">
        <Info />
      </IconButton>
      <Tooltip {...args} />
    </TooltipTrigger>
  ),
  play: async () => {
    const tip = await atRest();
    await expect(tip.getBoundingClientRect().width).toBeLessThanOrEqual(320 + 0.5);
    const style = getComputedStyle(tip);
    const content =
      tip.getBoundingClientRect().height -
      parseFloat(style.paddingTop) -
      parseFloat(style.paddingBottom) -
      parseFloat(style.borderTopWidth) -
      parseFloat(style.borderBottomWidth);
    await expect(Math.round(content / parseFloat(style.lineHeight))).toBeGreaterThanOrEqual(4);
    await expect(tip.scrollWidth).toBeLessThanOrEqual(tip.clientWidth);
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};

/**
 * A tip opened from a trigger in a dark card is the dark ink, white with black text, while the page is light:
 * it takes the scope of the trigger React Aria hands it.
 */
export const InDarkScope: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{ ...frameAround(24), background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          {/* Room above the button, so the tip sits in the card and covers none of its text. */}
          <div style={{ paddingTop: 48 }}>
            <TooltipTrigger isOpen>
              <IconButton aria-label="Edit" variant="outline">
                <Pencil />
              </IconButton>
              <Tooltip {...args} />
            </TooltipTrigger>
          </div>
          <p>A card in a dark block.</p>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas }) => {
    const tip = await atRest();
    await expect(tip).toHaveAttribute('data-theme', 'dark');
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(tip).backgroundColor).toBe(tokenColor('--color-ink', scope));
    await expect(getComputedStyle(tip).color).toBe(tokenColor('--color-canvas', scope));
  },
};

/**
 * Tab onto the button and the tip shows at once. A click focuses the button too, but a click's focus is not
 * visible, so it shows no tip.
 */
export const OpensOnFocusNotClick: Story = {
  tags: ['no-visual'],
  render: () => (
    <TooltipTrigger>
      <Button variant="secondary">Save</Button>
      <Tooltip>Saves the draft</Tooltip>
    </TooltipTrigger>
  ),
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole('button', { name: 'Save' });
    await userEvent.tab();
    await expect(button).toHaveFocus();
    await expect(within(document.body).getByRole('tooltip')).toHaveTextContent('Saves the draft');
    button.blur();
    await waitFor(() => expect(tipOnPage()).toBeNull());
    // Past React Aria's warm window, so the press below starts from cold.
    await pause(600);
    await userEvent.click(button);
    await expect(button).toHaveFocus();
    await pause(600);
    await expect(tipOnPage()).toBeNull();
  },
};

/**
 * Once a tip has shown, the next one shows at once while the pointer moves straight to its trigger: React
 * Aria keeps the tips warm for about half a second after one starts to close.
 */
export const WarmWindow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'flex', gap: 8 }}>
      <TooltipTrigger>
        <IconButton aria-label="Bold" variant="outline">
          <Bold />
        </IconButton>
        <Tooltip>Bold</Tooltip>
      </TooltipTrigger>
      <TooltipTrigger>
        <IconButton aria-label="Italic" variant="outline">
          <Italic />
        </IconButton>
        <Tooltip>Italic</Tooltip>
      </TooltipTrigger>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Bold' }));
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent('Bold'), {
      timeout: 1000,
    });
    await userEvent.hover(canvas.getByRole('button', { name: 'Italic' }));
    await waitFor(() => expect(within(document.body).getByRole('tooltip')).toHaveTextContent('Italic'), {
      timeout: 50,
    });
    // A warm tip swaps in with no fade: React Aria skips the entering state.
    await expect(only('.tooltip')).not.toHaveAttribute('data-entering');
    await userEvent.unhover(canvas.getByRole('button', { name: 'Italic' }));
    await waitFor(() => expect(tipOnPage()).toBeNull());
  },
};

/** Escape inside a dialog closes the tip and leaves the dialog open; a second Escape closes the dialog. */
export const EscapeInsideDialog: Story = {
  tags: ['no-visual'],
  render: () => (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">Share the project</Button>
      <Dialog title="Share the project" description="Anyone with the link can view it.">
        <TooltipTrigger>
          <IconButton aria-label="Copy the link" variant="outline">
            <Link2 />
          </IconButton>
          <Tooltip>Copy the link</Tooltip>
        </TooltipTrigger>
      </Dialog>
    </DialogTrigger>
  ),
  play: async ({ userEvent }) => {
    const body = within(document.body);
    const dialog = await body.findByRole('dialog', { name: 'Share the project' });
    const copy = body.getByRole('button', { name: 'Copy the link' });
    await waitFor(() => expect(dialog).toHaveFocus());
    await userEvent.tab();
    await expect(copy).toHaveFocus();
    await expect(body.getByRole('tooltip')).toHaveTextContent('Copy the link');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(tipOnPage()).toBeNull());
    await expect(dialog).toBeInTheDocument();
    await expect(copy).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/** The pointer can cross from the trigger onto the tip and rest there, and the tip stays until it leaves. */
export const HoverableTip: Story = {
  tags: ['no-visual'],
  render: () => (
    <TooltipTrigger>
      <IconButton aria-label="Archive" variant="outline">
        <Archive />
      </IconButton>
      <Tooltip>Archive the project</Tooltip>
    </TooltipTrigger>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.hover(canvas.getByRole('button', { name: 'Archive' }));
    const tip = await within(document.body).findByRole('tooltip', {}, { timeout: 1500 });
    await userEvent.hover(tip);
    await pause(300);
    await expect(tipOnPage()).toBe(tip);
    await userEvent.unhover(tip);
    await waitFor(() => expect(tipOnPage()).toBeNull());
  },
};

/** A touch on the trigger shows no tip, now or later: React Aria's hover ignores a touch pointer. */
export const TouchOpensNothing: Story = {
  tags: ['no-visual'],
  render: () => (
    <TooltipTrigger>
      <IconButton aria-label="Pin" variant="outline">
        <Pin />
      </IconButton>
      <Tooltip>Pin the project</Tooltip>
    </TooltipTrigger>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.pointer({ keys: '[TouchA]', target: canvas.getByRole('button', { name: 'Pin' }) });
    await pause(600);
    await expect(tipOnPage()).toBeNull();
  },
};

/** Scrolling a box the trigger sits in closes the tip, which would otherwise float away from its trigger. */
export const ScrollCloses: Story = {
  tags: ['no-visual'],
  render: () => (
    <div data-testid="scroller" style={{ height: 200, width: 240, overflowY: 'auto' }}>
      <div
        style={{
          height: 600,
          paddingTop: 80,
          display: 'grid',
          justifyItems: 'center',
          alignContent: 'start',
        }}
      >
        <TooltipTrigger>
          <IconButton aria-label="Notifications" variant="outline">
            <Bell />
          </IconButton>
          <Tooltip>Notifications</Tooltip>
        </TooltipTrigger>
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Notifications' })).toHaveFocus();
    await atRest();
    canvas.getByTestId('scroller').scrollTop = 10;
    await waitFor(() => expect(tipOnPage()).toBeNull());
  },
};

/** A trigger at the top of the window has no room above it, so the tip flips below it. */
export const FlipNearEdge: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ position: 'fixed', top: 8, left: '50%' }}>
      <TooltipTrigger>
        <IconButton aria-label="Notifications" variant="outline">
          <Bell />
        </IconButton>
        <Tooltip>Notifications</Tooltip>
      </TooltipTrigger>
    </div>
  ),
  play: async ({ userEvent }) => {
    await userEvent.tab();
    const tip = await atRest();
    await expect(tip).toHaveAttribute('data-placement', 'bottom');
    await expect(tip.getBoundingClientRect().top - boxOf('Notifications').bottom).toBeGreaterThanOrEqual(
      12 - 0.5,
    );
  },
};

/**
 * In right to left the tip reads right to left, the end is the left, and the key chip sits to the left of the
 * words, still 8px from them although the chip itself reads left to right.
 */
export const DirFromLocale: Story = {
  tags: ['no-visual'],
  render: () => (
    <I18nProvider locale="ar-EG">
      <div dir="rtl">
        <TooltipTrigger isOpen>
          <IconButton aria-label="Search" variant="outline">
            <Search />
          </IconButton>
          <Tooltip placement="end" shortcut="Mod K">
            Search
          </Tooltip>
        </TooltipTrigger>
      </div>
    </I18nProvider>
  ),
  play: async () => {
    const tip = await atRest();
    await expect(tip).toHaveAttribute('dir', 'rtl');
    await expect(tip).toHaveAttribute('data-placement', 'left');
    await expect(boxOf('Search').left - tip.getBoundingClientRect().right).toBeGreaterThanOrEqual(12 - 0.5);
    // The chip's own dir is ltr, so its gap is set on its right, the side that faces the words.
    await expect(wordsOf(tip).left - chipOf(tip).getBoundingClientRect().right).toBeCloseTo(8, 0);
  },
};
