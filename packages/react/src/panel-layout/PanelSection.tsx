import { useId, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface PanelSectionProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The section's name, its heading: "Coach". Focus lands on it when the section opens. */
  title: ReactNode;
  /** A sentence under the heading, in slate. */
  description?: ReactNode;
  /** The heading's level under the page's `h1`. @default 2 */
  headingLevel?: 2 | 3;
  children: ReactNode;
  ref?: Ref<HTMLElement>;
}

/**
 * One settings section, a region named by its heading. The heading takes focus by script (`tabIndex={-1}`), so a
 * PanelLayout moves focus to it when the section opens. Static: it renders in a server component with no client
 * code.
 */
export function PanelSection({
  title,
  description,
  headingLevel = 2,
  children,
  className,
  ref,
  ...props
}: PanelSectionProps): ReactElement {
  const headingId = useId();
  const Heading = headingLevel === 3 ? 'h3' : 'h2';
  return (
    <section aria-labelledby={headingId} {...props} ref={ref} className={cx('panel-section', className)}>
      <Heading id={headingId} className="panel-section-heading" tabIndex={-1}>
        {title}
      </Heading>
      {present(description) ? <p className="panel-section-description">{description}</p> : null}
      {children}
    </section>
  );
}
