import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { uncover } from './uncover';

/*
 * jsdom has no layout, so each box is a rectangle the test places, moved by the scroll each port has taken: the
 * page's content by the window's, a scroller's content by its own and the window's. The bar is sticky in its port,
 * so it stays where it is drawn.
 */

/** The window's scroll and an inner scroller's, as the stubbed `scrollBy`s move them. */
let scrolled = { window: 0, inner: 0 };

/** How far the inner scroller can still scroll, so a nested case leaves the rest to the window. */
let innerRoom = Infinity;

/** Gives `element` a fixed box, moved up by the scroll of the ports it sits in. */
function place(element: Element, top: number, bottom: number, ports: ('window' | 'inner')[]): void {
  element.getBoundingClientRect = () => {
    const shift = ports.reduce((sum, port) => sum + scrolled[port], 0);
    return { top: top - shift, bottom: bottom - shift, height: bottom - top } as DOMRect;
  };
}

/** Makes `element` a scroll port, an overflow that scrolls and more to scroll, and returns its stubbed `scrollBy`. */
function scroller(element: HTMLElement): ReturnType<typeof vi.fn> {
  element.dataset.scrolls = '';
  Object.defineProperty(element, 'scrollHeight', { value: 2000 });
  Object.defineProperty(element, 'clientHeight', { value: 400 });
  const scrollBy = vi.fn(({ top = 0 }: ScrollToOptions) => {
    const step = Math.min(top, innerRoom);
    innerRoom -= step;
    scrolled.inner += step;
  });
  element.scrollBy = scrollBy as unknown as typeof element.scrollBy;
  return scrollBy;
}

/** A form: a labelled text area with a description, and the bar, its last child. */
function form(): { control: HTMLTextAreaElement; field: HTMLElement; bar: HTMLElement; holder: HTMLElement } {
  const holder = document.createElement('form');
  holder.innerHTML =
    '<div class="field"><label for="memo">Memo</label><textarea id="memo"></textarea><p>Shown on the receipt.</p></div>' +
    '<div class="save-bar" role="group" aria-label="2 changes"></div>';
  document.body.append(holder);
  const control = holder.querySelector('textarea');
  const field = holder.querySelector<HTMLElement>('.field');
  const bar = holder.querySelector<HTMLElement>('.save-bar');
  if (!control || !field || !bar) throw new Error('No form');
  return { control, field, bar, holder };
}

const windowScroll = vi.fn(({ top = 0 }: ScrollToOptions) => {
  scrolled.window += top;
});

beforeEach(() => {
  scrolled = { window: 0, inner: 0 };
  innerRoom = Infinity;
  windowScroll.mockClear();
  vi.spyOn(window, 'scrollBy').mockImplementation(windowScroll as unknown as typeof window.scrollBy);
  // The bar's scroll margin holds the page's sticky offset, 64px, and the gap, 16px, resolved (save-bar.css).
  const real = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const style = real(element);
    return {
      overflowY: element instanceof HTMLElement && 'scrolls' in element.dataset ? 'auto' : 'visible',
      getPropertyValue: (name: string) =>
        element.classList.contains('save-bar') && name === 'scroll-margin-block-start'
          ? '64px'
          : element.classList.contains('save-bar') && name === 'scroll-margin-block-end'
            ? '16px'
            : style.getPropertyValue(name),
    } as CSSStyleDeclaration;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

describe('uncover', () => {
  it('scrolls the window until the whole field, its description included, is the gap above the bar', () => {
    const { control, field, bar } = form();
    place(bar, 700, 760, []);
    place(control, 600, 690, ['window']);
    place(field, 576, 712, ['window']);
    control.focus();
    uncover(control, bar);
    // 712 - (700 - 16): the description's bottom, not the control's, and the gap.
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 28, behavior: 'instant' });
    expect(field.getBoundingClientRect().bottom).toBe(700 - 16);
  });

  it('moves nothing when the field is the gap clear already, or within half a pixel of it', () => {
    const { control, field, bar } = form();
    place(bar, 700, 760, []);
    place(control, 500, 590, ['window']);
    place(field, 476, 684.5, ['window']);
    control.focus();
    uncover(control, bar);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it('clears the topmost cover where the window scrolls: a phone tray bar over the save bar', () => {
    const { control, field, bar, holder } = form();
    const tray = document.createElement('div');
    tray.className = 'upload-tray-bar';
    holder.after(tray);
    place(bar, 700, 760, []);
    place(tray, 636, 684, []);
    place(control, 560, 640, ['window']);
    place(field, 536, 660, ['window']);
    control.focus();
    uncover(control, bar);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 40, behavior: 'instant' });
  });

  it("never scrolls a tall control's top above the page's sticky offset", () => {
    const { control, field, bar } = form();
    place(bar, 700, 760, []);
    // A text area taller than the room between the sticky header and the bar.
    place(control, 124.5, 1000, ['window']);
    place(field, 100, 1022, ['window']);
    control.focus();
    uncover(control, bar);
    // Its top comes to the 64px offset, rounded down, though its end is still under the bar.
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 60, behavior: 'instant' });
    expect(control.getBoundingClientRect().top).toBeGreaterThanOrEqual(64);
  });

  it('leaves a control whose top is at or above the view top already', () => {
    const { control, field, bar } = form();
    place(bar, 700, 760, []);
    place(control, 40, 1000, ['window']);
    place(field, 16, 1022, ['window']);
    control.focus();
    uncover(control, bar);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it("clamps to the scroller's own top where the bar's holder scrolls", () => {
    const { control, field, bar, holder } = form();
    const panel = document.createElement('div');
    holder.before(panel);
    panel.append(holder);
    const panelScroll = scroller(panel);
    place(panel, 300, 700, []);
    place(bar, 620, 680, []);
    place(control, 320, 900, ['inner']);
    place(field, 296, 922, ['inner']);
    control.focus();
    uncover(control, bar);
    expect(panelScroll).toHaveBeenCalledExactlyOnceWith({ top: 20, behavior: 'instant' });
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it("scrolls the bar's own port by what a nested scroller could not", () => {
    const { control, field, bar } = form();
    // The text area's field sits in a box that scrolls inside the form, whose bar sticks in the window.
    const box = document.createElement('div');
    field.before(box);
    box.append(field);
    const boxScroll = scroller(box);
    place(box, 300, 720, ['window']);
    place(bar, 700, 760, []);
    place(control, 600, 690, ['inner', 'window']);
    place(field, 576, 712, ['inner', 'window']);
    innerRoom = 10;
    control.focus();
    uncover(control, bar);
    // The box scrolls first and runs out after 10px; the window takes the 18px still covered.
    expect(boxScroll).toHaveBeenCalledExactlyOnceWith({ top: 28, behavior: 'instant' });
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 18, behavior: 'instant' });
    expect(field.getBoundingClientRect().bottom).toBe(684);
  });

  it('clears the control alone outside a field', () => {
    const { bar, holder } = form();
    const input = document.createElement('input');
    input.setAttribute('aria-label', 'Reference');
    holder.prepend(input);
    place(bar, 700, 760, []);
    place(input, 650, 690, ['window']);
    input.focus();
    uncover(input, bar);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 6, behavior: 'instant' });
  });

  it('does nothing once focus has moved on', () => {
    const { control, field, bar } = form();
    place(bar, 700, 760, []);
    place(control, 600, 690, ['window']);
    place(field, 576, 712, ['window']);
    uncover(control, bar);
    expect(windowScroll).not.toHaveBeenCalled();
  });
});
