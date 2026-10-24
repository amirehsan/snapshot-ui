import { fireEvent, render, screen } from '@testing-library/react';
import { act, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { PositionPad, type PositionPadProps } from './PositionPad';

/*
 * The spike (risk R4): the track's capture handler runs ahead of React Aria's group handler, which hears keys on
 * the way up, and sets the value through RadioGroupStateContext. React runs its capture handlers before its bubble
 * handlers in every engine, since it dispatches both from its own root listeners; the play TwoDimensionalKeys
 * proves the order with the engines' own keys in Chromium, WebKit and Firefox.
 */

/** A pad in a wrapper that hears every key that gets past the pad, as an app's own handler would. */
function Heard({
  onOuterKey,
  ...props
}: Partial<PositionPadProps> & { onOuterKey: () => void }): ReactElement {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a test wrapper that only listens
    <div onKeyDown={onOuterKey}>
      <PositionPad label="Text position" {...props} />
    </div>
  );
}

const cell = (name: string): HTMLInputElement => screen.getByRole<HTMLInputElement>('radio', { name });

describe('the two-dimensional keys spike', () => {
  it('runs the track capture handler before React Aria group handler, which never sees a handled arrow', () => {
    const onOuterKey = vi.fn();
    render(<Heard onOuterKey={onOuterKey} defaultValue="top-start" />);
    act(() => {
      cell('Top left').focus();
    });
    fireEvent.keyDown(cell('Top left'), { key: 'ArrowDown' });
    // React Aria's handler would have moved on from the pressed radio, to Top, the next in its linear order.
    expect(cell('Left')).toBeChecked();
    expect(cell('Top')).not.toBeChecked();
    expect(cell('Left')).toHaveFocus();
    // The key stopped at the track: nothing above it heard it, React Aria's group least of all.
    expect(onOuterKey).not.toHaveBeenCalled();
    // A key the track leaves alone goes on up.
    fireEvent.keyDown(cell('Left'), { key: 'a' });
    expect(onOuterKey).toHaveBeenCalledTimes(1);
  });

  it('sets the value through RadioGroupStateContext, so onChange fires once and the native radio is checked', () => {
    const onChange = vi.fn();
    render(<PositionPad label="Text position" defaultValue="center" onChange={onChange} />);
    act(() => {
      cell('Center').focus();
    });
    fireEvent.keyDown(cell('Center'), { key: 'ArrowUp' });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith('top-center');
    expect(cell('Top').checked).toBe(true);
    expect(cell('Center').checked).toBe(false);
  });

  it('prevents the default of a handled arrow', () => {
    render(<PositionPad label="Text position" defaultValue="top-start" />);
    act(() => {
      cell('Top left').focus();
    });
    // fireEvent returns false when a handler called preventDefault.
    expect(fireEvent.keyDown(cell('Top left'), { key: 'ArrowRight' })).toBe(false);
    // At a column's end the key does nothing, and is still the pad's, so the browser's own arrow does not run.
    expect(fireEvent.keyDown(cell('Top'), { key: 'ArrowUp' })).toBe(false);
    expect(cell('Top')).toBeChecked();
    // A modified arrow is left alone.
    expect(fireEvent.keyDown(cell('Top'), { key: 'ArrowRight', altKey: true })).toBe(true);
  });
});
