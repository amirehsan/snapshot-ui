import { createElement } from 'react';
import { describe, expect, it } from 'vitest';
import { present } from './present';

describe('present', () => {
  it.each([
    ['null', null],
    ['undefined', undefined],
    ['false', false],
    ['true', true],
    ['an empty string', ''],
  ])('finds nothing to draw in %s', (_name, node) => {
    expect(present(node)).toBe(false);
  });

  it.each([
    ['text', 'Owner'],
    ['a space', ' '],
    ['zero', 0],
    ['an element', createElement('strong', null, 'Owner')],
    ['a list', ['Owner', null]],
  ])('finds something to draw in %s', (_name, node) => {
    expect(present(node)).toBe(true);
  });
});
