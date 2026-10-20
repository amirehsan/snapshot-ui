import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, useState, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { FieldExtras } from '../field-extras';
import * as library from '../index';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { SaveBar } from '../save-bar';
import { Select } from '../select';
import { TextField } from '../text-field';
import { Repeater, type RepeaterProps, type RepeaterRow } from './Repeater';

/*
 * A Repeater draws the app's rows, each a fieldset of the app's own fields with its legend by place, Remove per
 * row and Add after the last. Focus moves in the frame after React's commit, so each test that reads focus waits
 * for that frame. Keyboard presses are a key down and up on the focused button, which React Aria answers as a
 * keyboard press, as the FieldExtras tests send them.
 */

/** A wait tier: up to an amount in cents, a payment waits this long. */
interface Tier extends RepeaterRow {
  id: string;
  amount: number | null;
  wait: string;
}

const WAITS = [
  ['day', 'A day'],
  ['three', '3 days'],
  ['week', 'A week'],
  ['month', 'A month'],
] as const;

const TWO: Tier[] = [
  { id: 'a', amount: 10000, wait: 'three' },
  { id: 'b', amount: 50000, wait: 'week' },
];

const THREE: Tier[] = [...TWO, { id: 'c', amount: 150000, wait: 'month' }];

let made = 0;
/** A new tier with a new id, as an app's createRow makes one. */
const createTier = (): Tier => {
  made += 1;
  return { id: `new-${String(made)}`, amount: null, wait: 'three' };
};

const tierLabel = (index: number): string => `Tier ${String(index + 1)}`;

/** Focuses `element` and presses it with Enter, as a keyboard does. */
function press(element: HTMLElement): void {
  act(() => {
    element.focus();
  });
  act(() => {
    fireEvent.keyDown(element, { key: 'Enter' });
    fireEvent.keyUp(element, { key: 'Enter' });
  });
}

/** Lets two animation frames pass, so the part's move after the commit has run, and React draw what follows. */
async function frames(): Promise<void> {
  for (let count = 0; count < 2; count += 1) {
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
  }
}

/** The part's polite status host. */
function status(container: HTMLElement): HTMLElement {
  const host = container.querySelector<HTMLElement>('.repeater-status');
  if (!host) throw new Error('No status');
  return host;
}

/** A row's fieldset, by its legend. */
const row = (name: string): HTMLElement => screen.getByRole('group', { name });

/** The row legends, in drawn order. */
const legends = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.repeater-row-legend')].map((legend) => legend.textContent);

/** The Add button. */
const add = (): HTMLElement => screen.getByRole('button', { name: /^Add a tier/ });

/** One tier's fields, controlled by the row's `update`, or uncontrolled under repeated names. */
function TierFields({
  tier,
  update,
  error,
}: {
  tier: Tier;
  update?: (tier: Tier) => void;
  error: ReactNode;
}): ReactElement {
  return (
    <>
      <NumberField
        label="Up to"
        money={{ symbol: '$' }}
        name="tierAmount"
        isInvalid={error != null}
        {...(update
          ? {
              value: tier.amount,
              onChange: (amount: number | null) => {
                update({ ...tier, amount });
              },
            }
          : { defaultValue: tier.amount })}
      />
      <Select
        label="Wait"
        name="tierWait"
        {...(update
          ? {
              value: tier.wait,
              onChange: (key: unknown) => {
                update({ ...tier, wait: String(key) });
              },
            }
          : { defaultValue: tier.wait })}
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

type TierProps = Partial<Omit<RepeaterProps<Tier>, 'children'>>;

/** The tiers, controlled by the test's state, with the consumer's words. */
function Controlled({
  start = TWO,
  onRows,
  ...props
}: TierProps & { start?: Tier[]; onRows?: (rows: Tier[]) => void }): ReactElement {
  const [rows, setRows] = useState<Tier[]>(start);
  return (
    <Repeater<Tier>
      label="Wait tiers"
      createRow={createTier}
      rowLabel={tierLabel}
      maxRows={3}
      labels={{ add: 'Add a tier' }}
      {...props}
      value={rows}
      onChange={(next) => {
        setRows(next);
        onRows?.(next);
      }}
    >
      {(tier, { update, error }) => <TierFields tier={tier} update={update} error={error} />}
    </Repeater>
  );
}

/** The tiers, uncontrolled: the Repeater holds the rows and the fields hold what is typed. */
function Uncontrolled({ start = TWO, ...props }: TierProps & { start?: Tier[] }): ReactElement {
  return (
    <Repeater<Tier>
      label="Wait tiers"
      createRow={createTier}
      rowLabel={tierLabel}
      maxRows={3}
      labels={{ add: 'Add a tier' }}
      defaultValue={start}
      {...props}
    >
      {(tier, { error }) => <TierFields tier={tier} error={error} />}
    </Repeater>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Repeater', () => {
  it('is exported from the package', () => {
    expect(library.Repeater).toBe(Repeater);
  });

  it('draws a fieldset with its legend, an ordered list of row fieldsets with legends, Remove per row, Add, and an empty polite status', () => {
    const ref = createRef<HTMLFieldSetElement>();
    const { container } = render(
      <Controlled ref={ref} className="tiers" description="A payment waits by its amount." data-x="1" />,
    );
    const set = container.firstElementChild;
    expect(set).toBe(ref.current);
    expect(set?.tagName).toBe('FIELDSET');
    expect(set).toHaveClass('repeater', 'tiers');
    expect(set).toHaveAttribute('data-x', '1');
    expect(screen.getByRole('group', { name: 'Wait tiers' })).toBe(set);
    expect(set).toHaveAccessibleDescription('A payment waits by its amount.');
    const list = container.querySelector('ol.repeater-rows');
    expect(list?.children).toHaveLength(2);
    const items = [...container.querySelectorAll('li.repeater-row')];
    expect(items.map((item) => item.getAttribute('data-row-id'))).toEqual(['a', 'b']);
    for (const item of items) {
      const rowSet = item.firstElementChild;
      expect(rowSet?.tagName).toBe('FIELDSET');
      expect(rowSet).toHaveClass('repeater-row-set');
      expect(rowSet?.querySelector(':scope > legend.repeater-row-legend')).not.toBeNull();
      expect(
        rowSet?.querySelector('.repeater-row-fields > .repeater-row-grid > .repeater-row-main'),
      ).not.toBeNull();
      expect(rowSet?.querySelector('.repeater-row-grid > .repeater-row-end')).not.toBeNull();
    }
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
    expect(screen.getAllByRole('button', { name: /^Remove, / })).toHaveLength(2);
    expect(add()).toHaveAttribute('type', 'button');
    expect(container.querySelector('.repeater-foot')).toContainElement(add());
    const host = status(container);
    expect(host).toHaveAttribute('role', 'status');
    expect(host).toHaveAttribute('aria-live', 'polite');
    expect(host).toBeEmptyDOMElement();
    // In DOM order: the legend, the description, the rows, the foot, then the status.
    expect([...(set?.children ?? [])].map((child) => child.className)).toEqual([
      'repeater-legend',
      'repeater-description',
      'repeater-rows',
      'repeater-foot',
      'repeater-status',
    ]);
  });

  it.each([['controlled'], ['uncontrolled']] as const)(
    'adds, removes and updates rows %s, calling onChange with the new rows',
    async (mode) => {
      const onChange = vi.fn();
      made = 0;
      const { container } =
        mode === 'controlled'
          ? render(<Controlled onRows={onChange} />)
          : render(<Uncontrolled onChange={onChange} />);
      press(add());
      expect(onChange).toHaveBeenLastCalledWith([...TWO, { id: 'new-1', amount: null, wait: 'three' }]);
      expect(legends(container)).toEqual(['Tier 1', 'Tier 2', 'Tier 3']);
      press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
      expect(onChange).toHaveBeenLastCalledWith([TWO[1], { id: 'new-1', amount: null, wait: 'three' }]);
      expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
      await frames();
      if (mode === 'controlled') {
        // update writes the row back by its id.
        const amount = within(row('Tier 2')).getByRole('textbox', { name: 'Up to' });
        await userEvent.type(amount, '25{Enter}');
        expect(onChange).toHaveBeenLastCalledWith([TWO[1], { id: 'new-1', amount: 2500, wait: 'three' }]);
      }
    },
  );

  it.each([['controlled'], ['uncontrolled']] as const)('keeps every update one event makes, %s', (mode) => {
    const onChange = vi.fn<(rows: Tier[]) => void>();
    const props = {
      label: 'Wait tiers',
      createRow: createTier,
      rowLabel: tierLabel,
      maxRows: 3,
      onChange,
    };
    /** A button in the first row that changes both rows' waits in one press, as "A week for all" would. */
    const draw: RepeaterProps<Tier>['children'] = (tier, { index, update }) =>
      index === 0 ? (
        <button
          type="button"
          onClick={() => {
            for (const each of THREE) update({ ...each, wait: 'day' });
          }}
        >
          A day for all
        </button>
      ) : null;
    function Held(): ReactElement {
      const [rows, setRows] = useState<Tier[]>(THREE);
      return (
        <Repeater<Tier>
          {...props}
          value={rows}
          onChange={(next) => {
            onChange(next);
            setRows(next);
          }}
        >
          {draw}
        </Repeater>
      );
    }
    render(
      mode === 'controlled' ? (
        <Held />
      ) : (
        <Repeater<Tier> {...props} defaultValue={THREE}>
          {draw}
        </Repeater>
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'A day for all' }));
    expect(onChange).toHaveBeenLastCalledWith(THREE.map((tier) => ({ ...tier, wait: 'day' })));
  });

  it('appends the row createRow makes', () => {
    const createRow = vi.fn(() => ({ id: 'made', amount: 70000, wait: 'day' }));
    const { container } = render(<Controlled createRow={createRow} />);
    press(add());
    expect(createRow).toHaveBeenCalledTimes(1);
    expect(container.querySelector('li.repeater-row:last-child')).toHaveAttribute('data-row-id', 'made');
    expect(within(row('Tier 3')).getByRole('textbox', { name: 'Up to' })).toHaveValue('700.00');
  });

  it("keeps each row's fields across a remove before it", async () => {
    const { container } = render(<Uncontrolled start={THREE} />);
    const third = within(row('Tier 3')).getByRole('textbox', { name: 'Up to' });
    await userEvent.clear(third);
    await userEvent.type(third, '1999');
    press(screen.getByRole('button', { name: 'Remove, Tier 2' }));
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
    // The row that was Tier 3 keeps its node and what was typed in it, under its new legend.
    expect(within(row('Tier 2')).getByRole('textbox', { name: 'Up to' })).toBe(third);
    expect(third).toHaveValue('1999');
  });

  it('renumbers legends by place after a remove', () => {
    const { container } = render(<Controlled start={THREE} />);
    press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
    expect(screen.getAllByRole('button', { name: /^Remove, / }).map((button) => button.textContent)).toEqual([
      'Remove',
      'Remove',
    ]);
    expect(screen.getByRole('button', { name: 'Remove, Tier 2' })).toBeInTheDocument();
  });

  it('names Remove "Remove, Tier 2" and describes Add by "2 of 3"', () => {
    const { container } = render(<Controlled />);
    const remove = screen.getByRole('button', { name: 'Remove, Tier 2' });
    // The name starts with the word it shows, for voice control.
    expect(remove).toHaveTextContent(/^Remove$/);
    expect(add()).toHaveAccessibleName('Add a tier');
    expect(add()).toHaveAccessibleDescription('2 of 3');
    expect(container.querySelector('.repeater-count')).toHaveTextContent('2 of 3');
    expect(container.querySelector('.repeater-full')).toBeNull();
  });

  it('draws no Remove at minRows and keeps the end column', () => {
    const { container } = render(<Controlled start={TWO.slice(0, 1)} minRows={1} />);
    expect(screen.queryByRole('button', { name: /^Remove/ })).toBeNull();
    const end = container.querySelector('.repeater-row-end');
    expect(end).not.toBeNull();
    // A stand-in the width of Remove keeps the column, out of sight, out of reach and out of the tree.
    const space = end?.querySelector('.repeater-remove-space');
    expect(space).toHaveAttribute('aria-hidden', 'true');
    expect(space?.tagName).toBe('SPAN');
    // Above the minimum, Remove is back on every row.
    press(add());
    expect(screen.getAllByRole('button', { name: /^Remove, / })).toHaveLength(2);
    expect(container.querySelector('.repeater-remove-space')).toBeNull();
  });

  it('draws the empty line and Add with no rows', () => {
    const { container } = render(
      <Controlled start={[]} labels={{ add: 'Add a tier', empty: 'No tiers.' }} />,
    );
    expect(container.querySelector('ol')).toBeNull();
    expect(container.querySelector('p.repeater-empty')).toHaveTextContent('No tiers.');
    expect(container.firstElementChild).toHaveAttribute('data-empty');
    expect(add()).toBeEnabled();
    expect(add()).toHaveAccessibleDescription('0 of 3');
  });

  it('disables Add at the maximum, shows the reason beside it and describes Add by it', () => {
    const { container } = render(<Controlled start={THREE} />);
    expect(add()).toBeDisabled();
    // A natively disabled button is out of the tab order.
    expect(add().matches(':disabled')).toBe(true);
    expect(container.firstElementChild).toHaveAttribute('data-full');
    const full = container.querySelector('.repeater-full');
    expect(full).toHaveTextContent('3 of 3. Remove one to add another.');
    expect(add()).toHaveAccessibleDescription('3 of 3. Remove one to add another.');
    expect(container.querySelector('.repeater-count')).toBeNull();
    // A press does nothing.
    press(add());
    expect(legends(container)).toHaveLength(3);
  });

  it('draws every row passed above maxRows', () => {
    const many = [...THREE, { id: 'd', amount: 300000, wait: 'month' }];
    const { container } = render(<Controlled start={many} />);
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2', 'Tier 3', 'Tier 4']);
    expect(add()).toBeDisabled();
    expect(add()).toHaveAccessibleDescription('3 of 3. Remove one to add another.');
  });

  /*
   * After an add focus goes to the new row's first field. After a remove it goes to the same control in the row
   * that took the removed one's place, else in the row before it, so a reader removing rows keeps their place; a
   * row with no Remove left gives its first field; with no rows, Add. Never the body.
   */
  const FOCUS_CASES: [
    after: string,
    target: string,
    says: string,
    start: Tier[],
    act: () => void,
    focused: () => HTMLElement,
    props?: TierProps,
  ][] = [
    [
      'an add under the maximum',
      "the new row's first field",
      'Tier 3 added',
      TWO,
      () => {
        press(add());
      },
      () => within(row('Tier 3')).getByRole('textbox', { name: 'Up to' }),
      { maxRows: 4 },
    ],
    [
      'an add that reaches the maximum',
      "the new row's first field",
      'Tier 3 added. 3 of 3. Remove one to add another.',
      TWO,
      () => {
        press(add());
      },
      () => within(row('Tier 3')).getByRole('textbox', { name: 'Up to' }),
    ],
    [
      'removing a row with rows after it',
      'Remove in the row now in its place',
      'Tier 2 removed',
      THREE,
      () => {
        press(screen.getByRole('button', { name: 'Remove, Tier 2' }));
      },
      () => screen.getByRole('button', { name: 'Remove, Tier 2' }),
    ],
    [
      'removing the last of several',
      'Remove in the new last row',
      'Tier 3 removed',
      THREE,
      () => {
        press(screen.getByRole('button', { name: 'Remove, Tier 3' }));
      },
      () => screen.getByRole('button', { name: 'Remove, Tier 2' }),
    ],
    [
      'removing the only row',
      'Add',
      'Tier 1 removed',
      TWO.slice(0, 1),
      () => {
        press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
      },
      add,
    ],
    [
      'a remove that reaches the minimum',
      'the first field of the row in its place, which has no Remove now',
      'Tier 1 removed',
      TWO,
      () => {
        press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
      },
      () => within(row('Tier 1')).getByRole('textbox', { name: 'Up to' }),
      { minRows: 1 },
    ],
  ];

  it.each(FOCUS_CASES)(
    'after %s, focuses %s and says "%s"',
    async (_after, _target, says, start, run, focused, props) => {
      const { container } = render(<Controlled start={start} {...props} />);
      run();
      await frames();
      expect(focused()).toHaveFocus();
      expect(document.activeElement).not.toBe(document.body);
      expect(status(container)).toHaveTextContent(says);
    },
  );

  it.each([
    ['an add', 'Add a tier'],
    ['a remove', 'Remove, Tier 2'],
  ])('says nothing and moves nothing after %s the app refuses', async (_event, name) => {
    const onChange = vi.fn();
    const { container } = render(
      <Repeater<Tier>
        label="Wait tiers"
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        labels={{ add: 'Add a tier' }}
        value={TWO}
        onChange={onChange}
      >
        {(tier) => <TierFields tier={tier} error={undefined} />}
      </Repeater>,
    );
    const button = screen.getByRole('button', { name });
    press(button);
    await frames();
    // The app's onChange decides, and kept the rows: nothing was added or removed, so nothing says so.
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
    expect(button).toHaveFocus();
    expect(status(container)).toBeEmptyDOMElement();
  });

  it('focuses a field marked data-autofocus in a new row', async () => {
    render(
      <Repeater<Tier>
        label="Wait tiers"
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        defaultValue={[]}
      >
        {() => (
          <>
            <TextField label="Note" />
            <TextField label="Amount" data-autofocus />
          </>
        )}
      </Repeater>,
    );
    press(screen.getByRole('button', { name: 'Add a row' }));
    await frames();
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveFocus();
  });

  it('removes one row for a held Enter: the repeat on the next Remove starts no press', async () => {
    const { container } = render(<Controlled start={THREE} />);
    const first = screen.getByRole('button', { name: 'Remove, Tier 1' });
    act(() => {
      first.focus();
    });
    act(() => {
      fireEvent.keyDown(first, { key: 'Enter' });
      fireEvent.keyUp(first, { key: 'Enter' });
    });
    await frames();
    const next = screen.getByRole('button', { name: 'Remove, Tier 1' });
    expect(next).toHaveFocus();
    act(() => {
      fireEvent.keyDown(next, { key: 'Enter', repeat: true });
      fireEvent.keyUp(next, { key: 'Enter' });
    });
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
  });

  it('says the reason when an add reaches the maximum', async () => {
    const { container } = render(
      <Controlled
        labels={{
          add: 'Add a tier',
          full: (max) => `${String(max)} of ${String(max)}. Remove a tier to add another.`,
        }}
      />,
    );
    press(add());
    await frames();
    expect(status(container)).toHaveTextContent('Tier 3 added. 3 of 3. Remove a tier to add another.');
    expect(add()).toHaveAccessibleDescription('3 of 3. Remove a tier to add another.');
  });

  it('says a repeated sentence again', async () => {
    const { container } = render(<Controlled start={TWO.slice(0, 1)} />);
    press(add());
    await frames();
    const first = status(container).firstElementChild;
    expect(first).toHaveTextContent('Tier 2 added');
    press(screen.getByRole('button', { name: 'Remove, Tier 2' }));
    await frames();
    press(add());
    await frames();
    // The same words again, in a new node, so a screen reader says them again.
    expect(status(container)).toHaveTextContent('Tier 2 added');
    expect(status(container).firstElementChild).not.toBe(first);
    expect(status(container).childElementCount).toBe(1);
  });

  it('empties the status a while after it spoke', () => {
    vi.useFakeTimers();
    try {
      const { container } = render(<Controlled />);
      press(add());
      expect(status(container)).toHaveTextContent('Tier 3 added');
      act(() => {
        vi.advanceTimersByTime(5000);
      });
      expect(status(container)).toBeEmptyDOMElement();
    } finally {
      vi.useRealTimers();
    }
  });

  it('moves nothing on the server render or on hydration', async () => {
    const element = <Controlled start={THREE} />;
    const html = renderToString(element);
    expect(html).toContain('class="repeater-status"');
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
    try {
      const outside = document.createElement('button');
      document.body.append(outside);
      outside.focus();
      await act(async () => {
        hydrateRoot(host, element);
        await Promise.resolve();
      });
      await frames();
      expect(outside).toHaveFocus();
      expect(status(host)).toBeEmptyDOMElement();
      outside.remove();
    } finally {
      host.remove();
    }
  });

  it('describes a row by its error and passes it to the render function', () => {
    const seen = vi.fn();
    render(
      <Repeater<Tier>
        label="Wait tiers"
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        value={TWO}
        rowErrors={{ b: 'Another tier waits from $100.00' }}
      >
        {(tier, render) => {
          seen(tier.id, render.error, render.index, render.label);
          return <TierFields tier={tier} error={render.error} />;
        }}
      </Repeater>,
    );
    const second = row('Tier 2');
    expect(second).toHaveAttribute('data-invalid');
    expect(second).toHaveAccessibleDescription('Another tier waits from $100.00');
    expect(second.querySelector('p.repeater-row-error')).toHaveTextContent('Another tier waits from $100.00');
    expect(row('Tier 1')).not.toHaveAttribute('data-invalid');
    expect(row('Tier 1')).not.toHaveAttribute('aria-describedby');
    expect(seen).toHaveBeenCalledWith('b', 'Another tier waits from $100.00', 1, 'Tier 2');
    expect(seen).toHaveBeenCalledWith('a', undefined, 0, 'Tier 1');
    // The app marks the row's field invalid from the error it is given.
    expect(within(second).getByRole('textbox', { name: 'Up to' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('describes the set by its error and hides the Changed chip while it shows', () => {
    const { container, rerender } = render(
      <Controlled description="By amount." isChanged changedLabel="Changed" />,
    );
    expect(container.querySelector('.repeater-legend .field-changed')).toHaveTextContent('Changed');
    rerender(<Controlled description="By amount." isChanged errorMessage="Tiers must go up by amount" />);
    expect(container.querySelector('.repeater-legend .field-changed')).toBeNull();
    expect(container.querySelector('p.repeater-error')).toHaveTextContent('Tiers must go up by amount');
    expect(container.firstElementChild).toHaveAccessibleDescription('By amount. Tiers must go up by amount');
  });

  it("submits the rows' fields in drawn order under repeated names, money in minor units", async () => {
    const { container } = render(
      <form>
        <Uncontrolled start={THREE} />
      </form>,
    );
    const form = container.querySelector('form');
    if (!form) throw new Error('No form');
    expect(new FormData(form).getAll('tierAmount')).toEqual(['10000', '50000', '150000']);
    expect(new FormData(form).getAll('tierWait')).toEqual(['three', 'week', 'month']);
    press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
    press(add());
    await frames();
    const amount = within(row('Tier 3')).getByRole('textbox', { name: 'Up to' });
    await userEvent.type(amount, '2000{Enter}');
    expect(new FormData(form).getAll('tierAmount')).toEqual(['50000', '150000', '200000']);
    expect(new FormData(form).getAll('tierWait')).toEqual(['week', 'month', 'three']);
  });

  it('round-trips indexed names through FormData: what is sent draws the same rows again', async () => {
    /** Rows from indexed names, as a server action reads them: tiers.0.amount, tiers.0.wait, and so on. */
    const read = (data: FormData): Tier[] => {
      const rows: Tier[] = [];
      for (const [name, value] of data) {
        const match = /^tiers\.(\d+)\.(id|amount|wait)$/.exec(name);
        if (!match) continue;
        const at = Number(match[1]);
        const tier = (rows[at] ??= { id: '', amount: null, wait: '' });
        const text = typeof value === 'string' ? value : '';
        if (match[2] === 'id') tier.id = text;
        if (match[2] === 'amount') tier.amount = text === '' ? null : Number(text);
        if (match[2] === 'wait') tier.wait = text;
      }
      return rows;
    };
    function Indexed({ start }: { start: Tier[] }): ReactElement {
      return (
        <form>
          <Repeater<Tier>
            label="Wait tiers"
            createRow={createTier}
            rowLabel={tierLabel}
            maxRows={4}
            labels={{ add: 'Add a tier' }}
            defaultValue={start}
          >
            {(tier, { index }) => (
              <>
                <input type="hidden" name={`tiers.${String(index)}.id`} value={tier.id} />
                <NumberField
                  label="Up to"
                  money={{ symbol: '$' }}
                  name={`tiers.${String(index)}.amount`}
                  defaultValue={tier.amount}
                />
                <Select label="Wait" name={`tiers.${String(index)}.wait`} defaultValue={tier.wait}>
                  {WAITS.map(([id, name]) => (
                    <PickerOption key={id} id={id}>
                      {name}
                    </PickerOption>
                  ))}
                </Select>
              </>
            )}
          </Repeater>
        </form>
      );
    }
    made = 0;
    const first = render(<Indexed start={THREE} />);
    press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
    press(add());
    await frames();
    await userEvent.type(within(row('Tier 3')).getByRole('textbox', { name: 'Up to' }), '2000{Enter}');
    const form = first.container.querySelector('form');
    if (!form) throw new Error('No form');
    const sentData = new FormData(form);
    // The indexes follow the drawn order after a remove: none is stale and none is missing.
    expect([...sentData.keys()].filter((name) => name.endsWith('.amount'))).toEqual([
      'tiers.0.amount',
      'tiers.1.amount',
      'tiers.2.amount',
    ]);
    const rows = read(sentData);
    expect(rows).toEqual([THREE[1], THREE[2], { id: 'new-1', amount: 200000, wait: 'three' }]);
    first.unmount();
    // The saved rows drawn again send the same data.
    const second = render(<Indexed start={rows} />);
    const again = second.container.querySelector('form');
    if (!again) throw new Error('No form');
    expect([...new FormData(again)]).toEqual([...sentData]);
  });

  it('hands the app typed rows through onChange for a server action', async () => {
    const action = vi.fn<(rows: Tier[]) => void>();
    function Form(): ReactElement {
      const [rows, setRows] = useState<Tier[]>(TWO);
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            action(rows);
          }}
        >
          <Repeater<Tier>
            label="Wait tiers"
            createRow={createTier}
            rowLabel={tierLabel}
            maxRows={3}
            labels={{ add: 'Add a tier' }}
            value={rows}
            onChange={setRows}
          >
            {(tier, { update }) => <TierFields tier={tier} update={update} error={undefined} />}
          </Repeater>
          <button type="submit">Save</button>
        </form>
      );
    }
    made = 0;
    render(<Form />);
    press(add());
    await frames();
    await userEvent.type(within(row('Tier 3')).getByRole('textbox', { name: 'Up to' }), '900{Enter}');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(action).toHaveBeenCalledWith([...TWO, { id: 'new-1', amount: 90000, wait: 'three' }]);
    // The drawn rows are the rows sent.
    expect(within(row('Tier 3')).getByRole('textbox', { name: 'Up to' })).toHaveValue('900.00');
  });

  it('refuses adds and removes while isDisabled', () => {
    const onRows = vi.fn();
    const { container } = render(<Controlled isDisabled onRows={onRows} />);
    expect(add()).toBeDisabled();
    for (const remove of screen.getAllByRole('button', { name: /^Remove, / })) {
      expect(remove).toBeDisabled();
      press(remove);
    }
    press(add());
    expect(onRows).not.toHaveBeenCalled();
    // The count stays: the set is not full, it is disabled.
    expect(container.querySelector('.repeater-count')).toHaveTextContent('2 of 3');
  });

  it('warns once for two rows of one id, and draws both', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const twins = TWO.map((tier) => ({ ...tier, id: 'a' }));
    const { container, rerender } = render(<Controlled start={twins} />);
    rerender(<Controlled start={twins} />);
    expect(legends(container)).toEqual(['Tier 1', 'Tier 2']);
    expect(warn.mock.calls.filter(([message]) => String(message).includes('Repeater'))).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('two rows with the id "a"'));
    // React is not asked to draw two children of one key.
    expect(error).not.toHaveBeenCalled();
  });

  it('says a twin row removed and focuses the row in its place', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const twins = TWO.map((tier) => ({ ...tier, id: 'a' }));
    const { container } = render(<Controlled start={twins} />);
    press(screen.getByRole('button', { name: 'Remove, Tier 1' }));
    await frames();
    expect(legends(container)).toEqual(['Tier 1']);
    expect(screen.getByRole('button', { name: 'Remove, Tier 1' })).toHaveFocus();
    expect(status(container)).toHaveTextContent('Tier 1 removed');
  });

  it('warns once when its status speaks inside aria-busy', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <div aria-busy="true">
        <Controlled start={[]} maxRows={5} />
      </div>,
    );
    press(add());
    await frames();
    press(add());
    await frames();
    expect(warn.mock.calls.filter(([message]) => String(message).includes('aria-busy'))).toHaveLength(1);
  });

  it('adds once and says it once under StrictMode', async () => {
    const onRows = vi.fn();
    const { container } = render(
      <StrictMode>
        <Controlled onRows={onRows} />
      </StrictMode>,
    );
    press(add());
    await frames();
    expect(onRows).toHaveBeenCalledTimes(1);
    expect(status(container).childElementCount).toBe(1);
    expect(status(container)).toHaveTextContent('Tier 3 added');
  });

  describe('with FieldExtras around it', () => {
    const DEFAULTS: Omit<Tier, 'id'>[] = [
      { amount: 10000, wait: 'three' },
      { amount: 50000, wait: 'week' },
      { amount: 150000, wait: 'month' },
    ];
    let reset = 0;
    function Tiers({ start, defaults }: { start: Tier[]; defaults: Omit<Tier, 'id'>[] }): ReactElement {
      const [rows, setRows] = useState<Tier[]>(start);
      const isDefault =
        JSON.stringify(rows.map(({ amount, wait }) => ({ amount, wait }))) === JSON.stringify(defaults);
      return (
        <FieldExtras
          scope="group"
          fieldLabel="Wait tiers"
          defaultOffer={{
            value: '$100 waits 3 days, $500 a week, $1,500 a month',
            isCurrent: isDefault,
            onTake: () => {
              reset += 1;
              setRows(defaults.map((tier, at) => ({ ...tier, id: `reset-${String(reset)}-${String(at)}` })));
            },
          }}
        >
          <Repeater<Tier>
            label="Wait tiers"
            createRow={createTier}
            rowLabel={tierLabel}
            maxRows={3}
            labels={{ add: 'Add a tier' }}
            value={rows}
            onChange={setRows}
          >
            {(tier, { update }) => <TierFields tier={tier} update={update} error={undefined} />}
          </Repeater>
        </FieldExtras>
      );
    }

    it('resets to a default set through FieldExtras and focuses the first field', async () => {
      const { container } = render(<Tiers start={TWO} defaults={DEFAULTS} />);
      press(screen.getByRole('button', { name: 'Reset to default, Wait tiers' }));
      await frames();
      expect(legends(container)).toEqual(['Tier 1', 'Tier 2', 'Tier 3']);
      expect(within(row('Tier 1')).getByRole('textbox', { name: 'Up to' })).toHaveFocus();
      expect(screen.queryByRole('button', { name: 'Reset to default, Wait tiers' })).toBeNull();
    });

    it('focuses Add after a reset to an empty default', async () => {
      render(<Tiers start={TWO} defaults={[]} />);
      press(screen.getByRole('button', { name: 'Reset to default, Wait tiers' }));
      await frames();
      expect(add()).toHaveFocus();
    });
  });

  describe('with the Changed chip and a SaveBar', () => {
    function Coach(): ReactElement {
      const [saved, setSaved] = useState<Tier[]>(TWO);
      const [rows, setRows] = useState<Tier[]>(TWO);
      const isDirty = JSON.stringify(rows) !== JSON.stringify(saved);
      return (
        <form>
          <Repeater<Tier>
            label="Wait tiers"
            createRow={createTier}
            rowLabel={tierLabel}
            maxRows={3}
            labels={{ add: 'Add a tier' }}
            value={rows}
            onChange={setRows}
            isChanged={isDirty}
          >
            {(tier, { update }) => <TierFields tier={tier} update={update} error={undefined} />}
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

    it('counts an add and a remove as edits: dirty after them, clean after Save, the rows back after Cancel', async () => {
      const { container } = render(<Coach />);
      const chip = (): Element | null => container.querySelector('.repeater-legend .field-changed');
      expect(chip()).toBeNull();
      press(screen.getByRole('button', { name: 'Remove, Tier 2' }));
      await frames();
      expect(chip()).toHaveTextContent('Changed');
      expect(screen.getByRole('group', { name: 'Unsaved tiers' })).toBeInTheDocument();
      // Save makes it clean.
      press(screen.getByRole('button', { name: 'Save' }));
      await frames();
      expect(chip()).toBeNull();
      expect(legends(container)).toEqual(['Tier 1']);
      // An add, then Cancel and Discard, brings the saved row back alone.
      press(add());
      await frames();
      expect(chip()).not.toBeNull();
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      await userEvent.click(await screen.findByRole('button', { name: 'Discard changes' }));
      expect(legends(container)).toEqual(['Tier 1']);
      expect(chip()).toBeNull();
    });
  });

  const AXE_CASES: [string, ReactElement][] = [
    ['with three rows', <Controlled key="three" start={THREE} maxRows={4} description="By amount." />],
    ['with one row at minRows 1', <Controlled key="one" start={TWO.slice(0, 1)} minRows={1} />],
    ['empty', <Controlled key="empty" start={[]} />],
    ['at the maximum', <Controlled key="full" start={THREE} />],
    [
      'with a row error',
      <Repeater<Tier>
        key="row-error"
        label="Wait tiers"
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        value={TWO}
        rowErrors={{ b: 'Another tier waits from $100.00' }}
      >
        {(tier, { error }) => <TierFields tier={tier} error={error} />}
      </Repeater>,
    ],
    ['with a set error', <Controlled key="set-error" errorMessage="Tiers must go up by amount" isChanged />],
    ['disabled', <Controlled key="disabled" isDisabled />],
    [
      'named by aria-label',
      <Repeater<Tier>
        key="aria"
        aria-label="Wait tiers"
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        defaultValue={TWO}
      >
        {(tier, { error }) => <TierFields tier={tier} error={error} />}
      </Repeater>,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations after an add, with its status said', async () => {
    const { container } = render(<Controlled />);
    press(add());
    await frames();
    expect(status(container)).toHaveTextContent('Tier 3 added');
    await expectNoA11yViolations(container);
  });

  it('requires maxRows, createRow, an id on each row and rowErrors by string key, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    const noMax = (
      // @ts-expect-error a repeater is a short list: maxRows is required
      <Repeater<Tier> label="Tiers" createRow={createTier} rowLabel={tierLabel} defaultValue={TWO}>
        {() => null}
      </Repeater>
    );
    const noCreate = (
      // @ts-expect-error Add needs a row to append
      <Repeater<Tier> label="Tiers" rowLabel={tierLabel} maxRows={3} defaultValue={TWO}>
        {() => null}
      </Repeater>
    );
    const noId = (
      // @ts-expect-error a row is known by its id
      <Repeater<{ amount: number }>
        label="Tiers"
        createRow={() => ({ amount: 1 })}
        rowLabel={tierLabel}
        maxRows={3}
      >
        {() => null}
      </Repeater>
    );
    const numberKeys = (
      <Repeater<Tier>
        label="Tiers"
        createRow={createTier}
        rowLabel={tierLabel}
        maxRows={3}
        // @ts-expect-error rowErrors is keyed by the row's id as a string
        rowErrors={new Map([[1, 'x']])}
      >
        {() => null}
      </Repeater>
    );
    const unnamed = (
      // @ts-expect-error a set needs a name: its label, an aria-label or aria-labelledby
      <Repeater<Tier> createRow={createTier} rowLabel={tierLabel} maxRows={3}>
        {() => null}
      </Repeater>
    );
    expect([noMax, noCreate, noId, numberKeys, unnamed].every(Boolean)).toBe(true);
  });
});
