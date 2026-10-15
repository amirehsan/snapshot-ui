'use client';

import { ChevronDown, ListFilter } from 'lucide-react';
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import { Button as RACButton, Dialog, DialogTrigger } from 'react-aria-components';
import { Badge } from '../badge/Badge';
import { Button } from '../button/Button';
import { FilterChipPlaceContext } from '../filter-chip/FilterChip';
import { Popover } from '../popover/Popover';
import { Sheet, SheetTrigger } from '../sheet/Sheet';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { censusOf, rowOrder } from './walk';

export interface FilterBarLabels {
  /** The row's name, the phone button's text and the sheet's title. @default 'Filters' */
  filters: string;
  /** @default 'More' */
  more: string;
  /** @default 'Clear all' */
  clearAll: string;
  /** The sheet's closing button; the app may pass "Show 128 results". @default 'Done' */
  done: string;
  /** The visible word of each section's clear button in More and the sheet; its name is the chip's. @default 'Clear' */
  clear: string;
}

export interface FilterBarProps {
  /** `FilterChip`s, directly or in fragments, in the order they show. Their labels are unique in the bar. */
  children: ReactNode;
  /** A SearchField, first in the row and kept beside the Filters button on a phone. */
  search?: ReactNode;
  /** Clears every filter in one URL write. Shows Clear all while any filter is active. */
  onClearAll?: () => void;
  /** The number of active filters, for chips wrapped in the app's own components. @default counted from children */
  activeCount?: number;
  /** How the count is written, such as in Persian digits. @default String */
  formatCount?: (count: number) => string;
  labels?: Partial<FilterBarLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

const DEFAULT_LABELS: FilterBarLabels = {
  filters: 'Filters',
  more: 'More',
  clearAll: 'Clear all',
  done: 'Done',
  clear: 'Clear',
};

const nothing = (): void => undefined;

/**
 * Where focus goes once a commit has taken away the element that held it: the first chip after Clear all leaves,
 * More after a secondary chip leaves the row with its value or as its list closes without one, and the chip the
 * panel made active after More leaves as its panel closes. Focus never rests on the body (2.4.3).
 */
interface FocusAfter {
  /** The element that held focus, which the commit is expected to take away. */
  from: Element;
  to: 'first' | 'more' | 'panel';
  /** The labels the closing panel held, for `panel`. */
  labels: ReadonlySet<string>;
}

/** The text of a chip trigger's label. */
const labelOf = (trigger: Element): string | null =>
  trigger.querySelector('.filter-chip-label')?.textContent ?? null;

/** The event React Aria, and the Sheet, dispatch on the element they give focus back to as an overlay closes. */
const RESTORE_EVENT = 'react-aria-focus-scope-restore';

/**
 * The filters of a list page: the app's search first, then the chips in a group that wraps, "More" holding the
 * inactive secondary chips as sections of a panel, and Clear all while any filter is active. Under 768px of
 * viewport the row gives way to one Filters button, with the active count, that opens one sheet holding every
 * filter as a section; it is live, so each change writes at once and Done only closes it. The count is read
 * from the chips' props, through fragments, so the server's HTML holds it; nothing is measured, the row wraps.
 */
export function FilterBar({
  children,
  search,
  onClearAll,
  activeCount,
  formatCount = String,
  labels,
  className,
  ref,
  ...props
}: FilterBarProps): ReactElement {
  const names: FilterBarLabels = { ...DEFAULT_LABELS, ...labels };
  const census = censusOf(children);
  const count = activeCount ?? census.active;
  // The labels the open More panel took as it opened, kept until it closes, so a choice made in it never
  // unmounts the field in use (spec correction 29); null while closed.
  const [panelLabels, setPanelLabels] = useState<ReadonlySet<string> | null>(null);
  // The secondary chips in the row whose list or panel is open. A change there may leave such a chip with no
  // value, and it stays in the row until it closes, so the list in use never unmounts. Held here, not in the
  // chip: the close must re-render the bar, whose effects then give focus to More.
  const [heldInRow, setHeldInRow] = useState<ReadonlySet<string>>(() => new Set());
  // More stays while its panel is open, though a choice there may have left nothing behind it.
  const hasMore = census.inactiveSecondary.length > 0 || panelLabels !== null;
  const hasClearAll = count > 0 && onClearAll !== undefined;
  const rowRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLButtonElement>(null);
  const sheetButtonRef = useRef<HTMLButtonElement>(null);
  const focusAfter = useRef<FocusAfter | null>(null);

  const expectLeave = (
    to: FocusAfter['to'],
    from: Element | null,
    held: ReadonlySet<string> = new Set(),
  ): void => {
    focusAfter.current = from === null ? null : { from, to, labels: held };
  };

  /** The triggers of the row's chips, More left out, in the order they show. */
  const rowChips = (): HTMLElement[] =>
    [...(rowRef.current?.querySelectorAll<HTMLElement>('.filter-chip-trigger') ?? [])].filter(
      (trigger) => trigger !== moreRef.current,
    );

  /**
   * Moves focus once the element that held it has gone; forgets it once focus has moved on by itself. Focus on
   * the body is focus in transit, as a closing list leaves it, so the move still waits for the element to go.
   */
  const settleFocus = (when: 'layout' | 'passive'): void => {
    const pending = focusAfter.current;
    if (pending === null) return;
    // The panel's case waits for the passive phase, where React Aria lifts the inert page its popover made.
    if (pending.to === 'panel' && when === 'layout') return;
    const active = document.activeElement;
    const isInTransit = active === null || active === document.body;
    if (pending.from.isConnected) {
      if (active !== pending.from && !isInTransit) focusAfter.current = null;
      return;
    }
    if (!isInTransit) {
      focusAfter.current = null;
      return;
    }
    const chips = rowChips();
    const more = moreRef.current;
    const target =
      pending.to === 'more'
        ? (more ?? chips[0])
        : pending.to === 'panel'
          ? (chips.find((trigger) => pending.labels.has(labelOf(trigger) ?? '')) ?? more ?? chips[0])
          : (chips[0] ?? more);
    // In Chromium the inert page a closing popover made lifts only in the passive phase, and an inert element
    // takes no focus, so the move waits for it.
    if (when === 'layout' && target?.closest('[inert]')) return;
    focusAfter.current = null;
    target?.focus();
  };

  // Every commit: a value the app writes through its URL may arrive several renders after the press.
  useLayoutEffect(() => {
    settleFocus('layout');
  });
  useEffect(() => {
    settleFocus('passive');
  });

  // The sheet gives focus back to the Filters button as it closes. A phone turned past 768px with the sheet open
  // has hidden the button, which then takes no focus, so the row's first chip takes it in its place.
  useEffect(() => {
    const button = sheetButtonRef.current;
    if (button === null) return;
    const onRestore = (event: Event): void => {
      if (getComputedStyle(button).display !== 'none') return;
      const first = [...(rowRef.current?.querySelectorAll<HTMLElement>('.filter-chip-trigger') ?? [])][0];
      if (first === undefined) return;
      event.preventDefault();
      first.focus({ preventScroll: true });
    };
    button.addEventListener(RESTORE_EVENT, onRestore);
    return () => {
      button.removeEventListener(RESTORE_EVENT, onRestore);
    };
  }, []);

  const closePanel = (): void => {
    if (panelLabels !== null) expectLeave('panel', moreRef.current, panelLabels);
    setPanelLabels(null);
  };

  // What every place shares: the chips More holds, the sections' clear word, and the row's report of a secondary
  // chip cleared there, called with focus on its trigger, so More takes focus once the chip has left the row.
  const shared = {
    behindMore: new Set(
      census.inactiveSecondary.filter((label) => !heldInRow.has(label)),
    ) as ReadonlySet<string>,
    clearWord: names.clear,
    onSecondaryCleared: (): void => {
      expectLeave('more', document.activeElement);
    },
    onRowOpenChange: (label: string, isOpen: boolean): void => {
      if (!isOpen) {
        // The chip leaves for More as it closes if it has no value by then, or once the app's value arrives. What
        // is expected to leave is its trigger: focus is still in the closing list, which goes either way.
        const trigger = rowChips().find((each) => labelOf(each) === label);
        expectLeave('more', trigger ?? document.activeElement);
      }
      setHeldInRow((held) => {
        if (held.has(label) === isOpen) return held;
        const next = new Set(held);
        if (isOpen) next.add(label);
        else next.delete(label);
        return next;
      });
    },
  };

  return (
    <div {...props} ref={ref} className={cx('filter-bar', className)}>
      {present(search) ? <div className="filter-bar-search">{search}</div> : null}
      <div ref={rowRef} className="filter-bar-row" role="group" aria-label={names.filters}>
        <FilterChipPlaceContext value={{ ...shared, place: 'row', panelLabels: null, close: nothing }}>
          {rowOrder(children)}
        </FilterChipPlaceContext>
        {hasMore ? (
          <DialogTrigger
            isOpen={panelLabels !== null}
            onOpenChange={(isOpen) => {
              if (isOpen) setPanelLabels(new Set(census.inactiveSecondary));
              else closePanel();
            }}
          >
            <div className="filter-chip filter-bar-more" data-open={panelLabels !== null ? '' : undefined}>
              <RACButton ref={moreRef} className="filter-chip-trigger">
                <span className="filter-chip-label">{names.more}</span>
                <span className="filter-chip-chevron" aria-hidden="true">
                  <ChevronDown />
                </span>
              </RACButton>
            </div>
            <Popover className="filter-bar-more-panel" isPadded placement="bottom start">
              <Dialog className="filter-bar-more-dialog">
                <FilterChipPlaceContext value={{ ...shared, place: 'panel', panelLabels, close: closePanel }}>
                  {children}
                </FilterChipPlaceContext>
              </Dialog>
            </Popover>
          </DialogTrigger>
        ) : null}
      </div>
      {hasClearAll ? (
        <Button
          variant="tertiary"
          className="filter-bar-clear-all"
          onPress={(event) => {
            // Clear all leaves with the last active filter, so the first chip takes focus after the commit.
            expectLeave('first', event.target);
            onClearAll();
          }}
        >
          {names.clearAll}
        </Button>
      ) : null}
      <SheetTrigger>
        <Button ref={sheetButtonRef} variant="secondary" className="filter-bar-sheet-button">
          <ListFilter aria-hidden="true" />
          {names.filters}
          {count > 0 ? (
            <>
              {/* A space the flex row does not draw, so the name reads "Filters 2", as the text does. */}{' '}
              <Badge>{formatCount(count)}</Badge>
            </>
          ) : null}
        </Button>
        <Sheet
          title={names.filters}
          footer={
            <div className="filter-bar-sheet-actions">
              {hasClearAll ? (
                <Button
                  variant="tertiary"
                  className="filter-bar-sheet-clear-all"
                  onPress={() => {
                    onClearAll();
                    // Clear all leaves with the last active filter; Done stays, so it takes focus.
                    doneRef.current?.focus();
                  }}
                >
                  {names.clearAll}
                </Button>
              ) : null}
              <Button ref={doneRef} slot="close" variant="primary">
                {names.done}
              </Button>
            </div>
          }
        >
          {/* Only Done, a swipe, Escape and the close button close the sheet (ruling 9). */}
          <FilterChipPlaceContext value={{ ...shared, place: 'sheet', panelLabels: null, close: nothing }}>
            {children}
          </FilterChipPlaceContext>
        </Sheet>
      </SheetTrigger>
    </div>
  );
}
