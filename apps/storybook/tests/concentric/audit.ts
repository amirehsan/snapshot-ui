/** One corner of a rounded part whose curve does not share its holder's center. */
export interface Finding {
  /** The part, as a short selector: tag, classes and name. */
  part: string;
  /** The nearest rounded ancestor the part sits in. */
  holder: string;
  /**
   * `concentric`: a part inside the holder's corner curve whose radius is not the holder's less the gap.
   * `one corner`: a part inside the curve whose corners differ, a control given one smaller corner instead of
   * being moved out of the corner; `expected` is then its own radius.
   */
  rule: 'concentric' | 'one corner';
  corner: 'top-left' | 'top-right' | 'bottom-right' | 'bottom-left';
  /** The holder's radius at that corner, as drawn. */
  holderRadius: number;
  /** The smaller of the two gaps between the holder's border box and the part's at that corner. */
  gap: number;
  /** The part's radius at that corner, as drawn. */
  radius: number;
  /** The holder's radius less the gap, never below 0. */
  expected: number;
}

/**
 * Finds every rounded part whose corner lies inside its holder's corner curve but does not take the holder's
 * radius less the gap between them (docs/design-system.md, "Nested radii, derived"). It runs in the page, so
 * it reads nothing from outside its own body.
 *
 * - A part is any element with a radius on some corner. The radius read is the one drawn: a pill's 999px is
 *   scaled down to half the box, as the browser does, and the smaller of a corner's two radii counts.
 * - Its holder is the nearest ancestor with a radius, or a smaller rounded frame the part is drawn over: a
 *   field button sits beside its input in the markup and over it on screen. A corner is checked where the
 *   part lies inside the holder and both gaps there, inline and block, are smaller than the holder's radius
 *   at that corner.
 * - The expected radius is max(0, holder radius - the smaller gap), within 1px, and never more than half the
 *   part's own side, the most a corner can draw.
 * - A part inside a corner curve keeps one shape: corners that differ there fail, since a control is moved
 *   out of the corner rather than given one smaller corner. A part flush with a holder that clips it is
 *   drawn by the holder's corner and is not held to this.
 * - A part may be sharper than that, never rounder, in two cases: it sits at the micro step or under (a key,
 *   a badge, a title's focus ring: text-sized parts keep their small corner), or its holder clips what it
 *   holds, which then draws the part's corner itself.
 * - Not checked: a dot or circle (round by shape: a percentage radius, or a square box whose every corner
 *   is half its side), what a dot or circle holds (it has no corner to share), a fixed surface (it floats, so
 *   it starts a ladder of its own) and anything not drawn.
 */
export function auditConcentric(): Finding[] {
  const TOLERANCE = 1;
  const CORNERS = ['top-left', 'top-right', 'bottom-right', 'bottom-left'] as const;
  type Corner = (typeof CORNERS)[number];
  interface Box {
    element: HTMLElement;
    rect: DOMRect;
    style: CSSStyleDeclaration;
    radii: Record<Corner, number>;
    percent: boolean;
    rounded: boolean;
    drawn: boolean;
  }

  /** A length in px from a computed radius, a percentage resolved against `basis`. */
  const length = (value: string, basis: number): number =>
    value.endsWith('%') ? (parseFloat(value) / 100) * basis : parseFloat(value) || 0;

  const boxes = new Map<Element, Box>();
  const boxOf = (element: HTMLElement): Box => {
    const known = boxes.get(element);
    if (known) return known;
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    let percent = false;
    const raw = CORNERS.map((corner) => {
      const value = style.getPropertyValue(`border-${corner}-radius`).trim();
      if (value.includes('%')) percent = true;
      const [x = '0', y = x] = value.split(/\s+/);
      return { x: length(x, rect.width), y: length(y, rect.height) };
    });
    const at = (index: number) => raw[index] ?? { x: 0, y: 0 };
    // Curves that would overlap are scaled down together until they fit, as CSS draws them.
    const scale = Math.min(
      1,
      ...[
        rect.width / (at(0).x + at(1).x),
        rect.width / (at(3).x + at(2).x),
        rect.height / (at(0).y + at(3).y),
        rect.height / (at(1).y + at(2).y),
      ].filter((ratio) => Number.isFinite(ratio)),
    );
    const radii = Object.fromEntries(
      CORNERS.map((corner, index) => [corner, Math.min(at(index).x, at(index).y) * scale]),
    ) as Record<Corner, number>;
    const box: Box = {
      element,
      rect,
      style,
      radii,
      percent,
      rounded: CORNERS.some((corner) => radii[corner] > 0.5),
      drawn:
        rect.width >= 1 && rect.height >= 1 && style.visibility !== 'hidden' && style.display !== 'contents',
    };
    boxes.set(element, box);
    return box;
  };

  /** The nearest drawn, rounded ancestor, stopping at a fixed surface, which floats over what is under it. */
  const holders = new Map<Element, Box | null>();
  const holderOf = (element: HTMLElement): Box | null => {
    if (holders.has(element)) return holders.get(element) ?? null;
    let found: Box | null = null;
    const parent = element.parentElement;
    if (parent && parent !== document.body && boxOf(element).style.position !== 'fixed') {
      const box = boxOf(parent);
      found = box.drawn && box.rounded ? box : holderOf(parent);
    }
    holders.set(element, found);
    return found;
  };

  /** The smaller box of the two, by area, so the closest frame around a part wins. */
  const area = ({ rect }: Box): number => rect.width * rect.height;
  const inside = (inner: DOMRect, outer: DOMRect): boolean =>
    inner.left >= outer.left - 0.5 &&
    inner.right <= outer.right + 0.5 &&
    inner.top >= outer.top - 0.5 &&
    inner.bottom <= outer.bottom + 0.5;

  /**
   * A rounded frame the part is drawn over rather than placed in: an element near it in the markup (under its
   * grandparent) that is neither the part, nor inside it, nor around it, and whose box holds the part's.
   */
  const frameUnder = (element: HTMLElement, part: Box): Box | null => {
    const scope = element.parentElement?.parentElement;
    if (!scope || scope === document.body) return null;
    let found: Box | null = null;
    for (const candidate of scope.querySelectorAll('*')) {
      if (!(candidate instanceof HTMLElement) || candidate === element) continue;
      if (element.contains(candidate) || candidate.contains(element)) continue;
      const box = boxOf(candidate);
      if (!box.drawn || !box.rounded || box.percent || !inside(part.rect, box.rect)) continue;
      if (!found || area(box) < area(found)) found = box;
    }
    return found;
  };

  const describe = (element: Element): string => {
    const classes = [...element.classList].slice(0, 3).map((name) => `.${name}`);
    const role = element.getAttribute('role');
    const slot = element.getAttribute('slot');
    return [
      element.tagName.toLowerCase(),
      ...classes,
      role ? `[role=${role}]` : '',
      slot ? `[slot=${slot}]` : '',
    ].join('');
  };

  const micro =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-micro')) || 0;

  /** A circle: a square box rounded by half its side at every corner. */
  const isCircle = ({ rect, radii }: Box): boolean =>
    Math.abs(rect.width - rect.height) <= 1 &&
    CORNERS.every((corner) => radii[corner] >= rect.width / 2 - TOLERANCE);

  const findings: Finding[] = [];
  for (const element of document.body.querySelectorAll('*')) {
    if (!(element instanceof HTMLElement)) continue;
    const part = boxOf(element);
    if (!part.drawn || !part.rounded || part.percent || isCircle(part) || part.style.position === 'fixed') {
      continue;
    }
    const ancestor = holderOf(element);
    const frame = frameUnder(element, part);
    const holder = frame && (!ancestor || area(frame) < area(ancestor)) ? frame : ancestor;
    if (!holder || holder.percent || isCircle(holder)) continue;
    // Only an ancestor clips the part; a frame it is drawn over does not.
    const clips =
      holder === ancestor && (holder.style.overflowX !== 'visible' || holder.style.overflowY !== 'visible');

    const round = (value: number) => Math.round(value * 10) / 10;
    const report = (corner: Corner, rule: Finding['rule'], gap: number, expected: number) => {
      findings.push({
        part: describe(element),
        holder: describe(holder.element),
        rule,
        corner,
        holderRadius: round(holder.radii[corner]),
        gap: round(gap),
        radius: round(part.radii[corner]),
        expected: round(expected),
      });
    };
    const radii = CORNERS.map((corner) => part.radii[corner]);
    const uniform = Math.max(...radii) - Math.min(...radii) <= TOLERANCE;

    for (const corner of CORNERS) {
      const radius = part.radii[corner];
      const holderRadius = holder.radii[corner];
      if (holderRadius <= 0.5) continue;
      const x = corner.endsWith('left')
        ? part.rect.left - holder.rect.left
        : holder.rect.right - part.rect.right;
      const y = corner.startsWith('top')
        ? part.rect.top - holder.rect.top
        : holder.rect.bottom - part.rect.bottom;
      // Outside the holder, or clear of its curve (half a pixel of layout rounding allowed): the corners do
      // not meet.
      if (x < -0.5 || y < -0.5 || x >= holderRadius - 0.5 || y >= holderRadius - 0.5) continue;
      const gap = Math.max(0, Math.min(x, y));
      const expected = Math.min(Math.max(0, holderRadius - gap), part.rect.width / 2, part.rect.height / 2);
      // A control keeps one shape: inside a corner curve it is moved out of the corner, never given one
      // smaller corner. A part flush with a holder that clips it is drawn by the holder's corner instead.
      if (!uniform && !(clips && gap <= 0.5)) {
        report(corner, 'one corner', gap, Math.max(...radii));
        continue;
      }
      if (radius <= 0.5) continue;
      if (Math.abs(radius - expected) <= TOLERANCE) continue;
      if (radius < expected && (clips || radius <= micro + 0.5)) continue;
      report(corner, 'concentric', gap, expected);
    }
  }
  return findings;
}
