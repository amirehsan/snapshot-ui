import { render, screen, within } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { ListBox, type Selection } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Select } from '../select';
import { PickerOption } from './PickerOption';
import { PickerSection } from './PickerSection';

/** Option rows are named by their label and described by their hint, so axe's label-in-name check is off. */
const ROW_A11Y = { rules: { 'label-content-name-mismatch': { enabled: false } } };

function Icon(): ReactElement {
  return <svg data-testid="icon" />;
}

function element(selector: string, scope: ParentNode = document): HTMLElement {
  const found = scope.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`Nothing matches ${selector}`);
  return found;
}

describe('PickerOption', () => {
  it('is an option named by its label, with the label as its text value', () => {
    render(
      <ListBox aria-label="Category" selectionMode="single">
        <PickerOption id="food">Groceries</PickerOption>
      </ListBox>,
    );
    const option = screen.getByRole('option', { name: 'Groceries' });
    expect(option).toHaveClass('menu-item', 'picker-option');
    expect(element('.menu-item-label', option)).toHaveTextContent('Groceries');
    expect(element('.menu-item-label', option).parentElement).toHaveClass('menu-item-text');
  });

  it('is described by its end value and then its hint', () => {
    render(
      <ListBox aria-label="Category" selectionMode="single">
        <PickerOption id="food" description="Groceries and markets" end="$1,204.50">
          Food
        </PickerOption>
      </ListBox>,
    );
    const option = screen.getByRole('option', { name: 'Food' });
    const end = element('.menu-item-end', option);
    expect(end.id).not.toBe('');
    expect(option.getAttribute('aria-describedby')?.split(' ')[0]).toBe(end.id);
    expect(option).toHaveAccessibleDescription('$1,204.50 Groceries and markets');
  });

  it('hides its icon and its check from assistive technology', () => {
    render(
      <ListBox aria-label="Category" selectionMode="single">
        <PickerOption id="food" icon={<Icon />}>
          Food
        </PickerOption>
      </ListBox>,
    );
    const option = screen.getByRole('option', { name: 'Food' });
    expect(element('.menu-item-icon', option)).toHaveAttribute('aria-hidden', 'true');
    expect(element('.menu-item-check', option)).toHaveAttribute('aria-hidden', 'true');
    expect(element('.menu-item-check svg', option)).not.toBeNull();
  });

  it('keeps the check room in every row of a single and of a multiple list, and none in a list that does not select', () => {
    for (const selectionMode of ['single', 'multiple'] as const) {
      const selected: Selection = new Set(['food']);
      const { unmount } = render(
        <ListBox aria-label="Category" selectionMode={selectionMode} defaultSelectedKeys={selected}>
          <PickerOption id="food">Food</PickerOption>
          <PickerOption id="rent">Rent</PickerOption>
        </ListBox>,
      );
      for (const option of screen.getAllByRole('option')) {
        expect(option.querySelector('.menu-item-check'), selectionMode).not.toBeNull();
      }
      unmount();
    }
    render(
      <ListBox aria-label="Category">
        <PickerOption id="food">Food</PickerOption>
      </ListBox>,
    );
    expect(document.querySelector('.menu-item-check')).toBeNull();
  });

  it('draws nothing for an icon, a hint or an end value of false, null or an empty string', () => {
    render(
      <ListBox aria-label="Category" selectionMode="single">
        <PickerOption id="a" icon={false} description="" end={null}>
          A
        </PickerOption>
        <PickerOption id="b" icon="" description={null} end={false}>
          B
        </PickerOption>
      </ListBox>,
    );
    for (const option of screen.getAllByRole('option')) {
      expect([...option.children].map((child) => child.className)).toEqual([
        'menu-item-text',
        'menu-item-check',
      ]);
      expect(element('.menu-item-text', option).children).toHaveLength(1);
    }
  });

  it('passes className, ref and data attributes to the row', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ListBox aria-label="Category" selectionMode="single" defaultSelectedKeys={['food']}>
        <PickerOption
          id="food"
          ref={ref}
          data-testid="food"
          className={({ isSelected }) => (isSelected ? 'mine is-chosen' : 'mine')}
        >
          Food
        </PickerOption>
      </ListBox>,
    );
    const option = screen.getByRole('option', { name: 'Food' });
    expect(option.className.startsWith('menu-item picker-option')).toBe(true);
    expect(option).toHaveClass('mine', 'is-chosen');
    expect(ref.current).toBe(option);
    expect(option).toHaveAttribute('data-testid', 'food');
  });

  it('draws its icon and label alone in a Select trigger, and writes each id once with the list open', () => {
    render(
      <Select label="Category" defaultValue="food" defaultOpen>
        <PickerOption id="food" icon={<Icon />} description="Groceries and markets" end="$1,204.50">
          Food
        </PickerOption>
        <PickerOption id="rent" end="$2,100.00">
          Rent
        </PickerOption>
      </Select>,
    );
    const value = element('.select-value');
    expect([...value.children].map((child) => child.className)).toEqual([
      'menu-item-icon',
      'select-value-label',
    ]);
    expect(element('.menu-item-icon', value)).toHaveAttribute('aria-hidden', 'true');
    expect(element('.select-value-label', value)).toHaveTextContent('Food');
    expect(value.querySelector('[id]')).toBeNull();
    // The list is open, so the chosen row is drawn twice: in the trigger and in the list.
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    const ids = [...document.querySelectorAll('[id]')].map((node) => node.id);
    expect(ids.filter((id, index) => ids.indexOf(id) !== index)).toEqual([]);
    const food = screen.getByRole('option', { name: 'Food' });
    expect(food).toHaveAccessibleDescription('$1,204.50 Groceries and markets');
  });

  it('has no axe violations in a list with a hint, an end value, a section and a disabled option', async () => {
    const { container } = render(
      <ListBox
        aria-label="Category"
        selectionMode="single"
        defaultSelectedKeys={['food']}
        disabledKeys={['gifts']}
      >
        <PickerSection title="Spending">
          <PickerOption id="food" icon={<Icon />} description="Groceries and markets" end="$1,204.50">
            Food
          </PickerOption>
          <PickerOption id="rent">Rent</PickerOption>
        </PickerSection>
        <PickerSection title="Income">
          <PickerOption id="salary">Salary</PickerOption>
          <PickerOption id="gifts">Gifts</PickerOption>
        </PickerSection>
      </ListBox>,
    );
    expect(screen.getByRole('option', { name: 'Gifts' })).toHaveAttribute('aria-disabled', 'true');
    await expectNoA11yViolations(container, ROW_A11Y);
  });

  it('omits every link prop in its types, since an option that navigates is a menu item', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error an option never navigates
    const withHref = <PickerOption href="/food">Food</PickerOption>;
    // @ts-expect-error nor opens a link in another window
    const withTarget = <PickerOption target="_blank">Food</PickerOption>;
    const plain = <PickerOption id="food">Food</PickerOption>;
    expect([withHref, withTarget, plain]).toHaveLength(3);
  });
});

describe('PickerSection', () => {
  it('groups options under an overline heading that names the group', () => {
    const ref = createRef<HTMLElement>();
    render(
      <ListBox aria-label="Category" selectionMode="single">
        <PickerSection title="Spending" ref={ref} className="mine">
          <PickerOption id="food">Food</PickerOption>
        </PickerSection>
        <PickerSection>
          <PickerOption id="salary">Salary</PickerOption>
        </PickerSection>
      </ListBox>,
    );
    const group = screen.getByRole('group', { name: 'Spending' });
    expect(group).toHaveClass('menu-section', 'mine');
    expect(ref.current).toBe(group);
    expect(element('.menu-heading', group)).toHaveTextContent('Spending');
    expect(within(group).getByRole('option', { name: 'Food' })).toBeInTheDocument();
    // A section with no title draws no heading.
    expect(document.querySelectorAll('.menu-heading')).toHaveLength(1);
  });
});
