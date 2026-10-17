import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as library from '../index';
import { AppShell } from '../app-shell/AppShell';
import { expectNoA11yViolations } from '../../test/a11y';
import { QUIET_MS } from '../utils/quiet';
import type { UploadItem } from './counts';
import { UploadTray, type UploadTrayProps } from './UploadTray';

/** Five files in mixed states: one saved, one uploading, one being read and two waiting. */
const MIXED: UploadItem[] = [
  { id: 1, name: 'lease.pdf', status: 'saved', href: '/documents/lease' },
  { id: 2, name: 'invoice.pdf', status: 'uploading', progress: 0.45, progressLabel: '1.8 of 4 MB' },
  { id: 3, name: 'statement.pdf', status: 'reading' },
  { id: 4, name: 'receipt-march.pdf', status: 'waiting' },
  { id: 5, name: 'receipt-april.pdf', status: 'waiting' },
];

/** Every row settled: three saved, one needing review and one failed. */
const SETTLED: UploadItem[] = [
  { id: 1, name: 'lease.pdf', status: 'saved', href: '/documents/lease' },
  { id: 2, name: 'invoice.pdf', status: 'saved', href: '/documents/invoice' },
  { id: 3, name: 'statement.pdf', status: 'saved', href: '/documents/statement' },
  { id: 4, name: 'corner-mart.jpg', status: 'review', reason: 'The total could not be read' },
  { id: 5, name: 'video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];

/** The wide face: the region named by its title. */
const wide = (name: string | RegExp = /Uploading|complete/): HTMLElement =>
  screen.getByRole('region', { name });

/** The phone's bar: the region named "Uploads". */
const bar = (): HTMLElement => screen.getByRole('region', { name: 'Uploads' });

/** A ResizeObserver whose callback the test calls, standing in for the browser's. */
function stubResizeObserver(): {
  observed: Element[];
  report: (sizes: [Element, number][]) => void;
} {
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
    report: (sizes) => {
      const entries = sizes.map(([target, blockSize]) => ({
        target,
        borderBoxSize: [{ blockSize, inlineSize: 448 }],
        contentRect: { height: blockSize },
      }));
      act(() => {
        callback?.(entries as unknown as ResizeObserverEntry[], {} as ResizeObserver);
      });
    },
  };
}

/** A tray whose items the test can change, as an app's uploads provider does. */
function Uploads({
  initial,
  ...props
}: Omit<UploadTrayProps, 'items'> & { initial: UploadItem[] }): ReactElement {
  const [items, setItems] = useState(initial);
  return (
    <UploadTray
      items={items}
      onRemove={(id) => {
        setItems((each) => each.filter((item) => item.id !== id));
      }}
      onClear={() => {
        setItems([]);
      }}
      {...props}
    />
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.documentElement.style.removeProperty('--upload-tray-offset');
});

describe('UploadTray', () => {
  it('is exported from the package', () => {
    expect(library.UploadTray).toBe(UploadTray);
  });

  it('renders only the empty status host with no items, on the server too', () => {
    const html = renderToString(<UploadTray items={[]} />);
    expect(html).toBe(
      '<div class="upload-tray-status" role="status" aria-live="polite" aria-atomic="true" data-react-aria-top-layer="true"></div>',
    );
    const { container } = render(<UploadTray items={[]} />);
    expect(container.children).toHaveLength(1);
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
  });

  it('draws the wide face as a region named by its title, and the bar as a region holding one button', () => {
    render(<UploadTray items={MIXED} description="About a minute left" />);
    const panel = wide('Uploading 2 of 5');
    expect(panel.tagName).toBe('SECTION');
    expect(panel).toHaveClass('overlay', 'upload-tray');
    expect(within(panel).getByRole('heading', { level: 2, name: 'Uploading 2 of 5' })).toHaveAttribute(
      'tabindex',
      '-1',
    );
    expect(within(panel).getByText('About a minute left')).toHaveClass('upload-tray-description');
    expect(within(panel).getByRole('list', { name: 'Uploading 2 of 5' })).toHaveClass('upload-list');
    const phone = bar();
    const [button, ...others] = within(phone).getAllByRole('button');
    expect(others).toHaveLength(0);
    expect(button).toHaveAccessibleName('Uploading 2 of 5');
    expect(button).toHaveAttribute('aria-haspopup', 'dialog');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    // Settled, the title says so.
    render(<UploadTray items={SETTLED} />);
    expect(wide('3 uploads complete, 1 failed, 1 needs review')).toBeInTheDocument();
  });

  it.each<[string, UploadItem['status'][], string]>([
    ['all saved', ['saved', 'saved'], '2 uploads complete'],
    ['one saved', ['saved'], '1 upload complete'],
    [
      'saved, failed and needing review',
      ['saved', 'review', 'review', 'failed'],
      '1 upload complete, 1 failed, 2 need review',
    ],
    ['only failed', ['failed', 'failed'], '2 uploads failed'],
    ['only needing review', ['review'], '1 upload needs review'],
    ['failed and needing review', ['failed', 'review'], '1 upload failed, 1 needs review'],
  ])('names failures and reviews in the settled title: %s', (_, statuses, title) => {
    render(
      <UploadTray
        items={statuses.map((status, index) => ({
          id: index,
          name: `${String(index)}.pdf`,
          status,
          reason: 'Why',
        }))}
      />,
    );
    expect(wide(title)).toBeInTheDocument();
  });

  it('shows the error icon in the header and the bar while any row has failed', () => {
    const { rerender } = render(<UploadTray items={MIXED} />);
    expect(document.querySelectorAll('.upload-tray-alert')).toHaveLength(0);
    const failed: UploadItem = { id: 9, name: 'video.mov', status: 'failed', reason: 'Over 10 MB' };
    rerender(<UploadTray items={[...MIXED, failed]} />);
    const header = wide().querySelector('.upload-tray-header');
    expect(header?.querySelector('.upload-tray-alert svg.lucide-circle-x')).not.toBeNull();
    expect(header?.querySelector('.upload-tray-alert')).toHaveAttribute('aria-hidden', 'true');
    expect(within(bar()).getAllByRole('button')[0]?.querySelector('.upload-tray-alert')).not.toBeNull();
  });

  it('counts the running batch in the title, not the rows settled before it', () => {
    const earlier: UploadItem[] = [
      { id: 1, name: 'lease.pdf', status: 'saved' },
      { id: 2, name: 'invoice.pdf', status: 'saved' },
      { id: 3, name: 'video.mov', status: 'failed', reason: 'Over 10 MB' },
    ];
    const { rerender } = render(<UploadTray items={earlier} />);
    const added: UploadItem[] = [
      { id: 4, name: 'march.pdf', status: 'uploading', progress: 0.1 },
      { id: 5, name: 'april.pdf', status: 'waiting' },
    ];
    rerender(<UploadTray items={[...earlier, ...added]} />);
    expect(wide('Uploading 1 of 2')).toBeInTheDocument();
    // A failed row retried during the batch joins it, and a row that settles in it counts as done.
    rerender(
      <UploadTray
        items={[
          earlier[0] as UploadItem,
          earlier[1] as UploadItem,
          { id: 3, name: 'video.mov', status: 'waiting' },
          { id: 4, name: 'march.pdf', status: 'saved' },
          { id: 5, name: 'april.pdf', status: 'uploading', progress: 0.5 },
        ]}
      />,
    );
    expect(wide('Uploading 2 of 3')).toBeInTheDocument();
    // Settled, every row again.
    rerender(
      <UploadTray
        items={[
          earlier[0] as UploadItem,
          earlier[1] as UploadItem,
          { id: 3, name: 'video.mov', status: 'saved' },
          { id: 4, name: 'march.pdf', status: 'saved' },
          { id: 5, name: 'april.pdf', status: 'saved' },
        ]}
      />,
    );
    expect(wide('5 uploads complete')).toBeInTheDocument();
  });

  it('folds the body, keeps the title and the button name, and sets aria-expanded (uncontrolled)', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    render(<UploadTray items={MIXED} onCollapsedChange={onCollapsedChange} />);
    const fold = screen.getByRole('button', { name: 'Upload details' });
    const body = document.getElementById(fold.getAttribute('aria-controls') ?? '');
    expect(body).toHaveClass('upload-tray-body');
    expect(fold).toHaveAttribute('aria-expanded', 'true');
    await user.click(fold);
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    expect(fold).toHaveAccessibleName('Upload details');
    expect(body).not.toBeVisible();
    expect(wide('Uploading 2 of 5')).toHaveAttribute('data-collapsed');
    expect(onCollapsedChange).toHaveBeenLastCalledWith(true);
    await user.click(fold);
    expect(body).toBeVisible();
    expect(wide('Uploading 2 of 5')).not.toHaveAttribute('data-collapsed');
  });

  it('folds the body, keeps the title and the button name, and sets aria-expanded (controlled)', async () => {
    const user = userEvent.setup();
    const onCollapsedChange = vi.fn();
    const { rerender } = render(
      <UploadTray items={MIXED} isCollapsed onCollapsedChange={onCollapsedChange} />,
    );
    const fold = screen.getByRole('button', { name: 'Upload details' });
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    await user.click(fold);
    // The owner decides: nothing moves until the prop does.
    expect(onCollapsedChange).toHaveBeenCalledWith(false);
    expect(fold).toHaveAttribute('aria-expanded', 'false');
    rerender(<UploadTray items={MIXED} isCollapsed={false} onCollapsedChange={onCollapsedChange} />);
    expect(fold).toHaveAttribute('aria-expanded', 'true');
  });

  it('calls onClear from the close button once nothing is in flight', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { rerender } = render(<UploadTray items={MIXED} onClear={onClear} />);
    // In flight, with no onCancelAll: no close button.
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    rerender(<UploadTray items={SETTLED} onClear={onClear} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });

  it('asks before onCancelAll while in flight, and shows no close button without it', async () => {
    const user = userEvent.setup();
    const onCancelAll = vi.fn();
    render(
      <UploadTray items={MIXED} onCancelAll={onCancelAll} formatCount={(count) => `#${String(count)}`} />,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    // The waiting and uploading files: the one being read is on the server already and has no Cancel.
    const question = await screen.findByRole('alertdialog', { name: 'Cancel #3 uploads?' });
    expect(question).toHaveAccessibleDescription('Files still uploading will not be saved.');
    await user.click(within(question).getByRole('button', { name: 'Keep uploading' }));
    expect(onCancelAll).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Close' }));
    await user.click(
      within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Cancel uploads' }),
    );
    expect(onCancelAll).toHaveBeenCalledTimes(1);
  });

  it('asks in the singular for one upload, and hands a custom question the count and its words', async () => {
    const user = userEvent.setup();
    const one: UploadItem[] = [
      { id: 1, name: 'invoice.pdf', status: 'uploading', progress: 0.3 },
      { id: 2, name: 'statement.pdf', status: 'reading' },
    ];
    const { unmount } = render(<UploadTray items={one} onCancelAll={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByRole('alertdialog', { name: 'Cancel 1 upload?' })).toBeInTheDocument();
    unmount();
    const cancelAllTitle = vi.fn((count: number, formatted: string) => `${String(count)}/${formatted}`);
    render(
      <UploadTray
        items={MIXED}
        onCancelAll={vi.fn()}
        formatCount={(count) => `#${String(count)}`}
        labels={{ cancelAllTitle }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(await screen.findByRole('alertdialog', { name: '3/#3' })).toBeInTheDocument();
    expect(cancelAllTitle).toHaveBeenCalledWith(3, '#3');
  });

  it('counts a file being read as neither cancellable nor holding the page open', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const reading: UploadItem[] = [
      { id: 1, name: 'lease.pdf', status: 'saved' },
      { id: 2, name: 'statement.pdf', status: 'reading' },
    ];
    render(<UploadTray items={reading} onCancelAll={vi.fn()} onClear={vi.fn()} />);
    expect(add.mock.calls.filter(([type]) => type === 'beforeunload')).toHaveLength(0);
    // Nothing to cancel and not yet settled: no close button.
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(wide('Uploading 2 of 2')).toBeInTheDocument();
  });

  it('gives the phone sheet Clear once settled, Cancel uploads while in flight, and neither without handlers', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const onCancelAll = vi.fn();
    const open = async (): Promise<HTMLElement> => {
      await user.click(within(bar()).getAllByRole('button')[0] as HTMLElement);
      return screen.findByRole('dialog');
    };
    const { rerender, unmount } = render(
      <UploadTray items={SETTLED} onClear={onClear} labels={{ close: 'Clear all uploads' }} />,
    );
    let sheet = await open();
    // The sheet's own close only closes it, and is named for that, not for the panel's close button.
    expect(within(sheet).getByRole('button', { name: 'Close' })).toHaveClass('sheet-close');
    expect(within(sheet).queryByRole('button', { name: 'Clear all uploads' })).toBeNull();
    await user.click(within(sheet).getByRole('button', { name: 'Clear' }));
    expect(onClear).toHaveBeenCalledTimes(1);
    rerender(<UploadTray items={MIXED} onCancelAll={onCancelAll} />);
    sheet = screen.getByRole('dialog');
    await user.click(within(sheet).getByRole('button', { name: 'Cancel uploads' }));
    const question = await screen.findByRole('alertdialog', { name: 'Cancel 3 uploads?' });
    await user.click(within(question).getByRole('button', { name: 'Cancel uploads' }));
    expect(onCancelAll).toHaveBeenCalledTimes(1);
    unmount();
    render(<UploadTray items={SETTLED} labels={{ closeSheet: 'Done' }} />);
    sheet = await open();
    expect(
      within(sheet)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label') ?? button.textContent),
    ).toEqual(['Done']);
  });

  it('gives the settled bar a clear X when onClear is given', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    const { rerender } = render(<UploadTray items={MIXED} onClear={onClear} />);
    expect(within(bar()).getAllByRole('button')).toHaveLength(1);
    rerender(<UploadTray items={SETTLED} onClear={onClear} />);
    const [open, clear] = within(bar()).getAllByRole('button');
    expect(open).toHaveAccessibleName('3 uploads complete, 1 failed, 1 needs review');
    expect(clear).toHaveAccessibleName('Clear');
    await user.click(clear as HTMLElement);
    expect(onClear).toHaveBeenCalledTimes(1);
    rerender(<UploadTray items={SETTLED} />);
    expect(within(bar()).getAllByRole('button')).toHaveLength(1);
  });

  it('gives focus to the fold button when Close leaves with focus on it as the last upload settles', () => {
    const uploading: UploadItem = { id: 1, name: 'invoice.pdf', status: 'uploading', progress: 0.9 };
    const { rerender } = render(<UploadTray items={[uploading]} onCancelAll={vi.fn()} />);
    screen.getByRole('button', { name: 'Close' }).focus();
    rerender(<UploadTray items={[{ ...uploading, status: 'saved' }]} onCancelAll={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Upload details' })).toHaveFocus();
  });

  it('gives focus to the fold button after a yes to Cancel all leaves settled rows and no Close', async () => {
    const user = userEvent.setup();
    function Cancelling(): ReactElement {
      const [items, setItems] = useState<UploadItem[]>([
        { id: 1, name: 'lease.pdf', status: 'saved' },
        { id: 2, name: 'invoice.pdf', status: 'uploading', progress: 0.4 },
      ]);
      return (
        <UploadTray
          items={items}
          onCancelAll={() => {
            setItems((each) => each.filter((item) => item.status === 'saved'));
          }}
        />
      );
    }
    render(<Cancelling />);
    await user.click(screen.getByRole('button', { name: 'Close' }));
    const question = await screen.findByRole('alertdialog');
    await user.click(within(question).getByRole('button', { name: 'Cancel uploads' }));
    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).toBeNull();
    });
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Upload details' })).toHaveFocus();
    });
  });

  it('never pulls focus to main once the reader has moved it out of the tray, to the body included', async () => {
    const uploads: UploadItem[] = [{ id: 1, name: 'lease.pdf', status: 'saved' }];
    const { rerender } = render(
      <AppShell floating={<UploadTray items={uploads} onRemove={vi.fn()} />}>page</AppShell>,
    );
    const remove = screen.getByRole('button', { name: 'Remove lease.pdf' });
    remove.focus();
    // A press on the page's empty space.
    remove.blur();
    await Promise.resolve();
    rerender(<AppShell floating={<UploadTray items={[]} onRemove={vi.fn()} />}>page</AppShell>);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(document.body).toHaveFocus();
  });

  it('opens the sheet from the bar and closes it on a row link', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <library.RouterProvider navigate={navigate}>
        <UploadTray items={SETTLED} description="Tap a saved file to open it" />
      </library.RouterProvider>,
    );
    const button = within(bar()).getByRole('button');
    await user.click(button);
    const sheet = await screen.findByRole('dialog', { name: '3 uploads complete, 1 failed, 1 needs review' });
    expect(sheet).toHaveAccessibleDescription('Tap a saved file to open it');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    await user.click(within(sheet).getByRole('link', { name: 'lease.pdf' }));
    expect(navigate.mock.calls[0]?.[0]).toBe('/documents/lease');
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('gives focus to main when it leaves with focus inside, in a shell', async () => {
    const user = userEvent.setup();
    render(
      <AppShell floating={<Uploads initial={[{ id: 1, name: 'lease.pdf', status: 'saved' }]} />}>
        page
      </AppShell>,
    );
    await user.click(screen.getByRole('button', { name: 'Remove lease.pdf' }));
    expect(screen.queryByRole('region', { name: 'Uploads' })).toBeNull();
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('gives focus to the first focusable main outside a shell', async () => {
    const user = userEvent.setup();
    render(
      <>
        <main tabIndex={-1}>page</main>
        <Uploads initial={SETTLED} />
      </>,
    );
    await user.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('leaves focus alone when it leaves with focus elsewhere', async () => {
    const user = userEvent.setup();
    function Page(): ReactElement {
      const [items, setItems] = useState(SETTLED);
      return (
        <AppShell floating={<UploadTray items={items} />}>
          <button
            type="button"
            onClick={() => {
              setItems([]);
            }}
          >
            Clear uploads
          </button>
        </AppShell>
      );
    }
    render(<Page />);
    const clear = screen.getByRole('button', { name: 'Clear uploads' });
    await user.click(clear);
    expect(clear).toHaveFocus();
  });

  it('warns before unload only while in flight and warnsOnUnload', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const listening = (): number => add.mock.calls.filter(([type]) => type === 'beforeunload').length;
    const { rerender } = render(<UploadTray items={SETTLED} />);
    expect(listening()).toBe(0);
    rerender(<UploadTray items={MIXED} warnsOnUnload={false} />);
    expect(listening()).toBe(0);
    rerender(<UploadTray items={MIXED} />);
    expect(listening()).toBe(1);
    const event = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    rerender(<UploadTray items={SETTLED} />);
    const after = new Event('beforeunload', { cancelable: true });
    window.dispatchEvent(after);
    expect(after.defaultPrevented).toBe(false);
  });

  it('writes --upload-tray-offset while it draws and removes it after', () => {
    const observer = stubResizeObserver();
    const root = document.documentElement;
    const { rerender } = render(<UploadTray items={[]} />);
    expect(observer.observed).toHaveLength(0);
    rerender(<UploadTray items={MIXED} />);
    const [panel, phone] = observer.observed;
    expect(panel).toHaveClass('upload-tray');
    expect(phone).toHaveClass('upload-tray-bar');
    if (!panel || !phone) throw new Error('Both faces are observed');
    // The wide face shows; the bar is hidden and measures 0.
    observer.report([
      [panel, 312],
      [phone, 0],
    ]);
    expect(root.style.getPropertyValue('--upload-tray-offset')).toBe('calc(312px + var(--spacing-inset))');
    // The window narrows: the bar shows, the panel measures 0.
    observer.report([
      [panel, 0],
      [phone, 48],
    ]);
    expect(root.style.getPropertyValue('--upload-tray-offset')).toBe('calc(48px + var(--spacing-inset))');
    rerender(<UploadTray items={[]} />);
    expect(root.style.getPropertyValue('--upload-tray-offset')).toBe('');
    expect(observer.observed).toHaveLength(0);
  });

  it('says what the announcements say in its status host, keyed', () => {
    vi.useFakeTimers();
    render(<UploadTray items={MIXED} />);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    // Mounted mid-batch: the batch is the four files in flight, and the saved one was there before it.
    expect(screen.getByRole('status')).toHaveTextContent('Uploading 4 files');
  });

  const AXE_CASES: [string, ReactElement][] = [
    ['open', <UploadTray key="open" items={MIXED} description="About a minute left" onCancelAll={vi.fn()} />],
    ['folded', <UploadTray key="folded" items={MIXED} defaultCollapsed />],
    [
      'settled with close',
      <UploadTray key="settled" items={SETTLED} onClear={vi.fn()} onRemove={vi.fn()} onRetry={vi.fn()} />,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations: %s', async (_, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations: the bar with its clear X, and the open sheet with Clear', async () => {
    const user = userEvent.setup();
    render(<UploadTray items={SETTLED} onRemove={vi.fn()} onClear={vi.fn()} />);
    await expectNoA11yViolations(bar());
    await user.click(within(bar()).getAllByRole('button')[0] as HTMLElement);
    const sheet = await screen.findByRole('dialog');
    await expectNoA11yViolations(sheet);
  });
});
