import { useEffect, useRef } from 'react';

/**
 * Warns `message` in the console once per mount, in an effect, the first time it is not null. A development
 * warning in every build: `process` is not typed here, so there is no `NODE_ENV` check, and an effect never
 * runs on the server. Strict Mode runs the effect twice on the same instance, and the ref survives that.
 * Copied from `@snapshot-ui/react`'s `useWarnOnce`, so neither package depends on the other.
 */
export function useWarnOnce(message: string | null): void {
  const warned = useRef(false);
  useEffect(() => {
    if (warned.current || message === null) return;
    warned.current = true;
    console.warn(message);
  }, [message]);
}
