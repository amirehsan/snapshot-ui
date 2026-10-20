import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { SaveBar } from '../save-bar';
import { Select } from '../select';
import { focusOn } from '../stories/focus';
import { Switch } from '../switch';
import { FieldExtras } from './FieldExtras';

const meta = {
  title: 'Components/FieldExtras',
  component: FieldExtras,
  parameters: { layout: 'padded' },
  args: { fieldLabel: 'Wait', children: null },
} satisfies Meta<typeof FieldExtras>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A settings column, as the consumer's Coach section draws its fields. */
const COLUMN: CSSProperties = {
  display: 'grid',
  gap: 'var(--spacing-peer)',
  width: '100%',
  maxWidth: '28rem',
};

/** How long a payment waits before it is counted, as a settings page offers it. */
const WAITS = [
  ['day', '1 day'],
  ['three', '3 days'],
  ['week', 'A week'],
  ['month', 'A month'],
] as const;

/** The first element with this class inside `scope`. */
const part = (scope: ParentNode, name: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The page scrolls sideways by this many px: 0 when everything fits the screen. */
const sideways = (): number => document.documentElement.scrollWidth - document.documentElement.clientWidth;

/** A CSS length read in px inside `scope`, where its tokens resolve. */
const lengthIn = (scope: Element, value: string): number => {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.inlineSize = value;
  scope.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();
  return width;
};

/**
 * Samples `document.activeElement` every frame until `stop` is called, and returns how many frames found the
 * body: a part that moves focus in the frame after React's commit leaves it there for one frame at most.
 */
function watchBody(): () => number {
  let frames = 0;
  let running = true;
  const sample = (): void => {
    if (!running) return;
    if (document.activeElement === document.body) frames += 1;
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  return () => {
    running = false;
    return frames;
  };
}

/** The Select "Wait", controlled, with its default of 3 days. */
function WaitField({ start = 'week' }: { start?: string }): ReactElement {
  const [wait, setWait] = useState(start);
  return (
    <FieldExtras
      fieldLabel="Wait"
      defaultOffer={{
        value: '3 days',
        isCurrent: wait === 'three',
        onTake: () => {
          setWait('three');
        },
      }}
    >
      <Select
        label="Wait"
        description="How long a payment waits before it counts."
        value={wait}
        onChange={(key) => {
          setWait(String(key));
        }}
      >
        {WAITS.map(([id, name]) => (
          <PickerOption key={id} id={id}>
            {name}
          </PickerOption>
        ))}
      </Select>
    </FieldExtras>
  );
}

/** The money field "Cushion", in cents, with the suggestion of a month of fixed bills and, if asked, a default. */
function CushionField({
  start = null,
  withDefault = false,
}: {
  start?: number | null;
  withDefault?: boolean;
}): ReactElement {
  const [cents, setCents] = useState<number | null>(start);
  return (
    <FieldExtras
      fieldLabel="Cushion"
      suggestion={{
        value: '$2,340',
        reason: 'a month of your fixed bills',
        isCurrent: cents === 234000,
        onTake: () => {
          setCents(234000);
        },
      }}
      defaultOffer={
        withDefault
          ? {
              value: '$1,000',
              isCurrent: cents === 100000,
              onTake: () => {
                setCents(100000);
              },
            }
          : undefined
      }
    >
      <NumberField
        label="Cushion"
        description="Kept aside before anything counts as spare."
        money={{ symbol: '$' }}
        value={cents}
        onChange={setCents}
      />
    </FieldExtras>
  );
}

/** The Switch "Push amounts", on, with its default of off. */
function PushAmountsField(): ReactElement {
  const [on, setOn] = useState(true);
  return (
    <FieldExtras
      fieldLabel="Push amounts"
      defaultOffer={{
        value: 'Off',
        isCurrent: !on,
        onTake: () => {
          setOn(false);
        },
      }}
    >
      <Switch description="Show the amount in a notification." isSelected={on} onChange={setOn}>
        Push amounts
      </Switch>
    </FieldExtras>
  );
}

/** The hours a payment waits, as a NumberField, at 72 with its default of 24 hours. */
function HoursField(): ReactElement {
  const [hours, setHours] = useState<number | null>(72);
  return (
    <FieldExtras
      fieldLabel="Hours to wait"
      defaultOffer={{
        value: '24 hours',
        isCurrent: hours === 24,
        onTake: () => {
          setHours(24);
        },
      }}
    >
      <NumberField label="Hours to wait" value={hours} onChange={setHours} minValue={0} maxValue={72} />
    </FieldExtras>
  );
}

/** A Select saved away from its default: the slate line under the field, Reset to default at its end. */
export const ResetToDefault: Story = {
  render: () => (
    <div style={COLUMN}>
      <WaitField />
    </div>
  ),
};

/** An empty money field and a suggestion with its reason. Never prefilled, never a placeholder. */
export const Suggestion: Story = {
  render: () => (
    <div style={COLUMN}>
      <CushionField />
    </div>
  ),
};

/** Both offers: the suggestion first, about this reader, then the default, about everyone. Two lines. */
export const Both: Story = {
  render: () => (
    <div style={COLUMN}>
      <CushionField start={50000} withDefault />
    </div>
  ),
};

/** A Select and a Switch, each with its default offered, in comfortable and compact. */
export const OnSelectAndSwitch: Story = {
  tags: ['density'],
  render: () => (
    <div style={COLUMN}>
      <WaitField />
      <PushAmountsField />
    </div>
  ),
};

/** A card whose body ends with a field and its offer: the offer's button stands clear of the bottom corner. */
export const InCard: Story = {
  render: () => (
    <Card as="section" aria-label="Coach" style={{ width: '100%', maxWidth: '28rem' }}>
      <CardHeader>
        <CardTitle level={3}>Coach</CardTitle>
      </CardHeader>
      <CardBody>
        <WaitField />
      </CardBody>
    </Card>
  ),
};

/**
 * Reset by Enter, then by a pointer press: each time the button leaves, as the field now holds the default, and
 * the NumberField's input holds focus in the frame after, never the body for more than a frame.
 */
export const FocusAfterReset: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={COLUMN}>
      <HoursField />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Hours to wait' });
    const reset = () => canvas.getByRole('button', { name: 'Reset to default, Hours to wait' });

    await focusOn(reset());
    let stop = watchBody();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(input).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(input).toHaveValue('24');
    await expect(canvas.queryByRole('button', { name: /^Reset to default/ })).toBeNull();

    // Away from the default again, the offer comes back; a pointer press takes it.
    await userEvent.clear(input);
    // Enter commits the field's text, so the offer comes back with focus still in the field.
    await userEvent.type(input, '48{Enter}');
    await waitFor(() => expect(reset()).toBeVisible(), { timeout: 5000 });
    stop = watchBody();
    await userEvent.click(reset());
    await waitFor(() => expect(input).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(input).toHaveValue('24');
  },
};

/**
 * The suggestion taken on a money field: the field holds $2,340.00 and focus, and then, with focus already on
 * the field, the polite status says what happened, once, in words that do not repeat the field's own.
 */
export const FocusAfterUse: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={COLUMN}>
      <CushionField />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Cushion' });
    const status = part(canvasElement, 'field-extras-status');
    await expect(status).toBeEmptyDOMElement();
    const use = canvas.getByRole('button', { name: 'Use, Cushion' });
    await expect(use).toHaveAccessibleDescription('Suggested: $2,340, a month of your fixed bills');
    // What held focus each time the status changed: a screen reader would cut a status said before the move.
    const heldFocus: (Element | null)[] = [];
    const observer = new MutationObserver(() => {
      heldFocus.push(document.activeElement);
    });
    observer.observe(status, { childList: true, subtree: true, characterData: true });
    try {
      await focusOn(use);
      const stop = watchBody();
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(input).toHaveFocus(), { timeout: 5000 });
      await expect(stop()).toBeLessThanOrEqual(1);
      await expect(input).toHaveValue('2,340.00');
      await waitFor(() => expect(status).toHaveTextContent('Set to the suggestion'), { timeout: 5000 });
      await expect(status.childElementCount).toBe(1);
      await expect(heldFocus).toEqual([input]);
    } finally {
      observer.disconnect();
    }
  },
};

/**
 * On a 320px phone the offer's line wraps, its button stays inside the page at the line's end, and nothing
 * scrolls sideways, in a column and in a card, in every shape and density.
 */
export const OfferOnANarrowPhone: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: { viewport: { value: 'narrow' } },
  parameters: {
    viewport: { options: { narrow: { name: 'Narrow phone', styles: { width: '320px', height: '640px' } } } },
  },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <CushionField start={50000} withDefault />
      <Card as="section" aria-label="Coach">
        <CardBody>
          <WaitField />
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    const root = document.documentElement;
    const { shape, density } = root.dataset;
    try {
      for (const [nextShape, nextDensity] of [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ] as const) {
        root.dataset.shape = nextShape;
        root.dataset.density = nextDensity;
        await waitFor(() => expect(sideways()).toBeLessThanOrEqual(0), { timeout: 5000 });
        const offer = part(canvasElement, 'field-offer');
        // The suggestion's words and its button take more than one line here, and wrap rather than push.
        const lineHeight = parseFloat(getComputedStyle(offer).lineHeight);
        await expect(offer.getBoundingClientRect().height).toBeGreaterThan(lineHeight * 1.5);
        for (const button of canvasElement.querySelectorAll<HTMLElement>('.field-offer-button')) {
          const box = button.getBoundingClientRect();
          await expect(box.left).toBeGreaterThanOrEqual(0);
          await expect(box.right).toBeLessThanOrEqual(root.clientWidth);
          const line = button.closest('.field-offer')?.getBoundingClientRect();
          if (!line) throw new Error('No line');
          await expect(box.right).toBeLessThanOrEqual(line.right + 1);
        }
      }
    } finally {
      root.dataset.shape = shape ?? 'rounded';
      root.dataset.density = density ?? 'comfortable';
    }
  },
};

/**
 * The last offer in a card's body, at the card's foot. Rounded, comfortable and compact: the button's box stands
 * at least the card's corner inset from the card's bottom edge, within 1px. Soft and Square: the card's padding
 * clears the curve, so the line keeps no padding of its own. An offer not at the card's foot never moves.
 */
export const OfferClearOfCorner: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)', width: '100%', maxWidth: '28rem' }}>
      <Card as="section" aria-label="Coach" data-case="foot">
        <CardHeader>
          <CardTitle level={3}>Coach</CardTitle>
        </CardHeader>
        <CardBody>
          <WaitField />
        </CardBody>
      </Card>
      <Card as="section" aria-label="Notifications" data-case="followed">
        <CardHeader>
          <CardTitle level={3}>Notifications</CardTitle>
        </CardHeader>
        <CardBody>
          <PushAmountsField />
          <p>Sent to this device only.</p>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const { shape, density } = root.dataset;
    const card = (name: string): HTMLElement => part(canvasElement, `card[data-case="${name}"]`);
    const line = (name: string): HTMLElement => part(card(name), 'field-offer');
    const padEnd = (element: Element): number => parseFloat(getComputedStyle(element).paddingBlockEnd);
    try {
      for (const [nextShape, nextDensity] of [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ] as const) {
        root.dataset.shape = nextShape;
        root.dataset.density = nextDensity;
        const foot = card('foot');
        const inset = lengthIn(foot, 'var(--holder-corner-inset)');
        const extra = inset - lengthIn(foot, 'var(--holder-pad)');
        const button = part(foot, 'field-offer-button');
        if (nextShape === 'rounded') {
          await expect(extra).toBeGreaterThan(0);
          await waitFor(
            () =>
              expect(
                foot.getBoundingClientRect().bottom - button.getBoundingClientRect().bottom,
              ).toBeGreaterThanOrEqual(inset - 1),
            { timeout: 5000 },
          );
        } else {
          await expect(extra).toBe(0);
          await waitFor(() => expect(padEnd(line('foot'))).toBe(0), { timeout: 5000 });
        }
        // Followed by a paragraph, the offer is not at the card's foot and keeps no padding.
        await expect(padEnd(line('followed'))).toBe(0);
      }
    } finally {
      root.dataset.shape = shape ?? 'rounded';
      root.dataset.density = density ?? 'comfortable';
    }
  },
};

/**
 * On a Persian page the line runs right to left: the words at the line's start on the right, the button at its
 * end to their left. The figure keeps its order inside the app's `bdi`, and the reset still focuses the field.
 */
export const RightToLeft: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => {
    function Persian(): ReactElement {
      const [wait, setWait] = useState('week');
      return (
        <I18nProvider locale="fa-IR">
          <div dir="rtl" lang="fa" style={COLUMN}>
            <FieldExtras
              fieldLabel="انتظار"
              labels={{
                default: (value) => `پیش‌فرض: ${value}`,
                reset: 'بازگشت',
                resetStatus: 'به پیش‌فرض برگشت',
              }}
              defaultOffer={{
                value: '۳ روز',
                isCurrent: wait === 'three',
                onTake: () => {
                  setWait('three');
                },
              }}
            >
              <Select
                label="انتظار"
                value={wait}
                onChange={(key) => {
                  setWait(String(key));
                }}
              >
                <PickerOption id="three">۳ روز</PickerOption>
                <PickerOption id="week">یک هفته</PickerOption>
              </Select>
            </FieldExtras>
          </div>
        </I18nProvider>
      );
    }
    return <Persian />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reset = canvas.getByRole('button', { name: 'بازگشت, انتظار' });
    const text = part(canvasElement, 'field-offer-text');
    const line = part(canvasElement, 'field-offer');
    await waitFor(
      () =>
        expect(reset.getBoundingClientRect().right).toBeLessThanOrEqual(
          text.getBoundingClientRect().left + 1,
        ),
      { timeout: 5000 },
    );
    // The words start at the line's right edge, as Persian reads.
    await expect(
      Math.abs(text.getBoundingClientRect().right - line.getBoundingClientRect().right),
    ).toBeLessThan(1);
    await focusOn(reset);
    await userEvent.keyboard('{Enter}');
    const trigger = canvasElement.querySelector<HTMLElement>('.select button');
    if (!trigger) throw new Error('No trigger');
    await waitFor(() => expect(trigger).toHaveFocus(), { timeout: 5000 });
    await expect(trigger).toHaveTextContent('۳ روز');
  },
};

/**
 * An offer is an edit: taken, it makes the field Changed and the save bar dirty by the app's own comparison;
 * Cancel and Discard put the saved value back, and the offer with it.
 */
export const WithSaveBar: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => {
    function Coach(): ReactElement {
      const [saved, setSaved] = useState('week');
      const [wait, setWait] = useState('week');
      const isDirty = wait !== saved;
      return (
        <form
          style={COLUMN}
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FieldExtras
            fieldLabel="Wait"
            defaultOffer={{
              value: '3 days',
              isCurrent: wait === 'three',
              onTake: () => {
                setWait('three');
              },
            }}
          >
            <Select
              label="Wait"
              value={wait}
              isChanged={isDirty}
              onChange={(key) => {
                setWait(String(key));
              }}
            >
              {WAITS.map(([id, name]) => (
                <PickerOption key={id} id={id}>
                  {name}
                </PickerOption>
              ))}
            </Select>
          </FieldExtras>
          <SaveBar
            message={isDirty ? '1 change to Coach' : 'Coach'}
            isDirty={isDirty}
            actionLabel="Save"
            warnsOnUnload={false}
            onAction={() => {
              setSaved(wait);
            }}
            onCancel={() => {
              setWait(saved);
            }}
          />
        </form>
      );
    }
    return <Coach />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);
    await expect(canvas.getByRole('group', { name: 'Coach' })).toBeVisible();
    await focusOn(canvas.getByRole('button', { name: 'Reset to default, Wait' }));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('group', { name: '1 change to Coach' })).toBeVisible(), {
      timeout: 5000,
    });
    await expect(part(canvasElement, 'field')).toHaveAttribute('data-changed');
    await expect(canvas.queryByRole('button', { name: 'Reset to default, Wait' })).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    const question = await waitFor(() => body.getByRole('alertdialog', { name: 'Discard changes?' }), {
      timeout: 5000,
    });
    await userEvent.click(within(question).getByRole('button', { name: 'Discard changes' }));
    await waitFor(
      () => expect(canvas.getByRole('button', { name: 'Reset to default, Wait' })).toBeVisible(),
      {
        timeout: 5000,
      },
    );
    await expect(canvas.getByRole('group', { name: 'Coach' })).toBeVisible();
    await expect(part(canvasElement, 'field')).not.toHaveAttribute('data-changed');
    await waitFor(() => expect(document.activeElement).not.toBe(document.body), { timeout: 5000 });
  },
};
