/*
 * TagInput's presets: how typed or pasted text becomes values, for email addresses, domains and paths (spec 6.3).
 * Plain objects of small functions in a module with no 'use client' and no import from React or React Aria, so a
 * server action imports them and checks the submitted values with the same rules (ruling 11). Nothing here reads
 * the locale: lowercasing is toLowerCase(), which no locale changes, and `URL` is read only inside a function.
 */

/** The text box's attributes a preset sets, so a phone shows the right keyboard and nothing is autocorrected. */
export interface TagInputInputProps {
  inputMode?: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search';
  autoComplete?: string;
  autoCapitalize?: string;
  spellCheck?: boolean;
  dir?: string;
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}

/** How text becomes values: split, cleaned, checked and compared. */
export interface TagInputPreset {
  /** Splits typed or pasted text into candidates, in order. */
  split: (text: string) => string[];
  /** Cleans one candidate: trims it, lowercases a domain, adds a path's leading slash. An empty result is dropped. */
  normalize: (value: string) => string;
  /** Whether a cleaned value may be added. */
  isValid: (value: string) => boolean;
  /** What makes two values the same. @default the value itself */
  key?: (value: string) => string;
  /** Characters that end a value as it is typed, besides Enter. A new line always ends one. */
  delimiters: readonly string[];
  /** Joins candidates that could not be added, to leave them in the text box. */
  join: string;
  /** The text box's attributes, so a phone shows the right keyboard and nothing is autocorrected. */
  inputProps?: TagInputInputProps;
  /** The error line for candidates left in the text box, given their count as `formatCount` writes it. */
  invalidMessage: (count: string) => string;
}

/** Drops the empty pieces of a split. */
const filled = (pieces: readonly string[]): string[] => pieces.filter((piece) => piece.trim() !== '');

/** The text box of an address, a domain or a path: no capitals, no corrections, left to right. */
const ADDRESS_BOX: TagInputInputProps = {
  autoComplete: 'off',
  autoCapitalize: 'none',
  spellCheck: false,
  dir: 'ltr',
  enterKeyHint: 'enter',
};

// The HTML standard's "valid email address", what input type=email accepts, with at least one dot after the @
// (spec 11 item 10): the standard's (\.label)* becomes (\.label)+.
const LOCAL = "[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+";
const EMAIL_LABEL = '[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?';
const EMAIL = new RegExp(`^${LOCAL}@${EMAIL_LABEL}(?:\\.${EMAIL_LABEL})+$`);

// A domain's label: 1 to 63 letters, digits or hyphens, any script, no hyphen at its ends.
const LABEL = '[\\p{L}\\p{N}](?:[\\p{L}\\p{N}-]{0,61}[\\p{L}\\p{N}])?';
const DOMAIN = new RegExp(`^(?:\\*\\.)?(?:${LABEL}\\.)+${LABEL}$`, 'u');
const ALL_DIGITS = /^\p{N}+$/u;

/** A text that starts with a URL scheme, such as `https://`. */
const SCHEME = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Splits text into pieces at commas, semicolons and new lines, and each piece into words at white space, never
 * inside quotes or angle brackets, so `"Smith, Ana" <ana@example.com>` is one piece of two words.
 */
function emailPieces(text: string): string[][] {
  const pieces: string[][] = [];
  let words: string[] = [];
  let word = '';
  let closer = '';
  for (const char of text) {
    if (closer !== '') {
      word += char;
      if (char === closer) closer = '';
    } else if (/[,;\r\n]/.test(char)) {
      if (word !== '') words.push(word);
      if (words.length > 0) pieces.push(words);
      word = '';
      words = [];
    } else if (/\s/.test(char)) {
      if (word !== '') words.push(word);
      word = '';
    } else {
      if (char === '"') closer = '"';
      else if (char === '<') closer = '>';
      word += char;
    }
  }
  if (word !== '') words.push(word);
  if (words.length > 0) pieces.push(words);
  return pieces;
}

/**
 * Email addresses. Splits on commas, semicolons and new lines, then on white space, never inside quotes or angle
 * brackets; in a piece holding `Name <address>`, keeps every address, bracketed or bare, and drops the name;
 * drops a `mailto:` and angle brackets and lowercases the domain; accepts what `<input type="email">` accepts with
 * a dot in the domain; compares without case.
 */
export const emailPreset: TagInputPreset = {
  split: (text) =>
    emailPieces(text).flatMap((words) => {
      if (!words.some((word) => /<[^<>]*>/.test(word))) return words;
      return words.flatMap((word) => {
        const bracketed = /<([^<>]*)>/.exec(word);
        if (bracketed) return filled([bracketed[1] ?? '']);
        // A name's words, quoted or not, are dropped; a bare address beside the bracketed ones is kept.
        return word.includes('@') && !/^"[^"]*"$/.test(word) ? [word] : [];
      });
    }),
  normalize: (value) => {
    const bare = value
      .trim()
      .replace(/^<|>$/g, '')
      .replace(/^mailto:/i, '')
      .trim();
    const at = bare.lastIndexOf('@');
    return at === -1 ? bare : `${bare.slice(0, at)}@${bare.slice(at + 1).toLowerCase()}`;
  },
  isValid: (value) => EMAIL.test(value),
  key: (value) => value.toLowerCase(),
  delimiters: [',', ';', ' '],
  join: ', ',
  inputProps: { ...ADDRESS_BOX, inputMode: 'email' },
  invalidMessage: () => 'Enter email addresses in the correct format, like name@example.com',
};

/**
 * Domains. Splits on commas, semicolons and white space; lowercases and keeps a pasted URL's host; accepts two or
 * more labels of letters in any script, digits and inner hyphens, a last label not all digits, 253 characters at
 * most and a leading `*.` wildcard.
 */
export const domainPreset: TagInputPreset = {
  split: (text) => filled(text.split(/[,;\s]+/)),
  normalize: (value) =>
    value
      .trim()
      .toLowerCase()
      .replace(SCHEME, '')
      .replace(/[/?#].*$/, '')
      .replace(/:\d*$/, '')
      .replace(/\.$/, ''),
  isValid: (value) => {
    if (value.length > 253 || !DOMAIN.test(value)) return false;
    const last = value.slice(value.lastIndexOf('.') + 1);
    return !ALL_DIGITS.test(last);
  },
  key: (value) => value,
  delimiters: [',', ';', ' '],
  join: ', ',
  inputProps: { ...ADDRESS_BOX, inputMode: 'url' },
  invalidMessage: () => 'Enter domains like example.com',
};

/** A pasted URL's path, decoded where it can be, or the text itself. Reads `URL` only here, never at import. */
function pathOf(text: string): string {
  if (!SCHEME.test(text)) return text;
  let path: string;
  try {
    path = new URL(text).pathname;
  } catch {
    return text;
  }
  try {
    return decodeURI(path);
  } catch {
    return path;
  }
}

/**
 * Paths. Splits on commas and white space; keeps a pasted URL's path, adds the leading slash, collapses runs of
 * slashes and drops a trailing one except on the root; accepts a slash and then no white space and no `#`, with
 * `*` as a wildcard; compares with case, as servers treat paths.
 */
export const pathPreset: TagInputPreset = {
  split: (text) => filled(text.split(/[,\s]+/)),
  normalize: (value) => {
    const trimmed = value.trim();
    if (trimmed === '') return '';
    const path = pathOf(trimmed);
    const rooted = (path.startsWith('/') ? path : `/${path}`).replace(/\/{2,}/g, '/');
    return rooted.length > 1 ? rooted.replace(/\/$/, '') : rooted;
  },
  isValid: (value) => /^\/[^\s#]*$/.test(value),
  key: (value) => value,
  delimiters: [',', ' '],
  join: ', ',
  inputProps: { ...ADDRESS_BOX, inputMode: 'url' },
  invalidMessage: () => 'Enter paths that start with a slash, like /blog',
};
