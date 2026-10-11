import { useState } from 'react';

export interface ValueLengthOptions {
  /** The value, when the caller controls the field. */
  value?: string;
  /** The value an uncontrolled field starts with. */
  defaultValue?: string;
  /** The caller's change handler. */
  onChange?: (value: string) => void;
}

export interface ValueLength {
  /** How long the field's value is: the controlled value when there is one, else what was typed. */
  length: number;
  /** Give this to the field as its `onChange`. It keeps the count, then calls the caller's handler. */
  onChange: (value: string) => void;
}

/**
 * Counts the length of a text field's value whether or not the caller controls
 * it, for `FieldCounter`. An uncontrolled field keeps its value inside React
 * Aria, so the count is kept from the changes it reports, starting from the
 * default value. A form reset reports the default value through the same
 * change, so the count follows it.
 *
 * The unit is the value's `length`, in UTF-16 code units. That is how
 * JavaScript, `maxLength` and the value React Aria reports all measure, so a
 * line break counts as one, and an emoji or an accented letter built from two
 * code points can count as two.
 *
 * Internal: every text field with a `budget` calls it, so they all count alike.
 * Not exported from the package.
 */
export function useValueLength({ value, defaultValue, onChange }: ValueLengthOptions): ValueLength {
  const [typed, setTyped] = useState(defaultValue ?? '');
  return {
    length: (value ?? typed).length,
    onChange: (next) => {
      setTyped(next);
      onChange?.(next);
    },
  };
}
