import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';
import { tokenColor, tokenPixels, washColor } from '../stories/paint';
import { Pagination, type PaginationProps } from '.';

const href = (page: number): string => `#page-${String(page)}`;

/** The range of a page of 50 rows out of 1,284, as an app would format it. */
const range = (page: number): string =>
  `${String((page - 1) * 50 + 1)} to ${String(Math.min(page * 50, 1284))} of 1,284`;

/** Persian digits, written without Intl. */
const persian = (value: number | string): string =>
  String(value).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);

/** Link mode, the stories' default: the server page's form. */
type LinkModeProps = Extract<PaginationProps, { getPageHref: (page: number) => string }>;

/** Pagination in link mode, so the stories' args have one shape. */
function Pages(props: LinkModeProps): ReactElement {
  return <Pagination {...props} />;
}

const meta = {
  title: 'Components/Pagination',
  component: Pages,
  args: { page: 1, pageCount: 26, rangeLabel: range(1), getPageHref: href },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(48rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Pages>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** A step by its data-step. */
const step = (scope: ParentNode, which: 'previous' | 'next'): HTMLElement =>
  find(scope, `.pagination-step[data-step="${which}"]`);

/** The page control whose visible text is `text`. */
function pageControl(scope: ParentNode, text: string): HTMLElement {
  const control = [...scope.querySelectorAll<HTMLElement>('.pagination-page')].find(
    (each) => each.textContent === text,
  );
  if (!control) throw new Error(`No page ${text}`);
  return control;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** Button mode as a client component holds it: the page in state. */
function Paged({
  initial,
  pageCount = 5,
  hasPageNumbers,
}: {
  initial: number;
  pageCount?: number;
  hasPageNumbers?: boolean;
}): ReactElement {
  const [page, setPage] = useState(initial);
  return (
    <Pagination
      page={page}
      pageCount={pageCount}
      rangeLabel={range(page)}
      onPageChange={setPage}
      hasPageNumbers={hasPageNumbers}
    />
  );
}

/**
 * The first of 26 pages: the slate range at the start and, at the end, Previous taupe, "1" the ink pill, 2 to 5,
 * a slate ellipsis, 26 and Next. Each control is 40px (36px compact) and hit at the target either way.
 */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const current = pageControl(canvasElement, '1');
    await expect(current).toHaveAttribute('aria-current', 'page');
    await expect(getComputedStyle(current).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(current).color).toBe(tokenColor('--color-canvas'));
    const two = pageControl(canvasElement, '2');
    const size = parseFloat(getComputedStyle(two).getPropertyValue('--size-control'));
    await expect(rect(two).height).toBe(size);
    await expect(rect(two).width).toBeGreaterThanOrEqual(size);
    await expect(getComputedStyle(two).color).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(two).fontWeight).toBe('500');
    const hit = parseFloat(getComputedStyle(two, '::before').height);
    await expect(hit).toBeGreaterThanOrEqual(Math.max(tokenPixels('--size-target'), size));
    await expect(getComputedStyle(step(canvasElement, 'previous')).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(find(canvasElement, '.pagination-range')).color).toBe(
      tokenColor('--color-slate'),
    );
    await expect(getComputedStyle(find(canvasElement, '.pagination-gap')).color).toBe(
      tokenColor('--color-slate'),
    );
  },
};

/** Page 12 of 26: the window in the middle, with a gap each side. */
export const Middle: Story = {
  args: { page: 12, rangeLabel: range(12) },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.pagination-gap')).toHaveLength(2);
    await expect(pageControl(canvasElement, '12')).toHaveAttribute('aria-current', 'page');
  },
};

/** The last page: Next is taupe, not-allowed and out of the tab order. */
export const LastPage: Story = {
  args: { page: 26, rangeLabel: range(26) },
  play: async ({ canvasElement }) => {
    const next = step(canvasElement, 'next');
    await expect(next).toHaveAttribute('aria-disabled', 'true');
    await expect(next).not.toHaveAttribute('href');
    await expect(getComputedStyle(next).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(next).cursor).toBe('not-allowed');
  },
};

/** Four pages: every one shows, and there is no gap. */
export const FewPages: Story = {
  args: { page: 2, pageCount: 4, rangeLabel: '51 to 100 of 180' },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('.pagination-page')).toHaveLength(4);
    await expect(canvasElement.querySelector('.pagination-gap')).toBeNull();
  },
};

/** The short form, for an endless or cursor-paged list: Previous, the range and Next, at every width. */
export const WithoutNumbers: Story = {
  args: { page: 3, rangeLabel: range(3), hasPageNumbers: false },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector('.pagination-page')).toBeNull();
    const previous = rect(step(canvasElement, 'previous'));
    const next = rect(step(canvasElement, 'next'));
    const shown = rect(find(canvasElement, '.pagination-range'));
    await expect(previous.right).toBeLessThanOrEqual(shown.left);
    await expect(shown.right).toBeLessThanOrEqual(next.left);
  },
};

/** Under 30rem of its own width: Previous, the centered range and Next, two chevron circles. */
export const Narrow: Story = {
  args: { page: 12, rangeLabel: range(12) },
  decorators: [
    (Story) => (
      <div style={{ width: '20rem', maxWidth: '100%' }}>
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    for (const page of canvasElement.querySelectorAll('.pagination-page')) {
      await expect(page).not.toBeVisible();
    }
    const previous = rect(step(canvasElement, 'previous'));
    const next = rect(step(canvasElement, 'next'));
    await expect(previous.width).toBe(40);
    await expect(previous.height).toBe(40);
    await expect(next.width).toBe(40);
    const shown = rect(find(canvasElement, '.pagination-range'));
    await expect(previous.right).toBeLessThanOrEqual(shown.left);
    await expect(shown.right).toBeLessThanOrEqual(next.left);
    // The words stay the steps' names.
    await expect(step(canvasElement, 'next')).toHaveAccessibleName('Next');
  },
};

/** Whether `element` scrolls sideways: its content is wider than its box. */
const overflows = (element: Element): boolean => element.scrollWidth > element.clientWidth;

/**
 * Just above 30rem, at 31rem: the numbers stay and the step words become hidden names, so the row fits. Three
 * rows: comfortable, a coarse pointer's 44px compact control (set on the wrapper, since the runner has no
 * coarse pointer), and the same with two siblings, whose wordless row is still wider than 31rem and wraps to
 * the inline end inside the nav. None scrolls sideways, and neither does the page.
 */
export const JustAboveNarrow: Story = {
  tags: ['no-visual'],
  decorators: [
    (Story) => (
      <div style={{ width: '31rem', maxWidth: 'none' }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      <div data-row="comfortable">
        <Pagination {...args} labels={{ navigation: 'Comfortable pages' }} />
      </div>
      <div data-row="coarse" style={{ '--size-control': '44px' } as CSSProperties}>
        <Pagination {...args} labels={{ navigation: 'Coarse pages' }} />
      </div>
      <div data-row="coarse-siblings" style={{ '--size-control': '44px' } as CSSProperties}>
        <Pagination {...args} siblingCount={2} labels={{ navigation: 'Coarse pages with two siblings' }} />
      </div>
    </div>
  ),
  args: { page: 12, rangeLabel: range(12) },
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('[data-row]')];
    await expect(rows).toHaveLength(3);
    for (const row of rows) {
      const nav = find(row, '.pagination');
      await expect(rect(nav).width).toBe(31 * 16);
      await expect(overflows(row)).toBe(false);
      await expect(overflows(nav)).toBe(false);
      await expect(overflows(find(row, '.pagination-row'))).toBe(false);
      // Every control is drawn inside the nav.
      const bounds = rect(nav);
      for (const control of row.querySelectorAll('.pagination-control')) {
        await expect(rect(control).left).toBeGreaterThanOrEqual(bounds.left);
        await expect(rect(control).right).toBeLessThanOrEqual(bounds.right);
      }
      // The numbers stay; the steps are chevron circles named by their hidden words.
      await expect(pageControl(row, '12')).toBeVisible();
      const next = step(row, 'next');
      await expect(rect(next).width).toBe(rect(next).height);
      await expect(next).toHaveAccessibleName('Next');
    }
    await expect(rect(step(find(canvasElement, '[data-row="coarse"]'), 'next')).width).toBe(44);
    await expect(overflows(document.documentElement)).toBe(false);
  },
};

/** Tab into the row on the first page: focus lands on the current page, whose ring inverts to canvas inside it. */
export const KeyboardFocus: Story = {
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    const current = pageControl(canvasElement, '1');
    await expect(current).toHaveFocus();
    await expect(current).toHaveAttribute('data-focus-visible', 'true');
    const style = getComputedStyle(current);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor('--color-canvas'));
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
  },
};

/**
 * Right to left, page 3 of 12, with Persian digits, labels and range: the list runs from the right, so Previous
 * is the rightmost control, and its chevron points right, the way it goes.
 */
export const RightToLeft: Story = {
  args: {
    page: 3,
    pageCount: 12,
    rangeLabel: `${persian(101)} تا ${persian(150)} از ${persian('1٬284')}`,
    pageLabel: persian,
    labels: {
      navigation: 'صفحه‌ها',
      previous: 'قبلی',
      next: 'بعدی',
      page: (label: string) => `صفحه ${label}`,
    },
  },
  decorators: [
    (Story) => (
      <div dir="rtl" lang="fa">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const previous = step(canvasElement, 'previous');
    const controls = [...canvasElement.querySelectorAll<HTMLElement>('.pagination-control')];
    const rightmost = controls.reduce((best, each) => (rect(each).right > rect(best).right ? each : best));
    await expect(rightmost).toBe(previous);
    await expect(getComputedStyle(find(previous, 'svg')).scale).toBe('-1 1');
    await expect(pageControl(canvasElement, '۳')).toHaveAccessibleName('صفحه ۳');
  },
};

/** Three quick presses of Next say one range, the third, once the presses have paused; nothing before. */
export const SpokenRange: Story = {
  tags: ['no-visual'],
  render: () => <Paged initial={1} pageCount={26} />,
  play: async ({ canvasElement, userEvent }) => {
    const status = find(canvasElement, '[role="status"]');
    await expect(status).toBeEmptyDOMElement();
    step(canvasElement, 'next').focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard('{Enter}');
    await expect(pageControl(canvasElement, '4')).toHaveAttribute('aria-current', 'true');
    await expect(status).toBeEmptyDOMElement();
    await waitFor(() => expect(status).toHaveTextContent(range(4)), { timeout: 2000 });
    await expect(status.textContent).toBe(range(4));
  },
};

/** Next on page 4 of 5: it disables as the last page arrives, and focus moves to the current page. */
export const FocusHandOff: Story = {
  tags: ['no-visual'],
  render: () => <Paged initial={4} />,
  play: async ({ canvasElement, userEvent }) => {
    step(canvasElement, 'next').focus();
    await userEvent.keyboard('{Enter}');
    await expect(step(canvasElement, 'next')).toBeDisabled();
    await expect(pageControl(canvasElement, '5')).toHaveFocus();
  },
};

/**
 * The same in the narrow row, where the current page is hidden and cannot take focus: focus goes to the other
 * step instead of falling to the page.
 */
export const FocusHandOffNarrow: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ width: '20rem' }}>
      <Paged initial={4} />
    </div>
  ),
  play: async ({ canvasElement, userEvent }) => {
    step(canvasElement, 'next').focus();
    await userEvent.keyboard('{Enter}');
    await expect(step(canvasElement, 'next')).toBeDisabled();
    await expect(pageControl(canvasElement, '5')).not.toBeVisible();
    await expect(step(canvasElement, 'previous')).toHaveFocus();
  },
};

/** Under the pointer a control takes the 5% ink wash; the current page and a disabled step take none. */
export const HoverWash: Story = {
  tags: ['no-visual'],
  play: async ({ canvasElement, userEvent }) => {
    const two = pageControl(canvasElement, '2');
    await userEvent.hover(two);
    await expect(getComputedStyle(two).backgroundColor).toBe(washColor(canvasElement));
    const current = pageControl(canvasElement, '1');
    await userEvent.hover(current);
    await expect(getComputedStyle(current).backgroundColor).toBe(tokenColor('--color-ink'));
    const previous = step(canvasElement, 'previous');
    await userEvent.hover(previous);
    await expect(getComputedStyle(previous).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await userEvent.unhover(previous);
  },
};

/** Compact: a control is drawn at 36px (44px on a coarse pointer) and still hit at the 40px target. */
export const CompactHitArea: Story = {
  tags: ['no-visual'],
  decorators: [
    (Story) => (
      <div data-density="compact">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    const two = pageControl(canvasElement, '2');
    const size = parseFloat(getComputedStyle(two).getPropertyValue('--size-control'));
    await expect([36, 44]).toContain(size);
    await expect(rect(two).height).toBe(size);
    const hit = parseFloat(getComputedStyle(two, '::before').height);
    await expect(hit).toBe(Math.max(size, tokenPixels('--size-target')));
  },
};
