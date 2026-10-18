import { createElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isBulkActionData, isDrawn } from './bulk-actions';

const noop = (): void => undefined;

describe('isBulkActionData', () => {
  it('takes an array of plain actions as data, an empty one included', () => {
    expect(isBulkActionData([{ id: 'export', label: 'Export', onAction: noop }])).toBe(true);
    expect(
      isBulkActionData([
        { id: 'export', label: 'Export', onAction: noop, isPromoted: true, icon: createElement('svg') },
        { id: 'delete', label: 'Delete', onAction: noop, isDisabled: true },
      ]),
    ).toBe(true);
    expect(isBulkActionData([])).toBe(true);
  });

  it('takes an array of nodes, elements, strings and null as a node (spec correction 18)', () => {
    expect(isBulkActionData([createElement('button', { key: 'a' }, 'Export')])).toBe(false);
    expect(isBulkActionData(['Export', 'Delete'])).toBe(false);
    expect(isBulkActionData([null, false])).toBe(false);
    expect(isBulkActionData(createElement('button', null, 'Export'))).toBe(false);
    expect(isBulkActionData('Export')).toBe(false);
    expect(isBulkActionData(null)).toBe(false);
    expect(isBulkActionData(undefined)).toBe(false);
  });

  it('takes a mixed array, or an object missing a field, as a node', () => {
    expect(
      isBulkActionData([
        { id: 'export', label: 'Export', onAction: noop },
        createElement('button', { key: 'b' }),
      ]),
    ).toBe(false);
    expect(isBulkActionData([{ id: 'export', label: 'Export' }])).toBe(false);
    expect(isBulkActionData([{ id: 1, label: 'Export', onAction: noop }])).toBe(false);
    expect(isBulkActionData([{ label: 'Export', onAction: noop }])).toBe(false);
  });
});

describe('isDrawn', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is true for an element with a box and false for one under display none (spec correction 14)', () => {
    const shown = document.createElement('button');
    const hidden = document.createElement('button');
    document.body.append(shown, hidden);
    // jsdom lays nothing out: a drawn element has a client rect, one under display: none has none.
    vi.spyOn(shown, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 40, 40)] as unknown as DOMRectList);
    vi.spyOn(hidden, 'getClientRects').mockReturnValue([] as unknown as DOMRectList);
    expect(isDrawn(shown)).toBe(true);
    expect(isDrawn(hidden)).toBe(false);
    shown.remove();
    hidden.remove();
  });

  it('is false for an element no longer in the document', () => {
    const gone = document.createElement('button');
    vi.spyOn(gone, 'getClientRects').mockReturnValue([new DOMRect(0, 0, 40, 40)] as unknown as DOMRectList);
    expect(isDrawn(gone)).toBe(false);
  });
});
