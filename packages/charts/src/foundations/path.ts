/*
 * SVG path data for the charts, in the 0 to 100 viewBox every chart draws in. Pure, with no React and no
 * DOM. Straight segments only: a smoothed line invents values between the points. Private to the package
 * in 0.1.0.
 */

/** A point in the 0 to 100 viewBox, y down. */
export interface PlotPoint {
  x: number;
  y: number;
}

/** A coordinate rounded to three decimals with no trailing zeros; String writes -0 as 0. */
const num = (n: number): string => String(Math.round(n * 1000) / 1000);

/** The unbroken runs of points, in order: a null ends one. */
function runs(points: readonly (PlotPoint | null)[]): PlotPoint[][] {
  const found: PlotPoint[][] = [];
  let current: PlotPoint[] = [];
  for (const point of points) {
    if (point) current.push(point);
    else if (current.length > 0) {
      found.push(current);
      current = [];
    }
  }
  if (current.length > 0) found.push(current);
  return found;
}

/** Straight segments through the points; a null breaks the line, and a point alone between two breaks is a zero-length segment that round caps draw as a dot. */
export function linePath(points: readonly (PlotPoint | null)[]): string {
  let d = '';
  points.forEach((point, i) => {
    if (!point) return;
    const before = points[i - 1];
    const after = points[i + 1];
    const xy = `${num(point.x)} ${num(point.y)}`;
    if (!before) d += after ? `M${xy}` : `M${xy}L${xy}`;
    else d += `L${xy}`;
  });
  return d;
}

/** The region between each unbroken run of points and the horizontal line at `baseline`, closed. A point alone draws none. */
export function areaPath(points: readonly (PlotPoint | null)[], baseline: number): string {
  const base = num(baseline);
  return runs(points)
    .filter((run) => run.length > 1)
    .map((run) => {
      const first = run[0];
      const last = run[run.length - 1];
      if (!first || !last) return '';
      const line = run.map(({ x, y }) => `${num(x)} ${num(y)}`).join('L');
      return `M${num(first.x)} ${base}L${line}L${num(last.x)} ${base}Z`;
    })
    .join('');
}
