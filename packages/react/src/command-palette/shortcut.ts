/** A keyboard shortcut as `parseShortcut` reads it: which modifiers must be down, and the key. */
export interface ParsedShortcut {
  mod: boolean;
  shift: boolean;
  alt: boolean;
  key: string;
}

/**
 * Tokens joined by `+`: the modifiers `Mod`, `Shift`, `Alt` in any order and case, then one key, compared
 * with `event.key`. `Mod` is Cmd or Ctrl. Throws on no key or an unknown modifier, so a typo fails as the
 * palette mounts and not silently on every keystroke.
 */
export function parseShortcut(shortcut: string): ParsedShortcut {
  const tokens = shortcut.split('+').map((token) => token.trim());
  const key = tokens.pop();
  if (!key) throw new Error(`The shortcut "${shortcut}" names no key.`);
  const parsed: ParsedShortcut = { mod: false, shift: false, alt: false, key };
  for (const token of tokens) {
    const name = token.toLowerCase();
    if (name === 'mod') parsed.mod = true;
    else if (name === 'shift') parsed.shift = true;
    else if (name === 'alt') parsed.alt = true;
    else throw new Error(`The shortcut "${shortcut}" has an unknown modifier "${token}".`);
  }
  return parsed;
}

/**
 * Whether a keydown is the shortcut: `Mod` is `metaKey` or `ctrlKey` (either, no platform sniffing);
 * every listed modifier is down and every unlisted one is up; `key` compares case-insensitively.
 * False when `defaultPrevented` or `isComposing`.
 */
export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  if (event.defaultPrevented || event.isComposing) return false;
  const mod = event.metaKey || event.ctrlKey;
  return (
    mod === parsed.mod &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    event.key.toLowerCase() === parsed.key.toLowerCase()
  );
}
