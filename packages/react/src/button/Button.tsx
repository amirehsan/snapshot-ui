'use client';

import type { ReactElement, Ref } from 'react';
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
   * Accessible name of the spinner shown while `isPending`.
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
  return (
    <RACButton
      {...props}
      className={composeRenderProps(className, (userClassName) =>
        cx('button', `button-${variant}`, userClassName),
      )}
    >
      {composeRenderProps(children, (resolved, { isPending }) => (
        <>
          <span className="button-label">{resolved}</span>
          {isPending ? <Spinner className="button-spinner" aria-label={pendingLabel} /> : null}
        </>
      ))}
    </RACButton>
  );
}
