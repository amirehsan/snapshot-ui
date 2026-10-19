/**
 * Keeps what React Aria's live announcer says of `owner` after `owner` leaves the page. The announcer says a
 * pending Button by ids, the button's and its parts', and keeps the sentence for seconds; once those ids are gone
 * it names nothing, so a screen reader reads it empty and axe reports `role-img-alt`. Called just before `owner`
 * is removed, while its ids still resolve, this notes the words each id gives, then, once `owner` is gone and for
 * a second after, writes those words onto every sentence that names one of its ids, as the sentence's
 * `aria-label`, in place of the ids. While `owner` is still on the page, as after Strict Mode's rehearsed
 * unmount, every sentence is left alone.
 */
export function keepSaidNames(owner: Element): void {
  const page = owner.ownerDocument;
  // React Aria makes the announcer, at once, the first time anything is said: no announcer, nothing said.
  const announcer = page.querySelector('[data-live-announcer]');
  if (!announcer) return;
  const owned = [owner, ...owner.querySelectorAll('[id]')].map((part) => part.id);
  const names = new Map<string, string>();
  // The ids outside `owner` that name it are noted too: a sentence about it names them, and they may go with it.
  for (const id of [...owned, ...(owner.getAttribute('aria-labelledby') ?? '').split(' ')]) {
    const named = page.getElementById(id);
    // The words an `aria-labelledby` reads from the element.
    if (named) names.set(id, named.getAttribute('aria-label') ?? named.textContent.trim());
  }
  const keep = (): void => {
    if (owner.isConnected) return;
    for (const said of announcer.querySelectorAll('[role="img"][aria-labelledby]')) {
      const ids = (said.getAttribute('aria-labelledby') ?? '').split(' ');
      if (!ids.some((id) => owned.includes(id))) continue;
      said.setAttribute(
        'aria-label',
        ids
          .map((id) => names.get(id) ?? '')
          .join(' ')
          .trim(),
      );
      said.removeAttribute('aria-labelledby');
    }
  };
  // The removal follows in the same commit, so a microtask sees it done.
  queueMicrotask(keep);
  // The announcer holds the first sentence it is ever given 100ms before it writes it, so a sentence asked for
  // just before the unmount can land just after it.
  const late = new MutationObserver(keep);
  late.observe(announcer, { childList: true, subtree: true });
  setTimeout(() => {
    late.disconnect();
  }, 1000);
}
