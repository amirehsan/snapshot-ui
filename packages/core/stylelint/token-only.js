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
    if (node.type === 'word')
      return node.value.toLowerCase() === 'none' || CSS_WIDE.has(node.value.toLowerCase());
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
