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
  theme: {
    attr: 'data-theme',
    base: 'light',
    caseInsensitive: false,
    colorScheme: true,
    media: { dark: '(prefers-color-scheme: dark)' },
  },
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
    .../** @type {string[]} */ (StyleDictionary.hooks.transformGroups.css).filter(
      (name) => name !== 'name/kebab' && name !== 'color/css',
    ),
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
          out.push(
            [
              `  @media ${def.media[variant]} {`,
              block(`:root:not(${attrSelector(def, def.base)})`, lines, 2),
              '  }',
            ].join('\n'),
          );
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
