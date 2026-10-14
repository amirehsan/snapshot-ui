'use client';

import { Kbd } from '@snapshot-ui/react';
import { useFetchSearch } from 'fumadocs-core/search/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';

const KIND = { page: 'Page', heading: 'Section', text: 'Text' } as const;

/** Search over every docs page, in a native modal dialog. */
export function SearchDialog({
  open,
  onOpenChange,
  onNavigate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Called when a result is chosen, before the dialog closes. Whatever was open
   * behind the search belongs to the page it was opened on, and a result may
   * leave that page, or stay on it and move to a heading, which no change of
   * path announces.
   */
  onNavigate?: () => void;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const router = useRouter();
  const { search, onSearchChange, data, isLoading, error } = useFetchSearch();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  // `data` is the last search that finished, and stays while the next one loads.
  // Only results for what is in the field now may be listed, counted or opened.
  const current = data?.query === search ? data : undefined;
  const results = (current?.items ?? []).filter((item) => item.type !== 'table').slice(0, 12);

  // Arrow keys move between the input and the results.
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = [...(dialog.current?.querySelectorAll<HTMLElement>('.search-input, .search-result') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = items[Math.min(Math.max(index + (event.key === 'ArrowDown' ? 1 : -1), 0), items.length - 1)];
    if (next) {
      event.preventDefault();
      next.focus();
    }
  };

  const close = (): void => {
    onOpenChange(false);
  };

  const choose = (): void => {
    // The dialog closes first, so the focus it gives back to what opened it lands before whatever
    // onNavigate closes takes the focus on, and the last word is the caller's.
    dialog.current?.close();
    onNavigate?.();
    close();
  };

  // Enter in the field opens the first result, as the footer promises. On a
  // result, Enter is the link's own.
  const first = results[0];
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing || !first) return;
    event.preventDefault();
    router.push(first.url);
    choose();
  };

  // One status region, mounted before its text changes so that a screen reader
  // announces the outcome of each search. Only the two dead ends are also shown:
  // a "Searching" line would flash on every keystroke.
  const noMatch = current !== undefined && results.length === 0;
  const failed = !isLoading && current === undefined && error !== undefined;
  const status =
    search.length === 0
      ? ''
      : results.length > 0
        ? `${String(results.length)} ${results.length === 1 ? 'result' : 'results'}`
        : noMatch
          ? `Nothing matches "${search}"`
          : failed
            ? 'Search failed. Try again.'
            : 'Searching';

  return (
    // The dialog closes on Escape natively; a click on the backdrop lands on the dialog itself.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      className="search-dialog"
      aria-label="Search the docs"
      onClose={close}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <div className="search-dialog-field">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          className="search-input"
          type="search"
          placeholder="Search components and guides"
          aria-label="Search"
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
          onKeyDown={onInputKeyDown}
        />
        <Kbd>esc</Kbd>
      </div>
      {/* A fixed floor under the results, so the dialog does not shrink and grow with every keystroke. */}
      <div className="search-body">
        <p className={noMatch || failed ? 'search-empty' : 'visually-hidden'} role="status">
          {status}
        </p>
        {results.length > 0 ? (
          <ul className="search-results">
            {results.map((item) => (
              <li key={item.id}>
                <Link className="search-result" href={item.url} onClick={choose}>
                  <span>{item.content}</span>
                  <span className="search-result-kind">{KIND[item.type]}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      <div className="search-foot">
        <span>
          <Kbd>&#8593;</Kbd> <Kbd>&#8595;</Kbd> to move
        </span>
        <span>
          <Kbd>&#8629;</Kbd> to open
        </span>
      </div>
    </dialog>
  );
}
