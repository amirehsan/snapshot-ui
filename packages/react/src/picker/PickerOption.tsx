'use client';

import { Check } from 'lucide-react';
import {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type Context,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  ListBoxItem as RACListBoxItem,
  Text,
  composeRenderProps,
  type ListBoxItemProps as RACListBoxItemProps,
  type ListBoxItemRenderProps,
  type SelectionMode,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface PickerOptionProps<T extends object = object> extends Omit<
  RACListBoxItemProps<T>,
  | 'className'
  | 'children'
  | 'style'
  | 'href'
  | 'hrefLang'
  | 'target'
  | 'rel'
  | 'download'
  | 'ping'
  | 'referrerPolicy'
  | 'routerOptions'
> {
  /** The label. A string is also the option's text value, for typeahead, filtering and the trigger. */
  children: ReactNode;
  /** A hint under the label, in slate. It becomes the option's accessible description. */
  description?: ReactNode;
  /** A 16px icon at the start, hidden from assistive technology. Shown in Select's trigger too. */
  icon?: ReactNode;
  /** A preformatted value at the end, such as a count or an amount. Never formatted here. */
  end?: ReactNode;
  /** The ids of elements that also describe the option, read after its end value and before its hint. */
  'aria-describedby'?: string;
  /** A class name, or a function of the option's state, merged after the library's own classes. */
  className?:
    string | ((values: ListBoxItemRenderProps & { defaultClassName: string | undefined }) => string);
  ref?: Ref<HTMLDivElement>;
}

/**
 * True inside Select's trigger, where an option draws its icon and label only. Internal: Select provides it
 * around its value, and nothing else reads it. Not exported from the package.
 */
export const PickerValueContext: Context<boolean> = createContext(false);

interface RowProps {
  icon: ReactNode;
  label: ReactNode;
  description: ReactNode;
  end: ReactNode;
  endId: string;
  selectionMode: SelectionMode;
}

/**
 * The option's content. React Aria's SelectValue draws the chosen option's own content in the trigger, so the
 * same row renders twice while the list is open. In the trigger it is the icon and the label alone, with no
 * slot, no id, no hint, no end value and no check, so no id is written twice and the trigger's name stays its
 * value and its label.
 */
function PickerOptionRow({ icon, label, description, end, endId, selectionMode }: RowProps): ReactElement {
  const hasIcon = present(icon);
  if (useContext(PickerValueContext)) {
    return (
      <>
        {hasIcon ? (
          <span className="menu-item-icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}
        <span className="select-value-label">{label}</span>
      </>
    );
  }
  return (
    <>
      {hasIcon ? (
        <span className="menu-item-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="menu-item-text">
        <Text slot="label" className="menu-item-label">
          {label}
        </Text>
        {present(description) ? (
          <Text slot="description" className="menu-item-description">
            {description}
          </Text>
        ) : null}
      </span>
      {present(end) ? (
        <span id={endId} className="menu-item-end">
          {end}
        </span>
      ) : null}
      {selectionMode === 'none' ? null : (
        <span className="menu-item-check" aria-hidden="true">
          <Check />
        </span>
      )}
    </>
  );
}

/**
 * One option of a picker's list: an icon, a label that names it, a hint under it, a preformatted value at its
 * end, and, in a list that selects, a check whose room every row keeps. It is the Menu's row without a key hint,
 * a danger look or a link, so it wears `menu.css`'s classes. Select, ComboBox and MultiSelect share it.
 *
 * The label names the option, and the end value and the hint describe it, in that order: a screen reader hears
 * "Food", then "$1,204.50, Groceries and markets". A label that is not a string needs a `textValue`.
 */
export function PickerOption<T extends object = object>({
  children,
  description,
  icon,
  end,
  className,
  textValue,
  render,
  'aria-describedby': describedBy,
  ...props
}: PickerOptionProps<T>): ReactElement {
  const endId = useId();
  const hasEnd = present(end);
  return (
    <RACListBoxItem
      {...props}
      textValue={textValue ?? (typeof children === 'string' ? children : undefined)}
      className={composeRenderProps(className, (userClassName) =>
        cx('menu-item', 'picker-option', userClassName),
      )}
      // React Aria's option writes its own description, the hint's id, over any `aria-describedby` it is given, so
      // the end value's and the caller's ids join it here, on the element, ahead of it, as on MenuItem.
      render={(domProps, renderProps) => {
        const merged = {
          ...domProps,
          'aria-describedby': cx(hasEnd && endId, describedBy, domProps['aria-describedby']) || undefined,
        };
        if (render) return render(merged, renderProps);
        // With no link props an option is always React Aria's div, never its anchor.
        return <div {...(merged as ComponentProps<'div'>)} />;
      }}
    >
      {({ selectionMode }) => (
        <PickerOptionRow
          icon={icon}
          label={children}
          description={description}
          end={end}
          endId={endId}
          selectionMode={selectionMode}
        />
      )}
    </RACListBoxItem>
  );
}
