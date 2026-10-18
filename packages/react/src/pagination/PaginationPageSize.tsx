'use client';

import { useId, type ChangeEvent, type ReactElement } from 'react';

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
 * The rows-per-page picker at the start of Pagination's row: a native `select`, drawn as the library's field and
 * Select trigger are (the `.input` pill at the control's height, a chevron), with its visible label tied to it by
 * `for` and `id`, and one option per size. It imports nothing from React Aria, so a Pagination costs no picker's
 * weight, and a phone opens its own wheel or sheet (spec correction 112). Private to Pagination, which a client
 * component renders with a picker, since the function it calls cannot cross to the client.
 */
export function PaginationPageSize({
  label,
  value,
  options,
  onChange,
}: PaginationPageSizeProps): ReactElement {
  const id = useId();
  return (
    <div className="pagination-size">
      <label className="pagination-size-label" htmlFor={id}>
        {label}
      </label>
      <span className="pagination-size-field">
        <select
          id={id}
          className="input pagination-size-select"
          value={value}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => {
            const size = Number(event.target.value);
            if (size !== value) onChange(size);
          }}
        >
          {options.map(({ size, text }) => (
            <option key={size} value={size}>
              {text}
            </option>
          ))}
        </select>
        {/* Lucide's chevron-down, drawn inline: the select's own arrow is gone with its appearance. */}
        <svg
          className="pagination-size-chevron"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
    </div>
  );
}
