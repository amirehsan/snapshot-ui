import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// React Aria's Sheet needs these and jsdom has none of them: an open SheetOverlay observes its content with an
// IntersectionObserver as it mounts, one with preventDismissal and snapPoints measures with a ResizeObserver,
// and its enter and exit scroll with scrollTo and read the reduced motion setting with matchMedia. They do
// nothing here, since jsdom lays nothing out. Each is set only where the environment has a DOM and lacks it;
// the files that run in Node, with no DOM at all, are left as they are. So every jsdom test now has the four:
// a code path for a browser with no ResizeObserver, such as keyboard-scroll.ts's, runs only where a test
// takes the stub away, and every matchMedia query answers false.
class InertObserver {
  observe = (): void => undefined;
  unobserve = (): void => undefined;
  disconnect = (): void => undefined;
  takeRecords = (): [] => [];
}

if (typeof window !== 'undefined') {
  for (const name of ['IntersectionObserver', 'ResizeObserver']) {
    if (!(name in globalThis)) {
      Object.defineProperty(globalThis, name, { value: InertObserver, writable: true, configurable: true });
    }
  }
  if (typeof Element.prototype.scrollTo !== 'function') Element.prototype.scrollTo = () => undefined;
  if (typeof Element.prototype.scrollBy !== 'function') Element.prototype.scrollBy = () => undefined;
  if (typeof window.matchMedia !== 'function') {
    window.matchMedia = (media: string): MediaQueryList => ({
      matches: false,
      media,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    });
  }
}

// Testing Library only cleans up on its own when vitest globals are on.
afterEach(() => {
  cleanup();
});
