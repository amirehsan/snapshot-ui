export type Shape = 'rounded' | 'soft' | 'square';

const SHAPE_KEY = 'snapshot-ui-docs-shape';
const RAIL_KEY = 'snapshot-ui-docs-rail';

/**
 * Runs in <head> before first paint, so a stored corner shape or a collapsed
 * rail never flashes the default first. Color mode is next-themes' own script.
 */
export const PREPAINT = `try{var d=document.documentElement,s=localStorage.getItem('${SHAPE_KEY}');if(s==='soft'||s==='square')d.dataset.shape=s;if(localStorage.getItem('${RAIL_KEY}')==='collapsed')d.dataset.rail='collapsed'}catch(e){}`;

export function readShape(): Shape {
  const value = document.documentElement.dataset.shape;
  return value === 'soft' || value === 'square' ? value : 'rounded';
}

export function writeShape(shape: Shape): void {
  document.documentElement.dataset.shape = shape;
  try {
    localStorage.setItem(SHAPE_KEY, shape);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
}

export function readRailCollapsed(): boolean {
  return document.documentElement.dataset.rail === 'collapsed';
}

export function writeRailCollapsed(collapsed: boolean): void {
  if (collapsed) document.documentElement.dataset.rail = 'collapsed';
  else delete document.documentElement.dataset.rail;
  try {
    localStorage.setItem(RAIL_KEY, collapsed ? 'collapsed' : 'expanded');
  } catch {
    // As above.
  }
}
