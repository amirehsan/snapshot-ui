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
  color: (value, prop) =>
    `Unexpected literal color "${value}" in "${prop}". Use a color token, e.g. var(--color-ink).`,
  radius: (value, prop) =>
    `Unexpected literal radius "${value}" in "${prop}". Use 0, var(--radius-*) or calc() with a var().`,
  shadow: (value, prop) => `Unexpected literal shadow "${value}" in "${prop}". Use var(--shadow-*).`,
});

const meta = { url: 'https://github.com/amirehsan/snapshot-ui/tree/main/packages/core/stylelint' };

const CSS_WIDE = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);
const ALLOWED_COLOR_WORDS = new Set(['transparent', 'currentcolor', ...CSS_WIDE]);
const NAMED_COLORS = new Set(Object.keys(colorNames));
const COLOR_FUNCTIONS = new Set([
  'rgb',
  'rgba',
  'hsl',
  'hsla',
  'hwb',
  'lab',
  'lch',
  'oklab',
  'oklch',
  'color',
]);
const COMPARISON_FUNCTIONS = new Set(['min', 'max', 'clamp']);
const HEX = /^#[\da-f]{3,8}$/i;

// Functions whose arguments are colors: a bare word inside one is a named
// color whatever the property it sits in.
const COLOR_CONTEXT_FUNCTION =
  /^(?:(?:repeating-)?(?:linear|radial|conic)-gradient|drop-shadow|color-mix|light-dark)$/i;

// Properties where a bare word can be a named color. Hex and color functions
// are checked in every property; named colors only here (or inside a color
// context function) to avoid false positives such as `animation-name: tomato`.
const COLOR_PROPERTIES = [
  '--.*',
  'color',
  'background(?:-color|-image)?',
  'border(?:-(?:block|inline|top|right|bottom|left)(?:-(?:start|end))?)?(?:-color)?',
  'border-image(?:-source)?',
  'outline(?:-color)?',
  'text-decoration(?:-color)?',
  'text-emphasis(?:-color)?',
  'column-rule(?:-color)?',
  'caret-color',
  'accent-color',
  'fill',
  'stroke',
  'mask(?:-image)?',
  'filter',
  'box-shadow',
  'text-shadow',
  'scrollbar-color',
  '-webkit-tap-highlight-color',
  '-webkit-text-fill-color',
  '-webkit-text-stroke(?:-color)?',
  'flood-color',
  'lighting-color',
  'stop-color',
];
const COLOR_PROPERTY = new RegExp(`^(?:${COLOR_PROPERTIES.join('|')})$`, 'i');

// A custom property is held to the radius or shadow rule by its name.
const RADIUS_PROPERTY =
  /^(?:border(?:-(?:top|bottom|start|end)-(?:left|right|start|end))?-radius|--.*radius.*)$/i;
const SHADOW_PROPERTY = /^(?:box-shadow|--.*shadow.*)$/i;

const isLayout = (node) => node.type === 'space' || node.type === 'div' || node.type === 'comment';
const isComma = (node) => node.type === 'div' && node.value === ',';
const isFunction = (node, name) => node.type === 'function' && node.value.toLowerCase() === name;

/** 0, 0px, 0% and so on: no radius at all, whatever the unit. */
function isZero(word) {
  const dimension = valueParser.unit(word);
  return dimension !== false && Number(dimension.number) === 0;
}

/** The fallback of var(--name, fallback), or no nodes when there is none. */
function fallbackOf(variable) {
  const comma = variable.nodes.findIndex(isComma);
  return comma === -1 ? [] : variable.nodes.slice(comma + 1);
}

/** The arguments of a function, split at its top-level commas. */
function argumentsOf(fn) {
  /** @type {import('postcss-value-parser').Node[]} */
  let current = [];
  const args = [current];
  for (const node of fn.nodes) {
    if (isComma(node)) {
      current = [];
      args.push(current);
    } else {
      current.push(node);
    }
  }
  return args;
}

/** Every var() at any depth inside a node, including those in fallbacks. */
function findVariables(node, found = []) {
  if (node.type === 'function') {
    if (isFunction(node, 'var')) found.push(node);
    for (const child of node.nodes) findVariables(child, found);
  }
  return found;
}

/** Collects literal colors anywhere in a parsed value (including var() fallbacks). */
function findLiteralColors(nodes, checkNames, found = []) {
  for (const node of nodes) {
    if (node.type === 'word') {
      const word = node.value.toLowerCase();
      if (HEX.test(word)) found.push(node.value);
      else if (checkNames && NAMED_COLORS.has(word) && !ALLOWED_COLOR_WORDS.has(word)) found.push(node.value);
    } else if (node.type === 'function') {
      const name = node.value.toLowerCase();
      // url(#fade) is a reference to a paint server or mask, never a color.
      if (name === 'url') continue;
      if (COLOR_FUNCTIONS.has(name)) found.push(valueParser.stringify(node));
      else findLiteralColors(node.nodes, checkNames || COLOR_CONTEXT_FUNCTION.test(name), found);
    }
  }
  return found;
}

/** calc() reads a token when it holds a var() and every var() inside it falls back to a token. */
function isTokenCalc(calc) {
  const variables = findVariables(calc);
  return variables.length > 0 && variables.every((variable) => fallbackOf(variable).every(isTokenRadius));
}

/**
 * A radius part is fine when it is zero, a var() whose fallback is fine, a calc()
 * that reads a token, or a min(), max() or clamp() whose every argument is fine.
 */
function isTokenRadius(node) {
  if (isLayout(node)) return true;
  if (node.type === 'word') return isZero(node.value) || CSS_WIDE.has(node.value.toLowerCase());
  if (node.type !== 'function') return false;
  const name = node.value.toLowerCase();
  if (name === 'var') return fallbackOf(node).every(isTokenRadius);
  if (name === 'calc') return isTokenCalc(node);
  if (COMPARISON_FUNCTIONS.has(name)) return argumentsOf(node).every((arg) => arg.every(isTokenRadius));
  return false;
}

/** A shadow part is fine when it is none or a var() whose fallback is fine. */
function isTokenShadow(node) {
  if (isLayout(node)) return true;
  if (node.type === 'word') {
    const word = node.value.toLowerCase();
    return word === 'none' || CSS_WIDE.has(word);
  }
  return isFunction(node, 'var') && fallbackOf(node).every(isTokenShadow);
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
    if (SHADOW_PROPERTY.test(decl.prop) && !parsed.nodes.every(isTokenShadow)) {
      problem(messages.shadow(decl.value, decl.prop), decl.value);
    }
  });
};

rule.ruleName = ruleName;
rule.messages = messages;
rule.meta = meta;

export default createPlugin(ruleName, rule);
