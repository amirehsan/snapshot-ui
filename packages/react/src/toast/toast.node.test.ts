// @vitest-environment node
import { describe, expect, it } from 'vitest';

describe('the toast module on the server', () => {
  // A server action's page imports the module that calls toast(), so the module must load in Node, where
  // there is no window: the queue is a singleton that creates no DOM.
  it('imports with no window, and toast is a function', async () => {
    expect(typeof window).toBe('undefined');
    expect(typeof document).toBe('undefined');
    const module = await import('./toast');
    expect(typeof module.toast).toBe('function');
    expect(typeof module.toast.dismiss).toBe('function');
    expect(typeof module.toast.clear).toBe('function');
  });
});
