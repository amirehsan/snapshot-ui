import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { CollapsibleCard, type CollapsibleCardProps } from './CollapsibleCard';

/** A card the caller controls, the way a page that keeps the fold in its own state would. */
function Controlled(props: Omit<CollapsibleCardProps, 'isExpanded' | 'onExpandedChange'>): ReactElement {
  const [isExpanded, setExpanded] = useState(true);
  return <CollapsibleCard {...props} isExpanded={isExpanded} onExpandedChange={setExpanded} />;
}

/** The card's fold, the panel that holds its body. */
function foldOf(container: HTMLElement): HTMLElement {
  const fold = container.querySelector<HTMLElement>('.card-fold');
  if (!fold) throw new Error('No fold');
  return fold;
}

/**
 * A stand-in for a running CSS transition, whose `finished` settles when the test says so: it resolves when
 * the transition ends, and rejects when a new transition replaces it, as a browser's does. jsdom has no Web
 * Animations API, so a test that needs the fold to move gives the fold one of these.
 */
function transition(): { animation: Animation; finish: () => void; cancel: () => void } {
  const animation = {} as Animation;
  let finish = (): void => undefined;
  let cancel = (): void => undefined;
  const finished = new Promise<Animation>((resolve, reject) => {
    finish = () => {
      resolve(animation);
    };
    cancel = () => {
      reject(new DOMException('The transition was replaced.', 'AbortError'));
    };
  });
  // Whoever waits on it handles the rejection; this keeps an unwatched one from being reported.
  finished.catch(() => undefined);
  Object.defineProperty(animation, 'finished', { value: finished });
  return { animation, finish, cancel };
}

/** Lets every promise that is ready settle, so a test can see what a settled transition changed. */
const settle = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

describe('CollapsibleCard', () => {
  it('renders a card whose title is the toggle, open by default', async () => {
    const { container } = render(
      <CollapsibleCard title="Notifications">
        <p>Product updates, when something ships.</p>
      </CollapsibleCard>,
    );
    const card = root(container);
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveAttribute('class', 'card card-collapsible');
    expect(card).toHaveAttribute('data-expanded', '');
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    expect(toggle).toHaveClass('card-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    // The heading holds the toggle, so a screen reader's list of headings reaches it.
    const heading = screen.getByRole('heading', { level: 2, name: 'Notifications' });
    expect(heading).toHaveAttribute('class', 'card-title');
    expect(heading).toContainElement(toggle);
    // The toggle controls the fold, and the fold is a group named by the toggle.
    const fold = foldOf(container);
    expect(toggle).toHaveAttribute('aria-controls', fold.id);
    expect(screen.getByRole('group', { name: 'Notifications' })).toBe(fold);
    expect(fold).not.toHaveAttribute('hidden');
    expect(screen.getByText('Product updates, when something ships.')).toBeVisible();
    expect(screen.getByText('Product updates, when something ships.').parentElement).toHaveClass('card-body');
    await expectNoA11yViolations(container);
  });

  it('requires a title in its types', () => {
    // The @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring a title.
    // @ts-expect-error the title is the toggle's text and its accessible name, so a card needs one
    const untitled = <CollapsibleCard>Body</CollapsibleCard>;
    const titled = <CollapsibleCard title="Notifications">Body</CollapsibleCard>;
    expect([untitled, titled]).toHaveLength(2);
  });

  it('draws the title text and a hidden chevron inside the toggle, and names the toggle by the title alone', () => {
    render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    expect([...toggle.children].map((child) => child.getAttribute('class'))).toEqual([
      'card-toggle-text',
      'lucide lucide-chevron-down card-chevron',
    ]);
    expect(toggle.querySelector('.card-toggle-text')).toHaveTextContent('Notifications');
    expect(toggle.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    expect(toggle).toHaveAccessibleName('Notifications');
  });

  it('folds and opens with a click, and marks the root data-expanded only while open', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    // React Aria hides the folded body until the browser's find-in-page reaches it.
    expect(foldOf(container)).toHaveAttribute('hidden', 'until-found');
    expect(screen.getByText('Body')).not.toBeVisible();
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(root(container)).toHaveAttribute('data-expanded', '');
    expect(screen.getByText('Body')).toBeVisible();
  });

  it('folds and opens with Enter and with Space', async () => {
    const user = userEvent.setup();
    render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard('{Enter}');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.keyboard(' ');
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveFocus();
  });

  it('takes a folded body out of the accessibility tree, and hides it where find-in-page can reach it', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CollapsibleCard title="Notifications">
        <Button>Send a test email</Button>
      </CollapsibleCard>,
    );
    const fold = foldOf(container);
    expect(screen.getByRole('button', { name: 'Send a test email' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    // hidden="until-found" takes the body out of the tab order in a browser, which jsdom does not model,
    // and leaves it to find-in-page. The browser tests check the tab order.
    expect(fold).toHaveAttribute('hidden', 'until-found');
    expect(fold).toHaveAttribute('aria-hidden', 'true');
    // A query for a role reads the accessibility tree, and the folded button is not in it.
    expect(screen.queryByRole('button', { name: 'Send a test email' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(fold).not.toHaveAttribute('hidden');
    expect(fold).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByRole('button', { name: 'Send a test email' })).toBeInTheDocument();
  });

  it('starts folded with defaultExpanded={false}', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" defaultExpanded={false}>
        Body
      </CollapsibleCard>,
    );
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(foldOf(container)).toHaveAttribute('hidden', 'until-found');
    expect(screen.getByText('Body')).not.toBeVisible();
  });

  it('keeps the note and the actions in the header, outside the toggle and usable while folded', async () => {
    const user = userEvent.setup();
    const onReset = vi.fn();
    const { container } = render(
      <CollapsibleCard
        title="Notifications"
        note="Where we reach you, and how often."
        actions={
          <Button variant="secondary" onPress={onReset}>
            Reset
          </Button>
        }
      >
        Body
      </CollapsibleCard>,
    );
    const header = container.querySelector('.card-header');
    expect([...(header?.children ?? [])].map((child) => child.className)).toEqual([
      'card-title',
      'card-note',
      'card-actions',
    ]);
    expect(screen.getByText('Where we reach you, and how often.').tagName).toBe('P');
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    const reset = screen.getByRole('button', { name: 'Reset' });
    // No interactive element inside another: the toggle holds text and an icon, and nothing to press.
    expect(toggle).not.toContainElement(reset);
    expect(toggle.querySelectorAll('button, a, input, select, textarea, [tabindex]')).toHaveLength(0);
    // Tab reaches the toggle, then the actions.
    await user.tab();
    expect(toggle).toHaveFocus();
    await user.tab();
    expect(reset).toHaveFocus();
    // Folded, the header stays: the note is shown and the actions still work.
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText('Where we reach you, and how often.')).toBeVisible();
    expect(reset).toBeVisible();
    await user.click(reset);
    expect(onReset).toHaveBeenCalledOnce();
    // The name and the description of the toggle are the title's, whatever the header holds.
    expect(toggle).toHaveAccessibleName('Notifications');
    expect(toggle).not.toHaveAttribute('aria-describedby');
  });

  it('renders no note or actions part when they draw nothing', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" note={false} actions="">
        Body
      </CollapsibleCard>,
    );
    expect(container.querySelector('.card-note, .card-actions')).toBeNull();
    expect(container.querySelector('.card-header')?.children).toHaveLength(1);
  });

  it('tells onExpandedChange each time the card opens or folds', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <CollapsibleCard title="Notifications" onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenLastCalledWith(true);
    expect(onExpandedChange).toHaveBeenCalledTimes(2);
  });

  it('follows isExpanded when controlled, and tells the caller what was asked', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { container, rerender } = render(
      <CollapsibleCard title="Notifications" isExpanded onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    // The caller has not folded it, so it stays open.
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(root(container)).toHaveAttribute('data-expanded', '');
    rerender(
      <CollapsibleCard title="Notifications" isExpanded={false} onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
  });

  it('works with a state the caller keeps', async () => {
    const user = userEvent.setup();
    render(<Controlled title="Notifications">Body</Controlled>);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it.each([1, 2, 3, 4] as const)(
    'level %i renders the title as that heading, with the same class',
    (level) => {
      render(
        <CollapsibleCard title="Notifications" level={level}>
          Body
        </CollapsibleCard>,
      );
      const heading = screen.getByRole('heading', { level, name: 'Notifications' });
      expect(heading.tagName).toBe(`H${level}`);
      expect(heading).toHaveAttribute('class', 'card-title');
      expect(heading).toContainElement(screen.getByRole('button', { name: 'Notifications' }));
    },
  );

  it.each(['div', 'section', 'article'] as const)('as renders a %s element at the root', (as) => {
    const { container } = render(
      <CollapsibleCard title="Notifications" as={as}>
        Body
      </CollapsibleCard>,
    );
    const card = root(container);
    expect(card.tagName).toBe(as.toUpperCase());
    expect(card).toHaveAttribute('class', 'card card-collapsible');
    // as chooses the element and is not an attribute.
    expect(card).not.toHaveAttribute('as');
  });

  it('is a region when it is a section with a name', () => {
    render(
      <CollapsibleCard
        title={<span id="notifications-title">Notifications</span>}
        as="section"
        aria-labelledby="notifications-title"
      >
        Body
      </CollapsibleCard>,
    );
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveClass('card-collapsible');
  });

  it('merges className after its own classes and forwards ref to the root', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <CollapsibleCard title="Notifications" as="article" ref={ref} className="extra">
        Body
      </CollapsibleCard>,
    );
    expect(ref.current).toBe(root(container));
    expect(ref.current?.tagName).toBe('ARTICLE');
    expect(ref.current).toHaveAttribute('class', 'card card-collapsible extra');
  });

  it('passes other HTML attributes to the root, data-theme included', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" id="notifications" data-theme="light" style={{ width: 320 }}>
        Body
      </CollapsibleCard>,
    );
    const card = root(container);
    expect(card).toHaveAttribute('id', 'notifications');
    expect(card).toHaveAttribute('data-theme', 'light');
    expect(card).toHaveStyle({ width: '320px' });
  });

  it('marks the root data-folding while the fold moves, and clears it when the fold has finished', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const card = root(container);
    expect(card).not.toHaveAttribute('data-folding');
    const fold = transition();
    Object.defineProperty(foldOf(container), 'getAnimations', { value: () => [fold.animation] });
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(card).toHaveAttribute('data-folding', '');
    await settle();
    expect(card).toHaveAttribute('data-folding', '');
    fold.finish();
    await waitFor(() => {
      expect(card).not.toHaveAttribute('data-folding');
    });
  });

  it('keeps data-folding until the latest fold has finished, when a toggle turns the fold back', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    const card = root(container);
    const toggle = screen.getByRole('button', { name: 'Notifications' });
    let running = transition();
    Object.defineProperty(foldOf(container), 'getAnimations', { value: () => [running.animation] });
    await user.click(toggle);
    const folding = running;
    running = transition();
    await user.click(toggle);
    // The transition that was turned back is cancelled, and settles late: it changes nothing.
    folding.cancel();
    await settle();
    expect(card).toHaveAttribute('data-folding', '');
    running.finish();
    await waitFor(() => {
      expect(card).not.toHaveAttribute('data-folding');
    });
  });

  it('clears data-folding at once when nothing moves, as under reduced motion', async () => {
    const user = userEvent.setup();
    const { container } = render(<CollapsibleCard title="Notifications">Body</CollapsibleCard>);
    Object.defineProperty(foldOf(container), 'getAnimations', { value: () => [] });
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await settle();
    expect(root(container)).not.toHaveAttribute('data-folding');
    expect(root(container)).not.toHaveAttribute('data-expanded');
  });

  it('has no axe violations open, folded, with a note and actions, and nested', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <CollapsibleCard
          title="Notifications"
          note="Where we reach you, and how often."
          actions={<Button variant="secondary">Reset</Button>}
        >
          <p>Product updates, when something ships.</p>
          <CollapsibleCard title="Digest" level={3} defaultExpanded={false}>
            <p>Every Tuesday morning.</p>
          </CollapsibleCard>
        </CollapsibleCard>
        <CollapsibleCard title="Billing" as="section" aria-label="Billing" defaultExpanded={false}>
          <p>Paid by card.</p>
        </CollapsibleCard>
      </>,
    );
    await expectNoA11yViolations(container);
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByRole('button', { name: 'Billing' }));
    await expectNoA11yViolations(container);
  });
});
