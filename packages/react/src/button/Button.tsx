'use client';

import { useEffect, useId, useLayoutEffect, useRef, type ReactElement, type Ref } from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  composeRenderProps,
} from 'react-aria-components';
import { Spinner } from '../spinner/Spinner';
import { cx } from '../utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export interface ButtonProps extends RACButtonProps {
  /**
   * Visual emphasis. Signal orange is deliberately not a variant: it is
   * reserved for consent and legal actions.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Accessible name of the spinner shown while `isPending`. It joins the
   * button's name while pending, so "Save" reads "Save Saving".
   * @default 'Loading'
   */
  pendingLabel?: string;
  ref?: Ref<HTMLButtonElement>;
}

/**
 * React Aria's live announcer says a focused button's pending start and end by ids in the button (its own, its
 * label's, its spinner's) and keeps each sentence on the page for seconds. Run as the button unmounts, while its
 * nodes are still in the page: each sentence that names one of those ids takes the words they hold as its own
 * label, so it never names ids that have gone, and, a log reading only what is added, is not said again.
 */
function keepAnnouncedWords(labelId: string): void {
  const button = document.getElementById(labelId)?.closest('button');
  if (!button) return;
  // Each id's words: its aria-label, else its text. The button's text is its label's: the spinner has none.
  const words = new Map<string, string | null>();
  for (const named of [button, ...button.querySelectorAll('[id]')]) {
    words.set(named.id, named.getAttribute('aria-label') ?? named.textContent);
  }
  const settle = (): void => {
    for (const said of document.querySelectorAll('[data-live-announcer] [aria-labelledby]')) {
      const ids = (said.getAttribute('aria-labelledby') ?? '').split(' ');
      if (!ids.some((id) => words.has(id))) continue;
      const text = ids.map((id) => words.get(id) ?? document.getElementById(id)?.textContent ?? '');
      said.setAttribute('aria-label', text.join(' ').trim());
      said.removeAttribute('aria-labelledby');
    }
  };
  settle();
  // A page's first sentence waits 100ms for React Aria's regions, so it can arrive after the button has gone.
  setTimeout(settle, 100);
}

/** A pressable action. Built on React Aria's Button. */
export function Button({
  variant = 'primary',
  pendingLabel = 'Loading',
  className,
  children,
  ...props
}: ButtonProps): ReactElement {
  const labelId = useId();
  // React Aria joins the spinner's name to a pending button's only when an attribute names the button. A
  // button named by its text gets its label as that attribute while pending, so the spinner's name joins it
  // in every engine; at rest it is named by its text again. The label keeps its id at rest too: React Aria's
  // live announcer says a focused button's pending start by these ids and keeps that sentence for seconds after
  // the pending ends, so the label's id must still resolve then.
  const namedByLabel =
    props.isPending === true && props['aria-label'] == null && props['aria-labelledby'] == null;
  // Only a button that has been pending can have been said by its ids.
  const wasPending = useRef(false);
  useEffect(() => {
    if (props.isPending === true) wasPending.current = true;
  }, [props.isPending]);
  // A layout effect's cleanup runs before React takes the button's nodes out of the page.
  useLayoutEffect(
    () => () => {
      if (wasPending.current) keepAnnouncedWords(labelId);
    },
    [labelId],
  );
  return (
    <RACButton
      {...props}
      aria-labelledby={namedByLabel ? labelId : props['aria-labelledby']}
      className={composeRenderProps(className, (userClassName) =>
        cx('button', `button-${variant}`, userClassName),
      )}
    >
      {composeRenderProps(children, (resolved, { isPending }) => (
        <>
          <span id={labelId} className="button-label">
            {resolved}
          </span>
          {isPending ? <Spinner className="button-spinner" aria-label={pendingLabel} /> : null}
        </>
      ))}
    </RACButton>
  );
}
