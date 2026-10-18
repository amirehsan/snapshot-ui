/** Whether an element scrolls in the block direction: an overflow that scrolls and more to scroll. */
export function scrolls(element: Element): boolean {
  const { overflowY } = getComputedStyle(element);
  return /auto|scroll|overlay/.test(overflowY) && element.scrollHeight > element.clientHeight;
}

/** The nearest ancestor of `element` that scrolls, or null for the window. */
export function scrollPortOf(element: Element): Element | null {
  let port: Element | null = element.parentElement;
  while (port !== null && !scrolls(port)) port = port.parentElement;
  return port;
}
