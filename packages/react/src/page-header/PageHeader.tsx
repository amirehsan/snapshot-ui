import type { HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import { Eyebrow, Heading, Text, type HeadingLevel } from '../typography';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The page's title, its h1. */
  title: ReactNode;
  /**
   * The title's heading level. A page has one `h1`, so keep the default; lower it only where a page shows a header
   * that is not its own, as a gallery of examples does. It never changes the title's size. @default 1
   */
  headingLevel?: HeadingLevel;
  /** A Breadcrumbs, above everything else. */
  breadcrumbs?: ReactNode;
  /** The category above the title, as an Eyebrow draws it: "Documents". */
  eyebrow?: ReactNode;
  /** A sentence under the title and the actions, in slate. */
  description?: ReactNode;
  /**
   * Buttons at the title's end: a FileButton, a primary Button, a Menu. They wrap under the title when the title
   * would keep less than 20rem beside them.
   */
  actions?: ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * A page's header, in the docs site's header's layout: the trail, the eyebrow and the page's one `h1`, with the
 * actions at the title's end, falling under it when the title would keep less than 20rem beside them and on a line
 * of their own under 768px; the sentence under them both. Its fill spans its holder and its row is a page column,
 * so the titles line up with a PageColumn under it. It never sticks by itself: in AppShell's `header` slot it sticks
 * with the shell's header, and at the top of the page's content it scrolls away. A `header` element inside `<main>`,
 * so not a landmark. A static component: it renders in a server component and ships no client JavaScript.
 */
export function PageHeader({
  title,
  headingLevel = 1,
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
          <Heading level={headingLevel} size={2} className="page-header-title">
            {title}
          </Heading>
        </div>
        {present(actions) && <div className="page-header-actions">{actions}</div>}
        {present(description) && (
          <div className="page-header-detail">
            <Text tone="muted" className="page-header-description">
              {description}
            </Text>
          </div>
        )}
      </div>
    </header>
  );
}
