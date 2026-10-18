import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearance, registerChrome, uncover, type Box, type Cover } from './focus-clear';

/*
 * jsdom has no layout, so each box is a rectangle the test places, moved by the scroll each port has taken: the
 * page's content by the window's, a scroller's content by its own and the window's. Chrome is sticky or fixed in
 * its port, so it stays where it is drawn, unless the test says it rests in the page's flow. The view is 800px
 * tall and 1280px wide.
 */

/** The window's scroll and an inner scroller's, as the stubbed `scrollBy`s move them. */
let scrolled = { window: 0, inner: 0 };

/** How far the inner scroller can still scroll, so a nested case leaves the rest to the window. */
let innerRoom = Infinity;

const VIEW = 800;

/** Gives `element` a fixed box, moved up by the scroll of the ports it sits in, across `left` to `right`. */
function place(
  element: Element,
  top: number,
  bottom: number,
  ports: ('window' | 'inner')[],
  [left, right] = [0, 1280],
): void {
  element.getBoundingClientRect = () => {
    const shift = ports.reduce((sum, port) => sum + scrolled[port], 0);
    return { top: top - shift, bottom: bottom - shift, height: bottom - top, left, right } as DOMRect;
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

/** A form: a labelled text area with a description, and a save bar, its last child, sticky with a 16px inset. */
function form(): { control: HTMLTextAreaElement; field: HTMLElement; bar: HTMLElement; holder: HTMLElement } {
  const holder = document.createElement('form');
  holder.innerHTML =
    '<div class="field"><label for="memo">Memo</label><textarea id="memo"></textarea><p>Shown on the receipt.</p></div>' +
    '<div class="save-bar" role="group" aria-label="2 changes" data-position="sticky" data-bottom="16px">' +
    '<button type="button">Save</button></div>';
  document.body.append(holder);
  const control = holder.querySelector('textarea');
  const field = holder.querySelector<HTMLElement>('.field');
  const bar = holder.querySelector<HTMLElement>('.save-bar');
  if (!control || !field || !bar) throw new Error('No form');
  return { control, field, bar, holder };
}

/** A piece of fixed chrome after the form, with a 16px gap, such as the phone's upload bar or the wide panel. */
function fixed(className: string): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  element.dataset.position = 'fixed';
  element.dataset.gap = '16px';
  document.body.append(element);
  return element;
}

const windowScroll = vi.fn(({ top = 0 }: ScrollToOptions) => {
  scrolled.window += top;
});

/** What each test registered, taken away after it. */
let unregister: (() => void)[] = [];
const register = (element: HTMLElement, edge: 'top' | 'bottom'): void => {
  unregister.push(registerChrome(element, edge));
};

beforeEach(() => {
  scrolled = { window: 0, inner: 0 };
  innerRoom = Infinity;
  windowScroll.mockClear();
  vi.spyOn(window, 'scrollBy').mockImplementation(windowScroll as unknown as typeof window.scrollBy);
  Object.defineProperty(document.documentElement, 'clientHeight', { value: VIEW, configurable: true });
  // The save bar's scroll margin holds the page's sticky offset, 64px, and the gap, 16px, resolved
  // (save-bar.css); other chrome names its gap in data-gap, and its position in data-position.
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
    const data = element instanceof HTMLElement ? element.dataset : {};
    const isBar = element.classList.contains('save-bar');
    const values: Record<string, string | undefined> = {
      'scroll-margin-block-start': isBar ? '64px' : '0px',
      'scroll-margin-block-end': isBar ? '16px' : (data.gap ?? '0px'),
      top: data.top ?? 'auto',
      bottom: data.bottom ?? 'auto',
    };
    return {
      overflowY: 'scrolls' in data ? 'auto' : 'visible',
      position: data.position ?? 'static',
      getPropertyValue: (name: string) => values[name] ?? '',
    } as unknown as CSSStyleDeclaration;
  });
});

afterEach(() => {
  for (const each of unregister) each();
  unregister = [];
  vi.restoreAllMocks();
  vi.useRealTimers();
  document.body.innerHTML = '';
});

const box = (top: number, bottom: number, left = 0, right = 1280): Box => ({ top, bottom, left, right });
const cover = (top: number, bottom: number, gap = 16, left = 0, right = 1280): Cover => ({
  ...box(top, bottom, left, right),
  gap,
});

describe('clearance', () => {
  it('brings the box the gap above a bottom cover, in whole pixels', () => {
    expect(clearance(box(600, 712.25), 600, { top: [], bottom: [cover(700, 800)] }, 0)).toBe(29);
  });

  it('clears a stack to the topmost of the covers it meets on its way up', () => {
    // The tab bar, the save bar 16px above it and the phone's upload bar 16px above that.
    const covers = { top: [], bottom: [cover(736, 800), cover(660, 720), cover(596, 644)] };
    expect(clearance(box(740, 780), 740, covers, 0)).toBe(780 - (596 - 16));
  });

  it('leaves a box clear by the gap, or covered by half a pixel or less', () => {
    expect(clearance(box(500, 684.5), 500, { top: [], bottom: [cover(700, 800)] }, 0)).toBe(0);
  });

  it("never brings the control's start above the ceiling", () => {
    expect(clearance(box(100, 1022), 124.5, { top: [], bottom: [cover(700, 800)] }, 64)).toBe(60);
  });

  it('brings a box under a top cover down to its bottom, with no gap there', () => {
    expect(clearance(box(20, 60), 20, { top: [cover(0, 96, 0)], bottom: [] }, 96)).toBe(-76);
  });

  it('ignores a bottom cover wholly above the box and a top cover wholly below it', () => {
    expect(clearance(box(400, 440), 400, { top: [cover(500, 560, 0)], bottom: [cover(100, 160)] }, 0)).toBe(
      0,
    );
  });
});

describe('uncover', () => {
  it('scrolls the window until the whole field, its description included, is the gap above the save bar', () => {
    const { control, field, bar } = form();
    register(bar, 'bottom');
    place(bar, 700, 760, []);
    place(control, 600, 690, ['window']);
    place(field, 576, 712, ['window']);
    control.focus();
    uncover(control);
    // 712 - (700 - 16): the description's bottom, not the control's, and the gap.
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 28, behavior: 'instant' });
    expect(field.getBoundingClientRect().bottom).toBe(700 - 16);
  });

  it('clears the topmost cover where the window scrolls: a phone upload bar over the save bar', () => {
    const { control, field, bar } = form();
    const tray = fixed('upload-tray-bar');
    register(bar, 'bottom');
    register(tray, 'bottom');
    place(bar, 700, 760, []);
    place(tray, 636, 684, []);
    place(control, 560, 640, ['window']);
    place(field, 536, 660, ['window']);
    control.focus();
    uncover(control);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 40, behavior: 'instant' });
  });

  it('counts what is under a stuck bar, the tab bar there, as covered by it', () => {
    const { control, field, bar } = form();
    register(bar, 'bottom');
    // Stuck: 16px above the view's bottom, its sticky offset; the field is under the tab bar below it.
    place(bar, 724, 784, []);
    place(control, 790, 798, ['window']);
    place(field, 786, 799, ['window']);
    control.focus();
    uncover(control);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 799 - (724 - 16), behavior: 'instant' });
  });

  it("clears the wide panel only for a box under it across, by the panel's gap", () => {
    const { control, field, bar } = form();
    const panel = fixed('upload-tray');
    register(bar, 'bottom');
    register(panel, 'bottom');
    place(bar, 1700, 1760, ['window']);
    place(panel, 400, 720, [], [836, 1264]);
    place(control, 560, 640, ['window'], [16, 600]);
    place(field, 536, 660, ['window'], [16, 600]);
    control.focus();
    uncover(control);
    // Beside the panel, not under it.
    expect(windowScroll).not.toHaveBeenCalled();
    place(control, 560, 640, ['window'], [16, 900]);
    place(field, 536, 660, ['window'], [16, 900]);
    uncover(control);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 660 - (400 - 16), behavior: 'instant' });
  });

  it("clears a resting save bar's own button from the panel, and leaves a stuck bar's alone", () => {
    const { bar } = form();
    const save = bar.querySelector('button');
    if (!save) throw new Error('No button');
    const panel = fixed('upload-tray');
    register(bar, 'bottom');
    register(panel, 'bottom');
    place(panel, 400, 720, [], [836, 1264]);
    // At rest in the page, above its sticky place: it moves with the page.
    place(bar, 600, 660, ['window']);
    place(save, 610, 650, ['window'], [1100, 1200]);
    save.focus();
    uncover(save);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 650 - (400 - 16), behavior: 'instant' });
    windowScroll.mockClear();
    // Stuck at its offset, 16px above the view's bottom: scrolling would only move the page under it.
    scrolled.window = 0;
    place(bar, 724, 784, []);
    place(save, 734, 774, [], [1100, 1200]);
    uncover(save);
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it("never moves the page for focus on a stuck header's own button, and brings a control from under it", () => {
    const header = document.createElement('div');
    header.className = 'app-shell-header';
    header.dataset.position = 'sticky';
    header.dataset.top = '0px';
    header.innerHTML = '<button type="button">Upload</button>';
    const page = document.createElement('button');
    document.body.append(header, page);
    register(header, 'top');
    const upload = header.querySelector('button');
    if (!upload) throw new Error('No button');
    place(header, 0, 96, []);
    place(upload, 40, 80, [], [1100, 1200]);
    upload.focus();
    uncover(upload);
    expect(windowScroll).not.toHaveBeenCalled();
    place(page, 30, 70, ['window'], [300, 400]);
    page.focus();
    uncover(page);
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: -66, behavior: 'instant' });
  });

  it("clamps to the scroller's own top where the bar's holder scrolls", () => {
    const { control, field, bar, holder } = form();
    const panel = document.createElement('div');
    holder.before(panel);
    panel.append(holder);
    const panelScroll = scroller(panel);
    register(bar, 'bottom');
    place(panel, 300, 700, []);
    place(bar, 620, 680, []);
    place(control, 320, 900, ['inner']);
    place(field, 296, 922, ['inner']);
    control.focus();
    uncover(control);
    expect(panelScroll).toHaveBeenCalledExactlyOnceWith({ top: 20, behavior: 'instant' });
    expect(windowScroll).not.toHaveBeenCalled();
  });

  it("scrolls the bar's own port by what a nested scroller could not", () => {
    const { control, field, bar } = form();
    const box = document.createElement('div');
    field.before(box);
    box.append(field);
    const boxScroll = scroller(box);
    register(bar, 'bottom');
    place(box, 300, 720, ['window']);
    place(bar, 700, 760, []);
    place(control, 600, 690, ['inner', 'window']);
    place(field, 576, 712, ['inner', 'window']);
    innerRoom = 10;
    control.focus();
    uncover(control);
    // The box scrolls first and runs out after 10px; the window takes the 18px still covered.
    expect(boxScroll).toHaveBeenCalledExactlyOnceWith({ top: 28, behavior: 'instant' });
    expect(windowScroll).toHaveBeenCalledExactlyOnceWith({ top: 18, behavior: 'instant' });
    expect(field.getBoundingClientRect().bottom).toBe(684);
  });

  it('does nothing once focus has moved on', () => {
    const { control, field, bar } = form();
    register(bar, 'bottom');
    place(bar, 700, 760, []);
    place(control, 600, 690, ['window']);
    place(field, 576, 712, ['window']);
    uncover(control);
    expect(windowScroll).not.toHaveBeenCalled();
  });
});

describe('registerChrome', () => {
  it('listens on the document from the first registration to the last, two frames after a focus', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const { control, field, bar } = form();
    const tray = fixed('upload-tray-bar');
    const first = registerChrome(bar, 'bottom');
    const second = registerChrome(tray, 'bottom');
    expect(add.mock.calls.filter(([type]) => type === 'focusin')).toHaveLength(1);
    place(bar, 700, 760, []);
    place(tray, 2000, 2000, []);
    place(control, 600, 690, ['window']);
    place(field, 576, 712, ['window']);
    control.focus();
    expect(windowScroll).not.toHaveBeenCalled();
    frames.shift()?.(0);
    expect(windowScroll).not.toHaveBeenCalled();
    frames.shift()?.(0);
    expect(windowScroll).toHaveBeenCalledOnce();
    first();
    expect(remove.mock.calls.filter(([type]) => type === 'focusin')).toHaveLength(0);
    second();
    expect(remove.mock.calls.filter(([type]) => type === 'focusin')).toHaveLength(1);
  });

  it('leaves focus in a popover or a modal alone', () => {
    const frames: FrameRequestCallback[] = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => frames.push(callback));
    const { bar } = form();
    register(bar, 'bottom');
    const popover = document.createElement('div');
    popover.className = 'overlay popover';
    popover.innerHTML = '<button type="button">14</button>';
    document.body.append(popover);
    popover.querySelector('button')?.focus();
    expect(frames).toHaveLength(0);
  });
});
