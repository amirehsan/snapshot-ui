import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { FilterChip } from '../filter-chip';
import { PickerOption } from '../picker';
import { censusOf, rowOrder } from './walk';

const noop = (): void => undefined;

const OPTIONS = [
  <PickerOption key="food" id="food">
    Food
  </PickerOption>,
  <PickerOption key="rent" id="rent">
    Rent
  </PickerOption>,
];

/** A single list chip with `value`. */
const single = (label: string, value: string | null, isSecondary?: boolean): ReactElement => (
  <FilterChip label={label} selectionMode="single" value={value} onChange={noop} isSecondary={isSecondary}>
    {OPTIONS}
  </FilterChip>
);

/** A multiple list chip with `value`. */
const multiple = (label: string, value: string[], isSecondary?: boolean): ReactElement => (
  <FilterChip label={label} selectionMode="multiple" value={value} onChange={noop} isSecondary={isSecondary}>
    {OPTIONS}
  </FilterChip>
);

/** A custom chip, active while it has a `valueLabel`. */
const custom = (label: string, valueLabel?: string, isSecondary?: boolean): ReactElement => (
  <FilterChip label={label} valueLabel={valueLabel} onClear={noop} isSecondary={isSecondary}>
    <p>Content</p>
  </FilterChip>
);

/** The label of each chip element in `nodes`, or the element's type name for anything else. */
const labelsOf = (nodes: ReactNode[]): string[] =>
  nodes.map((node) => {
    if (!isValidElement<{ label?: string; children?: ReactNode }>(node)) return typeof node;
    const inner = node.props.children;
    if (isValidElement<{ label?: string }>(inner)) return inner.props.label ?? 'other';
    return node.props.label ?? 'other';
  });

describe('censusOf', () => {
  it('counts active list and custom chips through fragments, and nothing else', () => {
    const census = censusOf(
      <>
        {single('Category', 'food')}
        <>
          {multiple('Tags', ['rent'])}
          {multiple('Accounts', [])}
          <>{custom('Amount', 'Over $100')}</>
        </>
        {custom('Date')}
        {custom('Note', '')}
        {single('Payee', null)}
        <p>Not a chip</p>
        text
      </>,
    );
    expect(census.active).toBe(3);
  });

  it('lists inactive secondary chips by label, and never an active one', () => {
    const census = censusOf([
      single('Category', null),
      single('Account', null, true),
      multiple('Tags', ['rent'], true),
      <>{custom('Date', undefined, true)}</>,
      custom('Amount', 'Over $100', true),
    ]);
    expect(census).toEqual({ active: 2, inactiveSecondary: ['Account', 'Date'] });
  });

  it('skips a false slot, as {isAdmin && <FilterChip />} renders', () => {
    const isAdmin = false as boolean;
    const census = censusOf(
      <>
        {isAdmin && single('Owner', 'food')}
        {null}
        {undefined}
        {multiple('Tags', [], true)}
      </>,
    );
    expect(census).toEqual({ active: 0, inactiveSecondary: ['Tags'] });
  });

  it('reads no chip wrapped in another component', () => {
    function Wrapped(): ReactElement {
      return multiple('Tags', ['rent'], true);
    }
    function WrappedInactive(): ReactElement {
      return multiple('Labels', [], true);
    }
    expect(censusOf([<Wrapped key="a" />, <WrappedInactive key="b" />])).toEqual({
      active: 0,
      inactiveSecondary: [],
    });
  });
});

describe('rowOrder', () => {
  it('keeps the declared order, moving each secondary chip it can read after the rest, through fragments', () => {
    function Wrapped(): ReactElement {
      return single('Payee', null, true);
    }
    const order = rowOrder(
      <>
        {single('Category', null)}
        {multiple('Tags', ['rent'], true)}
        <>
          {custom('Amount', 'Over $100')}
          {custom('Date', undefined, true)}
        </>
        <Wrapped />
        {false}
        {single('Account', 'food')}
      </>,
    );
    expect(labelsOf(order)).toEqual(['Category', 'Amount', 'other', 'Account', 'Tags', 'Date']);
  });

  it('gives each node a key of its own, so a chip that moves keeps its state', () => {
    const order = rowOrder(
      <>
        {single('Category', null)}
        <>{single('Account', null)}</>
        <>{single('Payee', null)}</>
      </>,
    );
    const keys = order.map((node) => (isValidElement(node) ? node.key : null));
    expect(new Set(keys).size).toBe(3);
    for (const key of keys) expect(key).not.toBeNull();
  });
});
