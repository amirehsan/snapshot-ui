import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { House } from 'lucide-react';
import { createRef, useState, type ReactElement, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { AppShell } from '../app-shell';
import { Button } from '../button';
import { DataTable } from '../data-table';
import { Dialog } from '../dialog';
import * as library from '../index';
import { RouterProvider } from '../link';
import { Menu, MenuItem, MenuTrigger } from '../menu';
import { Sidebar, SidebarGroup, SidebarItem } from '../sidebar';
import { COLUMNS, hrefOf, keyOf, TRANSACTIONS } from '../stories/transactions';
import { TextField } from '../text-field';
import { SidePanel, type SidePanelProps } from './SidePanel';
import { SidePanelLayout } from './SidePanelLayout';

/**
 * A viewport `width` px wide for every `(width >= Npx)` and `(width < Npx)` query, and `resize`, which tells each
 * query whose answer changed, as a browser does. Every other query answers false. Put back when the test ends.
 */
function viewport(initial: number): { resize: (width: number) => void } {
  let width = initial;
  const answer = (query: string): boolean => {
    const match = /^\(width (>=|<) (\d+)px\)$/.exec(query);
    if (!match) return false;
    return match[1] === '>=' ? width >= Number(match[2]) : width < Number(match[2]);
  };
  const watched: { query: string; listeners: Set<() => void>; last: boolean }[] = [];
  const spy = vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => {
    const listeners = new Set<() => void>();
    watched.push({ query, listeners, last: answer(query) });
    return {
      get matches() {
        return answer(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_type: string, listener: () => void) => listeners.delete(listener),
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    } as unknown as MediaQueryList;
  });
  onTestFinished(() => {
    spy.mockRestore();
  });
  return {
    resize: (next) => {
      width = next;
      act(() => {
        for (const each of watched) {
          const now = answer(each.query);
          if (now === each.last) continue;
          each.last = now;
          for (const listener of each.listeners) listener();
        }
      });
    },
  };
}

const noop = (): void => undefined;

/** A transaction's detail: three fields, what the stories and the docs put in the body. */
const DETAIL: ReactNode = (
  <>
    <TextField label="Payee" defaultValue="Corner Mart" />
    <TextField label="Memo" />
  </>
);

type Props = Partial<SidePanelProps>;

/** An open panel in a layout beside a short page, and whatever the test gives it. */
function Opened({ children = DETAIL, ...props }: Props): ReactElement {
  return (
    <SidePanelLayout
      panel={
        <SidePanel title="Corner Mart" description="14 October" isOpen onClose={noop} {...props}>
          {children}
        </SidePanel>
      }
    >
      <p>The page</p>
    </SidePanelLayout>
  );
}

/**
 * A page that opens the panel from a row's button, as an app does from its URL: the open row's id in state, the
 * panel keyed by it, and Close writing it back.
 */
function Page({
  panel = {},
  rows = ['t1', 't2'],
  children,
}: {
  panel?: Props;
  rows?: string[];
  children?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <SidePanelLayout
      panel={
        <SidePanel
          key={open ?? 'none'}
          title={open === null ? 'Nothing' : `Row ${open}`}
          isOpen={open !== null}
          onClose={() => {
            setOpen(null);
          }}
          {...panel}
        >
          {DETAIL}
          <Button
            onPress={() => {
              setOpen('t2');
            }}
          >
            Next
          </Button>
        </SidePanel>
      }
    >
      {rows.map((row) => (
        <Button
          key={row}
          onPress={() => {
            setOpen(row);
          }}
        >
          {`Open ${row}`}
        </Button>
      ))}
      <Button
        onPress={() => {
          setOpen(null);
        }}
      >
        Close from the page
      </Button>
      {children}
    </SidePanelLayout>
  );
}

const panelOf = (): HTMLElement => screen.getByRole('complementary');

function partOf(scope: ParentNode, selector: string): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (found === null) throw new Error(`Nothing matches ${selector}`);
  return found;
}

describe('SidePanel', () => {
  it('is exported from the package index, with its layout', () => {
    expect(library.SidePanel).toBe(SidePanel);
    expect(library.SidePanelLayout).toBe(SidePanelLayout);
  });

  it('renders a complementary landmark named by its heading while open, and nothing while closed', () => {
    viewport(1280);
    const { container, rerender } = render(<Opened />);
    const aside = screen.getByRole('complementary', { name: 'Corner Mart' });
    expect(aside.tagName).toBe('ASIDE');
    expect(aside).toHaveClass('side-panel');
    const heading = screen.getByRole('heading', { level: 2, name: 'Corner Mart' });
    expect(aside).toHaveAttribute('aria-labelledby', heading.id);
    expect(aside).not.toHaveAttribute('tabindex');
    rerender(<Opened isOpen={false} />);
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(container.querySelector('.side-panel')).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('draws the title as an h2 with tabIndex -1, the description, the close button named Close and the footer', () => {
    viewport(1280);
    render(<Opened footer={<Button>Save</Button>} />);
    const aside = panelOf();
    expect([...aside.children].map((child) => child.className)).toEqual([
      'side-panel-header',
      'side-panel-body',
      'side-panel-footer',
    ]);
    const heading = within(aside).getByRole('heading', { level: 2 });
    expect(heading).toHaveClass('side-panel-title');
    expect(heading).toHaveAttribute('tabindex', '-1');
    expect(aside.querySelector('.side-panel-header-text > .side-panel-description')).toHaveTextContent(
      '14 October',
    );
    const close = within(aside).getByRole('button', { name: 'Close' });
    expect(close).toHaveClass('icon-button', 'side-panel-close');
    expect(close.querySelector('svg')).not.toBeNull();
    expect(within(partOf(aside, '.side-panel-footer')).getByRole('button')).toHaveTextContent('Save');
    expect(within(partOf(aside, '.side-panel-body')).getByLabelText('Payee')).toBeVisible();
  });

  it('takes its close button name from closeLabel', () => {
    viewport(1280);
    render(<Opened closeLabel="Close the detail" />);
    expect(within(panelOf()).getByRole('button', { name: 'Close the detail' })).toBeInTheDocument();
  });

  it('keeps the title for assistive technology only with isTitleHidden, and lands focus on the panel', () => {
    viewport(1280);
    render(<Opened isTitleHidden />);
    const aside = screen.getByRole('complementary', { name: 'Corner Mart' });
    const heading = within(aside).getByRole('heading', { level: 2, name: 'Corner Mart' });
    expect(heading.parentElement?.style.clipPath).toBe('inset(50%)');
    // A hidden heading would hold an invisible ring, so the panel, which can show one, takes focus.
    expect(aside).toHaveAttribute('tabindex', '-1');
    expect(aside).toHaveFocus();
  });

  it('moves focus to the heading when isOpen turns true, and back to the opener when it turns false', async () => {
    viewport(1280);
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open t1' });
    await user.click(opener);
    expect(screen.getByRole('heading', { name: 'Row t1' })).toHaveFocus();
    // The wide face traps nothing: Tab moves through the panel and on out of it.
    await user.tab();
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(opener).toHaveFocus();
  });

  it('counts a mount after hydration with isOpen as an opening, and a mount in the hydration pass as none', () => {
    viewport(1280);
    const outside = document.createElement('button');
    document.body.append(outside);
    onTestFinished(() => {
      outside.remove();
    });
    // In the hydration pass: the server's HTML held the aside, and hydrating it moves nothing.
    outside.focus();
    const element = <Opened />;
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    document.body.append(container);
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, element);
    });
    expect(within(container).getByRole('complementary')).toBeInTheDocument();
    expect(outside).toHaveFocus();
    act(() => {
      root?.unmount();
    });
    container.remove();
    // After hydration, a panel that mounts open is an opening, as a new row's keyed panel is.
    render(<Opened />);
    expect(screen.getByRole('heading', { name: 'Corner Mart' })).toHaveFocus();
  });

  it('moves no focus when a panel hydrated open closes before focus was ever in it', () => {
    viewport(1280);
    const container = document.createElement('div');
    container.innerHTML = renderToString(<Opened />);
    document.body.append(container);
    let root: Root | undefined;
    act(() => {
      root = hydrateRoot(container, <Opened />);
    });
    expect(document.activeElement).toBe(document.body);
    // The app closes it, as a phone's page that opens closed does after hydration: focus stays where it was.
    act(() => {
      root?.render(<Opened isOpen={false} />);
    });
    expect(container.querySelector('.side-panel')).toBeNull();
    expect(document.activeElement).toBe(document.body);
    act(() => {
      root?.unmount();
    });
    container.remove();
  });

  it('returns focus to the layout content when the opener has left the document', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const { container, rerender } = render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open t1' }));
    expect(screen.getByRole('heading', { name: 'Row t1' })).toHaveFocus();
    // The row that opened it leaves, as a filter that drops it does.
    rerender(<Page rows={['t2']} />);
    await user.keyboard('{Escape}');
    expect(container.querySelector('.side-panel-layout-content')).toHaveFocus();
  });

  it('gives focus back to the same row in the face a DataTable draws once the panel has gone', async () => {
    viewport(1280);
    const user = userEvent.setup();
    // jsdom runs no container query: this style draws one face at a time, as the table's box would.
    const faces = document.createElement('style');
    faces.textContent = '.data-table-grid { display: none; }';
    document.head.append(faces);
    onTestFinished(() => {
      faces.remove();
    });
    function Rows(): ReactElement {
      const [open, setOpen] = useState<string | null>(null);
      return (
        <RouterProvider
          navigate={(href) => {
            setOpen(href.split('/').at(-1) ?? null);
          }}
        >
          <SidePanelLayout
            panel={
              <SidePanel
                key={open ?? 'none'}
                title={`Row ${open ?? ''}`}
                isOpen={open !== null}
                onClose={() => {
                  setOpen(null);
                }}
              >
                {DETAIL}
              </SidePanel>
            }
          >
            <DataTable
              aria-label="Transactions"
              items={TRANSACTIONS.slice(0, 3)}
              columns={COLUMNS}
              getKey={keyOf}
              getRowHref={hrefOf}
            />
          </SidePanelLayout>
        </RouterProvider>
      );
    }
    const { container } = render(<Rows />);
    // Beside the panel the box is narrow and the list is drawn: its item opens the panel.
    const item = container.querySelector<HTMLElement>('.data-table-list [data-key="t2"]');
    if (item === null) throw new Error('No item');
    act(() => {
      item.focus();
    });
    await user.keyboard('{Enter}');
    expect(screen.getByRole('heading', { name: 'Row t2' })).toHaveFocus();
    // The panel goes, the box widens and the table is drawn instead of the list.
    faces.textContent = '.data-table-list { display: none; }';
    await user.keyboard('{Escape}');
    expect(container.querySelector('.data-table-table [role="row"][data-key="t2"]')).toHaveFocus();
  });

  it('leaves focus where the reader put it when the page closes the panel', async () => {
    viewport(1280);
    const user = userEvent.setup();
    render(<Page />);
    await user.click(screen.getByRole('button', { name: 'Open t1' }));
    const pageClose = screen.getByRole('button', { name: 'Close from the page' });
    await user.click(pageClose);
    expect(screen.queryByRole('complementary')).toBeNull();
    expect(pageClose).toHaveFocus();
  });

  it('moves focus to the heading of the next row, and keeps the first opener for a Next pressed in the panel', async () => {
    viewport(1280);
    const user = userEvent.setup();
    render(<Page />);
    const first = screen.getByRole('button', { name: 'Open t1' });
    await user.click(first);
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(screen.getByRole('heading', { name: 'Row t2' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(first).toHaveFocus();
  });

  it('calls onClose on the close button and on Escape inside it, and never on Escape in the content', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <SidePanelLayout
        panel={
          <SidePanel title="Corner Mart" isOpen onClose={onClose}>
            {DETAIL}
          </SidePanel>
        }
      >
        <TextField label="Search" />
      </SidePanelLayout>,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.click(screen.getByLabelText('Payee'));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
    await user.click(screen.getByLabelText('Search'));
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('leaves an Escape that a menu in the panel takes, or that comes from a portal it opened, to them', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Opened onClose={onClose}>
        <MenuTrigger>
          <Button>Actions</Button>
          <Menu aria-label="Actions">
            <MenuItem id="split">Split</MenuItem>
          </Menu>
        </MenuTrigger>
      </Opened>,
    );
    await user.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('menu')).toBeNull();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('stands down for an Escape in a dialog the panel opened that does not close on it', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onClose = vi.fn();
    function WithDialog(): ReactElement {
      const [isOpen, setOpen] = useState(false);
      return (
        <Opened onClose={onClose}>
          <Button
            onPress={() => {
              setOpen(true);
            }}
          >
            Delete
          </Button>
          <Dialog title="Delete it?" isOpen={isOpen} onOpenChange={setOpen} isKeyboardDismissDisabled>
            <p>It goes for good.</p>
          </Dialog>
        </Opened>
      );
    }
    render(<WithDialog />);
    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('asks onCloseRequest first, and closes only if it does not return false', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onCloseRequest = vi.fn(() => false);
    const { rerender } = render(<Opened onClose={onClose} onCloseRequest={onCloseRequest} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(screen.getByLabelText('Payee'));
    await user.keyboard('{Escape}');
    expect(onCloseRequest).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
    onCloseRequest.mockReturnValue(true);
    rerender(<Opened onClose={onClose} onCloseRequest={onCloseRequest} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onCloseRequest).toHaveBeenCalledTimes(3);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('ignores Escape with isDismissable false, and still closes on its button', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onClose = vi.fn();
    const outer = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a listener that records what bubbles
      <div onKeyDown={outer}>
        <Opened onClose={onClose} isDismissable={false} />
      </div>,
    );
    await user.click(screen.getByLabelText('Payee'));
    await user.keyboard('{Escape}');
    expect(onClose).not.toHaveBeenCalled();
    // Not the panel's, so it is not stopped either.
    expect(outer).toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is a Sheet titled by title under 1024px after hydration, calling onClose on every dismissal', async () => {
    viewport(800);
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(<Opened onClose={onClose} footer={<Button>Save</Button>} />);
    expect(screen.queryByRole('complementary')).toBeNull();
    const dialog = screen.getByRole('dialog', { name: 'Corner Mart' });
    expect(dialog).toHaveAccessibleDescription('14 October');
    expect(dialog.closest('.sheet')).toHaveClass('side-panel-sheet');
    expect(within(dialog).getByRole('button', { name: 'Save' })).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
    // Refused, it stays; with isDismissable false Escape is ignored.
    rerender(<Opened onClose={onClose} onCloseRequest={() => false} />);
    await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    rerender(<Opened onClose={onClose} isDismissable={false} />);
    screen.getByRole('dialog').focus();
    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('gives focus back to the opener when the sheet closes', async () => {
    viewport(800);
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open t1' });
    await user.click(opener);
    expect(screen.getByRole('dialog', { name: 'Row t1' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    await waitFor(() => {
      expect(opener).toHaveFocus();
    });
  });

  it('moves an open panel to the sheet when the viewport narrows, and back to the aside with focus on the heading when it widens', async () => {
    const screenSize = viewport(1280);
    const user = userEvent.setup();
    render(<Page />);
    const opener = screen.getByRole('button', { name: 'Open t1' });
    await user.click(opener);
    expect(screen.getByRole('heading', { name: 'Row t1' })).toHaveFocus();
    screenSize.resize(800);
    expect(screen.queryByRole('complementary')).toBeNull();
    const dialog = screen.getByRole('dialog', { name: 'Row t1' });
    await waitFor(() => {
      expect(dialog.contains(document.activeElement)).toBe(true);
    });
    screenSize.resize(1280);
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Row t1' })).toHaveFocus();
    });
    // The opener the first opening remembered still takes focus back.
    await user.keyboard('{Escape}');
    expect(opener).toHaveFocus();
  });

  it('lays out the content first and the panel second', () => {
    viewport(1280);
    const { container } = render(<Opened />);
    const layout = container.firstElementChild;
    expect(layout).toHaveClass('side-panel-layout');
    expect([...(layout?.children ?? [])].map((child) => child.className)).toEqual([
      'side-panel-layout-content',
      'side-panel',
    ]);
    const content = container.querySelector('.side-panel-layout-content');
    expect(content).toHaveAttribute('tabindex', '-1');
    expect(content).toHaveTextContent('The page');
  });

  it('passes className and ref to the aside, and className and ref to the layout', () => {
    viewport(1280);
    const panelRef = createRef<HTMLElement>();
    const layoutRef = createRef<HTMLDivElement>();
    render(
      <SidePanelLayout
        ref={layoutRef}
        className="page-detail"
        panel={
          <SidePanel ref={panelRef} className="detail" title="Corner Mart" isOpen onClose={noop}>
            {DETAIL}
          </SidePanel>
        }
      >
        <p>The page</p>
      </SidePanelLayout>,
    );
    expect(panelRef.current).toBe(panelOf());
    expect(panelOf()).toHaveClass('side-panel', 'detail');
    expect(layoutRef.current).toHaveClass('side-panel-layout', 'page-detail');
  });

  it('passes className to the sheet and ref to its dialog on a phone', () => {
    viewport(800);
    const panelRef = createRef<HTMLElement>();
    render(<Opened ref={panelRef} className="detail" />);
    const dialog = screen.getByRole('dialog');
    expect(panelRef.current).toBe(dialog);
    expect(dialog.closest('.sheet')).toHaveClass('side-panel-sheet', 'detail');
  });

  const AXE_CASES: [state: string, props: Props, width: number][] = [
    ['open beside content', {}, 1280],
    ['with a footer', { footer: <Button>Save</Button> }, 1280],
    ['with the title hidden', { isTitleHidden: true }, 1280],
    ['as the sheet', { footer: <Button>Save</Button> }, 800],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_state, props, width) => {
    viewport(width);
    render(<Opened {...props} />);
    await expectNoA11yViolations(document.body);
  });

  it('requires a title, isOpen and onClose, and a layout requires its panel, in its types', () => {
    const body = { children: DETAIL };
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a panel needs a title, which names it
    const untitled = <SidePanel isOpen onClose={noop} {...body} />;
    // @ts-expect-error isOpen is the app's, from its URL
    const unopened = <SidePanel title="Corner Mart" onClose={noop} {...body} />;
    // @ts-expect-error onClose writes the URL
    const unclosed = <SidePanel title="Corner Mart" isOpen {...body} />;
    // @ts-expect-error a layout holds one panel
    const lone = <SidePanelLayout {...body} />;
    expect(untitled).toBeTruthy();
    expect(unopened).toBeTruthy();
    expect(unclosed).toBeTruthy();
    expect(lone).toBeTruthy();
  });
});

describe('SidePanelLayout and the rail', () => {
  /** A shell with a rail, the layout and a panel opened by a button, as an app's list page is. */
  function Shell({
    collapsesRail,
    defaultSidebarCollapsed,
    onSidebarCollapsedChange,
  }: {
    collapsesRail?: boolean;
    defaultSidebarCollapsed?: boolean;
    onSidebarCollapsedChange?: (isCollapsed: boolean) => void;
  }): ReactElement {
    const [isOpen, setOpen] = useState(false);
    return (
      <AppShell
        defaultSidebarCollapsed={defaultSidebarCollapsed}
        onSidebarCollapsedChange={onSidebarCollapsedChange}
        sidebar={
          <Sidebar aria-label="Main">
            <SidebarGroup label="Overview">
              <SidebarItem href="#home" icon={<House />}>
                Home
              </SidebarItem>
            </SidebarGroup>
          </Sidebar>
        }
      >
        <SidePanelLayout
          collapsesRail={collapsesRail}
          panel={
            <SidePanel
              title="Corner Mart"
              isOpen={isOpen}
              onClose={() => {
                setOpen(false);
              }}
            >
              {DETAIL}
            </SidePanel>
          }
        >
          <Button
            onPress={() => {
              setOpen(true);
            }}
          >
            Open
          </Button>
        </SidePanelLayout>
      </AppShell>
    );
  }

  const shell = (container: HTMLElement): Element => {
    const found = container.querySelector('.app-shell');
    if (!found) throw new Error('No shell');
    return found;
  };

  it('folds the rail while the panel is open under 1440px, at once, and gives it back as it closes', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const { container } = render(<Shell onSidebarCollapsedChange={onSidebarCollapsedChange} />);
    expect(shell(container)).not.toHaveAttribute('data-sidebar');
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(shell(container)).toHaveAttribute('data-sidebar', 'collapsed');
    expect(shell(container)).toHaveAttribute('data-sidebar-folded', '');
    expect(screen.getByRole('button', { name: 'Expand the menu' })).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Escape}');
    expect(shell(container)).not.toHaveAttribute('data-sidebar');
    expect(shell(container)).not.toHaveAttribute('data-sidebar-folded');
    // The reader's choice was never touched, so a cookie that keeps it never holds a fold.
    expect(onSidebarCollapsedChange).not.toHaveBeenCalled();
  });

  it('keeps a rail the reader had folded folded after the panel closes', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const { container } = render(<Shell defaultSidebarCollapsed />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(shell(container)).toHaveAttribute('data-sidebar', 'collapsed');
    expect(shell(container)).not.toHaveAttribute('data-sidebar-folded');
    await user.keyboard('{Escape}');
    expect(shell(container)).toHaveAttribute('data-sidebar', 'collapsed');
  });

  it('leaves the rail alone from 1440px, and with collapsesRail false', async () => {
    const screenSize = viewport(1440);
    const user = userEvent.setup();
    const { container, unmount } = render(<Shell />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(shell(container)).not.toHaveAttribute('data-sidebar');
    // Narrowed under 1440px with the panel open, the rail folds; widened again, it comes back.
    screenSize.resize(1280);
    expect(shell(container)).toHaveAttribute('data-sidebar', 'collapsed');
    screenSize.resize(1440);
    expect(shell(container)).not.toHaveAttribute('data-sidebar');
    unmount();
    screenSize.resize(1280);
    const opted = render(<Shell collapsesRail={false} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(shell(opted.container)).not.toHaveAttribute('data-sidebar');
  });

  it('keeps the rail expanded once the reader expands it over an open panel, until the panel closes', async () => {
    viewport(1280);
    const user = userEvent.setup();
    const onSidebarCollapsedChange = vi.fn();
    const { container } = render(<Shell onSidebarCollapsedChange={onSidebarCollapsedChange} />);
    await user.click(screen.getByRole('button', { name: 'Open' }));
    await user.click(screen.getByRole('button', { name: 'Expand the menu' }));
    expect(shell(container)).not.toHaveAttribute('data-sidebar');
    expect(onSidebarCollapsedChange).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    // The next opening folds it again.
    await user.click(screen.getByRole('button', { name: 'Open' }));
    expect(shell(container)).toHaveAttribute('data-sidebar', 'collapsed');
  });
});
