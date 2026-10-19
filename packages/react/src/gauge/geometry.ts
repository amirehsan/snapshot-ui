// No directive: a server part's arithmetic, the same on the server and in the browser.

export type GaugeSize = 'sm' | 'md' | 'lg';
export type GaugeForm = 'ring' | 'semicircle';

/** The box and the stroke of each size, in pixels: one user unit is one pixel at the gauge's own size. */
export const GAUGE_SIZES: Readonly<Record<GaugeSize, { readonly box: number; readonly stroke: number }>> = {
  sm: { box: 32, stroke: 4 },
  md: { box: 96, stroke: 8 },
  lg: { box: 160, stroke: 12 },
};

/** At most three decimals, Meter's rounding, so the server and the browser write the same string. */
const num = (n: number): string => String(Math.round(n * 1000) / 1000);

export interface GaugeTrack {
  viewBox: string;
  d: string;
  /** The path's length in user units. */
  length: number;
  stroke: number;
  /** A ring has no ends, so a whole share draws it solid; a semicircle has two. */
  closed: boolean;
}

/** The track's path: a ring from the top, clockwise, in two half arcs; a semicircle from the inline start over the top. */
export function gaugeTrack(size: GaugeSize, form: GaugeForm): GaugeTrack {
  const { box, stroke } = GAUGE_SIZES[size];
  const r = (box - stroke) / 2;
  const c = box / 2;
  if (form === 'ring') {
    const top = `${num(c)} ${num(stroke / 2)}`;
    const bottom = `${num(c)} ${num(box - stroke / 2)}`;
    return {
      viewBox: `0 0 ${num(box)} ${num(box)}`,
      d: `M${top}A${num(r)} ${num(r)} 0 1 1 ${bottom}A${num(r)} ${num(r)} 0 1 1 ${top}`,
      length: 2 * Math.PI * r,
      stroke,
      closed: true,
    };
  }
  return {
    viewBox: `0 0 ${num(box)} ${num(box / 2 + stroke / 2)}`,
    d: `M${num(stroke / 2)} ${num(c)}A${num(r)} ${num(r)} 0 0 1 ${num(box - stroke / 2)} ${num(c)}`,
    length: Math.PI * r,
    stroke,
    closed: false,
  };
}

/** The value's share of the range, clamped to 0 and 1; 0 for a range with no width or a value that is not a number. */
export function gaugeShare(value: number, min: number, max: number): number {
  if (!(max > min) || !Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, (value - min) / (max - min)));
}

/**
 * The dash that draws a share with round caps, caps included: a dash of the share's length less one stroke,
 * starting half a stroke in, so each cap adds back half a stroke. Under one stroke's length it is a zero-length
 * dash, a dot; a share of 0 is null and draws nothing. A whole ring has no ends: two caps meeting at the top
 * would touch at one point and leave a notch in the stroke's edges as deep as half the stroke, so it is one dash
 * of the whole length with no gap, drawn solid, still two numbers so a change to it moves.
 */
export function gaugeDash(
  share: number,
  track: GaugeTrack,
): { dasharray: string; dashoffset: string } | null {
  if (share <= 0) return null;
  if (track.closed && share >= 1)
    return { dasharray: `${num(track.length)} 0`, dashoffset: num(-track.stroke / 2) };
  const dash = Math.max(0, share * track.length - track.stroke);
  return { dasharray: `${num(dash)} ${num(track.length)}`, dashoffset: num(-track.stroke / 2) };
}

/** A mark's radial line across the track, 2px past it on both sides, at its share of the arc. */
export function gaugeMark(
  share: number,
  size: GaugeSize,
  form: GaugeForm,
): { x1: string; y1: string; x2: string; y2: string } {
  const { box, stroke } = GAUGE_SIZES[size];
  const r = (box - stroke) / 2;
  const c = box / 2;
  const inner = r - stroke / 2 - 2;
  const outer = r + stroke / 2 + 2;
  // A ring turns clockwise from the top; a semicircle from the inline start (180 degrees) over the top (90) to the end (0).
  const angle = form === 'ring' ? share * 2 * Math.PI : Math.PI * (1 - share);
  const point = (radius: number): [number, number] =>
    form === 'ring'
      ? [c + radius * Math.sin(angle), c - radius * Math.cos(angle)]
      : [c + radius * Math.cos(angle), c - radius * Math.sin(angle)];
  const [x1, y1] = point(inner);
  const [x2, y2] = point(outer);
  return { x1: num(x1), y1: num(y1), x2: num(x2), y2: num(y2) };
}
