import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useBeforeUnload } from './useBeforeUnload';

function Probe({ isOn }: { isOn: boolean }): ReactElement {
  useBeforeUnload(isOn);
  return <output />;
}

/**
 * Fires a cancelable beforeunload on the window, as the browser does, and returns it. jsdom has no
 * BeforeUnloadEvent, whose returnValue is a string, so the event is given one.
 */
function unload(): Event & { returnValue: unknown } {
  const event = new Event('beforeunload', { cancelable: true }) as Event & { returnValue: unknown };
  Object.defineProperty(event, 'returnValue', { value: undefined, writable: true });
  window.dispatchEvent(event);
  return event;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useBeforeUnload', () => {
  it('listens only while on, and stops when it turns off or unmounts', () => {
    const add = vi.spyOn(window, 'addEventListener');
    const remove = vi.spyOn(window, 'removeEventListener');
    const listeners = (spy: typeof add): number =>
      spy.mock.calls.filter(([type]) => type === 'beforeunload').length;
    renderToString(<Probe isOn />);
    expect(listeners(add)).toBe(0);

    const { rerender, unmount } = render(<Probe isOn={false} />);
    expect(listeners(add)).toBe(0);
    expect(unload().defaultPrevented).toBe(false);
    rerender(<Probe isOn />);
    expect(listeners(add)).toBe(1);
    expect(unload().defaultPrevented).toBe(true);
    rerender(<Probe isOn={false} />);
    expect(listeners(remove)).toBe(1);
    expect(unload().defaultPrevented).toBe(false);
    rerender(<Probe isOn />);
    unmount();
    expect(listeners(remove)).toBe(2);
    expect(unload().defaultPrevented).toBe(false);
  });

  it('prevents the default and sets returnValue, which older engines read', () => {
    render(<Probe isOn />);
    const event = unload();
    expect(event.defaultPrevented).toBe(true);
    // eslint-disable-next-line @typescript-eslint/no-deprecated -- the hook sets it for the floor's Chromium
    expect(event.returnValue).toBe('');
  });
});
