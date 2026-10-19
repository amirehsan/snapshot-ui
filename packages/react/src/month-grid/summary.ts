import type { MonthGridState, MonthGridYear } from './MonthGrid';

/**
 * The English default (spec 8.3): for each state whose look is not `filled`, in the order of `states`, its label,
 * a colon, and its months grouped by year in the order the years are drawn, each year's months joined by commas
 * with the year once at the end, years joined by semicolons; each state a sentence. With nothing but filled or
 * outside months, the first filled state's label and "every month"; with no filled state either, nothing.
 * String joining of the app's own words, so the server and the browser write the same sentence.
 */
export function monthGridSummary(
  states: readonly MonthGridState[],
  years: readonly MonthGridYear[],
  monthNames: readonly string[],
): string {
  const sentences: string[] = [];
  for (const state of states) {
    if (state.look === 'filled') continue;
    const parts: string[] = [];
    for (const year of years) {
      const names = year.months.flatMap((id, index) => {
        const name = monthNames[index];
        return id === state.id && name !== undefined ? [name] : [];
      });
      if (names.length > 0) parts.push(`${names.join(', ')} ${year.label}`);
    }
    if (parts.length > 0) sentences.push(`${state.label}: ${parts.join('; ')}.`);
  }
  if (sentences.length > 0) return sentences.join(' ');
  const filledIds = new Set(states.filter((state) => state.look === 'filled').map((state) => state.id));
  const filled = states.find((state) => state.look === 'filled');
  const anyFilled = years.some((year) => year.months.some((id) => id !== null && filledIds.has(id)));
  return filled !== undefined && anyFilled ? `${filled.label}: every month.` : '';
}
