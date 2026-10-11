import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { Input, TextField } from 'react-aria-components';
import { expect } from 'storybook/test';
import { Description } from './Description';
import { FieldChanged } from './FieldChanged';
import { FieldCounter } from './FieldCounter';
import { FieldError } from './FieldError';
import { Label } from './Label';

// The library's TextField arrives with its own input. Until then these stories
// compose the parts inside React Aria's TextField, which is exactly how a
// custom layout uses them. The input gets a minimal look of its own, drawn in
// tokens, so the parts are seen next to a control.
const STORY_CSS = `
.story-field-input {
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  padding-inline: 1.5rem;
  border: 1px solid var(--color-boundary);
  border-radius: var(--radius-pill);
  background-color: var(--color-raised);
  color: var(--color-ink);
  font: inherit;
}
.field[data-changed] .story-field-input {
  border: 1.5px solid var(--color-signal-light);
}
.field[data-invalid] .story-field-input {
  border: 1.5px solid var(--color-error);
}
`;

const NEAR_BUDGET = 'A shared space for the whole Northwind design team';
const OVER_BUDGET = 'A shared space for the whole Northwind design team and its guests';

interface SampleFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string;
  isInvalid?: boolean;
  isChanged?: boolean;
  budget?: number;
  defaultValue?: string;
}

/** A field built from the parts: the root carries `data-changed`, and React Aria adds `data-invalid`. */
function SampleField({
  label = 'Workspace name',
  description,
  errorMessage,
  isInvalid,
  isChanged,
  budget,
  defaultValue = '',
}: SampleFieldProps): ReactElement {
  const [value, setValue] = useState(defaultValue);
  return (
    <div style={{ width: 'min(28rem, calc(100vw - 2rem))' }}>
      <style>{STORY_CSS}</style>
      <TextField
        className="field"
        data-changed={isChanged ? '' : undefined}
        isInvalid={isInvalid}
        value={value}
        onChange={setValue}
      >
        <div className="field-head">
          <Label>{label}</Label>
          <FieldChanged />
        </div>
        <Input className="story-field-input" />
        {description ? <Description>{description}</Description> : null}
        <FieldError>{errorMessage}</FieldError>
        {budget ? <FieldCounter count={value.length} budget={budget} /> : null}
      </TextField>
    </div>
  );
}

const meta = {
  title: 'Components/Field',
  component: SampleField,
  args: { description: 'Shown in the header and in every invite.' },
} satisfies Meta<typeof SampleField>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A label, a control and a hint. The Changed chip is in the page and hidden. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Changed')).not.toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Workspace name' })).toHaveAccessibleDescription(
      'Shown in the header and in every invite.',
    );
  },
};

/** `data-changed` on the root shows the clay chip and the control draws its own border. */
export const Changed: Story = {
  args: { isChanged: true, defaultValue: 'Northwind Studio' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Changed')).toBeVisible();
  },
};

/** The error line appears with the field's invalid state and describes the control. */
export const Invalid: Story = {
  args: { isInvalid: true, errorMessage: 'Enter a name for the workspace.' },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Enter a name for the workspace.')).toBeVisible();
    await expect(canvas.getByRole('textbox', { name: 'Workspace name' })).toBeInvalid();
  },
};

/** Invalid outranks changed: the error border and the error line show, and the chip steps aside. */
export const InvalidAndChanged: Story = {
  args: {
    isChanged: true,
    isInvalid: true,
    errorMessage: 'Enter a name for the workspace.',
    defaultValue: '!',
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText('Changed')).not.toBeVisible();
    await expect(canvas.getByText('Enter a name for the workspace.')).toBeVisible();
  },
};

/** From 70% of the budget the count appears, quiet and slate. */
export const CounterNearBudget: Story = {
  args: {
    label: 'Short description',
    description: 'One sentence, for search results.',
    budget: 60,
    defaultValue: NEAR_BUDGET,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole('status')).toHaveTextContent('50 of about 60');
  },
};

/** Past the budget the count turns to ink at 700. Typing was never blocked, and the value still saves. */
export const CounterOverBudget: Story = {
  args: {
    label: 'Short description',
    description: 'One sentence, for search results.',
    budget: 60,
    defaultValue: OVER_BUDGET,
  },
  play: async ({ canvas }) => {
    const counter = canvas.getByRole('status');
    await expect(counter).toHaveTextContent('65 of about 60');
    await expect(counter).toHaveAttribute('data-over');
    await expect(getComputedStyle(counter).fontWeight).toBe('700');
  },
};

/** A long label wraps and the chip drops under it, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    label: 'The name your team sees in the header, in every invite and in the billing emails',
    isChanged: true,
    defaultValue: 'Northwind Studio',
  },
};

// One unbroken word in each part, with no hyphen, slash or dot for a browser to break at.
const LONG_LABEL = 'Thenamethatyourteamseesintheheaderandineveryinviteandinallthebillingemailswesendout';
const LONG_HINT = 'Shownintheheaderandineveryinviteandinallthebillingemailsthatwesendouttoyourteam';
const LONG_ERROR = 'Enteranamefortheworkspacethatismadeofwordsnotoneunbrokenstringofletterswithnobreaks';

/** One unbroken word in the label, the hint and the error line wraps inside its part and never scrolls the field sideways. */
export const LongWord: Story = {
  args: {
    label: LONG_LABEL,
    description: LONG_HINT,
    errorMessage: LONG_ERROR,
    isInvalid: true,
    defaultValue: 'Northwind Studio',
  },
  play: async ({ canvas }) => {
    const field = canvas.getByRole('textbox', { name: LONG_LABEL }).closest('.field');
    if (!(field instanceof HTMLElement)) throw new Error('The field root is missing.');
    // Text that cannot break pokes out of its box and widens what holds it.
    await expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth);
    for (const text of [LONG_LABEL, LONG_HINT, LONG_ERROR]) {
      await expect(canvas.getByText(text)).toBeVisible();
    }
  },
};

/** Typing past the budget is never blocked. */
export const TypingPastBudget: Story = {
  tags: ['no-visual'],
  args: { label: 'Short description', description: 'One sentence, for search results.', budget: 10 },
  play: async ({ canvas, userEvent }) => {
    const input = canvas.getByRole('textbox', { name: 'Short description' });
    await userEvent.type(input, 'fourteen chars');
    await expect(input).toHaveValue('fourteen chars');
    await expect(input).toBeValid();
    await expect(canvas.getByRole('status')).toHaveTextContent('14 of about 10');
  },
};
