import { describe, expect, it } from 'vitest';
import { hasModifier, isRightToLeft, moveFrom, PAGE } from './keys';

describe('moveFrom', () => {
  const withData = [0, 1, 2, 5, 6, 9, 10, 11, 20];

  it('moves to the next and the previous position with data, skipping gaps, and stays at either end', () => {
    expect(moveFrom(withData, 2, 'next')).toBe(5);
    expect(moveFrom(withData, 5, 'previous')).toBe(2);
    expect(moveFrom(withData, 20, 'next')).toBe(20);
    expect(moveFrom(withData, 0, 'previous')).toBe(0);
    expect(moveFrom([], 3, 'next')).toBe(3);
  });

  it('goes to the first and the last position with data', () => {
    expect(moveFrom(withData, 6, 'first')).toBe(0);
    expect(moveFrom(withData, 6, 'last')).toBe(20);
    expect(moveFrom([], 6, 'last')).toBe(6);
  });

  it('moves a page of seven back or forward and lands on data, or at the end', () => {
    expect(PAGE).toBe(7);
    expect(moveFrom(withData, 2, 'page-forward')).toBe(9);
    expect(moveFrom(withData, 6, 'page-forward')).toBe(20);
    expect(moveFrom(withData, 11, 'page-forward')).toBe(20);
    expect(moveFrom(withData, 20, 'page-forward')).toBe(20);
    expect(moveFrom(withData, 20, 'page-back')).toBe(11);
    expect(moveFrom(withData, 9, 'page-back')).toBe(2);
    expect(moveFrom(withData, 5, 'page-back')).toBe(0);
    expect(moveFrom(withData, 0, 'page-back')).toBe(0);
  });
});

describe('isRightToLeft', () => {
  /** The innermost element of `html`, built in a fresh container. */
  const innermost = (html: string): Element => {
    const holder = document.createElement('div');
    holder.innerHTML = html;
    let element: Element = holder;
    while (element.firstElementChild) element = element.firstElementChild;
    return element;
  };

  it('reads the nearest ltr or rtl dir attribute and looks past auto', () => {
    expect(isRightToLeft(innermost('<div dir="rtl"><span></span></div>'))).toBe(true);
    expect(isRightToLeft(innermost('<div dir="RTL"><span></span></div>'))).toBe(true);
    expect(isRightToLeft(innermost('<div dir="rtl"><div dir="ltr"><span></span></div></div>'))).toBe(false);
    expect(isRightToLeft(innermost('<div dir="rtl"><div dir="auto"><span></span></div></div>'))).toBe(true);
    expect(isRightToLeft(innermost('<div dir="ltr"><div dir="auto"><span></span></div></div>'))).toBe(false);
    // The element's own attribute counts, and with none anywhere the drawing runs left to right.
    expect(isRightToLeft(innermost('<span dir="rtl"></span>'))).toBe(true);
    expect(isRightToLeft(innermost('<div><span></span></div>'))).toBe(false);
  });
});

describe('hasModifier', () => {
  const keys = { altKey: false, ctrlKey: false, metaKey: false };

  it('treats Alt, Control and Meta as a modifier and Shift as none', () => {
    expect(hasModifier(keys)).toBe(false);
    expect(hasModifier({ ...keys, altKey: true })).toBe(true);
    expect(hasModifier({ ...keys, ctrlKey: true })).toBe(true);
    expect(hasModifier({ ...keys, metaKey: true })).toBe(true);
    expect(hasModifier({ ...keys, shiftKey: true } as typeof keys)).toBe(false);
  });
});
