import { useId } from 'react';

export interface ChangedDescriptionOptions {
  /** Whether the field has unsaved changes and so shows its Changed chip, or its changed mark without a label. */
  isChanged?: boolean;
  /** Whether the field was told it is invalid. An invalid field hides its chip and its mark. */
  isInvalid?: boolean;
  /** The `aria-describedby` the caller passed to the field, if any. */
  describedBy?: string;
  /**
   * Whether the field shows its label row, which holds the chip. Without one a changed field draws the changed
   * mark in its frame, and the mark is what the field names. @default true
   */
  isLabelled?: boolean;
}

export interface ChangedDescription {
  /** The id to give the Changed chip: pass it to `FieldHead` as `chipId`. */
  chipId: string;
  /** The id to give the changed mark of a field with no label: pass it to `FieldChangedMark` as `id`. */
  markId: string;
  /**
   * The `aria-describedby` to give the field: the caller's, then the chip's while the chip shows, or the mark's
   * while the mark shows.
   */
  describedBy: string | undefined;
}

/**
 * Makes a field read its Changed chip, or its changed mark, aloud. Both are visual cues, so a screen reader
 * hears one only if the field names it in `aria-describedby`. That must happen only while it shows (changed and
 * not invalid), because an element named there is read even when `display: none` hides it. A labelled field
 * names its chip; a field with no label has no label row, and names the mark in its frame.
 *
 * Internal: every field with a label row calls it, so they all behave alike.
 * Not exported from the package.
 */
export function useChangedDescription({
  isChanged,
  isInvalid,
  describedBy,
  isLabelled = true,
}: ChangedDescriptionOptions): ChangedDescription {
  const chipId = useId();
  const markId = useId();
  const announced = isChanged === true && isInvalid !== true;
  const named = isLabelled ? chipId : markId;
  return {
    chipId,
    markId,
    describedBy: announced ? [describedBy, named].filter(Boolean).join(' ') : describedBy,
  };
}
