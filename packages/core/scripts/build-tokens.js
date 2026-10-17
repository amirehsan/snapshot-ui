// Builds dist/tokens.css, dist/tailwind.css, dist/tokens.js and dist/tokens.d.ts
// from tokens/tokens.json (W3C Design Tokens format) with Style Dictionary 5.
//
// Per-mode values live in $extensions["snapshot-ui"][axis][variant]:
//   "$extensions": { "snapshot-ui": { "theme": { "dark": "#0e0e0d" } } }
//   "$extensions": { "snapshot-ui": { "shape": { "soft": { "value": 10, "unit": "px" } } } }
// A refinement of a variant, such as density's compact-coarse, is set the same
// way, beside a value for the variant it refines.
// A preprocessor copies every mode value into a hidden tree
// (__mode.<axis>.<variant>.<path>) so transforms apply to mode values exactly as
// they do to base values. The formats then split base and mode tokens again.
//
// A base $value may be a reference such as "{color.ink}". The CSS keeps it as
// var(--color-ink) instead of resolving it, so it follows the mode it is read
// in, and every scope of an axis that changes the target declares it again.
// A string $value may also embed references, as in "calc({radius.control} -
// 4px)", and each one is followed the same way. The build throws on a reference
// inside a composite $value, and on a mode value that is or contains a
// reference, because it would otherwise resolve those silently against the base
// value.
import StyleDictionary from 'style-dictionary';
import { fileHeader } from 'style-dictionary/utils';

const EXT = 'snapshot-ui';
const MODE_ROOT = '__mode';
const REFERENCE = /\{([^{}]+)\}/g;

/**
 * Every "{path}" written in a token value, including strings nested in an
 * object or an array. Only strings are read: a dimension such as
 * { "value": 2, "unit": "px" } has braces of its own that are not a reference.
 */
function referencesIn(value) {
  if (typeof value === 'string') return [...value.matchAll(REFERENCE)].map((m) => m[1]);
  if (value !== null && typeof value === 'object') return Object.values(value).flatMap(referencesIn);
  return [];
}

/**
 * Each axis maps to a data attribute. `base` is the variant that $value holds and
 * `variants` lists the other variants a token may set, so a typo fails the build.
 * The CSS writes the axes in this order, so a later axis wins a tie.
 */
export const AXES = {
  theme: {
    attr: 'data-theme',
    base: 'light',
    caseInsensitive: false,
    colorScheme: true,
    media: { dark: '(prefers-color-scheme: dark)' },
    variants: ['dark'],
  },
  shape: { attr: 'data-shape', base: 'rounded', caseInsensitive: true, variants: ['soft', 'square'] },
  density: {
    attr: 'data-density',
    base: 'comfortable',
    caseInsensitive: true,
    variants: ['compact'],
    // A refinement writes one variant's values again under a media query: compact on a touch screen.
    // A token gives it a value only beside a value for the variant it refines.
    refinements: { 'compact-coarse': { of: 'compact', media: '(pointer: coarse)' } },
  },
  sidebar: { attr: 'data-sidebar', base: 'expanded', caseInsensitive: true, variants: ['collapsed'] },
};

// The format writes a refinement as one media block on the variant's selector.
// It writes no color-scheme and no system-preference copy for one, so an axis
// that needs either cannot take refinements until the format learns to.
for (const [axis, def] of Object.entries(AXES)) {
  if (def.refinements && (def.colorScheme || def.media)) {
    throw new Error(
      `The ${axis} axis has refinements and also colorScheme or media, which the format cannot combine.`,
    );
  }
}

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
          if (!Object.hasOwn(AXES, axis)) throw new Error(`Unknown mode axis "${axis}" on ${path.join('.')}`);
          const def = AXES[axis];
          for (const [variant, value] of Object.entries(variants)) {
            const refinement = def.refinements?.[variant];
            if (!def.variants.includes(variant) && !refinement) {
              throw new Error(`Unknown ${axis} variant "${variant}" on ${path.join('.')}`);
            }
            if (refinement && !Object.hasOwn(variants, refinement.of)) {
              throw new Error(
                `Token ${path.join('.')} has a ${axis} ${variant} value but no ${refinement.of} value. ` +
                  'A refinement changes a value under a media query, so the variant it refines must set one.',
              );
            }
            // Style Dictionary would resolve the reference against the base token,
            // which is the base variant's value, not this variant's.
            const [reference] = referencesIn(value);
            if (reference !== undefined) {
              throw new Error(
                `The ${axis} ${variant} value of ${path.join('.')} contains the reference {${reference}}. ` +
                  'A mode value must be a literal, because a reference resolves to the base value.',
              );
            }
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

/**
 * A DTCG duration, { "value": 300, "unit": "ms" }, as CSS: 300ms. Style Dictionary has no transform for the
 * object form yet, and would write it as [object Object].
 */
StyleDictionary.registerTransform({
  name: 'snapshot-ui/duration',
  type: 'value',
  filter: (token) => token.$type === 'duration',
  transform: (token) => {
    const { value, unit } = token.$value;
    if (typeof value !== 'number' || (unit !== 'ms' && unit !== 's')) {
      throw new Error(
        `Token ${token.path.join('.')} must be a duration written as { value, unit: "ms" | "s" }.`,
      );
    }
    return `${String(value)}${unit}`;
  },
});

// The stock css group, minus two transforms, plus the duration above:
// - name/kebab, replaced by snapshot-ui/name above.
// - color/css, which rewrites colors through tinycolor and silently drops the
//   alpha of modern rgb(r g b / a) syntax: rgb(255 255 255 / 0.6) came out as
//   #ffffff. Colors are written as valid CSS in tokens.json and pass through.
StyleDictionary.registerTransformGroup({
  name: 'snapshot-ui/css',
  transforms: [
    .../** @type {string[]} */ (StyleDictionary.hooks.transformGroups.css).filter(
      (name) => name !== 'name/kebab' && name !== 'color/css',
    ),
    'snapshot-ui/duration',
    'snapshot-ui/name',
  ],
});

/**
 * The paths a base token's $value refers to, as written: "{color.ink}" is color.ink.
 * A string $value's references are followed, whether one is the whole value or
 * is embedded in it, as in "calc({radius.control} - 4px)". Inside a composite
 * value a reference would be resolved once and never repeated in a theme scope,
 * so the build refuses it.
 */
function referencesOf(token) {
  const { $value } = token.original;
  const found = referencesIn($value);
  if (found.length > 0 && typeof $value !== 'string') {
    throw new Error(
      `Token ${token.path.join('.')} has a composite $value that contains the reference {${found[0]}}. ` +
        'Write the reference as the whole $value, a string.',
    );
  }
  return found;
}

/** The base token a reference path names. */
function target(path, byPath) {
  const found = byPath.get(path);
  if (!found) throw new Error(`Unknown token reference {${path}}`);
  return found;
}

/**
 * The value a base token declares. A reference stays a var() to the variable it
 * names; every other value is the resolved and transformed one.
 */
function cssValue(token, byPath) {
  if (referencesOf(token).length === 0) return token.$value;
  return token.original.$value.replace(REFERENCE, (_, path) => `var(--${target(path, byPath).name})`);
}

/**
 * Base tokens that refer, directly or through each other, to a token the axis
 * changes. A custom property that holds var() resolves where it is declared, so
 * --focus-ring-color: var(--color-ink) on :root would hand a nested
 * [data-theme="dark"] scope the page's ink instead of its own. Each scope
 * declares these again, as it does `color`.
 */
function followers(base, changed, byPath) {
  const names = new Set(changed);
  const found = [];
  for (let grew = true; grew;) {
    grew = false;
    for (const t of base) {
      if (names.has(t.name)) continue;
      if (referencesOf(t).some((path) => names.has(target(path, byPath).name))) {
        names.add(t.name);
        found.push(t);
        grew = true;
      }
    }
  }
  return found;
}

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
  return { base, modes, byPath };
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
    const { base, modes, byPath } = splitTokens(dictionary.allTokens);
    const out = [];
    const rootLines = base.map((t) => decl(t.name, cssValue(t, byPath)));
    rootLines.unshift(`color-scheme: ${AXES.theme.base};`);
    out.push(block(':root', rootLines, 1));
    // AXES order, not the order the tokens happen to come in: the cascade is
    // behavior, so it must not move when a token is added.
    for (const [axis, def] of Object.entries(AXES)) {
      const variants = modes[axis];
      if (!variants) continue;
      const changed = new Set(Object.values(variants).flatMap((v) => v.map((d) => d.name)));
      const followLines = followers(base, changed, byPath).map((t) => decl(t.name, cssValue(t, byPath)));
      const scope = (variant, decls) => {
        const lines = [...decls.map((d) => decl(d.name, d.value)), ...followLines];
        // A theme scope re-resolves its own text color: inherited color is
        // computed in the parent's theme, so a light card inside a dark page
        // would otherwise keep the page's white text.
        if (def.colorScheme) lines.unshift(`color-scheme: ${variant};`, 'color: var(--color-ink);');
        return lines;
      };
      for (const variant of def.variants) {
        const decls = variants[variant];
        if (!decls) continue;
        out.push(block(attrSelector(def, variant), scope(variant, decls), 1));
        if (def.media?.[variant]) {
          out.push(
            [
              `  @media ${def.media[variant]} {`,
              block(`:root:not(${attrSelector(def, def.base)})`, scope(variant, decls), 2),
              '  }',
            ].join('\n'),
          );
        }
      }
      // A refinement writes its variant's values again under its media query,
      // after the variant's own block, so on the same element it wins wherever
      // the query matches. A token with no refinement value keeps the variant's.
      for (const [name, refinement] of Object.entries(def.refinements ?? {})) {
        const decls = variants[name];
        if (!decls) continue;
        out.push(
          [
            `  @media ${refinement.media} {`,
            block(attrSelector(def, refinement.of), scope(refinement.of, decls), 2),
            '  }',
          ].join('\n'),
        );
      }
      // The base variant again, so a light subtree inside a dark page, or a
      // rounded one inside a soft page, takes its own values.
      const baseLines = [
        ...base.filter((t) => changed.has(t.name)).map((t) => decl(t.name, cssValue(t, byPath))),
        ...followLines,
      ];
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
  const { base, modes, byPath } = splitTokens(dictionary.allTokens);
  const modeValues = new Map();
  const setMode = (name, axis, variant, value) => {
    const entry = modeValues.get(name) ?? {};
    (entry[axis] ??= {})[variant] = value;
    modeValues.set(name, entry);
  };
  for (const [axis, variants] of Object.entries(modes)) {
    for (const [variant, decls] of Object.entries(variants)) {
      for (const d of decls) setMode(d.name, axis, variant, d.value);
    }
  }
  // A token that holds a reference reads as the token it names in every mode,
  // as its var() does in the CSS. Without this, `modes.theme.dark ?? value` would
  // hand a reader the light value. In a variant, its value is its original
  // $value with each reference replaced by that token's value there: the
  // variant's own value if it has one, else its base value.
  // `declaredIn` reads `modes`, which holds declared values only: `modeValues`
  // also holds followers' computed values, which a follower must not be handed
  // back as a declaration of its own.
  const declaredIn = (name, axis, variant) => modes[axis]?.[variant]?.find((d) => d.name === name)?.value;
  const valueIn = (token, axis, variant) => {
    const own = modeValues.get(token.name)?.[axis]?.[variant];
    if (own !== undefined) return own;
    // A refinement block redeclares only its own values and the followers, so
    // a token with neither keeps the value its variant declared.
    const of = AXES[axis].refinements?.[variant]?.of;
    const declared = of === undefined ? undefined : declaredIn(token.name, axis, of);
    if (declared !== undefined) return declared;
    if (referencesOf(token).length === 0) return token.$value;
    return token.original.$value.replace(REFERENCE, (_, path) =>
      valueIn(target(path, byPath), axis, variant),
    );
  };
  for (const [axis, variants] of Object.entries(modes)) {
    for (const [variant, decls] of Object.entries(variants)) {
      const changed = new Set(decls.map((d) => d.name));
      for (const t of followers(base, changed, byPath)) {
        setMode(t.name, axis, variant, valueIn(t, axis, variant));
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
  const entries = Object.entries(value).map(
    ([k, v]) => `${pad}readonly ${JSON.stringify(k)}: ${typeLiteral(v, indent + 1)};`,
  );
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
  log: { verbosity: 'default', warnings: 'error' },
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
