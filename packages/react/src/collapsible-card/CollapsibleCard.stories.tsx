import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { nestedCardPixels } from '../stories/corner';
import { firstLineOffset, lineCount, tokenColor, tokenPixels } from '../stories/paint';
import { TextField } from '../text-field';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
function partsOf(card: Element): {
  header: HTMLElement;
  heading: HTMLElement;
  title: HTMLElement;
  toggle: HTMLElement;
  text: HTMLElement;
  chevron: SVGElement;
} {
  const header = card.querySelector<HTMLElement>(':scope > .card-disclosure > .card-header');
  const heading = header?.querySelector<HTMLElement>(':scope > .card-heading');
  const title = heading?.querySelector<HTMLElement>(':scope > .card-title');
  const toggle = title?.querySelector<HTMLElement>('.card-toggle');
  const text = toggle?.querySelector<HTMLElement>('.card-toggle-text');
  const chevron = toggle?.querySelector<SVGElement>('.card-chevron');
  if (!header || !heading || !title || !toggle || !text || !chevron) {
    throw new Error('No header, title or toggle drawn');
  }
  return { header, heading, title, toggle, text, chevron };
}

/** The first element inside `scope` with this test id. */
function byTestId(scope: Element, id: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Nothing has the test id ${id}`);
  return element;
}

/** The y of the middle of a box. */
const middle = (box: DOMRect): number => box.top + box.height / 2;

/**
 * Checks where `action`, in the actions of `card`, sits, and says which: beside the title and the note, at
 * the end of their row and centred on them, or under the note, at the row's start. Either way the note is
 * directly under the title.
 */
async function placementOf(card: Element, action: Element): Promise<'row' | 'under'> {
  const { heading, title } = partsOf(card);
  const note = heading.querySelector(':scope > .card-note');
  const titleBox = title.getBoundingClientRect();
  const actionBox = action.getBoundingClientRect();
  if (note) await expect(note.getBoundingClientRect().top).toBeGreaterThanOrEqual(titleBox.bottom);
  const headingBox = heading.getBoundingClientRect();
  if (actionBox.top < headingBox.bottom) {
    await expect(actionBox.left).toBeGreaterThanOrEqual(titleBox.right);
    await expect(Math.abs(middle(actionBox) - middle(headingBox))).toBeLessThan(1);
    return 'row';
  }
  await expect(actionBox.top).toBeGreaterThanOrEqual(headingBox.bottom);
  await expect(Math.abs(actionBox.left - titleBox.left)).toBeLessThan(0.5);
  return 'under';
}

/** The width the words of `text` take on one line: a copy that may not wrap is measured beside them. */
function oneLineWidth(text: Element): number {
  const copy = text.cloneNode(true);
  if (!(copy instanceof HTMLElement)) throw new Error('No words to copy');
  copy.style.cssText = 'position: absolute; width: max-content; white-space: nowrap; visibility: hidden';
  text.after(copy);
  const width = copy.getBoundingClientRect().width;
  copy.remove();
  return width;
}

/** The top-left corner in pixels, so a story reads the shape the toolbar has chosen. */
const radius = (element: Element): number => parseFloat(getComputedStyle(element).borderTopLeftRadius);

/**
 * The height of a plain card's header that holds the same title and note, drawn beside `card` at its width
 * and removed again. A plain card is static markup, so its classes are all it needs.
 */
function plainHeaderHeight(card: Element): number {
  const plain = document.createElement('div');
  plain.className = 'card';
  const header = plain.appendChild(document.createElement('div'));
  header.className = 'card-header';
  const title = header.appendChild(document.createElement('h2'));
  title.className = 'card-title';
  title.textContent = card.querySelector('.card-toggle-text')?.textContent ?? '';
  const note = card.querySelector('.card-note');
  if (note) {
    const copy = header.appendChild(document.createElement('p'));
    copy.className = 'card-note';
    copy.textContent = note.textContent;
  }
  card.after(plain);
  const height = header.getBoundingClientRect().height;
  plain.remove();
  return height;
}

/** A word of 75 letters with no hyphen and no space, so the only way to fit it is to break it. */
const UNBROKEN_WORD = 'workspacenotificationpreferencesforeverymemberandeveryprojectyoucreatelater';

const meta = {
  title: 'Components/CollapsibleCard',
  component: CollapsibleCard,
  args: { title: 'Notifications', note: 'Where we reach you, and how often.' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(480px, calc(100vw - 48px))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollapsibleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Open: the title is the toggle, a 40px row with the chevron at its end, and the header is as tall as a
 * plain card's.
 */
export const Open: Story = {
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      <p>Product updates, when something ships.</p>
      <p>A weekly digest, every Tuesday morning.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const { header, title, toggle } = partsOf(card);
    await expect(card).toHaveAttribute('data-expanded');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The whole row is the target: as wide as the title and at least 40px tall.
    const target = toggle.getBoundingClientRect();
    await expect(target.height).toBeGreaterThanOrEqual(40);
    await expect(Math.abs(target.width - title.getBoundingClientRect().width)).toBeLessThan(0.5);
    // The padding that makes the target is given back, so the header is a plain card's height.
    await expect(Math.abs(header.getBoundingClientRect().height - plainHeaderHeight(card))).toBeLessThan(0.5);
    await expect(canvas.getByText('Product updates, when something ships.')).toBeVisible();
  },
};

/**
 * Folded: the header stays and the body is gone, with the space and the rule between them, so the card
 * ends at its own padding. The chevron has turned a quarter toward the title.
 */
export const Folded: Story = {
  args: { defaultExpanded: false },
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      <p>Product updates, when something ships.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const { header, toggle, chevron } = partsOf(card);
    await expect(card).not.toHaveAttribute('data-expanded');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText('Product updates, when something ships.')).not.toBeVisible();
    const style = getComputedStyle(card);
    const below = card.getBoundingClientRect().bottom - header.getBoundingClientRect().bottom;
    await expect(
      Math.abs(below - parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth)),
    ).toBeLessThan(0.5);
    await expect(getComputedStyle(header).borderBottomWidth).toBe('0px');
    // Toward the title, which is the inline start: to the left, in left to right.
    await expect(getComputedStyle(chevron).rotate).toBe('90deg');
  },
};

/**
 * Actions sit at the end of the header row, outside the toggle, and stay usable while the card is folded.
 */
export const WithActions: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <CollapsibleCard {...args} actions={<Button variant="secondary">Reset</Button>} data-testid="open">
        <p>Product updates, when something ships.</p>
      </CollapsibleCard>
      <CollapsibleCard
        {...args}
        title="Billing"
        note="Paid by card, every month."
        defaultExpanded={false}
        actions={<Button variant="secondary">Change plan</Button>}
        data-testid="folded"
      >
        <p>The next invoice is on the first of the month.</p>
      </CollapsibleCard>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const [id, name] of [
      ['open', 'Reset'],
      ['folded', 'Change plan'],
    ] as const) {
      const card = byTestId(canvasElement, id);
      const { toggle } = partsOf(card);
      const action = canvas.getByRole('button', { name });
      await expect(action).toBeVisible();
      // Nothing to press inside the toggle, and the action is its neighbor, not its child.
      await expect(toggle).not.toContainElement(action);
      await expect(toggle.querySelectorAll('button, a, input, select, textarea, [tabindex]')).toHaveLength(0);
      // The action ends the title's row, level with the title. Where the row cannot hold both, as at 375px,
      // it moves under the note.
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        card.getBoundingClientRect().right,
      );
      await placementOf(card, action);
    }
  },
};

/**
 * In a card or in another collapsible card, the corner is concentric with the outer card's and the card takes
 * an outline, as a nested card does. An inner card keeps its own fold.
 */
export const Nested: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Card as="section" aria-labelledby="workspace-title" data-testid="card">
        <CardHeader>
          <CardTitle id="workspace-title">Workspace</CardTitle>
        </CardHeader>
        <CardBody>
          <CollapsibleCard
            title="Danger zone"
            level={3}
            note="Deleting a workspace cannot be undone."
            data-testid="in-card"
          >
            <p>Every member loses access at once.</p>
          </CollapsibleCard>
        </CardBody>
      </Card>
      <CollapsibleCard {...args} data-testid="outer">
        <p>Product updates, when something ships.</p>
        <CollapsibleCard title="Digest" level={3} defaultExpanded={false} data-testid="inner">
          <p>Every Tuesday morning.</p>
        </CollapsibleCard>
      </CollapsibleCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(radius(byTestId(canvasElement, 'card'))).toBe(tokenPixels('--radius-stadium'));
    await expect(radius(byTestId(canvasElement, 'outer'))).toBe(tokenPixels('--radius-stadium'));
    for (const id of ['in-card', 'inner']) {
      const nested = byTestId(canvasElement, id);
      await expect(radius(nested)).toBe(nestedCardPixels());
      await expect(getComputedStyle(nested).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    }
    // The outer card is open and the inner one keeps its own fold.
    await expect(partsOf(byTestId(canvasElement, 'outer')).toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(partsOf(byTestId(canvasElement, 'inner')).toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * A long title wraps inside the toggle, with the chevron level with its first line, a word with no break in
 * it breaks anywhere, and the actions move under the note, in the 288px column of a 320px screen with 16px
 * gutters. The visual suite also shoots every story at 375px.
 */
export const LongTitle: Story = {
  args: {
    title: `Notification preferences for ${UNBROKEN_WORD}`,
    note: 'Override them for one workspace at https://example.com/settings/notifications/workspaces/everyone.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 288 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <CollapsibleCard {...args} actions={<Button variant="secondary">Reset</Button>} data-testid="card">
      <p>The key for every workspace you create later is {UNBROKEN_WORD}.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const { toggle, text, chevron } = partsOf(card);
    const box = card.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(288.5);
    // Nothing the card holds reaches past it: not the card, and not any text inside it.
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    const action = canvas.getByRole('button', { name: 'Reset' });
    for (const part of [text, action, ...card.querySelectorAll<HTMLElement>('.card-note, .card-body p')]) {
      await expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth);
      const edge = part.getBoundingClientRect();
      await expect(edge.left).toBeGreaterThanOrEqual(box.left);
      await expect(edge.right).toBeLessThanOrEqual(box.right);
    }
    // The title wraps inside a toggle that stays a target, with the chevron level with its first line,
    // the note stays directly under it, and the actions move under the note.
    await expect(lineCount(text)).toBeGreaterThan(1);
    await expect(Math.abs(firstLineOffset(chevron, text))).toBeLessThanOrEqual(1);
    await expect(toggle.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
    await expect(await placementOf(card, action)).toBe('under');
  },
};

/**
 * The actions share the title's row while the title and the note keep at least 12rem beside them, and move
 * under the note when they cannot. "Notifications" with a tertiary Reset needs 12rem, the 24px gap and the
 * button's 87px, 303px inside the card's padding: a 400px card has 334px, a card on a 390px phone with
 * 16px gutters 292px, and one on a 320px screen 222px. The note stays directly under the title either way.
 */
export const ActionsPlacement: Story = {
  // A check of where the parts land: the visual suite already shoots both arrangements in WithActions.
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ width: 400 }}>
        <CollapsibleCard {...args} actions={<Button variant="tertiary">Reset</Button>} data-testid="wide" />
      </div>
      <div style={{ width: 358 }}>
        <CollapsibleCard {...args} actions={<Button variant="tertiary">Reset</Button>} data-testid="phone" />
      </div>
      <div style={{ width: 288 }}>
        <CollapsibleCard {...args} actions={<Button variant="tertiary">Reset</Button>} data-testid="small" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [id, placement] of [
      ['wide', 'row'],
      ['phone', 'under'],
      ['small', 'under'],
    ] as const) {
      const card = byTestId(canvasElement, id);
      const action = card.querySelector('.card-actions .button');
      if (!action) throw new Error('No action drawn');
      await expect(await placementOf(card, action)).toBe(placement);
    }
  },
};

/** Two columns that start their items, one as wide as the canvas and one narrower than its title. */
const COLUMNS = [
  { id: 'wide', width: undefined, title: 'Why this verdict' },
  { id: 'narrow', width: 240, title: 'Why this verdict was reached for this listing' },
] as const;

/**
 * Placed where it takes its width from what it holds, as in a column that starts its items, a card is as wide
 * as its header needs, as a plain card is, folded or open, so its title stays on one line. In a column too
 * narrow for that, the card fills the column and the title wraps between its words.
 */
export const ShrinkToFit: Story = {
  // A check of widths: the visual suite shoots the card at the widths its parents give it.
  tags: ['no-visual'],
  args: { note: undefined },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      {COLUMNS.map(({ id, width, title }) => (
        <div
          key={id}
          data-testid={id}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'start', gap: 24, width }}
        >
          <CollapsibleCard {...args} title={title} defaultExpanded={false}>
            <p>Price is fine.</p>
          </CollapsibleCard>
          <CollapsibleCard {...args} title={title}>
            <p>Price is fine.</p>
          </CollapsibleCard>
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const { id } of COLUMNS) {
      const column = byTestId(canvasElement, id);
      const room = column.getBoundingClientRect().width;
      const cards = column.querySelectorAll('.card-collapsible');
      await expect(cards).toHaveLength(2);
      for (const card of cards) {
        const { text } = partsOf(card);
        const width = card.getBoundingClientRect().width;
        const words = text.textContent.split(' ').length;
        // At least as wide as the title on one line, or as the column where that is narrower, and never wider.
        await expect(width).toBeGreaterThanOrEqual(Math.min(oneLineWidth(text), room) - 0.5);
        await expect(width).toBeLessThanOrEqual(room + 0.5);
        if (id === 'wide') await expect(lineCount(text)).toBe(1);
        else await expect(lineCount(text)).toBeLessThan(words);
      }
    }
  },
};

/**
 * Beside the actions, the title and the note keep at least 12rem. Two buttons on a 390px phone's card, or
 * three on a 360px one, leave less than that, so the actions move under the note instead of narrowing the
 * title to a column of letters.
 */
export const TitleRoom: Story = {
  // A check of where the parts land: the visual suite shoots the actions on both sides in WithActions.
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ width: 358 }}>
        <CollapsibleCard
          {...args}
          title="Notification preferences"
          actions={
            <>
              <Button variant="secondary">Reset</Button>
              <Button variant="secondary">Change plan</Button>
            </>
          }
          data-testid="two"
        />
      </div>
      <div style={{ width: 360 }}>
        <CollapsibleCard
          {...args}
          actions={
            <>
              <Button variant="secondary">Change plan</Button>
              <Button variant="secondary">Reset</Button>
              <Button variant="secondary">Export</Button>
            </>
          }
          data-testid="three"
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const floor = 12 * parseFloat(getComputedStyle(document.documentElement).fontSize);
    for (const id of ['two', 'three']) {
      const card = byTestId(canvasElement, id);
      const { title } = partsOf(card);
      const titleBox = title.getBoundingClientRect();
      const edge = card.getBoundingClientRect();
      const buttons = [...card.querySelectorAll('.card-actions .button')].map((button) =>
        button.getBoundingClientRect(),
      );
      await expect(buttons.length).toBeGreaterThan(1);
      // The title keeps 12rem beside the actions, or the actions sit below it.
      if (!buttons.every((box) => box.top >= titleBox.bottom)) {
        await expect(titleBox.width).toBeGreaterThanOrEqual(floor);
      }
      for (const box of buttons) {
        // No button covers the title, and none reaches past the card.
        await expect(
          box.bottom <= titleBox.top || box.top >= titleBox.bottom || box.left >= titleBox.right,
        ).toBe(true);
        await expect(box.left).toBeGreaterThanOrEqual(edge.left);
        await expect(box.right).toBeLessThanOrEqual(edge.right);
      }
    }
  },
};

/** The ring sits outside the toggle, which is as wide as the title, so ink still reads against the card. */
export const KeyboardFocus: Story = {
  render: (args) => (
    <CollapsibleCard {...args}>
      <p>Product updates, when something ships.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Notifications' })).toHaveFocus();
  },
};

/**
 * A popup or anything else positioned out of an open card is drawn whole: the body clips only while the
 * card is folded or folding. It is drawn whole again once a fold and an unfold have settled.
 */
export const OverflowingChild: Story = {
  // The check is a hit test, and the visual suite already shoots an open card.
  tags: ['no-visual'],
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      <p>Pick a time for the weekly digest.</p>
      <div style={{ position: 'relative' }}>
        <div
          data-testid="popup"
          style={{
            position: 'absolute',
            top: 0,
            insetInlineStart: 0,
            width: 160,
            height: 160,
            border: '1px solid var(--color-frame)',
            borderRadius: 'var(--radius-surface)',
            background: 'var(--color-raised)',
          }}
        />
      </div>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const card = byTestId(canvasElement, 'card');
    const popup = byTestId(canvasElement, 'popup');
    /** Whether a point below the card, inside the popup, hits the popup. */
    const drawnWhole = (): boolean => {
      const below = card.getBoundingClientRect().bottom + 16;
      const box = popup.getBoundingClientRect();
      return box.bottom > below && document.elementFromPoint(box.left + 16, below) === popup;
    };
    await expect(drawnWhole()).toBe(true);
    const toggle = canvas.getByRole('button', { name: 'Notifications' });
    // Each press marks the fold while it moves, so the body clips, and the mark comes off once it settles.
    await userEvent.click(toggle);
    await expect(card).toHaveAttribute('data-folding', '');
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    await userEvent.click(toggle);
    await expect(card).toHaveAttribute('data-folding', '');
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    await expect(card).toHaveAttribute('data-expanded');
    await expect(drawnWhole()).toBe(true);
  },
};

/**
 * Find-in-page or a text fragment link that reaches deep into a long folded body opens the card at once, so
 * the browser scrolls to where the match will stay: the body is its full height when the browser scrolls,
 * and nothing it holds is clipped or still moving.
 */
export const FindInLongBody: Story = {
  // A check of the scroll: the open and the folded card are shot in Open and Folded.
  tags: ['no-visual'],
  args: { title: 'Why this verdict', note: undefined, defaultExpanded: false },
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      {Array.from({ length: 40 }, (_, line) => (
        <p key={line}>Reason {line + 1} behind the verdict, written out at length so the body is long.</p>
      ))}
      <p>
        The <span data-testid="match">zebrafinch</span> rule decided it.
      </p>
    </CollapsibleCard>
  ),
  play: async ({ canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const match = byTestId(canvasElement, 'match');
    const fold = card.querySelector(':scope > .card-disclosure > .card-fold');
    if (!fold) throw new Error('No fold drawn');
    await expect(fold).toHaveAttribute('hidden', 'until-found');
    // What the browser does for a match in a hidden="until-found" element, in one task: it fires beforematch
    // at the element, shows it, and scrolls the match into view.
    fold.dispatchEvent(new Event('beforematch'));
    match.scrollIntoView({ block: 'center' });
    await expect(partsOf(card).toggle).toHaveAttribute('aria-expanded', 'true');
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
      await expect(card).not.toHaveAttribute('data-instant');
    });
    // Where the browser scrolled is where the match stays.
    const box = match.getBoundingClientRect();
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(match);
  },
};

/** The key the Remembered story's card stores its fold under. */
const REMEMBERED = 'storybook-collapsible-card-remembered';

/** Takes the Remembered story's key out of the stored folds, and keeps every other card's. */
function forget(): void {
  const stored: unknown = JSON.parse(localStorage.getItem('snapshot-ui:collapsed') ?? '[]');
  const keys = Array.isArray(stored) ? stored.filter((key) => key !== REMEMBERED) : [];
  localStorage.setItem('snapshot-ui:collapsed', JSON.stringify(keys));
}

/** A card, and a button that takes it off the page and renders a new one in its place, as a reload would. */
function RenderAgain(props: CollapsibleCardProps): ReactElement {
  const [renders, setRenders] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <CollapsibleCard key={renders} {...props} />
      <div>
        <Button
          variant="secondary"
          onPress={() => {
            setRenders(renders + 1);
          }}
        >
          Render again
        </Button>
      </div>
    </div>
  );
}

/**
 * With a storageKey the card remembers its fold. Folded, then taken off the page and rendered anew, it is
 * folded from its first render, so nothing moves. The story clears its key before it runs and after.
 */
export const Remembered: Story = {
  // A check of the store: the open and the folded card are shot in Open and Folded.
  tags: ['no-visual'],
  args: { storageKey: REMEMBERED },
  beforeEach: () => {
    forget();
    return forget;
  },
  render: (args) => (
    <RenderAgain {...args} data-testid="card">
      <p>Product updates, when something ships.</p>
    </RenderAgain>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const first = byTestId(canvasElement, 'card');
    await expect(partsOf(first).toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(partsOf(first).toggle);
    await expect(partsOf(first).toggle).toHaveAttribute('aria-expanded', 'false');
    await waitFor(async () => {
      await expect(first).not.toHaveAttribute('data-folding');
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Render again' }));
    const second = byTestId(canvasElement, 'card');
    await expect(first.isConnected).toBe(false);
    await expect(second).not.toHaveAttribute('data-expanded');
    await expect(partsOf(second).toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText('Product updates, when something ships.')).not.toBeVisible();
    // Folded from its first render: no fold is marked and no transition runs.
    await expect(second).not.toHaveAttribute('data-folding');
    await expect(second.getAnimations({ subtree: true })).toHaveLength(0);
  },
};

/** The folded marker's dot in `card`, which must show one. */
function dotOf(card: Element): HTMLElement {
  const dot = partsOf(card).text.querySelector<HTMLElement>(':scope > .card-marker');
  if (!dot) throw new Error('No marker drawn');
  return dot;
}

/** Where a box sits inside `card`, so two cards can be compared wherever they are on the page. */
function placeIn(card: Element, box: DOMRect): { left: number; top: number; width: number; height: number } {
  const edge = card.getBoundingClientRect();
  return { left: box.left - edge.left, top: box.top - edge.top, width: box.width, height: box.height };
}

/** The box of the last line of words in the title, read from the title's text. */
function lastWords(text: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(text.firstChild ?? text);
  const lines = range.getClientRects();
  const last = lines[lines.length - 1];
  if (!last) throw new Error('No words drawn');
  return last;
}

/**
 * The px from the middle of the last line of `text` to the middle of `dot`, positive when the dot is lower.
 * The last line box ends at the bottom of the text's box, which has no padding, and is one line height tall.
 */
function lastLineOffset(dot: Element, text: Element): number {
  const bottom = text.getBoundingClientRect().bottom;
  const dotBox = dot.getBoundingClientRect();
  return dotBox.top + dotBox.height / 2 - (bottom - parseFloat(getComputedStyle(text).lineHeight) / 2);
}

/**
 * Folded over a changed field, a card shows a clay dot after the last word of its title, level with that
 * line, and its toggle is described as changed. A folded title keeps room for the dot whether it shows or
 * not, so a title with the dot sits exactly where the same title without it does, wrapped or not.
 */
export const FoldedChanged: Story = {
  args: { title: 'Profile', note: 'How the rest of the team sees you.', defaultExpanded: false },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <CollapsibleCard {...args} data-testid="changed">
        <TextField label="Display name" defaultValue="Ada King" isChanged />
      </CollapsibleCard>
      <div style={{ display: 'grid', gap: 24, width: 288 }}>
        <CollapsibleCard {...args} title="Notification preferences for every workspace" data-testid="long">
          <TextField label="Digest day" defaultValue="Tuesday" isChanged />
        </CollapsibleCard>
        <CollapsibleCard {...args} title="Notification preferences for every workspace" data-testid="saved">
          <TextField label="Digest day" defaultValue="Tuesday" />
        </CollapsibleCard>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const changed = byTestId(canvasElement, 'changed');
    const { title, toggle, text, chevron } = partsOf(changed);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // The words are in a hidden element beside the heading: the toggle's name and the heading's text stay
    // the title.
    await expect(toggle).toHaveAccessibleName('Profile');
    await expect(toggle).toHaveAccessibleDescription('Changed');
    await expect(title.textContent).toBe('Profile');
    // An 8px clay dot, the color of the Changed chip it stands for, round in every shape.
    const dot = dotOf(changed);
    const style = getComputedStyle(dot);
    await expect(style.width).toBe('8px');
    await expect(style.height).toBe('8px');
    await expect(style.backgroundColor).toBe(tokenColor('--color-clay'));
    await expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(4);
    // After the last word of a title on one line, a part step on, level with the line, and short of the chevron.
    const box = dot.getBoundingClientRect();
    await expect(Math.abs(box.left - lastWords(text).right - tokenPixels('--spacing-part'))).toBeLessThan(
      0.5,
    );
    await expect(Math.abs(firstLineOffset(dot, text))).toBeLessThanOrEqual(0.5);
    await expect(box.right).toBeLessThan(chevron.getBoundingClientRect().left);
    // A title that wraps keeps the dot after its last word, a part step on, level with the last line, inside
    // the toggle and clear of the chevron.
    const long = byTestId(canvasElement, 'long');
    const longParts = partsOf(long);
    const longDot = dotOf(long).getBoundingClientRect();
    await expect(lineCount(longParts.text)).toBeGreaterThan(1);
    await expect(
      Math.abs(longDot.left - lastWords(longParts.text).right - tokenPixels('--spacing-part')),
    ).toBeLessThan(0.5);
    await expect(Math.abs(lastLineOffset(dotOf(long), longParts.text))).toBeLessThanOrEqual(0.5);
    await expect(longDot.right).toBeLessThan(longParts.chevron.getBoundingClientRect().left);
    await expect(longDot.right).toBeLessThanOrEqual(longParts.toggle.getBoundingClientRect().right);
    // The same title with nothing changed shows no dot, and its words and header are where the marked one's are.
    const saved = byTestId(canvasElement, 'saved');
    const savedParts = partsOf(saved);
    await expect(savedParts.text.querySelector('.card-marker')).toBeNull();
    await expect(savedParts.toggle).not.toHaveAttribute('aria-describedby');
    await expect(placeIn(saved, savedParts.text.getBoundingClientRect())).toEqual(
      placeIn(long, longParts.text.getBoundingClientRect()),
    );
    await expect(savedParts.header.getBoundingClientRect().height).toBe(
      longParts.header.getBoundingClientRect().height,
    );
  },
};

/**
 * A field that fails the browser's validation on submit opens the folded card that holds it, before React Aria
 * moves focus to the field, so the field is shown, focused and in view.
 */
export const OpensForInvalid: Story = {
  // A check of the open: the open and the folded card are shot in Open and Folded.
  tags: ['no-visual'],
  args: { title: 'Billing', note: 'Paid by card, every month.', defaultExpanded: false },
  render: (args) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      style={{ display: 'grid', gap: 24 }}
    >
      <CollapsibleCard {...args} data-testid="card">
        <TextField label="Card holder" isRequired />
      </CollapsibleCard>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const card = byTestId(canvasElement, 'card');
    const { toggle } = partsOf(card);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const field = canvas.getByRole('textbox', { name: 'Card holder' });
    await expect(field).toHaveFocus();
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    // Shown whole: nothing clips it and nothing covers it, and it is inside the window.
    await expect(field).toBeVisible();
    const box = field.getBoundingClientRect();
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(field);
  },
};

/**
 * A field deep in a long folded body that fails the browser's validation on submit is focused inside the
 * window: the card opens at once, so the body is its full height when the field takes focus and the browser
 * scrolls to it, and nothing moves the field after that.
 */
export const OpensForInvalidDeep: Story = {
  // A check of the scroll: the open and the folded card are shot in Open and Folded.
  tags: ['no-visual'],
  args: { title: 'Billing', note: 'Paid by card, every month.', defaultExpanded: false },
  render: (args) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      style={{ display: 'grid', gap: 24 }}
    >
      <CollapsibleCard {...args} data-testid="card">
        {Array.from({ length: 20 }, (_, index) => (
          <TextField
            key={index}
            label={`Reference ${String(index + 1)}`}
            defaultValue={`REF-${String(index + 1)}`}
          />
        ))}
        <TextField label="Card holder" isRequired />
      </CollapsibleCard>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const card = byTestId(canvasElement, 'card');
    await expect(partsOf(card).toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(partsOf(card).toggle).toHaveAttribute('aria-expanded', 'true');
    const field = canvas.getByRole('textbox', { name: 'Card holder' });
    await expect(field).toHaveFocus();
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
      await expect(card).not.toHaveAttribute('data-instant');
    });
    // Focused where the browser scrolled to it, which is where it stays.
    const box = field.getBoundingClientRect();
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(field);
  },
};
