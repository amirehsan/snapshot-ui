import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { formOf } from './dom';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { Radio, RadioGroup } from '../src/radio-group';
import { SearchField } from '../src/search-field';
import { SegmentedControl, SegmentedControlItem } from '../src/segmented-control';
import { Switch } from '../src/switch';
import { TextArea } from '../src/text-area';
import { TextField } from '../src/text-field';

/**
 * A plain <form> is reset by the browser, with no help from the app: every
 * field must come back to its default value, and what the field draws from its
 * value (the count, the Changed chip) must follow. The chip is the app's to
 * show, as it knows the saved value, so each harness below does what an app
 * does: it compares the value it is told about with the saved one.
 *
 * These checks sit together because the same event reaches eight different
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
});
