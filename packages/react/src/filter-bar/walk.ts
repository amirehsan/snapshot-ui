import { Children, Fragment, createElement, isValidElement, type ReactNode } from 'react';
import { FilterChip, type FilterChipProps } from '../filter-chip/FilterChip';
import { present } from '../utils/present';

/** Whether a FilterChip's props say it has a value: a list chip by its value, a custom chip by its valueLabel. */
const isActive = (props: FilterChipProps): boolean =>
  props.selectionMode === undefined
    ? present(props.valueLabel)
    : Array.isArray(props.value)
      ? props.value.length > 0
      : props.value !== null;

/** The props of `node` when it is a FilterChip element the bar can read, else null. */
const chipProps = (node: ReactNode): FilterChipProps | null =>
  isValidElement(node) && node.type === FilterChip ? (node.props as FilterChipProps) : null;

/**
 * Each node of `children` that is not a fragment, through fragments, with a key that is unique across them:
 * the keys React gives each level, joined from the top.
 */
function flatten(children: ReactNode, prefix = ''): [key: string, node: ReactNode][] {
  return Children.toArray(children).flatMap((child, index): [string, ReactNode][] => {
    // Children.toArray keys every element; a text node has no key, so its place names it.
    const key = `${prefix}${isValidElement(child) ? String(child.key) : `#${String(index)}`}`;
    if (isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment) {
      return flatten(child.props.children, `${key}/`);
    }
    return [[key, child]];
  });
}

/**
 * The bar's census, read from its children's props through fragments as BottomTabBar counts its items: how many
 * chips are active, and the labels of the inactive secondary ones. A chip wrapped in the app's own component is
 * not read; `activeCount` covers its count, and it stays in the row (plan, spec correction 29).
 */
export function censusOf(children: ReactNode): { active: number; inactiveSecondary: string[] } {
  const census = { active: 0, inactiveSecondary: [] as string[] };
  for (const [, node] of flatten(children)) {
    const props = chipProps(node);
    if (props === null) continue;
    if (isActive(props)) census.active += 1;
    else if (props.isSecondary === true) census.inactiveSecondary.push(props.label);
  }
  return census;
}

/**
 * The children in the row's order: the declared order, through fragments, with each secondary chip the bar can
 * read moved after the rest, so an active secondary chip shows after the primary ones (spec 9.2). Each node is
 * keyed by its place in the tree, so a chip that moves keeps its state. A wrapped chip stays where it is declared.
 */
export function rowOrder(children: ReactNode): ReactNode[] {
  const nodes = flatten(children);
  const isSecondary = ([, node]: [string, ReactNode]): boolean => chipProps(node)?.isSecondary === true;
  return [...nodes.filter((each) => !isSecondary(each)), ...nodes.filter(isSecondary)].map(([key, node]) =>
    createElement(Fragment, { key }, node),
  );
}
