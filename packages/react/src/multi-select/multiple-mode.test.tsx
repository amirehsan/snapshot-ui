/*
 * The spike risk R2 asked for, kept as the record of what MultiSelect relies on. It drives React Aria's own
 * ComboBox in multiple mode, with ComboBoxValue drawing a TagGroup, and no library wrapper: if one of these
 * stops holding after an upgrade, the wrapper's behavior has moved with it.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import {
  Button,
  ComboBox,
  ComboBoxValue,
  Input,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  Tag,
  TagGroup,
  TagList,
  type Key,
} from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { formOf } from '../../test/dom';

interface FieldProps {
  name?: string;
  defaultValue?: Key[];
  onChange?: (value: Key[]) => void;
}

/** React Aria's parts alone: the chosen values as removable tags, then the input, the button and the list. */
function Field({ name, defaultValue, onChange }: FieldProps): ReactElement {
  return (
    <ComboBox<object, 'multiple'>
      selectionMode="multiple"
      allowsEmptyCollection
      name={name}
      defaultValue={defaultValue}
      onChange={onChange}
    >
      <Label>Categories</Label>
      <ComboBoxValue>
        {({ state }) => (
          <TagGroup
            aria-label="Selected"
            onRemove={(keys) => {
              state.setValue((state.value as readonly Key[]).filter((key) => !keys.has(key)));
            }}
          >
            <TagList items={state.selectedItems.map((node) => ({ id: node.key, text: node.textValue }))}>
              {(tag) => (
                <Tag id={tag.id} textValue={tag.text}>
                  {tag.text}
                  <Button slot="remove">x</Button>
                </Tag>
              )}
            </TagList>
          </TagGroup>
        )}
      </ComboBoxValue>
      <Input />
      <Button>Show</Button>
      <Popover>
        <ListBox>
          <ListBoxItem id="food">Food</ListBoxItem>
          <ListBoxItem id="rent">Rent</ListBoxItem>
          <ListBoxItem id="fun">Fun</ListBoxItem>
        </ListBox>
      </Popover>
    </ComboBox>
  );
}

const input = (): HTMLInputElement => screen.getByRole('combobox');
const tag = (text: string): HTMLElement => screen.getByRole('row', { name: text });

describe("React Aria's ComboBox in multiple mode (risk R2)", () => {
  it('submits one value per chosen key under the name, and an empty one with nothing chosen', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Field name="categories" defaultValue={['food', 'rent']} />
      </form>,
    );
    const form = formOf(container);
    expect(new FormData(form).getAll('categories')).toEqual(['food', 'rent']);
    await user.click(screen.getByRole('button', { name: 'Remove Food' }));
    await user.click(screen.getByRole('button', { name: 'Remove Rent' }));
    expect(new FormData(form).getAll('categories')).toEqual(['']);
  });

  it('keeps the list open after a choice and empties the input', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Field onChange={onChange} />);
    await user.type(input(), 'fo');
    await user.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenLastCalledWith(['food']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(input()).toHaveValue('');
    // A press toggles the next one on, and the list still stays.
    await user.click(screen.getByRole('option', { name: 'Rent' }));
    expect(onChange).toHaveBeenLastCalledWith(['food', 'rent']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('moves focus to the next tag after a removal, and to the previous one after the last', async () => {
    const user = userEvent.setup();
    render(<Field defaultValue={['food', 'rent', 'fun']} />);
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(tag('Rent')).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(tag('Fun')).toHaveFocus();
    await user.keyboard('{Delete}');
    expect(tag('Rent')).toHaveFocus();
  });

  it('focuses the grid when the last tag goes', async () => {
    const user = userEvent.setup();
    render(<Field defaultValue={['food']} />);
    const grid = screen.getByRole('grid', { name: 'Selected' });
    await user.tab();
    expect(tag('Food')).toHaveFocus();
    await user.keyboard('{Backspace}');
    expect(screen.queryByRole('row')).toBeNull();
    // The empty list is a group now, and it holds focus: not the input, which the wrapper moves it on to.
    expect(grid).toHaveAttribute('role', 'group');
    expect(grid).toHaveFocus();
    expect(input()).not.toHaveFocus();
  });

  it('does not handle Backspace in the input itself', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Field defaultValue={['food', 'rent']} onChange={onChange} />);
    await user.click(input());
    await user.keyboard('{Backspace}');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(input()).toHaveFocus();
  });
});
