import type { ReactNode } from 'react';

/**
 * How to name an element that has no text of its own: an `aria-label`, or the id of an element that
 * holds the name. Where nothing shown names the element, the types require one of the two.
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

/**
 * What a field needs for an accessible name: visible content in `Visible`, which is its `label` or its
 * `children`, or an `AriaName`. A props type intersects this with a base that declares `Visible` as
 * optional, so a field that names nothing does not compile. Only the types change: the component draws
 * what it was given. It is exported so a wrapper can pass the rule on:
 * `Omit<TextFieldBaseProps, 'description'> & AccessibleName<'label'>`.
 */
export type AccessibleName<Visible extends 'label' | 'children'> =
  Record<Visible, ReactNode> | (Partial<Record<Visible, undefined>> & AriaName);
