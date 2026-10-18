import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, type CSSProperties, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { AppShell, useAppShell, useOptionalAppShell, type AppShellProps } from './AppShell';

/** The shell's root, the container's one child. */
function root(container: HTMLElement): HTMLElement {
  const element = container.firstElementChild;
  if (!(element instanceof HTMLElement) || !element.classList.contains('app-shell')) {
    throw new Error('No shell root');
  }
  return element;
}

/** Reads the shell's state and drives it, as a rail's collapse button or a header's menu button would. */
function Probe(): ReactElement {
  const { isSidebarCollapsed, setSidebarCollapsed, isDrawerOpen, openDrawer, closeDrawer, mainId } =
    useAppShell();
  return (
    <div
      data-testid="probe"
      data-collapsed={String(isSidebarCollapsed)}
      data-drawer={String(isDrawerOpen)}
      data-main={mainId}
    >
      <button
        type="button"
        onClick={() => {
          setSidebarCollapsed(true);
        }}
      >
        Collapse
      </button>
      <button
        type="button"
        onClick={() => {
          setSidebarCollapsed(false);
        }}
      >
        Expand
      </button>
      <button type="button" onClick={openDrawer}>
        Open the drawer
      </button>
      <button type="button" onClick={closeDrawer}>
        Close the drawer
      </button>
    </div>
  );
}

const probe = (): HTMLElement => screen.getByTestId('probe');

/** Reads the shell's state where there may be no shell, as a floating part does. */
function OptionalProbe(): ReactElement {
  const shell = useOptionalAppShell();
  return <span data-testid="optional" data-main={shell?.mainId ?? 'none'} />;
}

/** A rail with one link, standing in for a Sidebar. */
const RAIL = (
  <nav aria-label="Workspace" className="rail">
    <a href="/budgets">Budgets</a>
  </nav>
);

/** A tab bar with one link, standing in for a BottomTabBar. */
const BAR = (
  <nav aria-label="Tabs" className="bar">
    <a href="/home">Home</a>
  </nav>
);

/** A fake media query list whose `change` listener the test calls itself. */
function fakeMediaQuery(): { list: { matches: boolean }; fire: () => void; query: MediaQueryList } {
  let listener: (() => void) | undefined;
  const list = {
    matches: false,
    media: '(width >= 1024px)',
    onchange: null,
    addEventListener: (_type: string, each: () => void) => {
      listener = each;
    },
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  };
  return {
    list,
    fire: () => {
      act(() => {
        listener?.();
      });
    },
    query: list as unknown as MediaQueryList,
  };
}

describe('AppShell', () => {
  it('puts the skip link first in the tab order, pointing at main, and main after the rail out of it', async () => {
    const user = userEvent.setup();
    render(
      <AppShell sidebar={RAIL} header={<button type="button">Search</button>}>
        page
      </AppShell>,
    );
    await user.tab();
    const skip = screen.getByRole('link', { name: 'Skip to content' });
    expect(skip).toHaveFocus();
    expect(skip).toHaveClass('app-shell-skip');
    const main = screen.getByRole('main');
    expect(main.id).not.toBe('');
    expect(skip).toHaveAttribute('href', `#${main.id}`);
    await user.tab();
    expect(screen.getByRole('link', { name: 'Budgets' })).toHaveFocus();
  });

  it('gives main the id mainId names, which the skip link and useAppShell share', () => {
    render(
      <AppShell mainId="page">
        <Probe />
      </AppShell>,
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'page');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', '#page');
    expect(probe()).toHaveAttribute('data-main', 'page');
  });

  it('lets main take the focus the skip link sends, with tabindex -1', () => {
    render(<AppShell>page</AppShell>);
    const main = screen.getByRole('main');
    expect(main.tagName).toBe('MAIN');
    expect(main).toHaveClass('app-shell-main');
    expect(main).toHaveAttribute('tabindex', '-1');
    act(() => {
      main.focus();
    });
    expect(main).toHaveFocus();
  });

  it('replaces the skip link text with skipLinkLabel', () => {
    render(<AppShell skipLinkLabel="Aller au contenu">page</AppShell>);
    expect(screen.getByRole('link', { name: 'Aller au contenu' })).toHaveClass('app-shell-skip');
    expect(screen.queryByRole('link', { name: 'Skip to content' })).toBeNull();
  });

  it('writes data-sidebar="collapsed" with defaultSidebarCollapsed and with isSidebarCollapsed', () => {
    const uncontrolled = render(<AppShell defaultSidebarCollapsed>page</AppShell>);
    expect(root(uncontrolled.container)).toHaveAttribute('data-sidebar', 'collapsed');
    uncontrolled.unmount();
    const controlled = render(<AppShell isSidebarCollapsed>page</AppShell>);
    expect(root(controlled.container)).toHaveAttribute('data-sidebar', 'collapsed');
  });

  it('writes no data-sidebar while expanded, and never "expanded" in any state', () => {
    const states: Partial<AppShellProps>[] = [
      {},
      { defaultSidebarCollapsed: false },
      { isSidebarCollapsed: false },
      { defaultSidebarCollapsed: true },
      { isSidebarCollapsed: true },
    ];
    for (const state of states) {
      const { container, unmount } = render(<AppShell {...state}>page</AppShell>);
      const collapsed = state.defaultSidebarCollapsed === true || state.isSidebarCollapsed === true;
      if (!collapsed) expect(root(container), JSON.stringify(state)).not.toHaveAttribute('data-sidebar');
      expect(container.querySelector('[data-sidebar="expanded"]'), JSON.stringify(state)).toBeNull();
      unmount();
    }
  });

  it('marks the root while it holds a sidebar and a bottom bar, and not otherwise', () => {
    const { container, rerender } = render(<AppShell>page</AppShell>);
    expect(root(container)).not.toHaveAttribute('data-has-sidebar');
    expect(root(container)).not.toHaveAttribute('data-has-bottom-bar');
    rerender(
      <AppShell sidebar={RAIL} bottomBar={BAR}>
        page
      </AppShell>,
    );
    expect(root(container)).toHaveAttribute('data-has-sidebar', '');
    expect(root(container)).toHaveAttribute('data-has-bottom-bar', '');
  });

  it('wraps the header in the sticky wrapper only when there is one, as the first part of main', () => {
    const { container, rerender } = render(<AppShell>page</AppShell>);
    expect(container.querySelector('.app-shell-header')).toBeNull();
    rerender(
      <AppShell header={<header>Budgets</header>}>
        <p>page</p>
      </AppShell>,
    );
    const wrapper = container.querySelector('.app-shell-header');
    const main = screen.getByRole('main');
    expect(wrapper?.parentElement).toBe(main);
    expect(main.firstElementChild).toBe(wrapper);
    expect(wrapper?.nextElementSibling).toHaveTextContent('page');
    // Inside main, a header element is not a banner landmark: the page's title is in the main landmark.
    expect(wrapper?.querySelector('header')?.closest('main')).toBe(main);
  });

  it("lands the skip link on main, whose first heading is the header's title", () => {
    render(
      <AppShell header={<h1>Receipts, 2026</h1>}>
        <h2>March</h2>
      </AppShell>,
    );
    const main = screen.getByRole('main');
    expect(screen.getByRole('link', { name: 'Skip to content' })).toHaveAttribute('href', `#${main.id}`);
    expect(main.querySelector('h1, h2')).toBe(screen.getByRole('heading', { level: 1 }));
  });

  describe("the header's height as the page's sticky offset", () => {
    /** A ResizeObserver whose callback the test calls with a height, standing in for the browser's. */
    function stubResizeObserver(): { observed: Element[]; report: (blockSize: number) => void } {
      const observed: Element[] = [];
      let callback: ResizeObserverCallback | undefined;
      class Stub {
        constructor(each: ResizeObserverCallback) {
          callback = each;
        }
        observe = (target: Element): void => {
          observed.push(target);
        };
        unobserve = (): void => undefined;
        disconnect = (): void => {
          observed.length = 0;
        };
      }
      vi.stubGlobal('ResizeObserver', Stub);
      return {
        observed,
        report: (blockSize) => {
          const entry = {
            borderBoxSize: [{ blockSize, inlineSize: 800 }],
            contentRect: { height: blockSize },
          };
          act(() => {
            callback?.([entry] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
          });
        },
      };
    }

    const stickyTop = (element: HTMLElement): string => element.style.getPropertyValue('--page-sticky-top');
    /** Every inline style on the root element: the shell writes none (spec correction 121). */
    const rootStyle = (): string => document.documentElement.getAttribute('style') ?? '';

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("writes the sticky header wrapper's height as --page-sticky-top on main, and removes it with the header", () => {
      const { observed, report } = stubResizeObserver();
      const { container, rerender } = render(<AppShell header={<header>Budgets</header>}>page</AppShell>);
      const wrapper = container.querySelector('.app-shell-header');
      const main = screen.getByRole('main');
      expect(observed).toEqual([wrapper]);
      // Nothing is written before the first measurement, as the server's HTML has nothing.
      expect(stickyTop(main)).toBe('');
      report(120.5);
      expect(stickyTop(main)).toBe('120.5px');
      expect(stickyTop(root(container))).toBe('');
      report(88);
      expect(stickyTop(main)).toBe('88px');
      rerender(<AppShell>page</AppShell>);
      expect(observed).toEqual([]);
      expect(stickyTop(main)).toBe('');
    });

    it('writes nothing on the root element, whose scroll is never padded for the header', () => {
      const { report } = stubResizeObserver();
      const before = rootStyle();
      const { unmount } = render(<AppShell header={<header>Budgets</header>}>page</AppShell>);
      report(96);
      expect(rootStyle()).toBe(before);
      expect(document.documentElement.style.getPropertyValue('--app-shell-header-block-size')).toBe('');
      unmount();
      expect(rootStyle()).toBe(before);
    });

    it("takes an offset on the shell's style as the first paint's estimate, which the measurement replaces", () => {
      const { observed, report } = stubResizeObserver();
      const style = { '--page-sticky-top': '7rem' } as CSSProperties;
      const { container, rerender } = render(
        <AppShell style={style} header={<header>Budgets</header>}>
          page
        </AppShell>,
      );
      const main = screen.getByRole('main');
      expect(stickyTop(root(container))).toBe('7rem');
      expect(observed).toHaveLength(1);
      report(100);
      // Main's own value is what the page reads; the estimate stays on the shell and comes back with no header.
      expect(stickyTop(main)).toBe('100px');
      expect(stickyTop(root(container))).toBe('7rem');
      rerender(
        <AppShell style={style} header={null}>
          page
        </AppShell>,
      );
      expect(stickyTop(main)).toBe('');
      expect(stickyTop(root(container))).toBe('7rem');
    });

    it("leaves the app's own offset alone with measuresHeader false, and writes nothing on the root", () => {
      const { observed } = stubResizeObserver();
      const { container } = render(
        <AppShell
          measuresHeader={false}
          style={{ '--page-sticky-top': '64px' } as CSSProperties}
          header={<header>Budgets</header>}
        >
          page
        </AppShell>,
      );
      expect(observed).toEqual([]);
      expect(stickyTop(root(container))).toBe('64px');
      expect(stickyTop(screen.getByRole('main'))).toBe('');
      expect(rootStyle()).toBe('');
    });

    it('measures whatever an ancestor declares, since the header slot is what sticks', () => {
      const { observed, report } = stubResizeObserver();
      document.documentElement.style.setProperty('--page-sticky-top', '64px');
      try {
        render(<AppShell header={<header>Budgets</header>}>page</AppShell>);
        expect(observed).toHaveLength(1);
        report(80);
        expect(stickyTop(screen.getByRole('main'))).toBe('80px');
      } finally {
        document.documentElement.style.removeProperty('--page-sticky-top');
      }
    });

    it("lets a nested shell write its own page's offset beside the outer shell's", () => {
      const observers: ((height: number) => void)[] = [];
      class Stub {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe = (): void => {
          observers.push((blockSize) => {
            const entry = {
              borderBoxSize: [{ blockSize, inlineSize: 800 }],
              contentRect: { height: blockSize },
            };
            act(() => {
              this.callback([entry] as unknown as ResizeObserverEntry[], {} as ResizeObserver);
            });
          });
        };
        unobserve = (): void => undefined;
        disconnect = (): void => undefined;
      }
      vi.stubGlobal('ResizeObserver', Stub);
      const { rerender, unmount } = render(
        <AppShell mainId="outer" header={<header>Outer</header>}>
          <AppShell mainId="inner" header={<header>Inner</header>}>
            page
          </AppShell>
        </AppShell>,
      );
      // Effects run inner first: the inner shell's observer, then the outer's.
      const [inner, outer] = observers;
      outer?.(96);
      inner?.(56);
      const mainOf = (id: string): HTMLElement => {
        const element = document.getElementById(id);
        if (element === null) throw new Error(`No main ${id}`);
        return element;
      };
      expect(stickyTop(mainOf('outer'))).toBe('96px');
      expect(stickyTop(mainOf('inner'))).toBe('56px');
      rerender(
        <AppShell mainId="outer" header={<header>Outer</header>}>
          page
        </AppShell>,
      );
      expect(stickyTop(mainOf('outer'))).toBe('96px');
      expect(rootStyle()).toBe('');
      unmount();
    });

    it('renders with no ResizeObserver, which a test environment may lack', () => {
      vi.stubGlobal('ResizeObserver', undefined);
      render(<AppShell header={<header>Budgets</header>}>page</AppShell>);
      expect(stickyTop(screen.getByRole('main'))).toBe('');
      expect(rootStyle()).toBe('');
    });
  });

  it('draws the skip link, the rail, the workspace and the bar in that order, the header first in main', () => {
    const { container } = render(
      <AppShell sidebar={RAIL} header={<header>Budgets</header>} bottomBar={BAR}>
        page
      </AppShell>,
    );
    expect([...root(container).children].map((child) => child.className)).toEqual([
      'app-shell-skip',
      'rail',
      'app-shell-workspace',
      'bar',
    ]);
    const workspace = container.querySelector('.app-shell-workspace');
    expect([...(workspace?.children ?? [])].map((child) => child.className)).toEqual(['app-shell-main']);
    expect(screen.getByRole('main').firstElementChild).toHaveClass('app-shell-header');
    expect(screen.getByRole('main')).toHaveTextContent('Budgetspage');
  });

  it('renders floating after the workspace and the bottom bar, outside main', () => {
    const { container } = render(
      <AppShell
        sidebar={RAIL}
        bottomBar={BAR}
        floating={
          <section aria-label="Uploads" className="tray">
            <OptionalProbe />
          </section>
        }
      >
        page
      </AppShell>,
    );
    expect([...root(container).children].map((child) => child.className)).toEqual([
      'app-shell-skip',
      'rail',
      'app-shell-workspace',
      'bar',
      'tray',
    ]);
    // No wrapper of its own, so it inherits the shell's properties, and never inside main.
    const tray = screen.getByRole('region', { name: 'Uploads' });
    expect(tray.parentElement).toBe(root(container));
    expect(screen.getByRole('main')).not.toContainElement(tray);
    // The shell's state reaches it.
    expect(screen.getByTestId('optional')).toHaveAttribute('data-main', screen.getByRole('main').id);
  });

  it('lets useOptionalAppShell read null outside a shell', () => {
    render(<OptionalProbe />);
    expect(screen.getByTestId('optional')).toHaveAttribute('data-main', 'none');
  });

  it('collapses and expands on its own when uncontrolled, and tells onSidebarCollapsedChange', async () => {
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const { container } = render(
      <AppShell onSidebarCollapsedChange={onSidebarCollapsedChange}>
        <Probe />
      </AppShell>,
    );
    expect(probe()).toHaveAttribute('data-collapsed', 'false');
    await user.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(root(container)).toHaveAttribute('data-sidebar', 'collapsed');
    expect(probe()).toHaveAttribute('data-collapsed', 'true');
    expect(onSidebarCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(true);
    await user.click(screen.getByRole('button', { name: 'Expand' }));
    expect(root(container)).not.toHaveAttribute('data-sidebar');
    expect(container.querySelector('[data-sidebar="expanded"]')).toBeNull();
    expect(onSidebarCollapsedChange).toHaveBeenCalledTimes(2);
    expect(onSidebarCollapsedChange).toHaveBeenLastCalledWith(false);
  });

  it('only tells onSidebarCollapsedChange when controlled, and the attribute follows the prop', async () => {
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const { container } = render(
      <AppShell isSidebarCollapsed={false} onSidebarCollapsedChange={onSidebarCollapsedChange}>
        <Probe />
      </AppShell>,
    );
    await user.click(screen.getByRole('button', { name: 'Collapse' }));
    expect(onSidebarCollapsedChange).toHaveBeenCalledTimes(1);
    expect(onSidebarCollapsedChange).toHaveBeenCalledWith(true);
    expect(root(container)).not.toHaveAttribute('data-sidebar');
    expect(probe()).toHaveAttribute('data-collapsed', 'false');
  });

  it('opens the drawer through useAppShell, and tells onDrawerOpenChange', async () => {
    const user = userEvent.setup();
    const onDrawerOpenChange = vi.fn();
    render(
      <AppShell onDrawerOpenChange={onDrawerOpenChange}>
        <Probe />
      </AppShell>,
    );
    expect(probe()).toHaveAttribute('data-drawer', 'false');
    await user.click(screen.getByRole('button', { name: 'Open the drawer' }));
    expect(probe()).toHaveAttribute('data-drawer', 'true');
    expect(onDrawerOpenChange).toHaveBeenCalledTimes(1);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls nothing when closeDrawer runs while the drawer is closed', async () => {
    const user = userEvent.setup();
    const onDrawerOpenChange = vi.fn();
    render(
      <AppShell onDrawerOpenChange={onDrawerOpenChange}>
        <Probe />
      </AppShell>,
    );
    await user.click(screen.getByRole('button', { name: 'Close the drawer' }));
    expect(onDrawerOpenChange).not.toHaveBeenCalled();
    expect(probe()).toHaveAttribute('data-drawer', 'false');
  });

  it('closes an open drawer on Back and Forward, and calls nothing once it is closed', () => {
    const onDrawerOpenChange = vi.fn();
    render(
      <AppShell defaultDrawerOpen onDrawerOpenChange={onDrawerOpenChange}>
        <Probe />
      </AppShell>,
    );
    expect(probe()).toHaveAttribute('data-drawer', 'true');
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(probe()).toHaveAttribute('data-drawer', 'false');
    expect(onDrawerOpenChange).toHaveBeenCalledTimes(1);
    expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
    act(() => {
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
    expect(onDrawerOpenChange).toHaveBeenCalledTimes(1);
  });

  it('closes the drawer when the window widens to 1024px, and not when it stays narrow', () => {
    const media = fakeMediaQuery();
    const matchMedia = vi.spyOn(window, 'matchMedia').mockReturnValue(media.query);
    try {
      const onDrawerOpenChange = vi.fn();
      render(
        <AppShell defaultDrawerOpen onDrawerOpenChange={onDrawerOpenChange}>
          <Probe />
        </AppShell>,
      );
      expect(matchMedia).toHaveBeenCalledWith('(width >= 1024px)');
      media.fire();
      expect(onDrawerOpenChange).not.toHaveBeenCalled();
      expect(probe()).toHaveAttribute('data-drawer', 'true');
      media.list.matches = true;
      media.fire();
      expect(onDrawerOpenChange).toHaveBeenCalledTimes(1);
      expect(onDrawerOpenChange).toHaveBeenCalledWith(false);
      expect(probe()).toHaveAttribute('data-drawer', 'false');
    } finally {
      matchMedia.mockRestore();
    }
  });

  it('renders with no matchMedia, which a test environment may lack', () => {
    // test/setup.ts installs the stub once per file and jsdom has none of its own, so it goes back after.
    const stub = Object.getOwnPropertyDescriptor(window, 'matchMedia');
    if (!stub) throw new Error('No matchMedia stub');
    Object.defineProperty(window, 'matchMedia', { value: undefined, configurable: true, writable: true });
    try {
      expect(() =>
        render(
          <AppShell defaultDrawerOpen>
            <Probe />
          </AppShell>,
        ),
      ).not.toThrow();
      expect(probe()).toHaveAttribute('data-drawer', 'true');
    } finally {
      Object.defineProperty(window, 'matchMedia', stub);
    }
  });

  it('throws from useAppShell outside an AppShell', () => {
    // React's own report of the error the render throws.
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      expect(() => render(<Probe />)).toThrow('useAppShell must be used inside an AppShell');
    } finally {
      error.mockRestore();
    }
  });

  it('merges className after app-shell, forwards ref to the root and passes other attributes through', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <AppShell ref={ref} className="extra" id="shell" data-testid="frame">
        page
      </AppShell>,
    );
    expect(ref.current).toBe(root(container));
    expect(ref.current).toHaveAttribute('class', 'app-shell extra');
    expect(ref.current).toHaveAttribute('id', 'shell');
    expect(screen.getByTestId('frame')).toBe(ref.current);
  });

  it('has no axe violations with a header, a rail, a page and a bar, expanded and collapsed', async () => {
    const shell = (isSidebarCollapsed: boolean): ReactElement => (
      <AppShell
        isSidebarCollapsed={isSidebarCollapsed}
        sidebar={RAIL}
        header={
          <header>
            <p>Budgets</p>
          </header>
        }
        bottomBar={BAR}
      >
        <h1>Budgets</h1>
        <p>Where the month went.</p>
      </AppShell>
    );
    const { container, rerender } = render(shell(false));
    await expectNoA11yViolations(container);
    rerender(shell(true));
    await expectNoA11yViolations(container);
  });
});
