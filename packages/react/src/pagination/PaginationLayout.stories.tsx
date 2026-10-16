import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { expect } from 'storybook/test';
import { Link } from '../link';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { Pagination } from '.';

/**
 * Pagination in the parents an app puts it in: a flex row beside a link, a grid cell and a plain block, in link
 * mode, in button mode and in the short form. The nav is a size container, which has no width of its own to
 * give a parent that sizes it from its content, so these hold that it still takes a sensible width in each, and
 * that its range never breaks a word letter by letter.
 */
const meta = {
  title: 'Checks/Pagination layout',
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const RANGE = '1 to 50 of 1,284 transactions';
const href = (page: number): string => `#page-${String(page)}`;

/** Button mode as a client component holds it. */
function Buttons({ hasPageNumbers }: { hasPageNumbers?: boolean }): ReactElement {
  const [page, setPage] = useState(1);
  return (
    <Pagination
      page={page}
      pageCount={26}
      rangeLabel={RANGE}
      onPageChange={setPage}
      hasPageNumbers={hasPageNumbers}
      labels={{ navigation: hasPageNumbers === false ? 'Short pages' : 'Button pages' }}
    />
  );
}

const ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 'var(--spacing-inset)',
};

/** A labelled composition, so a failing play names the parent it failed in. */
function Case({ name, style, children }: { name: string; style?: CSSProperties; children: ReactNode }) {
  return (
    <div data-case={name} style={style}>
      {children}
    </div>
  );
}

const showAll = <Link href="#all">Show 100 a page</Link>;

function Compositions(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-peer)' }}>
      <Case name="flex-links" style={ROW}>
        <Pagination page={1} pageCount={26} rangeLabel={RANGE} getPageHref={href} />
        {showAll}
      </Case>
      <Case name="flex-buttons" style={ROW}>
        <Buttons />
        {showAll}
      </Case>
      <Case name="flex-wrap" style={{ ...ROW, flexWrap: 'wrap' }}>
        <Pagination
          page={8}
          pageCount={26}
          rangeLabel={RANGE}
          getPageHref={href}
          labels={{ navigation: 'Wrapping row pages' }}
        />
        {showAll}
      </Case>
      <Case name="flex-short" style={ROW}>
        <Buttons hasPageNumbers={false} />
        {showAll}
      </Case>
      <Case
        name="grid-fr"
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          alignItems: 'center',
          gap: 'var(--spacing-inset)',
        }}
      >
        <Pagination
          page={3}
          pageCount={26}
          rangeLabel={RANGE}
          getPageHref={href}
          labels={{ navigation: 'Grid column pages' }}
        />
        {showAll}
      </Case>
      <Case
        name="grid-auto"
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto auto',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 'var(--spacing-inset)',
        }}
      >
        <Pagination
          page={12}
          pageCount={26}
          rangeLabel={RANGE}
          getPageHref={href}
          labels={{ navigation: 'Grid pages' }}
        />
        {showAll}
      </Case>
      <Case name="block">
        <Pagination
          page={26}
          pageCount={26}
          rangeLabel={RANGE}
          getPageHref={href}
          labels={{ navigation: 'Block pages' }}
        />
      </Case>
      <Case
        name="column"
        style={{
          display: 'flex',
          flexDirection: 'column',
          minBlockSize: '12rem',
          gap: 'var(--spacing-part)',
        }}
      >
        <Pagination
          page={2}
          pageCount={26}
          rangeLabel={RANGE}
          getPageHref={href}
          labels={{ navigation: 'Column pages' }}
        />
        {showAll}
      </Case>
    </div>
  );
}

const cases = (scope: ParentNode): HTMLElement[] => [...scope.querySelectorAll<HTMLElement>('[data-case]')];

function only(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** The range's line height in pixels. */
const lineOf = (range: HTMLElement): number => parseFloat(getComputedStyle(range).lineHeight);

/** The widest word of the range, as drawn: a range narrower than it broke a word. */
function widestWord(range: HTMLElement): number {
  const probe = document.createElement('span');
  probe.style.whiteSpace = 'nowrap';
  range.append(probe);
  let widest = 0;
  for (const word of (range.firstChild?.textContent ?? '').split(' ')) {
    probe.textContent = word;
    widest = Math.max(widest, rect(probe).width);
  }
  probe.remove();
  return widest;
}

/** What every parent holds at any width: nothing past the nav, nothing scrolling, no word broken. */
async function holds(each: HTMLElement): Promise<void> {
  const nav = only(each, '.pagination');
  const bounds = rect(nav);
  await expect(each.scrollWidth).toBeLessThanOrEqual(each.clientWidth);
  for (const control of each.querySelectorAll('.pagination-control')) {
    if (rect(control).width === 0) continue;
    await expect(rect(control).left).toBeGreaterThanOrEqual(bounds.left - 0.5);
    await expect(rect(control).right).toBeLessThanOrEqual(bounds.right + 0.5);
  }
  const range = only(each, '.pagination-range');
  await expect(rect(range).width).toBeGreaterThanOrEqual(widestWord(range) - 0.5);
}

/**
 * At 1280px, as an app's list page draws it: in a flex row beside a link, the range is one line, the steps and
 * pages sit in one row, and the link keeps the row's far end; in a grid cell and a block too.
 */
export const InARow: Story = {
  tags: ['viewport-desktop', 'webkit', 'firefox'],
  globals: DESKTOP,
  render: () => <Compositions />,
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const all = cases(canvasElement);
    await expect(all).toHaveLength(8);
    const middle = (element: Element): number => (rect(element).top + rect(element).bottom) / 2;
    for (const each of all) {
      await holds(each);
      const nav = only(each, '.pagination');
      // One line, but in the narrow row an auto column draws, where the range may wrap between words.
      const range = only(each, '.pagination-range');
      if (each.dataset.case !== 'grid-auto')
        await expect(rect(range).height).toBeLessThan(lineOf(range) * 1.5);
      // The controls shown sit in one row, centered on one line, and the nav is that row tall, in a column too.
      const shown = [...each.querySelectorAll('.pagination-control')].filter(
        (control) => rect(control).width > 0,
      );
      await expect(shown.length).toBeGreaterThanOrEqual(2);
      for (const control of shown) await expect(Math.abs(middle(control) - middle(nav))).toBeLessThan(1);
      await expect(rect(nav).height).toBeLessThan(rect(shown[0] ?? nav).height + 1);
      // An auto grid column sizes the nav from its content, the narrow row: the range between two steps. Every
      // other parent gives it room for the worded row, which the nav draws from 36rem of its own width.
      const least = each.dataset.case === 'grid-auto' ? 12 : each.dataset.case === 'flex-short' ? 0 : 36;
      await expect(rect(nav).width).toBeGreaterThanOrEqual(least * 16);
      // Beside a link in a row, the link keeps the row's far end at its own width.
      const link = each.querySelector('.link');
      if (link && each.dataset.case !== 'column')
        await expect(Math.abs(rect(link).right - rect(each).right)).toBeLessThan(1);
    }
  },
};

/**
 * At 375px the same parents: the nav narrows to the steps around the range, which wraps between words and
 * never letter by letter, and nothing scrolls sideways.
 */
export const InARowPhone: Story = {
  tags: ['viewport-phone', 'webkit', 'firefox'],
  globals: PHONE,
  render: () => <Compositions />,
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    for (const each of cases(canvasElement)) {
      await holds(each);
      const range = only(each, '.pagination-range');
      await expect(rect(range).height).toBeLessThan(lineOf(range) * 3.5);
    }
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(window.innerWidth);
  },
};
