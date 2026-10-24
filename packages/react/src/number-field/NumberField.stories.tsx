import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ComponentType,
  type ReactElement,
} from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, spyOn, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Dialog, DialogTrigger } from '../dialog';
import { focusOn } from '../stories/focus';
import { tokenColor, tokenPixels, washColor } from '../stories/paint';
import { TextField } from '../text-field';
import { NumberField } from './NumberField';

/**
 * The args the stories take. The component's props are a union of a plain number and money, whose members refuse
 * each other's props with `never`, and Storybook's args type collapses such a union, so every story renders its
 * own fields and takes only the change handler as an arg.
 */
interface StoryArgs {
  onChange?: (value: number | null) => void;
}

const meta = {
  title: 'Components/NumberField',
  component: NumberField as ComponentType<StoryArgs>,
  decorators: [
    (Story) => (
      <div style={{ width: 'min(20rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<StoryArgs>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

/** A plain number with steppers: the figure at the start, two ghost circles at the end. */
export const Default: Story = {
  tags: ['density'],
  render: () => <NumberField label="Guests" hasStepper defaultValue={2} minValue={1} />,
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: 'Guests' });
    await expect(input).toHaveValue('2');
    await expect(rect(input).height).toBe(tokenPixels('--size-field'));
    // The control is the input's height, so the buttons centre on the pill.
    await expect(rect(find(canvasElement, '.number-field-control')).height).toBe(rect(input).height);
    const [decrease, increase] = [...canvasElement.querySelectorAll('.number-field-step')];
    if (!decrease || !increase) throw new Error('No steppers');
    // Two buttons a field step smaller than the field, 2px apart, 6px in from the end.
    await expect(rect(increase).left - rect(decrease).right).toBeCloseTo(2, 0);
    await expect(rect(input).right - rect(increase).right).toBeCloseTo(6, 0);
  },
};

/** Money: "$" in slate before the figure, in tabular figures, and the hint under it. */
export const Money: Story = {
  tags: ['density'],
  render: () => (
    <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={123450} description="Before tax" />
  ),
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await expect(input).toHaveValue('1,234.50');
    await expect(input).toHaveAccessibleDescription('Before tax $');
    const symbol = find(canvasElement, '.number-field-symbol');
    await expect(getComputedStyle(symbol).color).toBe(tokenColor('--color-slate'));
    await expect(getComputedStyle(input).fontVariantNumeric).toBe('tabular-nums');
    // The symbol sits in the input's start padding, clear of the text.
    const style = getComputedStyle(input);
    await expect(rect(symbol).right).toBeLessThanOrEqual(
      rect(input).left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
    );
    await expect(rect(symbol).left).toBeGreaterThan(rect(input).left);
  },
};

/** A negative amount: the sign button pressed, an ink circle with a canvas minus, and the figure in ink. */
export const Negative: Story = {
  render: () => <NumberField label="Refund" money={{ symbol: '$' }} allowsNegative defaultValue={-4250} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Refund' });
    await expect(input).toHaveValue('-42.50');
    await expect(getComputedStyle(input).color).toBe(tokenColor('--color-ink'));
    const sign = canvas.getByRole('button', { name: 'Negative' });
    await expect(sign).toHaveAttribute('aria-pressed', 'true');
    await expect(getComputedStyle(sign).backgroundColor).toBe(tokenColor('--color-ink'));
    await expect(getComputedStyle(sign).color).toBe(tokenColor('--color-canvas'));
    // The sign is the field's start.
    await expect(rect(sign).left - rect(input).left).toBeCloseTo(6, 0);
  },
};

/** In a toolbar, named by aria-label, the placeholder is slate: the only words a sighted reader gets. */
export const Unlabelled: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <NumberField aria-label="Minimum amount" money={{ symbol: '$' }} placeholder="Min" />
      </div>
      <Button variant="secondary">Apply</Button>
    </div>
  ),
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Minimum amount' });
    await expect(input.closest('.number-field')).toHaveAttribute('data-unlabelled', '');
    await expect(getComputedStyle(input, '::placeholder').color).toBe(tokenColor('--color-slate'));
  },
};

/** Changed with its chip, invalid with its line, and disabled with a taupe symbol. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <NumberField label="Budget" money={{ symbol: '$' }} defaultValue={250000} isChanged />
      <NumberField
        label="Limit"
        money={{ symbol: '$' }}
        defaultValue={1500000}
        isInvalid
        errorMessage="Enter an amount under $10,000"
      />
      <NumberField label="Deposit" money={{ symbol: '$' }} defaultValue={5000} isDisabled />
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const disabled = canvas.getByRole('textbox', { name: 'Deposit' });
    await expect(disabled).toBeDisabled();
    const field = disabled.closest('.number-field');
    if (!field) throw new Error('No field');
    await expect(getComputedStyle(find(field, '.number-field-symbol')).color).toBe(
      tokenColor('--color-taupe'),
    );
    const invalid = canvas.getByRole('textbox', { name: 'Limit' });
    await expect(getComputedStyle(invalid).borderTopColor).toBe(tokenColor('--color-error'));
    await expect(canvas.getByText('Enter an amount under $10,000')).toBeVisible();
    await expect(find(canvasElement, '[data-changed] .field-changed')).toBeVisible();
  },
};

/** Keyboard focus firms the edge to ink and draws the ring outside it. */
export const KeyboardFocus: Story = {
  render: () => <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={123450} />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await expect(input).toHaveFocus();
    await expect(getComputedStyle(input).outlineStyle).toBe('solid');
    await expect(getComputedStyle(input).borderTopColor).toBe(tokenColor('--color-ink'));
  },
};

/**
 * The page as a browser paints it before the scripts run: the server's HTML of a money field at -123450 and a
 * plain one at 2 on a Persian page. The figures are plain, "-1234.50" and "2", with no grouping and Latin digits;
 * React Aria's own text arrives in the render after hydration (plan, spec correction 12).
 */
export const Face: Story = {
  render: () => {
    const html = renderToString(
      <I18nProvider locale="fa-IR">
        <div dir="rtl" lang="fa" style={{ display: 'grid', gap: 24 }}>
          <NumberField
            label="مبلغ"
            money={{ symbol: '$', symbolPosition: 'end' }}
            allowsNegative
            value={-123450}
            labels={{ negative: 'منفی' }}
          />
          <NumberField
            label="مهمان‌ها"
            hasStepper
            value={2}
            labels={{ increment: 'افزایش', decrement: 'کاهش' }}
          />
        </div>
      </I18nProvider>,
    );
    // The library's own server HTML of its own story, never input from a reader.
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  },
  play: async ({ canvasElement }) => {
    const inputs = [...canvasElement.querySelectorAll<HTMLInputElement>('.number-field-input')];
    await expect(inputs.map((input) => input.value)).toEqual(['-1234.50', '2']);
    for (const input of inputs) await expect(input).not.toHaveAttribute('aria-roledescription');
  },
};

/**
 * On a Persian page: "تومان" left of a left-to-right figure in Persian digits, and "$" at the end with the sign
 * circle at the right, the field's start.
 */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ display: 'grid', gap: 24 }}>
        <NumberField
          label="مبلغ"
          money={{ symbol: 'تومان', symbolPosition: 'end', fractionDigits: 0 }}
          defaultValue={1250000}
        />
        <NumberField
          label="بازپرداخت"
          money={{ symbol: '$', symbolPosition: 'end' }}
          allowsNegative
          defaultValue={-4250}
          labels={{ negative: 'منفی' }}
        />
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const [toman, dollars] = [...canvasElement.querySelectorAll<HTMLElement>('.number-field')];
    if (!toman || !dollars) throw new Error('No fields');
    for (const field of [toman, dollars]) {
      const input = find(field, '.number-field-input');
      const style = getComputedStyle(input);
      await expect(style.direction).toBe('ltr');
      await expect(style.textAlign).toBe('end');
      // The figure ends at the input's right padding, the start of the line; the symbol is left of the text.
      const symbol = find(field, '.number-field-symbol');
      await expect(rect(symbol).right).toBeLessThanOrEqual(
        rect(input).left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft),
      );
    }
    // The paddings are swapped, so the right one is the lead: 1.5rem, or the sign button's field height.
    const right = (field: HTMLElement): number =>
      parseFloat(getComputedStyle(find(field, '.number-field-input')).paddingRight);
    await expect(right(toman)).toBeCloseTo(24, 0);
    await expect(right(dollars)).toBeCloseTo(tokenPixels('--size-field'), 0);
    await expect(find(toman, '.number-field-input')).toHaveValue('۱٬۲۵۰٬۰۰۰');
    const sign = find(dollars, '.number-field-sign');
    await expect(rect(find(dollars, '.number-field-input')).right - rect(sign).right).toBeCloseTo(6, 0);
  },
};

/**
 * Home and End move the caret: the field keeps them from React Aria's spin button, which would set the minimum
 * or the maximum (risk R3). Run in Chromium, WebKit and Firefox.
 */
export const HomeEnd: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <NumberField label="Amount" money={{ symbol: '$' }} minValue={0} maxValue={999999} />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Amount' });
    // Focused directly: the story is about Home and End, not the press that would focus the field.
    await focusOn(input);
    await userEvent.keyboard('1234.50');
    await waitFor(() => expect(input).toHaveValue('1234.50'));
    await userEvent.keyboard('{Home}');
    await expect(input.selectionStart).toBe(0);
    await expect(input).toHaveValue('1234.50');
    await userEvent.keyboard('{End}');
    await expect(input.selectionStart).toBe(input.value.length);
    await expect(input).toHaveValue('1234.50');
  },
};

/** An arrow snaps to the whole unit first, then steps: 12.50 then Arrow Up is 13.00. */
export const ArrowSnap: Story = {
  tags: ['no-visual'],
  render: () => <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1250} />,
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await userEvent.click(input);
    await userEvent.keyboard('{ArrowUp}');
    await expect(input).toHaveValue('13.00');
    await userEvent.keyboard('{PageDown}');
    await expect(input).toHaveValue('12.00');
  },
};

/** The sign button negates a value, and on an empty field puts a minus in it and focus there. */
export const SignToggle: Story = {
  tags: ['no-visual'],
  args: { onChange: fn() },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <NumberField
        label="Refund"
        money={{ symbol: '$' }}
        allowsNegative
        defaultValue={4250}
        onChange={args.onChange}
      />
      <NumberField label="Adjustment" money={{ symbol: '$' }} allowsNegative />
    </div>
  ),
  play: async ({ args, canvas, userEvent }) => {
    const [refund, adjustment] = canvas.getAllByRole('button', { name: 'Negative' });
    if (!refund || !adjustment) throw new Error('No sign buttons');
    await userEvent.click(refund);
    await expect(args.onChange).toHaveBeenLastCalledWith(-4250);
    await expect(refund).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(adjustment);
    const empty = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Adjustment' });
    await expect(empty).toHaveValue('-');
    await expect(empty).toHaveFocus();
    await expect(empty.selectionStart).toBe(1);
  },
};

/** A copied figure that carries the field's own symbol pastes, the symbol dropped. */
export const PasteSymbol: Story = {
  tags: ['no-visual'],
  args: { onChange: fn() },
  render: (args) => <NumberField label="Amount" money={{ symbol: '$' }} onChange={args.onChange} />,
  play: async ({ args, canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await userEvent.click(input);
    await userEvent.paste('$1,234.50');
    await expect(args.onChange).toHaveBeenLastCalledWith(123450);
    await expect(input).toHaveValue('1,234.50');
  },
};

/** The wheel never changes an amount, even with focus in the field. */
export const WheelOff: Story = {
  tags: ['no-visual'],
  render: () => <NumberField label="Amount" money={{ symbol: '$' }} defaultValue={1250} />,
  play: async ({ canvas }) => {
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    input.focus();
    input.dispatchEvent(new WheelEvent('wheel', { deltaY: -40, bubbles: true, cancelable: true }));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    await expect(input).toHaveValue('12.50');
  },
};

/**
 * Each stepper is hit at 40px, but the two sit 2px apart, so their hit areas stop half the gap past each button:
 * a press at a stepper's inner edge lands on that stepper, comfortable and compact, left to right and right to
 * left.
 */
export const StepperHitAreas: Story = {
  tags: ['no-visual', 'density'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div data-density="comfortable">
        <NumberField label="Guests" hasStepper defaultValue={2} />
      </div>
      <div data-density="compact">
        <NumberField label="Rooms" hasStepper defaultValue={2} />
      </div>
      <div data-density="compact" dir="rtl" lang="fa">
        <NumberField
          label="شب‌ها"
          hasStepper
          defaultValue={2}
          labels={{ increment: 'افزایش', decrement: 'کاهش' }}
        />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const fields = [...canvasElement.querySelectorAll<HTMLElement>('.number-field')];
    await expect(fields).toHaveLength(3);
    const sizes: number[] = [];
    for (const field of fields) {
      const decrease = find(field, ".number-field-step[slot='decrement']");
      const increase = find(field, ".number-field-step[slot='increment']");
      const rtl = getComputedStyle(field).direction === 'rtl';
      const [d, i] = [rect(decrease), rect(increase)];
      sizes.push(d.width);
      // The facing sides, the decrement's inline end and the increment's inline start, in whole pixels, as a
      // hit test reads a point.
      const decreaseEdge = Math.round(rtl ? d.left : d.right);
      const increaseEdge = Math.round(rtl ? i.right : i.left);
      await expect(Math.abs(increaseEdge - decreaseEdge)).toBe(2);
      const y = d.top + d.height / 2;
      const hit = (x: number): Element | null | undefined =>
        document.elementFromPoint(x, y)?.closest('.number-field-step');
      const name = field.querySelector('label')?.textContent ?? '';
      // The pixel either side of each facing side: one inside the button, one in the gap on its own half.
      for (const x of [decreaseEdge - 1, decreaseEdge]) {
        await expect(hit(x), `${name}: decrement at ${String(x)}`).toBe(decrease);
      }
      for (const x of [increaseEdge - 1, increaseEdge]) {
        await expect(hit(x), `${name}: increment at ${String(x)}`).toBe(increase);
      }
    }
    // The compact steppers are drawn smaller.
    const [comfortable, compact] = sizes;
    await expect(compact).toBeLessThan(comfortable ?? 0);
  },
};

/** A paint of `percent` ink over nothing, as a background color, read inside `scope`. */
function inkFill(percent: number, scope: Element = document.body): string {
  const probe = document.createElement('span');
  probe.style.backgroundColor = `color-mix(in srgb, var(--color-ink) ${String(percent)}%, transparent)`;
  scope.append(probe);
  const { backgroundColor } = getComputedStyle(probe);
  probe.remove();
  return backgroundColor;
}

/**
 * A negative amount on a disabled or read-only field: the sign button is disabled with it, so its pressed state
 * is a 15% ink fill with a taupe glyph, never the full ink fill of a button that can be pressed.
 */
export const LockedNegative: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24 }}>
      <NumberField label="Refund" money={{ symbol: '$' }} allowsNegative defaultValue={-4250} isDisabled />
      <NumberField label="Credit" money={{ symbol: '$' }} allowsNegative defaultValue={-1000} isReadOnly />
    </div>
  ),
  play: async ({ canvas }) => {
    const signs = canvas.getAllByRole('button', { name: 'Negative' });
    await expect(signs).toHaveLength(2);
    for (const sign of signs) {
      await expect(sign).toHaveAttribute('aria-pressed', 'true');
      await expect(sign).toBeDisabled();
      await expect(getComputedStyle(sign).backgroundColor).toBe(inkFill(15));
      await expect(getComputedStyle(sign).color).toBe(tokenColor('--color-taupe'));
    }
  },
};

/** A hovered stepper takes the field button's 5% wash and an ink glyph. */
export const HoverButton: Story = {
  tags: ['no-visual'],
  render: () => <NumberField label="Guests" hasStepper defaultValue={2} />,
  play: async ({ canvas, userEvent }) => {
    const increase = canvas.getByRole('button', { name: 'Increase Guests' });
    await userEvent.hover(increase);
    await waitFor(async () => {
      await expect(getComputedStyle(increase).backgroundColor).toBe(washColor());
    });
    await expect(getComputedStyle(increase).color).toBe(tokenColor('--color-ink'));
  },
};

/** A press and typing: the browser's own through Playwright in a Vitest story run, Storybook's in its UI. */
interface Presses {
  click: (element: Element) => Promise<void>;
  keyboard: (text: string) => Promise<void>;
}

/**
 * Playwright's real pointer and keys, which run the browser's own focus moves and event order, in a Vitest story
 * run; the simulated ones the play was given in Storybook's own UI. `vitest/browser` is a module Vitest serves
 * only in its browser mode, so it is imported only there, as `stories/resize.ts` does.
 */
async function realPresses(simulated: Presses): Promise<Presses> {
  if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) return simulated;
  // Untyped on purpose: the module's types declare its own matchers globally, which the unit tests' types refuse.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- a literal would load those types
  const browser = (await import('vitest/browser' as string)) as { userEvent: Presses };
  return browser.userEvent;
}

/**
 * Listens to console.error and console.warn while a play runs; React logs its flushSync warning with
 * console.error, in development. `restore` goes in the play's `finally`.
 */
function listenToTheConsole(): { logged: () => string[]; restore: () => void } {
  const error = spyOn(console, 'error');
  const warn = spyOn(console, 'warn');
  return {
    logged: () => [...error.mock.calls, ...warn.mock.calls].map((call) => call.map(String).join(' ')),
    restore: () => {
      error.mockRestore();
      warn.mockRestore();
    },
  };
}

/** Five seconds, where a busy runner is slow to open or close a Dialog. */
const LONG = { timeout: 5000 };

/**
 * The consumer's reproduction (the settings spec, section 24, ruling 6): a plain NumberField with `minValue={0}`,
 * controlled as the consumer's forms are, in a Dialog titled "Add a plan" whose Save submits the form, saves the
 * value and closes. With `disablesWhileSaving`, Save also disables the fields while it saves, as a form waiting on
 * a server does, and closes a moment later.
 */
function AddAPlan({ disablesWhileSaving = false }: { disablesWhileSaving?: boolean }): ReactElement {
  const formId = useId();
  const [payments, setPayments] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState('nothing');
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <DialogTrigger>
        <Button variant="secondary">Add a plan</Button>
        <Dialog
          title="Add a plan"
          actions={
            <Button type="submit" form={formId}>
              Save
            </Button>
          }
        >
          {({ close }) => (
            <form
              id={formId}
              onSubmit={(event) => {
                event.preventDefault();
                setSaved(payments === null ? 'empty' : String(payments));
                if (!disablesWhileSaving) {
                  close();
                  return;
                }
                setIsSaving(true);
                setTimeout(close, 100);
              }}
            >
              <NumberField
                label="Payments made"
                minValue={0}
                value={payments}
                onChange={setPayments}
                isDisabled={isSaving}
              />
              <TextField label="Name" isDisabled={isSaving} />
            </form>
          )}
        </Dialog>
      </DialogTrigger>
      <p style={{ margin: 0 }}>{`Saved: ${saved}`}</p>
    </div>
  );
}

/** Opens Add a plan with a press and types 0 in Payments made, focused directly: the story is about leaving it. */
async function typeZeroInTheDialog(canvasElement: HTMLElement, presses: Presses): Promise<HTMLElement> {
  await presses.click(within(canvasElement).getByRole('button', { name: 'Add a plan' }));
  const page = within(document.body);
  const field = await page.findByRole('textbox', { name: 'Payments made' }, LONG);
  await waitFor(() => expect(page.getByRole('dialog')).not.toHaveAttribute('data-entering'), LONG);
  await focusOn(field);
  await presses.keyboard('0');
  await waitFor(() => expect(field).toHaveValue('0'));
  return field;
}

/**
 * The consumer's case: 0 typed in a Dialog, then Save pressed. The value saves, the Dialog closes and nothing is
 * logged. Run in Chromium, WebKit and Firefox, with the browser's own pointer and keys.
 */
export const ZeroInADialogThenSave: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <AddAPlan />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const heard = listenToTheConsole();
    try {
      const presses = await realPresses(userEvent);
      await typeZeroInTheDialog(canvasElement, presses);
      await presses.click(within(document.body).getByRole('button', { name: 'Save' }));
      await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull(), LONG);
      await expect(canvas.getByText('Saved: 0')).toBeVisible();
      await expect(heard.logged()).toEqual([]);
    } finally {
      heard.restore();
    }
  },
};

/** The consumer's case again, pressing the next field instead: the field shows 0 and nothing is logged. */
export const ZeroInADialogThenNextField: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <AddAPlan />,
  play: async ({ canvasElement, userEvent }) => {
    const heard = listenToTheConsole();
    try {
      const presses = await realPresses(userEvent);
      const field = await typeZeroInTheDialog(canvasElement, presses);
      const name = within(document.body).getByRole('textbox', { name: 'Name' });
      await presses.click(name);
      await waitFor(() => expect(name).toHaveFocus());
      await expect(field).toHaveValue('0');
      await expect(heard.logged()).toEqual([]);
    } finally {
      heard.restore();
    }
  },
};

/**
 * The consumer's Dialog with a Save that disables its fields while it saves, reached by Enter in the field: the
 * browser blurs the focused field as React disables it, inside React's commit, where React Aria's flushSync made
 * React log its warning before the field deferred it. The value saves and nothing is logged.
 */
export const ZeroInADialogThenEnter: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <AddAPlan disablesWhileSaving />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const heard = listenToTheConsole();
    try {
      const presses = await realPresses(userEvent);
      await typeZeroInTheDialog(canvasElement, presses);
      await presses.keyboard('{Enter}');
      await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull(), LONG);
      await expect(canvas.getByText('Saved: 0')).toBeVisible();
      await expect(heard.logged()).toEqual([]);
    } finally {
      heard.restore();
    }
  },
};

/** A money field's typed amount commits on the press's blur, before the submit reads the form's FormData. */
export const SubmitAfterBlur: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: function Render() {
    const [sent, setSent] = useState('nothing');
    return (
      <form
        style={{ display: 'grid', gap: 12, justifyItems: 'start' }}
        onSubmit={(event) => {
          event.preventDefault();
          const amount = new FormData(event.currentTarget).get('amount');
          setSent(typeof amount === 'string' ? amount : 'nothing');
        }}
      >
        <NumberField label="Amount" money={{ symbol: '$' }} name="amount" />
        <Button type="submit">Send</Button>
        <p style={{ margin: 0 }}>{`Sent: ${sent}`}</p>
      </form>
    );
  },
  play: async ({ canvas, userEvent }) => {
    const presses = await realPresses(userEvent);
    const input = canvas.getByRole('textbox', { name: 'Amount' });
    await focusOn(input);
    await presses.keyboard('12.50');
    await waitFor(() => expect(input).toHaveValue('12.50'));
    await presses.click(canvas.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(canvas.getByText('Sent: 1250')).toBeVisible(), LONG);
  },
};

/** Enter saves, and the app moves focus to Done from a layout effect, inside React's commit. */
function SavesOnEnter(): ReactElement {
  const [saved, setSaved] = useState(false);
  const done = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (saved) done.current?.focus();
  }, [saved]);
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <NumberField
        label="Guests"
        value={0}
        minValue={0}
        onKeyDown={(event) => {
          if (event.key === 'Enter') setSaved(true);
        }}
      />
      <button ref={done} type="button">
        Done
      </button>
    </div>
  );
}

/**
 * Focus moved off the field from a layout effect, the unit tests' case: the blur comes inside React's commit,
 * where React Aria's flushSync made React log before the field deferred it. Done holds focus and nothing is
 * logged.
 */
export const FocusMovedInALayoutEffect: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SavesOnEnter />,
  play: async ({ canvas, userEvent }) => {
    const heard = listenToTheConsole();
    try {
      const presses = await realPresses(userEvent);
      await focusOn(canvas.getByRole('textbox', { name: 'Guests' }));
      await presses.keyboard('{Enter}');
      await waitFor(() => expect(canvas.getByRole('button', { name: 'Done' })).toHaveFocus());
      await expect(heard.logged()).toEqual([]);
    } finally {
      heard.restore();
    }
  },
};

/** The consumer's server action, settled after a microtask (`fast`) or after 100ms. */
async function settle(speed: 'fast' | 'slow'): Promise<{ ok: boolean }> {
  if (speed === 'fast') await Promise.resolve();
  else await new Promise((resolve) => setTimeout(resolve, 100));
  return { ok: true };
}

interface Plan {
  payments: number | null;
  name: string;
}

/**
 * The consumer's own Dialog, as it sent it (settings plan, spec correction 5): rendered only while open, with
 * `isOpen` and `onOpenChange`, its controlled fields in a form whose submit saves in an async transition, and
 * "Add plan" in the actions, outside the form, pending while it saves. A save that settles closes the Dialog,
 * which unmounts it, and React Aria's FocusScope gives focus back to the trigger.
 */
function ConsumerAddPlan({
  speed,
  onOpenChange,
  onSaved,
}: {
  speed: 'fast' | 'slow';
  onOpenChange: (isOpen: boolean) => void;
  onSaved: (plan: Plan) => void;
}): ReactElement {
  const formId = useId();
  const [values, setValues] = useState<Plan>({ payments: null, name: '' });
  const [pending, startTransition] = useTransition();
  const set = (patch: Partial<Plan>): void => {
    setValues((current) => ({ ...current, ...patch }));
  };
  const save = (): void => {
    startTransition(async () => {
      const result = await settle(speed);
      if (!result.ok) return;
      onSaved(values);
      onOpenChange(false);
    });
  };
  return (
    <Dialog
      isOpen
      onOpenChange={onOpenChange}
      size="lg"
      title="Add a plan"
      actions={
        <Button type="submit" form={formId} isPending={pending} pendingLabel="Saving">
          Add plan
        </Button>
      }
    >
      <form
        id={formId}
        onSubmit={(event) => {
          event.preventDefault();
          save();
        }}
      >
        <NumberField
          label="Payments made"
          minValue={0}
          maxValue={99}
          value={values.payments}
          onChange={(payments) => {
            set({ payments });
          }}
        />
        <TextField
          label="Name"
          value={values.name}
          onChange={(name) => {
            set({ name });
          }}
        />
      </form>
    </Dialog>
  );
}

/** The consumer's page: a trigger that opens the Dialog, rendered only while open, and the saved value. */
function ConsumerPage({ speed }: { speed: 'fast' | 'slow' }): ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState('nothing');
  return (
    <div style={{ display: 'grid', gap: 12, justifyItems: 'start' }}>
      <Button
        variant="secondary"
        onPress={() => {
          setIsOpen(true);
        }}
      >
        Add a plan
      </Button>
      {isOpen ? (
        <ConsumerAddPlan
          speed={speed}
          onOpenChange={setIsOpen}
          onSaved={(plan) => {
            setSaved(plan.payments === null ? 'empty' : String(plan.payments));
          }}
        />
      ) : null}
      <p style={{ margin: 0 }}>{`Saved: ${saved}`}</p>
    </div>
  );
}

/**
 * Saves the consumer's Dialog with `leave` after typing 0 in Payments made, then checks the saved value, the
 * console and focus: back on the trigger once the Dialog has gone, and still there two frames later, so not
 * left on the body after FocusScope's restore.
 */
async function saveTheConsumersPlan(
  canvasElement: HTMLElement,
  presses: Presses,
  leave: () => Promise<void>,
): Promise<void> {
  const heard = listenToTheConsole();
  try {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Add a plan' });
    await typeZeroInTheDialog(canvasElement, presses);
    await leave();
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull(), LONG);
    await expect(canvas.getByText('Saved: 0')).toBeVisible();
    await waitFor(() => expect(trigger).toHaveFocus(), LONG);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(trigger).toHaveFocus();
    await expect(heard.logged()).toEqual([]);
  } finally {
    heard.restore();
  }
}

/** The consumer's path: 0 typed, then Enter, which commits and submits; the save settles in a microtask. */
export const ConsumerEnterFastSave: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ConsumerPage speed="fast" />,
  play: async ({ canvasElement, userEvent }) => {
    const presses = await realPresses(userEvent);
    await saveTheConsumersPlan(canvasElement, presses, () => presses.keyboard('{Enter}'));
  },
};

/** The consumer's path by Enter, with a save that settles after 100ms, the field focused while it waits. */
export const ConsumerEnterSlowSave: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ConsumerPage speed="slow" />,
  play: async ({ canvasElement, userEvent }) => {
    const presses = await realPresses(userEvent);
    await saveTheConsumersPlan(canvasElement, presses, () => presses.keyboard('{Enter}'));
  },
};

/** The consumer's path: 0 typed, then a press on Add plan, whose save settles in a microtask. */
export const ConsumerPressFastSave: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ConsumerPage speed="fast" />,
  play: async ({ canvasElement, userEvent }) => {
    const presses = await realPresses(userEvent);
    await saveTheConsumersPlan(canvasElement, presses, () =>
      presses.click(within(document.body).getByRole('button', { name: 'Add plan' })),
    );
  },
};

/** The consumer's path by a press on Add plan, with a save that settles after 100ms. */
export const ConsumerPressSlowSave: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <ConsumerPage speed="slow" />,
  play: async ({ canvasElement, userEvent }) => {
    const presses = await realPresses(userEvent);
    await saveTheConsumersPlan(canvasElement, presses, () =>
      presses.click(within(document.body).getByRole('button', { name: 'Add plan' })),
    );
  },
};
