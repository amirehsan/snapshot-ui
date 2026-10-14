import { useSyncExternalStore } from 'react';

const subscribeNothing = (): (() => void) => () => undefined;

/** False on the server and while the page hydrates, and true from the render after. */
export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
