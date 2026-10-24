import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { domainPreset, emailPreset, pathPreset, type TagInputPreset } from './presets';

/** What a preset makes of `text`: split, then each piece cleaned, the empty ones dropped. */
const clean = (preset: TagInputPreset, text: string): string[] =>
  preset
    .split(text)
    .map(preset.normalize)
    .filter((value) => value !== '');

/** Whether the preset adds `text` as one value. */
const accepts = (preset: TagInputPreset, text: string): boolean => {
  const [value, ...rest] = clean(preset, text);
  return rest.length === 0 && value !== undefined && preset.isValid(value);
};

const keyOf = (preset: TagInputPreset, value: string): string => (preset.key ?? ((v: string) => v))(value);

describe('emailPreset', () => {
  it.each([
    ['Ana <ana@Example.COM>', 'ana@example.com'],
    ['mailto:BO@x.io', 'BO@x.io'],
    ['  cy@example.com  ', 'cy@example.com'],
    ['<dee@example.org>', 'dee@example.org'],
  ])('cleans %s to %s', (text, value) => {
    expect(clean(emailPreset, text)).toEqual([value]);
  });

  it.each([
    ['a@b', false],
    ['a@b.c', true],
    ['ana@exa_mple.com', false],
    ['ana@example.com', true],
    ["o'neil+news@mail.example.co.uk", true],
    ['ana@-example.com', false],
    ['ana example.com', false],
  ])('accepts %s: %s', (text, valid) => {
    expect(accepts(emailPreset, text)).toBe(valid);
  });

  it('compares without case', () => {
    expect(keyOf(emailPreset, 'Ana@Example.com')).toBe(keyOf(emailPreset, 'ana@example.com'));
  });

  it.each([
    ['ana@bücher.de', 'ana@bücher.de', true],
    ['ana@BÜCHER.de', 'ana@bücher.de', true],
    ['ana@bu\u0308cher.de', 'ana@bücher.de', true],
    ['ana@हिन्दी.भारत', 'ana@हिन्दी.भारत', true],
    ['ana@مثال.ایران', 'ana@مثال.ایران', true],
    ['anä@example.com', 'anä@example.com', false],
  ])('takes a domain in any script, as an email box does: %s', (text, value, valid) => {
    expect(clean(emailPreset, text)).toEqual([value]);
    expect(accepts(emailPreset, text)).toBe(valid);
  });

  it('splits a pasted list on commas, semicolons, new lines and spaces, and takes the address from a name', () => {
    expect(
      clean(emailPreset, 'Ana Smith <ana@example.com>, bo@example.com;\ncy@example.com dee@example.com\r\n'),
    ).toEqual(['ana@example.com', 'bo@example.com', 'cy@example.com', 'dee@example.com']);
  });

  it('keeps every address in a piece holding a name, in order, and drops only the name', () => {
    expect(clean(emailPreset, 'Ana <ana@example.com> Bo <bo@example.com>')).toEqual([
      'ana@example.com',
      'bo@example.com',
    ]);
    expect(clean(emailPreset, 'ana@example.com <bo@example.com> cy@example.com')).toEqual([
      'ana@example.com',
      'bo@example.com',
      'cy@example.com',
    ]);
    expect(clean(emailPreset, '"ana@example.com" <ana@example.com>')).toEqual(['ana@example.com']);
  });

  it('never splits inside quotes, so a quoted name or local part stays whole', () => {
    expect(clean(emailPreset, '"Smith, Ana" <ana@example.com>; bo@example.com')).toEqual([
      'ana@example.com',
      'bo@example.com',
    ]);
    // The standard refuses a quoted local part, so it stays in the box as typed, not cut at its space.
    expect(clean(emailPreset, '"ana smith"@example.com')).toEqual(['"ana smith"@example.com']);
    expect(accepts(emailPreset, '"ana smith"@example.com')).toBe(false);
  });

  it('opens an email keyboard, left to right, with nothing corrected', () => {
    expect(emailPreset.inputProps).toEqual({
      inputMode: 'email',
      autoComplete: 'off',
      autoCapitalize: 'none',
      spellCheck: false,
      dir: 'ltr',
      enterKeyHint: 'enter',
    });
    expect(emailPreset.delimiters).toEqual([',', ';', ' ']);
    expect(emailPreset.join).toBe(', ');
    expect(emailPreset.invalidMessage('2')).toBe(
      'Enter email addresses in the correct format, like name@example.com',
    );
  });
});

describe('domainPreset', () => {
  it.each([
    ['https://Example.com:8080/path?q', 'example.com'],
    ['example.com.', 'example.com'],
    ['EXAMPLE.org#top', 'example.org'],
    ['shop.example.com:443', 'shop.example.com'],
  ])('cleans %s to %s', (text, value) => {
    expect(clean(domainPreset, text)).toEqual([value]);
  });

  it.each([
    ['*.example.com', true],
    ['ex-.com', false],
    ['-ex.com', false],
    ['1.2.3.4', false],
    ['example', false],
    ['مثال.ایران', true],
    ['a-b.example.com', true],
  ])('accepts %s: %s', (text, valid) => {
    expect(accepts(domainPreset, text)).toBe(valid);
  });

  it.each([
    // Devanagari and Thai write vowels and tones as marks, which a label holds after its first letter.
    ['हिन्दी.भारत', true],
    ['ไทย.ไทย', true],
    ['เว็บ.ไทย', true],
    ['\u0301ex.com', false],
  ])('accepts a label in any script, marks included: %s %s', (text, valid) => {
    expect(accepts(domainPreset, text)).toBe(valid);
  });

  it('composes a decomposed name, so it passes and is the same as the composed one', () => {
    const decomposed = 'bu\u0308cher.de';
    expect(clean(domainPreset, decomposed)).toEqual(['bücher.de']);
    expect(accepts(domainPreset, decomposed)).toBe(true);
  });

  it('refuses a name longer than 253 characters and accepts one of 253', () => {
    const label = 'a'.repeat(61);
    // Four labels of 61 and their dots make 248 characters; a last label of 5 or 6 makes 253 or 254.
    const stem = `${label}.${label}.${label}.${label}.`;
    expect(`${stem}abcde`).toHaveLength(253);
    expect(accepts(domainPreset, `${stem}abcde`)).toBe(true);
    expect(accepts(domainPreset, `${stem}abcdef`)).toBe(false);
  });

  it('splits a pasted list on commas, semicolons, white space and new lines', () => {
    expect(clean(domainPreset, 'example.com, example.org;\nexample.net example.io')).toEqual([
      'example.com',
      'example.org',
      'example.net',
      'example.io',
    ]);
  });

  it('opens a URL keyboard, left to right', () => {
    expect(domainPreset.inputProps?.inputMode).toBe('url');
    expect(domainPreset.inputProps?.dir).toBe('ltr');
    expect(domainPreset.delimiters).toEqual([',', ';', ' ']);
    expect(domainPreset.invalidMessage('1')).toBe('Enter domains like example.com');
  });
});

describe('pathPreset', () => {
  it.each([
    ['blog', '/blog'],
    ['https://x.io/a//b/', '/a/b'],
    ['/', '/'],
    ['//', '/'],
    ['/blog/', '/blog'],
    ['https://x.io/caf%C3%A9', '/café'],
  ])('cleans %s to %s', (text, value) => {
    expect(clean(pathPreset, text)).toEqual([value]);
  });

  it.each([
    ['/a b', false],
    ['/a#b', false],
    ['/blog/*', true],
    ['/', true],
  ])('accepts %s: %s', (value, valid) => {
    // Tried whole, without the split, which would part "/a b" at its space.
    expect(pathPreset.isValid(pathPreset.normalize(value))).toBe(valid);
  });

  it('compares with case, as servers treat paths', () => {
    expect(keyOf(pathPreset, '/Blog')).not.toBe(keyOf(pathPreset, '/blog'));
  });

  it('splits a pasted list on commas, white space and new lines, never on a semicolon', () => {
    expect(clean(pathPreset, '/blog, /shop\n/a;b')).toEqual(['/blog', '/shop', '/a;b']);
    expect(pathPreset.delimiters).toEqual([',', ' ']);
    expect(pathPreset.inputProps?.inputMode).toBe('url');
    expect(pathPreset.invalidMessage('1')).toBe('Enter paths that start with a slash, like /blog');
  });
});

describe('the presets module', () => {
  // A server action imports the presets with their functions (ruling 11), so the module is no client module and
  // brings no React or React Aria with it.
  it('imports nothing from react or react-aria-components and has no use client directive', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'presets.ts'), 'utf8');
    expect(source).not.toMatch(/^['"]use client['"];?$/m);
    expect(source).not.toMatch(/^import\b/m);
    expect(source).not.toMatch(/from ['"](react|react-dom|react-aria-components|lucide-react)['"]/);
  });

  it('reads no URL at import, only inside a function', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'presets.ts'), 'utf8');
    const outside = source.replace(/function pathOf[\s\S]*?\n}\n/, '');
    expect(outside).not.toContain('new URL(');
  });
});
