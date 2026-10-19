import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Heading } from '../typography/Heading';
import { Badge } from './Badge';

const meta = {
  title: 'Components/Badge',
  component: Badge,
  args: { children: 'Beta' },
  argTypes: {
    tone: { control: 'inline-radio', options: ['neutral', 'info', 'success', 'warning', 'error'] },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};

export const Info: Story = { args: { tone: 'info', children: 'New' } };

export const Success: Story = { args: { tone: 'success', children: 'Published' } };

export const Warning: Story = { args: { tone: 'warning', children: 'Needs review' } };

export const ErrorTone: Story = { args: { tone: 'error', children: 'Failed' } };

/** Tabular figures keep a column of counts lined up, whatever the digits. */
export const Counts: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 8, width: 'max-content' }}>
      {(
        [
          ['Inbox', 12],
          ['Drafts', 8],
          ['Sent', 1204],
        ] as const
      ).map(([name, count]) => (
        <div key={name} style={{ display: 'flex', justifyContent: 'space-between', gap: 24 }}>
          <span>{name}</span>
          <Badge>{count}</Badge>
        </div>
      ))}
    </div>
  ),
};

/**
 * A long label wraps between its words inside its outline, at 16em at the most, and an unbroken run longer
 * than that breaks inside it, instead of pushing a narrow screen sideways.
 */
export const LongText: Story = {
  args: {
    tone: 'info',
    children:
      'A label long enough to wrap onto several lines on a phone, with an unbroken run of lettersaftertheendwithnothingtobreakatsothelabelmustwrapinsidetheoutline',
  },
};

/** The lines a range of text is set on, from the tops of its client rects. */
function linesOf(range: Range): number {
  return new Set([...range.getClientRects()].map((rect) => Math.round(rect.top))).size;
}

/** The text of a badge's label, the one run a badge draws. */
function labelText(badge: Element): Text {
  const text = badge.querySelector('.badge-label')?.firstChild;
  if (!(text instanceof Text)) throw new Error('No label drawn');
  return text;
}

/** The lines the whole label is set on. */
function linesOfLabel(badge: Element): number {
  const range = document.createRange();
  range.selectNodeContents(labelText(badge));
  return linesOf(range);
}

/** The words of the label set on more than one line, so that a line starts or ends inside them. */
function brokenWords(badge: Element): string[] {
  const text = labelText(badge);
  const broken: string[] = [];
  let at = 0;
  for (const word of text.data.split(' ')) {
    const range = document.createRange();
    range.setStart(text, at);
    range.setEnd(text, at + word.length);
    if (linesOf(range) > 1) broken.push(word);
    at += word.length + 1;
  }
  return broken;
}

function byTestId(scope: HTMLElement, id: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) throw new Error(`No ${id} drawn`);
  return element;
}

/** Whether `element` reaches past the end of `holder`, or the holder scrolls sideways. */
const spills = (element: Element, holder: Element): boolean =>
  element.getBoundingClientRect().right > holder.getBoundingClientRect().right + 0.5 ||
  holder.scrollWidth > holder.clientWidth;

const pageScrollsSideways = (): boolean =>
  document.documentElement.scrollWidth > document.documentElement.clientWidth;

const TITLE = 'Quarterly spending by category, every account and every card in one place';

/** A web address with no break in it: nothing for the browser to wrap at. */
const ADDRESS = `https://example.com/${'segment'.repeat(12)}end`;

/**
 * Beside a title in a flex row on a 390px phone, inside its 16px gutters, a badge keeps its word whole: "New"
 * stays on one line however the title wraps, given straight to the row or in a holder of its own.
 */
export const BesideAWrappingTitle: Story = {
  // A check of line counts: Info already shoots the badge's look.
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ width: 390, paddingInline: 16, boxSizing: 'border-box', display: 'grid', gap: 24 }}>
      <div data-testid="row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Heading level={3}>{TITLE}</Heading>
        <Badge tone="info" data-testid="direct">
          New
        </Badge>
      </div>
      <div data-testid="held-row" style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <Heading level={3}>{TITLE}</Heading>
        <span>
          <Badge tone="info" data-testid="held">
            New
          </Badge>
        </span>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [row, id] of [
      ['row', 'direct'],
      ['held-row', 'held'],
    ] as const) {
      const holder = byTestId(canvasElement, row);
      const badge = byTestId(canvasElement, id);
      const title = holder.querySelector('h3');
      if (!title) throw new Error('No title drawn');
      // The title wraps, so the row is as tight as it gets.
      const heading = document.createRange();
      heading.selectNodeContents(title);
      await expect(linesOf(heading)).toBeGreaterThan(1);
      await expect(linesOfLabel(badge)).toBe(1);
      await expect(spills(badge, holder)).toBe(false);
    }
  },
};

/**
 * A label of several words in a holder narrower than the whole label wraps between its words, never inside
 * one, and stays inside the holder, in a block and beside a name in a flex row. A word wider than a tiny
 * holder breaks inside the outline, and so does a web address in a holder sized by its content, a grid
 * column that grows to what it holds, so neither pushes the page sideways. A word of twenty letters there
 * stays whole.
 */
export const NarrowHolder: Story = {
  // A check of where the lines break: LongText already shoots a wrapped badge.
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div
      data-testid="phone"
      style={{ width: 390, paddingInline: 16, boxSizing: 'border-box', display: 'grid', gap: 24 }}
    >
      <div data-testid="block" style={{ width: 96 }}>
        <Badge tone="warning" data-testid="words-block">
          Needs a careful review
        </Badge>
      </div>
      <div data-testid="row" style={{ width: 150, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <span>Payroll</span>
        <Badge tone="warning" data-testid="words-row">
          Needs a careful review
        </Badge>
      </div>
      <div data-testid="tiny" style={{ width: 64 }}>
        <Badge data-testid="run">Supercalifragilisticexpialidocious</Badge>
      </div>
      <div data-testid="sized" style={{ display: 'grid', gridTemplateColumns: 'auto' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <Badge data-testid="address">{ADDRESS}</Badge>
          <Badge data-testid="long-word">Internationalization</Badge>
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [holder, id] of [
      ['block', 'words-block'],
      ['row', 'words-row'],
    ] as const) {
      const badge = byTestId(canvasElement, id);
      await expect(linesOfLabel(badge)).toBeGreaterThan(1);
      await expect(brokenWords(badge)).toEqual([]);
      await expect(spills(badge, byTestId(canvasElement, holder))).toBe(false);
    }
    const run = byTestId(canvasElement, 'run');
    await expect(linesOfLabel(run)).toBeGreaterThan(1);
    await expect(spills(run, byTestId(canvasElement, 'tiny'))).toBe(false);

    // The grid column grows to the badge's longest word, which the label caps at 16em.
    const phone = byTestId(canvasElement, 'phone');
    const address = byTestId(canvasElement, 'address');
    await expect(linesOfLabel(address)).toBeGreaterThan(1);
    await expect(spills(address, phone)).toBe(false);
    await expect(spills(byTestId(canvasElement, 'sized'), phone)).toBe(false);
    await expect(linesOfLabel(byTestId(canvasElement, 'long-word'))).toBe(1);
    await expect(pageScrollsSideways()).toBe(false);
  },
};
