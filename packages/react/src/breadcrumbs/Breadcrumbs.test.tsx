import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, lazy, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { RouterProvider } from '../link';
import { PageHeader } from '../page-header';
import { Breadcrumb, Breadcrumbs } from './Breadcrumbs';

/** Home, Documents and the current page, Receipts, 2026. */
const TRAIL: ReactElement = (
  <Breadcrumbs>
    <Breadcrumb href="/">Home</Breadcrumb>
    <Breadcrumb href="/documents">Documents</Breadcrumb>
    <Breadcrumb>Receipts, 2026</Breadcrumb>
  </Breadcrumbs>
);

/** The trail's list: the wide face. */
const list = (): HTMLElement => screen.getByRole('list');

/** The one element at `index`, or a failure that names what was missing. */
function at(elements: HTMLElement[], index: number): HTMLElement {
  const element = elements.at(index);
  if (element === undefined) throw new Error(`Nothing at ${String(index)}`);
  return element;
}

/** The links of the wide face, in order: every crumb but the last. */
const crumbLinks = (): HTMLElement[] => within(list()).queryAllByRole('link');

afterEach(() => {
  vi.restoreAllMocks();
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
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Home', '/'],
      ['Documents', '/documents'],
    ]);
    for (const link of links) expect(link).toHaveClass('link', 'breadcrumbs-link');
    await user.click(at(links, 1));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/documents');
  });

  it('writes the last crumb as text with aria-current page, not a tab stop', async () => {
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

  it('writes a separator after every crumb but the last, hidden from assistive technology', () => {
    render(TRAIL);
    const items = within(list()).getAllByRole('listitem');
    const separators = items.map((item) => item.querySelector('.breadcrumbs-separator'));
    expect(separators.map((separator) => separator !== null)).toEqual([true, true, false]);
    for (const separator of separators.slice(0, 2)) {
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator?.querySelector('svg.lucide-chevron-right')).not.toBeNull();
      // After the link, inside its crumb.
      expect(separator?.previousElementSibling).toHaveClass('breadcrumbs-link');
    }
  });

  it('draws the back link to the parent, named by backLabel', () => {
    const { container } = render(
      <Breadcrumbs backLabel={(parent) => `Up to ${parent}`}>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/documents">Documents</Breadcrumb>
        <Breadcrumb>Receipts, 2026</Breadcrumb>
      </Breadcrumbs>,
    );
    const back = container.querySelector('.breadcrumbs-back');
    expect(back?.tagName).toBe('A');
    expect(back).toHaveClass('link', 'breadcrumbs-back');
    expect(back).toHaveAttribute('href', '/documents');
    expect(back).toHaveTextContent('Up to Documents');
    expect(screen.getByRole('link', { name: 'Up to Documents' })).toBe(back);
    expect(back?.querySelector('svg.lucide-chevron-left')).toHaveAttribute('aria-hidden', 'true');
    // After the list, inside the landmark.
    expect(back?.previousElementSibling).toBe(list());
  });

  it("names the back link 'Back to' its parent by default", () => {
    render(TRAIL);
    expect(screen.getByRole('link', { name: 'Back to Documents' })).toHaveAttribute('href', '/documents');
  });

  it('draws no back link with one crumb', () => {
    const { container } = render(
      <Breadcrumbs>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(container.querySelector('.breadcrumbs-back')).toBeNull();
    expect(container.querySelector('.breadcrumbs-current')).toHaveTextContent('Documents');
  });

  it('keeps the full text in a title', () => {
    const { container } = render(TRAIL);
    expect(
      [...container.querySelectorAll('.breadcrumbs-list .breadcrumbs-text')].map((text) => [
        text.textContent,
        text.getAttribute('title'),
      ]),
    ).toEqual([
      ['Home', 'Home'],
      ['Documents', 'Documents'],
      ['Receipts, 2026', 'Receipts, 2026'],
    ]);
    expect(container.querySelector('.breadcrumbs-back .breadcrumbs-text')).toHaveAttribute(
      'title',
      'Back to Documents',
    );
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

  it('reads a crumb a server component hands in, which arrives as a reference React resolves lazily', () => {
    // A server component's Breadcrumb reaches this client module with a lazy type, not the Breadcrumb function.
    const ServerCrumb = lazy(() => Promise.resolve({ default: Breadcrumb }));
    render(
      <Breadcrumbs>
        <ServerCrumb href="/">Home</ServerCrumb>
        <ServerCrumb>Documents</ServerCrumb>
      </Breadcrumbs>,
    );
    expect(crumbLinks().map((link) => link.getAttribute('href'))).toEqual(['/']);
    expect(document.querySelector('.breadcrumbs-current')).toHaveTextContent('Documents');
  });

  it('reads crumbs through fragments and arrays', () => {
    const middle = ['/documents', '/documents/receipts'].map((href, index) => (
      <Breadcrumb key={href} href={href}>
        {index === 0 ? 'Documents' : 'Receipts'}
      </Breadcrumb>
    ));
    render(
      <Breadcrumbs>
        <>
          <Breadcrumb href="/">Home</Breadcrumb>
        </>
        {middle}
        <Breadcrumb>2026</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(
      within(list())
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Home', 'Documents', 'Receipts', '2026']);
  });

  it('warns once for a crumb without href before the last, and draws it as text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(
      <Breadcrumbs>
        <Breadcrumb>Home</Breadcrumb>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    const first = at(within(list()).getAllByRole('listitem'), 0);
    expect(within(first).queryByRole('link')).toBeNull();
    expect(first.querySelector(':scope > .breadcrumbs-text')).toHaveTextContent('Home');
    expect(first.querySelector('.breadcrumbs-separator')).not.toBeNull();
    // The back link needs the parent's href, so with none there is no back link.
    expect(document.querySelector('.breadcrumbs-back')).toBeNull();
    rerender(
      <Breadcrumbs>
        <Breadcrumb>Start</Breadcrumb>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/href/);
  });

  it('warns once for a Breadcrumb outside Breadcrumbs, and draws nothing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container, rerender } = render(<Breadcrumb href="/">Home</Breadcrumb>);
    rerender(<Breadcrumb href="/start">Start</Breadcrumb>);
    expect(container).toBeEmptyDOMElement();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/inside Breadcrumbs/);
  });

  it('warns once for a child that is not a Breadcrumb, and leaves it out', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <span>Stray</span>
        <Breadcrumb>Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(within(list()).getAllByRole('listitem')).toHaveLength(2);
    expect(screen.queryByText('Stray')).toBeNull();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/only Breadcrumb/);
  });

  it('warns once for an href on the last crumb, which is the current page and draws as text', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <Breadcrumbs>
        <Breadcrumb href="/">Home</Breadcrumb>
        <Breadcrumb href="/documents">Documents</Breadcrumb>
      </Breadcrumbs>,
    );
    expect(crumbLinks()).toHaveLength(1);
    expect(document.querySelector('.breadcrumbs-current')).toHaveTextContent('Documents');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/current page/);
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

    it('gives focus on a crumb to the back link as the window narrows, and back to the parent as it widens', () => {
      const { turn } = stubNarrow();
      const { container } = render(TRAIL);
      const back = container.querySelector<HTMLElement>('.breadcrumbs-back');
      const documents = crumbLinks()[1];
      if (!back || !documents) throw new Error('No faces');
      // From any crumb's link: the list is about to be hidden, so focus goes to the face drawn next.
      crumbLinks()[0]?.focus();
      turn(true);
      expect(back).toHaveFocus();
      turn(false);
      expect(documents).toHaveFocus();
    });

    it('leaves focus outside the trail alone', () => {
      const { turn } = stubNarrow();
      render(
        <>
          {TRAIL}
          <button type="button">Elsewhere</button>
        </>,
      );
      const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
      elsewhere.focus();
      turn(true);
      expect(elsewhere).toHaveFocus();
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

  it('writes real links in the server HTML, both faces, with no React Aria collection', () => {
    const html = renderToString(TRAIL);
    for (const text of [
      '<nav aria-label="Breadcrumbs" class="breadcrumbs">',
      '<ol class="breadcrumbs-list">',
      'href="/"',
      'href="/documents"',
      'class="breadcrumbs-current" aria-current="page"',
      'class="breadcrumbs-separator" aria-hidden="true"',
      'Back to Documents',
    ]) {
      expect(html).toContain(text);
    }
    expect(html.match(/<a /g)).toHaveLength(3);
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
