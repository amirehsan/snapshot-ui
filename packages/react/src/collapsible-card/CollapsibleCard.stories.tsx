import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { firstLineOffset, lineCount, tokenPixels } from '../stories/paint';
import { CollapsibleCard } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
function partsOf(card: Element): {
  header: HTMLElement;
  title: HTMLElement;
  toggle: HTMLElement;
  text: HTMLElement;
  chevron: SVGElement;
} {
  const header = card.querySelector<HTMLElement>(':scope > .card-disclosure > .card-header');
  const title = header?.querySelector<HTMLElement>('.card-title');
  const toggle = header?.querySelector<HTMLElement>('.card-toggle');
  const text = toggle?.querySelector<HTMLElement>('.card-toggle-text');
  const chevron = toggle?.querySelector<SVGElement>('.card-chevron');
  if (!header || !title || !toggle || !text || !chevron) throw new Error('No header, title or toggle drawn');
  return { header, title, toggle, text, chevron };
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
 * Checks where `action`, in the actions of `card`, sits, and says which: on the title's row, at its end
 * and level with the title, or under the note, at the row's start. Either way the note is directly under
 * the title.
 */
async function placementOf(card: Element, action: Element): Promise<'row' | 'under'> {
  const { header, title } = partsOf(card);
  const note = header.querySelector(':scope > .card-note');
  const titleBox = title.getBoundingClientRect();
  const actionBox = action.getBoundingClientRect();
  if (note) await expect(note.getBoundingClientRect().top).toBeGreaterThanOrEqual(titleBox.bottom);
  if (actionBox.top < titleBox.bottom) {
    await expect(actionBox.left).toBeGreaterThanOrEqual(titleBox.right);
    await expect(Math.abs(middle(actionBox) - middle(titleBox))).toBeLessThan(1);
    return 'row';
  }
  await expect(actionBox.top).toBeGreaterThanOrEqual((note ?? title).getBoundingClientRect().bottom);
  await expect(Math.abs(actionBox.left - titleBox.left)).toBeLessThan(0.5);
  return 'under';
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
 * In a card or in another collapsible card, the corner steps down to the surface radius and takes an
 * outline, as a nested card does. An inner card keeps its own fold.
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
      await expect(radius(nested)).toBe(tokenPixels('--radius-surface'));
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
 * The actions share the title's row while the header is at least 18rem wide, as on a 390px phone with 16px
 * gutters, and move under the note below that, as on a 320px screen. The note stays directly under the
 * title either way.
 */
export const ActionsPlacement: Story = {
  // A check of where the parts land: the visual suite already shoots both arrangements in WithActions.
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
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
      ['phone', 'row'],
      ['small', 'under'],
    ] as const) {
      const card = byTestId(canvasElement, id);
      const action = card.querySelector('.card-actions .button');
      if (!action) throw new Error('No action drawn');
      await expect(await placementOf(card, action)).toBe(placement);
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
    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    await expect(card).toHaveAttribute('data-expanded');
    await expect(drawnWhole()).toBe(true);
  },
};
