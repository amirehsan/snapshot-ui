'use client';

import { Search, X } from 'lucide-react';
import type { ReactElement, ReactNode, Ref } from 'react';
import {
  Button,
  SearchField as RACSearchField,
  type SearchFieldProps as RACSearchFieldProps,
  type SearchFieldRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { Label } from '../field/Label';
import { Input } from '../text-field/Input';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface SearchFieldBaseProps extends Omit<RACSearchFieldProps, 'children' | 'className'> {
  /** The field's name, shown above it. Required unless the field has an `aria-label` or an `aria-labelledby`. */
  label?: ReactNode;
  /** A hint under the field. It becomes the input's accessible description. */
  description?: ReactNode;
  /**
   * The error line, shown only while the field is invalid. A function receives the validation result. Without
   * it the field shows its own validation messages.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** Example text while the field is empty. Taupe under a visible label, slate without one. */
  placeholder?: string;
  /**
   * The clear button's name.
   * @default 'Clear search'
   */
  clearLabel?: string;
  /** A class name, or a function of the field's state, merged after the library's own classes. */
  className?:
    string | ((values: SearchFieldRenderProps & { defaultClassName: string | undefined }) => string);
  /** A ref to the field's root element. */
  ref?: Ref<HTMLDivElement>;
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a search field. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type SearchFieldProps = SearchFieldBaseProps & AccessibleName<'label'>;

/**
 * A search box: a magnifier at the start, a clear button at the end once there is text, Escape to clear and
 * Enter to submit (`onSubmit`). It has no debounce and no changed state: an app that keeps the query in its
 * URL passes `value` and writes the URL after its own pause in `onChange`, or in `onSubmit`. Without a visible
 * label, as in a toolbar, name it with `aria-label`; its placeholder is then slate, since it is the only words
 * shown. Built on React Aria's SearchField.
 */
export function SearchField({
  label,
  description,
  errorMessage,
  placeholder,
  clearLabel = 'Clear search',
  className,
  inputRef,
  ...props
}: SearchFieldProps): ReactElement {
  const isLabelled = present(label);
  return (
    <RACSearchField
      {...props}
      data-unlabelled={isLabelled ? undefined : ''}
      className={composeRenderProps(className, (userClassName) => cx('field', 'search-field', userClassName))}
    >
      {isLabelled ? (
        // A query is never unsaved, so the label row holds the label alone.
        <div className="field-head">
          <Label>{label}</Label>
        </div>
      ) : null}
      <div className="search-field-control">
        <span className="search-field-icon" aria-hidden="true">
          <Search />
        </span>
        <Input ref={inputRef} className="search-field-input" placeholder={placeholder} />
        {/* React Aria keeps it out of the tab order, since Escape does the same from the field. Its own name
            would be React Aria's localized text; this one is the library's, replaceable for a Persian page. */}
        <Button className="input-button search-field-clear" aria-label={clearLabel}>
          <X aria-hidden="true" />
        </Button>
      </div>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </RACSearchField>
  );
}
