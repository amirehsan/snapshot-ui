import { PersianCalendar, parseDate, toCalendar } from '@internationalized/date';
import { describe, expect, it } from 'vitest';
import { parseIso, parseIsoRange, toIso } from './iso';

describe('the ISO helpers', () => {
  it('parses an ISO date and writes it back', () => {
    const date = parseIso('2026-09-14');
    expect(date).not.toBeNull();
    expect(date).not.toBe('invalid');
    if (date === null || date === 'invalid') return;
    expect([date.year, date.month, date.day]).toEqual([2026, 9, 14]);
    expect(toIso(date)).toBe('2026-09-14');
    expect(parseIso(null)).toBeNull();
    expect(parseIso(undefined)).toBeNull();
  });

  it('reads a malformed or impossible date as invalid, never throwing', () => {
    for (const value of ['2026-13-01', '2026-02-30', 'tomorrow', '', '2026-9-14']) {
      expect(parseIso(value), value).toBe('invalid');
    }
  });

  it('reads a reversed range as invalid and a one-day range as a range', () => {
    expect(parseIsoRange({ start: '2026-09-18', end: '2026-09-07' })).toBe('invalid');
    expect(parseIsoRange({ start: '2026-09-07', end: 'soon' })).toBe('invalid');
    expect(parseIsoRange(null)).toBeNull();
    expect(parseIsoRange(undefined)).toBeNull();
    const day = parseIsoRange({ start: '2026-09-07', end: '2026-09-07' });
    if (day === null || day === 'invalid') throw new Error('Expected a range');
    expect([toIso(day.start), toIso(day.end)]).toEqual(['2026-09-07', '2026-09-07']);
    const range = parseIsoRange({ start: '2026-09-07', end: '2026-09-18' });
    if (range === null || range === 'invalid') throw new Error('Expected a range');
    expect([toIso(range.start), toIso(range.end)]).toEqual(['2026-09-07', '2026-09-18']);
  });

  it('writes a Persian date as its Gregorian ISO date', () => {
    const persian = toCalendar(parseDate('2026-09-14'), new PersianCalendar());
    expect(persian.calendar.identifier).toBe('persian');
    expect(toIso(persian)).toBe('2026-09-14');
  });
});
