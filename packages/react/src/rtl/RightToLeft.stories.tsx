import type { Meta, StoryObj } from '@storybook/react-vite';
import { House, Settings, ShoppingCart, User } from 'lucide-react';
import { useEffect, useState, type ReactElement, type ReactNode } from 'react';
import { I18nProvider, type Key } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Accordion, AccordionItem } from '../accordion';
import { AppShell } from '../app-shell';
import { Breadcrumb, Breadcrumbs } from '../breadcrumbs';
import { Button } from '../button';
import { RangeCalendar } from '../calendar';
import { Card, CardActions, CardBody, CardHeader, CardNote, CardTitle } from '../card';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { CollapsibleCard } from '../collapsible-card';
import { ComboBox } from '../combo-box';
import { CommandPalette } from '../command-palette';
import { DataTable } from '../data-table';
import { DatePicker } from '../date-picker';
import { DateRangePicker } from '../date-range-picker';
import { DescriptionList, DescriptionListItem } from '../description-list';
import { Dialog, DialogTrigger } from '../dialog';
import { Drawer } from '../drawer';
import { EmptyState } from '../empty-state';
import { FileDropZone, PageDropZone } from '../file-drop-zone';
import { FilterBar } from '../filter-bar';
import { FilterChip } from '../filter-chip';
import { Gauge } from '../gauge';
import { Link, RouterProvider } from '../link';
import { AccountMenu } from '../account-menu';
import { Menu, MenuItem, MenuSection, MenuSeparator, MenuTrigger } from '../menu';
import { MonthGrid } from '../month-grid';
import { MultiSelect } from '../multi-select';
import { NumberField } from '../number-field';
import { PageColumn, PageHeader } from '../page-header';
import { Pagination } from '../pagination';
import { PanelLayout, PanelNav, PanelNavItem, PanelSection } from '../panel-layout';
import { PickerOption } from '../picker';
import { Popover } from '../popover';
import { ProgressBar } from '../progress-bar';
import { Prose } from '../prose';
import { GOALS_GUIDE_FA } from '../prose/fixtures';
import { Radio, RadioGroup } from '../radio-group';
import { Repeater } from '../repeater';
import { SaveBar } from '../save-bar';
import { SearchField } from '../search-field';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { Select } from '../select';
import { Sheet, SheetTrigger } from '../sheet';
import { SidePanel, SidePanelLayout } from '../side-panel';
import { MENU_ROW_A11Y } from '../stories/a11y';
import {
  PERSIAN_LABELS,
  PERSIAN_MONTH_NAMES,
  PERSIAN_SHORT_MONTHS,
  PERSIAN_STATES,
  PERSIAN_SUMMARY,
  PERSIAN_YEARS,
} from '../stories/coverage';
import { filesTransfer, fireDrag, pdf } from '../stories/drag';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { DESKTOP, VIEWPORT_OPTIONS } from '../stories/viewports';
import { firstLineOffset, lineCount } from '../stories/paint';
import { ownContent, Rendered } from '../stories/prose';
import { Switch } from '../switch';
import { Tab, TabList, TabPanel, Tabs } from '../tabs';
import { ThemeMenu, type ThemeChoice } from '../theme-switch';
import { TextArea } from '../text-area';
import { TextField } from '../text-field';
import { toast, ToastRegion } from '../toast';
import { Eyebrow, Text } from '../typography';
import { UploadTray } from '../upload-tray';

/**
 * Right-to-left text, checked for every field in a real browser: layout needs a
 * browser, and a jsdom test cannot place a box. Each story renders a field under
 * React Aria's I18nProvider with an Arabic locale, inside a wrapper whose `dir`
 * is `rtl`, and its play function measures where the parts landed. The words are
 * Arabic so the line really reads right to left; the assertions are about edges,
 * which do not depend on which font draws the letters.
 *
 * The stories are `no-visual`: they assert positions, and a baseline of Arabic
 * text would depend on the font a machine falls back to. The one exception is
 * `Numerals`, which holds Latin digits only, so no fallback font is in its baseline.
 */

/** The width of a form column, in a wrapper that reads right to left. */
function Rtl({ children }: { children: ReactNode }): ReactElement {
  return (
    <I18nProvider locale="ar-EG">
      <div dir="rtl" lang="ar" style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        {children}
      </div>
    </I18nProvider>
  );
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** The box of the last run of text in an element, which is how a row holds its words beside its control. */
function lastText(element: Element): DOMRect {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let last: Node | null = null;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.textContent?.trim()) last = node;
  }
  if (!last) throw new Error('No text in the element');
  const range = document.createRange();
  range.selectNodeContents(last);
  return range.getBoundingClientRect();
}

/** The box of one character of an element's first run of text. */
function characterBox(element: Element, index: number): DOMRect {
  const node = element.firstChild;
  if (node?.nodeType !== Node.TEXT_NODE) throw new Error('The element does not start with text');
  const range = document.createRange();
  range.setStart(node, index);
  range.setEnd(node, index + 1);
  return range.getBoundingClientRect();
}

/** Two edges are the same edge: less than a pixel apart. */
async function expectSameEdge(a: number, b: number): Promise<void> {
  await expect(Math.abs(a - b)).toBeLessThan(1);
}

/** The box lies inside the other, with half a pixel of rounding. */
async function expectInside(inner: DOMRect, outer: DOMRect): Promise<void> {
  await expect(inner.left).toBeGreaterThanOrEqual(outer.left - 0.5);
  await expect(inner.right).toBeLessThanOrEqual(outer.right + 0.5);
}

const meta = {
  title: 'Checks/Right to left',
  tags: ['no-visual'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The label starts at the right edge of the field, the Changed chip follows it
 * to its left, and the count sits under the left end of the control, where a
 * line of Arabic ends. The chip's dot is at the chip's start, which is its right.
 */
export const TextFieldMirrored: Story = {
  render: () => (
    <Rtl>
      <TextField
        label="اسم مساحة العمل"
        description="يظهر هذا الاسم للفريق كله."
        isChanged
        budget={20}
        defaultValue="مساحة عمل الفريق"
      />
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const root = rect(find(canvasElement, '.field'));
    const label = rect(find(canvasElement, '.field-label'));
    const chipElement = find(canvasElement, '.field-changed');
    const chip = rect(chipElement);
    const input = rect(find(canvasElement, '.input'));
    const counter = rect(find(canvasElement, '.field-counter'));
    await expectSameEdge(label.right, root.right);
    await expect(chip.right).toBeLessThan(label.left);
    await expectSameEdge(counter.left, input.left);
    for (const box of [label, chip, input, counter]) await expectInside(box, root);
    const dot = getComputedStyle(chipElement, '::before');
    await expect(dot.right).toBe('0px');
    await expect(parseFloat(getComputedStyle(chipElement).paddingRight)).toBeGreaterThan(0);
    await expect(getComputedStyle(chipElement).paddingLeft).toBe('0px');
  },
};

/** The same arrangement on a text area: label and chip from the right, the count under the left end. */
export const TextAreaMirrored: Story = {
  render: () => (
    <Rtl>
      <TextArea
        label="وصف قصير"
        description="جملة واحدة تظهر في نتائج البحث."
        isChanged
        budget={30}
        defaultValue="مساحة مشتركة لفريق التصميم وضيوفه."
      />
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const root = rect(find(canvasElement, '.field'));
    const label = rect(find(canvasElement, '.field-label'));
    const chip = rect(find(canvasElement, '.field-changed'));
    const area = rect(find(canvasElement, '.textarea'));
    const counter = rect(find(canvasElement, '.field-counter'));
    await expectSameEdge(label.right, root.right);
    await expect(chip.right).toBeLessThan(label.left);
    await expectSameEdge(counter.left, area.left);
    for (const box of [label, chip, area, counter]) await expectInside(box, root);
  },
};

/**
 * The box is at the right end of its row with the words to its left, and the
 * hint is indented past the box on the right, which is the start side. A changed
 * checkbox has its chip to the left of the row, level with the first line of the
 * label, whether the label wraps or not.
 */
export const CheckboxMirrored: Story = {
  render: () => (
    <Rtl>
      <Checkbox defaultSelected description="رسالة قصيرة كل أسبوع.">
        أرسل لي ملخصًا أسبوعيًا
      </Checkbox>
      <Checkbox isChanged>
        أرسل لي ملخصًا قصيرًا بكل تعليق كتبه فريقي على مشاركاتي، مرة كل أسبوع، صباح يوم الثلاثاء
      </Checkbox>
      <Checkbox isChanged>
        الملخص
        <br />
        الأسبوعي
      </Checkbox>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const root = rect(find(canvasElement, '.checkbox-field'));
    const row = rect(find(canvasElement, '.checkbox'));
    const box = rect(find(canvasElement, '.checkbox-box'));
    const text = rect(find(canvasElement, '.checkbox-text'));
    const hint = find(canvasElement, '.field-description');
    await expectSameEdge(row.right, root.right);
    await expectSameEdge(box.right, row.right);
    await expect(text.right).toBeLessThanOrEqual(box.left + 0.5);
    await expectInside(text, root);
    await expect(getComputedStyle(hint).paddingRight).toBe('32px');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    // The changed checkbox with a label that wraps, and the one with a line break.
    const [, wrapped, beside] = [...canvasElement.querySelectorAll<HTMLElement>('.checkbox-field')];
    if (!wrapped || !beside) throw new Error('Three checkboxes expected');
    await expect(lineCount(find(wrapped, '.checkbox-text'))).toBeGreaterThan(1);
    for (const field of [wrapped, beside]) {
      await expect(
        Math.abs(firstLineOffset(find(field, '.checkbox-box'), find(field, '.checkbox-text'))),
      ).toBeLessThanOrEqual(1);
    }
    // The chip is to the left of the row, inside the field, level with the line of the label it follows.
    const chipElement = find(beside, '.field-changed');
    const chip = rect(chipElement);
    await expect(Math.abs(firstLineOffset(chipElement, find(beside, '.checkbox-text')))).toBeLessThanOrEqual(
      1,
    );
    await expect(chip.right).toBeLessThanOrEqual(rect(find(beside, '.checkbox')).left + 0.5);
    await expectInside(chip, rect(beside));
    // The dot is at the chip's start, which is its right.
    await expect(getComputedStyle(chipElement, '::before').right).toBe('0px');
  },
};

/** Every box of a group is at the right end of its row, down a column and along a row alike. */
export const CheckboxGroupMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <CheckboxGroup label="أبلغني عبر" defaultValue={['email']}>
          <Checkbox value="email">البريد</Checkbox>
          <Checkbox value="sms">رسالة نصية</Checkbox>
          <Checkbox value="push">إشعار</Checkbox>
        </CheckboxGroup>
        <CheckboxGroup label="أيام الأسبوع" orientation="horizontal" defaultValue={['sat']}>
          <Checkbox value="sat">السبت</Checkbox>
          <Checkbox value="sun">الأحد</Checkbox>
          <Checkbox value="mon">الإثنين</Checkbox>
        </CheckboxGroup>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const [column, row] = [...canvasElement.querySelectorAll<HTMLElement>('.checkbox-group')];
    if (!column || !row) throw new Error('Two groups expected');
    const columnBoxes = [...column.querySelectorAll('.checkbox-box')].map(rect);
    const columnItems = rect(find(column, '.checkbox-items'));
    await expect(columnBoxes).toHaveLength(3);
    for (const box of columnBoxes) await expectSameEdge(box.right, columnItems.right);
    await expectSameEdge(rect(find(column, '.field-label')).right, rect(column).right);

    // A row of boxes starts at the right: the first option is the rightmost.
    const rowBoxes = [...row.querySelectorAll('.checkbox-box')].map(rect);
    await expect(rowBoxes).toHaveLength(3);
    await expect(rowBoxes[0]?.left ?? 0).toBeGreaterThan(rowBoxes[1]?.left ?? Infinity);
    await expect(rowBoxes[1]?.left ?? 0).toBeGreaterThan(rowBoxes[2]?.left ?? Infinity);
    for (const box of rowBoxes) await expectInside(box, rect(row));
  },
};

/**
 * The dot is at the right of its row, ahead of the words, and the hint is indented past it. A label that
 * wraps keeps the dot level with its first line.
 */
export const RadioGroupMirrored: Story = {
  render: () => (
    <Rtl>
      <RadioGroup label="تكرار النشرة" defaultValue="weekly">
        <Radio value="weekly" description="كل ثلاثاء صباحًا.">
          أسبوعيًا
        </Radio>
        <Radio value="monthly">شهريًا</Radio>
        <Radio value="never">أبدًا</Radio>
        <Radio value="digest">
          ملخص أسبوعي لكل مساحة عمل ومشروع ودعوة تنتمي إليها، يصلك كل ثلاثاء صباحًا مع روابط مباشرة إلى كل
          نقاش
        </Radio>
      </RadioGroup>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const items = rect(find(canvasElement, '.radio-items'));
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('label.radio')];
    await expect(rows).toHaveLength(4);
    const wrapped = rows[3];
    if (!wrapped) throw new Error('Four rows expected');
    await expect(lineCount(find(wrapped, '.radio-text'))).toBeGreaterThan(1);
    for (const row of rows) {
      await expect(
        Math.abs(firstLineOffset(find(row, '.radio-indicator'), find(row, '.radio-text'))),
      ).toBeLessThanOrEqual(1);
      const box = rect(row);
      const dot = rect(find(row, '.radio-indicator'));
      // Row padding (1rem) and edge (1.5px) lie between the row's right edge and the dot.
      await expectSameEdge(box.right - dot.right, 16 + 1.5);
      await expect(lastText(row).right).toBeLessThanOrEqual(dot.left + 0.5);
      await expectSameEdge(box.right, items.right);
      await expectInside(box, items);
    }
    const hint = find(canvasElement, '.field-description');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    await expect(parseFloat(getComputedStyle(hint).paddingRight)).toBeGreaterThan(40);
  },
};

/**
 * The thumb starts at the right of its track and moves to the left when the
 * switch is on, with the same 3px gap at each end. The words are to the left of
 * the track, the Changed chip is to the left of the row, and the hint is
 * indented past the track on the right. A label that wraps keeps the track
 * level with its first line.
 */
export const SwitchMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Switch>الإشعارات متوقفة</Switch>
        <Switch defaultSelected>الإشعارات تعمل</Switch>
        <Switch isChanged description="رسالة كل ثلاثاء.">
          الملخص الأسبوعي
        </Switch>
        <Switch>
          أرسل لي ملخصًا قصيرًا بكل تعليق كتبه فريقي على مشاركاتي، مرة كل أسبوع، صباح يوم الثلاثاء
        </Switch>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('.switch')];
    const [off, on, changed, wrapped] = rows;
    if (!off || !on || !changed || !wrapped) throw new Error('Four switches expected');
    const gaps = (row: HTMLElement): { start: number; end: number } => {
      const track = rect(find(row, '.switch-track'));
      const thumb = rect(find(row, '.switch-thumb'));
      return { start: track.right - thumb.right, end: thumb.left - track.left };
    };
    // Off: one gap from the right (the start). On: one gap from the left (the end).
    await waitFor(async () => {
      await expectSameEdge(gaps(off).start, 3);
      await expectSameEdge(gaps(on).end, 3);
    });
    const thumbOff = rect(find(off, '.switch-thumb'));
    const thumbOn = rect(find(on, '.switch-thumb'));
    await expect(thumbOn.left).toBeLessThan(thumbOff.left);
    // The track is at the right end of its row, and the words follow it to the left.
    for (const row of rows) {
      const track = rect(find(row, '.switch-track'));
      await expectSameEdge(track.right, rect(row).right);
      await expect(lastText(row).right).toBeLessThanOrEqual(track.left + 0.5);
    }
    const wrappedText = find(wrapped, '.switch-text');
    await expect(lineCount(wrappedText)).toBeGreaterThan(1);
    for (const row of rows) {
      await expect(
        Math.abs(firstLineOffset(find(row, '.switch-track'), find(row, '.switch-text'))),
      ).toBeLessThanOrEqual(1);
    }
    // The other fields keep a chip too, which is hidden, so the chip is read from the field that is changed.
    const changedField = find(canvasElement, '.field[data-changed]');
    const chipElement = find(changedField, '.field-changed');
    // The chip is level with the line of the label it follows.
    await expect(Math.abs(firstLineOffset(chipElement, find(changed, '.switch-text')))).toBeLessThanOrEqual(
      1,
    );
    const chip = rect(chipElement);
    await expect(chip.right).toBeLessThanOrEqual(rect(changed).left + 0.5);
    await expectInside(chip, rect(changedField));
    const hint = find(canvasElement, '.field-description');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    await expect(parseFloat(getComputedStyle(hint).paddingRight)).toBeGreaterThan(40);
  },
};

/**
 * The first option is the rightmost, so the track reads right to left, and the
 * arrow keys follow what is seen: Left goes to the option on the left, which is
 * the next one. A stacked control starts its labels at the right.
 */
export const SegmentedControlMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'grid', gap: '2rem' }}>
        <SegmentedControl label="المظهر" defaultValue="light" isChanged>
          <SegmentedControlItem value="light">فاتح</SegmentedControlItem>
          <SegmentedControlItem value="dark">داكن</SegmentedControlItem>
          <SegmentedControlItem value="system">النظام</SegmentedControlItem>
        </SegmentedControl>
        <div style={{ width: '9rem' }}>
          <SegmentedControl label="الخطة" defaultValue="free">
            <SegmentedControlItem value="free">مجانية</SegmentedControlItem>
            <SegmentedControlItem value="team">الفريق</SegmentedControlItem>
            <SegmentedControlItem value="business">الأعمال</SegmentedControlItem>
          </SegmentedControl>
        </div>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement, canvas }) => {
    const [row, stacked] = [...canvasElement.querySelectorAll<HTMLElement>('.segmented')];
    if (!row || !stacked) throw new Error('Two controls expected');

    const options = [...row.querySelectorAll('.segmented-option')].map(rect);
    const track = rect(find(row, '.segmented-track'));
    await expect(options).toHaveLength(3);
    await expect(options[0]?.left ?? 0).toBeGreaterThan(options[1]?.left ?? Infinity);
    await expect(options[1]?.left ?? 0).toBeGreaterThan(options[2]?.left ?? Infinity);
    for (const option of options) await expectInside(option, track);
    await expectSameEdge(rect(find(row, '.field-label')).right, rect(row).right);
    await expect(rect(find(row, '.field-changed')).right).toBeLessThan(rect(find(row, '.field-label')).left);
    // The chosen option is the first, at the right end of the track.
    await expectSameEdge(rect(find(row, '.segmented-option[data-selected]')).right, options[0]?.right ?? 0);

    // Left is forward in right-to-left text: from the first option it chooses the second.
    canvas.getByRole('radio', { name: 'فاتح' }).focus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(canvas.getByRole('radio', { name: 'داكن' })).toBeChecked();
    await userEvent.keyboard('{ArrowRight}');
    await expect(canvas.getByRole('radio', { name: 'فاتح' })).toBeChecked();

    // Stacked: one option per row, the words from the right.
    await waitFor(async () => {
      await expect(stacked).toHaveAttribute('data-stacked');
    });
    for (const option of stacked.querySelectorAll('.segmented-option')) {
      const box = rect(option);
      const words = rect(find(option, '.segmented-label'));
      // The option's inline padding (1rem) lies between its right edge and its words.
      await expectSameEdge(box.right - words.right, 16);
      await expect(words.left).toBeGreaterThan(box.left);
    }
    const stackedOptions = [...stacked.querySelectorAll('.segmented-option')].map(rect);
    await expect(stackedOptions[1]?.top ?? 0).toBeGreaterThan(stackedOptions[0]?.top ?? Infinity);
  },
};

/**
 * The title starts at the right of its row and the chevron is at the left end of the toggle, which is the
 * end of the row in right to left, with the actions after it. Folded, the chevron turns toward the title:
 * to the right, the inline start, and the dot that marks a change follows the title's words, to their left.
 * In a narrow card the actions move under the note, to the right, where the row starts.
 */
export const CollapsibleCardMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <CollapsibleCard
          title="الإشعارات"
          note="أين نصل إليك وكم مرة."
          actions={<Button variant="secondary">إعادة</Button>}
        >
          <p>تحديثات المنتج عند إطلاق شيء جديد.</p>
        </CollapsibleCard>
        <CollapsibleCard title="الفواتير" defaultExpanded={false} isChanged>
          <p>الدفع بالبطاقة كل شهر.</p>
        </CollapsibleCard>
        <div style={{ width: 288 }}>
          <CollapsibleCard
            title="الأمان"
            note="تنبيهات تسجيل الدخول."
            actions={<Button variant="tertiary">إعادة</Button>}
          >
            <p>دائمًا للمالكين.</p>
          </CollapsibleCard>
        </div>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const [open, folded, narrow] = [...canvasElement.querySelectorAll<HTMLElement>('.card-collapsible')];
    if (!open || !folded || !narrow) throw new Error('Three cards expected');
    const toggle = rect(find(open, '.card-toggle'));
    const chevron = rect(find(open, '.card-chevron'));
    const title = rect(find(open, '.card-title'));
    const actions = rect(find(open, '.card-actions'));
    // The words start at the right of the toggle, and the chevron is at its left end.
    await expectSameEdge(lastText(find(open, '.card-toggle-text')).right, toggle.right);
    await expectSameEdge(chevron.left, toggle.left);
    // The actions end the row, which is at the left.
    await expect(actions.right).toBeLessThanOrEqual(title.left + 0.5);
    for (const box of [toggle, actions, rect(find(open, '.card-note'))]) await expectInside(box, rect(open));
    // Open, the chevron points down. Folded, it turns a quarter toward the title, which is to the right.
    await expect(getComputedStyle(find(open, '.card-chevron')).rotate).toBe('none');
    await expect(getComputedStyle(find(folded, '.card-chevron')).rotate).toBe('-90deg');
    // Folded and changed, the dot follows the words a part step to their left, short of the chevron.
    const dot = rect(find(folded, '.card-marker'));
    await expectSameEdge(lastText(find(folded, '.card-toggle-text')).left - dot.right, 8);
    await expect(dot.left).toBeGreaterThan(rect(find(folded, '.card-chevron')).right);
    // Narrow, the note stays under the title and the actions move under the note, starting at the right.
    const narrowTitle = rect(find(narrow, '.card-title'));
    const narrowNote = rect(find(narrow, '.card-note'));
    const narrowAction = rect(find(narrow, '.card-actions .button'));
    await expect(narrowNote.top).toBeGreaterThanOrEqual(narrowTitle.bottom);
    await expect(narrowAction.top).toBeGreaterThanOrEqual(narrowNote.bottom);
    await expectSameEdge(narrowAction.right, narrowTitle.right);
    await expectInside(narrowAction, rect(narrow));
  },
};

/**
 * The drawer at the start comes from the right, the start of a right-to-left line, and the one at the end
 * from the left. Each floats 16px inside its edge, and its header mirrors: the title at the right and the
 * close button at the left end. The drawers portal out of the wrapper, so their direction comes from the
 * locale, which the frame sets on the scrim.
 */
export const DrawerMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'flex', gap: 16 }}>
        <DialogTrigger>
          <Button variant="secondary">افتح القائمة</Button>
          <Drawer title="القائمة" closeLabel="إغلاق">
            <nav aria-label="مساحة العمل">
              <Link href="#overview">نظرة عامة</Link>
            </nav>
          </Drawer>
        </DialogTrigger>
        <DialogTrigger>
          <Button variant="secondary">افتح عوامل التصفية</Button>
          <Drawer placement="end" title="عوامل التصفية" closeLabel="إغلاق">
            <p>المشاريع النشطة فقط.</p>
          </Drawer>
        </DialogTrigger>
      </div>
    </Rtl>
  ),
  play: async ({ canvas }) => {
    const body = within(document.body);
    /** Opens a drawer from its trigger and returns its panel once it has stopped sliding. */
    const openFrom = async (trigger: string): Promise<HTMLElement> => {
      await userEvent.click(canvas.getByRole('button', { name: trigger }));
      const panel = await waitFor(async () => {
        const found = find(document, '.drawer');
        await expect(found).not.toHaveAttribute('data-entering');
        return found;
      });
      await Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => null)));
      return panel;
    };
    /** The close button is at the left end of the header, and the title starts at its right end. */
    const expectMirroredHeader = async (panel: HTMLElement): Promise<void> => {
      const header = rect(find(panel, '.drawer-header'));
      const close = rect(find(panel, '.drawer-close'));
      const title = rect(find(panel, '.drawer-title'));
      await expect(close.left - header.left).toBeGreaterThanOrEqual(0);
      await expect(close.left - header.left).toBeLessThanOrEqual(24);
      await expect(close.right).toBeLessThanOrEqual(title.left + 0.5);
      await expectSameEdge(header.right - title.right, 24);
    };
    const viewport = document.documentElement.clientWidth;

    const start = await openFrom('افتح القائمة');
    await expect(start.parentElement).toHaveAttribute('dir', 'rtl');
    await expect(start).toHaveAttribute('data-side', 'right');
    await expectSameEdge(viewport - rect(start).right, 16);
    await expectMirroredHeader(start);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());

    const end = await openFrom('افتح عوامل التصفية');
    await expect(end).toHaveAttribute('data-side', 'left');
    await expectSameEdge(rect(end).left, 16);
    await expectMirroredHeader(end);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(body.queryByRole('dialog')).not.toBeInTheDocument());
  },
};

/**
 * A menu in right to left mirrors by DOM order and logical properties: the icon leads at the right of the
 * row, the label follows to its left, and the end value, the key chip and the check trail at the left end.
 * The keys of a chip still read left to right, so "Ctrl ," never draws as ", Ctrl".
 */
export const MenuMirrored: Story = {
  // A row is named by its label and described by its key, so axe's label-in-name check is skipped on menu
  // rows alone, as MENU_ROW_A11Y says why.
  parameters: { a11y: MENU_ROW_A11Y },
  render: () => (
    <Rtl>
      <MenuTrigger defaultOpen>
        <Button variant="secondary">الحساب</Button>
        <Menu>
          <MenuSection title="المظهر" selectionMode="single" defaultSelectedKeys={['light']}>
            <MenuItem id="light" icon={<User />}>
              فاتح
            </MenuItem>
            <MenuItem id="dark" icon={<User />}>
              داكن
            </MenuItem>
          </MenuSection>
          <MenuItem id="settings" icon={<Settings />} end="3" shortcut="Mod ,">
            الإعدادات
          </MenuItem>
        </Menu>
      </MenuTrigger>
    </Rtl>
  ),
  play: async () => {
    const popover = await waitFor(async () => {
      const found = find(document, '.menu-popover');
      await expect(found).not.toHaveAttribute('data-entering');
      return found;
    });
    await expect(popover).toHaveAttribute('dir', 'rtl');
    const body = within(document.body);
    for (const name of ['فاتح', 'داكن']) {
      const row = body.getByRole('menuitemradio', { name });
      const icon = rect(find(row, '.menu-item-icon'));
      const label = rect(find(row, '.menu-item-label'));
      const check = rect(find(row, '.menu-item-check'));
      await expect(icon.left).toBeGreaterThanOrEqual(label.right - 0.5);
      await expect(check.right).toBeLessThanOrEqual(label.left + 0.5);
    }
    const settings = body.getByRole('menuitem', { name: 'الإعدادات' });
    const icon = rect(find(settings, '.menu-item-icon'));
    const label = rect(find(settings, '.menu-item-label'));
    const end = rect(find(settings, '.menu-item-end'));
    const chip = find(settings, '.menu-item-shortcut');
    const key = rect(chip);
    await expect(icon.left).toBeGreaterThanOrEqual(label.right - 0.5);
    await expect(end.right).toBeLessThanOrEqual(label.left + 0.5);
    await expect(key.right).toBeLessThanOrEqual(end.left + 0.5);
    // The modifier comes first and the comma last, drawn left to right inside the right-to-left row.
    const modifier = characterBox(chip, 0);
    const comma = characterBox(chip, chip.textContent.length - 1);
    await expect(modifier.left).toBeLessThan(comma.left);
    // The icon sits at the row's right edge, inside its 12px of padding.
    await expectSameEdge(rect(settings).right - icon.right, 12);
  },
};

/** A button that raises one toast, and the region that shows it; the toast goes when the story does. */
function SaveWithToast(): ReactElement {
  useEffect(
    () => () => {
      toast.clear();
    },
    [],
  );
  return (
    <>
      <Button
        variant="secondary"
        onPress={() => {
          toast({ title: 'تم الحفظ', description: 'تغييراتك منشورة الآن.', tone: 'success', timeout: null });
        }}
      >
        احفظ
      </Button>
      <ToastRegion dismissLabel="إغلاق" />
    </>
  );
}

/**
 * The toast region mirrors. React Aria writes `dir` on it from the locale, so the stack sits 16px from the
 * left edge of the viewport, and the stripe, an inline-start border, is on the right of each toast.
 */
export const ToastMirrored: Story = {
  render: () => (
    <Rtl>
      <SaveWithToast />
    </Rtl>
  ),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'احفظ' }));
    const shown = await within(document.body).findByRole('alertdialog', { name: 'تم الحفظ' });
    await Promise.all(shown.getAnimations().map((animation) => animation.finished.catch(() => null)));
    const region = find(document, '.toast-region');
    await expect(region).toHaveAttribute('dir', 'rtl');
    await expectSameEdge(rect(region).left, 16);
    const style = getComputedStyle(shown);
    await expect(style.borderRightWidth).toBe('4px');
    await expect(style.borderLeftWidth).toBe('1px');
  },
};

/**
 * A popover opened at `bottom start` in right to left lines up with its trigger's right edge, the start of
 * a right-to-left line, and React Aria writes `dir` on it.
 */
export const PopoverMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <DialogTrigger defaultOpen>
          <Button variant="secondary">تصفية المشاريع</Button>
          <Popover isPadded>
            <p style={{ margin: 0 }}>المشاريع النشطة فقط.</p>
          </Popover>
        </DialogTrigger>
      </div>
    </Rtl>
  ),
  play: async ({ canvas }) => {
    const popover = await waitFor(async () => {
      const found = find(document, '.popover');
      await expect(found).toHaveAttribute('data-placement', 'bottom');
      await expect(found).not.toHaveAttribute('data-entering');
      return found;
    });
    await Promise.all(popover.getAnimations().map((animation) => animation.finished.catch(() => null)));
    await expect(popover).toHaveAttribute('dir', 'rtl');
    const trigger = rect(canvas.getByRole('button', { name: 'تصفية المشاريع' }));
    await expectSameEdge(rect(popover).right, trigger.right);
  },
};

/**
 * A dialog in right to left: the scrim carries `dir`, the title starts at the right edge of the head, the
 * close button sits at the left corner, and the action row packs to the left, the end of a right-to-left
 * line, with Cancel first in reading order and so to the right of the confirm button.
 */
export const DialogMirrored: Story = {
  render: () => (
    <Rtl>
      <Dialog
        defaultOpen
        title="إعادة تسمية مساحة العمل"
        description="يظهر الاسم الجديد لفريقك."
        hasCloseButton
        closeLabel="إغلاق"
        actions={
          <>
            <Button variant="tertiary" slot="close">
              إلغاء
            </Button>
            <Button>حفظ</Button>
          </>
        }
      />
    </Rtl>
  ),
  play: async () => {
    const panel = await waitFor(async () => {
      const found = find(document, '.dialog');
      await expect(found).not.toHaveAttribute('data-entering');
      return found;
    });
    await Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => null)));
    await expect(find(document, '.dialog-overlay')).toHaveAttribute('dir', 'rtl');
    const box = rect(panel);
    const close = rect(find(panel, '.dialog-close'));
    const headElement = find(panel, '.dialog-head');
    const head = rect(headElement);
    const title = find(panel, '.dialog-title');
    // The close button is in the left half, inside the room the head keeps for it at its left end, the end of
    // the line, and the title starts at the right.
    await expect(close.left - box.left).toBeLessThan(box.right - close.right);
    await expect(parseFloat(getComputedStyle(headElement).paddingLeft)).toBeGreaterThan(0);
    await expect(close.right).toBeLessThanOrEqual(
      head.left + parseFloat(getComputedStyle(headElement).paddingLeft) + 0.5,
    );
    await expectSameEdge(lastText(title).right, head.right);
    const body = within(document.body);
    const cancel = rect(body.getByRole('button', { name: 'إلغاء' }));
    const save = rect(body.getByRole('button', { name: 'حفظ' }));
    const row = rect(find(panel, '.dialog-actions'));
    await expect(save.right).toBeLessThanOrEqual(cancel.left + 0.5);
    await expectSameEdge(save.left, row.left);
    await expect(row.right - cancel.right).toBeGreaterThan(0);
  },
};

/**
 * A sheet in right to left: the overlay carries `dir`, the grabber stays centred, the title starts at the
 * right edge of the header and the close button sits at its left end.
 */
export const SheetMirrored: Story = {
  render: () => (
    <Rtl>
      <SheetTrigger defaultOpen>
        <Button variant="secondary">التصفية</Button>
        <Sheet title="تصفية المعاملات" description="اختر ما يظهر في القائمة." closeLabel="إغلاق">
          <p style={{ margin: 0 }}>المعاملات المقاصة فقط.</p>
        </Sheet>
      </SheetTrigger>
    </Rtl>
  ),
  play: async () => {
    // React Aria slides the sheet in with a scroll and calls it expanded once the whole sheet is in view.
    const sheet = await waitFor(
      async () => {
        await expect(find(document, '.sheet-overlay')).not.toHaveAttribute('data-entering');
        const found = find(document, '.sheet');
        await expect(found).toHaveAttribute('data-expanded');
        return found;
      },
      { timeout: 5000 },
    );
    await expect(find(document, '.sheet-overlay')).toHaveAttribute('dir', 'rtl');
    const box = rect(sheet);
    const grabber = rect(find(sheet, '.sheet-grabber'));
    await expect(Math.abs(grabber.left + grabber.width / 2 - (box.left + box.width / 2))).toBeLessThan(1);
    const header = rect(find(sheet, '.sheet-header'));
    const text = rect(find(sheet, '.sheet-header-text'));
    const close = rect(find(sheet, '.sheet-close'));
    await expect(close.right).toBeLessThanOrEqual(text.left + 0.5);
    await expect(close.left - header.left).toBeLessThan(header.right - close.right);
    await expectSameEdge(lastText(find(sheet, '.sheet-title')).right, text.right);
  },
};

/**
 * The palette in right to left: the scrim carries `dir`, the magnifying glass leads at the right of the
 * field, the typed text starts beside it, and the Esc key trails at the left, the end of the line.
 */
export const CommandPaletteMirrored: Story = {
  render: () => (
    <Rtl>
      <CommandPalette
        label="ابحث في التطبيق"
        defaultOpen
        onAction={() => undefined}
        items={[
          { id: 'budgets', label: 'الميزانيات' },
          { id: 'accounts', label: 'الحسابات' },
        ]}
      />
    </Rtl>
  ),
  play: async () => {
    const panel = await waitFor(async () => {
      const found = find(document, '.command-palette');
      await expect(found).not.toHaveAttribute('data-entering');
      return found;
    });
    await Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => null)));
    await expect(find(document, '.command-palette-overlay')).toHaveAttribute('dir', 'rtl');
    const glass = rect(find(panel, '.command-palette-glass'));
    const input = rect(find(panel, '.command-palette-input'));
    const escape = rect(find(panel, '.command-palette-field .kbd'));
    await expect(glass.left).toBeGreaterThanOrEqual(input.right - 0.5);
    await expect(escape.right).toBeLessThanOrEqual(input.left + 0.5);
    await expect(getComputedStyle(find(panel, '.command-palette-input')).direction).toBe('rtl');
  },
};

/**
 * The search field in Persian, as the consumer's guide is: the magnifier sits at the right end of the control,
 * the start of a right-to-left line, and the clear button at the left end, both inside the input's box. Neither
 * glyph is mirrored, since a magnifier and a cross have no reading direction.
 */
export const SearchFieldMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <SearchField label="جستجوی تراکنش‌ها" defaultValue="قهوه" clearLabel="پاک کردن جستجو" />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const control = rect(find(canvasElement, '.search-field-control'));
    const input = rect(find(canvasElement, '.search-field-input'));
    const icon = rect(find(canvasElement, '.search-field-icon svg'));
    const clear = rect(find(canvasElement, '.search-field-clear'));
    await expectInside(icon, input);
    await expectInside(clear, input);
    // The icon in the right half of the control, the clear button in the left half.
    const middle = control.left + control.width / 2;
    await expect(icon.left).toBeGreaterThan(middle);
    await expect(clear.right).toBeLessThan(middle);
    await expect(input.right - icon.right).toBeCloseTo(16, 0);
    await expect(clear.left - input.left).toBeCloseTo(6, 0);
    await expect(getComputedStyle(find(canvasElement, '.search-field-icon svg')).scale).toBe('none');
  },
};

/**
 * The select in Persian: the label starts at the right edge of the field, the value starts at the trigger's
 * right padding, and the chevron sits at the left end, unmirrored. The open list's rows put the icon at the
 * right, the start of the line, and the check at the left, the end.
 */
export const SelectMirrored: Story = {
  // An option is named by its label and described by its hint and its end value, as MENU_ROW_A11Y says why.
  parameters: { a11y: MENU_ROW_A11Y },
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Select label="دسته" defaultValue="groceries" defaultOpen>
          <PickerOption id="groceries" icon={<ShoppingCart />} end="۱٬۲۰۴ دلار">
            خرید روزانه
          </PickerOption>
          <PickerOption id="rent" icon={<House />}>
            اجاره
          </PickerOption>
        </Select>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const popover = await waitFor(async () => {
      const found = find(document, '.select-popover');
      await expect(found).not.toHaveAttribute('data-entering');
      return found;
    });
    const field = rect(find(canvasElement, '.select'));
    const label = rect(find(canvasElement, '.field-label'));
    const trigger = find(canvasElement, '.select-trigger');
    const value = rect(find(trigger, '.select-value'));
    const chevron = rect(find(trigger, '.select-chevron'));
    await expectSameEdge(label.right, field.right);
    // The value starts 1.5rem in from the trigger's right edge: its start padding, past the 1px edge.
    const startPadding = parseFloat(getComputedStyle(trigger).paddingRight);
    const edge = parseFloat(getComputedStyle(trigger).borderRightWidth);
    await expectSameEdge(value.right, rect(trigger).right - edge - startPadding);
    await expect(chevron.right).toBeLessThanOrEqual(value.left + 0.5);
    await expect(getComputedStyle(find(trigger, '.select-chevron svg')).scale).toBe('none');
    await expect(popover).toHaveAttribute('dir', 'rtl');
    for (const name of ['خرید روزانه', 'اجاره']) {
      const row = within(document.body).getByRole('option', { name });
      const icon = rect(find(row, '.menu-item-icon'));
      const text = rect(find(row, '.menu-item-label'));
      const check = rect(find(row, '.menu-item-check'));
      await expect(icon.left).toBeGreaterThanOrEqual(text.right - 0.5);
      await expect(check.right).toBeLessThanOrEqual(text.left + 0.5);
    }
  },
};

/**
 * The combo box in Persian: the label starts at the right edge of the field, the text starts at the input's
 * right padding, and the field button sits at the left end, 6px inside the control, unmirrored.
 */
export const ComboBoxMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <ComboBox label="فروشنده" defaultValue="cafe" labels={{ open: 'نمایش گزینه‌ها' }}>
          <PickerOption id="cafe">کافه لونا</PickerOption>
          <PickerOption id="mart">بقالی سر کوچه</PickerOption>
        </ComboBox>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const field = rect(find(canvasElement, '.combo-box'));
    const label = rect(find(canvasElement, '.field-label'));
    const control = rect(find(canvasElement, '.combo-box-control'));
    const input = find(canvasElement, '.combo-box-input');
    const button = rect(find(canvasElement, '.combo-box-button'));
    await expectSameEdge(label.right, field.right);
    await expectInside(button, control);
    await expect(button.left - control.left).toBeCloseTo(6, 0);
    // The text's start is the right: the input's start padding there, the room for the button at the left.
    const style = getComputedStyle(input);
    await expect(style.textAlign === 'start' || style.textAlign === 'right').toBe(true);
    await expect(style.direction).toBe('rtl');
    await expect(parseFloat(style.paddingRight)).toBe(24);
    await expect(parseFloat(style.paddingLeft)).toBe(48);
    await expect(getComputedStyle(find(canvasElement, '.combo-box-button svg')).scale).toBe('none');
  },
};

/**
 * The multi-select in Persian: the tags run from the frame's right, React Aria's arrows follow the locale, so
 * Arrow Left moves from the first tag to the second, and the field button sits at the left end, unmirrored.
 */
export const MultiSelectMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <MultiSelect
          label="دسته‌ها"
          defaultValue={['food', 'rent']}
          labels={{ open: 'نمایش گزینه‌ها', remove: 'حذف', selected: 'انتخاب‌شده' }}
        >
          <PickerOption id="food">خوراک</PickerOption>
          <PickerOption id="rent">اجاره</PickerOption>
          <PickerOption id="fun">تفریح</PickerOption>
        </MultiSelect>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const field = rect(find(canvasElement, '.multi-select'));
    const label = rect(find(canvasElement, '.field-label'));
    const frame = rect(find(canvasElement, '.multi-select-control'));
    const [first, second] = [...canvasElement.querySelectorAll<HTMLElement>('.multi-select-tag')];
    if (!first || !second) throw new Error('Expected two tags');
    const button = rect(find(canvasElement, '.combo-box-button'));
    await expectSameEdge(label.right, field.right);
    await expect(rect(first).left).toBeGreaterThan(rect(second).right);
    await expect(frame.right - rect(first).right).toBeCloseTo(9, 0);
    await expectInside(button, frame);
    // 6px inside the frame's 1px edge.
    await expect(button.left - frame.left).toBeCloseTo(7, 0);
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(second).toHaveFocus();
  },
};

/**
 * A tab row under a Persian locale and `dir="rtl"`: the tabs run from the right, the first at the track's right
 * edge inside its padding, and Arrow Left, the reading direction, selects the next tab, since React Aria's
 * arrows follow the locale. The changed dot sits after the name, at its left. Nothing is mirrored.
 */
export const TabsMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
        <Tabs defaultSelectedKey="all">
          <TabList aria-label="تراکنش‌ها">
            <Tab id="all">همه</Tab>
            <Tab id="spending" isChanged changedLabel="تغییر کرده">
              هزینه‌ها
            </Tab>
            <Tab id="income">درآمد</Tab>
          </TabList>
          <TabPanel id="all">همه تراکنش‌ها</TabPanel>
          <TabPanel id="spending">هزینه‌ها</TabPanel>
          <TabPanel id="income">درآمد</TabPanel>
        </Tabs>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const list = rect(find(canvasElement, '.tab-list'));
    const [first, second, third] = [...canvasElement.querySelectorAll<HTMLElement>('[role="tab"]')];
    if (!first || !second || !third) throw new Error('Expected three tabs');
    await expect(list.right - rect(first).right).toBeCloseTo(4, 0);
    await expect(rect(first).left).toBeGreaterThan(rect(second).right);
    await expect(rect(second).left).toBeGreaterThan(rect(third).right);
    // The dot follows the name, so in right to left it is at the name's left.
    await expect(rect(find(second, '.tab-changed')).right).toBeLessThanOrEqual(
      rect(find(second, '.tab-label')).left,
    );
    await userEvent.tab();
    await expect(first).toHaveFocus();
    await userEvent.keyboard('{ArrowLeft}');
    await expect(second).toHaveFocus();
    await expect(second).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowRight}');
    await expect(first).toHaveAttribute('aria-selected', 'true');
  },
};

/**
 * Pagination under a Persian locale and `dir="rtl"`, page 12 of 26 with Persian digits: the list runs from the
 * right, so Previous is at the right edge and Next at the left; Previous's chevron is mirrored to point right,
 * the way it goes; and a page's digits still read left to right, since the number is isolated.
 */
export const PaginationMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(40rem, calc(100vw - 2rem))' }}>
        <Pagination
          page={12}
          pageCount={26}
          rangeLabel="۵۵۱ تا ۶۰۰ از ۱٬۲۸۴"
          getPageHref={(page) => `#page-${String(page)}`}
          pageLabel={(page) => String(page).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit)}
          labels={{ navigation: 'صفحه‌ها', previous: 'قبلی', next: 'بعدی', page: (label) => `صفحه ${label}` }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const list = rect(find(canvasElement, '.pagination-list'));
    const previous = find(canvasElement, '.pagination-step[data-step="previous"]');
    const next = find(canvasElement, '.pagination-step[data-step="next"]');
    await expect(list.right - rect(previous).right).toBeCloseTo(0, 0);
    await expect(rect(next).left - list.left).toBeCloseTo(0, 0);
    const controls = [...canvasElement.querySelectorAll<HTMLElement>('.pagination-control')];
    for (let index = 1; index < controls.length; index += 1) {
      const before = controls[index - 1];
      const after = controls[index];
      if (!before || !after) continue;
      // Each control in DOM order sits to the left of the one before it.
      await expect(rect(after).right).toBeLessThanOrEqual(rect(before).left);
    }
    await expect(getComputedStyle(find(previous, 'svg')).scale).toBe('-1 1');
    // The digits of one number keep their order: "۱" then "۲", left to right.
    const twelve = controls.find((each) => each.textContent === '۱۲');
    if (!twelve?.firstChild) throw new Error('No page ۱۲');
    const digit = (offset: number): DOMRect => {
      const range = document.createRange();
      range.setStart(twelve.firstChild as Node, offset);
      range.setEnd(twelve.firstChild as Node, offset + 1);
      return range.getBoundingClientRect();
    };
    await expect(digit(0).right).toBeLessThanOrEqual(digit(1).left + 0.5);
    await expect(twelve).toHaveAttribute('aria-current', 'page');
  },
};

/**
 * A money field on a Persian page: the sign button at the control's right, the field's start, and "تومان" at its
 * end, left of the figure. The input is a figure, left to right on every page, so its paddings are swapped:
 * its right padding is the lead, the sign button's room, and its left padding the trail and the symbol's room
 * (plan, spec correction 9).
 */
export const NumberFieldMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
        <NumberField
          label="مبلغ"
          money={{ symbol: 'تومان', symbolPosition: 'end', fractionDigits: 0 }}
          allowsNegative
          defaultValue={1250000}
          labels={{ negative: 'منفی' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const control = rect(find(canvasElement, '.number-field-control'));
    const input = find(canvasElement, '.number-field-input');
    const sign = rect(find(canvasElement, '.number-field-sign'));
    const symbol = find(canvasElement, '.number-field-symbol');
    await expect(symbol).toHaveTextContent('تومان');
    // The sign button is at the right, 6px in.
    await expect(control.right - sign.right).toBeCloseTo(6, 0);
    const style = getComputedStyle(input);
    await expect(style.direction).toBe('ltr');
    // The paddings are swapped: the right is the lead, which the sign button sets to a field's height.
    await expect(parseFloat(style.paddingRight)).toBeCloseTo(rect(input).height, 0);
    await expect(parseFloat(style.paddingLeft)).toBeGreaterThan(24);
    // The symbol sits in the left padding, left of the figure.
    await expect(rect(symbol).right).toBeLessThanOrEqual(
      rect(input).left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
    );
    await expect(rect(symbol).left).toBeGreaterThan(control.left);
  },
};

/**
 * A range calendar on a Persian page: the previous-month button at the header's right with its chevron pointing
 * right, the mirror the attribute sets, and React Aria's arrows in the drawn direction, so Arrow Right moves to
 * the day before.
 */
export const CalendarMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(20rem, calc(100vw - 2rem))' }}>
        <RangeCalendar
          aria-label="دوره"
          today="2026-09-18"
          labels={{ previous: 'ماه قبل', next: 'ماه بعد' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const header = rect(find(canvasElement, '.calendar-header'));
    const previous = within(canvasElement).getByRole('button', { name: 'ماه قبل' });
    const next = within(canvasElement).getByRole('button', { name: 'ماه بعد' });
    await expect(header.right - rect(previous).right).toBeLessThan(1);
    await expect(rect(next).left - header.left).toBeLessThan(1);
    // ChevronLeft, mirrored, points right: outward, toward the earlier month.
    const chevron = find(previous, 'svg');
    await expect(getComputedStyle(chevron).scale).toBe('-1 1');
    for (let step = 0; step < 8 && !document.activeElement?.classList.contains('calendar-day'); step += 1) {
      await userEvent.tab();
    }
    // Today, 18 September, is 27 Shahrivar; Arrow Right moves to the 26th, the day before.
    await expect(document.activeElement).toHaveTextContent('۲۷');
    await userEvent.keyboard('{ArrowRight}');
    await expect(document.activeElement).toHaveTextContent('۲۶');
  },
};

/**
 * A range field on a Persian page: the start date at the frame's right, the arrow pointing left from it to the
 * end date, and the calendar button at the left, the frame's end. Each date keeps its own order, and Arrow Left
 * moves to the segment drawn to the left of the focused one, as React Aria reads the drawn direction.
 */
export const DateRangePickerMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(24rem, calc(100vw - 2rem))' }}>
        <DateRangePicker
          label="دوره"
          defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
          today="2026-09-18"
          labels={{ open: 'انتخاب تاریخ', start: 'تاریخ شروع', end: 'تاریخ پایان' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.date-range-control');
    const [start, end] = [...frame.querySelectorAll('.date-range-input')];
    if (!start || !end) throw new Error('Two dates');
    const arrow = find(frame, '.date-range-arrow');
    const button = within(canvasElement).getByRole('button', { name: /^انتخاب تاریخ/ });
    // The start is at the right, the end to its left, the button at the left end.
    await expect(rect(start).left).toBeGreaterThan(rect(arrow).right - 0.5);
    await expect(rect(arrow).left).toBeGreaterThan(rect(end).right - 0.5);
    await expect(rect(end).left).toBeGreaterThan(rect(button).right - 0.5);
    await expect(rect(button).left - rect(frame).left).toBeLessThan(12);
    // ArrowRight, mirrored, points left: from the start toward the end.
    await expect(getComputedStyle(find(arrow, 'svg')).scale).toBe('-1 1');
    // Arrow Left moves to the segment drawn to the left of the focused one.
    const segments = [...frame.querySelectorAll<HTMLElement>('.date-segment:not([data-type="literal"])')];
    const first = segments[0];
    if (!first) throw new Error('No segment');
    first.focus();
    const from = rect(first);
    await userEvent.keyboard('{ArrowLeft}');
    const focused = document.activeElement;
    if (!(focused instanceof HTMLElement)) throw new Error('No focus');
    await expect(focused).toHaveClass('date-segment');
    await expect(focused).not.toBe(first);
    await expect(rect(focused).right).toBeLessThanOrEqual(from.left + 0.5);
  },
};

/**
 * A date picker in right to left: the button and the changed dot at the frame's left, the dot to the button's right,
 * and the segments in the Persian calendar's own order, year first at the right.
 */
export const DatePickerMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(20rem, calc(100vw - 2rem))', display: 'grid', gap: 16 }}>
        <DatePicker
          label="تاریخ"
          defaultValue="2026-10-14"
          today="2026-10-16"
          labels={{ open: 'انتخاب تاریخ' }}
        />
        <DatePicker
          aria-label="تاریخ رسید"
          defaultValue="2026-10-14"
          today="2026-10-16"
          isChanged
          changedLabel="تغییر کرده"
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const [labelled, changed] = [...canvasElement.querySelectorAll<HTMLElement>('.date-picker-control')];
    if (!labelled || !changed) throw new Error('Two frames');
    const button = within(canvasElement).getByRole('button', { name: /^انتخاب تاریخ/ });
    // The button at the left end.
    await expect(rect(button).left - rect(labelled).left).toBeLessThan(12);
    // 14 October 2026 is 22 Mehr 1405: the year at the right, then the month, then the day to its left.
    const segments = [...labelled.querySelectorAll<HTMLElement>('.date-segment:not([data-type="literal"])')];
    await expect(segments.map((each) => each.textContent)).toEqual(['۱۴۰۵', '۷', '۲۲']);
    const [year, month, day] = segments;
    if (!year || !month || !day) throw new Error('Three segments');
    await expect(rect(year).left).toBeGreaterThan(rect(month).right - 0.5);
    await expect(rect(month).left).toBeGreaterThan(rect(day).right - 0.5);
    await expect(rect(day).left).toBeGreaterThan(rect(button).right - 0.5);
    // The changed dot sits between the date and the button, a part step from the button, on the left.
    const mark = find(changed, '.field-changed-mark');
    const own = find(changed, '.date-picker-button');
    const first = [...changed.querySelectorAll<HTMLElement>('.date-segment:not([data-type="literal"])')].at(
      -1,
    );
    if (!first) throw new Error('No segment');
    await expect(rect(mark).left).toBeGreaterThanOrEqual(rect(own).right - 0.5);
    await expect(rect(mark).right).toBeLessThanOrEqual(rect(first).left + 0.5);
  },
};

/**
 * A filter chip in right to left: the pill runs from the right, so its label is at the right and its clear button
 * at the left end, and neither the chevron nor the X is mirrored, since neither has a direction.
 */
export const FilterChipMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <FilterChip
          label="دسته"
          selectionMode="multiple"
          value={['food', 'rent']}
          onChange={() => undefined}
          labels={{ summary: (texts) => texts.join('، '), clear: (label) => `پاک کردن ${label}` }}
        >
          <PickerOption id="food">غذا</PickerOption>
          <PickerOption id="rent">اجاره</PickerOption>
        </FilterChip>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const pill = find(canvasElement, '.filter-chip');
    const label = find(pill, '.filter-chip-label');
    const value = find(pill, '.filter-chip-value');
    const chevron = find(pill, '.filter-chip-chevron');
    const clear = within(canvasElement).getByRole('button', { name: 'پاک کردن دسته' });
    // From the right: the label, the value, the chevron, then the clear button at the left end.
    await expect(rect(pill).right - rect(label).right).toBeCloseTo(17, 0);
    await expect(rect(label).left).toBeGreaterThan(rect(value).right - 0.5);
    await expect(rect(value).left).toBeGreaterThan(rect(chevron).right - 0.5);
    await expect(rect(chevron).left).toBeGreaterThan(rect(clear).right - 0.5);
    await expect(rect(clear).left - rect(pill).left).toBeCloseTo(1, 0);
    // Nothing mirrors.
    for (const glyph of [find(chevron, 'svg'), find(clear, 'svg')]) {
      await expect(getComputedStyle(glyph).scale).toBe('none');
      await expect(getComputedStyle(glyph).transform).toBe('none');
    }
  },
};

/**
 * A filter bar in right to left: the bar runs from the right, so the search is at its right edge, the chips follow
 * leftward from it, and Clear all is at the left end, its inline end.
 */
export const FilterBarMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: '60rem', maxWidth: '100%' }}>
        <FilterBar
          search={<SearchField aria-label="جستجو" />}
          onClearAll={() => undefined}
          labels={{ filters: 'فیلترها', more: 'بیشتر', clearAll: 'پاک کردن همه' }}
        >
          <FilterChip label="دسته" selectionMode="single" value="food" onChange={() => undefined}>
            <PickerOption id="food">غذا</PickerOption>
            <PickerOption id="rent">اجاره</PickerOption>
          </FilterChip>
          <FilterChip label="حساب" selectionMode="multiple" value={[]} onChange={() => undefined}>
            <PickerOption id="checking">جاری</PickerOption>
          </FilterChip>
          <FilterChip
            label="برچسب"
            selectionMode="multiple"
            isSecondary
            value={[]}
            onChange={() => undefined}
          >
            <PickerOption id="rent">اجاره</PickerOption>
          </FilterChip>
        </FilterBar>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const bar = find(canvasElement, '.filter-bar');
    const search = find(bar, '.filter-bar-search');
    const pills = [...bar.querySelectorAll<HTMLElement>('.filter-bar-row .filter-chip')];
    const clearAll = find(bar, '.filter-bar-clear-all');
    // The search at the right edge, the chips leftward from it in declared order, More last.
    await expect(rect(bar).right - rect(search).right).toBeCloseTo(0, 0);
    let previous = rect(search).left;
    for (const pill of pills) {
      await expect(rect(pill).right).toBeLessThanOrEqual(previous + 0.5);
      previous = rect(pill).left;
    }
    await expect(pills.at(-1)).toHaveClass('filter-bar-more');
    // Clear all at the left end, past the last chip.
    await expect(rect(clearAll).left - rect(bar).left).toBeCloseTo(0, 0);
    await expect(rect(clearAll).right).toBeLessThanOrEqual(previous + 0.5);
  },
};

/**
 * An empty state on a Persian page: the column is centered, so the title and the action sit on the box's middle
 * as on an English page, and the description reads right to left.
 */
export const EmptyStateMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(40rem, calc(100vw - 2rem))' }}>
        <EmptyState
          title="تراکنشی در این ماه نیست"
          description="تراکنش‌هایی که اضافه یا وارد می‌کنید اینجا نشان داده می‌شوند."
          action={<Button variant="secondary">وارد کردن تراکنش‌ها</Button>}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const box = rect(find(canvasElement, '.empty-state'));
    const middle = box.left + box.width / 2;
    const centre = (element: HTMLElement): number => {
      const { left, width } = rect(element);
      return left + width / 2;
    };
    await expect(Math.abs(centre(find(canvasElement, '.empty-state-title')) - middle)).toBeLessThan(1);
    await expect(Math.abs(centre(find(canvasElement, '.empty-state-action .button')) - middle)).toBeLessThan(
      1,
    );
    const description = find(canvasElement, '.empty-state-description');
    await expect(getComputedStyle(description).direction).toBe('rtl');
    await expectInside(rect(description), box);
  },
};

/**
 * A description list on a Persian page, terms beside values: each term starts at the row's right edge, the
 * row's actions end it at the left, and a limit reads "$5,000.00" left to right while it starts at the value
 * column's right edge, the start of a right-to-left line (`match-parent`).
 */
export const DescriptionListMirrored: Story = {
  // match-parent is the standard name in Firefox and the prefixed one in WebKit and Chromium: all three engines.
  tags: ['webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(40rem, calc(100vw - 2rem))' }}>
        <DescriptionList layout="horizontal">
          <DescriptionListItem term="نام">ویزای روزمره</DescriptionListItem>
          <DescriptionListItem term="سقف اعتبار" isNumeric>
            $5,000.00
          </DescriptionListItem>
          <DescriptionListItem
            term="نام مستعار"
            actions={
              <Button variant="secondary" aria-label="ویرایش نام مستعار">
                ویرایش
              </Button>
            }
          >
            کارت سفر
          </DescriptionListItem>
        </DescriptionList>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll('.description-list-item')];
    await expect(rows).toHaveLength(3);
    for (const row of rows) {
      await expectSameEdge(rect(find(row, '.description-list-term')).right, rect(row).right);
    }
    const [, limit, nickname] = rows;
    if (!limit || !nickname) throw new Error('No rows');
    // The actions end the row at its left, after the value.
    const actions = rect(find(nickname, '.description-list-actions'));
    await expectSameEdge(actions.left, rect(nickname).left);
    await expect(actions.right).toBeLessThanOrEqual(rect(find(nickname, '.description-list-value')).left + 1);
    // The figure keeps its order and starts at the value column's right edge.
    const value = find(limit, '.description-list-value');
    await expect(value).toHaveTextContent('$5,000.00');
    await expect(getComputedStyle(value).direction).toBe('ltr');
    await expectSameEdge(lastText(value).right, rect(value).right);
    // 1px for an engine's rounding: WebKit's glyph boxes for "$" and "5" overlap by a pixel.
    await expect(characterBox(value, 0).right).toBeLessThanOrEqual(characterBox(value, 1).left + 1);
  },
};

/**
 * A card's header actions on a Persian page: the title starts at the header's right edge, and the actions end
 * the title's line at its left, on the body's column edge. In a frame under 24rem they follow the note and
 * start at the right.
 */
export const CardActionsMirrored: Story = {
  tags: ['webkit', 'firefox'],
  render: () => {
    const card = (width: string) => (
      <div style={{ width }}>
        <Card>
          <CardHeader>
            <CardTitle level={3}>جزئیات</CardTitle>
            <CardNote>به‌روزشده از حساب بانکی</CardNote>
            <CardActions>
              <Button variant="secondary" aria-label="ویرایش جزئیات">
                ویرایش
              </Button>
            </CardActions>
          </CardHeader>
          <CardBody>
            <p>ویزای روزمره</p>
          </CardBody>
        </Card>
      </div>
    );
    return (
      <I18nProvider locale="fa-IR">
        <div dir="rtl" lang="fa" style={{ display: 'grid', gap: 24 }}>
          {card('min(36rem, calc(100vw - 2rem))')}
          {card('20rem')}
        </div>
      </I18nProvider>
    );
  },
  play: async ({ canvasElement }) => {
    const [wide, narrow] = [...canvasElement.querySelectorAll('.card')];
    if (!wide || !narrow) throw new Error('No cards');
    const body = rect(find(wide, '.card-body'));
    await expectSameEdge(rect(find(wide, '.card-title')).right, body.right);
    const actions = rect(find(wide, '.card-actions .button'));
    await expectSameEdge(actions.left, body.left);
    await expect(actions.bottom).toBeLessThanOrEqual(rect(find(wide, '.card-note')).top + 0.5);
    // Under the note, at the inline start, which is the right.
    const under = rect(find(narrow, '.card-actions .button'));
    await expect(under.top).toBeGreaterThanOrEqual(rect(find(narrow, '.card-note')).bottom);
    await expectSameEdge(under.right, rect(find(narrow, '.card-body')).right);
  },
};

/**
 * A gauge on a Persian page follows the page (owner ruling 7): the svg mirrors, so a semicircle fills from the
 * right and a ring runs counter-clockwise from the top, and the marks move with it. The figure and the text are
 * HTML and do not mirror: "60%" still reads left to right. A mark at the value's own share stands where the arc
 * ends, since a dash has no box of its own to measure. In three engines, since each mirrors the svg itself.
 */
export const GaugeMirrored: Story = {
  tags: ['webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ display: 'flex', flexWrap: 'wrap', gap: 32 }}>
        <Gauge
          data-testid="semicircle"
          label="بودجه"
          form="semicircle"
          size="lg"
          value={25}
          valueLabel="۲۵٪ از بودجه ماه"
          figure="25%"
          marks={[{ value: 25, label: 'یک چهارم' }]}
        />
        <Gauge
          data-testid="ring"
          label="میزان استفاده"
          value={60}
          valueLabel="۶۰٪ از سقف اعتبار"
          figure="60%"
          marks={[{ value: 25, label: 'یک چهارم' }]}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    for (const svg of canvasElement.querySelectorAll('.gauge-svg'))
      await expect(getComputedStyle(svg).scale).toBe('-1 1');
    const semicircle = find(canvasElement, '[data-testid="semicircle"]');
    const dial = rect(find(semicircle, '.gauge-dial'));
    const middle = dial.left + dial.width / 2;
    // A quarter of the way from the inline start, the right: the mark is in the dial's right half, and up.
    const mark = rect(find(semicircle, '.gauge-mark'));
    await expect(mark.left).toBeGreaterThanOrEqual(middle - 0.5);
    await expect(mark.bottom).toBeLessThan(dial.top + dial.width / 2);
    // The ring's quarter mark is a quarter turn counter-clockwise from the top: at the left, level with the centre.
    const ring = find(canvasElement, '[data-testid="ring"]');
    const ringDial = rect(find(ring, '.gauge-dial'));
    const quarter = rect(find(ring, '.gauge-mark'));
    await expect(quarter.right).toBeLessThanOrEqual(ringDial.left + 16);
    await expect(
      Math.abs(quarter.top + quarter.height / 2 - (ringDial.top + ringDial.height / 2)),
    ).toBeLessThan(1);
    // The figure is unmirrored: its first character is left of its second.
    for (const scope of [semicircle, ring]) {
      const value = find(scope, '.gauge-figure-value');
      await expect(getComputedStyle(value).direction).toBe('ltr');
      // The figure is set tight, so its glyph boxes overlap; the first starts left of the second.
      await expect(characterBox(value, 0).left).toBeLessThan(characterBox(value, 1).left);
      // The label starts at the right of its text block, the start of a right-to-left line.
      await expect(getComputedStyle(find(scope, '.gauge-text')).direction).toBe('rtl');
    }
  },
};

/**
 * A month grid on a Persian page follows the page (owner ruling 7): the grid's columns run from the right, so
 * the year label is at the right and Farvardin, the first month, is the rightmost cell of its row and the
 * rightmost label of the header, by the grid's own logical flow. In three engines, since each lays the grid out.
 */
export const MonthGridMirrored: Story = {
  tags: ['webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(36rem, calc(100vw - 2rem))' }}>
        <MonthGrid
          label="صورت‌حساب‌ها"
          states={PERSIAN_STATES}
          years={PERSIAN_YEARS}
          monthLabels={PERSIAN_SHORT_MONTHS}
          monthNames={PERSIAN_MONTH_NAMES}
          summary={PERSIAN_SUMMARY}
          labels={PERSIAN_LABELS}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const grid = find(canvasElement, '.month-grid-grid');
    await expect(getComputedStyle(grid).direction).toBe('rtl');
    const years = [...grid.querySelectorAll('.month-grid-year')];
    const cells = [...grid.querySelectorAll('.month-grid-cell')].map(rect);
    await expect(years).toHaveLength(2);
    for (const [row, year] of years.entries()) {
      const rowCells = cells.slice(row * 12, row * 12 + 12);
      const [first] = rowCells;
      if (!first) throw new Error('No cell');
      // The first month is the rightmost cell, and each later month is left of the one before.
      await expectSameEdge(first.right, Math.max(...rowCells.map((cell) => cell.right)));
      for (const [index, cell] of rowCells.slice(1).entries())
        await expect(cell.right).toBeLessThanOrEqual((rowCells[index]?.left ?? 0) + 1);
      // The year label is right of its first month, in the grid's first column at the right.
      await expect(rect(year).left).toBeGreaterThanOrEqual(first.right - 1);
      await expectSameEdge(rect(year).right, rect(grid).right);
    }
    // The header's first label, Farvardin's, is over the first month's column.
    const label = rect(find(grid, '.month-grid-month'));
    const column = rect(find(grid, '.month-grid-cell'));
    await expectSameEdge(label.left + label.width / 2, column.left + column.width / 2);
  },
};

/**
 * A signed figure keeps its sign in front. A leading plus or minus is neutral to the bidi algorithm, so in
 * a right-to-left block "+$1,980.00" would draw as "$1,980.00+". A numeral sets its own direction to left to
 * right and isolates itself, and `text-align: match-parent` keeps it at the start of the right-to-left line,
 * which is the right edge. The block, the sign and the figure's edge are measured here, and the story is
 * baselined, since its text is Latin digits and no fallback font is in it.
 */
export const Numerals: Story = {
  tags: ['!no-visual'],
  render: () => (
    <div dir="rtl" style={{ display: 'grid', gap: 24, width: 'min(28rem, calc(100vw - 2rem))' }}>
      <Text size="numeral">+$2,345.67</Text>
      <div style={{ display: 'grid', gap: 8 }}>
        <Eyebrow>Arrived</Eyebrow>
        <Text as="span" size="numeral-sm">
          +$1,980.00
        </Text>
      </div>
      <div style={{ display: 'grid', gap: 8 }}>
        <Eyebrow>Spent</Eyebrow>
        <Text as="span" size="numeral-sm">
          -$4,210.00
        </Text>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const block = rect(find(canvasElement, '[dir="rtl"]'));
    const figures = [...canvasElement.querySelectorAll<HTMLElement>('.copy-numeral, .copy-numeral-sm')];
    await expect(figures).toHaveLength(3);
    for (const figure of figures) {
      await expect(getComputedStyle(figure).direction).toBe('ltr');
      // The figure ends at the right edge of the block, which is where a right-to-left line starts.
      await expectSameEdge(lastText(figure).right, block.right);
      // The sign is the first character and is drawn left of the currency symbol after it.
      await expect(characterBox(figure, 0).right).toBeLessThanOrEqual(characterBox(figure, 1).left + 0.5);
    }
  },
};

/**
 * A figure inside a right-to-left sentence keeps its sign in front. Inline, the figure sits among the
 * sentence's letters, and its own `direction` reorders nothing unless it is isolated: without `unicode-bidi:
 * isolate` the plus is resolved with the Arabic around it and drawn after the figure. No baseline, since the
 * words are Arabic.
 */
export const NumeralInASentence: Story = {
  render: () => (
    <Rtl>
      <p style={{ margin: 0 }}>
        وصل{' '}
        <Text as="span" size="numeral-sm">
          +$1,980.00
        </Text>{' '}
        إلى الحساب اليوم.
      </p>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const figure = find(canvasElement, '.copy-numeral-sm');
    await expect(getComputedStyle(figure).unicodeBidi).toBe('isolate');
    // The sign is the first character and is drawn left of the currency symbol after it.
    await expect(characterBox(figure, 0).right).toBeLessThanOrEqual(characterBox(figure, 1).left + 0.5);
    // The sentence starts at the right, so the figure sits left of its first word.
    const sentence = rect(find(canvasElement, 'p'));
    await expect(rect(figure).right).toBeLessThan(sentence.right);
  },
};

/** The Persian rows the mirrored tables draw. */
const PERSIAN_ROWS = [
  { id: 'p1', payee: 'فروشگاه سر کوچه', category: 'خوراک', amount: '-۱۲۵٬۰۰۰ تومان' },
  { id: 'p2', payee: 'مترو', category: 'رفت و آمد', amount: '-۸٬۰۰۰ تومان' },
];

/** A Persian table with one row selected, so the checkbox column and the bar show. */
function MirroredSelection(): ReactElement {
  const [keys, setKeys] = useState<Key[]>(['p1']);
  return (
    <div data-selecting="">
      <DataTable
        aria-label="تراکنش‌های انتخاب‌شده"
        items={PERSIAN_ROWS}
        columns={[
          { id: 'payee', header: 'گیرنده', cell: (row) => row.payee },
          { id: 'amount', header: 'مبلغ', cell: (row) => row.amount, align: 'end', width: '10rem' },
        ]}
        getKey={(row) => row.id}
        selectedKeys={keys}
        onSelectionChange={setKeys}
        formatCount={(count) => String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit)}
        bulkActions={<Button variant="secondary">دسته‌بندی</Button>}
        labels={{
          selectAll: 'انتخاب همه',
          select: 'انتخاب',
          clearSelection: 'پاک کردن انتخاب',
          selected: (count) => `${count} انتخاب شده`,
          toolbar: 'کارهای گروهی',
        }}
      />
    </div>
  );
}

/**
 * A data table on a Persian page: the columns run from the right, so the row header, the first column, is the
 * rightmost cell; an amount sits at its cell's left edge and stays a left-to-right run inside; and the current
 * row's bar is the first cell's inline-start border, which is its right edge. In a second table with a row
 * selected, the checkbox column is the rightmost and the bar's count sits at the bar's right.
 */
export const DataTableMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <RouterProvider navigate={() => undefined}>
        <div dir="rtl" lang="fa" style={{ width: 'min(48rem, calc(100vw - 2rem))' }}>
          <DataTable
            aria-label="تراکنش‌ها"
            items={[
              { id: 'p1', payee: 'فروشگاه سر کوچه', category: 'خوراک', amount: '-۱۲۵٬۰۰۰ تومان' },
              { id: 'p2', payee: 'مترو', category: 'رفت و آمد', amount: '-۸٬۰۰۰ تومان' },
            ]}
            columns={[
              { id: 'payee', header: 'گیرنده', cell: (row) => row.payee },
              { id: 'category', header: 'دسته', cell: (row) => row.category },
              { id: 'amount', header: 'مبلغ', cell: (row) => row.amount, align: 'end', width: '10rem' },
            ]}
            getKey={(row) => row.id}
            getRowHref={(row) => `/transactions/${row.id}`}
            currentKey="p2"
          />
          <MirroredSelection />
        </div>
      </RouterProvider>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const rows = canvasElement.querySelectorAll<HTMLElement>('.data-table-body > [role="row"]');
    const current = rows[1];
    if (current === undefined) throw new Error('No current row');
    const cells = [...current.querySelectorAll<HTMLElement>('[role="rowheader"], [role="gridcell"]')];
    const [header, , amount] = cells;
    if (header === undefined || amount === undefined) throw new Error('No cells');
    // The row header is the first column, at the right.
    await expect(header.getAttribute('role')).toBe('rowheader');
    for (const cell of cells.slice(1)) await expect(rect(cell).right).toBeLessThan(rect(header).right);
    await expect(Math.abs(rect(header).right - rect(current).right)).toBeLessThan(1);
    // The figure at the cell's left, its run left to right.
    const figure = find(amount, '.data-table-figure');
    await expect(getComputedStyle(figure).direction).toBe('ltr');
    const padding = parseFloat(getComputedStyle(amount).paddingLeft);
    await expect(Math.abs(rect(figure).left - (rect(amount).left + padding))).toBeLessThan(1);
    // The current bar: a 3px border at the first cell's right, none at its left.
    const style = getComputedStyle(header);
    await expect(style.borderRightWidth).toBe('3px');
    await expect(style.borderRightStyle).toBe('solid');
    await expect(style.borderLeftWidth).toBe('0px');

    // The checkbox column is the rightmost, in the header and in each row.
    const selecting = find(canvasElement, '[data-selecting]');
    const headerRow = find(selecting, 'thead [role="row"]');
    const box = find(headerRow, '[data-selection]');
    await expect(Math.abs(rect(box).right - rect(headerRow).right)).toBeLessThan(1);
    for (const row of selecting.querySelectorAll<HTMLElement>('.data-table-body > [role="row"]')) {
      const cell = find(row, '[data-selection]');
      await expect(Math.abs(rect(cell).right - rect(row).right)).toBeLessThan(1);
    }
    // The bar's X at its right, inside its padding, the count to its left, and the actions to the count's left.
    const bar = find(selecting, '.data-table-bar');
    const clear = find(bar, '.data-table-bar-clear');
    const count = find(bar, '.data-table-bar-count');
    await expect(count).toHaveTextContent('۱ انتخاب شده');
    const barPadding = parseFloat(getComputedStyle(bar).paddingRight);
    await expect(Math.abs(rect(clear).right - (rect(bar).right - barPadding - 1))).toBeLessThan(1.5);
    await expect(rect(count).right).toBeLessThanOrEqual(rect(clear).left);
    await expect(rect(find(bar, '.data-table-bar-actions')).right).toBeLessThan(rect(count).left);
  },
};

/** Persian digits, as an app's formatCount writes them. */
const persianDigits = (count: number): string =>
  String(count).replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)] ?? digit);

/** A Persian table with two rows selected and its bar's actions as data: one promoted, two in More. */
function MirroredBulk(): ReactElement {
  const [keys, setKeys] = useState<Key[]>(['p1', 'p2']);
  return (
    <DataTable
      aria-label="تراکنش‌ها"
      items={PERSIAN_ROWS}
      columns={[
        { id: 'payee', header: 'گیرنده', cell: (row) => row.payee },
        { id: 'amount', header: 'مبلغ', cell: (row) => row.amount, align: 'end', width: '10rem' },
      ]}
      getKey={(row) => row.id}
      selectedKeys={keys}
      onSelectionChange={setKeys}
      formatCount={persianDigits}
      bulkActions={[
        { id: 'categorize', label: 'دسته‌بندی', isPromoted: true, onAction: () => undefined },
        { id: 'archive', label: 'بایگانی', onAction: () => undefined },
        { id: 'delete', label: 'حذف', onAction: () => undefined },
      ]}
      selectAllMatching={<Button variant="tertiary">انتخاب همه ۱٬۲۴۰ مورد</Button>}
      labels={{
        selectAll: 'انتخاب همه',
        select: 'انتخاب',
        clearSelection: 'پاک کردن انتخاب',
        selected: (count) => `${count} انتخاب شده`,
        toolbar: 'کارهای گروهی',
        moreActions: 'کارهای بیشتر',
      }}
    />
  );
}

/**
 * The bulk-action bar on a Persian page: the X at the bar's right, the count and the select-all place to its left,
 * the promoted button after them and More at the bar's left, each end the corner inset in; the arrows follow the
 * reading order, so Arrow Left moves from the X toward More.
 */
export const BulkBarMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(48rem, calc(100vw - 2rem))' }}>
        <MirroredBulk />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const bar = find(canvasElement, '.data-table-bar');
    const clear = within(bar).getByRole('button', { name: 'پاک کردن انتخاب' });
    const more = within(bar).getByRole('button', { name: 'کارهای بیشتر' });
    const promoted = within(bar).getByRole('button', { name: 'دسته‌بندی' });
    const count = find(bar, '.data-table-bar-count');
    await expect(count).toHaveTextContent('۲ انتخاب شده');
    const inset = parseFloat(getComputedStyle(bar).borderBottomRightRadius) - 1;
    await expect(rect(bar).right - rect(clear).right).toBeGreaterThanOrEqual(inset - 0.5);
    await expect(rect(more).left - rect(bar).left).toBeGreaterThanOrEqual(inset - 0.5);
    await expect(rect(count).right).toBeLessThanOrEqual(rect(clear).left);
    await expect(rect(find(bar, '.data-table-bar-select-all')).right).toBeLessThanOrEqual(rect(count).left);
    await expect(rect(more).right).toBeLessThanOrEqual(rect(promoted).left);
    // React Aria's toolbar follows the direction: Arrow Left moves on from the X.
    clear.focus();
    await waitFor(() => expect(clear).toHaveFocus());
    await userEvent.keyboard('{ArrowLeft}');
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName('انتخاب همه ۱٬۲۴۰ مورد'));
    await userEvent.keyboard('{ArrowLeft}{ArrowLeft}');
    await waitFor(() => expect(more).toHaveFocus());
  },
};

/** A Persian list with one item selected, so its Select mode can show the boxes. */
function MirroredList(): ReactElement {
  const [keys, setKeys] = useState<Key[]>(['p1']);
  return (
    <DataTable
      aria-label="تراکنش‌ها"
      items={PERSIAN_ROWS}
      columns={[
        { id: 'payee', header: 'گیرنده', cell: (row) => row.payee },
        { id: 'category', header: 'دسته', cell: (row) => row.category, listSlot: 'meta' },
        { id: 'amount', header: 'مبلغ', cell: (row) => row.amount, align: 'end', listSlot: 'end' },
      ]}
      getKey={(row) => row.id}
      getRowHref={(row) => `/transactions/${row.id}`}
      getGroup={() => ({ id: 'day', label: 'سه‌شنبه ۲۲ مهر' })}
      currentKey="p2"
      selectedKeys={keys}
      onSelectionChange={setKeys}
      labels={{
        selectAll: 'انتخاب همه',
        select: 'انتخاب',
        selectItems: 'انتخاب',
        doneSelecting: 'تمام',
        clearSelection: 'پاک کردن انتخاب',
        selected: (count) => `${count} انتخاب شده`,
        toolbar: 'کارهای گروهی',
      }}
    />
  );
}

/**
 * The list face on a Persian page, in a box under 40rem: with Select pressed, an item's box is at its right; its
 * amount sits at its left, a left-to-right run; and the current item's bar is its inline-start border, at its
 * right. Select all leads the head at the right and the button ends it at the left.
 */
export const DataTableListMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <RouterProvider navigate={() => undefined}>
        <div dir="rtl" lang="fa" style={{ width: '22rem' }}>
          <MirroredList />
        </div>
      </RouterProvider>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const mode = find(canvasElement, '.data-table-list-mode');
    mode.click();
    await waitFor(() => expect(mode).toHaveTextContent('تمام'));
    const items = canvasElement.querySelectorAll<HTMLElement>('.data-table-item');
    const [first, current] = items;
    if (first === undefined || current === undefined) throw new Error('No items');
    const padding = parseFloat(getComputedStyle(first).paddingRight);
    // The box at the item's right, inside its padding.
    const box = find(first, '.data-table-item-select');
    await expect(Math.abs(rect(box).right - (rect(first).right - padding))).toBeLessThan(1);
    // The amount at the item's left, its run left to right.
    const end = find(first, '.data-table-item-end');
    await expect(
      Math.abs(rect(end).left - (rect(first).left + parseFloat(getComputedStyle(first).paddingLeft))),
    ).toBeLessThan(1);
    await expect(getComputedStyle(find(end, '.data-table-figure')).direction).toBe('ltr');
    await expect(rect(find(first, '.data-table-item-text')).left).toBeGreaterThan(rect(end).right);
    // The current bar: a 3px border at the item's right, none at its left.
    const style = getComputedStyle(current);
    await expect(style.borderRightWidth).toBe('3px');
    await expect(style.borderRightStyle).toBe('solid');
    await expect(style.borderLeftWidth).toBe('0px');
    // Select all at the head's right, the button at its left.
    const head = find(canvasElement, '.data-table-list-head');
    await expect(rect(find(head, '.checkbox-field')).left).toBeGreaterThan(rect(mode).right);
  },
};

/**
 * A side panel on a Persian page at a desktop width: its column at the layout's inline end, on the left of the
 * content, and in its header the title at the right and the close button at the left.
 */
export const SidePanelMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <SidePanelLayout
          panel={
            <SidePanel
              title="فروشگاه سر کوچه"
              description="سه‌شنبه ۲۲ مهر"
              isOpen
              onClose={() => undefined}
              closeLabel="بستن"
            >
              <TextField label="گیرنده" defaultValue="فروشگاه سر کوچه" />
            </SidePanel>
          }
        >
          <p>تراکنش‌ها</p>
        </SidePanelLayout>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBeGreaterThanOrEqual(1024);
    const panel = find(canvasElement, '.side-panel');
    const content = find(canvasElement, '.side-panel-layout-content');
    await expect(rect(panel).right).toBeLessThanOrEqual(rect(content).left);
    const header = find(panel, '.side-panel-header');
    const close = find(header, '.side-panel-close');
    const title = find(header, '.side-panel-title');
    await expect(rect(close).right).toBeLessThan(rect(title).left + 1);
    await expect(
      Math.abs(rect(title).right - (rect(header).right - parseFloat(getComputedStyle(header).paddingRight))),
    ).toBeLessThan(1.5);
  },
};

/**
 * The indeterminate bars of `ProgressBarMirrored`, by test id, with the direction each track resolves to: on the
 * Persian page, in an ltr box nested in it, and under `dir="auto"` reading Latin; then on an English page, in an
 * rtl box nested in it, and under `dir="auto"` reading Persian. Only the track's own direction may steer the
 * slide, never an ancestor's attribute.
 */
const SLIDES: readonly (readonly [testId: string, direction: 'ltr' | 'rtl'])[] = [
  ['reading', 'rtl'],
  ['nested-ltr', 'ltr'],
  ['auto-latin', 'ltr'],
  ['ltr', 'ltr'],
  ['nested-rtl', 'rtl'],
  ['auto-persian', 'rtl'],
];

/**
 * A progress bar on a Persian page at 45: the fill grows from the inline start, the right, so its right edge is
 * the track's; the label starts at the right and the value sits at the head's left end. The indeterminate
 * segment slides from the inline start of the direction its own track resolves to, however that was set: the
 * play pauses each slide and places it at its first frame, wholly before the start, and at half its run, 30% of
 * the track in from the start (the inset runs from -40% to 100%, and ease-in-out is half done at half time).
 * Geometry only, no timing; in three engines, since each animates the logical inset itself.
 */
export const ProgressBarMirrored: Story = {
  tags: ['webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <div style={{ width: 'min(28rem, calc(100vw - 2rem))', display: 'grid', gap: '1rem' }}>
        <div dir="rtl" lang="fa" style={{ display: 'grid', gap: '1rem' }}>
          <ProgressBar label="در حال بارگذاری فاکتور" value={45} valueLabel="۴۵٪" />
          <ProgressBar label="در حال خواندن رسید" isIndeterminate data-testid="reading" />
          <div dir="ltr" lang="en">
            <ProgressBar label="Reading receipt.jpg" isIndeterminate data-testid="nested-ltr" />
          </div>
          <div dir="auto" lang="en">
            <ProgressBar label="Reading invoice.pdf" isIndeterminate data-testid="auto-latin" />
          </div>
        </div>
        <div dir="ltr" lang="en" style={{ display: 'grid', gap: '1rem' }}>
          <ProgressBar label="Reading statement.pdf" isIndeterminate data-testid="ltr" />
          <div dir="rtl" lang="fa">
            <ProgressBar label="در حال خواندن قرارداد" isIndeterminate data-testid="nested-rtl" />
          </div>
          <div dir="auto" lang="fa">
            <ProgressBar label="در حال خواندن صورت‌حساب" isIndeterminate data-testid="auto-persian" />
          </div>
        </div>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const bar = find(canvasElement, '.progress-bar');
    const track = rect(find(bar, '.progress-bar-track'));
    const fill = rect(find(bar, '.progress-bar-fill'));
    await expect(Math.abs(fill.right - track.right)).toBeLessThan(1);
    await expect(Math.abs(fill.width - track.width * 0.45)).toBeLessThan(1);
    const head = rect(find(bar, '.progress-bar-head'));
    await expect(Math.abs(rect(find(bar, '.progress-bar-label')).right - head.right)).toBeLessThan(1);
    await expect(Math.abs(rect(find(bar, '.progress-bar-value')).left - head.left)).toBeLessThan(1);

    for (const [testId, direction] of SLIDES) {
      const slideTrack = find(canvasElement, `[data-testid="${testId}"] .progress-bar-track`);
      await expect(getComputedStyle(slideTrack).direction, testId).toBe(direction);
      const segment = find(slideTrack, '.progress-bar-fill');
      const [slide] = segment.getAnimations();
      if (!slide) throw new Error(`${testId} has no slide`);
      const duration = Number(slide.effect?.getComputedTiming().duration);
      await expect(duration, testId).toBeGreaterThan(0);
      slide.pause();
      try {
        for (const [time, start] of [
          [0, -0.4],
          [duration / 2, 0.3],
        ] as const) {
          slide.currentTime = time;
          const lane = rect(slideTrack);
          const box = rect(segment);
          // How far the segment's inline start is from the track's, in the track's own direction.
          const inset = direction === 'ltr' ? box.left - lane.left : lane.right - box.right;
          const moment = `${testId} at ${String(time)}ms`;
          await expect(Math.abs(inset - lane.width * start), moment).toBeLessThan(1);
          await expect(Math.abs(box.width - lane.width * 0.4), `${testId} width`).toBeLessThan(1);
        }
      } finally {
        slide.play();
      }
    }
  },
};

/**
 * A drop zone on a Persian page in a narrow column: the icon at the right, the start of the line, and the hint
 * before the button from the right; the label at the right of the head.
 */
export const FileDropZoneMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(18rem, calc(100vw - 2rem))' }}>
        <FileDropZone
          label="رسید"
          labels={{ dragHint: 'فایل را بکشید یا', choose: 'انتخاب', drop: 'رها کنید' }}
          onFiles={() => undefined}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const box = rect(find(canvasElement, '.file-drop-zone-box'));
    const icon = rect(find(canvasElement, '.file-drop-zone-icon'));
    const line = rect(find(canvasElement, '.file-drop-zone-line'));
    // One row: the icon beside the line, at its right.
    await expect(icon.left).toBeGreaterThanOrEqual(line.right - 0.5);
    await expect(box.right - icon.right).toBeLessThan(icon.left - box.left);
    const hint = rect(find(canvasElement, '.file-drop-zone-hint'));
    const button = rect(find(canvasElement, '.file-drop-zone-line .button'));
    // The hint first, from the right: at the button's right, or above it where the line wraps.
    await expect(hint.right > button.right - 0.5 || hint.bottom <= button.top + 0.5).toBe(true);
    const head = rect(find(canvasElement, '.field-head'));
    await expectSameEdge(rect(find(canvasElement, '.field-label')).right, head.right);
  },
};

/**
 * The page overlay on a Persian page in the shell: the rail is on the right, so the overlay's right edge clears
 * it by the inset, and its left edge is the inset from the viewport's.
 */
export const PageDropZoneMirrored: Story = {
  globals: DESKTOP,
  parameters: { layout: 'fullscreen', viewport: { options: VIEWPORT_OPTIONS } },
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <AppShell sidebar={<DemoNav />} header={<DemoHeader title="اسناد" />}>
          <p data-testid="page">فاکتورها و رسیدها</p>
          <PageDropZone title="برای بارگذاری رها کنید" onFiles={() => undefined} />
        </AppShell>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    fireDrag(find(canvasElement, '[data-testid="page"]'), 'dragenter', filesTransfer([pdf()]));
    const overlay = await waitFor(() => find(document, '.page-drop-zone'));
    const rail = rect(find(canvasElement, '.sidebar'));
    const box = rect(overlay);
    await expect(rail.left).toBeGreaterThan(window.innerWidth / 2);
    await expect(box.right).toBeLessThanOrEqual(rail.left);
    await expect(box.left).toBeCloseTo(16, 0);
    // Drawn in the shell, it takes the direction of where the zone is mounted.
    await expect(overlay).toHaveAttribute('dir', 'rtl');
    fireDrag(overlay, 'dragend', filesTransfer([pdf()]));
    await waitFor(() => expect(document.querySelector('.page-drop-zone')).toBeNull());
  },
};

/**
 * The upload tray on a Persian page in the shell: the panel in the bottom left corner, 16px from the window's
 * left, and a Persian file name with its extension at its left end, the end of a name read from the right.
 */
export const UploadTrayMirrored: Story = {
  globals: DESKTOP,
  parameters: { layout: 'fullscreen', viewport: { options: VIEWPORT_OPTIONS } },
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <AppShell
          sidebar={<DemoNav />}
          header={<DemoHeader title="اسناد" />}
          floating={
            <UploadTray
              items={[
                { id: 1, name: 'صورت‌حساب-شهریور-فروشگاه-محله-و-تعطیلات-آخر-هفته.pdf', status: 'saved' },
                { id: 2, name: 'invoice-0142.pdf', status: 'saved' },
              ]}
            />
          }
        >
          <p>فاکتورها و رسیدها</p>
        </AppShell>
      </div>
    </I18nProvider>
  ),
  play: async () => {
    const panel = await waitFor(() => find(document, '.upload-tray'));
    await Promise.all(panel.getAnimations().map((animation) => animation.finished.catch(() => null)));
    await expect(rect(panel).left).toBeCloseTo(16, 0);
    const [persian, latin] = [...panel.querySelectorAll<HTMLElement>('.upload-row-name')];
    if (!persian || !latin) throw new Error('Two names');
    // The Persian name reads from the right: its extension at the left end, after the cut stem.
    const stem = rect(find(persian, '.upload-row-stem'));
    const ext = rect(find(persian, '.upload-row-ext'));
    await expect(ext.right).toBeLessThanOrEqual(stem.left + 0.5);
    await expectSameEdge(ext.left, rect(persian).left);
    // A Latin name keeps its own direction: its extension at its right end.
    await expect(rect(find(latin, '.upload-row-ext')).left).toBeGreaterThanOrEqual(
      rect(find(latin, '.upload-row-stem')).right - 0.5,
    );
  },
};

/**
 * A save bar in Persian: the sentence and the chip at the right, the actions at the bar's left with the action
 * last, so leftmost; under 36rem one line of buttons that keeps the radius from both bottom corners.
 */
export const SaveBarMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ display: 'grid', gap: 24, width: 'min(40rem, calc(100vw - 2rem))' }}>
        <SaveBar
          className="wide"
          message="۲ تغییر در فروشگاه محله، ۲۲ مهر"
          isDirty
          actionLabel="ذخیره"
          onAction={() => undefined}
          onCancel={() => undefined}
          labels={{ unsaved: 'تغییرات ذخیره نشده', cancel: 'انصراف' }}
        />
        <div style={{ width: 'min(22rem, 100%)' }}>
          <SaveBar
            className="narrow"
            message="۲ تغییر در فروشگاه محله، ۲۲ مهر"
            actionLabel="ذخیره"
            onAction={() => undefined}
            onCancel={() => undefined}
            labels={{ cancel: 'انصراف' }}
          />
        </div>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const wide = find(canvasElement, '.save-bar.wide');
    const [cancel, save] = within(wide).getAllByRole('button');
    if (!cancel || !save) throw new Error('Two buttons');
    // The actions at the left, the action leftmost, the sentence and the chip at the right.
    await expect(rect(save).right).toBeLessThanOrEqual(rect(cancel).left + 0.5);
    await expect(rect(save).left - rect(wide).left).toBeLessThan(rect(wide).right - rect(save).right);
    await expectSameEdge(
      rect(find(wide, '.save-bar-chip')).right,
      rect(find(wide, '.save-bar-message')).right,
    );
    await expect(rect(find(wide, '.save-bar-text')).right).toBeGreaterThan(rect(cancel).right);
    // The action sits clear of the corner's curve on its own side, the left.
    const radius = parseFloat(getComputedStyle(wide).borderBottomLeftRadius);
    await expect(rect(save).left - rect(wide).left).toBeGreaterThanOrEqual(radius - 0.5);
    // Under 36rem: one line of buttons, side by side in DOM order from the right, the action at the left, filling
    // the line, and both insets at least the radius, the start's at the right as the end's at the left.
    const narrow = find(canvasElement, '.save-bar.narrow');
    const [first, last] = within(narrow).getAllByRole('button');
    if (!first || !last) throw new Error('Two buttons');
    await expect(Math.abs(rect(last).top - rect(first).top)).toBeLessThan(1);
    await expect(rect(last).right).toBeLessThanOrEqual(rect(first).left + 0.5);
    const actions = rect(find(narrow, '.save-bar-actions'));
    await expect(rect(first).right - rect(last).left).toBeCloseTo(actions.width, 0);
    const corner = parseFloat(getComputedStyle(narrow).borderBottomRightRadius);
    await expect(rect(narrow).right - rect(first).right).toBeGreaterThanOrEqual(corner - 0.5);
    await expect(rect(last).left - rect(narrow).left).toBeGreaterThanOrEqual(corner - 0.5);
  },
};

/**
 * A Persian page header: the trail, the eyebrow, the title and the sentence at the right, the actions at the left,
 * and the page column under it with the same two edges.
 */
export const PageHeaderMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <RouterProvider navigate={() => undefined}>
        <div dir="rtl" lang="fa" style={{ width: 'min(48rem, calc(100vw - 2rem))' }}>
          <PageHeader
            breadcrumbs={
              <Breadcrumbs aria-label="مسیر">
                <Breadcrumb href="#home">خانه</Breadcrumb>
                <Breadcrumb>اسناد</Breadcrumb>
              </Breadcrumbs>
            }
            eyebrow="بایگانی"
            title="اسناد"
            description="همه رسیدهایی که امسال بارگذاری کرده‌اید."
            actions={<Button>بارگذاری</Button>}
          />
          <PageColumn className="content">
            <Text>فروشگاه محله، ۲۲ مهر.</Text>
          </PageColumn>
        </div>
      </RouterProvider>
    </I18nProvider>
  ),
  play: async ({ canvas, canvasElement }) => {
    const content = find(canvasElement, '.content');
    const style = getComputedStyle(content);
    const start = rect(content).right - parseFloat(style.paddingRight);
    const end = rect(content).left + parseFloat(style.paddingLeft);
    const title = canvas.getByRole('heading', { level: 1, name: 'اسناد' });
    await expectSameEdge(rect(title).right, start);
    await expectSameEdge(rect(find(canvasElement, '.breadcrumbs-list')).right, start);
    await expectSameEdge(rect(find(canvasElement, '.page-header-description')).right, start);
    const action = canvas.getByRole('button', { name: 'بارگذاری' });
    if (window.innerWidth >= 768) await expectSameEdge(rect(action).left, end);
    else await expectSameEdge(rect(action).right, start);
  },
};

/** A Persian trail: it reads from the right, the chevrons point left, and the narrow face's chevron points right. */
export const BreadcrumbsMirrored: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <RouterProvider navigate={() => undefined}>
        <div dir="rtl" lang="fa">
          <Breadcrumbs aria-label="مسیر" backLabel="بازگشت به {parent}">
            <Breadcrumb href="#home">خانه</Breadcrumb>
            <Breadcrumb href="#documents">اسناد</Breadcrumb>
            <Breadcrumb>رسیدها</Breadcrumb>
          </Breadcrumbs>
        </div>
      </RouterProvider>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const items = [...canvasElement.querySelectorAll<HTMLElement>('.breadcrumbs-item')];
    const [home, documents, current] = items;
    if (!home || !documents || !current) throw new Error('Three crumbs');
    // From the right: Home, then Documents to its left, then the current page.
    await expect(rect(home).left).toBeGreaterThan(rect(documents).right - 0.5);
    await expect(rect(documents).left).toBeGreaterThan(rect(current).right - 0.5);
    // The separator follows its crumb, to its left, and points left: its drawn path is mirrored.
    const separator = find(home, '.breadcrumbs-separator');
    await expect(rect(separator).right).toBeLessThanOrEqual(rect(find(home, '.breadcrumbs-link')).left + 0.5);
    for (const icon of canvasElement.querySelectorAll('.breadcrumbs-separator svg, .breadcrumbs-back-icon')) {
      await expect(getComputedStyle(icon).scale).toBe('-1 1');
    }
  },
};

/**
 * The goals guide in Persian, in Vazirmatn from the static folder: the list markers and the quote's rule at the
 * right, the ordered list counting in Persian digits, the headings with no tracking, emphasis at 500 and
 * upright, and code and a figure left to right. Baselined, since its face is served with the stories and no
 * machine's fallback draws it.
 */
export const ProseMirrored: Story = {
  tags: ['!no-visual'],
  render: () => (
    <div dir="rtl" lang="fa" data-font="vazirmatn" style={{ width: 'min(40rem, calc(100vw - 2rem))' }}>
      <Prose as="article">
        <Rendered markdown={GOALS_GUIDE_FA} components={ownContent('پس‌انداز هر ماه، جدول')} />
      </Prose>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const ordered = find(canvasElement, 'ol');
    const style = getComputedStyle(ordered);
    await expect(style.listStyleType).toBe('persian');
    // The indent is at the right, the start of a right-to-left line, so the items end there.
    await expect(parseFloat(style.paddingRight)).toBeGreaterThan(0);
    await expect(parseFloat(style.paddingLeft)).toBe(0);
    const quote = find(canvasElement, 'blockquote');
    await expect(parseFloat(getComputedStyle(quote).borderRightWidth)).toBe(2);
    await expect(parseFloat(getComputedStyle(quote).borderLeftWidth)).toBe(0);
    for (const heading of canvasElement.querySelectorAll('h2, h3')) {
      await expect(getComputedStyle(heading).letterSpacing).toBe('normal');
    }
    const emphasis = find(canvasElement, 'em');
    await expect(getComputedStyle(emphasis).fontWeight).toBe('500');
    await expect(getComputedStyle(emphasis).fontStyle).toBe('normal');
    // Code reads left to right, its block from the left edge.
    const code = find(canvasElement, 'li code');
    await expect(getComputedStyle(code).direction).toBe('ltr');
    const pre = find(canvasElement, 'pre');
    await expect(getComputedStyle(pre).direction).toBe('ltr');
    await expect(getComputedStyle(pre).textAlign).toBe('left');
    const block = rect(find(canvasElement, 'article'));
    await expectSameEdge(rect(pre).right, block.right);
    // An amount in a Persian sentence, in its left-to-right isolate, keeps its sign before its figures.
    const walker = document.createTreeWalker(find(canvasElement, 'ul'), NodeFilter.SHOW_TEXT);
    let amount: Text | null = null;
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (node.textContent?.includes('$1,250.00')) amount = node as Text;
    }
    if (!amount) throw new Error('The guide names an amount');
    const figure: Text = amount;
    const at = figure.data.indexOf('$1,250.00');
    const box = (index: number): DOMRect => {
      const range = document.createRange();
      range.setStart(figure, index);
      range.setEnd(figure, index + 1);
      return range.getBoundingClientRect();
    };
    await expect(box(at).right).toBeLessThanOrEqual(box(at + 1).left + 0.5);
    await expectSameEdge(rect(find(canvasElement, 'p')).right, block.right);
  },
};

/**
 * Three wait tiers in tomans on a Persian page: the legend and each row's legend at the right, Remove at the row's
 * left from 30rem, the fields from the right, and every amount still a figure read left to right.
 */
export const RepeaterMirrored: Story = {
  tags: ['!no-visual', 'webkit', 'firefox'],
  render: () => {
    function Tiers(): ReactElement {
      const [rows, setRows] = useState([
        { id: 'a', amount: 1000000, wait: 'three' },
        { id: 'b', amount: 5000000, wait: 'week' },
        { id: 'c', amount: 15000000, wait: 'month' },
      ]);
      return (
        <Repeater
          label="سطح‌های انتظار"
          value={rows}
          onChange={setRows}
          createRow={() => ({ id: 'new', amount: 0, wait: 'three' })}
          rowLabel={(index) => `سطح ${persianDigits(index + 1)}`}
          maxRows={4}
          labels={{
            add: 'افزودن سطح',
            remove: 'حذف',
            count: (count, max) => `${persianDigits(count)} از ${persianDigits(max)}`,
          }}
        >
          {(tier, { update }) => (
            <>
              <NumberField
                label="تا"
                money={{ symbol: 'تومان', symbolPosition: 'end', fractionDigits: 0 }}
                value={tier.amount}
                onChange={(amount) => {
                  update({ ...tier, amount: amount ?? 0 });
                }}
              />
              <Select
                label="انتظار"
                value={tier.wait}
                onChange={(key) => {
                  update({ ...tier, wait: String(key) });
                }}
              >
                <PickerOption id="three">۳ روز</PickerOption>
                <PickerOption id="week">یک هفته</PickerOption>
                <PickerOption id="month">یک ماه</PickerOption>
              </Select>
            </>
          )}
        </Repeater>
      );
    }
    return (
      <I18nProvider locale="fa-IR">
        <div dir="rtl" lang="fa" style={{ width: 'min(40rem, calc(100vw - 2rem))' }}>
          <Tiers />
        </div>
      </I18nProvider>
    );
  },
  play: async ({ canvasElement }) => {
    const set = find(canvasElement, '.repeater');
    // The legend starts at the right edge, as Persian reads.
    await expectSameEdge(rect(find(set, '.repeater-label')).right, rect(set).right);
    const wide = rect(find(set, '.repeater-row-fields')).width >= 480;
    for (const row of canvasElement.querySelectorAll<HTMLElement>('.repeater-row')) {
      await expectSameEdge(rect(find(row, '.repeater-row-legend')).right, rect(row).right);
      const main = rect(find(row, '.repeater-row-main'));
      const remove = rect(find(row, '.repeater-remove'));
      if (wide) {
        // Remove at the row's left, the fields to its right, the amount first at the right.
        await expect(remove.right).toBeLessThanOrEqual(main.left + 0.5);
        await expectSameEdge(remove.left, rect(row).left);
        await expect(rect(find(row, '.number-field')).left).toBeGreaterThan(
          rect(find(row, '.select')).right - 0.5,
        );
      } else {
        // On a phone the fields stack, and Remove follows them from the right.
        await expect(remove.top).toBeGreaterThanOrEqual(main.bottom - 0.5);
        await expectSameEdge(remove.right, rect(row).right);
      }
      // A figure stays left to right on a right-to-left page.
      await expect(getComputedStyle(find(row, '.number-field-input')).direction).toBe('ltr');
    }
    // Add starts the foot at the right.
    await expectSameEdge(rect(find(set, '.repeater-add')).right, rect(set).right);
  },
};

/** The consumer's eight sections in Persian, with an end state in Persian digits. */
const PERSIAN_SECTIONS = [
  ['coach', 'مربی', 'مربی پیش از هر برداشت چقدر صبر می‌کند.', undefined],
  ['notifications', 'اعلان‌ها', 'چه چیزی و کجا به شما می‌گوییم.', undefined],
  ['bank-sync', 'همگام‌سازی بانک', 'حساب‌های متصل و هر چند وقت همگام می‌شوند.', '۲ متصل'],
  ['assistant', 'دستیار هوش مصنوعی', 'دستیار چه چیزی را می‌تواند بخواند.', undefined],
  ['logos', 'نشان‌ها', 'نشان بانک کنار تراکنش‌ها.', 'خاموش'],
  ['appearance', 'ظاهر', 'پوسته و تراکم.', undefined],
  ['data', 'داده‌ها', 'برون‌بری یا درون‌بری داده‌ها.', undefined],
  ['danger', 'منطقه‌ی خطر', 'حذف حساب.', undefined],
] as const;

/** The Persian settings page at the index or at a section, in a frame `width` wide. */
function PersianSettings({
  sectionKey,
  width,
  navLabel,
}: {
  sectionKey?: string;
  width: string;
  navLabel: string;
}): ReactElement {
  const open = PERSIAN_SECTIONS.find(([key]) => key === (sectionKey ?? 'coach')) ?? PERSIAN_SECTIONS[0];
  const view = sectionKey === undefined ? 'index' : 'section';
  return (
    <div style={{ width, maxWidth: '100%' }}>
      <PanelLayout
        view={view}
        sectionKey={sectionKey}
        backHref="#settings"
        backLabel="تنظیمات"
        nav={
          <PanelNav aria-label={navLabel}>
            {PERSIAN_SECTIONS.map(([key, name, description, end]) => (
              <PanelNavItem
                key={key}
                href={`#settings/${key}`}
                isCurrent={key === sectionKey}
                isDefault={view === 'index' && key === 'coach'}
                description={description}
                end={end}
              >
                {name}
              </PanelNavItem>
            ))}
          </PanelNav>
        }
      >
        <PanelSection title={open[1]} description={open[2]}>
          <Text>{open[2]}</Text>
        </PanelSection>
      </PanelLayout>
    </div>
  );
}

/**
 * PanelLayout on a Persian page, in Vazirmatn: on the split face the nav at the right and the section to its
 * left; on the list face the chevrons pointing left, the way a row opens; Back's chevron pointing right, the way
 * back. Its play measures each in three engines.
 */
export const PanelLayoutMirrored: Story = {
  tags: ['!no-visual', 'webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <RouterProvider navigate={() => undefined}>
        <div
          dir="rtl"
          lang="fa"
          data-font="vazirmatn"
          style={{ display: 'grid', gap: 'var(--spacing-separate)', width: '100%' }}
        >
          <div data-case="split">
            <PersianSettings sectionKey="logos" width="56rem" navLabel="بخش‌های تنظیمات" />
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-peer)' }}>
            <div data-case="list">
              <PersianSettings width="20rem" navLabel="فهرست تنظیمات" />
            </div>
            <div data-case="page">
              <PersianSettings sectionKey="data" width="20rem" navLabel="فهرست بخش‌ها" />
            </div>
          </div>
        </div>
      </RouterProvider>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const at = (name: string): HTMLElement => find(canvasElement, `[data-case="${name}"]`);
    const split = at('split');
    // At the story's width the split case is the split face, unless the screen is a phone's.
    if (rect(find(split, '.panel-layout')).width >= 768) {
      const side = find(split, '.panel-layout-side');
      const main = find(split, '.panel-layout-main');
      await waitFor(() => expect(rect(side).left).toBeGreaterThanOrEqual(rect(main).right - 0.5), {
        timeout: 5000,
      });
      // The side column reaches past its track by a focus ring; the nav in it starts on the layout's right edge.
      await expectSameEdge(rect(find(split, '.panel-nav')).right, rect(find(split, '.panel-layout')).right);
    }
    // The list face: the chevron at the row's left end, its drawing mirrored to point left.
    const row = find(at('list'), '.panel-nav-link');
    const chevron = find(row, '.panel-nav-chevron');
    await waitFor(() => expect(rect(chevron).left).toBeLessThan(rect(find(row, '.panel-nav-name')).left), {
      timeout: 5000,
    });
    await expect(getComputedStyle(find(chevron, 'svg')).scale).toBe('-1 1');
    // Back at the column's right, its chevron first, mirrored to point right.
    const back = find(at('page'), '.panel-layout-back');
    await expectSameEdge(rect(back).right, rect(find(at('page'), '.panel-layout-main')).right);
    const backIcon = find(back, '.panel-layout-back-icon');
    await expect(rect(backIcon).left).toBeGreaterThan(rect(back).right - rect(backIcon).width - 1);
    await expect(getComputedStyle(find(back, 'svg')).scale).toBe('-1 1');
  },
};

/** A Persian account menu at the foot of a column: Settings, the theme as a submenu, Help, a rule and Sign out. */
function PersianAccount(): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <AccountMenu name="آدا لاولیس" detail="حساب خانوادگی" placement="top start">
      <MenuItem id="settings" icon={<Settings />}>
        تنظیمات
      </MenuItem>
      <ThemeMenu
        value={theme}
        onChange={setTheme}
        labels={{ label: 'پوسته', system: 'سیستم', light: 'روشن', dark: 'تیره' }}
      />
      <MenuItem id="help">راهنما</MenuItem>
      <MenuSeparator />
      <MenuItem id="sign-out">خروج</MenuItem>
    </AccountMenu>
  );
}

/**
 * AccountMenu on a Persian page, in Vazirmatn: the avatar at the trigger's right and its up-and-down chevron at its
 * left, not mirrored; the menu open with its Theme submenu opened by Arrow Left, the right-to-left locale's open
 * key, at the row's left, and the row's chevron mirrored to point there. Its play opens them and measures each in
 * three engines.
 */
export const AccountMenuMirrored: Story = {
  tags: ['!no-visual', 'webkit', 'firefox'],
  parameters: { a11y: MENU_ROW_A11Y },
  render: () => (
    <I18nProvider locale="fa-IR">
      <div
        dir="rtl"
        lang="fa"
        data-font="vazirmatn"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'flex-start',
          minBlockSize: '440px',
        }}
      >
        <div style={{ inlineSize: 'min(18rem, 100%)' }}>
          <PersianAccount />
        </div>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    // Vazirmatn loads when the trigger first draws, and its name is narrower in it than in the fallback face, so
    // the column, as wide as the trigger, moves when it arrives. A submenu placed before then stays put, so
    // nothing opens until the face is in.
    await document.fonts.load('500 16px Vazirmatn', 'آدا لاولیس');
    await document.fonts.ready;
    await waitFor(() => expect(document.fonts.check('500 16px Vazirmatn', 'آدا لاولیس')).toBe(true));
    const trigger = find(canvasElement, '.account-menu-trigger');
    // The avatar at the start, the right, and the chevron at the end, the left, drawn as it is.
    await expect(rect(find(trigger, '.avatar')).left).toBeGreaterThan(
      rect(find(trigger, '.account-menu-text')).right - 1,
    );
    await expect(rect(find(trigger, '.account-menu-chevron')).right).toBeLessThan(
      rect(find(trigger, '.account-menu-text')).left + 1,
    );
    await expect(getComputedStyle(find(trigger, '.account-menu-chevron svg')).scale).toBe('none');
    trigger.focus();
    await waitFor(() => expect(trigger).toHaveFocus());
    await userEvent.keyboard('{Enter}');
    const body = within(document.body);
    // The menu placed and entered before the submenu is placed beside its row.
    const menu = await waitFor(() => {
      const found = find(document, '.menu-popover');
      if (!found.hasAttribute('data-placement') || found.hasAttribute('data-entering'))
        throw new Error('Not open');
      return found;
    });
    await Promise.all(
      menu.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
    );
    await waitFor(() => expect(body.getByRole('menuitem', { name: 'تنظیمات' })).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}{ArrowLeft}');
    const theme = body.getByRole('menuitem', { name: 'پوسته' });
    const submenu = await waitFor(() => {
      const popovers = document.querySelectorAll<HTMLElement>('.menu-popover');
      const [, found] = popovers;
      if (popovers.length !== 2 || !found || found.hasAttribute('data-entering')) throw new Error('Not open');
      return found;
    });
    await Promise.all(
      submenu.getAnimations({ subtree: true }).map((animation) => animation.finished.catch(() => null)),
    );
    await waitFor(() => expect(body.getByRole('menuitemradio', { name: 'سیستم' })).toHaveFocus());
    // The submenu opens at the row's end, its left, and the row's chevron points there.
    await expect(rect(submenu).right).toBeLessThanOrEqual(rect(theme).left + 1);
    // Its first row is level with Theme, which it is only when placed beside a menu at rest.
    const first = body.getByRole('menuitemradio', { name: 'سیستم' });
    await expect(Math.abs(rect(first).top - rect(theme).top)).toBeLessThanOrEqual(1);
    await expect(getComputedStyle(find(theme, '.menu-item-submenu svg')).scale).toBe('-1 1');
    await expect(rect(find(theme, '.menu-item-submenu')).left).toBeLessThan(
      rect(find(theme, '.menu-item-end')).left,
    );
  },
};

/**
 * Three Persian sections: each title at the right of its row and the chevron at the left end, the end of the row
 * in right to left. Folded, the chevron turns toward the title, to the right, and the clay dot follows the title's
 * last word to its left. Arrow Down still moves to the next title: the keys are up and down, which never mirror.
 */
export const AccordionMirrored: Story = {
  tags: ['!no-visual', 'webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" data-font="vazirmatn" style={{ width: 'min(32rem, calc(100vw - 2rem))' }}>
        <Accordion defaultExpandedKeys={['billing']}>
          <AccordionItem id="billing" title="نشانی صورت‌حساب">
            <p>خیابان گل سرخ، پلاک ۱۲.</p>
          </AccordionItem>
          <AccordionItem
            id="notifications"
            title="اعلان‌ها"
            note="ایمیل، اعلان و خلاصه‌ی هفتگی"
            isChanged
            changedLabel="تغییر کرده"
          >
            <p>رسیدها با ایمیل می‌آیند.</p>
          </AccordionItem>
          <AccordionItem id="danger" title="منطقه‌ی خطر">
            <p>بستن حساب.</p>
          </AccordionItem>
        </Accordion>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.load('500 16px Vazirmatn', 'اعلان‌ها');
    await document.fonts.ready;
    const [open, folded] = [...canvasElement.querySelectorAll<HTMLElement>('.accordion-item')];
    if (!open || !folded) throw new Error('Three items expected');
    const toggle = rect(find(open, '.accordion-toggle'));
    // The words start at the right of the row, and the chevron is at its left end.
    await expectSameEdge(lastText(find(open, '.accordion-toggle-text')).right, toggle.right);
    await expectSameEdge(rect(find(open, '.accordion-chevron')).left, toggle.left);
    // Open, the chevron points down; folded, it turns a quarter toward the title, to the right.
    await expect(getComputedStyle(find(open, '.accordion-chevron')).rotate).toBe('none');
    await expect(getComputedStyle(find(folded, '.accordion-chevron')).rotate).toBe('-90deg');
    // The dot follows the folded title's words a part step to their left, short of the chevron.
    const dot = rect(find(folded, '.accordion-marker'));
    await expectSameEdge(lastText(find(folded, '.accordion-toggle-text')).left - dot.right, 8);
    await expect(dot.left).toBeGreaterThan(rect(find(folded, '.accordion-chevron')).right);
    // The note starts at the right too, under the title.
    await expectSameEdge(
      lastText(find(folded, '.accordion-note')).right,
      rect(find(folded, '.accordion-toggle')).right,
    );
    // Arrow Down moves to the next title, as it does left to right; End to the last.
    const canvas = within(canvasElement);
    const first = canvas.getByRole('button', { name: 'نشانی صورت‌حساب' });
    await waitFor(() => {
      if (document.activeElement !== first) first.focus();
      return expect(first).toHaveFocus();
    });
    await userEvent.keyboard('{ArrowDown}');
    const second = canvas.getByRole('button', { name: 'اعلان‌ها' });
    await waitFor(() => expect(second).toHaveFocus());
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'منطقه‌ی خطر' })).toHaveFocus());
    // The shot shows the sections at rest, with no ring.
    (document.activeElement as HTMLElement | null)?.blur();
  },
};
