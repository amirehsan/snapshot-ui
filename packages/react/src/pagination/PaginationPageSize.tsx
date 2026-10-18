'use client';

import type { ReactElement } from 'react';
import { PickerOption } from '../picker/PickerOption';
import { Select } from '../select/Select';

export interface PaginationPageSizeProps {
  /** `labels.pageSize`, shown beside the picker. */
  label: string;
  /** The current size. */
  value: number;
  /** The sizes offered, each with its text as `pageLabel` writes it. */
  options: readonly { size: number; text: string }[];
  /** Called with a size other than `value`. */
  onChange: (size: number) => void;
}

/**
 * The rows-per-page picker at the start of Pagination's row: the library's Select with a visible label and one
 * option per size, never filtered. Private to Pagination, which a client component renders with a picker, since
 * its function cannot cross to the client.
 */
export function PaginationPageSize({
  label,
  value,
  options,
  onChange,
}: PaginationPageSizeProps): ReactElement {
  return (
    <Select
      className="pagination-size"
      label={label}
      value={value}
      isFilterable={false}
      onChange={(key) => {
        const size = Number(key);
        if (key !== null && size !== value) onChange(size);
      }}
    >
      {options.map(({ size, text }) => (
        <PickerOption key={size} id={size} textValue={text}>
          {text}
        </PickerOption>
      ))}
    </Select>
  );
}
