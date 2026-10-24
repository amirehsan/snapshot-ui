import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { formOf } from './dom';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { ConditionalFields } from '../src/conditional-fields';
import { DateRangePicker } from '../src/date-range-picker';
import { MultiSelect } from '../src/multi-select';
import { NumberField } from '../src/number-field';
import { PickerOption } from '../src/picker';
import { PositionPad } from '../src/position-pad';
import { Radio, RadioGroup } from '../src/radio-group';
import { Repeater } from '../src/repeater';
import { SearchField } from '../src/search-field';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Select } from '../src/select';
import { Switch } from '../src/switch';
import { TagInput, emailPreset } from '../src/tag-input';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';

/**
 * A plain <form> is reset by the browser, with no help from the app: every
 * field must come back to its default value, and what the field draws from its
 * value (the count, the Changed chip) must follow. The chip is the app's to
 * show, as it knows the saved value, so each harness below does what an app
 * does: it compares the value it is told about with the saved one.
 *
 * These checks sit together because the same event reaches nine different
 * pieces of React Aria, each with its own way of listening for it.
 */

const CHANGED = 'Changed';

/** The submitted value of a name, as the browser would send it. */
const sent = (container: HTMLElement, name: string): FormDataEntryValue[] =>
  new FormData(formOf(container)).getAll(name);

/**
 * Whether the field shows its Changed chip. The chip is always in the markup and the stylesheet draws it
 * while the field's root has `data-changed`, which is therefore what a test can see; the chip is read
 * with the control while the root has it.
 */
const showsChip = (container: HTMLElement): boolean => container.querySelector('[data-changed]') !== null;

function ResetButton(): ReactElement {
  return <button type="reset">Reset</button>;
}

function TextFieldForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <TextField
        label="Workspace name"
        name="workspace"
        defaultValue="Northwind"
        budget={12}
        isChanged={changed}
        onChange={(value) => {
          setChanged(value !== 'Northwind');
        }}
      />
      <ResetButton />
    </form>
  );
}

function TextAreaForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <TextArea
        label="Welcome message"
        name="welcome"
        defaultValue="Hello there"
        budget={14}
        isChanged={changed}
        onChange={(value) => {
          setChanged(value !== 'Hello there');
        }}
      />
      <ResetButton />
    </form>
  );
}

function CheckboxForm(): ReactElement {
  return (
    <form>
      <Checkbox name="terms" defaultSelected>
        I accept the terms
      </Checkbox>
      <Checkbox name="news">Send me the newsletter</Checkbox>
      <ResetButton />
    </form>
  );
}

function CheckboxGroupForm({ defaults }: { defaults: string[] }): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <CheckboxGroup
        label="Notify me by"
        name="channels"
        defaultValue={defaults}
        isChanged={changed}
        onChange={(value) => {
          setChanged(value.join() !== defaults.join());
        }}
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
        <Checkbox value="push">Push</Checkbox>
      </CheckboxGroup>
      <ResetButton />
    </form>
  );
}

function RadioGroupForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <RadioGroup
        label="Newsletter frequency"
        name="frequency"
        defaultValue="monthly"
        isChanged={changed}
        onChange={(value) => {
          setChanged(value !== 'monthly');
        }}
      >
        <Radio value="weekly">Weekly</Radio>
        <Radio value="monthly">Monthly</Radio>
        <Radio value="never">Never</Radio>
      </RadioGroup>
      <ResetButton />
    </form>
  );
}

function SwitchForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <Switch
        name="digest"
        defaultSelected
        isChanged={changed}
        onChange={(isSelected) => {
          setChanged(!isSelected);
        }}
      >
        Weekly digest
      </Switch>
      <ResetButton />
    </form>
  );
}

function SegmentedControlForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <SegmentedControl
        label="Appearance"
        name="theme"
        defaultValue="dark"
        isChanged={changed}
        onChange={(value) => {
          setChanged(value !== 'dark');
        }}
      >
        <SegmentedControlItem value="light">Light</SegmentedControlItem>
        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
        <SegmentedControlItem value="system">System</SegmentedControlItem>
      </SegmentedControl>
      <ResetButton />
    </form>
  );
}

function PositionPadForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <PositionPad
        label="Text position"
        name="place"
        defaultValue="center"
        isChanged={changed}
        onChange={(value) => {
          setChanged(value !== 'center');
        }}
      />
      <ResetButton />
    </form>
  );
}

function MultiSelectForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <MultiSelect
        label="Categories"
        name="categories"
        defaultValue={['food', 'rent']}
        isChanged={changed}
        onChange={(value) => {
          setChanged(value.join() !== 'food,rent');
        }}
      >
        <PickerOption id="food">Food</PickerOption>
        <PickerOption id="rent">Rent</PickerOption>
        <PickerOption id="salary">Salary</PickerOption>
      </MultiSelect>
      <ResetButton />
    </form>
  );
}

function TagInputForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <TagInput
        label="Invite people"
        name="invite"
        preset={emailPreset}
        defaultValue={['ana@example.com', 'bo@example.com']}
        isChanged={changed}
        onChange={(value) => {
          setChanged(value.join() !== 'ana@example.com,bo@example.com');
        }}
      />
      <ResetButton />
    </form>
  );
}

function SelectForm(): ReactElement {
  const [changed, setChanged] = useState(false);
  return (
    <form>
      <Select
        label="Category"
        name="category"
        defaultValue="rent"
        isChanged={changed}
        onChange={(value) => {
          setChanged(value !== 'rent');
        }}
      >
        <PickerOption id="food">Food</PickerOption>
        <PickerOption id="rent">Rent</PickerOption>
        <PickerOption id="salary">Salary</PickerOption>
      </Select>
      <ResetButton />
    </form>
  );
}

describe('a native form reset', () => {
  it('puts a TextField back, with its count and without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextFieldForm />);
    const input = screen.getByRole('textbox', { name: 'Workspace name' });
    expect(screen.getByRole('status')).toHaveTextContent('9 of about 12');
    expect(showsChip(container)).toBe(false);

    await user.type(input, ' East');
    expect(input).toHaveValue('Northwind East');
    expect(screen.getByRole('status')).toHaveTextContent('14 of about 12');
    expect(showsChip(container)).toBe(true);
    expect(input).toHaveAccessibleDescription(CHANGED);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('Northwind');
    expect(screen.getByRole('status')).toHaveTextContent('9 of about 12');
    expect(showsChip(container)).toBe(false);
    expect(input).not.toHaveAccessibleDescription(CHANGED);
    expect(sent(container, 'workspace')).toEqual(['Northwind']);
  });

  it('puts a TextArea back, with its count and without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<TextAreaForm />);
    const area = screen.getByRole('textbox', { name: 'Welcome message' });
    expect(screen.getByRole('status')).toHaveTextContent('11 of about 14');

    await user.type(area, '{Enter}and welcome');
    expect(area).toHaveValue('Hello there\nand welcome');
    expect(screen.getByRole('status')).toHaveTextContent('23 of about 14');
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(area).toHaveValue('Hello there');
    expect(screen.getByRole('status')).toHaveTextContent('11 of about 14');
    expect(showsChip(container)).toBe(false);
    expect(sent(container, 'welcome')).toEqual(['Hello there']);
  });

  it('puts each Checkbox back to checked or unchecked as it started', async () => {
    const user = userEvent.setup();
    const { container } = render(<CheckboxForm />);
    const terms = screen.getByRole('checkbox', { name: 'I accept the terms' });
    const news = screen.getByRole('checkbox', { name: 'Send me the newsletter' });

    await user.click(terms);
    await user.click(news);
    expect(terms).not.toBeChecked();
    expect(news).toBeChecked();
    expect(sent(container, 'terms')).toEqual([]);
    expect(sent(container, 'news')).toEqual(['on']);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(terms).toBeChecked();
    expect(news).not.toBeChecked();
    expect(sent(container, 'terms')).toEqual(['on']);
    expect(sent(container, 'news')).toEqual([]);
  });

  // React Aria cannot yet do every reset: `removeValue` in react-stately's useCheckboxGroupState
  // filters a stale list while `addValue` does not, so the last removal in one event wins. A reset
  // that unchecks more than one box, or that re-checks a box before unchecking another (in DOM
  // order), loses boxes. A reset that only re-checks boxes, or unchecks a single box, works, and
  // each of those is checked below. The failing cases are known, recorded in Appendix B and held as
  // expected failures in CheckboxGroup.test.tsx, and not worked around here.
  describe('on a CheckboxGroup', () => {
    it('re-checks a default box that was unchecked, and follows with the chip', async () => {
      const user = userEvent.setup();
      const { container } = render(<CheckboxGroupForm defaults={['email', 'sms']} />);
      expect(showsChip(container)).toBe(false);

      await user.click(screen.getByRole('checkbox', { name: 'Text message' }));
      expect(sent(container, 'channels')).toEqual(['email']);
      expect(showsChip(container)).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(sent(container, 'channels')).toEqual(['email', 'sms']);
      expect(screen.getByRole('checkbox', { name: 'Text message' })).toBeChecked();
      expect(showsChip(container)).toBe(false);
    });

    it('unchecks a box that was added, and follows with the chip', async () => {
      const user = userEvent.setup();
      const { container } = render(<CheckboxGroupForm defaults={['email']} />);

      await user.click(screen.getByRole('checkbox', { name: 'Push' }));
      expect(sent(container, 'channels')).toEqual(['email', 'push']);
      expect(showsChip(container)).toBe(true);

      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(sent(container, 'channels')).toEqual(['email']);
      expect(screen.getByRole('checkbox', { name: 'Push' })).not.toBeChecked();
      expect(showsChip(container)).toBe(false);
    });
  });

  it('puts a RadioGroup back on its default choice, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<RadioGroupForm />);
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(showsChip(container)).toBe(false);

    await user.click(screen.getByRole('radio', { name: 'Never' }));
    expect(sent(container, 'frequency')).toEqual(['never']);
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('radio', { name: 'Monthly' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Never' })).not.toBeChecked();
    expect(sent(container, 'frequency')).toEqual(['monthly']);
    expect(showsChip(container)).toBe(false);
  });

  it('puts a Switch back to on, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<SwitchForm />);
    const control = screen.getByRole('switch', { name: 'Weekly digest' });
    expect(control).toBeChecked();
    expect(showsChip(container)).toBe(false);

    await user.click(control);
    expect(control).not.toBeChecked();
    expect(sent(container, 'digest')).toEqual([]);
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(control).toBeChecked();
    expect(sent(container, 'digest')).toEqual(['on']);
    expect(showsChip(container)).toBe(false);
  });

  it('puts a SegmentedControl back on its default option, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<SegmentedControlForm />);
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(showsChip(container)).toBe(false);

    await user.click(screen.getByText('System'));
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(sent(container, 'theme')).toEqual(['system']);
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'System' })).not.toBeChecked();
    expect(sent(container, 'theme')).toEqual(['dark']);
    expect(showsChip(container)).toBe(false);
  });

  it('puts a PositionPad back on its default position, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<PositionPadForm />);
    expect(screen.getByRole('radio', { name: 'Center' })).toBeChecked();
    expect(showsChip(container)).toBe(false);

    await user.click(screen.getByRole('radio', { name: 'Bottom right' }));
    expect(screen.getByRole('radio', { name: 'Bottom right' })).toBeChecked();
    expect(sent(container, 'place')).toEqual(['bottom-end']);
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(screen.getByRole('radio', { name: 'Center' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Bottom right' })).not.toBeChecked();
    expect(sent(container, 'place')).toEqual(['center']);
    expect(showsChip(container)).toBe(false);
  });

  it('puts a SearchField back to its default text', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <SearchField label="Search transactions" name="q" defaultValue="coffee" />
        <ResetButton />
      </form>,
    );
    const input = screen.getByRole('searchbox', { name: 'Search transactions' });
    await user.clear(input);
    await user.type(input, 'rent');
    expect(sent(container, 'q')).toEqual(['rent']);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('coffee');
    expect(sent(container, 'q')).toEqual(['coffee']);
    expect(container.querySelector('.search-field')).not.toHaveAttribute('data-empty');
  });

  it('puts a money NumberField back to its default, in its own hidden input too', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <NumberField label="Minimum" name="min" money={{ symbol: '$' }} defaultValue={123450} />
        <ResetButton />
      </form>,
    );
    const input = screen.getByRole('textbox', { name: 'Minimum' });
    expect(sent(container, 'min')).toEqual(['123450']);
    await user.clear(input);
    await user.type(input, '20');
    await user.tab();
    expect(input).toHaveValue('20.00');
    expect(sent(container, 'min')).toEqual(['2000']);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(input).toHaveValue('1,234.50');
    expect(sent(container, 'min')).toEqual(['123450']);
  });

  it('puts a DateRangePicker back on its default range', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <DateRangePicker
          label="Statement period"
          startName="from"
          endName="to"
          defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
        />
        <ResetButton />
      </form>,
    );
    const day = screen.getAllByRole('spinbutton')[1];
    if (!day) throw new Error('No day segment');
    act(() => {
      day.focus();
    });
    await user.keyboard('{ArrowUp}');
    expect(sent(container, 'from')).toEqual(['2026-09-02']);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(sent(container, 'from')).toEqual(['2026-09-01']);
    expect(sent(container, 'to')).toEqual(['2026-09-30']);
    expect(day).toHaveTextContent('1');
  });

  it('puts a Select back on its default option, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<SelectForm />);
    const value = (): string | null | undefined => container.querySelector('.select-value')?.textContent;
    expect(value()).toBe('Rent');
    expect(showsChip(container)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Rent Category' }));
    await user.click(screen.getByRole('option', { name: 'Salary' }));
    expect(value()).toBe('Salary');
    expect(sent(container, 'category')).toEqual(['salary']);
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(value()).toBe('Rent');
    expect(sent(container, 'category')).toEqual(['rent']);
    expect(showsChip(container)).toBe(false);
  });

  it('puts a MultiSelect back on its default values, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<MultiSelectForm />);
    const tags = (): string[] =>
      [...container.querySelectorAll('.multi-select-tag-text')].map((tag) => tag.textContent);
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(showsChip(container)).toBe(false);

    await user.click(screen.getByRole('button', { name: 'Remove Food' }));
    await user.click(screen.getByRole('button', { name: /^Show options/ }));
    await user.click(screen.getByRole('option', { name: 'Salary' }));
    await user.keyboard('{Escape}');
    expect(tags()).toEqual(['Rent', 'Salary']);
    expect(sent(container, 'categories')).toEqual(['rent', 'salary']);
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(tags()).toEqual(['Food', 'Rent']);
    expect(sent(container, 'categories')).toEqual(['food', 'rent']);
    expect(showsChip(container)).toBe(false);
  });

  it('puts a TagInput back on its first values, with its text and its error cleared, without its chip', async () => {
    const user = userEvent.setup();
    const { container } = render(<TagInputForm />);
    const tags = (): string[] =>
      [...container.querySelectorAll('.tag-input-tag-text')].map((tag) => tag.textContent);
    const box = screen.getByRole('textbox');
    await user.click(screen.getByRole('button', { name: 'Remove ana@example.com' }));
    await user.type(box, 'cy@example.com,nope{Enter}');
    expect(tags()).toEqual(['bo@example.com', 'cy@example.com']);
    expect(sent(container, 'invite')).toEqual(['bo@example.com', 'cy@example.com']);
    expect(box).toHaveValue('nope');
    expect(container.querySelector('.field-error')).not.toBeNull();
    expect(showsChip(container)).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(tags()).toEqual(['ana@example.com', 'bo@example.com']);
    expect(sent(container, 'invite')).toEqual(['ana@example.com', 'bo@example.com']);
    expect(box).toHaveValue('');
    expect(container.querySelector('.field-error')).toBeNull();
    expect(showsChip(container)).toBe(false);
  });

  it("restores a hidden group's fields on a form reset", async () => {
    const user = userEvent.setup();
    function LogoForm(): ReactElement {
      const [logo, setLogo] = useState(true);
      return (
        <form>
          <Switch isSelected={logo} onChange={setLogo} aria-controls="logo-fields">
            Show bank logos
          </Switch>
          <ConditionalFields id="logo-fields" isShown={logo}>
            <TextField label="API key" name="logoKey" defaultValue="sk-saved" />
          </ConditionalFields>
          <ResetButton />
        </form>
      );
    }
    const { container } = render(<LogoForm />);
    const key = screen.getByLabelText('API key');
    await user.clear(key);
    await user.type(key, 'sk-typed');
    const gate = screen.getByRole('switch', { name: 'Show bank logos' });
    await user.click(gate);
    expect(container.querySelector('fieldset.conditional-fields')).toHaveAttribute('disabled');
    // Hidden and disabled, the field is still reset with the rest of the form, as a browser resets every control;
    // the gate goes back to on, its first value, and shows it.
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(key).toHaveValue('sk-saved');
    expect(gate).toBeChecked();
    expect(container.querySelector('fieldset.conditional-fields')).not.toHaveAttribute('hidden');
    expect(screen.getByLabelText('API key')).toHaveValue('sk-saved');
    expect(sent(container, 'logoKey')).toEqual(['sk-saved']);
  });

  it("restores an uncontrolled repeater's fields on a form reset", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Repeater<{ id: string; amount: number | null }>
          label="Wait tiers"
          defaultValue={[
            { id: 'a', amount: 10000 },
            { id: 'b', amount: 50000 },
          ]}
          createRow={() => ({ id: 'new', amount: null })}
          rowLabel={(index) => `Tier ${String(index + 1)}`}
          maxRows={3}
        >
          {(tier) => (
            <NumberField label="Up to" name="tierAmount" money={{ symbol: '$' }} defaultValue={tier.amount} />
          )}
        </Repeater>
        <ResetButton />
      </form>,
    );
    const second = within(screen.getByRole('group', { name: 'Tier 2' })).getByRole('textbox', {
      name: 'Up to',
    });
    await user.clear(second);
    await user.type(second, '700{Enter}');
    expect(sent(container, 'tierAmount')).toEqual(['10000', '70000']);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(second).toHaveValue('500.00');
    expect(sent(container, 'tierAmount')).toEqual(['10000', '50000']);
    expect(container.querySelectorAll('li.repeater-row')).toHaveLength(2);
  });

  it.each([['uncontrolled'], ['controlled']] as const)(
    'puts a repeater back to its first rows on a form reset after a remove and an add, %s',
    async (mode) => {
      interface Tier {
        id: string;
        amount: number | null;
      }
      const FIRST: Tier[] = [
        { id: 'a', amount: 10000 },
        { id: 'b', amount: 50000 },
      ];
      const onChange = vi.fn<(rows: Tier[]) => void>();
      function Tiers(): ReactElement {
        const [rows, setRows] = useState<Tier[]>(FIRST);
        const state =
          mode === 'controlled'
            ? {
                value: rows,
                onChange: (next: Tier[]) => {
                  onChange(next);
                  setRows(next);
                },
              }
            : { defaultValue: FIRST, onChange };
        return (
          <form>
            <Repeater<Tier>
              label="Wait tiers"
              {...state}
              createRow={() => ({ id: 'new', amount: null })}
              rowLabel={(index) => `Tier ${String(index + 1)}`}
              maxRows={3}
            >
              {(tier) => (
                <NumberField
                  label="Up to"
                  name="tierAmount"
                  money={{ symbol: '$' }}
                  defaultValue={tier.amount}
                />
              )}
            </Repeater>
            <ResetButton />
          </form>
        );
      }
      const user = userEvent.setup();
      const { container } = render(<Tiers />);
      await user.click(screen.getByRole('button', { name: 'Remove, Tier 1' }));
      await user.click(screen.getByRole('button', { name: 'Add a row' }));
      expect(sent(container, 'tierAmount')).toEqual(['50000', '']);
      // A reset puts back what the form started with, as it does every control: the removed row returns and the
      // added one leaves, so the form sends what it first held.
      await user.click(screen.getByRole('button', { name: 'Reset' }));
      expect(
        [...container.querySelectorAll('li.repeater-row')].map((item) => item.getAttribute('data-row-id')),
      ).toEqual(['a', 'b']);
      expect(sent(container, 'tierAmount')).toEqual(['10000', '50000']);
      expect(onChange).toHaveBeenLastCalledWith(FIRST);
    },
  );
});
