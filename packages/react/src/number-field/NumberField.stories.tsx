import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { renderToString } from 'react-dom/server';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, waitFor } from 'storybook/test';
import { Button } from '../button';
import { tokenColor, tokenPixels, washColor } from '../stories/paint';
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
    await userEvent.click(input);
    await waitFor(() => expect(input).toHaveFocus());
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
