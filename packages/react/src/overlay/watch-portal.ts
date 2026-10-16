'use client';

/*
 * Focus held in a portal a part opened, once the part has left the page. Internal: not exported from the package.
 */

/** The child of the body that holds `element`: the app's own tree, or a portal such as a dialog's. */
export function portalOf(element: Element): Element {
  let top = element;
  const { body } = element.ownerDocument;
  while (top.parentElement !== null && top.parentElement !== body) top = top.parentElement;
  return top;
}

/**
 * Watches a portal that holds focus, a dialog or a menu a part opened, after the part has left the page: once the
 * portal leaves too with focus fallen to the body, `give` puts focus back in the page. Focus the reader moves out of
 * the portal ends the watch, and so does the returned function. Only a portal is watched, never the app's own tree
 * (the body's child that holds `root`), so nothing waits on the page for good. DataTable's bulk-action bar and
 * SidePanel use it (spec corrections 38 and 84).
 */
export function watchPortal(root: Element, held: Element, give: () => void): () => void {
  const document = root.ownerDocument;
  const portal = portalOf(held);
  if (portal === portalOf(root)) return () => undefined;
  const onFocusIn = (event: globalThis.FocusEvent): void => {
    if (!(event.target instanceof Element) || !portal.contains(event.target)) stop();
  };
  const observer = new MutationObserver(() => {
    if (portal.isConnected) return;
    stop();
    const active = document.activeElement;
    if (active === null || active === document.body) give();
  });
  function stop(): void {
    observer.disconnect();
    document.removeEventListener('focusin', onFocusIn);
  }
  observer.observe(document.body, { childList: true });
  document.addEventListener('focusin', onFocusIn);
  return stop;
}
