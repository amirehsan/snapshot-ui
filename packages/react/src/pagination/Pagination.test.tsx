import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { RouterProvider } from '../link';
import { Pagination, type PaginationProps } from '.';

const href = (page: number): string => `?page=${String(page)}`;

/** The range of a page of 50 rows out of 1,284, as an app would format it. */
const range = (page: number): string => {
  const first = (page - 1) * 50 + 1;
  return `${String(first)} to ${String(Math.min(page * 50, 1284))} of 1,284`;
};

/** Persian digits, written without Intl, as the docs' example writes them. */
const persian = (page: number): string =>
  String(page).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);

/** The visible text of every control and gap in the list, in order. */
const row = (): string[] =>
  [...document.querySelectorAll('.pagination-item')].map((item) => item.textContent);

/** Button mode as a client component holds it: the page in state. */
function Paged({
  initial,
  pageCount = 5,
  ...props
}: { initial: number; pageCount?: number } & Partial<PaginationProps>): ReactElement {
  const [page, setPage] = useState(initial);
  return (
    <Pagination
      {...(props as object)}
      page={page}
      pageCount={pageCount}
      rangeLabel={range(page)}
      onPageChange={setPage}
    />
  );
}

/** Link mode as an app with the page in its URL renders it: the router sets the page the server would read. */
function Linked({ initial, pageCount = 5 }: { initial: number; pageCount?: number }): ReactElement {
  const [page, setPage] = useState(initial);
  return (
    <RouterProvider
      navigate={(path) => {
        setPage(Number(new URLSearchParams(path).get('page')));
      }}
    >
      <Pagination page={page} pageCount={pageCount} rangeLabel={range(page)} getPageHref={href} />
    </RouterProvider>
  );
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Pagination', () => {
  it('is a navigation named Pagination, or labels.navigation, with the range shown', () => {
    const { container, rerender } = render(
      <Pagination page={1} pageCount={26} rangeLabel="1 to 50 of 1,284" getPageHref={href} />,
    );
    const nav = screen.getByRole('navigation', { name: 'Pagination' });
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('pagination');
    // The nav holds the row, which the narrow query re-lays, and then the status region.
    expect([...nav.children].map((child) => child.className)).toEqual([
      'pagination-row',
      'pagination-status',
    ]);
    const rowElement = nav.firstElementChild;
    if (!rowElement) throw new Error('No row');
    expect([...rowElement.children].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'P pagination-range',
      'OL pagination-list',
    ]);
    expect(container.querySelector('.pagination-range')).toHaveTextContent('1 to 50 of 1,284');
    const items = [...container.querySelectorAll('.pagination-item')];
    expect(items.map((item) => item.tagName)).toEqual(Array(9).fill('LI'));
    expect(items.map((item) => item.getAttribute('data-kind'))).toEqual([
      'step',
      'page',
      'page',
      'page',
      'page',
      'page',
      'gap',
      'page',
      'step',
    ]);
    expect(row()).toEqual(['Previous', '1', '2', '3', '4', '5', '…', '26', 'Next']);
    const gap = container.querySelector('.pagination-gap');
    expect(gap?.tagName).toBe('SPAN');
    expect(gap).toHaveAttribute('aria-hidden', 'true');
    rerender(
      <Pagination
        page={1}
        pageCount={26}
        rangeLabel="1 to 50 of 1,284"
        getPageHref={href}
        labels={{ navigation: 'Transactions pages' }}
      />,
    );
    expect(screen.getByRole('navigation', { name: 'Transactions pages' })).toBe(nav);
  });

  it('links each page to getPageHref, and marks the current one aria-current page', () => {
    render(<Pagination page={12} pageCount={26} rangeLabel={range(12)} getPageHref={href} />);
    expect(row()).toEqual(['Previous', '1', '…', '11', '12', '13', '…', '26', 'Next']);
    for (const page of [1, 11, 12, 13, 26]) {
      const link = screen.getByRole('link', { name: `Page ${String(page)}` });
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href', href(page));
      expect(link).toHaveClass('pagination-control', 'pagination-page');
    }
    const current = screen.getByRole('link', { name: 'Page 12' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(document.querySelectorAll('[aria-current]')).toHaveLength(1);
    const previous = screen.getByRole('link', { name: 'Previous' });
    const next = screen.getByRole('link', { name: 'Next' });
    expect(previous).toHaveAttribute('href', href(11));
    expect(next).toHaveAttribute('href', href(13));
    for (const [step, name] of [
      [previous, 'previous'],
      [next, 'next'],
    ] as const) {
      expect(step).toHaveClass('pagination-control', 'pagination-step');
      expect(step).toHaveAttribute('data-step', name);
      expect(step.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      expect(step.querySelector('.pagination-step-label')).toHaveTextContent(
        name === 'next' ? 'Next' : 'Previous',
      );
    }
    // Previous points back and Next forward, by Lucide's chevron geometry.
    expect(previous.querySelector('path')).toHaveAttribute('d', 'm15 18-6-6 6-6');
    expect(next.querySelector('path')).toHaveAttribute('d', 'm9 18 6-6-6-6');
  });

  it('names each page control Page and its label, which contains the visible text', () => {
    const { rerender } = render(
      <Pagination page={3} pageCount={12} rangeLabel={range(3)} getPageHref={href} pageLabel={persian} />,
    );
    const three = screen.getByRole('link', { name: 'Page ۳' });
    expect(three).toHaveTextContent(/^۳$/);
    expect(three).toHaveAttribute('aria-current', 'page');
    expect(three).toHaveAttribute('href', '?page=3');
    expect(row()).toEqual(['Previous', '۱', '۲', '۳', '۴', '۵', '…', '۱۲', 'Next']);
    rerender(
      <Pagination
        page={3}
        pageCount={12}
        rangeLabel={range(3)}
        getPageHref={href}
        pageLabel={persian}
        labels={{ page: (label) => `صفحه ${label}`, previous: 'قبلی', next: 'بعدی' }}
      />,
    );
    expect(screen.getByRole('link', { name: 'صفحه ۳' })).toBe(three);
    expect(screen.getByRole('link', { name: 'قبلی' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'بعدی' })).toBeInTheDocument();
  });

  it('disables Previous on the first page and Next on the last, with no href and no tab stop', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Pagination page={1} pageCount={5} rangeLabel={range(1)} getPageHref={href} />,
    );
    const previous = screen.getByRole('link', { name: 'Previous' });
    expect(previous.tagName).toBe('SPAN');
    expect(previous).not.toHaveAttribute('href');
    expect(previous).toHaveAttribute('aria-disabled', 'true');
    expect(previous).toHaveAttribute('data-disabled', 'true');
    expect(previous).not.toHaveAttribute('tabindex');
    await user.tab();
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveFocus();
    rerender(<Pagination page={5} pageCount={5} rangeLabel={range(5)} getPageHref={href} />);
    const next = screen.getByRole('link', { name: 'Next' });
    expect(next.tagName).toBe('SPAN');
    expect(next).not.toHaveAttribute('href');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', href(4));
    // Button mode: the native disabled state, which also leaves the tab order.
    rerender(<Pagination page={5} pageCount={5} rangeLabel={range(5)} onPageChange={() => undefined} />);
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });

  it('calls onPageChange with the page in button mode, marks the current one aria-current true, and calls nothing for it', async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn<(page: number) => void>();
    render(<Pagination page={12} pageCount={26} rangeLabel={range(12)} onPageChange={onPageChange} />);
    expect(screen.queryAllByRole('link')).toEqual([]);
    const current = screen.getByRole('button', { name: 'Page 12' });
    expect(current).toHaveAttribute('aria-current', 'true');
    expect(current).toHaveAttribute('type', 'button');
    await user.click(current);
    expect(onPageChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Page 26' }));
    expect(onPageChange).toHaveBeenLastCalledWith(26);
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    expect(onPageChange).toHaveBeenLastCalledWith(11);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(onPageChange).toHaveBeenLastCalledWith(13);
    screen.getByRole('button', { name: 'Page 11' }).focus();
    await user.keyboard(' ');
    expect(onPageChange).toHaveBeenLastCalledWith(11);
    await user.keyboard('{Enter}');
    expect(onPageChange).toHaveBeenCalledTimes(5);
  });

  it('routes a page link through RouterProvider', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn<(path: string) => void>();
    render(
      <RouterProvider navigate={navigate}>
        <Pagination page={2} pageCount={5} rangeLabel={range(2)} getPageHref={href} />
      </RouterProvider>,
    );
    await user.click(screen.getByRole('link', { name: 'Page 4' }));
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate.mock.calls[0]?.[0]).toBe('?page=4');
    screen.getByRole('link', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    expect(navigate.mock.calls[1]?.[0]).toBe('?page=3');
    // A link takes Enter only, as a link in a browser does; Space is a button's key.
    await user.keyboard(' ');
    expect(navigate).toHaveBeenCalledTimes(2);
  });

  it('hides the numbers with hasPageNumbers false and keeps the steps', () => {
    const { container } = render(
      <Pagination page={3} pageCount={26} rangeLabel={range(3)} getPageHref={href} hasPageNumbers={false} />,
    );
    expect(row()).toEqual(['Previous', 'Next']);
    expect(container.querySelector('.pagination-page')).toBeNull();
    expect(container.querySelector('.pagination-gap')).toBeNull();
    expect(screen.getByRole('link', { name: 'Previous' })).toHaveAttribute('href', href(2));
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('href', href(4));
    // The short form is Previous, the range and Next at every width.
    expect(container.querySelector('.pagination-row')).toHaveAttribute('data-page-numbers', 'false');
    expect(container.querySelector('.pagination-range')).toHaveTextContent(range(3));
  });

  it('draws the range alone for one page or none', () => {
    const { container, rerender } = render(
      <Pagination page={1} pageCount={1} rangeLabel="1 to 12 of 12" getPageHref={href} />,
    );
    expect(container.querySelector('.pagination-list')).toBeNull();
    expect(container.querySelector('.pagination-range')).toHaveTextContent('1 to 12 of 12');
    expect(container.querySelector('[role="status"]')).toBeInTheDocument();
    rerender(<Pagination page={1} pageCount={0} rangeLabel="No rows" onPageChange={() => undefined} />);
    expect(container.querySelector('.pagination-list')).toBeNull();
    expect(container.querySelector('.pagination-range')).toHaveTextContent('No rows');
  });

  it('clamps an outside page and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(
      <Pagination page={0} pageCount={26} rangeLabel={range(1)} getPageHref={href} />,
    );
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(warn).toHaveBeenCalledOnce();
    expect(warn).toHaveBeenCalledWith('Pagination: page 0 is outside 1 to 26; showing page 1.');
    rerender(<Pagination page={0} pageCount={26} rangeLabel={range(1)} getPageHref={href} />);
    rerender(<Pagination page={40} pageCount={26} rangeLabel={range(26)} getPageHref={href} />);
    expect(screen.getByRole('link', { name: 'Page 26' })).toHaveAttribute('aria-current', 'page');
    expect(warn).toHaveBeenCalledOnce();
    // A page inside the range says nothing.
    warn.mockClear();
    render(<Pagination page={3} pageCount={26} rangeLabel={range(3)} getPageHref={href} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('leaves the status empty on first render, and in Strict Mode', () => {
    vi.useFakeTimers();
    const { container, unmount } = render(
      <Pagination page={2} pageCount={26} rangeLabel={range(2)} getPageHref={href} />,
    );
    const status = screen.getByRole('status');
    expect(status.tagName).toBe('SPAN');
    expect(status).toHaveClass('pagination-status');
    // The visible range is not live, so the range is read once, from the status.
    expect(container.querySelector('.pagination-range')).not.toHaveAttribute('aria-live');
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(status).toBeEmptyDOMElement();
    unmount();
    render(
      <StrictMode>
        <Pagination page={2} pageCount={26} rangeLabel={range(2)} getPageHref={href} />
      </StrictMode>,
    );
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('speaks the range 600ms after it last changed, once for three quick changes', () => {
    vi.useFakeTimers();
    const view = (page: number): ReactElement => (
      <StrictMode>
        <Pagination page={page} pageCount={26} rangeLabel={range(page)} getPageHref={href} />
      </StrictMode>
    );
    const { rerender } = render(view(1));
    const status = screen.getByRole('status');
    for (const page of [2, 3, 4]) {
      rerender(view(page));
      act(() => {
        vi.advanceTimersByTime(page === 4 ? 0 : 100);
      });
    }
    act(() => {
      vi.advanceTimersByTime(599);
    });
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(status).toHaveTextContent(range(4));
    expect(status.textContent).toBe(range(4));
  });

  it('speaks a range again when a later change returns to the first', () => {
    vi.useFakeTimers();
    const view = (page: number): ReactElement => (
      <Pagination page={page} pageCount={26} rangeLabel={range(page)} getPageHref={href} />
    );
    const { rerender } = render(view(1));
    const status = screen.getByRole('status');
    rerender(view(2));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(status).toHaveTextContent(range(2));
    rerender(view(1));
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(status).toHaveTextContent(range(1));
  });

  it('hands focus to the current page when Next disables while focused, in both modes', async () => {
    const user = userEvent.setup();
    const buttons = render(<Paged initial={4} />);
    screen.getByRole('button', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Page 5' })).toHaveFocus();
    buttons.unmount();

    const links = render(<Linked initial={4} />);
    screen.getByRole('link', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    // The link step is now a span, a new element: the anchor that held focus is gone.
    const next = screen.getByRole('link', { name: 'Next' });
    expect(next.tagName).toBe('SPAN');
    expect(next).toHaveAttribute('aria-disabled', 'true');
    const current = screen.getByRole('link', { name: 'Page 5' });
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveFocus();
    links.unmount();

    // Previous on reaching the first page hands on the same way.
    render(<Linked initial={2} />);
    within(screen.getByRole('navigation')).getByRole('link', { name: 'Previous' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('link', { name: 'Page 1' })).toHaveFocus();
  });

  it('hands focus to Previous when Next disables and the numbers are hidden', async () => {
    const user = userEvent.setup();
    render(<Paged initial={4} hasPageNumbers={false} />);
    screen.getByRole('button', { name: 'Next' }).focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Previous' })).toHaveFocus();
  });

  it('leaves focus where it went when a step disables after focus moved on', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Pagination page={4} pageCount={5} rangeLabel={range(4)} getPageHref={href} />,
    );
    screen.getByRole('link', { name: 'Next' }).focus();
    await user.tab({ shift: true });
    await user.tab({ shift: true });
    const four = screen.getByRole('link', { name: 'Page 4' });
    expect(four).toHaveFocus();
    rerender(<Pagination page={5} pageCount={5} rangeLabel={range(5)} getPageHref={href} />);
    expect(four).toHaveFocus();
  });

  it('passes className, ref and attributes to the nav', () => {
    const ref = createRef<HTMLElement>();
    render(
      <Pagination
        page={1}
        pageCount={3}
        rangeLabel={range(1)}
        getPageHref={href}
        ref={ref}
        className="table-pages"
        id="pages"
        data-testid="pages"
      />,
    );
    const nav = screen.getByRole('navigation');
    expect(ref.current).toBe(nav);
    expect(nav).toHaveClass('pagination', 'table-pages');
    expect(nav.className).toBe('pagination table-pages');
    expect(nav).toHaveAttribute('id', 'pages');
    expect(nav).toHaveAttribute('data-testid', 'pages');
  });

  it('has no axe violations in link mode, button mode, without numbers and on one page', async () => {
    const links = render(<Pagination page={12} pageCount={26} rangeLabel={range(12)} getPageHref={href} />);
    await expectNoA11yViolations(links.container);
    links.unmount();
    const buttons = render(
      <Pagination page={1} pageCount={26} rangeLabel={range(1)} onPageChange={() => undefined} />,
    );
    await expectNoA11yViolations(buttons.container);
    buttons.unmount();
    const short = render(
      <Pagination
        page={26}
        pageCount={26}
        rangeLabel={range(26)}
        getPageHref={href}
        hasPageNumbers={false}
      />,
    );
    await expectNoA11yViolations(short.container);
    short.unmount();
    const one = render(<Pagination page={1} pageCount={1} rangeLabel="1 to 12 of 12" getPageHref={href} />);
    await expectNoA11yViolations(one.container);
  });

  it('takes links or buttons, never both or neither, and no aria-label, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    const both = (
      // @ts-expect-error a control is a link or a button, not both
      <Pagination page={1} pageCount={2} rangeLabel="" getPageHref={href} onPageChange={() => undefined} />
    );
    // @ts-expect-error a control needs a place to go: getPageHref or onPageChange
    const neither = <Pagination page={1} pageCount={2} rangeLabel="" />;
    // JSX never refuses a hyphenated attribute it does not know, so the props are checked as an object.
    const named: PaginationProps = {
      page: 1,
      pageCount: 2,
      rangeLabel: '',
      getPageHref: href,
      // @ts-expect-error labels.navigation names the nav
      'aria-label': 'Pages',
    };
    const fine = <Pagination page={1} pageCount={2} rangeLabel="" getPageHref={href} />;
    expect([both, neither, named, fine]).toHaveLength(4);
  });
});
