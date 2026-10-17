import type { HTMLAttributes, ReactElement, Ref } from 'react';
import { cx } from '../utils/cx';

export interface PageColumnProps extends HTMLAttributes<HTMLDivElement> {
  ref?: Ref<HTMLDivElement>;
}

/**
 * The page's content column: `--container-page` wide, 82.5rem with its inline padding, and centered in its holder
 * past that, so the content under a PageHeader starts where the header's titles do and ends where its actions end.
 * Its padding is the separate step, and the inset under 768px. A column inside a column takes no second cap and
 * no second padding. A static component: it renders a plain `div`, so it works in a server component.
 */
export function PageColumn({ className, ...props }: PageColumnProps): ReactElement {
  return <div {...props} className={cx('page-column', className)} />;
}
