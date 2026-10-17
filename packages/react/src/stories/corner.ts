/*
 * Concentric corners for what a story places in a holder's corner, as an app would (docs/design-system.md,
 * "Nested radii, derived"). A card, a dialog, a drawer, a side panel and a padded popover name their corner,
 * edge and padding as --holder-radius, --holder-border and --holder-pad, and a part an app puts in one of
 * their corners takes the holder's radius less the gap on that corner. Story code only; it never ships.
 */
import type { CSSProperties } from 'react';
import { tokenPixels } from './paint';

/** The holder's radius less its edge and padding, read inside the holder; the micro step where that runs out. */
export const HOLDER_CORNER =
  'max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))';

/** A part on the holder's bottom edge at its start, such as a lone button under a card's text. */
export const BOTTOM_START: CSSProperties = { borderEndStartRadius: HOLDER_CORNER };

/** A part as wide as the holder's content on its bottom edge, such as a full-width footer button. */
export const BOTTOM: CSSProperties = { ...BOTTOM_START, borderEndEndRadius: HOLDER_CORNER };

/** A field at the bottom of a holder: its whole corner, which its own field button reads too. */
export const FIELD_AT_BOTTOM = { '--input-radius': HOLDER_CORNER } as CSSProperties;

/**
 * A frame drawn around a card: outer = inner + gap, so the frame's corner is the card's stadium plus the
 * frame's padding, and the two curves share a center.
 */
export const frameAround = (padding: number): CSSProperties => ({
  padding,
  borderRadius: `calc(var(--radius-stadium) + ${String(padding)}px)`,
});

/**
 * The corner a card or a tile in a card takes, in px: the card's stadium less its 1px edge and its padding, or
 * the micro step where that runs out. 7px in Rounded, 19px compact, 6px in Soft and 0 in Square.
 */
export function nestedCardPixels(): number {
  return Math.max(
    tokenPixels('--radius-micro'),
    tokenPixels('--radius-stadium') - 1 - tokenPixels('--spacing-card'),
  );
}
