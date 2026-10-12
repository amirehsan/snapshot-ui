import type { ReactNode } from 'react';

/**
 * Whether a node draws anything, so a part that holds it is worth rendering. Null, undefined, a
 * boolean and an empty string draw nothing: `label={isAdmin && 'Owner'}` is `false` until it is
 * not, and a part rendered around it would be an empty box that still takes its room.
 */
export function present(node: ReactNode): boolean {
  return node != null && node !== false && node !== true && node !== '';
}
