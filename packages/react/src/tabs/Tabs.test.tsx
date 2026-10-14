import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, useState, type ReactElement } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { RouterProvider } from '../link';
import { Tab, TabList, TabPanel, Tabs } from '.';

const VIEWS = ['All', 'Spending', 'Income', 'Transfers'] as const;

/** Four views of a transactions page, each with a short panel. */
function Views({
  disabled,
  ...props
}: Omit<Parameters<typeof Tabs>[0], 'children'> & { disabled?: string }): ReactElement {
  return (
    <Tabs {...props}>
      <TabList aria-label="Views">
        {VIEWS.map((view) => (
          <Tab key={view} id={view.toLowerCase()} isDisabled={view === disabled}>
            {view}
          </Tab>
        ))}
      </TabList>
      {VIEWS.map((view) => (
        <TabPanel key={view} id={view.toLowerCase()}>
          <p>{view} transactions</p>
        </TabPanel>
      ))}
    </Tabs>
  );
}

/** Link tabs as an app with its view in the URL renders them: the selection is the URL's, and one panel. */
function LinkViews({ view }: { view: string }): ReactElement {
  return (
    <Tabs selectedKey={view} keyboardActivation="manual">
      <TabList aria-label="Views">
        <Tab id="all" href="?view=all">
          All
        </Tab>
        <Tab id="spending" href="?view=spending">
          Spending
        </Tab>
        <Tab id="income" href="?view=income">
          Income
        </Tab>
      </TabList>
      <TabPanel id={view}>
        <p>The {view} view</p>
      </TabPanel>
    </Tabs>
  );
}

const tab = (name: string): HTMLElement => screen.getByRole('tab', { name });
const selectedName = (): string | null =>
  screen.getAllByRole('tab').find((each) => each.getAttribute('aria-selected') === 'true')?.textContent ??
  null;

/** Gives every element the client width `width`, which jsdom leaves at zero, as a row the page draws. */
const drawn = (width = 320) => vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width);

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Tabs', () => {
  it('is a tablist of tabs and a tabpanel named by its tab', () => {
    const { container } = render(<Views defaultSelectedKey="spending" />);
    const list = screen.getByRole('tablist', { name: 'Views' });
    // React Aria builds its collection in a template it puts first.
    expect(container.querySelector(':scope > div')).toHaveClass('tabs');
    expect(list).toHaveClass('tab-list');
    expect(list).toHaveAttribute('aria-orientation', 'horizontal');
    const tabs = within(list).getAllByRole('tab');
    expect(tabs.map((each) => each.textContent)).toEqual([...VIEWS]);
    for (const each of tabs) {
      expect(each).toHaveClass('tab');
      expect(each.tagName).toBe('DIV');
      expect([...each.children].map((child) => child.className)).toEqual(['tab-label']);
    }
    expect(tab('Spending')).toHaveAttribute('aria-selected', 'true');
    expect(tab('Spending')).toHaveAttribute('data-selected', 'true');
    const panel = screen.getByRole('tabpanel', { name: 'Spending' });
    expect(panel).toHaveClass('tab-panel');
    expect(panel).toHaveTextContent('Spending transactions');
    expect(tab('Spending')).toHaveAttribute('aria-controls', panel.id);
  });

  it('selects with the arrows, Home and End under automatic activation', async () => {
    const user = userEvent.setup();
    render(<Views />);
    // The first tab is selected when nothing says otherwise, and Tab enters the row at the selected tab.
    expect(selectedName()).toBe('All');
    await user.tab();
    expect(tab('All')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Spending')).toHaveFocus();
    expect(selectedName()).toBe('Spending');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Spending transactions');
    await user.keyboard('{End}');
    expect(selectedName()).toBe('Transfers');
    await user.keyboard('{Home}');
    expect(selectedName()).toBe('All');
    await user.keyboard('{ArrowLeft}');
    // The arrows wrap: Left from the first tab goes to the last.
    expect(selectedName()).toBe('Transfers');
    await user.keyboard('{ArrowRight}');
    expect(selectedName()).toBe('All');
    // Up and Down do nothing in a horizontal row.
    await user.keyboard('{ArrowDown}');
    expect(selectedName()).toBe('All');
  });

  it('skips a disabled tab with the arrows and never selects it', async () => {
    const user = userEvent.setup();
    render(<Views disabled="Spending" />);
    expect(tab('Spending')).toHaveAttribute('aria-disabled', 'true');
    expect(tab('Spending')).toHaveAttribute('data-disabled', 'true');
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(selectedName()).toBe('Income');
    await user.click(tab('Spending'));
    expect(selectedName()).toBe('Income');
  });

  it('moves focus into the panel on Tab', async () => {
    const user = userEvent.setup();
    render(<Views />);
    await user.tab();
    await user.tab();
    // The panel holds nothing focusable, so React Aria makes the panel itself the next stop.
    expect(screen.getByRole('tabpanel')).toHaveFocus();
  });

  it('takes selectedKey and onSelectionChange, and defaultSelectedKey alone', async () => {
    const user = userEvent.setup();
    const onSelectionChange = vi.fn<(key: Key) => void>();
    function Controlled(): ReactElement {
      const [view, setView] = useState<Key>('income');
      return (
        <Views
          selectedKey={view}
          onSelectionChange={(key) => {
            setView(key);
            onSelectionChange(key);
          }}
        />
      );
    }
    const { unmount } = render(<Controlled />);
    expect(selectedName()).toBe('Income');
    await user.click(tab('Transfers'));
    expect(onSelectionChange).toHaveBeenLastCalledWith('transfers');
    expect(selectedName()).toBe('Transfers');
    unmount();

    // Controlled with no handler, the selection stays where the app puts it.
    const { unmount: unmountFixed } = render(<Views selectedKey="income" />);
    await user.click(tab('All'));
    expect(selectedName()).toBe('Income');
    unmountFixed();

    render(<Views defaultSelectedKey="transfers" />);
    expect(selectedName()).toBe('Transfers');
    await user.click(tab('All'));
    expect(selectedName()).toBe('All');
  });

  it('mounts only the selected panel, and hides a force-mounted one with data-inert', async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<Views defaultSelectedKey="all" />);
    expect(container.querySelectorAll('.tab-panel')).toHaveLength(1);

    rerender(
      <Tabs defaultSelectedKey="preview">
        <TabList aria-label="Example">
          <Tab id="preview">Preview</Tab>
          <Tab id="code">Code</Tab>
        </TabList>
        <TabPanel id="preview" shouldForceMount>
          <button type="button">Run</button>
        </TabPanel>
        <TabPanel id="code" shouldForceMount>
          <button type="button">Copy</button>
        </TabPanel>
      </Tabs>,
    );
    const panels = [...container.querySelectorAll('.tab-panel')];
    expect(panels).toHaveLength(2);
    const [preview, code] = panels;
    expect(preview).not.toHaveAttribute('data-inert');
    expect(preview).toHaveAttribute('role', 'tabpanel');
    // React Aria makes the other panel inert and nothing more; tabs.css hides it by data-inert.
    expect(code).toHaveAttribute('data-inert', 'true');
    expect(code).toHaveAttribute('inert');
    expect(code).not.toHaveAttribute('role');
    await user.click(tab('Code'));
    expect(preview).toHaveAttribute('data-inert', 'true');
    expect(code).not.toHaveAttribute('data-inert');
  });

  it('renders a link tab as an anchor with its href', () => {
    render(<LinkViews view="spending" />);
    const link = tab('Income');
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '?view=income');
    expect(link).toHaveAttribute('role', 'tab');
    expect(link).toHaveClass('tab');
    expect(tab('Spending')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel', { name: 'Spending' })).toHaveTextContent('The spending view');
  });

  it('moves focus without navigating on the arrows under manual activation, and opens the link on Enter and on a press', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn<(path: string) => void>();
    render(
      <RouterProvider navigate={navigate}>
        <LinkViews view="spending" />
      </RouterProvider>,
    );
    await user.tab();
    expect(tab('Spending')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tab('Income')).toHaveFocus();
    expect(navigate).not.toHaveBeenCalled();
    expect(selectedName()).toBe('Spending');
    await user.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate.mock.calls[0]?.[0]).toBe('?view=income');
    // The selection is the URL's: until the app passes the new key, the selected tab stays.
    expect(selectedName()).toBe('Spending');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard(' ');
    expect(navigate).toHaveBeenCalledTimes(2);
    expect(navigate.mock.calls[1]?.[0]).toBe('?view=spending');
    await user.click(tab('All'));
    expect(navigate).toHaveBeenCalledTimes(3);
    expect(navigate.mock.calls[2]?.[0]).toBe('?view=all');
  });

  it('selects the focused tab on Enter or Space under manual activation, and not on the arrows', async () => {
    const user = userEvent.setup();
    render(<Views keyboardActivation="manual" />);
    await user.tab();
    await user.keyboard('{ArrowRight}');
    expect(tab('Spending')).toHaveFocus();
    expect(selectedName()).toBe('All');
    await user.keyboard('{Enter}');
    expect(selectedName()).toBe('Spending');
    await user.keyboard('{End}');
    expect(tab('Transfers')).toHaveFocus();
    expect(selectedName()).toBe('Spending');
    await user.keyboard(' ');
    expect(selectedName()).toBe('Transfers');
  });

  it('describes a changed tab by Changed, or changedLabel, and keeps its name', async () => {
    const { container, rerender } = render(
      <Tabs>
        <TabList aria-label="Settings">
          <Tab id="general">General</Tab>
          <Tab id="rules" isChanged aria-describedby="rules-hint">
            Rules
          </Tab>
        </TabList>
        <p id="rules-hint">Two rules edited.</p>
        <TabPanel id="general">General settings</TabPanel>
        <TabPanel id="rules">Rules settings</TabPanel>
      </Tabs>,
    );
    const rules = screen.getByRole('tab', { name: 'Rules' });
    // The words come first, then the caller's own description.
    expect(rules).toHaveAccessibleDescription('Changed Two rules edited.');
    const dot = container.querySelector('.tab-changed');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot?.parentElement).toBe(rules);
    const words = rules.querySelector('span[hidden]');
    expect(words).toHaveTextContent('Changed');
    expect(rules.getAttribute('aria-describedby')?.split(' ')[0]).toBe(words?.id);
    expect([...rules.children].map((child) => child.className)).toEqual(['tab-label', 'tab-changed', '']);
    await expectNoA11yViolations(container);

    rerender(
      <Tabs>
        <TabList aria-label="Settings">
          <Tab id="general">General</Tab>
          <Tab id="rules" isChanged changedLabel="تغییر کرده">
            Rules
          </Tab>
        </TabList>
        <TabPanel id="general">General settings</TabPanel>
        <TabPanel id="rules">Rules settings</TabPanel>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Rules' })).toHaveAccessibleDescription('تغییر کرده');
  });

  it('draws no dot and no description without isChanged', () => {
    const { container } = render(<Views />);
    expect(container.querySelector('.tab-changed')).toBeNull();
    expect(container.querySelector('.tab span[hidden]')).toBeNull();
    for (const each of screen.getAllByRole('tab')) expect(each).not.toHaveAttribute('aria-describedby');
  });

  it('reverses the arrows under a right-to-left locale', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider locale="fa-IR">
        <Views />
      </I18nProvider>,
    );
    await user.tab();
    await user.keyboard('{ArrowLeft}');
    expect(selectedName()).toBe('Spending');
    await user.keyboard('{ArrowRight}');
    expect(selectedName()).toBe('All');
  });

  it('brings the selected tab into the list after mount by scrolling the list, never the page', () => {
    // The setup's stand-in, since jsdom has no scrollBy on an element; and scrollIntoView, which it lacks too.
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    const scrollIntoView = vi.fn();
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    drawn();
    const box = (left: number, right: number): DOMRect =>
      ({ left, right, top: 0, bottom: 40, width: right - left, height: 40, x: left, y: 0 }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      // A 320px list whose selected last tab ends at 600px.
      if (this.getAttribute('role') === 'tablist') return box(0, 320);
      if (this.getAttribute('aria-selected') === 'true') return box(500, 600);
      return box(0, 0);
    });
    const getComputedStyle = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
      const style = getComputedStyle(element, pseudo);
      if (element instanceof HTMLElement && element.getAttribute('role') === 'tablist') {
        // The track's 4px of padding, which jsdom does not compute.
        return new Proxy(style, {
          get: (target, key) =>
            key === 'paddingInlineStart' ? '4px' : (Reflect.get(target, key) as unknown),
        });
      }
      return style;
    });
    try {
      render(
        <StrictMode>
          <Views defaultSelectedKey="transfers" />
        </StrictMode>,
      );
      expect(scrollBy).toHaveBeenCalled();
      for (const call of scrollBy.mock.calls) expect(call[0]).toEqual({ left: 600 - 320 + 4 });
      const list = screen.getByRole('tablist');
      expect(scrollBy.mock.contexts.every((context) => context === list)).toBe(true);
      expect(scrollIntoView).not.toHaveBeenCalled();
      expect(scrollTo).not.toHaveBeenCalled();
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  it('scrolls the list back toward its start when the selected tab is before it', () => {
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    drawn();
    const box = (left: number, right: number): DOMRect =>
      ({ left, right, top: 0, bottom: 40, width: right - left, height: 40, x: left, y: 0 }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      // A right-to-left row scrolled to its end, the first tab past the list's left edge.
      if (this.getAttribute('role') === 'tablist') return box(100, 420);
      if (this.getAttribute('aria-selected') === 'true') return box(40, 90);
      return box(0, 0);
    });
    render(<Views />);
    expect(scrollBy).toHaveBeenCalledOnce();
    // jsdom computes no padding, so the list's own edge is the line.
    expect(scrollBy).toHaveBeenCalledWith({ left: 40 - 100 });
  });

  it('leaves the list alone when the selected tab is already in view', () => {
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    drawn();
    // jsdom draws every box at zero, inside the list.
    render(<Views defaultSelectedKey="transfers" />);
    expect(scrollBy).not.toHaveBeenCalled();
  });

  /** A 320px list with its four tabs 100px wide from 4px, so "Transfers", 304 to 404, ends past it. */
  const rowOfFour = (): void => {
    const box = (left: number, right: number): DOMRect =>
      ({ left, right, top: 0, bottom: 40, width: right - left, height: 40, x: left, y: 0 }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
      if (this.getAttribute('role') === 'tablist') return box(0, 320);
      const index = VIEWS.findIndex((view) => view === this.textContent);
      return this.getAttribute('role') === 'tab' && index >= 0
        ? box(4 + index * 100, 104 + index * 100)
        : box(0, 0);
    });
  };

  /** Selection held by the caller, as an app with its view in the URL holds it, and moved from outside the row. */
  function Followed({ initial }: { initial: string }): ReactElement {
    const [view, setView] = useState<Key>(initial);
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setView('transfers');
          }}
        >
          Back
        </button>
        <Views selectedKey={view} onSelectionChange={setView} keyboardActivation="manual" />
      </>
    );
  }

  it('brings the selected tab into view when the selection moves later from outside the row', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    const scrollIntoView = vi.fn();
    Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView });
    drawn();
    rowOfFour();
    try {
      render(<Followed initial="all" />);
      expect(scrollBy).not.toHaveBeenCalled();
      // Back moves the selection while focus is on the button, outside the row.
      await user.click(screen.getByRole('button', { name: 'Back' }));
      expect(selectedName()).toBe('Transfers');
      expect(scrollBy).toHaveBeenCalledOnce();
      expect(scrollBy).toHaveBeenCalledWith({ left: 404 - 320 });
      expect(scrollBy.mock.contexts[0]).toBe(screen.getByRole('tablist'));
      expect(scrollIntoView).not.toHaveBeenCalled();
    } finally {
      delete (Element.prototype as Partial<Element>).scrollIntoView;
    }
  });

  it('follows the selection when focus stays on another tab, as after a link tab and Back', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    drawn();
    rowOfFour();
    render(<Followed initial="all" />);
    await user.click(screen.getByRole('button', { name: 'Back' }));
    expect(scrollBy).toHaveBeenCalledOnce();
    scrollBy.mockClear();
    // Focus on "All", still in the row, while the selection moves to "Transfers" again from outside.
    tab('All').focus();
    await user.keyboard('{Enter}');
    expect(selectedName()).toBe('All');
    expect(scrollBy).not.toHaveBeenCalled();
    act(() => {
      screen.getByRole('button', { name: 'Back' }).click();
    });
    expect(tab('All')).toHaveFocus();
    expect(selectedName()).toBe('Transfers');
    expect(scrollBy).toHaveBeenCalledOnce();
  });

  it('leaves the row to the browser when the newly selected tab holds focus', async () => {
    const user = userEvent.setup();
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    drawn();
    rowOfFour();
    render(<Views defaultSelectedKey="all" />);
    await user.tab();
    // The arrows wrap to "Transfers", which takes focus and the selection; the browser shows a focused element.
    await user.keyboard('{ArrowLeft}');
    expect(tab('Transfers')).toHaveFocus();
    expect(selectedName()).toBe('Transfers');
    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('waits for a row mounted hidden to take a width before it brings the selected tab into view', () => {
    const scrollBy = vi.spyOn(Element.prototype, 'scrollBy');
    const width = drawn(0);
    rowOfFour();
    const observers: { callback: () => void; disconnected: boolean }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        record: { callback: () => void; disconnected: boolean };
        constructor(callback: () => void) {
          this.record = { callback, disconnected: false };
          observers.push(this.record);
        }
        observe = (): void => undefined;
        unobserve = (): void => undefined;
        disconnect(): void {
          this.record.disconnected = true;
        }
      },
    );
    try {
      render(<Views defaultSelectedKey="transfers" />);
      // Hidden, every box is zero: nothing is measured, and the row is watched until it is drawn.
      expect(scrollBy).not.toHaveBeenCalled();
      const live = observers.filter((each) => !each.disconnected);
      expect(live).toHaveLength(1);
      width.mockReturnValue(320);
      act(() => {
        live[0]?.callback();
      });
      expect(scrollBy).toHaveBeenCalledOnce();
      expect(scrollBy).toHaveBeenCalledWith({ left: 404 - 320 });
      expect(live[0]?.disconnected).toBe(true);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('passes className and ref to each part', () => {
    const tabsRef = createRef<HTMLDivElement>();
    const listRef = createRef<HTMLDivElement>();
    const tabRef = createRef<HTMLDivElement>();
    const panelRef = createRef<HTMLDivElement>();
    const { container } = render(
      <Tabs ref={tabsRef} className="views" data-testid="views">
        <TabList ref={listRef} className="views-list" aria-label="Views">
          <Tab ref={tabRef} id="all" className="views-tab">
            All
          </Tab>
          <Tab id="spending">Spending</Tab>
        </TabList>
        <TabPanel ref={panelRef} id="all" className="views-panel">
          Everything
        </TabPanel>
        <TabPanel id="spending">Money out</TabPanel>
      </Tabs>,
    );
    expect(tabsRef.current).toBe(container.querySelector(':scope > div'));
    expect(tabsRef.current).toHaveClass('tabs', 'views');
    expect(tabsRef.current).toHaveAttribute('data-testid', 'views');
    expect(listRef.current).toBe(screen.getByRole('tablist'));
    expect(listRef.current).toHaveClass('tab-list', 'views-list');
    expect(tabRef.current).toBe(tab('All'));
    expect(tabRef.current).toHaveClass('tab', 'views-tab');
    expect(panelRef.current).toBe(screen.getByRole('tabpanel'));
    expect(panelRef.current).toHaveClass('tab-panel', 'views-panel');
    // The library's class comes first, so the caller's own rules come after it.
    expect(tabsRef.current?.className).toBe('tabs views');
  });

  it('has no axe violations with panels, with links, with a changed tab and with a disabled one', async () => {
    const panels = render(<Views defaultSelectedKey="income" />);
    await expectNoA11yViolations(panels.container);
    panels.unmount();
    const links = render(<LinkViews view="income" />);
    await expectNoA11yViolations(links.container);
    links.unmount();
    const changed = render(
      <Tabs defaultSelectedKey="rules">
        <TabList aria-label="Settings">
          <Tab id="general" isChanged>
            General
          </Tab>
          <Tab id="rules" isChanged>
            Rules
          </Tab>
        </TabList>
        <TabPanel id="general">General settings</TabPanel>
        <TabPanel id="rules">Rules settings</TabPanel>
      </Tabs>,
    );
    await expectNoA11yViolations(changed.container);
    changed.unmount();
    const disabled = render(<Views disabled="Transfers" />);
    await expectNoA11yViolations(disabled.container);
  });

  it('requires an id on a tab, and has no vertical orientation, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a tab without an id has no key for its panel or the URL
    const idless = <Tab>All</Tab>;
    const vertical = (
      // @ts-expect-error the row is horizontal only
      <Tabs orientation="vertical">
        <TabList aria-label="Views">
          <Tab id="all">All</Tab>
        </TabList>
      </Tabs>
    );
    const fine = <Tab id="all">All</Tab>;
    expect([idless, vertical, fine]).toHaveLength(3);
  });
});
