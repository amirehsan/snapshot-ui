# CLAUDE.md

Guidance for coding agents working in this repository.

## What this is

Snapshot UI, an open-source React component library (MIT) and its docs site.
The spec is `docs/specs/2026-10-10-snapshot-ui-design.md`; plans are in
`docs/plans/`. The design authority is `docs/design-system.md`. The docs site's
visual reference is `docs/mockups/`.

## Layout

- `packages/core`: tokens (`tokens/tokens.json`), the Tailwind theme and all
  component CSS. No JavaScript at runtime.
- `packages/react`: React Aria wrappers. Never ships CSS.
- `apps/storybook`: the workshop, story tests and visual regression.
- `apps/docs`: the docs site, Next.js on headless Fumadocs, drawn in Snapshot UI.

## Rules that are easy to break

- Every file importing `react-aria-components` starts with `'use client';`.
- Component CSS: `@layer components`, tokens only, unprefixed kebab-case
  classes, states as data attributes that also match the native pseudo-class.
- Weights 400, 450, 500, 700 only. No 600.
- Signal orange is consent only; clay is unsaved; error and success mean
  exactly that. Taupe is only for placeholders and disabled text.
- No em dashes or emojis anywhere. Commit messages never mention Claude Code
  and carry no Co-Authored-By line.
- The repo is public. The private app this was extracted from is never named,
  not even in a test. Its path is in the gitignored `.local/SOURCE.md` and the
  names `pnpm check:public` looks for are in `.local/private-names.txt`.

## Commands

`pnpm verify` before every commit that touches code. Visual baselines only
change through `pnpm --filter @snapshot-ui/storybook visual:docker`.
