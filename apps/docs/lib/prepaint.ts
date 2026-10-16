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

/**
 * Whether an example's side panel stands open beside the page: a SidePanel's aside in a preview stage. The docs'
 * stage is narrower than an app's content, so while one is open the rail folds to its icons, from the server's HTML
 * on (shell.css), as AppShell folds an app's rail beside an open panel.
 */
export function readStagePanelOpen(): boolean {
  return document.querySelector('.stage .side-panel') !== null;
}

/** Whether the reader expanded the rail over an open example panel, which stands the fold down until it closes. */
export function readRailUnfolded(): boolean {
  return document.documentElement.dataset.railUnfolded !== undefined;
}

export function writeRailUnfolded(unfolded: boolean): void {
  if (unfolded) document.documentElement.dataset.railUnfolded = '';
  else delete document.documentElement.dataset.railUnfolded;
}

/** Whether the rail is drawn as icons: the reader's choice, or folded beside an open example panel. */
export function readRailDrawnCollapsed(): boolean {
  return readRailCollapsed() || (readStagePanelOpen() && !readRailUnfolded());
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
