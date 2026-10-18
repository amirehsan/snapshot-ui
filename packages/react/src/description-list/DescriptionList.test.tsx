import { render } from '@testing-library/react';
import { createRef, type ReactElement, type ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { DescriptionList, DescriptionListItem } from './DescriptionList';

/** The tag and class of each child of an element, in order. */
const parts = (element: Element): string[] =>
  [...element.children].map((child) => `${child.tagName.toLowerCase()}.${child.className}`);

/** The value `dd` of the first row in a render. */
const valueOf = (container: HTMLElement): Element => {
  const value = container.querySelector('.description-list-value');
  if (!value) throw new Error('No value');
  return value;
};

/** One row in a list, as an app writes it. */
const one = (item: ReactElement): ReactElement => <DescriptionList>{item}</DescriptionList>;

describe('DescriptionList', () => {
  it('draws a dl of div rows, each a dt, a value dd and, with actions, an actions dd', () => {
    const { container } = render(
      <DescriptionList>
        <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
        <DescriptionListItem term="Nickname" actions={<button type="button">Edit</button>}>
          Travel card
        </DescriptionListItem>
      </DescriptionList>,
    );
    const list = root(container);
    expect(list.tagName).toBe('DL');
    expect(list).toHaveClass('description-list');
    expect(parts(list)).toEqual(['div.description-list-item', 'div.description-list-item']);
    const [plain, withActions] = [...list.children];
    if (!plain || !withActions) throw new Error('No rows');
    expect(parts(plain)).toEqual(['dt.description-list-term', 'dd.description-list-value']);
    expect(parts(withActions)).toEqual([
      'dt.description-list-term',
      'dd.description-list-value',
      'dd.description-list-actions',
    ]);
    expect(plain.querySelector('dt')).toHaveTextContent('Name');
    expect(plain.querySelector('dd')).toHaveTextContent('Everyday Visa');
    expect(withActions.querySelector('.description-list-actions > button')).toHaveTextContent('Edit');
  });

  it('writes data-layout, auto by default, and data-dividers unless hasDividers is false', () => {
    const item = <DescriptionListItem term="Type">Credit card</DescriptionListItem>;
    const { container, rerender } = render(<DescriptionList>{item}</DescriptionList>);
    const list = root(container);
    expect(list).toHaveAttribute('data-layout', 'auto');
    expect(list).toHaveAttribute('data-dividers', '');
    for (const layout of ['horizontal', 'stacked', 'auto'] as const) {
      rerender(<DescriptionList layout={layout}>{item}</DescriptionList>);
      expect(list).toHaveAttribute('data-layout', layout);
    }
    rerender(<DescriptionList hasDividers={false}>{item}</DescriptionList>);
    expect(list).not.toHaveAttribute('data-dividers');
  });

  it.each([[undefined], [null], [false], [true], ['']])(
    'shows Not set for an empty value %s, marked data-empty',
    (empty) => {
      const { container } = render(one(<DescriptionListItem term="Nickname">{empty}</DescriptionListItem>));
      const value = valueOf(container);
      expect(value).toHaveAttribute('data-empty', '');
      expect(value).toHaveTextContent(/^Not set$/);
    },
  );

  it.each([[0], ['0']])('keeps %s as a value', (zero) => {
    const { container } = render(one(<DescriptionListItem term="Balance">{zero}</DescriptionListItem>));
    const value = valueOf(container);
    expect(value).not.toHaveAttribute('data-empty');
    expect(value).toHaveTextContent(/^0$/);
  });

  it('shows emptyValue in place of an empty value, a link included', () => {
    const { container, rerender } = render(
      one(<DescriptionListItem term="Nickname" emptyValue="Sin definir" />),
    );
    expect(valueOf(container)).toHaveTextContent(/^Sin definir$/);
    rerender(one(<DescriptionListItem term="Notes" emptyValue={<a href="#notes">Add a note</a>} />));
    const value = valueOf(container);
    expect(value).toHaveAttribute('data-empty', '');
    expect(value.querySelector('a')).toHaveAttribute('href', '#notes');
    expect(value).toHaveTextContent(/^Add a note$/);
    // A value that is there is shown, and emptyValue is not.
    rerender(
      one(
        <DescriptionListItem term="Notes" emptyValue={<a href="#notes">Add a note</a>}>
          Paid by direct debit
        </DescriptionListItem>,
      ),
    );
    expect(valueOf(container)).toHaveTextContent(/^Paid by direct debit$/);
    expect(valueOf(container)).not.toHaveAttribute('data-empty');
  });

  it('marks a numeric value with data-numeric, and drops it while the value is empty', () => {
    const { container, rerender } = render(
      one(<DescriptionListItem term="Credit limit">$5,000.00</DescriptionListItem>),
    );
    expect(valueOf(container)).not.toHaveAttribute('data-numeric');
    rerender(
      one(
        <DescriptionListItem term="Credit limit" isNumeric>
          $5,000.00
        </DescriptionListItem>,
      ),
    );
    expect(valueOf(container)).toHaveAttribute('data-numeric', '');
    rerender(one(<DescriptionListItem term="Credit limit" isNumeric />));
    expect(valueOf(container)).not.toHaveAttribute('data-numeric');
    expect(valueOf(container)).toHaveAttribute('data-empty', '');
    // Zero is a figure.
    rerender(
      one(
        <DescriptionListItem term="Balance" isNumeric>
          {0}
        </DescriptionListItem>,
      ),
    );
    expect(valueOf(container)).toHaveAttribute('data-numeric', '');
  });

  it('draws no actions dd without actions, and none for an empty actions node', () => {
    for (const actions of [undefined, null, false, true, ''] as ReactNode[]) {
      const { container, unmount } = render(
        one(
          <DescriptionListItem term="Type" actions={actions}>
            Credit card
          </DescriptionListItem>,
        ),
      );
      expect(container.querySelector('.description-list-actions')).toBeNull();
      expect(container.querySelectorAll('dd')).toHaveLength(1);
      unmount();
    }
  });

  it('writes no ARIA role on the list, its rows or its parts', () => {
    const { container } = render(
      <DescriptionList layout="horizontal">
        <DescriptionListItem term="Nickname" actions={<span>Edit</span>} isNumeric>
          4821
        </DescriptionListItem>
        <DescriptionListItem term="Notes" />
      </DescriptionList>,
    );
    expect(container.querySelectorAll('[role]')).toHaveLength(0);
    // No id either: the parts use no hook.
    expect(container.querySelectorAll('[id]')).toHaveLength(0);
  });

  it('passes className, ref and the rest props to the list and to each row', () => {
    const listRef = createRef<HTMLDListElement>();
    const itemRef = createRef<HTMLDivElement>();
    const { container } = render(
      <DescriptionList ref={listRef} className="details" id="details" data-testid="list" aria-label="Details">
        <DescriptionListItem ref={itemRef} term="Type" className="row" id="type" data-testid="row">
          Credit card
        </DescriptionListItem>
      </DescriptionList>,
    );
    const list = root(container);
    expect(listRef.current).toBe(list);
    expect(list).toHaveAttribute('class', 'description-list details');
    expect(list).toHaveAttribute('id', 'details');
    expect(list).toHaveAttribute('data-testid', 'list');
    expect(list).toHaveAttribute('aria-label', 'Details');
    const row = list.firstElementChild;
    expect(itemRef.current).toBe(row);
    expect(row).toHaveAttribute('class', 'description-list-item row');
    expect(row).toHaveAttribute('id', 'type');
    expect(row).toHaveAttribute('data-testid', 'row');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('DescriptionList');
    expect(library).toHaveProperty('DescriptionListItem');
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    [
      'three rows',
      <DescriptionList key="rows">
        <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
        <DescriptionListItem term="Type">Credit card</DescriptionListItem>
        <DescriptionListItem term="Institution">Northwind Bank</DescriptionListItem>
      </DescriptionList>,
    ],
    [
      'a row with actions',
      <DescriptionList key="actions">
        <DescriptionListItem
          term="Nickname"
          actions={
            <button type="button" aria-label="Edit Nickname">
              Edit
            </button>
          }
        >
          Travel card
        </DescriptionListItem>
      </DescriptionList>,
    ],
    [
      'an empty value',
      <DescriptionList key="empty">
        <DescriptionListItem term="Nickname" />
        <DescriptionListItem term="Notes" emptyValue={<a href="#notes">Add a note</a>} />
      </DescriptionList>,
    ],
    [
      'a numeric value',
      <DescriptionList key="numeric" layout="horizontal">
        <DescriptionListItem term="Credit limit" isNumeric>
          $5,000.00
        </DescriptionListItem>
      </DescriptionList>,
    ],
    [
      'no dividers',
      <DescriptionList key="dividers" hasDividers={false} layout="stacked">
        <DescriptionListItem term="APR" isNumeric>
          24.9%
        </DescriptionListItem>
      </DescriptionList>,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations with %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('requires a term and takes isNumeric as a boolean, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a row names its value with a term
    const nameless = <DescriptionListItem>Everyday Visa</DescriptionListItem>;
    // @ts-expect-error isNumeric is a boolean, not a word
    const worded = <DescriptionListItem term="Credit limit" isNumeric="yes" />;
    expect(nameless).toBeTruthy();
    expect(worded).toBeTruthy();
  });
});
