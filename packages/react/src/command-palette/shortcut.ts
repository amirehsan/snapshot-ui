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

/** A Latin letter or a digit: a key a layout that types other letters still has a position for. */
const LATIN = /^[a-z0-9]$/i;

/** Where a Latin letter or a digit sits, as `event.code` names it: `KeyK`, `Digit1`. */
const codeOf = (key: string): string => (/^\d$/.test(key) ? `Digit${key}` : `Key${key.toUpperCase()}`);

/**
 * Whether the key pressed is the shortcut's key. The character comes first, so a Latin layout that moves the
 * letters, such as Dvorak or AZERTY, matches the letter printed on the key. A layout that types other letters,
 * such as Persian, Arabic, Hebrew or Russian, reports its own character with Ctrl, and Option on a Mac types a
 * symbol, so when the character is not a Latin letter or digit, the key's position (`event.code`) stands in.
 */
function isKey(event: KeyboardEvent, key: string): boolean {
  if (event.key.toLowerCase() === key.toLowerCase()) return true;
  return LATIN.test(key) && !LATIN.test(event.key) && event.code === codeOf(key);
}

/**
 * Whether a keydown is the shortcut: `Mod` is `metaKey` or `ctrlKey` (either, no platform sniffing);
 * every listed modifier is down and every unlisted one is up; `key` compares case-insensitively, and a
 * Latin letter or digit also matches by position when the layout types another script. False when
 * `defaultPrevented` or `isComposing`.
 */
export function matchesShortcut(event: KeyboardEvent, parsed: ParsedShortcut): boolean {
  if (event.defaultPrevented || event.isComposing) return false;
  const mod = event.metaKey || event.ctrlKey;
  return (
    mod === parsed.mod &&
    event.shiftKey === parsed.shift &&
    event.altKey === parsed.alt &&
    isKey(event, parsed.key)
  );
}
