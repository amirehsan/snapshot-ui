import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf } from '../../test/dom';
import { TextField } from '../text-field';
import { Accordion, AccordionItem, type AccordionProps } from './Accordion';

/** A settings page's three sections, Billing open, as the stories draw them. */
function Sections(props: Omit<AccordionProps, 'children'>): ReactElement {
  return (
    <Accordion defaultExpandedKeys={['billing']} {...props}>
      <AccordionItem id="billing" title="Billing address">
        <p>12 Rose Lane</p>
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications" note="Email, push and digest settings">
        <p>Email, push and digest</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone">
        <p>Delete the account</p>
      </AccordionItem>
    </Accordion>
  );
}

const toggleOf = (title: string): HTMLElement => screen.getByRole('button', { name: title, hidden: true });

const itemOf = (title: string): HTMLElement => {
  const item = toggleOf(title).closest<HTMLElement>('.accordion-item');
  if (!item) throw new Error(`No item for ${title}`);
  return item;
};

const isOpen = (title: string): boolean => itemOf(title).hasAttribute('data-expanded');

const openTitles = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.accordion-item[data-expanded] .accordion-toggle-text')].map(
    (text) => text.textContent,
  );

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Accordion', () => {
  it('draws a DisclosureGroup of items, each a heading with a trigger button, an optional note and a panel', () => {
    const { container } = render(<Sections />);
    const accordion = container.firstElementChild;
    expect(accordion).toHaveClass('accordion');
    expect(accordion).toHaveAttribute('data-multiple', '');
    const items = [...container.querySelectorAll(':scope > .accordion > .accordion-item')];
    expect(items).toHaveLength(3);
    const [, notifications] = items;
    if (!notifications) throw new Error('No second item');
    // The item is its own root around React Aria's disclosure, which holds the heading, the note and the fold.
    expect([...notifications.children].map((child) => child.className)).toEqual(['accordion-disclosure']);
    const disclosure = notifications.firstElementChild;
    expect([...(disclosure?.children ?? [])].map((child) => `${child.tagName} ${child.className}`)).toEqual([
      'H3 accordion-heading',
      'P accordion-note',
      'DIV accordion-fold',
    ]);
    const toggle = toggleOf('Notifications');
    expect(toggle.parentElement).toHaveClass('accordion-heading');
    expect(toggle).toHaveClass('accordion-toggle');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    // The note is outside the toggle, so the toggle is named by the title alone.
    expect(toggle).toHaveAccessibleName('Notifications');
    expect(toggle.querySelector('.accordion-toggle-text')).toHaveTextContent('Notifications');
    expect(toggle.querySelector('svg.accordion-chevron')).toHaveAttribute('aria-hidden', 'true');
    const fold = notifications.querySelector('.accordion-fold');
    expect(fold?.firstElementChild).toHaveClass('accordion-body');
    expect(toggle).toHaveAttribute('aria-controls', fold?.id);
    // The open panel is a group named by its toggle.
    expect(screen.getByRole('group', { name: 'Billing address' })).toHaveClass('accordion-fold');
  });

  it.each([[2], [3], [4], [5], [6]] as const)('renders each title as an h%s, h3 by default', (level) => {
    const { unmount } = render(<Sections level={level} />);
    expect(screen.getAllByRole('heading', { level })).toHaveLength(3);
    unmount();
    render(<Sections />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  });

  it('lets several items stay open by default and one at a time with allowsMultipleExpanded false', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<Sections />);
    await user.click(toggleOf('Notifications'));
    await user.click(toggleOf('Danger zone'));
    expect(openTitles(container)).toEqual(['Billing address', 'Notifications', 'Danger zone']);
    unmount();
    const single = render(<Sections allowsMultipleExpanded={false} />);
    expect(single.container.firstElementChild).not.toHaveAttribute('data-multiple');
    await user.click(toggleOf('Notifications'));
    expect(openTitles(single.container)).toEqual(['Notifications']);
    await user.click(toggleOf('Danger zone'));
    expect(openTitles(single.container)).toEqual(['Danger zone']);
  });

  it('opens the items in defaultExpandedKeys and follows controlled expandedKeys and onExpandedChange', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(<Sections defaultExpandedKeys={['notifications', 'danger']} />);
    expect(openTitles(container)).toEqual(['Notifications', 'Danger zone']);
    unmount();
    const changes: string[][] = [];
    function Controlled(): ReactElement {
      const [keys, setKeys] = useState<Set<string | number>>(new Set(['danger']));
      return (
        <Sections
          expandedKeys={keys}
          onExpandedChange={(next) => {
            changes.push([...next].map(String));
            setKeys(next);
          }}
        />
      );
    }
    const controlled = render(<Controlled />);
    expect(openTitles(controlled.container)).toEqual(['Danger zone']);
    await user.click(toggleOf('Billing address'));
    expect(changes).toEqual([['danger', 'billing']]);
    expect(openTitles(controlled.container)).toEqual(['Billing address', 'Danger zone']);
    // A parent that keeps its keys keeps the items as they are.
    const ignored = vi.fn();
    controlled.unmount();
    const fixed = render(<Sections expandedKeys={['billing']} onExpandedChange={ignored} />);
    await user.click(toggleOf('Danger zone'));
    expect(ignored).toHaveBeenCalledOnce();
    expect(openTitles(fixed.container)).toEqual(['Billing address']);
  });

  it.each([
    ['several open', true],
    ['one at a time', false],
  ])('lets every item fold in either mode (%s)', async (_mode, multiple) => {
    const user = userEvent.setup();
    const { container } = render(<Sections allowsMultipleExpanded={multiple} />);
    await user.click(toggleOf('Billing address'));
    expect(openTitles(container)).toEqual([]);
    expect(toggleOf('Billing address')).toHaveAttribute('aria-expanded', 'false');
  });

  it('draws Show all sections only with hasExpandAll and several allowed, and warns once otherwise', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container, unmount } = render(<Sections />);
    expect(container.querySelector('.accordion-controls')).toBeNull();
    unmount();
    const shown = render(<Sections hasExpandAll />);
    const controls = shown.container.querySelector('.accordion > .accordion-controls');
    expect(controls).toBe(shown.container.querySelector('.accordion')?.firstElementChild);
    expect(controls?.querySelector('button')).toHaveClass(
      'button',
      'button-tertiary',
      'accordion-expand-all',
    );
    expect(warn).not.toHaveBeenCalled();
    shown.unmount();
    const single = render(<Sections hasExpandAll allowsMultipleExpanded={false} />);
    expect(single.container.querySelector('.accordion-controls')).toBeNull();
    single.rerender(<Sections hasExpandAll allowsMultipleExpanded={false} level={4} />);
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/hasExpandAll needs allowsMultipleExpanded/);
  });

  it('opens every enabled item and then folds every item from Show all, changing its words and aria-expanded', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Accordion hasExpandAll defaultExpandedKeys={['billing', 'danger']}>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications">
          Email
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone" isDisabled>
          Delete
        </AccordionItem>
        <AccordionItem id="closed" title="Closed account" isDisabled>
          Gone
        </AccordionItem>
      </Accordion>,
    );
    const button = screen.getByRole('button', { name: 'Show all sections' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);
    // Every enabled item opens; a disabled one keeps the state it had.
    expect(openTitles(container)).toEqual(['Billing address', 'Notifications', 'Danger zone']);
    expect(button).toHaveTextContent('Hide all sections');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(button).toHaveFocus();
    await user.click(button);
    expect(openTitles(container)).toEqual(['Danger zone']);
    expect(button).toHaveTextContent('Show all sections');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(toggleOf('Billing address')).toHaveAttribute('aria-expanded', 'false');
  });

  it("takes Show all's words from labels", async () => {
    const user = userEvent.setup();
    render(<Sections hasExpandAll labels={{ showAll: 'همه را باز کن', hideAll: 'همه را ببند' }} />);
    await user.click(screen.getByRole('button', { name: 'همه را باز کن' }));
    expect(screen.getByRole('button', { name: 'همه را ببند' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('names every known panel in Show all aria-controls, in the server HTML', () => {
    const html = renderToString(<Sections hasExpandAll />);
    const host = document.createElement('div');
    host.innerHTML = html;
    const ids = [...host.querySelectorAll('.accordion-fold')].map((fold) => fold.id);
    expect(ids).toHaveLength(3);
    expect(new Set(ids).size).toBe(3);
    const button = host.querySelector('.accordion-expand-all');
    expect(button).toHaveAttribute('aria-controls', ids.join(' '));
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveTextContent('Show all sections');
    expect(
      [...host.querySelectorAll('.accordion-toggle')].map((toggle) => toggle.getAttribute('aria-controls')),
    ).toEqual(ids);
  });

  it('finds items inside a fragment or an array among its children', () => {
    render(
      <Accordion hasExpandAll>
        <>
          <AccordionItem id="billing" title="Billing address">
            12 Rose Lane
          </AccordionItem>
        </>
        {[
          <AccordionItem key="n" id="notifications" title="Notifications">
            Email
          </AccordionItem>,
        ]}
      </Accordion>,
    );
    const folds = [...document.querySelectorAll('.accordion-fold')].map((fold) => fold.id);
    expect(screen.getByRole('button', { name: 'Show all sections' })).toHaveAttribute(
      'aria-controls',
      folds.join(' '),
    );
  });

  it('finds items a server component passes, whose type is a lazy client reference', () => {
    // React's server components hand a client component's element to the client with a lazy type that
    // resolves to the component, never the component itself.
    const LazyItem = {
      $$typeof: Symbol.for('react.lazy'),
      _payload: AccordionItem,
      _init: (component: unknown) => component,
    } as unknown as typeof AccordionItem;
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const html = renderToString(
      <Accordion hasExpandAll>
        <LazyItem id="billing" title="Billing address">
          12 Rose Lane
        </LazyItem>
        <LazyItem id="notifications" title="Notifications">
          Email
        </LazyItem>
      </Accordion>,
    );
    const host = document.createElement('div');
    host.innerHTML = html;
    const ids = [...host.querySelectorAll('.accordion-fold')].map((fold) => fold.id);
    const button = host.querySelector('.accordion-expand-all');
    expect(button).toHaveTextContent('Show all sections');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', ids.join(' '));
    expect(ids.every((id) => id.includes('-panel-'))).toBe(true);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns once for an item it cannot see among its children while hasExpandAll is on', async () => {
    const user = userEvent.setup();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    function Wrapped(): ReactElement {
      return (
        <AccordionItem id="wrapped" title="Wrapped section">
          Inside an app component
        </AccordionItem>
      );
    }
    const { container, rerender } = render(
      <Accordion hasExpandAll>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <Wrapped />
      </Accordion>,
    );
    rerender(
      <Accordion hasExpandAll level={4}>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <Wrapped />
      </Accordion>,
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/"wrapped" is not among the accordion's own children/);
    // It works, with a panel id of its own, and Show all leaves it out.
    await user.click(toggleOf('Wrapped section'));
    expect(isOpen('Wrapped section')).toBe(true);
    const own = itemOf('Wrapped section').querySelector('.accordion-fold')?.id ?? '';
    expect(own).not.toBe('');
    expect(toggleOf('Wrapped section')).toHaveAttribute('aria-controls', own);
    const button = screen.getByRole('button', { name: 'Show all sections' });
    expect(button.getAttribute('aria-controls')).not.toContain(own);
    await user.click(button);
    expect(openTitles(container)).toEqual(['Billing address', 'Wrapped section']);
    // Without Show all nothing is said.
    warn.mockClear();
    render(
      <Accordion>
        <Wrapped />
      </Accordion>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('moves between its own enabled toggles with Arrow Up, Arrow Down, Home and End, with no wrap', async () => {
    const user = userEvent.setup();
    render(
      <Accordion>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications" isDisabled>
          Email
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone">
          Delete
        </AccordionItem>
        <AccordionItem id="closed" title="Closed account">
          Gone
        </AccordionItem>
      </Accordion>,
    );
    toggleOf('Billing address').focus();
    await user.keyboard('{ArrowDown}');
    // The disabled toggle is passed over.
    expect(toggleOf('Danger zone')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(toggleOf('Closed account')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(toggleOf('Closed account')).toHaveFocus();
    await user.keyboard('{Home}');
    expect(toggleOf('Billing address')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(toggleOf('Billing address')).toHaveFocus();
    await user.keyboard('{End}');
    expect(toggleOf('Closed account')).toHaveFocus();
    await user.keyboard('{ArrowUp}');
    expect(toggleOf('Danger zone')).toHaveFocus();
    // An arrow moves focus only, never the state.
    expect(document.querySelectorAll('.accordion-item[data-expanded]')).toHaveLength(0);
  });

  it('prevents the keys it handles, at an end too, and leaves every other key alone', () => {
    render(<Sections />);
    toggleOf('Danger zone').focus();
    const press = (key: string, init: KeyboardEventInit = {}): boolean => {
      const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
      act(() => {
        document.activeElement?.dispatchEvent(event);
      });
      return event.defaultPrevented;
    };
    expect(press('ArrowDown')).toBe(true);
    expect(toggleOf('Danger zone')).toHaveFocus();
    expect(press('ArrowLeft')).toBe(false);
    expect(press('PageDown')).toBe(false);
    // A modified key is the browser's or the reader's, as Alt with an arrow is.
    expect(press('ArrowUp', { altKey: true })).toBe(false);
    expect(press('Home', { ctrlKey: true })).toBe(false);
    expect(toggleOf('Danger zone')).toHaveFocus();
  });

  it('leaves arrow keys alone in a panel field and on a nested accordion toggle', async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultExpandedKeys={['billing', 'more']}>
        <AccordionItem id="billing" title="Billing address">
          <TextField label="Street" defaultValue="Rose Lane" />
        </AccordionItem>
        <AccordionItem id="more" title="More">
          <Accordion>
            <AccordionItem id="inner-a" title="Inner first">
              A
            </AccordionItem>
            <AccordionItem id="inner-b" title="Inner second">
              B
            </AccordionItem>
          </Accordion>
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone">
          Delete
        </AccordionItem>
      </Accordion>,
    );
    const street = screen.getByRole('textbox', { name: 'Street' });
    await user.click(street);
    await user.keyboard('{Home}');
    expect(street).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(street).toHaveFocus();
    // The nested accordion moves between its own titles, and stops at its own end.
    toggleOf('Inner first').focus();
    await user.keyboard('{ArrowDown}');
    expect(toggleOf('Inner second')).toHaveFocus();
    await user.keyboard('{ArrowDown}');
    expect(toggleOf('Inner second')).toHaveFocus();
    await user.keyboard('{End}');
    expect(toggleOf('Inner second')).toHaveFocus();
    // And the outer one between its own.
    toggleOf('More').focus();
    await user.keyboard('{ArrowDown}');
    expect(toggleOf('Danger zone')).toHaveFocus();
  });

  it("lets the arrows bubble from React Aria's Button to the root", () => {
    const seen = vi.fn();
    render(
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- a test's listener for the keys the toggles let through
      <div
        onKeyDown={(event) => {
          seen(event.key);
        }}
      >
        <Sections />
      </div>,
    );
    toggleOf('Billing address').focus();
    act(() => {
      document.activeElement?.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      );
    });
    expect(seen).toHaveBeenCalledWith('ArrowDown');
  });

  it('marks a folded item for isChanged and for a field in its panel with data-changed, described by changedLabel', async () => {
    const user = userEvent.setup();
    render(
      <Accordion defaultExpandedKeys={['billing']}>
        <AccordionItem id="billing" title="Billing address">
          <TextField label="Street" defaultValue="Rose Lane" isChanged />
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications" isChanged changedLabel="تغییر کرده">
          Email
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone">
          Delete
        </AccordionItem>
      </Accordion>,
    );
    // Open, nothing is marked: the changed field shows its own chip.
    expect(itemOf('Billing address').querySelector('.accordion-marker')).toBeNull();
    expect(toggleOf('Billing address')).not.toHaveAttribute('aria-describedby');
    // isChanged marks the folded item, and the root carries data-changed.
    expect(itemOf('Notifications')).toHaveAttribute('data-changed', '');
    expect(itemOf('Notifications').querySelector('.accordion-toggle-text .accordion-marker')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    expect(toggleOf('Notifications')).toHaveAccessibleDescription('تغییر کرده');
    expect(toggleOf('Notifications')).toHaveAccessibleName('Notifications');
    // A changed field marks its item once folded, with no data-changed of the item's own.
    await user.click(toggleOf('Billing address'));
    expect(itemOf('Billing address').querySelector('.accordion-marker')).not.toBeNull();
    expect(itemOf('Billing address')).not.toHaveAttribute('data-changed');
    expect(toggleOf('Billing address')).toHaveAccessibleDescription('Changed');
    expect(itemOf('Danger zone').querySelector('.accordion-marker')).toBeNull();
    // Open again, the marker goes.
    await user.click(toggleOf('Notifications'));
    expect(itemOf('Notifications').querySelector('.accordion-marker')).toBeNull();
    expect(toggleOf('Notifications')).not.toHaveAttribute('aria-describedby');
  });

  it('disables a toggle for an item isDisabled and every toggle and Show all for the accordion', async () => {
    const user = userEvent.setup();
    const { rerender } = render(
      <Accordion hasExpandAll defaultExpandedKeys={['danger']}>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone" isDisabled>
          Delete
        </AccordionItem>
      </Accordion>,
    );
    expect(toggleOf('Danger zone')).toBeDisabled();
    expect(itemOf('Danger zone')).toHaveAttribute('data-disabled', '');
    expect(itemOf('Billing address')).not.toHaveAttribute('data-disabled');
    // Its panel keeps the state it had.
    await user.click(toggleOf('Danger zone'));
    expect(isOpen('Danger zone')).toBe(true);
    rerender(
      <Accordion hasExpandAll defaultExpandedKeys={['danger']} isDisabled>
        <AccordionItem id="billing" title="Billing address">
          12 Rose Lane
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone" isDisabled>
          Delete
        </AccordionItem>
      </Accordion>,
    );
    expect(toggleOf('Billing address')).toBeDisabled();
    expect(itemOf('Billing address')).toHaveAttribute('data-disabled', '');
    expect(screen.getByRole('button', { name: 'Show all sections' })).toBeDisabled();
    expect(document.querySelector('.accordion')).toHaveAttribute('data-disabled', 'true');
  });

  it('renders an item outside an Accordion open with its toggle disabled, and warns once', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { rerender } = render(
      <AccordionItem id="alone" title="Alone">
        <p>Never hidden</p>
      </AccordionItem>,
    );
    rerender(
      <AccordionItem id="alone" title="Alone" note="Still open">
        <p>Never hidden</p>
      </AccordionItem>,
    );
    expect(itemOf('Alone')).toHaveAttribute('data-expanded', '');
    expect(toggleOf('Alone')).toBeDisabled();
    expect(toggleOf('Alone')).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText('Never hidden')).toBeVisible();
    expect(warn).toHaveBeenCalledOnce();
    expect(warn.mock.calls[0]?.[0]).toMatch(/AccordionItem belongs in an Accordion/);
  });

  it('keeps folded fields in the form, and a form reset neither opens nor folds', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Accordion defaultExpandedKeys={['billing']}>
          <AccordionItem id="billing" title="Billing address">
            <TextField label="Street" name="street" defaultValue="Rose Lane" />
          </AccordionItem>
          <AccordionItem id="notifications" title="Notifications">
            <TextField label="Digest address" name="digest" defaultValue="ana@example.com" />
          </AccordionItem>
        </Accordion>
      </form>,
    );
    const form = formOf(container);
    // No value of the accordion's own.
    expect(container.querySelectorAll('input')).toHaveLength(2);
    expect(Object.fromEntries(new FormData(form))).toEqual({
      street: 'Rose Lane',
      digest: 'ana@example.com',
    });
    await user.click(toggleOf('Notifications'));
    await user.click(toggleOf('Billing address'));
    act(() => {
      form.reset();
    });
    expect(openTitles(container)).toEqual(['Notifications']);
  });

  it('passes className, ref and the rest props to the accordion and to each item', () => {
    const accordionRef = createRef<HTMLDivElement>();
    const itemRef = createRef<HTMLDivElement>();
    const { container } = render(
      <Accordion className="settings" ref={accordionRef} data-testid="sections" lang="en">
        <AccordionItem id="billing" title="Billing" className="billing" ref={itemRef} data-section="billing">
          12 Rose Lane
        </AccordionItem>
      </Accordion>,
    );
    const accordion = container.firstElementChild;
    expect(accordion).toHaveAttribute('class', 'accordion settings');
    expect(accordion).toHaveAttribute('data-testid', 'sections');
    expect(accordion).toHaveAttribute('lang', 'en');
    expect(accordionRef.current).toBe(accordion);
    const item = container.querySelector('.accordion-item');
    expect(item).toHaveAttribute('class', 'accordion-item billing');
    expect(item).toHaveAttribute('data-section', 'billing');
    expect(itemRef.current).toBe(item);
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['open', <Sections key="open" defaultExpandedKeys={['billing', 'notifications', 'danger']} />],
    ['folded', <Sections key="folded" defaultExpandedKeys={[]} />],
    [
      'marked',
      <Accordion key="marked">
        <AccordionItem id="a" title="Notifications" isChanged>
          Email
        </AccordionItem>
      </Accordion>,
    ],
    [
      'with a disabled item',
      <Accordion key="disabled">
        <AccordionItem id="a" title="Billing">
          Rose Lane
        </AccordionItem>
        <AccordionItem id="b" title="Danger zone" isDisabled>
          Delete
        </AccordionItem>
      </Accordion>,
    ],
    ['with Show all', <Sections key="all" hasExpandAll />],
    [
      'nested',
      <Accordion key="nested" defaultExpandedKeys={['outer']}>
        <AccordionItem id="outer" title="More">
          <Accordion defaultExpandedKeys={['inner']}>
            <AccordionItem id="inner" title="Inner">
              Inside
            </AccordionItem>
          </Accordion>
        </AccordionItem>
      </Accordion>,
    ],
    [
      'with notes',
      <Accordion key="notes">
        <AccordionItem id="a" title="Notifications" note="Email, push and digest settings">
          Email
        </AccordionItem>
        <AccordionItem id="b" title="Danger zone" note="Delete or close the account">
          Delete
        </AccordionItem>
      </Accordion>,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('requires an id on every item and a level from 2 to 6 in its types', () => {
    // @ts-expect-error An item needs its id, so a controlled accordion can name it.
    const noId = <AccordionItem title="Billing">Rose Lane</AccordionItem>;
    const levelOne = (
      // @ts-expect-error The page's h1 is its own title; an accordion's titles are 2 to 6.
      <Accordion level={1}>
        <AccordionItem id="a" title="Billing">
          Rose Lane
        </AccordionItem>
      </Accordion>
    );
    expect([noId, levelOne]).toHaveLength(2);
  });
});
