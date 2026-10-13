'use client';

import { useSyncExternalStore, type ReactElement } from 'react';
import { Keyboard } from 'react-aria-components';

export interface ShortcutProps {
  /** Keys separated by spaces, such as "Q", "Mod ," or "Mod K". */
  keys: string;
  /** The chip's class, after nothing: each part names its own (`menu-item-shortcut`, `tooltip-shortcut`). */
  className: string;
}

/** The platforms whose modifier is Command: a Mac, an iPhone, an iPad and an iPod. */
const APPLE = /^(?:Mac|iPhone|iPad|iPod)/;

/** The platform never changes while the page is open, so there is nothing to listen to. */
const subscribe = (): (() => void) => () => undefined;

/** The modifier this browser's platform names. */
const platformModifier = (): string => (APPLE.test(navigator.platform) ? '\u2318' : 'Ctrl');

/** The server knows no platform, so its HTML says "Mod". */
const serverModifier = (): string => 'Mod';

/**
 * The platform's modifier for "Mod": the Command symbol on Apple platforms and "Ctrl" elsewhere. It is
 * "Mod" on the server and while a server's HTML hydrates, and React then draws the platform's, so
 * hydration matches; a chip that mounts in the browser, as one in a menu or a tip opened later does, draws
 * the platform's key on its first paint.
 *
 * Internal: not exported from the package.
 */
export function useModifierKey(): string {
  return useSyncExternalStore(subscribe, platformModifier, serverModifier);
}

/**
 * One key chip (React Aria's `Keyboard`, a `kbd`) holding the keys with "Mod" resolved, space-separated.
 * Inside a menu item, React Aria gives it an id and adds it to the item's description.
 *
 * Internal: not exported from the package. Menu, CommandPalette and Tooltip draw their key hints with it.
 */
export function Shortcut({ keys, className }: ShortcutProps): ReactElement {
  const modifier = useModifierKey();
  const resolved = keys
    .split(' ')
    .filter(Boolean)
    .map((key) => (key === 'Mod' ? modifier : key))
    .join(' ');
  return <Keyboard className={className}>{resolved}</Keyboard>;
}
