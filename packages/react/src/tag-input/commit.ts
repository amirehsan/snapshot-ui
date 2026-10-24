/*
 * The one step that turns text into values (spec 6.4, ruling 8), pure and shared by the field and its tests. The
 * value only ever gains what the preset accepts; what it refuses, and what the limit leaves out, stays as text.
 * Internal: not exported from the package.
 */
import type { TagInputPreset } from './presets';

export interface CommitResult {
  /** The values after the step, in order: the ones before, then those added. */
  values: string[];
  /** The candidates added, cleaned. */
  added: string[];
  /** Candidates dropped because their key was already there, cleaned. */
  duplicates: string[];
  /** What the text box holds after the step. */
  text: string;
  /** Why text was left in the box: candidates the preset refused, the limit, or nothing. */
  reason: 'invalid' | 'limit' | null;
  /** How many candidates the preset refused. */
  refused: number;
}

export interface CommitOptions {
  /** The most values, if any. */
  maxValues?: number | undefined;
  /**
   * `'enter'` commits the whole text, refusing with a reason: Enter, a paste, a blur. `'typed'` commits only what
   * comes before the last delimiter, and only when every candidate there is added, else leaves the text as typed.
   */
  mode: 'typed' | 'enter';
}

/** Where the last delimiter or new line of `text` ends, or -1 with none. Delimiters are single characters. */
export function lastDelimiterEnd(text: string, preset: TagInputPreset): number {
  for (let at = text.length - 1; at >= 0; at -= 1) {
    const char = text.charAt(at);
    if (char === '\n' || char === '\r' || preset.delimiters.includes(char)) return at + 1;
  }
  return -1;
}

/** Whether `text` holds one of the preset's delimiters or a new line. */
export function hasDelimiter(text: string, preset: TagInputPreset): boolean {
  return lastDelimiterEnd(text, preset) !== -1;
}

/** Commits all of `text`: adds what passes, under the limit and new, and leaves the rest in the text, in order. */
function commitAll(
  text: string,
  values: readonly string[],
  preset: TagInputPreset,
  maxValues: number | undefined,
): CommitResult {
  const keyOf = preset.key ?? ((value: string) => value);
  const seen = new Set(values.map(keyOf));
  const added: string[] = [];
  const duplicates: string[] = [];
  const left: string[] = [];
  let refused = 0;
  let overLimit = 0;
  for (const piece of preset.split(text)) {
    const candidate = preset.normalize(piece);
    if (candidate === '') continue;
    if (!preset.isValid(candidate)) {
      refused += 1;
      left.push(candidate);
      continue;
    }
    const key = keyOf(candidate);
    if (seen.has(key)) {
      duplicates.push(candidate);
      continue;
    }
    if (maxValues !== undefined && values.length + added.length >= maxValues) {
      overLimit += 1;
      left.push(candidate);
      continue;
    }
    seen.add(key);
    added.push(candidate);
  }
  return {
    values: added.length === 0 ? [...values] : [...values, ...added],
    added,
    duplicates,
    text: left.join(preset.join),
    reason: refused > 0 ? 'invalid' : overLimit > 0 ? 'limit' : null,
    refused,
  };
}

/**
 * Turns `text` into values against `values` with `preset`. In `'enter'` mode every candidate is tried: the valid
 * new ones are added in order, duplicates are dropped, and refused candidates and those past `maxValues` stay in
 * the text joined by the preset's `join`, with the reason. In `'typed'` mode the text after the last delimiter is
 * still being typed and stays; the candidates before it are added only when none is refused or past the limit, and
 * otherwise the text is returned exactly as typed with no reason, so a space inside "Ana <ana@example.com>" waits.
 */
export function commitText(
  text: string,
  values: readonly string[],
  preset: TagInputPreset,
  options: CommitOptions,
): CommitResult {
  if (options.mode === 'enter') return commitAll(text, values, preset, options.maxValues);
  const unchanged: CommitResult = {
    values: [...values],
    added: [],
    duplicates: [],
    text,
    reason: null,
    refused: 0,
  };
  const end = lastDelimiterEnd(text, preset);
  if (end === -1) return unchanged;
  const head = commitAll(text.slice(0, end), values, preset, options.maxValues);
  if (head.reason !== null) return unchanged;
  return { ...head, text: text.slice(end) };
}
