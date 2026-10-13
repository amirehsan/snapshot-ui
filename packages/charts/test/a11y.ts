import axe from 'axe-core';

// Rules that cannot work in a DOM emulator, which has no layout, or that only
// make sense for a whole page rather than one component.
const COMPONENT_RULES: axe.RunOptions['rules'] = {
  'color-contrast': { enabled: false },
  region: { enabled: false },
};

/** Runs axe-core on `container` and fails with a readable report on any violation. */
export async function expectNoA11yViolations(
  container: Element,
  options: axe.RunOptions = {},
): Promise<void> {
  const { violations } = await axe.run(container, {
    ...options,
    rules: { ...COMPONENT_RULES, ...options.rules },
  });
  if (violations.length === 0) return;
  const report = violations
    .map(
      (v) => `- ${v.id} (${v.impact ?? 'n/a'}): ${v.help}\n${v.nodes.map((n) => `    ${n.html}`).join('\n')}`,
    )
    .join('\n');
  throw new Error(`Expected no axe violations, found ${String(violations.length)}:\n${report}`);
}
