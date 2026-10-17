import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor } from 'storybook/test';
import { RouterProvider } from '../link';
import { focusOn } from '../stories/focus';
import { PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { Breadcrumb, Breadcrumbs, type BreadcrumbsProps } from './Breadcrumbs';

const noop = (): void => undefined;

/** Home, Documents and the current page. */
const TRAIL: ReactNode = [
  <Breadcrumb key="home" href="#home">
    Home
  </Breadcrumb>,
  <Breadcrumb key="documents" href="#documents">
    Documents
  </Breadcrumb>,
  <Breadcrumb key="receipts">Receipts, 2026</Breadcrumb>,
];

/** The router every story navigates through, so a press never leaves the frame. */
function Routed({
  children,
  navigate = noop,
}: {
  children: ReactNode;
  navigate?: (href: string) => void;
}): ReactElement {
  return <RouterProvider navigate={navigate}>{children}</RouterProvider>;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** Whether the viewport is under the small breakpoint, 768px, where the trail is one back link. */
const isPhone = (): boolean => window.innerWidth < 768;

const meta = {
  title: 'Components/Breadcrumbs',
  component: Breadcrumbs,
  args: { children: TRAIL },
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  render: (args) => (
    <Routed>
      <Breadcrumbs {...args} />
    </Routed>
  ),
} satisfies Meta<BreadcrumbsProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three crumbs: slate links with chevrons and the current page in ink; at 375, one "Back to Documents" link. */
export const Trail: Story = {
  play: async ({ canvas, canvasElement }) => {
    const list = find(canvasElement, '.breadcrumbs-list');
    const back = find(canvasElement, '.breadcrumbs-back');
    if (isPhone()) {
      await expect(getComputedStyle(list).display).toBe('none');
      await expect(canvas.getByRole('link', { name: 'Back to Documents' })).toBe(back);
    } else {
      await expect(getComputedStyle(back).display).toBe('none');
      await expect(canvas.getAllByRole('link').map((link) => link.textContent)).toEqual([
        'Home',
        'Documents',
      ]);
      // The current page is ink at 500; the links are slate at 450.
      const current = find(canvasElement, '.breadcrumbs-current');
      await expect(getComputedStyle(current).fontWeight).toBe('500');
      const link = find(canvasElement, '.breadcrumbs-link');
      await expect(getComputedStyle(link).fontWeight).toBe('450');
      await expect(getComputedStyle(link).color).not.toBe(getComputedStyle(current).color);
    }
  },
};

/** The long words of a trail: six crumbs, one past 16rem, which ellipsizes; in a narrow box the trail wraps. */
export const LongTrail: Story = {
  args: {
    children: [
      <Breadcrumb key="home" href="#home">
        Home
      </Breadcrumb>,
      <Breadcrumb key="accounts" href="#accounts">
        Accounts
      </Breadcrumb>,
      <Breadcrumb key="household" href="#household">
        The household account we share with the whole family and the lodger
      </Breadcrumb>,
      <Breadcrumb key="documents" href="#documents">
        Documents
      </Breadcrumb>,
      <Breadcrumb key="receipts" href="#receipts">
        Receipts
      </Breadcrumb>,
      <Breadcrumb key="year">2026</Breadcrumb>,
    ],
  },
  render: (args) => (
    <Routed>
      <div style={{ width: 'min(36rem, 100%)' }}>
        <Breadcrumbs {...args} />
      </div>
    </Routed>
  ),
  play: async ({ canvasElement }) => {
    const nav = find(canvasElement, '.breadcrumbs');
    // Nothing runs out of the box, at any width.
    await expect(nav.scrollWidth).toBeLessThanOrEqual(nav.clientWidth);
    if (isPhone()) return;
    const texts = [...canvasElement.querySelectorAll<HTMLElement>('.breadcrumbs-list .breadcrumbs-text')];
    const long = texts.find((text) => text.textContent.startsWith('The household'));
    if (!long) throw new Error('No long crumb');
    // Cut at 16rem with an ellipsis, its whole text in the title and the link's name.
    await expect(rect(long).width).toBeLessThanOrEqual(256.5);
    await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
    await expect(long).toHaveAttribute('title', long.textContent);
    // Wrapped onto a second line, a target apart from the first.
    const tops = [...new Set(texts.map((text) => Math.round(rect(text).top)))];
    await expect(tops.length).toBeGreaterThan(1);
    const [first, second] = tops;
    if (first === undefined || second === undefined) throw new Error('Two lines');
    await expect(second - first).toBeCloseTo(40, 0);
  },
};

/** A Persian trail: it reads from the right, its chevrons and the back link's chevron pointing left and right. */
export const RightToLeft: Story = {
  render: () => (
    <Routed>
      <I18nProvider locale="fa-IR">
        <div dir="rtl" lang="fa">
          <Breadcrumbs aria-label="مسیر" backLabel={(parent) => `بازگشت به ${parent}`}>
            <Breadcrumb href="#home">خانه</Breadcrumb>
            <Breadcrumb href="#documents">اسناد</Breadcrumb>
            <Breadcrumb>رسیدها، ۱۴۰۵</Breadcrumb>
          </Breadcrumbs>
        </div>
      </I18nProvider>
    </Routed>
  ),
  play: async ({ canvasElement }) => {
    if (isPhone()) {
      // The back chevron points right, back along a trail that reads from the right.
      const chevron = find(canvasElement, '.breadcrumbs-back svg');
      await expect(getComputedStyle(chevron).scale).toBe('-1 1');
      return;
    }
    const [home, documents] = [...canvasElement.querySelectorAll('.breadcrumbs-link')];
    if (!home || !documents) throw new Error('Two links');
    await expect(rect(home).left).toBeGreaterThan(rect(documents).right);
    await expect(getComputedStyle(find(canvasElement, '.breadcrumbs-separator svg')).scale).toBe('-1 1');
  },
};

// ---- Checks, not shot ------------------------------------------------------------------------------------------

/** Tab goes from Home to Documents and out: the current page is not a stop. */
export const CurrentNotAStop: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <Routed>
      <button type="button">Before</button>
      <Breadcrumbs {...args} />
      <button type="button">After</button>
    </Routed>
  ),
  play: async ({ canvas }) => {
    const before = canvas.getByRole('button', { name: 'Before' });
    await focusOn(before);
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole('link', { name: 'Home' })).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole('link', { name: 'Documents' })).toHaveFocus());
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus());
  },
};

/** At 375 the landmark keeps its name and holds one link, named "Back to" the parent, to the parent's page. */
export const BackLinkName: Story = {
  tags: ['no-visual', 'viewport-phone'],
  globals: PHONE,
  play: async ({ canvas, canvasElement }) => {
    const nav = canvas.getByRole('navigation', { name: 'Breadcrumbs' });
    await expect(canvas.getAllByRole('link')).toHaveLength(1);
    const back = canvas.getByRole('link', { name: 'Back to Documents' });
    await expect(back).toHaveAttribute('href', '#documents');
    await expect(nav).toContainElement(back);
    // Hit at 40px tall: a point 15px below the text's middle still lands on the link.
    const box = rect(find(back, '.breadcrumbs-text'));
    const hit = document.elementFromPoint(box.left + 4, box.top + box.height / 2 + 15);
    await expect(back.contains(hit)).toBe(true);
    await expect(find(canvasElement, '.breadcrumbs-list')).not.toBeVisible();
  },
};

/** With one crumb there is no parent: at 375 the landmark is not drawn at all, so it is never an empty one. */
export const OneCrumbPhone: Story = {
  tags: ['no-visual', 'viewport-phone'],
  globals: PHONE,
  args: { children: <Breadcrumb>Documents</Breadcrumb> },
  play: async ({ canvas, canvasElement }) => {
    await expect(getComputedStyle(find(canvasElement, '.breadcrumbs')).display).toBe('none');
    await expect(canvas.queryByRole('navigation')).toBeNull();
  },
};

/** The router's navigate, read by RouterNavigation. */
const navigate = fn();

/** A press and Enter on a crumb go through the RouterProvider with its href; each link is hit at 40px tall. */
export const RouterNavigation: Story = {
  tags: ['no-visual'],
  args: { children: TRAIL },
  render: (args) => (
    <Routed navigate={navigate}>
      <Breadcrumbs {...args} />
    </Routed>
  ),
  play: async ({ canvas }) => {
    navigate.mockClear();
    const documents = canvas.getByRole('link', { name: 'Documents' });
    const box = rect(documents);
    // 15px below the text's middle is still the link: the ::after reaches 10px past the 20px line.
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2 + 15);
    await expect(documents.contains(hit)).toBe(true);
    await userEvent.click(documents);
    await expect(navigate).toHaveBeenCalledTimes(1);
    await expect(navigate.mock.calls[0]?.[0]).toBe('#documents');
    await focusOn(canvas.getByRole('link', { name: 'Home' }));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(navigate).toHaveBeenCalledTimes(2));
    await expect(navigate.mock.calls[1]?.[0]).toBe('#home');
  },
};
