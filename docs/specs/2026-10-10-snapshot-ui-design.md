# Snapshot UI: library design

Status: awaiting review
Date: 2026-10-10

## 1. Goal

Snapshot UI is an open-source component library for building dashboards and
apps in the Snapshot design language: a warm cream canvas, one typeface at a
450 body weight, a gapped radius scale, soft atmospheric shadows and colors that
carry meaning.

It is extracted from the Snapshot settings app, which already implements about
45 components by hand in Handlebars, Alpine.js and Tailwind v4. The library
generalizes those components, removes everything tied to the app's CMS, and adds
what a general dashboard or app needs that Snapshot never did.

It ships as npm packages under the `@snapshot-ui` scope, React first, with a
plain HTML version later that shares the same CSS.

Success means:

- A Next.js developer can install two packages, import one stylesheet, and
  build a settings page or dashboard that looks and behaves like Snapshot.
- Every component meets WCAG 2.2 AA and the WAI-ARIA keyboard patterns.
- Every visual value traces back to the design system document. Nothing is
  styled by eye.
- The React and HTML versions cannot drift apart, because they share one CSS
  layer and one token source.

## 2. Decisions already made

| Decision | Choice |
| --- | --- |
| License and visibility | Public, MIT. The owner has the rights to publish. |
| Name | Snapshot UI. npm scope `@snapshot-ui`. Repo `github.com/amirehsan/snapshot-ui`. |
| Scope | Everything a dashboard or app needs, not only what Snapshot uses today. |
| Accessibility foundation | React Aria Components for every interactive React component. |
| Distribution | Compiled npm packages. A copy-paste registry may be added later on top. |
| Repo layout | One pnpm and Turborepo workspace with `packages/` and `apps/`, as in section 4. |
| CSS class prefix | None. Classes read `button`, `field`, `card`. See risk R1. |
| Build order | Seven phases, publishing 0.x from the end of phase 1. |
| Marketing pieces | Parked. Portrait cards, satellite buttons, orbital arcs, the hero frame, the floating nav pill and the footer belong to websites, not apps. |

## 3. Design authority

The design system document is the single authority for every visual decision.
It moves into this repo as `docs/design-system.md`, cleaned of the source
company's, its CMS's and its clients' names. Its content and every measured
value stay unchanged.

The rules that most shape the library, all from that document:

- **Surfaces.** Canvas cream is the page, lifted cream is a card, white is
  reserved for floating surfaces and control fills. Never a pure white page.
- **Type.** Sofia Sans only. Body at weight 450, headings at 500 with -2%
  tracking, uppercase only for the 14px eyebrow with its accent dot.
- **Radius scale.** 6, 20, 24, 40, pill and circle. Nothing between 8 and 16.
- **Nested radii.** Rounded inside rounded takes the next step down: 40 holds
  24, 24 holds 20, 20 holds 6. Pills, circles, floating surfaces and
  text-sized chips take no step.
- **Spacing rhythm.** 8 for parts of one thing, 24 for peers, 32 for separate
  things, 48 for the page margin. 16 is deliberately skipped.
- **Color reservations.** Signal orange is for consent only. Clay means
  unsaved. Error and success mean a failed or successful save. Light signal
  orange is an attention cue. These reservations extend to sample content.
- **Text colors.** If the reader has to read it, it is never taupe. Slate for
  hints and labels, ink for values and titles, taupe only for placeholders and
  disabled text.
- **Elevation.** Four levels, wide spread, low opacity. Borders separate in
  dark mode, where shadows vanish.
- **Focus.** A 2px ink outline at 2px offset, on `:focus-visible` only,
  inverting on ink fills.
- **Touch targets.** Nothing interactive below 40px.

**New components get a recorded derivation.** A component that does not exist
in Snapshot gets a short section appended to `docs/design-system.md` before it
is built. The section states each visual decision and which rule of the
document it derives from, the same way the document's appendix derived the form
controls. Nothing is added to the palette, the type scale or the radius scale
without a measured reason recorded there.

## 4. Repository layout

```
snapshot-ui/
  packages/
    core/        @snapshot-ui/core     tokens, Tailwind theme, all component CSS
    react/       @snapshot-ui/react    React components on React Aria
    editor/      @snapshot-ui/editor   rich text on Tiptap, phase 3
    charts/      @snapshot-ui/charts   charts on Recharts, phase 6
    html/        @snapshot-ui/html     Alpine.js behaviors, phase 7
  apps/
    docs/        public docs site, Next.js with Fumadocs
    storybook/   component workshop, interaction and visual tests
  docs/
    design-system.md
    specs/
    plans/
  .changeset/
  .github/workflows/
```

The two empty folders created earlier, `snapshot-dashboard-next` and
`snapshot-dashboard-html`, become `packages/react` and `packages/html`.

Dependency direction is one way: `react`, `editor`, `charts` and `html` depend
on `core`. `core` depends on nothing at runtime. `editor` and `charts` depend on
`react`.

## 5. Package: @snapshot-ui/core

### 5.1 Tokens

One source file, `packages/core/tokens/tokens.json`, in the W3C Design Tokens
Community Group format, with a light and a dark value for every color and
shadow. Style Dictionary 5 generates from it:

- `dist/tokens.css`: CSS custom properties for light, dark and system modes.
- `dist/tailwind.css`: a Tailwind v4 `@theme` block exposing the tokens as
  utilities, with Tailwind's default radii, numeric text sizes, shadows and
  unused breakpoints cleared to `initial`, exactly as the source app does.
- `dist/tokens.js` and `dist/tokens.d.ts`: a typed object for charts and
  JavaScript consumers.

Token names follow the source app's Tailwind namespaces so the two stay
recognizable. Three renames make the names describe an app library rather than
a marketing page:

| Source name | Library name | Why |
| --- | --- | --- |
| `--radius-consent` 24px | `--radius-surface` | In an app, 24px is the card, popup and field-frame radius. Consent buttons are a rare use. |
| `--text-footer-link` 14/450 | `--text-small` | It is the hint and helper text step. Apps have no footer. |
| `--text-footer-header` 14/700/+4% | `--text-overline` | Uppercase column headers, used by tables and stat tiles. |

Full token set:

- **Colors:** `canvas`, `lifted`, `bone`, `float`, `raised`, `ink`,
  `charcoal`, `slate`, `granite`, `taupe`, `link`, `signal`, `signal-light`,
  `clay`, `error`, `success`, with the dark values from the source's
  `tokens.css` and design document section 7 and appendix.
- **Utility colors:** `scrim` (Deep Well, fixed) with opacity 0.4 light and
  0.65 dark, `hairline` (transparent light, white 12% dark),
  `scrollbar-thumb` and its hover.
- **Type:** `h1`, `h2`, `h3`, `h4`, `eyebrow`, `body`, `action`, `small`,
  `overline`, each with size, line height, tracking and weight.
  `--font-sans` is `"Sofia Sans", Inter, Arial, sans-serif`.
- **Radius:** `micro` 6, `button` 20, `surface` 24, `stadium` 40, `pill` 999.
  Circles use `50%` directly in component CSS.
- **Shadow:** `lift`, `float`, `dramatic`, light and dark values.
- **Spacing:** Tailwind's numeric scale as in the source, plus four semantic
  steps: `--spacing-part` 8px, `--spacing-peer` 24px, `--spacing-separate`
  32px, `--spacing-page` 48px.
- **Breakpoints:** `sm` 768, `md` 1024, `lg` 1440.
- **Focus:** `--focus-ring-width` 2px, `--focus-ring-offset` 2px,
  `--focus-ring-color` ink.

### 5.2 Theme modes

- Light is the default on `:root`.
- `[data-theme="dark"]` on any element switches that subtree to dark.
  `[data-theme="light"]` forces light.
- With no attribute on `html`, dark follows `prefers-color-scheme`.
- This works with `next-themes` configured with `attribute="data-theme"`.

### 5.3 Component CSS

- Written as plain modern CSS with nesting, one file per component in
  `packages/core/src/components/`. No `@apply` and no Tailwind dependency, so
  the same files serve React, plain HTML and non-Tailwind apps.
- Only token variables. A Stylelint rule fails the build on a literal color,
  radius or shadow anywhere outside the token source, which ports the source
  app's style check.
- All component rules live in `@layer components`, tokens in `@layer theme`,
  and the opt-in base styles in `@layer base`. In a Tailwind app, utilities
  override components. In any app, the app's own unlayered CSS wins.
- **Class names.** A component is a kebab-case block class, `select`. A variant
  is the block plus the variant, `button-secondary`. A part is the block plus
  the part, `field-label`. Each component's docs page lists its classes.
- **States are data attributes, never classes.** Selectors match both React
  Aria's attributes and the native pseudo-class, so one rule serves both
  versions. For example: `.button:is(:focus-visible, [data-focus-visible])`.
  The attribute names follow React Aria: `data-hovered`, `data-pressed`,
  `data-focus-visible`, `data-disabled`, `data-selected`, `data-invalid`,
  `data-pending`, `data-open`. The library adds `data-changed` for the
  unsaved-value state.
- Built by Lightning CSS for the same browser floor as Tailwind v4: Safari
  16.4, Chrome 111, Firefox 128.

### 5.4 Entry points

| Import | Contents |
| --- | --- |
| `@snapshot-ui/core/styles.css` | Tokens plus every component. The one-line setup. |
| `@snapshot-ui/core/tokens.css` | Tokens only. |
| `@snapshot-ui/core/base.css` | Opt-in page base: canvas background, font, body text, focus ring. |
| `@snapshot-ui/core/tailwind.css` | The Tailwind v4 theme, for apps that want the tokens as utilities. |
| `@snapshot-ui/core/components/<name>.css` | One component, for apps that care about every byte. |
| `@snapshot-ui/core/tokens` | The typed token object. |

The font is not bundled. The docs show how to load Sofia Sans as a variable
font, with `next/font/google` in Next.js and a Google Fonts link elsewhere. The
450 weight requires the variable build.

## 6. Package: @snapshot-ui/react

### 6.1 Platform

- React 19 and later as a peer dependency. `ref` is a regular prop; no
  `forwardRef`.
- `react-aria-components` and `lucide-react` as dependencies. Internal icons,
  such as chevrons, checks and close marks, come from Lucide, which matches the
  source app's hand-drawn 24px, round-cap stroke icons.
- ES modules only, built by tsdown with modules preserved, so each file keeps
  its own `"use client"` directive and every component tree-shakes.
  `sideEffects: false`.
- Interactive components carry `"use client"`. Static ones, such as `Card`,
  `Badge`, `Heading`, `Kbd` and `EmptyState`, stay server components.
- Strict TypeScript. The repo uses TypeScript 7 if tsdown's declaration build
  and Storybook's docgen both support it when phase 1 starts, and otherwise
  pins the latest 5.x until they do.

### 6.2 Component API conventions

- **Props follow React Aria's names** everywhere, so the library reads as one
  vocabulary: `isDisabled`, `isInvalid`, `isRequired`, `onChange`,
  `onSelectionChange`, `selectedKey`, `defaultValue`.
- **Every value works controlled and uncontrolled.**
- **Fields have a one-line form.** `<TextField label description
  errorMessage />` renders the label, the control, the hint and the error.
  The parts (`Label`, `Description`, `FieldError`, `Input`) are exported for
  custom layouts.
- **Collections take children or items.** `<Select items={...}>` with a render
  function, or `<SelectItem>` children.
- **`className`** accepts a string or React Aria's render function, and is
  merged after the library's own classes.
- **Native forms work.** Every field takes `name` and submits with a plain
  `<form>`, Next.js server actions and React Hook Form's controller.
- **Strings are overridable.** Built-in text such as "Changed", "Remove" or
  "Clear" has an English default and a prop to replace it. Dates, times and
  numbers are locale-aware through React Aria's `I18nProvider`, which also
  enables right-to-left layouts.

### 6.3 Behaviors carried over from the source

These are deliberate UX decisions in the source app and are kept:

- A select shows a filter field once it has more than 8 options.
- A segmented control stacks one option per row when its row does not fit.
- A collapsible card can remember its folded state per key, and shows a changed
  marker while folded.
- A length counter shows the count and never blocks typing.
- Toasts stay 6 seconds, or 12 for errors, and errors use `role="alert"`.
- A tooltip opens after 400ms on hover and at once on focus, and for 300ms
  after one closes the next opens without delay.
- Conditional fields are made `inert` when hidden, never cleared or disabled.
- Drag-and-drop lists also work by keyboard pick-up and arrow keys, with live
  region announcements.

## 7. Other packages

Each of these gets its own spec and plan when its phase starts. What is fixed
now:

- **@snapshot-ui/editor:** rich text on Tiptap, which is MIT. It replaces the
  source app's CKEditor, whose GPL or commercial license would bind every user
  of an MIT library. It keeps the source's toolbar set, its source-code toggle
  with syntax highlighting, and its fallback to a plain textarea.
- **@snapshot-ui/charts:** line, bar, area and donut charts on Recharts. It
  needs a categorical chart palette, which the design system lacks, derived and
  measured for contrast in both themes before any chart is built.
- **@snapshot-ui/html:** the source app's Alpine.js behaviors, generalized and
  shipped as an Alpine plugin, plus copy-paste HTML for every component on the
  docs site. It uses `@snapshot-ui/core` unchanged.

## 8. Apps

- **apps/docs:** the public docs site, Next.js 16 with Fumadocs. Getting
  started, theming, dark mode, the design principles, and one page per
  component with a live example, the code, usage guidance with the design
  rules that apply, a props table generated from the types, a keyboard table
  and accessibility notes. Deployed to Vercel.
- **apps/storybook:** Storybook 10 with the accessibility and Vitest addons. A
  story for every variant and state, shown in light and dark. It is the
  workshop during development and the target for interaction and visual tests.

## 9. Quality gates

Every pull request runs, in CI and through `pnpm` scripts locally:

| Gate | Tool |
| --- | --- |
| Lint | ESLint with typescript-eslint, react-hooks and jsx-a11y. Stylelint for CSS. Prettier. |
| Types | `tsc --noEmit` across the workspace. |
| Unit and behavior tests | Vitest with Testing Library and user-event. |
| Automated accessibility | axe-core run inside every component test, failing on any violation. |
| Contrast | The source app's contrast check, ported to read `tokens.json` and assert every documented pairing in both themes. |
| Interaction tests | Storybook stories run through Vitest. |
| Visual regression | Playwright screenshots of every story in light and dark, compared to committed baselines. |
| Package correctness | publint and Are the Types Wrong on every built package. |
| Size budget | size-limit, with a budget per component entry. |

### Definition of done for a component

1. Its CSS is in `packages/core/src/components/` and uses only tokens.
2. Its React component has typed, documented props and exports its parts.
3. Tests cover rendering, every variant, keyboard use, controlled and
   uncontrolled use, form submission for fields, and an axe pass.
4. Stories cover every variant and state, with visual baselines in both themes.
5. Its docs page is complete as described in section 8.
6. If it is new, its derivation is recorded in `docs/design-system.md` first.
7. A changeset describes it.

## 10. Releases

- Changesets manages versions and changelogs. `core` and `react` are released
  as a fixed group so their versions always match. `editor`, `charts` and
  `html` join the group when they ship.
- Versions stay at 0.x until the end of phase 5, then 1.0.
- GitHub Actions runs every gate on each pull request. On merge to `main`, the
  Changesets action opens a release pull request, and merging it publishes to
  npm through trusted publishing with provenance. No npm token is stored in
  the repo.
- The repo ships `LICENSE` (MIT), `README.md`, `CONTRIBUTING.md`,
  `SECURITY.md`, `CODE_OF_CONDUCT.md`, issue and pull request templates, and a
  `CLAUDE.md` with these conventions.

**Owner actions needed before the first publish:**

1. Create the free npm organization `snapshot-ui`.
2. Add the GitHub repo as a trusted publisher for each package on npm.
3. Create a Vercel project for `apps/docs`, at any point before the docs go
   public.

## 11. Catalog and phases

Source paths are relative to the source app; `.local/SOURCE.md` says where it
is. "New" means the component does not exist in the source and needs a
recorded derivation first.

### Phase 1: Foundation and form basics

Also in this phase: the workspace, the token pipeline, every CSS entry point,
the quality gates, Storybook, the docs site skeleton with its getting-started
pages, the release pipeline, the repo files, and the cleaned
`docs/design-system.md`.

| Component | Source | React Aria basis | Notes |
| --- | --- | --- | --- |
| Button | `styles/primitives/button.css`, danger in `dialog.css` | Button | Primary, secondary, tertiary, danger. Pending state shows a spinner. One size, as in the source: 40px minimum height, 6px by 24px padding, 20px radius. |
| IconButton | rail and dialog close buttons in `styles/shell/sidebar.css` | Button | 40px circle. Requires an accessible label. |
| Link | `--color-link` | Link | Inline link. |
| Label, Description, FieldError | `styles/primitives/field.css` | Label, Text, FieldError | Label 14/700, hint 14/450 slate. |
| FieldCounter | `js/length.js` | none | Shows count against a budget, never blocks. |
| Changed state | `data-dirty` in `field.css` | none | `isChanged` gives a light signal orange border and a clay "Changed" chip. |
| TextField | `.ry-input` in `field.css` | TextField, Input | 48px pill. |
| TextArea | `.ry-panels-components-area` in `styles/panels/components.css` | TextField, TextArea | `--radius-surface` 24px, 6rem minimum height, vertical resize only. |
| Checkbox, CheckboxGroup | `.ry-choice` in `styles/primitives/control.css` | Checkbox, CheckboxGroup | 6px box. |
| RadioGroup | `control.css`, `partials/shell/account.hbs` | RadioGroup | Full-pill rows. Selected is the ink pill plus a check glyph. |
| Switch | `js/switch-input.js`, `control.css` | Switch | |
| SegmentedControl | `js/segmented.js` | RadioGroup | Stacks when the row does not fit. |
| Card | `.ry-panel-section` in `styles/primitives/panel.css` | none, static | Header, title, note, body. Lifted, 40px, 32px padding. |
| Heading, Text, Eyebrow | `styles/tokens.css` type tokens | Heading | Eyebrow dot hangs into the gutter. |
| Kbd | search key in `styles/shell/search.css` | none, static | 6px. |
| Badge | new | none, static | 6px per the nested-radius rule. Tones neutral, info, success, error. Never clay or signal. |
| Spinner | new | ProgressBar, indeterminate | Loading state is unspecified in the document; derive it. Honors reduced motion. |

### Phase 2: Choice controls and overlays

| Component | Source | React Aria basis | Notes |
| --- | --- | --- | --- |
| Select | `js/select.js`, `control.css` | Select, ListBox, Popover | Filter past 8 options. Option hints. |
| ComboBox | `js/search-ui.js` | ComboBox | |
| MultiSelect | token demo in `partials/panels/components.hbs` | ComboBox, TagGroup | |
| TagInput | `js/value-list.js` | TagGroup, TextField | Paste splits a list. Backspace takes the last tag back. Presets for emails, domains and paths. |
| ChoiceCards | `js/choice-cards.js` | RadioGroup | Icon and picture variants. |
| PositionPad | `js/position-pad.js` | RadioGroup | 3x3 grid with two-dimensional arrow keys. |
| Tabs | `js/tabs.js`, `styles/primitives/tabs.css` | Tabs | Optional changed dot per tab. |
| Pagination | `js/pager.js`, `styles/primitives/pager.css` | Button | Range text in a polite live region. |
| Dialog | `js/dialog.js`, `dialog.css` | Modal, Dialog | Danger variant with an icon. |
| ConfirmDialog | `js/confirm.js` | Modal, Dialog as alertdialog | |
| Toast | `js/toast.js`, `styles/shell/toast.css` | Toast | Success, info, error. |
| Tooltip | `js/rail-tip.js` | TooltipTrigger, Tooltip | Delays as in section 6.3. |
| Menu | `styles/primitives/menu.css`, `partials/shell/account.hbs` | MenuTrigger, Menu, Popover | Hairline visible in both themes. |
| Popover | menu popup in `menu.css` | Popover | |
| Drawer | mobile drawer and scrim in `styles/shell/sidebar.css` | Modal | Deep Well scrim. |
| CollapsibleCard | `js/collapse.js` | Disclosure | Remembers its fold per key. |
| Accordion | new, from CollapsibleCard | DisclosureGroup | |
| CommandPalette | `partials/shell/search.hbs`, `js/search-ui.js`, `js/search-recent.js` | Autocomplete, Menu, Modal | Cmd or Ctrl+K. Recent items. The app supplies the index. |

### Phase 3: Specialised inputs

| Component | Source | React Aria basis | Notes |
| --- | --- | --- | --- |
| NumberField | number input in `field.css` | NumberField | |
| SearchField | search input in `styles/shell/search.css` | SearchField | |
| DatePicker, DateTimePicker, Calendar | `js/date-picker.js`, `styles/primitives/date-picker.css` | DatePicker, DateField, Calendar | Replaces the source's third-party calendar. |
| DateRangePicker | new, from DatePicker | DateRangePicker, RangeCalendar | |
| TimeField | `js/time-input.js` | TimeField, Popover | Steps of 1, 5, 10, 15, 20 or 30 minutes. 12 or 24 hour. Typed boxes and sliders. |
| TimeRangeField | `js/hours-input.js` | two TimeFields | An empty range means closed. |
| PhoneField | `js/phone-input.js` | TextField | Pattern-based mask. Ships the North American pattern; others by prop. |
| ColorField | `js/color-input.js` | ColorField, ColorSwatch, ColorPicker | Swatch plus hex box. Contrast preview chip. |
| IconPicker | `js/icon-picker.js` | ComboBox, ListBox | The app passes in any icon set. Stale-value state for unknown names. |
| MediaInput | `js/media-input.js` | DropZone, FileTrigger | Image or file mode, fit or fill. An adapter prop plugs in an external file picker. |
| Slider | new | Slider | |
| FileDropZone | new, from MediaInput | DropZone, FileTrigger | |
| RichTextEditor | `js/richtext.js`, `js/code-highlight.js`, `styles/primitives/code.css` | none, Tiptap | Ships as `@snapshot-ui/editor`. |

### Phase 4: Lists and data

| Component | Source | React Aria basis | Notes |
| --- | --- | --- | --- |
| ReorderList | `js/order-list.js` | GridList, drag and drop | Up and down buttons plus drag. |
| SortableList | `js/section-list.js`, `js/section-list-model.js`, `styles/primitives/section-list.css` | GridList, drag and drop | A switch per row. Locked rows. |
| TreeBuilder | `js/menu-builder.js`, `src/shared/menu.js`, `styles/primitives/menu.css` | Tree, drag and drop | Depth limit by prop. An item editor slot. |
| MasterDetailList | `js/slot-switcher.js`, `styles/primitives/slots.css` | GridList | Add shows "n of N". Remove confirms. Locked items. Filter past 8. |
| TransferList | `js/dataset-picker.js`, `js/dataset-picker-model.js`, `styles/primitives/dataset.css` | ListBox, SearchField | Search, chosen rows, pager, limit. |
| Repeater | `js/special-hours.js` | GridList | Rows of app-defined fields, added and removed. |
| DataTable | new | Table | Sorting, selection, column resizing. Needs the dense-data companion spec the document says is missing. |
| EmptyState | `.ry-placeholder` in `panel.css` | none, static | |
| StatTile | `styles/panels/overview.css` | none, static | |
| Avatar, AvatarGroup | slot avatars in `slots.css` | none, static | Circle. |
| Skeleton | new | none, static | Loading state is unspecified; derive it. |
| ProgressBar, Meter | new | ProgressBar, Meter | |
| DescriptionList | new | none, static | |

### Phase 5: App shell and page layouts

| Component | Source | React Aria basis | Notes |
| --- | --- | --- | --- |
| AppShell | `partials/layouts/snapshot.hbs`, `styles/shell/` | none | Composes the parts below. |
| Sidebar | `partials/shell/sidebar.hbs`, `styles/shell/sidebar.css`, `js/nav-state.js`, `js/nav-groups.js` | Disclosure, Link | Groups, icon-only collapse at 104px that is remembered, drawer below 1024px. |
| PageHeader, Breadcrumbs | `partials/shell/header.hbs`, `styles/shell/header.css` | Breadcrumbs | |
| SaveBar | `partials/shell/save-bar.hbs`, `styles/shell/save-bar.css` | none | Status in a live region. Discard confirms. |
| AccountMenu, ThemeSwitch | `partials/shell/account.hbs`, `js/theme.js` | Menu, RadioGroup | Light, dark and system. |
| PanelLayout | `styles/primitives/panel.css`, `styles/panels/index.css` | none, static | Side and main columns. Full, half, third and two-thirds cards that only ever pair. |
| ConditionalFields | `js/gate.js` | none | Hidden fields become inert. |
| Preview | `styles/primitives/preview.css`, `js/font-preview.js` | none | |
| Field extras | `.ry-field-offer` in `field.css`, `js/blueprint-status.js` | none | Reset to default and suggested value, generalized from the source. |
| Page templates | new | none | Settings page, list page and detail page, built only from library components. |

### Phase 6: Charts

`@snapshot-ui/charts`: line, bar, area and donut, plus the chart palette
derivation. Specified in its own document.

### Phase 7: HTML version

`@snapshot-ui/html`: the Alpine plugin and copy-paste HTML for every component
from phases 1 to 5. Specified in its own document.

## 12. Out of scope

- The source app's CMS integration: the custom field bridge, preset galleries
  and their status, the CMS file picker, dataset sources, the save transport
  and the CMS-specific validators.
- The marketing pieces listed in section 2.
- A copy-paste registry. It can be added after 1.0 without changing the
  packages.
- Framework packages other than React and plain HTML.

## 13. Risks

| | Risk | Mitigation |
| --- | --- | --- |
| R1 | Unprefixed classes such as `card` or `button` can collide with an app's own CSS. | Components sit in `@layer components`, so an app's unlayered CSS wins. The docs say so on the getting-started page. A prefixed build can be generated later if collisions are reported. |
| R2 | React Aria's defaults differ from some of the source's hand-built behaviors, such as the time field's sliders. | Compose custom parts over React Aria's hooks where its components do not match, and keep the behaviors in section 6.3 under test. |
| R3 | The 450 weight disappears if an app loads static font files. | The docs require the variable font and document the source's fallback: weight 400 with slightly tighter tracking. |
| R4 | The public repo could leak the source company's or its clients' names. | The design document is cleaned before its first commit. The source path lives only in the gitignored `.local/SOURCE.md`. |
| R5 | TypeScript 7 is new and some tooling may lag. | The version rule in section 6.1. |
| R6 | Dense data, loading and empty states have no specification in the document. | Each gets a recorded derivation before it is built, per section 3. |
