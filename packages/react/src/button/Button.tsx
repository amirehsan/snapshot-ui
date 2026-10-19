'use client';

import { useId, useLayoutEffect, useRef, type ReactElement, type Ref } from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  composeRenderProps,
} from 'react-aria-components';
import { Spinner } from '../spinner/Spinner';
import { cx } from '../utils/cx';
import { keepSaidNames } from '../utils/said-names';

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

/** A pressable action. Built on React Aria's Button. */
export function Button({
  variant = 'primary',
  pendingLabel = 'Loading',
  className,
  children,
  ...props
}: ButtonProps): ReactElement {
  const labelId = useId();
  const labelRef = useRef<HTMLSpanElement>(null);
  // React Aria joins the spinner's name to a pending button's only when an attribute names the button. A
  // button named by its text gets its label as that attribute while pending, so the spinner's name joins it
  // in every engine; at rest it is named by its text again. The label keeps its id at rest too: React Aria's
  // live announcer says a focused button's pending start by these ids and keeps that sentence for seconds after
  // the pending ends, so the label's id must still resolve then. A button that unmounts takes its ids with it,
  // as a Dialog's Save does when the save closes the Dialog, so on the way out it writes the words onto the
  // sentence in place of the ids.
  useLayoutEffect(() => {
    const button = labelRef.current?.parentElement;
    return () => {
      if (button) keepSaidNames(button);
    };
  }, []);
  const namedByLabel =
    props.isPending === true && props['aria-label'] == null && props['aria-labelledby'] == null;
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
          <span ref={labelRef} id={labelId} className="button-label">
            {resolved}
          </span>
          {isPending ? <Spinner className="button-spinner" aria-label={pendingLabel} /> : null}
        </>
      ))}
    </RACButton>
  );
}
