import { useCallback, useState } from 'react';

/**
 * A value that is controlled while `value` is given and the component's own otherwise, in React Aria's
 * shape (`isX`, `defaultX`, `onXChange`). The setter tells `onChange` only when the value would change,
 * and a controlled value never moves on its own: the owner decides, in `onChange`, whether it moves.
 *
 * Hand-written because the library does not depend on react-stately. Internal: not exported.
 */
export function useControllableState<T>(
  value: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [value: T, setValue: (next: T) => void] {
  const [own, setOwn] = useState(defaultValue);
  const isControlled = value !== undefined;
  const current = isControlled ? value : own;
  // Rebuilt when the value or the callback changes, so it never reads a ref written during render.
  const setValue = useCallback(
    (next: T) => {
      if (Object.is(next, current)) return;
      if (!isControlled) setOwn(next);
      onChange?.(next);
    },
    [current, isControlled, onChange],
  );
  return [current, setValue];
}
