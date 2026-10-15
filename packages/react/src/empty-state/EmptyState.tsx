import type { ReactElement, ReactNode, Ref } from 'react';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface EmptyStateProps {
  /** The line that says what is missing: "No transactions this month". */
  title: string;
  /** What the reader can do about it. */
  description?: ReactNode;
  /** A Lucide icon element, drawn at 24px in slate. */
  icon?: ReactNode;
  /** One action, such as a `Button` that clears the filters. */
  action?: ReactNode;
  /** @default 3, the step under a card's title */
  headingLevel?: 2 | 3 | 4;
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

/**
 * What a page or a table shows where it has nothing yet: what is missing, what to do about it, and one action.
 * Static: no state and no client code, so a server component renders it. The icon is hidden from assistive
 * technology, since the title says what it shows.
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  headingLevel = 3,
  className,
  ref,
}: EmptyStateProps): ReactElement {
  const Title = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  return (
    <div ref={ref} className={cx('empty-state', className)}>
      {present(icon) ? (
        <span className="empty-state-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <Title className="empty-state-title">{title}</Title>
      {present(description) ? <p className="empty-state-description">{description}</p> : null}
      {present(action) ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
