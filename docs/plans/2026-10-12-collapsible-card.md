# CollapsibleCard and the Phase 1b Follow-ups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `CollapsibleCard`, the source app's folding card, to the library, and make the three decisions the owner took on the phase 1b review. Those are:
- an accessible name is required in every field's types;
- a standalone Checkbox takes `isChanged`;
- disabled row labels are dimmed, and every control sits on its label's first line.

Release it all as 0.2.0.

**Architecture:**
- **The follow-ups.** Three small tasks change existing components in place, in their CSS, their prop types and their tests.
- **CollapsibleCard** is a new client component on React Aria's `Disclosure`. It draws with `Card`'s own CSS classes, so `Card` stays a static server component.
- **CollapsibleCard is built in three tasks:**
  1. the card and its fold;
  2. remembering the fold through a small `useSyncExternalStore` store;
  3. the folded "changed" marker, and opening itself for an invalid field.

**Tech Stack:** the phase 1a and 1b stack, unchanged. That is pnpm 10.10, Turborepo 2.11, Node 24.5 or later, TypeScript 7 beside the TypeScript 6 API, Style Dictionary 5.6, Lightning CSS 1.33, Stylelint 17, Tailwind CSS 4.3, React 19.3, react-aria-components 1.22, lucide-react, tsdown, Vitest 5 with jsdom, Testing Library, axe-core, Storybook 10.6, Playwright 1.64, Next.js 16.4 on Fumadocs, Changesets 3.0 and size-limit.

**Spec:** `docs/specs/2026-10-12-collapsible-card-design.md`, with the parent spec `docs/specs/2026-10-10-snapshot-ui-design.md` (sections 6.3 and 11). The design authority is `docs/design-system.md`, including Appendix B.

**Source app:** the private app this library is extracted from. Its path is in the gitignored `.local/SOURCE.md`. The folding card there is `js/collapse.js` with the fold rules in `styles/primitives/panel.css`. Read them if a task needs to, but never copy the app's name, its class prefix or its class names into a committed file.

**How this plan was made:** every task was built and run in a scratch copy of the repository before it was written down, each on top of the last, with every gate green after each one. So every code block below is the exact file the task produces at that point, and every edit to an existing file is exact text that applies on top of the previous task.

Test totals are given as "the N tests this task adds", with the totals observed at that point in parentheses. The prototypes skipped the Docker visual step. Each task lists the baselines it adds or changes, and the implementer generates them.

## Global Constraints

### Runtime and packaging

- Node `>=24.5`, `"packageManager": "pnpm@10.10.0"`, every package `"type": "module"`, ESM only.
- React and React DOM are peers at `^19.0.0`. `react-aria-components` and `lucide-react` are dependencies of `@snapshot-ui/react`, and `@snapshot-ui/core` is an optional peer of it.

### React components

- Every source file that imports `react-aria-components` starts with `'use client';`. Static modules import no React Aria and carry no directive, and `packages/react/test/server-components.test.tsx` guards both.
- Use React Aria 1.22's current compositions. `CollapsibleCard` uses `Disclosure`, `Button slot="trigger"` and `DisclosurePanel`. Never use the deprecated bare `Checkbox`, `Radio` or `Switch`.
- `className` and `ref` go on the component's root. `className` takes a string, or React Aria's render function where the root is a React Aria element, and merges after the library's class.
- Presence checks on rendered parts use `present()` from `packages/react/src/utils/present.ts`, never `!= null`.

### CSS

- Component CSS lives in `packages/core/src/components/<name>.css`, inside `@layer components`, imported from `src/styles.css`, and uses only tokens. Stylelint's `snapshot-ui/token-only` rule enforces this, and forbids `light-dark()`.
- **Non-token colors:** CSS system colors are the only ones allowed, and only inside `@media (forced-colors: active)`. A core test fails any other use.
- **State selectors.** States are data attributes with React Aria's names, and each also matches its native or plain-HTML twin. A `:has()` twin names the input: `:has(input:focus-visible)`, not `:has(:focus-visible)`. Hover rules sit inside `@media (hover: hover)`.
- **The focus ring** is `outline: var(--focus-ring-width) solid var(--focus-ring-color); outline-offset: var(--focus-ring-offset);`. An inset ring on an ink fill uses `var(--color-canvas)`.
- **Cursor:** `pointer` on every interactive control, and `not-allowed` when disabled.
- **Motion:** reduced motion turns every transition off. Core components never animate their shape.
- **Text a person writes** wraps at 320px with no sideways scroll (`overflow-wrap: anywhere`, `min-width: 0` on flex and grid children).

### Field states

- **Changed.** The field root carries `data-changed`, and a clay "Changed" chip shows, announced through `aria-describedby` while it shows. Its text comes from `changedLabel`, default "Changed". Invalid always outranks changed.
- **The light orange changed edge** appears only on text controls and on the outer track or row of a composite control. Choice groups show changed by the chip alone.

### Design rules

- **Theme axes:** `data-theme="light" | "dark"` and `data-shape="rounded" | "soft" | "square"`, on any element.
- **Typography:** weights 400, 450, 500 and 700 only. 14px is the minimum for sentences, and 12px for short uppercase labels.
- **Touch targets:** every one is at least 40px. A control drawn smaller extends its hit area with a pseudo-element.
- **Reserved colors:**
  - Signal orange is for consent only.
  - Light signal orange is the attention cue: the changed edge, accent dots, and CollapsibleCard's folded marker.
  - Clay is for the Changed chip only.
  - Error means invalid or failed, and success means success.
  - Taupe is for placeholders and disabled text only.
- **Contrast records.** A new text-on-ground or edge-on-ground pair goes into `CONTRAST_PAIRS` in `packages/core/scripts/contrast.js` with a test, and its measurement goes into the component's Appendix B section.

### Docs site

- Component pages go in `apps/docs/content/docs/components/<slug>.mdx`. `components/meta.json` and `apps/docs/examples/index.ts` are kept alphabetical.
- A new page is added to the completeness-guarded maps in `apps/docs/tests/components.spec.ts`: `LONG_TARGETS` or `NO_LONG_TEXT`, and `SERVER_RENDERED`. A page with several props tables gives each a distinct `label`.

### Repo, commits and releases

- **The repo is public.** Never commit the source company's name, its CMS's name, any client name or the source app's class prefix. `pnpm check:public` enforces this.
- **Commits:**
  - Messages follow Conventional Commits, use the exact message each task gives, and have no body.
  - They never mention Claude Code and never carry a Co-Authored-By line.
  - No em dashes or emojis anywhere.
- **Before committing:**
  - Run `pnpm format` before every commit.
  - Generate visual baselines only with `pnpm --filter @snapshot-ui/storybook visual:docker`, and commit them in the task that adds or changes the stories.
- **Every task adds a changeset** releasing `@snapshot-ui/core` and `@snapshot-ui/react` together as minor.

## Review Focus

The input classes or conditions the spec implies that a single component's ordinary tests would not exercise, most likely first. Each one is pinned by a test in the task named.

1. **A server-rendered page with a remembered fold.** The card renders open on the server and folds after hydration, with no hydration warning and no animated fold on load. Pinned in Task 5.
2. **A popup or overflowing child inside an OPEN card.** It is not clipped; only a folded or folding card clips. Pinned in Task 4.
3. **Nested CollapsibleCards.** An inner card keeps its own fold. Folding the outer one hides the inner one. An outer card's folded marker also counts changed fields inside an inner card. Pinned in Task 6.
4. **A long title with actions at 320px.** The title wraps inside the toggle and the actions wrap with no sideways scroll, and the toggle stays at least 40px tall. Pinned in Task 4.
5. **Find-in-page and other tabs.** Find-in-page opening a folded card, and another tab folding the same key, both reach the stored state and every card with that key. Pinned in Task 5.

---

### Task 1: Disabled row labels, and where the control sits

**Files:**
- Modify: `packages/core/src/components/radio.css`, `packages/core/src/components/switch.css`
- Test: `packages/core/test/css.test.js`
- Modify (story helpers): `packages/react/src/stories/paint.ts`
- Test: `packages/react/src/switch/Switch.stories.tsx`, `packages/react/src/radio-group/RadioGroup.stories.tsx`, `packages/react/src/rtl/RightToLeft.stories.tsx`
- Modify: `docs/design-system.md` (a bullet in RadioGroup and a paragraph in Switch, both in Appendix B; the last three lines of the file are not touched)
- Modify: `apps/docs/content/docs/components/switch.mdx`, `apps/docs/content/docs/components/radio-group.mdx` (one sentence each)
- Create: `.changeset/disabled-labels.md`
- Change (Docker step): 30 baselines in `apps/storybook/tests/visual/__screenshots__/`. None is added.

**Interfaces:**
- Consumes:
  - Tokens `--color-taupe`, `--color-ink`, the `--text-body*` family and `--focus-ring-*`. No token is added or changed.
  - From `css.test.js`: the helpers `blockAfter`, `closeUp` and `FORCED_COLORS`, and each describe's own `rules()` and `DISABLED`.
  - From the stories: `tokenColor` from `packages/react/src/stories/paint.ts`, and each file's own helpers (`parts` in the Switch stories, `rowOf` in the RadioGroup stories, `find` and `rect` in the right-to-left stories).
- Produces no change to any component's props, markup, class names or exported types. `Switch.tsx`, `Radio.tsx` and `Checkbox.tsx` are untouched.
- Produces in `switch.css`:
  - A shared rule on `.switch, .field-head:has(> .switch)` that now holds `--switch-thumb-size`, `--switch-inset` (both moved there from `.switch`, same values) and the new `--switch-height`, `calc(var(--switch-thumb-size) + 2 * var(--switch-inset))`, which is 30px. The track's `height` reads it. The chip is the row's sibling, so it can only read the size from the head.
  - On `.switch`: `align-items: flex-start`, and `padding-block: max(0px, calc((var(--switch-height) - 1lh) / 2))`.
  - On `.switch-track`: `margin-block: calc((1lh - var(--switch-height)) / 2)`.
  - On the head, `.field-head:has(> .switch)`: `align-items: flex-start` (it was `center`). On the chip, `.field-head:has(> .switch) > .field-changed`: `margin-block-start: calc((var(--switch-height) - 1lh) / 2)`, where `1lh` is the chip's own 14px line, so the margin is 8px.
  - `color: var(--color-taupe)` on a disabled row, and `color: GrayText` on a disabled row in forced colors.
- Produces in `radio.css` the rule `.radio:has(.radio-text) > .radio-indicator { align-self: flex-start; margin-block-start: calc((1lh - 20px) / 2); }`, placed after the `.radio-indicator` rule.
- Produces in `packages/react/src/stories/paint.ts`, for stories only (it never ships):

```ts
export function middleOf(element: Element): number; // the y of the middle of the element's box
export function lineCount(text: Element): number; // the text box's height over its line height, rounded; the box must have no padding
export function firstLineOffset(control: Element, text: Element): number; // px from the middle of the text's first line to the middle of the control, positive when the control is lower
```

- Produces 6 core tests, in the existing describes `src/components/checkbox.css` (1), `src/components/radio.css` (2) and `src/components/switch.css` (3).
- Produces no new story. Nine stories gain assertions: `Switch` `Off`, `Changed`, `DisabledOff`, `DisabledOn` and `LongLabel`; `RadioGroup` `LongLabel` and `Labelless`; and `Checks/Right to left` `RadioGroupMirrored` and `SwitchMirrored`. The two right-to-left stories gain an extra option with a long Arabic label each. `Switch` `LongLabel` now draws two switches: the long one, and one whose label has a line break, so its chip stays beside it.

**What this task decides** (all of it is also in the Appendix B text of Step 3):
- **Each control was checked first, and only what differs is changed.**
  - Checkbox: its disabled row is `color: var(--color-taupe)`, and its box starts at the top of the row with a margin of half of what the line has over the box. It already meets both rules, so its CSS is not touched and a core test pins the two rules.
  - Radio: its disabled row already sets `--radio-fg` to taupe, and the row's `color` reads it, so the label is already dimmed (a core test pins that). It centred the dot, so only the alignment changes.
  - Switch: the label stayed ink and the track was centred. Both change.
- **Radio keeps its row centred and moves only the dot, and only when the row has text.**
  - The dot takes `align-self: flex-start` and a block-start margin of half of what the line has over it (`(1lh - 20px) / 2`, 1.2px at the 22.4px body line), under `.radio:has(.radio-text) > .radio-indicator`. For one line that is the place centring gave it, so every one-line row is pixel for pixel as it was.
  - A row with no text is not matched. Its content box is 21px (the 40px minimum less 16px of padding and the 3px of edge) and the dot is 20px, so centring leaves 0.5px above it. A margin there would move the dot 1.5px down in the `Labelless` baselines, which must not move. The `Labelless` story now pins that the dot stays in the middle of its row.
  - The test for text is the `radio-text` box the component draws around the words, as the checkbox's label-less hit area tests `checkbox-text`. A hand-written row with bare text beside the library's dot keeps the old centring. Appendix B says so.
- **Switch pads the row and pulls the track back, on both sides, and leaves the text box alone.**
  - The track (30px) is taller than the 22.4px line. To put the track's middle on the first line's middle, the text must sit 3.8px below the track's top. The row takes `padding-block` of half the difference, and the track takes the same half back as `margin-block`. One line is then 3.8 + 22.4 + 3.8 = 30px, the old row, with the text where it was. A longer label runs on below, with the same 3.8px under its last line that one line has. The row's `::before` hit area is measured from the row, so it is still 40px for one line.
  - The padding is on the row, not on `switch-text`. The text box stays one line high, which the `RichLabel` story asserts (under 30px), and a label that is bare text, as the `PlainHtml` story draws, is offset too.
  - The margins are even on both sides on purpose. A layout that gives the row `display: contents`, as the docs' homepage settings rows do, then centres the track as before: the docs screenshots of ten pages in light and dark at 1440px and 375px were identical before and after, but for the Switch page's disabled labels.
  - `max(0px, ...)` on the padding says what happens for a line taller than the track: no padding, and the track's margin goes positive, so the track is still level with the first line.
- **The Changed chip is level with the first line too.**
  - The chip is a sibling of the row in the label row (`field-head`), which centred its items. The head now starts them at the top, and the chip takes `margin-block-start` of half of what the track has over the chip's own line, `(30px - 14px) / 2 = 8px`. That is exactly where centring on a one-line, 30px row put it, so a one-line row with its chip beside it is pixel for pixel as it was: the `Changed`, `ChangedAndFocused` and `InDarkScope` baselines show it, and the Changed row of `InDarkScope` is identical to the pixel.
  - The track's size is declared on the head as well as on the row, in one shared rule, because the chip is the row's sibling and cannot inherit it from the row. A size override written on `.switch` alone does not reach the chip.
  - A chip that does not fit beside the row drops under it, as before, and carries the same 8px of margin there: it sits 8px lower under a label than it did. No way was found to apply the margin only when the chip shares a line with the row, since CSS cannot tell. This is the one place a layout moves, and only where the chip already wrapped. In the baselines, only `switch--long-label` has a wrapped chip.
  - `Switch` `LongLabel` shows both cases, since a chip that is beside a multi-line label needs a row narrower than the field, and a long label fills the field. The second switch breaks its label with a line break. The story asserts that the long one drops its chip under the row, and that the short one keeps it beside the row and level with the first line.
- **The first line is the nominal line box, not the glyphs.** `firstLineOffset` takes the top of the label box plus half a line height. A range around the text's glyphs sits 0.69px off that in this font, because the glyph box is not centred in the line box, and it moves with the font and the platform, which a right-to-left test in Arabic must not depend on. Each play check allows 1px.
- **Disabled labels are taupe, in forced colors `GrayText`.** The design system reserves taupe for placeholders and disabled text, and WCAG 1.4.3 exempts a disabled control. A disabled checkbox's label is `GrayText` in forced colors, and so is a disabled radio's, so the switch's is too. Taupe on the five surfaces measures 1.40 to 1.58 in light and 3.68 to 3.81 in dark, recorded in Appendix B and not gated, as the checkbox's and radio's are. No `CONTRAST_PAIRS` entry is added, because taupe would fail the text minimum there by design.
- **Right to left needs no direction selector.** All of it is on the block axis. The right-to-left stories still get a wrapped option each, so a regression there is caught.
- **One existing right-to-left assertion was empty, and now reads the right chip.** `SwitchMirrored` took `.field-changed` from the whole story, which is the hidden chip of the first, unchanged switch (every field keeps one, hidden), a box of zeros, so its "chip is left of the row" and "chip is inside the field" checks passed with nothing to measure. They now read the chip of the changed field, and still pass, now measuring something.
- **No story is added.** Each changed control already has a story with a multi-line label (`LongLabel`, and `LongWord` for the radio) and one with a disabled state (`DisabledOff` and `DisabledOn`, `Disabled`), so those carry the new checks and the baselines they already have are the ones that change.
- **Docs pages gain one plain sentence each.**
  - Switch: "A disabled switch draws its label in taupe, as a disabled checkbox and radio do." It follows the sentence on the disabled look.
  - RadioGroup: "A disabled option draws its label in taupe, as a disabled checkbox and switch do." It follows the sentence on the disabled group.
  - Checkbox already says "A disabled box is recessed with a taupe label", so it is not edited.
  - The screenshots of ten docs pages in light and dark at 1440px and 375px were identical before and after, but for those two pages (the added sentence, and the Switch preview's taupe labels). The end-to-end suite passes. A throwaway axe run (axe-core 4.14) of the homepage and the Switch, RadioGroup and Checkbox pages at 320, 375 and 1440px in light and dark found no sideways scroll and no violation but one: `label-content-name-mismatch` on the docs rail's search button at 1440px, on all three component pages, including Checkbox's, which this task does not touch. The end-to-end suite's own axe checks do not report it.

- [ ] **Step 1: Write the failing tests**

The core tests first. In `packages/core/test/css.test.js` make three edits, in this order.

Edit 1. Replace:

```js
    expect(bare).toContain('translate: -50% -50%;');
  });

  it('turns only the edge for an invalid box, from React Aria or from a plain input with aria-invalid', () => {
    const rule = blockAfter(closeUp(rules()), INVALID);
    expect(rule.trim()).toBe('--checkbox-edge: var(--color-error);');
```

with:

```js
    expect(bare).toContain('translate: -50% -50%;');
  });

  it('draws a disabled label in taupe, and sets the box on the first line of a label that wraps', () => {
    const disabled = blockAfter(
      closeUp(rules()),
      '.checkbox:is(:where(:has(input:disabled)), [data-disabled]) {',
    );
    expect(disabled).toContain('color: var(--color-taupe);');
    // The row starts its items at the top, and the box's margin is half of what the line has over the box.
    expect(blockAfter(rules(), '.checkbox {\n    --checkbox-fill')).toContain('align-items: flex-start;');
    expect(blockAfter(rules(), '.checkbox-box {')).toContain(
      'margin-block-start: calc((1lh - var(--checkbox-size)) / 2);',
    );
  });

  it('turns only the edge for an invalid box, from React Aria or from a plain input with aria-invalid', () => {
    const rule = blockAfter(closeUp(rules()), INVALID);
    expect(rule.trim()).toBe('--checkbox-edge: var(--color-error);');
```

Edit 2. Replace:

```js
    const disabled = blockAfter(rules(), `.radio${DISABLED} {`);
    expect(disabled).toContain('cursor: not-allowed;');
    expect(disabled).toContain('var(--color-taupe)');
  });

  it('gives every state a native twin, so a plain label with a checked input is drawn the same', () => {
```

with:

```js
    const disabled = blockAfter(rules(), `.radio${DISABLED} {`);
    expect(disabled).toContain('cursor: not-allowed;');
    expect(disabled).toContain('var(--color-taupe)');
  });

  it('draws a disabled label in taupe, through the property the row reads its text color from', () => {
    expect(blockAfter(rules(), '.radio {')).toContain('color: var(--radio-fg);');
    expect(blockAfter(rules(), `.radio${DISABLED} {`)).toContain('--radio-fg: var(--color-taupe);');
  });

  it('sets the dot on the first line of a label that wraps, and keeps a row with no text centred', () => {
    // The dot is 20px, so its margin is half of what the line has over it.
    const dot = blockAfter(rules(), '.radio:has(.radio-text) > .radio-indicator {');
    expect(dot).toContain('align-self: flex-start;');
    expect(dot).toContain('margin-block-start: calc((1lh - 20px) / 2);');
    // The row stays centred, so a row with no text keeps the dot in the middle of its 40px.
    expect(blockAfter(rules(), '.radio {')).toContain('align-items: center;');
    expect(blockAfter(rules(), '.radio-indicator {')).not.toContain('margin');
  });

  it('gives every state a native twin, so a plain label with a checked input is drawn the same', () => {
```

Edit 3. Replace:

```js
      /\.switch:is\(\[data-disabled\][^{]*\)\s*\{[^}]*--switch-track-fill:\s*var\(--color-disabled\);/;
    expect(rules()).toMatch(on);
    expect(rules()).toMatch(off);
  });

  it('boxes the label text, so one long word wraps in the row and inline markup stays one run', () => {
```

with:

```js
      /\.switch:is\(\[data-disabled\][^{]*\)\s*\{[^}]*--switch-track-fill:\s*var\(--color-disabled\);/;
    expect(rules()).toMatch(on);
    expect(rules()).toMatch(off);
  });

  it('draws a disabled label in taupe, and in GrayText in forced colors, as a disabled checkbox does', () => {
    const header = '.switch:is([data-disabled], :has(input:disabled)) {';
    expect(blockAfter(rules(), header)).toContain('color: var(--color-taupe);');
    expect(blockAfter(blockAfter(rules(), FORCED_COLORS), header)).toContain('color: GrayText;');
  });

  it('sets the track on the first line of a label that wraps, and keeps a row of one line 30px tall', () => {
    // The track is taller than a line, so the row pads the text down by half the difference and the track
    // takes the same half back as a negative margin: one line fills the 30px, and more lines push past it.
    const size = blockAfter(rules(), '.switch,\n  .field-head:has(> .switch) {');
    expect(size).toContain('--switch-height: calc(var(--switch-thumb-size) + 2 * var(--switch-inset));');
    const row = blockAfter(rules(), '.switch {');
    expect(row).toContain('align-items: flex-start;');
    expect(row).toContain('padding-block: max(0px, calc((var(--switch-height) - 1lh) / 2));');
    const track = blockAfter(rules(), '.switch-track {');
    expect(track).toContain('height: var(--switch-height);');
    expect(track).toContain('margin-block: calc((1lh - var(--switch-height)) / 2);');
  });

  it('sets the Changed chip level with the first line, as the track is, from a head that starts its items at the top', () => {
    // The chip is the row's sibling, so the head carries the track's size for it to read.
    expect(rules()).toMatch(/\.field-head:has\(> \.switch\)\s*\{\s*align-items: flex-start;\s*\}/);
    const chip = blockAfter(rules(), '.field-head:has(> .switch) > .field-changed {');
    expect(chip).toContain('margin-block-start: calc((var(--switch-height) - 1lh) / 2);');
    // The old rule centred the head's items on the row, which is the middle of a label that wraps.
    expect(rules()).not.toMatch(/\.field-head:has\(> \.switch\)\s*\{[^}]*align-items: center/);
  });

  it('boxes the label text, so one long word wraps in the row and inline markup stays one run', () => {
```

The story helpers. In `packages/react/src/stories/paint.ts` make one edit.

Replace:

```ts
export function tokenPixels(name: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}
```

with:

```ts
export function tokenPixels(name: string): number {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue(name));
}

/** The y of the middle of an element's box. */
export function middleOf(element: Element): number {
  const { top, height } = element.getBoundingClientRect();
  return top + height / 2;
}

/** How many lines of text `text` draws, from its height and its line height. It must have no padding. */
export function lineCount(text: Element): number {
  return Math.round(text.getBoundingClientRect().height / parseFloat(getComputedStyle(text).lineHeight));
}

/**
 * The px from the middle of the first line of `text` to the middle of `control`, positive when the control
 * is lower. The first line box starts at the top of the text's content box and is one line height tall,
 * which is what the stylesheet aligns to and does not depend on the font that draws the glyphs.
 */
export function firstLineOffset(control: Element, text: Element): number {
  const style = getComputedStyle(text);
  const top =
    text.getBoundingClientRect().top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
  return middleOf(control) - (top + parseFloat(style.lineHeight) / 2);
}
```

The Switch stories. In `packages/react/src/switch/Switch.stories.tsx` make seven edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Link } from '../link';
import { tokenColor } from '../stories/paint';
import { Switch } from './Switch';

/** The row, the track and the thumb of the first switch drawn inside `scope`. */
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Link } from '../link';
import { firstLineOffset, lineCount, tokenColor } from '../stories/paint';
import { Switch } from './Switch';

/** The row, the track and the thumb of the first switch drawn inside `scope`. */
```

Edit 2. Replace:

```tsx
  const thumb = scope.querySelector('.switch-thumb');
  if (!row || !track || !thumb) throw new Error('No switch drawn');
  return { row, track, thumb };
}

/** The gaps, in px, between the thumb and the start, the end, the top and the bottom of the track. */
```

with:

```tsx
  const thumb = scope.querySelector('.switch-thumb');
  if (!row || !track || !thumb) throw new Error('No switch drawn');
  return { row, track, thumb };
}

/** The label's text box and the Changed chip of the switch whose field root is `field`. */
function labelAndChip(field: Element): { text: Element; chip: Element } {
  const text = field.querySelector('.switch-text');
  const chip = field.querySelector('.field-changed');
  if (!text || !chip) throw new Error('No label or chip drawn');
  return { text, chip };
}

/** The gaps, in px, between the thumb and the start, the end, the top and the bottom of the track. */
```

Edit 3. Replace:

```tsx
    await expect(gaps.start).toBeCloseTo(3, 1);
    await expect(gaps.top).toBeCloseTo(3, 1);
    await expect(gaps.bottom).toBeCloseTo(3, 1);
  },
};
```

with:

```tsx
    await expect(gaps.start).toBeCloseTo(3, 1);
    await expect(gaps.top).toBeCloseTo(3, 1);
    await expect(gaps.bottom).toBeCloseTo(3, 1);
    // One line of text leaves the row as tall as the track, with the track level with the line.
    await expect(parts(canvasElement).row.getBoundingClientRect().height).toBeCloseTo(30, 1);
    const text = canvasElement.querySelector('.switch-text');
    if (!text) throw new Error('No label drawn');
    await expect(Math.abs(firstLineOffset(track, text))).toBeLessThanOrEqual(1);
  },
};
```

Edit 4. Replace:

```tsx
  },
};

/** Disabled and off: a recessed track, a faint edge and a taupe thumb. */
export const DisabledOff: Story = {
  args: { isDisabled: true },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toBeDisabled();
    const { row, track, thumb } = parts(canvasElement);
    await expect(fill(track)).toBe(tokenColor('--color-disabled'));
    await expect(fill(thumb)).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(track).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
```

with:

```tsx
  },
};

/** Disabled and off: a taupe label, a recessed track, a faint edge and a taupe thumb. */
export const DisabledOff: Story = {
  args: { isDisabled: true },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toBeDisabled();
    const { row, track, thumb } = parts(canvasElement);
    await expect(getComputedStyle(row).color).toBe(tokenColor('--color-taupe'));
    await expect(fill(track)).toBe(tokenColor('--color-disabled'));
    await expect(fill(thumb)).toBe(tokenColor('--color-taupe'));
    await expect(getComputedStyle(track).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
```

Edit 5. Replace:

```tsx
  },
};

/** Disabled and on: a filled taupe track and a recessed thumb, so on and off differ without the thumb position. */
export const DisabledOn: Story = {
  args: { isDisabled: true, defaultSelected: true },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toBeDisabled();
    await expect(control).toBeChecked();
    const { track, thumb } = parts(canvasElement);
    await expect(fill(track)).toBe(tokenColor('--color-taupe'));
    await expect(fill(thumb)).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(track).borderTopColor).toBe('rgba(0, 0, 0, 0)');
```

with:

```tsx
  },
};

/** Disabled and on: a taupe label, a filled taupe track and a recessed thumb, so on and off differ without the thumb position. */
export const DisabledOn: Story = {
  args: { isDisabled: true, defaultSelected: true },
  play: async ({ canvas, canvasElement }) => {
    const control = canvas.getByRole('switch', { name: 'Weekly digest' });
    await expect(control).toBeDisabled();
    await expect(control).toBeChecked();
    const { row, track, thumb } = parts(canvasElement);
    await expect(getComputedStyle(row).color).toBe(tokenColor('--color-taupe'));
    await expect(fill(track)).toBe(tokenColor('--color-taupe'));
    await expect(fill(thumb)).toBe(tokenColor('--color-disabled'));
    await expect(getComputedStyle(track).borderTopColor).toBe('rgba(0, 0, 0, 0)');
```

Edit 6. Replace:

```tsx
    await expect(ring.borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(ring.borderTopWidth).toBe('2px');
    await expect(control).toHaveAccessibleDescription('Every Tuesday morning. Changed');
  },
};
```

with:

```tsx
    await expect(ring.borderTopColor).toBe(tokenColor('--color-signal-light'));
    await expect(ring.borderTopWidth).toBe('2px');
    await expect(control).toHaveAccessibleDescription('Every Tuesday morning. Changed');
    // The chip is beside the row, level with the line of the label.
    const { text, chip } = labelAndChip(canvasElement);
    await expect(Math.abs(firstLineOffset(chip, text))).toBeLessThanOrEqual(1);
  },
};
```

Edit 7. Replace:

```tsx
  },
};

/** A long label wraps beside the track and the chip drops under it, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    children: 'Email me a short summary of every comment on my posts, once a week, on Tuesday mornings',
    description: 'You can turn this off at any time from the link at the bottom of each email.',
    isChanged: true,
    defaultSelected: true,
  },
};
```

with:

```tsx
  },
};

/**
 * A long label wraps beside the track and the chip drops under it, with no sideways scroll at 375px. The
 * track stays level with the first line, the words a reader starts with, and not with the middle of the block.
 * A label with a line break is short enough to leave the chip beside it, and the chip is level with the first
 * line too.
 */
export const LongLabel: Story = {
  args: {
    children: 'Email me a short summary of every comment on my posts, once a week, on Tuesday mornings',
    description: 'You can turn this off at any time from the link at the bottom of each email.',
    isChanged: true,
    defaultSelected: true,
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Switch {...args} />
      <Switch {...args} description={undefined}>
        Weekly digest
        <br />
        on Tuesday mornings
      </Switch>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [long, broken] = [...canvasElement.querySelectorAll('.field')];
    if (!long || !broken) throw new Error('Two switches expected');
    for (const field of [long, broken]) {
      const { text } = labelAndChip(field);
      await expect(lineCount(text)).toBeGreaterThan(1);
      await expect(Math.abs(firstLineOffset(parts(field).track, text))).toBeLessThanOrEqual(1);
    }
    // The long label fills its row, so the chip drops under it.
    await expect(labelAndChip(long).chip.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      parts(long).row.getBoundingClientRect().bottom,
    );
    // The short one leaves room, so the chip is beside the row, level with the first line.
    const { text, chip } = labelAndChip(broken);
    await expect(chip.getBoundingClientRect().top).toBeLessThan(
      parts(broken).row.getBoundingClientRect().bottom,
    );
    await expect(Math.abs(firstLineOffset(chip, text))).toBeLessThanOrEqual(1);
  },
};
```

The RadioGroup stories. In `packages/react/src/radio-group/RadioGroup.stories.tsx` make five edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { tokenColor } from '../stories/paint';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { firstLineOffset, lineCount, middleOf, tokenColor } from '../stories/paint';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';
```

Edit 2. Replace:

```tsx
  const row = radio.closest('label');
  if (!row) throw new Error('A radio has no row');
  return row;
}

const meta = {
```

with:

```tsx
  const row = radio.closest('label');
  if (!row) throw new Error('A radio has no row');
  return row;
}

/** The dot and the label's text box of a row. */
function partsOf(row: HTMLElement): { dot: Element; text: Element } {
  const dot = row.querySelector('.radio-indicator');
  const text = row.querySelector('.radio-text');
  if (!dot || !text) throw new Error('A row has no dot or no text');
  return { dot, text };
}

const meta = {
```

Edit 3. Replace:

```tsx
  },
};

/** Long labels wrap inside the row, and the chip drops under a long group label, with no sideways scroll at 375px. */
export const LongLabel: Story = {
  args: {
    label: 'How often should we email you about the activity in your workspaces and projects?',
```

with:

```tsx
  },
};

/**
 * Long labels wrap inside the row, and the chip drops under a long group label, with no sideways scroll at
 * 375px. The dot stays level with the first line of a label, and not with the middle of the row.
 */
export const LongLabel: Story = {
  args: {
    label: 'How often should we email you about the activity in your workspaces and projects?',
```

Edit 4. Replace:

```tsx
      <Radio value="never">Never</Radio>
    </RadioGroup>
  ),
};

/** One word with no break in it wraps inside its row and never scrolls the group sideways. */
```

with:

```tsx
      <Radio value="never">Never</Radio>
    </RadioGroup>
  ),
  play: async ({ canvas }) => {
    const long = partsOf(rowOf(canvas.getByRole('radio', { name: /^A weekly summary/ })));
    const short = partsOf(rowOf(canvas.getByRole('radio', { name: 'Never' })));
    await expect(lineCount(long.text)).toBeGreaterThan(1);
    await expect(lineCount(short.text)).toBe(1);
    for (const { dot, text } of [long, short]) {
      await expect(Math.abs(firstLineOffset(dot, text))).toBeLessThanOrEqual(1);
    }
  },
};

/** One word with no break in it wraps inside its row and never scrolls the group sideways. */
```

Edit 5. Replace:

```tsx
    for (const name of ['Weekly', 'Monthly', 'Never']) {
      const row = rowOf(canvas.getByRole('radio', { name }));
      await expect(row.querySelector('.radio-text')).toBeNull();
      // A horizontal row hugs its content, so the padding and the dot are all that hold the width.
      const { width, height } = row.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(40);
```

with:

```tsx
    for (const name of ['Weekly', 'Monthly', 'Never']) {
      const row = rowOf(canvas.getByRole('radio', { name }));
      await expect(row.querySelector('.radio-text')).toBeNull();
      // With no text there is no first line, so the dot stays in the middle of its row.
      const dot = row.querySelector('.radio-indicator');
      if (!dot) throw new Error('A row has no dot');
      await expect(Math.abs(middleOf(dot) - middleOf(row))).toBeLessThan(0.5);
      // A horizontal row hugs its content, so the padding and the dot are all that hold the width.
      const { width, height } = row.getBoundingClientRect();
      await expect(width).toBeGreaterThanOrEqual(40);
```

The right-to-left stories. In `packages/react/src/rtl/RightToLeft.stories.tsx` make six edits, in this order.

Edit 1. Replace:

```tsx
import { Checkbox, CheckboxGroup } from '../checkbox';
import { Radio, RadioGroup } from '../radio-group';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { Switch } from '../switch';
import { TextArea } from '../text-area';
import { TextField } from '../text-field';
```

with:

```tsx
import { Checkbox, CheckboxGroup } from '../checkbox';
import { Radio, RadioGroup } from '../radio-group';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { firstLineOffset, lineCount } from '../stories/paint';
import { Switch } from '../switch';
import { TextArea } from '../text-area';
import { TextField } from '../text-field';
```

Edit 2. Replace:

```tsx
  },
};

/** The dot is at the right of its row, ahead of the words, and the hint is indented past it. */
export const RadioGroupMirrored: Story = {
  render: () => (
    <Rtl>
```

with:

```tsx
  },
};

/**
 * The dot is at the right of its row, ahead of the words, and the hint is indented past it. A label that
 * wraps keeps the dot level with its first line.
 */
export const RadioGroupMirrored: Story = {
  render: () => (
    <Rtl>
```

Edit 3. Replace:

```tsx
        </Radio>
        <Radio value="monthly">شهريًا</Radio>
        <Radio value="never">أبدًا</Radio>
      </RadioGroup>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const items = rect(find(canvasElement, '.radio-items'));
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('label.radio')];
    await expect(rows).toHaveLength(3);
    for (const row of rows) {
      const box = rect(row);
      const dot = rect(find(row, '.radio-indicator'));
      // Row padding (1rem) and edge (1.5px) lie between the row's right edge and the dot.
```

with:

```tsx
        </Radio>
        <Radio value="monthly">شهريًا</Radio>
        <Radio value="never">أبدًا</Radio>
        <Radio value="digest">
          ملخص أسبوعي لكل مساحة عمل ومشروع ودعوة تنتمي إليها، يصلك كل ثلاثاء صباحًا مع روابط مباشرة إلى كل
          نقاش
        </Radio>
      </RadioGroup>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const items = rect(find(canvasElement, '.radio-items'));
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('label.radio')];
    await expect(rows).toHaveLength(4);
    const wrapped = rows[3];
    if (!wrapped) throw new Error('Four rows expected');
    await expect(lineCount(find(wrapped, '.radio-text'))).toBeGreaterThan(1);
    for (const row of rows) {
      await expect(
        Math.abs(firstLineOffset(find(row, '.radio-indicator'), find(row, '.radio-text'))),
      ).toBeLessThanOrEqual(1);
      const box = rect(row);
      const dot = rect(find(row, '.radio-indicator'));
      // Row padding (1rem) and edge (1.5px) lie between the row's right edge and the dot.
```

Edit 4. Replace:

```tsx
 * The thumb starts at the right of its track and moves to the left when the
 * switch is on, with the same 3px gap at each end. The words are to the left of
 * the track, the Changed chip is to the left of the row, and the hint is
 * indented past the track on the right.
 */
export const SwitchMirrored: Story = {
  render: () => (
```

with:

```tsx
 * The thumb starts at the right of its track and moves to the left when the
 * switch is on, with the same 3px gap at each end. The words are to the left of
 * the track, the Changed chip is to the left of the row, and the hint is
 * indented past the track on the right. A label that wraps keeps the track
 * level with its first line.
 */
export const SwitchMirrored: Story = {
  render: () => (
```

Edit 5. Replace:

```tsx
        <Switch isChanged description="رسالة كل ثلاثاء.">
          الملخص الأسبوعي
        </Switch>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('.switch')];
    const [off, on, changed] = rows;
    if (!off || !on || !changed) throw new Error('Three switches expected');
    const gaps = (row: HTMLElement): { start: number; end: number } => {
      const track = rect(find(row, '.switch-track'));
      const thumb = rect(find(row, '.switch-thumb'));
```

with:

```tsx
        <Switch isChanged description="رسالة كل ثلاثاء.">
          الملخص الأسبوعي
        </Switch>
        <Switch>
          أرسل لي ملخصًا قصيرًا بكل تعليق كتبه فريقي على مشاركاتي، مرة كل أسبوع، صباح يوم الثلاثاء
        </Switch>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const rows = [...canvasElement.querySelectorAll<HTMLElement>('.switch')];
    const [off, on, changed, wrapped] = rows;
    if (!off || !on || !changed || !wrapped) throw new Error('Four switches expected');
    const gaps = (row: HTMLElement): { start: number; end: number } => {
      const track = rect(find(row, '.switch-track'));
      const thumb = rect(find(row, '.switch-thumb'));
```

Edit 6. Replace:

```tsx
      await expectSameEdge(track.right, rect(row).right);
      await expect(lastText(row).right).toBeLessThanOrEqual(track.left + 0.5);
    }
    const chip = rect(find(canvasElement, '.field-changed'));
    await expect(chip.right).toBeLessThanOrEqual(rect(changed).left + 0.5);
    await expectInside(chip, rect(find(canvasElement, '.field[data-changed]')));
    const hint = find(canvasElement, '.field-description');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    await expect(parseFloat(getComputedStyle(hint).paddingRight)).toBeGreaterThan(40);
```

with:

```tsx
      await expectSameEdge(track.right, rect(row).right);
      await expect(lastText(row).right).toBeLessThanOrEqual(track.left + 0.5);
    }
    const wrappedText = find(wrapped, '.switch-text');
    await expect(lineCount(wrappedText)).toBeGreaterThan(1);
    for (const row of rows) {
      await expect(
        Math.abs(firstLineOffset(find(row, '.switch-track'), find(row, '.switch-text'))),
      ).toBeLessThanOrEqual(1);
    }
    // The other fields keep a chip too, which is hidden, so the chip is read from the field that is changed.
    const changedField = find(canvasElement, '.field[data-changed]');
    const chipElement = find(changedField, '.field-changed');
    // The chip is level with the line of the label it follows.
    await expect(Math.abs(firstLineOffset(chipElement, find(changed, '.switch-text')))).toBeLessThanOrEqual(
      1,
    );
    const chip = rect(chipElement);
    await expect(chip.right).toBeLessThanOrEqual(rect(changed).left + 0.5);
    await expectInside(chip, rect(changedField));
    const hint = find(canvasElement, '.field-description');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    await expect(parseFloat(getComputedStyle(hint).paddingRight)).toBeGreaterThan(40);
```

The docs pages are edited in Step 3, with the CSS.

- [ ] **Step 2: Run them and watch them fail**

The stories read core's built CSS, so build it first. It is still the old CSS at this point.

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark
```

Expected: the core run FAILS with `Tests  4 failed | 176 passed (180)`:

```text
 FAIL  test/css.test.js > src/components/radio.css > sets the dot on the first line of a label that wraps, and keeps a row with no text centred
AssertionError: expected '' to contain 'align-self: flex-start;'
 FAIL  test/css.test.js > src/components/switch.css > draws a disabled label in taupe, and in GrayText in forced colors, as a disabled checkbox does
AssertionError: expected '\n    --switch-track-fill: var(--colo…' to contain 'color: var(--color-taupe);'
 FAIL  test/css.test.js > src/components/switch.css > sets the track on the first line of a label that wraps, and keeps a row of one line 30px tall
AssertionError: expected '' to contain '--switch-height: calc(var(--switch-th…'
 FAIL  test/css.test.js > src/components/switch.css > sets the Changed chip level with the first line, as the track is, from a head that starts its items at the top
AssertionError: expected '\n@layer components {\n  .switch {\n …' to match /\.field-head:has\(> \.switch\)\s*\{\s…/
```

The two tests that pass are the Checkbox one and the Radio disabled-label one: they pin what is already true.

The Storybook run FAILS with `Test Files  6 failed | 32 passed (38)` and `Tests  12 failed | 348 passed (360)`: the six stories below, each in the `storybook` and the `storybook-dark` project. The alignment checks report the 11.19px gap between the control and the first line, and the Switch ones report the ink label.

- `RadioGroup` > Long Label: `expected 11.190624999999997 to be less than or equal to 1`
- `RightToLeft` > Radio Group Mirrored: `expected 11.190625000000011 to be less than or equal to 1`
- `RightToLeft` > Switch Mirrored: `expected 11.190625000000011 to be less than or equal to 1`
- `Switch` > Disabled Off: `expected 'rgb(20, 20, 19)' to be 'rgb(209, 205, 199)' // Object.is equality`
- `Switch` > Disabled On: `expected 'rgb(20, 20, 19)' to be 'rgb(209, 205, 199)' // Object.is equality`
- `Switch` > Long Label: `expected 11.190625 to be less than or equal to 1`

The `Long Label` failure is its first assertion, the track. Its chip assertion, further down, reads `expected 11.190625000000011 to be less than or equal to 1` as well, which was checked against the CSS of this task without its chip rule: with that rule missing, the chip, centred on the row, is 11.19px below the first line of a two-line label, and nothing else fails.

In the dark project the two disabled Switch stories read `expected 'rgb(255, 255, 255)' to be 'rgba(255, 255, 255, 0.4)'`. The `Off` and `Labelless` stories pass: they pin what must not move.

- [ ] **Step 3: Write the CSS, the record and the changeset**

`radio.css`. In `packages/core/src/components/radio.css` make one edit.

Replace:

```css
    border: 1.5px solid var(--radio-ring);
    border-radius: var(--radius-dot);
    background-color: var(--radio-dot);
  }

  /* The check, drawn as a mask over a token color: a fixed stroke in an image
```

with:

```css
    border: 1.5px solid var(--radio-ring);
    border-radius: var(--radius-dot);
    background-color: var(--radio-dot);
  }

  /* The row centres its items, which puts the dot beside the middle of a label that
     wraps. With text in the row the dot starts at the top instead, and its margin is
     half of what the first line has over it (the dot is 20px), so it sits level with
     the first line, the words a reader starts with. For a label of one line that is
     where centring put it, so nothing moves. A row with no text has no first line and
     keeps the dot centred. */
  .radio:has(.radio-text) > .radio-indicator {
    align-self: flex-start;
    margin-block-start: calc((1lh - 20px) / 2);
  }

  /* The check, drawn as a mask over a token color: a fixed stroke in an image
```

`switch.css`. In `packages/core/src/components/switch.css` make six edits, in this order.

Edit 1. Replace:

```css
 * the field's root, as the field contract in field.css says.
 */
@layer components {
  .switch {
    --switch-width: 52px;
    --switch-thumb-size: 24px;
    /* The gap between the thumb and the track on all four sides. */
    --switch-inset: 3px;
    --switch-track-fill: var(--color-boundary);
    --switch-thumb-fill: var(--color-raised);
    --switch-edge: transparent;
```

with:

```css
 * the field's root, as the field contract in field.css says.
 */
@layer components {
  /* The size of the track, read by the row and by the Changed chip beside it. The
     chip is the row's sibling, so it cannot inherit these from the row. */
  .switch,
  .field-head:has(> .switch) {
    --switch-thumb-size: 24px;
    /* The gap between the thumb and the track on all four sides. */
    --switch-inset: 3px;
    --switch-height: calc(var(--switch-thumb-size) + 2 * var(--switch-inset));
  }

  .switch {
    --switch-width: 52px;
    --switch-track-fill: var(--color-boundary);
    --switch-thumb-fill: var(--color-raised);
    --switch-edge: transparent;
```

Edit 2. Replace:

```css
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    /* A long word in the label breaks inside the row instead of widening it. */
    min-width: 0;
    max-width: 100%;
    margin: 0;
    overflow-wrap: anywhere;
    color: var(--color-ink);
    font-family: var(--font-sans);
```

with:

```css
    position: relative;
    display: inline-flex;
    /* The track sits level with the first line of a label that wraps, not with the
       middle of the block. It is taller than a line, so the row pads the text down by
       half the difference, and the track takes that half back as its margin: one line
       still fills the 30px of the track, and a longer label runs on below it. */
    align-items: flex-start;
    gap: 0.75rem;
    /* A long word in the label breaks inside the row instead of widening it. */
    min-width: 0;
    max-width: 100%;
    margin: 0;
    padding-block: max(0px, calc((var(--switch-height) - 1lh) / 2));
    overflow-wrap: anywhere;
    color: var(--color-ink);
    font-family: var(--font-sans);
```

Edit 3. Replace:

```css
    flex: none;
    align-items: center;
    width: var(--switch-width);
    height: calc(var(--switch-thumb-size) + 2 * var(--switch-inset));
    /* The 1px edge is clear but for a disabled switch that is off, and it sits
       inside the inset, so the thumb is one gap from the track either way. */
    padding: calc(var(--switch-inset) - 1px);
```

with:

```css
    flex: none;
    align-items: center;
    width: var(--switch-width);
    height: var(--switch-height);
    margin-block: calc((1lh - var(--switch-height)) / 2);
    /* The 1px edge is clear but for a disabled switch that is off, and it sits
       inside the inset, so the thumb is one gap from the track either way. */
    padding: calc(var(--switch-inset) - 1px);
```

Edit 4. Replace:

```css
  }

  /* Disabled, off: the recessed fill with a faint edge and a taupe thumb, the
     disabled idiom of a button or an input. */
  .switch:is([data-disabled], :has(input:disabled)) {
    --switch-track-fill: var(--color-disabled);
    --switch-thumb-fill: var(--color-taupe);
    --switch-edge: color-mix(in srgb, var(--color-ink) 15%, transparent);

    cursor: not-allowed;
  }
```

with:

```css
  }

  /* Disabled, off: the recessed fill with a faint edge and a taupe thumb, the
     disabled idiom of a button or an input, and a taupe label, as a disabled
     checkbox and radio draw theirs. */
  .switch:is([data-disabled], :has(input:disabled)) {
    --switch-track-fill: var(--color-disabled);
    --switch-thumb-fill: var(--color-taupe);
    --switch-edge: color-mix(in srgb, var(--color-ink) 15%, transparent);

    color: var(--color-taupe);
    cursor: not-allowed;
  }
```

Edit 5. Replace:

```css
    outline-offset: calc(var(--focus-ring-offset) + var(--switch-changed-ring));
  }

  /* The row beside the chip is centered on the track, where a label row sits on
     its baseline. */
  .field-head:has(> .switch) {
    align-items: center;
  }

  /* The hint lines up with the label text, past the track (52px) and the gap. The
```

with:

```css
    outline-offset: calc(var(--focus-ring-offset) + var(--switch-changed-ring));
  }

  /* The chip sits level with the first line of the label, as the track does, and not
     with the middle of a row that wraps. The head starts its items at the top, and the
     chip takes a margin of half of what the track has over its own line. For a row of
     one line that is where centring on the 30px row put the chip, so nothing moves. */
  .field-head:has(> .switch) {
    align-items: flex-start;
  }

  .field-head:has(> .switch) > .field-changed {
    margin-block-start: calc((var(--switch-height) - 1lh) / 2);
  }

  /* The hint lines up with the label text, past the track (52px) and the gap. The
```

Edit 6. Replace:

```css
      --switch-track-fill: canvas;
      --switch-thumb-fill: GrayText;
      --switch-edge: GrayText;
    }

    .switch:is([data-disabled], :has(input:disabled)):is([data-selected], :has(input:checked)) {
```

with:

```css
      --switch-track-fill: canvas;
      --switch-thumb-fill: GrayText;
      --switch-edge: GrayText;

      color: GrayText;
    }

    .switch:is([data-disabled], :has(input:disabled)):is([data-selected], :has(input:checked)) {
```

The record. In `docs/design-system.md` make three edits, in this order.

Edit 1. Replace:

```markdown
  the boundary color. It is the plain choice's box with the document's 50%
  boundary where the app used 45%. It stays round in every corner shape, because
  a square radio would read as a checkbox.
- **The chosen row is the ink pill, and its ring holds the check.** Ink fill,
  canvas label, and the dot's ring and check drawn in canvas. The account menu
  put its check at the end of the row; the library puts it in the dot, so one
```

with:

```markdown
  the boundary color. It is the plain choice's box with the document's 50%
  boundary where the app used 45%. It stays round in every corner shape, because
  a square radio would read as a checkbox.
- **The dot sits level with the first line of a label that wraps.** The row
  centred its items, so a label of three lines put the dot beside the middle of
  the second, away from the words a reader starts with. A row with text now
  starts its items at the top, and the dot takes a margin of half of what the
  22.4px line has over its 20px, 1.2px, as a checkbox's box does. For a label of
  one line that is where centring put it, so every one-line row keeps its
  place. A row with no text has no first line, and keeps the dot centred in its
  40px. The test for text is the `radio-text` box the component draws around
  the words, so a hand-written row with bare text beside the library's dot is
  drawn as before, centred. Left to right and right to left read alike, since
  the margin is on the block axis.
- **The chosen row is the ink pill, and its ring holds the check.** Ink fill,
  canvas label, and the dot's ring and check drawn in canvas. The account menu
  put its check at the end of the row; the library puts it in the dot, so one
```

Edit 2. Replace:

```markdown
one cue carries it. A disabled control is outside the 3:1 asked of an active
one: the taupe thumb on the recessed track measures 1.44 in light and 3.81 in
dark, and the filled track against its surface 1.40 to 1.58 in light and 3.68
to 3.81 in dark. The label stays ink, as a disabled field's label does, so the
setting can still be read.

**Changed is a ring around the track and the chip beside the label.** The app's
switch draws a changed cue of its own, a 2px ring in light signal orange
```

with:

```markdown
one cue carries it. A disabled control is outside the 3:1 asked of an active
one: the taupe thumb on the recessed track measures 1.44 in light and 3.81 in
dark, and the filled track against its surface 1.40 to 1.58 in light and 3.68
to 3.81 in dark. The label is taupe too, as the paragraph on the disabled label
below records.

**Changed is a ring around the track and the chip beside the label.** The app's
switch draws a changed cue of its own, a 2px ring in light signal orange
```

Edit 3. Replace:

```markdown
**Drawn 30px, hit 40px.** The row extends its hit area with a pseudo-element, 5px
above and below, so the touch rule holds with no layout shift. The app's switch
was 30px with nothing extended.

**Hover draws nothing, as in the app.** The thumb moving is the feedback, and the
pointer cursor marks the row as pressable. A read-only switch looks like an
```

with:

```markdown
**Drawn 30px, hit 40px.** The row extends its hit area with a pseudo-element, 5px
above and below, so the touch rule holds with no layout shift. The app's switch
was 30px with nothing extended.

**A disabled label is taupe, and the track and the chip sit level with the first line.**
The label stayed ink on a disabled switch, while the checkbox and the radio draw
theirs taupe, the document's color for disabled text, so the switch now follows
them (`GrayText` in forced colors, as theirs is). Taupe on the five surfaces
measures 1.40 to 1.58 in light and 3.68 to 3.81 in dark. That is under the 4.5:1
asked of text, and WCAG 1.4.3 exempts the text of a disabled control, so the
pairs are recorded and not gated, as the checkbox's and the radio's are. The
row also centred its items, which put the track beside the middle of a label that
wraps. It now starts them at the top, so the track is level with the first line.
The track (30px) is taller than the 22.4px line, so the row pads the text down
by half the difference, 3.8px, at the top and the bottom, and the track takes
that half back as a negative margin on both sides. A row of one line is still
30px tall with its text where it was, and its hit area still reaches 5px past it,
to 40px. A longer label runs on below the track with the 3.8px under its last
line that one line has, and the margins are even so a layout that sets the row
to `display: contents`, as the docs' settings rows do, still centres the track.
The Changed chip follows the track: its head starts its items at the top too,
and the chip takes a margin of half of what the track has over its own 14px
line, 8px, so it is level with the first line and, for a row of one line,
exactly where centring put it. A chip that does not fit beside the row drops
under it, as before, with the same 8px above it.

**Hover draws nothing, as in the app.** The thumb moving is the feedback, and the
pointer cursor marks the row as pressable. A read-only switch looks like an
```

The docs pages. In `apps/docs/content/docs/components/switch.mdx` make one edit.

Replace:

```markdown
## States

On is an ink track with a canvas thumb. Off is the control boundary color with a raised thumb. A disabled switch is recessed, and one that is on is filled where one that is off is hollow, so the two never look alike. A read-only switch looks like an enabled one and cannot be changed.

<Preview name="switch-states" />
```

with:

```markdown
## States

On is an ink track with a canvas thumb. Off is the control boundary color with a raised thumb. A disabled switch is recessed, and one that is on is filled where one that is off is hollow, so the two never look alike. A disabled switch draws its label in taupe, as a disabled checkbox and radio do. A read-only switch looks like an enabled one and cannot be changed.

<Preview name="switch-states" />
```

In `apps/docs/content/docs/components/radio-group.mdx` make one edit.

Replace:

```markdown
## States

A changed group shows a clay chip beside its label and nothing else: unlike a text field, a choice has no control edge to recolor, so the chip is the whole cue. An invalid group draws the error edge on every row and an error line, and invalid outranks changed, so the chip steps aside. A disabled group is recessed and keeps the check of its choice, and one option can be disabled on its own. The chip lives in the label row, so a changed group with no visible `label` shows nothing.

<Preview name="radio-group-states" />
```

with:

```markdown
## States

A changed group shows a clay chip beside its label and nothing else: unlike a text field, a choice has no control edge to recolor, so the chip is the whole cue. An invalid group draws the error edge on every row and an error line, and invalid outranks changed, so the chip steps aside. A disabled group is recessed and keeps the check of its choice, and one option can be disabled on its own. A disabled option draws its label in taupe, as a disabled checkbox and switch do. The chip lives in the label row, so a changed group with no visible `label` shows nothing.

<Preview name="radio-group-states" />
```

The changeset. `.changeset/disabled-labels.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Draw a disabled Switch's label in taupe, as a disabled Checkbox's and Radio's is, and align the radio dot, the switch track and the switch's Changed chip with the first line of a label that wraps, as the checkbox box is, so a long label no longer leaves them beside its middle.
```

Run `pnpm exec changeset status --verbose`. Expected: both packages are listed under `minor` with this changeset, and nothing under `major`.

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark
```

Expected: `Tests  180 passed (180)` for `css.test.js`, and `Test Files  38 passed (38)` with `Tests  360 passed (360)` for Storybook.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/react size
pnpm verify
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:
- `pnpm format` changes no file. `pnpm format:check` prints `All matched files use Prettier code style!`.
- Core: the 6 tests this task adds, so `Tests  300 passed (300)` in 5 files (294 before). React: `Tests  607 passed | 4 expected fail (611)` in 38 files, the same as before, because this task adds no React unit test. Storybook: `Tests  360 passed (360)` in 38 files, the same, because it adds no story.
- Turborepo reports 10 successful tasks for the first run, 4 for the second and 5 for the third. The size entries are unchanged: nothing that ships changed in JavaScript.
- `pnpm verify` exits 0. The first line is `check:public: no private names in 307 files` (or the no-file message on a machine without `.local`). Root tests: `tests 20`, `pass 20`. Turborepo reports 18 successful tasks.
- The port check prints nothing, and the e2e run ends `158 passed`, the same as before, since this task adds no end-to-end test. If another checkout is using port 3100, run it as `DOCS_E2E_PORT=3501 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: 30 changed files, no new ones. The six stories below, each as `<id>--light-rounded.png`, `--dark-rounded.png`, `--light-soft.png`, `--light-square.png` and `--light-rounded-375.png`:

  - `components-radiogroup--long-label--dark-rounded.png`
  - `components-radiogroup--long-label--light-rounded-375.png`
  - `components-radiogroup--long-label--light-rounded.png`
  - `components-radiogroup--long-label--light-soft.png`
  - `components-radiogroup--long-label--light-square.png`
  - `components-radiogroup--long-word--dark-rounded.png`
  - `components-radiogroup--long-word--light-rounded-375.png`
  - `components-radiogroup--long-word--light-rounded.png`
  - `components-radiogroup--long-word--light-soft.png`
  - `components-radiogroup--long-word--light-square.png`
  - `components-switch--disabled-off--dark-rounded.png`
  - `components-switch--disabled-off--light-rounded-375.png`
  - `components-switch--disabled-off--light-rounded.png`
  - `components-switch--disabled-off--light-soft.png`
  - `components-switch--disabled-off--light-square.png`
  - `components-switch--disabled-on--dark-rounded.png`
  - `components-switch--disabled-on--light-rounded-375.png`
  - `components-switch--disabled-on--light-rounded.png`
  - `components-switch--disabled-on--light-soft.png`
  - `components-switch--disabled-on--light-square.png`
  - `components-switch--in-dark-scope--dark-rounded.png`
  - `components-switch--in-dark-scope--light-rounded-375.png`
  - `components-switch--in-dark-scope--light-rounded.png`
  - `components-switch--in-dark-scope--light-soft.png`
  - `components-switch--in-dark-scope--light-square.png`
  - `components-switch--long-label--dark-rounded.png`
  - `components-switch--long-label--light-rounded-375.png`
  - `components-switch--long-label--light-rounded.png`
  - `components-switch--long-label--light-soft.png`
  - `components-switch--long-label--light-square.png`

Nothing else moves. This was checked before the step was written, in local Chromium and not the Docker image, by taking every visual story (148) in all five modes (740 images) before and after this change and comparing them byte for byte: exactly these 30 differ. In particular every single-line Radio, Switch and Checkbox story, every `labelless` story and the Card, Field and TextField stories are identical.

What to look at:
- `components-radiogroup--long-label` and `--long-word`: the dot of the wrapped option is level with the first line of its words, and the dot of a one-line option such as `Never` is where it was. In the chosen row the check ring is level with the first line too.
- `components-switch--long-label`: the story now draws two switches. In the first, the track is level with the first line of the long label, and at 375px the chip and the hint under it sit lower than before, from the 3.8px under the last line and the chip's 8px. In the second, with the line break, the chip is beside the two-line label and level with its first line, as the track is.
- `components-switch--disabled-off` and `--disabled-on`: the label is taupe, in light and dark, and the track and thumb are as before.
- `components-switch--in-dark-scope`: the two disabled labels are taupe on the dark card, and the enabled and changed labels are white.

- [ ] **Step 7: Commit**

```bash
git add .changeset/disabled-labels.md apps/docs/content/docs/components/radio-group.mdx apps/docs/content/docs/components/switch.mdx docs/design-system.md packages/core/src/components/radio.css packages/core/src/components/switch.css packages/core/test/css.test.js packages/react/src/radio-group/RadioGroup.stories.tsx packages/react/src/rtl/RightToLeft.stories.tsx packages/react/src/stories/paint.ts packages/react/src/switch/Switch.stories.tsx apps/storybook/tests/visual/__screenshots__
git commit -m "fix: dim a disabled control's label and align every control to its label's first line"
```


### Task 2: A standalone Checkbox shows that it changed

**Files:**
- Modify: `packages/react/src/checkbox/Checkbox.tsx`, `packages/core/src/components/checkbox.css`
- Test: `packages/react/src/checkbox/Checkbox.test.tsx`, `packages/react/test/empty-parts.test.tsx`, `packages/core/test/css.test.js`
- Test (stories): `packages/react/src/checkbox/Checkbox.stories.tsx`, `packages/react/src/rtl/RightToLeft.stories.tsx`
- Modify: `docs/design-system.md` (a bullet and a sentence in the Checkbox section of Appendix B; the last three lines of the file are not touched)
- Modify: `apps/docs/content/docs/components/checkbox.mdx` (the States paragraph and the props table), `apps/docs/examples/checkbox-states.tsx` (one row)
- Create: `.changeset/checkbox-changed.md`
- Create (Docker step): 10 baselines in `apps/storybook/tests/visual/__screenshots__/`. None changes.

**Interfaces:**
- Consumes:
  - From `packages/react/src/field/`: `useChangedDescription`, which takes `{ isChanged, isInvalid, describedBy }` and returns `{ chipId, describedBy }`, and `FieldChanged`, the static chip. Neither is changed.
  - From `react-aria-components`: `CheckboxGroupStateContext`, which is `null` outside a `CheckboxGroup`, and `FieldErrorContext`, which is `null` inside one and holds `{ isInvalid, ... }` on a checkbox of its own.
  - Tokens `--text-body`, `--text-body--line-height`, `--text-eyebrow*` and `--color-clay`. No token is added or changed.
  - From the stories: `firstLineOffset`, `lineCount` and `tokenColor` from `packages/react/src/stories/paint.ts` (`firstLineOffset` and `lineCount` came with Task 1), and `find`, `rect` and `expectInside` in the right-to-left stories.
  - From `css.test.js`: `blockAfter` and `closeUp`, and the checkbox describe's own `rules()`.
- Produces in `Checkbox.tsx`, two props on `CheckboxProps`:

```ts
isChanged?: boolean; // default false
changedLabel?: string; // default 'Changed'
```

- Produces this markup:
  - A checkbox on its own, with a visible label: `div.checkbox-field` (with `data-changed=""` while `isChanged`) holds `div.field-head`, which holds `label.checkbox` and `span.field-changed`. The hint and the error line follow, as before.
  - A checkbox with no `children`, and any checkbox inside a `CheckboxGroup`: the markup it had, with no `field-head` and no chip. The label-less one still carries `data-changed` on its root. The one in a group carries none.
  - `aria-describedby` on the input names the chip's id after the caller's own ids, while the checkbox is changed and has a visible label.
  - An internal `CheckboxChanged` in the same file, not exported: the chip, which renders nothing while `FieldErrorContext` says the checkbox is invalid.
- Produces in `checkbox.css`:
  - `--checkbox-line: calc(var(--text-body) * var(--text-body--line-height))` in the rule that holds `--checkbox-size` and `--checkbox-gap`, on `.checkbox-field, .checkbox`. It is the row's line of text, 22.4px.
  - `.checkbox-field:not([data-changed]) .field-changed, .checkbox-field[data-invalid] .field-changed { display: none; }`.
  - `.field-head:has(> .checkbox) { align-items: flex-start; }` and `.field-head:has(> .checkbox) > .field-changed { margin-block-start: calc(0.5rem + (var(--checkbox-line) - 1lh) / 2); }`, where `1lh` is the chip's own 14px line, so the margin is 12.2px.
  - The closing-padding rule is now `.checkbox-field > :not(.checkbox, .field-head):last-child`.
- Produces 2 core tests and revises 1, in the existing describe `src/components/checkbox.css`. Produces 17 React tests in `Checkbox.test.tsx` (11 `it` blocks and the 6 rows of one `it.each`), and revises 1 there.
- Produces 2 stories, `Checkbox` `Changed` and `LongLabelChanged`, and gives `Checks/Right to left` `CheckboxMirrored` two more checkboxes and the assertions on them.

**What this task decides** (the part about the record is also in the Appendix B text of Step 3):
- **The chip sits beside the row, in the `field-head` row, as Switch's does, and not inside the label.** The row is a `label`. A chip inside it would join the checkbox's accessible name, and a press on the chip would toggle the box. Beside it, the name stays the label's own text, the chip is read through `aria-describedby`, and a test presses the chip and sees the box stay as it was.
- **The label row exists whether or not the checkbox is changed, and only for a checkbox with a visible label that is not in a group.**
  - It cannot depend on `isChanged`. A checkbox that gains a wrapper when it becomes changed would be rebuilt by React: its input would be a new element and a person who just pressed Space would lose focus. A test flips `isChanged` and checks that the input is the same node and keeps focus.
  - A checkbox with no label has no chip, so it keeps its markup, and with it the 40px hit area of the box, which the `Labelless` baselines show unmoved.
  - A checkbox in a group keeps its markup too, so no group layout can move.
- **The chip is always in the page for a labelled checkbox, and hidden by CSS until the root is changed.** This is what every field does (a test says so, as TextField's and Switch's do), and it keeps the stylesheet's rule the single place that decides whether the chip shows.
- **Invalid outranks changed in the CSS, in the markup and in the description, whatever makes the checkbox invalid.**
  - `CheckboxChanged` reads `FieldErrorContext`, as `FieldHead` does, so the chip leaves the page for `isInvalid` and for validity React Aria computes itself (`isRequired` after a submit, a `validate` function). A chip that is only hidden would still be read, because an element named in `aria-describedby` is read even under `display: none`.
  - The checkbox's own props cannot see React Aria's validity, so the chip's id stays in `aria-describedby` and names nothing. A test pins that the id list is `[error, chip]` with only the first resolving, that the description is the error line alone, and that axe accepts it, as the TextField's test does.
  - The root keeps `data-changed` while it is invalid, as every other field's does. In the library nothing but the chip's rule reads it, and that rule hides the chip for `[data-invalid]` too.
- **A checkbox inside a group ignores `isChanged`.** The group is found through React Aria's own `CheckboxGroupStateContext`. The component had no group check before: React Aria clears the error context inside a group, which is how an item's `errorMessage` stays unshown, but that is a side effect and not a signal. The item has no chip, no `data-changed` and nothing in `aria-describedby`. The JSDoc, the docs and Appendix B say so, and tell the reader to set `isChanged` on the group.
- **`field.css` is not changed.** Its rule that hides the chip is keyed on `.field`, which the checkbox root does not carry, and giving the root the `field` class would add the field's 8px gap between the row and its hint. `checkbox.css` holds the same two-selector rule for `.checkbox-field`.
- **The chip is level with the first line, as the box is.**
  - The row pads its text 8px from the top and the text is 22.4px a line. The chip is 14px a line. So the chip takes `margin-block-start` of `0.5rem + (22.4 - 14) / 2 = 12.2px`, and its middle is on the middle of the first line. The box's middle is there too, so the chip, the box and the first line share one middle. In Chromium, in the `Changed` story, the chip's middle and the box's middle are the same to a hundredth of a pixel, and the row is 40px tall.
  - `--checkbox-line` is computed from the two tokens, since `--text-body--line-height` is a unitless 1.4 and the chip, which sits outside the row, cannot read the row's own `1lh`. It sits in the rule that already holds `--checkbox-size`, on the root and on the row, and the head lives inside the root, so it inherits it. A size override written on `.checkbox` alone does not reach the chip.
  - The head starts its items at the top (it baselines them for the other fields). Baseline alignment was tried and puts the chip's middle 6px below the line's, because the row takes its baseline from its first item in flow, the empty box, whose baseline is its bottom edge.
- **A chip that does not fit beside the row drops under it and keeps its margin.** It sits 12.2px under the row's bottom edge, which already has 8px of padding, so 20.2px under the last line of text. CSS cannot apply the margin only when the chip shares a line with the row, so this is the cost of the alignment, as the Switch's 8px was. `LongLabelChanged` draws both cases: the long label fills its row and its chip drops, and a label with a line break leaves the chip beside it, level with the first line.
- **A long `changedLabel` wraps inside the field.** The chip's own rule (`max-width: 100%` and `overflow-wrap: anywhere`) does it, and the story draws one: three lines at 320px (the field is 288px wide), two at 375px. The page does not scroll sideways at 320px, 375px or 1440px.
- **The closing padding skips the label row.** A hint or an error line closes its field with the row's 8px of padding. The label row is the row, and has its own, so the rule now excludes `.field-head`. Without that, a checkbox with no hint would be 8px taller than it was.
- **Right to left needs no direction selector.** The chip follows the row in the flow, so it is to the row's left, and its dot is at the chip's start, which is its right. `CheckboxMirrored` asserts it with a wrapped label and with one that has a line break, and `no-visual` keeps Arabic text out of the baselines.
- **No contrast pair is added.** The chip is the clay Changed chip, already gated on the surfaces it sits on.
- **Nothing that was already drawn moves.** Every visual story (148) in all five modes (740 images), taken before and after in local Chromium and compared byte for byte, is identical: the one-line checkboxes, the long label, the hint and error lines, the `Labelless` row and every group. The docs screenshots of ten pages in light and dark at 1440px and 375px are identical too, but for the Checkbox page (the added sentence and row). The two new stories add 10 images.
- **Three existing tests change.** The test that lists the root's children expects `field-head` and then the hint, because the first child of a labelled checkbox's root is now the label row. The core test that said the stylesheet has no `data-changed` rule now says that the one rule keyed on it is the chip's, and that nothing is drawn on a box. The empty-parts test gives its checkbox `isChanged`, so a label-less checkbox that still drew a chip would fail it.
- **Docs.** The States paragraph gains the changed look, the screen reader, the invalid case, the label-less case and the group case, and the props table gains the two props. The States example gains a changed row, as the Switch's does. The end-to-end suite passes with no new test. A throwaway axe run (axe-core 4.14) of the homepage and the Checkbox and Switch pages at 320, 375 and 1440px in light and dark found no sideways scroll and no violation but `label-content-name-mismatch` on the docs rail's search button at 1440px, on both component pages, which this task does not touch.
- **Size.** The `Checkbox` entry grows from 323 B to 602 B against its 1 kB limit, from the chip, the description hook and the two contexts.

- [ ] **Step 1: Write the failing tests**

The core tests first. In `packages/core/test/css.test.js` make one edit.

Replace:

```js
    expect(text).toContain('overflow-wrap: anywhere;');
  });

  it('leaves the boxes alone when the group is changed: the chip is the cue', () => {
    expect(rules()).not.toContain('data-changed');
    expect(rules()).not.toContain('--color-signal');
  });

  it('keeps the mark and the fill visible in forced colors, with system colors', () => {
```

with:

```js
    expect(text).toContain('overflow-wrap: anywhere;');
  });

  it('leaves the boxes alone when a checkbox or a group is changed: the chip is the cue', () => {
    // The one rule keyed on data-changed shows or hides the chip, and nothing is drawn on a box.
    const keyed = [...rules().matchAll(/[^{};]*data-changed[^{};]*(?=\{)/g)].map((match) =>
      closeUp(match[0]).trim(),
    );
    expect(keyed).toEqual([
      '.checkbox-field:not([data-changed]) .field-changed, .checkbox-field[data-invalid] .field-changed',
    ]);
    expect(rules()).not.toContain('--color-signal');
  });

  it('sets the Changed chip level with the first line of a label that wraps, from a label row that starts its items at the top', () => {
    // The chip is the row's sibling, so it reads the body line from the field, which declares it for the row too.
    expect(blockAfter(rules(), '.checkbox-field,\n  .checkbox {')).toContain(
      '--checkbox-line: calc(var(--text-body) * var(--text-body--line-height));',
    );
    expect(rules()).toMatch(/\.field-head:has\(> \.checkbox\)\s*\{\s*align-items: flex-start;\s*\}/);
    // The row's 8px of padding, and half of what its line has over the chip's own 14px line.
    const chip = blockAfter(rules(), '.field-head:has(> .checkbox) > .field-changed {');
    expect(chip).toContain('margin-block-start: calc(0.5rem + (var(--checkbox-line) - 1lh) / 2);');
  });

  it('shows the Changed chip only while the checkbox is changed and not invalid, and keeps the label row out of the closing padding', () => {
    const source = closeUp(rules());
    const hidden = blockAfter(
      source,
      '.checkbox-field:not([data-changed]) .field-changed, .checkbox-field[data-invalid] .field-changed {',
    );
    expect(hidden).toContain('display: none;');
    // Only a hint or an error line closes the field with the row's padding: the label row is the row.
    const closing = blockAfter(source, '.checkbox-field > :not(.checkbox, .field-head):last-child {');
    expect(closing).toContain('padding-block-end: 0.5rem;');
  });

  it('keeps the mark and the fill visible in forced colors, with system colors', () => {
```

The React tests. In `packages/react/src/checkbox/Checkbox.test.tsx` make four edits, in this order.

Edit 1. Replace:

```tsx
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { Checkbox, type CheckboxProps } from './Checkbox';

/** A checkbox the caller controls, the way a form library would. */
function Controlled(props: CheckboxProps): ReactElement {
```

with:

```tsx
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { Checkbox, type CheckboxProps } from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

/** A checkbox the caller controls, the way a form library would. */
function Controlled(props: CheckboxProps): ReactElement {
```

Edit 2. Replace:

```tsx
    // The hint is not part of the label, so the name stays the label's own text.
    expect(hint.closest('label')).toBeNull();
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'checkbox',
      'field-description',
    ]);
    await expectNoA11yViolations(container);
```

with:

```tsx
    // The hint is not part of the label, so the name stays the label's own text.
    expect(hint.closest('label')).toBeNull();
    expect([...root(container).children].map((child) => child.classList[0])).toEqual([
      'field-head',
      'field-description',
    ]);
    await expectNoA11yViolations(container);
```

Edit 3. Replace:

```tsx
    expect(text?.querySelector('a')).toHaveAttribute('href', '/terms');
  });

  it('forwards ref to the field and inputRef to the input', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
```

with:

```tsx
    expect(text?.querySelector('a')).toHaveAttribute('href', '/terms');
  });

  it('shows the changed chip beside the label, and a screen reader reads it with the checkbox', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Checkbox isChanged description="Off hides the copy under each card.">
        Show descriptions
      </Checkbox>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    const chip = screen.getByText('Changed');
    expect(chip).toHaveClass('field-changed');
    const input = screen.getByRole('checkbox', { name: 'Show descriptions' });
    // The chip is beside the row in the label row, not inside the label: it is no part of the name
    // and a press on it does not toggle the box.
    expect(chip.parentElement).toHaveClass('field-head');
    expect(chip.parentElement).toContainElement(input.closest('label'));
    expect(chip.closest('label')).toBeNull();
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(chip.id);
    expect(input).toHaveAccessibleDescription('Off hides the copy under each card. Changed');
    await user.click(chip);
    expect(input).not.toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('takes the chip text from changedLabel', () => {
    render(
      <Checkbox isChanged changedLabel="Unsaved">
        Show descriptions
      </Checkbox>,
    );
    expect(screen.getByText('Unsaved')).toHaveClass('field-changed');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Unsaved');
  });

  it('shows no chip and reads none while the checkbox is not changed', () => {
    const { container } = render(
      <Checkbox description="Off hides the copy under each card.">Show descriptions</Checkbox>,
    );
    expect(root(container)).not.toHaveAttribute('data-changed');
    const input = screen.getByRole('checkbox');
    // The chip stays in the page for the stylesheet to show, and nothing names it.
    expect(input.getAttribute('aria-describedby')?.split(' ')).not.toContain(screen.getByText('Changed').id);
    expect(input).toHaveAccessibleDescription('Off hides the copy under each card.');
  });

  it('adds the chip to the aria-describedby the caller passes', () => {
    render(
      <>
        <p id="note">Visible to admins.</p>
        <Checkbox description="Off hides the copy under each card." aria-describedby="note" isChanged>
          Show descriptions
        </Checkbox>
      </>,
    );
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription(
      'Off hides the copy under each card. Visible to admins. Changed',
    );
  });

  it('shows the chip whichever way the box is set', async () => {
    const user = userEvent.setup();
    render(<Checkbox isChanged>Show descriptions</Checkbox>);
    await user.click(screen.getByRole('checkbox'));
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toHaveAccessibleDescription('Changed');
  });

  it('keeps its input, and its focus, when isChanged flips', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<Checkbox>Show descriptions</Checkbox>);
    await user.tab();
    const input = screen.getByRole('checkbox');
    expect(input).toHaveFocus();
    rerender(<Checkbox isChanged>Show descriptions</Checkbox>);
    // The label row is there whether or not the checkbox is changed, so the input is not rebuilt.
    expect(screen.getByRole('checkbox')).toBe(input);
    expect(input).toHaveFocus();
    expect(input).toHaveAccessibleDescription('Changed');
  });

  it('lets invalid outrank changed: the chip is gone and no longer announced', async () => {
    const { container, rerender } = render(<Checkbox isChanged>I accept the terms</Checkbox>);
    const input = screen.getByRole('checkbox', { name: 'I accept the terms' });
    const chipId = screen.getByText('Changed').id;
    expect(input.getAttribute('aria-describedby')?.split(' ')).toContain(chipId);
    rerender(
      <Checkbox isChanged isInvalid errorMessage="Accept the terms to continue.">
        I accept the terms
      </Checkbox>,
    );
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(root(container)).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(input.getAttribute('aria-describedby')?.split(' ')).not.toContain(chipId);
    expect(input).toHaveAccessibleDescription('Accept the terms to continue.');
    await expectNoA11yViolations(container);
  });

  it('lets invalid outrank changed when React Aria finds the checkbox invalid', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Checkbox name="terms" isRequired isChanged errorMessage="Accept the terms to continue.">
          I accept the terms
        </Checkbox>
        <button type="submit">Continue</button>
      </form>,
    );
    const input = screen.getByRole('checkbox', { name: 'I accept the terms' });
    expect(screen.getByText('Changed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(container.querySelector('.checkbox-field')).toHaveAttribute('data-invalid');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    // The checkbox's own props cannot see this validity, so the chip's id stays in aria-describedby and names
    // nothing, which leaves the error line alone as the description. axe accepts it.
    const ids = input.getAttribute('aria-describedby')?.split(' ') ?? [];
    expect(ids.map((id) => document.getElementById(id) !== null)).toEqual([true, false]);
    expect(input).toHaveAccessibleDescription('Accept the terms to continue.');
    await expectNoA11yViolations(container);
    // Checking the box makes it valid again, and the chip returns.
    await user.click(input);
    expect(screen.getByText('Changed')).toBeInTheDocument();
    expect(input).toHaveAccessibleDescription('Changed');
  });

  it('reads the chip while validate passes, and the error alone while it fails', async () => {
    const user = userEvent.setup();
    render(
      <Checkbox
        isChanged
        validationBehavior="aria"
        validate={(selected) => (selected ? null : 'You must agree.')}
      >
        I agree
      </Checkbox>,
    );
    const input = screen.getByRole('checkbox', { name: 'I agree' });
    expect(input).toHaveAccessibleDescription('You must agree.');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    await user.click(input);
    expect(input).toHaveAccessibleDescription('Changed');
    expect(screen.getByText('Changed')).toBeInTheDocument();
  });

  it('draws no chip for a checkbox without a visible label, though the root is still changed', async () => {
    const { container } = render(<Checkbox aria-label="Select row 3" isChanged />);
    expect(root(container)).toHaveAttribute('data-changed', '');
    expect(screen.queryByText('Changed')).not.toBeInTheDocument();
    expect(container.querySelector('.field-head')).toBeNull();
    expect(screen.getByRole('checkbox')).not.toHaveAttribute('aria-describedby');
    await expectNoA11yViolations(container);
  });

  it('ignores isChanged inside a group: its item has no chip, and the group is the one that is changed', () => {
    const { container, rerender } = render(
      <CheckboxGroup label="Notify me by">
        <Checkbox value="email" isChanged changedLabel="Item">
          Email
        </Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
      </CheckboxGroup>,
    );
    // The group has a hidden chip of its own, and the items have none.
    expect(container.querySelectorAll('.checkbox-field .field-changed')).toHaveLength(0);
    expect(screen.queryByText('Item')).not.toBeInTheDocument();
    for (const item of container.querySelectorAll('.checkbox-field')) {
      expect(item).not.toHaveAttribute('data-changed');
      expect(item.firstElementChild).toHaveClass('checkbox');
    }
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('group')).not.toHaveAttribute('data-changed');
    expect(screen.getByRole('group')).not.toHaveAccessibleDescription('Changed');
    // A changed group draws one chip, its own, and its item adds none.
    rerender(
      <CheckboxGroup label="Notify me by" isChanged>
        <Checkbox value="email" isChanged>
          Email
        </Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
      </CheckboxGroup>,
    );
    expect(container.querySelectorAll('.field-changed')).toHaveLength(1);
    expect(container.querySelectorAll('.checkbox-field .field-changed')).toHaveLength(0);
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Changed');
    expect(screen.getByRole('checkbox', { name: 'Email' })).not.toHaveAttribute('aria-describedby');
  });

  it('forwards ref to the field and inputRef to the input', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
```

Edit 4. Replace:

```tsx
    const { container } = render(<Checkbox defaultSelected>Remember me</Checkbox>);
    await expectNoA11yViolations(container);
  });
});
```

with:

```tsx
    const { container } = render(<Checkbox defaultSelected>Remember me</Checkbox>);
    await expectNoA11yViolations(container);
  });

  it.each([
    ['changed', { isChanged: true }],
    ['changed and checked', { isChanged: true, defaultSelected: true }],
    ['changed with a hint', { isChanged: true, description: 'Off hides the copy under each card.' }],
    ['changed and disabled', { isChanged: true, isDisabled: true }],
    ['changed with its own chip text', { isChanged: true, changedLabel: 'Not saved yet' }],
    [
      'changed and invalid',
      { isChanged: true, isInvalid: true, errorMessage: 'Accept the terms to continue.' },
    ],
  ] satisfies [string, Partial<CheckboxProps>][])('has no axe violations when %s', async (_state, props) => {
    const { container } = render(<Checkbox {...props}>Remember me</Checkbox>);
    await expectNoA11yViolations(container);
  });
});
```

The empty-parts test. In `packages/react/test/empty-parts.test.tsx` make one edit.

Replace:

```tsx
const EMPTY: [name: string, element: ReactElement][] = [
  [
    'Checkbox',
    <Checkbox aria-label="Remember me" description={false}>
      {''}
    </Checkbox>,
  ],
```

with:

```tsx
const EMPTY: [name: string, element: ReactElement][] = [
  [
    'Checkbox',
    <Checkbox aria-label="Remember me" description={false} isChanged>
      {''}
    </Checkbox>,
  ],
```

The Checkbox stories. In `packages/react/src/checkbox/Checkbox.stories.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { paint, tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';

const meta = {
  title: 'Components/Checkbox',
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { firstLineOffset, lineCount, paint, tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';

/** The row, the label's text box and the Changed chip of the checkbox whose field root is `field`. */
function parts(field: Element): { row: Element; box: Element; text: Element; chip: Element } {
  const row = field.querySelector('.checkbox');
  const box = field.querySelector('.checkbox-box');
  const text = field.querySelector('.checkbox-text');
  const chip = field.querySelector('.field-changed');
  if (!row || !box || !text || !chip) throw new Error('No row, box, label or chip drawn');
  return { row, box, text, chip };
}

const meta = {
  title: 'Components/Checkbox',
```

Edit 2. Replace:

```tsx
  },
};

/** The disabled fill, a taupe label and a faint edge, with the not-allowed cursor. */
export const Disabled: Story = {
  args: { isDisabled: true, description: 'Managed by your workspace admin.' },
```

with:

```tsx
  },
};

/**
 * `isChanged` shows the clay chip beside the label, level with its first line, and has a screen reader read
 * it with the checkbox. The box keeps its edge, and the row is as tall as it was: the chip is the whole cue.
 */
export const Changed: Story = {
  args: { isChanged: true, description: 'Off hides the copy under each service card.' },
  play: async ({ canvas, canvasElement }) => {
    const input = canvas.getByRole('checkbox', { name: 'Remember me on this device' });
    await expect(canvas.getByText('Changed')).toBeVisible();
    await expect(input).toHaveAccessibleDescription('Off hides the copy under each service card. Changed');
    const { row, box, text, chip } = parts(canvasElement);
    await expect(getComputedStyle(chip).color).toBe(tokenColor('--color-clay'));
    await expect(getComputedStyle(box).borderTopColor).toBe(tokenColor('--color-boundary'));
    // One line of text leaves the row at its 40px, with the chip beside it, level with the line.
    await expect(row.getBoundingClientRect().height).toBeCloseTo(40, 1);
    await expect(Math.abs(firstLineOffset(chip, text))).toBeLessThanOrEqual(1);
    await expect(Math.abs(firstLineOffset(box, text))).toBeLessThanOrEqual(1);
  },
};

/** The disabled fill, a taupe label and a faint edge, with the not-allowed cursor. */
export const Disabled: Story = {
  args: { isDisabled: true, description: 'Managed by your workspace admin.' },
```

Edit 3. Replace:

```tsx
    children:
      'Send me a weekly summary of every change my team made to the site, including the ones I made myself',
    description: 'You can switch this off at any time from the notification settings.',
  },
};
```

with:

```tsx
    children:
      'Send me a weekly summary of every change my team made to the site, including the ones I made myself',
    description: 'You can switch this off at any time from the notification settings.',
  },
};

/**
 * A long label wraps beside the box and a chip that does not fit drops under it, with no sideways scroll at
 * 375px. The box stays level with the first line. A label with a line break is short enough to leave the chip
 * beside it, and the chip is level with the first line too. A long `changedLabel` wraps inside the field.
 */
export const LongLabelChanged: Story = {
  args: {
    children:
      'Send me a weekly summary of every change my team made to the site, including the ones I made myself',
    description: 'You can switch this off at any time from the notification settings.',
    isChanged: true,
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Checkbox {...args} />
      <Checkbox {...args} description={undefined}>
        Weekly summary
        <br />
        on Tuesday mornings
      </Checkbox>
      <Checkbox
        {...args}
        description={undefined}
        changedLabel="Not saved yet, so this applies only after you press Save at the bottom of the page"
      >
        Weekly summary
      </Checkbox>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const [long, broken, wordy] = [...canvasElement.querySelectorAll('.checkbox-field')];
    if (!long || !broken || !wordy) throw new Error('Three checkboxes expected');
    for (const field of [long, broken]) {
      const { box, text } = parts(field);
      await expect(lineCount(text)).toBeGreaterThan(1);
      await expect(Math.abs(firstLineOffset(box, text))).toBeLessThanOrEqual(1);
    }
    // The long label fills its row, so the chip drops under it.
    await expect(parts(long).chip.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      parts(long).row.getBoundingClientRect().bottom,
    );
    // The short one leaves room, so the chip is beside the row, level with the first line.
    const { row, text, chip } = parts(broken);
    await expect(chip.getBoundingClientRect().top).toBeLessThan(row.getBoundingClientRect().bottom);
    await expect(Math.abs(firstLineOffset(chip, text))).toBeLessThanOrEqual(1);
    // A chip text too long to sit beside its label wraps inside the field.
    const wide = parts(wordy).chip.getBoundingClientRect();
    await expect(wide.right).toBeLessThanOrEqual(wordy.getBoundingClientRect().right + 0.5);
    await expect(wide.height).toBeGreaterThan(parseFloat(getComputedStyle(parts(wordy).chip).lineHeight));
  },
};
```

The right-to-left story. In `packages/react/src/rtl/RightToLeft.stories.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
/**
 * The box is at the right end of its row with the words to its left, and the
 * hint is indented past the box on the right, which is the start side.
 */
export const CheckboxMirrored: Story = {
  render: () => (
    <Rtl>
      <Checkbox defaultSelected description="رسالة قصيرة كل أسبوع.">
        أرسل لي ملخصًا أسبوعيًا
      </Checkbox>
    </Rtl>
  ),
```

with:

```tsx
/**
 * The box is at the right end of its row with the words to its left, and the
 * hint is indented past the box on the right, which is the start side. A changed
 * checkbox has its chip to the left of the row, level with the first line of the
 * label, whether the label wraps or not.
 */
export const CheckboxMirrored: Story = {
  render: () => (
    <Rtl>
      <Checkbox defaultSelected description="رسالة قصيرة كل أسبوع.">
        أرسل لي ملخصًا أسبوعيًا
      </Checkbox>
      <Checkbox isChanged>
        أرسل لي ملخصًا قصيرًا بكل تعليق كتبه فريقي على مشاركاتي، مرة كل أسبوع، صباح يوم الثلاثاء
      </Checkbox>
      <Checkbox isChanged>
        الملخص
        <br />
        الأسبوعي
      </Checkbox>
    </Rtl>
  ),
```

Edit 2. Replace:

```tsx
    await expectInside(text, root);
    await expect(getComputedStyle(hint).paddingRight).toBe('32px');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
  },
};
```

with:

```tsx
    await expectInside(text, root);
    await expect(getComputedStyle(hint).paddingRight).toBe('32px');
    await expect(getComputedStyle(hint).paddingLeft).toBe('0px');
    // The changed checkbox with a label that wraps, and the one with a line break.
    const [, wrapped, beside] = [...canvasElement.querySelectorAll<HTMLElement>('.checkbox-field')];
    if (!wrapped || !beside) throw new Error('Three checkboxes expected');
    await expect(lineCount(find(wrapped, '.checkbox-text'))).toBeGreaterThan(1);
    for (const field of [wrapped, beside]) {
      await expect(
        Math.abs(firstLineOffset(find(field, '.checkbox-box'), find(field, '.checkbox-text'))),
      ).toBeLessThanOrEqual(1);
    }
    // The chip is to the left of the row, inside the field, level with the line of the label it follows.
    const chipElement = find(beside, '.field-changed');
    const chip = rect(chipElement);
    await expect(Math.abs(firstLineOffset(chipElement, find(beside, '.checkbox-text')))).toBeLessThanOrEqual(
      1,
    );
    await expect(chip.right).toBeLessThanOrEqual(rect(find(beside, '.checkbox')).left + 0.5);
    await expectInside(chip, rect(beside));
    // The dot is at the chip's start, which is its right.
    await expect(getComputedStyle(chipElement, '::before').right).toBe('0px');
  },
};
```

- [ ] **Step 2: Run them and watch them fail**

The stories read core's built CSS, so build it first. It is still the old CSS at this point.

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark
```

Expected: the core run FAILS with `Tests  3 failed | 179 passed (182)`:

```text
 FAIL  test/css.test.js > src/components/checkbox.css > leaves the boxes alone when a checkbox or a group is changed: the chip is the cue
AssertionError: expected [] to deeply equal [ Array(1) ]
 FAIL  test/css.test.js > src/components/checkbox.css > sets the Changed chip level with the first line of a label that wraps, from a label row that starts its items at the top
AssertionError: expected '\n    --checkbox-size: 20px;\n    --c…' to contain '--checkbox-line: calc(var(--text-body…'
 FAIL  test/css.test.js > src/components/checkbox.css > shows the Changed chip only while the checkbox is changed and not invalid, and keeps the label row out of the closing padding
AssertionError: expected '' to contain 'display: none;'
```

The React run FAILS with `Tests  11 failed | 613 passed | 4 expected fail (628)`, all in `Checkbox.test.tsx`:

- shows the hint as the checkbox description, after the row: `expected [ 'checkbox', 'field-description' ] to deeply equal [ 'field-head', 'field-description' ]`
- shows the changed chip beside the label, and a screen reader reads it with the checkbox: `expect(element).toHaveAttribute("data-changed", "") // element.getAttribute("data-changed") === ""`
- takes the chip text from changedLabel: `Unable to find an element with the text: Unsaved.`
- shows no chip and reads none while the checkbox is not changed: `Unable to find an element with the text: Changed.`
- adds the chip to the aria-describedby the caller passes: `expect(element).toHaveAccessibleDescription()`
- shows the chip whichever way the box is set: `Unable to find an element with the text: Changed.`
- keeps its input, and its focus, when isChanged flips: `expect(element).toHaveAccessibleDescription()`
- lets invalid outrank changed: the chip is gone and no longer announced: `Unable to find an element with the text: Changed.`
- lets invalid outrank changed when React Aria finds the checkbox invalid: `Unable to find an element with the text: Changed.`
- reads the chip while validate passes, and the error alone while it fails: `expect(element).toHaveAccessibleDescription()`
- draws no chip for a checkbox without a visible label, though the root is still changed: `expect(element).toHaveAttribute("data-changed", "") // element.getAttribute("data-changed") === ""`

The test of a checkbox inside a group, the six axe cases and the empty-parts case pass: they pin what must stay true.

The Storybook run FAILS with `Test Files  4 failed | 34 passed (38)` and `Tests  6 failed | 358 passed (364)`: the three stories below, each in the `storybook` and the `storybook-dark` project.

- `Checkbox` > Changed: `Unable to find an element with the text: Changed.`
- `Checkbox` > Long Label Changed: `No row, box, label or chip drawn`
- `RightToLeft` > Checkbox Mirrored: `Nothing matches .field-changed`

- [ ] **Step 3: Write the component, the CSS, the record and the changeset**

`Checkbox.tsx`. In `packages/react/src/checkbox/Checkbox.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
'use client';

import type { ReactElement, ReactNode, Ref } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  type CheckboxFieldProps as RACCheckboxFieldProps,
  type CheckboxFieldRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldError } from '../field/FieldError';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
```

with:

```tsx
'use client';

import { useContext, type ReactElement, type ReactNode, type Ref } from 'react';
import {
  CheckboxButton,
  CheckboxField,
  CheckboxGroupStateContext,
  FieldErrorContext,
  type CheckboxFieldProps as RACCheckboxFieldProps,
  type CheckboxFieldRenderProps,
  type ValidationResult,
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { FieldChanged } from '../field/FieldChanged';
import { FieldError } from '../field/FieldError';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
```

Edit 2. Replace:

```tsx
   * Inside a `CheckboxGroup` it is not shown: a group has one error line, its own.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /** A class name, or a function of the checkbox's state, merged after the library's own class. */
  className?:
    string | ((values: CheckboxFieldRenderProps & { defaultClassName: string | undefined }) => string);
```

with:

```tsx
   * Inside a `CheckboxGroup` it is not shown: a group has one error line, its own.
   */
  errorMessage?: ReactNode | ((validation: ValidationResult) => ReactNode);
  /**
   * Whether the choice differs from the saved one. Shows the clay Changed chip
   * beside the label and has a screen reader read the chip with the checkbox.
   * The box keeps its edge: the chip is the whole cue. An invalid checkbox shows
   * its error instead, and one without a visible label draws no chip. Inside a
   * `CheckboxGroup` it is ignored, because the group's own chip covers it: set
   * `isChanged` on the group.
   */
  isChanged?: boolean;
  /**
   * The text of the Changed chip.
   * @default 'Changed'
   */
  changedLabel?: string;
  /** A class name, or a function of the checkbox's state, merged after the library's own class. */
  className?:
    string | ((values: CheckboxFieldRenderProps & { defaultClassName: string | undefined }) => string);
```

Edit 3. Replace:

```tsx
}

/**
 * A single checkbox: the box, its label, an optional hint and an error line in
 * one element. Built on React Aria's CheckboxField and CheckboxButton. On its
 * own it submits `value` (or "on") under `name` while it is checked; in a
 * `CheckboxGroup` it takes part in the group's value.
 */
export function Checkbox({
  children,
  description,
  errorMessage,
  className,
  ...props
}: CheckboxProps): ReactElement {
  return (
    <CheckboxField
      {...props}
      className={composeRenderProps(className, (userClassName) => cx('checkbox-field', userClassName))}
    >
      <CheckboxButton className="checkbox">
        <span className="checkbox-box" aria-hidden="true" />
        {present(children) ? <span className="checkbox-text">{children}</span> : null}
      </CheckboxButton>
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </CheckboxField>
  );
}
```

with:

```tsx
}

/**
 * A single checkbox: the box, its label, an optional hint, an error line and
 * the Changed chip in one element. Built on React Aria's CheckboxField and
 * CheckboxButton. On its own it submits `value` (or "on") under `name` while it
 * is checked; in a `CheckboxGroup` it takes part in the group's value.
 */
export function Checkbox({
  children,
  description,
  errorMessage,
  isChanged = false,
  changedLabel,
  className,
  ...props
}: CheckboxProps): ReactElement {
  // A group's own chip covers its checkboxes, so one inside a group has none.
  const isInGroup = useContext(CheckboxGroupStateContext) !== null;
  // The chip lives in a label row beside the row, so a checkbox with no visible label has no chip to read.
  const hasChip = present(children) && !isInGroup;
  const { chipId, describedBy } = useChangedDescription({
    isChanged: isChanged && hasChip,
    isInvalid: props.isInvalid,
    describedBy: props['aria-describedby'],
  });
  const row = (
    <CheckboxButton className="checkbox">
      <span className="checkbox-box" aria-hidden="true" />
      {present(children) ? <span className="checkbox-text">{children}</span> : null}
    </CheckboxButton>
  );
  return (
    <CheckboxField
      {...props}
      aria-describedby={describedBy}
      data-changed={isChanged && !isInGroup ? '' : undefined}
      className={composeRenderProps(className, (userClassName) => cx('checkbox-field', userClassName))}
    >
      {hasChip ? (
        <div className="field-head">
          {row}
          <CheckboxChanged id={chipId}>{changedLabel}</CheckboxChanged>
        </div>
      ) : (
        row
      )}
      {present(description) ? <Description>{description}</Description> : null}
      <FieldError>{errorMessage}</FieldError>
    </CheckboxField>
  );
}

/**
 * The Changed chip of a checkbox on its own. Like `FieldHead`'s, it leaves the page while React Aria finds
 * the checkbox invalid, by any cause: a chip that is only hidden is still read when `aria-describedby`
 * names it, and validation that React Aria runs is not something the checkbox's own props can see.
 */
function CheckboxChanged({ id, children }: { id: string; children?: string }): ReactElement | null {
  const isInvalid = useContext(FieldErrorContext)?.isInvalid === true;
  return isInvalid ? null : <FieldChanged id={id}>{children}</FieldChanged>;
}
```

`checkbox.css`. In `packages/core/src/components/checkbox.css` make two edits, in this order.

Edit 1. Replace:

```css
  .checkbox {
    --checkbox-size: 20px;
    --checkbox-gap: 0.75rem;
  }

  /* One checkbox with its hint and error line. The label sits at its own
```

with:

```css
  .checkbox {
    --checkbox-size: 20px;
    --checkbox-gap: 0.75rem;
    /* The row's line of text, which the Changed chip beside the row reads to sit level with it. */
    --checkbox-line: calc(var(--text-body) * var(--text-body--line-height));
  }

  /* One checkbox with its hint and error line. The label sits at its own
```

Edit 2. Replace:

```css
  }

  /* The label's padding spaces one row from the next, so a row with a hint or an
     error line closes with the same room. */
  .checkbox-field > :not(.checkbox):last-child {
    padding-block-end: 0.5rem;
  }

  /* The group. Its rows carry their own padding, so the field's 8px between
```

with:

```css
  }

  /* The label's padding spaces one row from the next, so a row with a hint or an
     error line closes with the same room. The label row has that padding in its
     own row already. */
  .checkbox-field > :not(.checkbox, .field-head):last-child {
    padding-block-end: 0.5rem;
  }

  /* A checkbox on its own holds its row and its Changed chip in a label row, so the
     chip is beside the row and not inside the label: it is no part of the name, and
     a press on it does not toggle the box. The chip shows while the field's root is
     changed and gives way to an invalid one, as a field's does in field.css. */
  .checkbox-field:not([data-changed]) .field-changed,
  .checkbox-field[data-invalid] .field-changed {
    display: none;
  }

  /* The chip sits level with the first line of the label, as the box does, and not
     with the middle of a row that wraps. The head starts its items at the top, and
     the chip takes the row's 8px of padding and half of what the row's line has over
     the chip's own 14px line. For a row of one line that is 12.2px, which puts the
     chip's middle on the line's, so the row does not move. A chip that does not fit
     beside the row drops under it, and carries the same margin there. */
  .field-head:has(> .checkbox) {
    align-items: flex-start;
  }

  .field-head:has(> .checkbox) > .field-changed {
    margin-block-start: calc(0.5rem + (var(--checkbox-line) - 1lh) / 2);
  }

  /* The group. Its rows carry their own padding, so the field's 8px between
```

The record. In `docs/design-system.md` make two edits, in this order.

Edit 1. Replace:

```markdown
it on the boxes would mark boxes that did not change, would drop an empty box's
edge from 3.48 to the light signal orange's 2.87 against Raised (2.53 on the
page, under the 3:1 a boundary asks), and would sit beside the ink edge of every
checked box. So the boxes keep their edges, the chip carries the cue and the
stylesheet has no `data-changed` rule. Invalid still outranks changed: the chip
leaves, every box takes the error edge and the line shows.

- **Orientation** is vertical by default and horizontal on request. React Aria's
```

with:

```markdown
it on the boxes would mark boxes that did not change, would drop an empty box's
edge from 3.48 to the light signal orange's 2.87 against Raised (2.53 on the
page, under the 3:1 a boundary asks), and would sit beside the ink edge of every
checked box. So the boxes keep their edges, the chip carries the cue and no rule
keyed on `data-changed` draws a box. Invalid still outranks changed: the chip
leaves, every box takes the error edge and the line shows.

- **Orientation** is vertical by default and horizontal on request. React Aria's
```

Edit 2. Replace:

```markdown
- **A group shows one error line, its own.** React Aria clears the error
  context of the checkboxes inside a group, so an `errorMessage` on one of them
  is not shown there. It shows when the checkbox stands alone.

| Box edge (boundary on its Raised fill) against | Light | Dark |
| --- | --- | --- |
```

with:

```markdown
- **A group shows one error line, its own.** React Aria clears the error
  context of the checkboxes inside a group, so an `errorMessage` on one of them
  is not shown there. It shows when the checkbox stands alone.
- **A checkbox on its own takes the chip too, beside its label.** `isChanged`
  and `changedLabel` follow the field contract, as Switch's do: `data-changed`
  on the root, a clay chip that a screen reader reads with the checkbox, and a
  chip that leaves the page while the checkbox is invalid, by any cause, React
  Aria's own validation included. Invalid outranks changed. The boxes keep their
  edges, for the reason given for the group above, and the only rule keyed on
  `data-changed` shows or hides the chip. The row is a `label`, so the chip
  cannot be inside it: it would join the checkbox's name, and a press on it
  would toggle the box. It sits beside the row in the `field-head` row instead.
  The head starts its items at the top, and the chip takes the row's 8px of
  padding and half of what the 22.4px line has over its own 14px line, 12.2px,
  so its middle is on the middle of the first line and of the box, and a row of
  one line stays 40px tall with nothing moved. A chip that does not fit beside
  the row drops under it and keeps the margin, 12.2px under the row. A long
  `changedLabel` wraps inside the field, so the page never scrolls sideways at
  320px. A checkbox with no visible label has no label row and no chip, as
  Switch has none. Inside a `CheckboxGroup` the checkbox ignores `isChanged` and
  keeps the markup it had, with no label row, because the group's chip covers
  the group.

| Box edge (boundary on its Raised fill) against | Light | Dark |
| --- | --- | --- |
```

The docs page. In `apps/docs/content/docs/components/checkbox.mdx` make two edits, in this order.

Edit 1. Replace:

```markdown
## States

Checked is an ink fill with a canvas mark, drawn with a mask so it reads in both themes. Indeterminate is a canvas bar. Invalid turns only the edge to the error color, so a checked box that is invalid still reads as checked. A disabled box is recessed with a taupe label, and a read-only box looks like an enabled one and cannot be pressed.

<Preview name="checkbox-states" />
```

with:

```markdown
## States

Checked is an ink fill with a canvas mark, drawn with a mask so it reads in both themes. Indeterminate is a canvas bar. Invalid turns only the edge to the error color, so a checked box that is invalid still reads as checked. A disabled box is recessed with a taupe label, and a read-only box looks like an enabled one and cannot be pressed. A changed checkbox shows a clay chip beside its label and nothing else, and a screen reader reads the chip with it. Invalid outranks changed, so the chip steps aside for the error line, and a checkbox with no visible label shows no chip. Inside a group a checkbox ignores `isChanged`, because the group's own chip covers it.

<Preview name="checkbox-states" />
```

Edit 2. Replace:

```markdown
### Checkbox

<PropsTable label="Checkbox props" path="../../packages/react/src/checkbox/Checkbox.tsx" type="Pick<CheckboxProps, 'children' | 'description' | 'errorMessage' | 'value' | 'name' | 'isSelected' | 'defaultSelected' | 'onChange' | 'isIndeterminate' | 'isDisabled' | 'isReadOnly' | 'isRequired' | 'isInvalid' | 'validate'>" />

### CheckboxGroup
```

with:

```markdown
### Checkbox

<PropsTable label="Checkbox props" path="../../packages/react/src/checkbox/Checkbox.tsx" type="Pick<CheckboxProps, 'children' | 'description' | 'errorMessage' | 'isChanged' | 'changedLabel' | 'value' | 'name' | 'isSelected' | 'defaultSelected' | 'onChange' | 'isIndeterminate' | 'isDisabled' | 'isReadOnly' | 'isRequired' | 'isInvalid' | 'validate'>" />

### CheckboxGroup
```

The docs example. In `apps/docs/examples/checkbox-states.tsx` make one edit.

Replace:

```tsx
      <Checkbox isReadOnly defaultSelected>
        Managed by your workspace admin
      </Checkbox>
    </div>
  );
}
```

with:

```tsx
      <Checkbox isReadOnly defaultSelected>
        Managed by your workspace admin
      </Checkbox>
      <Checkbox isChanged>Email me a weekly summary</Checkbox>
    </div>
  );
}
```

The changeset. `.changeset/checkbox-changed.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add `isChanged` and `changedLabel` to a standalone Checkbox, which shows the clay Changed chip beside its label and has a screen reader read it with the checkbox, as a Switch does. Invalid outranks changed. A Checkbox inside a CheckboxGroup ignores `isChanged`, because the group's own chip covers it.
```

Run `pnpm exec changeset status --verbose`. Expected: both packages are listed under `minor` with this changeset and `disabled-labels.md`, and nothing under `major`.

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark
```

Expected: `Tests  182 passed (182)` for `css.test.js`, `Tests  624 passed | 4 expected fail (628)` for React, and `Test Files  38 passed (38)` with `Tests  364 passed (364)` for Storybook.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/react size
pnpm verify
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:
- `pnpm format` changes no file. `pnpm format:check` prints `All matched files use Prettier code style!`.
- Core: the 2 tests this task adds, so `Tests  302 passed (302)` in 5 files (300 before). React: the 17 tests this task adds, so `Tests  624 passed | 4 expected fail (628)` in 38 files (611 before). Storybook: the 2 stories this task adds, each run in two projects, so `Tests  364 passed (364)` in 38 files (360 before).
- Turborepo reports 10 successful tasks for the first run, 4 for the second and 5 for the third. In the size output the `Checkbox` entry reads `602 B` against its 1 kB limit, and the others are unchanged.
- `pnpm verify` exits 0. The first line is `check:public: no private names in 308 files` (or the no-file message on a machine without `.local`). Root tests: `tests 20`, `pass 20`. Turborepo reports 18 successful tasks.
- The port check prints nothing, and the e2e run ends `158 passed`, the same as before, since this task adds no end-to-end test. If another checkout is using port 3100, run it as `DOCS_E2E_PORT=3502 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: 10 new files and no changed ones. The two stories below, each as `<id>--light-rounded.png`, `--dark-rounded.png`, `--light-soft.png`, `--light-square.png` and `--light-rounded-375.png`:

  - `components-checkbox--changed--dark-rounded.png`
  - `components-checkbox--changed--light-rounded-375.png`
  - `components-checkbox--changed--light-rounded.png`
  - `components-checkbox--changed--light-soft.png`
  - `components-checkbox--changed--light-square.png`
  - `components-checkbox--long-label-changed--dark-rounded.png`
  - `components-checkbox--long-label-changed--light-rounded-375.png`
  - `components-checkbox--long-label-changed--light-rounded.png`
  - `components-checkbox--long-label-changed--light-soft.png`
  - `components-checkbox--long-label-changed--light-square.png`

Nothing that exists moves. This was checked before the step was written, in local Chromium and not the Docker image, by taking every visual story (148) in all five modes (740 images) before and after this change and comparing them byte for byte: all 740 are identical, and the 10 above are the only new images. In particular the `Labelless` row, the `LongLabel` and `WithDescription` checkboxes and every `CheckboxGroup` story are identical.

What to look at:
- `components-checkbox--changed`: the box is unchecked with its boundary edge, the label is `Remember me on this device`, and the clay chip is beside it, its middle on the middle of the box. The hint is under the label, as in `WithDescription`.
- `components-checkbox--long-label-changed`: the story draws three checkboxes.
  - The first has a long label with a hint. The box is level with the first line of the label, and the chip drops under the row, with the hint under the chip.
  - The second has a two-line label made with a line break. The chip is beside the row, and its middle is on the middle of the first line, as the box's is.
  - The third has a short label and a long chip text. The chip drops under the row and wraps inside the field: two lines at 375px.

- [ ] **Step 7: Commit**

```bash
git add .changeset/checkbox-changed.md apps/docs/content/docs/components/checkbox.mdx apps/docs/examples/checkbox-states.tsx docs/design-system.md packages/core/src/components/checkbox.css packages/core/test/css.test.js packages/react/src/checkbox/Checkbox.stories.tsx packages/react/src/checkbox/Checkbox.test.tsx packages/react/src/checkbox/Checkbox.tsx packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/empty-parts.test.tsx apps/storybook/tests/visual/__screenshots__
git commit -m "feat: let a standalone checkbox show that it changed"
```


### Task 3: Every field requires an accessible name

**Files:**
- Create: `packages/react/src/utils/accessible-name.ts` (types only; it ships no code)
- Modify: `packages/react/src/text-field/TextField.tsx`, `packages/react/src/text-area/TextArea.tsx`, `packages/react/src/checkbox/Checkbox.tsx`, `packages/react/src/checkbox/CheckboxGroup.tsx`, `packages/react/src/radio-group/Radio.tsx`, `packages/react/src/radio-group/RadioGroup.tsx`, `packages/react/src/switch/Switch.tsx`
- Modify (one JSDoc comment only): `packages/react/src/segmented-control/SegmentedControlItem.tsx`
- Modify (the two that already required a name, moved onto the shared type): `packages/react/src/segmented-control/SegmentedControl.tsx`, `packages/react/src/icon-button/IconButton.tsx`
- Modify (entry points): `packages/react/src/text-field/index.ts`, `packages/react/src/text-area/index.ts`, `packages/react/src/checkbox/index.ts`, `packages/react/src/radio-group/index.ts`, `packages/react/src/switch/index.ts`, `packages/react/src/index.ts`
- Test: `packages/react/src/text-field/TextField.test.tsx`, `packages/react/src/text-area/TextArea.test.tsx`, `packages/react/src/checkbox/Checkbox.test.tsx`, `packages/react/src/checkbox/CheckboxGroup.test.tsx`, `packages/react/src/radio-group/Radio.test.tsx`, `packages/react/src/radio-group/RadioGroup.test.tsx`, `packages/react/src/switch/Switch.test.tsx`, `packages/react/src/segmented-control/SegmentedControlItem.test.tsx`
- Test (stories): `packages/react/src/text-field/TextField.stories.tsx`, `packages/react/src/text-area/TextArea.stories.tsx`, `packages/react/src/checkbox/Checkbox.stories.tsx`, `packages/react/src/checkbox/CheckboxGroup.stories.tsx`, `packages/react/src/radio-group/RadioGroup.stories.tsx`, `packages/react/src/switch/Switch.stories.tsx`
- Modify: `docs/design-system.md` (one bullet in "Rules every component follows" in Appendix B; the last three lines of the file are not touched)
- Modify: `apps/docs/content/docs/components/text-field.mdx`, `text-area.mdx`, `checkbox.mdx`, `radio-group.mdx`, `switch.mdx` and `segmented-control.mdx` (one line each)
- Create: `.changeset/field-names.md`
- Create (Docker step): none. No baseline is added or changes.

**Interfaces:**
- Consumes:
  - From `react`: the `ReactNode` type. From `react-aria-components`: the prop types each component already extends. No runtime import is added anywhere.
  - The pattern in `SegmentedControl.stories.tsx`, which already writes its stories against an exported base props type and casts the component to it. The six story files below follow it.
- Produces in `packages/react/src/utils/accessible-name.ts`, two exported types and no value:

```ts
export type AriaName =
  | { 'aria-label': string; 'aria-labelledby'?: string }
  | { 'aria-label'?: string; 'aria-labelledby': string };

export type AccessibleName<Visible extends 'label' | 'children'> =
  Record<Visible, ReactNode> | (Partial<Record<Visible, undefined>> & AriaName);
```

- Produces, in each of seven components, a base interface that holds every prop it had, and the props type as the base joined with the name rule. The prop types keep their names:

| Component | Base props (new export) | Props type (same name) |
| --- | --- | --- |
| TextField | `TextFieldBaseProps` | `TextFieldBaseProps & AccessibleName<'label'>` |
| TextArea | `TextAreaBaseProps` | `TextAreaBaseProps & AccessibleName<'label'>` |
| CheckboxGroup | `CheckboxGroupBaseProps` | `CheckboxGroupBaseProps & AccessibleName<'label'>` |
| RadioGroup | `RadioGroupBaseProps` | `RadioGroupBaseProps & AccessibleName<'label'>` |
| Checkbox | `CheckboxBaseProps` | `CheckboxBaseProps & AccessibleName<'children'>` |
| Switch | `SwitchBaseProps` | `SwitchBaseProps & AccessibleName<'children'>` |
| Radio | `RadioBaseProps` | `RadioBaseProps & AccessibleName<'children'>` |

- Changes `SegmentedControlProps` to `SegmentedControlBaseProps & AccessibleName<'label'>` and `IconButtonProps` to use `AriaName`. Both accept and reject exactly what they did. `SegmentedControlBaseProps` was already exported.
- Produces 7 type exports, one per base props type, from each folder's `index.ts` and from `src/index.ts`. No runtime export changes.
- Leaves `SegmentedControlItemProps` as it was: `children` stays required, and `aria-label` and `aria-labelledby` stay optional extras. Only the JSDoc of `children` gains a sentence.
- Produces 8 React tests, one `it` in each of the eight test files, and no core test and no story. Seven are named `requires an accessible name in its types`. The eighth, in `SegmentedControlItem.test.tsx`, is named `requires its children in its types, and takes an aria-label as an extra`.

**What this task decides:**
- **One pattern, in one type-only file.**
  - `IconButton` had its own `AccessibleName` union (an `aria-label` or an `aria-labelledby`) and `SegmentedControl` had three small interfaces for a `label`, an `aria-label` or an `aria-labelledby`. Adding six more copies would have been six more places to get one wrong, so both are now built from `AriaName` and `AccessibleName` in `utils/accessible-name.ts`.
  - The file holds types only and is imported with `import type`, so it emits no JavaScript: `dist/utils/` gains a `.d.ts` and no `.js`, and every `size-limit` entry reads the same as it did after Task 2.
  - `AccessibleName<'label'>` is for the five components that draw a `label` row. `AccessibleName<'children'>` is for Checkbox, Switch and Radio, whose text is their children and which have no `label` prop.
- **Each props type is the old interface joined with the rule, and the old interface is exported as `...BaseProps`.**
  - An `interface` cannot extend a union, and Storybook cannot narrow one, so `SegmentedControl.stories.tsx` already writes its stories against `SegmentedControlBaseProps` and casts the component. The six story files do the same now. A wrapper component needs the same thing to `extends` or `Omit` from, so the new base types are exported from the folder and from the package entry, as `SegmentedControlBaseProps` already was. Seven names are added to the public types and nothing is removed.
  - The base keeps `label?` or `children?` optional and carries the JSDoc, now worded "Required unless the field has an `aria-label` or an `aria-labelledby`". The name rule then makes it required, or replaces it with an aria name.
  - The docs tables are unchanged in their source. `Pick<TextFieldProps, ...>` over the union still resolves every prop with its description (checked in Step 5), so no page switches to a base type.
- **What counts as a name, and what does not.**
  - A visible `label`, or `children` for the three components that have no `label`, or an `aria-label`, or an `aria-labelledby`. A hint, a placeholder or `isDisabled` is not a name, and each test pins it with its own `@ts-expect-error`.
  - The visible form is `Record<Visible, ReactNode>`: the key must be present, but `ReactNode` includes `undefined` and `null`, so `label={maybeUndefined}` compiles. This is how `SegmentedControl` already behaved. The types cannot see what is empty at run time, and the components still draw no label row for an empty one.
- **`SegmentedControlItem` keeps `children` required, a deliberate departure from the spec's table.**
  - The spec's table lists the option with Checkbox, Switch and Radio, which would accept an `aria-label` and no children. An option with only an `aria-label` draws an empty pill that a sighted person cannot read, so the option's type is left as it was: `children` is required, and `aria-label` and `aria-labelledby` are optional extras. An option that shows only an icon passes the icon as `children` and adds an `aria-label`.
  - The `children` JSDoc says so, the segmented control page says so, and so does the Appendix B bullet, which names the option as the exception.
  - The option's test pins it: an option with no children fails to compile, and so does one with an `aria-label` or an `aria-labelledby` alone. An option with text, and an icon-only option with an `aria-label`, compile. Nothing in the option's type changes, so this test passes in Step 2 as well: it guards a rule that the other seven tests are about to gain.
- **Nothing changes at run time.** Every component file emits the same JavaScript as before (checked by transpiling each changed file as it was after Task 2 and as it is now, and comparing the output), the 22 `size-limit` entries are byte for byte what they were, and all 750 story screenshots (150 visual stories in five modes) taken in local Chromium are identical to the 750 taken at Task 2's commit.
- **The callers that stopped compiling were six story files, and nothing else.**
  - Each `render: (args) => <Field {...args}>` spreads args whose name is optional in the base type. The `RadioGroup` renders pass `label={args.label}`, as `SegmentedControl.stories.tsx` passes a `label` on its renders, and the two `Checkbox` and `Switch` renders put `args.children` in the body. No story's output changes. The other stories only changed their meta, to the base type.
  - The test helpers (`Controlled`, `Theme`, `Alone` and the others), every docs example, the homepage and the code blocks in the docs already named every field. The docs and storybook `typecheck` passed with no edit, and a scan of every `.mdx`, `.md`, `.ts` and `.tsx` file for these components with no name found only React Aria's own `TextField` and `RadioGroup`, which the field-parts docs, stories and tests build from. No `@ts-expect-error` silences a real usage; the only ones are in the type tests.
- **How the type tests are built, and why Step 2 is a typecheck.**
  - Each test is IconButton's: an `it` that builds elements and never renders them, with `@ts-expect-error` on the nameless forms and plain elements for each accepted form. Vitest erases types, so the tests pass at run time before and after. The gate that catches a regression is `pnpm --filter @snapshot-ui/react typecheck`, which is already part of `pnpm turbo run ... typecheck` and `pnpm verify`.
  - Step 4 proves it by taking the rule off a component and reading the `TS2578` it raises. The same was done to all eight unions (the seven above and `SegmentedControl`): each fails in its own test file.
- **Docs.**
  - One line on each of the six pages that carry one of these components, in its Usage section, saying the types require a name and which three forms it takes. `switch.mdx` and `segmented-control.mdx` already had a line, which said "needs an `aria-label`" and "one of the two", so those two are corrected and not duplicated.
  - Appendix B gets one bullet in "Rules every component follows": the rule, which components take which form, and why the base types are exported.
  - The `label` and `children` rows of the props tables now carry the rule in their descriptions (the option's says how an icon-only option is named), and that is the only change in any table: the tables of all 15 component pages were dumped before and after, and the only differences are those nine reworded descriptions.
- **The changeset says plainly that this is breaking.** It is a type-only break: code that renders a field with no visible label, `aria-label` or `aria-labelledby` stops compiling, and nothing changes at run time. Under 0.x a minor version may break, and it points to the exported base types for code that extends or omits from the props, which a union cannot be.
- **A throwaway axe run (axe-core 4.14) of the homepage and seven component pages at 320, 375 and 1440px in light and dark** found no sideways scroll and no violation but `label-content-name-mismatch` on the docs rail's search button at 1440px on every component page, including Icon button, which this task does not touch. It is the same one Task 2 saw, and it is not this task's.

- [ ] **Step 1: Write the failing tests**

Add one test to each of the eight test files, before that file's second test. In each, the nameless forms carry `@ts-expect-error` and the accepted forms are plain elements.

In `packages/react/src/text-field/TextField.test.tsx` make one edit.

Replace:

```tsx
    expect(root(container)).not.toHaveAttribute('data-changed');
    expect(root(container)).not.toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
```

with:

```tsx
    expect(root(container)).not.toHaveAttribute('data-changed');
    expect(root(container)).not.toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <TextField />;
    // @ts-expect-error a hint and a placeholder are not a name
    const unnamed = <TextField description="Shown under the title." placeholder="Title" />;
    const labelled = <TextField label="Title" />;
    const byAriaLabel = <TextField aria-label="Title" />;
    const byLabelledby = <TextField aria-labelledby="heading" />;
    expect([nameless, unnamed, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('puts its parts in the order the field contract asks for', () => {
```

In `packages/react/src/text-area/TextArea.test.tsx` make one edit.

Replace:

```tsx
    expect(root(container)).not.toHaveAttribute('data-changed');
    expect(root(container)).not.toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('is a textarea and not an input: it carries no type once it has mounted', () => {
```

with:

```tsx
    expect(root(container)).not.toHaveAttribute('data-changed');
    expect(root(container)).not.toHaveAttribute('data-invalid');
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a field with no label, aria-label or aria-labelledby has no name
    const nameless = <TextArea />;
    // @ts-expect-error a hint and a placeholder are not a name
    const unnamed = <TextArea description="Shown under the title." placeholder="Title" />;
    const labelled = <TextArea label="Title" />;
    const byAriaLabel = <TextArea aria-label="Title" />;
    const byLabelledby = <TextArea aria-labelledby="heading" />;
    expect([nameless, unnamed, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('is a textarea and not an input: it carries no type once it has mounted', () => {
```

In `packages/react/src/checkbox/Checkbox.test.tsx` make one edit.

Replace:

```tsx
    expect(box?.textContent).toBe('');
    expect(row?.querySelector('.checkbox-text')).toHaveTextContent('Remember me');
    await expectNoA11yViolations(container);
  });

  it('has the box and the text in one label, so the whole row is the target', () => {
```

with:

```tsx
    expect(box?.textContent).toBe('');
    expect(row?.querySelector('.checkbox-text')).toHaveTextContent('Remember me');
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a checkbox with no text, aria-label or aria-labelledby has no name
    const nameless = <Checkbox />;
    // @ts-expect-error a hint is not a name
    const hinted = <Checkbox description="Shown under the label." />;
    const labelled = <Checkbox>Remember me</Checkbox>;
    const byAriaLabel = <Checkbox aria-label="Select row 3" />;
    const byLabelledby = <Checkbox aria-labelledby="row-3" />;
    expect([nameless, hinted, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('has the box and the text in one label, so the whole row is the target', () => {
```

In `packages/react/src/checkbox/CheckboxGroup.test.tsx` make one edit.

Replace:

```tsx
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(container.querySelector('.checkbox-items')?.children).toHaveLength(3);
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
```

with:

```tsx
    expect(screen.getAllByRole('checkbox')).toHaveLength(3);
    expect(container.querySelector('.checkbox-items')?.children).toHaveLength(3);
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a group with no label, aria-label or aria-labelledby has no name
    const nameless = <CheckboxGroup />;
    // @ts-expect-error a hint is not a name
    const hinted = <CheckboxGroup description="Pick at least one." />;
    const labelled = <CheckboxGroup label="Notify me by" />;
    const byAriaLabel = <CheckboxGroup aria-label="Notify me by" />;
    const byLabelledby = <CheckboxGroup aria-labelledby="heading" />;
    expect([nameless, hinted, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('puts its parts in the order the field contract asks for', () => {
```

In `packages/react/src/radio-group/Radio.test.tsx` make one edit.

Replace:

```tsx
    expect(radio).toHaveAccessibleName('Free');
    expect(row('Free')).toHaveTextContent('Free');
    await expectNoA11yViolations(container);
  });

  it('ties a hint to the radio as its accessible description', async () => {
```

with:

```tsx
    expect(radio).toHaveAccessibleName('Free');
    expect(row('Free')).toHaveTextContent('Free');
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a radio with no text, aria-label or aria-labelledby has no name
    const nameless = <Radio value="weekly" />;
    // @ts-expect-error a hint is not a name
    const hinted = <Radio value="weekly" description="Every Tuesday morning." />;
    const labelled = <Radio value="weekly">Weekly</Radio>;
    const byAriaLabel = <Radio value="weekly" aria-label="Weekly" />;
    const byLabelledby = <Radio value="weekly" aria-labelledby="weekly-name" />;
    expect([nameless, hinted, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('ties a hint to the radio as its accessible description', async () => {
```

In `packages/react/src/radio-group/RadioGroup.test.tsx` make one edit.

Replace:

```tsx
    }
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('puts its parts in the order the field contract asks for', () => {
```

with:

```tsx
    }
    expect(screen.getByRole('radio', { name: 'Weekly' })).toBeChecked();
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a group with no label, aria-label or aria-labelledby has no name
    const nameless = <RadioGroup />;
    // @ts-expect-error a hint is not a name
    const hinted = <RadioGroup description="Pick one." />;
    const labelled = <RadioGroup label="Newsletter frequency" />;
    const byAriaLabel = <RadioGroup aria-label="Newsletter frequency" />;
    const byLabelledby = <RadioGroup aria-labelledby="heading" />;
    expect([nameless, hinted, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('puts its parts in the order the field contract asks for', () => {
```

In `packages/react/src/switch/Switch.test.tsx` make one edit.

Replace:

```tsx
    expect(row).toHaveClass('switch');
    expect(row).toContainElement(control);
    await expectNoA11yViolations(container);
  });

  it('draws the track and the thumb as decoration inside the row', () => {
```

with:

```tsx
    expect(row).toHaveClass('switch');
    expect(row).toContainElement(control);
    await expectNoA11yViolations(container);
  });

  it('requires an accessible name in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error a switch with no text, aria-label or aria-labelledby has no name
    const nameless = <Switch />;
    // @ts-expect-error a hint is not a name
    const hinted = <Switch description="Every Tuesday morning." />;
    const labelled = <Switch>Weekly digest</Switch>;
    const byAriaLabel = <Switch aria-label="Weekly digest" />;
    const byLabelledby = <Switch aria-labelledby="digest-name" />;
    expect([nameless, hinted, labelled, byAriaLabel, byLabelledby]).toHaveLength(5);
  });

  it('draws the track and the thumb as decoration inside the row', () => {
```

In `packages/react/src/segmented-control/SegmentedControlItem.test.tsx` make one edit.

Replace:

```tsx
    expect(screen.getByRole('radio', { name: 'Light' }).closest('label')).not.toHaveAttribute(
      'data-selected',
    );
  });

  it('keeps an option that cannot be chosen out of the keys and the form', async () => {
```

with:

```tsx
    expect(screen.getByRole('radio', { name: 'Light' }).closest('label')).not.toHaveAttribute(
      'data-selected',
    );
  });

  it('requires its children in its types, and takes an aria-label as an extra', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a name.
    // @ts-expect-error an option with no children has nothing to draw and no name
    const nameless = <SegmentedControlItem value="light" />;
    // @ts-expect-error an aria-label names an option and does not replace what it shows
    const byAriaLabelAlone = <SegmentedControlItem value="light" aria-label="Light" />;
    // @ts-expect-error an aria-labelledby names an option and does not replace what it shows
    const byLabelledbyAlone = <SegmentedControlItem value="light" aria-labelledby="light-name" />;
    const labelled = <SegmentedControlItem value="light">Light</SegmentedControlItem>;
    const iconOnly = (
      <SegmentedControlItem value="light" aria-label="Light">
        <svg viewBox="0 0 24 24" />
      </SegmentedControlItem>
    );
    expect([nameless, byAriaLabelAlone, byLabelledbyAlone, labelled, iconOnly]).toHaveLength(5);
  });

  it('keeps an option that cannot be chosen out of the keys and the form', async () => {
```

- [ ] **Step 2: Run them and watch them fail**

The tests are about types, so the run that fails is the typecheck. Vitest passes them, since types are erased.

```bash
pnpm --filter @snapshot-ui/react typecheck
pnpm --filter @snapshot-ui/react exec vitest run
```

Expected: the typecheck FAILS with 14 errors, in seven of the eight files this task tests:

```text
src/checkbox/Checkbox.test.tsx(40,5): error TS2578: Unused '@ts-expect-error' directive.
src/checkbox/Checkbox.test.tsx(42,5): error TS2578: Unused '@ts-expect-error' directive.
src/checkbox/CheckboxGroup.test.tsx(44,5): error TS2578: Unused '@ts-expect-error' directive.
src/checkbox/CheckboxGroup.test.tsx(46,5): error TS2578: Unused '@ts-expect-error' directive.
src/radio-group/Radio.test.tsx(46,5): error TS2578: Unused '@ts-expect-error' directive.
src/radio-group/Radio.test.tsx(48,5): error TS2578: Unused '@ts-expect-error' directive.
src/radio-group/RadioGroup.test.tsx(64,5): error TS2578: Unused '@ts-expect-error' directive.
src/radio-group/RadioGroup.test.tsx(66,5): error TS2578: Unused '@ts-expect-error' directive.
src/switch/Switch.test.tsx(30,5): error TS2578: Unused '@ts-expect-error' directive.
src/switch/Switch.test.tsx(32,5): error TS2578: Unused '@ts-expect-error' directive.
src/text-area/TextArea.test.tsx(39,5): error TS2578: Unused '@ts-expect-error' directive.
src/text-area/TextArea.test.tsx(41,5): error TS2578: Unused '@ts-expect-error' directive.
src/text-field/TextField.test.tsx(34,5): error TS2578: Unused '@ts-expect-error' directive.
src/text-field/TextField.test.tsx(36,5): error TS2578: Unused '@ts-expect-error' directive.
```

All fourteen are `TS2578`: the types accept a field with no name, so the `@ts-expect-error` above each one has nothing to expect. The option's test raises no error, because its type already requires `children`.

The vitest run passes: `Tests  632 passed | 4 expected fail (636)` in 38 files, the 624 from before and the 8 new ones. They only build elements.

- [ ] **Step 3: Write the shared type, the props types, the entry points, the stories, the docs and the changeset**

The shared type. `packages/react/src/utils/accessible-name.ts`:

```ts
import type { ReactNode } from 'react';

/**
 * How to name an element that has no text of its own: an `aria-label`, or the id of an element that
 * holds the name. The types require one of the two.
 */
export type AriaName =
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label': string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby'?: string;
    }
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label'?: string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby': string;
    };

/**
 * What a field needs for an accessible name: visible content in `Visible`, which is its `label` or its
 * `children`, or an `AriaName`. A props type intersects this with a base that declares `Visible` as
 * optional, so a field that names nothing does not compile. Only the types change: the component draws
 * what it was given.
 */
export type AccessibleName<Visible extends 'label' | 'children'> =
  Record<Visible, ReactNode> | (Partial<Record<Visible, undefined>> & AriaName);
```

The seven components.

In `packages/react/src/text-field/TextField.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { useValueLength } from '../field/useValueLength';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { Input } from './Input';

export interface TextFieldProps extends Omit<RACTextFieldProps, 'children' | 'className'> {
  /** The field's name, shown above the control. Without one, give the field an `aria-label`. */
  label?: ReactNode;
  /** A hint under the control. It becomes the control's accessible description. */
  description?: ReactNode;
```

with:

```tsx
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { useValueLength } from '../field/useValueLength';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { Input } from './Input';

export interface TextFieldBaseProps extends Omit<RACTextFieldProps, 'children' | 'className'> {
  /**
   * The field's name, shown above the control. Required unless the field has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the control's accessible description. */
  description?: ReactNode;
```

Edit 2. Replace:

```tsx
}

/**
 * A single-line text field: label, control, hint, error and an optional length
 * count in one element. Built on React Aria's TextField.
 */
```

with:

```tsx
}

/**
 * The props of a text field. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type TextFieldProps = TextFieldBaseProps & AccessibleName<'label'>;

/**
 * A single-line text field: label, control, hint, error and an optional length
 * count in one element. Built on React Aria's TextField.
 */
```

In `packages/react/src/text-area/TextArea.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { useValueLength } from '../field/useValueLength';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface TextAreaProps extends Omit<
  RACTextFieldProps,
  'children' | 'className' | 'type' | 'pattern'
> {
  /** The field's name, shown above the control. Without one, give the field an `aria-label`. */
  label?: ReactNode;
  /** A hint under the control. It becomes the control's accessible description. */
  description?: ReactNode;
```

with:

```tsx
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { useValueLength } from '../field/useValueLength';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface TextAreaBaseProps extends Omit<
  RACTextFieldProps,
  'children' | 'className' | 'type' | 'pattern'
> {
  /**
   * The field's name, shown above the control. Required unless the field has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the control's accessible description. */
  description?: ReactNode;
```

Edit 2. Replace:

```tsx
}

/**
 * A multi-line text field: label, control, hint, error and an optional length
 * count in one element. The same field as TextField, with a box that is as tall
 * as its rows. Built on React Aria's TextField and TextArea.
```

with:

```tsx
}

/**
 * The props of a text area. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type TextAreaProps = TextAreaBaseProps & AccessibleName<'label'>;

/**
 * A multi-line text field: label, control, hint, error and an optional length
 * count in one element. The same field as TextField, with a box that is as tall
 * as its rows. Built on React Aria's TextField and TextArea.
```

In `packages/react/src/checkbox/Checkbox.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { FieldChanged } from '../field/FieldChanged';
import { FieldError } from '../field/FieldError';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface CheckboxProps extends Omit<RACCheckboxFieldProps, 'children' | 'className'> {
  /**
   * The label, shown beside the box. The whole row is the label, so a press
   * anywhere on it toggles the box. Without one, give the checkbox an `aria-label`.
   */
  children?: ReactNode;
  /** A hint under the label. It becomes the checkbox's accessible description. */
```

with:

```tsx
import { FieldChanged } from '../field/FieldChanged';
import { FieldError } from '../field/FieldError';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface CheckboxBaseProps extends Omit<RACCheckboxFieldProps, 'children' | 'className'> {
  /**
   * The label, shown beside the box. The whole row is the label, so a press
   * anywhere on it toggles the box. Required unless the checkbox has an `aria-label` or an
   * `aria-labelledby`.
   */
  children?: ReactNode;
  /** A hint under the label. It becomes the checkbox's accessible description. */
```

Edit 2. Replace:

```tsx
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * A single checkbox: the box, its label, an optional hint, an error line and
```

with:

```tsx
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a checkbox. A name is required: its `children`, an `aria-label` or an `aria-labelledby`.
 */
export type CheckboxProps = CheckboxBaseProps & AccessibleName<'children'>;

/**
 * A single checkbox: the box, its label, an optional hint, an error line and
```

In `packages/react/src/checkbox/CheckboxGroup.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

export interface CheckboxGroupProps extends Omit<RACCheckboxGroupProps, 'children' | 'className'> {
  /** The checkboxes. Each needs a `value`. */
  children?: ReactNode;
  /** The group's name, shown above the checkboxes. Without one, give the group an `aria-label`. */
  label?: ReactNode;
  /** A hint under the checkboxes. It becomes the group's accessible description. */
  description?: ReactNode;
```

with:

```tsx
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export type CheckboxGroupOrientation = 'vertical' | 'horizontal';

export interface CheckboxGroupBaseProps extends Omit<RACCheckboxGroupProps, 'children' | 'className'> {
  /** The checkboxes. Each needs a `value`. */
  children?: ReactNode;
  /**
   * The group's name, shown above the checkboxes. Required unless the group has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the checkboxes. It becomes the group's accessible description. */
  description?: ReactNode;
```

Edit 2. Replace:

```tsx
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * A labelled group of checkboxes that share one value, an array of the checked
```

with:

```tsx
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of a checkbox group. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type CheckboxGroupProps = CheckboxGroupBaseProps & AccessibleName<'label'>;

/**
 * A labelled group of checkboxes that share one value, an array of the checked
```

In `packages/react/src/radio-group/Radio.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface RadioProps extends Omit<RadioFieldProps, 'children' | 'className' | 'style'> {
  /**
   * The option's label. It wraps inside the row when it is long, even a word
   * with no break in it, and inline markup stays in one run of text. Without
   * one, give the radio an `aria-label`.
   */
  children?: ReactNode;
  /** A hint under the option's row. It becomes the radio's accessible description. */
```

with:

```tsx
  composeRenderProps,
} from 'react-aria-components';
import { Description } from '../field/Description';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface RadioBaseProps extends Omit<RadioFieldProps, 'children' | 'className' | 'style'> {
  /**
   * The option's label. It wraps inside the row when it is long, even a word
   * with no break in it, and inline markup stays in one run of text. Required
   * unless the radio has an `aria-label` or an `aria-labelledby`.
   */
  children?: ReactNode;
  /** A hint under the option's row. It becomes the radio's accessible description. */
```

Edit 2. Replace:

```tsx
  /** A ref to the native radio input. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * One option of a `RadioGroup`: a full-pill row holding a dot and the label,
```

with:

```tsx
  /** A ref to the native radio input. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a radio. A name is required: its `children`, an `aria-label` or an `aria-labelledby`.
 */
export type RadioProps = RadioBaseProps & AccessibleName<'children'>;

/**
 * One option of a `RadioGroup`: a full-pill row holding a dot and the label,
```

In `packages/react/src/radio-group/RadioGroup.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface RadioGroupProps extends Omit<RACRadioGroupProps, 'children' | 'className'> {
  /** The group's name, shown above the options. Without one, give the group an `aria-label`. */
  label?: ReactNode;
  /** A hint under the options. It becomes the group's accessible description. */
  description?: ReactNode;
```

with:

```tsx
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface RadioGroupBaseProps extends Omit<RACRadioGroupProps, 'children' | 'className'> {
  /**
   * The group's name, shown above the options. Required unless the group has an `aria-label` or an
   * `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the options. It becomes the group's accessible description. */
  description?: ReactNode;
```

Edit 2. Replace:

```tsx
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * A group of radios: label, options, hint and error in one element. The
```

with:

```tsx
  /** A ref to the group's root element. */
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of a radio group. A name is required: its `label`, an `aria-label` or an `aria-labelledby`.
 */
export type RadioGroupProps = RadioGroupBaseProps & AccessibleName<'label'>;

/**
 * A group of radios: label, options, hint and error in one element. The
```

In `packages/react/src/switch/Switch.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { Description } from '../field/Description';
import { FieldChanged } from '../field/FieldChanged';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface SwitchProps extends Omit<
  RACSwitchFieldProps,
  'children' | 'className' | 'isRequired' | 'isInvalid' | 'validate' | 'validationBehavior'
> {
  /** The label, beside the track. Without one, give the switch an `aria-label`. */
  children?: ReactNode;
  /** A hint under the label. It becomes the switch's accessible description. */
  description?: ReactNode;
```

with:

```tsx
import { Description } from '../field/Description';
import { FieldChanged } from '../field/FieldChanged';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';

export interface SwitchBaseProps extends Omit<
  RACSwitchFieldProps,
  'children' | 'className' | 'isRequired' | 'isInvalid' | 'validate' | 'validationBehavior'
> {
  /**
   * The label, beside the track. Required unless the switch has an `aria-label` or an
   * `aria-labelledby`.
   */
  children?: ReactNode;
  /** A hint under the label. It becomes the switch's accessible description. */
  description?: ReactNode;
```

Edit 2. Replace:

```tsx
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * A setting that is on or off and takes effect as soon as it is flipped: a
```

with:

```tsx
  /** A ref to the input element. */
  inputRef?: Ref<HTMLInputElement>;
}

/**
 * The props of a switch. A name is required: its `children`, an `aria-label` or an `aria-labelledby`.
 */
export type SwitchProps = SwitchBaseProps & AccessibleName<'children'>;

/**
 * A setting that is on or off and takes effect as soon as it is flipped: a
```

The two components that already required a name now use the shared type.

In `packages/react/src/segmented-control/SegmentedControl.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStacking } from './useStacking';
```

with:

```tsx
import { FieldError } from '../field/FieldError';
import { FieldHead } from '../field/FieldHead';
import { useChangedDescription } from '../field/useChangedDescription';
import type { AccessibleName } from '../utils/accessible-name';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStacking } from './useStacking';
```

Edit 2. Replace:

```tsx
  'children' | 'className' | 'orientation'
> {
  /**
   * The control's name, shown above it with the Changed chip. Without one,
   * give the control an `aria-label` (or an `aria-labelledby`).
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the group's accessible description. */
```

with:

```tsx
  'children' | 'className' | 'orientation'
> {
  /**
   * The control's name, shown above it with the Changed chip. Required unless the control has an
   * `aria-label` or an `aria-labelledby`.
   */
  label?: ReactNode;
  /** A hint under the control. It becomes the group's accessible description. */
```

Edit 3. Replace:

```tsx
  ref?: Ref<HTMLDivElement>;
}

/** What names the control: a visible label, or an `aria-label`, or an `aria-labelledby`. */
interface LabelledByLabel {
  label: ReactNode;
}
interface LabelledByAriaLabel {
  label?: undefined;
  'aria-label': string;
}
interface LabelledByElement {
  label?: undefined;
  'aria-labelledby': string;
}

export type SegmentedControlProps = SegmentedControlBaseProps &
  (LabelledByLabel | LabelledByAriaLabel | LabelledByElement);

/**
 * A few short options seen at once, of which one is chosen. Built on React
```

with:

```tsx
  ref?: Ref<HTMLDivElement>;
}

/**
 * The props of SegmentedControl. The types require a name: a visible `label`, an `aria-label` or an
 * `aria-labelledby`.
 */
export type SegmentedControlProps = SegmentedControlBaseProps & AccessibleName<'label'>;

/**
 * A few short options seen at once, of which one is chosen. Built on React
```

In `packages/react/src/icon-button/IconButton.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
  type LinkProps as RACLinkProps,
  composeRenderProps,
} from 'react-aria-components';
import { cx } from '../utils/cx';

export type IconButtonVariant = 'ghost' | 'outline';
```

with:

```tsx
  type LinkProps as RACLinkProps,
  composeRenderProps,
} from 'react-aria-components';
import type { AriaName } from '../utils/accessible-name';
import { cx } from '../utils/cx';

export type IconButtonVariant = 'ghost' | 'outline';
```

Edit 2. Replace:

```tsx
   */
  variant?: IconButtonVariant;
}

/**
 * An icon has no text to name the button, so the types require a name: a label, or the id of an
 * element that holds it.
 */
type AccessibleName =
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label': string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby'?: string;
    }
  | {
      /** The accessible name. Required unless `aria-labelledby` gives one. */
      'aria-label'?: string;
      /** The id of an element that holds the accessible name. */
      'aria-labelledby': string;
    };

/** The button form, the default. It has no pending state, because an icon has nowhere to show one. */
type IconButtonAction = Omit<RACButtonProps, 'aria-label' | 'aria-labelledby' | 'isPending'> & {
```

with:

```tsx
   */
  variant?: IconButtonVariant;
}

/** The button form, the default. It has no pending state, because an icon has nowhere to show one. */
type IconButtonAction = Omit<RACButtonProps, 'aria-label' | 'aria-labelledby' | 'isPending'> & {
```

Edit 3. Replace:

```tsx
/**
 * A button that holds one icon, or a link drawn the same way when given an `href`. The child is the
 * icon, such as a Lucide icon. It is hidden from assistive technology, so the name comes from
 * `aria-label` or `aria-labelledby`, which the types require.
 */
export type IconButtonProps = IconButtonOptions & AccessibleName & (IconButtonAction | IconButtonAnchor);

const classes =
  (variant: IconButtonVariant) =>
```

with:

```tsx
/**
 * A button that holds one icon, or a link drawn the same way when given an `href`. The child is the
 * icon, such as a Lucide icon. It is hidden from assistive technology and has no text, so the name comes
 * from `aria-label` or `aria-labelledby`, which the types require.
 */
export type IconButtonProps = IconButtonOptions & AriaName & (IconButtonAction | IconButtonAnchor);

const classes =
  (variant: IconButtonVariant) =>
```

The option keeps `children` required. Only its comment says how an icon-only option is named.

In `packages/react/src/segmented-control/SegmentedControlItem.tsx` make one edit.

Replace:

```tsx
> {
  /** The value the control takes while this option is selected. It is also what a form submits. */
  value: string;
  /** What the option shows: a word or two. */
  children: ReactNode;
  /** A class name, or a function of the option's state, merged after the library's own class. */
  className?:
```

with:

```tsx
> {
  /** The value the control takes while this option is selected. It is also what a form submits. */
  value: string;
  /**
   * What the option shows: a word or two. An option that shows only an icon passes the icon here and
   * names itself with an `aria-label`.
   */
  children: ReactNode;
  /** A class name, or a function of the option's state, merged after the library's own class. */
  className?:
```

The entry points.

In `packages/react/src/text-field/index.ts` make one edit.

Replace:

```ts
export { Input, type InputProps } from './Input';
export { TextField, type TextFieldProps } from './TextField';
```

with:

```ts
export { Input, type InputProps } from './Input';
export { TextField, type TextFieldBaseProps, type TextFieldProps } from './TextField';
```

In `packages/react/src/text-area/index.ts` make one edit.

Replace:

```ts
export { TextArea, type TextAreaProps } from './TextArea';
```

with:

```ts
export { TextArea, type TextAreaBaseProps, type TextAreaProps } from './TextArea';
```

In `packages/react/src/checkbox/index.ts` make one edit.

Replace:

```ts
export { Checkbox, type CheckboxProps } from './Checkbox';
export { CheckboxGroup, type CheckboxGroupOrientation, type CheckboxGroupProps } from './CheckboxGroup';
```

with:

```ts
export { Checkbox, type CheckboxBaseProps, type CheckboxProps } from './Checkbox';
export {
  CheckboxGroup,
  type CheckboxGroupBaseProps,
  type CheckboxGroupOrientation,
  type CheckboxGroupProps,
} from './CheckboxGroup';
```

In `packages/react/src/radio-group/index.ts` make one edit.

Replace:

```ts
export { Radio, type RadioProps } from './Radio';
export { RadioGroup, type RadioGroupProps } from './RadioGroup';
```

with:

```ts
export { Radio, type RadioBaseProps, type RadioProps } from './Radio';
export { RadioGroup, type RadioGroupBaseProps, type RadioGroupProps } from './RadioGroup';
```

In `packages/react/src/switch/index.ts` make one edit.

Replace:

```ts
export { Switch, type SwitchProps } from './Switch';
```

with:

```ts
export { Switch, type SwitchBaseProps, type SwitchProps } from './Switch';
```

In `packages/react/src/index.ts` make one edit.

Replace:

```ts
  type FieldErrorProps,
  type LabelProps,
} from './field';
export { Input, TextField, type InputProps, type TextFieldProps } from './text-field';
export { TextArea, type TextAreaProps } from './text-area';
export {
  Checkbox,
  CheckboxGroup,
  type CheckboxGroupOrientation,
  type CheckboxGroupProps,
  type CheckboxProps,
} from './checkbox';
export { Radio, RadioGroup, type RadioGroupProps, type RadioProps } from './radio-group';
export { Switch, type SwitchProps } from './switch';
export {
  SegmentedControl,
  SegmentedControlItem,
```

with:

```ts
  type FieldErrorProps,
  type LabelProps,
} from './field';
export {
  Input,
  TextField,
  type InputProps,
  type TextFieldBaseProps,
  type TextFieldProps,
} from './text-field';
export { TextArea, type TextAreaBaseProps, type TextAreaProps } from './text-area';
export {
  Checkbox,
  CheckboxGroup,
  type CheckboxBaseProps,
  type CheckboxGroupBaseProps,
  type CheckboxGroupOrientation,
  type CheckboxGroupProps,
  type CheckboxProps,
} from './checkbox';
export {
  Radio,
  RadioGroup,
  type RadioBaseProps,
  type RadioGroupBaseProps,
  type RadioGroupProps,
  type RadioProps,
} from './radio-group';
export { Switch, type SwitchBaseProps, type SwitchProps } from './switch';
export {
  SegmentedControl,
  SegmentedControlItem,
```

The stories. Each meta now takes the base props type, as `SegmentedControl.stories.tsx` does, and the renders that spread the story's args pass the name on.

In `packages/react/src/text-field/TextField.stories.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { TextField } from './TextField';

const NEAR_BUDGET = 'A shared space for the whole Northwind design team';
const OVER_BUDGET = 'A shared space for the whole Northwind design team and its guests';

const meta = {
  title: 'Components/TextField',
  component: TextField,
  args: { label: 'Workspace name', placeholder: 'Northwind Studio' },
  decorators: [
    (Story) => (
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { TextField, type TextFieldBaseProps } from './TextField';

const NEAR_BUDGET = 'A shared space for the whole Northwind design team';
const OVER_BUDGET = 'A shared space for the whole Northwind design team and its guests';

const meta = {
  title: 'Components/TextField',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: TextField as ComponentType<TextFieldBaseProps>,
  args: { label: 'Workspace name', placeholder: 'Northwind Studio' },
  decorators: [
    (Story) => (
```

Edit 2. Replace:

```tsx
      </div>
    ),
  ],
} satisfies Meta<typeof TextField>;

export default meta;
type Story = StoryObj<typeof meta>;
```

with:

```tsx
      </div>
    ),
  ],
} satisfies Meta<TextFieldBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;
```

In `packages/react/src/text-area/TextArea.stories.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { TextArea } from './TextArea';

/** The corner radius a token paints in the current shape, read by painting it. */
function tokenRadius(name: string): string {
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { TextArea, type TextAreaBaseProps } from './TextArea';

/** The corner radius a token paints in the current shape, read by painting it. */
function tokenRadius(name: string): string {
```

Edit 2. Replace:

```tsx
const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  args: { label: 'Short description', placeholder: 'A shared space for the Northwind design team' },
  decorators: [
    (Story) => (
```

with:

```tsx
const meta = {
  title: 'Components/TextArea',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: TextArea as ComponentType<TextAreaBaseProps>,
  args: { label: 'Short description', placeholder: 'A shared space for the Northwind design team' },
  decorators: [
    (Story) => (
```

Edit 3. Replace:

```tsx
      </div>
    ),
  ],
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;
```

with:

```tsx
      </div>
    ),
  ],
} satisfies Meta<TextAreaBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;
```

In `packages/react/src/checkbox/Checkbox.stories.tsx` make four edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { firstLineOffset, lineCount, paint, tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';

/** The row, the label's text box and the Changed chip of the checkbox whose field root is `field`. */
function parts(field: Element): { row: Element; box: Element; text: Element; chip: Element } {
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { firstLineOffset, lineCount, paint, tokenColor } from '../stories/paint';
import { Checkbox, type CheckboxBaseProps } from './Checkbox';

/** The row, the label's text box and the Changed chip of the checkbox whose field root is `field`. */
function parts(field: Element): { row: Element; box: Element; text: Element; chip: Element } {
```

Edit 2. Replace:

```tsx
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  args: { children: 'Remember me on this device' },
  decorators: [
    (Story) => (
```

with:

```tsx
const meta = {
  title: 'Components/Checkbox',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: Checkbox as ComponentType<CheckboxBaseProps>,
  args: { children: 'Remember me on this device' },
  decorators: [
    (Story) => (
```

Edit 3. Replace:

```tsx
      </div>
    ),
  ],
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;
```

with:

```tsx
      </div>
    ),
  ],
} satisfies Meta<CheckboxBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;
```

Edit 4. Replace:

```tsx
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Checkbox {...args} />
      <Checkbox {...args} description={undefined}>
        Weekly summary
        <br />
```

with:

```tsx
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Checkbox {...args}>{args.children}</Checkbox>
      <Checkbox {...args} description={undefined}>
        Weekly summary
        <br />
```

In `packages/react/src/checkbox/CheckboxGroup.stories.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';
import { CheckboxGroup } from './CheckboxGroup';

const meta = {
  title: 'Components/CheckboxGroup',
  component: CheckboxGroup,
  args: {
    label: 'Notify me by',
    children: [
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect } from 'storybook/test';
import { tokenColor } from '../stories/paint';
import { Checkbox } from './Checkbox';
import { CheckboxGroup, type CheckboxGroupBaseProps } from './CheckboxGroup';

const meta = {
  title: 'Components/CheckboxGroup',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: CheckboxGroup as ComponentType<CheckboxGroupBaseProps>,
  args: {
    label: 'Notify me by',
    children: [
```

Edit 2. Replace:

```tsx
      </div>
    ),
  ],
} satisfies Meta<typeof CheckboxGroup>;

export default meta;
type Story = StoryObj<typeof meta>;
```

with:

```tsx
      </div>
    ),
  ],
} satisfies Meta<CheckboxGroupBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;
```

In `packages/react/src/radio-group/RadioGroup.stories.tsx` make ten edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { firstLineOffset, lineCount, middleOf, tokenColor } from '../stories/paint';
import { Radio } from './Radio';
import { RadioGroup } from './RadioGroup';

/** The row, which is the label around a radio. */
function rowOf(radio: HTMLElement): HTMLElement {
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect } from 'storybook/test';
import { Link } from '../link/Link';
import { firstLineOffset, lineCount, middleOf, tokenColor } from '../stories/paint';
import { Radio } from './Radio';
import { RadioGroup, type RadioGroupBaseProps } from './RadioGroup';

/** The row, which is the label around a radio. */
function rowOf(radio: HTMLElement): HTMLElement {
```

Edit 2. Replace:

```tsx
const meta = {
  title: 'Components/RadioGroup',
  component: RadioGroup,
  args: { label: 'Newsletter frequency' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
      <Radio value="never">Never</Radio>
```

with:

```tsx
const meta = {
  title: 'Components/RadioGroup',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: RadioGroup as ComponentType<RadioGroupBaseProps>,
  args: { label: 'Newsletter frequency' },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="weekly">Weekly</Radio>
      <Radio value="monthly">Monthly</Radio>
      <Radio value="never">Never</Radio>
```

Edit 3. Replace:

```tsx
      </div>
    ),
  ],
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof meta>;
```

with:

```tsx
      </div>
    ),
  ],
} satisfies Meta<RadioGroupBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;
```

Edit 4. Replace:

```tsx
export const WithDescriptions: Story = {
  args: { description: 'You can change this at any time.', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
```

with:

```tsx
export const WithDescriptions: Story = {
  args: { description: 'You can change this at any time.', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
```

Edit 5. Replace:

```tsx
export const HorizontalHints: Story = {
  args: { orientation: 'horizontal', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
```

with:

```tsx
export const HorizontalHints: Story = {
  args: { orientation: 'horizontal', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="weekly" description="Every Tuesday morning.">
        Weekly
      </Radio>
```

Edit 6. Replace:

```tsx
export const DisabledItem: Story = {
  args: { label: 'Plan', defaultValue: 'free' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="free">Free</Radio>
      <Radio value="team" isDisabled>
        Team
```

with:

```tsx
export const DisabledItem: Story = {
  args: { label: 'Plan', defaultValue: 'free' },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="free">Free</Radio>
      <Radio value="team" isDisabled>
        Team
```

Edit 7. Replace:

```tsx
    defaultValue: 'weekly',
  },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" description="A summary of everything that happened, every Tuesday morning.">
        A weekly summary of every workspace, project and invite you belong to
      </Radio>
```

with:

```tsx
    defaultValue: 'weekly',
  },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="weekly" description="A summary of everything that happened, every Tuesday morning.">
        A weekly summary of every workspace, project and invite you belong to
      </Radio>
```

Edit 8. Replace:

```tsx
export const LongWord: Story = {
  args: { defaultValue: 'long' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="long">
        Antidisestablishmentarianismantidisestablishmentarianismantidisestablishmentarianism
      </Radio>
```

with:

```tsx
export const LongWord: Story = {
  args: { defaultValue: 'long' },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="long">
        Antidisestablishmentarianismantidisestablishmentarianismantidisestablishmentarianism
      </Radio>
```

Edit 9. Replace:

```tsx
export const Labelless: Story = {
  args: { orientation: 'horizontal', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly" aria-label="Weekly" />
      <Radio value="monthly" aria-label="Monthly" />
      <Radio value="never" aria-label="Never" />
```

with:

```tsx
export const Labelless: Story = {
  args: { orientation: 'horizontal', defaultValue: 'weekly' },
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="weekly" aria-label="Weekly" />
      <Radio value="monthly" aria-label="Monthly" />
      <Radio value="never" aria-label="Never" />
```

Edit 10. Replace:

```tsx
export const LinkInLabel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <RadioGroup {...args}>
      <Radio value="weekly">
        Weekly, like the <Link href="#sample">sample issue</Link>
      </Radio>
```

with:

```tsx
export const LinkInLabel: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <RadioGroup {...args} label={args.label}>
      <Radio value="weekly">
        Weekly, like the <Link href="#sample">sample issue</Link>
      </Radio>
```

In `packages/react/src/switch/Switch.stories.tsx` make four edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Link } from '../link';
import { firstLineOffset, lineCount, tokenColor } from '../stories/paint';
import { Switch } from './Switch';

/** The row, the track and the thumb of the first switch drawn inside `scope`. */
function parts(scope: Element): { row: Element; track: Element; thumb: Element } {
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ComponentType } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Link } from '../link';
import { firstLineOffset, lineCount, tokenColor } from '../stories/paint';
import { Switch, type SwitchBaseProps } from './Switch';

/** The row, the track and the thumb of the first switch drawn inside `scope`. */
function parts(scope: Element): { row: Element; track: Element; thumb: Element } {
```

Edit 2. Replace:

```tsx
const meta = {
  title: 'Components/Switch',
  component: Switch,
  args: { children: 'Weekly digest' },
  decorators: [
    (Story) => (
```

with:

```tsx
const meta = {
  title: 'Components/Switch',
  // The component's props are a union, since it needs a name, and Storybook cannot narrow a union.
  // The stories are written against the props every member shares.
  component: Switch as ComponentType<SwitchBaseProps>,
  args: { children: 'Weekly digest' },
  decorators: [
    (Story) => (
```

Edit 3. Replace:

```tsx
      </div>
    ),
  ],
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;
```

with:

```tsx
      </div>
    ),
  ],
} satisfies Meta<SwitchBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;
```

Edit 4. Replace:

```tsx
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Switch {...args} />
      <Switch {...args} description={undefined}>
        Weekly digest
        <br />
```

with:

```tsx
  },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Switch {...args}>{args.children}</Switch>
      <Switch {...args} description={undefined}>
        Weekly digest
        <br />
```

The docs pages.

In `apps/docs/content/docs/components/text-field.mdx` make one edit.

Replace:

````markdown
}
```

For a custom layout, use the parts inside React Aria's own field: Label, Input, Description and FieldError. Field parts has the example. For text that runs to several lines, use [Text area](/docs/components/text-area), which takes the same props.

</Section>
````

with:

````markdown
}
```

A field needs a name, and the types require one: a `label`, or an `aria-label` or `aria-labelledby` when the name is shown elsewhere.

For a custom layout, use the parts inside React Aria's own field: Label, Input, Description and FieldError. Field parts has the example. For text that runs to several lines, use [Text area](/docs/components/text-area), which takes the same props.

</Section>
````

In `apps/docs/content/docs/components/text-area.mdx` make one edit.

Replace:

````markdown
}
```

For a custom layout, use the parts inside React Aria's own TextField: Label, Description and FieldError from Snapshot UI, and React Aria's TextArea with the classes `input textarea`. There is no bare textarea part, because the pair of classes is all it adds. [Field parts](/docs/components/field) has the layout.

</Section>
````

with:

````markdown
}
```

A field needs a name, and the types require one: a `label`, or an `aria-label` or `aria-labelledby` when the name is shown elsewhere.

For a custom layout, use the parts inside React Aria's own TextField: Label, Description and FieldError from Snapshot UI, and React Aria's TextArea with the classes `input textarea`. There is no bare textarea part, because the pair of classes is all it adds. [Field parts](/docs/components/field) has the layout.

</Section>
````

In `apps/docs/content/docs/components/checkbox.mdx` make one edit.

Replace:

````markdown
}
```

</Section>

<Section>
````

with:

````markdown
}
```

The types require a name. A checkbox takes its text, an `aria-label` or an `aria-labelledby`, and a group takes a `label`, an `aria-label` or an `aria-labelledby`.

</Section>

<Section>
````

In `apps/docs/content/docs/components/radio-group.mdx` make one edit.

Replace:

````markdown
}
```

For a choice of two with the same weight, such as a setting that is simply on or off, use a switch instead. For a choice that changes the view in place, such as a mode, use a segmented control.

</Section>
````

with:

````markdown
}
```

The types require a name. A group takes a `label`, an `aria-label` or an `aria-labelledby`, and a `Radio` takes its text, an `aria-label` or an `aria-labelledby`.

For a choice of two with the same weight, such as a setting that is simply on or off, use a switch instead. For a choice that changes the view in place, such as a mode, use a segmented control.

</Section>
````

In `apps/docs/content/docs/components/switch.mdx` make one edit.

Replace:

````markdown
## Usage

Every value works controlled and uncontrolled, and a switch with a `name` submits in a plain form. It sends its `value`, or `on` when it has none, only while it is on, as a checkbox does. `onChange` receives a boolean. A switch with no visible label needs an `aria-label`.

```tsx
import { useState } from 'react';
````

with:

````markdown
## Usage

Every value works controlled and uncontrolled, and a switch with a `name` submits in a plain form. It sends its `value`, or `on` when it has none, only while it is on, as a checkbox does. `onChange` receives a boolean. The types require a name: the switch's text, an `aria-label` or an `aria-labelledby`.

```tsx
import { useState } from 'react';
````

In `apps/docs/content/docs/components/segmented-control.mdx` make one edit.

Replace:

````markdown
}
```

Without a visible label, name the control with `aria-label`, as a toolbar's switch is named by what it sits beside. One of the two is required.

</Section>
````

with:

````markdown
}
```

Without a visible label, name the control with `aria-label` or `aria-labelledby`, as a toolbar's switch is named by what it sits beside. The types require one of the three. An option always takes `children`, and an option that shows only an icon passes the icon there and adds an `aria-label`.

</Section>
````

The record. In `docs/design-system.md` make one edit.

Replace:

```markdown
- **Minimum sizes:** 14px for sentences, 12px for short uppercase labels.
- **Touch targets stay at 40px.** A control drawn smaller extends its hit area
  with a pseudo-element, as the app's menu row buttons do.
- **A state that only a fill carries is also drawn in forced colors.** Windows
  high contrast repaints every background with the reader's canvas, and it
  draws a border and an outline in the reader's text color. A state that a
```

with:

```markdown
- **Minimum sizes:** 14px for sentences, 12px for short uppercase labels.
- **Touch targets stay at 40px.** A control drawn smaller extends its hit area
  with a pseudo-element, as the app's menu row buttons do.
- **A field's props require an accessible name.** A field is named by a
  visible `label`, or by its text as `children` where it has no `label` prop
  (Checkbox, Switch and Radio), or by an `aria-label` or an `aria-labelledby`.
  IconButton has no text of its own and takes the last two. A segmented option
  is the exception: it draws its `children`, which stay required, and an
  `aria-label` is an extra for an option that shows only an icon. The types
  require a name, so code that names nothing does not compile. Every component
  states the rule through one shared type. A union cannot be extended, so each
  field also exports its base props type (`TextFieldBaseProps` and so on) for
  a wrapper to extend or `Omit`.
- **A state that only a fill carries is also drawn in forced colors.** Windows
  high contrast repaints every background with the reader's canvas, and it
  draws a border and an outline in the reader's text color. A state that a
```

The changeset. `.changeset/field-names.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Breaking type change: every field's props now require an accessible name. TextField, TextArea, CheckboxGroup and RadioGroup need a `label`, an `aria-label` or an `aria-labelledby`, and Checkbox, Switch and Radio need their text as `children`, an `aria-label` or an `aria-labelledby`, as SegmentedControl and IconButton already did. SegmentedControlItem keeps `children` required. Code that renders a field with no visible label, `aria-label` or `aria-labelledby` stops compiling. Nothing changes at run time. Because those props types are now unions, which cannot be extended, each of these fields also exports its base props type, such as `TextFieldBaseProps`, for code that extends or omits from them.
```

Run `pnpm exec changeset status --verbose`. Expected: both packages are listed under `minor` with this changeset, `checkbox-changed.md` and `disabled-labels.md`, and nothing under `major`.

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/react typecheck
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark
```

Expected: the typecheck prints no error and exits 0. React: `Tests  632 passed | 4 expected fail (636)` in 38 files. Storybook: `Test Files  38 passed (38)` and `Tests  364 passed (364)`, the same as before.

Then prove that the typecheck catches a regression. In `packages/react/src/text-field/TextField.tsx` take the rule off the props type, and nothing else:

```ts
export type TextFieldProps = TextFieldBaseProps;
```

Run `pnpm --filter @snapshot-ui/react typecheck`. Expected: it FAILS with exactly these two lines, because the field no longer requires a name:

```text
src/text-field/TextField.test.tsx(34,5): error TS2578: Unused '@ts-expect-error' directive.
src/text-field/TextField.test.tsx(36,5): error TS2578: Unused '@ts-expect-error' directive.
```

Put `& AccessibleName<'label'>` back and run it again: it passes. The same check on each of the other seven unions fails in that component's own test file.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/react size
pnpm verify
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:
- `pnpm format` changes no file. `pnpm format:check` prints `All matched files use Prettier code style!`.
- Core: no test is added, so `Tests  302 passed (302)` in 5 files, as before. React: the 8 tests this task adds, so `Tests  632 passed | 4 expected fail (636)` in 38 files (624 before). Storybook: no story is added, so `Tests  364 passed (364)` in 38 files, as before.
- Turborepo reports 10 successful tasks for the first run, 4 for the second and 5 for the third. The `size` output is the same as after Task 2 in all 22 entries: `Checkbox` reads `602 B`, and no entry moves, because the shared type ships no code.
- `pnpm verify` exits 0. The first line is `check:public: no private names in 310 files` (or the no-file message on a machine without `.local`). Root tests: `tests 20`, `pass 20`. Turborepo reports 18 successful tasks.
- The port check prints nothing, and the e2e run ends `158 passed`, the same as before, since this task adds no end-to-end test. If another checkout is using port 3100, run it as `DOCS_E2E_PORT=3503 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.

Then check that the props tables still list every prop. Start the docs server that the build made, count each page's rows, and stop the server. If you used `DOCS_E2E_PORT` above, use that port here:

```bash
(cd apps/docs && node node_modules/next/dist/bin/next start -p 3100 -H 127.0.0.1 > /dev/null 2>&1 &)
sleep 4
for page in text-field text-area checkbox radio-group switch segmented-control icon-button; do
  echo "$page $(curl -s http://127.0.0.1:3100/docs/components/$page | grep -o '<tr class="prop"' | wc -l | tr -d ' ')"
done
kill $(lsof -nP -tiTCP:3100 -sTCP:LISTEN)
```

Expected, the same counts as before this task: `text-field 18`, `text-area 19`, `checkbox 31`, `radio-group 20`, `switch 11`, `segmented-control 20` and `icon-button 5`. Each is the length of the page's `Pick` lists. The `label` and `children` rows read "Required unless the field has an `aria-label` or an `aria-labelledby`", worded for the component.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: nothing. No baseline is added or changes, and the step is run to prove it. This was checked before the step was written, in local Chromium and not the Docker image, by taking every visual story (150) in all five modes (750 images) after this change and comparing them byte for byte with the 750 taken at Task 2's commit: all 750 are identical. The six story files changed only their types and the way their renders pass the name, so what they draw is what they drew.

- [ ] **Step 7: Commit**

```bash
git add .changeset/field-names.md apps/docs/content/docs/components/checkbox.mdx apps/docs/content/docs/components/radio-group.mdx apps/docs/content/docs/components/segmented-control.mdx apps/docs/content/docs/components/switch.mdx apps/docs/content/docs/components/text-area.mdx apps/docs/content/docs/components/text-field.mdx docs/design-system.md packages/react/src/checkbox/Checkbox.stories.tsx packages/react/src/checkbox/Checkbox.test.tsx packages/react/src/checkbox/Checkbox.tsx packages/react/src/checkbox/CheckboxGroup.stories.tsx packages/react/src/checkbox/CheckboxGroup.test.tsx packages/react/src/checkbox/CheckboxGroup.tsx packages/react/src/checkbox/index.ts packages/react/src/icon-button/IconButton.tsx packages/react/src/index.ts packages/react/src/radio-group/Radio.test.tsx packages/react/src/radio-group/Radio.tsx packages/react/src/radio-group/RadioGroup.stories.tsx packages/react/src/radio-group/RadioGroup.test.tsx packages/react/src/radio-group/RadioGroup.tsx packages/react/src/radio-group/index.ts packages/react/src/segmented-control/SegmentedControl.tsx packages/react/src/segmented-control/SegmentedControlItem.test.tsx packages/react/src/segmented-control/SegmentedControlItem.tsx packages/react/src/switch/Switch.stories.tsx packages/react/src/switch/Switch.test.tsx packages/react/src/switch/Switch.tsx packages/react/src/switch/index.ts packages/react/src/text-area/TextArea.stories.tsx packages/react/src/text-area/TextArea.test.tsx packages/react/src/text-area/TextArea.tsx packages/react/src/text-area/index.ts packages/react/src/text-field/TextField.stories.tsx packages/react/src/text-field/TextField.test.tsx packages/react/src/text-field/TextField.tsx packages/react/src/text-field/index.ts packages/react/src/utils/accessible-name.ts
git commit -m "feat!: require an accessible name in every field's props"
```


### Task 4: CollapsibleCard

**Files:**
- Create: `packages/react/src/collapsible-card/CollapsibleCard.tsx`, `packages/react/src/collapsible-card/useFolding.ts`, `packages/react/src/collapsible-card/index.ts`
- Modify: `packages/react/src/index.ts`, `packages/react/.size-limit.json`
- Test: `packages/react/src/collapsible-card/CollapsibleCard.test.tsx` (create), `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/collapsible-card/CollapsibleCard.stories.tsx` (create), `packages/react/src/rtl/RightToLeft.stories.tsx`
- Modify: `packages/core/src/components/card.css`
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/content/docs/components/collapsible-card.mdx`, `apps/docs/examples/collapsible-card-actions.tsx`, `apps/docs/examples/collapsible-card-basic.tsx`
- Modify: `apps/docs/content/docs/components/meta.json`, `apps/docs/examples/index.ts`, `apps/docs/app/(home)/home-page.tsx` (one link in the footer's Components column), `apps/docs/components/shell/rail.tsx` (the search button's name)
- Test: `apps/docs/tests/components.spec.ts`, `apps/docs/tests/docs.spec.ts`, `apps/docs/tests/support.ts`
- Modify: `packages/core/README.md`, `packages/react/README.md` (one line each in the component list)
- Modify: `docs/design-system.md` (a `## CollapsibleCard` section appended to Appendix B, after the file's last line, which is not touched)
- Create: `.changeset/collapsible-card.md`
- Create (Docker step): 30 baselines, `apps/storybook/tests/visual/__screenshots__/components-collapsiblecard--*.png`. None changes.

**Interfaces:**
- Consumes:
  - From `react-aria-components` 1.22.1: `Disclosure`, `DisclosurePanel` and `Button` with `slot="trigger"`. `Disclosure` renders a div with `data-expanded` while open, takes `isExpanded` and `onExpandedChange`, and gives the trigger `aria-expanded`, `aria-controls` and its press handlers. `DisclosurePanel` is a `role="group"` named by the trigger. In a layout effect it sets `hidden="until-found"` and `aria-hidden="true"` on a folded panel once `panel.getAnimations()` (the panel's own, not its subtree's) have all finished, and removes `hidden` on an open one at once. Its `beforematch` listener opens a folded panel when find-in-page reaches it.
  - From `lucide-react`: `ChevronDown`, which renders `<svg class="lucide lucide-chevron-down ...">` with `stroke="currentColor"`.
  - `cx` and `present` from `packages/react/src/utils/`.
  - Card's classes and rules in `card.css` (`card`, `card-header`, `card-title`, `card-note`, `card-body`, the nested corner step and `overflow-wrap: anywhere`), and the tokens `--spacing-part`, `--spacing-peer`, `--radius-micro`, `--color-slate`, `--color-ink` and `--focus-ring-*`. No token is added or changed.
  - Test helpers: `expectNoA11yViolations` and `root` from `packages/react/test/`; `lineCount` and `tokenPixels` from `packages/react/src/stories/paint.ts`; `Rtl`, `find`, `rect`, `lastText`, `expectSameEdge` and `expectInside` in the right-to-left stories; `read`, `stripComments`, `closeUp`, `blockAfter` and `FORCED_COLORS` in `css.test.js`; `CONTRAST_PAIRS` and `TEXT` in `contrast.test.js`; `visit`, `axeViolations` and the `LONG_TARGETS` and `SERVER_RENDERED` maps in the docs tests.
- Produces in `packages/react/src/collapsible-card/CollapsibleCard.tsx`, a client module (`'use client'`), exported from `@snapshot-ui/react`:

```ts
export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  title: ReactNode; // required: the toggle's text and its accessible name
  level?: 1 | 2 | 3 | 4; // default 2, the heading element; the look is the same
  note?: ReactNode;
  actions?: ReactNode;
  defaultExpanded?: boolean; // default true
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  as?: 'div' | 'section' | 'article'; // default 'div'
  ref?: Ref<HTMLElement>; // the root
  children?: ReactNode; // the body
}
export function CollapsibleCard(props: CollapsibleCardProps): ReactElement;
```

- Produces two internal seams in the same file, not exported:
  - `useExpanded(isExpanded, defaultExpanded, onExpandedChange): [isExpanded: boolean, setExpanded: (isExpanded: boolean) => void]`, the one place the state is decided. Task 5 adds `storageKey` here, and Task 6 opens the card through `setExpanded(true)`.
  - `CardToggle({ title, level })`, the one place the toggle is built. Task 6 adds the folded marker's description here.
- Produces `useFolding(foldRef: RefObject<HTMLElement | null>, isExpanded: boolean): void` in `packages/react/src/collapsible-card/useFolding.ts`, internal. It sets `data-folding` on the root, the fold's grandparent (`fold.parentElement.parentElement`).
- Produces this markup:
  - The root is the element `as` picks, with the classes `card card-collapsible` and then `className`, `data-expanded=""` while open, `data-folding=""` while the fold moves, the ref and every other attribute.
  - In it, React Aria's disclosure, `div.card-disclosure`, which draws nothing.
  - In that, `div.card-header` holding `h{level}.card-title`, which holds `button.card-toggle` (`span.card-toggle-text` with the title, then the chevron `svg.card-chevron`, `aria-hidden="true"`); then `p.card-note` when `note` draws something; then `div.card-actions` when `actions` draws something.
  - Then `div.card-fold`, React Aria's panel, holding `div.card-body` with the children.
- Produces in `card.css` the classes `card-collapsible`, `card-disclosure`, `card-toggle`, `card-toggle-text`, `card-chevron`, `card-actions` and `card-fold`, none with a Tailwind namespace; the custom property `--card-chevron-turn`, which `:where([dir='ltr' i])` sets to `90deg` and `:where([dir='rtl' i])` to `-90deg`; and the size container `card-header` on the collapsible card's header, which `@container card-header (width < 18rem)` queries.
- Produces the tests: 14 core tests in a new describe `src/components/card.css, the collapsible card` and 1 in a new describe `the collapsible card` in `contrast.test.js`; 26 React tests in `CollapsibleCard.test.tsx` and 1 row in `server-render.test.tsx`; 8 stories (`Open`, `Folded`, `WithActions`, `Nested`, `LongTitle`, `ActionsPlacement`, `KeyboardFocus` and `OverflowingChild`, of which `ActionsPlacement` and `OverflowingChild` are `no-visual`) and `Checks/Right to left` `CollapsibleCardMirrored`; 3 docs end-to-end tests (axe at 1440px in light and dark, and the fold on the real page), plus the page's 4 tests in the existing loops.
- Produces in `apps/docs/tests/support.ts`: `axeViolations` now turns on axe's `label-content-name-mismatch` for every docs axe check.

**What this task decides** (the parts about the look are also in the Appendix B text of Step 3):
- **Step 0: the fold is the source app's grid row without its visibility step, and React Aria's `hidden="until-found"` hides a folded body.**
  - Two mechanisms were built in throwaway pages against React Aria 1.22.1's `DisclosurePanel`, with a 200ms transition, and run in Playwright's Chromium 156, Firefox 153 and WebKit 27.2: the grid row (a `display: grid` panel with one `minmax(0, 1fr)` column whose `grid-template-rows` moves between `1fr` and `0fr`, a body with `min-height: 0` that clips while folded or folding, a `visibility` step, the header spacing folding with it, and `data-folding` from `getAnimations()`), and React Aria's `--disclosure-panel-height` (the panel's `height` read from it, clipping while folded or folding). Each card held a body of about 147px, an inner button, a word to search for and an absolutely positioned popup hanging about 127px below the card. Every frame of a fold and of an open was sampled.
  - Both moved smoothly both ways with no flash: the first frame of an open is at 0, and the text stays visible while it moves. The grid row drew 8 frames between the ends in Chromium and WebKit and 15 or 16 in Firefox, each way and never backwards. Under reduced motion React Aria's height moved in one jump, with no transition running, and so did the grid row once its reduced-motion rule beat every rule that sets a transition: on the first grid pages a rule that set one won, by weight or by order, so the component's reduced-motion block repeats each moving rule's own selector, after it, as a core test requires. Both took the folded body out of the accessibility tree. Tab skipped it in Chromium and Firefox. WebKit's Tab does not stop on buttons by default, so there the grid row's folded button, and later the component's, were checked to refuse `focus()`.
  - React Aria's height failed the popup in all three. It sets the height from `scrollHeight`, which counts an absolutely positioned child, so in Chromium the 147px body first jumped to 307px and folded from there, and opened to 306px before it snapped back to 147px. Firefox and WebKit did the same. Review Focus 2 makes a popup in a card a case that must work.
  - The grid row with the visibility step failed find-in-page in all three: `window.find()` returned false and a text fragment link (`#:~:text=`) did nothing, because text that `visibility` hides is not searchable.
  - The grid row without the visibility step passed everything. React Aria's `hidden="until-found"`, set once the panel's own transition has finished, is what takes a folded body out of the tab order and the accessibility tree, and it leaves the text to find-in-page: a text fragment link opened the folded card in Chromium and WebKit, `window.find()` did in Firefox (Chromium's and WebKit's `window.find()` find the text and do not open it), and each time `onExpandedChange` was called with `true`.
  - The panel is the grid itself, so React Aria's `getAnimations()` sees the fold's transition and waits for it before hiding the panel. On a separate inner element the panel would have no transition of its own and would hide at once. The grid is drawn only while the panel has no `hidden` attribute (`.card-fold:not([hidden])`), so a browser without `until-found` falls back to the `display: none` that `hidden` gives: a `display` on the panel would override it. That browser opens without a transition, since the panel comes from `display: none`, and folds with one. This last part is reasoned and not measured: all three browsers here have `until-found`.
  - The real component was run through the same checks in all three browsers before the commit, and passed every one. `data-folding` came off 203 to 219ms after a toggle.
- **The root is the element `as` picks, and React Aria's disclosure is a div inside it.**
  - `Disclosure` always renders a div. Its `render` prop must return a div, and React Aria warns in development when it does not. It passes on only global attributes, so an `aria-labelledby` given to it is dropped.
  - So the root is the card's own element, which takes `className`, `ref` and every attribute as Card's root does, and `div.card-disclosure` sits inside it and draws nothing. The root's `data-expanded` comes from the same state the disclosure is given. Every rule reaches the header and the fold through `.card-disclosure`, and every state rule does so with child combinators from the root, so a card nested in the body keeps its own state and look.
  - `className` is a string, not a render function, since the root is not a React Aria element.
- **One place decides the state, and one builds the toggle.** `useExpanded` returns the controlled `isExpanded` when it is given and the card's own state otherwise, and its setter always calls `onExpandedChange`. The disclosure is always given the result, so React Aria never holds a state of its own. `CardToggle` renders the heading, the button, the title text and the chevron, and nothing else describes the toggle yet: its name is the title and its state is `aria-expanded`.
- **`data-folding` is set straight on the root, as `useStacking` sets `data-stacked`.**
  - React never renders the attribute, so the two never disagree. It is set in a layout effect, so it is there on the first frame of an open, when the body must clip. The effect runs after React Aria's own layout effect, since a child's effects run first, so `getAnimations()` sees the transition the render started. `getAnimations()` brings styles up to date, as React Aria relies on too.
  - Each toggle is a turn. A toggle while the fold still moves replaces the transition, the replaced one's `finished` rejects late, and `Promise.allSettled` with the turn number keeps that from taking the mark off the newer fold. A test cancels a transition the way the browser does and checks it. With nothing running, or with no Web Animations API, as in jsdom, the mark comes off at once.
  - The effect compares the state with the last one it saw, so Strict Mode's second run of an effect is not taken for a move, and the first render marks nothing.
- **The toggle is 40px by padding, a negative margin and a minimum height.** Padding of half of what 40px has over the title's 28.8px line, an equal negative margin, so the header is as tall as a plain card's, and `min-height: 40px`, because the padded row measured 39.98px in Chromium: the layout rounds 28.8px and 5.6px down to 64ths of a pixel. A title that wraps keeps its own height. A minimum height alone would not do: a two-line title would then be shorter than its text by the margins.
- **The header is a grid, and the note always sits directly under the title.**
  - Row 1 is the title, which holds the toggle, in a `minmax(0, 1fr)` column, and the actions in an `auto` column at the row's end. Row 2 is the note, under the title's column, 8px down, as in a card. The 24px between the title and the actions is the actions' `margin-inline-start` and the column gap is 0, so with no actions the empty column has no width and the toggle spans the row. With no note there is no row 2.
  - A flex row that wrapped was built first, with the note on a line of its own through `order: 1`, and on a narrow card it put the actions between the title and the note. The note describes the title, so it stays under it.
- **Below 18rem the actions move under the note, through a container query on the header.**
  - The header is a size container, `container: card-header / inline-size`, and `@container card-header (width < 18rem)` moves the actions to an automatic row in the first column, under the note, at the row's start, with no margin. They wrap there if they must. The order on screen is then title, note, actions, which is the order in the page and the order a screen reader reads.
  - The breakpoint is measured in Storybook's Chromium with Sofia Sans: "Notifications" is 129px, so with the 8px gap and the 24px chevron its toggle needs 161px, and with the 24px margin and a tertiary Reset button (87px) the row needs 272px. A short title with two short buttons ("Billing", Edit and Undo) needs 284px. A card on a 390px phone with 16px gutters has 292px inside its padding, so both share the row there, with room to spare for a wider fallback face. On a 320px screen (222px) or in the stories' 375px frame (261px) the actions move under the note. Two buttons beside "Notifications" need 355px, so above 18rem such a title wraps beside them, and a word too long for the room left breaks. `ActionsPlacement` pins both sides of the breakpoint with cards 358px and 288px wide.
  - The query is width only, so the header switches at one width whatever the actions hold. A breakpoint per number of actions would need `:has()` on the children, and a wrapper element around several buttons would defeat it.
  - Container queries are inside the browser floor: Chrome 105, Safari 16 and Firefox 110 have size queries, and the floor is Chrome 111, Safari 16.4 and Firefox 128. Lightning CSS, with the build's targets, emits the `@container` rule as written, range syntax included, and the Stylelint config has no rule against it. No fallback order was needed.
  - The container is the header and not the root, because a size container does not take its width from its content. Measured in Chromium with a card in a centred flex column, a title of 37 characters and a two-word body: 466px wide with no container, 66px, its padding alone, with the root as the container, and 147px with the header as the container, the body's width, with the title wrapped to fit. So a card placed where it takes its width from what it holds takes it from the body, and every story and docs example gives its card a width. A header that is a size container is also a containing block for a fixed-position element inside it; React Aria's overlays render in a portal and are not affected.
  - Checked in Chromium, Firefox and WebKit, left to right and right to left, with cards 358px and 288px wide: on the title's row at its end in the first, under the note at its start in the second, the note under the title, the toggle 40px tall and no overflow.
- **The chevron sits level with the first line of a title that wraps, and the header's first row centres its items.**
  - In the toggle the chevron takes a block margin of half of what the title's line has over it, 2.4px, as the checkbox's box does, so it stays beside the words a reader starts with. For one line that is where centring put it: the one-line story images in local Chromium were byte for byte the same before and after the change, and only `LongTitle` moved. The `LongTitle` story asserts the chevron within 1px of the first line.
  - The header's grid centres its items, so a one-line title and a 40px action share a middle. Beside a title that wraps, the action is centred on the title's lines while the chevron stays on the first: actions of any height cannot be set on a first line without a negative margin that would overlap the toggle's hit area.
- **The chevron turns by a custom property that each `dir` attribute sets.** CSS has no rotation that follows the direction. `:dir()` is past the browser floor (Chrome 120 and later), and Lightning CSS, with the build's targets, compiles `.a:dir(rtl) .b` to `.a:is(:lang(ae), :lang(ar), ...) .b`, even inside `@supports selector(:dir(rtl))`, which ignores `dir` in every browser. A custom property on `[dir]` inherits, so the nearest `dir` decides, as it does for the layout, an `ltr` part inside an `rtl` page included. With no `dir` anywhere the fallback is `90deg`. The card never sets the property itself, which would stop it inheriting, and a core test says so.
- **A press shows the hover look.** The spec names hover. Every control in the library shows its hover look on a press as well, because touch has no hover, so the toggle does too.
- **Forced colors need one block, for the chevron.** With forced colors emulated in Chromium the title took the reader's text color and the chevron stayed slate, `rgb(105, 105, 105)`: an svg keeps a color its author set. The block gives the chevron `color: inherit`, the toggle's color, at rest, hovered and pressed, and its selector weighs as much as the hover and press rules and comes after them. Measured after it: the chevron is the text color in a light and in a dark forced palette, hovered too, and the focus ring is drawn. No system color is written, so the system color test has nothing to find.
- **The body clips with `overflow: hidden`, keyed only on folded or folding.** A core test lists every `overflow` declaration in `card.css` and finds that one.
- **jsdom cannot show the tab order of a folded body.** It does not hide `hidden="until-found"` from the keyboard, so the unit test checks the attribute, `aria-hidden` and the accessibility tree, and the docs end-to-end test checks in Chromium that Tab skips a folded body. Step 0 checked it in all three browsers.
- **The right-to-left check is a `no-visual` story in `RightToLeft.stories.tsx`.** The spec lists a right-to-left baseline. That file keeps Arabic out of the baselines, since a baseline of Arabic text depends on the font a machine falls back to, and its stories assert positions instead. `CollapsibleCardMirrored` asserts the title from the right, the chevron at the left end of the toggle, the actions at the left end of the row, nothing outside the card, a folded chevron turned `-90deg`, and, in a 288px card, the actions under the note and starting at the right. The `Folded` story asserts `90deg` in left to right.
- **`OverflowingChild` is a `no-visual` story.** It pins Review Focus 2 in a real browser: a popup below an open card is hit there, and still is once a fold and an unfold have settled and `data-folding` is off. It has to press the toggle, and a play function that presses would put a hover look in a baseline.
- **The docs rail's search button is named by its own text.**
  - Its `aria-label` said "Search docs" while the button showed "Search docs" and the key, and axe's `label-content-name-mismatch` fails a name that does not hold the visible text. In a scratch page with axe 4.13, `aria-hidden` on the key did not help, since axe reads what is visible and not what is announced. With no `aria-label` the name is the content, "Search docs ⌘K", which holds the visible text, and the rule has nothing to check. In the collapsed rail the words are visually hidden and the key is not drawn, so the name is "Search docs". The tests that find the button by the name "Search docs" still find it.
  - The docs run axe 4.13, where the rule is experimental and off, which is why the end-to-end suite never saw it. The packages' own tests run 4.14, where it is on. So `axeViolations` turns it on for every docs axe check, and two new tests run axe at 1440px in light and dark. Before the fix, 35 axe checks failed on `.rail-search`, every one on a page that shows the rail. The homepage has no rail and passes either way.
- **The docs page is titled "Collapsible card"**, in sentence case as "Icon button" and "Text field" are. The homepage footer and the two package READMEs list every component page by that title, and their tests read the rail's list, so each gains one line.
- **Docs examples.** `collapsible-card-basic` is a server file, an open card with a button in its body and a folded one, so the page shows a client component rendered by a server component, and the end-to-end test has a body to Tab into. `collapsible-card-actions` is a client file whose Reset button resets two switches and stays in the header while the card is folded.
- **The server render test gains a row.** It renders the card in Node with no window, as a server page does, and finds the root, `data-expanded`, the toggle, the note, the fold and the body.
- **No contrast pair is added.** The chevron is slate at rest and ink hovered or pressed, both on the card's Lifted ground: 5.31 and 17.84 in light, 6.94 and 17.42 in dark, measured with `packages/core/scripts/contrast.js`. Both are gated already as text on Lifted at 4.5:1, over the 3:1 an icon needs, and a test says so.
- **Nothing that was drawn moves.** The 25 Card baselines (5 visual stories in 5 modes), taken in local Chromium before and after this change, are identical, and a core test fails any new rule that does not name a part only the collapsible card has. On the docs site the rail gains a "Collapsible card" link after Checkbox, which moves the links below it down one row on every page, and the homepage footer gains the same link.
- **A throwaway axe run** of the Collapsible card, Card, Switch and home pages at 320, 375, 768, 1024 and 1440px, in light and dark, with `label-content-name-mismatch` on, found no violation and no sideways scroll.
- **Size.** The `CollapsibleCard` entry is 714 B with React Aria and Lucide left out. The limit is 1.5 kB by the plan's rule: round up to the next half kilobyte, then add half a kilobyte.

- [ ] **Step 1: Write the failing tests**

The core tests first. A new describe goes after the one for `src/components/card.css`.

In `packages/core/test/css.test.js` make one edit.

Replace:

```js
  });
});

describe('src/components/segmented.css', () => {
  // The rules without their comments, which quote selectors of their own.
  // Closed up, so a selector Prettier breaks over lines is found as one.
```

with:

```js
  });
});

describe('src/components/card.css, the collapsible card', () => {
  // The rules without their comments, with their whitespace closed up.
  const rules = () => closeUp(stripComments(read('src/components/card.css')));
  /** Every rule that holds declarations, as its selector and its declarations, media blocks included. */
  const all = () =>
    [...rules().matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector = '', body = '']) => ({
      selector: selector.trim(),
      body: body.trim(),
    }));
  /** A part only the collapsible card draws, or the dir attribute its chevron reads. */
  const COLLAPSIBLE = /card-(?:collapsible|disclosure|toggle|chevron|actions|fold)|\[dir=/;
  /** The rules a plain card is drawn with, by selector. */
  const CARD = [
    '.card',
    '.card > .card, .card-body .card',
    '.card-header',
    '.card-title',
    '.card-note',
    '.card-body',
    '.card-body > *',
    '.card-header > *, .card-body > *',
  ];

  it('leaves a plain card alone: every other rule names a part only the collapsible card draws', () => {
    expect(all().filter(({ selector }) => CARD.includes(selector))).toHaveLength(CARD.length);
    for (const { selector } of all()) {
      if (!CARD.includes(selector)) expect(selector).toMatch(COLLAPSIBLE);
    }
  });

  it('draws in tokens only: a slate chevron that turns ink', () => {
    const colors = all()
      .filter(({ selector }) => COLLAPSIBLE.test(selector))
      .flatMap(({ body }) => [...body.matchAll(/var\((--color-[a-z-]+)\)/g)].map(([, name]) => name));
    expect([...new Set(colors)].sort()).toEqual(['--color-ink', '--color-slate']);
    expect(blockAfter(rules(), '.card-chevron {')).toContain('color: var(--color-slate);');
  });

  it('brings the toggle to a 40px target as wide as the title, and gives the room back so the header keeps its height', () => {
    const toggle = blockAfter(rules(), '.card-toggle {');
    expect(toggle).toContain('width: 100%;');
    expect(toggle).toContain('min-height: 40px;');
    expect(toggle).toContain('padding: max(0px, calc((40px - 1lh) / 2)) 0;');
    expect(toggle).toContain('margin: min(0px, calc((1lh - 40px) / 2)) 0;');
    expect(toggle).toContain('cursor: pointer;');
  });

  it("draws the standard focus ring on the toggle, for the native state and React Aria's", () => {
    const ring = blockAfter(rules(), '.card-toggle:is(:focus-visible, [data-focus-visible]) {');
    expect(ring).toContain('outline: var(--focus-ring-width) solid var(--focus-ring-color);');
    expect(ring).toContain('outline-offset: var(--focus-ring-offset);');
  });

  it('turns the chevron from slate to ink on hover only where hover exists, and on a press', () => {
    const css = rules();
    const hover = blockAfter(css, '@media (hover: hover)');
    expect(blockAfter(hover, '.card-toggle:is(:hover, [data-hovered]) .card-chevron {')).toContain(
      'color: var(--color-ink);',
    );
    // Hover is never drawn outside the media query, where a touch screen would keep it after a tap. The
    // forced-colors block names it only to give the chevron the reader's color.
    const forced = blockAfter(css, FORCED_COLORS);
    const outside = css
      .replace(`@media (hover: hover) {${hover}}`, '')
      .replace(`${FORCED_COLORS} {${forced}}`, '');
    expect(outside).not.toContain(':hover');
    expect(blockAfter(outside, '.card-toggle:is(:active, [data-pressed]) .card-chevron {')).toContain(
      'color: var(--color-ink);',
    );
  });

  it("draws the chevron in the toggle's own color in forced colors, at rest, hovered and pressed", () => {
    const forced = blockAfter(rules(), FORCED_COLORS);
    // The hover and press rules weigh as much as this one, and come before it, so it wins.
    expect(
      blockAfter(
        forced,
        '.card-chevron, .card-toggle:is(:hover, [data-hovered], :active, [data-pressed]) .card-chevron {',
      ),
    ).toContain('color: inherit;');
    expect(rules().indexOf(FORCED_COLORS)).toBeGreaterThan(rules().indexOf('@media (hover: hover)'));
  });

  it('turns the folded chevron a quarter toward the inline start, the other way under an rtl dir', () => {
    const css = rules();
    expect(blockAfter(css, ":where([dir='ltr' i]) {")).toContain('--card-chevron-turn: 90deg;');
    expect(blockAfter(css, ":where([dir='rtl' i]) {")).toContain('--card-chevron-turn: -90deg;');
    expect(
      blockAfter(
        css,
        '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-chevron {',
      ),
    ).toContain('rotate: var(--card-chevron-turn, 90deg);');
    // :dir() is past the browser floor, and Lightning CSS would rewrite it as a list of languages.
    expect(css).not.toContain(':dir(');
    // The turn inherits from the nearest dir attribute, so no part of the card sets it.
    for (const { selector, body } of all()) {
      if (!selector.includes('[dir=')) expect(body).not.toContain('--card-chevron-turn:');
    }
  });

  it('folds the body with a grid row from 1fr to 0fr in 200ms, and draws the grid only while the fold is shown', () => {
    const css = rules();
    const fold = blockAfter(css, '.card-fold {');
    expect(fold).toContain('grid-template-rows: 1fr;');
    expect(fold).toContain('transition: grid-template-rows 200ms ease;');
    // React Aria hides a folded panel with hidden="until-found". A browser without until-found falls back
    // to the display: none of hidden, which only works while no rule sets display on the panel.
    expect(fold).not.toContain('display');
    expect(blockAfter(css, '.card-fold:not([hidden]) {')).toContain('display: grid;');
    expect(
      blockAfter(css, '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-fold {'),
    ).toContain('grid-template-rows: 0fr;');
    // Find-in-page cannot reach text that visibility hides, so the fold never hides its body that way.
    expect(css).not.toContain('visibility');
  });

  it('folds the space between the header and the body with the body', () => {
    const css = rules();
    const folded = blockAfter(
      css,
      '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header {',
    );
    for (const declaration of ['margin-bottom: 0;', 'padding-bottom: 0;', 'border-bottom-width: 0;']) {
      expect(folded).toContain(declaration);
    }
    expect(blockAfter(css, '.card-disclosure > .card-header {')).toContain(
      'transition: margin-bottom 200ms ease, padding-bottom 200ms ease, border-bottom-width 200ms ease;',
    );
  });

  it('clips the body only while the card is folded or folding', () => {
    const clipping = all().filter(({ body }) => /(?:^|;\s*)overflow(?:-[xy])?\s*:/.test(body));
    expect(clipping.map(({ selector }) => selector)).toEqual([
      '.card-collapsible:is(:not([data-expanded]), [data-folding]) > .card-disclosure > .card-fold > .card-body',
    ]);
    expect(clipping[0]?.body).toContain('overflow: hidden;');
  });

  it('lays the header out as a grid: the title and the actions on one row, the note under the title', () => {
    const css = rules();
    const header = blockAfter(css, '.card-disclosure > .card-header {');
    expect(header).toContain('grid-template-columns: minmax(0, 1fr) auto;');
    // No column gap: an empty actions column must leave the toggle the whole row.
    expect(header).toContain('column-gap: 0;');
    expect(
      blockAfter(
        css,
        '.card-disclosure > .card-header > .card-title, .card-disclosure > .card-header > .card-note {',
      ),
    ).toContain('grid-column: 1;');
    const actions = blockAfter(css, '.card-actions {');
    expect(actions).toContain('grid-row: 1;');
    expect(actions).toContain('grid-column: 2;');
    expect(actions).toContain('margin-inline-start: var(--spacing-peer);');
    expect(actions).toContain('flex-wrap: wrap;');
    expect(blockAfter(css, '.card-toggle-text {')).toContain('min-width: 0;');
  });

  it('moves the actions under the note, to the row start, when the header is narrower than 18rem', () => {
    const css = rules();
    expect(blockAfter(css, '.card-disclosure > .card-header {')).toContain(
      'container: card-header / inline-size;',
    );
    const narrow = blockAfter(blockAfter(css, '@container card-header (width < 18rem)'), '.card-actions {');
    expect(narrow).toContain('grid-row: auto;');
    expect(narrow).toContain('grid-column: 1;');
    expect(narrow).toContain('justify-content: flex-start;');
    expect(narrow).toContain('margin-inline-start: 0;');
  });

  it('sets the chevron level with the first line of a title that wraps', () => {
    const css = rules();
    expect(blockAfter(css, '.card-toggle {')).toContain('align-items: flex-start;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-block: calc((1lh - 24px) / 2);');
  });

  it('stops every transition it draws under reduced motion, from a block that comes after them', () => {
    const css = rules();
    const start = css.indexOf('@media (prefers-reduced-motion: reduce)');
    const reduced = blockAfter(css, '@media (prefers-reduced-motion: reduce)');
    const moving = all().filter(
      ({ body }) => /(?:^|;\s*)transition\s*:/.test(body) && !body.includes('transition: none'),
    );
    expect(moving.length).toBeGreaterThan(0);
    for (const { selector } of moving) {
      // The same selector, so the same weight, later in the file: it wins.
      expect(reduced).toContain(selector);
      expect(css.indexOf(`${selector} {`)).toBeLessThan(start);
    }
    expect(reduced).toContain('transition: none;');
  });
});

describe('src/components/segmented.css', () => {
  // The rules without their comments, which quote selectors of their own.
  // Closed up, so a selector Prettier breaks over lines is found as one.
```

In `packages/core/test/contrast.test.js` make one edit.

Replace:

```js
  });
});

describe('contrastFailures', () => {
  const palette = (mode) => paletteFor(tokens, mode);
```

with:

```js
  });
});

describe('the collapsible card', () => {
  // The chevron is slate at rest and ink under the pointer, on the card's lifted ground. An icon asks
  // 3:1, and both are gated already as text on lifted, at the stricter 4.5:1.
  it('gates its chevron, slate and ink, on the lifted card', () => {
    for (const text of ['slate', 'ink']) {
      expect(CONTRAST_PAIRS).toContainEqual(
        expect.objectContaining({ text, ground: 'lifted', minimum: TEXT }),
      );
    }
  });
});

describe('contrastFailures', () => {
  const palette = (mode) => paletteFor(tokens, mode);
```

The React tests. `packages/react/src/collapsible-card/CollapsibleCard.test.tsx`:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** A card the caller controls, the way a page that keeps the fold in its own state would. */
function Controlled(props: Omit<CollapsibleCardProps, 'isExpanded' | 'onExpandedChange'>): ReactElement {
  const [isExpanded, setExpanded] = useState(true);
  return <CollapsibleCard {...props} isExpanded={isExpanded} onExpandedChange={setExpanded} />;
}

/** The card's fold, the panel that holds its body. */
function foldOf(container: HTMLElement): HTMLElement {
  const fold = container.querySelector<HTMLElement>('.card-fold');
  if (!fold) throw new Error('No fold');
  return fold;
}

/**
 * A stand-in for a running CSS transition, whose `finished` settles when the test says so: it resolves when
 * the transition ends, and rejects when a new transition replaces it, as a browser's does. jsdom has no Web
 * Animations API, so a test that needs the fold to move gives the fold one of these.
 */
function transition(): { animation: Animation; finish: () => void; cancel: () => void } {
  const animation = {} as Animation;
  let finish = (): void => undefined;
  let cancel = (): void => undefined;
  const finished = new Promise<Animation>((resolve, reject) => {
    finish = () => {
      resolve(animation);
    };
    cancel = () => {
      reject(new DOMException('The transition was replaced.', 'AbortError'));
    };
  });
  // Whoever waits on it handles the rejection; this keeps an unwatched one from being reported.
  finished.catch(() => undefined);
  Object.defineProperty(animation, 'finished', { value: finished });
  return { animation, finish, cancel };
}

/** Lets every promise that is ready settle, so a test can see what a settled transition changed. */
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('CollapsibleCard', () => {
  it('renders a card whose title is the toggle, open by default', async () => {
    const { container } = render(
      <CollapsibleCard title="Notifications">
        <p>Product updates, when something ships.</p>
      </CollapsibleCard>,
    );
    const card = root(container);
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveAttribute('class', 'card card-collapsible');
    expect(card).toHaveAttribute('data-expanded', '');
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    expect(toggle).toHaveClass('card-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The heading holds the toggle, so a screen reader's list of headings reaches it.
    const heading = screen.getByRole('heading', { level: 2, name: 'Notifications' });
    expect(heading).toHaveAttribute('class', 'card-title');
    expect(heading).toContainElement(toggle);
    // The toggle controls the fold, and the fold is a group named by the toggle.
    const fold = foldOf(container);
    expect(toggle).toHaveAttribute('aria-controls', fold.id);
    expect(screen.getByRole('group', { name: 'Notifications' })).toBe(fold);
    expect(fold).not.toHaveAttribute('hidden');
    expect(screen.getByText('Product updates, when something ships.')).toBeVisible();
    expect(screen.getByText('Product updates, when something ships.').parentElement).toHaveClass('card-body');
    await expectNoA11yViolations(container);
  });

  it('requires a title in its types', () => {
    // The @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a title.
    // @ts-expect-error the title is the toggle's text and its accessible name, so a card needs one
    const untitled = <CollapsibleCard>Body</CollapsibleCard>;
    const titled = <CollapsibleCard title="Notifications">Body</CollapsibleCard>;
    expect([untitled, titled]).toHaveLength(2);
  });

  it('draws the title text and a hidden chevron inside the toggle, and names the toggle by the title alone', () => {
    render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    expect([...toggle.children].map((child) => child.getAttribute('class'))).toEqual([
      'card-toggle-text',
      'lucide lucide-chevron-down card-chevron',
    ]);
    expect(toggle.querySelector('.card-toggle-text')).toHaveTextContent('Notifications');
    expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(toggle).toHaveAccessibleName('Notifications');
  });

  it('folds and opens with a click, and marks the root data-expanded only while open', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    // React Aria hides the folded body until the browser's find-in-page reaches it.
    expect(foldOf(container)).toHaveAttribute('hidden', 'until-found');
    expect(screen.getByText('Body')).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(root(container)).toHaveAttribute('data-expanded', '');
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('folds and opens with Enter and with Space', async () => {
    const user = userEvent.setup();
    render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveFocus();
  });

  it('takes a folded body out of the accessibility tree, and hides it where find-in-page can reach it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CollapsibleCard title="Notifications">
        <Button>Send a test email</Button>
      </CollapsibleCard>,
    );
    const fold = foldOf(container);
    expect(screen.getByRole('button', { name: 'Send a test email' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    // hidden="until-found" takes the body out of the tab order in a browser, which jsdom does not model,
    // and leaves it to find-in-page. The browser tests check the tab order.
    expect(fold).toHaveAttribute('hidden', 'until-found');
    expect(fold).toHaveAttribute('aria-hidden', 'true');
    // A query for a role reads the accessibility tree, and the folded button is not in it.
    expect(screen.queryByRole('button', { name: 'Send a test email' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(fold).not.toHaveAttribute('hidden');
    expect(fold).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('button', { name: 'Send a test email' })).toBeInTheDocument();
  });

  it('starts folded with defaultExpanded={false}', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" defaultExpanded={false}>
        Body
      </CollapsibleCard>,
    );
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(foldOf(container)).toHaveAttribute('hidden', 'until-found');
    expect(screen.getByText('Body')).not.toBeVisible();
  });

  it('keeps the note and the actions in the header, outside the toggle and usable while folded', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const { container } = render(
      <CollapsibleCard
        title="Notifications"
        note="Where we reach you, and how often."
        actions={
          <Button variant="secondary" onPress={onReset}>
            Reset
          </Button>
        }
      >
        Body
      </CollapsibleCard>,
    );
    const header = container.querySelector('.card-header');
    expect([...(header?.children ?? [])].map((child) => child.className)).toEqual([
      'card-title',
      'card-note',
      'card-actions',
    ]);
    expect(screen.getByText('Where we reach you, and how often.').tagName).toBe('P');
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    const reset = screen.getByRole('button', { name: 'Reset' });
    // No interactive element inside another: the toggle holds text and an icon, and nothing to press.
    expect(toggle).not.toContainElement(reset);
    expect(toggle.querySelectorAll('button, a, input, select, textarea, [tabindex]')).toHaveLength(0);
    // Tab reaches the toggle, then the actions.
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.tab();
    expect(reset).toHaveFocus();
    // Folded, the header stays: the note is shown and the actions still work.
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Where we reach you, and how often.')).toBeVisible();
    expect(reset).toBeVisible();
    await user.click(reset);
    expect(onReset).toHaveBeenCalledOnce();
    // The name and the description of the toggle are the title's, whatever the header holds.
    expect(toggle).toHaveAccessibleName('Notifications');
    expect(toggle).not.toHaveAttribute('aria-describedby');
  });

  it('renders no note or actions part when they draw nothing', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" note={false} actions="">
        Body
      </CollapsibleCard>,
    );
    expect(container.querySelector('.card-note, .card-actions')).toBeNull();
    expect(container.querySelector('.card-header')?.children).toHaveLength(1);
  });

  it('tells onExpandedChange each time the card opens or folds', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <CollapsibleCard title="Notifications" onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(onExpandedChange).toHaveBeenCalledTimes(2);
  });

  it('follows isExpanded when controlled, and tells the caller what was asked', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container, rerender } = render(
      <CollapsibleCard title="Notifications" isExpanded onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    // The caller has not folded it, so it stays open.
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(root(container)).toHaveAttribute('data-expanded', '');
    rerender(
      <CollapsibleCard title="Notifications" isExpanded={false} onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled title="Notifications">Body</Controlled>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it.each([1, 2, 3, 4] as const)(
    'level %i renders the title as that heading, with the same class',
    (level) => {
      render(
        <CollapsibleCard title="Notifications" level={level}>
          Body
        </CollapsibleCard>,
      );
      const heading = screen.getByRole('heading', { level, name: 'Notifications' });
      expect(heading.tagName).toBe(`H${level}`);
      expect(heading).toHaveAttribute('class', 'card-title');
      expect(heading).toContainElement(screen.getByRole('button', { name: 'Notifications' }));
    },
  );

  it.each(['div', 'section', 'article'] as const)('as renders a %s element at the root', (as) => {
    const { container } = render(
      <CollapsibleCard title="Notifications" as={as}>
        Body
      </CollapsibleCard>,
    );
    const card = root(container);
    expect(card.tagName).toBe(as.toUpperCase());
    expect(card).toHaveAttribute('class', 'card card-collapsible');
    // as chooses the element and is not an attribute.
    expect(card).not.toHaveAttribute('as');
  });

  it('is a region when it is a section with a name', () => {
    render(
      <CollapsibleCard
        title={<span id="notifications-title">Notifications</span>}
        as="section"
        aria-labelledby="notifications-title"
      >
        Body
      </CollapsibleCard>,
    );
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveClass('card-collapsible');
  });

  it('merges className after its own classes and forwards ref to the root', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <CollapsibleCard title="Notifications" as="article" ref={ref} className="extra">
        Body
      </CollapsibleCard>,
    );
    expect(ref.current).toBe(root(container));
    expect(ref.current?.tagName).toBe('ARTICLE');
    expect(ref.current).toHaveAttribute('class', 'card card-collapsible extra');
  });

  it('passes other HTML attributes to the root, data-theme included', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" id="notifications" data-theme="light" style={{ width: 320 }}>
        Body
      </CollapsibleCard>,
    );
    const card = root(container);
    expect(card).toHaveAttribute('id', 'notifications');
    expect(card).toHaveAttribute('data-theme', 'light');
    expect(card).toHaveStyle({ width: '320px' });
  });

  it('marks the root data-folding while the fold moves, and clears it when the fold has finished', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const card = root(container);
    expect(card).not.toHaveAttribute('data-folding');
    const fold = transition();
    Object.defineProperty(foldOf(container), 'getAnimations', { value: () => [fold.animation] });
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(card).toHaveAttribute('data-folding', '');
    await settle();
    expect(card).toHaveAttribute('data-folding', '');
    fold.finish();
    await waitFor(() => {
      expect(card).not.toHaveAttribute('data-folding');
    });
  });

  it('keeps data-folding until the latest fold has finished, when a toggle turns the fold back', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const card = root(container);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    let running = transition();
    Object.defineProperty(foldOf(container), 'getAnimations', { value: () => [running.animation] });
    await user.click(toggle);
    const folding = running;
    running = transition();
    await user.click(toggle);
    // The transition that was turned back is cancelled, and settles late: it changes nothing.
    folding.cancel();
    await settle();
    expect(card).toHaveAttribute('data-folding', '');
    running.finish();
    await waitFor(() => {
      expect(card).not.toHaveAttribute('data-folding');
    });
  });

  it('clears data-folding at once when nothing moves, as under reduced motion', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    Object.defineProperty(foldOf(container), 'getAnimations', { value: () => [] });
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await settle();
    expect(root(container)).not.toHaveAttribute('data-folding');
    expect(root(container)).not.toHaveAttribute('data-expanded');
  });

  it('has no axe violations open, folded, with a note and actions, and nested', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <CollapsibleCard
          title="Notifications"
          note="Where we reach you, and how often."
          actions={<Button variant="secondary">Reset</Button>}
        >
          <p>Product updates, when something ships.</p>
          <CollapsibleCard title="Digest" level={3} defaultExpanded={false}>
            <p>Every Tuesday morning.</p>
          </CollapsibleCard>
        </CollapsibleCard>
        <CollapsibleCard title="Billing" as="section" aria-label="Billing" defaultExpanded={false}>
          <p>Paid by card.</p>
        </CollapsibleCard>
      </>,
    );
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByRole('button', { name: 'Billing' }));
    await expectNoA11yViolations(container);
  });
});
```

In `packages/react/test/server-render.test.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { describe, expect, it } from 'vitest';
import { Button } from '../src/button';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { IconButton } from '../src/icon-button';
import { Link } from '../src/link';
import { Radio, RadioGroup } from '../src/radio-group';
```

with:

```tsx
import { describe, expect, it } from 'vitest';
import { Button } from '../src/button';
import { Checkbox, CheckboxGroup } from '../src/checkbox';
import { CollapsibleCard } from '../src/collapsible-card';
import { IconButton } from '../src/icon-button';
import { Link } from '../src/link';
import { Radio, RadioGroup } from '../src/radio-group';
```

Edit 2. Replace:

```tsx
    </SegmentedControl>,
    ['role="radiogroup"', 'class="segmented-track"', 'class="segmented-room"', 'Dark'],
  ],
];

describe('the client components on the server', () => {
```

with:

```tsx
    </SegmentedControl>,
    ['role="radiogroup"', 'class="segmented-track"', 'class="segmented-room"', 'Dark'],
  ],
  [
    'CollapsibleCard',
    <CollapsibleCard title="Notifications" note="Where we reach you.">
      <p>Product updates</p>
    </CollapsibleCard>,
    [
      'class="card card-collapsible"',
      'data-expanded=""',
      'class="card-toggle"',
      'aria-expanded="true"',
      'class="card-note"',
      'class="card-fold"',
      '<div class="card-body"><p>Product updates</p></div>',
    ],
  ],
];

describe('the client components on the server', () => {
```

The stories. `packages/react/src/collapsible-card/CollapsibleCard.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { firstLineOffset, lineCount, tokenPixels } from '../stories/paint';
import { CollapsibleCard } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
function partsOf(card: Element): {
  header: HTMLElement;
  title: HTMLElement;
  toggle: HTMLElement;
  text: HTMLElement;
  chevron: SVGElement;
} {
  const header = card.querySelector<HTMLElement>(':scope > .card-disclosure > .card-header');
  const title = header?.querySelector<HTMLElement>('.card-title');
  const toggle = header?.querySelector<HTMLElement>('.card-toggle');
  const text = toggle?.querySelector<HTMLElement>('.card-toggle-text');
  const chevron = toggle?.querySelector<SVGElement>('.card-chevron');
  if (!header || !title || !toggle || !text || !chevron) throw new Error('No header, title or toggle drawn');
  return { header, title, toggle, text, chevron };
}

/** The first element inside `scope` with this test id. */
function byTestId(scope: Element, id: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(`[data-testid="${id}"]`);
  if (!element) throw new Error(`Nothing has the test id ${id}`);
  return element;
}

/** The y of the middle of a box. */
const middle = (box: DOMRect): number => box.top + box.height / 2;

/**
 * Checks where `action`, in the actions of `card`, sits, and says which: on the title's row, at its end
 * and level with the title, or under the note, at the row's start. Either way the note is directly under
 * the title.
 */
async function placementOf(card: Element, action: Element): Promise<'row' | 'under'> {
  const { header, title } = partsOf(card);
  const note = header.querySelector(':scope > .card-note');
  const titleBox = title.getBoundingClientRect();
  const actionBox = action.getBoundingClientRect();
  if (note) await expect(note.getBoundingClientRect().top).toBeGreaterThanOrEqual(titleBox.bottom);
  if (actionBox.top < titleBox.bottom) {
    await expect(actionBox.left).toBeGreaterThanOrEqual(titleBox.right);
    await expect(Math.abs(middle(actionBox) - middle(titleBox))).toBeLessThan(1);
    return 'row';
  }
  await expect(actionBox.top).toBeGreaterThanOrEqual((note ?? title).getBoundingClientRect().bottom);
  await expect(Math.abs(actionBox.left - titleBox.left)).toBeLessThan(0.5);
  return 'under';
}

/** The top-left corner in pixels, so a story reads the shape the toolbar has chosen. */
const radius = (element: Element): number => parseFloat(getComputedStyle(element).borderTopLeftRadius);

/**
 * The height of a plain card's header that holds the same title and note, drawn beside `card` at its width
 * and removed again. A plain card is static markup, so its classes are all it needs.
 */
function plainHeaderHeight(card: Element): number {
  const plain = document.createElement('div');
  plain.className = 'card';
  const header = plain.appendChild(document.createElement('div'));
  header.className = 'card-header';
  const title = header.appendChild(document.createElement('h2'));
  title.className = 'card-title';
  title.textContent = card.querySelector('.card-toggle-text')?.textContent ?? '';
  const note = card.querySelector('.card-note');
  if (note) {
    const copy = header.appendChild(document.createElement('p'));
    copy.className = 'card-note';
    copy.textContent = note.textContent;
  }
  card.after(plain);
  const height = header.getBoundingClientRect().height;
  plain.remove();
  return height;
}

/** A word of 75 letters with no hyphen and no space, so the only way to fit it is to break it. */
const UNBROKEN_WORD = 'workspacenotificationpreferencesforeverymemberandeveryprojectyoucreatelater';

const meta = {
  title: 'Components/CollapsibleCard',
  component: CollapsibleCard,
  args: { title: 'Notifications', note: 'Where we reach you, and how often.' },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(480px, calc(100vw - 48px))' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CollapsibleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Open: the title is the toggle, a 40px row with the chevron at its end, and the header is as tall as a
 * plain card's.
 */
export const Open: Story = {
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      <p>Product updates, when something ships.</p>
      <p>A weekly digest, every Tuesday morning.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const { header, title, toggle } = partsOf(card);
    await expect(card).toHaveAttribute('data-expanded');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The whole row is the target: as wide as the title and at least 40px tall.
    const target = toggle.getBoundingClientRect();
    await expect(target.height).toBeGreaterThanOrEqual(40);
    await expect(Math.abs(target.width - title.getBoundingClientRect().width)).toBeLessThan(0.5);
    // The padding that makes the target is given back, so the header is a plain card's height.
    await expect(Math.abs(header.getBoundingClientRect().height - plainHeaderHeight(card))).toBeLessThan(0.5);
    await expect(canvas.getByText('Product updates, when something ships.')).toBeVisible();
  },
};

/**
 * Folded: the header stays and the body is gone, with the space and the rule between them, so the card
 * ends at its own padding. The chevron has turned a quarter toward the title.
 */
export const Folded: Story = {
  args: { defaultExpanded: false },
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      <p>Product updates, when something ships.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const { header, toggle, chevron } = partsOf(card);
    await expect(card).not.toHaveAttribute('data-expanded');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText('Product updates, when something ships.')).not.toBeVisible();
    const style = getComputedStyle(card);
    const below = card.getBoundingClientRect().bottom - header.getBoundingClientRect().bottom;
    await expect(
      Math.abs(below - parseFloat(style.paddingBottom) - parseFloat(style.borderBottomWidth)),
    ).toBeLessThan(0.5);
    await expect(getComputedStyle(header).borderBottomWidth).toBe('0px');
    // Toward the title, which is the inline start: to the left, in left to right.
    await expect(getComputedStyle(chevron).rotate).toBe('90deg');
  },
};

/**
 * Actions sit at the end of the header row, outside the toggle, and stay usable while the card is folded.
 */
export const WithActions: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <CollapsibleCard {...args} actions={<Button variant="secondary">Reset</Button>} data-testid="open">
        <p>Product updates, when something ships.</p>
      </CollapsibleCard>
      <CollapsibleCard
        {...args}
        title="Billing"
        note="Paid by card, every month."
        defaultExpanded={false}
        actions={<Button variant="secondary">Change plan</Button>}
        data-testid="folded"
      >
        <p>The next invoice is on the first of the month.</p>
      </CollapsibleCard>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    for (const [id, name] of [
      ['open', 'Reset'],
      ['folded', 'Change plan'],
    ] as const) {
      const card = byTestId(canvasElement, id);
      const { toggle } = partsOf(card);
      const action = canvas.getByRole('button', { name });
      await expect(action).toBeVisible();
      // Nothing to press inside the toggle, and the action is its neighbor, not its child.
      await expect(toggle).not.toContainElement(action);
      await expect(toggle.querySelectorAll('button, a, input, select, textarea, [tabindex]')).toHaveLength(0);
      // The action ends the title's row, level with the title. Where the row cannot hold both, as at 375px,
      // it moves under the note.
      await expect(action.getBoundingClientRect().right).toBeLessThanOrEqual(
        card.getBoundingClientRect().right,
      );
      await placementOf(card, action);
    }
  },
};

/**
 * In a card or in another collapsible card, the corner steps down to the surface radius and takes an
 * outline, as a nested card does. An inner card keeps its own fold.
 */
export const Nested: Story = {
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <Card as="section" aria-labelledby="workspace-title" data-testid="card">
        <CardHeader>
          <CardTitle id="workspace-title">Workspace</CardTitle>
        </CardHeader>
        <CardBody>
          <CollapsibleCard
            title="Danger zone"
            level={3}
            note="Deleting a workspace cannot be undone."
            data-testid="in-card"
          >
            <p>Every member loses access at once.</p>
          </CollapsibleCard>
        </CardBody>
      </Card>
      <CollapsibleCard {...args} data-testid="outer">
        <p>Product updates, when something ships.</p>
        <CollapsibleCard title="Digest" level={3} defaultExpanded={false} data-testid="inner">
          <p>Every Tuesday morning.</p>
        </CollapsibleCard>
      </CollapsibleCard>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(radius(byTestId(canvasElement, 'card'))).toBe(tokenPixels('--radius-stadium'));
    await expect(radius(byTestId(canvasElement, 'outer'))).toBe(tokenPixels('--radius-stadium'));
    for (const id of ['in-card', 'inner']) {
      const nested = byTestId(canvasElement, id);
      await expect(radius(nested)).toBe(tokenPixels('--radius-surface'));
      await expect(getComputedStyle(nested).borderTopColor).not.toBe('rgba(0, 0, 0, 0)');
    }
    // The outer card is open and the inner one keeps its own fold.
    await expect(partsOf(byTestId(canvasElement, 'outer')).toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(partsOf(byTestId(canvasElement, 'inner')).toggle).toHaveAttribute('aria-expanded', 'false');
  },
};

/**
 * A long title wraps inside the toggle, with the chevron level with its first line, a word with no break in
 * it breaks anywhere, and the actions move under the note, in the 288px column of a 320px screen with 16px
 * gutters. The visual suite also shoots every story at 375px.
 */
export const LongTitle: Story = {
  args: {
    title: `Notification preferences for ${UNBROKEN_WORD}`,
    note: 'Override them for one workspace at https://example.com/settings/notifications/workspaces/everyone.',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 288 }}>
        <Story />
      </div>
    ),
  ],
  render: (args) => (
    <CollapsibleCard {...args} actions={<Button variant="secondary">Reset</Button>} data-testid="card">
      <p>The key for every workspace you create later is {UNBROKEN_WORD}.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement }) => {
    const card = byTestId(canvasElement, 'card');
    const { toggle, text, chevron } = partsOf(card);
    const box = card.getBoundingClientRect();
    await expect(box.width).toBeLessThanOrEqual(288.5);
    // Nothing the card holds reaches past it: not the card, and not any text inside it.
    await expect(card.scrollWidth).toBeLessThanOrEqual(card.clientWidth);
    const action = canvas.getByRole('button', { name: 'Reset' });
    for (const part of [text, action, ...card.querySelectorAll<HTMLElement>('.card-note, .card-body p')]) {
      await expect(part.scrollWidth).toBeLessThanOrEqual(part.clientWidth);
      const edge = part.getBoundingClientRect();
      await expect(edge.left).toBeGreaterThanOrEqual(box.left);
      await expect(edge.right).toBeLessThanOrEqual(box.right);
    }
    // The title wraps inside a toggle that stays a target, with the chevron level with its first line,
    // the note stays directly under it, and the actions move under the note.
    await expect(lineCount(text)).toBeGreaterThan(1);
    await expect(Math.abs(firstLineOffset(chevron, text))).toBeLessThanOrEqual(1);
    await expect(toggle.getBoundingClientRect().height).toBeGreaterThanOrEqual(40);
    await expect(await placementOf(card, action)).toBe('under');
  },
};

/**
 * The actions share the title's row while the header is at least 18rem wide, as on a 390px phone with 16px
 * gutters, and move under the note below that, as on a 320px screen. The note stays directly under the
 * title either way.
 */
export const ActionsPlacement: Story = {
  // A check of where the parts land: the visual suite already shoots both arrangements in WithActions.
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <div style={{ width: 358 }}>
        <CollapsibleCard {...args} actions={<Button variant="tertiary">Reset</Button>} data-testid="phone" />
      </div>
      <div style={{ width: 288 }}>
        <CollapsibleCard {...args} actions={<Button variant="tertiary">Reset</Button>} data-testid="small" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const [id, placement] of [
      ['phone', 'row'],
      ['small', 'under'],
    ] as const) {
      const card = byTestId(canvasElement, id);
      const action = card.querySelector('.card-actions .button');
      if (!action) throw new Error('No action drawn');
      await expect(await placementOf(card, action)).toBe(placement);
    }
  },
};

/** The ring sits outside the toggle, which is as wide as the title, so ink still reads against the card. */
export const KeyboardFocus: Story = {
  render: (args) => (
    <CollapsibleCard {...args}>
      <p>Product updates, when something ships.</p>
    </CollapsibleCard>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Notifications' })).toHaveFocus();
  },
};

/**
 * A popup or anything else positioned out of an open card is drawn whole: the body clips only while the
 * card is folded or folding. It is drawn whole again once a fold and an unfold have settled.
 */
export const OverflowingChild: Story = {
  // The check is a hit test, and the visual suite already shoots an open card.
  tags: ['no-visual'],
  render: (args) => (
    <CollapsibleCard {...args} data-testid="card">
      <p>Pick a time for the weekly digest.</p>
      <div style={{ position: 'relative' }}>
        <div
          data-testid="popup"
          style={{
            position: 'absolute',
            top: 0,
            insetInlineStart: 0,
            width: 160,
            height: 160,
            border: '1px solid var(--color-frame)',
            borderRadius: 'var(--radius-surface)',
            background: 'var(--color-raised)',
          }}
        />
      </div>
    </CollapsibleCard>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const card = byTestId(canvasElement, 'card');
    const popup = byTestId(canvasElement, 'popup');
    /** Whether a point below the card, inside the popup, hits the popup. */
    const drawnWhole = (): boolean => {
      const below = card.getBoundingClientRect().bottom + 16;
      const box = popup.getBoundingClientRect();
      return box.bottom > below && document.elementFromPoint(box.left + 16, below) === popup;
    };
    await expect(drawnWhole()).toBe(true);
    const toggle = canvas.getByRole('button', { name: 'Notifications' });
    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    await userEvent.click(toggle);
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    await expect(card).toHaveAttribute('data-expanded');
    await expect(drawnWhole()).toBe(true);
  },
};
```

In `packages/react/src/rtl/RightToLeft.stories.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { Radio, RadioGroup } from '../radio-group';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { firstLineOffset, lineCount } from '../stories/paint';
```

with:

```tsx
import type { ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { CollapsibleCard } from '../collapsible-card';
import { Radio, RadioGroup } from '../radio-group';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { firstLineOffset, lineCount } from '../stories/paint';
```

Edit 2. Replace:

```tsx
    await expect(stackedOptions[1]?.top ?? 0).toBeGreaterThan(stackedOptions[0]?.top ?? Infinity);
  },
};
```

with:

```tsx
    await expect(stackedOptions[1]?.top ?? 0).toBeGreaterThan(stackedOptions[0]?.top ?? Infinity);
  },
};

/**
 * The title starts at the right of its row and the chevron is at the left end of the toggle, which is the
 * end of the row in right to left, with the actions after it. Folded, the chevron turns toward the title:
 * to the right, the inline start. In a narrow card the actions move under the note, to the right, where the
 * row starts.
 */
export const CollapsibleCardMirrored: Story = {
  render: () => (
    <Rtl>
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <CollapsibleCard
          title="الإشعارات"
          note="أين نصل إليك وكم مرة."
          actions={<Button variant="secondary">إعادة</Button>}
        >
          <p>تحديثات المنتج عند إطلاق شيء جديد.</p>
        </CollapsibleCard>
        <CollapsibleCard title="الفواتير" defaultExpanded={false}>
          <p>الدفع بالبطاقة كل شهر.</p>
        </CollapsibleCard>
        <div style={{ width: 288 }}>
          <CollapsibleCard
            title="الأمان"
            note="تنبيهات تسجيل الدخول."
            actions={<Button variant="tertiary">إعادة</Button>}
          >
            <p>دائمًا للمالكين.</p>
          </CollapsibleCard>
        </div>
      </div>
    </Rtl>
  ),
  play: async ({ canvasElement }) => {
    const [open, folded, narrow] = [...canvasElement.querySelectorAll<HTMLElement>('.card-collapsible')];
    if (!open || !folded || !narrow) throw new Error('Three cards expected');
    const toggle = rect(find(open, '.card-toggle'));
    const chevron = rect(find(open, '.card-chevron'));
    const title = rect(find(open, '.card-title'));
    const actions = rect(find(open, '.card-actions'));
    // The words start at the right of the toggle, and the chevron is at its left end.
    await expectSameEdge(lastText(find(open, '.card-toggle-text')).right, toggle.right);
    await expectSameEdge(chevron.left, toggle.left);
    // The actions end the row, which is at the left.
    await expect(actions.right).toBeLessThanOrEqual(title.left + 0.5);
    for (const box of [toggle, actions, rect(find(open, '.card-note'))]) await expectInside(box, rect(open));
    // Open, the chevron points down. Folded, it turns a quarter toward the title, which is to the right.
    await expect(getComputedStyle(find(open, '.card-chevron')).rotate).toBe('none');
    await expect(getComputedStyle(find(folded, '.card-chevron')).rotate).toBe('-90deg');
    // Narrow, the note stays under the title and the actions move under the note, starting at the right.
    const narrowTitle = rect(find(narrow, '.card-title'));
    const narrowNote = rect(find(narrow, '.card-note'));
    const narrowAction = rect(find(narrow, '.card-actions .button'));
    await expect(narrowNote.top).toBeGreaterThanOrEqual(narrowTitle.bottom);
    await expect(narrowAction.top).toBeGreaterThanOrEqual(narrowNote.bottom);
    await expectSameEdge(narrowAction.right, narrowTitle.right);
    await expectInside(narrowAction, rect(narrow));
  },
};
```

The docs end-to-end tests. First the shared axe helper, which turns on the check for visible names.

In `apps/docs/tests/support.ts` make one edit.

Replace:

```ts
  }, mode);
};

/** Every axe violation on the page, as "rule: selectors". An empty list is a pass. */
export const axeViolations = async (page: Page): Promise<string[]> => {
  const { violations } = await new AxeBuilder({ page }).analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};
```

with:

```ts
  }, mode);
};

/**
 * Every axe violation on the page, as "rule: selectors". An empty list is a pass. The check that a control's
 * accessible name holds the text it shows is experimental in this axe and on by default from axe 4.14, the
 * version the packages' own tests run, so it is turned on here too.
 */
export const axeViolations = async (page: Page): Promise<string[]> => {
  const { violations } = await new AxeBuilder({ page })
    .options({ rules: { 'label-content-name-mismatch': { enabled: true } } })
    .analyze();
  return violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
};
```

In `apps/docs/tests/components.spec.ts` make two edits, in this order.

Edit 1. Replace:

```ts
    '.stage .field-error',
    '.stage .checkbox-text',
  ],
  field: ['.stage .field-label', '.stage .field-description', '.stage .field-error', '.stage .field-changed'],
  kbd: ['.stage .kbd'],
  link: ['.stage .link'],
```

with:

```ts
    '.stage .field-error',
    '.stage .checkbox-text',
  ],
  'collapsible-card': [
    '.stage .card-toggle-text',
    '.stage .card-note',
    '.stage .card-collapsible .card-body p',
  ],
  field: ['.stage .field-label', '.stage .field-description', '.stage .field-error', '.stage .field-changed'],
  kbd: ['.stage .kbd'],
  link: ['.stage .link'],
```

Edit 2. Replace:

```ts
  button: ['.stage .button'],
  card: ['.stage .card', '.stage .card-title', '.stage .card-note'],
  checkbox: ['.stage .checkbox-box'],
  field: ['.stage .field-counter', '.stage .field-changed'],
  'icon-button': ['.stage .icon-button'],
  kbd: ['.stage .kbd'],
```

with:

```ts
  button: ['.stage .button'],
  card: ['.stage .card', '.stage .card-title', '.stage .card-note'],
  checkbox: ['.stage .checkbox-box'],
  'collapsible-card': ['.stage .card-collapsible', '.stage .card-toggle', '.stage .card-chevron'],
  field: ['.stage .field-counter', '.stage .field-changed'],
  'icon-button': ['.stage .icon-button'],
  kbd: ['.stage .kbd'],
```

In `apps/docs/tests/docs.spec.ts` make two edits, in this order.

Edit 1. Replace:

```ts
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await axeViolations(page)).toEqual([]);
  });
}
```

with:

```ts
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    expect(await axeViolations(page)).toEqual([]);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`a docs page has no axe violations at 1440px in ${theme}, with the rail drawn whole`, async ({
    page,
  }) => {
    // At 1440px the rail draws the search button with its label and its key, and axe checks that a
    // control's accessible name holds the text it shows.
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.emulateMedia({ colorScheme: theme });
    await visit(page);
    await expect(page.getByRole('button', { name: 'Search docs' })).toBeVisible();
    expect(await axeViolations(page)).toEqual([]);
  });
}
```

Edit 2. Replace:

```ts
  );
  await expect(disabled.locator('.segmented-option').first()).toHaveCSS('cursor', 'not-allowed');
});
```

with:

```ts
  );
  await expect(disabled.locator('.segmented-option').first()).toHaveCSS('cursor', 'not-allowed');
});

test('a collapsible card folds and opens on its page, by pointer and by keyboard', async ({ page }) => {
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Notifications', exact: true });
  const card = page.locator('.card-collapsible').filter({ has: toggle });
  const body = card.locator('.card-body');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(body).toBeVisible();
  // Open, Tab goes from the toggle into the body.
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Send a test email' })).toBeFocused();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(card).not.toHaveAttribute('data-expanded');
  await expect(body).toBeHidden();
  // Once the fold has settled, React Aria hides the panel, and the card stops marking the move.
  await expect(card.locator('.card-fold')).toHaveAttribute('hidden', 'until-found');
  await expect(card).not.toHaveAttribute('data-folding');
  // Folded, the body takes no focus: Tab goes from the toggle to the next card's.
  await toggle.focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Billing', exact: true })).toBeFocused();
  await toggle.press('Enter');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(body).toBeVisible();
  await expect(card).not.toHaveAttribute('data-folding');
  await toggle.press('Space');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(body).toBeHidden();
});
```

- [ ] **Step 2: Run them and watch them fail**

The stories and the docs read the built packages, so build them first. They are still the old code at this point.

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark CollapsibleCard RightToLeft
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:

- The build ends `check-use-client: every client module keeps its directive (48 sources, 18 client modules)`.
- The core run FAILS with `Test Files  1 failed | 1 passed (2)` and `Tests  13 failed | 207 passed (220)`. The 13 are every new test in `css.test.js` but the one that finds a plain card's rules untouched, which pins what must stay true. The contrast test passes: it pins two pairs the gate already holds.

```text
FAIL  test/css.test.js > src/components/card.css, the collapsible card > draws in tokens only: a slate chevron that turns ink
AssertionError: expected [] to deeply equal [ '--color-ink', '--color-slate' ]
FAIL  test/css.test.js > src/components/card.css, the collapsible card > brings the toggle to a 40px target as wide as the title, and gives the room back so the header keeps its height
AssertionError: expected '' to contain 'width: 100%;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > draws the standard focus ring on the toggle, for the native state and React Aria's
AssertionError: expected '' to contain 'outline: var(--focus-ring-width) soli…'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > turns the chevron from slate to ink on hover only where hover exists, and on a press
AssertionError: expected '' to contain 'color: var(--color-ink);'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > draws the chevron in the toggle's own color in forced colors, at rest, hovered and pressed
AssertionError: expected '' to contain 'color: inherit;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > turns the folded chevron a quarter toward the inline start, the other way under an rtl dir
AssertionError: expected '' to contain '--card-chevron-turn: 90deg;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > folds the body with a grid row from 1fr to 0fr in 200ms, and draws the grid only while the fold is shown
AssertionError: expected '' to contain 'grid-template-rows: 1fr;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > folds the space between the header and the body with the body
AssertionError: expected '' to contain 'margin-bottom: 0;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > clips the body only while the card is folded or folding
AssertionError: expected [] to deeply equal [ Array(1) ]
FAIL  test/css.test.js > src/components/card.css, the collapsible card > lays the header out as a grid: the title and the actions on one row, the note under the title
AssertionError: expected '' to contain 'grid-template-columns: minmax(0, 1fr)…'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > moves the actions under the note, to the row start, when the header is narrower than 18rem
AssertionError: expected '' to contain 'container: card-header / inline-size;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > sets the chevron level with the first line of a title that wraps
AssertionError: expected '' to contain 'align-items: flex-start;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > stops every transition it draws under reduced motion, from a block that comes after them
AssertionError: expected 0 to be greater than 0
```

- The React run FAILS with `Test Files  2 failed | 37 passed (39)` and `Tests  620 passed | 4 expected fail (624)`: neither file can load the component.

```text
FAIL  test/server-render.test.tsx [ test/server-render.test.tsx ]
Error: Cannot find module '../src/collapsible-card' imported from .../packages/react/test/server-render.test.tsx
FAIL  src/collapsible-card/CollapsibleCard.test.tsx [ src/collapsible-card/CollapsibleCard.test.tsx ]
Error: Failed to resolve import "./CollapsibleCard" from "src/collapsible-card/CollapsibleCard.test.tsx". Does the file exist?
```

- The Storybook run is narrowed to the two story files, because Vite's error overlay for a missing module also breaks stories in other files that run beside them in the same browser. It FAILS with `Test Files  4 failed (4)` and `Tests  no tests`: each file, in the `storybook` and the `storybook-dark` project, ends with `Error: Failed to import test file .../CollapsibleCard.stories.tsx` or `.../RightToLeft.stories.tsx`.
- The docs build lists 23 static pages. The `lsof` prints nothing; if another checkout uses port 3100, run the suite as `DOCS_E2E_PORT=3504 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free. The end-to-end run FAILS with `38 failed` and `123 passed`:
  - 35 axe checks, each with `label-content-name-mismatch: .rail-search`: the 15 component pages in light and dark, `a docs page has no axe violations` in light and dark, the two new checks at 1440px, and `the open drawer has no axe violations`.
  - `every component page is given long text, or is listed as having none` and `every component page is listed as server rendered`, each with `+   "collapsible-card",`: the maps list a page the rail does not have yet.
  - `a collapsible card folds and opens on its page, by pointer and by keyboard`, in `visit`: `Locator: locator('.header input[type="radio"]:checked')`, `Expected: 2`, `Received: 0`. The page does not exist yet.

- [ ] **Step 3: Write the component, the CSS, the docs, the record and the changeset**

The hook that marks the fold while it moves. `packages/react/src/collapsible-card/useFolding.ts`:

```ts
import { useLayoutEffect, useRef, type RefObject } from 'react';

/** The attribute the card's root carries while its fold moves. */
const FOLDING = 'data-folding';

/**
 * Sets `data-folding` on the card's root each time the card opens or folds, and takes it off once every
 * transition the fold is running has finished, as the Web Animations API reports them. The stylesheet clips
 * the body only while the card is folded or folding, so a popup in an open card is never cut off at its
 * edge, and the attribute is there for exactly as long as the fold moves.
 *
 * Each change is a new turn. A toggle while the fold still moves replaces its transition, and the replaced
 * one settles late (a cancelled transition rejects), so only the settling of the latest turn takes the
 * attribute off. With nothing running, as under reduced motion, or where the API is missing, it comes off
 * at once. The first render marks nothing, since nothing moved.
 *
 * The fold is the root's grandchild: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useFolding(foldRef: RefObject<HTMLElement | null>, isExpanded: boolean): void {
  const turn = useRef(0);
  const shown = useRef(isExpanded);
  useLayoutEffect(() => {
    // Effects run again with nothing changed under Strict Mode, and that is not a move.
    if (shown.current === isExpanded) return;
    shown.current = isExpanded;
    const fold = foldRef.current;
    const root = fold?.parentElement?.parentElement;
    if (!fold || !root) return;
    const mine = ++turn.current;
    root.setAttribute(FOLDING, '');
    const running = 'getAnimations' in fold ? fold.getAnimations() : [];
    void Promise.allSettled(running.map((animation) => animation.finished)).then(() => {
      if (turn.current === mine) root.removeAttribute(FOLDING);
    });
  }, [foldRef, isExpanded]);
}
```

The component. `packages/react/src/collapsible-card/CollapsibleCard.tsx`:

```tsx
'use client';

import { ChevronDown } from 'lucide-react';
import {
  createElement,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';
import {
  Button as RACButton,
  Disclosure as RACDisclosure,
  DisclosurePanel as RACDisclosurePanel,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useFolding } from './useFolding';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The title, drawn as the card title. It is the toggle's text and its accessible name. */
  title: ReactNode;
  /**
   * The heading element of the title, `h1` to `h4`, so the card fits the page's outline. The look is
   * the same at every level.
   * @default 2
   */
  level?: 1 | 2 | 3 | 4;
  /** The line under the title, drawn as a card note. It stays visible while the card is folded. */
  note?: ReactNode;
  /**
   * Controls at the end of the header row, such as a Reset button. They are never inside the toggle,
   * and they stay visible and usable while the card is folded.
   */
  actions?: ReactNode;
  /**
   * Whether the card is open on the first render, when `isExpanded` does not control it.
   * @default true
   */
  defaultExpanded?: boolean;
  /** Whether the card is open. Given, it controls the card: pair it with `onExpandedChange`. */
  isExpanded?: boolean;
  /** Called with the new state when the card opens or folds, from its toggle or from find-in-page. */
  onExpandedChange?: (isExpanded: boolean) => void;
  /**
   * The element to render. A `section` with an accessible name is a region landmark. An `article` is
   * not a landmark, named or not, and a `div` is neither.
   * @default 'div'
   */
  as?: 'div' | 'section' | 'article';
  /** A ref to the card's root element, the one `className` goes on. */
  ref?: Ref<HTMLElement>;
  /** The body, which folds. */
  children?: ReactNode;
}

/**
 * Whether the card is open: `isExpanded` when the caller controls it, and otherwise the card's own state,
 * starting from `defaultExpanded`. Every change goes through the setter, which tells `onExpandedChange`.
 * This is the one place the state is decided.
 */
function useExpanded(
  isExpanded: boolean | undefined,
  defaultExpanded: boolean,
  onExpandedChange: ((isExpanded: boolean) => void) | undefined,
): [isExpanded: boolean, setExpanded: (isExpanded: boolean) => void] {
  const [own, setOwn] = useState(defaultExpanded);
  const setExpanded = (next: boolean): void => {
    setOwn(next);
    onExpandedChange?.(next);
  };
  return [isExpanded ?? own, setExpanded];
}

/**
 * The title, drawn as the card title, holding the toggle: the title's text and the chevron, which is
 * decoration. The title names the toggle and `aria-expanded` gives its state. This is the one place the
 * toggle is built, so anything that comes to describe it is added here.
 */
function CardToggle({ title, level }: { title: ReactNode; level: 1 | 2 | 3 | 4 }): ReactElement {
  const Heading = `h${level}` as const;
  return (
    <Heading className="card-title">
      <RACButton slot="trigger" className="card-toggle">
        <span className="card-toggle-text">{title}</span>
        <ChevronDown className="card-chevron" aria-hidden="true" />
      </RACButton>
    </Heading>
  );
}

/**
 * A card whose body folds under its header. The title is the toggle, a row as wide as the title with a
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card.
 */
export function CollapsibleCard({
  title,
  level = 2,
  note,
  actions,
  defaultExpanded = true,
  isExpanded: isExpandedProp,
  onExpandedChange,
  as: tag = 'div',
  className,
  children,
  ...props
}: CollapsibleCardProps): ReactElement {
  const [isExpanded, setExpanded] = useExpanded(isExpandedProp, defaultExpanded, onExpandedChange);
  const foldRef = useRef<HTMLDivElement>(null);
  useFolding(foldRef, isExpanded);
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it.
  return createElement(
    tag,
    {
      ...props,
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
        <CardToggle title={title} level={level} />
        {present(note) ? <p className="card-note">{note}</p> : null}
        {present(actions) ? <div className="card-actions">{actions}</div> : null}
      </div>
      <RACDisclosurePanel ref={foldRef} className="card-fold">
        <div className="card-body">{children}</div>
      </RACDisclosurePanel>
    </RACDisclosure>,
  );
}
```

`packages/react/src/collapsible-card/index.ts`:

```ts
export { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';
```

In `packages/react/src/index.ts` make one edit.

Replace:

```ts
  type CardProps,
  type CardTitleProps,
} from './card';
```

with:

```ts
  type CardProps,
  type CardTitleProps,
} from './card';
export { CollapsibleCard, type CollapsibleCardProps } from './collapsible-card';
```

The CSS.

In `packages/core/src/components/card.css` make one edit.

Replace:

```css
  .card-body > * {
    min-width: 0;
  }
}
```

with:

```css
  .card-body > * {
    min-width: 0;
  }

  /*
   * CollapsibleCard: a card whose body folds under its header, derived in
   * docs/design-system.md ("CollapsibleCard"). It draws with the card's own
   * classes, and the rules below add the toggle, the actions, the fold and the
   * space that folds with it, each through a part a plain card does not have.
   *
   * The root carries data-expanded while the card is open and data-folding
   * while the fold moves, and the component sets both. The header and the fold
   * sit in React Aria's disclosure element, .card-disclosure, which draws
   * nothing. Every state rule reaches them through it from the root, so a card
   * nested in the body keeps its own state.
   */

  /* The header is a grid. The title, which holds the toggle, takes the first
     row and the room left in it, and the actions end that row. The note sits
     directly under the title, in its column. With no actions the second
     column is empty and has no width, so the toggle spans the row, and with no
     note there is no second row. The header is a size container, so the
     actions can move when the row is too narrow for both. */
  .card-disclosure > .card-header {
    container: card-header / inline-size;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: 0;
    transition:
      margin-bottom 200ms ease,
      padding-bottom 200ms ease,
      border-bottom-width 200ms ease;
  }

  .card-disclosure > .card-header > .card-title,
  .card-disclosure > .card-header > .card-note {
    grid-column: 1;
  }

  /* The 24px between the title and the actions is the actions' margin, not a
     column gap, so a header with no actions keeps no gap. */
  .card-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--spacing-part);
    grid-row: 1;
    grid-column: 2;
    margin-inline-start: var(--spacing-peer);
  }

  /* Too narrow for a typical title and an action side by side, the actions
     move under the note, to the row's start, and wrap if they must. 18rem
     (288px) is measured: "Notifications" with its chevron and a tertiary
     Reset button need 272px side by side, and a short title with two short
     buttons 284px. A card on a 390px phone with 16px gutters has 292px. */
  @container card-header (width < 18rem) {
    .card-actions {
      grid-row: auto;
      grid-column: 1;
      justify-content: flex-start;
      margin-inline-start: 0;
    }
  }

  /* The title is the toggle: a button as wide as the title, with the chevron at
     its end, so the whole row is the target. Padding takes it to 40px tall and
     an equal negative margin gives the room back, so the header is as tall as a
     plain card's. The minimum height covers the rounding of a layout that works
     in fractions of a pixel, which drew the padded row 39.98px tall. */
  .card-toggle {
    box-sizing: border-box;
    display: flex;
    align-items: flex-start;
    gap: var(--spacing-part);
    width: 100%;
    min-height: 40px;
    margin: min(0px, calc((1lh - 40px) / 2)) 0;
    padding: max(0px, calc((40px - 1lh) / 2)) 0;
    border: 0;
    border-radius: var(--radius-micro);
    background: none;
    color: inherit;
    font: inherit;
    letter-spacing: inherit;
    text-align: start;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }

  .card-toggle-text {
    flex: auto;
    min-width: 0;
  }

  /* The chevron sits level with the first line of a title that wraps, beside
     the words a reader starts with, as a checkbox's box does: a margin of half
     of what the line has over the 24px icon, 2.4px. For one line that is where
     centring would put it. */
  .card-chevron {
    flex: none;
    width: 24px;
    height: 24px;
    margin-block: calc((1lh - 24px) / 2);
    color: var(--color-slate);
    transition: rotate 200ms ease;
  }

  .card-toggle:is(:focus-visible, [data-focus-visible]) {
    outline: var(--focus-ring-width) solid var(--focus-ring-color);
    outline-offset: var(--focus-ring-offset);
  }

  @media (hover: hover) {
    .card-toggle:is(:hover, [data-hovered]) .card-chevron {
      color: var(--color-ink);
    }
  }

  /* A press shows what hover does, since touch has no hover to show it. */
  .card-toggle:is(:active, [data-pressed]) .card-chevron {
    color: var(--color-ink);
  }

  /* Folded, the chevron turns a quarter toward the title, which is the inline
     start: left in left to right, and right in right to left. CSS has no turn
     that follows the direction, and :dir() is past the browser floor, so each
     dir attribute sets the turn and it inherits: the nearest dir attribute
     decides, as it does for the layout. */
  :where([dir='ltr' i]) {
    --card-chevron-turn: 90deg;
  }

  :where([dir='rtl' i]) {
    --card-chevron-turn: -90deg;
  }

  .card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-chevron {
    rotate: var(--card-chevron-turn, 90deg);
  }

  /* The space and the rule between the header and the body fold with the
     body, so a folded card ends at its own padding. */
  .card-collapsible:not([data-expanded]) > .card-disclosure > .card-header {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom-width: 0;
  }

  /* The body folds on a grid row that moves between 1fr, the body's own
     height, and 0fr. Nothing is measured, so a popup hanging out of the body
     cannot change the height it folds from. React Aria hides a folded panel
     with hidden="until-found" once the fold has settled, which takes it out of
     the tab order and the accessibility tree and leaves it to find-in-page.
     The grid is drawn only while the panel is shown, so a browser without
     until-found falls back to the display: none of hidden. */
  .card-fold {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: 1fr;
    transition: grid-template-rows 200ms ease;
  }

  .card-fold:not([hidden]) {
    display: grid;
  }

  .card-collapsible:not([data-expanded]) > .card-disclosure > .card-fold {
    grid-template-rows: 0fr;
  }

  .card-fold > .card-body {
    min-height: 0;
  }

  /* The body clips only while it is folded or folding, so a popup in an open
     card is never cut off at the card's edge. */
  .card-collapsible:is(:not([data-expanded]), [data-folding]) > .card-disclosure > .card-fold > .card-body {
    overflow: hidden;
  }

  /* Forced colors repaint text in the reader's palette, but an svg keeps the
     color its author set, so the slate or ink chevron would stay as it was. It
     takes the toggle's color there, the reader's text color, at rest, under the
     pointer and pressed alike. */
  @media (forced-colors: active) {
    .card-chevron,
    .card-toggle:is(:hover, [data-hovered], :active, [data-pressed]) .card-chevron {
      color: inherit;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card-disclosure > .card-header,
    .card-chevron,
    .card-fold {
      transition: none;
    }
  }
}
```

Run `pnpm --filter @snapshot-ui/core lint`. Expected: no Stylelint or ESLint output.

The docs page. `apps/docs/content/docs/components/collapsible-card.mdx`:

````markdown
---
title: Collapsible card
description: A card whose body folds under its header. The title is the toggle, and the note and the actions stay in view while the card is folded.
icon: ChevronsDownUp
---

<Section>

## Folding

The title is the toggle: press it, or focus it and press Enter or Space, to fold the body under the header and to open it again. The whole row is the target, and the chevron at its end turns toward the title while the card is folded. The header stays as it is, and the space and the rule between the header and the body fold away with the body, in 200ms, or at once under reduced motion.

<Preview name="collapsible-card-basic" />

</Section>

<Section>

## Actions

Controls passed as `actions` sit at the end of the header row, outside the toggle, and stay usable while the card is folded, so a Reset button never hides with the fields it resets. On a card narrower than 18rem inside its padding they move under the note, so the note always stays directly under the title.

<Preview name="collapsible-card-actions" />

</Section>

<Section>

## Usage

A card is open on its first render. Pass `defaultExpanded={false}` to start it folded, or control it with `isExpanded` and `onExpandedChange`. The children are the body, laid out as a card's body is. CollapsibleCard is a client component, and a server component can render it, as the first example on this page does.

```tsx
import { Button, CollapsibleCard } from '@snapshot-ui/react';

export function Notifications() {
  return (
    <CollapsibleCard
      title="Notifications"
      note="Where we reach you, and how often."
      actions={<Button variant="secondary">Reset</Button>}
    >
      <p>Product updates, when something ships.</p>
    </CollapsibleCard>
  );
}
```

</Section>

<Section>

## Props

The rest of the HTML attributes, `className` and `ref` go on the card's root, and `className` is merged after the library's classes.

<PropsTable path="../../packages/react/src/collapsible-card/CollapsibleCard.tsx" type="Pick<CollapsibleCardProps, 'title' | 'level' | 'note' | 'actions' | 'defaultExpanded' | 'isExpanded' | 'onExpandedChange' | 'as' | 'className'>" />

</Section>

<Section>

## Accessibility

The title is a heading that holds a button, so the card is in a screen reader's list of headings, and the button says the title and then whether the body is expanded or collapsed. The chevron is decoration. A folded body leaves the tab order and the accessibility tree, and the browser's find-in-page can still find its text: the card opens and reports it through `onExpandedChange`. The toggle is as wide as the title and 40px tall, and the actions are never inside it.

<Keys rows={[['Enter Space', 'Folds or opens the card.'], ['Tab', 'Moves to the toggle, then to the actions. A folded body takes no focus.']]} />

A card is a div unless `as` says otherwise. A `section` with a name, from `aria-label` or from `aria-labelledby` pointing at an element in the title, is a region landmark. An `article` is not a landmark, named or not.

</Section>

<Section>

## Design rules

What keeps collapsible cards in the system.

<Rules dos={['Title the card with what it holds, such as Notifications. The title is the toggle and its name.', 'Put a control that acts on the whole card, such as Reset, in actions, so it stays in reach while the card is folded.', 'Leave open what a reader needs on arrival, and fold what they come back to now and then.']} donts={['Never put a link or a button in the title. The title is already a button.', 'Never fold the only card on a page. A fold that hides everything hides the page.', 'Never use a collapsible card for a single control or a short label. A card holds a section.']} />

</Section>
````

`apps/docs/examples/collapsible-card-basic.tsx`, a server file:

```tsx
import { Button, CollapsibleCard } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CollapsibleCardBasic(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: 480 }}>
      <CollapsibleCard title="Notifications" level={3} note="Where we reach you, and how often.">
        <p>Product updates, when something ships.</p>
        <p>A weekly digest, every Tuesday morning.</p>
        <div className="row">
          <Button variant="secondary">Send a test email</Button>
        </div>
      </CollapsibleCard>
      <CollapsibleCard title="Billing" level={3} note="Paid by card, every month." defaultExpanded={false}>
        <p>The next invoice is on the first of the month.</p>
      </CollapsibleCard>
    </div>
  );
}
```

`apps/docs/examples/collapsible-card-actions.tsx`:

```tsx
'use client';

import { Button, CollapsibleCard, Switch } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = { updates: true, digest: false };

export default function CollapsibleCardActions(): ReactElement {
  const [draft, setDraft] = useState(SAVED);
  const isDirty = draft.updates !== SAVED.updates || draft.digest !== SAVED.digest;
  return (
    <CollapsibleCard
      title="Email"
      level={3}
      note="Fold the card, and Reset is still there."
      actions={
        <Button
          variant="secondary"
          isDisabled={!isDirty}
          onPress={() => {
            setDraft(SAVED);
          }}
        >
          Reset
        </Button>
      }
      style={{ width: '100%', maxWidth: 480 }}
    >
      <Switch
        isSelected={draft.updates}
        onChange={(updates) => {
          setDraft({ ...draft, updates });
        }}
        isChanged={draft.updates !== SAVED.updates}
      >
        Product updates
      </Switch>
      <Switch
        isSelected={draft.digest}
        onChange={(digest) => {
          setDraft({ ...draft, digest });
        }}
        isChanged={draft.digest !== SAVED.digest}
      >
        Weekly digest
      </Switch>
    </CollapsibleCard>
  );
}
```

In `apps/docs/content/docs/components/meta.json` make one edit.

Replace:

```json
    "button",
    "card",
    "checkbox",
    "field",
    "icon-button",
    "kbd",
```

with:

```json
    "button",
    "card",
    "checkbox",
    "collapsible-card",
    "field",
    "icon-button",
    "kbd",
```

In `apps/docs/examples/index.ts` make two edits, in this order.

Edit 1. Replace:

```ts
import CheckboxSelectAll from './checkbox-select-all';
import CheckboxStates from './checkbox-states';
import CheckboxValidation from './checkbox-validation';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
import FieldParts from './field-parts';
```

with:

```ts
import CheckboxSelectAll from './checkbox-select-all';
import CheckboxStates from './checkbox-states';
import CheckboxValidation from './checkbox-validation';
import CollapsibleCardActions from './collapsible-card-actions';
import CollapsibleCardBasic from './collapsible-card-basic';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
import FieldParts from './field-parts';
```

Edit 2. Replace:

```ts
  'checkbox-select-all': CheckboxSelectAll,
  'checkbox-states': CheckboxStates,
  'checkbox-validation': CheckboxValidation,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
  'field-parts': FieldParts,
```

with:

```ts
  'checkbox-select-all': CheckboxSelectAll,
  'checkbox-states': CheckboxStates,
  'checkbox-validation': CheckboxValidation,
  'collapsible-card-actions': CollapsibleCardActions,
  'collapsible-card-basic': CollapsibleCardBasic,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
  'field-parts': FieldParts,
```

In `apps/docs/app/(home)/home-page.tsx` make one edit.

Replace:

```tsx
                <Link href="/docs/components/button">Button</Link>
                <Link href="/docs/components/card">Card</Link>
                <Link href="/docs/components/checkbox">Checkbox</Link>
                <Link href="/docs/components/field">Field parts</Link>
                <Link href="/docs/components/icon-button">Icon button</Link>
                <Link href="/docs/components/kbd">Kbd</Link>
```

with:

```tsx
                <Link href="/docs/components/button">Button</Link>
                <Link href="/docs/components/card">Card</Link>
                <Link href="/docs/components/checkbox">Checkbox</Link>
                <Link href="/docs/components/collapsible-card">Collapsible card</Link>
                <Link href="/docs/components/field">Field parts</Link>
                <Link href="/docs/components/icon-button">Icon button</Link>
                <Link href="/docs/components/kbd">Kbd</Link>
```

In `apps/docs/components/shell/rail.tsx` make one edit.

Replace:

```tsx
            <X />
          </IconButton>
        </div>
        <button
          className="rail-search"
          type="button"
          data-label="Search docs"
          aria-label="Search docs"
          onClick={onSearch}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
```

with:

```tsx
            <X />
          </IconButton>
        </div>
        {/*
          Named by its own text, so the name holds everything the button shows. An aria-label of the
          words alone left out the key beside them, which axe fails as label-content-name-mismatch.
        */}
        <button className="rail-search" type="button" data-label="Search docs" onClick={onSearch}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
```

The package READMEs list every component page in the rail's order, and `scripts/readmes.test.js` holds them to it.

In `packages/core/README.md` make one edit.

Replace:

```markdown
- [Button](https://snapshotui.com/docs/components/button)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Field parts](https://snapshotui.com/docs/components/field)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
```

with:

```markdown
- [Button](https://snapshotui.com/docs/components/button)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Collapsible card](https://snapshotui.com/docs/components/collapsible-card)
- [Field parts](https://snapshotui.com/docs/components/field)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
```

In `packages/react/README.md` make one edit.

Replace:

```markdown
- [Button](https://snapshotui.com/docs/components/button)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Field parts](https://snapshotui.com/docs/components/field)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
```

with:

```markdown
- [Button](https://snapshotui.com/docs/components/button)
- [Card](https://snapshotui.com/docs/components/card)
- [Checkbox](https://snapshotui.com/docs/components/checkbox)
- [Collapsible card](https://snapshotui.com/docs/components/collapsible-card)
- [Field parts](https://snapshotui.com/docs/components/field)
- [Icon button](https://snapshotui.com/docs/components/icon-button)
- [Kbd](https://snapshotui.com/docs/components/kbd)
```

The record. Append this to the end of `docs/design-system.md`, after its last line, with one blank line between them. Nothing above it changes.

```markdown
## CollapsibleCard

The app's folding card becomes `CollapsibleCard`: a card whose body folds
under its header, with the title as the toggle. It draws with Card's classes,
so the two look alike, and every rule it adds names a part a plain card does
not have, so a plain card is unchanged. Eight things were derived.

- **The fold is the app's grid row, without its visibility step.** Before the
  component was written, two ways to fold React Aria's `DisclosurePanel` in
  200ms were built and compared in Playwright's Chromium, Firefox and WebKit:
  the app's grid row, one track that moves between `1fr` and `0fr`, and React
  Aria's `--disclosure-panel-height`, which it sets to the panel's
  `scrollHeight` in pixels and to `auto` once the panel has settled. Both
  folded smoothly both ways with no flash, took the folded body out of the tab
  order and the accessibility tree, and stopped moving under reduced motion.
  React Aria's height failed an open card with a popup in it: `scrollHeight`
  counts an absolutely positioned child that hangs out of the body, so in
  Chromium a 147px body with a popup below it folded from 307px, jumping
  taller first, and opened to 306px before it snapped back to 147px, and
  Firefox and WebKit did the same. The grid row measures nothing and did
  neither. The app also hides a folded body with `visibility`, and that failed
  find-in-page in all three: neither `window.find()` nor a text fragment link
  reached text that `visibility` hides. So the library keeps the grid row and
  drops the visibility step. React Aria already sets `hidden="until-found"` on
  a folded panel once the panel's own transitions have finished, which takes
  the body out of the tab order and the accessibility tree and leaves it to
  find-in-page: a text fragment link opened a folded card in Chromium and
  WebKit, `window.find()` did in Firefox, and each time the card reported it
  through `onExpandedChange`. The grid is drawn only while the panel is shown,
  so a browser without `until-found` falls back to the `display: none` that
  `hidden` gives, which a `display` on the panel would override. That last
  part is reasoned and not measured, since all three browsers have
  `until-found`.
- **The body clips only while it is folded or folding.** An open card draws a
  popup inside it whole, past its edge. A body that folds has to clip, so the
  component marks the root `data-folding` on every toggle and takes the mark
  off when every transition the fold runs has finished, as `getAnimations()`
  and their `finished` promises report it: 203 to 219ms after a toggle in the
  three browsers. A toggle that turns a moving fold back replaces its
  transition, and the replaced one settles late, so only the latest toggle's
  settling takes the mark off. With nothing running, as under reduced motion,
  it comes off at once. `overflow: hidden` is keyed on that mark and on the
  folded state, and on nothing else.
- **The target is the title's row.** The title is a heading that holds the
  toggle, a button as wide as the title with the chevron at its end. Padding
  of half of what 40px has over the title's line, 5.6px, takes it to 40px, and
  an equal negative margin gives the room back, so the header is as tall as a
  plain card's. A minimum height of 40px covers the rounding of a layout in
  fractions of a pixel, which drew the padded row 39.98px tall. A title that
  wraps keeps its own height, since the margin gives back only the padding.
- **The header is a grid, and the note stays under the title.** The title
  takes the first row and the room left in it, the actions end that row, 24px
  after it, the peer step, and the note sits directly under the title, 8px
  down, as in a card. The 24px is the actions' margin and not a column gap, so
  with no actions the toggle spans the row. The header is a size container,
  and below 18rem (288px) the actions move under the note, to the row's
  start, and wrap if they must, so the order on screen is always title, note,
  actions, which is the order in the page and the order a screen reader
  reads. 18rem is measured: "Notifications" with its chevron and a tertiary
  Reset button need 272px side by side, a short title with two short buttons
  284px, and a card on a 390px phone with 16px gutters has 292px. Above it, a
  long title beside wide actions wraps, and a word too long for the room left
  breaks. A size container does not size its parent from its content, so a
  card that takes its width from what it holds takes it from the body. The
  actions are never inside the toggle, so no control sits inside another, and
  they stay usable while the card is folded.
- **The chevron turns toward the title.** It is a 24px Lucide `ChevronDown`
  in slate, which turns ink on hover, where hover exists, and on a press,
  since touch has no hover. It sits level with the first line of a title that
  wraps, beside the words a reader starts with, as a checkbox's box does.
  Folded, it turns a quarter toward the title, which is the inline start. CSS
  has no turn that follows the direction, and `:dir()` is past the browser
  floor (Chrome 120), where Lightning CSS rewrites it as a list of
  right-to-left languages and so ignores `dir`. So each `dir` attribute sets
  the turn as a custom property, 90deg for `ltr` and -90deg for `rtl`, and it
  inherits: the nearest `dir` decides, as it does for the layout.
- **The space folds with the body.** The header's bottom margin, its bottom
  padding and its rule move to 0 with the fold, so a folded card ends at its
  own 32px of padding. The fold, the space and the chevron move in 200ms,
  ease, and reduced motion stops all three.
- **The root is the card's own element.** React Aria's `Disclosure` always
  renders a div, its `render` prop must return one, and it passes on only
  global attributes, so an `aria-labelledby` would be lost. The root is the
  `div`, `section` or `article` that `as` picks, and takes `className`, `ref`
  and every attribute, and the disclosure is a div inside it that draws
  nothing. The root carries `data-expanded` from the same state the
  disclosure is given.
- **Forced colors.** The browser repaints the title in the reader's text
  color, but an svg keeps a color its author set, so the slate chevron stayed
  slate. A `@media (forced-colors: active)` block gives it the toggle's own
  color, at rest, hovered and pressed. The ring is an outline, which the
  browser keeps (checked in Chromium with forced colors emulated, in light and
  dark).

| Chevron on the card's Lifted ground | Light | Dark |
| --- | --- | --- |
| Slate, at rest | 5.31 | 6.94 |
| Ink, hovered and pressed | 17.84 | 17.42 |

Both are in the contrast gate already, as text on Lifted at 4.5:1, over the
3:1 an icon needs, so no pair was added, and a test says so. The focus ring is
the ink ring the gate holds on Lifted.
```

The size limit.

In `packages/react/.size-limit.json` make one edit.

Replace:

```json
    "limit": "1 kB"
  },
  {
    "name": "Button with React Aria (watch only)",
    "path": "dist/index.js",
    "import": "{ Button }",
```

with:

```json
    "limit": "1 kB"
  },
  {
    "name": "import { CollapsibleCard } from \"@snapshot-ui/react\"",
    "path": "dist/index.js",
    "import": "{ CollapsibleCard }",
    "ignore": ["react", "react-dom", "react-aria-components", "lucide-react"],
    "limit": "1.5 kB"
  },
  {
    "name": "Button with React Aria (watch only)",
    "path": "dist/index.js",
    "import": "{ Button }",
```

`pnpm --filter @snapshot-ui/react size` after a build prints `Size: 714 B` for the CollapsibleCard entry, under its 1.5 kB limit.

The changeset. `.changeset/collapsible-card.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Add CollapsibleCard, a card whose body folds under its header. The title is the toggle, a 40px row with a chevron, and the note and the actions stay in the header while the card is folded. It draws with Card's classes, is built on React Aria's Disclosure, and find-in-page can open a folded card.
```

Run `pnpm exec changeset status --verbose`. Expected: both packages under `minor`, with this changeset beside `checkbox-changed.md`, `disabled-labels.md` and `field-names.md`, and nothing under `major`.

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark CollapsibleCard RightToLeft
```

Expected: `Tests  220 passed (220)` for core, `Test Files  39 passed (39)` and `Tests  659 passed | 4 expected fail (663)` for React, and `Test Files  4 passed (4)` with `Tests  32 passed (32)` for the two story files. The build now ends `(51 sources, 19 client modules)`: the component, its hook and its index are three more sources, and the component is one more client module.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
pnpm --filter @snapshot-ui/react size
pnpm verify
```

Expected:
- `pnpm format` changes no file. `pnpm format:check` prints `All matched files use Prettier code style!`.
- Core: the 15 tests this task adds, so `Tests  317 passed (317)` in 5 files (302 before). React: the 27 tests this task adds, so `Tests  659 passed | 4 expected fail (663)` in 39 files (636 before). The React build ends `check-use-client: every client module keeps its directive (51 sources, 19 client modules)`, and publint prints `All good!` for both packages. Turborepo reports 10 successful tasks.
- Storybook: the 9 stories this task adds, each run in two projects, so `Tests  382 passed (382)` in 40 files (364 in 38 before). Turborepo reports 4 successful tasks.
- Docs build, type-check and lint: 5 successful tasks, and the build generates 24 static pages (23 before).
- The `lsof` prints nothing, and the end-to-end run ends `165 passed`: the 3 tests this task adds and the new page's 4 in the loops (158 before). If another checkout is using port 3100, run it as `DOCS_E2E_PORT=3504 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.
- Size: `CollapsibleCard` 714 B against its 1.5 kB limit, every other entry as it was, and the React Aria watch-only entry 13.07 kB.
- `pnpm verify` exits 0. Its first line is `check:public: no private names in 319 files` (or the no-file message on a machine without `.local`). Root tests: `tests 20`, `pass 20`. Turborepo reports 18 successful tasks.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: 30 new files and no changed ones. The six visual stories, each as `<id>--light-rounded.png`, `--dark-rounded.png`, `--light-soft.png`, `--light-square.png` and `--light-rounded-375.png`:

  - `components-collapsiblecard--open--light-rounded.png`
  - `components-collapsiblecard--open--dark-rounded.png`
  - `components-collapsiblecard--open--light-soft.png`
  - `components-collapsiblecard--open--light-square.png`
  - `components-collapsiblecard--open--light-rounded-375.png`
  - `components-collapsiblecard--folded--light-rounded.png`
  - `components-collapsiblecard--folded--dark-rounded.png`
  - `components-collapsiblecard--folded--light-soft.png`
  - `components-collapsiblecard--folded--light-square.png`
  - `components-collapsiblecard--folded--light-rounded-375.png`
  - `components-collapsiblecard--with-actions--light-rounded.png`
  - `components-collapsiblecard--with-actions--dark-rounded.png`
  - `components-collapsiblecard--with-actions--light-soft.png`
  - `components-collapsiblecard--with-actions--light-square.png`
  - `components-collapsiblecard--with-actions--light-rounded-375.png`
  - `components-collapsiblecard--nested--light-rounded.png`
  - `components-collapsiblecard--nested--dark-rounded.png`
  - `components-collapsiblecard--nested--light-soft.png`
  - `components-collapsiblecard--nested--light-square.png`
  - `components-collapsiblecard--nested--light-rounded-375.png`
  - `components-collapsiblecard--long-title--light-rounded.png`
  - `components-collapsiblecard--long-title--dark-rounded.png`
  - `components-collapsiblecard--long-title--light-soft.png`
  - `components-collapsiblecard--long-title--light-square.png`
  - `components-collapsiblecard--long-title--light-rounded-375.png`
  - `components-collapsiblecard--keyboard-focus--light-rounded.png`
  - `components-collapsiblecard--keyboard-focus--dark-rounded.png`
  - `components-collapsiblecard--keyboard-focus--light-soft.png`
  - `components-collapsiblecard--keyboard-focus--light-square.png`
  - `components-collapsiblecard--keyboard-focus--light-rounded-375.png`

No baseline from an earlier task changes. `ActionsPlacement`, `OverflowingChild` and `CollapsibleCardMirrored` are `no-visual`. The only rules added to `card.css` name parts a plain card does not have, and the 25 Card baselines were checked identical in local Chromium before and after.

What to look at:
- `components-collapsiblecard--open`: a card with "Notifications" and a slate chevron at the right end of the title's row, the note under it, the rule, and two paragraphs.
- `components-collapsiblecard--folded`: the same header with the chevron turned to point left, at the title, and no rule and no body: the card ends 32px under the note.
- `components-collapsiblecard--with-actions`: an open card with a Reset button at the end of the title's row, and a folded Billing card with a Change plan button. At 375px both cards are under 18rem inside their padding, so each button sits under its note, at the left.
- `components-collapsiblecard--nested`: a collapsible card in a Card's body and a folded one in a collapsible card's body, both with the smaller corner and the outline of a nested card.
- `components-collapsiblecard--long-title`: a 288px column with a title that wraps over several lines and breaks a long word, the chevron level with its first line, the note with its long address broken under it, then the Reset button at the left, and nothing past the card's edge.
- `components-collapsiblecard--keyboard-focus`: the ink ring around the whole title row, 2px outside it.

- [ ] **Step 7: Commit**

```bash
git add .changeset/collapsible-card.md "apps/docs/app/(home)/home-page.tsx" apps/docs/components/shell/rail.tsx apps/docs/content/docs/components/collapsible-card.mdx apps/docs/content/docs/components/meta.json apps/docs/examples/collapsible-card-actions.tsx apps/docs/examples/collapsible-card-basic.tsx apps/docs/examples/index.ts apps/docs/tests/components.spec.ts apps/docs/tests/docs.spec.ts apps/docs/tests/support.ts docs/design-system.md packages/core/README.md packages/core/src/components/card.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/README.md packages/react/src/collapsible-card/CollapsibleCard.stories.tsx packages/react/src/collapsible-card/CollapsibleCard.test.tsx packages/react/src/collapsible-card/CollapsibleCard.tsx packages/react/src/collapsible-card/index.ts packages/react/src/collapsible-card/useFolding.ts packages/react/src/index.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-collapsiblecard--*.png"
git commit -m "feat: add CollapsibleCard"
```


### Task 5: A collapsible card remembers its fold

**Files:**
- Create: `packages/react/src/collapsible-card/foldStore.ts`
- Modify: `packages/react/src/collapsible-card/CollapsibleCard.tsx`, `packages/react/src/collapsible-card/useFolding.ts`
- Test: `packages/react/src/collapsible-card/foldStore.test.ts` (create), `packages/react/src/collapsible-card/CollapsibleCard.test.tsx`, `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/collapsible-card/CollapsibleCard.stories.tsx`
- Modify: `packages/core/src/components/card.css`
- Test: `packages/core/test/css.test.js`
- Create: `apps/docs/examples/collapsible-card-remembered.tsx`
- Modify: `apps/docs/content/docs/components/collapsible-card.mdx`, `apps/docs/examples/index.ts`, `apps/docs/components/shell/shell.css` (the site's rule for `[hidden]`)
- Test: `apps/docs/tests/docs.spec.ts`
- Modify: `docs/design-system.md` (one paragraph appended to Appendix B's `## CollapsibleCard` section, after the file's last line, which is not touched)
- Create: `.changeset/collapsible-card-memory.md`
- Docker step: no baseline is added or changed.

**Interfaces:**
- Consumes:
  - From Task 4, in `packages/react/src/collapsible-card/`: `useExpanded(isExpanded, defaultExpanded, onExpandedChange)` in `CollapsibleCard.tsx`, the one place the state is decided; `useFolding(foldRef, isExpanded): void` in `useFolding.ts`; the root's `data-expanded`; and, in `card.css`, the three rules that move: the header (`.card-disclosure > .card-header`), the chevron (`.card-chevron`) and the fold (`.card-fold`).
  - From React 19: `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`. It renders with `getServerSnapshot` on the server and while it hydrates, and right after hydration it renders again with `getSnapshot` if the two differ. Every such hook in one component catches up in the same render.
  - From `react-aria-components` 1.22.1 (react-aria 3.53.1): `useDisclosure` listens for `beforematch` on the panel and calls the disclosure state's `toggle()` inside `flushSync`, which reaches the card's `onExpandedChange` handler, the same path a press takes. In the render where its `useIsSSR()` turns false, it sets `hidden="until-found"` on a folded panel at once, without reading a style.
  - Test helpers: `root` from `packages/react/test/dom.ts`; `Controlled` and `foldOf` in `CollapsibleCard.test.tsx`; `byTestId` and `partsOf` in `CollapsibleCard.stories.tsx`; `rules` and `all` in the collapsible card describe of `css.test.js`; `visit` and `settled` in `docs.spec.ts`.
- Produces `storageKey?: string` on `CollapsibleCardProps`, exported from `@snapshot-ui/react`, with the JSDoc of `defaultExpanded` and `isExpanded` updated to say what wins.
- Produces in `packages/react/src/collapsible-card/foldStore.ts`, internal, with no directive, since it imports no React Aria:

```ts
export function read(storage: Pick<Storage, 'getItem'> | null): string[];
export function write(keys: readonly string[], storage: Pick<Storage, 'setItem'> | null): void;
export function next(stored: readonly string[], key: string, isFolded: boolean): string[];
export function useStoredFold(
  key: string | undefined,
): [isFolded: boolean, setFolded: (isFolded: boolean) => void];
```

- Changes the docs site's rule for `[hidden]` in `apps/docs/components/shell/shell.css` to `[hidden]:not([hidden='until-found' i])`, still `display: none !important`.
- Produces the storage format: one `localStorage` entry, `snapshot-ui:collapsed`, holding a JSON array of the keys of the folded cards. A key that is not in it is open.
- Changes `useExpanded` to `useExpanded(isExpanded, defaultExpanded, onExpandedChange, storageKey)`. Its setter stays the one path for every change: Task 6 opens a card for an invalid field through `setExpanded(true)`, which then also stores the open.
- Changes `useFolding` to `useFolding(foldRef, isExpanded): boolean`. It returns whether the root carries `data-instant`, and the card renders the attribute from it.
- Produces this markup: the root carries `data-instant=""` from a server render until two frames after hydration. A card first rendered in the browser never carries it.
- Produces in `card.css` one rule, `.card-collapsible[data-instant] > .card-disclosure > .card-header`, `... > .card-header .card-chevron` and `... > .card-fold`, with `transition: none`.
- Produces the tests: 1 core test in the collapsible card describe of `css.test.js`; 15 React tests in the new `foldStore.test.ts`, 12 in two new describes in `CollapsibleCard.test.tsx` and 1 row in `server-render.test.tsx`; 1 story, `Remembered`, which is `no-visual`; and 2 docs end-to-end tests.

**What this task decides:**
- **One entry holds every fold.** The store keeps the keys of the folded cards in `snapshot-ui:collapsed`, as a JSON array, so a key the browser has not stored is open. A fold adds the card's key after the others, and an open takes it out. Every other key is kept as it was, in order, whether or not its card is on the page, so folds made on other pages survive.
- **The core is three pure functions with the storage passed in.** `read`, `write` and `next` take the storage as an argument and touch no `window`, so `foldStore.test.ts` runs them in Vitest's `node` environment with a storage made of a `Map`, and a test checks there is no `window` there.
- **Failure is silent.** `read` returns no keys for a missing entry, JSON that does not parse, a value that is not an array, and a storage that throws on `getItem`. It leaves out anything in the array that is not a string. `write` skips a `setItem` that throws, as a full storage's does. Getting `window.localStorage` itself can throw a `SecurityError` where the browser blocks storage, so the store reads it inside `try` and treats it as no storage. The component tests spy on `console.error` and check that nothing is logged for unreadable, blocked or full storage.
- **The page keeps its own copy while a remembered card is on it.** The store reads the entry when the first remembered card subscribes, changes its copy before it writes, and drops the copy when the last remembered card unsubscribes, so the next card to arrive reads storage afresh. So where storage is blocked or full, cards still fold and open, and stay in step on the page, but a fold lasts only while a card with a `storageKey` is on the page. That is accepted, and the `storageKey` JSDoc and the docs say it in one sentence. A card with no `storageKey` subscribes to nothing.
- **Cards and tabs stay in step.** A fold or an open tells every subscriber on the page, so every card with that key changes in the same render. The browser fires `storage` only in the other tabs, so the store listens for it, reads the entry again, and tells every subscriber. A `storage` event with a `null` key, which another tab's `localStorage.clear()` fires, counts too.
- **The server snapshot is "not folded".** The server cannot see the browser's storage, so a remembered card renders open there and while the page hydrates. The client snapshot is whether the key is stored, and React renders the card again right after hydration if it is. There is no hydration warning, because the hydrating render uses the server snapshot. The jsdom test proves it with `renderToString` and `hydrateRoot`, a `console.error` spy and an `onRecoverableError` spy. A scratch check showed the spy catches a real mismatch: with a server snapshot that read storage during hydration only, React logged "A tree hydrated but some attributes of the server rendered HTML didn't match the client properties".
- **A controlled card reads and stores nothing.** With `isExpanded` given, `useExpanded` passes no key to the store, so the stored fold is never read and a press stores nothing. The JSDoc of `isExpanded` and `storageKey` says so.
- **With a `storageKey`, a key never stored is open, whatever `defaultExpanded` says.** The entry holds only folded keys, so an open that the reader chose and a card never seen look the same, and both are open. `defaultExpanded` still applies with no `storageKey`. Its JSDoc and the docs say so.
- **Find-in-page goes through the same path as a press.** React Aria's `beforematch` handler calls the disclosure state's `toggle()`, which calls the card's `setExpanded(true)`, which stores the open and calls `onExpandedChange`. So every card with that key opens too. The jsdom test fires `beforematch` on the folded panel.
- **`onExpandedChange` reports someone using this card.** It is called for the card's own press and for find-in-page reaching it, as before. A card that follows another card or tab with the same key is syncing state, not being used, and does not call it. The prop's JSDoc and the docs' "Remembering the fold" section say so.
- **The fold that catches up after hydration is drawn at once, by a mark the server renders.**
  - A mark set by `useFolding` for one frame was built first: its layout effect set `data-instant` on the render after hydration and took it off at the next animation frame. On a server-rendered page with two cards of one stored key, in Chromium, the first card's own transitions did not start, but all five of the second card's did (`rotate`, `border-bottom-width`, `margin-bottom`, `padding-bottom` and `grid-template-rows`). Both cards fold in one commit, and layout effects run card by card: the first card's `fold.getAnimations()` brought the styles up to date while the second card was already folded and not yet marked.
  - So the mark is rendered. `useFolding` keeps `useState(!hydrated)`, which is true when the first render was the server's or the hydration of its HTML, and returns `serverRendered && !settled`. The card renders `data-instant` from it, so the attribute is in the server's HTML and is still there in the commit that folds the card, before anything can read a style. Two frames after hydration, an effect sets `settled`, and the render after that takes the mark off. The first frame draws the fold with the mark on, so taking it off changes no value that moves, and starts nothing.
  - `hydrated` comes from `useSyncExternalStore` with a subscription to nothing, `() => true` on the client and `() => false` for the server, the pattern the docs site's `useMounted` uses. A card first rendered in the browser starts with `hydrated` true, never carries the mark and never renders again for it.
  - The cost is one more render for each server-rendered card, two frames after hydration, and transitions held off on those cards until then. Nothing moves on a page before it hydrates, so nothing is lost.
  - The CSS rule names each moving part from the card's own root with child combinators, so a card nested in the body keeps its own motion. Each of its selectors weighs four classes and attributes or more, and no rule that sets a transition weighs more than two, so it wins wherever it sits. A core test checks that its only declaration is `transition: none`, that each selector starts at the card's root, and that each part a transition moves ends one of them.
- **Checked in three real browsers, in a scratch harness.** A page was server-rendered with `renderToString` from the built `@snapshot-ui/react`, with two cards of one key and a card with none, and the built `@snapshot-ui/core` stylesheet. An init script stored the key as folded, and the page hydrated with `hydrateRoot` two frames after its first paint, so the open cards had been drawn. A capture listener recorded every `transitionrun` from the cards' header, chevron and fold, and a MutationObserver recorded `data-expanded` and `data-instant`. In Playwright's Chromium 156, Firefox 153 and WebKit 27.2: both cards folded at hydration and no transition started, against five on each folded card with the rule taken out of the stylesheet; the mark came off after the fold; no error was logged; and a later press started all five on both cards.
- **Find-in-page was checked in the same three browsers, in the same harness.** A client-rendered page held two cards of one key, stored as folded beside a key of a card not on the page, and a word that only the first card's body held. A text fragment link (`#:~:text=`) in Chromium and WebKit, and `window.find()` in Firefox, opened both cards and left `["billing"]` stored, the other key kept.
- **The docs site's rule for `[hidden]` spares a panel that is hidden until found.**
  - `apps/docs/components/shell/shell.css` had `[hidden] { display: none !important; }`, from before this plan. It beat `hidden="until-found"`, so on the docs site a folded card's body was `display: none`: find-in-page could not reach it, and opening a settled fold jumped to its full height in one frame, with no transition, in Chromium, Firefox and WebKit.
  - The rule is now `[hidden]:not([hidden='until-found' i])`, still `display: none !important` for every other hidden element. A search of the docs app found no element that relied on it to hide an `until-found` one: the preview tabs, the home page's menu overlay and the rail's tooltip all set a plain `hidden`, which renders `hidden=""`, and the only `until-found` in the built site is React Aria's disclosure panel.
  - A new end-to-end test checks that the folded Billing card's panel carries `hidden="until-found"` and that its computed `display` is not `none`. Before the change it fails with `Received: "none"`.
  - Checked in Chromium with a throwaway script: a text fragment link for a sentence in the folded Billing card opened it on the docs page. Opening a settled fold now moves there: sampled in Chromium, Firefox and WebKit, the body's height grows from 0 to 133px over the 200ms.
  - A known limit, also measured on the docs page: a text fragment for a sentence in a card whose fold is remembered does not open it. The server draws that card open, so Chromium finds the text and scrolls to it before hydration folds the card. An app that needs this right controls the card from state the server can read, as for the first frame.
- **The docs end-to-end test checks the mark, not the transitions.** The docs' theme provider is next-themes with `disableTransitionOnChange`, which adds `* { transition: none !important; }` for a moment when it applies the theme after hydration, so on the docs site no transition would start at hydration even without the rule. The test checks what the docs page can show: the server's HTML holds the card open with the mark, the card folds at hydration with the mark still on, the mark comes off after, nothing is logged, and a later press turns the chevron. The harness above is the check of the rule itself.
- **The `Remembered` story is `no-visual`.** Its look is `Open` and then `Folded`, which are shot already. Its play function folds the card, renders it anew through a "Render again" button that changes the card's React `key`, and checks the new card is folded from its first render: no `data-folding`, and no animation in its subtree. Its `beforeEach` takes its own key out of the entry before the story runs and after it, by hand, so the story reads and writes the documented format and keeps any other key. The two Storybook projects run in separate browser contexts, so they do not share the entry: a scratch story that wrote a random key in each and waited 3 seconds found one key in each.
- **The server render test gains a row**: a card with a `storageKey` renders in Node with no window, open, with the mark.
- **The docs example is a server file.** `collapsible-card-remembered` renders a card with a `storageKey` from a server component, so the page shows a remembered card that the server draws open. Its key is `docs-collapsible-card-shortcuts`, so it never meets a reader's own cards.
- **No color or contrast pair is added.** The rule only turns transitions off.
- **Checked on the docs page** in Chromium, with the remembered card open and with it folded from storage: axe found no violation in light or dark, and there was no sideways scroll at 320, 375 or 1440px.
- **Size.** The `CollapsibleCard` entry grows from 714 B to 1.2 kB with React Aria and Lucide left out, under its 1.5 kB limit, which stays.

- [ ] **Step 1: Write the failing tests**

The pure functions first. Create `packages/react/src/collapsible-card/foldStore.test.ts`:

```ts
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { next, read, write } from './foldStore';

/** The entry the store keeps its folds in. */
const ENTRY = 'snapshot-ui:collapsed';

/**
 * A storage that keeps entries as the browser's does, with no browser around it, holding `value` in the
 * entry when one is given.
 */
function storage(value?: string): Pick<Storage, 'getItem' | 'setItem'> {
  const held = new Map<string, string>(value === undefined ? [] : [[ENTRY, value]]);
  return {
    getItem: (key) => held.get(key) ?? null,
    setItem: (key, item) => {
      held.set(key, item);
    },
  };
}

/** A storage the browser refuses to read or write, as a blocked one or a full one does. */
const refusing: Pick<Storage, 'getItem' | 'setItem'> = {
  getItem() {
    throw new DOMException('The operation is insecure.', 'SecurityError');
  },
  setItem() {
    throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
  },
};

describe('the fold store', () => {
  it('runs with no browser, so the stored folds are read and written by pure functions', () => {
    expect(typeof window).toBe('undefined');
  });

  it('reads the folded keys from one JSON list', () => {
    expect(read(storage('["notifications","billing"]'))).toEqual(['notifications', 'billing']);
    expect(read(storage('[]'))).toEqual([]);
  });

  it.each([
    ['no entry', undefined],
    ['unreadable JSON', '["notifications"'],
    ['an object', '{"notifications":true}'],
    ['a string', '"notifications"'],
    ['null', 'null'],
  ])('reads %s as no folded keys', (_name, value) => {
    expect(read(storage(value))).toEqual([]);
  });

  it('leaves out anything in the list that is not a key', () => {
    expect(read(storage('["notifications",3,null,{"key":"billing"},"billing"]'))).toEqual([
      'notifications',
      'billing',
    ]);
  });

  it('reads no folded keys from a storage the browser refuses, or from none, and throws nothing', () => {
    expect(read(refusing)).toEqual([]);
    expect(read(null)).toEqual([]);
  });

  it('writes the folded keys as one JSON list', () => {
    const stored = storage();
    write(['notifications', 'billing'], stored);
    expect(stored.getItem(ENTRY)).toBe('["notifications","billing"]');
    expect(read(stored)).toEqual(['notifications', 'billing']);
    write([], stored);
    expect(stored.getItem(ENTRY)).toBe('[]');
  });

  it('skips a write the browser refuses, or with no storage, and throws nothing', () => {
    expect(() => {
      write(['notifications'], refusing);
    }).not.toThrow();
    expect(() => {
      write(['notifications'], null);
    }).not.toThrow();
  });

  it('adds the key of a card that folds, after the others', () => {
    expect(next([], 'notifications', true)).toEqual(['notifications']);
    expect(next(['billing'], 'notifications', true)).toEqual(['billing', 'notifications']);
  });

  it('takes out the key of a card that opens, and keeps every other key as it was', () => {
    expect(next(['billing', 'notifications', 'profile'], 'notifications', false)).toEqual([
      'billing',
      'profile',
    ]);
    expect(next(['billing'], 'notifications', false)).toEqual(['billing']);
  });

  it('keeps a key once, however often its card folds', () => {
    expect(next(['notifications', 'billing'], 'notifications', true)).toEqual(['billing', 'notifications']);
    expect(next(['notifications', 'notifications'], 'notifications', false)).toEqual([]);
  });

  it('changes nothing it is given', () => {
    const stored = Object.freeze(['billing', 'notifications']);
    expect(next(stored, 'profile', true)).toEqual(['billing', 'notifications', 'profile']);
    expect(next(stored, 'billing', false)).toEqual(['notifications']);
    expect(stored).toEqual(['billing', 'notifications']);
  });
});
```

In `packages/react/src/collapsible-card/CollapsibleCard.test.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
```

with:

```tsx
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
```

Edit 2. Replace:

```tsx
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('CollapsibleCard', () => {
```

with:

```tsx
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/** The entry the store keeps its folds in. */
const ENTRY = 'snapshot-ui:collapsed';

/** The folds the browser has stored, as written, or null when nothing has been written. */
const stored = (): unknown => JSON.parse(localStorage.getItem(ENTRY) ?? 'null');

/**
 * Stores folds the way another tab does, or clears the storage when given null, and tells this tab as the
 * browser does.
 */
function storeInAnotherTab(keys: string[] | null): void {
  if (keys === null) localStorage.clear();
  else localStorage.setItem(ENTRY, JSON.stringify(keys));
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: keys === null ? null : ENTRY,
        newValue: keys === null ? null : JSON.stringify(keys),
        storageArea: localStorage,
      }),
    );
  });
}

/** The toggle of the card with this title. */
const toggleOf = (title: string): HTMLElement => screen.getByRole('button', { name: title });

/** Waits for the next frame, after anything a frame was asked to do. */
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

describe('CollapsibleCard', () => {
```

Edit 3. Replace:

```tsx
    await expectNoA11yViolations(container);
  });
});
```

with:

```tsx
    await expectNoA11yViolations(container);
  });
});

describe('CollapsibleCard with a storageKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('stores its fold, and is folded again when it renders anew', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { unmount } = render(
      <CollapsibleCard title="Notifications" storageKey="notifications" onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    // Nothing is stored until the card folds or opens.
    expect(stored()).toBeNull();
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toEqual(['notifications']);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    unmount();
    const { container } = render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    // Folded from its first render: nothing moved, so nothing marks a fold, and a card first rendered in the
    // browser has nothing to catch up with.
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(root(container)).not.toHaveAttribute('data-folding');
    expect(root(container)).not.toHaveAttribute('data-instant');
    expect(foldOf(container)).toHaveAttribute('hidden', 'until-found');
    // Opened, its key comes out.
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    expect(stored()).toEqual([]);
  });

  it('is open when its key was never stored, whatever defaultExpanded says', () => {
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications" defaultExpanded={false}>
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
  });

  it('folds and opens every card with the same key together, and no other', async () => {
    const user = userEvent.setup();
    render(
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Billing" storageKey="billing">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Profile">Body</CollapsibleCard>
      </>,
    );
    const expanded = (): (string | null)[] =>
      ['Notifications', 'Notifications again', 'Billing', 'Profile'].map((title) =>
        toggleOf(title).getAttribute('aria-expanded'),
      );
    await user.click(toggleOf('Notifications'));
    expect(expanded()).toEqual(['false', 'false', 'true', 'true']);
    await user.click(toggleOf('Billing'));
    expect(expanded()).toEqual(['false', 'false', 'false', 'true']);
    await user.click(toggleOf('Notifications again'));
    expect(expanded()).toEqual(['true', 'true', 'false', 'true']);
    expect(stored()).toEqual(['billing']);
  });

  it('folds and opens when another tab stores its fold, or clears the storage', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    storeInAnotherTab(['billing', 'notifications']);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    storeInAnotherTab(['billing']);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    storeInAnotherTab(['notifications']);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    storeInAnotherTab(null);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the stored keys of cards that are not on the page', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["billing","profile"]');
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    await user.click(toggleOf('Notifications'));
    expect(stored()).toEqual(['billing', 'profile', 'notifications']);
    await user.click(toggleOf('Notifications'));
    expect(stored()).toEqual(['billing', 'profile']);
  });

  it.each([
    ['unreadable JSON', '["notifications"'],
    ['not a list', '{"notifications":true}'],
  ])('is open when the stored folds are %s, then folds and stores a good list', async (_name, value) => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    localStorage.setItem(ENTRY, value);
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toEqual(['notifications']);
    expect(error).not.toHaveBeenCalled();
  });

  it('is open where the browser blocks storage, and still folds and opens, in step, with no error', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    render(
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Body
        </CollapsibleCard>
      </>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(toggleOf('Notifications again')).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications again')).toHaveAttribute('aria-expanded', 'true');
    expect(error).not.toHaveBeenCalled();
  });

  it('still folds when the browser refuses the write, as a full storage does, with no error', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toBeNull();
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    expect(error).not.toHaveBeenCalled();
  });

  it('reads and stores nothing when isExpanded controls it', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    localStorage.setItem(ENTRY, '["notifications"]');
    render(
      <>
        <CollapsibleCard
          title="Notifications"
          storageKey="notifications"
          isExpanded
          onExpandedChange={onExpandedChange}
        >
          Body
        </CollapsibleCard>
        <Controlled title="Billing" storageKey="billing">
          Body
        </Controlled>
      </>,
    );
    // The caller's state wins over the stored fold.
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Notifications'));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Billing'));
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toEqual(['notifications']);
  });

  it('opens through the store when find-in-page reaches its folded body, and so does every card with its key', () => {
    const onExpandedChange = vi.fn();
    localStorage.setItem(ENTRY, '["billing","notifications"]');
    const { container } = render(
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications" onExpandedChange={onExpandedChange}>
          Product updates
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Weekly digest
        </CollapsibleCard>
      </>,
    );
    const [fold, again] = container.querySelectorAll('.card-fold');
    expect(fold).toHaveAttribute('hidden', 'until-found');
    expect(again).toHaveAttribute('hidden', 'until-found');
    // The browser fires beforematch on a hidden="until-found" element before it shows text found in it.
    act(() => {
      fold?.dispatchEvent(new Event('beforematch'));
    });
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    expect(toggleOf('Notifications again')).toHaveAttribute('aria-expanded', 'true');
    expect(fold).not.toHaveAttribute('hidden');
    expect(again).not.toHaveAttribute('hidden');
    expect(stored()).toEqual(['billing']);
  });
});

describe('CollapsibleCard on a server-rendered page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders open, folds a remembered fold at hydration with transitions held off and no warning, then moves as usual', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["notifications"]');
    // Two cards with one key, which fold in the same commit.
    const page = (
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Body
        </CollapsibleCard>
      </>
    );
    // The server cannot see the browser's storage, so it draws both cards open, each holding its transitions
    // off with the mark.
    const html = renderToString(page);
    expect(html.match(/class="card card-collapsible" data-expanded="" data-instant=""/g)).toHaveLength(2);
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(2);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const cards = [...container.querySelectorAll('.card-collapsible')];
    // Every state each root gains or loses, in order, however quickly it changes back.
    const changes: string[] = [];
    const record = (records: MutationRecord[]): void => {
      for (const { target, attributeName, oldValue } of records) {
        const title = (target as Element).querySelector('.card-toggle-text')?.textContent ?? '';
        changes.push(`${title}: ${attributeName ?? ''} ${oldValue === null ? 'set' : 'removed'}`);
      }
    };
    const observer = new MutationObserver(record);
    for (const card of cards) {
      observer.observe(card, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['data-expanded', 'data-instant'],
      });
    }
    const error = vi.spyOn(console, 'error');
    const onRecoverableError = vi.fn();
    let hydrated: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      hydrated = hydrateRoot(container, page, { onRecoverableError });
      await Promise.resolve();
    });
    // Hydrated, both cards caught up with the stored fold while the mark held every transition off.
    for (const title of ['Notifications', 'Notifications again']) {
      expect(toggleOf(title)).toHaveAttribute('aria-expanded', 'false');
    }
    for (const card of cards) {
      expect(card).not.toHaveAttribute('data-expanded');
      expect(card).toHaveAttribute('data-instant', '');
      expect(card.querySelector('.card-fold')).toHaveAttribute('hidden', 'until-found');
    }
    await act(async () => {
      await nextFrame();
      await nextFrame();
    });
    record(observer.takeRecords());
    // The mark was there before either card folded, and came off two frames later.
    expect(changes).toEqual([
      'Notifications: data-expanded removed',
      'Notifications again: data-expanded removed',
      'Notifications: data-instant removed',
      'Notifications again: data-instant removed',
    ]);
    expect(error).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();
    // A toggle after that moves as usual: nothing holds the transitions off.
    changes.length = 0;
    await user.click(toggleOf('Notifications'));
    await act(async () => {
      await nextFrame();
      await nextFrame();
    });
    record(observer.takeRecords());
    expect(changes).toEqual(['Notifications: data-expanded set', 'Notifications again: data-expanded set']);
    expect(stored()).toEqual([]);
    observer.disconnect();
    act(() => {
      hydrated?.unmount();
    });
    container.remove();
  });
});
```

In `packages/react/test/server-render.test.tsx` make one edit.

Replace:

```tsx
      '<div class="card-body"><p>Product updates</p></div>',
    ],
  ],
];

describe('the client components on the server', () => {
```

with:

```tsx
      '<div class="card-body"><p>Product updates</p></div>',
    ],
  ],
  [
    // The server cannot see the browser's storage, so a card that remembers its fold renders open, and holds
    // every transition off until hydration has caught up with the fold.
    'CollapsibleCard with a storageKey',
    <CollapsibleCard title="Notifications" storageKey="notifications">
      <p>Product updates</p>
    </CollapsibleCard>,
    ['class="card card-collapsible"', 'data-expanded=""', 'data-instant=""', 'aria-expanded="true"'],
  ],
];

describe('the client components on the server', () => {
```

The core test goes in the collapsible card describe, after the test of the clip.

In `packages/core/test/css.test.js` make one edit.

Replace:

```js
    expect(clipping[0]?.body).toContain('overflow: hidden;');
  });

  it('lays the header out as a grid: the title and the actions on one row, the note under the title', () => {
    const css = rules();
    const header = blockAfter(css, '.card-disclosure > .card-header {');
```

with:

```js
    expect(clipping[0]?.body).toContain('overflow: hidden;');
  });

  it('turns off every transition it draws while the root carries data-instant, for this card alone', () => {
    const instant = all().filter(({ selector }) => selector.includes('[data-instant]'));
    expect(instant).toHaveLength(1);
    expect(instant[0]?.body).toBe('transition: none;');
    const selectors = instant[0]?.selector.split(', ') ?? [];
    // Reached from the card's own root, part by part, so a card nested in the body keeps its own motion.
    for (const selector of selectors) {
      expect(selector).toMatch(/^\.card-collapsible\[data-instant\] > \.card-disclosure > /);
    }
    const moving = all().filter(
      ({ body }) => /(?:^|;\s*)transition\s*:/.test(body) && !body.includes('transition: none'),
    );
    expect(moving.length).toBeGreaterThan(0);
    for (const { selector } of moving) {
      // The part that moves, the last class in its selector, ends one of the selectors that stop it.
      const part = /\.[a-z-]+$/.exec(selector)?.[0] ?? selector;
      expect(selectors.some((stop) => stop.endsWith(` ${part}`))).toBe(true);
    }
  });

  it('lays the header out as a grid: the title and the actions on one row, the note under the title', () => {
    const css = rules();
    const header = blockAfter(css, '.card-disclosure > .card-header {');
```

In `packages/react/src/collapsible-card/CollapsibleCard.stories.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { firstLineOffset, lineCount, tokenPixels } from '../stories/paint';
import { CollapsibleCard } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
function partsOf(card: Element): {
```

with:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { firstLineOffset, lineCount, tokenPixels } from '../stories/paint';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
function partsOf(card: Element): {
```

Edit 2. Replace:

```tsx
    await expect(drawnWhole()).toBe(true);
  },
};
```

with:

```tsx
    await expect(drawnWhole()).toBe(true);
  },
};

/** The key the Remembered story's card stores its fold under. */
const REMEMBERED = 'storybook-collapsible-card-remembered';

/** Takes the Remembered story's key out of the stored folds, and keeps every other card's. */
function forget(): void {
  const stored: unknown = JSON.parse(localStorage.getItem('snapshot-ui:collapsed') ?? '[]');
  const keys = Array.isArray(stored) ? stored.filter((key) => key !== REMEMBERED) : [];
  localStorage.setItem('snapshot-ui:collapsed', JSON.stringify(keys));
}

/** A card, and a button that takes it off the page and renders a new one in its place, as a reload would. */
function RenderAgain(props: CollapsibleCardProps): ReactElement {
  const [renders, setRenders] = useState(0);
  return (
    <div style={{ display: 'grid', gap: 24 }}>
      <CollapsibleCard key={renders} {...props} />
      <div>
        <Button
          variant="secondary"
          onPress={() => {
            setRenders(renders + 1);
          }}
        >
          Render again
        </Button>
      </div>
    </div>
  );
}

/**
 * With a storageKey the card remembers its fold. Folded, then taken off the page and rendered anew, it is
 * folded from its first render, so nothing moves. The story clears its key before it runs and after.
 */
export const Remembered: Story = {
  // A check of the store: the open and the folded card are shot in Open and Folded.
  tags: ['no-visual'],
  args: { storageKey: REMEMBERED },
  beforeEach: () => {
    forget();
    return forget;
  },
  render: (args) => (
    <RenderAgain {...args} data-testid="card">
      <p>Product updates, when something ships.</p>
    </RenderAgain>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const first = byTestId(canvasElement, 'card');
    await expect(partsOf(first).toggle).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(partsOf(first).toggle);
    await expect(partsOf(first).toggle).toHaveAttribute('aria-expanded', 'false');
    await waitFor(async () => {
      await expect(first).not.toHaveAttribute('data-folding');
    });
    await userEvent.click(canvas.getByRole('button', { name: 'Render again' }));
    const second = byTestId(canvasElement, 'card');
    await expect(first.isConnected).toBe(false);
    await expect(second).not.toHaveAttribute('data-expanded');
    await expect(partsOf(second).toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(canvas.getByText('Product updates, when something ships.')).not.toBeVisible();
    // Folded from its first render: no fold is marked and no transition runs.
    await expect(second).not.toHaveAttribute('data-folding');
    await expect(second.getAnimations({ subtree: true })).toHaveLength(0);
  },
};
```

The two end-to-end tests go at the end of the file.

In `apps/docs/tests/docs.spec.ts` make one edit.

Replace:

```ts
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(body).toBeHidden();
});
```

with:

```ts
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(body).toBeHidden();
});

test('a collapsible card remembers its fold over a reload, and folds at hydration with its transitions held off', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  // From before the page's first script: each change to the Shortcuts card's root, in order, and each
  // transition that one of its parts starts. The docs' theme switch also holds every transition off while
  // the page hydrates, so on this page the mark is what is checked.
  await page.addInitScript(() => {
    const changes: string[] = [];
    const runs: string[] = [];
    Object.assign(window, { changes, runs });
    /** The Shortcuts card, if `element` is in it. */
    const shortcuts = (element: unknown): Element | null => {
      const card = element instanceof Element ? element.closest('.card-collapsible') : null;
      return card?.querySelector('.card-toggle-text')?.textContent === 'Shortcuts' ? card : null;
    };
    new MutationObserver((records) => {
      for (const { target, attributeName, oldValue } of records) {
        if (shortcuts(target) === target) {
          changes.push(`${attributeName ?? ''} ${oldValue === null ? 'set' : 'removed'}`);
        }
      }
    }).observe(document, {
      subtree: true,
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['data-expanded', 'data-instant'],
    });
    window.addEventListener(
      'transitionrun',
      (event) => {
        if (shortcuts(event.target)) runs.push(event.propertyName);
      },
      true,
    );
  });
  const read = (name: 'changes' | 'runs'): Promise<string[]> =>
    page.evaluate((key) => (window as unknown as Record<string, string[]>)[key] ?? [], name);
  const stored = (): Promise<string | null> =>
    page.evaluate(() => localStorage.getItem('snapshot-ui:collapsed'));
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Shortcuts', exact: true });
  const card = page.locator('.card-collapsible').filter({ has: toggle });
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await stored()).toBe('["docs-collapsible-card-shortcuts"]');
  const response = await page.reload();
  // The server cannot see the stored fold, so it sent the card open, with the mark that holds every
  // transition off: the root, then the card's own toggle, with no other card's root between them.
  const html = (await response?.text()) ?? '';
  expect(html).toMatch(
    /class="card card-collapsible" data-expanded="" data-instant="">(?:(?!card-collapsible).)*?aria-expanded="true"[^>]*><span class="card-toggle-text">Shortcuts</s,
  );
  await settled(page);
  // Hydrated, the card folded while the mark held its transitions off, and the mark came off after it.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(card.locator('.card-fold')).toHaveAttribute('hidden', 'until-found');
  await expect(card).not.toHaveAttribute('data-instant');
  await expect(card).not.toHaveAttribute('data-folding');
  expect(await read('changes')).toEqual(['data-expanded removed', 'data-instant removed']);
  expect(errors).toEqual([]);
  // A press after that moves as usual, and the card is remembered open.
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect.poll(() => read('runs')).toContain('rotate');
  expect(await read('changes')).toEqual([
    'data-expanded removed',
    'data-instant removed',
    'data-expanded set',
  ]);
  expect(await stored()).toBe('[]');
});

test('a folded collapsible card on its page is hidden until found, so find-in-page can reach it', async ({
  page,
}) => {
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Billing', exact: true });
  const fold = page.locator('.card-collapsible').filter({ has: toggle }).locator('.card-fold');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(fold).toHaveAttribute('hidden', 'until-found');
  // The site's rule for [hidden] leaves this one to the browser, which keeps the panel in the layout and
  // hides what it holds, instead of taking it out with display: none, where find-in-page cannot look.
  await expect(fold).not.toHaveCSS('display', 'none');
  await expect(fold.locator('.card-body')).toBeHidden();
});
```

- [ ] **Step 2: Run them and watch them fail**

The stories and the docs read the built packages, so build them first. They are still the old code at this point.

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark CollapsibleCard
rm -rf apps/docs/.next
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:

- The build ends `check-use-client: every client module keeps its directive (51 sources, 19 client modules)`.
- The core run FAILS with `Test Files  1 failed (1)` and `Tests  1 failed | 196 passed (197)`:

```text
FAIL  test/css.test.js > src/components/card.css, the collapsible card > turns off every transition it draws while the root carries data-instant, for this card alone
AssertionError: expected [] to have a length of 1 but got +0
```

- The React run FAILS with `Test Files  3 failed | 37 passed (40)` and `Tests  11 failed | 661 passed | 4 expected fail (676)`. The new store file cannot load, the server render row finds no mark, and 10 of the 12 new component tests fail. The two that pass pin what must stay true: a card whose write is refused still folds, and a controlled card stores nothing.

```text
FAIL  src/collapsible-card/foldStore.test.ts [ src/collapsible-card/foldStore.test.ts ]
Error: Cannot find module './foldStore' imported from .../packages/react/src/collapsible-card/foldStore.test.ts
FAIL  test/server-render.test.tsx > the client components on the server > CollapsibleCard with a storageKey renders to HTML with no browser
AssertionError: expected '<div storageKey="notifications" class…' to contain 'data-instant=""'
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > stores its fold, and is folded again when it renders anew
AssertionError: expected null to deeply equal [ 'notifications' ]
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > is open when its key was never stored, whatever defaultExpanded says
Error: expect(element).toHaveAttribute("aria-expanded", "true") // element.getAttribute("aria-expanded") === "true"
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > folds and opens every card with the same key together, and no other
AssertionError: expected [ 'false', 'true', 'true', 'true' ] to deeply equal [ 'false', 'false', 'true', 'true' ]
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > folds and opens when another tab stores its fold, or clears the storage
Error: expect(element).toHaveAttribute("aria-expanded", "false") // element.getAttribute("aria-expanded") === "false"
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > keeps the stored keys of cards that are not on the page
AssertionError: expected [ 'billing', 'profile' ] to deeply equal [ 'billing', 'profile', …(1) ]
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > is open when the stored folds are unreadable JSON, then folds and stores a good list
SyntaxError: Expected ',' or ']' after array element in JSON at position 16 (line 1 column 17)
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > is open when the stored folds are not a list, then folds and stores a good list
AssertionError: expected { notifications: true } to deeply equal [ 'notifications' ]
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > is open where the browser blocks storage, and still folds and opens, in step, with no error
Error: expect(element).toHaveAttribute("aria-expanded", "false") // element.getAttribute("aria-expanded") === "false"
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a storageKey > opens through the store when find-in-page reaches its folded body, and so does every card with its key
Error: expect(element).toHaveAttribute("hidden", "until-found") // element.getAttribute("hidden") === "until-found"
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard on a server-rendered page > renders open, folds a remembered fold at hydration with transitions held off and no warning, then moves as usual
AssertionError: Target cannot be null or undefined.
```

  The last one fails on the server's HTML, which carries no mark yet, so its `match` finds nothing.

- The Storybook run FAILS with `Test Files  2 failed (2)` and `Tests  2 failed | 16 passed (18)`: `Remembered`, in the `storybook` and the `storybook-dark` project, each with `expect(element).not.toHaveAttribute("data-expanded")` after rendering the card again.
- The docs build lists 24 static pages. The `lsof` prints nothing; if another checkout uses port 3100, run the suite as `DOCS_E2E_PORT=3505 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free. The end-to-end run FAILS with `2 failed` and `165 passed`:
  - `a collapsible card remembers its fold over a reload, and folds at hydration with its transitions held off`, with `Locator: getByRole('button', { name: 'Shortcuts', exact: true })` and `Error: element(s) not found`. The example does not exist yet.
  - `a folded collapsible card on its page is hidden until found, so find-in-page can reach it`, with `Expected: not "none"` and `Received: "none"`. The site's rule for `[hidden]` still takes the panel out.

- [ ] **Step 3: Write the store, the wiring, the CSS, the docs, the record and the changeset**

The store. Create `packages/react/src/collapsible-card/foldStore.ts`:

```ts
import { useSyncExternalStore } from 'react';

/** The one `localStorage` entry every remembered card shares: a JSON list of the keys of the folded ones. */
const ENTRY = 'snapshot-ui:collapsed';

/**
 * The keys of the folded cards in `storage`. An entry that is missing, is not JSON or is not a list, and a
 * storage that refuses to be read, all read as no folded cards, so every card is open. Anything in the list
 * that is not a string is left out.
 */
export function read(storage: Pick<Storage, 'getItem'> | null): string[] {
  try {
    const stored: unknown = JSON.parse(storage?.getItem(ENTRY) ?? '[]');
    return Array.isArray(stored) ? stored.filter((key): key is string => typeof key === 'string') : [];
  } catch {
    return [];
  }
}

/**
 * Stores the keys of the folded cards in `storage`. A storage that is full, or refuses the write, keeps
 * nothing.
 */
export function write(keys: readonly string[], storage: Pick<Storage, 'setItem'> | null): void {
  try {
    storage?.setItem(ENTRY, JSON.stringify(keys));
  } catch {
    // Full, or blocked: the fold then lasts only while the card is on the page.
  }
}

/**
 * The stored keys once the card with `key` has folded or opened: its key is added or taken out, and every
 * other key is kept as it was, in order, whether or not its card is on this page.
 */
export function next(stored: readonly string[], key: string, isFolded: boolean): string[] {
  const others = stored.filter((each) => each !== key);
  return isFolded ? [...others, key] : others;
}

/** The browser's `localStorage`, or null where there is none or the browser blocks it. */
function local(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The remembered cards on the page, each told when the folded keys change. */
const listeners = new Set<() => void>();

/**
 * The folded keys as the page knows them, while a remembered card is on it: read from storage when the first
 * card arrives, changed here before storage is written, so a card still folds where storage cannot keep it,
 * read again when another tab writes, and dropped when the last card leaves.
 */
let known: readonly string[] | undefined;

const folded = (): readonly string[] => known ?? read(local());

function tell(): void {
  for (const listener of listeners) listener();
}

/** Another tab wrote the entry or cleared its storage. The event never fires in the tab that wrote. */
function onStorage(event: StorageEvent): void {
  if (event.key !== null && event.key !== ENTRY) return;
  known = read(local());
  tell();
}

function subscribe(listener: () => void): () => void {
  if (listeners.size === 0) {
    known = read(local());
    window.addEventListener('storage', onStorage);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size > 0) return;
    window.removeEventListener('storage', onStorage);
    known = undefined;
  };
}

const subscribeNothing = (): (() => void) => () => undefined;

/**
 * Whether the card with `key` is folded, as this browser remembers it, and a setter that remembers a fold or
 * an open and tells every card with the same key. With no key it reads, stores and subscribes to nothing, and
 * is never folded. The server cannot see the browser's storage, so on the server, and while the page
 * hydrates, nothing is folded: a server-rendered card is drawn open and folds once the page has hydrated.
 *
 * Internal: not exported from the package.
 */
export function useStoredFold(
  key: string | undefined,
): [isFolded: boolean, setFolded: (isFolded: boolean) => void] {
  const isFolded = useSyncExternalStore(
    key === undefined ? subscribeNothing : subscribe,
    () => key !== undefined && folded().includes(key),
    () => false,
  );
  const setFolded = (fold: boolean): void => {
    if (key === undefined) return;
    known = next(folded(), key, fold);
    write(known, local());
    tell();
  };
  return [isFolded, setFolded];
}
```

The card takes `storageKey`, decides its state from the store, and renders the mark.

In `packages/react/src/collapsible-card/CollapsibleCard.tsx` make six edits, in this order.

Edit 1. Replace:

```tsx
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useFolding } from './useFolding';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
```

with:

```tsx
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStoredFold } from './foldStore';
import { useFolding } from './useFolding';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
```

Edit 2. Replace:

```tsx
   */
  actions?: ReactNode;
  /**
   * Whether the card is open on the first render, when `isExpanded` does not control it.
   * @default true
   */
  defaultExpanded?: boolean;
  /** Whether the card is open. Given, it controls the card: pair it with `onExpandedChange`. */
  isExpanded?: boolean;
  /** Called with the new state when the card opens or folds, from its toggle or from find-in-page. */
  onExpandedChange?: (isExpanded: boolean) => void;
  /**
   * The element to render. A `section` with an accessible name is a region landmark. An `article` is
   * not a landmark, named or not, and a `div` is neither.
```

with:

```tsx
   */
  actions?: ReactNode;
  /**
   * Whether the card is open on the first render, when neither `isExpanded` nor `storageKey` decides it.
   * @default true
   */
  defaultExpanded?: boolean;
  /**
   * Whether the card is open. Given, it controls the card: pair it with `onExpandedChange`. It wins over
   * `storageKey`, and the card then reads and stores nothing.
   */
  isExpanded?: boolean;
  /**
   * Called with the new state when someone opens or folds this card, by its toggle or by find-in-page. A
   * card that follows another card or tab with the same `storageKey` is syncing state, not being used, and
   * does not call it.
   */
  onExpandedChange?: (isExpanded: boolean) => void;
  /**
   * Remembers the fold in this browser under this key, so the card is folded again the next time the page
   * opens. Cards with the same key fold together, on the page and in other tabs. A card whose key the
   * browser has not stored is open, whatever `defaultExpanded` says. Ignored when `isExpanded` is given.
   * The server cannot see the browser's storage, so a server-rendered card is drawn open and folds, with no
   * transition, once the page has hydrated. Where the browser blocks storage or refuses a write, a fold lasts
   * only while a card with a `storageKey` is on the page.
   */
  storageKey?: string;
  /**
   * The element to render. A `section` with an accessible name is a region landmark. An `article` is
   * not a landmark, named or not, and a `div` is neither.
```

Edit 3. Replace:

```tsx
}

/**
 * Whether the card is open: `isExpanded` when the caller controls it, and otherwise the card's own state,
 * starting from `defaultExpanded`. Every change goes through the setter, which tells `onExpandedChange`.
 * This is the one place the state is decided.
 */
function useExpanded(
  isExpanded: boolean | undefined,
  defaultExpanded: boolean,
  onExpandedChange: ((isExpanded: boolean) => void) | undefined,
): [isExpanded: boolean, setExpanded: (isExpanded: boolean) => void] {
  const [own, setOwn] = useState(defaultExpanded);
  const setExpanded = (next: boolean): void => {
    setOwn(next);
    onExpandedChange?.(next);
  };
  return [isExpanded ?? own, setExpanded];
}

/**
```

with:

```tsx
}

/**
 * Whether the card is open: `isExpanded` when the caller controls it, the fold the browser remembers when
 * it has a `storageKey`, and otherwise the card's own state, starting from `defaultExpanded`. Every change
 * goes through the setter, a press of the toggle and find-in-page alike, which stores it under the key and
 * tells `onExpandedChange`. This is the one place the state is decided.
 */
function useExpanded(
  isExpanded: boolean | undefined,
  defaultExpanded: boolean,
  onExpandedChange: ((isExpanded: boolean) => void) | undefined,
  storageKey: string | undefined,
): [isExpanded: boolean, setExpanded: (isExpanded: boolean) => void] {
  const [own, setOwn] = useState(defaultExpanded);
  // A controlled card reads and stores nothing.
  const key = isExpanded === undefined ? storageKey : undefined;
  const [isFolded, setFolded] = useStoredFold(key);
  const setExpanded = (next: boolean): void => {
    if (key === undefined) setOwn(next);
    else setFolded(!next);
    onExpandedChange?.(next);
  };
  return [isExpanded ?? (key === undefined ? own : !isFolded), setExpanded];
}

/**
```

Edit 4. Replace:

```tsx
 * A card whose body folds under its header. The title is the toggle, a row as wide as the title with a
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card.
 */
export function CollapsibleCard({
  title,
```

with:

```tsx
 * A card whose body folds under its header. The title is the toggle, a row as wide as the title with a
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card. Given a
 * `storageKey`, it remembers its fold in the browser.
 */
export function CollapsibleCard({
  title,
```

Edit 5. Replace:

```tsx
  defaultExpanded = true,
  isExpanded: isExpandedProp,
  onExpandedChange,
  as: tag = 'div',
  className,
  children,
  ...props
}: CollapsibleCardProps): ReactElement {
  const [isExpanded, setExpanded] = useExpanded(isExpandedProp, defaultExpanded, onExpandedChange);
  const foldRef = useRef<HTMLDivElement>(null);
  useFolding(foldRef, isExpanded);
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it.
```

with:

```tsx
  defaultExpanded = true,
  isExpanded: isExpandedProp,
  onExpandedChange,
  storageKey,
  as: tag = 'div',
  className,
  children,
  ...props
}: CollapsibleCardProps): ReactElement {
  const [isExpanded, setExpanded] = useExpanded(
    isExpandedProp,
    defaultExpanded,
    onExpandedChange,
    storageKey,
  );
  const foldRef = useRef<HTMLDivElement>(null);
  const isInstant = useFolding(foldRef, isExpanded);
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it.
```

Edit 6. Replace:

```tsx
      ...props,
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
```

with:

```tsx
      ...props,
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
      'data-instant': isInstant ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
```

The hook returns the mark.

In `packages/react/src/collapsible-card/useFolding.ts` make three edits, in this order.

Edit 1. Replace:

```ts
import { useLayoutEffect, useRef, type RefObject } from 'react';

/** The attribute the card's root carries while its fold moves. */
const FOLDING = 'data-folding';

/**
 * Sets `data-folding` on the card's root each time the card opens or folds, and takes it off once every
```

with:

```ts
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

/** The attribute the card's root carries while its fold moves. */
const FOLDING = 'data-folding';

const subscribeNothing = (): (() => void) => () => undefined;

/** False on the server and while the page hydrates, and true from the render after. */
const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );

/**
 * Sets `data-folding` on the card's root each time the card opens or folds, and takes it off once every
```

Edit 2. Replace:

```ts
 * attribute off. With nothing running, as under reduced motion, or where the API is missing, it comes off
 * at once. The first render marks nothing, since nothing moved.
 *
 * The fold is the root's grandchild: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useFolding(foldRef: RefObject<HTMLElement | null>, isExpanded: boolean): void {
  const turn = useRef(0);
  const shown = useRef(isExpanded);
  useLayoutEffect(() => {
    // Effects run again with nothing changed under Strict Mode, and that is not a move.
    if (shown.current === isExpanded) return;
```

with:

```ts
 * attribute off. With nothing running, as under reduced motion, or where the API is missing, it comes off
 * at once. The first render marks nothing, since nothing moved.
 *
 * Returns whether the root carries `data-instant`, which the stylesheet turns every transition off for. A
 * card the server rendered carries it from the server's HTML until two frames after hydration, so the render
 * that follows hydration, where the card catches up with what only the browser knows, such as a remembered
 * fold, is drawn at once: a page never animates on load. The mark is rendered rather than set by an effect,
 * so it is on before anything brings the styles up to date, and two cards that fold in one commit are both
 * drawn at once. A card first rendered in the browser never carries it, and every later change moves.
 *
 * The fold is the root's grandchild: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useFolding(foldRef: RefObject<HTMLElement | null>, isExpanded: boolean): boolean {
  const turn = useRef(0);
  const shown = useRef(isExpanded);
  const hydrated = useHydrated();
  // True when the first render was the server's, or the hydration of its HTML.
  const [serverRendered] = useState(!hydrated);
  const [settled, setSettled] = useState(false);
  const instant = serverRendered && !settled;
  useLayoutEffect(() => {
    // Effects run again with nothing changed under Strict Mode, and that is not a move.
    if (shown.current === isExpanded) return;
```

Edit 3. Replace:

```ts
      if (turn.current === mine) root.removeAttribute(FOLDING);
    });
  }, [foldRef, isExpanded]);
}
```

with:

```ts
      if (turn.current === mine) root.removeAttribute(FOLDING);
    });
  }, [foldRef, isExpanded]);
  useEffect(() => {
    if (!hydrated || !instant) return;
    // The first frame draws whatever the render after hydration changed, with the mark on. The next takes
    // the mark off, once the styles it drew are the ones in place, so taking it off starts nothing.
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        setSettled(true);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
    };
  }, [hydrated, instant]);
  return instant;
}
```

The rule the mark turns on.

In `packages/core/src/components/card.css` make two edits, in this order.

Edit 1. Replace:

```css
   * classes, and the rules below add the toggle, the actions, the fold and the
   * space that folds with it, each through a part a plain card does not have.
   *
   * The root carries data-expanded while the card is open and data-folding
   * while the fold moves, and the component sets both. The header and the fold
   * sit in React Aria's disclosure element, .card-disclosure, which draws
   * nothing. Every state rule reaches them through it from the root, so a card
   * nested in the body keeps its own state.
   */

  /* The header is a grid. The title, which holds the toggle, takes the first
```

with:

```css
   * classes, and the rules below add the toggle, the actions, the fold and the
   * space that folds with it, each through a part a plain card does not have.
   *
   * The root carries data-expanded while the card is open, data-folding while
   * the fold moves, and data-instant from a server's HTML until just after
   * hydration. The component sets all three. The header and the fold sit in
   * React Aria's disclosure element, .card-disclosure, which draws nothing.
   * Every state rule reaches them through it from the root, so a card nested
   * in the body keeps its own state.
   */

  /* The header is a grid. The title, which holds the toggle, takes the first
```

Edit 2. Replace:

```css
    overflow: hidden;
  }

  /* Forced colors repaint text in the reader's palette, but an svg keeps the
     color its author set, so the slate or ink chevron would stay as it was. It
     takes the toggle's color there, the reader's text color, at rest, under the
```

with:

```css
    overflow: hidden;
  }

  /* The render after hydration is the card catching up with what only the
     browser knows, such as a remembered fold on a card the server drew open.
     It is drawn at once, so a page never animates on load: a card the server
     rendered carries data-instant from the server's HTML until two frames
     after hydration, and nothing it draws moves while it does. */
  .card-collapsible[data-instant] > .card-disclosure > .card-header,
  .card-collapsible[data-instant] > .card-disclosure > .card-header .card-chevron,
  .card-collapsible[data-instant] > .card-disclosure > .card-fold {
    transition: none;
  }

  /* Forced colors repaint text in the reader's palette, but an svg keeps the
     color its author set, so the slate or ink chevron would stay as it was. It
     takes the toggle's color there, the reader's text color, at rest, under the
```

Run `pnpm --filter @snapshot-ui/core lint`. Expected: no Stylelint or ESLint output.

The docs example, a server file. Create `apps/docs/examples/collapsible-card-remembered.tsx`:

```tsx
import { CollapsibleCard } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function CollapsibleCardRemembered(): ReactElement {
  return (
    <CollapsibleCard
      title="Shortcuts"
      level={3}
      note="Fold it and reload the page: it stays folded."
      storageKey="docs-collapsible-card-shortcuts"
      style={{ width: '100%', maxWidth: 480 }}
    >
      <p>Enter or Space on the title folds the card or opens it.</p>
      <p>Tab moves on from the title, and a folded body takes no focus.</p>
    </CollapsibleCard>
  );
}
```

In `apps/docs/examples/index.ts` make two edits, in this order.

Edit 1. Replace:

```ts
import CheckboxValidation from './checkbox-validation';
import CollapsibleCardActions from './collapsible-card-actions';
import CollapsibleCardBasic from './collapsible-card-basic';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
import FieldParts from './field-parts';
```

with:

```ts
import CheckboxValidation from './checkbox-validation';
import CollapsibleCardActions from './collapsible-card-actions';
import CollapsibleCardBasic from './collapsible-card-basic';
import CollapsibleCardRemembered from './collapsible-card-remembered';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
import FieldParts from './field-parts';
```

Edit 2. Replace:

```ts
  'checkbox-validation': CheckboxValidation,
  'collapsible-card-actions': CollapsibleCardActions,
  'collapsible-card-basic': CollapsibleCardBasic,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
  'field-parts': FieldParts,
```

with:

```ts
  'checkbox-validation': CheckboxValidation,
  'collapsible-card-actions': CollapsibleCardActions,
  'collapsible-card-basic': CollapsibleCardBasic,
  'collapsible-card-remembered': CollapsibleCardRemembered,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
  'field-parts': FieldParts,
```

The docs page gains a section after Actions, and the props table gains `storageKey`.

In `apps/docs/content/docs/components/collapsible-card.mdx` make two edits, in this order.

Edit 1. Replace:

```markdown
Controls passed as `actions` sit at the end of the header row, outside the toggle, and stay usable while the card is folded, so a Reset button never hides with the fields it resets. On a card narrower than 18rem inside its padding they move under the note, so the note always stays directly under the title.

<Preview name="collapsible-card-actions" />

</Section>
```

with:

```markdown
Controls passed as `actions` sit at the end of the header row, outside the toggle, and stay usable while the card is folded, so a Reset button never hides with the fields it resets. On a card narrower than 18rem inside its padding they move under the note, so the note always stays directly under the title.

<Preview name="collapsible-card-actions" />

</Section>

<Section>

## Remembering the fold

Give a card a `storageKey` and it remembers its fold in this browser: fold it, reload the page, and it is still folded. Cards with the same key fold together, on the page and in other tabs, and a card that find-in-page opens is remembered as open. Every remembered card on the site keeps its fold in one `localStorage` entry, `snapshot-ui:collapsed`, so give each card a key of its own, such as its page and its title. Where the browser blocks storage or refuses a write, the card still folds and opens, but a fold lasts only while a card with a `storageKey` is on the page.

A card whose key was never stored is open, so `defaultExpanded` does not apply, and a card that `isExpanded` controls reads and stores nothing. `onExpandedChange` is called when someone uses this card, by its toggle or by find-in-page. A card that follows another card or tab with the same key is syncing state, not being used, and does not call it.

<Preview name="collapsible-card-remembered" />

A server-rendered page shows a remembered fold only after it has loaded. The server cannot see the browser's storage, so it draws the card open, and the card folds as the page hydrates, at once, with no transition. An app that needs the first frame right controls the card itself, with `isExpanded` from a state the server can read, such as a cookie.

</Section>
```

Edit 2. Replace:

```markdown
The rest of the HTML attributes, `className` and `ref` go on the card's root, and `className` is merged after the library's classes.

<PropsTable path="../../packages/react/src/collapsible-card/CollapsibleCard.tsx" type="Pick<CollapsibleCardProps, 'title' | 'level' | 'note' | 'actions' | 'defaultExpanded' | 'isExpanded' | 'onExpandedChange' | 'as' | 'className'>" />

</Section>
```

with:

```markdown
The rest of the HTML attributes, `className` and `ref` go on the card's root, and `className` is merged after the library's classes.

<PropsTable path="../../packages/react/src/collapsible-card/CollapsibleCard.tsx" type="Pick<CollapsibleCardProps, 'title' | 'level' | 'note' | 'actions' | 'defaultExpanded' | 'isExpanded' | 'onExpandedChange' | 'storageKey' | 'as' | 'className'>" />

</Section>
```

The docs site's rule for `[hidden]` spares a panel that is hidden until found.

In `apps/docs/components/shell/shell.css` make one edit.

Replace:

```css
    font-size: var(--text-small);
  }

  [hidden] {
    display: none !important;
  }
```

with:

```css
    font-size: var(--text-small);
  }

  /* Hidden stays hidden, whatever display another rule gives, except what
     is hidden until found: a folded collapsible card's body, which the
     browser's find-in-page has to reach, and which keeps its own layout so
     that it opens with its transition. */
  [hidden]:not([hidden='until-found' i]) {
    display: none !important;
  }
```

The record. In `docs/design-system.md`, append one paragraph after the file's last line, the end of the `## CollapsibleCard` section, with one blank line before it:

```markdown
**Remembering the fold.** `storageKey` keeps every remembered card's fold in
one `localStorage` entry, `snapshot-ui:collapsed`, a JSON list of the folded
keys, so a key the browser has not stored is open, and a fold or an open keeps
the keys of cards on other pages. The page reads it through
`useSyncExternalStore`: cards with one key share one state, and the `storage`
event brings in other tabs. An entry that cannot be read reads as nothing
folded, a write the browser refuses is skipped, neither throws, and the page
keeps a fold for as long as a remembered card is on it. The server cannot see
the browser's storage, so its snapshot is open, and a server-rendered card
folds in the render after hydration. That fold is drawn at once: a card the
server rendered carries `data-instant`, which turns its transitions off, from
the server's HTML until two frames after hydration. A first version set the
mark in a layout effect, for one frame, and on a page with two cards of one
key it started all five of the second card's transitions in Chromium: the
first card's `getAnimations()` brought the styles up to date before the second
card's effect had set its mark. Rendered from the server on, the mark is in
place before anything reads a style. Measured on a server-rendered page
hydrated two frames after its first paint, with two cards folded from storage:
no transition started in Chromium, Firefox or WebKit, against five per card
with the rule taken out, and a later press moved as usual. Find-in-page opened
a remembered folded card through the store in all three, by a text fragment
link in Chromium and WebKit and by `window.find()` in Firefox, and the other
card with its key opened and the open was stored.
```

The changeset. Create `.changeset/collapsible-card-memory.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Let a CollapsibleCard remember its fold. Given a `storageKey`, the card keeps its fold in this browser, in one `localStorage` entry, and cards with the same key fold together, on the page and in other tabs. A controlled card stores nothing. On a server-rendered page a remembered card renders open and folds as the page hydrates, with no transition.
```

Run `pnpm exec changeset status --verbose`. Expected: both packages under `minor`, with this changeset beside `checkbox-changed.md`, `collapsible-card.md`, `disabled-labels.md` and `field-names.md`, and nothing under `major`.

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark CollapsibleCard
```

Expected: `Tests  197 passed (197)` for core, `Test Files  40 passed (40)` and `Tests  687 passed | 4 expected fail (691)` for React, and `Test Files  2 passed (2)` with `Tests  18 passed (18)` for the story file. The build now ends `(52 sources, 19 client modules)`: the store is one more source, and not a client module.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
rm -rf apps/docs/.next
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
pnpm --filter @snapshot-ui/react size
pnpm verify
```

Expected:
- `pnpm format` changes no file. `pnpm format:check` prints `All matched files use Prettier code style!`.
- Core: the 1 test this task adds, so `Tests  318 passed (318)` in 5 files (317 before). React: the 28 tests this task adds, so `Tests  687 passed | 4 expected fail (691)` in 40 files (663 in 39 before). The React build ends `check-use-client: every client module keeps its directive (52 sources, 19 client modules)`, and publint prints `All good!` for both packages. Turborepo reports 10 successful tasks.
- Storybook: the 1 story this task adds, run in two projects, so `Tests  384 passed (384)` in 40 files (382 before). Turborepo reports 4 successful tasks. Twice in the prototype a Storybook run failed for a reason outside this task, and passed whole when run again: once two story files failed to import in the dark project with `SyntaxError: Unexpected token '...'`, and once, inside `pnpm verify`, the first story of eight files timed out at 15000ms. If that happens, run it again.
- Docs build, type-check and lint: 5 successful tasks, and the build generates 24 static pages, as before.
- The `lsof` prints nothing, and the end-to-end run ends `167 passed`: the 2 tests this task adds (165 before). If another checkout is using port 3100, run it as `DOCS_E2E_PORT=3505 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.
- Size: `CollapsibleCard` 1.2 kB against its 1.5 kB limit (714 B before), every other entry as it was, and the React Aria watch-only entry 13.07 kB.
- `pnpm verify` exits 0. Its first line is `check:public: no private names in 323 files` (or the no-file message on a machine without `.local`). Root tests: `tests 20`, `pass 20`. Turborepo reports 18 successful tasks.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: no new and no changed file. `Remembered` is `no-visual`. Storybook renders every story in the browser, never on a server, so no story carries `data-instant`, and the new rule draws nothing there. The rest of the task is the docs, the store and tests.

- [ ] **Step 7: Commit**

```bash
git add .changeset/collapsible-card-memory.md apps/docs/components/shell/shell.css apps/docs/content/docs/components/collapsible-card.mdx apps/docs/examples/collapsible-card-remembered.tsx apps/docs/examples/index.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/src/components/card.css packages/core/test/css.test.js packages/react/src/collapsible-card/CollapsibleCard.stories.tsx packages/react/src/collapsible-card/CollapsibleCard.test.tsx packages/react/src/collapsible-card/CollapsibleCard.tsx packages/react/src/collapsible-card/foldStore.test.ts packages/react/src/collapsible-card/foldStore.ts packages/react/src/collapsible-card/useFolding.ts packages/react/test/server-render.test.tsx
git commit -m "feat: let a collapsible card remember its fold"
```


### Task 6: A folded card marks a change and opens for an invalid field

**Files:**
- Create: `packages/react/src/collapsible-card/useFoldedFields.ts`
- Modify: `packages/react/src/collapsible-card/CollapsibleCard.tsx`, `packages/react/.size-limit.json` (the CollapsibleCard limit)
- Test: `packages/react/src/collapsible-card/CollapsibleCard.test.tsx`, `packages/react/test/server-render.test.tsx`
- Test (stories): `packages/react/src/collapsible-card/CollapsibleCard.stories.tsx`, `packages/react/src/rtl/RightToLeft.stories.tsx`
- Modify: `packages/core/src/components/card.css`
- Test: `packages/core/test/css.test.js`, `packages/core/test/contrast.test.js`
- Create: `apps/docs/examples/collapsible-card-changed.tsx`
- Modify: `apps/docs/content/docs/components/collapsible-card.mdx`, `apps/docs/examples/index.ts`
- Test: `apps/docs/tests/docs.spec.ts`
- Modify: `docs/design-system.md` (two paragraphs and a table appended to Appendix B's `## CollapsibleCard` section, after the file's last line, which is not touched)
- Create: `.changeset/collapsible-card-marker.md`
- Create (Docker step): 5 baselines, `apps/storybook/tests/visual/__screenshots__/components-collapsiblecard--folded-changed--*.png`. None changes.

**Interfaces:**
- Consumes:
  - From Tasks 4 and 5, in `CollapsibleCard.tsx`: `useExpanded(isExpanded, defaultExpanded, onExpandedChange, storageKey)`, whose setter is the one path for every change, so `setExpanded(true)` stores an open under the key and calls `onExpandedChange(true)`; `CardToggle`, the one place the toggle is built, which Task 4 left for anything that comes to describe it; and the fold's ref, `foldRef`. The card's root is the fold's grandparent, as `useFolding` finds it.
  - From Task 4, in `card.css`: the `.card-toggle-text` and `.card-chevron` rules, the folded state `.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header`, and the forced-colors block.
  - From the field helpers: `useChangedDescription({ isChanged, isInvalid, describedBy }): { chipId, describedBy }` in `packages/react/src/field/useChangedDescription.ts`, which names an id in `aria-describedby` only while the chip it belongs to shows. Every library field's root carries `data-changed` while changed; TextField renders `data-changed={isChanged ? '' : undefined}` on its root.
  - From React 19: `useSyncExternalStore`, `useCallback` and `useLayoutEffect`. From `react-dom`: `flushSync`.
  - From `react-aria` 3.53.1, under `react-aria-components` 1.22.1: with `validationBehavior="native"`, the default, `useTextField` sets `required` on the input and `useFormValidation` sets its custom validity, and listens for `invalid` on the input itself, where it shows the error, focuses the form's first invalid control and calls `preventDefault()`. With `validationBehavior="aria"` it sets neither, so the browser finds nothing wrong. `useDisclosure` removes the panel's `hidden` in a layout effect when the disclosure opens.
  - Test helpers: `root` and `expectNoA11yViolations` from `packages/react/test/`; `foldOf`, `toggleOf`, `stored` and `ENTRY` in `CollapsibleCard.test.tsx`; `byTestId` and `partsOf` in `CollapsibleCard.stories.tsx`; `firstLineOffset`, `lineCount`, `tokenColor` and `tokenPixels` from `packages/react/src/stories/paint.ts`; `find`, `rect`, `lastText` and `expectSameEdge` in the right-to-left stories; `rules`, `all`, `blockAfter` and `FORCED_COLORS` in `css.test.js`; `CONTRAST_PAIRS`, `NON_TEXT`, `contrastRatio`, `parseColor`, `paletteFor` and `tokens` in `contrast.test.js`; `visit` in `docs.spec.ts`.
- Produces on `CollapsibleCardProps`, exported from `@snapshot-ui/react`:

```ts
  isChanged?: boolean; // marks a folded card as holding a change even when no field inside says so; the root carries data-changed while it is true
  changedLabel?: string; // default 'Changed': what a screen reader reads with the toggle while the marker shows
```

- Produces in `packages/react/src/collapsible-card/useFoldedFields.ts`, internal, with no directive, since it imports no React Aria:

```ts
export function useHoldsChange(foldRef: RefObject<HTMLElement | null>, isFolded: boolean): boolean;
export function useOpenOnInvalid(
  foldRef: RefObject<HTMLElement | null>,
  isFolded: boolean,
  open: () => void,
): void;
```

- Changes `CardToggle` to take `isMarked: boolean` and `changedLabel: string`. The card passes `isMarked={!isExpanded && (isChanged || holdsChange)}`.
- Produces this markup, only while the card is folded and marked: `<span class="card-marker" aria-hidden="true"></span>` as the last child of `.card-toggle-text`, inside the toggle; `<span id="..." class="card-marker-label" hidden="">Changed</span>` in the header, right after the heading and outside it; and `aria-describedby` on the toggle naming that id. Open or unmarked, the markup is what it was.
- Produces `data-changed=""` on the card's root while `isChanged` is true, open or folded, as every field's root carries it while changed.
- Produces in `card.css`: `.card-marker`, the 8px dot; the rule that keeps its room on a folded title, `.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-toggle-text`; `.card-marker` in the forced-colors block; and, changed, `.card-toggle-text` with `position: relative` and `flex: 0 1 auto`, and `.card-chevron` with `margin-inline-start: auto`. No rule draws `.card-marker-label`: the `hidden` attribute hides it.
- Produces the tests: 3 core tests in the collapsible card describe of `css.test.js`, 1 other there changed, and 1 in the collapsible card describe of `contrast.test.js`; 13 React tests in two new describes in `CollapsibleCard.test.tsx` and 1 row in `server-render.test.tsx`; 2 stories, `FoldedChanged`, which is shot, and `OpensForInvalid`, which is `no-visual`, and the right-to-left check of the card extended; and 1 docs end-to-end test.
- Changes the `CollapsibleCard` size limit in `packages/react/.size-limit.json` from 1.5 kB to 2.5 kB.

**What this task decides:**
- **One condition marks the card, and it is decided in render.** The card is marked while it is folded and either `isChanged` is true or something in its fold carries `data-changed`. `CardToggle` renders the dot and the words only while marked, so the stylesheet needs no state rule for them. It names the words in `aria-describedby` through `useChangedDescription`, the helper every field uses for its chip, so the description is there exactly while the dot is. Open, there is no dot and no description, and each field shows its own chip.
- **The fold is read through `useSyncExternalStore`, and watched only while the card is folded** (spec risk R3).
  - The snapshot is whether the fold holds an element with `data-changed`, and it is false while the card is open. The subscription creates a MutationObserver on the fold with `{ attributeFilter: ['data-changed'], subtree: true, childList: true }` only while the card is folded. It is memoized on the fold state, so React unsubscribes, which disconnects the observer, when the card opens or unmounts. The server snapshot is false.
  - The render that folds the card reads the fold, so a field changed while the card was open marks it in that same commit, before any paint, and the observer never has to fire for it. A test proves it: after the fold nothing changes, so only that read can find the change. React also reads the snapshot again once it has subscribed, so a change that lands between the render and the subscription is not lost.
  - `childList` lets a changed field that mounts into a folded body, or leaves it, change the marker.
  - A test spies on `MutationObserver.prototype.observe` and `disconnect` and checks, by the observer each call was made on, that nothing watches the open card, that one observer starts with exactly those options when it folds, that it is disconnected when it opens, and that the next fold's observer is disconnected when the card unmounts.
- **Nested cards.** React Aria keeps a folded panel's children mounted, so the fields of a nested card are in the outer card's fold whether the nested card is folded or not, and the outer card counts them. The nested card keeps its own fold and its own marker, through its own hooks. Folding the outer card hides the nested one.
- **A card's `isChanged` counts for a card around it.** While `isChanged` is true, the card's root carries `data-changed`, the convention every field's root follows, so an outer card's observer counts a nested card's `isChanged` as it counts a changed field, whether the nested card is open or folded. The card's own observer watches its fold, which does not hold its root, so the attribute never marks the card it is on. A search of the core stylesheets for `data-changed` found only selectors under a field's own classes, `.field[data-changed]`, `.field:not([data-changed])`, `.checkbox-field:not([data-changed])` and `.segmented[data-changed]`, so none matches a card's root, and none matches a field by way of a card around it. A test renders an open nested card with `isChanged` and no changed field inside a folded card: the outer card is marked, and is unmarked when `isChanged` turns false.
- **The dot hangs off the end of the words, on their first line.** It is absolutely positioned from `.card-toggle-text`, `inset-inline-start: calc(100% + var(--spacing-part))` and `inset-block-start: calc((1lh - 8px) / 2)`, the chevron's own first-line rule. For a title on one line to put the dot after its last word, the words now take their own width, `flex: 0 1 auto` instead of `flex: auto`, which filled the row and would have put the dot beside the chevron. The chevron's `margin-inline-start: auto` keeps it at the end of the row. A title that wraps still takes the room it had, so its lines break where they did. Nothing an unmarked card draws changed: the 12 visual stories `card.css` draws, Card's, CollapsibleCard's and the card title heading's, were shot in the five visual modes from a Storybook built with the old `card.css` and from one built with the new, and all 60 shots were byte for byte the same.
- **A folded title always keeps the dot's room, so the title never moves when the dot comes or goes.** A dot in the flow would make a title within 16px of the row's end wrap when it appears. A dot out of the flow with no room kept would run into the chevron's box when the title fills the row. So a folded title has `margin-inline-end: calc(8px + var(--spacing-part))`, drawn or not, and an open title keeps none. The cost: a folded title wraps 16px sooner than an open one, so folding a card whose title is that close to the end rewraps it. The fold moves the card anyway, and while the card is folded, the dot coming and going moves nothing. `FoldedChanged` checks a long title with the dot against the same title without it, and the docs test checks a title before and after Reset takes the dot away.
- **The words are in a `hidden` element after the heading, outside it.** Inside the button they would join its name, read "Profile Changed, collapsed", where the spec asks for the name, then the state, then Changed. Inside the heading they would change the heading's text. A `hidden` element is still a valid description source, since `aria-describedby` names it directly, so the toggle's name and the heading's text stay the title, the toggle's description is Changed, and browse mode does not read the word a second time. Checked in Chromium's own accessibility tree, through the DevTools protocol, on the docs page: the folded Workspace toggle is a button named "Workspace", described "Changed", not expanded, and its heading is named "Workspace". The tests check the name, the heading's text and the description in jsdom, the story checks them in the browser, and the docs end-to-end test checks the description and the heading. No rule in `card.css` draws `.card-marker-label`, and a core test checks that none does, so nothing can undo the `hidden` attribute.
- **The dot's contrast is recorded, not gated.** Light Signal Orange on the card's Lifted ground measures 2.78:1 in light and 6.07:1 in dark with `contrast.js`. Under the 3:1 that WCAG 1.4.11 asks of a graphic that carries meaning, it is accepted because the dot is not where the meaning lives: the toggle's description carries it, and the dot is a cue beside the title, as the eyebrow's dot and a changed field's edge are. Opening the card shows each field's clay chip, which is gated. A contrast test holds both numbers and checks that no pair gates the dot, so a token change that lifts it over 3:1 sends someone to gate it. Appendix B records it.
- **Forced colors draw the dot in `CanvasText`.** Checked in Chromium with forced colors emulated on the docs page: with the rule, the dot computed to `CanvasText` on the canvas, in light and dark; with the rule taken out of the page's stylesheet, a background, it computed to the canvas color itself, white on white and black on black, and vanished.
- **A capture-phase `invalid` listener on the root opens a folded card, and renders the open at once.**
  - Only a folded card listens, attached in a layout effect. It opens through `setExpanded(true)`, so a remembered fold is forgotten and a controlled card is asked through `onExpandedChange(true)`. The setter is a new function each render, so the listener is attached again after each render of a folded card. That is cheap, and a folded card rarely renders.
  - A React Aria field focuses the first invalid control from its own `invalid` listener on the control, during the same event. The capture listener on the root runs first, and it calls `setExpanded` inside `flushSync`, so the panel's `hidden` is gone before that focus. Without `flushSync`, the jsdom test, whose submit is started from script as an app's `requestSubmit()` would be, saw the field take focus with the toggle still `aria-expanded="false"` and the panel still `hidden="until-found"`: `expected [ 'false until-found' ] to deeply equal [ 'true null' ]`. In Chromium, `OpensForInvalid` submits by a click: the card opens, the field has focus, and once the fold has settled the field is inside the window and is what a hit test at its center finds.
  - The listener is on the root, as the spec says, and opens the card only when the event's target is inside the fold. A control among the header's actions is in view already, so a failing one there leaves the card folded: a test puts a required field in the actions of a folded card, and after a submit that field has focus, the card is still folded, and `onExpandedChange` was not called.
- **React Aria's `validationBehavior="aria"` fires no `invalid` event.** It sets neither `required` nor a custom validity, so the browser finds nothing wrong and submits the form, and a folded card stays folded. A test pins it, the docs say so and tell the app to open the card from its own state, and Appendix B records it. No second mechanism is added.
- **A folded card the server renders with `isChanged` draws its marker in the server's HTML.** The server render test gains that row. Detection needs the browser's DOM, so a changed field marks a server-rendered card once the page has hydrated: the docs end-to-end test loads the page, finds the dot on a card the server drew folded, and checks nothing was logged.
- **Right to left.** The dot is placed with logical properties. The right-to-left check of the card marks its folded card with `isChanged` and checks that the dot sits 8px to the left of the words and right of the chevron.
- **The docs example is a client file.** `collapsible-card-changed` renders a card that starts folded over a changed field, with Reset in its header, so a reader sees the dot, opens the card to the field's chip, and can reset the change while the card is folded. Checked on the docs page in Chromium, folded with the dot and open: axe found no violation in light or dark, and there was no sideways scroll at 320, 375 or 1440px. With the Workspace title replaced by a long title and by a long unbroken address at 320px, the dot stayed level with the first line, 8px after the words and 8px before the chevron.
- **Size.** The `CollapsibleCard` entry grows from 1.2 kB to 1.6 kB, past its 1.5 kB limit. The limit becomes 2.5 kB by the rule the phase 1b plan set for every entry: the size rounded up to the next 0.5 kB, plus 0.5 kB.

- [ ] **Step 1: Write the failing tests**

The component tests. The marker's tests change a TextField's `isChanged`, and a nested card's, while the card is folded, and the opening tests submit a form whose required field is empty.

In `packages/react/src/collapsible-card/CollapsibleCard.test.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** A card the caller controls, the way a page that keeps the fold in its own state would. */
```

with:

```tsx
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { TextField } from '../text-field';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** A card the caller controls, the way a page that keeps the fold in its own state would. */
```

Edit 2. Replace:

```tsx
    container.remove();
  });
});
```

with:

```tsx
    container.remove();
  });
});

/** The folded marker's dot in the card with this toggle, or null while the card shows none. */
const dotOf = (toggle: HTMLElement): Element | null =>
  toggle.querySelector('.card-toggle-text > .card-marker');

/** The toggle of the card with this title, found in the page even where a folded card hides it. */
function hiddenToggleOf(title: string): HTMLElement {
  const toggle = [...document.querySelectorAll<HTMLElement>('.card-toggle')].find(
    (each) => each.querySelector('.card-toggle-text')?.textContent === title,
  );
  if (!toggle) throw new Error(`No toggle for ${title}`);
  return toggle;
}

/** A folded card holding a field, which `isChanged` marks as changed. */
function Profile({ isChanged }: { isChanged: boolean }): ReactElement {
  return (
    <CollapsibleCard title="Profile" defaultExpanded={false}>
      <TextField label="Display name" defaultValue="Ada" isChanged={isChanged} />
    </CollapsibleCard>
  );
}

describe('CollapsibleCard while it holds a change', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a dot after the title, and is described as changed, only while folded, when isChanged says so', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged>
        Body
      </CollapsibleCard>,
    );
    const toggle = toggleOf('Notifications');
    const heading = screen.getByRole('heading', { level: 2 });
    // Folded: a dot after the title's words, which is decoration, and words a screen reader reads with the
    // toggle, after its name and its state. The words are in a hidden element after the heading, so neither
    // the toggle's name nor the heading's text changes.
    const dot = dotOf(toggle);
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot?.previousSibling?.textContent).toBe('Notifications');
    expect(toggle).toHaveAccessibleName('Notifications');
    expect(toggle).toHaveAccessibleDescription('Changed');
    expect(heading).toHaveAccessibleName('Notifications');
    expect(heading).toHaveTextContent(/^Notifications$/);
    const label = document.getElementById(toggle.getAttribute('aria-describedby') ?? '');
    expect(label).toHaveClass('card-marker-label');
    expect(label).toHaveAttribute('hidden');
    expect(label?.previousElementSibling).toBe(heading);
    // The root says the card holds a change, as a field's root does, folded or open.
    expect(root(container)).toHaveAttribute('data-changed', '');
    // Open: no dot and no description. Each field shows its own Changed chip.
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(dotOf(toggle)).toBeNull();
    expect(toggle).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('.card-marker-label')).toBeNull();
    expect(root(container)).toHaveAttribute('data-changed', '');
    // Folded again, the marker is back.
    await user.click(toggle);
    expect(dotOf(toggle)).not.toBeNull();
    expect(toggle).toHaveAccessibleDescription('Changed');
  });

  it('shows the marker while a field in its folded body is changed, as the field changes', async () => {
    const error = vi.spyOn(console, 'error');
    const { rerender } = render(<Profile isChanged={false} />);
    const toggle = toggleOf('Profile');
    expect(dotOf(toggle)).toBeNull();
    // The field's root gains data-changed while the card is folded, and the card sees it.
    rerender(<Profile isChanged />);
    await waitFor(() => {
      expect(dotOf(toggle)).not.toBeNull();
    });
    expect(toggle).toHaveAccessibleDescription('Changed');
    rerender(<Profile isChanged={false} />);
    await waitFor(() => {
      expect(dotOf(toggle)).toBeNull();
    });
    expect(toggle).not.toHaveAttribute('aria-describedby');
    expect(error).not.toHaveBeenCalled();
  });

  it('shows the marker the moment it folds over a field that changed while it was open', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleCard title="Profile">
        <TextField label="Display name" defaultValue="Ada" isChanged />
      </CollapsibleCard>,
    );
    const toggle = toggleOf('Profile');
    // Open, the field shows its own chip, and the card shows nothing.
    expect(dotOf(toggle)).toBeNull();
    expect(toggle).not.toHaveAttribute('aria-describedby');
    // Nothing changes after the fold, so only a look at the fold as it folds can find the change.
    await user.click(toggle);
    expect(dotOf(toggle)).not.toBeNull();
    expect(toggle).toHaveAccessibleDescription('Changed');
  });

  it('watches its fold only while folded, and stops when it opens or leaves the page', async () => {
    const user = userEvent.setup();
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { container, unmount } = render(
      <CollapsibleCard title="Profile">
        <TextField label="Display name" defaultValue="Ada" />
      </CollapsibleCard>,
    );
    const fold = foldOf(container);
    /** Each observer that started watching the fold, in order, and how it was asked to watch. */
    const watchers = (): { observer: unknown; options: unknown }[] =>
      observe.mock.calls.flatMap(([target, options], index) =>
        target === fold ? [{ observer: observe.mock.contexts[index], options }] : [],
      );
    const stopped = (observer: unknown): boolean => disconnect.mock.contexts.includes(observer);
    // Open, nothing watches it.
    expect(watchers()).toEqual([]);
    await user.click(toggleOf('Profile'));
    const [first] = watchers();
    expect(watchers()).toHaveLength(1);
    // The one attribute a changed field carries, anywhere in the body, and the elements that come and go.
    expect(first?.options).toEqual({ attributeFilter: ['data-changed'], subtree: true, childList: true });
    expect(stopped(first?.observer)).toBe(false);
    await user.click(toggleOf('Profile'));
    expect(stopped(first?.observer)).toBe(true);
    expect(watchers()).toHaveLength(1);
    await user.click(toggleOf('Profile'));
    expect(watchers()).toHaveLength(2);
    const second = watchers()[1];
    expect(stopped(second?.observer)).toBe(false);
    unmount();
    expect(stopped(second?.observer)).toBe(true);
  });

  it('counts a changed field inside a card nested in its body, and the nested card keeps its own fold and marker', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleCard title="Settings" defaultExpanded={false}>
        <p>Everything about your account.</p>
        <CollapsibleCard title="Profile" level={3} defaultExpanded={false}>
          <TextField label="Display name" defaultValue="Ada" isChanged />
        </CollapsibleCard>
      </CollapsibleCard>,
    );
    const outer = toggleOf('Settings');
    const inner = hiddenToggleOf('Profile');
    // Both folded: the outer card counts the field inside the inner one, and the inner card marks it too.
    expect(dotOf(outer)).not.toBeNull();
    expect(outer).toHaveAccessibleDescription('Changed');
    expect(dotOf(inner)).not.toBeNull();
    // Open, the outer card shows no marker, and the inner card is still folded, with its own marker.
    await user.click(outer);
    expect(dotOf(outer)).toBeNull();
    expect(toggleOf('Profile')).toBe(inner);
    expect(inner).toHaveAttribute('aria-expanded', 'false');
    expect(inner).toHaveAccessibleDescription('Changed');
    await user.click(inner);
    expect(dotOf(inner)).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeVisible();
    // Folding the outer card hides the inner one, which stays open, and the outer card marks the field again.
    await user.click(outer);
    expect(dotOf(outer)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull();
    expect(inner).toHaveAttribute('aria-expanded', 'true');
    expect(dotOf(inner)).toBeNull();
  });

  it('counts a card nested in its body whose isChanged is true, open or folded, by its root', async () => {
    function Settings({ isChanged }: { isChanged: boolean }): ReactElement {
      return (
        <CollapsibleCard title="Settings" defaultExpanded={false}>
          <CollapsibleCard title="Profile" level={3} isChanged={isChanged}>
            <p>Nothing in here reports a change.</p>
          </CollapsibleCard>
        </CollapsibleCard>
      );
    }
    const { rerender } = render(<Settings isChanged />);
    const outer = toggleOf('Settings');
    const inner = hiddenToggleOf('Profile');
    // The inner card is open, so it shows no marker, but its root says it holds a change, and the folded
    // outer card counts it.
    expect(inner.closest('.card-collapsible')).toHaveAttribute('data-changed', '');
    expect(dotOf(inner)).toBeNull();
    expect(dotOf(outer)).not.toBeNull();
    expect(outer).toHaveAccessibleDescription('Changed');
    rerender(<Settings isChanged={false} />);
    await waitFor(() => {
      expect(dotOf(outer)).toBeNull();
    });
    expect(inner.closest('.card-collapsible')).not.toHaveAttribute('data-changed');
    expect(outer).not.toHaveAttribute('aria-describedby');
  });

  it('reads changedLabel as the marker', () => {
    render(
      <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged changedLabel="Unsaved">
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAccessibleDescription('Unsaved');
    expect(document.querySelector('.card-marker-label')).toHaveTextContent('Unsaved');
  });

  it('has no axe violations folded and changed, and nested', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged>
          <p>Product updates, when something ships.</p>
        </CollapsibleCard>
        <CollapsibleCard title="Settings" defaultExpanded={false}>
          <CollapsibleCard title="Profile" level={3} defaultExpanded={false}>
            <TextField label="Display name" defaultValue="Ada" isChanged />
          </CollapsibleCard>
        </CollapsibleCard>
      </>,
    );
    await expectNoA11yViolations(container);
    await user.click(toggleOf('Settings'));
    await expectNoA11yViolations(container);
  });
});

/** Stops a form from leaving the page, which jsdom cannot do. */
const stay = (event: { preventDefault: () => void }): void => {
  event.preventDefault();
};

describe('CollapsibleCard with a field that fails validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('opens when a field inside fails the browser validation on submit, before the field takes focus', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(stay);
    const onExpandedChange = vi.fn();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <CollapsibleCard title="Profile" defaultExpanded={false}>
          <TextField label="Display name" defaultValue="Ada" isRequired />
        </CollapsibleCard>
        <CollapsibleCard title="Billing" defaultExpanded={false} onExpandedChange={onExpandedChange}>
          <TextField label="Card holder" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    const [, billing] = container.querySelectorAll<HTMLElement>('.card-fold');
    const input = billing?.querySelector('input');
    if (!billing || !input) throw new Error('No Billing field');
    // Where the card stood at the moment the field took focus, which React Aria moves to the first field
    // that failed, in its own listener for the field's invalid event.
    const seen: string[] = [];
    input.addEventListener('focus', () => {
      seen.push(
        `${String(hiddenToggleOf('Billing').getAttribute('aria-expanded'))} ${String(billing.getAttribute('hidden'))}`,
      );
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    // Open, with its body shown, before the field took focus.
    expect(seen).toEqual(['true null']);
    expect(input).toHaveFocus();
    // A card whose fields are all valid stays folded.
    expect(hiddenToggleOf('Profile')).toHaveAttribute('aria-expanded', 'false');
  });

  it('asks a controlled card to open, through onExpandedChange', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <form onSubmit={stay}>
        <CollapsibleCard title="Billing" isExpanded={false} onExpandedChange={onExpandedChange}>
          <TextField label="Card holder" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    // The caller decides, and has not opened it.
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens a remembered fold through the store, which forgets the fold', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["profile","billing"]');
    render(
      <form onSubmit={stay}>
        <CollapsibleCard title="Billing" storageKey="billing">
          <TextField label="Card holder" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'true');
    expect(stored()).toEqual(['profile']);
  });

  it('stays folded for a field in its header that fails, which is in view already', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <form onSubmit={stay}>
        <CollapsibleCard
          title="Billing"
          defaultExpanded={false}
          onExpandedChange={onExpandedChange}
          actions={<TextField aria-label="Coupon" isRequired />}
        >
          <TextField label="Card holder" defaultValue="Ada" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    // React Aria moves focus to the field that failed, which the folded card shows in its header.
    expect(screen.getByRole('textbox', { name: 'Coupon' })).toHaveFocus();
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('stays folded for a field React Aria validates with validationBehavior="aria", which fires no invalid event', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(stay);
    const invalid = vi.fn();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <CollapsibleCard title="Billing" defaultExpanded={false}>
          <TextField label="Card holder" isRequired validationBehavior="aria" />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    container.addEventListener('invalid', invalid, true);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    // The browser sees nothing wrong, so the form submits and no invalid event reaches the card.
    expect(invalid).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
  });
});
```

In `packages/react/test/server-render.test.tsx` make one edit.

Replace:

```tsx
    </CollapsibleCard>,
    ['class="card card-collapsible"', 'data-expanded=""', 'data-instant=""', 'aria-expanded="true"'],
  ],
];

describe('the client components on the server', () => {
```

with:

```tsx
    </CollapsibleCard>,
    ['class="card card-collapsible"', 'data-expanded=""', 'data-instant=""', 'aria-expanded="true"'],
  ],
  [
    // A folded card that says it holds a change draws its marker on the server, which has no fold to watch.
    'CollapsibleCard, folded and changed',
    <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged>
      <p>Product updates</p>
    </CollapsibleCard>,
    [
      'class="card card-collapsible" data-instant="" data-changed=""',
      'aria-expanded="false"',
      'aria-describedby="',
      '<span class="card-toggle-text">Notifications<span class="card-marker" aria-hidden="true"></span></span>',
      '</h2><span id="',
      'class="card-marker-label" hidden="">Changed</span>',
    ],
  ],
];

describe('the client components on the server', () => {
```

The core tests go in the collapsible card describe. One of its tests changes: the colors it draws now include the marker's.

In `packages/core/test/css.test.js` make three edits, in this order.

Edit 1. Replace:

```js
      body: body.trim(),
    }));
  /** A part only the collapsible card draws, or the dir attribute its chevron reads. */
  const COLLAPSIBLE = /card-(?:collapsible|disclosure|toggle|chevron|actions|fold)|\[dir=/;
  /** The rules a plain card is drawn with, by selector. */
  const CARD = [
    '.card',
```

with:

```js
      body: body.trim(),
    }));
  /** A part only the collapsible card draws, or the dir attribute its chevron reads. */
  const COLLAPSIBLE = /card-(?:collapsible|disclosure|toggle|chevron|actions|fold|marker)|\[dir=/;
  /** The rules a plain card is drawn with, by selector. */
  const CARD = [
    '.card',
```

Edit 2. Replace:

```js
    }
  });

  it('draws in tokens only: a slate chevron that turns ink', () => {
    const colors = all()
      .filter(({ selector }) => COLLAPSIBLE.test(selector))
      .flatMap(({ body }) => [...body.matchAll(/var\((--color-[a-z-]+)\)/g)].map(([, name]) => name));
    expect([...new Set(colors)].sort()).toEqual(['--color-ink', '--color-slate']);
    expect(blockAfter(rules(), '.card-chevron {')).toContain('color: var(--color-slate);');
  });
```

with:

```js
    }
  });

  it('draws in tokens only: a slate chevron that turns ink, and a light signal orange marker', () => {
    const colors = all()
      .filter(({ selector }) => COLLAPSIBLE.test(selector))
      .flatMap(({ body }) => [...body.matchAll(/var\((--color-[a-z-]+)\)/g)].map(([, name]) => name));
    expect([...new Set(colors)].sort()).toEqual(['--color-ink', '--color-signal-light', '--color-slate']);
    expect(blockAfter(rules(), '.card-chevron {')).toContain('color: var(--color-slate);');
  });
```

Edit 3. Replace:

```js
    const css = rules();
    expect(blockAfter(css, '.card-toggle {')).toContain('align-items: flex-start;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-block: calc((1lh - 24px) / 2);');
  });

  it('stops every transition it draws under reduced motion, from a block that comes after them', () => {
```

with:

```js
    const css = rules();
    expect(blockAfter(css, '.card-toggle {')).toContain('align-items: flex-start;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-block: calc((1lh - 24px) / 2);');
  });

  it('draws the folded marker as an 8px light signal orange dot after the title, level with its first line', () => {
    const css = rules();
    const dot = blockAfter(css, '.card-marker {');
    expect(dot).toContain('width: 8px;');
    expect(dot).toContain('height: 8px;');
    expect(dot).toContain('border-radius: var(--radius-dot);');
    expect(dot).toContain('background-color: var(--color-signal-light);');
    // Out of the flow, from the end of the title's words, which it sits in, and centred on their first line.
    expect(dot).toContain('position: absolute;');
    expect(dot).toContain('inset-inline-start: calc(100% + var(--spacing-part));');
    expect(dot).toContain('inset-block-start: calc((1lh - 8px) / 2);');
    const text = blockAfter(css, '.card-toggle-text {');
    expect(text).toContain('position: relative;');
    // The words take only their own width, so the dot follows the last word of a title on one line, and the
    // chevron keeps the end of the row.
    expect(text).toContain('flex: 0 1 auto;');
    expect(blockAfter(css, '.card-chevron {')).toContain('margin-inline-start: auto;');
    // The marker's words are hidden by the hidden attribute, so no rule draws them, and none can undo it.
    expect(css).not.toContain('card-marker-label');
  });

  it('keeps room for the dot beside a folded title, so the title never moves when the dot comes or goes', () => {
    const css = rules();
    const room = blockAfter(
      css,
      '.card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-toggle-text {',
    );
    // The dot and the gap before it, whether the dot is drawn or not. An open card keeps no room.
    expect(room.trim()).toBe('margin-inline-end: calc(8px + var(--spacing-part));');
    expect(blockAfter(css, '.card-toggle-text {')).not.toContain('margin');
  });

  it("draws the dot in the reader's text color in forced colors, where a background would be lost", () => {
    expect(blockAfter(blockAfter(rules(), FORCED_COLORS), '.card-marker {')).toContain(
      'background-color: CanvasText;',
    );
  });

  it('stops every transition it draws under reduced motion, from a block that comes after them', () => {
```

In `packages/core/test/contrast.test.js` make one edit.

Replace:

```js
      );
    }
  });
});

describe('contrastFailures', () => {
```

with:

```js
      );
    }
  });

  // The folded marker's dot is light signal orange on the lifted card. It is under the 3:1 a graphic that
  // carries meaning asks, in light, so it is recorded in the design record rather than gated: the toggle's
  // description carries the meaning, and the dot is a cue beside it. The numbers here are the record's.
  it('measures the folded marker on the lifted card under 3:1 in light, so it is recorded and not gated', () => {
    const measured = (mode) => {
      const palette = paletteFor(tokens, mode);
      return contrastRatio(parseColor(palette['signal-light']), parseColor(palette.lifted));
    };
    expect(measured('light')).toBeCloseTo(2.78, 2);
    expect(measured('light')).toBeLessThan(NON_TEXT);
    expect(measured('dark')).toBeCloseTo(6.07, 2);
    expect(CONTRAST_PAIRS.filter((pair) => pair.text === 'signal-light')).toEqual([]);
  });
});

describe('contrastFailures', () => {
```

The stories go at the end of the file.

In `packages/react/src/collapsible-card/CollapsibleCard.stories.tsx` make two edits, in this order.

Edit 1. Replace:

```tsx
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { firstLineOffset, lineCount, tokenPixels } from '../stories/paint';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
```

with:

```tsx
import { expect, waitFor } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { firstLineOffset, lineCount, tokenColor, tokenPixels } from '../stories/paint';
import { TextField } from '../text-field';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** The parts of the collapsible card that is `card`. */
```

Edit 2. Replace:

```tsx
    await expect(second.getAnimations({ subtree: true })).toHaveLength(0);
  },
};
```

with:

```tsx
    await expect(second.getAnimations({ subtree: true })).toHaveLength(0);
  },
};

/** The folded marker's dot in `card`, which must show one. */
function dotOf(card: Element): HTMLElement {
  const dot = partsOf(card).text.querySelector<HTMLElement>(':scope > .card-marker');
  if (!dot) throw new Error('No marker drawn');
  return dot;
}

/** Where a box sits inside `card`, so two cards can be compared wherever they are on the page. */
function placeIn(card: Element, box: DOMRect): { left: number; top: number; width: number; height: number } {
  const edge = card.getBoundingClientRect();
  return { left: box.left - edge.left, top: box.top - edge.top, width: box.width, height: box.height };
}

/** The box of the last line of words in the title, read from the title's text. */
function lastWords(text: Element): DOMRect {
  const range = document.createRange();
  range.selectNodeContents(text.firstChild ?? text);
  const lines = range.getClientRects();
  const last = lines[lines.length - 1];
  if (!last) throw new Error('No words drawn');
  return last;
}

/**
 * Folded over a changed field, a card shows a light signal orange dot after its title, level with its first
 * line, and its toggle is described as changed. A folded title keeps room for the dot whether it shows or
 * not, so a title with the dot sits exactly where the same title without it does, wrapped or not.
 */
export const FoldedChanged: Story = {
  args: { title: 'Profile', note: 'How the rest of the team sees you.', defaultExpanded: false },
  render: (args) => (
    <div style={{ display: 'grid', gap: 24 }}>
      <CollapsibleCard {...args} data-testid="changed">
        <TextField label="Display name" defaultValue="Ada King" isChanged />
      </CollapsibleCard>
      <div style={{ display: 'grid', gap: 24, width: 288 }}>
        <CollapsibleCard {...args} title="Notification preferences for every workspace" data-testid="long">
          <TextField label="Digest day" defaultValue="Tuesday" isChanged />
        </CollapsibleCard>
        <CollapsibleCard {...args} title="Notification preferences for every workspace" data-testid="saved">
          <TextField label="Digest day" defaultValue="Tuesday" />
        </CollapsibleCard>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const changed = byTestId(canvasElement, 'changed');
    const { title, toggle, text, chevron } = partsOf(changed);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // The words are in a hidden element beside the heading: the toggle's name and the heading's text stay
    // the title.
    await expect(toggle).toHaveAccessibleName('Profile');
    await expect(toggle).toHaveAccessibleDescription('Changed');
    await expect(title.textContent).toBe('Profile');
    // An 8px light signal orange dot, round in every shape.
    const dot = dotOf(changed);
    const style = getComputedStyle(dot);
    await expect(style.width).toBe('8px');
    await expect(style.height).toBe('8px');
    await expect(style.backgroundColor).toBe(tokenColor('--color-signal-light'));
    await expect(parseFloat(style.borderTopLeftRadius)).toBeGreaterThanOrEqual(4);
    // After the last word of a title on one line, a part step on, level with the line, and short of the chevron.
    const box = dot.getBoundingClientRect();
    await expect(Math.abs(box.left - lastWords(text).right - tokenPixels('--spacing-part'))).toBeLessThan(
      0.5,
    );
    await expect(Math.abs(firstLineOffset(dot, text))).toBeLessThanOrEqual(0.5);
    await expect(box.right).toBeLessThan(chevron.getBoundingClientRect().left);
    // A title that wraps keeps the dot level with its first line, inside the toggle and clear of the chevron.
    const long = byTestId(canvasElement, 'long');
    const longParts = partsOf(long);
    const longDot = dotOf(long).getBoundingClientRect();
    await expect(lineCount(longParts.text)).toBeGreaterThan(1);
    await expect(Math.abs(firstLineOffset(dotOf(long), longParts.text))).toBeLessThanOrEqual(0.5);
    await expect(longDot.left).toBeGreaterThanOrEqual(longParts.text.getBoundingClientRect().right);
    await expect(longDot.right).toBeLessThan(longParts.chevron.getBoundingClientRect().left);
    await expect(longDot.right).toBeLessThanOrEqual(longParts.toggle.getBoundingClientRect().right);
    // The same title with nothing changed shows no dot, and its words and header are where the marked one's are.
    const saved = byTestId(canvasElement, 'saved');
    const savedParts = partsOf(saved);
    await expect(savedParts.text.querySelector('.card-marker')).toBeNull();
    await expect(savedParts.toggle).not.toHaveAttribute('aria-describedby');
    await expect(placeIn(saved, savedParts.text.getBoundingClientRect())).toEqual(
      placeIn(long, longParts.text.getBoundingClientRect()),
    );
    await expect(savedParts.header.getBoundingClientRect().height).toBe(
      longParts.header.getBoundingClientRect().height,
    );
  },
};

/**
 * A field that fails the browser's validation on submit opens the folded card that holds it, before React Aria
 * moves focus to the field, so the field is shown, focused and in view.
 */
export const OpensForInvalid: Story = {
  // A check of the open: the open and the folded card are shot in Open and Folded.
  tags: ['no-visual'],
  args: { title: 'Billing', note: 'Paid by card, every month.', defaultExpanded: false },
  render: (args) => (
    <form
      onSubmit={(event) => {
        event.preventDefault();
      }}
      style={{ display: 'grid', gap: 24 }}
    >
      <CollapsibleCard {...args} data-testid="card">
        <TextField label="Card holder" isRequired />
      </CollapsibleCard>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  ),
  play: async ({ canvas, canvasElement, userEvent }) => {
    const card = byTestId(canvasElement, 'card');
    const { toggle } = partsOf(card);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const field = canvas.getByRole('textbox', { name: 'Card holder' });
    await expect(field).toHaveFocus();
    await waitFor(async () => {
      await expect(card).not.toHaveAttribute('data-folding');
    });
    // Shown whole: nothing clips it and nothing covers it, and it is inside the window.
    await expect(field).toBeVisible();
    const box = field.getBoundingClientRect();
    await expect(box.top).toBeGreaterThanOrEqual(0);
    await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    await expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(field);
  },
};
```

In `packages/react/src/rtl/RightToLeft.stories.tsx` make three edits, in this order.

Edit 1. Replace:

```tsx
/**
 * The title starts at the right of its row and the chevron is at the left end of the toggle, which is the
 * end of the row in right to left, with the actions after it. Folded, the chevron turns toward the title:
 * to the right, the inline start. In a narrow card the actions move under the note, to the right, where the
 * row starts.
 */
export const CollapsibleCardMirrored: Story = {
  render: () => (
```

with:

```tsx
/**
 * The title starts at the right of its row and the chevron is at the left end of the toggle, which is the
 * end of the row in right to left, with the actions after it. Folded, the chevron turns toward the title:
 * to the right, the inline start, and the dot that marks a change follows the title's words, to their left.
 * In a narrow card the actions move under the note, to the right, where the row starts.
 */
export const CollapsibleCardMirrored: Story = {
  render: () => (
```

Edit 2. Replace:

```tsx
        >
          <p>تحديثات المنتج عند إطلاق شيء جديد.</p>
        </CollapsibleCard>
        <CollapsibleCard title="الفواتير" defaultExpanded={false}>
          <p>الدفع بالبطاقة كل شهر.</p>
        </CollapsibleCard>
        <div style={{ width: 288 }}>
```

with:

```tsx
        >
          <p>تحديثات المنتج عند إطلاق شيء جديد.</p>
        </CollapsibleCard>
        <CollapsibleCard title="الفواتير" defaultExpanded={false} isChanged>
          <p>الدفع بالبطاقة كل شهر.</p>
        </CollapsibleCard>
        <div style={{ width: 288 }}>
```

Edit 3. Replace:

```tsx
    // Open, the chevron points down. Folded, it turns a quarter toward the title, which is to the right.
    await expect(getComputedStyle(find(open, '.card-chevron')).rotate).toBe('none');
    await expect(getComputedStyle(find(folded, '.card-chevron')).rotate).toBe('-90deg');
    // Narrow, the note stays under the title and the actions move under the note, starting at the right.
    const narrowTitle = rect(find(narrow, '.card-title'));
    const narrowNote = rect(find(narrow, '.card-note'));
```

with:

```tsx
    // Open, the chevron points down. Folded, it turns a quarter toward the title, which is to the right.
    await expect(getComputedStyle(find(open, '.card-chevron')).rotate).toBe('none');
    await expect(getComputedStyle(find(folded, '.card-chevron')).rotate).toBe('-90deg');
    // Folded and changed, the dot follows the words a part step to their left, short of the chevron.
    const dot = rect(find(folded, '.card-marker'));
    await expectSameEdge(lastText(find(folded, '.card-toggle-text')).left - dot.right, 8);
    await expect(dot.left).toBeGreaterThan(rect(find(folded, '.card-chevron')).right);
    // Narrow, the note stays under the title and the actions move under the note, starting at the right.
    const narrowTitle = rect(find(narrow, '.card-title'));
    const narrowNote = rect(find(narrow, '.card-note'));
```

The end-to-end test goes after the test of find-in-page.

In `apps/docs/tests/docs.spec.ts` make one edit.

Replace:

```ts
  await expect(fold).not.toHaveCSS('display', 'none');
  await expect(fold.locator('.card-body')).toBeHidden();
});
```

with:

```ts
  await expect(fold).not.toHaveCSS('display', 'none');
  await expect(fold.locator('.card-body')).toBeHidden();
});

test('a folded collapsible card on its page marks the change it holds, and drops the mark when it is reset', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => {
    errors.push(error.message);
  });
  await visit(page, '/docs/components/collapsible-card');
  const toggle = page.getByRole('button', { name: 'Workspace', exact: true });
  const card = page.locator('.card-collapsible').filter({ has: toggle });
  const dot = toggle.locator('.card-marker');
  /** Where the title's words sit in the card, wherever the page has scrolled to. */
  const place = (): Promise<number[]> =>
    toggle.locator('.card-toggle-text').evaluate((element) => {
      const box = element.getBoundingClientRect();
      const edge = element.closest('.card-collapsible')?.getBoundingClientRect() ?? box;
      return [box.left - edge.left, box.top - edge.top, box.width, box.height];
    });
  // The server drew the card folded, and once the page has hydrated the card finds the changed field in it,
  // with no hydration warning.
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(dot).toBeVisible();
  await expect(dot).toHaveCSS('background-color', 'rgb(243, 115, 56)');
  await expect(toggle).toHaveAccessibleDescription('Changed');
  await expect(page.getByRole('heading', { name: 'Workspace', exact: true })).toBeVisible();
  expect(errors).toEqual([]);
  const marked = await place();
  // Open, the field shows its own chip and the card shows no mark. Folded again, the mark is back.
  await toggle.click();
  await expect(dot).toHaveCount(0);
  await expect(card.locator('.field-changed')).toBeVisible();
  await toggle.click();
  await expect(dot).toBeVisible();
  // Reset sits in the header, so it works while the card is folded. The mark goes, and the title stays put.
  await card.getByRole('button', { name: 'Reset' }).click();
  await expect(dot).toHaveCount(0);
  await expect(toggle).not.toHaveAttribute('aria-describedby');
  expect(await place()).toEqual(marked);
});
```

- [ ] **Step 2: Run them and watch them fail**

The stories and the docs read the built packages, so build them first. They are still the old code at this point.

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark CollapsibleCard RightToLeft
rm -rf apps/docs/.next
pnpm turbo run build --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:

- The build ends `check-use-client: every client module keeps its directive (52 sources, 19 client modules)`.
- The core run FAILS with `Test Files  1 failed | 1 passed (2)` and `Tests  4 failed | 221 passed (225)`: the 3 new tests in `css.test.js` and the 1 it changes. The new contrast test passes: it measures tokens, which this task does not change.

```text
FAIL  test/css.test.js > src/components/card.css, the collapsible card > draws in tokens only: a slate chevron that turns ink, and a light signal orange marker
AssertionError: expected [ '--color-ink', '--color-slate' ] to deeply equal [ '--color-ink', …(2) ]
FAIL  test/css.test.js > src/components/card.css, the collapsible card > draws the folded marker as an 8px light signal orange dot after the title, level with its first line
AssertionError: expected '' to contain 'width: 8px;'
FAIL  test/css.test.js > src/components/card.css, the collapsible card > keeps room for the dot beside a folded title, so the title never moves when the dot comes or goes
AssertionError: expected '' to be 'margin-inline-end: calc(8px + var(--s…' // Object.is equality
FAIL  test/css.test.js > src/components/card.css, the collapsible card > draws the dot in the reader's text color in forced colors, where a background would be lost
AssertionError: expected '' to contain 'background-color: CanvasText;'
```

- The React run FAILS with `Test Files  2 failed | 38 passed (40)` and `Tests  11 failed | 690 passed | 4 expected fail (705)`. Three of the 14 new tests pass, and pin what must stay true: axe finds nothing on folded and nested cards, a failing field among the header's actions leaves the card folded, and a field React Aria validates with `validationBehavior="aria"` fires no `invalid` event and leaves the card folded.

```text
FAIL  test/server-render.test.tsx > the client components on the server > CollapsibleCard, folded and changed renders to HTML with no browser
AssertionError: expected '<div class="card card-collapsible" da…' to contain 'class="card card-collapsible" data-in…'
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > shows a dot after the title, and is described as changed, only while folded, when isChanged says so
AssertionError: expected null not to be null
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > shows the marker while a field in its folded body is changed, as the field changes
AssertionError: expected null not to be null
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > shows the marker the moment it folds over a field that changed while it was open
AssertionError: expected null not to be null
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > watches its fold only while folded, and stops when it opens or leaves the page
AssertionError: expected [] to have a length of 1 but got +0
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > counts a changed field inside a card nested in its body, and the nested card keeps its own fold and marker
AssertionError: expected null not to be null
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > counts a card nested in its body whose isChanged is true, open or folded, by its root
Error: expect(element).toHaveAttribute("data-changed", "") // element.getAttribute("data-changed") === ""
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard while it holds a change > reads changedLabel as the marker
Error: expect(element).toHaveAccessibleDescription()
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a field that fails validation > opens when a field inside fails the browser validation on submit, before the field takes focus
Error: expect(element).toHaveAttribute("aria-expanded", "true") // element.getAttribute("aria-expanded") === "true"
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a field that fails validation > asks a controlled card to open, through onExpandedChange
AssertionError: expected "vi.fn()" to be called once with arguments: [ true ]
FAIL  src/collapsible-card/CollapsibleCard.test.tsx > CollapsibleCard with a field that fails validation > opens a remembered fold through the store, which forgets the fold
Error: expect(element).toHaveAttribute("aria-expanded", "true") // element.getAttribute("aria-expanded") === "true"
```

- The Storybook run FAILS with `Test Files  4 failed (4)` and `Tests  6 failed | 32 passed (38)`, in the `storybook` and the `storybook-dark` project alike: `FoldedChanged` with `expect(element).toHaveAccessibleDescription()` expecting `Changed`, `OpensForInvalid` with `expect(element).toHaveAttribute("aria-expanded", "true")` receiving `aria-expanded="false"`, and `CollapsibleCardMirrored` with `Nothing matches .card-marker`.
- The docs build lists 24 static pages. The `lsof` prints nothing; if another checkout uses port 3100, run the suite as `DOCS_E2E_PORT=3506 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free, as the prototype did. The end-to-end run FAILS with `1 failed` and `167 passed`: `a folded collapsible card on its page marks the change it holds, and drops the mark when it is reset`, with `Locator: getByRole('button', { name: 'Workspace', exact: true })` and `Error: element(s) not found`. The example does not exist yet.

- [ ] **Step 3: Write the hooks, the marker, the CSS, the docs, the record and the changeset**

The hooks. Create `packages/react/src/collapsible-card/useFoldedFields.ts`:

```ts
import { useCallback, useLayoutEffect, useSyncExternalStore, type RefObject } from 'react';
import { flushSync } from 'react-dom';

/** How the fold is watched: the one attribute a changed field carries, anywhere inside it. */
const WATCH: MutationObserverInit = { attributeFilter: ['data-changed'], subtree: true, childList: true };

/**
 * Whether anything inside the fold carries `data-changed`, as every library field's root does while it is
 * changed, so a folded card can say it holds a change. A field in a card nested in the body counts too.
 *
 * The fold is read and watched only while the card is folded. It is read in the render that folds the card,
 * so a change made while the card was open shows at once. From then on a MutationObserver watches that one
 * attribute in the fold's subtree, and the elements that come and go there, until the card opens or leaves
 * the page, when it is disconnected. Open, the card shows no marker and nothing is watched.
 *
 * The server has no fold to read, so nothing inside is changed there, or while the page hydrates.
 *
 * Internal: not exported from the package.
 */
export function useHoldsChange(foldRef: RefObject<HTMLElement | null>, isFolded: boolean): boolean {
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const fold = foldRef.current;
      if (!isFolded || !fold) return () => undefined;
      const observer = new MutationObserver(onChange);
      observer.observe(fold, WATCH);
      return () => {
        observer.disconnect();
      };
    },
    [foldRef, isFolded],
  );
  const holdsChange = (): boolean => {
    const fold = foldRef.current;
    return isFolded && fold !== null && fold.querySelector('[data-changed]') !== null;
  };
  return useSyncExternalStore(subscribe, holdsChange, () => false);
}

/**
 * Opens the card through `open`, the path a press of the toggle takes, when a field in its folded body fails
 * the browser's validation on submit. The browser fires `invalid` at each control that fails before it moves
 * focus to the first one, and a React Aria field moves the focus itself, from its own `invalid` listener on
 * the control. This listener is on the card's root, in the capture phase, so it runs before both, and it
 * renders the open at once, so the body is shown before anything focuses a field in it. Only a folded card
 * listens, and only a control inside the fold opens it: one among the header's actions is in view already.
 *
 * The root is the fold's grandparent: the root holds React Aria's disclosure, which holds the fold.
 *
 * Internal: not exported from the package.
 */
export function useOpenOnInvalid(
  foldRef: RefObject<HTMLElement | null>,
  isFolded: boolean,
  open: () => void,
): void {
  useLayoutEffect(() => {
    const fold = foldRef.current;
    const root = fold?.parentElement?.parentElement;
    if (!isFolded || !fold || !root) return;
    const onInvalid = (event: Event): void => {
      if (event.target instanceof Node && fold.contains(event.target)) flushSync(open);
    };
    root.addEventListener('invalid', onInvalid, true);
    return () => {
      root.removeEventListener('invalid', onInvalid, true);
    };
  }, [foldRef, isFolded, open]);
}
```

The card takes `isChanged` and `changedLabel`, watches its fold, listens for an invalid field, and the toggle draws the marker.

In `packages/react/src/collapsible-card/CollapsibleCard.tsx` make seven edits, in this order.

Edit 1. Replace:

```tsx
  Disclosure as RACDisclosure,
  DisclosurePanel as RACDisclosurePanel,
} from 'react-aria-components';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStoredFold } from './foldStore';
import { useFolding } from './useFolding';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
```

with:

```tsx
  Disclosure as RACDisclosure,
  DisclosurePanel as RACDisclosurePanel,
} from 'react-aria-components';
import { useChangedDescription } from '../field/useChangedDescription';
import { cx } from '../utils/cx';
import { present } from '../utils/present';
import { useStoredFold } from './foldStore';
import { useHoldsChange, useOpenOnInvalid } from './useFoldedFields';
import { useFolding } from './useFolding';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
```

Edit 2. Replace:

```tsx
   */
  storageKey?: string;
  /**
   * The element to render. A `section` with an accessible name is a region landmark. An `article` is
   * not a landmark, named or not, and a `div` is neither.
   * @default 'div'
```

with:

```tsx
   */
  storageKey?: string;
  /**
   * Marks a folded card as holding a change even when no field inside says so. A folded card already marks
   * itself while any element in its body carries `data-changed`, as every library field's root does while
   * it is changed, so this is for a change the card's fields do not report. While folded, the marker is a
   * light signal orange dot after the title, and the toggle is described by `changedLabel`. Open, the card
   * shows no marker, and each field shows its own Changed chip. While it is true, the card's root carries
   * `data-changed`, as a field's does, so a collapsible card around this one counts the change too.
   */
  isChanged?: boolean;
  /**
   * The words a screen reader reads with the toggle while the folded marker shows.
   * @default 'Changed'
   */
  changedLabel?: string;
  /**
   * The element to render. A `section` with an accessible name is a region landmark. An `article` is
   * not a landmark, named or not, and a `div` is neither.
   * @default 'div'
```

Edit 3. Replace:

```tsx
 * The title, drawn as the card title, holding the toggle: the title's text and the chevron, which is
 * decoration. The title names the toggle and `aria-expanded` gives its state. This is the one place the
 * toggle is built, so anything that comes to describe it is added here.
 */
function CardToggle({ title, level }: { title: ReactNode; level: 1 | 2 | 3 | 4 }): ReactElement {
  const Heading = `h${level}` as const;
  return (
    <Heading className="card-title">
      <RACButton slot="trigger" className="card-toggle">
        <span className="card-toggle-text">{title}</span>
        <ChevronDown className="card-chevron" aria-hidden="true" />
      </RACButton>
    </Heading>
  );
}
```

with:

```tsx
 * The title, drawn as the card title, holding the toggle: the title's text and the chevron, which is
 * decoration. The title names the toggle and `aria-expanded` gives its state. This is the one place the
 * toggle is built, so anything that comes to describe it is added here.
 *
 * While `isMarked`, the toggle carries the folded marker: a dot after the title's words, which is decoration
 * too, and `changedLabel`, which describes the toggle. The words are in a `hidden` element after the heading,
 * which a description may name, so neither the toggle's name nor the heading's text changes.
 */
function CardToggle({
  title,
  level,
  isMarked,
  changedLabel,
}: {
  title: ReactNode;
  level: 1 | 2 | 3 | 4;
  isMarked: boolean;
  changedLabel: string;
}): ReactElement {
  const Heading = `h${level}` as const;
  const { chipId, describedBy } = useChangedDescription({ isChanged: isMarked });
  return (
    <>
      <Heading className="card-title">
        <RACButton slot="trigger" className="card-toggle" aria-describedby={describedBy}>
          <span className="card-toggle-text">
            {title}
            {isMarked ? <span className="card-marker" aria-hidden="true" /> : null}
          </span>
          <ChevronDown className="card-chevron" aria-hidden="true" />
        </RACButton>
      </Heading>
      {isMarked ? (
        <span id={chipId} className="card-marker-label" hidden>
          {changedLabel}
        </span>
      ) : null}
    </>
  );
}
```

Edit 4. Replace:

```tsx
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card. Given a
 * `storageKey`, it remembers its fold in the browser.
 */
export function CollapsibleCard({
  title,
```

with:

```tsx
 * chevron at its end, and the note and the actions stay in the header while the body is folded. It draws
 * with Card's own classes, so the two look alike, and it is built on React Aria's Disclosure, so the toggle
 * is a button that says whether the body is shown, and find-in-page can open a folded card. Given a
 * `storageKey`, it remembers its fold in the browser. Folded, it marks a change any field in its body holds,
 * and it opens itself when a field in its body fails the browser's validation on submit.
 */
export function CollapsibleCard({
  title,
```

Edit 5. Replace:

```tsx
  isExpanded: isExpandedProp,
  onExpandedChange,
  storageKey,
  as: tag = 'div',
  className,
  children,
```

with:

```tsx
  isExpanded: isExpandedProp,
  onExpandedChange,
  storageKey,
  isChanged = false,
  changedLabel = 'Changed',
  as: tag = 'div',
  className,
  children,
```

Edit 6. Replace:

```tsx
  );
  const foldRef = useRef<HTMLDivElement>(null);
  const isInstant = useFolding(foldRef, isExpanded);
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it.
```

with:

```tsx
  );
  const foldRef = useRef<HTMLDivElement>(null);
  const isInstant = useFolding(foldRef, isExpanded);
  const holdsChange = useHoldsChange(foldRef, !isExpanded);
  useOpenOnInvalid(foldRef, !isExpanded, () => {
    setExpanded(true);
  });
  // createElement rather than JSX: the three tags take one HTMLElement ref type between them. React Aria's
  // disclosure always renders a div and passes on only global attributes, so the root is the card's own
  // element, which takes any attribute, and the disclosure sits inside it.
```

Edit 7. Replace:

```tsx
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
      'data-instant': isInstant ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
        <CardToggle title={title} level={level} />
        {present(note) ? <p className="card-note">{note}</p> : null}
        {present(actions) ? <div className="card-actions">{actions}</div> : null}
      </div>
```

with:

```tsx
      className: cx('card', 'card-collapsible', className),
      'data-expanded': isExpanded ? '' : undefined,
      'data-instant': isInstant ? '' : undefined,
      'data-changed': isChanged ? '' : undefined,
    },
    <RACDisclosure className="card-disclosure" isExpanded={isExpanded} onExpandedChange={setExpanded}>
      <div className="card-header">
        <CardToggle
          title={title}
          level={level}
          isMarked={!isExpanded && (isChanged || holdsChange)}
          changedLabel={changedLabel}
        />
        {present(note) ? <p className="card-note">{note}</p> : null}
        {present(actions) ? <div className="card-actions">{actions}</div> : null}
      </div>
```

The dot, its room, its words, and the dot in forced colors.

In `packages/core/src/components/card.css` make five edits, in this order.

Edit 1. Replace:

```css
   * hydration. The component sets all three. The header and the fold sit in
   * React Aria's disclosure element, .card-disclosure, which draws nothing.
   * Every state rule reaches them through it from the root, so a card nested
   * in the body keeps its own state.
   */

  /* The header is a grid. The title, which holds the toggle, takes the first
```

with:

```css
   * hydration. The component sets all three. The header and the fold sit in
   * React Aria's disclosure element, .card-disclosure, which draws nothing.
   * Every state rule reaches them through it from the root, so a card nested
   * in the body keeps its own state. The folded marker is drawn only while it
   * shows, so it needs no state rule of its own, and its words are in an
   * element the hidden attribute hides, which a description may still name.
   */

  /* The header is a grid. The title, which holds the toggle, takes the first
```

Edit 2. Replace:

```css
    -webkit-tap-highlight-color: transparent;
  }

  .card-toggle-text {
    flex: auto;
    min-width: 0;
  }
```

with:

```css
    -webkit-tap-highlight-color: transparent;
  }

  /* The words take their own width and no more, so the folded marker can
     follow the last word of a title on one line. The chevron's auto margin
     keeps it at the end of the row. */
  .card-toggle-text {
    position: relative;
    flex: 0 1 auto;
    min-width: 0;
  }
```

Edit 3. Replace:

```css
    width: 24px;
    height: 24px;
    margin-block: calc((1lh - 24px) / 2);
    color: var(--color-slate);
    transition: rotate 200ms ease;
  }
```

with:

```css
    width: 24px;
    height: 24px;
    margin-block: calc((1lh - 24px) / 2);
    margin-inline-start: auto;
    color: var(--color-slate);
    transition: rotate 200ms ease;
  }
```

Edit 4. Replace:

```css
  .card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-chevron {
    rotate: var(--card-chevron-turn, 90deg);
  }

  /* The space and the rule between the header and the body fold with the
```

with:

```css
  .card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-chevron {
    rotate: var(--card-chevron-turn, 90deg);
  }

  /* The folded marker: a light signal orange dot after the title's words,
     the attention cue the system keeps for a change. It hangs off the end of
     the words, out of the flow, a part step on, and is centred on their first
     line, as the chevron is, so a title that wraps keeps it beside the words a
     reader starts with. The toggle's description carries what it means, and
     the dot is a cue beside it for the eye. */
  .card-marker {
    position: absolute;
    inset-block-start: calc((1lh - 8px) / 2);
    inset-inline-start: calc(100% + var(--spacing-part));
    width: 8px;
    height: 8px;
    border-radius: var(--radius-dot);
    background-color: var(--color-signal-light);
  }

  /* A folded title keeps room for the dot and the gap before it, drawn or
     not, so the title never moves when the dot comes or goes. An open card
     draws no marker and keeps no room. */
  .card-collapsible:not([data-expanded]) > .card-disclosure > .card-header .card-toggle-text {
    margin-inline-end: calc(8px + var(--spacing-part));
  }

  /* The space and the rule between the header and the body fold with the
```

Edit 5. Replace:

```css
  /* Forced colors repaint text in the reader's palette, but an svg keeps the
     color its author set, so the slate or ink chevron would stay as it was. It
     takes the toggle's color there, the reader's text color, at rest, under the
     pointer and pressed alike. */
  @media (forced-colors: active) {
    .card-chevron,
    .card-toggle:is(:hover, [data-hovered], :active, [data-pressed]) .card-chevron {
      color: inherit;
    }
  }
```

with:

```css
  /* Forced colors repaint text in the reader's palette, but an svg keeps the
     color its author set, so the slate or ink chevron would stay as it was. It
     takes the toggle's color there, the reader's text color, at rest, under the
     pointer and pressed alike. The marker's dot is a background, which forced
     colors paint over with the page's own, so it takes the reader's text color
     too. */
  @media (forced-colors: active) {
    .card-chevron,
    .card-toggle:is(:hover, [data-hovered], :active, [data-pressed]) .card-chevron {
      color: inherit;
    }

    .card-marker {
      background-color: CanvasText;
    }
  }
```

Run `pnpm --filter @snapshot-ui/core lint`. Expected: no Stylelint or ESLint output.

The size limit.

In `packages/react/.size-limit.json` make one edit.

Replace:

```json
    "path": "dist/index.js",
    "import": "{ CollapsibleCard }",
    "ignore": ["react", "react-dom", "react-aria-components", "lucide-react"],
    "limit": "1.5 kB"
  },
  {
    "name": "Button with React Aria (watch only)",
```

with:

```json
    "path": "dist/index.js",
    "import": "{ CollapsibleCard }",
    "ignore": ["react", "react-dom", "react-aria-components", "lucide-react"],
    "limit": "2.5 kB"
  },
  {
    "name": "Button with React Aria (watch only)",
```

The docs example, a client file. Create `apps/docs/examples/collapsible-card-changed.tsx`:

```tsx
'use client';

import { Button, CollapsibleCard, TextField } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = 'Northwind Studio';

export default function CollapsibleCardChanged(): ReactElement {
  const [name, setName] = useState('Northwind Design');
  return (
    <CollapsibleCard
      title="Workspace"
      level={3}
      note="Folded over a changed field, the card marks the change after its title."
      defaultExpanded={false}
      actions={
        <Button
          variant="secondary"
          isDisabled={name === SAVED}
          onPress={() => {
            setName(SAVED);
          }}
        >
          Reset
        </Button>
      }
      style={{ width: '100%', maxWidth: 480 }}
    >
      <TextField label="Workspace name" value={name} onChange={setName} isChanged={name !== SAVED} />
    </CollapsibleCard>
  );
}
```

In `apps/docs/examples/index.ts` make two edits, in this order.

Edit 1. Replace:

```ts
import CheckboxValidation from './checkbox-validation';
import CollapsibleCardActions from './collapsible-card-actions';
import CollapsibleCardBasic from './collapsible-card-basic';
import CollapsibleCardRemembered from './collapsible-card-remembered';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
```

with:

```ts
import CheckboxValidation from './checkbox-validation';
import CollapsibleCardActions from './collapsible-card-actions';
import CollapsibleCardBasic from './collapsible-card-basic';
import CollapsibleCardChanged from './collapsible-card-changed';
import CollapsibleCardRemembered from './collapsible-card-remembered';
import EyebrowHeading from './eyebrow-heading';
import LengthCounter from './field-counter';
```

Edit 2. Replace:

```ts
  'checkbox-validation': CheckboxValidation,
  'collapsible-card-actions': CollapsibleCardActions,
  'collapsible-card-basic': CollapsibleCardBasic,
  'collapsible-card-remembered': CollapsibleCardRemembered,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
```

with:

```ts
  'checkbox-validation': CheckboxValidation,
  'collapsible-card-actions': CollapsibleCardActions,
  'collapsible-card-basic': CollapsibleCardBasic,
  'collapsible-card-changed': CollapsibleCardChanged,
  'collapsible-card-remembered': CollapsibleCardRemembered,
  'eyebrow-heading': EyebrowHeading,
  'field-counter': LengthCounter,
```

The docs page gains two sections after Remembering the fold, and the props table gains `isChanged` and `changedLabel`.

In `apps/docs/content/docs/components/collapsible-card.mdx` make two edits, in this order.

Edit 1. Replace:

```markdown
<Section>

## Usage

A card is open on its first render. Pass `defaultExpanded={false}` to start it folded, or control it with `isExpanded` and `onExpandedChange`. The children are the body, laid out as a card's body is. CollapsibleCard is a client component, and a server component can render it, as the first example on this page does.
```

with:

```markdown
<Section>

## The changed marker

While a card is folded, a light signal orange dot after its title says that its body holds a change, so a change never goes out of sight. The card finds the change itself: any element in its body that carries `data-changed`, as every Snapshot UI field's root does while its `isChanged` is true, marks the card, and so does a changed field in a card nested in the body. For a change that no field reports, pass `isChanged` to the card. Its root then carries `data-changed` too, so a collapsible card around it counts the change. Open, the card shows no marker, and each field shows its own Changed chip.

<Preview name="collapsible-card-changed" />

A screen reader reads the toggle's title, then collapsed, then `changedLabel`, which is "Changed" unless you give other words. The dot is for the eye, and a screen reader skips it. A folded title keeps room for the dot, so the title stays where it is when the dot comes or goes. The card watches its body only while it is folded, and looks once as it folds, so a field changed while the card was open marks it at once. The server cannot look in the body, so on a server-rendered page the dot for a changed field appears once the page has hydrated. A card the server draws folded with `isChanged` shows its dot from the first frame.

</Section>

<Section>

## Opening for an invalid field

A folded card opens itself when a field in its body fails the browser's validation on submit, so the field can be seen and fixed. A field among the header's actions is in view already, so it leaves the card folded. The card hears the browser's `invalid` event before the field takes focus, and opens the way its toggle does: a remembered fold is forgotten, and `onExpandedChange` is called with `true`, so a card that `isExpanded` controls opens once the app sets it open.

This covers fields that leave validation to the browser, which React Aria does by default, with `validationBehavior="native"`. With `validationBehavior="aria"` the browser sees nothing wrong, fires no `invalid` event and lets the form submit, so the card stays folded. Open it from your own state, with `isExpanded`, when your validation fails.

</Section>

<Section>

## Usage

A card is open on its first render. Pass `defaultExpanded={false}` to start it folded, or control it with `isExpanded` and `onExpandedChange`. The children are the body, laid out as a card's body is. CollapsibleCard is a client component, and a server component can render it, as the first example on this page does.
```

Edit 2. Replace:

```markdown
The rest of the HTML attributes, `className` and `ref` go on the card's root, and `className` is merged after the library's classes.

<PropsTable path="../../packages/react/src/collapsible-card/CollapsibleCard.tsx" type="Pick<CollapsibleCardProps, 'title' | 'level' | 'note' | 'actions' | 'defaultExpanded' | 'isExpanded' | 'onExpandedChange' | 'storageKey' | 'as' | 'className'>" />

</Section>
```

with:

```markdown
The rest of the HTML attributes, `className` and `ref` go on the card's root, and `className` is merged after the library's classes.

<PropsTable path="../../packages/react/src/collapsible-card/CollapsibleCard.tsx" type="Pick<CollapsibleCardProps, 'title' | 'level' | 'note' | 'actions' | 'defaultExpanded' | 'isExpanded' | 'onExpandedChange' | 'storageKey' | 'isChanged' | 'changedLabel' | 'as' | 'className'>" />

</Section>
```

The record. In `docs/design-system.md`, append after the file's last line, the end of the `## CollapsibleCard` section, with one blank line before it:

```markdown
**The folded marker.** A folded card that holds a change shows a dot after its
title: 8px, `--radius-dot`, Light Signal Orange, the attention cue the system
keeps for a change, as on a changed field's edge. It shows while the card is
folded and either `isChanged` is given or an element in the body carries
`data-changed`, which every field's root carries while it is changed, a field
in a nested card included. While `isChanged` is true the card's own root
carries `data-changed` too, as a field's root does, so a collapsible card
around it counts the change, whether the inner card is open or folded. The
core stylesheets key `[data-changed]` only under a field's own classes, so the
attribute draws nothing on a card. A MutationObserver on the fold watches that
one attribute in its subtree, and the elements that come and go there, only
while the card is folded, and is disconnected when it opens or leaves the
page, so a large open card costs nothing. The render that folds the card reads
the fold once, so a field changed while the card was open marks it at once.
The dot hangs off the end of the title's words, out of the flow, a part step
on, and is centred on their first line, as the chevron is, so a title that
wraps keeps it beside the words a reader starts with. The words now take their
own width and no more, and the chevron's auto margin keeps the row's end, so
on one line the dot follows the last word. A folded title always keeps the
dot's room, 16px, drawn or not, so the title never moves when the dot comes or
goes; an open card keeps none, so no open card changed. While the dot shows,
the toggle is described by `changedLabel`, "Changed" unless given, in an
element with the `hidden` attribute after the heading, which a description may
name, so the toggle's name and the heading's text stay the title, and a screen
reader reads the title, collapsed, then Changed. In forced colors the dot, a
background, was painted over with the canvas and vanished (checked in Chromium
with forced colors emulated), so the forced-colors block draws it in
`CanvasText`.

| Folded marker on the card's Lifted ground | Light | Dark |
| --- | --- | --- |
| Light Signal Orange | 2.78 | 6.07 |

The dot is under the 3:1 that WCAG 1.4.11 asks of a graphic that carries
meaning, in light, as the eyebrow's dot and a changed field's edge are. It is
accepted, and recorded rather than gated, because the dot is not where the
meaning lives: the toggle's description carries it, so a screen reader reads
Changed, and the dot is a cue beside the title, supplementary to it. Opening
the card shows each changed field's clay chip, which is gated. A contrast test
holds these two numbers and checks that no pair gates the dot.

**Opening for an invalid field.** A folded card opens itself when a field in
its body fails the browser's validation on submit. It listens on its root, in
the capture phase, for the `invalid` event the browser fires at each control
that fails, and opens through the same setter as its toggle when the control
is inside the fold, so a remembered fold is forgotten and a controlled card is
asked through `onExpandedChange(true)`. A control among the header's actions
is in view already and leaves the card folded. A React Aria field moves focus
to the first field that failed, itself, from its own `invalid` listener on the
control, during the same event, so the card renders the open inside its
listener with `flushSync`. Without it, a submit started from script left the
field to take focus while its card was still folded and hidden: in jsdom the
field was focused with the card's toggle still collapsed and the panel still
`hidden="until-found"`. In Chromium a story submits the form of a folded card,
and the field is open, focused, and drawn whole in the window once the fold
has settled. React Aria's other path, `validationBehavior="aria"`, sets no
`required` attribute and no custom validity, so the browser finds nothing
wrong, fires no `invalid` event and submits the form. A folded card then stays
folded, the docs say so, and an app that validates that way opens the card
from its own state. No second mechanism was added for it.
```

The changeset. Create `.changeset/collapsible-card-marker.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

Mark a folded CollapsibleCard that holds a change, and open it for an invalid field. While folded, the card shows a light signal orange dot after its title when a field in its body is changed, or when `isChanged` says so, and a screen reader reads `changedLabel`, "Changed" by default, with the toggle. A folded card also opens itself when a field in its body fails the browser's validation on submit, before the field takes focus.
```

Run `pnpm exec changeset status --verbose`. Expected: both packages under `minor`, with this changeset beside `checkbox-changed.md`, `collapsible-card-memory.md`, `collapsible-card.md`, `disabled-labels.md` and `field-names.md`, and nothing under `major`.

- [ ] **Step 4: Run the tests and watch them pass**

```bash
pnpm turbo run build --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm --filter @snapshot-ui/core exec vitest run test/css.test.js test/contrast.test.js
pnpm --filter @snapshot-ui/react exec vitest run
pnpm --filter @snapshot-ui/storybook exec vitest run --project=storybook --project=storybook-dark CollapsibleCard RightToLeft
```

Expected: `Test Files  2 passed (2)` and `Tests  225 passed (225)` for core, `Test Files  40 passed (40)` and `Tests  701 passed | 4 expected fail (705)` for React, and `Test Files  4 passed (4)` with `Tests  38 passed (38)` for the two story files. The build now ends `(53 sources, 19 client modules)`: the hooks are one more source, and not a client module. The first time the prototype ran the story files after the build, all four failed to import, with `TypeError: Failed to fetch dynamically imported module` for Storybook's own setup file and no test run, and passed whole when run again. If that happens, run it again.

- [ ] **Step 5: Run everything**

```bash
pnpm format
pnpm format:check
pnpm turbo run build lint typecheck test check:package --filter=@snapshot-ui/core --filter=@snapshot-ui/react
pnpm turbo run build test --filter=@snapshot-ui/storybook
rm -rf apps/docs/.next
pnpm turbo run build typecheck lint --filter=@snapshot-ui/docs
lsof -nP -iTCP:3100 -sTCP:LISTEN
pnpm --filter @snapshot-ui/docs test:e2e
pnpm --filter @snapshot-ui/react size
pnpm verify
```

Expected:
- `pnpm format` changes no file. `pnpm format:check` prints `All matched files use Prettier code style!`.
- Core: the 4 tests this task adds, so `Tests  322 passed (322)` in 5 files (318 before). React: the 14 tests this task adds, so `Tests  701 passed | 4 expected fail (705)` in 40 files (687 before). The React build ends `check-use-client: every client module keeps its directive (53 sources, 19 client modules)`, and publint prints `All good!` for both packages. Turborepo reports 10 successful tasks.
- Storybook: the 2 stories this task adds, run in two projects, so `Tests  388 passed (388)` in 40 files (384 before). Turborepo reports 4 successful tasks.
- Docs build, type-check and lint: 5 successful tasks, and the build generates 24 static pages, as before.
- The `lsof` prints nothing, and the end-to-end run ends `168 passed`: the 1 test this task adds (167 before). If another checkout is using port 3100, run it as `DOCS_E2E_PORT=3506 pnpm --filter @snapshot-ui/docs test:e2e` after checking that port is free.
- Size: `CollapsibleCard` 1.6 kB against its new 2.5 kB limit (1.2 kB before), every other entry as it was, and the React Aria watch-only entry 13.07 kB.
- `pnpm verify` exits 0. Its first line is `check:public: no private names in 326 files` (or the no-file message on a machine without `.local`). Root tests: `tests 20`, `pass 20`. Turborepo reports 18 successful tasks.

- [ ] **Step 6: Visual baselines**

```bash
pnpm --filter @snapshot-ui/storybook visual:docker
git status --short apps/storybook
```

Expected: 5 new files and no changed ones. The one visual story this task adds, as `<id>--light-rounded.png`, `--dark-rounded.png`, `--light-soft.png`, `--light-square.png` and `--light-rounded-375.png`:

  - `components-collapsiblecard--folded-changed--light-rounded.png`
  - `components-collapsiblecard--folded-changed--dark-rounded.png`
  - `components-collapsiblecard--folded-changed--light-soft.png`
  - `components-collapsiblecard--folded-changed--light-square.png`
  - `components-collapsiblecard--folded-changed--light-rounded-375.png`

No baseline from an earlier task changes. `OpensForInvalid` and `CollapsibleCardMirrored` are `no-visual`. An unmarked card draws as it did: the 60 shots of the 12 visual stories `card.css` draws were byte for byte the same before and after, in local Chromium.

What to look at in `components-collapsiblecard--folded-changed`: three folded cards. Profile has a light signal orange dot 8px after its title, level with it, and its chevron, turned toward the title, at the right end of the row. Under it, in a 288px column, a long title wraps over three lines with the dot level with its first line, between the words and the chevron, and the same title with nothing changed has no dot and wraps the same way.

- [ ] **Step 7: Commit**

```bash
git add .changeset/collapsible-card-marker.md apps/docs/content/docs/components/collapsible-card.mdx apps/docs/examples/collapsible-card-changed.tsx apps/docs/examples/index.ts apps/docs/tests/docs.spec.ts docs/design-system.md packages/core/src/components/card.css packages/core/test/contrast.test.js packages/core/test/css.test.js packages/react/.size-limit.json packages/react/src/collapsible-card/CollapsibleCard.stories.tsx packages/react/src/collapsible-card/CollapsibleCard.test.tsx packages/react/src/collapsible-card/CollapsibleCard.tsx packages/react/src/collapsible-card/useFoldedFields.ts packages/react/src/rtl/RightToLeft.stories.tsx packages/react/test/server-render.test.tsx "apps/storybook/tests/visual/__screenshots__/components-collapsiblecard--folded-changed--*.png"
git commit -m "feat: mark a folded card that holds a change, and open it for an invalid field"
```

