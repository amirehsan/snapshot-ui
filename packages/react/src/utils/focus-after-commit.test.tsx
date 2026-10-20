import { act, render, screen } from '@testing-library/react';
import { useRef, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NumberField } from '../number-field';
import {
  afterCommit,
  firstFocusable,
  focusIsLost,
  focusNamedPlace,
  useFocusWatch,
} from './focus-after-commit';

/*
 * jsdom has no layout and none of Chromium's focus fix-up, so these tests prove the targets and the watch's rules;
 * the plays prove the moves in Chromium, WebKit and Firefox (lesson 10).
 */

/** Waits for the next frame, after anything a frame was asked to do. */
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

/** Puts `html` in a fresh element on the page, and returns that element. */
function page(html: string): HTMLElement {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host;
}

/** The element on the page with this id. */
const byId = (id: string): HTMLElement => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`No #${id}`);
  return element;
};

afterEach(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  document.body.replaceChildren();
});

describe('afterCommit', () => {
  it('runs its move in the next frame, not at once', async () => {
    const move = vi.fn();
    afterCommit(move);
    expect(move).not.toHaveBeenCalled();
    await nextFrame();
    expect(move).toHaveBeenCalledOnce();
  });

  it('runs nothing once cancelled', async () => {
    const move = vi.fn();
    const cancel = afterCommit(move);
    cancel();
    await nextFrame();
    await nextFrame();
    expect(move).not.toHaveBeenCalled();
  });
});

/** A group with a field in it, a field outside it, and the watch's answer written where a test can read it. */
function Watched({ onWatch }: { onWatch: (watch: ReturnType<typeof useFocusWatch>) => void }): ReactElement {
  const root = useRef<HTMLDivElement>(null);
  onWatch(useFocusWatch(root));
  return (
    <>
      <div ref={root}>
        <input aria-label="Inside" />
      </div>
      <input aria-label="Outside" />
    </>
  );
}

describe('useFocusWatch', () => {
  /** Renders the watched group and returns a reader of its latest watch. */
  function watched(): () => ReturnType<typeof useFocusWatch> {
    let latest: ReturnType<typeof useFocusWatch> | undefined;
    render(
      <Watched
        onWatch={(watch) => {
          latest = watch;
        }}
      />,
    );
    return () => {
      if (!latest) throw new Error('No watch');
      return latest;
    };
  }

  it('is not held before focus comes in', () => {
    const watch = watched();
    expect(watch().held()).toBe(false);
  });

  it('is held by a focus inside', () => {
    const watch = watched();
    act(() => {
      screen.getByRole('textbox', { name: 'Inside' }).focus();
    });
    expect(watch().held()).toBe(true);
  });

  it('stays held through a blur to nothing, as Chromium blurs a field that turns display: none', () => {
    const watch = watched();
    const inside = screen.getByRole('textbox', { name: 'Inside' });
    act(() => {
      inside.focus();
    });
    act(() => {
      inside.blur();
    });
    expect(document.activeElement).toBe(document.body);
    expect(watch().held()).toBe(true);
  });

  it('is let go by a focus outside', () => {
    const watch = watched();
    act(() => {
      screen.getByRole('textbox', { name: 'Inside' }).focus();
    });
    act(() => {
      screen.getByRole('textbox', { name: 'Outside' }).focus();
    });
    expect(watch().held()).toBe(false);
  });

  it('is let go by release', () => {
    const watch = watched();
    act(() => {
      screen.getByRole('textbox', { name: 'Inside' }).focus();
    });
    watch().release();
    expect(watch().held()).toBe(false);
  });

  it('is held from its mount when focus is already inside', () => {
    let latest = false;
    function Reader(): ReactElement {
      const root = useRef<HTMLDivElement>(null);
      const watch = useFocusWatch(root);
      return (
        <div ref={root}>
          {/* Focused as it mounts, before the watch's listener is on the document. */}
          <input aria-label="Mounted" ref={(input) => input?.focus()} />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => {
              latest = watch.held();
            }}
          >
            Read
          </button>
        </div>
      );
    }
    render(<Reader />);
    expect(document.activeElement).toBe(screen.getByRole('textbox', { name: 'Mounted' }));
    act(() => {
      screen.getByRole('button', { name: 'Read' }).click();
    });
    expect(latest).toBe(true);
  });
});

describe('focusIsLost', () => {
  it('is true on the body and on nothing', () => {
    expect(document.activeElement).toBe(document.body);
    expect(focusIsLost()).toBe(true);
    const active = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(null);
    try {
      expect(focusIsLost()).toBe(true);
    } finally {
      active.mockRestore();
    }
  });

  it('is false on a field that can hold focus', () => {
    page('<input aria-label="Name" id="name" />');
    byId('name').focus();
    expect(focusIsLost()).toBe(false);
  });

  it('is true on an element that has left the page', () => {
    page('<input aria-label="Name" id="name" />');
    const field = byId('name');
    field.focus();
    const active = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(field);
    try {
      field.remove();
      expect(focusIsLost()).toBe(true);
    } finally {
      active.mockRestore();
    }
  });

  it.each([
    ['a hidden fieldset', 'hidden'],
    ['an inert fieldset', 'inert'],
    ['a disabled fieldset', 'disabled'],
  ])('is true inside %s', (_name, attribute) => {
    page('<fieldset id="group"><input aria-label="Key" id="key" /></fieldset>');
    const field = byId('key');
    field.focus();
    expect(focusIsLost()).toBe(false);
    // Firefox keeps focus on a field whose group turns hidden; jsdom keeps it on any.
    byId('group').setAttribute(attribute, '');
    const active = vi.spyOn(document, 'activeElement', 'get').mockReturnValue(field);
    try {
      expect(focusIsLost()).toBe(true);
    } finally {
      active.mockRestore();
    }
  });
});

describe('firstFocusable', () => {
  it('skips disabled, inert, hidden and tabindex -1 elements', () => {
    const host = page(`
      <button type="button" disabled>Disabled</button>
      <div inert><button type="button">Inert</button></div>
      <div hidden><button type="button">Hidden</button></div>
      <fieldset disabled><input aria-label="In a disabled fieldset" /></fieldset>
      <span tabindex="-1">Script only</span>
      <input type="hidden" name="token" value="1" />
      <a>No address</a>
      <a href="/next" id="next">Next</a>
    `);
    expect(firstFocusable(host)).toBe(byId('next'));
  });

  it('finds an element with a tabindex of 0, and nothing in an empty root', () => {
    const host = page('<p>Words</p><div tabindex="0" id="region">Region</div>');
    expect(firstFocusable(host)).toBe(byId('region'));
    expect(firstFocusable(page('<p>Words only</p>'))).toBeNull();
  });

  it("finds a NumberField's text box, which comes before its sign button only with allowsNegative off", () => {
    const { container, unmount } = render(<NumberField label="Cushion" />);
    expect(firstFocusable(container)).toBe(screen.getByRole('textbox', { name: 'Cushion' }));
    unmount();
    const signed = render(<NumberField label="Balance" allowsNegative />);
    expect(firstFocusable(signed.container)).toBe(screen.getByRole('button', { name: 'Negative' }));
  });
});

describe('focusNamedPlace', () => {
  it('focuses the target it is given', () => {
    page('<button type="button" id="gate">Gate</button><main tabindex="-1" id="main"></main>');
    expect(focusNamedPlace(byId('gate'))).toBe(byId('gate'));
    expect(document.activeElement).toBe(byId('gate'));
  });

  it('falls back to main without a target', () => {
    page('<main tabindex="-1" id="main"><p>Page</p></main>');
    expect(focusNamedPlace(null)).toBe(byId('main'));
    expect(document.activeElement).toBe(byId('main'));
  });

  it('falls back to main when the target cannot take focus', () => {
    page('<button type="button" id="gate" disabled>Gate</button><main tabindex="-1" id="main"></main>');
    expect(focusNamedPlace(byId('gate'))).toBe(byId('main'));
  });

  it('lets a main with no tabindex take focus by script, out of the tab order', () => {
    page('<main id="main"><p>Page</p></main>');
    expect(focusNamedPlace(null)).toBe(byId('main'));
    expect(byId('main')).toHaveAttribute('tabindex', '-1');
  });

  it('never focuses the body: with no target and no main it focuses nothing', () => {
    page('<p>No main here</p>');
    const focus = vi.spyOn(HTMLElement.prototype, 'focus');
    try {
      expect(focusNamedPlace(null)).toBeNull();
      expect(focus.mock.contexts).not.toContain(document.body);
    } finally {
      focus.mockRestore();
    }
  });
});
