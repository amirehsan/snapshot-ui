import { describe, expect, it } from 'vitest';
import { nextToggle, ownToggles } from './moves';

const TOGGLES = ['billing', 'notifications', 'danger'];

describe('nextToggle', () => {
  it.each([
    ['billing', 'ArrowDown', 'notifications'],
    ['notifications', 'ArrowDown', 'danger'],
    ['danger', 'ArrowDown', null],
    ['billing', 'ArrowUp', null],
    ['notifications', 'ArrowUp', 'billing'],
    ['danger', 'ArrowUp', 'notifications'],
    ['billing', 'Home', null],
    ['notifications', 'Home', 'billing'],
    ['danger', 'Home', 'billing'],
    ['billing', 'End', 'danger'],
    ['notifications', 'End', 'danger'],
    ['danger', 'End', null],
  ])('from %s, %s goes to %s, with no wrap', (current, key, next) => {
    expect(nextToggle(TOGGLES, current, key)).toBe(next);
  });

  it.each(['ArrowLeft', 'ArrowRight', 'PageDown', 'Enter', ' ', 'a'])('leaves %j alone', (key) => {
    expect(nextToggle(TOGGLES, 'notifications', key)).toBeNull();
  });

  it('finds nothing in an empty list', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
      expect(nextToggle([], 'billing', key)).toBeNull();
    }
  });

  it('moves only by Home and End from a toggle the list does not hold, as a disabled one is not', () => {
    expect(nextToggle(TOGGLES, 'nested', 'ArrowDown')).toBeNull();
    expect(nextToggle(TOGGLES, 'nested', 'ArrowUp')).toBeNull();
    expect(nextToggle(TOGGLES, 'nested', 'Home')).toBe('billing');
    expect(nextToggle(TOGGLES, 'nested', 'End')).toBe('danger');
  });
});

describe('ownToggles', () => {
  it("finds the accordion's own toggles in order, none of a nested accordion's, and leaves the disabled out on asking", () => {
    const root = document.createElement('div');
    const item = (name: string, disabled = false, inside = ''): string =>
      `<div class="accordion-item"><div class="accordion-disclosure"><h3 class="accordion-heading"><button class="accordion-toggle"${disabled ? ' disabled' : ''}>${name}</button></h3><div class="accordion-fold"><div class="accordion-body">${inside}</div></div></div></div>`;
    root.innerHTML = [
      '<div class="accordion-controls"><button class="accordion-expand-all">Show all sections</button></div>',
      item('Billing'),
      item('Notifications', true),
      item('Danger', false, `<div class="accordion">${item('Nested')}</div>`),
    ].join('');
    const names = (toggles: HTMLElement[]): string[] => toggles.map((toggle) => toggle.textContent);
    expect(names(ownToggles(root))).toEqual(['Billing', 'Notifications', 'Danger']);
    expect(names(ownToggles(root, true))).toEqual(['Billing', 'Danger']);
  });
});
