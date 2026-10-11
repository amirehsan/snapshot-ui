// Tailwind utility namespaces. A component class starting with one of these
// would collide with a utility in any app that also uses Tailwind.
const UTILITY_PREFIX =
  '(?:text|bg|border|rounded|shadow|font|ring|outline|fill|stroke|p|px|py|pt|pr|pb|pl|m|mx|my|mt|mr|mb|ml|w|h|size|min|max|gap|space|divide|inset|top|right|bottom|left|z|opacity|leading|tracking|grid|col|row|flex|sr)';

/** @type {import('stylelint').Config} */
export default {
  plugins: ['./stylelint/token-only.js'],
  rules: {
    'snapshot-ui/token-only': true,
    // light-dark() is excluded from lowering in build-css.js, so it would ship
    // unlowered below the browser floor. Components switch on data-theme tokens.
    'function-disallowed-list': [
      ['light-dark'],
      {
        message:
          'Use the data-theme tokens instead of light-dark(), which the browser floor does not support (function-disallowed-list)',
      },
    ],
    'selector-class-pattern': [
      `^(?!${UTILITY_PREFIX}-)[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`,
      {
        message:
          'Class names are kebab-case and never start with a Tailwind utility namespace such as text-, bg-, rounded- or p- (selector-class-pattern)',
      },
    ],
  },
};
