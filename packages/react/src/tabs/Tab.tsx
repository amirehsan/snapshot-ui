'use client';

import {
  createElement,
  useCallback,
  useContext,
  useId,
  useMemo,
  type ContextType,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Tab as RACTab,
  TabListStateContext,
  type Key,
  type TabProps as RACTabProps,
  type TabRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { mergeRefs } from '../utils/merge-refs';
import { useUnstartedClick } from '../utils/unstarted-click';

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

type TabListState = NonNullable<ContextType<typeof TabListStateContext>>;
type Render = NonNullable<RACTabProps['render']>;
/** What React Aria hands the element it draws for a tab: an anchor's props for a link tab, a div's otherwise. */
type ElementProps = HTMLAttributes<HTMLElement> & { href?: string; ref?: Ref<HTMLElement> };

/**
 * The tab that holds the row's place in the tab order while React Aria has given that place to none, or null
 * when React Aria's focused key does. React Aria sets its focused key to the selected tab in an effect, so the
 * server's HTML and the first render had no tab in the tab order and the row could not be reached by Tab; and
 * a selected key that names no tab, such as a URL's for a page with no tab of its own, leaves none for good.
 * Then the selected tab is the stop, as the tabs pattern asks, or the first enabled tab when none is selected.
 */
function stopOf(state: TabListState | null): Key | null {
  if (state === null || state.isDisabled) return null;
  const { collection, selectionManager } = state;
  const usable = (key: Key | null): key is Key =>
    key !== null && (collection.getItem(key) ?? null) !== null && !selectionManager.isDisabled(key);
  if (usable(selectionManager.focusedKey)) return null;
  if (usable(state.selectedKey)) return state.selectedKey;
  for (let key = collection.getFirstKey(); key !== null; key = collection.getKeyAfter(key)) {
    if (usable(key)) return key;
  }
  return null;
}

/** Calls each handler given, in order. */
function chain<A extends unknown[]>(
  ...handlers: (((...args: A) => void) | undefined)[]
): (...args: A) => void {
  return (...args) => {
    for (const handler of handlers) handler?.(...args);
  };
}

interface TabElementProps {
  tabKey: Key;
  elementProps: ElementProps;
  values: TabRenderProps;
  render: Render | undefined;
}

/**
 * The element React Aria draws for a tab, with what its own lacks: a place in the tab order from the first
 * render (`stopOf`), and a click that reaches it with no pointerdown before it followed once, where React Aria
 * would cancel it (`useUnstartedClick`).
 */
function TabElement({ tabKey, elementProps, values, render }: TabElementProps): ReactElement {
  const stop = stopOf(useContext(TabListStateContext));
  const click = useUnstartedClick<HTMLElement>(values.isDisabled);
  const props: ElementProps = {
    ...elementProps,
    tabIndex: stop === null || values.isDisabled ? elementProps.tabIndex : stop === tabKey ? 0 : -1,
    onPointerDown: chain(click.onPointerDown, elementProps.onPointerDown),
    onClickCapture: chain(click.onClickCapture, elementProps.onClickCapture),
  };
  if (render) return render(props as Parameters<Render>[0], values);
  // The anchor's or the div's content is React Aria's, in the props.
  return createElement('href' in elementProps ? 'a' : 'div', props);
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
  render,
  ...props
}: TabProps): ReactElement {
  const changedId = useId();
  const describedBy = props['aria-describedby'];
  const isLink = props.href !== undefined;
  const { id } = props;
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
  const draw: Render = (elementProps, values) => (
    <TabElement tabKey={id} elementProps={elementProps} values={values} render={render} />
  );
  return (
    <RACTab
      {...props}
      ref={tabRef}
      render={draw}
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
