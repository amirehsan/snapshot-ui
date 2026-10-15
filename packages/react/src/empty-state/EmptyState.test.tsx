import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { EmptyState } from './EmptyState';

/** A stand-in for a Lucide icon element: an svg the app passes. */
const ICON = <svg data-testid="icon" viewBox="0 0 24 24" />;

describe('EmptyState', () => {
  it('is exported from the package index', () => {
    expect(library.EmptyState).toBe(EmptyState);
  });

  it('draws the title as an h3 by default, and as an h2 or h4 at headingLevel 2 or 4', () => {
    const { rerender } = render(<EmptyState title="No transactions this month" />);
    const byDefault = screen.getByRole('heading', { level: 3, name: 'No transactions this month' });
    expect(byDefault.tagName).toBe('H3');
    expect(byDefault).toHaveAttribute('class', 'empty-state-title');
    for (const level of [2, 4] as const) {
      rerender(<EmptyState title="No transactions this month" headingLevel={level} />);
      const heading = screen.getByRole('heading', { level, name: 'No transactions this month' });
      expect(heading.tagName).toBe(`H${String(level)}`);
      // The element changes with the level; the look does not.
      expect(heading).toHaveAttribute('class', 'empty-state-title');
      expect(heading).not.toHaveAttribute('headingLevel');
    }
  });

  it('draws the icon before the title, hidden from assistive technology', () => {
    const { container } = render(<EmptyState title="No transactions this month" icon={ICON} />);
    const icon = container.querySelector('.empty-state-icon');
    expect(icon?.tagName).toBe('SPAN');
    expect(icon).toHaveAttribute('aria-hidden', 'true');
    expect(icon).toContainElement(screen.getByTestId('icon'));
    // In DOM order: the icon, then the title.
    expect(icon?.nextElementSibling).toHaveClass('empty-state-title');
    expect(root(container).firstElementChild).toBe(icon);
  });

  it('draws the description and the action only when given', () => {
    const { container, rerender } = render(<EmptyState title="Nothing to review" />);
    expect([...root(container).children].map((child) => child.className)).toEqual(['empty-state-title']);

    rerender(
      <EmptyState
        title="No transactions this month"
        description="Transactions you add or import show here."
        icon={ICON}
        action={<Button variant="secondary">Import transactions</Button>}
      />,
    );
    expect([...root(container).children].map((child) => child.className)).toEqual([
      'empty-state-icon',
      'empty-state-title',
      'empty-state-description',
      'empty-state-action',
    ]);
    const description = container.querySelector('.empty-state-description');
    expect(description?.tagName).toBe('P');
    expect(description).toHaveTextContent('Transactions you add or import show here.');
    const action = container.querySelector('.empty-state-action');
    expect(action?.tagName).toBe('DIV');
    expect(action).toContainElement(screen.getByRole('button', { name: 'Import transactions' }));
  });

  it('passes className and ref to the root', () => {
    let received: HTMLDivElement | null = null;
    const { container } = render(
      <EmptyState
        title="Nothing to review"
        className="extra"
        ref={(node) => {
          received = node;
        }}
      />,
    );
    const element = root(container);
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveAttribute('class', 'empty-state extra');
    expect(received).toBe(element);
  });

  it('stays a server component: no use client directive and no React Aria import', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'EmptyState.tsx'), 'utf8');
    expect(source).not.toMatch(/use client/);
    expect(source).not.toMatch(/react-aria-components/);
    expect(source).not.toMatch(/lucide-react/);
  });

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['with the title alone', () => <EmptyState title="Nothing to review" />],
    [
      'with an icon, a title, a description and an action',
      () => (
        <EmptyState
          title="No transactions this month"
          description="Transactions you add or import show here."
          icon={ICON}
          action={<Button variant="secondary">Import transactions</Button>}
        />
      ),
    ],
    [
      'inside a card whose title is a level 2 heading',
      () => (
        <Card as="section" aria-labelledby="recent-title">
          <CardHeader>
            <CardTitle id="recent-title">Recent activity</CardTitle>
          </CardHeader>
          <CardBody>
            <EmptyState
              title="No matches"
              description="Try fewer filters."
              icon={ICON}
              action={<Button variant="tertiary">Clear filters</Button>}
            />
          </CardBody>
        </Card>
      ),
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });

  it('requires a string title and a heading level of 2, 3 or 4 in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error an empty state says what is missing, so the title is required
    const untitled = <EmptyState description="Try another month." />;
    // @ts-expect-error the title sits under a card's title or a page's, so h5 and below are not offered
    const deep = <EmptyState title="Nothing" headingLevel={5} />;
    // @ts-expect-error the title is a string, the line that says what is missing, not an element
    const element = <EmptyState title={<strong>Nothing</strong>} />;
    expect(untitled).toBeTruthy();
    expect(deep).toBeTruthy();
    expect(element).toBeTruthy();
  });
});
