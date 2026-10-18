import { createElement, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../utils/cx';
import { clampPage, pageForSize, pageItems, pageSizesOf } from './pages';
import { PaginationButton } from './PaginationButton';
import { PaginationLink } from './PaginationLink';
import { PaginationPageSize } from './PaginationPageSize';
import { PaginationStatus } from './PaginationStatus';

export interface PaginationLabels {
  /**
   * The navigation landmark's name, which tells this row from the page's other navigation.
   * @default 'Pagination'
   */
  navigation: string;
  /**
   * The step to the page before. Shown beside its chevron when the row has room, and its hidden name otherwise.
   * @default 'Previous'
   */
  previous: string;
  /**
   * The step to the page after. Shown beside its chevron when the row has room, and its hidden name otherwise.
   * @default 'Next'
   */
  next: string;
  /** A page control's name, given the page's written label. @default (label) => `Page ${label}` */
  page: (label: string) => string;
  /** The page size picker's visible label, which names it. @default 'Rows per page' */
  pageSize: string;
}

interface PaginationBase extends Omit<HTMLAttributes<HTMLElement>, 'children' | 'onChange' | 'aria-label'> {
  /** The current page, counted from 1. */
  page: number;
  /** How many pages there are, in whole pages. A count that is not a finite number means none. */
  pageCount: number;
  /** The range, formatted by the app: "1 to 50 of 1,284". Shown, and spoken after a change. */
  rangeLabel: string;
  /**
   * How a page number, and a page size in the picker, is written, such as Persian digits. Runs in the shell.
   * @default String(page)
   */
  pageLabel?: (page: number) => string;
  /** Page numbers shown each side of the current one, in whole pages. A non-finite value means 1. @default 1 */
  siblingCount?: number;
  /**
   * Shows numbered pages and gaps between Previous and Next when the row is at least 30rem wide. Off, the row is
   * Previous, the range and Next at every width.
   * @default true
   */
  hasPageNumbers?: boolean;
  /** The library's own words: the landmark's name, Previous, Next, each page control's name and the picker's label. */
  labels?: Partial<PaginationLabels>;
  ref?: Ref<HTMLElement>;
}

/** No page size picker. */
interface PaginationFixedSize {
  pageSize?: undefined;
  pageSizeOptions?: undefined;
  onPageSizeChange?: undefined;
}
/**
 * A rows-per-page picker at the row's start. It calls a function, so render Pagination from a client component
 * to show it, in either mode.
 */
interface PaginationSizes {
  /** The rows on a page, the picker's value. */
  pageSize: number;
  /**
   * The sizes the picker offers, in whole rows, smallest first; `pageSize` is always among them.
   * @default [10, 25, 50, 100]
   */
  pageSizeOptions?: readonly number[];
  /**
   * Called with the size chosen and the page that holds the first row of the current page at that size, so the
   * reader keeps their place. Set both, and write a new `rangeLabel`, which is spoken once it settles.
   */
  onPageSizeChange: (pageSize: number, page: number) => void;
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

export type PaginationProps = PaginationBase &
  (PaginationLinks | PaginationButtons) &
  (PaginationFixedSize | PaginationSizes);

const DEFAULT_LABELS: PaginationLabels = {
  navigation: 'Pagination',
  previous: 'Previous',
  next: 'Next',
  page: (label) => `Page ${label}`,
  pageSize: 'Rows per page',
};

/** The sizes the picker offers when the app names none. */
const PAGE_SIZES: readonly number[] = [10, 25, 50, 100];

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
 * slots never move, and with `onPageSizeChange` a rows-per-page picker at its start. Static: it has no hooks and no
 * client directive, so a server page renders it and passes functions; it calls `getPageHref`, `pageLabel` and
 * `labels.page` here, and its client leaves (the links or buttons and the status) receive only strings, numbers,
 * booleans and the children it renders. The picker and button mode call the app's functions, so a client
 * component renders them.
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
    pageSize,
    pageSizeOptions = PAGE_SIZES,
    onPageSizeChange,
    className,
    ...rest
  } = props;
  const labels: PaginationLabels = {
    navigation: given?.navigation ?? DEFAULT_LABELS.navigation,
    previous: given?.previous ?? DEFAULT_LABELS.previous,
    next: given?.next ?? DEFAULT_LABELS.next,
    page: given?.page ?? DEFAULT_LABELS.page,
    pageSize: given?.pageSize ?? DEFAULT_LABELS.pageSize,
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
  // JSX nav does not take. The size container is the box inside the nav, not the nav: the nav takes its width
  // from the narrow row, which pagination.css draws from `data-range` (the range again, hidden), so a parent
  // that sizes the nav from its content gives it room for the range between the steps.
  return createElement(
    'nav',
    {
      ...rest,
      'aria-label': labels.navigation,
      className: cx('pagination', className),
      'data-range': rangeLabel,
    },
    <div className="pagination-box">
      <div className="pagination-row" data-page-numbers={hasPageNumbers ? undefined : 'false'}>
        {pageSize !== undefined ? (
          <PaginationPageSize
            label={labels.pageSize}
            value={pageSize}
            options={pageSizesOf(pageSizeOptions, pageSize).map((size) => ({ size, text: write(size) }))}
            onChange={(size) => {
              onPageSizeChange(size, pageForSize(current, pageSize, size));
            }}
          />
        ) : null}
        <p className="pagination-range">{rangeLabel}</p>
        {count > 1 ? (
          <ol className="pagination-list">
            {stepItem('previous')}
            {items}
            {stepItem('next')}
          </ol>
        ) : null}
      </div>
    </div>,
    <PaginationStatus rangeLabel={rangeLabel} warning={warning} />,
  );
}
