import { afterEach, describe, expect, it, vi } from 'vitest';
import { pageStickyTop, uncover } from './scroll';

/** A grid with a header cell and a row, in a root with a bar, laid out at the given tops and bottoms. */
function layout(
  row: [number, number],
  bar: [number, number] | null,
): { root: HTMLElement; target: HTMLElement } {
  const root = document.createElement('div');
  root.innerHTML = `<table role="grid"><thead><tr><th role="columnheader">Payee</th></tr></thead><tbody><tr role="row" tabindex="-1"><td>Corner Mart</td></tr></tbody></table>${bar === null ? '' : '<div class="data-table-bar"></div>'}`;
  document.body.append(root);
  const rect = (top: number, bottom: number): DOMRect => ({
    top,
    bottom,
    left: 0,
    right: 0,
    x: 0,
    y: top,
    width: 0,
    height: bottom - top,
    toJSON: () => ({}),
  });
  const target = root.querySelector<HTMLElement>('[role="row"]');
  if (target === null) throw new Error('No row');
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.getAttribute('role') === 'columnheader') return rect(64, 104);
    if (this.classList.contains('data-table-bar') && bar !== null) return rect(...bar);
    if (this === target) return rect(...row);
    return rect(0, 0);
  });
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
  target.focus();
  return { root, target };
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.restoreAllMocks();
});

describe('uncover', () => {
  it('scrolls a row under the sticky header down by the part it covers', () => {
    const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const { root, target } = layout([80, 128], null);
    uncover(target, root);
    expect(scroll).toHaveBeenCalledWith({ top: -24, behavior: 'instant' });
  });

  it('scrolls a row under the bar up by the part it covers, and leaves a clear row alone', () => {
    const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const { root, target } = layout([793, 841], [826, 884]);
    uncover(target, root);
    expect(scroll).toHaveBeenCalledWith({ top: 15, behavior: 'instant' });
    scroll.mockClear();
    const clear = layout([400, 448], [826, 884]);
    uncover(clear.target, clear.root);
    expect(scroll).not.toHaveBeenCalled();
  });

  it('does nothing once focus has moved on', () => {
    const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const { root, target } = layout([80, 128], null);
    target.blur();
    uncover(target, root);
    expect(scroll).not.toHaveBeenCalled();
  });

  it('keeps an ungrouped list item clear of the page sticky header, and of the list head while it sticks', () => {
    const scroll = vi.spyOn(window, 'scrollBy').mockImplementation(() => undefined);
    const { root, target, head } = list([4, 60], 64);
    // No heading in an ungrouped list: the page's 64px header is the cover.
    uncover(target, root);
    expect(scroll).toHaveBeenLastCalledWith({ top: -60, behavior: 'instant' });
    // In Select mode the head sticks under the page header, 41px more.
    head.setAttribute('data-selecting', '');
    uncover(target, root);
    expect(scroll).toHaveBeenLastCalledWith({ top: -101, behavior: 'instant' });
  });

  it('reads the page sticky offset from the grid, resolved, and 0 where it is unset', () => {
    const { target } = list([200, 256], 64);
    const grid = target.closest('[role="grid"]');
    if (grid === null) throw new Error('No grid');
    expect(pageStickyTop(grid)).toBe(64);
    expect(pageStickyTop(document.body)).toBe(0);
  });
});

/**
 * An ungrouped list face, its item at `item`, under a page whose sticky offset the grid resolves to `stickyTop`,
 * with the list's head drawn at 64 to 105 (stuck under the page header) and no bar.
 */
function list(
  item: [number, number],
  stickyTop: number,
): { root: HTMLElement; target: HTMLElement; head: HTMLElement } {
  const root = document.createElement('div');
  root.innerHTML =
    '<div class="data-table-list"><div class="data-table-list-head"></div><div role="grid" class="data-table-grid-list"><div class="data-table-item" role="row" tabindex="-1"></div></div></div>';
  document.body.append(root);
  const target = root.querySelector<HTMLElement>('[role="row"]');
  const head = root.querySelector<HTMLElement>('.data-table-list-head');
  const grid = root.querySelector('[role="grid"]');
  if (target === null || head === null || grid === null) throw new Error('No list');
  const rect = (top: number, bottom: number): DOMRect => ({
    top,
    bottom,
    left: 0,
    right: 0,
    x: 0,
    y: top,
    width: 0,
    height: bottom - top,
    toJSON: () => ({}),
  });
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this === head) return rect(64, 105);
    if (this === target) return rect(...item);
    return rect(0, 0);
  });
  const computed = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = computed(element, pseudo);
    if (element !== grid) return style;
    // jsdom resolves no scroll margin; a browser gives the offset in pixels.
    return new Proxy(style, {
      get: (object, property) =>
        property === 'getPropertyValue'
          ? (name: string) =>
              name === 'scroll-margin-block-start' ? `${String(stickyTop)}px` : object.getPropertyValue(name)
          : (Reflect.get(object, property) as unknown),
    });
  });
  vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(900);
  target.focus();
  return { root, target, head };
}
