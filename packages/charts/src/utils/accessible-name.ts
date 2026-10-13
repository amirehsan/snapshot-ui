/**
 * How to name an element that has no text of its own: an `aria-label`, or the id of an element that
 * holds the name. Where nothing shown names the element, the types require one of the two. Copied from
 * `@snapshot-ui/react`, so neither package depends on the other.
 */
export type AriaName =
  | {
      /** A name for assistive technology. Give it, or `aria-labelledby`, where no label or text is shown. */
      'aria-label': string;
      /** The id of an element that holds the name, such as a label shown elsewhere. */
      'aria-labelledby'?: string;
    }
  | {
      /** A name for assistive technology. Give it, or `aria-labelledby`, where no label or text is shown. */
      'aria-label'?: string;
      /** The id of an element that holds the name, such as a label shown elsewhere. */
      'aria-labelledby': string;
    };
