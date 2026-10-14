import { createElement, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../utils/cx';
import { clampPage, pageItems } from './pages';
import { PaginationButton } from './PaginationButton';
import { PaginationLink } from './PaginationLink';
import { PaginationStatus } from './PaginationStatus';

export interface PaginationLabels {
  /**
   * The navigation landmark's name, which tells this row from the page's other navigation.
   * @default 'Pagination'
   */
  navigation: string;
  /**
   * The name of the step to the page before: shown beside its chevron where the row has room, and its hidden name
   * where it does not.
   * @default 'Previous'
   */
  previous: string;
  /**
   * The name of the step to the page after: shown beside its chevron where the row has room, and its hidden name
   * where it does not.
   * @default 'Next'
   */
  next: string;
  /** A page control's name, given the page's written label. @default (label) => `Page ${label}` */
  page: (label: string) => string;
}

interface PaginationBase extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'aria-label'> {
  /** The current page, counted from 1. */
  page: number;
  /** How many pages there are, in whole pages; a count that is not a finite number is none. */
  pageCount: number;
  /** The range, formatted by the app: "1 to 50 of 1,284". Shown, and spoken after a change. */
  rangeLabel: string;
  /** How a page number is written, such as Persian digits. Runs in the shell. @default String(page) */
  pageLabel?: (page: number) => string;
  /** Page numbers shown each side of the current one, in whole pages; one that is not a finite number is 1. @default 1 */
  siblingCount?: number;
  /**
   * Shows the numbered pages and their gaps between Previous and Next while the row is 30rem wide or more. Off,
   * the short form: Previous, the range and Next at every width.
   * @default true
   */
  hasPageNumbers?: boolean;
  /** The library's own words: the landmark's name, Previous, Next and each page control's name. */
  labels?: Partial<PaginationLabels>;
  ref?: Ref<HTMLElement>;
}

/** Link mode: every control is a link. Pass it from a server component; the function runs there. */
interface PaginationLinks {
  getPageHref: (page: number) => string;
  onPageChange?: undefined;
}
/** Button mode: every control is a button. Use it from a client component. */
interface PaginationButtons {
  onPageChange: (page: number) => void;
  getPageHref?: undefined;
}

export type PaginationProps = PaginationBase & (PaginationLinks | PaginationButtons);

const DEFAULT_LABELS: PaginationLabels = {
  navigation: 'Pagination',
  previous: 'Previous',
  next: 'Next',
  page: (label) => `Page ${label}`,
};

/**
 * Lucide's chevron geometry, drawn inline: lucide-react's Icon is a client module, and the shell is static.
 * Hidden, since the step's word names it.
 */
const chevron = (d: string): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
  >
    <path d={d} />
  </svg>
);

/** Previous points to the inline start and Next to the end; `pagination.css` mirrors both in right to left. */
const CHEVRONS = { previous: chevron('m15 18-6-6 6-6'), next: chevron('m9 18 6-6-6-6') } as const;

interface ControlProps {
  className: string;
  'aria-label'?: string;
  isCurrent?: boolean;
  isDisabled?: boolean;
  step?: 'previous' | 'next';
  children: ReactNode;
}

/**
 * Pages of rows: Previous, numbered pages with gaps and Next beside the range the app formats, in a row whose
 * slots never move. Static: it has no hooks and no client directive, so a server page renders it and passes
 * functions; it calls `getPageHref`, `pageLabel` and `labels.page` here, and its client leaves (the links or
 * buttons and the status) receive only strings, numbers, booleans and the children it renders.
 */
export function Pagination(props: PaginationProps): ReactElement {
  const {
    page,
    pageCount,
    rangeLabel,
    pageLabel,
    siblingCount = 1,
    hasPageNumbers = true,
    labels: given,
    getPageHref,
    onPageChange,
    className,
    ...rest
  } = props;
  const labels: PaginationLabels = {
    navigation: given?.navigation ?? DEFAULT_LABELS.navigation,
    previous: given?.previous ?? DEFAULT_LABELS.previous,
    next: given?.next ?? DEFAULT_LABELS.next,
    page: given?.page ?? DEFAULT_LABELS.page,
  };
  const write = (n: number): string => (pageLabel === undefined ? String(n) : pageLabel(n));
  // The inputs cleaned once, and only these used below: whole pages, none for a count that is not a finite
  // number, and the default siblings for a siblingCount that is not one.
  const count = Number.isFinite(pageCount) ? Math.max(0, Math.trunc(pageCount)) : 0;
  const siblings = Number.isFinite(siblingCount) ? Math.max(0, Math.trunc(siblingCount)) : 1;
  const current = clampPage(page, count);
  const warning =
    current === page
      ? undefined
      : count === 0
        ? `Pagination: page ${String(page)} is not a page, since there are no pages; showing the range alone.`
        : `Pagination: page ${String(page)} is not a page of 1 to ${String(count)}; showing page ${String(current)}.`;

  /** A control that goes to page `target`: a link built from `getPageHref`, or a button calling `onPageChange`. */
  const control = (target: number, { isDisabled = false, ...each }: ControlProps): ReactElement =>
    getPageHref === undefined ? (
      <PaginationButton {...each} isDisabled={isDisabled} page={target} onPageChange={onPageChange} />
    ) : (
      // A disabled step goes nowhere, so the app's function is not asked for a page outside the range.
      <PaginationLink {...each} isDisabled={isDisabled} href={isDisabled ? undefined : getPageHref(target)} />
    );

  const stepItem = (which: 'previous' | 'next'): ReactElement => {
    const target = which === 'previous' ? current - 1 : current + 1;
    return (
      <li key={which} className="pagination-item" data-kind="step">
        {control(target, {
          className: 'pagination-control pagination-step',
          isDisabled: target < 1 || target > count,
          step: which,
          children: (
            <>
              {CHEVRONS[which]}
              <span className="pagination-step-label">{labels[which]}</span>
            </>
          ),
        })}
      </li>
    );
  };

  const items = hasPageNumbers
    ? pageItems(current, count, siblings).map((item) => {
        if (item.type === 'gap')
          return (
            <li key={`gap-${item.side}`} className="pagination-item" data-kind="gap">
              <span className="pagination-gap" aria-hidden="true">
                {'…'}
              </span>
            </li>
          );
        const text = write(item.page);
        return (
          <li key={item.page} className="pagination-item" data-kind="page">
            {control(item.page, {
              className: 'pagination-control pagination-page',
              'aria-label': labels.page(text),
              isCurrent: item.page === current,
              children: text,
            })}
          </li>
        );
      })
    : null;

  // createElement, as StatTile builds its root: the ref, which rides in `rest`, is an HTMLElement ref, which a
  // JSX nav does not take.
  return createElement(
    'nav',
    { ...rest, 'aria-label': labels.navigation, className: cx('pagination', className) },
    <div className="pagination-row" data-page-numbers={hasPageNumbers ? undefined : 'false'}>
      <p className="pagination-range">{rangeLabel}</p>
      {count > 1 ? (
        <ol className="pagination-list">
          {stepItem('previous')}
          {items}
          {stepItem('next')}
        </ol>
      ) : null}
    </div>,
    <PaginationStatus rangeLabel={rangeLabel} warning={warning} />,
  );
}
