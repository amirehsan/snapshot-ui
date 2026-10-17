import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Eyebrow, Heading, Text } from '../typography';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The page's title, its h1. */
  title: ReactNode;
  /** A Breadcrumbs, above everything else. */
  breadcrumbs?: ReactNode;
  /** The category above the title, as an Eyebrow draws it: "Documents". */
  eyebrow?: ReactNode;
  /** A sentence under the title, in slate. */
  description?: ReactNode;
  /** Buttons at the title's end: a FileButton, a primary Button, a Menu. They wrap under the title when they do not fit. */
  actions?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * A page's header, in the docs site's header's layout: the trail, the eyebrow, the page's one `h1` and a sentence,
 * with the actions at the title's end, falling under it when they do not fit and on a line of their own under
 * 768px. Its fill spans its holder and its row is a page column, so the titles line up with a PageColumn under it.
 * It never sticks by itself: in AppShell's `header` slot it sticks with the shell's header, and at the top of the
 * page's content it scrolls away. A `header` element, so a banner landmark outside `<main>` and a plain header
 * inside it. A static component: it renders in a server component and ships no client JavaScript.
 */
export function PageHeader({
  title,
  breadcrumbs,
  eyebrow,
  description,
  actions,
  className,
  ...props
}: PageHeaderProps): ReactElement {
  return (
    <header {...props} className={cx('page-header', className)}>
      <div className="page-column page-header-row">
        <div className="page-header-titles">
          {present(breadcrumbs) && breadcrumbs}
          {present(eyebrow) && <Eyebrow>{eyebrow}</Eyebrow>}
          <Heading level={1} size={2} className="page-header-title">
            {title}
          </Heading>
          {present(description) && (
            <Text tone="muted" className="page-header-description">
              {description}
            </Text>
          )}
        </div>
        {present(actions) && <div className="page-header-actions">{actions}</div>}
      </div>
    </header>
  );
}
