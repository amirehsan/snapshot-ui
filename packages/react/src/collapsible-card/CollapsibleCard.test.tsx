import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Button } from '../button';
import { TextField } from '../text-field';
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

/** The entry the store keeps its folds in. */
const ENTRY = 'snapshot-ui:collapsed';

/** The folds the browser has stored, as written, or null when nothing has been written. */
const stored = (): unknown => JSON.parse(localStorage.getItem(ENTRY) ?? 'null');

/**
 * Stores folds the way another tab does, or clears the storage when given null, and tells this tab as the
 * browser does.
 */
function storeInAnotherTab(keys: string[] | null): void {
  if (keys === null) localStorage.clear();
  else localStorage.setItem(ENTRY, JSON.stringify(keys));
  act(() => {
    window.dispatchEvent(
      new StorageEvent('storage', {
        key: keys === null ? null : ENTRY,
        newValue: keys === null ? null : JSON.stringify(keys),
        storageArea: localStorage,
      }),
    );
  });
}

/** The toggle of the card with this title. */
const toggleOf = (title: string): HTMLElement => screen.getByRole('button', { name: title });

/** Waits for the next frame, after anything a frame was asked to do. */
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
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

describe('CollapsibleCard with a storageKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('stores its fold, and is folded again when it renders anew', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    const { unmount } = render(
      <CollapsibleCard title="Notifications" storageKey="notifications" onExpandedChange={onExpandedChange}>
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    // Nothing is stored until the card folds or opens.
    expect(stored()).toBeNull();
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toEqual(['notifications']);
    expect(onExpandedChange).toHaveBeenLastCalledWith(false);
    unmount();
    const { container } = render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    // Folded from its first render: nothing moved, so nothing marks a fold, and a card first rendered in the
    // browser has nothing to catch up with.
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    expect(root(container)).not.toHaveAttribute('data-folding');
    expect(root(container)).not.toHaveAttribute('data-instant');
    expect(foldOf(container)).toHaveAttribute('hidden', 'until-found');
    // Opened, its key comes out.
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    expect(stored()).toEqual([]);
  });

  it('is open when its key was never stored, whatever defaultExpanded says', () => {
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications" defaultExpanded={false}>
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
  });

  it('folds and opens every card with the same key together, and no other', async () => {
    const user = userEvent.setup();
    render(
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Billing" storageKey="billing">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Profile">Body</CollapsibleCard>
      </>,
    );
    const expanded = (): (string | null)[] =>
      ['Notifications', 'Notifications again', 'Billing', 'Profile'].map((title) =>
        toggleOf(title).getAttribute('aria-expanded'),
      );
    await user.click(toggleOf('Notifications'));
    expect(expanded()).toEqual(['false', 'false', 'true', 'true']);
    await user.click(toggleOf('Billing'));
    expect(expanded()).toEqual(['false', 'false', 'false', 'true']);
    await user.click(toggleOf('Notifications again'));
    expect(expanded()).toEqual(['true', 'true', 'false', 'true']);
    expect(stored()).toEqual(['billing']);
  });

  it('folds and opens when another tab stores its fold, or clears the storage', () => {
    const { container } = render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    storeInAnotherTab(['billing', 'notifications']);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(root(container)).not.toHaveAttribute('data-expanded');
    storeInAnotherTab(['billing']);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    storeInAnotherTab(['notifications']);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    storeInAnotherTab(null);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
  });

  it('keeps the stored keys of cards that are not on the page', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["billing","profile"]');
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    await user.click(toggleOf('Notifications'));
    expect(stored()).toEqual(['billing', 'profile', 'notifications']);
    await user.click(toggleOf('Notifications'));
    expect(stored()).toEqual(['billing', 'profile']);
  });

  it.each([
    ['unreadable JSON', '["notifications"'],
    ['not a list', '{"notifications":true}'],
  ])('is open when the stored folds are %s, then folds and stores a good list', async (_name, value) => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    localStorage.setItem(ENTRY, value);
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toEqual(['notifications']);
    expect(error).not.toHaveBeenCalled();
  });

  it('is open where the browser blocks storage, and still folds and opens, in step, with no error', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new DOMException('The operation is insecure.', 'SecurityError');
    });
    render(
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Body
        </CollapsibleCard>
      </>,
    );
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(toggleOf('Notifications again')).toHaveAttribute('aria-expanded', 'false');
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications again')).toHaveAttribute('aria-expanded', 'true');
    expect(error).not.toHaveBeenCalled();
  });

  it('still folds when the browser refuses the write, as a full storage does, with no error', async () => {
    const user = userEvent.setup();
    const error = vi.spyOn(console, 'error');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    });
    render(
      <CollapsibleCard title="Notifications" storageKey="notifications">
        Body
      </CollapsibleCard>,
    );
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toBeNull();
    await user.click(toggleOf('Notifications'));
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    expect(error).not.toHaveBeenCalled();
  });

  it('reads and stores nothing when isExpanded controls it', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    localStorage.setItem(ENTRY, '["notifications"]');
    render(
      <>
        <CollapsibleCard
          title="Notifications"
          storageKey="notifications"
          isExpanded
          onExpandedChange={onExpandedChange}
        >
          Body
        </CollapsibleCard>
        <Controlled title="Billing" storageKey="billing">
          Body
        </Controlled>
      </>,
    );
    // The caller's state wins over the stored fold.
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Notifications'));
    expect(onExpandedChange).toHaveBeenCalledWith(false);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggleOf('Billing'));
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
    expect(stored()).toEqual(['notifications']);
  });

  it('opens through the store when find-in-page reaches its folded body, and so does every card with its key', () => {
    const onExpandedChange = vi.fn();
    localStorage.setItem(ENTRY, '["billing","notifications"]');
    const { container } = render(
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications" onExpandedChange={onExpandedChange}>
          Product updates
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Weekly digest
        </CollapsibleCard>
      </>,
    );
    const [fold, again] = container.querySelectorAll('.card-fold');
    expect(fold).toHaveAttribute('hidden', 'until-found');
    expect(again).toHaveAttribute('hidden', 'until-found');
    // The browser fires beforematch on a hidden="until-found" element before it shows text found in it.
    act(() => {
      fold?.dispatchEvent(new Event('beforematch'));
    });
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(toggleOf('Notifications')).toHaveAttribute('aria-expanded', 'true');
    expect(toggleOf('Notifications again')).toHaveAttribute('aria-expanded', 'true');
    expect(fold).not.toHaveAttribute('hidden');
    expect(again).not.toHaveAttribute('hidden');
    expect(stored()).toEqual(['billing']);
  });
});

describe('CollapsibleCard on a server-rendered page', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders open, folds a remembered fold at hydration with transitions held off and no warning, then moves as usual', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["notifications"]');
    // Two cards with one key, which fold in the same commit.
    const page = (
      <>
        <CollapsibleCard title="Notifications" storageKey="notifications">
          Body
        </CollapsibleCard>
        <CollapsibleCard title="Notifications again" storageKey="notifications">
          Body
        </CollapsibleCard>
      </>
    );
    // The server cannot see the browser's storage, so it draws both cards open, each holding its transitions
    // off with the mark.
    const html = renderToString(page);
    expect(html.match(/class="card card-collapsible" data-expanded="" data-instant=""/g)).toHaveLength(2);
    expect(html.match(/aria-expanded="true"/g)).toHaveLength(2);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const cards = [...container.querySelectorAll('.card-collapsible')];
    // Every state each root gains or loses, in order, however quickly it changes back.
    const changes: string[] = [];
    const record = (records: MutationRecord[]): void => {
      for (const { target, attributeName, oldValue } of records) {
        const title = (target as Element).querySelector('.card-toggle-text')?.textContent ?? '';
        changes.push(`${title}: ${attributeName ?? ''} ${oldValue === null ? 'set' : 'removed'}`);
      }
    };
    const observer = new MutationObserver(record);
    for (const card of cards) {
      observer.observe(card, {
        attributes: true,
        attributeOldValue: true,
        attributeFilter: ['data-expanded', 'data-instant'],
      });
    }
    const error = vi.spyOn(console, 'error');
    const onRecoverableError = vi.fn();
    let hydrated: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => {
      hydrated = hydrateRoot(container, page, { onRecoverableError });
      await Promise.resolve();
    });
    // Hydrated, both cards caught up with the stored fold while the mark held every transition off.
    for (const title of ['Notifications', 'Notifications again']) {
      expect(toggleOf(title)).toHaveAttribute('aria-expanded', 'false');
    }
    for (const card of cards) {
      expect(card).not.toHaveAttribute('data-expanded');
      expect(card).toHaveAttribute('data-instant', '');
      expect(card.querySelector('.card-fold')).toHaveAttribute('hidden', 'until-found');
    }
    await act(async () => {
      await nextFrame();
      await nextFrame();
    });
    record(observer.takeRecords());
    // The mark was there before either card folded, and came off two frames later.
    expect(changes).toEqual([
      'Notifications: data-expanded removed',
      'Notifications again: data-expanded removed',
      'Notifications: data-instant removed',
      'Notifications again: data-instant removed',
    ]);
    expect(error).not.toHaveBeenCalled();
    expect(onRecoverableError).not.toHaveBeenCalled();
    // A toggle after that moves as usual: nothing holds the transitions off.
    changes.length = 0;
    await user.click(toggleOf('Notifications'));
    await act(async () => {
      await nextFrame();
      await nextFrame();
    });
    record(observer.takeRecords());
    expect(changes).toEqual(['Notifications: data-expanded set', 'Notifications again: data-expanded set']);
    expect(stored()).toEqual([]);
    observer.disconnect();
    act(() => {
      hydrated?.unmount();
    });
    container.remove();
  });
});

/** The folded marker's dot in the card with this toggle, or null while the card shows none. */
const dotOf = (toggle: HTMLElement): Element | null =>
  toggle.querySelector('.card-toggle-text > .card-marker');

/** The toggle of the card with this title, found in the page even where a folded card hides it. */
function hiddenToggleOf(title: string): HTMLElement {
  const toggle = [...document.querySelectorAll<HTMLElement>('.card-toggle')].find(
    (each) => each.querySelector('.card-toggle-text')?.textContent === title,
  );
  if (!toggle) throw new Error(`No toggle for ${title}`);
  return toggle;
}

/** A folded card holding a field, which `isChanged` marks as changed. */
function Profile({ isChanged }: { isChanged: boolean }): ReactElement {
  return (
    <CollapsibleCard title="Profile" defaultExpanded={false}>
      <TextField label="Display name" defaultValue="Ada" isChanged={isChanged} />
    </CollapsibleCard>
  );
}

describe('CollapsibleCard while it holds a change', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows a dot after the title, and is described as changed, only while folded, when isChanged says so', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged>
        Body
      </CollapsibleCard>,
    );
    const toggle = toggleOf('Notifications');
    const heading = screen.getByRole('heading', { level: 2 });
    // Folded: a dot after the title's words, which is decoration, and words a screen reader reads with the
    // toggle, after its name and its state. The words are in a hidden element after the heading, so neither
    // the toggle's name nor the heading's text changes.
    const dot = dotOf(toggle);
    expect(dot).not.toBeNull();
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(dot?.previousSibling?.textContent).toBe('Notifications');
    expect(toggle).toHaveAccessibleName('Notifications');
    expect(toggle).toHaveAccessibleDescription('Changed');
    expect(heading).toHaveAccessibleName('Notifications');
    expect(heading).toHaveTextContent(/^Notifications$/);
    const label = document.getElementById(toggle.getAttribute('aria-describedby') ?? '');
    expect(label).toHaveClass('card-marker-label');
    expect(label).toHaveAttribute('hidden');
    expect(label?.previousElementSibling).toBe(heading);
    // The root says the card holds a change, as a field's root does, folded or open.
    expect(root(container)).toHaveAttribute('data-changed', '');
    // Open: no dot and no description. Each field shows its own Changed chip.
    await user.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(dotOf(toggle)).toBeNull();
    expect(toggle).not.toHaveAttribute('aria-describedby');
    expect(container.querySelector('.card-marker-label')).toBeNull();
    expect(root(container)).toHaveAttribute('data-changed', '');
    // Folded again, the marker is back.
    await user.click(toggle);
    expect(dotOf(toggle)).not.toBeNull();
    expect(toggle).toHaveAccessibleDescription('Changed');
  });

  it('shows the marker while a field in its folded body is changed, as the field changes', async () => {
    const error = vi.spyOn(console, 'error');
    const { rerender } = render(<Profile isChanged={false} />);
    const toggle = toggleOf('Profile');
    expect(dotOf(toggle)).toBeNull();
    // The field's root gains data-changed while the card is folded, and the card sees it.
    rerender(<Profile isChanged />);
    await waitFor(() => {
      expect(dotOf(toggle)).not.toBeNull();
    });
    expect(toggle).toHaveAccessibleDescription('Changed');
    rerender(<Profile isChanged={false} />);
    await waitFor(() => {
      expect(dotOf(toggle)).toBeNull();
    });
    expect(toggle).not.toHaveAttribute('aria-describedby');
    expect(error).not.toHaveBeenCalled();
  });

  it('shows the marker the moment it folds over a field that changed while it was open', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleCard title="Profile">
        <TextField label="Display name" defaultValue="Ada" isChanged />
      </CollapsibleCard>,
    );
    const toggle = toggleOf('Profile');
    // Open, the field shows its own chip, and the card shows nothing.
    expect(dotOf(toggle)).toBeNull();
    expect(toggle).not.toHaveAttribute('aria-describedby');
    // Nothing changes after the fold, so only a look at the fold as it folds can find the change.
    await user.click(toggle);
    expect(dotOf(toggle)).not.toBeNull();
    expect(toggle).toHaveAccessibleDescription('Changed');
  });

  it('watches its fold only while folded, and stops when it opens or leaves the page', async () => {
    const user = userEvent.setup();
    const observe = vi.spyOn(MutationObserver.prototype, 'observe');
    const disconnect = vi.spyOn(MutationObserver.prototype, 'disconnect');
    const { container, unmount } = render(
      <CollapsibleCard title="Profile">
        <TextField label="Display name" defaultValue="Ada" />
      </CollapsibleCard>,
    );
    const fold = foldOf(container);
    /** Each observer that started watching the fold, in order, and how it was asked to watch. */
    const watchers = (): { observer: unknown; options: unknown }[] =>
      observe.mock.calls.flatMap(([target, options], index) =>
        target === fold ? [{ observer: observe.mock.contexts[index], options }] : [],
      );
    const stopped = (observer: unknown): boolean => disconnect.mock.contexts.includes(observer);
    // Open, nothing watches it.
    expect(watchers()).toEqual([]);
    await user.click(toggleOf('Profile'));
    const [first] = watchers();
    expect(watchers()).toHaveLength(1);
    // The one attribute a changed field carries, anywhere in the body, and the elements that come and go.
    expect(first?.options).toEqual({ attributeFilter: ['data-changed'], subtree: true, childList: true });
    expect(stopped(first?.observer)).toBe(false);
    await user.click(toggleOf('Profile'));
    expect(stopped(first?.observer)).toBe(true);
    expect(watchers()).toHaveLength(1);
    await user.click(toggleOf('Profile'));
    expect(watchers()).toHaveLength(2);
    const second = watchers()[1];
    expect(stopped(second?.observer)).toBe(false);
    unmount();
    expect(stopped(second?.observer)).toBe(true);
  });

  it('counts a changed field inside a card nested in its body, and the nested card keeps its own fold and marker', async () => {
    const user = userEvent.setup();
    render(
      <CollapsibleCard title="Settings" defaultExpanded={false}>
        <p>Everything about your account.</p>
        <CollapsibleCard title="Profile" level={3} defaultExpanded={false}>
          <TextField label="Display name" defaultValue="Ada" isChanged />
        </CollapsibleCard>
      </CollapsibleCard>,
    );
    const outer = toggleOf('Settings');
    const inner = hiddenToggleOf('Profile');
    // Both folded: the outer card counts the field inside the inner one, and the inner card marks it too.
    expect(dotOf(outer)).not.toBeNull();
    expect(outer).toHaveAccessibleDescription('Changed');
    expect(dotOf(inner)).not.toBeNull();
    // Open, the outer card shows no marker, and the inner card is still folded, with its own marker.
    await user.click(outer);
    expect(dotOf(outer)).toBeNull();
    expect(toggleOf('Profile')).toBe(inner);
    expect(inner).toHaveAttribute('aria-expanded', 'false');
    expect(inner).toHaveAccessibleDescription('Changed');
    await user.click(inner);
    expect(dotOf(inner)).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Display name' })).toBeVisible();
    // Folding the outer card hides the inner one, which stays open, and the outer card marks the field again.
    await user.click(outer);
    expect(dotOf(outer)).not.toBeNull();
    expect(screen.queryByRole('button', { name: 'Profile' })).toBeNull();
    expect(inner).toHaveAttribute('aria-expanded', 'true');
    expect(dotOf(inner)).toBeNull();
  });

  it('counts a card nested in its body whose isChanged is true, open or folded, by its root', async () => {
    function Settings({ isChanged }: { isChanged: boolean }): ReactElement {
      return (
        <CollapsibleCard title="Settings" defaultExpanded={false}>
          <CollapsibleCard title="Profile" level={3} isChanged={isChanged}>
            <p>Nothing in here reports a change.</p>
          </CollapsibleCard>
        </CollapsibleCard>
      );
    }
    const { rerender } = render(<Settings isChanged />);
    const outer = toggleOf('Settings');
    const inner = hiddenToggleOf('Profile');
    // The inner card is open, so it shows no marker, but its root says it holds a change, and the folded
    // outer card counts it.
    expect(inner.closest('.card-collapsible')).toHaveAttribute('data-changed', '');
    expect(dotOf(inner)).toBeNull();
    expect(dotOf(outer)).not.toBeNull();
    expect(outer).toHaveAccessibleDescription('Changed');
    rerender(<Settings isChanged={false} />);
    await waitFor(() => {
      expect(dotOf(outer)).toBeNull();
    });
    expect(inner.closest('.card-collapsible')).not.toHaveAttribute('data-changed');
    expect(outer).not.toHaveAttribute('aria-describedby');
  });

  it('reads changedLabel as the marker', () => {
    render(
      <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged changedLabel="Unsaved">
        Body
      </CollapsibleCard>,
    );
    expect(toggleOf('Notifications')).toHaveAccessibleDescription('Unsaved');
    expect(document.querySelector('.card-marker-label')).toHaveTextContent('Unsaved');
  });

  it('has no axe violations folded and changed, and nested', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <CollapsibleCard title="Notifications" defaultExpanded={false} isChanged>
          <p>Product updates, when something ships.</p>
        </CollapsibleCard>
        <CollapsibleCard title="Settings" defaultExpanded={false}>
          <CollapsibleCard title="Profile" level={3} defaultExpanded={false}>
            <TextField label="Display name" defaultValue="Ada" isChanged />
          </CollapsibleCard>
        </CollapsibleCard>
      </>,
    );
    await expectNoA11yViolations(container);
    await user.click(toggleOf('Settings'));
    await expectNoA11yViolations(container);
  });
});

/** Stops a form from leaving the page, which jsdom cannot do. */
const stay = (event: { preventDefault: () => void }): void => {
  event.preventDefault();
};

describe('CollapsibleCard with a field that fails validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('opens when a field inside fails the browser validation on submit, before the field takes focus', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(stay);
    const onExpandedChange = vi.fn();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <CollapsibleCard title="Profile" defaultExpanded={false}>
          <TextField label="Display name" defaultValue="Ada" isRequired />
        </CollapsibleCard>
        <CollapsibleCard title="Billing" defaultExpanded={false} onExpandedChange={onExpandedChange}>
          <TextField label="Card holder" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    const [, billing] = container.querySelectorAll<HTMLElement>('.card-fold');
    const input = billing?.querySelector('input');
    if (!billing || !input) throw new Error('No Billing field');
    // Where the card stood at the moment the field took focus, which React Aria moves to the first field
    // that failed, in its own listener for the field's invalid event.
    const seen: string[] = [];
    input.addEventListener('focus', () => {
      seen.push(
        `${String(hiddenToggleOf('Billing').getAttribute('aria-expanded'))} ${String(billing.getAttribute('hidden'))}`,
      );
    });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'true');
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    // Open, with its body shown, before the field took focus.
    expect(seen).toEqual(['true null']);
    expect(input).toHaveFocus();
    // A card whose fields are all valid stays folded.
    expect(hiddenToggleOf('Profile')).toHaveAttribute('aria-expanded', 'false');
  });

  it('asks a controlled card to open, through onExpandedChange', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <form onSubmit={stay}>
        <CollapsibleCard title="Billing" isExpanded={false} onExpandedChange={onExpandedChange}>
          <TextField label="Card holder" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onExpandedChange).toHaveBeenCalledExactlyOnceWith(true);
    // The caller decides, and has not opened it.
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens a remembered fold through the store, which forgets the fold', async () => {
    const user = userEvent.setup();
    localStorage.setItem(ENTRY, '["profile","billing"]');
    render(
      <form onSubmit={stay}>
        <CollapsibleCard title="Billing" storageKey="billing">
          <TextField label="Card holder" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'true');
    expect(stored()).toEqual(['profile']);
  });

  it('stays folded for a field in its header that fails, which is in view already', async () => {
    const user = userEvent.setup();
    const onExpandedChange = vi.fn();
    render(
      <form onSubmit={stay}>
        <CollapsibleCard
          title="Billing"
          defaultExpanded={false}
          onExpandedChange={onExpandedChange}
          actions={<TextField aria-label="Coupon" isRequired />}
        >
          <TextField label="Card holder" defaultValue="Ada" isRequired />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));
    // React Aria moves focus to the field that failed, which the folded card shows in its header.
    expect(screen.getByRole('textbox', { name: 'Coupon' })).toHaveFocus();
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
    expect(onExpandedChange).not.toHaveBeenCalled();
  });

  it('stays folded for a field React Aria validates with validationBehavior="aria", which fires no invalid event', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(stay);
    const invalid = vi.fn();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <CollapsibleCard title="Billing" defaultExpanded={false}>
          <TextField label="Card holder" isRequired validationBehavior="aria" />
        </CollapsibleCard>
        <button type="submit">Save</button>
      </form>,
    );
    container.addEventListener('invalid', invalid, true);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    // The browser sees nothing wrong, so the form submits and no invalid event reaches the card.
    expect(invalid).not.toHaveBeenCalled();
    expect(onSubmit).toHaveBeenCalledOnce();
    expect(toggleOf('Billing')).toHaveAttribute('aria-expanded', 'false');
  });
});
