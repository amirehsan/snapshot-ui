# Phase 1a: Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the Snapshot UI monorepo end to end: tokens with both theme axes, the shared CSS layer, the React package with Spinner and Button as the first complete slice, Storybook with visual regression, the docs site drawn in Snapshot UI, and the CI and release pipeline, so phase 1b only adds components.

**Architecture:** A pnpm and Turborepo workspace. `@snapshot-ui/core` turns one W3C design token file into CSS variables, a Tailwind v4 theme and a typed object, and ships plain layered component CSS built by Lightning CSS. `@snapshot-ui/react` wraps React Aria Components, adds the core class names, and builds to unbundled ESM with `"use client"` kept per file. Storybook and a headless-Fumadocs Next.js docs site consume both packages from the workspace.

**Tech Stack:** pnpm 10.10, Turborepo 2.11, Node 24, TypeScript 7 (`tsc`) beside the TypeScript 6 API, Style Dictionary 5.6, Lightning CSS 1.33, Stylelint 17, Tailwind CSS 4.3, React 19.3, react-aria-components 1.22, tsdown 0.23, Vitest 5 with jsdom 30, Testing Library, axe-core 4.14, Storybook 10.6, Playwright 1.64, Next.js 16.4, fumadocs-core 16.17, fumadocs-mdx 15.4, fumadocs-typescript 5.5, next-themes 0.4, ESLint 10, Prettier 3.9, Changesets 3.0, size-limit 14.

**Spec:** `docs/specs/2026-10-10-snapshot-ui-design.md`. The docs site reference is `docs/mockups/` (`home.html`, `component.html`, `mockup.css`).

**Scope:** phase 1a. It covers the foundation plus Button and Spinner as the first complete slice. Phase 1b, the remaining form components from the spec's phase 1 table, gets its own plan once this one lands, so it is written against conventions proven in the real repository.

**Source app:** the private app this library is extracted from. Its absolute path is in `.local/SOURCE.md` (gitignored). Paths such as `src/snapshot/styles/primitives/button.css` below are relative to it. Read it; never copy its name into a committed file.

## Global Constraints

- Node `>=24`, `"packageManager": "pnpm@10.10.0"`, every package `"type": "module"`, ESM only.
- React and React DOM are peers at `^19.0.0`. `react-aria-components` `^1.22.1` and `lucide-react` `^1.55.0` are dependencies of `@snapshot-ui/react`.
- TypeScript runs side by side through the pnpm catalog: `typescript` is `npm:@typescript/typescript6@^6.0.2` (the API that typescript-eslint and tooling import), `@typescript/native` is `npm:typescript@^7.0.2` (the `tsc` command).
- Every source file that imports `react-aria-components` starts with `'use client';`. The React build fails if an emitted file loses it.
- Component CSS lives in `packages/core/src/components/<name>.css`, inside `@layer components`, and uses only tokens. No literal color, radius or shadow anywhere outside `tokens/tokens.json` (Stylelint rule `snapshot-ui/token-only`).
- Class names are unprefixed kebab-case: block `button`, variant `button-secondary`, part `button-label`. No class starts with a Tailwind utility namespace (`text-`, `bg-`, `border-`, `rounded-`, `shadow-`, `font-`, `p-`, `m-`, `w-`, `h-` and the rest listed in Task 5).
- States are data attributes with React Aria's names, and every state selector also matches the native pseudo-class, so one stylesheet serves React and plain HTML: `.button:is(:focus-visible, [data-focus-visible])`. Hover rules sit inside `@media (hover: hover)`.
- Focus ring: `outline: var(--focus-ring-width) solid var(--color-ink); outline-offset: var(--focus-ring-offset);`. An inset ring on an ink fill uses `var(--color-canvas)`.
- Cascade layers: tokens in `@layer theme`, `base.css` in `@layer base`, components in `@layer components`.
- Theme axes: `data-theme="light" | "dark"` (no attribute follows the system), `data-shape="rounded" | "soft" | "square"` matched case-insensitively. Both work on any element.
- Typography: weights 400, 450, 500 and 700 only. 14px minimum for sentences, 12px minimum for short uppercase labels.
- Responsive: everything works from 320px wide with no sideways scrolling, and every touch target is at least 40px.
- Reserved colors: signal orange is consent only, clay is unsaved, error is failure or invalid, success is success. None of them is ever decoration, including in sample content. Taupe is only for placeholders and disabled text.
- The repo is public: never commit the source company's name, its CMS's name or client names, not even inside a test or a script. `pnpm check:public` enforces this from patterns that live only in the gitignored `.local/private-names.txt` and in CI's `PRIVATE_NAMES` secret.
- No em dashes and no emojis in code, docs or commit messages. Commit messages never mention Claude Code and never carry a Co-Authored-By line.
- Commit messages follow Conventional Commits, for example `feat(core): add the token pipeline`.
- Run `pnpm format` before every commit. CI fails on unformatted code.
- Visual baselines are generated only inside `mcr.microsoft.com/playwright:v1.64.0-noble`, the image CI compares in.

## Review Focus

The inputs and conditions the spec implies that a person will hit first, and the test that pins each:

1. **A light subtree inside a dark page, or a rounded one inside a soft page.** Text and every token must take the nested values. Pinned by Task 3 (the generated theme blocks reset `color`) and by the cascade test in Task 10.
2. **A consumer imports `@snapshot-ui/core/styles.css` before `tailwindcss`, or after it.** The Tailwind theme must not create a variable cycle in either order. Pinned by Task 3's Tailwind compile test, which builds both orders.
3. **A Next.js server component or MDX page imports a library component.** A missing `"use client"` breaks the consumer's build. Pinned by Task 6's `check-use-client` script and by Task 11's `next build` of a server MDX page that imports `Button`.
4. **A pending submit button inside a form.** Pressing it or pressing Enter must not submit while it is pending. Pinned in Task 8.
5. **A 375px phone or a 768px tablet.** No page may scroll sideways, and the rail must turn into a drawer. Pinned by Task 12's end-to-end test at four widths and the 375px visual baseline in Task 10.

## File Structure

```
snapshot-ui/
  package.json  pnpm-workspace.yaml  turbo.json  tsconfig.base.json  eslint.config.js
  .prettierrc.json  .prettierignore  .editorconfig  .nvmrc  .gitignore
  LICENSE  README.md  CONTRIBUTING.md  SECURITY.md  CODE_OF_CONDUCT.md  CLAUDE.md
  scripts/check-public.js  scripts/check-public.test.js
  .changeset/config.json  .changeset/README.md
  .github/workflows/ci.yml  .github/workflows/release.yml
  .github/ISSUE_TEMPLATE/bug_report.yml  feature_request.yml  config.yml
  .github/pull_request_template.md
  docs/design-system.md                 the cleaned public design system
  packages/core/
    package.json  tsconfig.json  vitest.config.js  stylelint.config.js
    tokens/tokens.json                  the one token source
    scripts/build-tokens.js             Style Dictionary: tokens.css, tailwind.css, tokens.js, tokens.d.ts
    scripts/build-css.js                Lightning CSS: styles.css, base.css, components/*.css, css.d.ts
    scripts/contrast.js  scripts/check-contrast.js
    stylelint/token-only.js
    src/styles.css  src/base.css  src/components/spinner.css  src/components/button.css
    test/tokens.test.js  test/tailwind.test.js  test/contrast.test.js  test/token-only.test.js  test/css.test.js
  packages/react/
    package.json  tsconfig.json  tsconfig.build.json  tsdown.config.ts  vitest.config.ts  .size-limit.json
    scripts/check-use-client.js
    test/setup.ts  test/a11y.ts  test/a11y.test.tsx
    src/index.ts  src/utils/cx.ts  src/utils/cx.test.ts
    src/spinner/{Spinner.tsx,Spinner.test.tsx,Spinner.stories.tsx,index.ts}
    src/button/{Button.tsx,Button.test.tsx,Button.stories.tsx,index.ts}
  packages/html/README.md               reserved for phase 7
  apps/storybook/
    package.json  tsconfig.json  vitest.config.ts  playwright.config.ts
    .storybook/main.ts  .storybook/preview.tsx
    tests/visual/stories.spec.ts  tests/visual/cascade.spec.ts  tests/visual/__screenshots__/
    scripts/visual-docker.sh
  apps/docs/
    package.json  next.config.mjs  tsconfig.json  playwright.config.ts
    lib/source.ts  lib/prepaint.ts  lib/document-state.ts  lib/props.ts
    app/layout.tsx  app/site.css  app/api/search/route.ts
    app/(home)/page.tsx  app/(home)/home-page.tsx  app/(home)/home.css
    app/docs/layout.tsx  app/docs/[[...slug]]/page.tsx
    components/shell/{context,docs-shell,rail,header,toc,search}.tsx  components/shell/shell.css
    components/mdx/{index,section,code,copy-button,preview,preview-tabs,props-table,keys,rules}.tsx
    examples/{index.ts,button-variants.tsx,button-states.tsx,spinner-sizes.tsx,theme-shapes.tsx}
    content/docs/{meta.json,index,installation,theming,design-principles}.mdx
    content/docs/components/{meta.json,button.mdx,spinner.mdx}
    tests/docs.spec.ts  tests/home.spec.ts
```

Each package keeps one responsibility: `core` never imports React, `react` never ships CSS, and the apps own nothing the packages need.

---

### Task 1: Workspace, public-name check and repository files

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `turbo.json`, `tsconfig.base.json`, `eslint.config.js`, `.prettierrc.json`, `.prettierignore`, `.editorconfig`, `.nvmrc`
- Create: `scripts/check-public.js`, `scripts/check-public.test.js`
- Create: `LICENSE`, `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `CLAUDE.md`
- Create: `.github/ISSUE_TEMPLATE/bug_report.yml`, `.github/ISSUE_TEMPLATE/feature_request.yml`, `.github/ISSUE_TEMPLATE/config.yml`, `.github/pull_request_template.md`
- Create: `packages/html/README.md`
- Modify: `.gitignore`
- Move: `snapshot-dashboard-next/` to `packages/react/`, `snapshot-dashboard-html/` to `packages/html/` (both are empty folders the owner created)

**Interfaces:**
- Produces: root scripts `build`, `test`, `test:root`, `lint`, `typecheck`, `test:visual`, `size`, `check:package`, `check:public`, `format`, `format:check`, `verify`, `changeset`. Later tasks add packages that Turborepo picks up through these.
- Produces, from `scripts/check-public.js`:
  - `parseRules(text: string): Array<{ rule: string; pattern: RegExp }>`
  - `loadRules(file?: string, env?: string)`
  - `findViolations(path: string, text: string, rules): Array<{ path: string; line: number; rule: string }>`
- The private names are never in the repository. They live in `.local/private-names.txt`, which is gitignored and was written on the owner's machine during planning, and in CI's `PRIVATE_NAMES` secret.

- [ ] **Step 1: Write the failing test for the public-name check**

Check that `.local/private-names.txt` exists before starting (`test -f .local/private-names.txt`). It holds the private patterns, one `/source/flags` per line. The tests below use stand-in names, so the real list never appears in a committed file.

Create `scripts/check-public.test.js`:

```js
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { findViolations, loadRules, parseRules } from './check-public.js';

// Stand-in names: the real list never enters the repository.
const RULES_TEXT = [
  '# stand-ins for the private names',
  '/\\bacme\\b/i',
  '/(?<!Dark )\\bGlobex\\b(?! [Cc]ream)/',
].join('\n');

test('parses /source/flags lines and skips comments', () => {
  const rules = parseRules(RULES_TEXT);
  assert.equal(rules.length, 2);
  assert.equal(rules[0].pattern.flags, 'i');
  assert.throws(() => parseRules('not a regex'), /not \/source\/flags/);
});

test('finds a private name and reports only where it is', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('docs/a.md', 'fine\nBuilt for ACME.', rules), [
    { path: 'docs/a.md', line: 2, rule: 'private name 1' },
  ]);
});

test('respects the exceptions a pattern spells out', () => {
  const rules = parseRules(RULES_TEXT);
  assert.deepEqual(findViolations('a.md', 'Globex Cream and Dark Globex', rules), []);
  assert.equal(findViolations('a.md', 'saved in Globex first', rules).length, 1);
});

test('loads rules from the local file first, then the environment, else nothing', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'check-public-'));
  const file = path.join(dir, 'names.txt');
  writeFileSync(file, '/\\bacme\\b/i\n');
  assert.equal(loadRules(file, '/\\bother\\b/')?.length, 1);
  assert.equal(loadRules(path.join(dir, 'missing.txt'), '/\\bother\\b/\n/x/')?.length, 2);
  assert.equal(loadRules(path.join(dir, 'missing.txt'), undefined), null);
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test scripts/check-public.test.js`
Expected: FAIL with `Cannot find module` for `./check-public.js`.

- [ ] **Step 3: Write the check**

Create `scripts/check-public.js`:

```js
// The repository is public, and this library was extracted from a private app.
// No name from that app may reach a committed file. The names are private too,
// so they are never in this repository: they come from .local/private-names.txt
// (gitignored) on a maintainer's machine, or from the PRIVATE_NAMES secret in
// CI. One regular expression per line, written as /source/flags; lines starting
// with # are comments. A failure reports the file and line only, never the
// match, because CI logs are public.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const LOCAL_FILE = '.local/private-names.txt';

/** Binaries and the lockfile hold no prose. */
const SKIP = [/\.(png|jpe?g|gif|webp|ico|woff2?|pdf)$/i, /^pnpm-lock\.yaml$/];

/** Parses `/source/flags` lines into rules. */
export function parseRules(text) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line, index) => {
      const match = /^\/(.+)\/([a-z]*)$/.exec(line);
      if (!match) throw new Error(`Line ${String(index + 1)} is not /source/flags`);
      return { rule: `private name ${String(index + 1)}`, pattern: new RegExp(match[1], match[2]) };
    });
}

/** The private rules from the local file, else from `env`, else null. */
export function loadRules(file = LOCAL_FILE, env = process.env.PRIVATE_NAMES) {
  if (existsSync(file)) return parseRules(readFileSync(file, 'utf8'));
  if (env) return parseRules(env);
  return null;
}

/** Every rule a file breaks, one entry per matching line. */
export function findViolations(path, text, rules) {
  const found = [];
  text.split('\n').forEach((line, index) => {
    for (const { rule, pattern } of rules) {
      if (pattern.test(line)) found.push({ path, line: index + 1, rule });
    }
  });
  return found;
}

/** Tracked files plus new files git would add, so a check before commit sees them. */
function candidateFiles() {
  const out = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { encoding: 'utf8' });
  return out.split('\n').filter((path) => path && !SKIP.some((skip) => skip.test(path)));
}

if (import.meta.main) {
  const rules = loadRules();
  if (!rules) {
    // A fork's pull request has no access to the secret; say so rather than fail it.
    const notice = process.env.CI ? '::warning::check:public skipped, PRIVATE_NAMES is not available' : '';
    console.warn(notice || `check:public: no ${LOCAL_FILE} on this machine, nothing to check against`);
    process.exit(0);
  }
  const violations = candidateFiles().flatMap((path) => {
    try {
      return findViolations(path, readFileSync(path, 'utf8'), rules);
    } catch {
      return [];
    }
  });
  for (const v of violations) console.error(`${v.path}:${String(v.line)} matches ${v.rule}`);
  if (violations.length > 0) process.exit(1);
  console.log(`check:public: no private names in ${String(candidateFiles().length)} files`);
}
```

- [ ] **Step 4: Run the test again**

Run: `node --test scripts/check-public.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 5: Create the workspace configuration**

`package.json`:

```json
{
  "name": "snapshot-ui-monorepo",
  "private": true,
  "type": "module",
  "packageManager": "pnpm@10.10.0",
  "engines": {
    "node": ">=24"
  },
  "scripts": {
    "build": "turbo run build",
    "test": "turbo run test",
    "test:root": "node --test scripts/*.test.js",
    "lint": "turbo run lint && eslint scripts",
    "typecheck": "turbo run typecheck",
    "test:visual": "turbo run test:visual",
    "size": "turbo run size",
    "check:package": "turbo run check:package",
    "check:public": "node scripts/check-public.js",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "verify": "pnpm check:public && pnpm test:root && pnpm format:check && turbo run lint typecheck build test check:package size",
    "changeset": "changeset"
  },
  "devDependencies": {
    "@changesets/cli": "3.0.3",
    "@eslint/js": "10.0.1",
    "@types/node": "24.19.2",
    "@typescript/native": "catalog:",
    "eslint": "10.12.0",
    "eslint-config-prettier": "10.1.8",
    "eslint-plugin-jsx-a11y": "6.10.2",
    "eslint-plugin-react-hooks": "7.1.1",
    "globals": "17.13.0",
    "prettier": "3.9.10",
    "turbo": "2.11.7",
    "typescript": "catalog:",
    "typescript-eslint": "8.71.1"
  }
}
```

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"

# TypeScript 7 is native and has no JavaScript API yet. typescript-eslint and
# other tools import `typescript` and need the 6.0 API, so the two run side by
# side, as the TypeScript 7.0 release notes recommend: `tsc` comes from
# @typescript/native, the API from the `typescript` name.
catalog:
  "@typescript/native": "npm:typescript@^7.0.2"
  typescript: "npm:@typescript/typescript6@^6.0.2"

# pnpm 10 blocks dependency install scripts unless they are listed.
onlyBuiltDependencies:
  - esbuild
  - "@parcel/watcher"
  - sharp
```

`turbo.json`:

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "globalPassThroughEnv": ["CI", "PLAYWRIGHT_BROWSERS_PATH"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "storybook-static/**", ".next/**", "!.next/cache/**"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "lint": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "test:visual": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "size": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "check:package": {
      "dependsOn": ["build"],
      "outputs": []
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

`tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "moduleDetection": "force",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "types": []
  }
}
```

`eslint.config.js`:

```js
import js from '@eslint/js';
import { defineConfig, globalIgnores } from 'eslint/config';
import prettier from 'eslint-config-prettier/flat';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores([
    '**/dist/**',
    '**/storybook-static/**',
    '**/coverage/**',
    '**/playwright-report/**',
    '**/test-results/**',
    '**/.turbo/**',
    '**/.next/**',
    '**/.source/**',
    '**/next-env.d.ts',
    'docs/mockups/**',
  ]),
  js.configs.recommended,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], jsxA11y.flatConfigs.strict],
  },
  {
    // Plain JS build scripts and configs are not part of any tsconfig project.
    files: ['**/*.{js,mjs,cjs}'],
    extends: [tseslint.configs.disableTypeChecked],
  },
  prettier,
);
```

`.prettierrc.json`:

```json
{
  "printWidth": 110,
  "singleQuote": true
}
```

`.prettierignore`:

```text
**/dist
**/storybook-static
**/.next
**/.source
**/coverage
**/playwright-report
**/test-results
**/__screenshots__
**/*.md
**/*.mdx
docs/mockups
pnpm-lock.yaml
```

`.editorconfig`:

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_style = space
indent_size = 2
insert_final_newline = true
trim_trailing_whitespace = true
```

`.nvmrc`:

```text
24
```

Append to `.gitignore`:

```text
.source/
next-env.d.ts
.pw-browsers/
packages/core/test/.tailwind/
```

- [ ] **Step 6: Move the two owner-created folders into the workspace**

Both are empty, so git sees nothing until files land in them.

```bash
mkdir -p packages
mv snapshot-dashboard-next packages/react
mv snapshot-dashboard-html packages/html
```

Create `packages/html/README.md`:

```markdown
# @snapshot-ui/html

Reserved for phase 7: the Alpine.js behaviors and copy-paste HTML for every
component, built on `@snapshot-ui/core` unchanged. Nothing is published from
here yet. pnpm ignores this folder until it has a package.json.
```

- [ ] **Step 7: Write the repository files**

`LICENSE` (the copyright holder is the git `user.name` of the owner):

```text
MIT License

Copyright (c) 2026 Ehsan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

`README.md`:

````markdown
# Snapshot UI

Calm interfaces for settings, dashboards and apps. Snapshot UI is an accessible
React component library in a warm, editorial design language: cream surfaces,
one typeface at a 450 body weight, corners from one scale, and colors that carry
meaning. A plain HTML version that shares the same CSS is planned.

| Package | What it is |
| --- | --- |
| `@snapshot-ui/core` | Design tokens, the Tailwind v4 theme and every component's CSS. No JavaScript. |
| `@snapshot-ui/react` | React components built on React Aria. |

## Install

```bash
pnpm add @snapshot-ui/react @snapshot-ui/core
```

```tsx
import '@snapshot-ui/core/styles.css';
import { Button } from '@snapshot-ui/react';

export function Save() {
  return <Button>Save changes</Button>;
}
```

Load Sofia Sans as a variable font so the 450 body weight renders; see the
installation guide in the docs.

## Theming

Two attributes theme any element and everything inside it:

- `data-theme="light"` or `"dark"`. With no attribute, the system setting wins.
- `data-shape="rounded"`, `"soft"` or `"square"` cuts every corner one way.

## Develop

```bash
corepack enable
pnpm install
pnpm --filter @snapshot-ui/docs dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md). The design rules live in
[docs/design-system.md](docs/design-system.md).

## License

MIT
````

`CONTRIBUTING.md`:

````markdown
# Contributing

Thank you for helping. This guide covers setup, the checks every change passes
and what a finished component looks like.

## Setup

You need Node 24 and pnpm 10, which corepack provides.

```bash
corepack enable
pnpm install
```

| Command | What it does |
| --- | --- |
| `pnpm build` | Builds every package and app. |
| `pnpm test` | Unit, behavior, accessibility and Storybook tests. |
| `pnpm lint` / `pnpm typecheck` | ESLint, Stylelint and TypeScript. |
| `pnpm verify` | Everything CI runs except the visual and end-to-end tests. |
| `pnpm --filter @snapshot-ui/storybook dev` | The component workshop. |
| `pnpm --filter @snapshot-ui/docs dev` | The docs site. |
| `pnpm --filter @snapshot-ui/storybook visual:docker` | Regenerates visual baselines in the CI image. Needs Docker. |

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
````

`SECURITY.md`:

```markdown
# Security policy

## Supported versions

Only the latest published minor version receives fixes.

## Reporting a vulnerability

Please report privately through GitHub: open the repository's Security tab and
choose "Report a vulnerability". Do not open a public issue. You will get a
reply within seven days.
```

`CODE_OF_CONDUCT.md`:

```markdown
# Code of conduct

This project follows the [Contributor Covenant, version 2.1](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

Report unacceptable behavior privately to the maintainer through their GitHub
profile, [@amirehsan](https://github.com/amirehsan). Reports are handled
confidentially.
```

`CLAUDE.md`:

````markdown
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
````

`.github/ISSUE_TEMPLATE/config.yml`:

```yaml
blank_issues_enabled: false
contact_links:
  - name: Security report
    url: https://github.com/amirehsan/snapshot-ui/security/advisories/new
    about: Report a vulnerability privately.
```

`.github/ISSUE_TEMPLATE/bug_report.yml`:

```yaml
name: Bug report
description: Something renders or behaves wrongly.
labels: [bug]
body:
  - type: textarea
    id: what
    attributes:
      label: What happened
      description: What you saw and what you expected instead.
    validations:
      required: true
  - type: textarea
    id: repro
    attributes:
      label: How to reproduce
      description: A minimal example, ideally a link to a sandbox.
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: Package versions
      placeholder: "@snapshot-ui/react 0.1.0, @snapshot-ui/core 0.1.0"
    validations:
      required: true
  - type: input
    id: browser
    attributes:
      label: Browser and OS
      placeholder: Safari 18 on macOS 15
```

`.github/ISSUE_TEMPLATE/feature_request.yml`:

```yaml
name: Feature request
description: A component or capability you need.
labels: [enhancement]
body:
  - type: textarea
    id: need
    attributes:
      label: What you are trying to build
      description: The task, not the solution. Screenshots help.
    validations:
      required: true
  - type: textarea
    id: idea
    attributes:
      label: What you have in mind
```

`.github/pull_request_template.md`:

```markdown
## What and why

## Checklist

- [ ] `pnpm verify` passes
- [ ] A changeset describes user-facing changes (`pnpm changeset`)
- [ ] New or changed components have tests, stories and a docs page
- [ ] Visual baselines were regenerated with `visual:docker` if anything moved
```

- [ ] **Step 8: Install and run the root checks**

```bash
pnpm install
pnpm format
pnpm check:public
pnpm test:root
pnpm exec eslint scripts
```

Expected:
- Install completes. pnpm may warn that `eslint-plugin-jsx-a11y` declares ESLint 9 at most; it works on ESLint 10.
- `check:public` prints `no private names in` and a file count.
- 4 tests pass.
- ESLint prints nothing.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "chore: set up the workspace, the public-name check and repository files"
```

### Task 2: The public design system document

**Files:**
- Create: `docs/design-system.md` (copied from the source app's `docs/Snapshot-Design-System.md`, then cleaned)
- Uses, not committed: `.local/clean-design-doc.mjs`

**Interfaces:**
- Produces: `docs/design-system.md` with a new final section, `# Appendix B: Library derivations`. Every later task that derives a visual decision appends a `## <Component>` section to Appendix B.

- [ ] **Step 1: Copy the document and watch the public check fail**

```bash
SOURCE=$(sed -n 's/^    \(\/.*\)$/\1/p' .local/SOURCE.md | head -1)
cp "$SOURCE/docs/Snapshot-Design-System.md" docs/design-system.md
pnpm check:public
```

Expected: FAIL. It lists file and line numbers in `docs/design-system.md`, and never the text.

- [ ] **Step 2: Check the local cleaning script is there**

The script that cleans the copy quotes the private passages it rewrites, so it can never be committed. It was written during planning and lives at `.local/clean-design-doc.mjs` (gitignored). It makes 22 replacements and stops if any of them does not match exactly once, so a drifted source is caught instead of half-cleaned.

```bash
test -f .local/clean-design-doc.mjs && echo present
```

Expected: `present`.

- [ ] **Step 3: Run it and re-run the public check**

```bash
node .local/clean-design-doc.mjs
pnpm check:public
```

Expected: `cleaned 22 passages`, then `check:public: no private names in tracked files`.

- [ ] **Step 4: Append the library derivations**

Append to the end of `docs/design-system.md`:

```markdown

---

# Appendix B: Library derivations

Everything above was derived for one settings app. This appendix records what
changed when the system became a general component library: the rule each
change comes from and, where a color is involved, what it measures. Components
add their own sections here when they are built.

## Token names

Token names follow the app's names so a value can still be traced to this
document. Four were renamed because they described a marketing page:

| App name | Library name | Why |
| --- | --- | --- |
| `--radius-button` 20px | `--radius-control` | It rounds tiles and rows that light up as well as buttons. |
| `--radius-consent` 24px | `--radius-surface` | In an app it is the card, popup and field-frame step. |
| `--text-footer-link` | `--text-small` | It is the hint and helper text step. |
| `--text-footer-header` | `--text-overline` | Uppercase column headers in tables and stat tiles. |

## Four colors added

All four are tokens with a light and a dark value, so no component mixes its
own.

| Token | Light | Dark | Role |
| --- | --- | --- | --- |
| `boundary` | ink at 50% | white at 50% | The edge of a control: inputs, checkbox and radio boxes, segmented tracks, a switch's off track. |
| `disabled` | `#F4F4F4` (Bone) | `#1A1A19` (Lifted Surface) | The fill of a disabled control. |
| `frame` | ink at 12% | white at 12% | The outline of a list, or of a float surface opening over another. |
| `divider` | ink at 10% | white at 10% | A rule inside a surface. |

**Boundary is the document's own value.** Section 4 gives the input border as
"Ink Black at ~50% opacity". The app dropped it to 40%, which measures 2.58:1
on white, under the 3:1 WCAG 1.4.11 asks of a control's edge. At 50%:

| Boundary against | Light | Dark |
| --- | --- | --- |
| the control's own fill (Raised) | 3.47 | 4.93 |
| a card (Lifted) | 3.36 | 5.59 |
| the page (canvas) | 3.06 | 6.20 |

A switch's off track uses the same value and measures 3.45 against a card in
light, where the app's 22% measured 1.61.

**Disabled is recessed in both themes.** The app used Bone, which in dark is
the same `#252523` as an enabled control's fill, so a disabled field looked
enabled. The dark value steps down to Lifted Surface instead.

The `hairline` color is the app's variable of the same name, unchanged. The
scrim's opacity is a token, `opacity-scrim`, 0.4 in light and 0.65 in dark.

## The shape axis

A site may cut every corner one of three ways from one attribute,
`data-shape`, which the app offered its clients as a site setting. Rounded is
the scale this document describes. Soft and Square are opt-in alternatives,
and Soft deliberately uses the 10 to 16px range this document rejects for
Rounded.

| Token | Rounded | Soft | Square |
| --- | --- | --- | --- |
| `--radius-micro` | 6px | 6px | 0 |
| `--radius-control` | 20px | 10px | 0 |
| `--radius-surface` | 24px | 12px | 0 |
| `--radius-stadium` | 40px | 16px | 0 |
| `--radius-pill` | 999px | 12px | 0 |
| `--radius-dot` | 50% | 50% | 50% |

Each scale descends, so the nested-radius rule holds in every shape. Dots never
change: a square radio would read as a checkbox, so roundness there is meaning.
No component writes a corner of its own, or the shape could not reach it.

## Rules every component follows

- **Nested themes reset text color.** A `[data-theme]` element sets
  `color: var(--color-ink)`. Inherited color is computed in the parent's theme,
  so without it a light card in a dark page keeps white text.
- **One cursor rule.** Every interactive control sets `cursor: pointer`, a
  disabled one `not-allowed` and a pending one `progress`. The app's buttons
  had none, because its reset removed it, while its choice controls had one.
- **An inset focus ring on an ink fill inverts to the canvas color.** The app did this
  for the current rail link only; the selected segmented option and the
  selected appearance row kept an ink ring on ink, invisible. Outset rings stay
  ink, which still reads against the page behind the fill.
- **Invalid outranks changed.** A field that is both shows the error border.
  The app showed the orange one, because its changed rule came later in the
  file.
- **Hover on a float surface is a 5% ink wash.** The app stepped Float to
  Lifted, which is the same color in dark, so the hover vanished there. The
  wash measures 1.10 in light and 1.14 in dark: a cue, not a boundary.
- **Reduced motion stops every transition**, except a spinner, which slows to
  a 2.4 second turn: a still spinner reads as finished.
- **Weights are 400, 450, 500 and 700.** No 600. Base styles turn off font
  synthesis, so a missing weight never renders as faux bold.
- **Minimum sizes:** 14px for sentences, 12px for short uppercase labels.
- **Touch targets stay at 40px.** A control drawn smaller extends its hit area
  with a pseudo-element, as the app's menu row buttons do.
```

- [ ] **Step 5: Check the document**

```bash
pnpm check:public
grep -c "$(printf '\xe2\x80\x94')" docs/design-system.md
grep -n '^# Appendix B' docs/design-system.md
```

Expected: the public check passes, the em dash count is `0`, and the appendix heading is found.

- [ ] **Step 6: Commit**

```bash
git add docs/design-system.md
git commit -m "docs: publish the design system with the library's derivations"
```

### Task 3: Token pipeline in @snapshot-ui/core

**Files:**
- Create: `packages/core/package.json`, `packages/core/tsconfig.json`, `packages/core/vitest.config.js`
- Create: `packages/core/tokens/tokens.json`
- Create: `packages/core/scripts/build-tokens.js`
- Test: `packages/core/test/tokens.test.js`, `packages/core/test/tailwind.test.js`

**Interfaces:**
- Produces `packages/core/dist/tokens.css`: CSS custom properties in `@layer theme`. Blocks, in order: `:root`, `[data-theme="dark"]`, `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) }`, `[data-theme="light"]`, `[data-shape="soft" i]`, `[data-shape="square" i]`, `[data-shape="rounded" i]`. Every theme block sets `color-scheme` and `color: var(--color-ink)`.
- Produces `packages/core/dist/tailwind.css`: one `@theme inline reference` block.
- Produces `packages/core/dist/tokens.js` and `tokens.d.ts`: `export const tokens`, where every leaf is `{ cssVar: string; var: string; value: string | number; modes?: { theme?: { dark: string }; shape?: { soft: string; square: string } } }`, plus `type Tokens` and `type TokenPath`.
- Token variable names used by every later task:
  - colors `--color-{canvas,lifted,bone,float,raised,disabled,ink,charcoal,granite,slate,taupe,link,signal,signal-light,clay,error,success,boundary,frame,divider,hairline,scrim,scrollbar,scrollbar-hover}`
  - `--opacity-scrim`, `--font-sans`, `--font-mono`
  - type `--text-{h1,h2,h3,h4,eyebrow,body,action,small,overline}` with `--text-<name>--line-height`, `--text-<name>--letter-spacing` where defined, and `--text-<name>--font-weight`
  - radii `--radius-{micro,control,surface,stadium,pill,dot}`
  - shadows `--shadow-{lift,float,dramatic}`
  - spacing `--spacing-{part,peer,separate,page}`, `--container-field`, `--breakpoint-{sm,md,lg}`
  - focus `--focus-ring-width`, `--focus-ring-offset`

- [ ] **Step 1: Create the package**

`packages/core/package.json`:

```json
{
  "name": "@snapshot-ui/core",
  "version": "0.0.0",
  "description": "Design tokens, the Tailwind v4 theme and component CSS for Snapshot UI.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/amirehsan/snapshot-ui.git",
    "directory": "packages/core"
  },
  "homepage": "https://github.com/amirehsan/snapshot-ui#readme",
  "bugs": "https://github.com/amirehsan/snapshot-ui/issues",
  "keywords": ["snapshot-ui", "design-system", "design-tokens", "css", "tailwindcss"],
  "type": "module",
  "sideEffects": ["**/*.css"],
  "files": ["dist"],
  "exports": {
    "./tokens.css": {
      "types": "./dist/css.d.ts",
      "default": "./dist/tokens.css"
    },
    "./tailwind.css": {
      "types": "./dist/css.d.ts",
      "default": "./dist/tailwind.css"
    },
    "./tokens": {
      "types": "./dist/tokens.d.ts",
      "default": "./dist/tokens.js"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "node scripts/build-tokens.js",
    "test": "pnpm run build && vitest run",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "devDependencies": {
    "@tailwindcss/cli": "4.3.3",
    "@types/node": "24.19.2",
    "@typescript/native": "catalog:",
    "style-dictionary": "5.6.1",
    "tailwindcss": "4.3.3",
    "typescript": "catalog:",
    "vitest": "5.0.3"
  }
}
```

`packages/core/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "noImplicitAny": false,
    "types": ["node"]
  },
  "include": ["scripts", "stylelint", "test", "*.config.js", "dist/tokens.d.ts"]
}
```

`packages/core/vitest.config.js`:

```js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.js'],
  },
});
```

Run: `pnpm install`

- [ ] **Step 2: Write the failing token tests**

`packages/core/test/tokens.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { tokens } from '../dist/tokens.js';

const css = readFileSync(new URL('../dist/tokens.css', import.meta.url), 'utf8');

/** The declarations of the first block whose selector is exactly `selector`. */
function block(selector) {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) throw new Error(`No block for ${selector}`);
  return css.slice(start, css.indexOf('}', start));
}

describe('tokens.css', () => {
  it('is one theme layer', () => {
    expect(css).toMatch(/@layer theme \{/);
  });

  it('declares the light values on :root', () => {
    const root = block(':root');
    expect(root).toContain('color-scheme: light;');
    expect(root).toContain('--color-canvas: #f3f0ee;');
    expect(root).toContain('--color-boundary: rgb(20 20 19 / 0.5);');
    expect(root).toContain("--font-sans: 'Sofia Sans', 'Sofia Sans Variable', Inter, Arial, sans-serif;");
    expect(root).toContain('--text-body: 1rem;');
    expect(root).toContain('--text-body--line-height: 1.4;');
    expect(root).toContain('--text-body--font-weight: 450;');
    expect(root).toContain('--radius-control: 20px;');
    expect(root).toContain('--radius-dot: 50%;');
    expect(root).toContain('--shadow-float: 0px 24px 48px 0px rgb(0 0 0 / 0.08);');
    expect(root).toContain('--spacing-peer: 24px;');
    expect(root).toContain('--focus-ring-width: 2px;');
  });

  it('keeps the alpha of translucent dark colors', () => {
    // Style Dictionary's color/css transform once turned this into #ffffff.
    const dark = block('[data-theme="dark"]');
    expect(dark).toContain('--color-slate: rgb(255 255 255 / 0.6);');
    expect(dark).toContain('--color-taupe: rgb(255 255 255 / 0.4);');
    expect(dark).toContain('--color-hairline: rgb(255 255 255 / 0.12);');
  });

  it('resets text color in every theme scope, so nested themes read', () => {
    for (const selector of ['[data-theme="dark"]', '[data-theme="light"]', ':root:not([data-theme="light"])']) {
      const lines = block(selector);
      expect(lines, selector).toContain('color: var(--color-ink);');
      expect(lines, selector).toMatch(/color-scheme: (light|dark);/);
    }
  });

  it('follows the system when no theme is set', () => {
    expect(css).toMatch(/@media \(prefers-color-scheme: dark\) \{\s*:root:not\(\[data-theme="light"\]\) \{/);
  });

  it('leaves the reserved accents alone in dark', () => {
    const dark = block('[data-theme="dark"]');
    expect(dark).not.toContain('--color-signal:');
    expect(dark).not.toContain('--color-signal-light:');
    expect(dark).toContain('--color-link: #6c8ee0;');
  });

  it('remaps only the radius scale for each shape, case-insensitively', () => {
    const soft = block('[data-shape="soft" i]');
    expect(soft).toContain('--radius-control: 10px;');
    expect(soft).toContain('--radius-pill: 12px;');
    expect(soft).toContain('--radius-stadium: 16px;');
    const square = block('[data-shape="square" i]');
    expect(square).toContain('--radius-control: 0px;');
    expect(square).toContain('--radius-micro: 0px;');
    const rounded = block('[data-shape="rounded" i]');
    expect(rounded).toContain('--radius-pill: 999px;');
    for (const shape of [soft, square, rounded]) {
      expect(shape).not.toContain('--radius-dot');
      expect(shape).not.toContain('--color-');
    }
  });
});

describe('tokens.js', () => {
  it('exposes values, variables and modes', () => {
    expect(tokens.color.slate.var).toBe('var(--color-slate)');
    expect(tokens.color.slate.modes.theme.dark).toBe('rgb(255 255 255 / 0.6)');
    expect(tokens.radius.pill.modes.shape.soft).toBe('12px');
    expect(tokens.text.body['line-height'].cssVar).toBe('--text-body--line-height');
  });
});
```

`packages/core/test/tailwind.test.js`:

```js
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const dir = path.join(import.meta.dirname, '.tailwind');
const cli = path.join(import.meta.dirname, '..', 'node_modules', '.bin', 'tailwindcss');

const USED = 'bg-canvas text-ink rounded-control text-body p-part max-w-field md:flex shadow-float';
const CLEARED = 'rounded-lg text-sm bg-red-500 shadow-md font-serif xl:flex';

/** Compiles a Tailwind entry that imports the tokens and the theme in `order`. */
function compile(name, order) {
  mkdirSync(dir, { recursive: true });
  const imports = {
    tokens: '@import "../../dist/tokens.css";',
    tailwind: '@import "tailwindcss" source(none);',
    theme: '@import "../../dist/tailwind.css";',
  };
  const input = path.join(dir, `${name}.css`);
  const output = path.join(dir, `${name}.out.css`);
  writeFileSync(input, [...order.map((key) => imports[key]), `@source inline("${USED} ${CLEARED}");`].join('\n'));
  execFileSync(cli, ['-i', input, '-o', output], { stdio: 'pipe' });
  return readFileSync(output, 'utf8');
}

describe.each([
  ['tokens before Tailwind', ['tokens', 'tailwind', 'theme']],
  ['Tailwind before tokens', ['tailwind', 'theme', 'tokens']],
])('the Tailwind theme, %s', (name, order) => {
  const out = compile(name.replaceAll(' ', '-'), order);

  it('builds utilities that read the runtime tokens', () => {
    expect(out).toMatch(/\.bg-canvas \{\s*background-color: var\(--color-canvas\);/);
    expect(out).toMatch(/\.rounded-control \{\s*border-radius: var\(--radius-control\);/);
    expect(out).toMatch(/\.text-body \{\s*font-size: var\(--text-body\);/);
    expect(out).toMatch(/\.p-part \{\s*padding: var\(--spacing-part\);/);
    expect(out).toMatch(/\.max-w-field \{\s*max-width: var\(--container-field\);/);
    expect(out).toContain('@media (width >= 1024px)');
  });

  it("clears Tailwind's off-system defaults", () => {
    for (const cls of ['.rounded-lg', '.text-sm', '.bg-red-500', '.shadow-md', '.font-serif', '.xl\\:flex']) {
      expect(out, cls).not.toContain(`${cls} {`);
    }
  });

  it('never writes a self-referencing variable', () => {
    expect(out).not.toMatch(/--color-canvas: var\(--color-canvas\)/);
    expect(out).not.toMatch(/--radius-control: var\(--radius-control\)/);
  });
});
```

- [ ] **Step 3: Run the tests to see them fail**

Run: `pnpm --filter @snapshot-ui/core test`
Expected: FAIL, because `scripts/build-tokens.js` does not exist.

- [ ] **Step 4: Write the token source**

`packages/core/tokens/tokens.json`:

```json
{
  "color": {
    "$type": "color",
    "canvas": {
      "$value": "#f3f0ee",
      "$description": "The page. Warm putty cream, never pure white.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#0e0e0d" } } }
    },
    "lifted": {
      "$value": "#fcfbfa",
      "$description": "A card or panel laid on the canvas.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#1a1a19" } } }
    },
    "bone": {
      "$value": "#f4f4f4",
      "$description": "A quiet subregion fill: key hints, notes, code.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#252523" } } }
    },
    "float": {
      "$value": "#ffffff",
      "$description": "Chrome that floats on the canvas: the rail, a menu, a toast.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#1a1a19" } } }
    },
    "raised": {
      "$value": "#ffffff",
      "$description": "The fill of a control.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#252523" } } }
    },
    "disabled": {
      "$value": "#f4f4f4",
      "$description": "The fill of a disabled control. Recessed below raised in both themes.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#1a1a19" } } }
    },
    "ink": {
      "$value": "#141413",
      "$description": "Primary text, the primary fill and the focus ring.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#ffffff" } } }
    },
    "charcoal": {
      "$value": "#262627",
      "$description": "The primary fill on hover.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.85)" } } }
    },
    "granite": {
      "$value": "#555555",
      "$description": "Small uppercase text that wants more headroom than slate.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.7)" } } }
    },
    "slate": {
      "$value": "#696969",
      "$description": "Hints, notes, secondary labels.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.6)" } } }
    },
    "taupe": {
      "$value": "#d1cdc7",
      "$description": "Placeholder and disabled text only. Never text the reader must read.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.4)" } } }
    },
    "link": {
      "$value": "#3860be",
      "$description": "Inline links and informational tone.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#6c8ee0" } } }
    },
    "signal": {
      "$value": "#cf4500",
      "$description": "Reserved for consent, legal and compliance actions."
    },
    "signal-light": {
      "$value": "#f37338",
      "$description": "Attention cue: the changed border and the eyebrow dot. Never body color."
    },
    "clay": {
      "$value": "#9a3a0a",
      "$description": "Reserved for unsaved changes.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#d9925f" } } }
    },
    "error": {
      "$value": "#a3231b",
      "$description": "Reserved for failure and invalid values.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#e8705f" } } }
    },
    "success": {
      "$value": "#2a5f46",
      "$description": "Reserved for success.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "#5aac80" } } }
    },
    "boundary": {
      "$value": "rgb(20 20 19 / 0.5)",
      "$description": "The boundary of a control. Ink at 50%, the document's input border, measured at 3:1 or more.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.5)" } } }
    },
    "frame": {
      "$value": "rgb(20 20 19 / 0.12)",
      "$description": "The outline of a list or a float surface opening over another float surface.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.12)" } } }
    },
    "divider": {
      "$value": "rgb(20 20 19 / 0.1)",
      "$description": "A rule inside a surface, such as a card's header band.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.1)" } } }
    },
    "hairline": {
      "$value": "transparent",
      "$description": "A surface's own edge. Nothing in light, where tone separates; white 12% in dark.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.12)" } } }
    },
    "scrim": {
      "$value": "#050505",
      "$description": "Deep Well, the fill behind a dialog or drawer. Fixed in both themes."
    },
    "scrollbar": {
      "$value": "rgb(20 20 19 / 0.22)",
      "$description": "A scrollbar thumb.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.22)" } } }
    },
    "scrollbar-hover": {
      "$value": "rgb(20 20 19 / 0.4)",
      "$description": "A scrollbar thumb under the pointer.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": "rgb(255 255 255 / 0.4)" } } }
    }
  },
  "opacity": {
    "$type": "number",
    "scrim": {
      "$value": 0.4,
      "$description": "How much the scrim dims. A near-black page needs more to register.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": 0.65 } } }
    }
  },
  "font": {
    "$type": "fontFamily",
    "sans": {
      "$value": ["Sofia Sans", "Sofia Sans Variable", "Inter", "Arial", "sans-serif"],
      "$description": "The one family. Needs the variable build for weight 450. Sofia Sans Variable is the family name Fontsource's self-hosted package registers."
    },
    "mono": {
      "$value": ["ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      "$description": "Code only."
    }
  },
  "text": {
    "h1": {
      "size": { "$type": "dimension", "$value": { "value": 4, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1 },
      "letter-spacing": { "$type": "dimension", "$value": { "value": -0.02, "unit": "em" } },
      "font-weight": { "$type": "fontWeight", "$value": 500 }
    },
    "h2": {
      "size": { "$type": "dimension", "$value": { "value": 2.25, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1.222 },
      "letter-spacing": { "$type": "dimension", "$value": { "value": -0.02, "unit": "em" } },
      "font-weight": { "$type": "fontWeight", "$value": 500 }
    },
    "h3": {
      "size": { "$type": "dimension", "$value": { "value": 1.5, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1.2 },
      "letter-spacing": { "$type": "dimension", "$value": { "value": -0.02, "unit": "em" } },
      "font-weight": { "$type": "fontWeight", "$value": 500 }
    },
    "h4": {
      "size": { "$type": "dimension", "$value": { "value": 0.875, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1.3 },
      "font-weight": { "$type": "fontWeight", "$value": 700 }
    },
    "eyebrow": {
      "size": { "$type": "dimension", "$value": { "value": 0.875, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1 },
      "letter-spacing": { "$type": "dimension", "$value": { "value": 0.04, "unit": "em" } },
      "font-weight": { "$type": "fontWeight", "$value": 700 }
    },
    "body": {
      "size": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1.4 },
      "font-weight": { "$type": "fontWeight", "$value": 450 }
    },
    "action": {
      "size": { "$type": "dimension", "$value": { "value": 1, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1 },
      "letter-spacing": { "$type": "dimension", "$value": { "value": -0.03, "unit": "em" } },
      "font-weight": { "$type": "fontWeight", "$value": 500 }
    },
    "small": {
      "size": { "$type": "dimension", "$value": { "value": 0.875, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1.43 },
      "font-weight": { "$type": "fontWeight", "$value": 450 }
    },
    "overline": {
      "size": { "$type": "dimension", "$value": { "value": 0.875, "unit": "rem" } },
      "line-height": { "$type": "number", "$value": 1 },
      "letter-spacing": { "$type": "dimension", "$value": { "value": 0.04, "unit": "em" } },
      "font-weight": { "$type": "fontWeight", "$value": 700 }
    }
  },
  "radius": {
    "$type": "dimension",
    "micro": {
      "$value": { "value": 6, "unit": "px" },
      "$description": "Checkboxes, badges, key hints, tooltips.",
      "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 6, "unit": "px" }, "square": { "value": 0, "unit": "px" } } } }
    },
    "control": {
      "$value": { "value": 20, "unit": "px" },
      "$description": "Buttons, tiles, rows that light up.",
      "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 10, "unit": "px" }, "square": { "value": 0, "unit": "px" } } } }
    },
    "surface": {
      "$value": { "value": 24, "unit": "px" },
      "$description": "Popups, menus, nested cards, field frames, lists, previews.",
      "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 12, "unit": "px" }, "square": { "value": 0, "unit": "px" } } } }
    },
    "stadium": {
      "$value": { "value": 40, "unit": "px" },
      "$description": "Panel cards, dialogs, the sidebar rail.",
      "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 16, "unit": "px" }, "square": { "value": 0, "unit": "px" } } } }
    },
    "pill": {
      "$value": { "value": 999, "unit": "px" },
      "$description": "Inputs, icon buttons, segmented tracks, chips, switches, avatars.",
      "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 12, "unit": "px" }, "square": { "value": 0, "unit": "px" } } } }
    },
    "dot": {
      "$value": "50%",
      "$description": "Round in every shape: radio indicators, status dots, slider thumbs, spinners."
    }
  },
  "shadow": {
    "$type": "shadow",
    "lift": {
      "$value": { "color": "rgb(0 0 0 / 0.04)", "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 4, "unit": "px" }, "blur": { "value": 24, "unit": "px" }, "spread": { "value": 0, "unit": "px" } },
      "$description": "Level 1: floating chrome.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": { "color": "rgb(0 0 0 / 0.4)", "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 4, "unit": "px" }, "blur": { "value": 24, "unit": "px" }, "spread": { "value": 0, "unit": "px" } } } } }
    },
    "float": {
      "$value": { "color": "rgb(0 0 0 / 0.08)", "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 24, "unit": "px" }, "blur": { "value": 48, "unit": "px" }, "spread": { "value": 0, "unit": "px" } },
      "$description": "Level 2: popups, dialogs, elevated cards.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": { "color": "rgb(0 0 0 / 0.5)", "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 24, "unit": "px" }, "blur": { "value": 48, "unit": "px" }, "spread": { "value": 0, "unit": "px" } } } } }
    },
    "dramatic": {
      "$value": { "color": "rgb(0 0 0 / 0.25)", "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 70, "unit": "px" }, "blur": { "value": 110, "unit": "px" }, "spread": { "value": 0, "unit": "px" } },
      "$description": "Level 3: rare.",
      "$extensions": { "snapshot-ui": { "theme": { "dark": { "color": "rgb(0 0 0 / 0.6)", "offsetX": { "value": 0, "unit": "px" }, "offsetY": { "value": 70, "unit": "px" }, "blur": { "value": 110, "unit": "px" }, "spread": { "value": 0, "unit": "px" } } } } }
    }
  },
  "spacing": {
    "$type": "dimension",
    "part": { "$value": { "value": 8, "unit": "px" }, "$description": "Parts of one thing: label to control to hint." },
    "peer": { "$value": { "value": 24, "unit": "px" }, "$description": "Peers in a list: field to the field below." },
    "separate": { "$value": { "value": 32, "unit": "px" }, "$description": "Separate things: card to card, field beside field." },
    "page": { "$value": { "value": 48, "unit": "px" }, "$description": "The page's own margin." }
  },
  "container": {
    "$type": "dimension",
    "field": { "$value": { "value": 44, "unit": "rem" }, "$description": "The widest a single control grows." }
  },
  "breakpoint": {
    "$type": "dimension",
    "sm": { "$value": { "value": 768, "unit": "px" }, "$description": "Tablet entry." },
    "md": { "$value": { "value": 1024, "unit": "px" }, "$description": "Desktop entry." },
    "lg": { "$value": { "value": 1440, "unit": "px" }, "$description": "Wide entry." }
  },
  "focus-ring": {
    "$type": "dimension",
    "width": { "$value": { "value": 2, "unit": "px" } },
    "offset": { "$value": { "value": 2, "unit": "px" } }
  }
}
```

- [ ] **Step 5: Write the build script**

`packages/core/scripts/build-tokens.js`:

```js
// Builds dist/tokens.css, dist/tailwind.css, dist/tokens.js and dist/tokens.d.ts
// from tokens/tokens.json (W3C Design Tokens format) with Style Dictionary 5.
//
// Per-mode values live in $extensions["snapshot-ui"][axis][variant]:
//   "$extensions": { "snapshot-ui": { "theme": { "dark": "#0e0e0d" } } }
//   "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 10, "unit": "px" } } } }
// A preprocessor copies every mode value into a hidden tree
// (__mode.<axis>.<variant>.<path>) so transforms apply to mode values exactly as
// they do to base values. The formats then split base and mode tokens again.
import StyleDictionary from 'style-dictionary';
import { fileHeader } from 'style-dictionary/utils';

const EXT = 'snapshot-ui';
const MODE_ROOT = '__mode';

/** Each axis maps to a data attribute. `base` is the variant that $value holds. */
export const AXES = {
  theme: { attr: 'data-theme', base: 'light', caseInsensitive: false, colorScheme: true, media: { dark: '(prefers-color-scheme: dark)' } },
  shape: { attr: 'data-shape', base: 'rounded', caseInsensitive: true },
};

StyleDictionary.registerPreprocessor({
  name: 'snapshot-ui/modes',
  preprocessor: (dictionary) => {
    const modeTree = {};
    const walk = (node, path, inheritedType) => {
      if (node === null || typeof node !== 'object') return;
      const type = node.$type ?? inheritedType;
      if ('$value' in node) {
        const modes = node.$extensions?.[EXT] ?? {};
        for (const [axis, variants] of Object.entries(modes)) {
          if (!(axis in AXES)) throw new Error(`Unknown mode axis "${axis}" on ${path.join('.')}`);
          for (const [variant, value] of Object.entries(variants)) {
            let target = modeTree;
            for (const key of [axis, variant, ...path.slice(0, -1)]) target = target[key] ??= {};
            target[path.at(-1)] = { $value: value, $type: type };
          }
        }
        return;
      }
      for (const [key, child] of Object.entries(node)) {
        if (!key.startsWith('$')) walk(child, [...path, key], type);
      }
    };
    walk(dictionary, [], undefined);
    return { ...dictionary, [MODE_ROOT]: modeTree };
  },
});

/**
 * Names follow Tailwind v4's theme namespaces so the same variable serves plain
 * CSS and Tailwind: text.body.size is --text-body and text.body.line-height is
 * --text-body--line-height. Everything else is the path joined by dashes.
 */
StyleDictionary.registerTransform({
  name: 'snapshot-ui/name',
  type: 'name',
  transform: (token) => {
    const isMode = token.path[0] === MODE_ROOT;
    const path = isMode ? token.path.slice(3) : token.path;
    const name =
      path[0] === 'text' && path.length === 3
        ? path[2] === 'size'
          ? `text-${path[1]}`
          : `text-${path[1]}--${path[2]}`
        : path.join('-');
    // Mode copies get a private name so they never collide with the base token.
    return isMode ? `${MODE_ROOT}-${token.path[1]}-${token.path[2]}-${name}` : name;
  },
});

// The stock css group, minus two transforms:
// - name/kebab, replaced by snapshot-ui/name above.
// - color/css, which rewrites colors through tinycolor and silently drops the
//   alpha of modern rgb(r g b / a) syntax: rgb(255 255 255 / 0.6) came out as
//   #ffffff. Colors are written as valid CSS in tokens.json and pass through.
StyleDictionary.registerTransformGroup({
  name: 'snapshot-ui/css',
  transforms: [
    ...StyleDictionary.hooks.transformGroups.css.filter((name) => name !== 'name/kebab' && name !== 'color/css'),
    'snapshot-ui/name',
  ],
});

/** Splits all tokens into base tokens and axis -> variant -> declarations. */
function splitTokens(allTokens) {
  const base = allTokens.filter((t) => t.path[0] !== MODE_ROOT);
  const byPath = new Map(base.map((t) => [t.path.join('.'), t]));
  const modes = {};
  for (const t of allTokens) {
    if (t.path[0] !== MODE_ROOT) continue;
    const [, axis, variant, ...rest] = t.path;
    const baseToken = byPath.get(rest.join('.'));
    if (!baseToken) throw new Error(`Mode value for unknown token ${rest.join('.')}`);
    ((modes[axis] ??= {})[variant] ??= []).push({ name: baseToken.name, value: t.$value });
  }
  return { base, modes };
}

const decl = (name, value) => `--${name}: ${value};`;
const block = (selector, lines, indent) => {
  const pad = '  '.repeat(indent);
  return [`${pad}${selector} {`, ...lines.map((l) => `${pad}  ${l}`), `${pad}}`].join('\n');
};
const attrSelector = (def, variant) => `[${def.attr}="${variant}"${def.caseInsensitive ? ' i' : ''}]`;

StyleDictionary.registerFormat({
  name: 'snapshot-ui/css-layered',
  format: async ({ dictionary, file }) => {
    const { base, modes } = splitTokens(dictionary.allTokens);
    const out = [];
    const rootLines = base.map((t) => decl(t.name, t.$value));
    rootLines.unshift(`color-scheme: ${AXES.theme.base};`);
    out.push(block(':root', rootLines, 1));
    for (const [axis, variants] of Object.entries(modes)) {
      const def = AXES[axis];
      const changed = new Set(Object.values(variants).flatMap((v) => v.map((d) => d.name)));
      const baseLines = base.filter((t) => changed.has(t.name)).map((t) => decl(t.name, t.$value));
      for (const [variant, decls] of Object.entries(variants)) {
        const lines = decls.map((d) => decl(d.name, d.value));
        // A theme scope re-resolves its own text color: inherited color is
        // computed in the parent's theme, so a light card inside a dark page
        // would otherwise keep the page's white text.
        if (def.colorScheme) lines.unshift(`color-scheme: ${variant};`, 'color: var(--color-ink);');
        out.push(block(attrSelector(def, variant), lines, 1));
        if (def.media?.[variant]) {
          out.push([`  @media ${def.media[variant]} {`, block(`:root:not(${attrSelector(def, def.base)})`, lines, 2), '  }'].join('\n'));
        }
      }
      // The base variant again, so a light subtree inside a dark page, or a
      // rounded one inside a soft page, takes its own values.
      if (def.colorScheme) baseLines.unshift(`color-scheme: ${def.base};`, 'color: var(--color-ink);');
      out.push(block(attrSelector(def, def.base), baseLines, 1));
    }
    return `${await fileHeader({ file, commentStyle: 'long' })}@layer theme {\n${out.join('\n')}\n}\n`;
  },
});

/**
 * Tailwind v4 theme. `inline reference`: utilities read the runtime variable, so
 * they follow color mode and shape, and Tailwind emits no variables of its own
 * (plain `inline` would write a self-referencing --color-canvas: var(--color-canvas)).
 * Namespaces listed in RESET lose Tailwind's defaults, which is what makes
 * rounded-lg or text-sm compile to nothing. Spacing keeps Tailwind's numeric
 * scale and only gains the four semantic steps. Breakpoints must be literal,
 * because a media query cannot read a variable.
 */
const TAILWIND = {
  color: { reset: true },
  font: { reset: true },
  text: { reset: true },
  radius: { reset: true },
  shadow: { reset: true },
  spacing: { reset: false },
  container: { reset: false },
  breakpoint: { reset: true, literal: true },
};

StyleDictionary.registerFormat({
  name: 'snapshot-ui/tailwind-theme',
  format: async ({ dictionary, file }) => {
    const { base } = splitTokens(dictionary.allTokens);
    const lines = [];
    for (const [ns, opts] of Object.entries(TAILWIND)) if (opts.reset) lines.push(`--${ns}-*: initial;`);
    for (const t of base) {
      const opts = TAILWIND[t.path[0]];
      if (!opts) continue;
      lines.push(opts.literal ? decl(t.name, t.$value) : `--${t.name}: var(--${t.name});`);
    }
    return `${await fileHeader({ file, commentStyle: 'long' })}${block('@theme inline reference', lines, 0)}\n`;
  },
});

function buildTokenObject(dictionary) {
  const { base, modes } = splitTokens(dictionary.allTokens);
  const modeValues = new Map();
  for (const [axis, variants] of Object.entries(modes)) {
    for (const [variant, decls] of Object.entries(variants)) {
      for (const d of decls) {
        const entry = modeValues.get(d.name) ?? {};
        (entry[axis] ??= {})[variant] = d.value;
        modeValues.set(d.name, entry);
      }
    }
  }
  const root = {};
  for (const t of base) {
    let target = root;
    for (const key of t.path.slice(0, -1)) target = target[key] ??= {};
    target[t.path.at(-1)] = {
      cssVar: `--${t.name}`,
      var: `var(--${t.name})`,
      value: t.$value,
      ...(modeValues.has(t.name) ? { modes: modeValues.get(t.name) } : {}),
    };
  }
  return { root, paths: base.map((t) => t.path.join('.')) };
}

StyleDictionary.registerFormat({
  name: 'snapshot-ui/js',
  format: async ({ dictionary, file }) => {
    const { root } = buildTokenObject(dictionary);
    return `${await fileHeader({ file })}export const tokens = ${JSON.stringify(root, null, 2)};\n`;
  },
});

const typeLiteral = (value, indent = 0) => {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value);
  const pad = '  '.repeat(indent + 1);
  const entries = Object.entries(value).map(([k, v]) => `${pad}readonly ${JSON.stringify(k)}: ${typeLiteral(v, indent + 1)};`);
  return `{\n${entries.join('\n')}\n${'  '.repeat(indent)}}`;
};

StyleDictionary.registerFormat({
  name: 'snapshot-ui/dts',
  format: async ({ dictionary, file }) => {
    const { root, paths } = buildTokenObject(dictionary);
    return [
      await fileHeader({ file }),
      `export declare const tokens: ${typeLiteral(root)};\n`,
      'export type Tokens = typeof tokens;\n',
      `export type TokenPath = ${paths.map((p) => JSON.stringify(p)).join(' | ')};\n`,
    ].join('');
  },
});

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  preprocessors: ['snapshot-ui/modes'],
  log: { verbosity: 'default' },
  platforms: {
    css: {
      transformGroup: 'snapshot-ui/css',
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.css', format: 'snapshot-ui/css-layered' },
        { destination: 'tailwind.css', format: 'snapshot-ui/tailwind-theme' },
        { destination: 'tokens.js', format: 'snapshot-ui/js' },
        { destination: 'tokens.d.ts', format: 'snapshot-ui/dts' },
      ],
    },
  },
});

await sd.buildAllPlatforms();
```

- [ ] **Step 6: Run the tests again**

Run: `pnpm --filter @snapshot-ui/core test`
Expected: PASS, 14 tests: 8 for the tokens and 6 for the Tailwind theme. The build prints four `✔︎ dist/...` lines and no collision warnings.

- [ ] **Step 7: Type-check and commit**

```bash
pnpm --filter @snapshot-ui/core typecheck
git add packages/core
git commit -m "feat(core): build tokens for both theme axes and the Tailwind theme"
```

Expected: the type-check prints nothing. If `tsc` reports a JS typing error in `build-tokens.js`, add a JSDoc type to that line rather than loosening `tsconfig.json`.

### Task 4: Contrast gate

**Files:**
- Create: `packages/core/scripts/contrast.js`, `packages/core/scripts/check-contrast.js`
- Test: `packages/core/test/contrast.test.js`
- Modify: `packages/core/package.json` (add the `check:contrast` script)

**Interfaces:**
- Consumes: `packages/core/tokens/tokens.json` from Task 3.
- Produces, from `scripts/contrast.js`:
  - `TEXT = 4.5`, `NON_TEXT = 3`
  - `CONTRAST_PAIRS: Array<{ text: string; ground: string; minimum: number; shows: string; over?: string; fill?: string }>`
  - `parseColor(value: string): { r: number; g: number; b: number; a: number }`
  - `composite(top, bottom)` and `contrastRatio(first, second): number`
  - `contrastFailures(palette: Record<string, string>, mode: string): Array<{ mode; text; ground; ratio; minimum; shows }>`
- Phase 1b components that draw a new text-on-ground pairing add it to `CONTRAST_PAIRS`.

- [ ] **Step 1: Write the failing tests**

`packages/core/test/contrast.test.js`:

```js
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composite, contrastFailures, contrastRatio, parseColor } from '../scripts/contrast.js';

const ratio = (a, b) => contrastRatio(parseColor(a), parseColor(b));

describe('contrastRatio', () => {
  // Fixtures carried over from the source app's own contrast tests.
  it('measures WCAG 2 contrast in either order', () => {
    expect(ratio('#000000', '#ffffff')).toBe(21);
    expect(ratio('#ffffff', '#000000')).toBe(21);
    expect(ratio('#3860be', '#3860BE')).toBe(1);
    expect(ratio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(ratio('#777777', '#ffffff')).toBeCloseTo(4.48, 2);
    expect(ratio('#595959', '#ffffff')).toBeCloseTo(7.0, 2);
    expect(ratio('#fcfbfa', '#f3f0ee')).toBeCloseTo(1.1, 2);
  });
});

describe('parseColor', () => {
  it('reads every syntax the tokens use', () => {
    expect(parseColor('#abc')).toEqual({ r: 170, g: 187, b: 204, a: 1 });
    expect(parseColor('#141413')).toEqual({ r: 20, g: 20, b: 19, a: 1 });
    expect(parseColor('rgb(255 255 255 / 0.6)')).toEqual({ r: 255, g: 255, b: 255, a: 0.6 });
    expect(parseColor('rgba(20, 20, 19, 0.5)')).toEqual({ r: 20, g: 20, b: 19, a: 0.5 });
    expect(parseColor('rgb(0 0 0 / 40%)')).toEqual({ r: 0, g: 0, b: 0, a: 0.4 });
    expect(parseColor('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
  });

  it('refuses what it cannot read', () => {
    expect(() => parseColor('oklch(0.5 0.1 200)')).toThrow(/Cannot parse/);
  });
});

describe('composite', () => {
  it('paints a translucent color over an opaque one', () => {
    const half = composite(parseColor('rgb(0 0 0 / 0.5)'), parseColor('#ffffff'));
    expect(half.r).toBeCloseTo(127.5);
    expect(half.a).toBe(1);
  });
});

describe('contrastFailures', () => {
  const tokens = JSON.parse(readFileSync(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
  const palette = (mode) =>
    Object.fromEntries(
      Object.entries(tokens.color)
        .filter(([name]) => !name.startsWith('$'))
        .map(([name, token]) => [
          name,
          mode === 'dark' ? (token.$extensions?.['snapshot-ui']?.theme?.dark ?? token.$value) : token.$value,
        ]),
    );

  it('passes every documented pairing in light and dark', () => {
    expect([...contrastFailures(palette('light'), 'light'), ...contrastFailures(palette('dark'), 'dark')]).toEqual([]);
  });

  it('catches taupe used as readable text', () => {
    const broken = { ...palette('light'), slate: '#d1cdc7' };
    const failures = contrastFailures(broken, 'light');
    expect(failures.some((f) => f.text === 'slate' && f.ratio < 4.5)).toBe(true);
  });

  it("catches the source app's 40% control boundary", () => {
    const broken = { ...palette('light'), boundary: 'rgb(20 20 19 / 0.4)' };
    const failures = contrastFailures(broken, 'light');
    expect(failures.some((f) => f.text === 'boundary' && f.ground === 'raised')).toBe(true);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm --filter @snapshot-ui/core exec vitest run test/contrast.test.js`
Expected: FAIL, `scripts/contrast.js` does not exist.

- [ ] **Step 3: Write the contrast module**

`packages/core/scripts/contrast.js`:

```js
// WCAG 2 contrast for the token palette, in both color modes.
// Ported from the source app's contrast check and extended to translucent
// colors: a value like rgb(255 255 255 / 0.6) is composited over the surface it
// sits on before it is measured, because that is the color a reader sees.

/** WCAG's minimum for text at body size (1.4.3). */
export const TEXT = 4.5;
/** WCAG's minimum for a control boundary or focus ring (1.4.11). */
export const NON_TEXT = 3;

/**
 * Every pairing the components draw. `over` composites a translucent `text`
 * (or a translucent fill) onto that surface first. `shows` names the use, for
 * the failure message.
 */
export const CONTRAST_PAIRS = [
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({ text: 'ink', ground, minimum: TEXT, shows: `primary text on ${ground}` })),
  ...['canvas', 'lifted', 'bone', 'float', 'raised'].map((ground) => ({ text: 'slate', ground, minimum: TEXT, shows: `hints and notes on ${ground}` })),
  ...['canvas', 'lifted', 'bone'].map((ground) => ({ text: 'granite', ground, minimum: TEXT, shows: `small uppercase text on ${ground}` })),
  ...['canvas', 'lifted'].map((ground) => ({ text: 'charcoal', ground, minimum: TEXT, shows: `alternate text on ${ground}` })),
  ...['canvas', 'lifted', 'float', 'raised'].map((ground) => ({ text: 'link', ground, minimum: TEXT, shows: `an inline link on ${ground}` })),
  ...['canvas', 'lifted', 'bone', 'raised'].map((ground) => ({ text: 'clay', ground, minimum: TEXT, shows: `the changed marker on ${ground}` })),
  ...['canvas', 'lifted', 'float', 'raised'].map((ground) => ({ text: 'error', ground, minimum: TEXT, shows: `an error message on ${ground}` })),
  ...['canvas', 'lifted', 'float', 'raised'].map((ground) => ({ text: 'success', ground, minimum: TEXT, shows: `a success message on ${ground}` })),
  { text: 'canvas', ground: 'ink', minimum: TEXT, shows: 'the primary button label' },
  { text: 'canvas', ground: 'charcoal', over: 'lifted', minimum: TEXT, shows: 'the primary button label on hover' },
  { text: 'canvas', ground: 'error', minimum: TEXT, shows: 'the danger button label' },
  ...['canvas', 'lifted', 'float', 'raised', 'bone'].map((ground) => ({ text: 'ink', ground, minimum: NON_TEXT, shows: `the focus ring on ${ground}` })),
  { text: 'canvas', ground: 'ink', minimum: NON_TEXT, shows: 'the inverted focus ring on an ink fill' },
  ...['raised', 'lifted', 'canvas', 'float'].map((ground) => ({ text: 'boundary', ground, fill: 'raised', minimum: NON_TEXT, shows: `a control boundary against ${ground}` })),
  { text: 'raised', ground: 'boundary', over: 'lifted', minimum: NON_TEXT, shows: 'the switch thumb on its off track' },
];

/** Parses #rgb, #rrggbb, rgb(r g b), rgb(r g b / a), rgba(r, g, b, a) and transparent. */
export function parseColor(value) {
  const text = String(value).trim().toLowerCase();
  if (text === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  let match = /^#([\da-f]{3}|[\da-f]{6})$/.exec(text);
  if (match) {
    const hex = match[1].length === 3 ? [...match[1]].map((c) => c + c).join('') : match[1];
    const n = Number.parseInt(hex, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: 1 };
  }
  match = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)\s*(?:[/,]\s*([\d.]+%?))?\s*\)$/.exec(text);
  if (match) {
    const alpha = match[4] === undefined ? 1 : match[4].endsWith('%') ? Number.parseFloat(match[4]) / 100 : Number(match[4]);
    return { r: Number(match[1]), g: Number(match[2]), b: Number(match[3]), a: alpha };
  }
  throw new Error(`Cannot parse color "${value}"`);
}

/** Paints `top` over an opaque `bottom`. */
export function composite(top, bottom) {
  const a = top.a;
  return {
    r: top.r * a + bottom.r * (1 - a),
    g: top.g * a + bottom.g * (1 - a),
    b: top.b * a + bottom.b * (1 - a),
    a: 1,
  };
}

function channel(value) {
  const v = value / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

function luminance({ r, g, b }) {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** WCAG 2 contrast ratio of two opaque colors, in either order. */
export function contrastRatio(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Every pair under its minimum in one color mode.
 * `palette` maps a color name to its CSS value in that mode.
 */
export function contrastFailures(palette, mode) {
  const color = (name) => {
    if (!(name in palette)) throw new Error(`No color "${name}" in the ${mode} palette`);
    return parseColor(palette[name]);
  };
  const opaque = (name, over) => {
    const value = color(name);
    if (value.a === 1) return value;
    const base = over ?? 'canvas';
    return composite(value, color(base));
  };
  const failures = [];
  for (const pair of CONTRAST_PAIRS) {
    const ground = opaque(pair.ground, pair.over);
    const textBase = pair.fill ? opaque(pair.fill) : ground;
    const text = composite(color(pair.text), textBase);
    const ratio = contrastRatio(text, ground);
    if (ratio < pair.minimum) {
      failures.push({ mode, text: pair.text, ground: pair.ground, ratio, minimum: pair.minimum, shows: pair.shows });
    }
  }
  return failures;
}
```

`packages/core/scripts/check-contrast.js`:

```js
// Fails when any documented pairing in tokens/tokens.json falls under its WCAG
// minimum in light or dark mode. Run by `pnpm --filter @snapshot-ui/core test`.
import { readFile } from 'node:fs/promises';
import { contrastFailures } from './contrast.js';

const tokens = JSON.parse(await readFile(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));
const light = {};
const dark = {};
for (const [name, token] of Object.entries(tokens.color)) {
  if (name.startsWith('$')) continue;
  light[name] = token.$value;
  dark[name] = token.$extensions?.['snapshot-ui']?.theme?.dark ?? token.$value;
}

const failures = [...contrastFailures(light, 'light'), ...contrastFailures(dark, 'dark')];
for (const f of failures) {
  console.error(
    `${f.mode}: ${f.text} on ${f.ground} measures ${(Math.floor(f.ratio * 100) / 100).toFixed(2)}:1, under ${f.minimum}:1 (${f.shows})`,
  );
}
if (failures.length > 0) process.exit(1);
console.log('contrast: every pairing passes in light and dark');
```

Add to the `scripts` of `packages/core/package.json`:

```json
"check:contrast": "node scripts/check-contrast.js"
```

- [ ] **Step 4: Run the tests and the check**

```bash
pnpm --filter @snapshot-ui/core exec vitest run test/contrast.test.js
pnpm --filter @snapshot-ui/core check:contrast
```

Expected: PASS, 7 tests; then `contrast: every pairing passes in light and dark`.

- [ ] **Step 5: Commit**

```bash
git add packages/core
git commit -m "feat(core): measure every color pairing for WCAG contrast in both themes"
```

### Task 5: Component CSS pipeline, style lint and package exports

**Files:**
- Create: `packages/core/src/styles.css`, `packages/core/src/base.css`, `packages/core/src/components/.gitkeep`
- Create: `packages/core/scripts/build-css.js`
- Create: `packages/core/stylelint/token-only.js`, `packages/core/stylelint.config.js`
- Test: `packages/core/test/token-only.test.js`, `packages/core/test/css.test.js`
- Modify: `packages/core/package.json` (exports, scripts, devDependencies)

**Interfaces:**
- Consumes: `dist/tokens.css` from Task 3.
- Produces the public CSS entry points: `@snapshot-ui/core/styles.css` (tokens and every component), `/tokens.css`, `/base.css`, `/tailwind.css`, `/components/<name>.css`, and the typed `@snapshot-ui/core/tokens`.
- Produces the rule every later CSS task follows. Each new `src/components/<name>.css` starts inside `@layer components {` and passes `pnpm --filter @snapshot-ui/core lint`. Each also gets one line in `src/styles.css`: `@import './components/<name>.css';`. `test/css.test.js` fails on a component file that is not imported.

- [ ] **Step 1: Write the failing tests**

`packages/core/test/token-only.test.js`:

```js
import stylelint from 'stylelint';
import { describe, expect, it } from 'vitest';
import tokenOnly from '../stylelint/token-only.js';

const config = { plugins: [tokenOnly], rules: { 'snapshot-ui/token-only': true } };

async function lint(code) {
  const { results } = await stylelint.lint({ code, config });
  return results.flatMap((r) => r.warnings.map((w) => w.text));
}

describe('snapshot-ui/token-only', () => {
  it.each([
    'border-radius: var(--radius-control);',
    'border-radius: calc(var(--radius-surface) - 4px);',
    'border-radius: 0;',
    'border-top-left-radius: max(0px, calc(var(--radius-control) - 2px));',
    'border-radius: var(--radius-control) / 0;',
    'color: var(--color-ink);',
    'color: currentColor;',
    'background-color: transparent;',
    'border-color: inherit;',
    'box-shadow: var(--shadow-raised);',
    'box-shadow: none;',
    'box-shadow: var(--shadow-raised), var(--shadow-ring);',
    'animation-name: tomato;',
    'outline: 2px solid var(--color-ink);',
  ])('allows %s', async (decl) => {
    expect(await lint(`a { ${decl} }`)).toEqual([]);
  });

  it.each([
    ['border-radius: 20px;', 'literal radius "20px"'],
    ['border-radius: calc(20px - 4px);', 'literal radius'],
    ['border-start-start-radius: 4px;', 'literal radius'],
    ['color: #fff;', 'literal color "#fff"'],
    ['color: rgb(0 0 0 / 50%);', 'literal color "rgb(0 0 0 / 50%)"'],
    ['background: hsl(10deg 50% 50%);', 'literal color "hsl(10deg 50% 50%)"'],
    ['border: 1px solid red;', 'literal color "red"'],
    ['color: var(--color-ink, black);', 'literal color "black"'],
    ['--my-color: oklch(0.5 0.1 200);', 'literal color'],
    ['box-shadow: 0 1px 2px var(--color-ink);', 'literal shadow'],
  ])('rejects %s', async (decl, expected) => {
    const warnings = await lint(`a { ${decl} }`);
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.join('\n')).toContain(expected);
  });

  it('reports the exact message for border-radius: 20px', async () => {
    expect(await lint('.x { border-radius: 20px; }')).toEqual([
      'Unexpected literal radius "20px" in "border-radius". Use 0, var(--radius-*) or calc() with a var(). (snapshot-ui/token-only)',
    ]);
  });
});

describe('the shared config', () => {
  const configFile = new URL('../stylelint.config.js', import.meta.url).pathname;
  const lintWith = async (code) => {
    const { results } = await stylelint.lint({ code, configFile });
    return results.flatMap((r) => r.warnings.map((w) => w.rule));
  };

  it('accepts kebab-case component classes', async () => {
    expect(await lintWith('.button-primary { color: var(--color-ink); }')).toEqual([]);
    expect(await lintWith('.field-label::before { color: var(--color-clay); }')).toEqual([]);
  });

  it('rejects classes that collide with Tailwind utilities or are not kebab-case', async () => {
    expect(await lintWith('.text-big { color: var(--color-ink); }')).toContain('selector-class-pattern');
    expect(await lintWith('.rounded-card { color: var(--color-ink); }')).toContain('selector-class-pattern');
    expect(await lintWith('.buttonPrimary { color: var(--color-ink); }')).toContain('selector-class-pattern');
  });
});
```

`packages/core/test/css.test.js`:

```js
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const components = readdirSync(new URL('../src/components', import.meta.url)).filter((f) => f.endsWith('.css'));

describe('src/styles.css', () => {
  const entry = read('src/styles.css');

  it('imports every component file, and nothing that does not exist', () => {
    const imported = [...entry.matchAll(/@import '\.\/components\/([^']+)';/g)].map((m) => m[1]);
    expect(imported.sort()).toEqual([...components].sort());
  });

  it('declares the layer order before anything else', () => {
    expect(entry.indexOf('@layer theme, base, components, utilities;')).toBeLessThan(entry.indexOf('@import'));
  });
});

describe.each(components)('src/components/%s', (file) => {
  const source = read(`src/components/${file}`);

  it('keeps every rule inside @layer components', () => {
    const withoutComments = source.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    expect(withoutComments.startsWith('@layer components {')).toBe(true);
    expect(withoutComments.endsWith('}')).toBe(true);
  });

  it('honors reduced motion wherever it moves', () => {
    if (/\b(transition|animation)\s*:/.test(source)) {
      expect(source).toContain('prefers-reduced-motion: reduce');
    }
  });

  it('is built to dist', () => {
    expect(existsSync(new URL(`../dist/components/${file}`, import.meta.url))).toBe(true);
  });
});

describe('dist/styles.css', () => {
  const built = read('dist/styles.css');

  it('keeps the layers in order', () => {
    expect(built.indexOf('@layer theme')).toBeGreaterThan(-1);
    if (components.length > 0) {
      expect(built.indexOf('@layer theme')).toBeLessThan(built.indexOf('@layer components'));
    }
  });

  it('is lowered for the browser floor and keeps case-insensitive shape selectors', () => {
    expect(built).not.toMatch(/&[\s.:[]/);
    expect(built).toContain('[data-shape="soft" i]');
    expect(built).not.toContain('--lightningcss');
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `pnpm --filter @snapshot-ui/core exec vitest run test/token-only.test.js test/css.test.js`
Expected: FAIL, `stylelint/token-only.js` and `src/styles.css` do not exist.

- [ ] **Step 3: Write the Stylelint plugin and config**

`packages/core/stylelint/token-only.js`:

```js
// stylelint plugin: snapshot-ui/token-only
// Component CSS may only use design tokens for colors, radii and shadows.
import colorNames from 'color-name';
import valueParser from 'postcss-value-parser';
import stylelint from 'stylelint';

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint;

const ruleName = 'snapshot-ui/token-only';

const messages = ruleMessages(ruleName, {
  color: (value, prop) => `Unexpected literal color "${value}" in "${prop}". Use a color token, e.g. var(--color-ink).`,
  radius: (value, prop) =>
    `Unexpected literal radius "${value}" in "${prop}". Use 0, var(--radius-*) or calc() with a var().`,
  shadow: (value, prop) => `Unexpected literal shadow "${value}" in "${prop}". Use var(--shadow-*).`,
});

const meta = { url: 'https://github.com/amirehsan/snapshot-ui/tree/main/packages/core/stylelint' };

const CSS_WIDE = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);
const ALLOWED_COLOR_WORDS = new Set(['transparent', 'currentcolor', ...CSS_WIDE]);
const NAMED_COLORS = new Set(Object.keys(colorNames));
const COLOR_FUNCTIONS = new Set(['rgb', 'rgba', 'hsl', 'hsla', 'hwb', 'lab', 'lch', 'oklab', 'oklch', 'color']);
const MATH_FUNCTIONS = new Set(['calc', 'min', 'max', 'clamp']);
const HEX = /^#[\da-f]{3,8}$/i;

// Properties where a bare word can be a named color. Hex and color functions
// are checked in every property; named colors only here to avoid false
// positives such as `animation-name: tomato`.
const COLOR_PROPERTY =
  /^(?:--.*|color|background(?:-color)?|border(?:-(?:block|inline|top|right|bottom|left)(?:-(?:start|end))?)?(?:-color)?|outline(?:-color)?|text-decoration(?:-color)?|text-emphasis(?:-color)?|column-rule(?:-color)?|caret-color|accent-color|fill|stroke|box-shadow|text-shadow|scrollbar-color|-webkit-tap-highlight-color|flood-color|lighting-color|stop-color)$/i;
const RADIUS_PROPERTY = /^border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius$/i;
const SHADOW_PROPERTY = /^box-shadow$/i;

const containsVar = (node) =>
  node.type === 'function' && (node.value.toLowerCase() === 'var' || node.nodes.some(containsVar));

/** Collects literal colors anywhere in a parsed value (including var() fallbacks). */
function findLiteralColors(nodes, checkNames, found = []) {
  for (const node of nodes) {
    if (node.type === 'word') {
      const word = node.value.toLowerCase();
      if (HEX.test(word)) found.push(node.value);
      else if (checkNames && NAMED_COLORS.has(word) && !ALLOWED_COLOR_WORDS.has(word)) found.push(node.value);
    } else if (node.type === 'function') {
      const name = node.value.toLowerCase();
      if (COLOR_FUNCTIONS.has(name)) found.push(valueParser.stringify(node));
      else findLiteralColors(node.nodes, checkNames, found);
    }
  }
  return found;
}

/** A radius part is fine when it is 0, a var(), or a math function containing var(). */
function isTokenRadius(node) {
  if (node.type === 'space' || node.type === 'div' || node.type === 'comment') return true;
  if (node.type === 'word') return node.value === '0' || CSS_WIDE.has(node.value.toLowerCase());
  if (node.type !== 'function') return false;
  const name = node.value.toLowerCase();
  if (name === 'var') return true;
  return MATH_FUNCTIONS.has(name) && containsVar(node);
}

function isTokenShadow(nodes) {
  return nodes.every((node) => {
    if (node.type === 'space' || node.type === 'div' || node.type === 'comment') return true;
    if (node.type === 'word') return node.value.toLowerCase() === 'none' || CSS_WIDE.has(node.value.toLowerCase());
    return node.type === 'function' && node.value.toLowerCase() === 'var';
  });
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => (root, result) => {
  if (!validateOptions(result, ruleName, { actual: primary, possible: [true] })) return;

  root.walkDecls((decl) => {
    const parsed = valueParser(decl.value);
    const problem = (message, word) => report({ result, ruleName, node: decl, message, word });

    for (const literal of findLiteralColors(parsed.nodes, COLOR_PROPERTY.test(decl.prop))) {
      problem(messages.color(literal, decl.prop), literal);
    }
    if (RADIUS_PROPERTY.test(decl.prop) && !parsed.nodes.every(isTokenRadius)) {
      problem(messages.radius(decl.value, decl.prop), decl.value);
    }
    if (SHADOW_PROPERTY.test(decl.prop) && !isTokenShadow(parsed.nodes)) {
      problem(messages.shadow(decl.value, decl.prop), decl.value);
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default createPlugin(ruleName, rule);
```

`packages/core/stylelint.config.js`:

```js
// Tailwind utility namespaces. A component class starting with one of these
// would collide with a utility in any app that also uses Tailwind.
const UTILITY_PREFIX =
  '(?:text|bg|border|rounded|shadow|font|ring|outline|fill|stroke|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|w|h|size|min|max|gap|space|divide|inset|top|right|bottom|left|z|opacity|leading|tracking|grid|col|row|flex|sr)';

/** @type {import('stylelint').Config} */
export default {
  plugins: ['./stylelint/token-only.js'],
  rules: {
    'snapshot-ui/token-only': true,
    'selector-class-pattern': [
      `^(?!${UTILITY_PREFIX}-)[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`,
      {
        message:
          'Class names are kebab-case and never start with a Tailwind utility namespace such as text-, bg-, rounded- or p- (selector-class-pattern)',
      },
    ],
  },
};
```

- [ ] **Step 4: Write the stylesheets and the CSS build**

`packages/core/src/styles.css`:

```css
/*
 * The one-line setup: tokens and every component.
 *   import '@snapshot-ui/core/styles.css';
 * The layer order is declared here so it holds with or without Tailwind, whose
 * own declaration names the same four layers in the same order.
 * Every file in ./components must be imported below; test/css.test.js checks.
 */
@layer theme, base, components, utilities;

@import '../dist/tokens.css';
```

`packages/core/src/base.css`:

```css
/*
 * Opt-in page base for an app built on Snapshot UI. Components never depend on
 * it: each sets what it needs. Import it once, at the root, after styles.css.
 */
@layer base {
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  html {
    -webkit-text-size-adjust: 100%;
    text-size-adjust: 100%;
    /* Thin and in the palette: ink at low strength on no track at all. */
    scrollbar-color: var(--color-scrollbar) transparent;
  }

  body {
    margin: 0;
    background-color: var(--color-canvas);
    color: var(--color-ink);
    font-family: var(--font-sans);
    font-size: var(--text-body);
    line-height: var(--text-body--line-height);
    font-weight: var(--text-body--font-weight);
    /* A missing weight never renders as faux bold, kerning is the font's own,
       and greyscale smoothing keeps the 450 weight even in both themes. */
    font-synthesis: none;
    font-kerning: normal;
    font-optical-sizing: auto;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }

  @supports (scrollbar-width: thin) {
    * {
      scrollbar-width: thin;
    }
  }
}
```

Create an empty `packages/core/src/components/.gitkeep` so the folder exists before the first component.

`packages/core/scripts/build-css.js`:

```js
// Bundles src/styles.css -> dist/styles.css and transforms each standalone
// stylesheet (base, components/*) with Lightning CSS. Run after build-tokens.js
// because src/styles.css imports the generated dist/tokens.css.
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { bundleAsync, Features, transform } from 'lightningcss';

const version = (major, minor = 0) => (major << 16) | (minor << 8);
const targets = {
  safari: version(16, 4),
  chrome: version(111),
  firefox: version(128),
};

// tokens.css sets `color-scheme`; without this exclude Lightning CSS injects
// --lightningcss-light/--lightningcss-dark polyfill variables we never use.
const exclude = Features.LightDark;

const write = async (file, code) => {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, code);
  console.log(`wrote ${file} (${code.length} bytes)`);
};

const bundled = await bundleAsync({ filename: 'src/styles.css', targets, exclude, minify: false });
for (const w of bundled.warnings) console.warn(w.message);
await write('dist/styles.css', bundled.code);

/** @type {Array<[from: string, to: string]>} */
const standalone = [
  ['src/base.css', 'dist/base.css'],
  ...(await readdir('src/components'))
    .filter((f) => f.endsWith('.css'))
    .map((f) => /** @type {[string, string]} */ ([`src/components/${f}`, `dist/components/${f}`])),
];
for (const [from, to] of standalone) {
  const { code, warnings } = transform({
    filename: from,
    code: await readFile(from),
    targets,
    exclude,
    minify: false,
  });
  for (const w of warnings) console.warn(w.message);
  await write(to, code);
}

// Type stub for the CSS entry points (package.json maps each CSS export's
// "types" condition here) so `import "@snapshot-ui/core/styles.css"` passes
// TypeScript's noUncheckedSideEffectImports (default on in TS 6/7) without a
// consumer-side `declare module "*.css"`.
await write(
  'dist/css.d.ts',
  '// Side-effect-only stylesheet entry point.\nexport {};\n',
);
```

- [ ] **Step 5: Publish every entry point**

Replace the `exports`, `scripts` and `devDependencies` of `packages/core/package.json`:

```json
"exports": {
  "./styles.css": {
    "types": "./dist/css.d.ts",
    "default": "./dist/styles.css"
  },
  "./tokens.css": {
    "types": "./dist/css.d.ts",
    "default": "./dist/tokens.css"
  },
  "./base.css": {
    "types": "./dist/css.d.ts",
    "default": "./dist/base.css"
  },
  "./tailwind.css": {
    "types": "./dist/css.d.ts",
    "default": "./dist/tailwind.css"
  },
  "./components/*.css": {
    "types": "./dist/css.d.ts",
    "default": "./dist/components/*.css"
  },
  "./tokens": {
    "types": "./dist/tokens.d.ts",
    "default": "./dist/tokens.js"
  },
  "./package.json": "./package.json"
},
"scripts": {
  "build": "node scripts/build-tokens.js && node scripts/build-css.js",
  "test": "pnpm run build && vitest run",
  "check:contrast": "node scripts/check-contrast.js",
  "lint": "stylelint \"src/**/*.css\" && eslint .",
  "typecheck": "tsc --noEmit",
  "check:package": "publint && attw --pack . --profile esm-only"
},
"devDependencies": {
  "@arethetypeswrong/cli": "0.18.5",
  "@tailwindcss/cli": "4.3.3",
  "@types/node": "24.19.2",
  "@typescript/native": "catalog:",
  "color-name": "2.1.1",
  "lightningcss": "1.33.0",
  "postcss-value-parser": "4.2.0",
  "publint": "0.3.25",
  "style-dictionary": "5.6.1",
  "stylelint": "17.16.0",
  "tailwindcss": "4.3.3",
  "typescript": "catalog:",
  "vitest": "5.0.3"
}
```

The `types` condition on every CSS export points at a stub. Without it, TypeScript 6 and 7 reject `import '@snapshot-ui/core/styles.css'` (TS2882), and Are the Types Wrong fails every CSS entry.

- [ ] **Step 6: Run everything for the package**

```bash
pnpm install
pnpm --filter @snapshot-ui/core test
pnpm --filter @snapshot-ui/core lint
pnpm --filter @snapshot-ui/core check:package
```

Expected:
- `test` writes `dist/styles.css`, `dist/base.css` and `dist/css.d.ts`, then every test file passes.
- `lint` prints nothing.
- `check:package` prints `All good!` from publint, and Are the Types Wrong shows green for every entry, with `node10` and CJS ignored.

- [ ] **Step 7: Commit**

```bash
git add packages/core
git commit -m "feat(core): build layered component CSS and enforce tokens in every stylesheet"
```

### Task 6: The React package scaffold

**Files:**
- Create: `packages/react/package.json`, `packages/react/tsconfig.json`, `packages/react/tsconfig.build.json`, `packages/react/tsdown.config.ts`, `packages/react/vitest.config.ts`
- Create: `packages/react/scripts/check-use-client.js`
- Create: `packages/react/test/setup.ts`, `packages/react/test/a11y.ts`
- Create: `packages/react/src/index.ts`, `packages/react/src/utils/cx.ts`
- Test: `packages/react/test/a11y.test.tsx`, `packages/react/src/utils/cx.test.ts`

**Interfaces:**
- Produces `cx(...parts: (string | false | null | undefined)[]): string` in `src/utils/cx.ts`. Joins truthy class names with single spaces.
- Produces `expectNoA11yViolations(container: Element, options?: axe.RunOptions): Promise<void>` in `test/a11y.ts`. Throws a readable report on any axe violation. `color-contrast` and `region` are off, because jsdom has no layout and the rule is page-level; Storybook's browser run covers contrast.
- Produces the component file convention every later React task follows:
  - `src/<name>/<Name>.tsx` starts with `'use client';` and exports the component and its `<Name>Props`.
  - `src/<name>/index.ts` re-exports it.
  - `src/index.ts` re-exports the folder.
  - Tests sit beside the component as `<Name>.test.tsx`, stories as `<Name>.stories.tsx`.
  - Every exported function has an explicit return type. `isolatedDeclarations` requires it for the build.

- [ ] **Step 1: Create the package**

`packages/react/package.json`:

```json
{
  "name": "@snapshot-ui/react",
  "version": "0.0.0",
  "description": "Accessible React components for Snapshot UI, built on React Aria.",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/amirehsan/snapshot-ui.git",
    "directory": "packages/react"
  },
  "homepage": "https://github.com/amirehsan/snapshot-ui#readme",
  "bugs": "https://github.com/amirehsan/snapshot-ui/issues",
  "keywords": ["snapshot-ui", "react", "react-aria", "components", "design-system", "accessibility"],
  "type": "module",
  "sideEffects": false,
  "files": ["dist"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "scripts": {
    "build": "tsdown && node scripts/check-use-client.js",
    "lint": "eslint .",
    "test": "vitest run",
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.build.json",
    "check:package": "publint && attw --pack . --profile esm-only"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "lucide-react": "^1.55.0",
    "react-aria-components": "^1.22.1"
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "0.18.5",
    "@storybook/react-vite": "10.6.1",
    "@testing-library/dom": "10.4.2",
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@testing-library/user-event": "14.6.7",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "catalog:",
    "axe-core": "4.14.0",
    "jsdom": "30.1.2",
    "publint": "0.3.25",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "storybook": "10.6.1",
    "tsdown": "0.23.1",
    "typescript": "catalog:",
    "vitest": "5.0.3"
  }
}
```

`storybook` and `@storybook/react-vite` are here because the stories live in this package. pnpm resolves a story's imports from its own folder.

`packages/react/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "include": ["src", "test", "*.config.ts"]
}
```

`packages/react/tsconfig.build.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "isolatedDeclarations": true
  },
  "include": ["src"],
  "exclude": ["src/**/*.stories.tsx", "src/**/*.test.tsx", "src/**/*.test.ts"]
}
```

`isolatedDeclarations` is only in the build config. In the shared one it would fail every `export default defineConfig(...)` and every story file (TS9037).

`packages/react/tsdown.config.ts`:

```ts
import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  tsconfig: 'tsconfig.build.json',
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  // One output module per source module. This is what keeps each file's
  // "use client" directive; bundled mode strips it.
  unbundle: true,
  dts: true,
  // true emits a .d.ts.map reference with no map file.
  sourcemap: false,
  // Rolldown warns about every directive it cannot vouch for when bundling.
  // scripts/check-use-client.js verifies the output instead.
  suppressWarnings: [/MODULE_LEVEL_DIRECTIVE/],
  deps: {
    neverBundle: [/^react($|\/)/, /^react-dom($|\/)/, /^react-aria-components($|\/)/, /^lucide-react($|\/)/],
  },
});
```

`packages/react/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'test/**/*.test.tsx'],
  },
});
```

Run: `pnpm install`

- [ ] **Step 2: Write the failing tests**

`packages/react/src/utils/cx.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cx } from './cx';

describe('cx', () => {
  it('joins truthy class names with single spaces', () => {
    expect(cx('a', undefined, 'b', false, null, '', 'c')).toBe('a b c');
  });

  it('returns an empty string when there is nothing to join', () => {
    expect(cx()).toBe('');
  });
});
```

`packages/react/test/a11y.test.tsx`:

```tsx
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from './a11y';

describe('expectNoA11yViolations', () => {
  it('fails on an image without alt text', async () => {
    // eslint-disable-next-line jsx-a11y/alt-text -- the violation under test
    const { container } = render(<img src="x.png" />);
    await expect(expectNoA11yViolations(container)).rejects.toThrow(/image-alt/);
  });

  it('passes on accessible markup', async () => {
    const { container } = render(<img src="x.png" alt="A cat" />);
    await expectNoA11yViolations(container);
  });
});
```

Run: `pnpm --filter @snapshot-ui/react test`
Expected: FAIL, `./cx`, `./a11y` and `./test/setup.ts` are missing.

- [ ] **Step 3: Write the helpers**

`packages/react/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only cleans up on its own when vitest globals are on.
afterEach(() => {
  cleanup();
});
```

`packages/react/test/a11y.ts`:

```ts
import axe from 'axe-core';

// Rules that cannot work in a DOM emulator, which has no layout, or that only
// make sense for a whole page rather than one component.
const COMPONENT_RULES: axe.RunOptions['rules'] = {
  'color-contrast': { enabled: false },
  region: { enabled: false },
};

/** Runs axe-core on `container` and fails with a readable report on any violation. */
export async function expectNoA11yViolations(container: Element, options: axe.RunOptions = {}): Promise<void> {
  const { violations } = await axe.run(container, {
    ...options,
    rules: { ...COMPONENT_RULES, ...options.rules },
  });
  if (violations.length === 0) return;
  const report = violations
    .map((v) => `- ${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n${v.nodes.map((n) => `    ${n.html}`).join('\n')}`)
    .join('\n');
  throw new Error(`Expected no axe violations, found ${String(violations.length)}:\n${report}`);
}
```

`packages/react/src/utils/cx.ts`:

```ts
/** Joins class names, skipping empty values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ');
}
```

`packages/react/src/index.ts`:

```ts
// Components are added here as they are built.
export {};
```

- [ ] **Step 4: Run the tests again**

Run: `pnpm --filter @snapshot-ui/react test`
Expected: PASS, 4 tests.

- [ ] **Step 5: Write the "use client" guard**

`packages/react/scripts/check-use-client.js`:

```js
// Two guarantees a Next.js App Router consumer needs from this package:
// 1. every source module that imports react-aria-components declares
//    'use client', because React Aria throws when a server component imports it;
// 2. the build kept that directive as the first statement of the emitted file.
import { glob, readFile } from 'node:fs/promises';

const DIRECTIVE = /^['"]use client['"];/;
let failed = false;

for await (const src of glob(['src/**/*.ts', 'src/**/*.tsx'])) {
  if (/\.(test|stories)\.tsx?$/.test(src)) continue;
  const code = await readFile(src, 'utf8');
  const declares = DIRECTIVE.test(code);
  if (/from ['"]react-aria-components/.test(code) && !declares) {
    console.error(`${src} imports react-aria-components without 'use client'`);
    failed = true;
    continue;
  }
  if (!declares) continue;
  const out = src.replace(/^src\//, 'dist/').replace(/\.tsx?$/, '.js');
  const emitted = await readFile(out, 'utf8').catch(() => '');
  if (!DIRECTIVE.test(emitted)) {
    console.error(`${out} lost its 'use client' directive`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('check-use-client: every client module keeps its directive');
```

- [ ] **Step 6: Prove the guard catches a missing directive**

```bash
cd packages/react
printf "import { Button } from 'react-aria-components';\nexport const Probe = Button;\n" > src/probe.ts
node scripts/check-use-client.js; echo "exit $?"
rm src/probe.ts
cd ../..
```

Expected: `src/probe.ts imports react-aria-components without 'use client'` and `exit 1`.

- [ ] **Step 7: Build, type-check, lint and verify the package**

```bash
pnpm --filter @snapshot-ui/react build
pnpm --filter @snapshot-ui/react typecheck
pnpm --filter @snapshot-ui/react lint
pnpm --filter @snapshot-ui/react check:package
```

Expected: the build ends with `check-use-client: every client module keeps its directive`. The type-check and lint print nothing. publint prints `All good!`, and Are the Types Wrong is green for `node16 (from ESM)` and `bundler`.

- [ ] **Step 8: Commit**

```bash
git add packages/react
git commit -m "feat(react): scaffold the package with tests, an axe helper and the use client guard"
```

### Task 7: Spinner

**Files:**
- Create: `packages/core/src/components/spinner.css`
- Modify: `packages/core/src/styles.css` (import it)
- Create: `packages/react/src/spinner/Spinner.tsx`, `packages/react/src/spinner/index.ts`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/spinner/Spinner.test.tsx`
- Modify: `docs/design-system.md` (append `## Spinner` to Appendix B)

**Interfaces:**
- Consumes: `cx` from Task 6, the token variables from Task 3.
- Produces: `Spinner(props: SpinnerProps): ReactElement`, `type SpinnerSize = 'inline' | 'md' | 'lg'`. `SpinnerProps` is React Aria's `ProgressBarProps` without the value props, plus `size?: SpinnerSize` and `ref?: Ref<HTMLDivElement>`. `aria-label` defaults to `'Loading'`.
- Produces the classes `spinner`, `spinner-md`, `spinner-lg`, `spinner-svg`, `spinner-track` and `spinner-arc`. Button uses `<Spinner className="button-spinner" />` in Task 8.

- [ ] **Step 1: Record the derivation**

The design system specifies no loading state, so derive it before building. Append to `docs/design-system.md`:

```markdown

## Spinner

The document specifies no loading state. This one is derived from the orbit,
the system's one moving shape.

- A 3px ring at 25% of the current color, with a quarter arc at full strength
  turning every 900ms.
- Round line caps. The ends of a stroke are dots, and dots stay round in every
  shape.
- It takes the color and size of the text around it, 1em, so inside a button it
  is the label's own color and needs no variant. Two fixed sizes serve standalone
  use: 24px, and 40px, the touch-target floor of whatever it stands in for.
- Under reduced motion it slows to a 2.4 second turn rather than stopping. A
  still spinner reads as finished.
- It is announced as an indeterminate progress bar named "Loading" unless it is
  given a name.
```

- [ ] **Step 2: Write the failing test**

`packages/react/src/spinner/Spinner.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('is an indeterminate progress bar named Loading by default', async () => {
    const { container } = render(<Spinner />);
    const spinner = screen.getByRole('progressbar', { name: 'Loading' });
    expect(spinner).not.toHaveAttribute('aria-valuenow');
    expect(spinner).toHaveClass('spinner');
    await expectNoA11yViolations(container);
  });

  it('takes a custom accessible name', () => {
    render(<Spinner aria-label="Saving changes" />);
    expect(screen.getByRole('progressbar', { name: 'Saving changes' })).toBeInTheDocument();
  });

  it.each([
    ['inline', 'spinner'],
    ['md', 'spinner spinner-md'],
    ['lg', 'spinner spinner-lg'],
  ] as const)('size %s renders class "%s"', (size, expected) => {
    render(<Spinner size={size} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('class', expected);
  });

  it('hides its drawing from assistive technology', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges a custom className', () => {
    render(<Spinner className="extra" />);
    expect(screen.getByRole('progressbar')).toHaveClass('spinner', 'extra');
  });
});
```

Run: `pnpm --filter @snapshot-ui/react exec vitest run src/spinner`
Expected: FAIL, `./Spinner` does not exist.

- [ ] **Step 3: Write the CSS**

`packages/core/src/components/spinner.css`:

```css
/*
 * Spinner. The loading state the design system leaves unspecified, derived in
 * docs/design-system.md ("Spinner"): a 3px ring at 25% of the current color
 * with a quarter arc in full, round caps because the ends of a stroke are
 * dots and dots stay round in every shape. It takes the color and size of the
 * text around it, so inside a button it is the button's own label color.
 */
@layer components {
  .spinner {
    box-sizing: border-box;
    display: inline-block;
    flex: none;
    width: 1em;
    height: 1em;
    color: inherit;
    vertical-align: -0.125em;
  }

  .spinner-md {
    width: 24px;
    height: 24px;
  }

  .spinner-lg {
    width: 40px;
    height: 40px;
  }

  .spinner-svg {
    display: block;
    width: 100%;
    height: 100%;
    animation: spinner-turn 900ms linear infinite;
  }

  .spinner-track {
    stroke: currentColor;
    opacity: 0.25;
  }

  .spinner-arc {
    stroke: currentColor;
    stroke-linecap: round;
  }

  /*
   * Slower, never stopped: a spinner that stands still reads as finished,
   * and loading is the one motion here that carries information.
   */
  @media (prefers-reduced-motion: reduce) {
    .spinner-svg {
      animation-duration: 2400ms;
    }
  }

  @keyframes spinner-turn {
    to {
      transform: rotate(360deg);
    }
  }
}
```

Add to `packages/core/src/styles.css`, after the tokens import:

```css
@import './components/spinner.css';
```

- [ ] **Step 4: Write the component**

`packages/react/src/spinner/Spinner.tsx`:

```tsx
'use client';

import type { ReactElement, Ref } from 'react';
import { ProgressBar, type ProgressBarProps, composeRenderProps } from 'react-aria-components';
import { cx } from '../utils/cx';

export type SpinnerSize = 'inline' | 'md' | 'lg';

export interface SpinnerProps
  extends Omit<
    ProgressBarProps,
    'isIndeterminate' | 'value' | 'minValue' | 'maxValue' | 'valueLabel' | 'formatOptions' | 'children'
  > {
  /**
   * `inline` follows the surrounding font size; `md` is 24px and `lg` is 40px.
   * @default 'inline'
   */
  size?: SpinnerSize;
  ref?: Ref<HTMLDivElement>;
}

/** An indeterminate loading indicator, announced as a progress bar. */
export function Spinner({
  size = 'inline',
  className,
  'aria-label': ariaLabel = 'Loading',
  ...props
}: SpinnerProps): ReactElement {
  return (
    <ProgressBar
      {...props}
      aria-label={ariaLabel}
      isIndeterminate
      className={composeRenderProps(className, (userClassName) =>
        cx('spinner', size !== 'inline' && `spinner-${size}`, userClassName),
      )}
    >
      <svg className="spinner-svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="spinner-track" cx="12" cy="12" r="9" strokeWidth="3" />
        <circle className="spinner-arc" cx="12" cy="12" r="9" strokeWidth="3" strokeDasharray="14 57" />
      </svg>
    </ProgressBar>
  );
}
```

`packages/react/src/spinner/index.ts`:

```ts
export { Spinner, type SpinnerProps, type SpinnerSize } from './Spinner';
```

Replace `packages/react/src/index.ts`:

```ts
export { Spinner, type SpinnerProps, type SpinnerSize } from './spinner';
```

- [ ] **Step 5: Run the tests and the package checks**

```bash
pnpm --filter @snapshot-ui/react exec vitest run src/spinner
pnpm --filter @snapshot-ui/core test
pnpm --filter @snapshot-ui/core lint
pnpm --filter @snapshot-ui/react build
```

Expected: 7 Spinner tests pass. The core tests now include `src/components/spinner.css`, which must be imported, layered, motion-safe and built. Lint is clean. The React build prints `ok` for `dist/spinner/Spinner.js`.

- [ ] **Step 6: Commit**

```bash
git add packages docs/design-system.md
git commit -m "feat: add Spinner"
```

### Task 8: Button

**Files:**
- Create: `packages/core/src/components/button.css`
- Modify: `packages/core/src/styles.css`
- Create: `packages/react/src/button/Button.tsx`, `packages/react/src/button/index.ts`
- Modify: `packages/react/src/index.ts`
- Test: `packages/react/src/button/Button.test.tsx`

**Interfaces:**
- Consumes: `Spinner` from Task 7, `cx` from Task 6.
- Produces: `Button(props: ButtonProps): ReactElement`, `type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger'`. `ButtonProps` is React Aria's `ButtonProps` plus `variant?: ButtonVariant` (default `'primary'`), `pendingLabel?: string` (default `'Loading'`) and `ref?: Ref<HTMLButtonElement>`.
- Produces the classes `button`, `button-primary`, `button-secondary`, `button-tertiary`, `button-danger`, `button-label` and `button-spinner`. Each variant only sets the `--button-bg`, `--button-fg`, `--button-border` custom properties and their `-active` counterparts. Phase 1b's icon button reuses the same pattern.

Source values come from the source app's `src/snapshot/styles/primitives/button.css` and the danger variant in `src/snapshot/styles/primitives/dialog.css`. Two corrections are recorded in Appendix B: the cursor rule, and the secondary hover wash, because the source's Lifted step is invisible in dark.

- [ ] **Step 1: Write the failing test**

`packages/react/src/button/Button.test.tsx`:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Button } from './Button';

describe('Button', () => {
  it('renders a primary button by default', async () => {
    const { container } = render(<Button>Save</Button>);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveClass('button', 'button-primary');
    await expectNoA11yViolations(container);
  });

  it.each(['secondary', 'tertiary', 'danger'] as const)('renders the %s variant class', (variant) => {
    render(<Button variant={variant}>Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('button', `button-${variant}`);
  });

  it('fires onPress on click, Enter and Space', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(<Button onPress={onPress}>Save</Button>);
    await user.click(screen.getByRole('button'));
    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
  });

  it('does not fire onPress when disabled', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    render(
      <Button isDisabled onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('stays focusable while pending, ignores presses and shows a named spinner', async () => {
    const user = userEvent.setup();
    const onPress = vi.fn();
    const { container } = render(
      <Button isPending pendingLabel="Saving" onPress={onPress}>
        Save
      </Button>,
    );
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-pending', 'true');
    expect(button).not.toBeDisabled();
    expect(screen.getByRole('progressbar', { name: 'Saving' })).toBeInTheDocument();
    await user.click(button);
    expect(onPress).not.toHaveBeenCalled();
    await user.tab();
    await user.tab({ shift: true });
    expect(button).toHaveFocus();
    await expectNoA11yViolations(container);
  });

  it('keeps the label in the accessible name while pending', () => {
    render(<Button isPending>Save</Button>);
    expect(screen.getByRole('button').textContent).toContain('Save');
  });

  it('submits a native form', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Button type="submit">Send</Button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('does not submit its form while pending', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    render(
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <Button type="submit" isPending>
          Send
        </Button>
      </form>,
    );
    await user.click(screen.getByRole('button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('forwards data attributes, so a button can carry its own theme', () => {
    render(<Button data-theme="dark">Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('data-theme', 'dark');
  });

  it('forwards a ref to the button element', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Save</Button>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('merges a custom className', () => {
    render(<Button className="extra">Save</Button>);
    expect(screen.getByRole('button')).toHaveClass('button', 'button-primary', 'extra');
  });
});
```

Run: `pnpm --filter @snapshot-ui/react exec vitest run src/button`
Expected: FAIL, `./Button` does not exist.

- [ ] **Step 2: Write the CSS**

`packages/core/src/components/button.css`:

```css
/*
 * Button, from the design system's pill specifications: the Ink Pill
 * (primary) and the Outlined Pill (secondary), plus a borderless tertiary for
 * the recessive action beside a primary and an error-filled danger for
 * destructive confirmation. Signal Orange is not a variant: it is reserved
 * for consent and legal actions.
 *
 * Each variant only sets the --button-* properties; the states below read
 * them, so a state never needs one rule per variant.
 */
@layer components {
  .button {
    --button-bg: var(--color-ink);
    --button-fg: var(--color-canvas);
    --button-border: var(--color-ink);
    --button-bg-active: var(--color-charcoal);
    --button-fg-active: var(--color-canvas);
    --button-border-active: var(--color-charcoal);

    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--spacing-part);
    /* The document's 6px by 24px padding makes a 31px pill; its own touch
       target rule says no button drops below 40px. The padding sets the
       shape and this sets the target. */
    min-height: 40px;
    margin: 0;
    padding-block: 0.375rem;
    padding-inline: 1.5rem;
    border: 1.5px solid var(--button-border);
    border-radius: var(--radius-control);
    background-color: var(--button-bg);
    color: var(--button-fg);
    font-family: var(--font-sans);
    font-size: var(--text-action);
    line-height: var(--text-action--line-height);
    letter-spacing: var(--text-action--letter-spacing);
    font-weight: var(--text-action--font-weight);
    text-decoration: none;
    white-space: nowrap;
    cursor: pointer;
    user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  .button-secondary {
    /* Float rather than white, so on a dark surface it is the document's dark
       secondary: the surface's own fill with a white outline. */
    --button-bg: var(--color-float);
    --button-fg: var(--color-ink);
    --button-border: var(--color-ink);
    /* A wash of ink over float. The source's lifted step was invisible in dark,
       where lifted and float are the same color. */
    --button-bg-active: color-mix(in srgb, var(--color-ink) 5%, var(--color-float));
    --button-fg-active: var(--color-ink);
    --button-border-active: var(--color-ink);

    font-weight: 450;
  }

  .button-tertiary {
    --button-bg: transparent;
    --button-fg: var(--color-slate);
    --button-border: transparent;
    --button-bg-active: transparent;
    --button-fg-active: var(--color-ink);
    --button-border-active: transparent;
  }

  .button-danger {
    --button-bg: var(--color-error);
    --button-fg: var(--color-canvas);
    --button-border: var(--color-error);
    --button-bg-active: color-mix(in srgb, var(--color-error) 85%, var(--color-ink));
    --button-fg-active: var(--color-canvas);
    --button-border-active: color-mix(in srgb, var(--color-error) 85%, var(--color-ink));
  }

  .button-label {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-part);
  }

  @media (hover: hover) {
    .button:is(:hover, [data-hovered]):not(:disabled, [data-disabled], [aria-disabled="true"]) {
      border-color: var(--button-border-active);
      background-color: var(--button-bg-active);
      color: var(--button-fg-active);
    }
  }

  /* The document's press is a subtle compression; Snapshot uses the same color
     step as hover instead, since touch has no hover to show it. */
  .button:is(:active, [data-pressed]):not(:disabled, [data-disabled], [aria-disabled="true"]) {
    border-color: var(--button-border-active);
    background-color: var(--button-bg-active);
    color: var(--button-fg-active);
  }

  /* Outside the pill, so ink still reads against the page behind an ink fill. */
  .button:is(:focus-visible, [data-focus-visible]) {
    outline: var(--focus-ring-width) solid var(--color-ink);
    outline-offset: var(--focus-ring-offset);
  }

  .button:is(:disabled, [data-disabled]) {
    border-color: color-mix(in srgb, var(--color-ink) 15%, transparent);
    background-color: var(--color-disabled);
    color: var(--color-taupe);
    cursor: not-allowed;
  }

  .button-tertiary:is(:disabled, [data-disabled]) {
    border-color: transparent;
    background-color: transparent;
  }

  /* Pending keeps its fill and its width: the label turns invisible but stays
     in the accessibility tree, and the spinner sits over where it was. */
  .button[data-pending] {
    cursor: progress;
  }

  .button[data-pending] .button-label {
    opacity: 0;
  }

  .button-spinner {
    position: absolute;
    inset: 0;
    margin: auto;
  }
}
```

Add to `packages/core/src/styles.css`:

```css
@import './components/button.css';
```

- [ ] **Step 3: Write the component**

`packages/react/src/button/Button.tsx`:

```tsx
'use client';

import type { ReactElement, Ref } from 'react';
import {
  Button as RACButton,
  type ButtonProps as RACButtonProps,
  composeRenderProps,
} from 'react-aria-components';
import { Spinner } from '../spinner/Spinner';
import { cx } from '../utils/cx';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'danger';

export interface ButtonProps extends RACButtonProps {
  /**
   * Visual emphasis. Signal orange is deliberately not a variant: it is
   * reserved for consent and legal actions.
   * @default 'primary'
   */
  variant?: ButtonVariant;
  /**
   * Accessible name of the spinner shown while `isPending`.
   * @default 'Loading'
   */
  pendingLabel?: string;
  ref?: Ref<HTMLButtonElement>;
}

/** A pressable action. Built on React Aria's Button. */
export function Button({
  variant = 'primary',
  pendingLabel = 'Loading',
  className,
  children,
  ...props
}: ButtonProps): ReactElement {
  return (
    <RACButton
      {...props}
      className={composeRenderProps(className, (userClassName) =>
        cx('button', `button-${variant}`, userClassName),
      )}
    >
      {composeRenderProps(children, (resolved, { isPending }) => (
        <>
          <span className="button-label">{resolved}</span>
          {isPending ? <Spinner className="button-spinner" aria-label={pendingLabel} /> : null}
        </>
      ))}
    </RACButton>
  );
}
```

`packages/react/src/button/index.ts`:

```ts
export { Button, type ButtonProps, type ButtonVariant } from './Button';
```

Replace `packages/react/src/index.ts`:

```ts
export { Button, type ButtonProps, type ButtonVariant } from './button';
export { Spinner, type SpinnerProps, type SpinnerSize } from './spinner';
```

- [ ] **Step 4: Run everything**

```bash
pnpm --filter @snapshot-ui/react test
pnpm --filter @snapshot-ui/react typecheck
pnpm --filter @snapshot-ui/react lint
pnpm --filter @snapshot-ui/core test
pnpm --filter @snapshot-ui/core lint
pnpm build
```

Expected:
- React: 24 tests pass: 13 for Button, 7 for Spinner, 2 for the axe helper and 2 for `cx`.
- Type-check and lint print nothing.
- Core tests pass with both component files.
- `pnpm build` ends with `ok` lines for `Button.js` and `Spinner.js`.

- [ ] **Step 5: Commit**

```bash
git add packages
git commit -m "feat: add Button with primary, secondary, tertiary, danger and pending states"
```

### Task 9: Storybook and the first stories

**Files:**
- Create: `apps/storybook/package.json`, `apps/storybook/tsconfig.json`, `apps/storybook/vitest.config.ts`
- Create: `apps/storybook/.storybook/main.ts`, `apps/storybook/.storybook/preview.tsx`
- Create: `packages/react/src/spinner/Spinner.stories.tsx`, `packages/react/src/button/Button.stories.tsx`

**Interfaces:**
- Consumes: `@snapshot-ui/core/styles.css`, `@snapshot-ui/core/base.css`, `Button`, `Spinner`.
- Produces: toolbar globals `theme` (`light` | `dark`) and `shape` (`rounded` | `soft` | `square`), applied to `<html>` as `data-theme` and `data-shape`. Visual tests open stories as `iframe.html?id=<id>&viewMode=story&globals=theme:<theme>;shape:<shape>`.
- Produces the story convention: title `Components/<Name>`, one export per variant and state. A story tagged `no-visual` is skipped by the visual tests. Interaction stories use `play` with `storybook/test`.

- [ ] **Step 1: Create the app**

`apps/storybook/package.json`:

```json
{
  "name": "@snapshot-ui/storybook",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "storybook dev -p 6006",
    "build": "storybook build -o storybook-static",
    "test": "vitest run --project=storybook",
    "typecheck": "tsc --noEmit",
    "lint": "eslint ."
  },
  "dependencies": {
    "@fontsource-variable/sofia-sans": "5.3.0",
    "@snapshot-ui/core": "workspace:*",
    "@snapshot-ui/react": "workspace:*"
  },
  "devDependencies": {
    "@playwright/test": "1.64.0",
    "@storybook/addon-a11y": "10.6.1",
    "@storybook/addon-docs": "10.6.1",
    "@storybook/addon-vitest": "10.6.1",
    "@storybook/react-vite": "10.6.1",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "catalog:",
    "@vitest/browser": "5.0.3",
    "@vitest/browser-playwright": "5.0.3",
    "http-server": "14.1.1",
    "playwright": "1.64.0",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "storybook": "10.6.1",
    "typescript": "catalog:",
    "vite": "8.3.4",
    "vitest": "5.0.3"
  }
}
```

`apps/storybook/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "types": ["node", "vite/client"]
  },
  "include": [".storybook/**/*.ts", ".storybook/**/*.tsx", "*.config.ts", "tests/**/*.ts"]
}
```

The `.storybook` folder is listed by explicit globs. A bare `".storybook"` include silently matches nothing.

`apps/storybook/.storybook/main.ts`:

```ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../../../packages/react/src/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  typescript: {
    // Babel based, so it needs no TypeScript JS API and works with TypeScript 7.
    reactDocgen: 'react-docgen',
  },
};

export default config;
```

`apps/storybook/.storybook/preview.tsx`:

```tsx
import type { Decorator, Preview } from '@storybook/react-vite';
import '@fontsource-variable/sofia-sans';
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';

/** Applies the toolbar globals to <html>, so tokens, the page background and portals all follow. */
const withTokens: Decorator = (Story, { globals }) => {
  const root = document.documentElement;
  root.dataset.theme = String(globals.theme ?? 'light');
  root.dataset.shape = String(globals.shape ?? 'rounded');
  return <Story />;
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color mode',
      toolbar: {
        title: 'Theme',
        icon: 'mirror',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
    shape: {
      description: 'Corner shape',
      toolbar: {
        title: 'Shape',
        icon: 'component',
        items: [
          { value: 'rounded', title: 'Rounded' },
          { value: 'soft', title: 'Soft' },
          { value: 'square', title: 'Square' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    theme: 'light',
    shape: 'rounded',
  },
  decorators: [withTokens],
  parameters: {
    layout: 'centered',
    // Story tests fail on any axe violation, including color contrast, which
    // a real browser can measure.
    a11y: { test: 'error' },
  },
  tags: ['autodocs'],
};

export default preview;
```

`apps/storybook/vitest.config.ts`:

```ts
import path from 'node:path';
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        plugins: [storybookTest({ configDir: path.join(import.meta.dirname, '.storybook') })],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
    ],
  },
});
```

Run:

```bash
pnpm install
pnpm --filter @snapshot-ui/storybook exec playwright install chromium
```

- [ ] **Step 2: Write the stories**

`packages/react/src/spinner/Spinner.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Inline, it takes the size and color of the text around it. */
export const Inline: Story = {
  render: (args) => (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 16 }}>
      Saving <Spinner {...args} />
    </span>
  ),
};

export const Medium: Story = { args: { size: 'md' } };

export const Large: Story = { args: { size: 'lg' } };
```

`packages/react/src/button/Button.stories.tsx`:

```tsx
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn } from 'storybook/test';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  args: { children: 'Save changes', onPress: fn() },
  argTypes: {
    variant: { control: 'inline-radio', options: ['primary', 'secondary', 'tertiary', 'danger'] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = { args: { variant: 'secondary', children: 'Preview' } };

export const Tertiary: Story = { args: { variant: 'tertiary', children: 'Discard' } };

export const Danger: Story = { args: { variant: 'danger', children: 'Delete site' } };

export const Disabled: Story = { args: { isDisabled: true } };

export const Pending: Story = { args: { isPending: true, pendingLabel: 'Saving' } };

export const Pressed: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));
    await expect(args.onPress).toHaveBeenCalledOnce();
  },
};

/** The ring sits outside the pill, so ink still reads against the page. */
export const KeyboardFocus: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button')).toHaveFocus();
  },
};

/** A light card inside a dark page takes its own tokens and its own text color. */
export const NestedThemes: Story = {
  render: (args) => (
    <div data-theme="dark" style={{ padding: 24, background: 'var(--color-canvas)' }}>
      <Button {...args} />
      <div data-theme="light" style={{ marginTop: 16, padding: 24, background: 'var(--color-lifted)' }}>
        <p data-testid="nested-text" style={{ margin: '0 0 12px' }}>
          A light card inside a dark page
        </p>
        <Button {...args} variant="secondary" />
      </div>
    </div>
  ),
};
```

- [ ] **Step 3: Build Storybook and run the story tests**

```bash
pnpm --filter @snapshot-ui/storybook build
pnpm --filter @snapshot-ui/storybook test
```

Expected: the build ends with `Storybook build completed successfully`. It warns once per `"use client"` file that the directive may not be preserved, which is harmless for a static site. The story tests pass: 12 stories, each rendered in Chromium with an axe check.

- [ ] **Step 4: Check that a broken story fails**

Temporarily add to `Button.stories.tsx`:

```tsx
export const Broken: Story = { render: () => <img src="x.png" /> };
```

Run `pnpm --filter @snapshot-ui/storybook test`. Expected: FAIL, naming `image-alt`. Remove the story.

- [ ] **Step 5: Type-check, lint and commit**

```bash
pnpm --filter @snapshot-ui/storybook typecheck
pnpm --filter @snapshot-ui/storybook lint
pnpm --filter @snapshot-ui/react lint
git add apps/storybook packages/react/src
git commit -m "feat(storybook): add the workshop with theme and shape switches and the first stories"
```

### Task 10: Visual regression

**Files:**
- Create: `apps/storybook/playwright.config.ts`
- Create: `apps/storybook/tests/visual/stories.spec.ts`, `apps/storybook/tests/visual/cascade.spec.ts`
- Create: `apps/storybook/scripts/visual-docker.sh`
- Create: `apps/storybook/tests/visual/__screenshots__/` (generated baselines, committed)
- Modify: `apps/storybook/package.json` (scripts)

**Interfaces:**
- Consumes: `apps/storybook/storybook-static/` from Task 9's build, and the story ids it lists in `index.json`.
- Produces: one baseline per story and mode, named `<story-id>--<theme>-<shape>[-375].png`. Modes are Rounded light, Rounded dark, Soft light, Square light at 1280px, and Rounded light at 375px.
- Produces the scripts `test:visual` (compare) and `visual:docker` (regenerate in the CI image). Every later component task runs `visual:docker` after adding stories.

- [ ] **Step 1: Write the cascade test, which pins computed styles rather than pixels**

`apps/storybook/tests/visual/cascade.spec.ts`:

```ts
import { expect, test } from '@playwright/test';

const story = (id: string, theme: string, shape: string) =>
  `/iframe.html?id=${id}&viewMode=story&globals=theme:${theme};shape:${shape}`;

const ready = async (page: import('@playwright/test').Page) => {
  await page.waitForFunction(() => {
    const phase = (window as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
      .__STORYBOOK_PREVIEW__?.currentRender?.phase;
    return phase === 'completed' || phase === 'finished';
  });
};

test('a light card inside a dark page takes light text', async ({ page }) => {
  await page.goto(story('components-button--nested-themes', 'light', 'rounded'));
  await ready(page);
  const text = page.getByTestId('nested-text');
  await expect(text).toHaveCSS('color', 'rgb(20, 20, 19)');
  const dark = page.locator('[data-theme="dark"]').first();
  await expect(dark).toHaveCSS('background-color', 'rgb(14, 14, 13)');
});

for (const [shape, radius] of [
  ['rounded', '20px'],
  ['soft', '10px'],
  ['square', '0px'],
] as const) {
  test(`a button takes the ${shape} control radius`, async ({ page }) => {
    await page.goto(story('components-button--primary', 'light', shape));
    await ready(page);
    await expect(page.getByRole('button', { name: 'Save changes' })).toHaveCSS('border-top-left-radius', radius);
  });
}
```

- [ ] **Step 2: Write the screenshot test**

`apps/storybook/tests/visual/stories.spec.ts`:

```ts
import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';

interface IndexEntry {
  id: string;
  type: 'story' | 'docs';
  tags?: string[];
}

// storybook-static must be built first.
const index = JSON.parse(
  readFileSync(new URL('../../storybook-static/index.json', import.meta.url), 'utf8'),
) as { entries: Record<string, IndexEntry> };

const stories = Object.values(index.entries).filter(
  (entry) => entry.type === 'story' && !entry.tags?.includes('no-visual'),
);

const modes = [
  { theme: 'light', shape: 'rounded', width: 1280 },
  { theme: 'dark', shape: 'rounded', width: 1280 },
  { theme: 'light', shape: 'soft', width: 1280 },
  { theme: 'light', shape: 'square', width: 1280 },
  { theme: 'light', shape: 'rounded', width: 375 },
] as const;

for (const story of stories) {
  for (const { theme, shape, width } of modes) {
    const suffix = width === 1280 ? '' : `-${width}`;
    test(`${story.id} [${theme}/${shape}${suffix}]`, async ({ page }) => {
      await page.setViewportSize({ width, height: 720 });
      await page.goto(`/iframe.html?id=${story.id}&viewMode=story&globals=theme:${theme};shape:${shape}`);
      await page.waitForFunction(() => {
        const phase = (window as { __STORYBOOK_PREVIEW__?: { currentRender?: { phase?: string } } })
          .__STORYBOOK_PREVIEW__?.currentRender?.phase;
        return phase === 'completed' || phase === 'finished';
      });
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.locator('html')).toHaveAttribute('data-shape', shape);
      await expect(page).toHaveScreenshot(`${story.id}--${theme}-${shape}${suffix}.png`);
    });
  }
}
```

- [ ] **Step 3: Configure Playwright**

`apps/storybook/playwright.config.ts`:

```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = 6007;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests/visual',
  // No {platform} in the path: baselines are only ever made in the CI image.
  snapshotPathTemplate: '{testDir}/__screenshots__/{arg}{ext}',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    colorScheme: 'light',
  },
  expect: {
    toHaveScreenshot: { animations: 'disabled', caret: 'hide', maxDiffPixelRatio: 0.001 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // Plain node, so the same command runs on a laptop and inside the CI image.
    command: `node node_modules/http-server/bin/http-server storybook-static -a 127.0.0.1 -p ${PORT} -s -c-1`,
    url: `http://127.0.0.1:${PORT}/index.json`,
    reuseExistingServer: !isCI,
  },
});
```

- [ ] **Step 4: Write the Docker script**

`apps/storybook/scripts/visual-docker.sh`:

```bash
#!/usr/bin/env bash
# Runs the visual tests inside the exact image CI uses, so a baseline never
# differs from CI by font rasterizing or architecture. Needs Docker.
#   pnpm --filter @snapshot-ui/storybook visual:docker            # regenerate
#   pnpm --filter @snapshot-ui/storybook visual:docker -- --check # compare only
# The repository is mounted whole, so pnpm's symlinked node_modules resolve.
# Only pure JavaScript runs in the container: Playwright, the test runner and
# http-server. The browsers come from the image.
set -euo pipefail
cd "$(dirname "$0")/.."
ROOT="$(cd ../.. && pwd)"

ARGS=(--update-snapshots)
if [[ "${1:-}" == "--check" ]]; then
  ARGS=()
fi

pnpm run build
docker run --rm --platform linux/amd64 --ipc=host \
  -v "$ROOT":/work -w /work/apps/storybook \
  mcr.microsoft.com/playwright:v1.64.0-noble \
  node node_modules/@playwright/test/cli.js test "${ARGS[@]}"
```

```bash
chmod +x apps/storybook/scripts/visual-docker.sh
```

Add to the `scripts` of `apps/storybook/package.json`:

```json
"test:visual": "playwright test",
"visual:docker": "bash scripts/visual-docker.sh"
```

- [ ] **Step 5: Generate the baselines and compare against them**

```bash
docker pull --platform linux/amd64 mcr.microsoft.com/playwright:v1.64.0-noble
pnpm --filter @snapshot-ui/storybook visual:docker
pnpm --filter @snapshot-ui/storybook visual:docker -- --check
```

Expected:
- The first run writes 60 baselines (12 stories in 5 modes) and passes 64 tests, the extra four being the cascade tests.
- The `--check` run passes all 64 against them.
- Open three baselines and look before committing:
  - `components-button--nested-themes--light-rounded.png` shows a light card with dark text inside a dark panel.
  - `components-button--primary--light-square.png` shows a square button.
  - `components-button--primary--light-rounded-375.png` fits the phone width.

- [ ] **Step 6: Commit**

```bash
git add apps/storybook
git commit -m "test(storybook): add visual regression in five modes and a cascade test"
```

### Task 11: The docs site, drawn in Snapshot UI

**Files:**
- Create in `apps/docs/`:
  - `package.json`, `next.config.mjs`, `tsconfig.json`, `playwright.config.ts`
  - `lib/source.ts`, `lib/prepaint.ts`, `lib/document-state.ts`, `lib/props.ts`
  - `app/layout.tsx`, `app/site.css`, `app/api/search/route.ts`, `app/docs/layout.tsx`, `app/docs/[[...slug]]/page.tsx`
  - `components/shell/context.tsx`, `docs-shell.tsx`, `rail.tsx`, `header.tsx`, `toc.tsx`, `search.tsx`, `shell.css`
  - `components/mdx/index.tsx`, `section.tsx`, `code.tsx`, `copy-button.tsx`, `preview.tsx`, `preview-tabs.tsx`, `props-table.tsx`, `keys.tsx`, `rules.tsx`
  - `examples/index.ts`, `button-variants.tsx`, `button-states.tsx`, `spinner-sizes.tsx`, `theme-shapes.tsx`
  - `content/docs/meta.json`, `index.mdx`, `installation.mdx`, `theming.mdx`, `design-principles.mdx`, `components/meta.json`, `components/button.mdx`, `components/spinner.mdx`
- Test: `apps/docs/tests/docs.spec.ts`

**Interfaces:**
- Consumes: `@snapshot-ui/core/styles.css` and `base.css`, `Button`, `Spinner` and the package version from `@snapshot-ui/react/package.json`.
- Produces the docs URLs `/docs`, `/docs/installation`, `/docs/theming`, `/docs/design-principles`, `/docs/components/button` and `/docs/components/spinner`, plus `/api/search`. Task 12's homepage links to them.
- Produces `lib/prepaint.ts`, shared with Task 12:
  - `PREPAINT` is the inline head script.
  - `type Shape = 'rounded' | 'soft' | 'square'`.
  - `readShape(): Shape` and `writeShape(shape: Shape): void`, stored under the `snapshot-ui-docs-shape` key.
  - `readRailCollapsed(): boolean` and `writeRailCollapsed(collapsed: boolean): void`, stored under `snapshot-ui-docs-rail`.
- Produces `lib/document-state.ts`: `useShape(): Shape`, `useRailCollapsed(): boolean` and `useMounted(): boolean`. All are `useSyncExternalStore` over attributes on `<html>`, so every switch on a page stays in step without setting state in effects.
- Produces `SearchDialog({ open, onOpenChange })`, which Task 12 reuses.
- Produces the page authoring convention. Pages are MDX under `content/docs`, and each `##` section is wrapped in `<Section>`. The paragraph right after a section's heading is its note.
  - `<Preview name="..." />` shows an example from `examples/` with its own source code.
  - `<Code code={...} lang="..." />` shows highlighted code, never a fenced block.
  - `<PropsTable path type />` takes `path` relative to `apps/docs` and a `type` that is usually a `Pick` of the props.
  - `<Keys rows />` shows a keyboard table; `<Rules dos donts />` shows design rules.
  - Frontmatter has `title`, `description` and `icon`, a Lucide icon name.

The look comes from the approved mockups. `app/site.css` is `docs/mockups/mockup.css` without the rules core now owns (button, spinner, the base layer and the tokens import). `components/shell/shell.css` is the `<style>` block of `docs/mockups/component.html`, plus the MDX section, preview and search styles. Visual parts the library does not ship yet, such as the switch and segmented control, are hand-drawn stand-ins. Phase 1b deletes each one when the real component lands.

Fumadocs runs headless:
- `fumadocs-core` provides the loader, the page tree, the table of contents and search.
- `fumadocs-mdx` compiles the content.
- `fumadocs-typescript` reads prop types.
- No `fumadocs-ui` layout or theme is used.
- Code is highlighted with Shiki's css-variables theme, mapped onto the palette in `site.css`. Stock syntax themes would bring red and green, reserved colors, into sample code.

- [ ] **Step 1: Write the end-to-end tests**

`apps/docs/tests/docs.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGE = '/docs/components/button';

const sideways = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const width of [375, 768, 1024, 1440]) {
  test(`a docs page fits ${String(width)}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(PAGE);
    expect(await sideways(page)).toBe(0);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`a docs page has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto(PAGE);
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('the rail collapses to icons and remembers it', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(PAGE);
  await page.getByRole('button', { name: 'Collapse the menu' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-rail', 'collapsed');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Spinner' })).toBeVisible();
  await page.getByRole('button', { name: 'Expand the menu' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-rail', 'collapsed');
});

test('under 1024px the rail is a drawer that Escape closes', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto(PAGE);
  const menu = page.getByRole('button', { name: 'Open the menu' });
  await menu.click();
  await expect(page.locator('html')).toHaveAttribute('data-drawer', 'open');
  await expect(page.getByRole('navigation').getByRole('link', { name: 'Spinner' })).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).not.toHaveAttribute('data-drawer', 'open');
  await expect(menu).toBeFocused();
});

test('the color mode switch themes the page and persists', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(PAGE);
  await page.locator('label', { hasText: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(14, 14, 13)');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('the corner switch recuts the page and persists', async ({ page }) => {
  await page.goto(PAGE);
  await page.locator('label', { hasText: 'Square' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
  await expect(page.getByRole('button', { name: 'Delete site' })).toHaveCSS('border-top-left-radius', '0px');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
});

test('Cmd or Ctrl and K opens search and finds a component', async ({ page }) => {
  await page.goto('/docs');
  await page.keyboard.press('ControlOrMeta+k');
  const dialog = page.getByRole('dialog', { name: 'Search the docs' });
  await expect(dialog).toBeVisible();
  await dialog.getByRole('searchbox', { name: 'Search' }).fill('Spinner');
  await dialog.getByRole('link', { name: /Spinner/ }).first().click();
  await expect(page).toHaveURL(/\/docs\/components\/spinner$/);
});

test('a server-rendered MDX page renders library components and props', async ({ page }) => {
  await page.goto(PAGE);
  await expect(page.getByRole('button', { name: 'Delete site' })).toBeVisible();
  await expect(page.getByText("Default: 'primary'")).toBeVisible();
});
```

`apps/docs/playwright.config.ts` (the server is the production build, so tests run against what ships):

```ts
import { defineConfig, devices } from '@playwright/test';

const PORT = 3100;
const isCI = Boolean(process.env.CI);

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 1 : 0,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${String(PORT)}`,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // The production build, served by plain node so it runs anywhere.
    command: `node node_modules/next/dist/bin/next start -p ${String(PORT)} -H 127.0.0.1`,
    url: `http://127.0.0.1:${String(PORT)}`,
    reuseExistingServer: !isCI,
  },
});
```

- [ ] **Step 2: Create the app**

`apps/docs/package.json`:

```json
{
  "name": "@snapshot-ui/docs",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev -p 3000",
    "build": "next build",
    "start": "next start -p 3100",
    "typecheck": "next typegen && tsc --noEmit",
    "lint": "eslint .",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "@snapshot-ui/core": "workspace:*",
    "@snapshot-ui/react": "workspace:*",
    "fumadocs-core": "16.17.1",
    "fumadocs-mdx": "15.4.7",
    "fumadocs-typescript": "5.5.1",
    "lucide-react": "^1.55.0",
    "next": "16.4.0",
    "next-themes": "0.4.6",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "shiki": "4.5.0"
  },
  "devDependencies": {
    "@axe-core/playwright": "4.13.0",
    "@playwright/test": "1.64.0",
    "@types/mdx": "2.0.14",
    "@types/node": "24.19.2",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@typescript/native": "catalog:",
    "typescript": "catalog:"
  }
}
```

`apps/docs/next.config.mjs`:

```js
import { createMDX } from 'fumadocs-mdx/next';

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
};

export default withMDX(config);
```

`apps/docs/tsconfig.json`:

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "allowJs": true,
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] },
    "types": ["node"]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

Run:

```bash
pnpm install
pnpm --filter @snapshot-ui/docs exec playwright install chromium
```

- [ ] **Step 3: Write the content pipeline and the shared browser state**

`apps/docs/lib/source.ts`:

```ts
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { metaSchema, pageSchema } from 'fumadocs-core/source/schema';
import { defineDocs } from 'fumadocs-mdx/macro';

const docs = defineDocs({
  dir: 'content/docs',
  docs: { schema: pageSchema },
  meta: { schema: metaSchema },
});

/** Content loading, the page tree, and table of contents data. Fumadocs runs headless: every visible part is ours. */
export const source = loader({
  baseUrl: '/docs',
  source: docs.toFumadocsSource(),
  // Turns `icon: BookOpen` in a page's frontmatter into the rail's icon.
  plugins: [lucideIconsPlugin()],
});
```

`apps/docs/lib/prepaint.ts`:

```ts
export type Shape = 'rounded' | 'soft' | 'square';

const SHAPE_KEY = 'snapshot-ui-docs-shape';
const RAIL_KEY = 'snapshot-ui-docs-rail';

/**
 * Runs in <head> before first paint, so a stored corner shape or a collapsed
 * rail never flashes the default first. Color mode is next-themes' own script.
 */
export const PREPAINT = `try{var d=document.documentElement,s=localStorage.getItem('${SHAPE_KEY}');if(s==='soft'||s==='square')d.dataset.shape=s;if(localStorage.getItem('${RAIL_KEY}')==='collapsed')d.dataset.rail='collapsed'}catch(e){}`;

export function readShape(): Shape {
  const value = document.documentElement.dataset.shape;
  return value === 'soft' || value === 'square' ? value : 'rounded';
}

export function writeShape(shape: Shape): void {
  document.documentElement.dataset.shape = shape;
  try {
    localStorage.setItem(SHAPE_KEY, shape);
  } catch {
    // Storage can be blocked; the choice then lasts for this page only.
  }
}

export function readRailCollapsed(): boolean {
  return document.documentElement.dataset.rail === 'collapsed';
}

export function writeRailCollapsed(collapsed: boolean): void {
  if (collapsed) document.documentElement.dataset.rail = 'collapsed';
  else delete document.documentElement.dataset.rail;
  try {
    localStorage.setItem(RAIL_KEY, collapsed ? 'collapsed' : 'expanded');
  } catch {
    // As above.
  }
}
```

`apps/docs/lib/document-state.ts`:

```ts
'use client';

import { useSyncExternalStore } from 'react';
import { readRailCollapsed, readShape, type Shape } from './prepaint';

/** Calls back whenever `attribute` changes on <html>, whoever changes it. */
function subscribeTo(attribute: string): (onChange: () => void) => () => void {
  return (onChange) => {
    const observer = new MutationObserver(onChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: [attribute] });
    return () => {
      observer.disconnect();
    };
  };
}

const subscribeShape = subscribeTo('data-shape');
const subscribeRail = subscribeTo('data-rail');
const subscribeNothing = (): (() => void) => () => undefined;

/** The corner shape on <html>. Every switch on the page shares it. */
export function useShape(): Shape {
  return useSyncExternalStore(subscribeShape, readShape, () => 'rounded');
}

/** Whether the rail is collapsed to icons. */
export function useRailCollapsed(): boolean {
  return useSyncExternalStore(subscribeRail, readRailCollapsed, () => false);
}

/** False on the server and while hydrating, true after: for values only the browser knows. */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribeNothing, () => true, () => false);
}
```

`apps/docs/lib/props.ts`:

```ts
import { createFileSystemGeneratorCache, createGenerator } from 'fumadocs-typescript';

/** Reads prop types and their JSDoc from the library's source. One instance, cached on disk. */
export const generator = createGenerator({
  cache: createFileSystemGeneratorCache('.next/fumadocs-typescript'),
});
```

`apps/docs/app/api/search/route.ts`:

```ts
import { createFromSource } from 'fumadocs-core/search/server';
import { source } from '@/lib/source';

export const { GET } = createFromSource(source);
```

- [ ] **Step 4: Write the root layout and the site stylesheet**

`apps/docs/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Sofia_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';
import './site.css';
import { PREPAINT } from '@/lib/prepaint';

// Self-hosted by Next at build time, as a variable font so the 450 body weight
// exists, with a metric-matched fallback so nothing shifts while it loads.
const sofia = Sofia_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export const metadata: Metadata = {
  title: { default: 'Snapshot UI', template: '%s | Snapshot UI' },
  description: 'Calm, accessible React components for settings, dashboards and apps.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en" className={sofia.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

`apps/docs/app/site.css`:

```css
/*
 * The docs site's own components: stand-ins drawn by hand from the approved
 * mockups (docs/mockups/mockup.css) for parts the library does not ship yet.
 * Phase 1b deletes each stand-in in the same task that adds the real
 * component to @snapshot-ui/core: icon-button, kbd, badge, field, input,
 * segmented, switch, check and card.
 * Button and Spinner come from @snapshot-ui/core and are not redrawn here.
 */
/* The site's own base. The library's base.css sets the page and body type
   but, as a library, leaves links and headings alone; a site resets them. */
@layer base {
  h1,
  h2,
  h3,
  h4,
  p {
    margin: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button {
    font: inherit;
    color: inherit;
  }

  code,
  pre {
    font-family: var(--font-mono);
  }
}

@layer components {
  .brand {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 1.125rem;
    font-weight: 500;
    letter-spacing: -0.03em;
  }

  .brand svg {
    width: 26px;
    height: 26px;
  }

  /* ---- Type ----------------------------------------------------------- */
  .type-h1 {
    font-size: var(--text-h1);
    line-height: var(--text-h1--line-height);
    letter-spacing: var(--text-h1--letter-spacing);
    font-weight: var(--text-h1--font-weight);
  }

  .type-h2 {
    font-size: var(--text-h2);
    line-height: var(--text-h2--line-height);
    letter-spacing: var(--text-h2--letter-spacing);
    font-weight: var(--text-h2--font-weight);
  }

  .type-h3 {
    font-size: var(--text-h3);
    line-height: var(--text-h3--line-height);
    letter-spacing: var(--text-h3--letter-spacing);
    font-weight: var(--text-h3--font-weight);
  }

  @media (width < 1024px) {
    .type-h1 {
      font-size: 3rem;
    }
  }

  @media (width < 768px) {
    .type-h1 {
      font-size: 2.5rem;
      line-height: 1.05;
    }

    .type-h2 {
      font-size: 1.75rem;
      line-height: 1.2;
    }
  }

  .type-h4 {
    font-size: var(--text-h4);
    line-height: var(--text-h4--line-height);
    font-weight: var(--text-h4--font-weight);
  }

  .type-small {
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
    font-weight: var(--text-small--font-weight);
  }

  .muted {
    color: var(--color-slate);
  }

  .eyebrow {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-part);
    font-size: var(--text-eyebrow);
    line-height: var(--text-eyebrow--line-height);
    letter-spacing: var(--text-eyebrow--letter-spacing);
    font-weight: var(--text-eyebrow--font-weight);
    text-transform: uppercase;
    color: var(--color-slate);
  }

  .eyebrow::before {
    content: '';
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: var(--radius-dot);
    background-color: var(--color-signal-light);
  }

  .eyebrow-sep {
    color: var(--color-taupe);
  }

  .icon-button:focus-visible,
  .chip:focus-visible,
  .rail-link:focus-visible,
  .segmented-option:has(:focus-visible),
  .tab:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-ink);
    outline-offset: var(--focus-ring-offset);
  }

  .button-large {
    min-height: 48px;
    padding-inline: 1.75rem;
  }

  .icon-button {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid var(--color-ink);
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-ink);
    cursor: pointer;
    transition: border-radius 200ms ease, background-color 120ms ease;
  }

  .icon-button:hover {
    background-color: color-mix(in srgb, var(--color-ink) 5%, transparent);
  }

  .icon-button-ghost {
    border-color: transparent;
    color: var(--color-slate);
  }

  .icon-button-ghost:hover {
    color: var(--color-ink);
  }

  .icon-button svg {
    width: 18px;
    height: 18px;
  }

  /* ---- Chips, key hints, badges --------------------------------------- */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 36px;
    padding: 0 1rem;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-pill);
    background-color: var(--color-float);
    color: var(--color-ink);
    font-size: var(--text-small);
    font-weight: 500;
    transition: border-radius 200ms ease;
  }

  .chip:hover {
    border-color: var(--color-ink);
  }

  .chip-new::after {
    content: 'New';
    margin-left: 2px;
    padding: 1px 6px;
    border-radius: var(--radius-micro);
    background-color: color-mix(in srgb, var(--color-link) 12%, transparent);
    color: var(--color-link);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .kbd {
    display: inline-block;
    padding: 2px 6px;
    border-radius: var(--radius-micro);
    background-color: var(--color-bone);
    color: var(--color-slate);
    font-family: var(--font-sans);
    font-size: 0.75rem;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  .badge,
  .kbd {
    font-variant-numeric: tabular-nums;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: var(--radius-micro);
    font-size: 0.75rem;
    line-height: 1.4;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background-color: var(--color-bone);
    color: var(--color-granite);
  }

  .badge-info {
    background-color: color-mix(in srgb, var(--color-link) 12%, transparent);
    color: var(--color-link);
  }

  /* ---- Form controls ---------------------------------------------------- */
  .field {
    display: grid;
    gap: var(--spacing-part);
  }

  .field-label {
    display: flex;
    align-items: baseline;
    gap: var(--spacing-part);
    font-size: var(--text-h4);
    line-height: var(--text-h4--line-height);
    font-weight: var(--text-h4--font-weight);
  }

  .field-marker {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    color: var(--color-clay);
    font-size: 0.75rem;
    line-height: 1;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }

  .field-marker::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: var(--radius-dot);
    background-color: currentColor;
  }

  .field-hint {
    color: var(--color-slate);
    font-size: var(--text-small);
    line-height: var(--text-small--line-height);
  }

  .input {
    width: 100%;
    height: 48px;
    padding: 0 1.5rem;
    border: 1px solid var(--color-boundary);
    border-radius: var(--radius-pill);
    background-color: var(--color-raised);
    color: var(--color-ink);
    font: inherit;
    transition: border-radius 200ms ease;
  }

  .input::placeholder {
    color: var(--color-taupe);
  }

  .input-changed {
    border: 1.5px solid var(--color-signal-light);
  }

  .segmented {
    display: inline-flex;
    gap: 4px;
    height: 48px;
    padding: 3px;
    border: 1px solid var(--color-boundary);
    border-radius: var(--radius-surface);
    background-color: var(--color-raised);
    transition: border-radius 200ms ease;
  }

  .segmented-small {
    height: 40px;
    padding: 3px;
    gap: 2px;
  }

  .segmented-option {
    position: relative;
    display: flex;
    flex: auto;
    align-items: center;
    justify-content: center;
    padding: 0 1rem;
    border-radius: var(--radius-pill);
    color: var(--color-slate);
    font-size: var(--text-action);
    line-height: 1;
    letter-spacing: var(--text-action--letter-spacing);
    font-weight: 500;
    white-space: nowrap;
    cursor: pointer;
    transition: border-radius 200ms ease, background-color 120ms ease, color 120ms ease;
  }

  .segmented-small .segmented-option {
    padding: 0 0.875rem;
    font-size: 0.875rem;
  }

  .segmented-option input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .segmented-option:hover {
    color: var(--color-ink);
  }

  .segmented-option:has(:checked) {
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  .segmented-option:has(:checked:focus-visible) {
    outline-color: var(--color-canvas);
    outline-offset: -4px;
  }

  .switch {
    position: relative;
    flex: none;
    width: 52px;
    height: 30px;
    padding: 3px;
    border: 0;
    border-radius: var(--radius-pill);
    background-color: var(--color-boundary);
    cursor: pointer;
    transition: background-color 160ms ease, border-radius 200ms ease;
  }

  .switch::after {
    content: '';
    display: block;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-pill);
    background-color: var(--color-float);
    box-shadow: var(--shadow-lift);
    transition: transform 160ms ease, border-radius 200ms ease;
  }

  .switch[aria-checked='true'] {
    background-color: var(--color-ink);
  }

  .switch[aria-checked='true']::after {
    transform: translateX(22px);
  }

  .check {
    display: grid;
    place-items: center;
    flex: none;
    width: 20px;
    height: 20px;
    border: 1.5px solid var(--color-boundary);
    border-radius: var(--radius-micro);
    background-color: var(--color-raised);
  }

  .check-on {
    border-color: var(--color-ink);
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  .check svg {
    width: 14px;
    height: 14px;
  }

  /* ---- Surfaces ----------------------------------------------------------- */
  .card {
    min-width: 0;
    padding: 2rem;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-stadium);
    background-color: var(--color-lifted);
    transition: border-radius 200ms ease, background-color 200ms ease;
  }

  .card-header {
    display: grid;
    gap: var(--spacing-part);
    margin: 0 -2rem 2rem;
    padding: 0 2rem 1.5rem;
    border-bottom: 1px solid var(--color-divider);
  }

  .card-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .stack {
    display: grid;
    gap: var(--spacing-peer);
  }

  .row {
    display: flex;
    align-items: center;
    gap: var(--spacing-part);
    flex-wrap: wrap;
  }

  .row-between {
    justify-content: space-between;
  }

  .setting {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1.5rem;
    padding: 0.75rem 1rem;
  }

  .settings-list {
    display: grid;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    transition: border-radius 200ms ease;
  }

  .settings-list .setting + .setting {
    border-top: 1px solid var(--color-divider);
  }

  .code {
    position: relative;
    margin: 0;
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-bone);
    color: var(--color-charcoal);
    font-size: 0.875rem;
    line-height: 1.7;
    transition: border-radius 200ms ease;
  }

  /* Highlighting stays in the neutral tiers and link blue: clay, error and
     success carry meaning inside a panel, and that extends to sample code. */
  .code .k {
    color: var(--color-link);
  }

  .code .s {
    color: var(--color-granite);
  }

  .code .t {
    color: var(--color-ink);
    font-weight: 500;
  }

  .code .c {
    color: var(--color-slate);
  }

  .code-copy {
    position: absolute;
    top: 10px;
    right: 10px;
  }

  /* Code from the Code component: Shiki's css-variables theme, mapped onto the
     palette. Clay, error and success carry meaning, so code never uses them. */
  .code {
    --shiki-foreground: var(--color-charcoal);
    --shiki-background: transparent;
    --shiki-token-keyword: var(--color-link);
    --shiki-token-string: var(--color-granite);
    --shiki-token-string-expression: var(--color-granite);
    --shiki-token-constant: var(--color-ink);
    --shiki-token-function: var(--color-ink);
    --shiki-token-parameter: var(--color-charcoal);
    --shiki-token-comment: var(--color-slate);
    --shiki-token-punctuation: var(--color-slate);
    --shiki-token-link: var(--color-link);
  }

  .code pre {
    margin: 0;
    padding: 0;
    overflow-x: auto;
    background: transparent;
    font: inherit;
    tab-size: 2;
  }

  .code pre:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-ink);
    outline-offset: var(--focus-ring-offset);
  }
}
```

- [ ] **Step 5: Write the shell**

`apps/docs/components/shell/context.tsx`:

```tsx
'use client';

import { createContext, use } from 'react';

export interface ShellActions {
  openDrawer: () => void;
  openSearch: () => void;
}

export const ShellContext = createContext<ShellActions | null>(null);

/** The shell's actions, for the header's menu button and search. */
export function useShell(): ShellActions {
  const actions = use(ShellContext);
  if (!actions) throw new Error('useShell must be used inside DocsShell');
  return actions;
}
```

`apps/docs/components/shell/docs-shell.tsx`:

```tsx
'use client';

import type { Root } from 'fumadocs-core/page-tree';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactElement, type ReactNode } from 'react';
import { useRailCollapsed } from '@/lib/document-state';
import { writeRailCollapsed } from '@/lib/prepaint';
import { ShellContext, type ShellActions } from './context';
import { Rail } from './rail';
import { SearchDialog } from './search';

/**
 * The Snapshot app shell: the floating rail, which collapses to icons on wide
 * screens and becomes a drawer under 1024px, the scrim, search, and the
 * workspace the page renders into. Phase 5 rebuilds it from the library's
 * Sidebar and AppShell.
 */
export function DocsShell({
  tree,
  version,
  children,
}: {
  tree: Root;
  version: string;
  children: ReactNode;
}): ReactElement {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const collapsed = useRailCollapsed();
  // The drawer belongs to the page it was opened on, so navigating closes it.
  const [drawerPath, setDrawerPath] = useState<string | null>(null);
  const drawerOpen = drawerPath === pathname;

  useEffect(() => {
    const root = document.documentElement;
    if (drawerOpen) {
      root.dataset.drawer = 'open';
      document.querySelector<HTMLElement>('.rail .rail-link[aria-current="page"], .rail .rail-link')?.focus();
    } else if (root.dataset.drawer === 'open') {
      delete root.dataset.drawer;
      document.querySelector<HTMLElement>('.header-menu')?.focus();
    }
    if (!drawerOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setDrawerPath(null);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [drawerOpen]);

  // Cmd+K or Ctrl+K opens search from anywhere in the docs.
  useEffect(() => {
    const onKey = (event: KeyboardEvent): void => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const actions = useMemo<ShellActions>(
    () => ({
      openDrawer: () => {
        setDrawerPath(pathname);
      },
      openSearch: () => {
        setSearchOpen(true);
      },
    }),
    [pathname],
  );

  const toggleCollapsed = (): void => {
    writeRailCollapsed(!collapsed);
  };

  return (
    <ShellContext value={actions}>
      <Rail
        tree={tree}
        pathname={pathname}
        version={version}
        collapsed={collapsed}
        onToggleCollapsed={toggleCollapsed}
        onSearch={actions.openSearch}
      />
      <div
        className="scrim"
        aria-hidden
        onClick={() => {
          setDrawerPath(null);
        }}
      />
      <div className="workspace">{children}</div>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </ShellContext>
  );
}
```

`apps/docs/components/shell/rail.tsx`:

```tsx
'use client';

import type { Item, Node, Root } from 'fumadocs-core/page-tree';
import Link from 'next/link';
import { useEffect, useRef, type ReactElement, type ReactNode } from 'react';

interface Group {
  name: ReactNode;
  items: Item[];
}

/** Separators in meta.json start a group; a folder is a group of its own pages. */
function groupsOf(tree: Root): Group[] {
  const groups: Group[] = [];
  const current = (): Group => {
    const last = groups.at(-1);
    if (last) return last;
    const group: Group = { name: 'Docs', items: [] };
    groups.push(group);
    return group;
  };
  const visit = (node: Node): void => {
    if (node.type === 'separator') groups.push({ name: node.name ?? '', items: [] });
    else if (node.type === 'page') current().items.push(node);
    else groups.push({ name: node.name, items: node.children.filter((child): child is Item => child.type === 'page') });
  };
  tree.children.forEach(visit);
  return groups.filter((group) => group.items.length > 0);
}

const label = (item: Item): string => (typeof item.name === 'string' ? item.name : '');

export function Rail({
  tree,
  pathname,
  version,
  collapsed,
  onToggleCollapsed,
  onSearch,
}: {
  tree: Root;
  pathname: string;
  version: string;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSearch: () => void;
}): ReactElement {
  const tip = useRef<HTMLDivElement>(null);
  const nav = useRef<HTMLElement>(null);

  // Names float beside the icons while the rail is collapsed. Fixed rather than
  // inside the rail, so the list keeps scrolling: 400ms on hover, at once on focus.
  useEffect(() => {
    const element = tip.current;
    const list = nav.current;
    if (!element || !list) return;
    let timer = 0;
    const hide = (): void => {
      window.clearTimeout(timer);
      element.hidden = true;
    };
    const show = (target: HTMLElement, delay: number): void => {
      if (document.documentElement.dataset.rail !== 'collapsed' || matchMedia('(width < 1024px)').matches) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const box = target.getBoundingClientRect();
        element.textContent = target.dataset.label ?? '';
        element.style.left = `${String(box.right + 14)}px`;
        element.style.top = `${String(box.top + box.height / 2)}px`;
        element.hidden = false;
      }, delay);
    };
    const targets = [...document.querySelectorAll<HTMLElement>('.rail [data-label]')];
    const listeners = targets.map((target) => {
      const enter = (): void => {
        show(target, 400);
      };
      const focus = (): void => {
        if (target.matches(':focus-visible')) show(target, 0);
      };
      target.addEventListener('mouseenter', enter);
      target.addEventListener('focus', focus);
      target.addEventListener('mouseleave', hide);
      target.addEventListener('blur', hide);
      return () => {
        target.removeEventListener('mouseenter', enter);
        target.removeEventListener('focus', focus);
        target.removeEventListener('mouseleave', hide);
        target.removeEventListener('blur', hide);
      };
    });
    list.addEventListener('scroll', hide);
    return () => {
      listeners.forEach((remove) => {
        remove();
      });
      list.removeEventListener('scroll', hide);
      hide();
    };
  }, [tree, collapsed]);

  return (
    <>
      <aside className="rail" id="rail" aria-label="Documentation">
        <div className="rail-head">
          <Link className="brand" href="/">
            <svg viewBox="0 0 26 26" fill="none" aria-hidden>
              <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="21.5" cy="7" r="3.5" fill="var(--color-signal-light)" />
            </svg>
            <span className="rail-label">snapshot ui</span>
          </Link>
          <span className="badge rail-version">v{version}</span>
        </div>
        <button className="rail-search" type="button" data-label="Search docs" aria-label="Search docs" onClick={onSearch}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 5 5" />
          </svg>
          <span className="rail-label">Search docs</span>
          <span className="kbd rail-key">&#8984;K</span>
        </button>
        <nav className="rail-nav" ref={nav}>
          {groupsOf(tree).map((group, index) => {
            const isCurrent = group.items.some((item) => item.url === pathname);
            return (
              <div key={index}>
                <p className={isCurrent ? 'rail-group rail-group-current' : 'rail-group'}>{group.name}</p>
                <ul className="rail-list">
                  {group.items.map((item) => (
                    <li key={item.url}>
                      <Link
                        className="rail-link"
                        href={item.url}
                        data-label={label(item)}
                        aria-current={item.url === pathname ? 'page' : undefined}
                      >
                        {item.icon ? <span className="rail-icon">{item.icon}</span> : null}
                        <span className="rail-label">{item.name}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="rail-foot">
          <span className="rail-label">MIT &#183; React 19</span>
          <a className="icon-button icon-button-ghost" href="https://github.com/amirehsan/snapshot-ui" aria-label="GitHub">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
            </svg>
          </a>
        </div>
      </aside>
      <button
        className="rail-collapse"
        type="button"
        aria-controls="rail"
        aria-expanded={!collapsed}
        onClick={onToggleCollapsed}
      >
        <span className="rail-collapse-label">{collapsed ? 'Expand the menu' : 'Collapse the menu'}</span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="m14 7-5 5 5 5" />
        </svg>
      </button>
      <div className="rail-tip" ref={tip} role="presentation" hidden />
    </>
  );
}
```

`apps/docs/components/shell/header.tsx`:

```tsx
'use client';

import { useTheme } from 'next-themes';
import type { ReactElement } from 'react';
import { useMounted, useShape } from '@/lib/document-state';
import { writeShape } from '@/lib/prepaint';
import { useShell } from './context';

/**
 * A stand-in for the segmented control phase 1b builds: real radios, so arrow
 * keys and the single choice come from the platform.
 */
function Choice<T extends string>({
  label,
  name,
  options,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: readonly (readonly [T, string])[];
  value: T | undefined;
  onChange: (value: T) => void;
}): ReactElement {
  return (
    <div className="segmented segmented-small" role="radiogroup" aria-label={label}>
      {options.map(([option, text]) => (
        <label key={option} className="segmented-option">
          <input
            type="radio"
            name={name}
            value={option}
            checked={value === option}
            onChange={() => {
              onChange(option);
            }}
          />
          {text}
        </label>
      ))}
    </div>
  );
}

const THEMES = [
  ['light', 'Light'],
  ['dark', 'Dark'],
] as const;

const SHAPES = [
  ['rounded', 'Rounded'],
  ['soft', 'Soft'],
  ['square', 'Square'],
] as const;

export function DocsHeader({ group, title }: { group: string; title: string }): ReactElement {
  const { openDrawer } = useShell();
  const { resolvedTheme, setTheme } = useTheme();
  // Both switches show values only the browser knows, so they settle after hydration.
  const mounted = useMounted();
  const shape = useShape();

  return (
    <header className="header">
      <div className="header-inner">
        <button
          className="icon-button header-menu"
          type="button"
          aria-label="Open the menu"
          aria-controls="rail"
          onClick={openDrawer}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <div className="header-titles">
          <p className="eyebrow">
            Docs <span className="eyebrow-sep">&#8250;</span> {group}
          </p>
          <h1 className="type-h2">{title}</h1>
        </div>
        <div className="header-controls">
          <Choice
            label="Color mode"
            name="theme"
            options={THEMES}
            value={mounted ? (resolvedTheme as 'light' | 'dark' | undefined) : undefined}
            onChange={setTheme}
          />
          <Choice
            label="Corners"
            name="shape"
            options={SHAPES}
            value={mounted ? shape : undefined}
            onChange={writeShape}
          />
        </div>
      </div>
    </header>
  );
}
```

`apps/docs/components/shell/toc.tsx`:

```tsx
'use client';

import { AnchorProvider, TOCItem, type TOCItemType } from 'fumadocs-core/toc';
import type { ReactElement } from 'react';

/** The page's sections. Fumadocs tracks which one is in view and marks it data-active. */
export function Toc({ items }: { items: TOCItemType[] }): ReactElement {
  return (
    <AnchorProvider toc={items} single>
      <ul className="toc">
        {items.map((item) => (
          <li key={item.url}>
            <TOCItem href={item.url}>{item.title}</TOCItem>
          </li>
        ))}
      </ul>
    </AnchorProvider>
  );
}
```

`apps/docs/components/shell/search.tsx`:

```tsx
'use client';

import { useFetchSearch } from 'fumadocs-core/search/client';
import Link from 'next/link';
import { useEffect, useRef, type KeyboardEvent, type ReactElement } from 'react';

const KIND = { page: 'Page', heading: 'Section', text: 'Text' } as const;

/** Search over every docs page, in a native modal dialog. */
export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}): ReactElement {
  const dialog = useRef<HTMLDialogElement>(null);
  const { search, onSearchChange, data, isLoading } = useFetchSearch();

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  const results = (data?.items ?? [])
    .filter((item) => item.type !== 'table')
    .slice(0, 12);

  // Arrow keys move between the input and the results.
  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>): void => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    const items = [
      ...(dialog.current?.querySelectorAll<HTMLElement>('.search-input, .search-result') ?? []),
    ];
    const index = items.indexOf(document.activeElement as HTMLElement);
    const next = items[Math.min(Math.max(index + (event.key === 'ArrowDown' ? 1 : -1), 0), items.length - 1)];
    if (next) {
      event.preventDefault();
      next.focus();
    }
  };

  const close = (): void => {
    onOpenChange(false);
  };

  return (
    // The dialog closes on Escape natively; a click on the backdrop lands on the dialog itself.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialog}
      className="search-dialog"
      aria-label="Search the docs"
      onClose={close}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === dialog.current) close();
      }}
    >
      <div className="search-field">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 5 5" />
        </svg>
        <input
          className="search-input"
          type="search"
          placeholder="Search components and guides"
          aria-label="Search"
          value={search}
          onChange={(event) => {
            onSearchChange(event.target.value);
          }}
        />
        <span className="kbd">esc</span>
      </div>
      {search.length === 0 ? null : results.length === 0 ? (
        <p className="search-empty" role="status">
          {isLoading ? 'Searching' : `Nothing matches "${search}"`}
        </p>
      ) : (
        <ul className="search-results">
          {results.map((item) => (
            <li key={item.id}>
              <Link className="search-result" href={item.url} onClick={close}>
                <span>{item.content}</span>
                <span className="search-result-kind">{KIND[item.type]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="search-foot">
        <span>
          <span className="kbd">&#8593;</span> <span className="kbd">&#8595;</span> to move
        </span>
        <span>
          <span className="kbd">&#8629;</span> to open
        </span>
      </div>
    </dialog>
  );
}
```

`apps/docs/components/shell/shell.css`:

```css
/* The docs shell and page, from docs/mockups/component.html. */
@layer components {
  :root {
    --rail-width: 320px;
  }

  /* ---- Floating rail ------------------------------------------- */
  .rail {
    position: fixed;
    top: 16px;
    bottom: 16px;
    left: 16px;
    z-index: 30;
    display: flex;
    flex-direction: column;
    width: calc(var(--rail-width) - 32px);
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-stadium);
    background-color: var(--color-float);
    box-shadow: var(--shadow-lift);
    overflow: hidden;
    transition: border-radius 200ms ease, background-color 200ms ease;
  }

  .rail-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24px 24px 12px 28px;
  }

  .rail-search {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 8px 12px 4px;
    min-height: 42px;
    padding: 0 12px;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-pill);
    background-color: var(--color-canvas);
    color: var(--color-slate);
    font-size: 0.9375rem;
    font-weight: 500;
    cursor: pointer;
    transition: border-radius 200ms ease;
  }

  .rail-search svg {
    width: 18px;
    height: 18px;
  }

  .rail-search span:first-of-type {
    flex: 1;
    text-align: left;
  }

  .rail-nav {
    flex: 1;
    overflow-y: auto;
    padding: 8px 12px 24px;
  }

  .rail-group {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 24px;
    padding: 0 12px 8px;
    color: var(--color-slate);
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    line-height: 1.2;
    text-transform: uppercase;
  }

  /* The dot hangs into the gutter so the label text and the links below
     share one vertical axis. Grey, orange on the group holding the page. */
  .rail-group::before {
    content: '';
    flex: none;
    width: 6px;
    height: 6px;
    margin-left: -14px;
    border-radius: var(--radius-dot);
    background-color: color-mix(in srgb, var(--color-ink) 25%, transparent);
  }

  .rail-group-current {
    color: var(--color-ink);
  }

  .rail-group-current::before {
    background-color: var(--color-signal-light);
  }

  .rail-list {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .rail-link {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 40px;
    padding: 0 12px;
    border-radius: var(--radius-pill);
    color: var(--color-charcoal);
    font-size: 0.9375rem;
    font-weight: 500;
    line-height: 1.45;
    letter-spacing: -0.01em;
    transition: border-radius 200ms ease;
  }

  .rail-link:hover {
    background-color: var(--color-canvas);
    color: var(--color-ink);
  }

  .rail-link[aria-current='page'] {
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  .rail-link .badge {
    padding: 1px 6px;
  }

  .rail-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px 20px 28px;
    border-top: 1px solid var(--color-divider);
    color: var(--color-slate);
    font-size: 0.875rem;
  }

  /* ---- Workspace ----------------------------------------------- */
  .workspace {
    margin-left: var(--rail-width);
    min-height: 100vh;
  }

  .header {
    position: sticky;
    top: 0;
    z-index: 20;
    background-color: color-mix(in srgb, var(--color-canvas) 80%, transparent);
    backdrop-filter: blur(20px) saturate(140%);
  }

  .header-inner {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    max-width: 1320px;
    padding: 32px 32px 20px;
  }

  .header-titles {
    display: grid;
    gap: 6px;
  }

  .header-controls {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .content {
    max-width: 1320px;
    padding: 8px 32px 64px;
  }

  .page-lede {
    max-width: 70ch;
    margin-bottom: 32px;
    color: var(--color-charcoal);
    font-size: 1.125rem;
    line-height: 1.5;
  }

  .panel {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 32px;
    align-items: start;
  }

  .panel-main {
    grid-column: span 8;
    display: grid;
    gap: 32px;
  }

  .panel-side {
    grid-column: span 4;
    display: grid;
    gap: 32px;
    position: sticky;
    top: 150px;
  }

  /* ---- Tabs: pills in a canvas track with no control boundary ---- */
  .tabs {
    display: inline-flex;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-surface);
    background-color: var(--color-canvas);
    transition: border-radius 200ms ease;
  }

  .tab {
    min-height: 36px;
    padding: 0 16px;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--color-slate);
    font-weight: 500;
    cursor: pointer;
    transition: border-radius 200ms ease;
  }

  .tab[aria-selected='true'] {
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  /* ---- Preview stage ------------------------------------------- */
  .stage {
    display: grid;
    place-items: center;
    min-height: 220px;
    padding: 40px 24px;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-canvas);
    transition: border-radius 200ms ease;
  }

  .stage .row {
    justify-content: center;
    gap: 12px;
  }

  .stage-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 16px;
    color: var(--color-slate);
    font-size: var(--text-small);
  }

  [hidden] {
    display: none !important;
  }

  /* ---- Props --------------------------------------------------- */
  .props {
    display: grid;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    overflow: hidden;
    transition: border-radius 200ms ease;
  }

  .prop {
    display: grid;
    grid-template-columns: 170px 1fr;
    gap: 24px;
    padding: 18px 20px;
  }

  .prop + .prop {
    border-top: 1px solid var(--color-divider);
  }

  .prop-name {
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
  }

  .prop-type {
    display: inline-block;
    margin-top: 6px;
    padding: 2px 8px;
    border-radius: var(--radius-micro);
    background-color: var(--color-bone);
    color: var(--color-granite);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }

  .prop-default {
    color: var(--color-slate);
    font-size: var(--text-small);
  }

  /* ---- Keyboard ------------------------------------------------ */
  .keys {
    display: grid;
    gap: 14px;
  }

  .key-row {
    display: grid;
    grid-template-columns: 130px 1fr;
    gap: 16px;
    align-items: baseline;
  }

  /* ---- Aside cards --------------------------------------------- */
  .toc {
    display: grid;
    gap: 4px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .toc a {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 34px;
    color: var(--color-slate);
    font-weight: 500;
  }

  .toc a::before {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: var(--radius-dot);
    background-color: color-mix(in srgb, var(--color-ink) 20%, transparent);
  }

  .toc a[data-active='true'] {
    color: var(--color-ink);
  }

  .toc a[data-active='true']::before {
    background-color: var(--color-signal-light);
  }

  .rules {
    display: grid;
    gap: 16px;
  }

  .rule {
    display: grid;
    grid-template-columns: 24px 1fr;
    gap: 12px;
    align-items: start;
  }

  .rule-mark {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-dot);
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  .rule-mark-no {
    background-color: transparent;
    border: 1.5px solid var(--color-ink);
    color: var(--color-ink);
  }

  .rule-mark svg {
    width: 13px;
    height: 13px;
  }

  .meta {
    display: grid;
    gap: 12px;
  }

  .meta-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--color-slate);
    font-size: var(--text-small);
  }

  .meta-row a {
    color: var(--color-ink);
    font-weight: 500;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  .footer-note {
    display: flex;
    justify-content: space-between;
    margin-top: 48px;
    color: var(--color-slate);
    font-size: var(--text-small);
  }

  .footer-note a {
    color: var(--color-ink);
    font-weight: 500;
  }
  .rail-icon {
    flex: none;
    width: 20px;
    height: 20px;
  }

  .rail-link {
    justify-content: flex-start;
    gap: 12px;
  }

  .rail-label {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .header-menu {
    display: none;
    width: 48px;
    height: 48px;
    margin-left: -8px;
    border-color: var(--color-hairline);
    background-color: var(--color-float);
    box-shadow: var(--shadow-lift);
  }

  /* ---- Collapse button: 32px drawn, 40px to hit --------------------- */
  .rail-collapse {
    position: fixed;
    top: 40px;
    left: calc(var(--rail-width) - 16px + 6px);
    z-index: 31;
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-pill);
    background-color: var(--color-float);
    color: var(--color-slate);
    box-shadow: var(--shadow-lift);
    cursor: pointer;
    transition: left 200ms ease, border-radius 200ms ease;
  }

  .rail-collapse::before {
    content: '';
    position: absolute;
    inset: -4px;
  }

  .rail-collapse:hover {
    color: var(--color-ink);
  }

  .rail-collapse:focus-visible {
    outline: var(--focus-ring-width) solid var(--color-ink);
    outline-offset: var(--focus-ring-offset);
  }

  .rail-collapse svg {
    width: 16px;
    height: 16px;
    transition: rotate 200ms ease;
  }

  .rail-collapse-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  .rail,
  .workspace {
    transition: width 200ms ease, margin-left 200ms ease, translate 200ms ease, border-radius 200ms ease;
  }

  /* ---- Collapsed rail: icons only, names as tooltips ---------------- */
  [data-rail='collapsed'] {
    --rail-width: 104px;
  }

  [data-rail='collapsed'] .rail-collapse svg {
    rotate: 180deg;
  }

  [data-rail='collapsed'] .rail-head {
    justify-content: center;
    padding: 24px 0 12px;
  }

  [data-rail='collapsed'] .rail-version,
  [data-rail='collapsed'] .rail-key,
  [data-rail='collapsed'] .rail-link .badge {
    display: none;
  }

  /* Hidden from view, not from assistive technology. */
  [data-rail='collapsed'] .rail-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  [data-rail='collapsed'] .rail-search {
    justify-content: center;
    width: 44px;
    margin: 8px auto 4px;
    padding: 0;
  }

  [data-rail='collapsed'] .rail-nav {
    padding-inline: 16px;
    scrollbar-width: none;
  }

  [data-rail='collapsed'] .rail-group {
    justify-content: center;
    margin-top: 16px;
    padding: 8px 0;
    font-size: 0;
  }

  [data-rail='collapsed'] .rail-group::before {
    margin-left: 0;
  }

  [data-rail='collapsed'] .rail-link {
    position: relative;
    justify-content: center;
    width: 40px;
    margin-inline: auto;
    padding: 0;
  }

  /* The collapsed rail's names, floated beside the icon so the list
     itself can still scroll. The library's Tooltip does the same in a
     portal: 400ms on hover, at once on focus. */
  .rail-tip {
    position: fixed;
    z-index: 40;
    padding: 6px 10px;
    border-radius: var(--radius-micro);
    background-color: var(--color-ink);
    color: var(--color-canvas);
    font-size: 0.8125rem;
    font-weight: 500;
    line-height: 1.3;
    white-space: nowrap;
    translate: 0 -50%;
    pointer-events: none;
  }

  .rail-tip[hidden] {
    display: none;
  }

  [data-rail='collapsed'] .rail-foot {
    justify-content: center;
    padding: 16px 0 20px;
  }

  .scrim {
    position: fixed;
    inset: 0;
    z-index: 29;
    background-color: var(--color-scrim);
    opacity: 0;
    pointer-events: none;
    transition: opacity 180ms ease;
  }

  /* ---- Under 1440: the side column folds under the content -------- */
  @media (width < 1440px) {
    .panel-main,
    .panel-side {
      grid-column: 1 / -1;
    }

    .panel-side {
      position: static;
      grid-template-columns: repeat(2, 1fr);
      align-items: start;
    }

    .panel-side .toc-card {
      display: none;
    }
  }

  /* ---- Under 1024: the rail becomes a drawer ------------------------ */
  @media (width < 1024px) {
    :root,
    [data-rail='collapsed'] {
      --rail-width: 0px;
    }

    .rail {
      width: min(320px, calc(100vw - 32px));
      translate: calc(-100% - 24px) 0;
    }

    [data-drawer='open'] .rail {
      translate: 0 0;
    }

    [data-drawer='open'] .scrim {
      opacity: var(--opacity-scrim);
      pointer-events: auto;
    }

    .rail-collapse {
      display: none;
    }

    .header-menu {
      display: inline-grid;
    }

    .header-inner {
      flex-wrap: wrap;
      align-items: center;
      padding-top: 20px;
    }

    .header-titles {
      flex: 1;
      min-width: 0;
    }

    .header-controls {
      width: 100%;
    }
  }

  /* ---- Phone ----------------------------------------------------- */
  @media (width < 768px) {
    .header-inner {
      gap: 16px;
      padding: 16px 16px 16px;
    }

    .header-controls {
      flex-wrap: wrap;
      gap: 8px;
    }

    .content {
      padding: 8px 16px 48px;
    }

    .page-lede {
      font-size: 1.0625rem;
    }

    .panel,
    .panel-main,
    .panel-side {
      gap: 20px;
    }

    .panel-side {
      grid-template-columns: 1fr;
    }

    .card {
      padding: 24px 20px;
    }

    .card-header {
      margin: 0 -20px 24px;
      padding: 0 20px 20px;
    }

    .card-header-row {
      flex-wrap: wrap;
    }

    .stage {
      min-height: 0;
      padding: 24px 16px;
    }

    .stage .row .button {
      flex: 1 1 auto;
    }

    .stage-bar {
      flex-direction: column;
      align-items: flex-start;
      gap: 4px;
    }

    .code {
      padding: 16px;
      font-size: 0.8125rem;
    }

    .prop,
    .key-row {
      grid-template-columns: 1fr;
      gap: 8px;
    }

    .prop {
      padding: 16px;
    }

    .footer-note {
      margin-top: 24px;
    }
  }
}
    

@layer components {
  /* ---- MDX sections, drawn as the mockup's stadium cards ---------------- */
  .docs-section {
    display: grid;
    gap: var(--spacing-peer);
  }

  .docs-section > h2 {
    margin: 0;
    scroll-margin-top: 150px;
  }

  .docs-section p,
  .docs-section li {
    margin: 0;
    max-width: 70ch;
    line-height: 1.6;
  }

  /* The paragraph right after a section's title is its note: slate, with the
     header band's rule running edge to edge beneath it. */
  .docs-section > h2 + p {
    max-width: none;
    margin: calc(var(--spacing-part) - var(--spacing-peer)) -2rem 0;
    padding: 0 2rem 1.5rem;
    border-bottom: 1px solid var(--color-divider);
    color: var(--color-slate);
  }


  .docs-section ul,
  .docs-section ol {
    display: grid;
    gap: 8px;
    margin: 0;
    padding-left: 1.25rem;
  }

  .docs-section a:not([class]) {
    color: var(--color-link);
    text-decoration-line: underline;
    text-underline-offset: 4px;
  }

  .docs-section a:not([class]):focus-visible {
    outline: var(--focus-ring-width) solid var(--color-ink);
    outline-offset: var(--focus-ring-offset);
    border-radius: var(--radius-micro);
  }

  .docs-section :not(pre) > code {
    padding: 1px 6px;
    border-radius: var(--radius-micro);
    background-color: var(--color-bone);
    font-size: 0.875em;
  }

  /* A fenced block that bypassed the Code component: monochrome, so a stock
     syntax theme never brings red or green into the palette. */
  .docs-section pre:not(.shiki) {
    margin: 0;
    padding: 1.25rem 1.5rem;
    overflow-x: auto;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-bone);
    font-size: 0.875rem;
  }

  .docs-section pre:not(.shiki) span {
    color: var(--color-charcoal) !important;
  }

  @media (width < 768px) {
    .docs-section > h2 + p {
      margin-inline: -20px;
      padding-inline: 20px;
    }
  }

  /* ---- Preview ------------------------------------------------------------ */
  .preview {
    display: grid;
    gap: 16px;
  }

  .preview-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  /* ---- Search ------------------------------------------------------------- */
  .search-dialog {
    width: min(640px, calc(100vw - 32px));
    max-height: min(560px, calc(100dvh - 32px));
    margin: 12vh auto auto;
    padding: 0;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-float);
    color: var(--color-ink);
    box-shadow: var(--shadow-float);
    overflow: hidden;
  }

  .search-dialog[open] {
    display: flex;
    flex-direction: column;
  }

  .search-dialog::backdrop {
    background-color: var(--color-scrim);
    opacity: var(--opacity-scrim);
  }

  .search-field {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid var(--color-divider);
  }

  .search-field:has(.search-input:focus-visible) {
    box-shadow: inset 0 -2px 0 var(--color-ink);
  }

  .search-field svg {
    flex: none;
    width: 20px;
    height: 20px;
    color: var(--color-slate);
  }

  .search-input {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 1.0625rem;
  }

  .search-input:focus-visible {
    outline: none;
  }

  .search-input::placeholder {
    color: var(--color-taupe);
  }

  .search-results {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 8px;
    overflow-y: auto;
    list-style: none;
  }

  .search-result {
    display: grid;
    gap: 2px;
    padding: 10px 12px;
    border-radius: var(--radius-control);
    color: var(--color-ink);
  }

  .search-result:hover,
  .search-result:focus-visible {
    outline: none;
    background-color: var(--color-canvas);
  }

  .search-result-kind {
    color: var(--color-slate);
    font-size: var(--text-small);
  }

  .search-empty {
    padding: 24px 20px;
    color: var(--color-slate);
  }

  .search-foot {
    display: flex;
    gap: 16px;
    padding: 10px 20px;
    border-top: 1px solid var(--color-divider);
    color: var(--color-slate);
    font-size: 0.75rem;
  }
}

@layer components {
  /* Lucide icons from page frontmatter fill the rail's 20px icon box. */
  .rail-icon svg {
    display: block;
    width: 100%;
    height: 100%;
    stroke-width: 1.8;
  }
}

@layer components {
  .shape-samples {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: 24px;
    width: 100%;
  }

  .shape-sample {
    display: grid;
    gap: 16px;
    align-content: start;
  }
}
```

- [ ] **Step 6: Write the docs routes**

`apps/docs/app/docs/layout.tsx`:

```tsx
import pkg from '@snapshot-ui/react/package.json';
import type { ReactElement, ReactNode } from 'react';
import { DocsShell } from '@/components/shell/docs-shell';
import { source } from '@/lib/source';
import '@/components/shell/shell.css';

export default function DocsLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <DocsShell tree={source.getPageTree()} version={pkg.version}>
      {children}
    </DocsShell>
  );
}
```

`apps/docs/app/docs/[[...slug]]/page.tsx`:

```tsx
import pkg from '@snapshot-ui/react/package.json';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { ReactElement } from 'react';
import { getMDXComponents } from '@/components/mdx';
import { DocsHeader } from '@/components/shell/header';
import { Toc } from '@/components/shell/toc';
import { source } from '@/lib/source';

const GITHUB = 'https://github.com/amirehsan/snapshot-ui';

export default async function Page(props: PageProps<'/docs/[[...slug]]'>): Promise<ReactElement> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  const MDX = page.data.body;
  const group = page.slugs[0] === 'components' ? 'Components' : 'Getting started';

  return (
    <>
      <DocsHeader group={group} title={page.data.title} />
      <main className="content" id="main">
        {page.data.description ? <p className="page-lede">{page.data.description}</p> : null}
        <div className="panel">
          <div className="panel-main">
            <MDX components={getMDXComponents()} />
          </div>
          <aside className="panel-side" aria-label="On this page">
            {page.data.toc.length > 0 ? (
              <section className="card toc-card">
                <p className="eyebrow" style={{ marginBottom: 18 }}>
                  On this page
                </p>
                <Toc items={page.data.toc} />
              </section>
            ) : null}
            <section className="card">
              <p className="eyebrow" style={{ marginBottom: 18 }}>
                Package
              </p>
              <div className="meta">
                <div className="meta-row">
                  <span>Version</span>
                  <span className="badge">{pkg.version}</span>
                </div>
                <div className="meta-row">
                  <span>Source</span>
                  <a href={`${GITHUB}/tree/main/apps/docs/content/docs/${page.path}`}>Edit this page</a>
                </div>
                <div className="meta-row">
                  <span>Built on</span>
                  <a href="https://react-aria.adobe.com">React Aria</a>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}

export function generateStaticParams(): { slug?: string[] }[] {
  return source.generateParams();
}

export async function generateMetadata(props: PageProps<'/docs/[[...slug]]'>): Promise<Metadata> {
  const { slug } = await props.params;
  const page = source.getPage(slug);
  if (!page) notFound();
  return { title: page.data.title, description: page.data.description };
}
```

- [ ] **Step 7: Write the MDX components and the examples**

`apps/docs/components/mdx/index.tsx`:

```tsx
import type { MDXComponents } from 'mdx/types';
import { Code } from './code';
import { Keys } from './keys';
import { Preview } from './preview';
import { PropsTable } from './props-table';
import { Rules } from './rules';
import { Section } from './section';

/** Every element and component MDX pages may use, drawn in Snapshot UI. */
export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    h2: ({ children, ...props }) => (
      <h2 className="type-h3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }) => (
      <h3 className="type-h4" {...props}>
        {children}
      </h3>
    ),
    Section,
    Preview,
    Code,
    PropsTable,
    Keys,
    Rules,
    ...components,
  };
}

export const useMDXComponents = getMDXComponents;
```

`apps/docs/components/mdx/section.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';

/**
 * A stadium card. Its first heading is the card's title and the paragraph
 * right after it is the note above the rule, as in the mockup.
 */
export function Section({ children }: { children: ReactNode }): ReactElement {
  return <section className="card docs-section">{children}</section>;
}
```

`apps/docs/components/mdx/code.tsx`:

```tsx
import { codeToHtml, createCssVariablesTheme } from 'shiki';
import type { ReactElement } from 'react';
import { CopyButton } from './copy-button';

// Every token color is a CSS variable, mapped onto the palette in site.css, so
// code follows the color mode and never borrows a reserved color.
const theme = createCssVariablesTheme({ name: 'snapshot', variablePrefix: '--shiki-' });

/** Highlighted on the server, with a copy button. */
export async function Code({ code, lang = 'tsx' }: { code: string; lang?: string }): Promise<ReactElement> {
  const source = code.trim();
  const html = await codeToHtml(source, { lang, theme });
  return (
    <div className="code">
      {/* Shiki's output for our own example source, rendered on the server. */}
      <div dangerouslySetInnerHTML={{ __html: html }} />
      <CopyButton text={source} />
    </div>
  );
}
```

`apps/docs/components/mdx/copy-button.tsx`:

```tsx
'use client';

import { useState, type ReactElement } from 'react';

export function CopyButton({ text }: { text: string }): ReactElement {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-button icon-button-ghost code-copy"
      type="button"
      aria-label={copied ? 'Copied' : 'Copy code'}
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => {
            setCopied(false);
          }, 2000);
        });
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {copied ? (
          <path d="m5 12.5 5 5 9-10" />
        ) : (
          <>
            <rect x="9" y="9" width="11" height="11" rx="2" />
            <path d="M5 15V5a2 2 0 0 1 2-2h10" />
          </>
        )}
      </svg>
    </button>
  );
}
```

`apps/docs/components/mdx/preview.tsx`:

```tsx
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { ReactElement } from 'react';
import { examples, type ExampleName } from '@/examples';
import { Code } from './code';
import { PreviewTabs } from './preview-tabs';

/**
 * A live example and its source, read from disk at build time, so the code
 * shown is always the code running.
 */
export async function Preview({ name }: { name: ExampleName }): Promise<ReactElement> {
  const Example = examples[name];
  const source = await readFile(path.join(process.cwd(), 'examples', `${name}.tsx`), 'utf8');
  return <PreviewTabs preview={<Example />} code={<Code code={source} />} />;
}
```

`apps/docs/components/mdx/preview-tabs.tsx`:

```tsx
'use client';

import { useId, useState, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';

const TABS = ['Preview', 'Code'] as const;

/** Preview and Code as WAI-ARIA tabs: arrow keys move, the selected tab is the ink pill. */
export function PreviewTabs({ preview, code }: { preview: ReactNode; code: ReactNode }): ReactElement {
  const id = useId();
  const [selected, setSelected] = useState<(typeof TABS)[number]>('Preview');

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    const next = selected === 'Preview' ? 'Code' : 'Preview';
    setSelected(next);
    document.getElementById(`${id}-tab-${next}`)?.focus();
  };

  return (
    <div className="preview">
      <div className="preview-head">
        <p className="eyebrow">Example</p>
        <div className="tabs" role="tablist" aria-label="Example">
          {TABS.map((tab) => (
            <button
              key={tab}
              id={`${id}-tab-${tab}`}
              className="tab"
              type="button"
              role="tab"
              aria-selected={selected === tab}
              aria-controls={`${id}-panel-${tab}`}
              tabIndex={selected === tab ? 0 : -1}
              onClick={() => {
                setSelected(tab);
              }}
              onKeyDown={onKeyDown}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      <div id={`${id}-panel-Preview`} role="tabpanel" aria-labelledby={`${id}-tab-Preview`} hidden={selected !== 'Preview'}>
        <div className="stage">{preview}</div>
        <div className="stage-bar">
          <span>Follows the page theme and corners</span>
        </div>
      </div>
      <div id={`${id}-panel-Code`} role="tabpanel" aria-labelledby={`${id}-tab-Code`} hidden={selected !== 'Code'}>
        {code}
      </div>
    </div>
  );
}
```

`apps/docs/components/mdx/props-table.tsx`:

```tsx
import type { ReactElement, ReactNode } from 'react';
import { generator } from '@/lib/props';

/** JSDoc descriptions use backticks for code; render those spans as code. */
function inline(text: string): ReactNode[] {
  return text.split('`').map((part, index) => (index % 2 === 1 ? <code key={index}>{part}</code> : part));
}

/**
 * Props from the library's own types and JSDoc. `type` is usually a Pick of
 * the component's props: React Aria's inherited props include dozens of DOM
 * events nobody needs listed.
 */
export async function PropsTable({ path, type }: { path: string; type: string }): Promise<ReactElement> {
  const [doc] = await generator.generateTypeTable(
    { path, type },
    { typeSimplifier: { shouldSimplify: () => false } },
  );
  const entries = [...(doc?.entries ?? [])].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <div className="props">
      {entries.map((entry) => {
        const fallback = entry.tags.find((tag) => tag.name === 'default')?.text;
        return (
          <div className="prop" key={entry.name}>
            <div>
              <div className="prop-name">{entry.name}</div>
              <span className="prop-type">{entry.type.replace(/ \| undefined$/, '')}</span>
            </div>
            <div>
              <p>{inline(entry.description)}</p>
              {fallback ? <p className="prop-default">Default: {fallback}</p> : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

`apps/docs/components/mdx/keys.tsx`:

```tsx
import type { ReactElement } from 'react';

/** A keyboard table: each row is the keys, then what they do. */
export function Keys({ rows }: { rows: [keys: string, action: string][] }): ReactElement {
  return (
    <div className="keys">
      {rows.map(([keys, action]) => (
        <div className="key-row" key={keys}>
          <span>
            {keys.split(' ').map((key) => (
              <span className="kbd" key={key} style={{ marginRight: 6 }}>
                {key}
              </span>
            ))}
          </span>
          <span>{action}</span>
        </div>
      ))}
    </div>
  );
}
```

`apps/docs/components/mdx/rules.tsx`:

```tsx
import type { ReactElement } from 'react';

/** The design rules for a component: what to do, then what never to do. */
export function Rules({ dos, donts }: { dos: string[]; donts: string[] }): ReactElement {
  return (
    <div className="rules">
      {dos.map((rule) => (
        <div className="rule" key={rule}>
          <span className="rule-mark" role="img" aria-label="Do">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="m5 12.5 5 5 9-10" />
            </svg>
          </span>
          <p>{rule}</p>
        </div>
      ))}
      {donts.map((rule) => (
        <div className="rule" key={rule}>
          <span className="rule-mark rule-mark-no" role="img" aria-label="Do not">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </span>
          <p>{rule}</p>
        </div>
      ))}
    </div>
  );
}
```

`apps/docs/examples/index.ts`:

```ts
import type { ComponentType } from 'react';
import ButtonStates from './button-states';
import ButtonVariants from './button-variants';
import SpinnerSizes from './spinner-sizes';
import ThemeShapes from './theme-shapes';

/** Every example a page may show with <Preview name="..." />. */
export const examples = {
  'button-states': ButtonStates,
  'button-variants': ButtonVariants,
  'spinner-sizes': SpinnerSizes,
  'theme-shapes': ThemeShapes,
} satisfies Record<string, ComponentType>;

export type ExampleName = keyof typeof examples;
```

`apps/docs/examples/button-variants.tsx`:

```tsx
'use client';

import { Button } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ButtonVariants(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <Button>Save changes</Button>
      <Button variant="secondary">Preview</Button>
      <Button variant="tertiary">Discard</Button>
      <Button variant="danger">Delete site</Button>
    </div>
  );
}
```

`apps/docs/examples/button-states.tsx`:

```tsx
'use client';

import { Button } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function ButtonStates(): ReactElement {
  const [isPending, setPending] = useState(false);
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 12 }}>
      <Button
        isPending={isPending}
        pendingLabel="Saving"
        onPress={() => {
          setPending(true);
          setTimeout(() => {
            setPending(false);
          }, 2000);
        }}
      >
        Save changes
      </Button>
      <Button isDisabled>Save changes</Button>
      <Button variant="secondary" isDisabled>
        Preview
      </Button>
    </div>
  );
}
```

`apps/docs/examples/spinner-sizes.tsx`:

```tsx
'use client';

import { Spinner } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function SpinnerSizes(): ReactElement {
  return (
    <div className="row" style={{ justifyContent: 'center', gap: 32 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        Saving <Spinner aria-label="Saving" />
      </span>
      <Spinner size="md" />
      <Spinner size="lg" />
    </div>
  );
}
```

`apps/docs/examples/theme-shapes.tsx`:

```tsx
'use client';

import { Button } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const SHAPES = ['rounded', 'soft', 'square'] as const;

export default function ThemeShapes(): ReactElement {
  return (
    <div className="shape-samples">
      {SHAPES.map((shape) => (
        <div key={shape} className="shape-sample" data-shape={shape}>
          <p className="eyebrow">{shape}</p>
          <div className="row">
            <Button>Book a visit</Button>
          </div>
          <div className="card" style={{ padding: 20 }}>
            A card, cut {shape}.
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 8: Write the content**

`apps/docs/content/docs/meta.json`:

```json
{
  "title": "Docs",
  "pages": [
    "---Getting started---",
    "index",
    "installation",
    "theming",
    "design-principles",
    "---Components---",
    "...components"
  ]
}
```

`apps/docs/content/docs/components/meta.json`:

```json
{
  "title": "Components",
  "pages": ["button", "spinner"]
}
```

`apps/docs/content/docs/index.mdx`:

```mdx
---
title: Introduction
description: Snapshot UI is an accessible React component library for settings, dashboards and apps, in a warm, editorial design language.
icon: BookOpen
---

<Section>

## What it is

Components that read calm: cream surfaces, one typeface, corners from one scale and colors that carry meaning.

Every interactive component is built on [React Aria](https://react-aria.adobe.com), so keyboard use, focus and screen readers work the way the WAI-ARIA patterns describe. The styling is plain CSS in its own package, so the same look will serve a plain HTML version later.

</Section>

<Section>

## Packages

Two packages, released together with matching versions.

- `@snapshot-ui/core` holds the design tokens, the Tailwind v4 theme and every component's CSS. It has no JavaScript.
- `@snapshot-ui/react` holds the React components. It ships no CSS of its own.

</Section>

<Section>

## Status

The library is at 0.x and grows phase by phase.

Phase 1 is the foundation and the form basics. Choice controls and overlays, specialised inputs, lists and data, and the app shell follow, then charts and the HTML version. Breaking changes are possible before 1.0 and are always listed in the changelog.

</Section>
```

`apps/docs/content/docs/installation.mdx`:

```mdx
---
title: Installation
description: Add the two packages, import one stylesheet and load the font.
icon: Download
---

<Section>

## Install

Both packages, with React 19 or later.

<Code lang="bash" code="pnpm add @snapshot-ui/react @snapshot-ui/core" />

</Section>

<Section>

## Import the stylesheet

Once, at the root of your app. `styles.css` holds the tokens and every component. `base.css` is optional: it sets the page background, the body type and the font rendering details.

<Code code={`import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';`} />

The CSS sits in cascade layers, so your own unlayered CSS always wins, and Tailwind's utilities win over the components.

</Section>

<Section>

## Load the font

Snapshot UI sets body text at weight 450, which only a variable font has. In Next.js, `next/font` self-hosts it and sets the family the tokens read:

<Code code={`import { Sofia_Sans } from 'next/font/google';

const sofia = Sofia_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={sofia.variable}>
      <body>{children}</body>
    </html>
  );
}`} />

Anywhere else, install `@fontsource-variable/sofia-sans` and import it once. The font stack already includes its family name.

</Section>

<Section>

## Next.js server components

Every component file carries `'use client'`, so a server component or an MDX page can render them directly. React Aria itself must never be imported into a server component.

</Section>

<Section>

## Tailwind CSS, if you use it

`tailwind.css` exposes the tokens as utilities, such as `bg-canvas`, `text-slate`, `rounded-control` and `p-part`. It also removes Tailwind's default radii, text sizes and shadows, so an off-system value like `rounded-lg` compiles to nothing.

<Code lang="css" code={`@import 'tailwindcss';
@import '@snapshot-ui/core/tailwind.css';
@import '@snapshot-ui/core/styles.css';`} />

</Section>
```

`apps/docs/content/docs/theming.mdx`:

```mdx
---
title: Theming
description: Two attributes theme any element and everything inside it, color mode and corner shape.
icon: Contrast
---

<Section>

## Color mode

Set `data-theme="light"` or `data-theme="dark"` on any element. With no attribute on the page, dark follows the system setting.

<Code code={`<html data-theme="dark">`} />

With `next-themes`, use the attribute mode:

<Code code={`<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>`} />

</Section>

<Section>

## Corner shape

Set `data-shape` to `rounded`, `soft` or `square`. Every corner in the library comes from one scale, so one attribute recuts all of them. Dots, such as a radio's indicator, stay round in every shape, because there roundness carries meaning.

<Preview name="theme-shapes" />

</Section>

<Section>

## Nesting

Both attributes work on any element, and the nearest one wins. A light card inside a dark page takes its own colors and its own text color.

<Code code={`<main data-theme="dark">
  <section data-theme="light" data-shape="square">...</section>
</main>`} />

</Section>

<Section>

## Tokens

Every value is a CSS variable you can read, such as `var(--color-ink)`, `var(--radius-control)` or `var(--spacing-peer)`. The same tokens are available in JavaScript, with each mode's value:

<Code code={`import { tokens } from '@snapshot-ui/core/tokens';

tokens.color.slate.var; // 'var(--color-slate)'
tokens.radius.pill.modes.shape.soft; // '12px'`} />

</Section>
```

`apps/docs/content/docs/design-principles.mdx`:

```mdx
---
title: Design principles
description: The rules behind every component, from the design system document in the repository.
icon: Compass
---

<Section>

## Surfaces

The page is a warm cream, never pure white. Cards are one step lighter, floating chrome such as a menu is white, and dark mode keeps the same steps on a near-black ladder.

</Section>

<Section>

## Type

One family, Sofia Sans. Body text is weight 450, headings 500 with tight tracking, and uppercase is reserved for the small eyebrow label with its accent dot.

</Section>

<Section>

## Corners

Corners come from a gapped scale: 6, 20, 24 and 40 pixels, pills and circles, and nothing in between. Rounded inside rounded steps down one place, so a field inside a card is never as round as the card.

</Section>

<Section>

## Color carries meaning

Signal orange is only for consent and legal actions. Clay means unsaved. Error and success mean exactly that. None of them is ever decoration, not even in sample content.

</Section>

<Section>

## Measured, not chosen by eye

Every color pairing is checked against WCAG contrast in both modes, and every control boundary clears 3:1. The full reasoning, with each measurement, is in the [design system document](https://github.com/amirehsan/snapshot-ui/blob/main/docs/design-system.md).

</Section>
```

`apps/docs/content/docs/components/button.mdx`:

```mdx
---
title: Button
description: A pressable action. Primary for the one thing a view is for, secondary beside it, tertiary for the quiet way out and danger for a destructive confirmation.
icon: RectangleHorizontal
---

<Section>

## Variants

Signal orange is deliberately not a variant: it is reserved for consent and legal actions.

<Preview name="button-variants" />

</Section>

<Section>

## States

Pending keeps the width and the focus, and announces itself. Disabled is the only grey.

<Preview name="button-states" />

</Section>

<Section>

## Usage

Pass `isPending` while work runs. The button stays focusable, ignores presses and does not submit its form.

<Code code={`import { Button } from '@snapshot-ui/react';

export function SaveBar({ isSaving }: { isSaving: boolean }) {
  return (
    <Button type="submit" isPending={isSaving} pendingLabel="Saving">
      Save changes
    </Button>
  );
}`} />

</Section>

<Section>

## Props

Every React Aria Button prop is accepted. These are the ones Snapshot UI adds or shapes.

<PropsTable path="../../packages/react/src/button/Button.tsx" type="Pick<ButtonProps, 'variant' | 'isPending' | 'pendingLabel' | 'isDisabled' | 'onPress'>" />

</Section>

<Section>

## Accessibility

A native button element, with React Aria handling press across mouse, touch and keyboard.

<Keys rows={[['Space Enter', 'Activates the button.'], ['Tab', 'Moves focus to it. The 2px ink ring sits outside the pill.']]} />

</Section>

<Section>

## Design rules

What keeps buttons in the system.

<Rules dos={['One primary per view. Pair it with a secondary or a tertiary.', 'Labels are verbs in sentence case, such as Save changes.']} donts={['Never orange. Signal orange belongs to consent and legal actions.']} />

</Section>
```

`apps/docs/content/docs/components/spinner.mdx`:

```mdx
---
title: Spinner
description: An indeterminate loading indicator that takes the color and size of the text around it.
icon: LoaderCircle
---

<Section>

## Sizes

Inline, it follows the surrounding text. Medium is 24px and large is 40px.

<Preview name="spinner-sizes" />

</Section>

<Section>

## Usage

Give it a name that says what is loading. A Button shows one by itself while `isPending`.

<Code code={`import { Spinner } from '@snapshot-ui/react';

<Spinner aria-label="Loading results" size="md" />`} />

</Section>

<Section>

## Props

The size, and React Aria ProgressBar's labelling props.

<PropsTable path="../../packages/react/src/spinner/Spinner.tsx" type="Pick<SpinnerProps, 'size' | 'aria-label'>" />

</Section>

<Section>

## Accessibility

Announced as an indeterminate progress bar. Under reduced motion it slows down rather than stopping, because a still spinner reads as finished.

</Section>
```

- [ ] **Step 9: Build, check and run the tests**

```bash
pnpm --filter @snapshot-ui/docs build
pnpm --filter @snapshot-ui/docs typecheck
pnpm --filter @snapshot-ui/docs lint
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected:
- `next build` finishes TypeScript and prerenders the six docs pages as SSG, with `/api/search` dynamic.
- The type-check and lint print nothing. React's hooks rules forbid setting state inside an effect, which is why browser-only values come from `lib/document-state.ts`.
- 12 end-to-end tests pass, including axe in both color modes and no sideways scroll at 375, 768, 1024 and 1440.

Then open `pnpm --filter @snapshot-ui/docs dev` and compare `/docs/components/button` with `docs/mockups/component.html` side by side, in light and dark and in all three shapes. Collapse the rail and open the drawer at tablet width.

- [ ] **Step 10: Commit**

```bash
git add apps/docs
git commit -m "feat(docs): add the docs site, drawn in Snapshot UI over headless Fumadocs"
```

### Task 12: The docs homepage

**Files:**
- Create: `apps/docs/app/(home)/page.tsx`, `apps/docs/app/(home)/home-page.tsx`, `apps/docs/app/(home)/home.css`
- Test: `apps/docs/tests/home.spec.ts`

**Interfaces:**
- Consumes: `SearchDialog` from Task 11, `useShape` and `writeShape` from `lib/document-state.ts` and `lib/prepaint.ts`, and the stand-in classes in `app/site.css`.
- Produces: the `/` route, a port of `docs/mockups/home.html` with these changes:
  - Links go to the real routes or the GitHub repository.
  - Components not built yet show as plain chips rather than links.
  - The watermark word is drawn by CSS, so it is not text a contrast check reads.
  - The sample cards' titles are styled paragraphs rather than headings, so the outline goes from the h1 straight to the h2s.
  - The language pill is gone, because the site has no translations.

- [ ] **Step 1: Write the end-to-end tests**

`apps/docs/tests/home.spec.ts`:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const sideways = (page: Page): Promise<number> =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

for (const width of [375, 768, 1024, 1440]) {
  test(`the homepage fits ${String(width)}px with no sideways scroll`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    expect(await sideways(page)).toBe(0);
  });
}

for (const theme of ['light', 'dark'] as const) {
  test(`the homepage has no axe violations in ${theme}`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: theme });
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });
}

test('the homepage switches corners and remembers them', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Calm interfaces for settings, dashboards and apps.',
  );
  await page.locator('label', { hasText: 'Square' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-shape', 'square');
});

test('on a phone the menu opens full screen and Escape closes it', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  const open = page.getByRole('button', { name: 'Open menu' });
  await open.click();
  const menu = page.getByRole('navigation', { name: 'Menu' });
  await expect(menu).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(open).toBeFocused();
});
```

Run: `pnpm --filter @snapshot-ui/docs build && pnpm --filter @snapshot-ui/docs exec playwright test tests/home.spec.ts`
Expected: FAIL, `/` is a 404.

- [ ] **Step 2: Write the homepage**

`apps/docs/app/(home)/page.tsx`:

```tsx
import type { Metadata } from 'next';
import type { ReactElement } from 'react';
import { HomePage } from './home-page';
import './home.css';

export const metadata: Metadata = {
  title: { absolute: 'Snapshot UI: calm interfaces for settings, dashboards and apps' },
};

export default function Home(): ReactElement {
  return <HomePage />;
}
```

`apps/docs/app/(home)/home-page.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { SearchDialog } from '@/components/shell/search';
import { useShape } from '@/lib/document-state';
import { writeShape, type Shape } from '@/lib/prepaint';

const INSTALL = 'pnpm add @snapshot-ui/react @snapshot-ui/core';

/** A stand-in switch for the homepage's sample settings. Phase 1b replaces it with Switch. */
function DemoSwitch({ label, defaultOn }: { label: string; defaultOn: boolean }): ReactElement {
  const [on, setOn] = useState(defaultOn);
  return (
    <button
      className="switch"
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        setOn(!on);
      }}
    />
  );
}

export function HomePage(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const shape = useShape();
  const [copied, setCopied] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => {
    // The footer's columns fold on phones and stay open everywhere else.
    if (matchMedia('(width < 768px)').matches) {
      document.querySelectorAll('.footer-col').forEach((column) => {
        column.removeAttribute('open');
      });
    }
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    if (menuOpen) closeButton.current?.focus();
    else if (wasOpen.current) menuButton.current?.focus();
    wasOpen.current = menuOpen;
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const toggleTheme = (): void => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const changeShape = (next: Shape): void => {
    writeShape(next);
  };

  const copyInstall = (): void => {
    void navigator.clipboard.writeText(INSTALL).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  return (
    <>
      <div className="nav-wrap">
            <nav className="nav" aria-label="Main">
              <Link className="brand" href="/">
                <svg viewBox="0 0 26 26" fill="none" aria-hidden>
                  <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2" />
                  <circle cx="21.5" cy="7" r="3.5" fill="var(--color-signal-light)" />
                </svg>
                snapshot ui
              </Link>
              <div className="nav-links">
                <Link href="/docs">Docs</Link>
                <Link href="/docs/components/button">Components</Link>
                <Link href="/docs/theming">Theming</Link>
                <a href="https://github.com/amirehsan/snapshot-ui/releases">Changelog</a>
              </div>
              <div className="nav-actions">
                <button className="icon-button icon-button-ghost" type="button" aria-label="Search the docs" onClick={() => {
              setSearchOpen(true);
            }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 5 5" /></svg>
                </button>
                <button className="icon-button icon-button-ghost" type="button" aria-label="Toggle dark mode" onClick={toggleTheme}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.2 8.2 0 1 0 20 14.5z" /></svg>
                </button>
                <a className="icon-button icon-button-ghost" href="https://github.com/amirehsan/snapshot-ui" aria-label="GitHub">
                  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" /></svg>
                </a>
                <Link className="button nav-cta" href="/docs/installation">Get started</Link>
                <button ref={menuButton} className="icon-button icon-button-ghost nav-menu" type="button" aria-label="Open menu" aria-expanded={menuOpen} aria-controls="nav-overlay" onClick={() => {
              setMenuOpen(true);
            }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
                </button>
              </div>
            </nav>
          </div>
          <div className="nav-overlay" id="nav-overlay" hidden={!menuOpen}>
            <div className="nav-overlay-head">
              <span className="brand">
                <svg viewBox="0 0 26 26" fill="none" aria-hidden><circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2" /><circle cx="21.5" cy="7" r="3.5" fill="var(--color-signal-light)" /></svg>
                snapshot ui
              </span>
              <button ref={closeButton} className="icon-button nav-close" type="button" aria-label="Close menu" onClick={() => {
            setMenuOpen(false);
          }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <nav className="nav-overlay-links" aria-label="Menu">
              <Link className="type-h2" href="/docs">Docs</Link>
              <Link className="type-h2" href="/docs/components/button">Components</Link>
              <Link className="type-h2" href="/docs/theming">Theming</Link>
              <a className="type-h2" href="https://github.com/amirehsan/snapshot-ui/releases">Changelog</a>
            </nav>
            <Link className="button button-large" href="/docs/installation">Get started</Link>
          </div>

          <main className="page">
            <section className="hero">
              <div>
                <p className="eyebrow">Component library</p>
                <h1 className="type-h1">Calm interfaces for settings, dashboards and apps.</h1>
              </div>
              <div className="hero-side">
                <p className="lede">
                  Snapshot UI is an accessible React library in a warm, editorial voice: cream surfaces, one typeface and
                  corners that round with intent. Plain HTML is next.
                </p>
                <div className="row">
                  <Link className="button button-large" href="/docs/installation">Get started</Link>
                  <Link className="button button-secondary button-large" href="/docs/components/button">Browse components</Link>
                </div>
                <div className="install">
                  <span><b>$</b> pnpm add @snapshot-ui/react @snapshot-ui/core</span>
                  <button className="icon-button icon-button-ghost" type="button" aria-label={copied ? 'Copied' : 'Copy install command'} onClick={copyInstall}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
                  </button>
                </div>
                <div className="shape-switch">
                  <span className="type-small muted">Corners</span>
                  <div className="segmented segmented-small" role="radiogroup" aria-label="Corners">
                    <label className="segmented-option"><input type="radio" name="shape" value="rounded" checked={shape === 'rounded'} onChange={() => { changeShape('rounded'); }} />Rounded</label>
                    <label className="segmented-option"><input type="radio" name="shape" value="soft" checked={shape === 'soft'} onChange={() => { changeShape('soft'); }} />Soft</label>
                    <label className="segmented-option"><input type="radio" name="shape" value="square" checked={shape === 'square'} onChange={() => { changeShape('square'); }} />Square</label>
                  </div>
                </div>
              </div>
            </section>

            <section className="frame" data-theme="dark" aria-label="Components at work">
              <svg className="frame-arc" viewBox="0 0 1180 560" preserveAspectRatio="none" fill="none" aria-hidden>
                <path d="M-20 470 C 260 300, 620 620, 1200 120" stroke="var(--color-signal-light)" strokeWidth="1.5" />
              </svg>
              <div className="card frame-card" data-theme="light">
                <div className="card-header">
                  <p className="type-h3">Notifications</p>
                  <p className="muted">Where we reach you, and how often.</p>
                </div>
                <div className="settings-list">
                  <div className="setting">
                    <div>
                      <div className="type-h4">Product updates</div>
                      <div className="field-hint">A short note when something ships.</div>
                    </div>
                    <DemoSwitch label="Product updates" defaultOn={true} />
                  </div>
                  <div className="setting">
                    <div>
                      <div className="type-h4">Weekly digest</div>
                      <div className="field-hint">Every Tuesday morning.</div>
                    </div>
                    <DemoSwitch label="Weekly digest" defaultOn={false} />
                  </div>
                  <div className="setting">
                    <div>
                      <div className="type-h4">Security alerts</div>
                      <div className="field-hint">Always on for owners.</div>
                    </div>
                    <DemoSwitch label="Security alerts" defaultOn={true} />
                  </div>
                </div>
              </div>
              <div className="card frame-card frame-card-offset" data-theme="light">
                <div className="card-header">
                  <p className="type-h3">Workspace</p>
                  <p className="muted">Shown in the header and in every invite.</p>
                </div>
                <div className="stack">
                  <label className="field">
                    <span className="field-label">Workspace name <span className="field-marker">Changed</span></span>
                    <input className="input input-changed" defaultValue="Northwind Studio" />
                  </label>
                  <div className="field">
                    <span className="field-label">Theme</span>
                    <div className="segmented" role="radiogroup" aria-label="Theme">
                      <label className="segmented-option"><input type="radio" name="demo-theme" />Light</label>
                      <label className="segmented-option"><input type="radio" name="demo-theme" />Dark</label>
                      <label className="segmented-option"><input type="radio" name="demo-theme" defaultChecked />System</label>
                    </div>
                  </div>
                  <div className="row row-end">
                    <button className="button button-tertiary" type="button">Discard</button>
                    <button className="button" type="button">Save changes</button>
                  </div>
                </div>
              </div>
              <div className="toast" data-theme="light" role="status">
                <span className="toast-dot"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12.5 5 5 9-10" /></svg></span>
                Saved. Your changes are live.
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Foundations</p>
                  <h2 className="type-h2">One voice, measured rather than chosen by eye.</h2>
                </div>
                <p className="lede">
                  Every color pairing is checked for contrast in both themes, every corner comes from one scale, and every
                  component is keyboard first.
                </p>
              </div>
              <div className="orbit">
                <svg className="orbit-arc" viewBox="0 0 1280 420" preserveAspectRatio="none" fill="none" aria-hidden>
                  <path d="M40 300 C 300 40, 520 420, 760 250 S 1180 60, 1290 200" stroke="var(--color-signal-light)" strokeWidth="1.5" />
                </svg>
                <article className="portrait">
                  <div className="portrait-circle">
                    <span className="portrait-glyph">Aa</span>
                    <Link className="satellite" href="/docs/design-principles" aria-label="Typography">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </Link>
                  </div>
                  <p className="eyebrow">Type</p>
                  <h3 className="type-h3">One family, at a body weight of 450.</h3>
                </article>
                <article className="portrait">
                  <div className="portrait-circle">
                    <div className="shape-stack"><span></span><span></span><span></span></div>
                    <Link className="satellite" href="/docs/theming" aria-label="Shape">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </Link>
                  </div>
                  <p className="eyebrow">Shape</p>
                  <h3 className="type-h3">Rounded, Soft or Square, from one attribute.</h3>
                </article>
                <article className="portrait">
                  <div className="portrait-circle">
                    <div className="contrast-glyph"><span>Aa</span><span>Aa</span></div>
                    <Link className="satellite" href="/docs/design-principles" aria-label="Accessibility">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </Link>
                  </div>
                  <p className="eyebrow">Access</p>
                  <h3 className="type-h3">WCAG 2.2 AA, built on React Aria.</h3>
                </article>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Theme axes</p>
                  <h2 className="type-h2">Two switches. Every component follows.</h2>
                </div>
                <p className="lede">Set data-theme and data-shape on any element. A light card inside a dark page just works.</p>
              </div>
              <div className="axes">
                <div className="axis-tile" data-theme="light" data-shape="rounded">
                  <div className="axis-label"><span>Light</span><span>Rounded</span></div>
                  <div className="card stack">
                    <input className="input" placeholder="Search settings" />
                    <div className="row row-between">
                      <DemoSwitch label="Sample" defaultOn={true} />
                      <div className="row"><button className="icon-button" type="button" aria-label="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></button><button className="button" type="button">Book a visit</button></div>
                    </div>
                  </div>
                </div>
                <div className="axis-tile" data-theme="light" data-shape="soft">
                  <div className="axis-label"><span>Light</span><span>Soft</span></div>
                  <div className="card stack">
                    <input className="input" placeholder="Search settings" />
                    <div className="row row-between">
                      <DemoSwitch label="Sample" defaultOn={true} />
                      <div className="row"><button className="icon-button" type="button" aria-label="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></button><button className="button" type="button">Book a visit</button></div>
                    </div>
                  </div>
                </div>
                <div className="axis-tile" data-theme="light" data-shape="square">
                  <div className="axis-label"><span>Light</span><span>Square</span></div>
                  <div className="card stack">
                    <input className="input" placeholder="Search settings" />
                    <div className="row row-between">
                      <DemoSwitch label="Sample" defaultOn={true} />
                      <div className="row"><button className="icon-button" type="button" aria-label="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></button><button className="button" type="button">Book a visit</button></div>
                    </div>
                  </div>
                </div>
                <div className="axis-tile" data-theme="dark" data-shape="rounded">
                  <div className="axis-label"><span>Dark</span><span>Rounded</span></div>
                  <div className="card stack">
                    <input className="input" placeholder="Search settings" />
                    <div className="row row-between">
                      <DemoSwitch label="Sample" defaultOn={true} />
                      <div className="row"><button className="icon-button" type="button" aria-label="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></button><button className="button" type="button">Book a visit</button></div>
                    </div>
                  </div>
                </div>
                <div className="axis-tile" data-theme="dark" data-shape="soft">
                  <div className="axis-label"><span>Dark</span><span>Soft</span></div>
                  <div className="card stack">
                    <input className="input" placeholder="Search settings" />
                    <div className="row row-between">
                      <DemoSwitch label="Sample" defaultOn={true} />
                      <div className="row"><button className="icon-button" type="button" aria-label="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></button><button className="button" type="button">Book a visit</button></div>
                    </div>
                  </div>
                </div>
                <div className="axis-tile" data-theme="dark" data-shape="square">
                  <div className="axis-label"><span>Dark</span><span>Square</span></div>
                  <div className="card stack">
                    <input className="input" placeholder="Search settings" />
                    <div className="row row-between">
                      <DemoSwitch label="Sample" defaultOn={true} />
                      <div className="row"><button className="icon-button" type="button" aria-label="Call"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" /></svg></button><button className="button" type="button">Book a visit</button></div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="section-head">
                <div>
                  <p className="eyebrow">Components</p>
                  <h2 className="type-h2">Everything a dashboard asks for.</h2>
                </div>
                <p className="lede">From a single switch to the whole app shell. Published as you build, at 0.x, from the first phase.</p>
              </div>
              <div className="catalog">
                <div className="card catalog-group">
                  <p className="eyebrow">Forms</p>
                  <div className="chips">
                    <Link className="chip" href="/docs/components/button">Button</Link><span className="chip">Icon button</span><span className="chip">Text field</span><span className="chip">Text area</span><span className="chip">Checkbox</span><span className="chip">Radio group</span><span className="chip">Switch</span><span className="chip">Segmented control</span><span className="chip">Select</span><span className="chip">Combo box</span><span className="chip">Tag input</span>
                  </div>
                </div>
                <div className="card catalog-group">
                  <p className="eyebrow">Dates and media</p>
                  <div className="chips">
                    <span className="chip">Date picker</span><span className="chip chip-new">Date range</span><span className="chip">Time field</span><span className="chip">Color field</span><span className="chip">Icon picker</span><span className="chip">Media input</span><span className="chip chip-new">Slider</span><span className="chip">Rich text</span>
                  </div>
                </div>
                <div className="card catalog-group">
                  <p className="eyebrow">Lists and data</p>
                  <div className="chips">
                    <span className="chip chip-new">Data table</span><span className="chip">Sortable list</span><span className="chip">Tree builder</span><span className="chip">Master detail</span><span className="chip">Transfer list</span><span className="chip">Stat tile</span><span className="chip">Empty state</span><span className="chip chip-new">Charts</span>
                  </div>
                </div>
                <div className="card catalog-group">
                  <p className="eyebrow">Overlays and shell</p>
                  <div className="chips">
                    <span className="chip">Dialog</span><span className="chip">Toast</span><span className="chip">Tooltip</span><span className="chip">Menu</span><span className="chip">Drawer</span><span className="chip">Command palette</span><span className="chip">Sidebar</span><span className="chip">Save bar</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="cta">
              <span className="watermark" aria-hidden />
              <div className="cta-inner">
                <p className="eyebrow">Open source, MIT</p>
                <h2 className="type-h2">Start with a button. Ship the whole settings page.</h2>
                <div className="row">
                  <Link className="button button-large" href="/docs/components/button">Read the docs</Link>
                  <a className="button button-secondary button-large" href="https://github.com/amirehsan/snapshot-ui">Star on GitHub</a>
                </div>
              </div>
            </section>
          </main>

          <footer className="footer" data-theme="dark">
            <div className="page">
              <h2 className="type-h2">Everything you need to build a calm product, whenever you need it.</h2>
              <div className="footer-cols">
                <details className="footer-col" open><summary>Docs</summary><div className="footer-links"><Link href="/docs">Introduction</Link><Link href="/docs/installation">Installation</Link><Link href="/docs/theming">Theming</Link><Link href="/docs/design-principles">Design principles</Link></div></details>
                <details className="footer-col" open><summary>Components</summary><div className="footer-links"><Link href="/docs/components/button">Button</Link><Link href="/docs/components/spinner">Spinner</Link></div></details>
                <details className="footer-col" open><summary>Community</summary><div className="footer-links"><a href="https://github.com/amirehsan/snapshot-ui">GitHub &#8599;</a><a href="https://github.com/amirehsan/snapshot-ui/discussions">Discussions &#8599;</a><a href="https://github.com/amirehsan/snapshot-ui/blob/main/CONTRIBUTING.md">Contributing</a><a href="https://github.com/amirehsan/snapshot-ui/blob/main/CODE_OF_CONDUCT.md">Code of conduct</a></div></details>
                <details className="footer-col" open><summary>Project</summary><div className="footer-links"><a href="https://github.com/amirehsan/snapshot-ui/releases">Changelog</a><a href="https://github.com/amirehsan/snapshot-ui/blob/main/SECURITY.md">Security</a><a href="https://github.com/amirehsan/snapshot-ui/blob/main/LICENSE">MIT License</a></div></details>
              </div>
              <div className="footer-bottom">
                <span>&#169; 2026 Snapshot UI. Released under the MIT License.</span>
                <span>Built on React Aria</span>
              </div>
            </div>
          </footer>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
```

`apps/docs/app/(home)/home.css`:

```css
/* The homepage, from docs/mockups/home.html. */
@layer components {
  .page {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 48px;
  }

  /* ---- Floating nav pill ----------------------------------------- */
  .nav-wrap {
    position: sticky;
    top: 24px;
    z-index: 20;
    padding: 0 48px;
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 40px;
    max-width: 1184px;
    margin: 0 auto;
    padding: 10px 12px 10px 28px;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-pill);
    background-color: color-mix(in srgb, var(--color-float) 88%, transparent);
    box-shadow: var(--shadow-lift);
    backdrop-filter: blur(16px) saturate(140%);
    transition: border-radius 200ms ease;
  }

  .nav-links {
    display: flex;
    gap: 36px;
    margin-right: auto;
    font-weight: 500;
    letter-spacing: -0.02em;
  }

  .nav-links a {
    color: var(--color-slate);
  }

  .nav-links a:hover,
  .nav-links a[aria-current='page'] {
    color: var(--color-ink);
  }

  .nav-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  /* ---- Hero ------------------------------------------------------ */
  .hero {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 64px;
    align-items: end;
    padding: 120px 0 56px;
  }

  .hero h1 {
    max-width: 11ch;
    margin-top: 24px;
  }

  .hero-side {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 28px;
    padding-bottom: 10px;
  }

  .lede {
    color: var(--color-charcoal);
    font-size: 1.1875rem;
    line-height: 1.5;
    max-width: 44ch;
  }

  .install {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 6px 6px 22px;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-pill);
    background-color: var(--color-float);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    color: var(--color-charcoal);
    transition: border-radius 200ms ease;
  }

  .install b {
    color: var(--color-slate);
    font-weight: 400;
  }

  .shape-switch {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* ---- Stadium hero frame -------------------------------------- */
  .frame {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1.1fr;
    gap: 28px;
    align-items: start;
    padding: 56px;
    border: 1px solid var(--color-hairline);
    border-radius: var(--radius-stadium);
    background-color: var(--color-canvas);
    box-shadow: var(--shadow-float);
    overflow: hidden;
    transition: border-radius 200ms ease;
  }

  .frame-light {
    background-color: #2b2b2a;
  }

  .frame .card {
    box-shadow: var(--shadow-float);
  }

  .frame-arc {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .toast {
    position: absolute;
    right: 56px;
    bottom: 40px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px 14px 16px;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-surface);
    background-color: var(--color-float);
    box-shadow: var(--shadow-float);
    font-weight: 500;
    transition: border-radius 200ms ease;
  }

  .toast-dot {
    display: grid;
    place-items: center;
    width: 24px;
    height: 24px;
    border-radius: var(--radius-dot);
    background-color: var(--color-success);
    color: var(--color-canvas);
  }

  .toast-dot svg {
    width: 14px;
    height: 14px;
  }

  /* ---- Section heads -------------------------------------------- */
  .section {
    padding: 128px 0 0;
  }

  .section-head {
    display: grid;
    grid-template-columns: 1.25fr 1fr;
    gap: 64px;
    align-items: end;
    margin-bottom: 56px;
  }

  .section-head h2 {
    margin-top: 20px;
    max-width: 16ch;
  }

  /* ---- Orbit: circular portraits ---------------------------------- */
  .orbit {
    position: relative;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 48px;
  }

  .orbit-arc {
    position: absolute;
    left: -48px;
    right: -48px;
    top: -40px;
    height: 420px;
    width: calc(100% + 96px);
    pointer-events: none;
  }

  .portrait {
    position: relative;
    display: grid;
    justify-items: start;
    gap: 18px;
  }

  .portrait:nth-child(3) {
    margin-top: 120px;
  }

  .portrait:nth-child(4) {
    margin-top: 40px;
  }

  .portrait-circle {
    position: relative;
    display: grid;
    place-items: center;
    width: 280px;
    height: 280px;
    border-radius: var(--radius-dot);
    background-color: var(--color-lifted);
    box-shadow: var(--shadow-float);
  }

  .portrait-glyph {
    font-size: 6rem;
    font-weight: 500;
    letter-spacing: -0.04em;
    line-height: 1;
  }

  .satellite {
    position: absolute;
    right: 6px;
    bottom: 22px;
    display: grid;
    place-items: center;
    width: 56px;
    height: 56px;
    border-radius: var(--radius-dot);
    background-color: #ffffff;
    color: #141413;
    box-shadow: var(--shadow-lift);
  }

  .satellite svg {
    width: 20px;
    height: 20px;
  }

  .portrait p {
    max-width: 34ch;
  }

  .shape-stack {
    position: relative;
    width: 140px;
    height: 120px;
  }

  .shape-stack span {
    position: absolute;
    width: 96px;
    height: 72px;
    border: 1.5px solid var(--color-ink);
    background-color: var(--color-float);
  }

  .shape-stack span:nth-child(1) {
    left: 0;
    top: 0;
    border-radius: 36px;
  }

  .shape-stack span:nth-child(2) {
    left: 22px;
    top: 24px;
    border-radius: 12px;
  }

  .shape-stack span:nth-child(3) {
    left: 44px;
    top: 48px;
    border-radius: 0;
    background-color: var(--color-ink);
  }

  .contrast-glyph {
    display: flex;
    gap: 10px;
  }

  .contrast-glyph span {
    display: grid;
    place-items: center;
    width: 76px;
    height: 76px;
    border-radius: var(--radius-dot);
    font-size: 1.5rem;
    font-weight: 700;
  }

  .contrast-glyph span:first-child {
    background-color: var(--color-ink);
    color: var(--color-canvas);
  }

  .contrast-glyph span:last-child {
    border: 1.5px solid var(--color-ink);
  }

  /* ---- Theme axes grid ----------------------------------------- */
  .axes {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
  }

  .axis-tile {
    display: grid;
    gap: 20px;
    padding: 28px;
    border: 1px solid var(--color-frame);
    border-radius: var(--radius-stadium);
    background-color: var(--color-canvas);
    color: var(--color-ink);
  }

  .axis-tile .card {
    padding: 22px;
    border-radius: var(--radius-surface);
  }

  .axis-label {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-small);
    color: var(--color-slate);
    font-weight: 500;
  }

  /* ---- Catalog ---------------------------------------------------- */
  .catalog {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .catalog-group {
    display: grid;
    gap: 18px;
    align-content: start;
  }

  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  /* ---- Watermark CTA -------------------------------------------- */
  .cta {
    position: relative;
    margin-top: 128px;
    padding: 112px 64px;
    border-radius: var(--radius-stadium);
    background-color: var(--color-lifted);
    overflow: hidden;
    transition: border-radius 200ms ease;
  }

  /* Drawn by CSS, not written in the page: decorative text is not content,
     and a deliberately faint word would fail a contrast check as text. */
  .watermark::before {
    content: 'snapshot';
  }

  .watermark {
    position: absolute;
    right: -20px;
    bottom: -48px;
    font-size: 14rem;
    line-height: 1;
    font-weight: 500;
    letter-spacing: -0.04em;
    color: color-mix(in srgb, var(--color-ink) 5%, transparent);
    pointer-events: none;
    user-select: none;
  }

  .cta-inner {
    position: relative;
    display: grid;
    gap: 28px;
    max-width: 620px;
  }

  /* ---- Footer: ink in light, Deep Well in dark --------------------- */
  .footer {
    margin-top: 128px;
    padding: 96px 0 120px;
    background-color: #141413;
    color: #ffffff;
  }

  [data-theme='dark'] .footer {
    background-color: #050505;
  }

  .footer h2 {
    max-width: 18ch;
    margin-bottom: 72px;
  }

  .footer-cols {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 32px;
    padding-bottom: 64px;
  }

  .footer-col {
    display: grid;
    gap: 14px;
    align-content: start;
    font-size: 0.875rem;
  }

  .footer-col summary {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
    color: rgb(255 255 255 / 0.6);
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    list-style: none;
    pointer-events: none;
  }

  .footer-col summary::-webkit-details-marker {
    display: none;
  }

  .footer-links {
    display: grid;
    gap: 14px;
  }

  .footer-col a {
    color: rgb(255 255 255 / 0.85);
  }

  .footer-col a:hover {
    color: #ffffff;
  }

  .footer-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-top: 28px;
    border-top: 1px solid rgb(255 255 255 / 0.18);
    color: rgb(255 255 255 / 0.6);
    font-size: 0.875rem;
  }

  .footer-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    border: 1px solid rgb(255 255 255 / 0.4);
    border-radius: var(--radius-pill);
    color: #ffffff;
  }
  .frame-card {
    position: relative;
  }

  .frame-card-offset {
    margin-top: 64px;
  }

  .row-end {
    justify-content: flex-end;
  }

  .nav-menu {
    display: none;
  }

  .nav-overlay {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: flex;
    flex-direction: column;
    gap: 40px;
    padding: 20px 16px 32px;
    background-color: var(--color-canvas);
  }

  .nav-overlay[hidden] {
    display: none;
  }

  .nav-overlay-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 4px 4px 12px;
  }

  .nav-overlay-links {
    display: grid;
    gap: 20px;
    padding: 0 12px;
  }

  .nav-overlay .button {
    margin: auto 12px 0;
  }

  /* ---- Tablet: 768 to 1023 ------------------------------------------ */
  @media (width < 1024px) {
    .page,
    .nav-wrap {
      padding-inline: 32px;
    }

    .nav {
      gap: 16px;
      padding-left: 20px;
    }

    .nav-links {
      display: none;
    }

    .nav-actions {
      margin-left: auto;
    }

    .nav-menu {
      display: inline-grid;
    }

    .hero,
    .section-head {
      grid-template-columns: minmax(0, 1fr);
      gap: 28px;
    }

    .hero > *,
    .section-head > * {
      min-width: 0;
    }

    /* The arcs only work with the asymmetric desktop placement. */
    .orbit-arc {
      display: none;
    }

    .hero {
      padding-top: 96px;
    }

    .hero h1 {
      max-width: 14ch;
    }

    .frame {
      grid-template-columns: 1fr;
      padding: 32px;
    }

    .frame-card-offset {
      margin-top: 0;
    }

    .toast {
      position: relative;
      right: auto;
      bottom: auto;
      justify-self: end;
    }

    .section {
      padding-top: 96px;
    }

    .orbit {
      grid-template-columns: repeat(2, 1fr);
      row-gap: 64px;
    }

    .portrait:nth-child(n) {
      margin-top: 0;
    }

    .portrait-circle {
      width: 240px;
      height: 240px;
    }

    .axes {
      grid-template-columns: repeat(2, 1fr);
    }

    .catalog {
      grid-template-columns: 1fr;
    }

    .cta {
      margin-top: 96px;
      padding: 80px 40px;
    }

    .watermark {
      font-size: 10rem;
    }

    .footer {
      margin-top: 96px;
      padding: 72px 0 96px;
    }

    .footer-cols {
      grid-template-columns: repeat(2, 1fr);
      row-gap: 48px;
    }
  }

  /* ---- Phone: under 768 -------------------------------------------- */
  @media (width < 768px) {
    .page,
    .nav-wrap {
      padding-inline: 16px;
    }

    .nav-wrap {
      top: 12px;
    }

    .nav {
      padding: 6px 6px 6px 18px;
    }

    .nav-cta,
    .nav-actions [aria-label='GitHub'],
    .nav-actions [data-toggle-theme] {
      display: none;
    }

    .hero {
      padding: 64px 0 40px;
    }

    .lede {
      font-size: 1.0625rem;
    }

    .hero .row .button {
      flex: 1;
    }

    .install {
      font-size: 0.8125rem;
    }

    .install > span {
      min-width: 0;
      overflow-x: auto;
      white-space: nowrap;
      scrollbar-width: none;
    }

    .shape-switch {
      flex-wrap: wrap;
      gap: 10px;
    }

    .frame {
      gap: 16px;
      padding: 16px;
    }

    .frame .card {
      padding: 24px 20px;
    }

    .frame .card-header {
      margin: 0 -20px 20px;
      padding: 0 20px 20px;
    }

    .frame-arc,
    .orbit-arc {
      display: none;
    }

    .toast {
      justify-self: stretch;
    }

    .section {
      padding-top: 64px;
    }

    .section-head {
      margin-bottom: 32px;
    }

    .orbit {
      grid-template-columns: 1fr;
      justify-items: center;
      text-align: center;
    }

    .portrait {
      justify-items: center;
    }

    .portrait-circle {
      width: 220px;
      height: 220px;
    }

    .portrait-glyph {
      font-size: 4.5rem;
    }

    .axes {
      grid-template-columns: 1fr;
    }

    .axis-tile {
      padding: 20px;
    }

    .catalog .card {
      padding: 24px;
    }

    .cta {
      margin-top: 64px;
      padding: 56px 24px;
    }

    .cta .row .button {
      flex: 1;
    }

    .watermark {
      font-size: 6rem;
      bottom: -20px;
    }

    .footer {
      margin-top: 64px;
      padding: 56px 0 72px;
    }

    .footer h2 {
      margin-bottom: 40px;
    }

    .footer-cols {
      grid-template-columns: 1fr;
      gap: 0;
      padding-bottom: 40px;
    }

    .footer-col {
      padding: 16px 0;
      border-top: 1px solid rgb(255 255 255 / 0.18);
    }

    .footer-col summary {
      margin: 0;
      pointer-events: auto;
      cursor: pointer;
    }

    .footer-col summary::after {
      content: '+';
      font-size: 1.25rem;
      font-weight: 450;
    }

    .footer-col[open] summary::after {
      content: '\2212';
    }

    .footer-col[open] summary {
      margin-bottom: 14px;
    }

    .footer-bottom {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
  }
}
    
```

- [ ] **Step 3: Build and run every docs test**

```bash
pnpm --filter @snapshot-ui/docs build
pnpm --filter @snapshot-ui/docs lint
pnpm --filter @snapshot-ui/docs test:e2e
```

Expected: 20 end-to-end tests pass, 12 for docs pages and 8 for the homepage. Then compare `/` with `docs/mockups/home.html` at 1440, 768 and 375, in light and dark.

- [ ] **Step 4: Commit**

```bash
git add apps/docs
git commit -m "feat(docs): add the homepage from the approved mockup"
```

### Task 13: CI, releases and the size budget

**Files:**
- Create: `.changeset/config.json`, `.changeset/README.md`, `.changeset/first-release.md`
- Create: `.github/workflows/ci.yml`, `.github/workflows/release.yml`
- Create: `packages/react/.size-limit.json`
- Modify: `packages/react/package.json` (size script and devDependencies), root `package.json` (`test:e2e`)

**Interfaces:**
- Produces: `pnpm changeset` for every user-facing change. `@snapshot-ui/core` and `@snapshot-ui/react` are a fixed group, so their versions always match.
- Produces CI on every pull request and push to `main`:
  - `verify`: public names, root tests, format, lint, types, build, unit and story tests, package checks, size, docs end-to-end.
  - `visual`: compares against the baselines inside the Playwright image.
- Produces a release workflow. It opens a Version Packages pull request, and merging that pull request publishes to npm through trusted publishing with provenance.

- [ ] **Step 1: Configure Changesets and write the first changeset**

`.changeset/config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@4.0.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [["@snapshot-ui/core", "@snapshot-ui/react"]],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": [],
  "format": "auto"
}
```

`.changeset/README.md`:

```markdown
# Changesets

Run `pnpm changeset` for every change a user of the packages would notice, and
commit the file it writes. `@snapshot-ui/core` and `@snapshot-ui/react` are
released together with matching versions. Versions stay at 0.x until 1.0.
```

`.changeset/first-release.md`:

```markdown
---
'@snapshot-ui/core': minor
'@snapshot-ui/react': minor
---

First release. Design tokens with the color mode and corner shape axes, the Tailwind v4 theme, and the Button and Spinner components.
```

Run: `pnpm changeset status`
Expected: both packages listed under `minor`.

- [ ] **Step 2: Add the size budget**

`packages/react/.size-limit.json`:

```json
[
  {
    "name": "import { Button } from \"@snapshot-ui/react\"",
    "path": "dist/index.js",
    "import": "{ Button }",
    "ignore": ["react", "react-dom", "react-aria-components", "lucide-react"],
    "limit": "1 kB"
  },
  {
    "name": "import { Spinner } from \"@snapshot-ui/react\"",
    "path": "dist/index.js",
    "import": "{ Spinner }",
    "ignore": ["react", "react-dom", "react-aria-components", "lucide-react"],
    "limit": "1 kB"
  },
  {
    "name": "Button with React Aria (watch only)",
    "path": "dist/index.js",
    "import": "{ Button }",
    "ignore": ["react", "react-dom"],
    "limit": "40 kB"
  }
]
```

Add to `packages/react/package.json`: the script `"size": "size-limit"` and the devDependencies `"size-limit": "14.2.0"` and `"@size-limit/preset-small-lib": "14.2.0"`. Add to the root `package.json` scripts: `"test:e2e": "turbo run test:e2e"`.

Run:

```bash
pnpm install
pnpm --filter @snapshot-ui/react build
pnpm --filter @snapshot-ui/react size
```

Expected: every entry under its limit. Our own code is a few hundred bytes. React Aria's share is reported so it stays visible.

- [ ] **Step 3: Write the CI workflow**

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

env:
  TURBO_TELEMETRY_DISABLED: 1

jobs:
  verify:
    name: Verify
    runs-on: ubuntu-latest
    timeout-minutes: 25
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Restore the Turborepo cache
        uses: actions/cache@v6
        with:
          path: .turbo/cache
          key: turbo-${{ runner.os }}-${{ github.sha }}
          restore-keys: turbo-${{ runner.os }}-
      - name: Install Chromium for story and end-to-end tests
        run: pnpm --filter @snapshot-ui/storybook exec playwright install --with-deps chromium
      - name: Public names, root tests, format, lint, types, build, tests, packages, size
        run: pnpm verify
        env:
          PRIVATE_NAMES: ${{ secrets.PRIVATE_NAMES }}
      - name: Docs end-to-end
        run: pnpm --filter @snapshot-ui/docs test:e2e
      - name: Keep the built Storybook for the visual job
        uses: actions/upload-artifact@v7
        with:
          name: storybook-static
          path: apps/storybook/storybook-static
          retention-days: 7
      - name: Upload the docs report on failure
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: docs-playwright-report
          path: apps/docs/playwright-report
          retention-days: 7

  visual:
    name: Visual regression
    needs: verify
    runs-on: ubuntu-latest
    timeout-minutes: 20
    # The baselines were made in this image, so compare in it too.
    container:
      image: mcr.microsoft.com/playwright:v1.64.0-noble
      options: --user 1001
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - uses: actions/download-artifact@v8
        with:
          name: storybook-static
          path: apps/storybook/storybook-static
      - name: Compare against the baselines
        run: pnpm --filter @snapshot-ui/storybook test:visual
      - name: Upload the report on failure
        if: failure()
        uses: actions/upload-artifact@v7
        with:
          name: visual-report
          path: apps/storybook/playwright-report
          retention-days: 7
```

- [ ] **Step 4: Write the release workflow**

`.github/workflows/release.yml`:

```yaml
name: Release

on:
  push:
    branches: [main]

# Every job opts into exactly what it needs.
permissions: {}

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}

env:
  TURBO_TELEMETRY_DISABLED: 1

jobs:
  select-mode:
    runs-on: ubuntu-latest
    outputs:
      mode: ${{ steps.select-mode.outputs.mode }}
      publish-plan-artifact-id: ${{ steps.select-mode.outputs.publish-plan-artifact-id }}
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          package-manager-cache: false
      - run: pnpm install --frozen-lockfile
      - name: Choose between versioning and publishing
        id: select-mode
        uses: changesets/action/select-mode@v2

  version:
    if: needs.select-mode.outputs.mode == 'version'
    needs: select-mode
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          package-manager-cache: false
      - run: pnpm install --frozen-lockfile
      - name: Open or update the Version Packages pull request
        uses: changesets/action/version@v2
        with:
          script: pnpm changeset version

  pack:
    if: needs.select-mode.outputs.mode == 'publish'
    needs: select-mode
    runs-on: ubuntu-latest
    outputs:
      pack-dir-artifact-id: ${{ steps.pack.outputs.pack-dir-artifact-id }}
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v6
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          package-manager-cache: false
      - run: pnpm install --frozen-lockfile
      - name: Build and check the publishable packages
        run: pnpm turbo run build check:package --filter="./packages/*"
      - name: Pack
        id: pack
        uses: changesets/action/pack@v2
        with:
          publish-plan-artifact-id: ${{ needs.select-mode.outputs.publish-plan-artifact-id }}

  publish:
    needs: pack
    # Trusted publishing only works on GitHub-hosted runners.
    runs-on: ubuntu-latest
    environment: npm
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v7
        with:
          persist-credentials: false
      - uses: pnpm/action-setup@v6
      # No registry-url here: setup-node would write an .npmrc with an auth
      # token, and a token takes precedence over trusted publishing.
      - uses: actions/setup-node@v7
        with:
          node-version: 24
          package-manager-cache: false
      - run: pnpm install --frozen-lockfile
      # pnpm 10 hands publishing to the npm CLI, and trusted publishing needs npm 11.5.1 or later.
      - name: Make sure npm supports trusted publishing
        run: |
          npm --version
          npx --yes semver@7 --range ">=11.5.1" "$(npm --version)" || npm install --global npm@^11.5.1
      - name: Publish to npm with provenance
        uses: changesets/action/publish@v2
        with:
          pack-dir-artifact-id: ${{ needs.pack.outputs.pack-dir-artifact-id }}
          create-github-releases: true
```

- [ ] **Step 5: Run everything CI runs**

```bash
pnpm format
pnpm verify
pnpm --filter @snapshot-ui/docs test:e2e
pnpm --filter @snapshot-ui/storybook visual:docker -- --check
```

Run `pnpm format` first and commit anything it changes. Expected: all three pass. `pnpm verify` runs the public-name check, the root tests and the format check. It then runs lint, type-check, build, test, `check:package` and `size` across every workspace.

- [ ] **Step 6: Commit and push**

```bash
git add .changeset .github packages/react package.json pnpm-lock.yaml
git commit -m "ci: add verification, visual regression and trusted npm publishing"
git push origin main
```

After the push:
- The `CI` workflow must pass both jobs.
- The `Release` workflow opens a "Version Packages" pull request that bumps both packages to 0.1.0. Leave that pull request open until the owner steps below are done.

- [ ] **Step 7: Hand the owner the publishing steps**

These need the owner's npm and GitHub accounts, so report them rather than doing them:
1. On GitHub, in Settings, Secrets and variables, Actions, add a repository secret named `PRIVATE_NAMES`. Its value is the contents of `.local/private-names.txt`. Without it, CI skips the public-name check with a warning.
2. On GitHub, in Settings, Actions, General, allow GitHub Actions to create and approve pull requests.
3. On GitHub, create an environment named `npm`. Adding the owner as a required reviewer gates every publish.
4. On npmjs.com, for `@snapshot-ui/core` and `@snapshot-ui/react`, add a trusted publisher:
   - GitHub repository `amirehsan/snapshot-ui`
   - workflow `release.yml`
   - environment `npm`
5. npm may not allow a trusted publisher on a package that has never been published. If it does not, the owner publishes 0.1.0 once by hand from the merged release commit with `npm publish --access public` in each package folder, then adds the trusted publisher. After that, merging a Version Packages pull request publishes on its own.
