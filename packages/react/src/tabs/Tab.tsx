'use client';

import { useId, type ReactElement, type ReactNode, type Ref } from 'react';
import { Tab as RACTab, type Key, type TabProps as RACTabProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export interface TabProps extends Omit<RACTabProps, 'className' | 'style' | 'children'> {
  /** The tab's key: the panel with the same `id` is its panel, and `selectedKey` names it. */
  id: Key;
  /** The tab's name: a word or two. */
  children: ReactNode;
  /** The tab's panel holds unsaved changes. Shows the clay dot and has a screen reader read `changedLabel`. */
  isChanged?: boolean;
  /** @default 'Changed' */
  changedLabel?: string;
  /** A class name merged after the library's own class. */
  className?: string;
  /** A ref to the tab: a `div`, or an `a` when it has `href`. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * One tab: a pill with its name, and a clay dot while its panel holds unsaved edits. With `href` it is a link
 * that React Aria renders as an anchor and follows through `RouterProvider`.
 */
export function Tab({
  children,
  isChanged = false,
  changedLabel = 'Changed',
  className,
  ...props
}: TabProps): ReactElement {
  const changedId = useId();
  const describedBy = props['aria-describedby'];
  return (
    <RACTab
      {...props}
      aria-describedby={isChanged ? cx(changedId, describedBy) : describedBy}
      className={cx('tab', className)}
    >
      <span className="tab-label">{children}</span>
      {isChanged ? (
        <>
          <span className="tab-changed" aria-hidden="true" />
          {/* Hidden, not visually hidden: a description reads a hidden element it names, and the tab's name
              stays its words, where a visually hidden span would join them. */}
          <span id={changedId} hidden>
            {changedLabel}
          </span>
        </>
      ) : null}
    </RACTab>
  );
}
