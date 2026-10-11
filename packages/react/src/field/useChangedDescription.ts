import { useId } from 'react';

export interface ChangedDescriptionOptions {
  /** Whether the field has unsaved changes and so shows its Changed chip. */
  isChanged?: boolean;
  /** Whether the field was told it is invalid. An invalid field hides its chip. */
  isInvalid?: boolean;
  /** The `aria-describedby` the caller passed to the field, if any. */
  describedBy?: string;
}

export interface ChangedDescription {
  /** The id to give the Changed chip: pass it to `FieldHead` as `chipId`. */
  chipId: string;
  /** The `aria-describedby` to give the field: the caller's, then the chip's while the chip shows. */
  describedBy: string | undefined;
}

/**
 * Makes a field read its Changed chip aloud. The chip is a visual cue, so a
 * screen reader hears it only if the field names it in `aria-describedby`. That
 * must happen only while the chip shows (changed and not invalid), because an
 * element named there is read even when `display: none` hides it.
 *
 * Internal: every field with a label row calls it, so they all behave alike.
 * Not exported from the package.
 */
export function useChangedDescription({
  isChanged,
  isInvalid,
  describedBy,
}: ChangedDescriptionOptions): ChangedDescription {
  const chipId = useId();
  const announced = isChanged === true && isInvalid !== true;
  return {
    chipId,
    describedBy: announced ? [describedBy, chipId].filter(Boolean).join(' ') : describedBy,
  };
}
