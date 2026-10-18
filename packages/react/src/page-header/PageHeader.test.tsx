import { render, screen, within } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Breadcrumb, Breadcrumbs } from '../breadcrumbs';
import { Button } from '../button';
import { PageColumn } from './PageColumn';
import { PageHeader } from './PageHeader';

/** A trail of three crumbs, the current page last. */
const TRAIL: ReactElement = (
  <Breadcrumbs>
    <Breadcrumb href="/">Home</Breadcrumb>
    <Breadcrumb href="/documents">Documents</Breadcrumb>
    <Breadcrumb>Receipts, 2026</Breadcrumb>
  </Breadcrumbs>
);

/** Every slot filled. */
const FULL: ReactElement = (
  <PageHeader
    breadcrumbs={TRAIL}
    eyebrow="Documents"
    title="Receipts, 2026"
    description="Every receipt you uploaded this year, read and filed."
    actions={<Button>Upload</Button>}
  />
);

describe('PageHeader', () => {
  it('is exported from the package, with the page column', () => {
    expect(library.PageHeader).toBe(PageHeader);
    expect(library.PageColumn).toBe(PageColumn);
  });

  it("writes the page's one h1 at the section step", () => {
    render(<PageHeader title="Documents" />);
    const title = screen.getByRole('heading', { level: 1, name: 'Documents' });
    expect(title).toHaveClass('heading', 'heading-2', 'page-header-title');
    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it("takes a lower heading level for a header that is not the page's own, at the same size", () => {
    render(<PageHeader headingLevel={2} title="Notifications" />);
    const title = screen.getByRole('heading', { level: 2, name: 'Notifications' });
    expect(title).toHaveClass('heading', 'heading-2', 'page-header-title');
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  it('is a header holding a page column row: its titles, then its actions, then the sentence on its own line', () => {
    const { container } = render(FULL);
    const header = root(container);
    expect(header.tagName).toBe('HEADER');
    expect(header).toHaveClass('page-header');
    expect([...header.children].map((child) => child.className)).toEqual(['page-column page-header-row']);
    const row = header.children[0];
    expect([...(row?.children ?? [])].map((child) => child.className)).toEqual([
      'page-header-titles',
      'page-header-actions',
      'page-header-detail',
    ]);
  });

  it('orders the titles: the trail, the eyebrow and the title; the description after the actions', () => {
    const { container } = render(FULL);
    const titles = container.querySelector('.page-header-titles');
    expect([...(titles?.children ?? [])].map((child) => [child.tagName, child.className])).toEqual([
      ['NAV', 'breadcrumbs'],
      ['P', 'eyebrow'],
      ['H1', 'heading heading-2 page-header-title'],
    ]);
    const actions = container.querySelector<HTMLElement>('.page-header-actions');
    if (actions === null) throw new Error('No actions');
    expect(within(actions).getByRole('button')).toHaveTextContent('Upload');
    const detail = container.querySelector('.page-header-detail');
    expect([...(detail?.children ?? [])].map((child) => [child.tagName, child.className])).toEqual([
      ['P', 'copy copy-muted page-header-description'],
    ]);
  });

  it('draws no wrapper for a slot it is not given', () => {
    const { container } = render(<PageHeader title="Documents" />);
    expect(container.querySelector('.page-header-titles')?.children).toHaveLength(1);
    expect(container.querySelector('.page-header-actions')).toBeNull();
    expect(container.querySelector('.eyebrow')).toBeNull();
    expect(container.querySelector('.page-header-description')).toBeNull();
    expect(container.querySelector('.page-header-detail')).toBeNull();
  });

  it('draws no wrapper for a slot given false, an empty string or null', () => {
    for (const empty of [false, '', null]) {
      const { container, unmount } = render(
        <PageHeader
          title="Documents"
          breadcrumbs={empty}
          eyebrow={empty}
          description={empty}
          actions={empty}
        />,
      );
      expect(container.querySelector('.page-header-titles')?.children).toHaveLength(1);
      expect(container.querySelector('.page-header-actions')).toBeNull();
      unmount();
    }
  });

  it('merges className after its own, forwards the ref and passes other attributes to the header', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <PageHeader
        ref={ref}
        className="extra"
        id="top"
        data-testid="header"
        aria-label="Page"
        title="Documents"
      />,
    );
    const header = root(container);
    expect(header).toHaveAttribute('class', 'page-header extra');
    expect(header).toHaveAttribute('id', 'top');
    expect(header).toHaveAttribute('data-testid', 'header');
    expect(header).toHaveAttribute('aria-label', 'Page');
    expect(ref.current).toBe(header);
  });

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['the title alone', () => <PageHeader title="Documents" />],
    ['every slot', () => FULL],
    [
      'inside main',
      () => (
        <main>
          {FULL}
          <PageColumn>
            <p>The receipts.</p>
          </PageColumn>
        </main>
      ),
    ],
  ];

  it.each(AXE_CASES)('has no axe violations with %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });
});

describe('PageColumn', () => {
  it('is a div with the page column class, merging className after its own', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <PageColumn ref={ref} className="extra" id="content">
        The receipts.
      </PageColumn>,
    );
    const column = root(container);
    expect(column.tagName).toBe('DIV');
    expect(column).toHaveAttribute('class', 'page-column extra');
    expect(column).toHaveAttribute('id', 'content');
    expect(column).toHaveTextContent('The receipts.');
    expect(ref.current).toBe(column);
  });
});
