import type { ReactNode } from 'react';

/**
 * How to name an element that has no text of its own: an `aria-label`, or the id of an element that
 * holds the name. The types require one of the two.
 */
export type AriaName =
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label': string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby'?: string;
    }
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label'?: string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby': string;
    };

/**
 * What a field needs for an accessible name: visible content in `Visible`, which is its `label` or its
 * `children`, or an `AriaName`. A props type intersects this with a base that declares `Visible` as
 * optional, so a field that names nothing does not compile. Only the types change: the component draws
 * what it was given.
 */
export type AccessibleName<Visible extends 'label' | 'children'> =
  Record<Visible, ReactNode> | (Partial<Record<Visible, undefined>> & AriaName);
