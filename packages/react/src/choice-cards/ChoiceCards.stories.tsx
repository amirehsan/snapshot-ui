import type { Meta, StoryObj } from '@storybook/react-vite';
import { CalendarDays, CalendarRange, Gift, GraduationCap, HandHeart, User, Users } from 'lucide-react';
import type { ComponentType, CSSProperties, ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { renderToString } from 'react-dom/server';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { nestedCardPixels } from '../stories/corner';
import { focusOn } from '../stories/focus';
import { firstLineOffset, tokenColor, tokenPixels } from '../stories/paint';
import { DARK_PICTURE, LIGHT_PICTURE, SYSTEM_PICTURE } from '../stories/pictures';
import { resizeViewport } from '../stories/resize';
import { ChoiceCard, ChoiceCards, type ChoiceCardsBaseProps } from './ChoiceCards';

/** A form column for a list of cards. */
const LIST: CSSProperties = { width: 'min(32rem, 100%)' };

/** Room for three 12rem tiles and their gaps, as a grid of pictures takes on a settings page. */
const GRID: CSSProperties = { width: 'min(40rem, 100%)' };

/** The three plans, a price as each one's detail and a sentence under its title. */
function Plans(props: Partial<ChoiceCardsBaseProps>): ReactElement {
  return (
    <ChoiceCards label="Plan" name="plan" defaultValue="monthly" {...props}>
      <ChoiceCard value="monthly" description="Billed every month. Cancel any time." detail="$12 a month">
        Monthly
      </ChoiceCard>
      <ChoiceCard value="yearly" description="Two months free." detail="$120 a year">
        Yearly
      </ChoiceCard>
      <ChoiceCard value="starter" description="One account and no exports." detail="Free">
        Starter
      </ChoiceCard>
    </ChoiceCards>
  );
}

/** The three themes, each with its picture, which is decoration. */
function Themes(props: Partial<ChoiceCardsBaseProps>): ReactElement {
  return (
    <ChoiceCards label="Theme" name="theme" layout="grid" defaultValue="dark" {...props}>
      <ChoiceCard value="light" picture={<img src={LIGHT_PICTURE} alt="" />} description="A warm cream page.">
        Light
      </ChoiceCard>
      <ChoiceCard value="dark" picture={<img src={DARK_PICTURE} alt="" />} description="For low light.">
        Dark
      </ChoiceCard>
      <ChoiceCard
        value="system"
        picture={<img src={SYSTEM_PICTURE} alt="" />}
        description="Follows the device."
      >
        System
      </ChoiceCard>
    </ChoiceCards>
  );
}

/** Four kinds of account, each with an icon, as a grid. */
function Accounts(props: Partial<ChoiceCardsBaseProps>): ReactElement {
  return (
    <ChoiceCards label="Account type" name="account" layout="grid" defaultValue="personal" {...props}>
      <ChoiceCard value="personal" icon={<User />} description="Just you.">
        Personal
      </ChoiceCard>
      <ChoiceCard value="household" icon={<Users />} description="You and the people you live with.">
        Household
      </ChoiceCard>
      <ChoiceCard value="charity" icon={<HandHeart />} description="A registered charity.">
        Charity
      </ChoiceCard>
      <ChoiceCard value="student" icon={<GraduationCap />} description="With a student card.">
        Student
      </ChoiceCard>
    </ChoiceCards>
  );
}

const meta = {
  title: 'Components/ChoiceCards',
  // The props are a union, since the group needs a name, and Storybook cannot narrow a union.
  component: ChoiceCards as ComponentType<ChoiceCardsBaseProps>,
  parameters: { layout: 'padded' },
  args: { children: null },
} satisfies Meta<ChoiceCardsBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const all = (scope: ParentNode, selector: string): HTMLElement[] => [
  ...scope.querySelectorAll<HTMLElement>(selector),
];

/** Five seconds, where a busy runner is slow. */
const SLOW = { timeout: 5000 };

/** The width of the edge a card draws: its border and its ::after inside it. */
function edgeWidth(card: Element): number {
  return (
    parseFloat(getComputedStyle(card).borderTopWidth) +
    parseFloat(getComputedStyle(card, '::after').borderTopWidth)
  );
}

/** A card's corner as drawn, in pixels. */
const cornerOf = (element: Element): number => parseFloat(getComputedStyle(element).borderTopLeftRadius);

/** A press and typing: the browser's own through Playwright in a Vitest story run, Storybook's in its UI. */
interface Presses {
  click: (element: Element) => Promise<void>;
  keyboard: (text: string) => Promise<void>;
}

/**
 * Playwright's real pointer and keys, which run the browser's own focus and label activation, in a Vitest story
 * run; Storybook's simulated ones in its own UI. `vitest/browser` is served only in Vitest's browser mode, so it is
 * imported only there, as `stories/resize.ts` does.
 */
async function realPresses(): Promise<Presses> {
  if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) {
    return {
      click: async (element) => {
        await userEvent.click(element);
      },
      keyboard: async (text) => {
        await userEvent.keyboard(text);
      },
    };
  }
  // Untyped on purpose: the module's types declare its own matchers globally, which the unit tests' types refuse.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- a literal would load those types
  const browser = (await import('vitest/browser' as string)) as { userEvent: Presses };
  return browser.userEvent;
}

/**
 * Listens on the document for a focusout that leaves focus on nothing while focus was inside `scope`, which is
 * focus falling to the body (lesson 10); `stop` takes the listener off and returns how many there were.
 */
function watchLostFocus(scope: Element): () => number {
  let lost = 0;
  const onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget === null && event.target instanceof Node && scope.contains(event.target))
      lost += 1;
  };
  document.addEventListener('focusout', onFocusOut, true);
  return () => {
    document.removeEventListener('focusout', onFocusOut, true);
    return lost;
  };
}

/** Each shape and density a play measures in, put back after. */
async function inEachLook(check: (look: string) => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of [
      ['rounded', 'comfortable'],
      ['rounded', 'compact'],
      ['soft', 'comfortable'],
      ['soft', 'compact'],
      ['square', 'comfortable'],
      ['square', 'compact'],
    ] as const) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check(`${nextShape} ${nextDensity}`);
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

/** The words of `scope` drawn over more than one line: a holder narrower than one of them. */
function brokenWords(scope: Element): string[] {
  const broken: string[] = [];
  const walker = document.createTreeWalker(scope, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    for (const match of (node.textContent ?? '').matchAll(/\S+/g)) {
      const range = document.createRange();
      range.setStart(node, match.index);
      range.setEnd(node, match.index + match[0].length);
      const lines = new Set([...range.getClientRects()].map((rect) => Math.round(rect.top)));
      if (lines.size > 1) broken.push(match[0]);
    }
  }
  return broken;
}

/**
 * Three plans as a list, Monthly chosen: Raised cards with a boundary edge, and the chosen one's edge ink and 2px
 * wide with its dot filled ink and a canvas check. Nothing moves when the choice does.
 */
export const Default: Story = {
  tags: ['density'],
  render: () => (
    <div style={LIST}>
      <Plans />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [monthly, yearly] = all(canvasElement, 'label.choice-card');
    if (!monthly || !yearly) throw new Error('Three cards expected');
    await expect(getComputedStyle(monthly).borderTopColor).toBe(tokenColor('--color-ink'));
    await expect(edgeWidth(monthly)).toBe(2);
    await expect(edgeWidth(yearly)).toBe(1);
    await expect(getComputedStyle(find(monthly, '.radio-indicator')).backgroundColor).toBe(
      tokenColor('--color-ink'),
    );
    await expect(getComputedStyle(yearly).backgroundColor).toBe(tokenColor('--color-raised'));
    await expect(getComputedStyle(find(yearly, '.choice-card-title')).fontWeight).toBe('500');
    // The corner is the surface step on the page.
    await expect(cornerOf(monthly)).toBe(tokenPixels('--radius-surface'));
  },
};

/** A list with a 24px icon at the start of each card, level with its title's first line. */
export const Icons: Story = {
  render: () => (
    <div style={LIST}>
      <ChoiceCards label="Billing" name="billing" defaultValue="month">
        <ChoiceCard value="month" icon={<CalendarDays />} description="Pay at the start of each month.">
          Every month
        </ChoiceCard>
        <ChoiceCard value="year" icon={<CalendarRange />} description="Pay once and save two months.">
          Every year
        </ChoiceCard>
        <ChoiceCard value="gift" icon={<Gift />} description="Pay for someone else, for a year.">
          As a gift
        </ChoiceCard>
      </ChoiceCards>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      const icon = find(card, '.choice-card-media svg').getBoundingClientRect();
      await expect([icon.width, icon.height]).toEqual([24, 24]);
      await expect(
        Math.abs(firstLineOffset(find(card, '.choice-card-media'), find(card, '.choice-card-title'))),
      ).toBeLessThan(1);
    }
  },
};

/** Four kinds of account as a grid of icon tiles. */
export const IconGrid: Story = {
  tags: ['density'],
  render: () => (
    <div style={GRID}>
      <Accounts />
    </div>
  ),
};

/** Light, Dark and System, each with its picture flush with the card's top and sides, Dark chosen. */
export const Pictures: Story = {
  render: () => (
    <div style={GRID}>
      <Themes />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      const box = card.getBoundingClientRect();
      const media = find(card, '.choice-card-media').getBoundingClientRect();
      // Flush inside the 1px border, so the card's curve clips it.
      await expect(Math.abs(media.top - (box.top + 1))).toBeLessThan(1);
      await expect(Math.abs(media.left - (box.left + 1))).toBeLessThan(1);
      await expect(Math.abs(media.right - (box.right - 1))).toBeLessThan(1);
      await expect(Math.abs(media.width / media.height - 16 / 9)).toBeLessThan(0.02);
    }
  },
};

/** Prices as details at the title line's end, in tabular figures. */
export const Details: Story = {
  render: () => (
    <div style={LIST}>
      <Plans defaultValue="yearly" description="Prices include tax." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      const title = find(card, '.choice-card-title').getBoundingClientRect();
      const detail = find(card, '.choice-card-detail').getBoundingClientRect();
      await expect(Math.abs(detail.top - title.top)).toBeLessThan(4);
      await expect(detail.left).toBeGreaterThan(title.right);
      await expect(getComputedStyle(find(card, '.choice-card-detail')).fontVariantNumeric).toContain(
        'tabular-nums',
      );
    }
  },
};

/** A required group submitted with nothing chosen: the error edge on every card and the error line under them. */
export const Invalid: Story = {
  render: () => (
    <div style={LIST}>
      <Plans defaultValue={undefined} isInvalid errorMessage="Choose a plan to continue." />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      await expect(getComputedStyle(card).borderTopColor).toBe(tokenColor('--color-error'));
      // 1.5px, which an engine draws in whole device pixels: wider than a card at rest, either way.
      await expect(edgeWidth(card)).toBeGreaterThan(1);
    }
  },
};

/** A changed choice: the clay chip in the label row, and no edge of its own. */
export const Changed: Story = {
  render: () => (
    <div style={LIST}>
      <Plans defaultValue="yearly" isChanged />
    </div>
  ),
};

/** A disabled group: the disabled fill, a faint edge, taupe words, and the chosen card's check kept. */
export const Disabled: Story = {
  render: () => (
    <div style={GRID}>
      <Themes isDisabled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      await expect(getComputedStyle(card).backgroundColor).toBe(tokenColor('--color-disabled'));
      await expect(getComputedStyle(find(card, '.choice-card-title')).color).toBe(
        tokenColor('--color-taupe'),
      );
      await expect(getComputedStyle(find(card, 'img')).opacity).toBe('0.5');
    }
  },
};

/** One card disabled in a group that can still change. */
export const DisabledCard: Story = {
  render: () => (
    <div style={LIST}>
      <ChoiceCards label="Plan" name="plan" defaultValue="monthly">
        <ChoiceCard value="monthly" description="Billed every month." detail="$12 a month">
          Monthly
        </ChoiceCard>
        <ChoiceCard
          value="team"
          description="For five people or more. Ask us to turn it on."
          detail="$40 a month"
          isDisabled
        >
          Team
        </ChoiceCard>
        <ChoiceCard value="starter" description="One account and no exports." detail="Free">
          Starter
        </ChoiceCard>
      </ChoiceCards>
    </div>
  ),
};

const UNBROKEN = 'notificationpreferencesforeverymemberxyz';

/** A title of ten words, a sentence of forty and an unbroken 40-letter word: all wrap inside the card. */
export const LongContent: Story = {
  render: () => (
    <div style={LIST}>
      <ChoiceCards label="Where we send the weekly digest" name="digest" defaultValue="all">
        <ChoiceCard
          value="all"
          detail="$4 a month"
          description="Every receipt, invoice and statement for every account you hold with us goes to each address on the list, and we send one summary on Monday mornings with the totals for the week before it, so nobody has to ask."
        >
          Send the digest to every member of the household at once
        </ChoiceCard>
        <ChoiceCard value="word" description={UNBROKEN}>
          {UNBROKEN}
        </ChoiceCard>
      </ChoiceCards>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      const box = card.getBoundingClientRect();
      for (const part of all(card, '.choice-card-title, .choice-card-description, .choice-card-detail')) {
        await expect(part.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
        await expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth + 1);
      }
    }
  },
};

/** A list and a grid in a Card's body: every card takes the card's concentric corner, wherever it falls. */
export const InCard: Story = {
  tags: ['density'],
  render: () => (
    <Card style={{ width: 'min(44rem, 100%)' }}>
      <CardHeader>
        <CardTitle>Billing</CardTitle>
      </CardHeader>
      <CardBody>
        <Plans />
        <Accounts />
      </CardBody>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    for (const card of all(canvasElement, 'label.choice-card')) {
      await expect(cornerOf(card)).toBe(nestedCardPixels());
    }
  },
};

/** A grid in a flex row with no width of its own, and two side by side in flex: 1 wrappers at a phone's width. */
function FlexRows({ children }: { children?: ReactNode }): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-case="row" style={{ display: 'flex', alignItems: 'flex-start' }}>
        <Accounts />
      </div>
      <div data-case="squeezed" style={{ display: 'flex', width: '300px', overflowX: 'clip' }}>
        <Accounts />
        <div style={{ flex: '1 0 240px' }}>The page</div>
      </div>
      <div data-case="one" style={{ display: 'flex' }}>
        <div style={{ flex: 1 }}>
          <Themes />
        </div>
      </div>
      {/* Two groups side by side are wider than a phone by their longest words, so the app lets them break there,
          as the docs say: min-width: 0 on each wrapper. */}
      <div data-case="two-up" style={{ display: 'flex', gap: '1rem' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Themes />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Themes defaultValue="light" />
        </div>
      </div>
      {children}
    </div>
  );
}

/**
 * No size container (spec 9): a grid in a flex row with no width is one column as wide as its widest card, a
 * squeezed row stops at the cards' longest word and never breaks one (plan, spec correction 22), and at 320px a
 * group in a flex: 1 wrapper, and two side by side in wrappers an app gives min-width: 0, keep the page from
 * scrolling sideways.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <FlexRows />,
  play: async ({ canvasElement }) => {
    const at = (name: string): HTMLElement => find(canvasElement, `[data-case="${name}"]`);
    // One column, as wide as the widest card's content, and wider than nothing.
    const row = at('row');
    const fields = all(row, '.choice-card-field');
    const lefts = new Set(fields.map((field) => Math.round(field.getBoundingClientRect().left)));
    await expect(lefts.size).toBe(1);
    const widths = fields.map((field) => field.getBoundingClientRect().width);
    await expect(Math.max(...widths) - Math.min(...widths)).toBeLessThan(1);
    await expect(Math.min(...widths)).toBeGreaterThan(100);
    await expect(brokenWords(row)).toEqual([]);
    // Squeezed by its neighbor, the group stops at its longest word.
    await waitFor(() => expect(brokenWords(at('squeezed'))).toEqual([]), SLOW);
    if (!(await resizeViewport(320, 800))) return;
    try {
      await waitFor(
        () =>
          expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
            document.documentElement.clientWidth,
          ),
        SLOW,
      );
    } finally {
      await resizeViewport(1280, 800);
    }
  },
};

/** Four cards in a grid three columns wide, for the arrow keys. */
function KeysGrid(): ReactElement {
  return (
    <div style={{ width: '40rem' }}>
      <Accounts defaultValue="personal" />
    </div>
  );
}

/**
 * The arrows move focus and the choice together in reading order, whatever the layout, and wrap: in a grid three
 * columns wide, Arrow Down from the first card goes to the second, to its right. Right to left mirrors Left and
 * Right.
 */
export const Keys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-case="ltr">
        <KeysGrid />
      </div>
      <I18nProvider locale="fa-IR">
        <div data-case="rtl" dir="rtl" lang="fa">
          <KeysGrid />
        </div>
      </I18nProvider>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [name, next, previous] of [
      ['ltr', '{ArrowRight}', '{ArrowLeft}'],
      ['rtl', '{ArrowLeft}', '{ArrowRight}'],
    ] as const) {
      const scope = within(find(canvasElement, `[data-case="${name}"]`));
      const radio = (title: string): HTMLElement => scope.getByRole('radio', { name: title });
      await focusOn(radio('Personal'));
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(radio('Household')).toHaveFocus());
      await expect(radio('Household')).toBeChecked();
      // The second card is beside the first, in the same row.
      const first = radio('Personal').closest('label')?.getBoundingClientRect();
      const second = radio('Household').closest('label')?.getBoundingClientRect();
      await expect(Math.abs((first?.top ?? 0) - (second?.top ?? 1))).toBeLessThan(1);
      await userEvent.keyboard(next);
      await waitFor(() => expect(radio('Charity')).toBeChecked());
      await userEvent.keyboard(next);
      await waitFor(() => expect(radio('Student')).toBeChecked());
      // Past the last it wraps to the first, and back.
      await userEvent.keyboard(next);
      await waitFor(() => expect(radio('Personal')).toBeChecked());
      await userEvent.keyboard(previous);
      await waitFor(() => expect(radio('Student')).toBeChecked());
      await expect(radio('Student')).toHaveFocus();
    }
  },
};

/**
 * Each radio is named by its title alone and described by its sentence, then its detail, in the engine's own
 * computation; a picture's alt is never read (risk R5).
 */
export const NamesByTitle: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)', ...GRID }}>
      <Plans />
      <Themes />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    for (const [title, sentence, detail] of [
      ['Monthly', 'Billed every month. Cancel any time.', '$12 a month'],
      ['Yearly', 'Two months free.', '$120 a year'],
      ['Starter', 'One account and no exports.', 'Free'],
    ] as const) {
      const radio = canvas.getByRole('radio', { name: title });
      await expect(radio).toHaveAccessibleName(title);
      await expect(radio).toHaveAccessibleDescription(`${sentence} ${detail}`);
    }
    for (const title of ['Light', 'Dark', 'System']) {
      await expect(canvas.getByRole('radio', { name: title })).toHaveAccessibleName(title);
    }
    await expect(canvas.queryAllByRole('img')).toEqual([]);
  },
};

/**
 * Before hydration a press on a card checks its native radio and the card draws chosen: the server's HTML, with no
 * script of the library's running (risk R6).
 */
export const BeforeHydration: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <div data-testid="host" style={LIST} />,
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByTestId('host');
    host.innerHTML = renderToString(<Plans />);
    const [monthly, yearly] = all(host, 'label.choice-card');
    if (!monthly || !yearly) throw new Error('Three cards expected');
    await expect(yearly).not.toHaveAttribute('data-selected');
    yearly.click();
    const input = find(yearly, 'input') as HTMLInputElement;
    await waitFor(() => expect(input.checked).toBe(true));
    await expect(getComputedStyle(yearly).borderTopColor).toBe(tokenColor('--color-ink'));
    await expect(parseFloat(getComputedStyle(yearly, '::after').borderTopWidth)).toBe(1);
    await expect(getComputedStyle(find(yearly, '.radio-indicator')).backgroundColor).toBe(
      tokenColor('--color-ink'),
    );
    // The card the server drew chosen lets go, from its native input alone.
    await expect(parseFloat(getComputedStyle(monthly, '::after').borderTopWidth)).toBe(0);
  },
};

/**
 * Every card in a Card has the formula's corner whatever its place, 7px and 19px in Rounded, the micro step in
 * Soft and 0 in Square; a list thumbnail's corner within the card's; a grid picture clipped by the card.
 */
export const CardCorners: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <Card data-case="card" style={{ width: 'min(44rem, 100%)' }}>
        <CardBody>
          <Themes />
          <Themes layout="list" />
        </CardBody>
      </Card>
      <div data-case="page" style={LIST}>
        <Themes layout="list" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = find(canvasElement, '[data-case="card"]');
    const page = find(canvasElement, '[data-case="page"]');
    await inEachLook(async (look) => {
      const micro = tokenPixels('--radius-micro');
      const thumbnail = (corner: number): number => Math.min(corner, Math.max(micro, corner - 1 - 16));
      for (const each of all(card, 'label.choice-card')) {
        await expect(cornerOf(each), look).toBe(nestedCardPixels());
      }
      for (const each of all(card, ".choice-cards[data-layout='list'] .choice-card-media")) {
        await expect(cornerOf(each), look).toBe(thumbnail(nestedCardPixels()));
      }
      const surface = tokenPixels('--radius-surface');
      for (const each of all(page, '.choice-card-media')) {
        await expect(cornerOf(each), look).toBe(thumbnail(surface));
        await expect(cornerOf(each), look).toBeLessThanOrEqual(surface);
      }
      // A grid picture is square, and the card that clips it draws its corner.
      for (const each of all(card, ".choice-cards[data-layout='grid'] .choice-card")) {
        await expect(getComputedStyle(each).overflow, look).toBe('clip');
        await expect(cornerOf(find(each, '.choice-card-media')), look).toBe(0);
      }
    });
  },
};

/** Cards in a grid row share one height, and each dot is level with its title's first line. */
export const EqualHeights: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)', width: '40rem' }}>
      <Themes />
      <Accounts />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cards = all(canvasElement, 'label.choice-card');
    const rows = new Map<number, number[]>();
    for (const card of cards) {
      const { top, height } = card.getBoundingClientRect();
      rows.set(Math.round(top), [...(rows.get(Math.round(top)) ?? []), height]);
    }
    for (const heights of rows.values())
      await expect(Math.max(...heights) - Math.min(...heights)).toBeLessThan(1);
    // The rows hold more than one card each, so the check above compares something.
    await expect([...rows.values()].some((heights) => heights.length > 1)).toBe(true);
    for (const card of cards) {
      await expect(
        Math.abs(firstLineOffset(find(card, '.radio-indicator'), find(card, '.choice-card-title'))),
      ).toBeLessThan(1);
    }
  },
};

/**
 * A press on a card and the arrow keys keep focus on a radio of the group: it never falls to the page's body, in
 * three engines (lesson 10).
 */
export const FocusStays: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={LIST}>
      <Plans />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const group = canvas.getByRole('radiogroup', { name: 'Plan' });
    const stop = watchLostFocus(group);
    try {
      const presses = await realPresses();
      await presses.click(canvas.getByText('Two months free.'));
      await waitFor(() => expect(canvas.getByRole('radio', { name: 'Yearly' })).toBeChecked(), SLOW);
      await waitFor(() => expect(canvas.getByRole('radio', { name: 'Yearly' })).toHaveFocus(), SLOW);
      await presses.click(canvas.getByText('$12 a month'));
      await waitFor(() => expect(canvas.getByRole('radio', { name: 'Monthly' })).toHaveFocus(), SLOW);
      await presses.keyboard('{ArrowDown}');
      await waitFor(() => expect(canvas.getByRole('radio', { name: 'Yearly' })).toHaveFocus(), SLOW);
      await expect(canvas.getByRole('radio', { name: 'Yearly' })).toBeChecked();
    } finally {
      await expect(stop()).toBe(0);
    }
    // The shot shows the group at rest, with no ring.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
