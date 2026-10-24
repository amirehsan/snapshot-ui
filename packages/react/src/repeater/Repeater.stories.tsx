import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { FieldExtras } from '../field-extras';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { SaveBar } from '../save-bar';
import { Select } from '../select';
import { focusOn } from '../stories/focus';
import { Repeater, type RepeaterLabels, type RepeaterRow } from './Repeater';

const meta = {
  title: 'Components/Repeater',
  component: Repeater,
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** A wait tier, the consumer's: up to an amount in cents, a payment waits this long. */
interface Tier extends RepeaterRow {
  id: string;
  amount: number | null;
  wait: string;
}

const WAITS = [
  ['day', 'A day'],
  ['three', '3 days'],
  ['week', 'A week'],
  ['two-weeks', 'Two weeks'],
  ['month', 'A month'],
] as const;

const TWO: Tier[] = [
  { id: 'a', amount: 10000, wait: 'three' },
  { id: 'b', amount: 50000, wait: 'week' },
];

const THREE: Tier[] = [...TWO, { id: 'c', amount: 150000, wait: 'month' }];

const DEFAULT_TIERS: Omit<Tier, 'id'>[] = [
  { amount: 10000, wait: 'three' },
  { amount: 50000, wait: 'week' },
  { amount: 150000, wait: 'month' },
];

const LABELS: Partial<RepeaterLabels> = {
  add: 'Add a tier',
  full: (max) => `${String(max)} of ${String(max)}. Remove a tier to add another.`,
  empty: 'No tiers. The coach never waits.',
};

/** A settings column wide enough that a row's fields share a line with Remove. */
const COLUMN: CSSProperties = { width: '100%', maxWidth: '40rem' };

let made = 0;
const createTier = (): Tier => {
  made += 1;
  return { id: `new-${String(made)}`, amount: null, wait: 'three' };
};

const tierLabel = (index: number): string => `Tier ${String(index + 1)}`;

/** The first element matching `selector` inside `scope`. */
const part = (scope: ParentNode, selector: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`No ${selector}`);
  return element;
};

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

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

/** Each shape and density a corner or a width is measured in, put back after. */
async function inEachLook(
  looks: readonly (readonly [shape: string, density: string])[],
  check: (shape: string, density: string) => Promise<void>,
): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of looks) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check(nextShape, nextDensity);
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

const EVERY_LOOK = [
  ['rounded', 'comfortable'],
  ['rounded', 'compact'],
  ['soft', 'comfortable'],
  ['square', 'comfortable'],
] as const;

/** One tier's two fields: a money NumberField "Up to" and a Select "Wait". */
function TierFields({
  tier,
  update,
  error,
}: {
  tier: Tier;
  update: (tier: Tier) => void;
  error: ReactNode;
}): ReactElement {
  return (
    <>
      <NumberField
        label="Up to"
        money={{ symbol: '$' }}
        value={tier.amount}
        isInvalid={error != null}
        onChange={(amount) => {
          update({ ...tier, amount });
        }}
      />
      <Select
        label="Wait"
        value={tier.wait}
        onChange={(key) => {
          update({ ...tier, wait: String(key) });
        }}
      >
        {WAITS.map(([id, name]) => (
          <PickerOption key={id} id={id}>
            {name}
          </PickerOption>
        ))}
      </Select>
    </>
  );
}

interface TiersProps {
  start?: Tier[];
  minRows?: number;
  maxRows?: number;
  label?: string;
  errorMessage?: ReactNode;
  rowErrors?: Record<string, ReactNode>;
  isChanged?: boolean;
  style?: CSSProperties;
  className?: string;
}

/** The consumer's wait tiers, controlled. */
function Tiers({
  start = TWO,
  minRows,
  maxRows = 3,
  label = 'Wait tiers',
  ...props
}: TiersProps): ReactElement {
  const [rows, setRows] = useState<Tier[]>(start);
  return (
    <Repeater<Tier>
      label={label}
      description="A payment waits by its amount, the larger the longer."
      value={rows}
      onChange={setRows}
      createRow={createTier}
      rowLabel={tierLabel}
      minRows={minRows}
      maxRows={maxRows}
      labels={LABELS}
      {...props}
    >
      {(tier, { update, error }) => <TierFields tier={tier} update={update} error={error} />}
    </Repeater>
  );
}

/** Two tiers of three: Add shows "2 of 3". */
export const Default: Story = {
  tags: ['density'],
  render: () => <Tiers style={COLUMN} />,
};

/** Three tiers of three: Add stays, disabled, with its reason beside it, which is also its description. */
export const AtMaximum: Story = {
  render: () => <Tiers start={THREE} style={COLUMN} />,
};

/** One tier with `minRows={1}`: no Remove, and the end column keeps its width. */
export const AtMinimum: Story = {
  render: () => <Tiers start={TWO.slice(0, 1)} minRows={1} style={COLUMN} />,
};

/** Tier 2's amount equals Tier 1's: the row's error under its fields, the amount marked invalid. */
export const RowError: Story = {
  render: () => (
    <Tiers
      start={[...TWO.slice(0, 1), { id: 'b', amount: 10000, wait: 'week' }]}
      rowErrors={{ b: 'Another tier waits from $100.00' }}
      style={COLUMN}
    />
  ),
};

/** An error about the whole set, under the legend; the Changed chip steps aside while it shows. */
export const SetError: Story = {
  render: () => (
    <Tiers start={[...TWO].reverse()} errorMessage="Tiers must go up by amount" isChanged style={COLUMN} />
  ),
};

/** No rows: the empty line in their place, and Add. */
export const Empty: Story = {
  render: () => <Tiers start={[]} style={COLUMN} />,
};

/** A 20rem frame: one field per line, Remove after them. */
export const Narrow: Story = {
  render: () => <Tiers style={{ width: '20rem' }} />,
};

/** A card "Wait tiers" ending with the Repeater: Add clear of the card's bottom start corner. */
export const InCard: Story = {
  tags: ['density'],
  render: () => (
    <Card as="section" aria-label="Wait tiers" style={COLUMN}>
      <CardHeader>
        <CardTitle level={3}>Wait tiers</CardTitle>
      </CardHeader>
      <CardBody>
        <Tiers label="Tiers" />
      </CardBody>
    </Card>
  ),
};

let resets = 0;

/** The tiers under FieldExtras' group offer: their default set, and Reset to default. */
function TiersWithDefault({ start = TWO }: { start?: Tier[] }): ReactElement {
  const [rows, setRows] = useState<Tier[]>(start);
  const isDefault =
    JSON.stringify(rows.map(({ amount, wait }) => ({ amount, wait }))) === JSON.stringify(DEFAULT_TIERS);
  return (
    <FieldExtras
      scope="group"
      fieldLabel="Wait tiers"
      defaultOffer={{
        value: '$100 waits 3 days, $500 a week, $1,500 a month',
        isCurrent: isDefault,
        onTake: () => {
          resets += 1;
          setRows(
            DEFAULT_TIERS.map((tier, at) => ({ ...tier, id: `default-${String(resets)}-${String(at)}` })),
          );
        },
      }}
      style={COLUMN}
    >
      <Repeater<Tier>
        label="Wait tiers"
        value={rows}
        onChange={setRows}
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        labels={LABELS}
      >
        {(tier, { update, error }) => <TierFields tier={tier} update={update} error={error} />}
      </Repeater>
    </FieldExtras>
  );
}

/** Two edited tiers under their default set: "Default: $100 waits 3 days, $500 a week, $1,500 a month". */
export const WithDefaultOffer: Story = {
  render: () => (
    <TiersWithDefault
      start={[
        { id: 'a', amount: 20000, wait: 'three' },
        { id: 'b', amount: 80000, wait: 'two-weeks' },
      ]}
    />
  ),
};

/**
 * Add, then remove a middle row, the last row and the only row: each time focus lands on the named place in the
 * frame after the commit, the body holds it for one frame at most, and the status says what happened. The
 * Remove that held focus unmounts each time, which is what Chromium blurs early.
 */
export const RepeaterFocus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Tiers style={COLUMN} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const status = part(canvasElement, '.repeater-status');
    const row = (name: string): HTMLElement => canvas.getByRole('group', { name });
    const remove = (name: string): HTMLElement => canvas.getByRole('button', { name: `Remove, ${name}` });
    await expect(status).toBeEmptyDOMElement();

    // An add: the new row's first field, and the reason, since it reached the maximum.
    await focusOn(canvas.getByRole('button', { name: 'Add a tier' }));
    let stop = watchBody();
    await userEvent.keyboard('{Enter}');
    const amount = await waitFor(() => within(row('Tier 3')).getByRole('textbox', { name: 'Up to' }), {
      timeout: 5000,
    });
    await waitFor(() => expect(amount).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await waitFor(
      () => expect(status).toHaveTextContent('Tier 3 added. 3 of 3. Remove a tier to add another.'),
      { timeout: 5000 },
    );

    // A middle row by a pointer: the same control, Remove, in the row now in its place.
    stop = watchBody();
    await userEvent.click(remove('Tier 2'));
    await waitFor(() => expect(remove('Tier 2')).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await waitFor(() => expect(status).toHaveTextContent('Tier 2 removed'), { timeout: 5000 });

    // The last row by a key: Remove in the new last row.
    stop = watchBody();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(remove('Tier 1')).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await waitFor(() => expect(status).toHaveTextContent('Tier 2 removed'), { timeout: 5000 });

    // The only row: Add.
    stop = watchBody();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Add a tier' })).toHaveFocus(), {
      timeout: 5000,
    });
    await expect(stop()).toBeLessThanOrEqual(1);
    await waitFor(() => expect(status).toHaveTextContent('Tier 1 removed'), { timeout: 5000 });
    await expect(canvas.getByText('No tiers. The coach never waits.')).toBeVisible();
  },
};

/**
 * At the maximum Tab passes the disabled Add by, its description is the reason, and the add that reached the
 * maximum said the reason with it.
 */
export const AtMaximumReason: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={COLUMN}>
      <Tiers />
      <button type="button">After</button>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const add = canvas.getByRole('button', { name: 'Add a tier' });
    await expect(add).toHaveAccessibleDescription('2 of 3');
    await focusOn(add);
    await userEvent.keyboard('{Enter}');
    const amount = await waitFor(
      () => within(canvas.getByRole('group', { name: 'Tier 3' })).getByRole('textbox'),
      {
        timeout: 5000,
      },
    );
    await waitFor(() => expect(amount).toHaveFocus(), { timeout: 5000 });
    await expect(add).toBeDisabled();
    await expect(add).toHaveAccessibleDescription('3 of 3. Remove a tier to add another.');
    await expect(part(canvasElement, '.repeater-full')).toBeVisible();
    // Said in the move's frame, once focus is on the new row's field.
    await waitFor(
      () =>
        expect(part(canvasElement, '.repeater-status')).toHaveTextContent(
          'Tier 3 added. 3 of 3. Remove a tier to add another.',
        ),
      { timeout: 5000 },
    );
    // From Tier 3's Remove, Tab goes past the disabled Add to what follows.
    await focusOn(canvas.getByRole('button', { name: 'Remove, Tier 3' }));
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus(), {
      timeout: 5000,
    });
  },
};

/** Reset to default by Enter and by a press: three default rows, and the first "Up to" holds focus. */
export const GroupReset: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <TiersWithDefault />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const reset = (): HTMLElement => canvas.getByRole('button', { name: 'Reset to default, Wait tiers' });
    const first = (): HTMLElement =>
      within(canvas.getByRole('group', { name: 'Tier 1' })).getByRole('textbox', { name: 'Up to' });
    await focusOn(reset());
    let stop = watchBody();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(first()).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(canvasElement.querySelectorAll('.repeater-row')).toHaveLength(3);
    await expect(first()).toHaveValue('100.00');
    // Away from the default again by a remove, then reset by a pointer.
    await userEvent.click(canvas.getByRole('button', { name: 'Remove, Tier 3' }));
    await waitFor(() => expect(reset()).toBeVisible(), { timeout: 5000 });
    stop = watchBody();
    await userEvent.click(reset());
    await waitFor(() => expect(first()).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(canvasElement.querySelectorAll('.repeater-row')).toHaveLength(3);
  },
};

/** A frame at 29rem and then 31rem: the fields stack with Remove after them, then share a line with Remove at its end. */
export const RowFieldsAtItsWidth: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div className="frame" style={{ width: '29rem' }}>
      <Tiers start={TWO.slice(0, 1)} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = part(canvasElement, '.frame');
    const fields = (): HTMLElement[] => [
      part(canvasElement, '.repeater-row .number-field'),
      part(canvasElement, '.repeater-row .select'),
    ];
    const remove = (): HTMLElement => part(canvasElement, '.repeater-remove');
    try {
      await waitFor(
        async () => {
          const [amount, wait] = fields().map(rect);
          if (!amount || !wait) throw new Error('Two fields');
          await expect(wait.top).toBeGreaterThanOrEqual(amount.bottom - 1);
          await expect(rect(remove()).top).toBeGreaterThanOrEqual(wait.bottom - 1);
        },
        { timeout: 5000 },
      );
      frame.style.width = '31rem';
      await waitFor(
        async () => {
          const [amount, wait] = fields().map(rect);
          if (!amount || !wait) throw new Error('Two fields');
          await expect(Math.abs(wait.top - amount.top)).toBeLessThan(1);
          await expect(rect(remove()).left).toBeGreaterThanOrEqual(wait.right - 1);
          await expect(rect(remove()).right).toBeLessThanOrEqual(rect(frame).right + 1);
        },
        { timeout: 5000 },
      );
    } finally {
      frame.style.width = '29rem';
    }
  },
};

/** From 30rem Remove's centre is on the first field's control's centre, within 1px, comfortable and compact. */
export const RemoveLevelWithFields: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Tiers style={COLUMN} />,
  play: async ({ canvasElement }) => {
    await inEachLook(
      [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
      ],
      async () => {
        for (const item of canvasElement.querySelectorAll<HTMLElement>('.repeater-row')) {
          const control = part(item, '.number-field-control');
          const remove = part(item, '.repeater-remove');
          await waitFor(
            () => {
              const middle = (box: DOMRect): number => box.top + box.height / 2;
              return expect(Math.abs(middle(rect(remove)) - middle(rect(control)))).toBeLessThanOrEqual(1);
            },
            { timeout: 5000 },
          );
        }
      },
    );
  },
};

/**
 * In a Rounded card, comfortable and compact, Add's bottom stands at least the corner inset from the card's edge,
 * within 1px; in Soft and Square the inset less the padding is 0, so the foot keeps no padding. A repeater that
 * does not end the card, followed by a line, never moves.
 */
export const AddClearOfCorner: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)', ...COLUMN }}>
      <Card as="section" aria-label="Wait tiers" data-case="foot">
        <CardBody>
          <Tiers label="Wait tiers" />
        </CardBody>
      </Card>
      <Card as="section" aria-label="Under offers" data-case="offers">
        <CardBody>
          <TiersWithDefault start={THREE.map((tier, at) => ({ ...tier, ...DEFAULT_TIERS[at] }))} />
        </CardBody>
      </Card>
      <Card as="section" aria-label="Followed" data-case="followed">
        <CardBody>
          <Tiers label="Followed tiers" />
          <p>Tiers apply from the next payment.</p>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const card = (name: string): HTMLElement => part(canvasElement, `.card[data-case="${name}"]`);
    const padEnd = (element: Element): number => parseFloat(getComputedStyle(element).paddingBlockEnd);
    await inEachLook(EVERY_LOOK, async (shape) => {
      for (const name of ['foot', 'offers']) {
        const holder = card(name);
        const inset = lengthIn(holder, 'var(--holder-corner-inset)');
        const extra = inset - lengthIn(holder, 'var(--holder-pad)');
        const add = part(holder, '.repeater-add');
        if (shape === 'rounded') {
          await expect(extra).toBeGreaterThan(0);
          await waitFor(
            () => expect(rect(holder).bottom - rect(add).bottom).toBeGreaterThanOrEqual(inset - 1),
            { timeout: 5000 },
          );
        } else {
          await expect(extra).toBe(0);
          await waitFor(() => expect(padEnd(part(holder, '.repeater-foot'))).toBe(0), { timeout: 5000 });
        }
      }
      await expect(padEnd(part(card('followed'), '.repeater-foot'))).toBe(0);
    });
  },
};

/**
 * A repeater with no legend that starts a card with no header puts its first Remove near the card's top end
 * corner: the row's legend and the fields' label row stand above it, so it is lower than the corner inset in every
 * shape and density, and in Rounded it never sits in the curve.
 */
export const RemoveClearOfCorner: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Card as="section" aria-label="Wait tiers" style={COLUMN}>
      <CardBody>
        <Repeater<Tier>
          aria-label="Wait tiers"
          defaultValue={TWO}
          createRow={createTier}
          rowLabel={tierLabel}
          maxRows={3}
          labels={LABELS}
        >
          {(tier, { update, error }) => <TierFields tier={tier} update={update} error={error} />}
        </Repeater>
      </CardBody>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const card = part(canvasElement, '.card');
    await inEachLook(EVERY_LOOK, async () => {
      const inset = lengthIn(card, 'var(--holder-corner-inset)');
      const remove = part(card, '.repeater-remove');
      await waitFor(() => expect(rect(remove).top - rect(card).top).toBeGreaterThanOrEqual(inset - 1), {
        timeout: 5000,
      });
    });
  },
};

/**
 * On a 320px phone: a Repeater in a flex: 1 wrapper, in a 1fr grid and two up, in Rounded comfortable and
 * compact, Soft and Square. Nothing scrolls sideways and each fills its holder.
 */
export const OnANarrowPhone: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: { viewport: { value: 'narrow' } },
  parameters: {
    viewport: { options: { narrow: { name: 'Narrow phone', styles: { width: '320px', height: '640px' } } } },
  },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div style={{ display: 'flex' }}>
        <div className="holder" style={{ flex: 1 }}>
          <Tiers label="In a flex wrapper" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div className="holder">
          <Tiers label="In a grid" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-peer)' }}>
        <div className="holder">
          <Tiers label="Left" start={TWO.slice(0, 1)} />
        </div>
        <div className="holder">
          <Tiers label="Right" start={TWO.slice(1)} />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    await inEachLook(EVERY_LOOK, async () => {
      await waitFor(() => expect(sideways()).toBeLessThanOrEqual(0), { timeout: 5000 });
      for (const holder of canvasElement.querySelectorAll<HTMLElement>('.holder')) {
        const set = part(holder, '.repeater');
        await expect(Math.abs(rect(set).width - rect(holder).width)).toBeLessThanOrEqual(1);
        for (const row of holder.querySelectorAll('.repeater-row-fields')) {
          await expect(rect(row).width).toBeGreaterThan(0);
          await expect(rect(row).right).toBeLessThanOrEqual(rect(holder).right + 1);
        }
      }
    });
  },
};

/**
 * Adds and removes are edits: the Changed chip beside the legend and the save bar dirty by the app's comparison;
 * Cancel and Discard put the saved rows back, and focus never falls to the body.
 */
export const WithSaveBar: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => {
    function Coach(): ReactElement {
      const [saved, setSaved] = useState<Tier[]>(TWO);
      const [rows, setRows] = useState<Tier[]>(TWO);
      const isDirty = JSON.stringify(rows) !== JSON.stringify(saved);
      return (
        <form
          style={COLUMN}
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <Repeater<Tier>
            label="Wait tiers"
            value={rows}
            onChange={setRows}
            createRow={createTier}
            rowLabel={tierLabel}
            maxRows={3}
            labels={LABELS}
            isChanged={isDirty}
          >
            {(tier, { update, error }) => <TierFields tier={tier} update={update} error={error} />}
          </Repeater>
          <SaveBar
            message={isDirty ? 'Unsaved tiers' : 'Coach'}
            isDirty={isDirty}
            actionLabel="Save"
            warnsOnUnload={false}
            onAction={() => {
              setSaved(rows);
            }}
            onCancel={() => {
              setRows(saved);
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
    const chip = (): Element | null => canvasElement.querySelector('.repeater-legend .field-changed');
    await expect(chip()).toBeNull();
    await userEvent.click(canvas.getByRole('button', { name: 'Remove, Tier 2' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Unsaved tiers' })).toBeVisible(), {
      timeout: 5000,
    });
    await expect(chip()).toHaveTextContent('Changed');
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));
    const question = await waitFor(() => body.getByRole('alertdialog', { name: 'Discard changes?' }), {
      timeout: 5000,
    });
    await userEvent.click(within(question).getByRole('button', { name: 'Discard changes' }));
    await waitFor(() => expect(canvas.getByRole('group', { name: 'Tier 2' })).toBeVisible(), {
      timeout: 5000,
    });
    await expect(chip()).toBeNull();
    await expect(canvas.getByRole('group', { name: 'Coach' })).toBeVisible();
    await waitFor(() => expect(document.activeElement).not.toBe(document.body), { timeout: 5000 });
  },
};
