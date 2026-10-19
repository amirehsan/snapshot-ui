import { describe, expect, it } from 'vitest';
import {
  GAUGE_SIZES,
  gaugeDash,
  gaugeMark,
  gaugeRest,
  gaugeShare,
  gaugeTrack,
  type GaugeSize,
} from './geometry';

/** The angle of a mark's line, in degrees: clockwise from the top for a ring, from the inline start for a semicircle. */
const turned = (size: GaugeSize, share: number, form: 'ring' | 'semicircle'): number => {
  const { box } = GAUGE_SIZES[size];
  const c = box / 2;
  const { x2, y2 } = gaugeMark(share, size, form);
  const [x, y] = [Number(x2) - c, c - Number(y2)];
  if (form === 'ring') return ((Math.atan2(x, y) * 180) / Math.PI + 360) % 360;
  return 180 - (Math.atan2(y, x) * 180) / Math.PI;
};

/** The distance of a point from the dial's centre. */
const radiusOf = (size: GaugeSize, x: string, y: string): number => {
  const c = GAUGE_SIZES[size].box / 2;
  return Math.hypot(Number(x) - c, Number(y) - c);
};

describe('the gauge geometry', () => {
  it.each([
    ['sm', '0 0 32 32', 'M16 2A14 14 0 1 1 16 30A14 14 0 1 1 16 2', '0 0 32 18', 'M2 16A14 14 0 0 1 30 16'],
    ['md', '0 0 96 96', 'M48 4A44 44 0 1 1 48 92A44 44 0 1 1 48 4', '0 0 96 52', 'M4 48A44 44 0 0 1 92 48'],
    [
      'lg',
      '0 0 160 160',
      'M80 6A74 74 0 1 1 80 154A74 74 0 1 1 80 6',
      '0 0 160 86',
      'M6 80A74 74 0 0 1 154 80',
    ],
  ] as const)(
    'draws a %s ring and semicircle in a box of its size, the radius the box less a stroke, halved',
    (size, ringBox, ringPath, semicircleBox, semicirclePath) => {
      const ring = gaugeTrack(size, 'ring');
      expect(ring.viewBox).toBe(ringBox);
      expect(ring.d).toBe(ringPath);
      expect(ring.stroke).toBe(GAUGE_SIZES[size].stroke);
      const semicircle = gaugeTrack(size, 'semicircle');
      expect(semicircle.viewBox).toBe(semicircleBox);
      expect(semicircle.d).toBe(semicirclePath);
      expect(semicircle.stroke).toBe(GAUGE_SIZES[size].stroke);
    },
  );

  it('sizes the three dials at 32, 96 and 160px with 4, 8 and 12px strokes', () => {
    expect(GAUGE_SIZES).toEqual({
      sm: { box: 32, stroke: 4 },
      md: { box: 96, stroke: 8 },
      lg: { box: 160, stroke: 12 },
    });
  });

  it('gives a ring 2 pi r and a semicircle pi r', () => {
    for (const [size, r] of [
      ['sm', 14],
      ['md', 44],
      ['lg', 74],
    ] as const) {
      expect(gaugeTrack(size, 'ring').length).toBeCloseTo(2 * Math.PI * r, 10);
      expect(gaugeTrack(size, 'semicircle').length).toBeCloseTo(Math.PI * r, 10);
    }
    expect(gaugeTrack('md', 'ring').length).toBeCloseTo(276.46, 2);
    expect(gaugeTrack('lg', 'semicircle').length).toBeCloseTo(232.478, 3);
  });

  it('shares a value of the range, clamped, 0 for no width or NaN', () => {
    // 742 on a 300 to 850 score is 80.4% of the arc, not 74.2%.
    expect(gaugeShare(742, 300, 850)).toBeCloseTo(0.80364, 5);
    expect(gaugeShare(250, 300, 850)).toBe(0);
    expect(gaugeShare(900, 300, 850)).toBe(1);
    expect(gaugeShare(23, 0, 100)).toBe(0.23);
    expect(gaugeShare(5, 5, 5)).toBe(0);
    expect(gaugeShare(5, 10, 0)).toBe(0);
    expect(gaugeShare(Number.NaN, 0, 100)).toBe(0);
    expect(gaugeShare(Number.POSITIVE_INFINITY, 0, 100)).toBe(0);
  });

  it('draws nothing for a share of 0, a dot under a stroke, and a dash a stroke shorter, half a stroke in', () => {
    const ring = gaugeTrack('md', 'ring');
    expect(gaugeDash(0, ring)).toBeNull();
    expect(gaugeDash(-0.2, ring)).toBeNull();
    // The path a share of 0 keeps, to move from: a zero-length dash where the arc starts, painted by no cap.
    expect(gaugeRest(ring)).toEqual({ dasharray: '0 276.46', dashoffset: '-4' });
    expect(gaugeRest(gaugeTrack('lg', 'semicircle'))).toEqual({ dasharray: '0 232.478', dashoffset: '-6' });
    // 1% of 276.46 is 2.76, under the 8px stroke: a zero-length dash, which its round caps draw as a dot.
    expect(gaugeDash(0.01, ring)).toEqual({ dasharray: '0 276.46', dashoffset: '-4' });
    expect(gaugeDash(0.5, ring)).toEqual({ dasharray: '130.23 276.46', dashoffset: '-4' });
    // Just short of the whole: the caps leave the share's gap at the top.
    expect(gaugeDash(0.99, ring)).toEqual({ dasharray: '265.696 276.46', dashoffset: '-4' });
    // The whole ring has no ends: one dash of its length and no gap, solid, with no notch where caps would meet.
    expect(gaugeDash(1, ring)).toEqual({ dasharray: '276.46 0', dashoffset: '-4' });
    const semicircle = gaugeTrack('lg', 'semicircle');
    expect(gaugeDash(1, semicircle)).toEqual({ dasharray: '220.478 232.478', dashoffset: '-6' });
    expect(ring.closed).toBe(true);
    expect(semicircle.closed).toBe(false);
  });

  it('spans exactly the share of the track, caps included, from 0 to the whole', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const form of ['ring', 'semicircle'] as const) {
        const track = gaugeTrack(size, form);
        for (const share of [0.25, 0.5, 0.804, 0.99, 1]) {
          const dash = gaugeDash(share, track);
          if (!dash) throw new Error('No dash');
          const [length, gap] = dash.dasharray.split(' ').map(Number);
          const moment = `${size} ${form} ${String(share)}`;
          if (form === 'ring' && share === 1) {
            // The whole circle, solid.
            expect(Math.abs((length ?? 0) - track.length), moment).toBeLessThan(0.002);
            expect(gap, moment).toBe(0);
          } else {
            // The dash and its two half-stroke caps, from half a stroke in.
            expect(Math.abs((length ?? 0) + track.stroke - share * track.length), moment).toBeLessThan(0.002);
          }
          expect(dash.dashoffset).toBe(String(-track.stroke / 2));
        }
      }
    }
  });

  it('places marks on a ring clockwise from the top and on a semicircle from the inline start', () => {
    // From 2px inside the track to 2px outside it: 38 and 50 from the centre on a 96px ring.
    expect(gaugeMark(0, 'md', 'ring')).toEqual({ x1: '48', y1: '10', x2: '48', y2: '-2' });
    expect(gaugeMark(0.25, 'md', 'ring')).toEqual({ x1: '86', y1: '48', x2: '98', y2: '48' });
    expect(gaugeMark(0.5, 'md', 'ring')).toEqual({ x1: '48', y1: '86', x2: '48', y2: '98' });
    // 66 and 82 from the centre on a 160px semicircle, from the inline start over the top to the end.
    expect(gaugeMark(0, 'lg', 'semicircle')).toEqual({ x1: '14', y1: '80', x2: '-2', y2: '80' });
    expect(gaugeMark(0.5, 'lg', 'semicircle')).toEqual({ x1: '80', y1: '14', x2: '80', y2: '-2' });
    expect(gaugeMark(1, 'lg', 'semicircle')).toEqual({ x1: '146', y1: '80', x2: '162', y2: '80' });

    // The consumer's score bands on 300 to 850: 50.9%, 67.3%, 80.0% and 90.9% of the arc.
    const shares = [580, 670, 740, 800].map((value) => gaugeShare(value, 300, 850));
    expect(shares.map((share) => Math.round(share * 1000) / 10)).toEqual([50.9, 67.3, 80, 90.9]);
    for (const share of shares) {
      expect(turned('lg', share, 'semicircle')).toBeCloseTo(share * 180, 1);
      expect(turned('lg', share, 'ring')).toBeCloseTo(share * 360, 1);
    }
    // The 10% and 30% utilization marks on a 32px ring.
    expect(turned('sm', 0.1, 'ring')).toBeCloseTo(36, 1);
    expect(turned('sm', 0.3, 'ring')).toBeCloseTo(108, 1);
  });

  it('reaches 2px past the track on both sides', () => {
    for (const [size, r, stroke] of [
      ['sm', 14, 4],
      ['md', 44, 8],
      ['lg', 74, 12],
    ] as const) {
      for (const form of ['ring', 'semicircle'] as const) {
        const { x1, y1, x2, y2 } = gaugeMark(0.3, size, form);
        expect(radiusOf(size, x1, y1)).toBeCloseTo(r - stroke / 2 - 2, 2);
        expect(radiusOf(size, x2, y2)).toBeCloseTo(r + stroke / 2 + 2, 2);
      }
    }
  });

  it('writes at most three decimals', () => {
    const decimals = (text: string): number => (text.split('.')[1] ?? '').length;
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const form of ['ring', 'semicircle'] as const) {
        const track = gaugeTrack(size, form);
        for (const number of track.d.match(/-?\d+(?:\.\d+)?/g) ?? [])
          expect(decimals(number)).toBeLessThanOrEqual(3);
        for (const share of [0.01, 1 / 3, 0.804, 2 / 3]) {
          const dash = gaugeDash(share, track);
          for (const part of [...(dash?.dasharray.split(' ') ?? []), dash?.dashoffset ?? ''])
            expect(decimals(part)).toBeLessThanOrEqual(3);
          for (const value of Object.values(gaugeMark(share, size, form)))
            expect(decimals(value)).toBeLessThanOrEqual(3);
        }
      }
    }
    expect(gaugeDash(1 / 3, gaugeTrack('md', 'ring'))?.dasharray).toBe('84.153 276.46');
  });
});
