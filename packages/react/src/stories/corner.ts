/*
 * Concentric corners for what a story places in a holder's corner, as an app would (docs/design-system.md,
 * "Nested radii, derived"). A card, a dialog, a drawer, a side panel and a padded popover name their corner,
 * edge and padding as --holder-radius, --holder-border and --holder-pad, and the inset that keeps a control
 * clear of their corner curve as --holder-corner-inset. A surface that fills to the holder's edge takes the
 * holder's radius less the gap; a control keeps its own shape and moves out of the corner. Story code only; it
 * never ships.
 */
import type { CSSProperties } from 'react';
import { tokenPixels } from './paint';

/** The holder's radius less its edge and padding, read inside the holder; the micro step where that runs out. */
export const HOLDER_CORNER =
  'max(var(--radius-micro), calc(var(--holder-radius) - var(--holder-border) - var(--holder-pad)))';

/**
 * A control at the foot of a holder, such as a button under a card's text: it keeps its own shape and stops
 * at the holder's corner inset, so its corners sit clear of the holder's bottom curve. 7px more in a Rounded
 * card, nothing more in Soft and Square.
 */
export const CLEAR_OF_FOOT: CSSProperties = {
  marginBlockEnd: 'calc(var(--holder-corner-inset) - var(--holder-pad))',
};

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
