import { createElement, type HTMLAttributes, type ReactElement, type Ref } from 'react';
import { cx } from '../utils/cx';

export type TextElement = 'p' | 'span' | 'div';
export type TextSize = 'body' | 'small' | 'numeral' | 'numeral-sm';
export type TextTone = 'default' | 'muted';

export interface TextProps extends HTMLAttributes<HTMLElement> {
  /**
   * The element to render: `p`, `span` or `div`.
   * @default 'p'
   */
  as?: TextElement;
  /**
   * `body` is 16px; `small` is 14px, for hints and helper lines. `numeral` is a 56px figure (44px under
   * 768px) and `numeral-sm` a 32px one, both with tabular digits and no wrapping, for an amount or a
   * count that is the point of a tile. Give a figure its sign and unit in the string; nothing is
   * formatted here.
   * @default 'body'
   */
  size?: TextSize;
  /**
   * `default` takes the color around it; `muted` is slate, for secondary text.
   * @default 'default'
   */
  tone?: TextTone;
  ref?: Ref<HTMLElement>;
}

/**
 * Body text in the body or small step, or a figure in a numeral step. A static component: it renders a plain
 * `p`, `span` or `div`, so it works in a server component.
 */
export function Text({
  as: Element = 'p',
  size = 'body',
  tone = 'default',
  className,
  ...props
}: TextProps): ReactElement {
  // createElement and not JSX: JSX checks the props against all three tags at
  // once, and a ref typed for the HTMLElement they share fails that check.
  // The public ref type is therefore the wide HTMLElement. React's ref types
  // are covariant, so a ref typed for another tag, a div ref on the default p,
  // still compiles: keep the ref's type in step with `as`.
  return createElement(Element, {
    ...props,
    className: cx('copy', size !== 'body' && `copy-${size}`, tone === 'muted' && 'copy-muted', className),
  });
}
