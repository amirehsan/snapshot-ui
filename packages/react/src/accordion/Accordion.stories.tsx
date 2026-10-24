import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement } from 'react';
import type { Key } from 'react-aria-components';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { Checkbox } from '../checkbox';
import { focusOn } from '../stories/focus';
import { pressRealKeys } from '../stories/keys';
import { firstLineOffset, middleOf } from '../stories/paint';
import { TextField } from '../text-field';
import { Accordion, AccordionItem, type AccordionProps } from './Accordion';

const meta = {
  title: 'Components/Accordion',
  component: Accordion,
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj;

/** A settings column: the page's width up to 40rem. */
const COLUMN: CSSProperties = { width: '100%', maxWidth: '40rem' };

/** The first element matching `selector` inside `scope`. */
const part = (scope: ParentNode, selector: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
};

/** The item whose toggle is named `title`. */
const itemNamed = (scope: HTMLElement, title: string): HTMLElement => {
  const item = within(scope).getByRole('button', { name: title }).closest<HTMLElement>('.accordion-item');
  if (!item) throw new Error(`No item for ${title}`);
  return item;
};

/**
 * Listens on the document for a focusout that leaves focus on nothing while focus was inside `scope`, which is
 * focus falling to the body (lesson 10); `stop` takes the listener off and returns how many there were.
 */
function watchLostFocus(scope: Element): () => number {
  let lost = 0;
  const onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget === null && event.target instanceof Node && scope.contains(event.target))
      lost += 1;
  };
  document.addEventListener('focusout', onFocusOut, true);
  return () => {
    document.removeEventListener('focusout', onFocusOut, true);
    return lost;
  };
}

/** Each density a row is measured in, put back after. */
async function inEachDensity(check: (density: string) => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const { density } = root.dataset;
  try {
    for (const next of ['comfortable', 'compact']) {
      root.dataset.density = next;
      await check(next);
    }
  } finally {
    root.dataset.density = density ?? 'comfortable';
  }
}

/** A settings page's three sections. */
function Sections(props: Omit<AccordionProps, 'children'>): ReactElement {
  return (
    <Accordion style={COLUMN} {...props}>
      <AccordionItem id="billing" title="Billing address">
        <p>12 Rose Lane, Bristol BS1 4DJ. Invoices go to this address.</p>
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications">
        <p>Email for receipts, push for a payment that waits, and a weekly digest.</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone">
        <p>Close the account and delete every document it holds.</p>
      </AccordionItem>
    </Accordion>
  );
}

/** Three sections, the first open: one rule between items and none at the ends. */
export const Default: Story = {
  tags: ['density'],
  render: () => <Sections defaultExpandedKeys={['billing']} />,
};

/** One at a time: the second open. */
export const SingleExpanded: Story = {
  render: () => <Sections allowsMultipleExpanded={false} defaultExpandedKeys={['notifications']} />,
};

/** A note under each title, in slate, open or folded. */
export const WithNotes: Story = {
  render: () => (
    <Accordion style={COLUMN} defaultExpandedKeys={['billing', 'notifications']}>
      <AccordionItem id="billing" title="Billing address" note="Where invoices and receipts are sent">
        <p>12 Rose Lane, Bristol BS1 4DJ.</p>
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications" note="Email, push and digest settings">
        <p>Email for receipts, push for a payment that waits, and a weekly digest.</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone" note="Close the account">
        <p>Close the account and delete every document it holds.</p>
      </AccordionItem>
    </Accordion>
  ),
};

/** Show all sections at the inline end above the first item, with one item open. */
export const ExpandAll: Story = {
  render: () => <Sections hasExpandAll defaultExpandedKeys={['billing']} />,
};

/** An accordion as a Card's body: the rows end at the card's padding. */
export const InCard: Story = {
  tags: ['density'],
  render: () => (
    <Card as="section" aria-label="Settings" style={COLUMN}>
      <CardHeader>
        <CardTitle level={2}>Settings</CardTitle>
      </CardHeader>
      <CardBody>
        <Accordion defaultExpandedKeys={['billing']}>
          <AccordionItem id="billing" title="Billing address">
            <p>12 Rose Lane, Bristol BS1 4DJ.</p>
          </AccordionItem>
          <AccordionItem id="notifications" title="Notifications" note="Email, push and digest settings">
            <p>Email for receipts and a weekly digest.</p>
          </AccordionItem>
          <AccordionItem id="danger" title="Danger zone">
            <p>Close the account.</p>
          </AccordionItem>
        </Accordion>
      </CardBody>
    </Card>
  ),
};

/** The third item disabled and folded: its title and chevron taupe. */
export const DisabledItem: Story = {
  render: () => (
    <Accordion style={COLUMN} defaultExpandedKeys={['billing']}>
      <AccordionItem id="billing" title="Billing address">
        <p>12 Rose Lane, Bristol BS1 4DJ.</p>
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications">
        <p>Email for receipts and a weekly digest.</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone" isDisabled>
        <p>Close the account.</p>
      </AccordionItem>
    </Accordion>
  ),
};

/** A word of 40 letters with no hyphen and no space, so the only way to fit it is to break it. */
const UNBROKEN = 'notificationpreferencesforeverymemberxyz';

/** A title of twelve words and one unbroken 40-letter word, in the column and in a 24rem frame. */
export const LongTitles: Story = {
  render: () => {
    const items = (
      <>
        <AccordionItem
          id="long"
          title="Where we send receipts, invoices and the weekly digest for every account"
          isChanged
        >
          <p>Twelve words wrap, and the chevron stays level with the first line.</p>
        </AccordionItem>
        <AccordionItem id="word" title={UNBROKEN}>
          <p>The word breaks inside the row rather than widening it.</p>
        </AccordionItem>
      </>
    );
    return (
      <div style={{ display: 'grid', gap: 32, ...COLUMN }}>
        <Accordion>{items}</Accordion>
        <div style={{ width: '24rem', maxWidth: '100%' }}>
          <Accordion>{items}</Accordion>
        </div>
      </div>
    );
  },
};

/** A folded item marked by a changed field inside, and one by isChanged: the clay dot after each title. */
export const FoldedChanged: Story = {
  render: () => (
    <Accordion style={COLUMN} defaultExpandedKeys={['danger']}>
      <AccordionItem id="billing" title="Billing address">
        <TextField label="Street" defaultValue="14 Rose Lane" isChanged />
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications" isChanged>
        <p>Email for receipts and a weekly digest.</p>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone">
        <p>Close the account.</p>
      </AccordionItem>
    </Accordion>
  ),
};

/** Three sections of fields in a form, the second open. */
export const FormSections: Story = {
  tags: ['density'],
  render: () => (
    <form
      style={COLUMN}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Accordion defaultExpandedKeys={['notifications']}>
        <AccordionItem id="billing" title="Billing address">
          <TextField label="Street" name="street" defaultValue="12 Rose Lane" />
          <TextField label="City" name="city" defaultValue="Bristol" />
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications" note="Email, push and digest settings">
          <TextField label="Digest address" name="digest" type="email" defaultValue="ana@example.com" />
          <Checkbox name="push" defaultSelected>
            Push for a payment that waits
          </Checkbox>
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone">
          <TextField label="Type the account name to close it" name="confirm" />
        </AccordionItem>
      </Accordion>
    </form>
  ),
};

/**
 * Arrow Down from the first toggle to the last, never wrapping, Home and End, a disabled toggle passed over, a
 * nested accordion's arrows kept inside it, and a text field in a panel keeping its own arrows.
 */
export const Keys: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <Accordion style={COLUMN} defaultExpandedKeys={['billing', 'more']}>
      <AccordionItem id="billing" title="Billing address">
        <TextField label="Street" defaultValue="12 Rose Lane" />
      </AccordionItem>
      <AccordionItem id="notifications" title="Notifications" isDisabled>
        <p>Email for receipts.</p>
      </AccordionItem>
      <AccordionItem id="more" title="More">
        <Accordion>
          <AccordionItem id="inner-a" title="Exports">
            <p>CSV every month.</p>
          </AccordionItem>
          <AccordionItem id="inner-b" title="Webhooks">
            <p>One address.</p>
          </AccordionItem>
        </Accordion>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone">
        <p>Close the account.</p>
      </AccordionItem>
    </Accordion>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const toggle = (name: string): HTMLElement => canvas.getByRole('button', { name });
    await focusOn(toggle('Billing address'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(toggle('More')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(toggle('Danger zone')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(toggle('Danger zone')).toHaveFocus());
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(toggle('Billing address')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(toggle('Billing address')).toHaveFocus());
    await userEvent.keyboard('{End}');
    await waitFor(() => expect(toggle('Danger zone')).toHaveFocus());
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(toggle('More')).toHaveFocus());
    // Nothing opened or folded.
    await expect(canvasElement.querySelectorAll(':scope .accordion-item[data-expanded]')).toHaveLength(2);
    // The nested accordion keeps its arrows to its own titles.
    await focusOn(toggle('Exports'));
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(toggle('Webhooks')).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(toggle('Webhooks')).toHaveFocus());
    await userEvent.keyboard('{Home}');
    await waitFor(() => expect(toggle('Exports')).toHaveFocus());
    // A text field in a panel keeps its keys: Home takes the caret to the start, as the browser does.
    const street = canvas.getByRole<HTMLInputElement>('textbox', { name: 'Street' });
    await focusOn(street);
    street.setSelectionRange(street.value.length, street.value.length);
    if (await pressRealKeys('{Home}')) {
      await waitFor(() => expect(street.selectionStart).toBe(0));
    }
    await userEvent.keyboard('{ArrowDown}');
    await expect(street).toHaveFocus();
  },
};

/** Billing open, its Done button folding it by script, as an app's own button would. */
function FoldFromInside(): ReactElement {
  const [keys, setKeys] = useState<Set<Key>>(new Set(['billing']));
  return (
    <Accordion style={COLUMN} expandedKeys={keys} onExpandedChange={setKeys}>
      <AccordionItem id="billing" title="Billing address">
        <TextField label="Street" defaultValue="12 Rose Lane" />
        <div>
          <Button
            variant="secondary"
            onPress={() => {
              setKeys(new Set());
            }}
          >
            Done
          </Button>
        </div>
      </AccordionItem>
      <AccordionItem id="danger" title="Danger zone">
        <p>Close the account.</p>
      </AccordionItem>
    </Accordion>
  );
}

/**
 * An item that folds while focus is in its panel gives focus to its toggle, never to the body: a press on the
 * panel's Done folds it by script, and a focusout listener finds no focus left on nothing (lesson 10).
 */
export const FoldWithFocusInside: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <FoldFromInside />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const accordion = part(canvasElement, '.accordion');
    await focusOn(canvas.getByRole('textbox', { name: 'Street' }));
    const stop = watchLostFocus(accordion);
    await userEvent.click(canvas.getByRole('button', { name: 'Done' }));
    const toggle = canvas.getByRole('button', { name: 'Billing address' });
    await waitFor(() => expect(toggle).toHaveAttribute('aria-expanded', 'false'));
    await waitFor(() => expect(toggle).toHaveFocus());
    await waitFor(() => expect(part(canvasElement, '.accordion-fold')).toHaveAttribute('hidden'), {
      timeout: 5000,
    });
    await expect(toggle).toHaveFocus();
    await expect(stop()).toBe(0);
  },
};

/** Forty lines of reasons in a folded item, with a match at the end. */
function LongSections({ multiple }: { multiple: boolean }): ReactElement {
  return (
    <Accordion style={COLUMN} allowsMultipleExpanded={multiple} defaultExpandedKeys={['billing']}>
      <AccordionItem id="billing" title="Billing address">
        <p>12 Rose Lane, Bristol BS1 4DJ.</p>
      </AccordionItem>
      <AccordionItem id="reasons" title="Why this verdict">
        {Array.from({ length: 40 }, (_, line) => (
          <p key={line}>Reason {line + 1} behind the verdict, written out at length so the panel is long.</p>
        ))}
        <p>
          The <span data-testid="match">zebrafinch</span> rule decided it.
        </p>
      </AccordionItem>
    </Accordion>
  );
}

/**
 * Find-in-page reaching a folded item opens it drawn at once, with its match in view; one at a time, the open
 * item folds in the same commit, drawn at once too. CollapsibleCard's method: the play does what the browser does
 * for a match in a hidden="until-found" element in one task, a beforematch, then the scroll.
 */
export const FindInFolded: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 48 }}>
      <div data-testid="several">
        <LongSections multiple />
      </div>
      <div data-testid="single">
        <LongSections multiple={false} />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const mode of ['several', 'single']) {
      const scope = part(canvasElement, `[data-testid="${mode}"]`);
      const item = itemNamed(scope, 'Why this verdict');
      const fold = part(item, '.accordion-fold');
      const match = part(scope, '[data-testid="match"]');
      await waitFor(() => expect(fold).toHaveAttribute('hidden', 'until-found'));
      fold.dispatchEvent(new Event('beforematch'));
      match.scrollIntoView({ block: 'center' });
      await expect(item).toHaveAttribute('data-expanded');
      await expect(item).toHaveAttribute('data-instant');
      const billing = itemNamed(scope, 'Billing address');
      if (mode === 'single') {
        await expect(billing).not.toHaveAttribute('data-expanded');
        await expect(billing).toHaveAttribute('data-instant');
      } else {
        await expect(billing).toHaveAttribute('data-expanded');
      }
      await waitFor(
        async () => {
          await expect(item).not.toHaveAttribute('data-folding');
          await expect(item).not.toHaveAttribute('data-instant');
        },
        { timeout: 5000 },
      );
      const box = match.getBoundingClientRect();
      await expect(box.top).toBeGreaterThanOrEqual(0);
      await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
      await expect(document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)).toBe(match);
    }
  },
};

/** A form whose folded third section holds a required empty field. */
function InvalidForm({ multiple, testId }: { multiple: boolean; testId: string }): ReactElement {
  return (
    <form
      data-testid={testId}
      style={{ display: 'grid', gap: 24, ...COLUMN }}
      onSubmit={(event) => {
        event.preventDefault();
      }}
    >
      <Accordion allowsMultipleExpanded={multiple} defaultExpandedKeys={['billing']}>
        <AccordionItem id="billing" title="Billing address">
          <TextField label="Street" defaultValue="12 Rose Lane" />
        </AccordionItem>
        <AccordionItem id="notifications" title="Notifications">
          <p>Email for receipts.</p>
        </AccordionItem>
        <AccordionItem id="danger" title="Danger zone">
          <TextField label="Account name" isRequired />
        </AccordionItem>
      </Accordion>
      <div>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

/**
 * Enter in the open section's field submits, and the required empty field in a folded section opens its item,
 * drawn at once, and holds focus in view; one at a time, the open item folds.
 */
export const OpensForInvalid: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 48 }}>
      <InvalidForm multiple testId="several" />
      <InvalidForm multiple={false} testId="single" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const mode of ['several', 'single']) {
      const form = part(canvasElement, `[data-testid="${mode}"]`);
      const scope = within(form);
      const item = itemNamed(form, 'Danger zone');
      await focusOn(scope.getByRole('textbox', { name: 'Street' }));
      // Enter in a field submits the form by the browser's own action, which an untrusted key does not take.
      if (!(await pressRealKeys('{Enter}'))) (form as HTMLFormElement).requestSubmit();
      const field = await waitFor(() => scope.getByRole('textbox', { name: 'Account name' }));
      await waitFor(() => expect(field).toHaveFocus());
      await expect(item).toHaveAttribute('data-expanded');
      const billing = itemNamed(form, 'Billing address');
      await expect(billing.hasAttribute('data-expanded')).toBe(mode === 'several');
      await waitFor(() => expect(item).not.toHaveAttribute('data-folding'), { timeout: 5000 });
      await expect(field).toBeVisible();
      const box = field.getBoundingClientRect();
      await expect(box.top).toBeGreaterThanOrEqual(0);
      await expect(box.bottom).toBeLessThanOrEqual(window.innerHeight);
    }
  },
};

/**
 * One at a time, one press folds one item and opens another: both carry data-folding from the same commit, both
 * fold rows run a 200ms ease transition, and neither keeps data-folding after.
 */
export const SingleModeTogether: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Sections allowsMultipleExpanded={false} defaultExpandedKeys={['billing']} />,
  play: async ({ canvasElement }) => {
    const billing = itemNamed(canvasElement, 'Billing address');
    const notifications = itemNamed(canvasElement, 'Notifications');
    // Each item's data-folding as the commit writes it, with the observer's batch it came in: two marks from one
    // commit come in one batch.
    const seen: string[] = [];
    let batch = 0;
    const observer = new MutationObserver((records) => {
      batch += 1;
      for (const record of records) {
        const target = record.target as HTMLElement;
        if (!target.hasAttribute('data-folding')) continue;
        seen.push(`${String(batch)} ${target === billing ? 'billing' : 'notifications'}`);
      }
    });
    observer.observe(canvasElement, { attributeFilter: ['data-folding'], subtree: true });
    const toggle = within(canvasElement).getByRole('button', { name: 'Notifications' });
    try {
      await userEvent.click(toggle);
      const rows = [billing, notifications].map((item) =>
        part(item, '.accordion-fold')
          .getAnimations()
          .filter((animation) => (animation as CSSTransition).transitionProperty === 'grid-template-rows'),
      );
      for (const running of rows) {
        await expect(running).toHaveLength(1);
        const timing = running[0]?.effect?.getTiming();
        await expect(timing?.duration).toBe(200);
        await expect(timing?.easing).toBe('ease');
      }
      await waitFor(() => expect(seen).toHaveLength(2));
      await expect([...seen].sort()).toEqual(['1 billing', '1 notifications']);
      await waitFor(
        async () => {
          await expect(billing).not.toHaveAttribute('data-folding');
          await expect(notifications).not.toHaveAttribute('data-folding');
        },
        { timeout: 5000 },
      );
      await expect(billing).not.toHaveAttribute('data-expanded');
      await expect(notifications).toHaveAttribute('data-expanded');
    } finally {
      observer.disconnect();
    }
  },
};

/** Show all's words, aria-expanded and aria-controls after each press, with focus kept on it. */
export const ExpandAllState: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Sections hasExpandAll defaultExpandedKeys={['billing']} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Show all sections' });
    const panels = [...canvasElement.querySelectorAll('.accordion-fold')].map((fold) => fold.id);
    await expect(button).toHaveAttribute('aria-controls', panels.join(' '));
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    const stop = watchLostFocus(canvasElement);
    await focusOn(button);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(button).toHaveTextContent('Hide all sections'));
    await expect(button).toHaveAttribute('aria-expanded', 'true');
    await expect(canvasElement.querySelectorAll('.accordion-item[data-expanded]')).toHaveLength(3);
    await expect(button).toHaveFocus();
    await userEvent.click(button);
    await waitFor(() => expect(button).toHaveTextContent('Show all sections'));
    await expect(button).toHaveAttribute('aria-expanded', 'false');
    await expect(canvasElement.querySelectorAll('.accordion-item[data-expanded]')).toHaveLength(0);
    await expect(button).toHaveFocus();
    await expect(button).toHaveAttribute('aria-controls', panels.join(' '));
    await expect(stop()).toBe(0);
  },
};

/**
 * One-line rows are 48px comfortable and 40px compact, within a pixel; the title's first line is centred in the
 * row, and the chevron is level with it.
 */
export const RowHeights: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <Sections defaultExpandedKeys={[]} />,
  play: async ({ canvasElement }) => {
    const toggles = [...canvasElement.querySelectorAll<HTMLElement>('.accordion-toggle')];
    await inEachDensity(async (density) => {
      const row = density === 'compact' ? 40 : 48;
      for (const toggle of toggles) {
        await waitFor(() =>
          expect(Math.abs(toggle.getBoundingClientRect().height - row)).toBeLessThanOrEqual(1),
        );
        const text = part(toggle, '.accordion-toggle-text');
        await expect(Math.abs(firstLineOffset(toggle, text))).toBeLessThanOrEqual(1);
        const chevron = part(toggle, '.accordion-chevron');
        await expect(Math.abs(middleOf(chevron) - middleOf(toggle))).toBeLessThanOrEqual(1);
      }
    });
  },
};
