import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import * as library from '../index';
import { RouterProvider } from '../link';
import { forgetLastLayout, PanelLayout, PanelNav, PanelNavItem, type PanelLayoutView } from './PanelLayout';
import { PanelRow, type PanelRowProps } from './PanelRow';
import { PanelSection } from './PanelSection';

/*
 * jsdom has no layout, no container queries and none of Chromium's focus fix-up: both faces are in the DOM and
 * neither is hidden here. So these tests prove the markup, the names and where focus is given, a frame after the
 * commit; the face is read from whether the side column has a box, which a test stubs. The plays prove the faces
 * and the moves in three engines (lesson 10).
 */

/** The consumer's eight sections, in an order nothing here counts on. */
const SECTIONS = [
  ['coach', 'Coach', 'How the coach waits before a charge.'],
  ['notifications', 'Notifications', 'What we tell you, and where.'],
  ['bank-sync', 'Bank sync', 'Connected accounts and how often they sync.'],
  ['assistant', 'AI assistant', 'What the assistant may read.'],
  ['logos', 'Logos', 'Bank logos beside your transactions.'],
  ['appearance', 'Appearance', 'The theme and the density.'],
  ['data', 'Data', 'Export or import your data.'],
  ['danger', 'Danger zone', 'Delete your account.'],
] as const;

const END: Record<string, string> = { 'bank-sync': '2 connected', logos: 'Off' };

const noop = (): void => undefined;

/** Waits for the next frame, after anything a frame was asked to do. */
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

/** A settings page: the nav of eight sections and the open one, or Coach beside the index. */
function Settings({
  view,
  sectionKey,
  navigate = noop,
  headingLevel,
}: {
  view: PanelLayoutView;
  sectionKey?: string;
  navigate?: (href: string) => void;
  headingLevel?: 2 | 3;
}): ReactElement {
  const open = SECTIONS.find(([key]) => key === (sectionKey ?? 'coach')) ?? SECTIONS[0];
  return (
    <RouterProvider navigate={navigate}>
      <PanelLayout
        view={view}
        sectionKey={sectionKey}
        backHref="/settings"
        backLabel="Settings"
        nav={
          <PanelNav aria-label="Settings sections">
            {SECTIONS.map(([key, name, description]) => (
              <PanelNavItem
                key={key}
                href={`/settings/${key}`}
                isCurrent={view === 'section' && key === sectionKey}
                isDefault={view === 'index' && key === 'coach'}
                description={description}
                end={END[key]}
              >
                {name}
              </PanelNavItem>
            ))}
          </PanelNav>
        }
      >
        <PanelSection title={open[1]} description={open[2]} headingLevel={headingLevel}>
          <button type="button">Save {open[1]}</button>
        </PanelSection>
      </PanelLayout>
    </RouterProvider>
  );
}

/** The layout a render put in its container. */
const layoutOf = (container: HTMLElement): HTMLElement => {
  const element = container.querySelector<HTMLElement>('.panel-layout');
  if (!element) throw new Error('No layout');
  return element;
};

/** Gives the side column a box, as the list face draws it, for the rest of the test. */
function onTheListFace(): void {
  const own = Object.getOwnPropertyDescriptor(Element.prototype, 'getClientRects')?.value as (
    this: Element,
  ) => DOMRectList;
  vi.spyOn(Element.prototype, 'getClientRects').mockImplementation(function (this: Element) {
    return this.classList.contains('panel-layout-side')
      ? ([new DOMRect(0, 0, 320, 600)] as unknown as DOMRectList)
      : own.call(this);
  });
}

beforeEach(() => {
  forgetLastLayout();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('PanelLayout', () => {
  it('is exported from the package, with PanelRow and PanelSection', () => {
    expect(library.PanelLayout).toBe(PanelLayout);
    expect(library.PanelNav).toBe(PanelNav);
    expect(library.PanelNavItem).toBe(PanelNavItem);
    expect(library.PanelSection).toBe(PanelSection);
    expect(library.PanelRow).toBe(PanelRow);
  });

  it.each([['index'], ['section']] as const)(
    "draws both faces' markup in the %s view, with Back in the main column",
    (view) => {
      const { container } = render(
        <Settings view={view} sectionKey={view === 'index' ? undefined : 'logos'} />,
      );
      const layout = layoutOf(container);
      expect(layout).toHaveAttribute('data-view', view);
      const frame = layout.firstElementChild;
      expect(frame).toHaveClass('panel-layout-frame');
      expect([...(frame?.children ?? [])].map((child) => child.className)).toEqual([
        'panel-layout-side',
        'panel-layout-main',
      ]);
      const side = layout.querySelector('.panel-layout-side');
      expect(side?.querySelector('nav.panel-nav > ul.panel-nav-list > li.panel-nav-item')).not.toBeNull();
      expect(side?.querySelectorAll('.panel-nav-item')).toHaveLength(SECTIONS.length);
      const main = layout.querySelector('.panel-layout-main');
      expect(main?.firstElementChild).toHaveClass('panel-layout-back');
      expect(main?.querySelector('section.panel-section')).not.toBeNull();
    },
  );

  it('passes the rest, className and ref to the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <PanelLayout
        ref={ref}
        className="settings"
        data-testid="layout"
        view="index"
        backHref="/settings"
        backLabel="Settings"
        nav={<PanelNav aria-label="Settings sections">{null}</PanelNav>}
      />,
    );
    expect(ref.current).toBe(layoutOf(container));
    expect(ref.current).toHaveClass('panel-layout', 'settings');
    expect(ref.current).toHaveAttribute('data-testid', 'layout');
  });

  it('marks the current link aria-current only from isCurrent', () => {
    render(<Settings view="section" sectionKey="logos" />);
    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    const links = within(nav).getAllByRole('link');
    expect(links.filter((link) => link.hasAttribute('aria-current'))).toEqual([
      within(nav).getByRole('link', { name: 'Logos' }),
    ]);
    expect(within(nav).getByRole('link', { name: 'Logos' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Logos' })).not.toHaveAttribute('data-default');
  });

  it('writes data-default and no aria-current for isDefault', () => {
    render(<Settings view="index" />);
    const nav = screen.getByRole('navigation', { name: 'Settings sections' });
    const coach = within(nav).getByRole('link', { name: 'Coach' });
    expect(coach).toHaveAttribute('data-default');
    expect(nav.querySelectorAll('[aria-current]')).toHaveLength(0);
  });

  it('describes a link by its end state then its description', () => {
    render(<Settings view="index" />);
    const link = screen.getByRole('link', { name: 'Bank sync' });
    expect(link).toHaveAccessibleName('Bank sync');
    expect(link).toHaveAccessibleDescription('2 connected Connected accounts and how often they sync.');
    expect(screen.getByRole('link', { name: 'Coach' })).toHaveAccessibleDescription(
      'How the coach waits before a charge.',
    );
    // The parts are in the link, in their classes; all but the name are hidden from its content, so its name is
    // the section's name and the end state and description are heard once, as its description.
    expect([...link.children].map((child) => child.className)).toEqual([
      'panel-nav-text',
      'panel-nav-end',
      'panel-nav-chevron',
    ]);
    expect(link).toHaveClass('panel-nav-link');
    expect(link).not.toHaveClass('link');
    for (const part of ['.panel-nav-chevron', '.panel-nav-end', '.panel-nav-description']) {
      expect(link.querySelector(part), part).toHaveAttribute('aria-hidden', 'true');
    }
  });

  it('draws an icon hidden at the start, and keeps an app name and description', () => {
    render(
      <PanelNav aria-label="Settings sections">
        <PanelNavItem
          href="/settings/coach"
          icon={<svg data-testid="icon" />}
          aria-describedby="hint"
          className="coach"
        >
          Coach
        </PanelNavItem>
        <PanelNavItem href="/settings/data" aria-label="Your data">
          Data
        </PanelNavItem>
      </PanelNav>,
    );
    const coach = screen.getByRole('link', { name: 'Coach' });
    expect(coach.firstElementChild).toHaveClass('panel-nav-icon');
    expect(coach.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(coach).toHaveAttribute('aria-describedby', 'hint');
    expect(coach).toHaveClass('panel-nav-link', 'coach');
    expect(screen.getByRole('link', { name: 'Your data' })).toHaveAttribute('aria-label', 'Your data');
  });

  it('names Back by backLabel alone and links it to backHref through RouterProvider', () => {
    const navigate = vi.fn();
    render(<Settings view="section" sectionKey="logos" navigate={navigate} />);
    const back = screen.getByRole('link', { name: 'Settings' });
    expect(back).toHaveClass('panel-layout-back');
    expect(back).toHaveAttribute('href', '/settings');
    expect(back.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    fireEvent.click(back);
    expect(navigate).toHaveBeenCalledWith('/settings', undefined);
  });

  it('navigates a section link through RouterProvider', () => {
    const navigate = vi.fn();
    render(<Settings view="index" navigate={navigate} />);
    fireEvent.click(screen.getByRole('link', { name: 'Logos' }));
    expect(navigate).toHaveBeenCalledWith('/settings/logos', undefined);
  });

  it('names the section region by its heading, an h2 by default and an h3 by headingLevel, focusable by script', () => {
    const { rerender } = render(<Settings view="section" sectionKey="logos" />);
    const region = screen.getByRole('region', { name: 'Logos' });
    const heading = within(region).getByRole('heading', { level: 2, name: 'Logos' });
    expect(heading).toHaveClass('panel-section-heading');
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(region).toHaveAttribute('aria-labelledby', heading.id);
    expect(heading.nextElementSibling).toHaveClass('panel-section-description');
    expect(heading.nextElementSibling?.tagName).toBe('P');
    rerender(<Settings view="section" sectionKey="logos" headingLevel={3} />);
    expect(within(region).getByRole('heading', { level: 3, name: 'Logos' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
  });

  it("moves focus to the open section's heading a frame after sectionKey changes, not on first render or hydration", async () => {
    const { rerender } = render(<Settings view="section" sectionKey="coach" />);
    await act(nextFrame);
    // The first render moves nothing.
    expect(document.activeElement).toBe(document.body);
    const logos = screen.getByRole('link', { name: 'Logos' });
    act(() => {
      logos.focus();
    });
    rerender(<Settings view="section" sectionKey="logos" />);
    // Not in the commit: a frame after it.
    expect(logos).toHaveFocus();
    await act(nextFrame);
    expect(screen.getByRole('heading', { name: 'Logos' })).toHaveFocus();
  });

  it('moves nothing on the server render or on hydration', async () => {
    const page = <Settings view="section" sectionKey="logos" />;
    const html = renderToString(page);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const recoverable = vi.fn();
    let hydrated: Root | undefined;
    act(() => {
      hydrated = hydrateRoot(container, page, { onRecoverableError: recoverable });
    });
    await act(nextFrame);
    expect(recoverable).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
    // A later change does move it.
    act(() => {
      hydrated?.render(<Settings view="section" sectionKey="coach" />);
    });
    await act(nextFrame);
    expect(document.activeElement).toBe(container.querySelector('.panel-section-heading'));
    act(() => {
      hydrated?.unmount();
    });
    container.remove();
  });

  it('moves focus back to the link of the section left when view turns to index', async () => {
    onTheListFace();
    const { rerender } = render(<Settings view="section" sectionKey="logos" />);
    const back = screen.getByRole('link', { name: 'Settings' });
    act(() => {
      back.focus();
    });
    rerender(<Settings view="index" />);
    await act(nextFrame);
    expect(screen.getByRole('link', { name: 'Logos' })).toHaveFocus();
  });

  it("falls back to the nav's first link", async () => {
    onTheListFace();
    // A section the nav does not list: no link was current.
    const { rerender } = render(<Settings view="section" sectionKey="archived" />);
    act(() => {
      screen.getByRole('link', { name: 'Settings' }).focus();
    });
    rerender(<Settings view="index" />);
    await act(nextFrame);
    expect(screen.getByRole('link', { name: 'Coach' })).toHaveFocus();
  });

  it("moves focus to the default section's heading on the split face", async () => {
    // jsdom draws no box, so the side column has none and the frame reads it as the split face: the default
    // section beside the list. In a browser the list face's side column has a box at the index.
    const { rerender } = render(<Settings view="section" sectionKey="logos" />);
    act(() => {
      screen.getByRole('link', { name: 'Logos' }).focus();
    });
    rerender(<Settings view="index" />);
    await act(nextFrame);
    expect(screen.getByRole('heading', { name: 'Coach' })).toHaveFocus();
  });

  it('moves focus when it was lost, to the body or with a link that left the page', async () => {
    const { rerender } = render(<Settings view="section" sectionKey="coach" />);
    expect(document.activeElement).toBe(document.body);
    rerender(<Settings view="section" sectionKey="data" />);
    await act(nextFrame);
    expect(screen.getByRole('heading', { name: 'Data' })).toHaveFocus();
  });

  it('moves nothing when the navigation started outside the layout', async () => {
    function Page({ sectionKey }: { sectionKey: string }): ReactElement {
      return (
        <>
          <button type="button">Open Logos from the palette</button>
          <Settings view="section" sectionKey={sectionKey} />
        </>
      );
    }
    const { rerender } = render(<Page sectionKey="coach" />);
    const outside = screen.getByRole('button', { name: 'Open Logos from the palette' });
    act(() => {
      screen.getByRole('link', { name: 'Data' }).focus();
    });
    act(() => {
      outside.focus();
    });
    rerender(<Page sectionKey="logos" />);
    await act(nextFrame);
    expect(outside).toHaveFocus();
  });

  it('moves nothing when the view and the section stay', async () => {
    const { rerender } = render(<Settings view="section" sectionKey="coach" />);
    const save = screen.getByRole('button', { name: 'Save Coach' });
    act(() => {
      save.focus();
    });
    rerender(<Settings view="section" sectionKey="coach" />);
    await act(nextFrame);
    expect(save).toHaveFocus();
  });

  it('counts a layout mounted after hydration with another sectionKey as a change', async () => {
    const first = render(<Settings view="section" sectionKey="coach" />);
    first.unmount();
    // A route that renders the layout per page: the next page's layout mounts with Logos.
    render(<Settings view="section" sectionKey="logos" />);
    await act(nextFrame);
    expect(screen.getByRole('heading', { name: 'Logos' })).toHaveFocus();
  });

  it('counts no change for a layout mounted with the section the last one had', async () => {
    const first = render(<Settings view="section" sectionKey="logos" />);
    first.unmount();
    render(<Settings view="section" sectionKey="logos" />);
    await act(nextFrame);
    expect(document.activeElement).toBe(document.body);
  });

  it('cancels its move when it unmounts before the frame', async () => {
    const { rerender, unmount } = render(<Settings view="section" sectionKey="coach" />);
    rerender(<Settings view="section" sectionKey="logos" />);
    unmount();
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await act(nextFrame);
    expect(outside).toHaveFocus();
    outside.remove();
  });
});

describe('PanelSection', () => {
  it('passes the rest, className and ref to the section, and draws no description when none is given', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <PanelSection ref={ref} title="Data" className="data" data-testid="data">
        <p>Export</p>
      </PanelSection>,
    );
    const section = container.querySelector('section');
    expect(ref.current).toBe(section);
    expect(section).toHaveClass('panel-section', 'data');
    expect(section).toHaveAttribute('data-testid', 'data');
    expect(section?.querySelector('.panel-section-description')).toBeNull();
  });
});

describe('PanelRow', () => {
  it.each([['halves'], ['third-two-thirds'], ['two-thirds-third']] as const)(
    'draws two cells for %s',
    (layout) => {
      const ref = createRef<HTMLDivElement>();
      const { container } = render(
        <PanelRow ref={ref} layout={layout} className="pair" data-testid="row">
          <div>Profile</div>
          <div>Notifications</div>
        </PanelRow>,
      );
      const row = container.firstElementChild;
      expect(ref.current).toBe(row);
      expect(row).toHaveClass('panel-row', 'pair');
      expect(row).toHaveAttribute('data-layout', layout);
      expect(row).toHaveAttribute('data-testid', 'row');
      const grid = row?.firstElementChild;
      expect(grid).toHaveClass('panel-row-grid');
      expect([...(grid?.children ?? [])].map((cell) => [cell.className, cell.textContent])).toEqual([
        ['panel-row-cell', 'Profile'],
        ['panel-row-cell', 'Notifications'],
      ]);
    },
  );

  it('takes exactly two children by its type', () => {
    // @ts-expect-error three cards never pair
    const three: PanelRowProps['children'] = ['Theme', 'Density', 'Language'];
    const one = (
      // @ts-expect-error one card is a Card outside any row
      <PanelRow layout="halves">
        <div />
      </PanelRow>
    );
    expect([three, one]).toHaveLength(2);
  });
});

describe('PanelLayout accessibility', () => {
  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['in the index view', <Settings key="index" view="index" />],
    ['in the section view', <Settings key="section" view="section" sectionKey="logos" />],
    [
      'with a nav item with an end state, a description and an icon',
      <PanelNav key="item" aria-label="Settings sections">
        <PanelNavItem
          href="/settings/bank-sync"
          icon={<svg />}
          end="2 connected"
          description="Connected accounts and how often they sync."
          isCurrent
        >
          Bank sync
        </PanelNavItem>
      </PanelNav>,
    ],
    [
      'with a PanelRow',
      <PanelRow key="row" layout="third-two-thirds">
        <section aria-label="Theme">Theme</section>
        <section aria-label="Density">Density</section>
      </PanelRow>,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
