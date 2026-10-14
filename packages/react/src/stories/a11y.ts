/*
 * The a11y addon's settings the stories share. It is story code only and never ships: the build starts
 * from src/index.ts, which never imports this folder, tsconfig.build.json leaves it out, and the
 * 'use client' guard skips it.
 */

/**
 * Axe's label-in-name check (`label-content-name-mismatch`), skipped on menu rows alone. A row is named by
 * its label and described by its second line, its end value and its key chip, through the ids React Aria
 * gives them, so a screen reader hears "Settings" and then "Account and billing, Command comma", and a voice
 * user says the label. The check asks for every word a row shows in its name; WCAG 2.5.3 asks it of the
 * label. Overriding the rule's selector keeps its own matching, so it still runs on everything else on the
 * page, and every other rule runs everywhere. Put it in a story's `parameters.a11y`, or spread it there.
 * Recorded in docs/design-system.md ("Menu").
 */
export const MENU_ROW_A11Y = {
  config: { rules: [{ id: 'label-content-name-mismatch', selector: '*:not(.menu-item)' }] },
};
