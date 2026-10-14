'use client';

import { useCallback, useId, useMemo, type ReactElement, type ReactNode, type Ref } from 'react';
import { Tab as RACTab, type Key, type TabProps as RACTabProps } from 'react-aria-components';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';

export interface TabProps extends Omit<RACTabProps, 'className' | 'style' | 'children'> {
  /** The tab's key: the panel with the same `id` is its panel, and `selectedKey` names it. */
  id: Key;
  /** The tab's name: a word or two. */
  children: ReactNode;
  /** The tab's panel holds unsaved changes. Shows the clay dot and has a screen reader read `changedLabel`. */
  isChanged?: boolean;
  /**
   * The words a screen reader reads after the tab's name while `isChanged` is set, in the page's language.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** A class name merged after the library's own class. */
  className?: string;
  /** A ref to the tab: a `div`, or an `a` when it has `href`. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * One tab: a pill with its name, and a clay dot while its panel holds unsaved edits. With `href` it is a link
 * that React Aria renders as an anchor and follows through `RouterProvider`, on Enter, Space or a press.
 */
export function Tab({
  children,
  isChanged = false,
  changedLabel = 'Changed',
  className,
  ref,
  ...props
}: TabProps): ReactElement {
  const changedId = useId();
  const describedBy = props['aria-describedby'];
  const isLink = props.href !== undefined;
  // React Aria follows a link tab on Space but leaves the key's default to the anchor, and the browser scrolls
  // the page. React Aria's Tab takes no key handler, so a listener on the element stops the scroll. A callback
  // ref, since the collection draws the element after this component's own effects have run.
  const stopScroll = useCallback(
    (tab: HTMLDivElement | null) => {
      if (!tab || !isLink) return;
      const onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === ' ') event.preventDefault();
      };
      tab.addEventListener('keydown', onKeyDown);
      return () => {
        tab.removeEventListener('keydown', onKeyDown);
      };
    },
    [isLink],
  );
  const tabRef = useMemo(() => mergeRefs<HTMLDivElement>(ref, stopScroll), [ref, stopScroll]);
  return (
    <RACTab
      {...props}
      ref={tabRef}
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
