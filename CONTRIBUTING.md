# Contributing

Thank you for helping. This guide covers setup, the checks every change passes
and what a finished component looks like.

## Setup

You need Node 24.5 or later and pnpm 10, which corepack provides.

```bash
corepack enable
pnpm install
pnpm --filter @snapshot-ui/storybook exec playwright install chromium webkit firefox
```

The last line installs the browsers the story and end-to-end tests run in:
Chromium for every story, WebKit for the stories tagged `webkit`, the
sheet's, and Firefox for the stories tagged `firefox`.

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds every package and app. |
| `pnpm test` | Unit, behavior, accessibility and Storybook tests. |
| `pnpm lint` / `pnpm typecheck` | ESLint, Stylelint and TypeScript. |
| `pnpm verify` | Everything CI runs except the visual and end-to-end tests. |
| `pnpm turbo run dev --filter=@snapshot-ui/storybook` | The component workshop. |
| `pnpm turbo run dev --filter=@snapshot-ui/docs` | The docs site. |
| `pnpm --filter @snapshot-ui/storybook visual:docker` | Regenerates visual baselines in the CI image. Needs Docker. |

The two dev commands build the packages they depend on first, so they work on a
fresh clone. They do not rebuild those packages while running: after editing
`packages/core` or `packages/react`, run `pnpm build`.

## Design rules

Every visual value traces back to [docs/design-system.md](docs/design-system.md).
Component CSS uses tokens only; Stylelint rejects a literal color, radius or
shadow. A component that does not exist in the design system gets a recorded
derivation in that document before it is built.

## A finished component

1. Its CSS is in `packages/core/src/components/` and imported by `src/styles.css`.
2. Its React component has typed, documented props and exports its parts.
3. Tests cover rendering, every variant, keyboard use, controlled and
   uncontrolled use, form submission for fields, and an axe pass.
4. Stories cover every variant and state, with visual baselines.
5. Its docs page has an example, usage rules, a props table and keyboard notes.
6. A changeset describes it: `pnpm changeset`.

## Commits and pull requests

Commits follow Conventional Commits, such as `feat(react): add Switch`. Every
pull request runs `pnpm verify`, the visual tests and the docs end-to-end tests.

This repository is public. Do not commit names from private projects;
`pnpm check:public` fails if you do.
