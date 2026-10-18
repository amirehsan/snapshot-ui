import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
    // The nav holds the box, the size container, around the row the narrow query re-lays, and then the status
    // region; it carries the range for the width it offers a parent that sizes it from its content.
    expect([...nav.children].map((child) => child.className)).toEqual([
      'pagination-box',
      'pagination-status',
    ]);
    expect(nav).toHaveAttribute('data-range', '1 to 50 of 1,284');
    const box = nav.firstElementChild;
    if (!box) throw new Error('No box');
    expect([...box.children].map((child) => child.className)).toEqual(['pagination-row']);
    const rowElement = box.firstElementChild;
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
    expect(warn).toHaveBeenCalledWith('Pagination: page 0 is not a page of 1 to 26; showing page 1.');
    rerender(<Pagination page={0} pageCount={26} rangeLabel={range(1)} getPageHref={href} />);
    rerender(<Pagination page={40} pageCount={26} rangeLabel={range(26)} getPageHref={href} />);
    expect(screen.getByRole('link', { name: 'Page 26' })).toHaveAttribute('aria-current', 'page');
    expect(warn).toHaveBeenCalledOnce();
    // A page inside the range says nothing.
    warn.mockClear();
    render(<Pagination page={3} pageCount={26} rangeLabel={range(3)} getPageHref={href} />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('says a page that is not a whole number, or a range with no pages, in its warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const half = render(<Pagination page={2.5} pageCount={26} rangeLabel={range(2)} getPageHref={href} />);
    expect(screen.getByRole('link', { name: 'Page 2' })).toHaveAttribute('aria-current', 'page');
    expect(warn).toHaveBeenCalledWith('Pagination: page 2.5 is not a page of 1 to 26; showing page 2.');
    half.unmount();
    warn.mockClear();
    render(<Pagination page={3} pageCount={0} rangeLabel="No rows" getPageHref={href} />);
    expect(warn).toHaveBeenCalledWith(
      'Pagination: page 3 is not a page, since there are no pages; showing the range alone.',
    );
  });

  it('cleans pageCount and siblingCount once, and uses the clean values everywhere', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    // A fractional count is its whole pages: 25, so page 25 is the last and Next goes nowhere.
    const fraction = render(
      <Pagination page={25} pageCount={25.5} rangeLabel={range(25)} getPageHref={href} />,
    );
    expect(row()).toEqual(['Previous', '1', '…', '21', '22', '23', '24', '25', 'Next']);
    expect(screen.getByRole('link', { name: 'Page 25' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Next' })).toHaveAttribute('aria-disabled', 'true');
    expect(warn).not.toHaveBeenCalled();
    fraction.unmount();
    // A count that is not a finite number is no pages: the range alone, and nothing to warn about on page 1.
    for (const pageCount of [Number.NaN, Number.POSITIVE_INFINITY]) {
      const { container, unmount } = render(
        <Pagination page={1} pageCount={pageCount} rangeLabel="No rows" getPageHref={href} />,
      );
      expect(container.querySelector('.pagination-list')).toBeNull();
      expect(container.querySelector('.pagination-range')).toHaveTextContent('No rows');
      unmount();
    }
    expect(warn).not.toHaveBeenCalled();
    // A siblingCount that is not a finite number is the default, 1.
    render(
      <Pagination
        page={12}
        pageCount={26}
        rangeLabel={range(12)}
        getPageHref={href}
        siblingCount={Number.NaN}
      />,
    );
    expect(row()).toEqual(['Previous', '1', '…', '11', '12', '13', '…', '26', 'Next']);
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

  it('forgets its focus when focus leaves to nowhere while the step is still enabled', () => {
    for (const mode of ['link', 'button'] as const) {
      const view = (page: number): ReactElement =>
        mode === 'link' ? (
          <Pagination page={page} pageCount={5} rangeLabel={range(page)} getPageHref={href} />
        ) : (
          <Pagination page={page} pageCount={5} rangeLabel={range(page)} onPageChange={() => undefined} />
        );
      const { rerender, unmount } = render(view(4));
      const next = screen.getByRole(mode, { name: 'Next' });
      next.focus();
      expect(next).toHaveFocus();
      // A click on the page around it: focus goes to nothing, and the step is still there and enabled.
      act(() => {
        next.blur();
      });
      expect(document.body).toHaveFocus();
      // Next disables later, by some other route: focus is not pulled back into the row.
      rerender(view(5));
      expect(screen.getByRole(mode, { name: 'Page 5' })).not.toHaveFocus();
      expect(document.body).toHaveFocus();
      unmount();
    }
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

/** Rows of `total` in pages whose size and page the caller holds, as a client page does in its URL. */
function Sized({
  total = 240,
  initialPage = 1,
  initialSize = 25,
  onChange,
  ...props
}: {
  total?: number;
  initialPage?: number;
  initialSize?: number;
  onChange?: (size: number, page: number) => void;
} & Partial<PaginationProps>): ReactElement {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const first = (page - 1) * size + 1;
  return (
    <Pagination
      {...(props as object)}
      page={page}
      pageCount={Math.ceil(total / size)}
      rangeLabel={`${String(first)} to ${String(Math.min(page * size, total))} of ${String(total)}`}
      onPageChange={setPage}
      pageSize={size}
      onPageSizeChange={(next, nextPage) => {
        onChange?.(next, nextPage);
        setSize(next);
        setPage(nextPage);
      }}
    />
  );
}

/** The picker: the native select named by its label. */
const sizePicker = (): HTMLSelectElement => {
  const select = document.querySelector<HTMLSelectElement>('.pagination-size select');
  if (select === null) throw new Error('No page size picker');
  return select;
};

/** The texts of the picker's options, in order. */
const optionTexts = (): string[] => [...sizePicker().options].map((option) => option.textContent);

describe('Pagination page size', () => {
  it('draws no picker without onPageSizeChange', () => {
    render(<Pagination page={1} pageCount={5} rangeLabel={range(1)} onPageChange={() => undefined} />);
    expect(document.querySelector('.pagination-size')).toBeNull();
  });

  it('draws a native select labelled Rows per page, first in the row, showing the size', () => {
    render(<Sized />);
    const row = document.querySelector('.pagination-row');
    const picker = row?.children[0];
    expect(picker).toHaveClass('pagination-size');
    expect(row?.children[1]).toHaveClass('pagination-range');
    // A visible label tied to the select by for and id, which names it; the select shows the size.
    const label = within(picker as HTMLElement).getByText('Rows per page');
    expect(label).toBeVisible();
    expect(label.tagName).toBe('LABEL');
    expect(sizePicker().id).not.toBe('');
    expect(label).toHaveAttribute('for', sizePicker().id);
    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toBe(sizePicker());
    expect(sizePicker()).toHaveValue('25');
    expect(sizePicker()).toHaveClass('input', 'pagination-size-select');
    // Its chevron is drawn and hidden from assistive technology.
    expect(picker?.querySelector('.pagination-size-chevron')).toHaveAttribute('aria-hidden', 'true');
    // Inside the navigation landmark, beside the range.
    expect(screen.getByRole('navigation', { name: 'Pagination' }).contains(sizePicker())).toBe(true);
  });

  it('offers 10, 25, 50 and 100 by default, or pageSizeOptions, written with pageLabel', () => {
    const { unmount } = render(<Sized />);
    expect(optionTexts()).toEqual(['10', '25', '50', '100']);
    expect([...sizePicker().options].map((option) => option.value)).toEqual(['10', '25', '50', '100']);
    unmount();
    render(<Sized initialSize={20} pageSizeOptions={[50, 20, 10]} pageLabel={persian} />);
    expect(optionTexts()).toEqual(['۱۰', '۲۰', '۵۰']);
    expect(sizePicker()).toHaveValue('20');
  });

  it('always offers the current size, among the options in order', () => {
    render(<Sized initialSize={30} pageSizeOptions={[10, 25, 50]} />);
    expect(optionTexts()).toEqual(['10', '25', '30', '50']);
    expect(sizePicker()).toHaveValue('30');
  });

  it('calls onPageSizeChange with the size and the page that keeps the first row in view', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Sized initialPage={3} onChange={onChange} />);
    expect(screen.getByText('51 to 75 of 240')).toBeInTheDocument();
    await user.selectOptions(sizePicker(), '10');
    expect(onChange).toHaveBeenLastCalledWith(10, 6);
    expect(screen.getByText('51 to 60 of 240')).toBeInTheDocument();
    expect(sizePicker()).toHaveValue('10');
    await user.selectOptions(sizePicker(), '100');
    expect(onChange).toHaveBeenLastCalledWith(100, 1);
    // The same size again calls nothing.
    await user.selectOptions(sizePicker(), '100');
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('chooses a size from the keyboard, keeping focus on the picker', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Sized onChange={onChange} />);
    const select = sizePicker();
    await user.tab();
    expect(select).toHaveFocus();
    await user.selectOptions(select, '50');
    expect(onChange).toHaveBeenLastCalledWith(50, 1);
    // The same element, kept across the render the new size brings.
    expect(sizePicker()).toBe(select);
    expect(select).toHaveFocus();
  });

  it('imports nothing from React Aria, nor the library Select', () => {
    const source = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'PaginationPageSize.tsx'),
      'utf8',
    );
    expect(source).not.toContain('react-aria-components');
    expect(source).not.toMatch(/from '\.\.\/(select|picker)\//);
  });

  it('says the new range politely once it has settled', () => {
    vi.useFakeTimers();
    const { rerender } = render(
      <Pagination
        page={1}
        pageCount={10}
        rangeLabel="1 to 25 of 240"
        onPageChange={() => undefined}
        pageSize={25}
        onPageSizeChange={() => undefined}
      />,
    );
    const status = screen.getByRole('status');
    rerender(
      <Pagination
        page={1}
        pageCount={24}
        rangeLabel="1 to 10 of 240"
        onPageChange={() => undefined}
        pageSize={10}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(status).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(status).toHaveTextContent('1 to 10 of 240');
  });

  it('takes the label from labels.pageSize, and works in link mode from a client page', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Pagination
        page={2}
        pageCount={10}
        rangeLabel="26 to 50 of 240"
        getPageHref={href}
        pageSize={25}
        onPageSizeChange={onChange}
        labels={{ pageSize: 'Rows' }}
      />,
    );
    expect(sizePicker()).toHaveAccessibleName('Rows');
    expect(
      within(sizePicker().closest<HTMLElement>('.pagination-size') ?? document.body).getByText('Rows'),
    ).toBeVisible();
    await user.selectOptions(sizePicker(), '50');
    expect(onChange).toHaveBeenLastCalledWith(50, 1);
  });

  it('draws the picker with one page or none, so the size can still change', () => {
    render(
      <Pagination
        page={1}
        pageCount={1}
        rangeLabel="1 to 12 of 12"
        onPageChange={() => undefined}
        pageSize={25}
        onPageSizeChange={() => undefined}
      />,
    );
    expect(document.querySelector('.pagination-size')).not.toBeNull();
    expect(document.querySelector('.pagination-list')).toBeNull();
  });

  it('has no axe violations with the picker, in English and in Persian', async () => {
    const { container, unmount } = render(<Sized initialPage={2} />);
    await expectNoA11yViolations(container);
    unmount();
    const persianPage = render(
      <div dir="rtl" lang="fa">
        <Sized initialPage={2} pageLabel={persian} labels={{ pageSize: 'ردیف در هر صفحه' }} />
      </div>,
    );
    await expectNoA11yViolations(persianPage.container);
  });

  it('takes pageSize and onPageSizeChange together or neither, in its types', () => {
    const base = { page: 1, pageCount: 2, rangeLabel: '', getPageHref: href };
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error onPageSizeChange needs the size it changes
    const noSize = <Pagination {...base} onPageSizeChange={() => undefined} />;
    // @ts-expect-error a size with no way to change it draws no picker
    const noChange = <Pagination {...base} pageSize={25} />;
    // @ts-expect-error options without the rest
    const onlyOptions = <Pagination {...base} pageSizeOptions={[10]} />;
    expect([noSize, noChange, onlyOptions]).toHaveLength(3);
  });
});
