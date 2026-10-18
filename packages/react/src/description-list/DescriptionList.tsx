import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

/**
 * `auto` draws terms beside values from 30rem of the list's own width and above them under it. `horizontal`
 * and `stacked` hold one layout at every width.
 */
export type DescriptionListLayout = 'auto' | 'horizontal' | 'stacked';

export interface DescriptionListProps extends Omit<HTMLAttributes<HTMLDListElement>, 'children'> {
  /** DescriptionListItem elements, in order. */
  children: ReactNode;
  /**
   * `auto` draws terms beside values from 30rem of the list's own width and above them under it.
   * `horizontal` and `stacked` hold one layout at every width.
   * @default 'auto'
   */
  layout?: DescriptionListLayout;
  /** A rule between rows, never above the first or under the last. @default true */
  hasDividers?: boolean;
  ref?: Ref<HTMLDListElement>;
}

export interface DescriptionListItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** The name of the value: "Credit limit". */
  term: ReactNode;
  /** The value. Absent, `null`, `false`, `true` or an empty string is empty; `0` is a value. */
  children?: ReactNode;
  /**
   * In place of an empty value: words in slate, or a link to add it, as GOV.UK's summary list does. A page in
   * another language passes its own words.
   * @default 'Not set'
   */
  emptyValue?: ReactNode;
  /**
   * The row's controls, such as an Edit button or link. Name each with the term, so it reads "Edit Nickname"
   * while it shows "Edit".
   */
  actions?: ReactNode;
  /**
   * An amount, a limit, a percentage or an identifier in Latin digits: tabular figures, left to right and
   * isolated in every direction, at the start of the line.
   * @default false
   */
  isNumeric?: boolean;
  ref?: Ref<HTMLDivElement>;
}

/**
 * Named values, such as an account's details: a real `dl` of `div` rows, each a term, its value and the row's
 * actions. Terms sit beside values from 30rem of the list's own width and above them under it. No role is
 * added, so the term and definition semantics stay. Static: it adds no JavaScript.
 */
export function DescriptionList({
  layout = 'auto',
  hasDividers = true,
  className,
  ...props
}: DescriptionListProps): ReactElement {
  return (
    <dl
      {...props}
      className={cx('description-list', className)}
      data-layout={layout}
      data-dividers={hasDividers ? '' : undefined}
    />
  );
}

/**
 * One row of a DescriptionList: the term, the value or the empty words, and the row's actions in a `dd` of
 * their own. It belongs in a DescriptionList, where the `div` is a group the HTML standard allows.
 */
export function DescriptionListItem({
  term,
  children,
  emptyValue = 'Not set',
  actions,
  isNumeric = false,
  className,
  ...props
}: DescriptionListItemProps): ReactElement {
  const isEmpty = !present(children);
  return (
    <div {...props} className={cx('description-list-item', className)}>
      <dt className="description-list-term">{term}</dt>
      <dd
        className="description-list-value"
        data-empty={isEmpty ? '' : undefined}
        // "Not set" is words, never a figure.
        data-numeric={isNumeric && !isEmpty ? '' : undefined}
      >
        {isEmpty ? emptyValue : children}
      </dd>
      {present(actions) ? <dd className="description-list-actions">{actions}</dd> : null}
    </div>
  );
}
