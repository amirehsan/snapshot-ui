import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement, type ReactNode } from 'react';
import { I18nProvider, RouterProvider, type Key } from 'react-aria-components';
import { expect, fn, waitFor } from 'storybook/test';
import { Badge } from '../badge';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { tokenColor, tokenPixels, washColor } from '../stories/paint';
import { Text } from '../typography';
import { Tab, TabList, TabPanel, Tabs, type TabsProps } from '.';

const VIEWS = [
  { id: 'all', name: 'All', panel: 'Every transaction this month, newest first.' },
  { id: 'spending', name: 'Spending', panel: 'Money out: card payments, bills and transfers you sent.' },
  { id: 'income', name: 'Income', panel: 'Money in: salary, refunds and transfers you received.' },
  { id: 'transfers', name: 'Transfers', panel: 'Moves between your own accounts, which are neither.' },
] as const;

interface ViewsProps extends Omit<TabsProps, 'children'> {
  /** The view that cannot be chosen. */
  disabled?: string;
  /** The view whose panel holds unsaved edits. */
  changed?: string;
}

/** Four views of a transactions page, each with a short panel. */
function Views({ disabled, changed, ...props }: ViewsProps): ReactElement {
  return (
    <Tabs {...props}>
      <TabList aria-label="Transactions">
        {VIEWS.map((view) => (
          <Tab key={view.id} id={view.id} isDisabled={view.id === disabled} isChanged={view.id === changed}>
            {view.name}
          </Tab>
        ))}
      </TabList>
      {VIEWS.map((view) => (
        <TabPanel key={view.id} id={view.id}>
          <Text>{view.panel}</Text>
        </TabPanel>
      ))}
    </Tabs>
  );
}

const meta = {
  title: 'Components/Tabs',
  component: Views,
  args: { defaultSelectedKey: 'spending' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(36rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Views>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** The tab a play reads, by its name. */
function tabNamed(scope: ParentNode, name: string): HTMLElement {
  const tab = [...scope.querySelectorAll<HTMLElement>('[role="tab"]')].find(
    (each) => each.querySelector('.tab-label')?.textContent === name,
  );
  if (!tab) throw new Error(`No tab named ${name}`);
  return tab;
}

/** The name of the selected tab, read from the row. */
const selectedName = (scope: ParentNode): string | null | undefined =>
  scope.querySelector('[role="tab"][aria-selected="true"] .tab-label')?.textContent;

/** Four 40px pills in a canvas track, "Spending" the ink pill; 36px compact, and hit at the target either way. */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const list = find(canvasElement, '.tab-list');
    const spending = tabNamed(canvasElement, 'Spending');
    const all = tabNamed(canvasElement, 'All');
    await expect(spending).toHaveAttribute('aria-selected', 'true');
    await expect(getComputedStyle(spending).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(spending).color).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(all).color).toBe(tokenColor('--color-slate'));
    await expect(getComputedStyle(list).backgroundColor).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(list).borderTopStyle).toBe('none');
    await expect(all.getBoundingClientRect().height).toBe(tokenPixels('--size-control'));
    const hit = parseFloat(getComputedStyle(all, '::before').height);
    await expect(hit).toBeGreaterThanOrEqual(Math.min(tokenPixels('--size-target'), 40));
    await expect(hit).toBeGreaterThanOrEqual(all.getBoundingClientRect().height);
    await expect(canvasElement.querySelector('[role="tabpanel"]')).toHaveTextContent('Money out');
  },
};

/**
 * The clay dot marks a tab whose panel holds unsaved edits. In the first row "Rules" is changed and not
 * selected; in the second the changed tab is the selected one, its dot ringed in canvas on the ink pill.
 */
export const Changed: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      {['general', 'rules'].map((selected) => (
        <Tabs key={selected} defaultSelectedKey={selected}>
          <TabList aria-label={`Settings, ${selected} selected`}>
            <Tab id="general">General</Tab>
            <Tab id="rules" isChanged>
              Rules
            </Tab>
            <Tab id="accounts">Accounts</Tab>
          </TabList>
          <TabPanel id="general">
            <Text>Your name, your currency and the start of your month.</Text>
          </TabPanel>
          <TabPanel id="rules">
            <Text>Two rules edited and not saved.</Text>
          </TabPanel>
          <TabPanel id="accounts">
            <Text>The accounts this budget reads.</Text>
          </TabPanel>
        </Tabs>
      ))}
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const dots = [...canvasElement.querySelectorAll<HTMLElement>('.tab-changed')];
    await expect(dots).toHaveLength(2);
    const [resting, onInk] = dots;
    if (!resting || !onInk) throw new Error('Expected two dots');
    await expect(getComputedStyle(resting).backgroundColor).toBe(tokenColor('--color-clay'));
    await expect(resting.getBoundingClientRect().width).toBe(6);
    await expect(getComputedStyle(resting).outlineStyle).toBe('none');
    await expect(getComputedStyle(onInk).outlineStyle).toBe('solid');
    await expect(getComputedStyle(onInk).outlineColor).toBe(tokenColor('--color-canvas'));
    // The name stays the tab's words; the dot is read as a word through the description.
    const [rules] = canvas.getAllByRole('tab', { name: 'Rules' });
    await expect(rules).toHaveAccessibleDescription('Changed');
  },
};

/** Tab into the row: focus lands on the selected tab, whose ring inverts to canvas and stands inside the pill. */
export const KeyboardFocus: Story = {
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    const spending = tabNamed(canvasElement, 'Spending');
    await expect(spending).toHaveFocus();
    await expect(spending).toHaveAttribute('data-focus-visible', 'true');
    const style = getComputedStyle(spending);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor('--color-canvas'));
    await expect(parseFloat(style.outlineOffset)).toBeLessThan(0);
  },
};

/**
 * Manual activation: the arrows move focus and leave the selection. The focused tab, not selected, takes the
 * standard ring outside it.
 */
export const ManualFocus: Story = {
  args: { keyboardActivation: 'manual' },
  play: async ({ canvasElement, userEvent }) => {
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    const income = tabNamed(canvasElement, 'Income');
    await expect(income).toHaveFocus();
    await expect(selectedName(canvasElement)).toBe('Spending');
    const style = getComputedStyle(income);
    await expect(style.outlineStyle).toBe('solid');
    await expect(style.outlineColor).toBe(tokenColor('--focus-ring-color'));
    await expect(parseFloat(style.outlineOffset)).toBeGreaterThan(0);
  },
};

/**
 * In the first row "Transfers" cannot be chosen: taupe, with the not-allowed cursor, and skipped by the arrows.
 * In the second the whole row is disabled: the selected tab keeps its place as a taupe pill with the disabled
 * fill for its text, its changed dot still ringed in canvas, where taupe on the ink pill would be gone in dark.
 */
export const Disabled: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div data-testid="one">
        <Views {...args} disabled="transfers" />
      </div>
      <div data-testid="row">
        <Views {...args} isDisabled changed="spending" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    const transfers = tabNamed(canvas.getByTestId('one'), 'Transfers');
    await expect(transfers).toHaveAttribute('aria-disabled', 'true');
    await expect(getComputedStyle(transfers).color).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(transfers).cursor).toBe('not-allowed');

    const row = canvas.getByTestId('row');
    const spending = tabNamed(row, 'Spending');
    await expect(spending).toHaveAttribute('aria-selected', 'true');
    await expect(spending).toHaveAttribute('aria-disabled', 'true');
    await expect(getComputedStyle(spending).backgroundColor).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(spending).color).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(spending).cursor).toBe('not-allowed');
    await expect(getComputedStyle(tabNamed(row, 'All')).color).toBe(tokenColor('--color-taupe'));
    const dot = find(spending, '.tab-changed');
    await expect(getComputedStyle(dot).backgroundColor).toBe(tokenColor('--color-clay'));
    await expect(getComputedStyle(dot).outlineStyle).toBe('solid');
    await expect(getComputedStyle(dot).outlineColor).toBe(tokenColor('--color-canvas'));
  },
};

const QUEUES = [
  { id: 'inbox', name: 'Inbox', count: 12 },
  { id: 'review', name: 'Review', count: 3 },
  { id: 'done', name: 'Done', count: 48 },
] as const;

/**
 * A count in each tab's name, in a `Badge`. A badge in a tab takes the tab's color, its edge too: canvas on the
 * selected ink pill, slate at rest and ink under the pointer, where the badge's own slate would be faint on ink
 * and under the text minimum on the wash.
 */
export const WithBadge: Story = {
  render: () => (
    <Tabs defaultSelectedKey="review">
      <TabList aria-label="Queues">
        {QUEUES.map((queue) => (
          <Tab key={queue.id} id={queue.id}>
            {queue.name} <Badge>{queue.count}</Badge>
          </Tab>
        ))}
      </TabList>
      {QUEUES.map((queue) => (
        <TabPanel key={queue.id} id={queue.id}>
          <Text>{`${String(queue.count)} items in ${queue.name.toLowerCase()}.`}</Text>
        </TabPanel>
      ))}
    </Tabs>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const review = canvas.getByRole('tab', { name: 'Review 3' });
    await expect(review).toHaveAttribute('aria-selected', 'true');
    const badge = find(review, '.badge');
    await expect(getComputedStyle(badge).color).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(badge).borderTopColor).toBe(tokenColor('--color-canvas'));
    const inbox = canvas.getByRole('tab', { name: 'Inbox 12' });
    const resting = find(inbox, '.badge');
    await expect(getComputedStyle(resting).color).toBe(tokenColor('--color-slate'));
    await userEvent.hover(inbox);
    await expect(getComputedStyle(inbox).backgroundColor).toBe(washColor(canvasElement));
    await expect(getComputedStyle(resting).color).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(resting).borderTopColor).toBe(tokenColor('--color-ink'));
    await userEvent.unhover(inbox);
  },
};

const MANY = ['All', 'Spending', 'Income', 'Transfers', 'Bills', 'Subscriptions', 'Refunds', 'Archived'];

/** A row of eight in a box of `width`, the last one selected. */
function Many({ width = '20rem' }: { width?: string }): ReactElement {
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <Tabs defaultSelectedKey="archived">
        <TabList aria-label="Transactions">
          {MANY.map((name) => (
            <Tab key={name} id={name.toLowerCase()}>
              {name}
            </Tab>
          ))}
        </TabList>
        {MANY.map((name) => (
          <TabPanel key={name} id={name.toLowerCase()}>
            <Text>{`The ${name.toLowerCase()} view.`}</Text>
          </TabPanel>
        ))}
      </Tabs>
    </div>
  );
}

/**
 * Eight tabs in a 20rem box, the last selected. The row scrolls inside its track, and after mount it brings the
 * selected tab into view, so the first tabs are cut at the start. Storybook renders on the client, so this is
 * the look after hydration; the docs check the server's row, which starts at its first tab.
 */
export const Overflow: Story = {
  render: () => <Many />,
  play: async ({ canvasElement }) => {
    const list = find(canvasElement, '.tab-list');
    const last = tabNamed(canvasElement, 'Archived');
    await waitFor(() => expect(Math.abs(list.scrollLeft)).toBeGreaterThan(0));
    const room = list.getBoundingClientRect();
    const box = last.getBoundingClientRect();
    await expect(box.right).toBeLessThanOrEqual(room.right);
    await expect(box.left).toBeGreaterThanOrEqual(room.left);
    // The row scrolls; the page never does.
    await expect(document.documentElement.scrollWidth).toBe(document.documentElement.clientWidth);
  },
};

/** On a card the canvas track shows as a tint, and the panel takes the card's width. */
export const OnCard: Story = {
  render: (args) => (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardBody>
        <Views {...args} />
      </CardBody>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const list = find(canvasElement, '.tab-list');
    await expect(getComputedStyle(list).backgroundColor).toBe(tokenColor('--color-canvas'));
    await expect(getComputedStyle(find(canvasElement, '.card')).backgroundColor).toBe(
      tokenColor('--color-lifted'),
    );
    await expect(find(canvasElement, '.tab-panel').getBoundingClientRect().width).toBe(
      find(canvasElement, '.tabs').getBoundingClientRect().width,
    );
  },
};

/** Persian names in right to left: the row runs from the right, and nothing is mirrored. One tab is changed. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <Tabs defaultSelectedKey="spending">
          <TabList aria-label="تراکنش‌ها">
            <Tab id="all">همه</Tab>
            <Tab id="spending">هزینه‌ها</Tab>
            <Tab id="income" isChanged changedLabel="تغییر کرده">
              درآمد
            </Tab>
            <Tab id="transfers">انتقال‌ها</Tab>
          </TabList>
          <TabPanel id="all">
            <Text>همه تراکنش‌های این ماه.</Text>
          </TabPanel>
          <TabPanel id="spending">
            <Text>پول خارج‌شده از حساب‌ها.</Text>
          </TabPanel>
          <TabPanel id="income">
            <Text>پول واریزشده به حساب‌ها.</Text>
          </TabPanel>
          <TabPanel id="transfers">
            <Text>جابه‌جایی میان حساب‌های خودتان.</Text>
          </TabPanel>
        </Tabs>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const list = find(canvasElement, '.tab-list').getBoundingClientRect();
    const [first, second] = [...canvasElement.querySelectorAll<HTMLElement>('[role="tab"]')];
    if (!first || !second) throw new Error('Expected tabs');
    await expect(first.getBoundingClientRect().left).toBeGreaterThan(second.getBoundingClientRect().right);
    // The track's 4px of padding, from its right edge.
    await expect(list.right - first.getBoundingClientRect().right).toBeCloseTo(4, 0);
  },
};

/**
 * The keys React Aria gives a tab row, as the docs' Keys table states them. Automatic: the arrows select as they
 * move, wrap from the last tab to the first and skip a disabled tab; Home and End jump; Tab moves into the panel.
 * Manual: the arrows only move focus, and Enter or Space selects.
 */
export const Keys: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div data-testid="automatic">
        <Views defaultSelectedKey="all" disabled="income" />
      </div>
      <div data-testid="manual">
        <Views defaultSelectedKey="all" keyboardActivation="manual" />
      </div>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const automatic = canvas.getByTestId('automatic');
    const manual = canvas.getByTestId('manual');
    await userEvent.tab();
    await expect(tabNamed(automatic, 'All')).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    await expect(selectedName(automatic)).toBe('Spending');
    await userEvent.keyboard('{ArrowRight}');
    // Income is disabled, so the arrow skips it.
    await expect(selectedName(automatic)).toBe('Transfers');
    await userEvent.keyboard('{ArrowRight}');
    await expect(selectedName(automatic)).toBe('All');
    await userEvent.keyboard('{End}');
    await expect(selectedName(automatic)).toBe('Transfers');
    await userEvent.keyboard('{Home}');
    await expect(selectedName(automatic)).toBe('All');
    await userEvent.tab();
    await expect(find(automatic, '[role="tabpanel"]')).toHaveFocus();

    await userEvent.tab();
    await expect(tabNamed(manual, 'All')).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(tabNamed(manual, 'Transfers')).toHaveFocus();
    await expect(selectedName(manual)).toBe('All');
    await userEvent.keyboard('{Enter}');
    await expect(selectedName(manual)).toBe('Transfers');
    await userEvent.keyboard('{Home}');
    await userEvent.keyboard(' ');
    await expect(selectedName(manual)).toBe('All');
  },
};

/** The router the link tabs navigate through, which records each call and leaves the frame where it is. */
const navigate = fn();

/** Link tabs whose selection is the URL's, which this story holds still at "Spending". */
function LinkViews({ children }: { children?: ReactNode }): ReactElement {
  return (
    <RouterProvider navigate={navigate}>
      <Tabs selectedKey="spending" keyboardActivation="manual">
        <TabList aria-label="Transactions">
          {VIEWS.map((view) => (
            <Tab key={view.id} id={view.id} href={`?view=${view.id}`}>
              {view.name}
            </Tab>
          ))}
        </TabList>
        <TabPanel id="spending">
          <Text>{VIEWS[1].panel}</Text>
          {children}
        </TabPanel>
      </Tabs>
    </RouterProvider>
  );
}

/** Link tabs follow the focused tab's link through `RouterProvider` on Enter, and the arrows load nothing. */
export const LinkTabs: Story = {
  tags: ['no-visual'],
  render: () => <LinkViews />,
  play: async ({ canvasElement, userEvent }) => {
    navigate.mockClear();
    const income = tabNamed(canvasElement, 'Income');
    await expect(income.tagName).toBe('A');
    await expect(income).toHaveAttribute('href', '?view=income');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    await expect(income).toHaveFocus();
    await expect(navigate).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    await expect(navigate).toHaveBeenCalledOnce();
    await expect(navigate).toHaveBeenCalledWith('?view=income', undefined);
    await expect(selectedName(canvasElement)).toBe('Spending');
  },
};

/** Under the pointer an unselected tab takes the 5% ink wash and turns ink; the selected tab keeps its fill. */
export const HoverInk: Story = {
  tags: ['no-visual'],
  play: async ({ canvasElement, userEvent }) => {
    const income = tabNamed(canvasElement, 'Income');
    await userEvent.hover(income);
    await expect(getComputedStyle(income).backgroundColor).toBe(washColor(canvasElement));
    await expect(getComputedStyle(income).color).toBe(tokenColor('--color-ink'));
    const spending = tabNamed(canvasElement, 'Spending');
    await userEvent.hover(spending);
    await expect(getComputedStyle(spending).backgroundColor).toBe(tokenColor('--color-ink'));
    await userEvent.unhover(spending);
  },
};

/**
 * A row below the fold with its last tab selected: the row scrolls to it, and the page stays at its top, which
 * `scrollIntoView` would have moved.
 */
export const NoPageScroll: Story = {
  tags: ['no-visual'],
  render: () => (
    <div>
      <div style={{ height: '150vh' }} />
      <Many />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = find(canvasElement, '.tab-list');
    await waitFor(() => expect(Math.abs(list.scrollLeft)).toBeGreaterThan(0));
    await expect(window.scrollY).toBe(0);
  },
};

/** Eight tabs in a 20rem box whose selection the caller holds, moved from a button outside the row as Back moves it. */
function FollowedMany({ hidden = false }: { hidden?: boolean }): ReactElement {
  const [view, setView] = useState<Key>('all');
  const [shown, setShown] = useState(!hidden);
  return (
    <div style={{ display: 'grid', gap: 16, justifyItems: 'start' }}>
      <button
        type="button"
        onClick={() => {
          setView('archived');
        }}
      >
        Back to Archived
      </button>
      <button
        type="button"
        onClick={() => {
          setShown(true);
        }}
      >
        Show the row
      </button>
      <div style={{ width: '20rem', maxWidth: '100%' }} hidden={!shown}>
        <Tabs selectedKey={view} onSelectionChange={setView}>
          <TabList aria-label="Transactions">
            {MANY.map((name) => (
              <Tab key={name} id={name.toLowerCase()}>
                {name}
              </Tab>
            ))}
          </TabList>
          {MANY.map((name) => (
            <TabPanel key={name} id={name.toLowerCase()}>
              <Text>{`The ${name.toLowerCase()} view.`}</Text>
            </TabPanel>
          ))}
        </Tabs>
      </div>
    </div>
  );
}

/**
 * The selection moves later from outside the row, as Back moves it with link tabs: focus is on a button, so the
 * row brings the newly selected last tab into view by moving itself, and the page stays where it is.
 */
export const FollowsSelection: Story = {
  tags: ['no-visual'],
  render: () => <FollowedMany />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const list = find(canvasElement, '.tab-list');
    await expect(list.scrollLeft).toBe(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Back to Archived' }));
    await expect(selectedName(canvasElement)).toBe('Archived');
    await waitFor(() => expect(Math.abs(list.scrollLeft)).toBeGreaterThan(0));
    const room = list.getBoundingClientRect();
    const box = tabNamed(canvasElement, 'Archived').getBoundingClientRect();
    await expect(box.right).toBeLessThanOrEqual(room.right);
    await expect(box.left).toBeGreaterThanOrEqual(room.left);
    await expect(window.scrollY).toBe(0);
  },
};

/**
 * A row mounted hidden with its last tab selected, then shown: hidden, it has no width to measure, so it waits,
 * and once drawn it brings the selected tab into view.
 */
export const MountedHidden: Story = {
  tags: ['no-visual'],
  render: () => <FollowedMany hidden />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Back to Archived' }));
    const list = find(canvasElement, '.tab-list');
    await expect(list.clientWidth).toBe(0);
    await userEvent.click(canvas.getByRole('button', { name: 'Show the row' }));
    await waitFor(() => expect(Math.abs(list.scrollLeft)).toBeGreaterThan(0));
    const room = list.getBoundingClientRect();
    const box = tabNamed(canvasElement, 'Archived').getBoundingClientRect();
    await expect(box.right).toBeLessThanOrEqual(room.right);
    await expect(box.left).toBeGreaterThanOrEqual(room.left);
  },
};

/**
 * Force-mounted panels stay in the page: the one not selected is inert, which jsdom cannot show, and tabs.css
 * hides it by `data-inert`, so its content is neither seen nor reached by Tab.
 */
export const ForceMounted: Story = {
  tags: ['no-visual'],
  render: () => (
    <Tabs defaultSelectedKey="preview">
      <TabList aria-label="Example">
        <Tab id="preview">Preview</Tab>
        <Tab id="code">Code</Tab>
      </TabList>
      <TabPanel id="preview" shouldForceMount>
        <Text>The rendered example.</Text>
      </TabPanel>
      <TabPanel id="code" shouldForceMount>
        <button type="button">Copy code</button>
      </TabPanel>
    </Tabs>
  ),
  play: async ({ canvasElement, userEvent }) => {
    const [preview, code] = [...canvasElement.querySelectorAll<HTMLElement>('.tab-panel')];
    if (!preview || !code) throw new Error('Expected two panels');
    await expect(getComputedStyle(code).display).toBe('none');
    await expect(code.inert).toBe(true);
    await userEvent.tab();
    await userEvent.tab();
    // The preview panel holds nothing focusable, so it is the stop after the row; the hidden copy button is none.
    await expect(preview).toHaveFocus();
    await userEvent.tab();
    await expect(code.contains(document.activeElement)).toBe(false);
    tabNamed(canvasElement, 'Code').click();
    await waitFor(() => expect(getComputedStyle(code).display).not.toBe('none'));
    await expect(getComputedStyle(preview).display).toBe('none');
    await expect(code.inert).toBe(false);
  },
};
