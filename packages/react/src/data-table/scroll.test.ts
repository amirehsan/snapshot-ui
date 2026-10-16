import { afterEach, describe, expect, it, vi } from 'vitest';
import { uncover } from './scroll';

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
});
