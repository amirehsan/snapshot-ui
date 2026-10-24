'use client';

import { ChevronDown } from 'lucide-react';
import {
  Children,
  createContext,
  Fragment,
  isValidElement,
  useContext,
  useId,
  useRef,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosureGroup as RACDisclosureGroup,
  DisclosureGroupStateContext,
  DisclosurePanel as RACDisclosurePanel,
  type DisclosureGroupProps as RACDisclosureGroupProps,
  type Key,
} from 'react-aria-components';
import { Button } from '../button/Button';
import { useHoldsChange, useOpenOnInvalid } from '../collapsible-card/useFoldedFields';
import { useFolding } from '../collapsible-card/useFolding';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useWarnOnce } from '../utils/useWarnOnce';
import { ACCORDION_KEYS, nextToggle, ownToggles } from './moves';

export interface AccordionLabels {
  /** The "show all" button while any item is folded. @default 'Show all sections' */
  showAll: string;
  /** The same button while every item is open. @default 'Hide all sections' */
  hideAll: string;
}

export interface AccordionProps extends Omit<
  RACDisclosureGroupProps,
  'className' | 'children' | 'allowsMultipleExpanded' | 'render'
> {
  /** AccordionItem elements, in order. */
  children: ReactNode;
  /**
   * Several items open at once. Off, opening one folds the one that was open.
   * @default true (React Aria's own default is false)
   */
  allowsMultipleExpanded?: boolean;
  /** The heading element of every item's title. The look is the same at every level. @default 3 */
  level?: 2 | 3 | 4 | 5 | 6;
  /** Shows a tertiary "Show all sections" button above the items. Needs `allowsMultipleExpanded`. @default false */
  hasExpandAll?: boolean;
  labels?: Partial<AccordionLabels>;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title' | 'id'> {
  /** The item's key, matching `expandedKeys`. Required, so a controlled accordion can name it. */
  id: Key;
  /** The title: the toggle's text and its accessible name. */
  title: ReactNode;
  /** A line under the title in slate, shown open or folded: "Email, push and digest settings". */
  note?: ReactNode;
  isDisabled?: boolean;
  /** Marks the folded item as changed when no field in its panel reports `data-changed`. */
  isChanged?: boolean;
  /** Read with the toggle while the folded marker shows. @default 'Changed' */
  changedLabel?: string;
  /** The panel's content. */
  children?: ReactNode;
  ref?: Ref<HTMLDivElement>;
}

const DEFAULT_LABELS: AccordionLabels = { showAll: 'Show all sections', hideAll: 'Hide all sections' };

/** An item the accordion found among its children: its key and whether it is disabled. */
interface KnownItem {
  id: Key;
  isDisabled: boolean;
}

/** What an accordion tells its items. */
interface AccordionContextValue {
  level: 2 | 3 | 4 | 5 | 6;
  /** The panel id of every item the accordion found among its children, by the item's key. */
  panelIds: ReadonlyMap<Key, string>;
  /** Whether "Show all sections" is drawn, so an item it cannot see warns. */
  hasExpandAll: boolean;
  /**
   * Claims the one open a check of the form's validity may make in single mode, and says whether this item got
   * it, so a second field that fails in the same check does not fold the item the browser is about to focus a
   * field in. The claim lasts until the next task.
   */
  claimInvalidOpen: () => boolean;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

/**
 * The items among `children`, in order: each `AccordionItem` element, inside fragments and arrays too. An item
 * wrapped in an app's own component is not seen here; it still works, and is left out of Show all.
 */
function knownItems(children: ReactNode): KnownItem[] {
  const found: KnownItem[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === Fragment) {
      found.push(...knownItems((child.props as { children?: ReactNode }).children));
    } else if (child.type === AccordionItem) {
      const { id, isDisabled } = child.props as AccordionItemProps;
      found.push({ id, isDisabled: isDisabled === true });
    }
  });
  return found;
}

/**
 * "Show all sections" (ruling 3): opens every enabled item the accordion knows, or, once every one is open, folds
 * them. A disabled item keeps the state it had, and so does an item the accordion cannot see. It sits inside the
 * group, so it reads the group's state, and the server's HTML already holds its words, its state and the panels
 * it controls.
 */
function ExpandAll({
  items,
  panelIds,
  labels,
}: {
  items: KnownItem[];
  panelIds: ReadonlyMap<Key, string>;
  labels: AccordionLabels;
}): ReactElement | null {
  const state = useContext(DisclosureGroupStateContext);
  if (!state) return null;
  const enabled = items.filter((item) => !item.isDisabled).map((item) => item.id);
  const allOpen = enabled.every((id) => state.expandedKeys.has(id));
  return (
    <div className="accordion-controls">
      <Button
        variant="tertiary"
        className="accordion-expand-all"
        aria-expanded={allOpen}
        aria-controls={[...panelIds.values()].join(' ')}
        isDisabled={state.isDisabled}
        onPress={() => {
          const keys = new Set(state.expandedKeys);
          for (const id of enabled) {
            if (allOpen) keys.delete(id);
            else keys.add(id);
          }
          state.setExpandedKeys(keys);
        }}
      >
        {allOpen ? labels.hideAll : labels.showAll}
      </Button>
    </div>
  );
}

/**
 * Sections that open and fold, each a heading whose button shows or hides a panel, on React Aria's
 * DisclosureGroup. Several items may be open at once by default. Arrow Up, Arrow Down, Home and End move focus
 * between its own titles, with no wrap. With `hasExpandAll`, a "Show all sections" button comes first. Each item
 * folds with CollapsibleCard's fold, marks a change held in a folded panel, and opens for an invalid field and for
 * find-in-page.
 */
export function Accordion({
  children,
  allowsMultipleExpanded = true,
  level = 3,
  hasExpandAll = false,
  labels,
  className,
  ref,
  ...props
}: AccordionProps): ReactElement {
  const base = useId();
  const openedForInvalid = useRef(false);
  const claimInvalidOpen = (): boolean => {
    if (openedForInvalid.current) return false;
    openedForInvalid.current = true;
    setTimeout(() => {
      openedForInvalid.current = false;
    });
    return true;
  };
  const items = knownItems(children);
  const panelIds = new Map(items.map((item, index) => [item.id, `${base}-panel-${String(index)}`]));
  const showsExpandAll = hasExpandAll && allowsMultipleExpanded;
  useWarnOnce(
    hasExpandAll && !allowsMultipleExpanded
      ? 'Accordion: hasExpandAll needs allowsMultipleExpanded, so "Show all sections" is not drawn while one item at a time may be open.'
      : null,
  );
  const onKey = (event: KeyboardEvent<HTMLDivElement>): void => {
    const { key, target, currentTarget } = event;
    if (!ACCORDION_KEYS.includes(key) || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
      return;
    if (!(target instanceof HTMLButtonElement) || !ownToggles(currentTarget).includes(target)) return;
    event.preventDefault();
    nextToggle(ownToggles(currentTarget, true), target, key)?.focus();
  };
  return (
    <RACDisclosureGroup
      {...props}
      ref={ref}
      allowsMultipleExpanded={allowsMultipleExpanded}
      className={cx('accordion', className)}
      data-multiple={allowsMultipleExpanded ? '' : undefined}
      // React Aria's group passes on no key handler, so the keys are heard on its element as it draws it.
      render={(group) => (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- the toggles are the controls; the root only hears their arrows on the way up (spec 5.4)
        <div {...group} onKeyDown={onKey} />
      )}
    >
      <AccordionContext.Provider value={{ level, panelIds, hasExpandAll: showsExpandAll, claimInvalidOpen }}>
        {showsExpandAll ? (
          <ExpandAll items={items} panelIds={panelIds} labels={{ ...DEFAULT_LABELS, ...labels }} />
        ) : null}
        {children}
      </AccordionContext.Provider>
    </RACDisclosureGroup>
  );
}

/**
 * One section of an Accordion: a heading whose button shows or hides the panel under it, with an optional note
 * under the title. The item is its own root around React Aria's Disclosure, as CollapsibleCard's card is, since
 * the fold's hooks mark and listen on the fold's grandparent; it reads the group's state from React Aria's
 * context, and the hooks run unchanged. Outside an Accordion it renders open, its toggle disabled, and warns.
 */
export function AccordionItem({
  id,
  title,
  note,
  isDisabled = false,
  isChanged = false,
  changedLabel = 'Changed',
  className,
  children,
  ref,
  ...props
}: AccordionItemProps): ReactElement {
  const accordion = useContext(AccordionContext);
  const group = useContext(DisclosureGroupStateContext);
  const isInside = accordion !== null && group !== null;
  const ownPanelId = useId();
  const knownPanelId = accordion?.panelIds.get(id);
  const panelId = knownPanelId ?? ownPanelId;
  let warning: string | null = null;
  if (!isInside) {
    warning =
      'AccordionItem belongs in an Accordion. Outside one it is drawn open with its toggle disabled, so its content is never hidden.';
  } else if (accordion.hasExpandAll && knownPanelId === undefined) {
    warning = `Accordion: the item "${String(id)}" is not among the accordion's own children, so "Show all sections" leaves it out.`;
  }
  useWarnOnce(warning);
  const isExpanded = group ? group.expandedKeys.has(id) : true;
  const foldRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isInstant = useFolding(foldRef, toggleRef, isExpanded);
  const holdsChange = useHoldsChange(foldRef, !isExpanded);
  useOpenOnInvalid(foldRef, !isExpanded, () => {
    if (!group || group.expandedKeys.has(id)) return;
    // One at a time, the browser focuses only the first field that failed, so only its item opens.
    if (!group.allowsMultipleExpanded && accordion && !accordion.claimInvalidOpen()) return;
    group.toggleKey(id);
  });
  const isMarked = !isExpanded && (isChanged || holdsChange);
  const { chipId, describedBy } = useChangedDescription({ isChanged: isMarked });
  const Heading = `h${String(accordion?.level ?? 3)}` as 'h3';
  const isOff = isDisabled || !isInside || group.isDisabled;
  return (
    <div
      {...props}
      ref={ref}
      className={cx('accordion-item', className)}
      data-expanded={isExpanded ? '' : undefined}
      data-instant={isInstant ? '' : undefined}
      data-disabled={isOff ? '' : undefined}
      data-changed={isChanged ? '' : undefined}
    >
      <RACDisclosure
        id={id}
        className="accordion-disclosure"
        isDisabled={isDisabled || !isInside}
        isExpanded={isInside ? undefined : true}
      >
        <Heading className="accordion-heading">
          <RACButton
            ref={toggleRef}
            slot="trigger"
            className="accordion-toggle"
            aria-controls={panelId}
            aria-describedby={describedBy}
          >
            <span className="accordion-toggle-text">
              {title}
              {isMarked ? <span className="accordion-marker" aria-hidden="true" /> : null}
            </span>
            <ChevronDown className="accordion-chevron" aria-hidden="true" />
          </RACButton>
        </Heading>
        {isMarked ? (
          <span id={chipId} className="accordion-marker-label" hidden>
            {changedLabel}
          </span>
        ) : null}
        {present(note) ? <p className="accordion-note">{note}</p> : null}
        {/* React Aria merges an id given to the panel with its own only in a browser, so the server would write
            its own: the panel's element takes the accordion's id here, the same on both. */}
        <RACDisclosurePanel
          ref={foldRef}
          className="accordion-fold"
          render={(panel) => <div {...panel} id={panelId} />}
        >
          <div className="accordion-body">{children}</div>
        </RACDisclosurePanel>
      </RACDisclosure>
    </div>
  );
}
