'use client';

import { useFetchSearch } from 'fumadocs-core/search/client';
import Link from 'next/link';
import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';

const KIND = { page: 'Page', heading: 'Section', text: 'Text' } as const;

/** Search over every docs page, in a native modal dialog. */
export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const { search, onSearchChange, data, isLoading } = useFetchSearch();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const results = (data?.items ?? []).filter((item) => item.type !== 'table').slice(0, 12);

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
      <div className="search-field">
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
        />
        <span className="kbd">esc</span>
      </div>
      {search.length === 0 ? null : results.length === 0 ? (
        <p className="search-empty" role="status">
          {isLoading ? 'Searching' : `Nothing matches "${search}"`}
        </p>
      ) : (
        <ul className="search-results">
          {results.map((item) => (
            <li key={item.id}>
              <Link className="search-result" href={item.url} onClick={close}>
                <span>{item.content}</span>
                <span className="search-result-kind">{KIND[item.type]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="search-foot">
        <span>
          <span className="kbd">&#8593;</span> <span className="kbd">&#8595;</span> to move
        </span>
        <span>
          <span className="kbd">&#8629;</span> to open
        </span>
      </div>
    </dialog>
  );
}
