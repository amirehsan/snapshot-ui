'use client';

import { useEffect, useState, type ReactElement } from 'react';
import { Keyboard } from 'react-aria-components';

export interface ShortcutProps {
  /** Keys separated by spaces, such as "Q", "Mod ," or "Mod K". */
  keys: string;
  /** The chip's class, after nothing: each part names its own (`menu-item-shortcut`, `tooltip-shortcut`). */
  className: string;
}

/** The platforms whose modifier is Command: a Mac, an iPhone, an iPad and an iPod. */
const APPLE = /^(?:Mac|iPhone|iPad|iPod)/;

/**
 * The platform's modifier for "Mod": "Mod" on the server and the first render, then the Command symbol on
 * Apple platforms and "Ctrl" elsewhere, set in an effect so hydration matches.
 *
 * Internal: not exported from the package.
 */
export function useModifierKey(): string {
  const [modifier, setModifier] = useState('Mod');
  useEffect(() => {
    // The platform is known only in the browser, and the server's HTML said "Mod", so it is read after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the first render must match the server's HTML
    setModifier(APPLE.test(navigator.platform) ? '\u2318' : 'Ctrl');
  }, []);
  return modifier;
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
