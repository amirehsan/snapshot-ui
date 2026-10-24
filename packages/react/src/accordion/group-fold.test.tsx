import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TextField } from '../text-field';
import { Accordion, AccordionItem } from './Accordion';

/*
 * The spike of spec risk R1, written before the accordion and kept in the suite, as MultiSelect's multiple-mode
 * test is: CollapsibleCard's three fold hooks run unchanged under React Aria's DisclosureGroup, in both modes,
 * with the item reading its state from the group.
 */

const MODES = [
  ['several open', true],
  ['one at a time', false],
] as const;

/** Billing open, Notifications and Danger zone folded, in the mode asked. */
function Settings({ multiple }: { multiple: boolean }): ReactElement {
  return (
    <Accordion allowsMultipleExpanded={multiple} defaultExpandedKeys={['billing']}>
      <AccordionItem id="billing" title="Billing address">
        <p>12 Rose Lane</p>
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications">
        <p>Email, push and digest</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone">
        <p>Delete the account</p>
      </AccordionItem>
    </Accordion>
  );
}

const itemOf = (title: string): HTMLElement => {
  const item = screen
    .getByRole('button', { name: title, hidden: true })
    .closest<HTMLElement>('.accordion-item');
  if (!item) throw new Error(`No item for ${title}`);
  return item;
};

const foldOf = (title: string): HTMLElement => {
  const fold = itemOf(title).querySelector<HTMLElement>('.accordion-fold');
  if (!fold) throw new Error(`No fold for ${title}`);
  return fold;
};

/**
 * Records, each time React Aria or the fold hook reads a fold's transitions, which items were open and which
 * carried data-instant at that moment: they read them in the commit that opens or folds an item, which is when a
 * browser starts a transition.
 */
function watchCommits(container: HTMLElement): { expanded: string[]; instant: string[] }[] {
  const seen: { expanded: string[]; instant: string[] }[] = [];
  const titles = (selector: string): string[] =>
    [...container.querySelectorAll(`.accordion-item${selector}`)].map(
      (item) => item.querySelector('.accordion-toggle-text')?.textContent ?? '',
    );
  for (const fold of container.querySelectorAll('.accordion-fold')) {
    Object.defineProperty(fold, 'getAnimations', {
      value: () => {
        seen.push({ expanded: titles('[data-expanded]'), instant: titles('[data-instant]') });
        return [];
      },
    });
  }
  return seen;
}

const stay = (event: { preventDefault: () => void }): void => {
  event.preventDefault();
};

describe('the fold hooks under a DisclosureGroup', () => {
  it.each(MODES)(
    'runs the three fold hooks unchanged under the group, reading the item state from the group (%s)',
    async (_mode, multiple) => {
      const user = userEvent.setup();
      render(<Settings multiple={multiple} />);
      expect(itemOf('Billing address')).toHaveAttribute('data-expanded', '');
      expect(itemOf('Notifications')).not.toHaveAttribute('data-expanded');
      await user.click(screen.getByRole('button', { name: 'Notifications' }));
      expect(itemOf('Notifications')).toHaveAttribute('data-expanded', '');
      expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute('aria-expanded', 'true');
      // Several open keeps Billing; one at a time folds it.
      expect(itemOf('Billing address').hasAttribute('data-expanded')).toBe(multiple);
    },
  );

  it.each(MODES)(
    'marks data-folding on the item and never on the accordion (%s)',
    async (_mode, multiple) => {
      const user = userEvent.setup();
      const { container } = render(<Settings multiple={multiple} />);
      let finish = (): void => undefined;
      const finished = new Promise<void>((resolve) => {
        finish = resolve;
      });
      for (const fold of container.querySelectorAll('.accordion-fold')) {
        Object.defineProperty(fold, 'getAnimations', { value: () => [{ finished }] });
      }
      await user.click(screen.getByRole('button', { name: 'Notifications' }));
      expect(itemOf('Notifications')).toHaveAttribute('data-folding', '');
      expect(itemOf('Billing address').hasAttribute('data-folding')).toBe(!multiple);
      expect(container.querySelector('.accordion')).not.toHaveAttribute('data-folding');
      await act(async () => {
        finish();
        await finished;
      });
      expect(container.querySelectorAll('[data-folding]')).toHaveLength(0);
    },
  );

  it('folds the open item and opens the pressed one in one commit in single mode', async () => {
    const user = userEvent.setup();
    const { container } = render(<Settings multiple={false} />);
    const seen = watchCommits(container);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    // Every read of a fold's transitions saw both changes at once: never Billing still open beside
    // Notifications, and never neither open.
    expect(seen).not.toHaveLength(0);
    for (const { expanded } of seen) expect(expanded).toEqual(['Notifications']);
  });

  it.each(MODES)(
    'opens a folded item for a beforematch at its panel, drawn at once (%s)',
    (_mode, multiple) => {
      const { container } = render(<Settings multiple={multiple} />);
      const seen = watchCommits(container);
      act(() => {
        foldOf('Danger zone').dispatchEvent(new Event('beforematch'));
      });
      expect(itemOf('Danger zone')).toHaveAttribute('data-expanded', '');
      expect(itemOf('Danger zone')).toHaveAttribute('data-instant', '');
      expect(seen).not.toHaveLength(0);
      for (const { instant } of seen) expect(instant).toContain('Danger zone');
      // One at a time folds the open item in the same commit, drawn at once too.
      expect(itemOf('Billing address').hasAttribute('data-expanded')).toBe(multiple);
      if (!multiple) {
        for (const { instant } of seen) expect(instant).toContain('Billing address');
      }
    },
  );

  it.each(MODES)(
    'opens a folded item for an invalid field in its panel, drawn at once, folding the open one in single mode (%s)',
    async (_mode, multiple) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn(stay);
      const { container } = render(
        <form onSubmit={onSubmit}>
          <Accordion allowsMultipleExpanded={multiple} defaultExpandedKeys={['billing']}>
            <AccordionItem id="billing" title="Billing address">
              <TextField label="Street" defaultValue="12 Rose Lane" />
            </AccordionItem>
            <AccordionItem id="notifications" title="Notifications">
              <TextField label="Digest address" isRequired />
            </AccordionItem>
            <AccordionItem id="danger" title="Danger zone">
              <TextField label="Confirm" isRequired />
            </AccordionItem>
          </Accordion>
          <button type="submit">Save</button>
        </form>,
      );
      const field = foldOf('Notifications').querySelector('input');
      if (!field) throw new Error('No field');
      const seen: string[] = [];
      field.addEventListener('focus', () => {
        seen.push(
          `${String(itemOf('Notifications').hasAttribute('data-expanded'))} ${String(foldOf('Notifications').getAttribute('hidden'))} ${String(itemOf('Notifications').hasAttribute('data-instant'))}`,
        );
      });
      await user.click(screen.getByRole('button', { name: 'Save' }));
      expect(onSubmit).not.toHaveBeenCalled();
      // Open, shown and drawn at once before the field took focus.
      expect(seen).toEqual(['true null true']);
      expect(field).toHaveFocus();
      expect(itemOf('Billing address').hasAttribute('data-expanded')).toBe(multiple);
      // The browser focuses the first field that failed, so in single mode only its item opens; with several
      // open, every item holding a field that failed opens.
      expect(itemOf('Danger zone').hasAttribute('data-expanded')).toBe(multiple);
      expect(container.querySelectorAll('.accordion-item[data-expanded]')).toHaveLength(multiple ? 3 : 1);
    },
  );

  it('keeps the panel id the accordion gives and writes it as the toggle aria-controls', () => {
    const { container } = render(
      <Accordion hasExpandAll defaultExpandedKeys={['billing']}>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications">
          Email
        </AccordionItem>
      </Accordion>,
    );
    const folds = [...container.querySelectorAll('.accordion-fold')];
    const toggles = [...container.querySelectorAll('.accordion-toggle')];
    const ids = folds.map((fold) => fold.id);
    expect(ids[0]).toMatch(/-panel-0$/);
    expect(ids[1]).toMatch(/-panel-1$/);
    expect(toggles.map((toggle) => toggle.getAttribute('aria-controls'))).toEqual(ids);
    expect(screen.getByRole('button', { name: 'Show all sections' })).toHaveAttribute(
      'aria-controls',
      ids.join(' '),
    );
  });
});
