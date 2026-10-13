import { createElement, type HTMLAttributes, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { StatTileLink } from './StatTileLink';

export interface StatTileChange {
  /** The arrow, and the word the app writes. */
  direction: 'up' | 'down' | 'flat';
  /** The whole sentence, formatted: "Up 12% from last month". It carries the meaning; the arrow repeats it. */
  label: string;
  /** Color only when the change means one of these. @default 'neutral' */
  tone?: 'neutral' | 'gain' | 'warning';
}

export interface StatTileProps extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
  label: ReactNode;
  /** The figure, formatted. */
  value: ReactNode;
  change?: StatTileChange;
  caption?: ReactNode;
  /** A Sparkline, or any small drawing. Hidden from assistive technology unless it names itself. */
  trend?: ReactNode;
  /** Makes the whole tile a link. */
  href?: string;
  /** The heading level of the label, when the tile should be in the page outline. Omitted, the label is a `p`. */
  level?: 2 | 3 | 4;
  ref?: Ref<HTMLElement>;
}

/** Lucide's arrow geometry, drawn inline: lucide-react's Icon is a client module, and this one is static. */
const arrow = (...paths: string[]): ReactElement => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    focusable="false"
  >
    {paths.map((d) => (
      <path key={d} d={d} />
    ))}
  </svg>
);

/** Up, down, or a dash for flat. None is mirrored in right to left: up and down have no reading direction. */
const ARROWS: Record<StatTileChange['direction'], ReactElement> = {
  up: arrow('M12 19V5', 'm5 12 7-7 7 7'),
  down: arrow('M12 5v14', 'm19 12-7 7-7-7'),
  flat: arrow('M5 12h14'),
};

/**
 * One headline figure on the Card's surface: an overline label, the value, a change line, a caption and a
 * trend. Static: without `href` it adds no JavaScript. With `href` the whole tile is one link, drawn by the
 * private client module StatTileLink, and named by everything it shows.
 */
export function StatTile({
  label,
  value,
  change,
  caption,
  trend,
  href,
  level,
  className,
  ...rest
}: StatTileProps): ReactElement {
  const Label = level === undefined ? 'p' : (`h${String(level)}` as 'h2' | 'h3' | 'h4');
  // Every line is a block, so the name a linked tile takes from its content has a space between each.
  const body = (
    <div className="stat-tile-body">
      <Label className="stat-tile-label">{label}</Label>
      <p className="copy copy-numeral-sm stat-tile-value">{value}</p>
      {present(trend) ? <div className="stat-tile-trend">{trend}</div> : null}
      {change ? (
        <p
          className="stat-tile-change"
          data-direction={change.direction}
          data-tone={change.tone ?? 'neutral'}
        >
          <span className="stat-tile-arrow" aria-hidden="true">
            {ARROWS[change.direction]}
          </span>
          <span className="stat-tile-change-label">{change.label}</span>
        </p>
      ) : null}
      {present(caption) ? <p className="stat-tile-caption">{caption}</p> : null}
    </div>
  );
  if (href !== undefined)
    return (
      <StatTileLink {...rest} href={href} className={cx('stat-tile', className)}>
        {body}
      </StatTileLink>
    );
  // createElement, as Card does: the root's ref, which rides in `rest` either way, is an HTMLElement ref, which
  // a JSX div does not take.
  return createElement('div', { ...rest, className: cx('stat-tile', className) }, body);
}
