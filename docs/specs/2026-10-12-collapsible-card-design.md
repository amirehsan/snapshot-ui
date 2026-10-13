# CollapsibleCard and the phase 1b follow-ups: design

Status: approved in conversation on 2026-10-12, for written review.
Parent spec: `docs/specs/2026-10-10-snapshot-ui-design.md`. This document pulls one phase 2 item forward (section 11, "CollapsibleCard") and records three decisions the owner took on the phase 1b review. The design authority remains `docs/design-system.md`.

## 1. Goal

Add the source app's collapsible card to the library as `CollapsibleCard`, and make three changes the phase 1b review left to the owner. Release all of it as 0.2.0.

Out of scope: the Accordion (the parent spec's "Accordion, new, from CollapsibleCard", on `DisclosureGroup`). It stays in phase 2 and builds on this component later.

## 2. What the source app does

These are the behaviors the library keeps. Section 6.3 of the parent spec already names the first two.

- **Remembering.** A card remembers its fold per browser, keyed by page and title. Copies of one card share a key and fold together.
- **The folded marker.** While folded, a card holding a field with an unsaved change shows a light signal orange dot after its title, so a change is never out of sight. Open, each field shows its own Changed chip instead.
- **The title is the toggle.** The title row is one button, with a chevron at its end. The whole row is the target, brought to 40px with padding that a negative margin gives back, so the header keeps its height.
- **The header stays when folded.** Only the body folds. Whatever the header holds, a status or a Reset button, stays visible and usable.
- **The fold.** The body folds over 200ms. Reduced motion removes the transition.
- **Clipping.** The body clips only while it is folded or folding, so a popup inside an open card is never cut off at its edge.
- **A reveal opens it.** When the app needs to show something inside a folded card, such as a validation jump, the card opens first. A field nobody can see cannot be fixed.

## 3. Approach

`CollapsibleCard` is a separate client component. `Card` stays static, with no directive and no React Aria, so it still renders in a server component.

`CollapsibleCard` draws with the same CSS classes as `Card`, so the two always look alike. It takes the header's parts as props, so the title can become the toggle.

Two approaches were rejected:

- **`<Card collapsible>`.** It would make every card a client module, which would lose the server rendering of the many cards that never fold.
- **Composition from parts** (a toggle and a fold inside `Card`). It would ask every consumer to wire five pieces in order, and a mistake breaks the accessibility wiring.

## 4. API

```ts
'use client';

export interface CollapsibleCardProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /** The title, drawn as the card title. It is the toggle's text and accessible name. */
  title: ReactNode;
  /** The heading level of the title, 1 to 4. Default 2, as CardTitle's. The look does not change. */
  level?: 1 | 2 | 3 | 4;
  /** The line under the title, drawn as a CardNote. It stays visible while folded. */
  note?: ReactNode;
  /** Controls at the end of the header row, such as a Reset button. Never inside the toggle, and still shown while folded. */
  actions?: ReactNode;
  /** Open on the first render when uncontrolled. Default true. */
  defaultExpanded?: boolean;
  /** Controlled open state. */
  isExpanded?: boolean;
  onExpandedChange?: (isExpanded: boolean) => void;
  /** Remembers the fold in the browser under this key. Cards with the same key fold together, across tabs. */
  storageKey?: string;
  /** Shows the folded marker even when no library field inside reports a change. */
  isChanged?: boolean;
  /** The marker's accessible text. Default "Changed". */
  changedLabel?: string;
  as?: 'div' | 'section' | 'article';
  ref?: Ref<HTMLElement>;
  children?: ReactNode;
}
```

- **`className` and `ref`** go on the card root, and `className` merges after the library's classes, as in every component.
- **Uncontrolled by default.** `isExpanded` and `onExpandedChange` make the card controlled. When both `storageKey` and `isExpanded` are given, the controlled value wins and nothing is stored.

## 5. Behavior

### Toggle

- **The trigger.** The title renders as `<hN class="card-title">` holding a `<button>`. It is React Aria's `Button` with `slot="trigger"` inside a `Disclosure`.
- **Inside the button:** the title text and a chevron icon, which is `aria-hidden`. The button carries `aria-expanded` and `aria-controls`, which point at the panel.
- **Keys.** Enter and Space toggle it.
- **Target size.** The target is the full row width and at least 40px tall, with no change to the header's height.

### Folding

- **The header stays.** The title, the note and the actions stay.
- **The body.** It is React Aria's `DisclosurePanel`. It folds with a 200ms ease, and reduced motion removes every transition.
- **Mechanism.** The implementation chooses between the source app's grid-row technique (a row track that transitions between `1fr` and `0fr`) and React Aria's panel-height custom property. The plan prototypes both and records the choice in Appendix B.
- **Folded content.** It leaves the tab order and the accessibility tree. A card that folds while focus is in its body moves the focus to its toggle.
- **Find-in-page.** React Aria renders the folded panel with `hidden="until-found"`, so in a browser that supports it, find-in-page and text fragment links can reveal text inside a folded card. A browser without it hides the folded body with `display: none`, and does not search it. A reveal opens the card with no transition, as the render after hydration does, so the body is its full height when the browser scrolls to the match. Every card that opens in that render, such as one with the same `storageKey`, opens the same way. The card then reports the change through `onExpandedChange` and the stored state.
- **Clipping.** The body clips only while folded or folding, as in the source app.

### Remembering (`storageKey`)

- **Storage format.** One `localStorage` entry, `snapshot-ui:collapsed`, holds the list of folded keys.
- **Shared state.** Cards with the same key share one state through a small store read with `useSyncExternalStore`. The `storage` event keeps other tabs in step.
- **Failure.** Unreadable JSON, private browsing or blocked storage folds nothing, and no error escapes.
- **Server rendering.** The server snapshot is "open", so a remembered-folded card on a server-rendered page renders open, then folds after hydration. The first fold after hydration is drawn without a transition, so it never animates on load. An app that needs the folded state in the very first frame controls the card with `isExpanded` from its own persisted state, for example a cookie. The docs say so.

### The folded marker

- **What it is.** While folded, the card shows a clay dot after the last word of the title when either `isChanged` is true, or any element inside the panel carries `data-changed`. Every library field's root carries `data-changed` while changed. Clay is the color of the Changed chip the dot stands for, and it measures 6.81 in light and 6.82 in dark on the card's lifted ground, over the 3:1 a graphic that carries meaning asks, so the pair is gated.
- **Accessibility.** The trigger is described by a visually hidden text node holding `changedLabel` while the dot shows, so a screen reader reads "Notifications, collapsed, Changed".
- **Detection.** A `MutationObserver` on the panel watches the `data-changed` attribute in its subtree, and only while the card is folded.
- **While open:** no dot and no description. The fields show their own chips.

### Opening on an invalid field

- **The mechanism.** A capture-phase `invalid` listener on the card root opens a folded card. The browser fires `invalid` on each control that fails native validation when a form is submitted, so a folded card holding one opens before the browser focuses that control.
- **Controlled cards.** A controlled card receives the request through `onExpandedChange(true)`, once for every control that fails in one check.
- **Drawn at once.** The open has no transition, as find-in-page's does, and neither has any card that opens with it, such as one with the same `storageKey`. So the body is its full height when the field takes focus, and the browser scrolls the field into view however deep it sits.

## 6. Look and CSS

The CSS lives in `packages/core/src/components/card.css`, which `Card` already uses, inside `@layer components`, with tokens only.

### Root and header

- **Root classes:** `card card-collapsible`.
- **States:** the root carries `data-expanded`, from React Aria, while open, and the stylesheet keys folded styles on `:not([data-expanded])`. While the fold transitions, the root also carries `data-folding`, set and cleared by the component.
- **The header row.** It holds the heading, a block of the title and the note, whose toggle fills the heading's width and puts the chevron at its end, then the actions at the end of the row.
- **Wrapping.** The header is a flex row that wraps, with no size container, so a card placed where it takes its width from its content takes it from the header too, as a plain `Card` does. The heading is `flex: 1 1 12rem`, so it keeps at least 12rem beside the actions, and where the row cannot give it that, the actions wrap under the note. On a narrow screen a long title wraps inside the toggle, and the actions wrap among themselves, with no sideways scroll at 320px. The card's `overflow-wrap: anywhere` already applies. Appendix B records why the first design, a size container with an 18rem query, was replaced.

### Chevron

- **Shape.** A 24px Lucide `ChevronDown`, as the rest of the library uses Lucide.
- **Direction.** Open, it points down. Folded, it turns 90 degrees toward the title: to the inline start, so it mirrors in right to left.
- **Motion.** The same 200ms ease, removed under reduced motion.

### States

- **Focus.** The toggle draws the standard focus ring: `outline: var(--focus-ring-width) solid var(--focus-ring-color)` with the standard offset. It matches `:focus-visible` and `[data-focus-visible]`.
- **Hover** (inside `@media (hover: hover)`): the chevron goes from slate to ink, and the title keeps its color. The cursor is `pointer`.
- **Folded marker.** An 8px clay dot, `--radius-dot`, after the last word of the title, centred on its line.
- **Forced colors.** In a `@media (forced-colors: active)` block, the dot becomes `CanvasText` so it stays visible. The chevron uses `currentColor`, and the focus ring is kept.
- **Spacing.** The space between the header and the body folds with the body, so a folded card ends at its own padding.

### Inherited from `Card`

The 32px padding, the surface, the edge, the stadium corner and the nested corner step (`.card > .card, .card-body .card`) all apply as they are. A `CollapsibleCard` nested in a card steps its corner like any nested card.

## 7. The three decisions

### 7.1 Accessible names are required in the types

Every field's props type requires an accessible name. Code that names nothing no longer compiles.

| Component | One of |
| --- | --- |
| TextField, TextArea, CheckboxGroup, RadioGroup | `label`, `aria-label`, `aria-labelledby` |
| SegmentedControl | `label`, `aria-label`, `aria-labelledby` (already so) |
| Checkbox, Switch, Radio, SegmentedControlItem | `children`, `aria-label`, `aria-labelledby` |
| IconButton | `aria-label`, `aria-labelledby` (already so) |

`SegmentedControlItem` keeps `children` required, because an option's visible content is its name: an option with an `aria-label` and nothing drawn is not supported, and an option that shows only an icon passes the icon as `children` and adds an `aria-label`. This is a deliberate departure from the table above, decided when the plan was written.

- **Type tests.** Each union gets a test with `@ts-expect-error` for the nameless case, as IconButton's has.
- **Docs.** Each page says so in one line.
- **Release.** This is a breaking type change, and ships in 0.2.0. Under 0.x a minor version may break, and the changeset says so.

### 7.2 A standalone Checkbox takes `isChanged` and `changedLabel`

- **Where the chip goes.** As on Switch, the clay Changed chip sits beside the label text, in the row, and is announced through `aria-describedby` while it shows.
- **Precedence.** Invalid outranks changed.
- **Inside a group.** A Checkbox inside a CheckboxGroup ignores `isChanged`, because the group's chip covers the group. Its JSDoc and the docs say so.

### 7.3 Disabled row labels, and where the control sits

- **Dimmed label.** A disabled Checkbox, Radio or Switch draws its label in taupe. The design system reserves taupe for placeholders and disabled text, and WCAG 1.4.3 exempts a disabled control. Checkbox and Radio already do this; Switch changes.
- **First-line alignment.** The box, the radio indicator and the switch track align with the first line of a label that wraps, not with the block's centre. Checkbox already does this; Radio and Switch change if they centre. The control stays beside the words a reader starts with.
- **Baselines.** Disabled and long-label baselines for Switch, and for Radio where it changes, are regenerated in the Docker image and listed in the plan.

## 8. Accessibility

- **Axe.** Axe passes in light and dark for open, folded, folded and changed, with actions, and nested.
- **Keyboard.** Tab reaches the toggle, then the actions. A folded card's body takes no focus.
- **Right to left.** The chevron, the dot and the actions mirror, and nothing clips.
- **Forced colors.** The toggle's text, the chevron, the ring and the dot are all visible.

## 9. Testing

**Unit tests (React).**

- **Folding.** Mouse, Enter and Space toggle the card, `aria-expanded` and `aria-controls` are correct, and folded content leaves the tab order.
- **Actions.** The actions are outside the button: there is no nested interactive element.
- **`storageKey`.**
  - The fold is stored and restored.
  - Two cards with one key stay in step, and the `storage` event syncs other tabs.
  - Unreadable or blocked storage leaves the card open.
  - A controlled card stores nothing.
- **Invalid submit.** A submit with an invalid field inside a folded card opens it.
- **The marker.** It shows and is described only while folded, both from `isChanged` and from a `data-changed` descendant, which the MutationObserver detects.
- **Plumbing.** `className` and `ref` reach the root, and the heading level is honoured.
- **Axe** runs on every state.

**Core CSS tests.**

- Tokens only.
- The focus ring.
- Hover inside `@media (hover: hover)`.
- Reduced motion.
- The forced-colors block.
- The 40px target.
- The folded marker.

**Stories and Docker visual baselines.**

- Open, folded, with actions, folded and changed, nested.
- A long title and a long word at 375px.
- Right to left.
- Keyboard focus.

**Docs e2e.** The new page joins the existing per-page loops:

- axe;
- no sideways scroll;
- the narrow-screen long-address check;
- server rendering of the page.

## 10. Docs and release

- **Docs page.** `apps/docs/content/docs/components/collapsible-card.mdx`, with examples, kept in the rail and examples index alphabetically.
- **Design record.** A new `## CollapsibleCard` section in Appendix B, measured with `contrast.js`: the chevron's slate and ink on the card ground, and the dot on the ground.
- **Changesets.**
  - `collapsible-card.md`: core and react, minor.
  - `field-names.md`: minor, marking the type change.
  - `checkbox-changed.md`: minor.
  - `disabled-labels.md`: minor.
- **Size limit.** `.size-limit.json` gains a CollapsibleCard entry.

## 11. Risks

- **R1: the fold mechanism.** The grid-row fold and React Aria's panel `hidden` attribute may conflict. Mitigation: the plan's first task prototypes both mechanisms against `DisclosurePanel` in Chromium, WebKit and Firefox, and picks one before the component is written.
- **R2: a flash on server-rendered pages.** A remembered fold appears after hydration on a server-rendered page. Mitigation: no transition on that first fold, and the controlled pattern is documented for apps that need the first frame right.
- **R3: the observer's cost.** The MutationObserver on large cards. Mitigation: it observes only the `data-changed` attribute in the panel's subtree, and only while the card is folded.
