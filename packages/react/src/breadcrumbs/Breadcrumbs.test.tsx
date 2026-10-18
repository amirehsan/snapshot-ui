import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, lazy, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { RouterProvider } from '../link';
import { PageHeader } from '../page-header';
import { Breadcrumb, Breadcrumbs, type BreadcrumbProps } from './Breadcrumbs';

/** Home, Documents and the current page, Receipts, 2026. */
const TRAIL: ReactElement = (
  <Breadcrumbs>
    <Breadcrumb href="/">Home</Breadcrumb>
    <Breadcrumb href="/documents">Documents</Breadcrumb>
    <Breadcrumb>Receipts, 2026</Breadcrumb>
  </Breadcrumbs>
);

/** The trail's list. */
const list = (): HTMLElement => screen.getByRole('list');

/** The one element at `index`, or a failure that names what was missing. */
function at<T>(elements: T[], index: number): T {
  const element = elements.at(index);
  if (element === undefined) throw new Error(`Nothing at ${String(index)}`);
  return element;
}

/** The crumbs' links, in order: every crumb but the current page. */
const crumbLinks = (): HTMLElement[] => within(list()).queryAllByRole('link');

/** A crumb's shown text: a link's text content also holds its back words, which the stylesheet hides. */
const shown = (element: Element): string | null | undefined =>
  element.querySelector('.breadcrumbs-text')?.textContent;

/**
 * Draws a face's back words as breadcrumbs.css does, which jsdom does not load: hidden over 768px, and under it a
 * block said but not shown (a block, so a name puts a space either side of it, as browsers do).
 */
function face(kind: 'wide' | 'phone'): void {
  const style = document.createElement('style');
  style.dataset.face = '';
  style.textContent = `.breadcrumbs-back-words { display: ${kind === 'wide' ? 'none' : 'block'}; }`;
  document.head.append(style);
}

afterEach(() => {
  vi.restoreAllMocks();
  for (const style of document.head.querySelectorAll('style[data-face]')) style.remove();
});

describe('Breadcrumbs', () => {
  it('is exported from the package', () => {
    expect(library.Breadcrumbs).toBe(Breadcrumbs);
    expect(library.Breadcrumb).toBe(Breadcrumb);
  });

  it('is a navigation landmark named Breadcrumbs, holding a list', () => {
    const { container } = render(TRAIL);
    const nav = screen.getByRole('navigation', { name: 'Breadcrumbs' });
    expect(nav.tagName).toBe('NAV');
    expect(nav).toHaveClass('breadcrumbs');
    expect(nav).toBe(container.firstElementChild);
    expect(list().tagName).toBe('OL');
    expect(list()).toHaveClass('breadcrumbs-list');
    expect(
      within(list())
        .getAllByRole('listitem')
        .map((item) => item.className),
    ).toEqual(['breadcrumbs-item', 'breadcrumbs-item', 'breadcrumbs-item']);
  });

  it('takes its name from aria-label', () => {
    render(
      <Breadcrumbs aria-label="مسیر">
        <Breadcrumb href="/">خانه</Breadcrumb>
        <Breadcrumb>اسناد</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(screen.getByRole('navigation', { name: 'مسیر' })).toBeInTheDocument();
  });

  it('links every crumb but the last, through the router', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(<RouterProvider navigate={navigate}>{TRAIL}</RouterProvider>);
    const links = crumbLinks();
    expect(links.map((link) => [shown(link), link.getAttribute('href')])).toEqual([
      ['Home', '/'],
      ['Documents', '/documents'],
    ]);
    for (const link of links) expect(link).toHaveClass('link', 'breadcrumbs-link');
    await user.click(at(links, 1));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/documents');
  });

  it('writes the crumb without href as text with aria-current page, not a tab stop', async () => {
    const user = userEvent.setup();
    render(TRAIL);
    const items = within(list()).getAllByRole('listitem');
    const current = at(items, -1).querySelector('.breadcrumbs-current');
    expect(current?.tagName).toBe('SPAN');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(current).toHaveTextContent('Receipts, 2026');
    expect(current).not.toHaveAttribute('tabindex');
    expect(within(at(items, -1)).queryByRole('link')).toBeNull();
    // Tab reaches Home, then Documents, then leaves: the current page is not a stop.
    await user.tab();
    expect(crumbLinks()[0]).toHaveFocus();
    await user.tab();
    expect(crumbLinks()[1]).toHaveFocus();
    await user.tab();
    expect(document.activeElement?.closest('.breadcrumbs-list')).toBeNull();
  });

  it('never cuts the current crumb: its text has no title', () => {
    const { container } = render(TRAIL);
    expect(container.querySelector('.breadcrumbs-current .breadcrumbs-text')).not.toHaveAttribute('title');
  });

  it('writes a separator in every crumb, hidden from assistive technology, which the stylesheet hides in the last', () => {
    render(TRAIL);
    const items = within(list()).getAllByRole('listitem');
    for (const item of items) {
      const separator = item.lastElementChild;
      expect(separator).toHaveClass('breadcrumbs-separator');
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator?.querySelector('svg.lucide-chevron-right')).not.toBeNull();
    }
  });

  it("names each link by its text over 768px, and 'Back to' its text under it, the words said but not shown", () => {
    face('wide');
    render(TRAIL);
    const documents = at(crumbLinks(), 1);
    expect(screen.getByRole('link', { name: 'Documents' })).toBe(documents);
    face('phone');
    expect(screen.getByRole('link', { name: 'Back to Documents' })).toBe(documents);
    const words = documents.querySelector('.breadcrumbs-back-words');
    expect(words?.textContent).toBe('Back to ');
    expect(words?.nextElementSibling).toHaveClass('breadcrumbs-text');
    const chevron = documents.firstElementChild;
    expect(chevron).toHaveClass('lucide-chevron-left', 'breadcrumbs-back-icon');
    expect(chevron).toHaveAttribute('aria-hidden', 'true');
  });

  it('takes backLabel as a template a server component can pass, with {parent} anywhere in it', () => {
    face('phone');
    render(
      <Breadcrumbs backLabel="بازگشت به {parent}">
        <Breadcrumb href="/">خانه</Breadcrumb>
        <Breadcrumb href="/documents">اسناد</Breadcrumb>
        <Breadcrumb>رسیدها</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(screen.getByRole('link', { name: 'بازگشت به اسناد' })).toHaveAttribute('href', '/documents');
    const { unmount } = render(
      <Breadcrumbs backLabel="Return to {parent} page">
        <Breadcrumb href="/files">Files</Breadcrumb>
        <Breadcrumb>Receipts</Breadcrumb>
      </Breadcrumbs>,
    );
    const link = screen.getByRole('link', { name: 'Return to Files page' });
    expect([...link.querySelectorAll('.breadcrumbs-back-words')].map((words) => words.textContent)).toEqual([
      'Return to ',
      ' page',
    ]);
    unmount();
  });

  it('takes backLabel as a function, and says first a label that does not hold the text', () => {
    face('phone');
    render(
      <Breadcrumbs backLabel={(parent) => `Up to ${parent}`}>
        <Breadcrumb href="/documents">Documents</Breadcrumb>
        <Breadcrumb>Receipts</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(screen.getByRole('link', { name: 'Up to Documents' })).toHaveAttribute('href', '/documents');
    const { unmount } = render(
      <Breadcrumbs backLabel={() => 'Go up'}>
        <Breadcrumb href="/files">Files</Breadcrumb>
        <Breadcrumb>Receipts</Breadcrumb>
      </Breadcrumbs>,
    );
    // The shown text stays in the name, so what the reader sees is what a voice user says (WCAG 2.5.3).
    expect(screen.getByRole('link', { name: 'Go up Files' })).toHaveAttribute('href', '/files');
    unmount();
  });

  it('keeps the full text of a link in a title', () => {
    const { container } = render(TRAIL);
    expect(
      [...container.querySelectorAll('.breadcrumbs-link .breadcrumbs-text')].map((text) => [
        text.textContent,
        text.getAttribute('title'),
      ]),
    ).toEqual([
      ['Home', 'Home'],
      ['Documents', 'Documents'],
    ]);
  });

  it("puts each crumb's className on its item, and its own className and ref on the landmark", () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Breadcrumbs ref={ref} className="trail">
        <Breadcrumb href="/" className="first">
          Home
        </Breadcrumb>
        <Breadcrumb className="last">Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveAttribute('class', 'breadcrumbs trail');
    expect(
      within(list())
        .getAllByRole('listitem')
        .map((item) => item.className),
    ).toEqual(['breadcrumbs-item first', 'breadcrumbs-item last']);
  });

  it('draws a crumb a server component hands in, which arrives as a reference React resolves lazily', async () => {
    // A server component's Breadcrumb reaches this client module with a lazy type, not the Breadcrumb function.
    const ServerCrumb = lazy(() => Promise.resolve({ default: Breadcrumb }));
    render(
      <Breadcrumbs>
        <ServerCrumb href="/">Home</ServerCrumb>
        <ServerCrumb>Documents</ServerCrumb>
      </Breadcrumbs>,
    );
    expect(await screen.findByRole('list')).toBeInTheDocument();
    expect(crumbLinks().map((link) => link.getAttribute('href'))).toEqual(['/']);
    expect(document.querySelector('.breadcrumbs-current')).toHaveTextContent('Documents');
  });

  it('draws crumbs a component of yours wraps, and through fragments and arrays', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    function Crumb(props: BreadcrumbProps): ReactElement {
      return <Breadcrumb {...props} className="mine" />;
    }
    const middle = ['/documents', '/documents/receipts'].map((href, index) => (
      <Crumb key={href} href={href}>
        {index === 0 ? 'Documents' : 'Receipts'}
      </Crumb>
    ));
    render(
      <Breadcrumbs>
        <>
          <Breadcrumb href="/">Home</Breadcrumb>
        </>
        {middle}
        <Crumb>2026</Crumb>
      </Breadcrumbs>,
    );
    expect(
      within(list())
        .getAllByRole('listitem')
        .map((item) => shown(item)),
    ).toEqual(['Home', 'Documents', 'Receipts', '2026']);
    expect(document.querySelector('.breadcrumbs-current')).toHaveTextContent('2026');
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once for a crumb without href before the last, which is marked as the current page', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(
      <Breadcrumbs>
        <Breadcrumb>Home</Breadcrumb>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    const first = at(within(list()).getAllByRole('listitem'), 0);
    expect(within(first).queryByRole('link')).toBeNull();
    expect(first.querySelector('[aria-current="page"]')).toHaveTextContent('Home');
    rerender(
      <Breadcrumbs>
        <Breadcrumb>Start</Breadcrumb>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      'A Breadcrumb without href is the current page: give the others one.',
    );
  });

  it('warns once for a Breadcrumb outside Breadcrumbs, and draws nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container, rerender } = render(<Breadcrumb href="/">Home</Breadcrumb>);
    rerender(<Breadcrumb href="/start">Start</Breadcrumb>);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe('Breadcrumb draws nothing outside Breadcrumbs.');
  });

  it('warns once for a child that draws no Breadcrumb', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <li>Stray</li>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe('Breadcrumbs holds only Breadcrumb elements.');
  });

  it('warns once for an href on the last crumb, which leaves the trail with no current page', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/documents">Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(document.querySelector('[aria-current="page"]')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe('The last Breadcrumb is the current page: leave out its href.');
  });

  describe('focus across the face switch', () => {
    /** A `(width < 768px)` query the test turns, standing in for the browser's. */
    function stubNarrow(): { turn: (matches: boolean) => void } {
      const listeners = new Set<() => void>();
      const query = {
        matches: false,
        addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
        removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      };
      vi.stubGlobal(
        'matchMedia',
        vi.fn(() => query),
      );
      return {
        turn: (matches) => {
          query.matches = matches;
          for (const listener of listeners) listener();
        },
      };
    }

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("gives focus on a crumb to the parent's link as the window narrows", () => {
      const { turn } = stubNarrow();
      render(TRAIL);
      const [home, documents] = crumbLinks();
      home?.focus();
      turn(true);
      expect(documents).toHaveFocus();
      // Widening hides nothing, so focus stays where it is.
      turn(false);
      expect(documents).toHaveFocus();
    });

    it('gives it on as well when the browser has already dropped focus to the body, as Chromium does', () => {
      const { turn } = stubNarrow();
      render(TRAIL);
      const [home, documents] = crumbLinks();
      if (!home) throw new Error('No crumb');
      home.focus();
      // Chromium hides the crumb and moves focus to the body before the change is heard.
      home.blur();
      Object.defineProperty(home, 'checkVisibility', { value: () => false });
      expect(document.body).toHaveFocus();
      turn(true);
      expect(documents).toHaveFocus();
    });

    it('leaves the body alone while the crumb last focused is still drawn', () => {
      const { turn } = stubNarrow();
      render(TRAIL);
      const [home] = crumbLinks();
      if (!home) throw new Error('No crumb');
      home.focus();
      home.blur();
      Object.defineProperty(home, 'checkVisibility', { value: () => true });
      turn(true);
      expect(document.body).toHaveFocus();
    });

    it('leaves focus outside the trail alone, and focus in another trail to that trail', () => {
      const { turn } = stubNarrow();
      render(
        <>
          {TRAIL}
          <Breadcrumbs aria-label="Second">
            <Breadcrumb href="/a">A</Breadcrumb>
            <Breadcrumb href="/b">B</Breadcrumb>
            <Breadcrumb>C</Breadcrumb>
          </Breadcrumbs>
          <button type="button">Elsewhere</button>
        </>,
      );
      const first = screen.getByRole('navigation', { name: 'Breadcrumbs' });
      const second = screen.getByRole('navigation', { name: 'Second' });
      within(first).getAllByRole('link')[0]?.focus();
      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
      elsewhere.focus();
      turn(true);
      expect(elsewhere).toHaveFocus();
      turn(false);
      within(second).getAllByRole('link')[0]?.focus();
      turn(true);
      expect(within(second).getAllByRole('link')[1]).toHaveFocus();
    });

    it('renders with no matchMedia, which a test environment may lack', () => {
      vi.stubGlobal('matchMedia', undefined);
      render(TRAIL);
      expect(screen.getByRole('navigation', { name: 'Breadcrumbs' })).toBeInTheDocument();
    });
  });

  it('draws nothing with no crumbs', () => {
    const { container } = render(<Breadcrumbs>{null}</Breadcrumbs>);
    expect(container).toBeEmptyDOMElement();
  });

  it('writes real links in the server HTML, one per crumb above the current page, with no React Aria collection', () => {
    const html = renderToString(TRAIL);
    for (const text of [
      '<nav aria-label="Breadcrumbs" class="breadcrumbs">',
      '<ol class="breadcrumbs-list">',
      'href="/"',
      'href="/documents"',
      'class="breadcrumbs-current" aria-current="page"',
      'class="breadcrumbs-separator" aria-hidden="true"',
      '<span class="breadcrumbs-back-words">Back to </span>',
    ]) {
      expect(html).toContain(text);
    }
    expect(html.match(/<a /g)).toHaveLength(2);
    expect(html).not.toContain('data-collection');
    expect(html).not.toContain('role="link"');
  });

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['three crumbs', () => TRAIL],
    [
      'one crumb',
      () => (
        <Breadcrumbs>
          <Breadcrumb>Documents</Breadcrumb>
        </Breadcrumbs>
      ),
    ],
    ['inside a PageHeader', () => <PageHeader breadcrumbs={TRAIL} title="Receipts, 2026" />],
  ];

  it.each(AXE_CASES)('has no axe violations with %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });
});
