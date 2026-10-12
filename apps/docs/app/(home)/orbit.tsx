'use client';

import { useId, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';

type Point = [x: number, y: number];

/**
 * The svg's box and the line drawn in it. Sideways everything is in window pixels, so `left` is where
 * the box starts in the window and `right` is the window's right edge, where the line is cut off; down
 * it is in pixels from the orbit's top.
 */
interface Line {
  left: number;
  width: number;
  height: number;
  right: number;
  d: string;
}

/**
 * How far across its half period each level handle reaches, for the cubic closest to half a sine wave:
 * 0.3642 by least squares, with a largest error of 0.04% of the wave's height.
 */
const SINE = 0.3642;

/** A coordinate to two decimals, which is finer than any screen draws. */
const round = (value: number): string => String(Math.round(value * 100) / 100);

/**
 * An even wave through the three circle centers, a crest at each outer circle and a trough at the
 * middle one, repeated at the same half period out past both edges of the window. Each half period
 * is one cubic, level at both ends, so every circle is met at the same angle on both sides. Crests
 * beyond the circles sit at the two crest circles' average height.
 */
function wave([first, middle, last]: Point[], right: number): string {
  if (!first || !middle || !last) return '';
  const half = (last[0] - first[0]) / 2;
  // Below 1024px the circles stack, so there is no wave, and the line is hidden there anyway.
  if (half <= 0) return '';
  const crest = (first[1] + last[1]) / 2;
  const circles = new Map<number, Point>([
    [-1, first],
    [0, middle],
    [1, last],
  ]);
  /** The crest or trough `k` half periods from the middle circle. */
  const turn = (k: number): Point =>
    circles.get(k) ?? [middle[0] + k * half, k % 2 === 0 ? middle[1] : crest];

  // One more turn than the window needs on each side, so the line runs on past both edges.
  const from = Math.floor(-middle[0] / half) - 1;
  const to = Math.ceil((right - middle[0]) / half) + 1;
  let [x, y] = turn(from);
  let d = `M${round(x)} ${round(y)}`;
  for (let k = from + 1; k <= to; k += 1) {
    const [nextX, nextY] = turn(k);
    const reach = (nextX - x) * SINE;
    d += ` C${round(x + reach)} ${round(y)} ${round(nextX - reach)} ${round(nextY)} ${round(nextX)} ${round(nextY)}`;
    [x, y] = [nextX, nextY];
  }
  return d;
}

/**
 * The line in a 1440px window, from the layout in home.css, so that the server's first paint already
 * threads the circles there: the orbit is the page's 1184px column, 128px in from each edge, with a
 * 280px circle at the start of each of three columns 48px apart, the middle one 120px lower. The box
 * is the orbit's narrowest, 928px in a 1024px window, so that until the browser measures it the box
 * never widens a narrower window. The line is drawn past the box either way.
 */
const FIRST = ((): Line => {
  const left = (1440 - 1184) / 2;
  const step = (1184 + 48) / 3;
  const centers = [0, 1, 2].map((column): Point => [left + 140 + column * step, column === 1 ? 260 : 140]);
  return { left, width: 928, height: 400, right: 1440, d: wave(centers, 1440) };
})();

/** The line for the orbit as the browser lays it out now, out to the edges of the window. */
function measure(orbit: HTMLElement): Line {
  const box = orbit.getBoundingClientRect();
  const circles = [...orbit.querySelectorAll('.portrait-circle')].map((circle) =>
    circle.getBoundingClientRect(),
  );
  const centers = circles.map((circle): Point => [
    circle.left + circle.width / 2,
    circle.top + circle.height / 2 - box.top,
  ]);
  const height = Math.max(...circles.map((circle) => circle.bottom - box.top));
  const right = document.documentElement.clientWidth;
  return { left: box.left, width: box.width, height, right, d: wave(centers, right) };
}

/**
 * The Foundations portraits, threaded on one line that runs from edge to edge of the window through
 * the center of each circle. The line is measured from the layout and redrawn whenever it changes.
 */
export function Orbit({ children }: { children: ReactNode }): ReactElement {
  const orbit = useRef<HTMLDivElement>(null);
  const clip = useId();
  const [line, setLine] = useState(FIRST);

  // Before the first paint, so a page reached by a link never shows the 1440px line in another window.
  useLayoutEffect(() => {
    const element = orbit.current;
    if (!element) return;
    const redraw = (): void => {
      setLine(measure(element));
    };
    redraw();
    // The observer sees the orbit resize; above 1280px the orbit keeps its size and only moves.
    const observer = new ResizeObserver(redraw);
    observer.observe(element);
    window.addEventListener('resize', redraw);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', redraw);
    };
  }, []);

  return (
    <div className="orbit" ref={orbit}>
      <svg
        className="orbit-arc"
        width={line.width}
        height={line.height}
        viewBox={`${line.left} 0 ${line.width} ${line.height}`}
        fill="none"
        aria-hidden
      >
        <defs>
          <clipPath id={clip}>
            <rect width={line.right} height={line.height} />
          </clipPath>
        </defs>
        <path
          d={line.d}
          clipPath={`url(#${clip})`}
          stroke="var(--color-signal-light)"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {children}
    </div>
  );
}
