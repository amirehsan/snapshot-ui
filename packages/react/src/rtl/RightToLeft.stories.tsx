import type { Meta, StoryObj } from '@storybook/react-vite';
import { House, Settings, ShoppingCart, User } from 'lucide-react';
import { useEffect, type ReactElement, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { CollapsibleCard } from '../collapsible-card';
import { CommandPalette } from '../command-palette';
import { Dialog, DialogTrigger } from '../dialog';
import { Drawer } from '../drawer';
import { Link } from '../link';
import { Menu, MenuItem, MenuSection, MenuTrigger } from '../menu';
import { PickerOption } from '../picker';
import { Popover } from '../popover';
import { Radio, RadioGroup } from '../radio-group';
import { SearchField } from '../search-field';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { Select } from '../select';
import { Sheet, SheetTrigger } from '../sheet';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { firstLineOffset, lineCount } from '../stories/paint';
import { Switch } from '../switch';
import { TextArea } from '../text-area';
import { TextField } from '../text-field';
import { toast, ToastRegion } from '../toast';
import { Eyebrow, Text } from '../typography';

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
