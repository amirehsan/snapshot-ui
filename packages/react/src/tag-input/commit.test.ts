import { describe, expect, it } from 'vitest';
import { commitText, hasDelimiter } from './commit';
import { domainPreset, emailPreset } from './presets';

const ANA = 'ana@example.com';
const BO = 'bo@example.com';
const CY = 'cy@example.com';

describe("commitText in 'enter' mode", () => {
  it('adds the valid new candidates in order and empties the text', () => {
    expect(commitText(`${ANA}, ${BO}`, [], emailPreset, { mode: 'enter' })).toEqual({
      values: [ANA, BO],
      added: [ANA, BO],
      duplicates: [],
      text: '',
      reason: null,
      refused: 0,
    });
  });

  it('keeps refused candidates joined in order with their count and the invalid reason', () => {
    const result = commitText(`ana@example, ${BO}, cy@x`, [ANA], emailPreset, { mode: 'enter' });
    expect(result.values).toEqual([ANA, BO]);
    expect(result.added).toEqual([BO]);
    expect(result.text).toBe('ana@example, cy@x');
    expect(result.reason).toBe('invalid');
    expect(result.refused).toBe(2);
  });

  it('drops duplicates against the values and within the text, by the preset key', () => {
    const result = commitText(`${BO}, Ana@Example.com, ${BO}`, [ANA], emailPreset, { mode: 'enter' });
    expect(result.values).toEqual([ANA, BO]);
    expect(result.added).toEqual([BO]);
    expect(result.duplicates).toEqual(['Ana@example.com', BO]);
    expect(result.text).toBe('');
    expect(result.reason).toBeNull();
  });

  it('stops at maxValues and leaves the rest in the text with the limit reason', () => {
    const result = commitText(`${BO}, ${CY}, dee@example.com`, [ANA], emailPreset, {
      mode: 'enter',
      maxValues: 2,
    });
    expect(result.values).toEqual([ANA, BO]);
    expect(result.text).toBe(`${CY}, dee@example.com`);
    expect(result.reason).toBe('limit');
    expect(result.refused).toBe(0);
  });

  it('says invalid before limit when both leave text, keeping the order the text had', () => {
    const result = commitText(`${BO}, nope, ${CY}`, [ANA], emailPreset, { mode: 'enter', maxValues: 2 });
    expect(result.text).toBe(`nope, ${CY}`);
    expect(result.reason).toBe('invalid');
    expect(result.refused).toBe(1);
  });

  it('returns the values unchanged for an empty or blank text', () => {
    expect(commitText('  ,  ', [ANA], emailPreset, { mode: 'enter' })).toMatchObject({
      values: [ANA],
      added: [],
      text: '',
      reason: null,
    });
  });
});

describe("commitText in 'typed' mode", () => {
  it('keeps the tail after the last delimiter and adds the candidates before it when all pass', () => {
    const result = commitText(`${ANA}, ${BO} cy@ex`, [], emailPreset, { mode: 'typed' });
    expect(result.values).toEqual([ANA, BO]);
    expect(result.text).toBe('cy@ex');
    expect(result.reason).toBeNull();
  });

  it('returns the text unchanged with no reason while a candidate before the delimiter fails', () => {
    // A space typed inside "Ana Smith <ana@example.com>" waits for the address.
    for (const text of ['Ana ', 'Ana Smith <ana@ex', `nope, ${BO},`]) {
      expect(commitText(text, [], emailPreset, { mode: 'typed' })).toEqual({
        values: [],
        added: [],
        duplicates: [],
        text,
        reason: null,
        refused: 0,
      });
    }
  });

  it('adds a named address once its delimiter is typed', () => {
    const result = commitText('Ana Smith <ana@example.com>,', [], emailPreset, { mode: 'typed' });
    expect(result.values).toEqual([ANA]);
    expect(result.text).toBe('');
  });

  it('returns the text unchanged with no reason past the limit', () => {
    const result = commitText(`${BO},`, [ANA], emailPreset, { mode: 'typed', maxValues: 1 });
    expect(result).toMatchObject({ values: [ANA], text: `${BO},`, reason: null });
  });

  it('drops a duplicate before the delimiter and says so', () => {
    const result = commitText(`${ANA} `, [ANA], emailPreset, { mode: 'typed' });
    expect(result).toMatchObject({ values: [ANA], duplicates: [ANA], text: '', reason: null });
  });

  it('leaves text with no delimiter as it is', () => {
    expect(commitText(ANA, [], emailPreset, { mode: 'typed' }).text).toBe(ANA);
  });

  it('ends a value on a new line whatever the delimiters', () => {
    expect(commitText('example.com\nexa', [], domainPreset, { mode: 'typed' })).toMatchObject({
      values: ['example.com'],
      text: 'exa',
    });
  });
});

describe('hasDelimiter', () => {
  it.each([
    ['ana@example.com', false],
    ['ana@example.com,', true],
    ['ana@example.com;', true],
    ['ana@example.com ', true],
    ['ana@example.com\n', true],
  ])('%j: %s', (text, found) => {
    expect(hasDelimiter(text, emailPreset)).toBe(found);
  });
});
