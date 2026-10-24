/*
 * The spike risk R2 asked for, kept as the record of what TagInput relies on. It drives React Aria's own TextField
 * holding a TagGroup beside its Input, and no library wrapper: if one of these stops holding after an upgrade, the
 * wrapper's behavior has moved with it.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useId, useState, type ReactElement } from 'react';
import {
  Button,
  FieldError,
  Input,
  Label,
  Tag,
  TagGroup,
  TagList,
  Text,
  TextField,
} from 'react-aria-components';
import { describe, expect, it, vi } from 'vitest';
import { formOf } from '../../test/dom';

interface FieldProps {
  initial?: string[];
  isInvalid?: boolean;
}

/** React Aria's parts alone: a label, the tags in a group named "Added" and the label, the box, a hint, an error. */
function Field({ initial = ['ana@example.com', 'bo@example.com'], isInvalid }: FieldProps): ReactElement {
  const [values, setValues] = useState(initial);
  const [text, setText] = useState('');
  const tagsId = useId();
  const labelId = useId();
  return (
    <TextField value={text} onChange={setText} isInvalid={isInvalid} aria-describedby={tagsId}>
      <Label id={labelId}>Invite people</Label>
      {values.length === 0 ? null : (
        <TagGroup
          id={tagsId}
          aria-label="Added"
          aria-labelledby={labelId}
          onRemove={(keys) => {
            setValues(values.filter((value) => !keys.has(value)));
          }}
        >
          <TagList items={values.map((value) => ({ id: value }))}>
            {(item) => (
              <Tag id={item.id} textValue={item.id}>
                {item.id}
                <Button slot="remove" aria-label="Remove" excludeFromTabOrder>
                  x
                </Button>
              </Tag>
            )}
          </TagList>
        </TagGroup>
      )}
      <Input />
      <Text slot="description">Separate addresses with commas.</Text>
      <FieldError>Enter email addresses in the correct format</FieldError>
    </TextField>
  );
}

const box = (): HTMLInputElement => screen.getByRole('textbox');

describe("React Aria's TextField holding a TagGroup (risk R2)", () => {
  it('labels the box, not the tag group, with the field label', () => {
    render(<Field />);
    const label = screen.getByText('Invite people');
    expect(label).toHaveAttribute('for', box().id);
    expect(box()).toHaveAccessibleName('Invite people');
    // The grid is named by its own words and the label, never by the label's for.
    expect(screen.getByRole('grid').id).not.toBe(label.getAttribute('for'));
  });

  it('names the tag group with labels.added and the field label', () => {
    render(<Field />);
    expect(screen.getByRole('grid')).toHaveAccessibleName('Added Invite people');
  });

  // React Aria's field writes its hint, then its error line, then the ids the field was given (useField), so the
  // tags come last: the order is hint, error, tags (spec correction 19).
  it('describes the box by the hint, the tags and the error line, in that order', () => {
    render(<Field isInvalid />);
    const ids = box().getAttribute('aria-describedby')?.split(' ') ?? [];
    const hint = screen.getByText('Separate addresses with commas.');
    const error = screen.getByText('Enter email addresses in the correct format');
    const tags = screen.getByRole('grid').closest('[id]:not([role])') ?? screen.getByRole('grid');
    expect(ids).toEqual([hint.id, error.id, tags.id]);
    expect(box()).toHaveAccessibleDescription(
      expect.stringMatching(/^Separate addresses with commas\. Enter email .*ana@example\.com/),
    );
  });

  it('moves focus from the last tag to the box with Tab and back with Shift+Tab, the tags one stop', async () => {
    const user = userEvent.setup();
    render(<Field />);
    await user.tab();
    expect(screen.getByRole('row', { name: 'ana@example.com' })).toHaveFocus();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('row', { name: 'bo@example.com' })).toHaveFocus();
    await user.tab();
    expect(box()).toHaveFocus();
    await user.tab({ shift: true });
    // Back to the tag that last held focus, one stop for the whole group.
    expect(screen.getByRole('row', { name: 'bo@example.com' })).toHaveFocus();
  });

  it('writes no name on the box and keeps required off it while there are values', () => {
    const { container } = render(
      <form>
        <Field />
      </form>,
    );
    expect(box()).not.toHaveAttribute('name');
    expect(box()).not.toBeRequired();
    expect([...new FormData(formOf(container)).keys()]).toEqual([]);
  });

  it('lets Enter in an empty box submit its form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    const { container } = render(
      <form>
        <Field />
        <button type="submit">Send</button>
      </form>,
    );
    formOf(container).addEventListener('submit', onSubmit);
    await user.click(box());
    await user.keyboard('{Enter}');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
