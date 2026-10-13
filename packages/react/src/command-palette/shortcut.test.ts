// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { matchesShortcut, parseShortcut } from './shortcut';

/**
 * The parts of a keydown the matcher reads, as a browser's KeyboardEvent carries them, with every modifier up
 * and nothing prevented unless the test says otherwise. Node has no KeyboardEvent, and the matcher needs none.
 */
function keydown(init: Partial<KeyboardEvent>): KeyboardEvent {
  return {
    key: 'k',
    code: 'KeyK',
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    defaultPrevented: false,
    ...init,
  } as KeyboardEvent;
}

describe('parseShortcut', () => {
  it('reads Mod+K as the modifier and the key', () => {
    expect(parseShortcut('Mod+K')).toEqual({ mod: true, shift: false, alt: false, key: 'K' });
  });

  it('reads the modifiers in any order and case, and keeps the key as written', () => {
    expect(parseShortcut('mod+shift+p')).toEqual({ mod: true, shift: true, alt: false, key: 'p' });
    expect(parseShortcut('Alt+MOD+j')).toEqual({ mod: true, shift: false, alt: true, key: 'j' });
  });

  it('reads a lone key as a key with no modifier', () => {
    expect(parseShortcut('K')).toEqual({ mod: false, shift: false, alt: false, key: 'K' });
  });

  it('throws on a shortcut that names no key, and on a modifier it does not know', () => {
    expect(() => parseShortcut('Mod+')).toThrow('names no key');
    expect(() => parseShortcut('')).toThrow('names no key');
    expect(() => parseShortcut('Ctrl+K')).toThrow('unknown modifier "Ctrl"');
  });
});

describe('matchesShortcut', () => {
  const modK = parseShortcut('Mod+K');

  it('matches Mod with either Cmd or Ctrl, and the key in either case', () => {
    expect(matchesShortcut(keydown({ metaKey: true }), modK)).toBe(true);
    expect(matchesShortcut(keydown({ ctrlKey: true }), modK)).toBe(true);
    expect(matchesShortcut(keydown({ metaKey: true, key: 'K' }), modK)).toBe(true);
    expect(matchesShortcut(keydown({ ctrlKey: true, key: 'K' }), modK)).toBe(true);
  });

  it('does not match with a modifier the shortcut does not list', () => {
    expect(matchesShortcut(keydown({ metaKey: true, altKey: true }), modK)).toBe(false);
    expect(matchesShortcut(keydown({ metaKey: true, shiftKey: true }), modK)).toBe(false);
  });

  it('does not match another key, or the key with no modifier down', () => {
    expect(matchesShortcut(keydown({ metaKey: true, key: 'j' }), modK)).toBe(false);
    expect(matchesShortcut(keydown({}), modK)).toBe(false);
  });

  it('leaves a key an editor has taken, or one typed while composing, alone', () => {
    expect(matchesShortcut(keydown({ metaKey: true, defaultPrevented: true }), modK)).toBe(false);
    expect(matchesShortcut(keydown({ metaKey: true, isComposing: true }), modK)).toBe(false);
  });

  it('matches by position on a Persian layout, where Ctrl+K types the letter noon', () => {
    expect(matchesShortcut(keydown({ ctrlKey: true, key: '\u0646', code: 'KeyK' }), modK)).toBe(true);
    expect(matchesShortcut(keydown({ ctrlKey: true, key: '\u0646', code: 'KeyJ' }), modK)).toBe(false);
  });

  it('matches by position on a Russian layout, where Cmd+K types the letter el', () => {
    expect(matchesShortcut(keydown({ metaKey: true, key: '\u043B', code: 'KeyK' }), modK)).toBe(true);
    // A digit matches by position too, and Option on a Mac, which types a symbol, falls back the same way.
    expect(
      matchesShortcut(keydown({ ctrlKey: true, key: '\u0661', code: 'Digit1' }), parseShortcut('Mod+1')),
    ).toBe(true);
    expect(
      matchesShortcut(keydown({ altKey: true, key: '\u02DA', code: 'KeyK' }), parseShortcut('Alt+K')),
    ).toBe(true);
  });

  it('matches the printed letter on a Latin layout that moves the keys, such as Dvorak, and not the position', () => {
    // On Dvorak the key where QWERTY has K types t, and K sits where QWERTY has V.
    expect(matchesShortcut(keydown({ ctrlKey: true, key: 't', code: 'KeyK' }), modK)).toBe(false);
    expect(matchesShortcut(keydown({ ctrlKey: true, key: 'k', code: 'KeyV' }), modK)).toBe(true);
  });

  it('matches every modifier a shortcut lists, and a lone key only with every modifier up', () => {
    const palette = parseShortcut('Mod+Shift+P');
    expect(matchesShortcut(keydown({ ctrlKey: true, shiftKey: true, key: 'P' }), palette)).toBe(true);
    expect(matchesShortcut(keydown({ ctrlKey: true, key: 'p' }), palette)).toBe(false);
    const slash = parseShortcut('/');
    expect(matchesShortcut(keydown({ key: '/' }), slash)).toBe(true);
    expect(matchesShortcut(keydown({ key: '/', metaKey: true }), slash)).toBe(false);
  });
});
