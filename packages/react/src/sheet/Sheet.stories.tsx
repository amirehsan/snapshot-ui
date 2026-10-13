import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement, ReactNode } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody } from '../card';
import { Checkbox, CheckboxGroup } from '../checkbox';
import { Link } from '../link';
import { tokenColor, tokenPixels } from '../stories/paint';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { Sheet, SheetTrigger, type SheetProps } from './Sheet';

/** The one element on the page that matches `selector`, wherever React Aria portaled it. */
function only(selector: string): HTMLElement {
  const found = document.querySelectorAll<HTMLElement>(selector);
  const [first] = found;
  if (found.length !== 1 || !first)
    throw new Error(`Expected one ${selector}, found ${String(found.length)}`);
  return first;
}

/**
 * Resolves once the open sheet has scrolled in and taken focus. React Aria slides it in with a scroll and moves
 * focus only once that scroll has ended, so a play reads its box at rest and not part way up from the edge.
 */
async function atRest(): Promise<HTMLElement> {
  return waitFor(
    async () => {
      await expect(only('.sheet-overlay')).not.toHaveAttribute('data-entering');
      const sheet = only('.sheet');
      // Fully open: the whole sheet is in view.
      await expect(sheet).toHaveAttribute('data-expanded');
      await expect(only('.sheet-content').contains(document.activeElement)).toBe(true);
      return sheet;
    },
    { timeout: 5000 },
  );
}

/** A short filter form, what a sheet on a phone most often holds. */
const FILTERS: ReactNode = (
  <div style={{ display: 'grid', gap: 24 }}>
    <TextField label="Payee" />
    <CheckboxGroup label="Status" defaultValue={['cleared']}>
      <Checkbox value="cleared">Cleared</Checkbox>
      <Checkbox value="pending">Pending</Checkbox>
    </CheckboxGroup>
  </div>
);

/** The action a filter sheet ends in, pinned in the footer. */
const SHOW: ReactNode = (
  <Button slot="close" style={{ width: '100%' }}>
    Show 24 transactions
  </Button>
);

/** Forty rows, more than any viewport the suite shoots holds. */
const ROWS: ReactNode = (
  <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
    {Array.from({ length: 40 }, (_, index) => (
      <li key={index}>{`Payment ${String(index + 1)} to Northwind Supplies`}</li>
    ))}
  </ul>
);

/** The pages a phone's tab bar has no room for: the shell's "More" list, which names itself. */
const MORE: ReactNode = (
  <nav aria-label="More pages">
    <ul style={{ display: 'grid', gap: 12, margin: 0, padding: 0, listStyle: 'none' }}>
      {['Reports', 'Budgets', 'Members', 'Settings', 'Help'].map((page) => (
        <li key={page}>
          <Link href={`#${page.toLowerCase()}`}>{page}</Link>
        </li>
      ))}
    </ul>
  </nav>
);

/** The signed-in person, the row the "More" sheet pins under its list. */
const ACCOUNT: ReactNode = (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
    <span
      aria-hidden="true"
      style={{
        display: 'grid',
        flex: 'none',
        placeItems: 'center',
        width: 40,
        height: 40,
        borderRadius: 'var(--radius-pill)',
        background: 'var(--color-bone)',
        fontWeight: 500,
      }}
    >
      AL
    </span>
    <div style={{ minWidth: 0 }}>
      <Text as="span" style={{ display: 'block' }}>
        Ada Lovelace
      </Text>
      <Text as="span" size="small" tone="muted" style={{ display: 'block' }}>
        ada@northwind.example
      </Text>
    </div>
  </div>
);

/** A trigger and its sheet, open on the first render. */
function Opened({
  trigger = 'Filter transactions',
  ...args
}: SheetProps & { trigger?: string }): ReactElement {
  return (
    <SheetTrigger defaultOpen>
      <Button variant="secondary">{trigger}</Button>
      <Sheet {...args} />
    </SheetTrigger>
  );
}

const meta = {
  title: 'Components/Sheet',
  component: Sheet,
  // Every sheet story runs again in WebKit, the engine a phone runs, in the storybook-webkit project.
  tags: ['webkit'],
  args: {
    title: 'Filter transactions',
    description: 'Narrow the list to what you are looking for.',
    children: FILTERS,
    footer: SHOW,
  },
  parameters: {
    // Every story opens a modal, and a docs page that drew them inline would open them all at once.
    docs: { story: { inline: false, height: '480px' } },
  },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A filter form: the grabber, the title and its description beside the close button, a short body and the
 * action pinned in the footer. The sheet sits on the bottom edge, its top corners in the stadium radius and its
 * bottom ones square, as wide as the screen on a phone and 36rem in the middle of a wide one.
 */
export const Basic: Story = {
  render: (args) => <Opened {...args} />,
  play: async () => {
    const sheet = await atRest();
    const box = sheet.getBoundingClientRect();
    await expect(box.bottom).toBeCloseTo(window.innerHeight, 0);
    await expect(box.width).toBeCloseTo(Math.min(document.documentElement.clientWidth, 576), 0);
    const style = getComputedStyle(sheet);
    const stadium = tokenPixels('--radius-stadium');
    await expect(parseFloat(style.borderTopLeftRadius)).toBe(stadium);
    await expect(parseFloat(style.borderTopRightRadius)).toBe(stadium);
    await expect(parseFloat(style.borderBottomLeftRadius)).toBe(0);
    await expect(parseFloat(style.borderBottomRightRadius)).toBe(0);
    const grabber = only('.sheet-grabber').getBoundingClientRect();
    await expect(grabber.width).toBe(40);
    await expect(grabber.height).toBe(4);
    // Centred in the sheet, in its 44px band.
    await expect(grabber.left + grabber.width / 2).toBeCloseTo(box.left + box.width / 2, 0);
    await expect(only('.sheet-grabber-band').getBoundingClientRect().height).toBe(44);
    await expect(
      within(document.body).getByRole('dialog', { name: 'Filter transactions' }),
    ).toBeInTheDocument();
    // The scrim paints under the sheet: first in the overlay, at the overlay's own level and not the modal
    // layer. React Aria makes it inert, as everything outside the sheet, so a hit test cannot tell; nothing
    // covers the sheet itself.
    const scrim = only('.sheet-scrim');
    await expect(getComputedStyle(scrim).zIndex).toBe('auto');
    await expect(scrim.nextElementSibling).toContainElement(sheet);
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(sheet.contains(hit)).toBe(true);
  },
};

/**
 * A body taller than the screen: the sheet stops at 92% of the viewport, the body scrolls inside it, and the
 * footer stays in view. Nothing scrolls sideways, at 375px as at 1280.
 */
export const Overflowing: Story = {
  args: { title: 'Transactions', description: 'Everything this month, newest first.', children: ROWS },
  render: (args) => <Opened {...args} trigger="Show every transaction" />,
  play: async () => {
    const sheet = await atRest();
    await expect(sheet.getBoundingClientRect().height).toBeLessThanOrEqual(0.92 * window.innerHeight + 0.5);
    await expect(sheet.getBoundingClientRect().bottom).toBeCloseTo(window.innerHeight, 0);
    const body = only('.sheet-body');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
    const footer = only('.sheet-footer').getBoundingClientRect();
    await expect(footer.top).toBeGreaterThanOrEqual(0);
    await expect(footer.bottom).toBeLessThanOrEqual(window.innerHeight + 0.5);
    // Nothing in the sheet runs past its sides. React Aria's overlay clips, so the page's own width cannot tell.
    await expect(sheet.scrollWidth).toBeLessThanOrEqual(sheet.clientWidth);
  },
};

/**
 * The shell's "More" sheet: a list of pages names itself, so the title is kept for assistive technology only,
 * and the account row is pinned in the footer.
 */
export const HiddenTitle: Story = {
  args: { title: 'More', isTitleHidden: true, description: undefined, children: MORE, footer: ACCOUNT },
  render: (args) => <Opened {...args} trigger="More" />,
  play: async () => {
    await atRest();
    const body = within(document.body);
    await expect(body.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
    // The heading is in the tree, in React Aria's 1px clipped box, and nothing of it shows.
    const heading = body.getByRole('heading', { level: 2, name: 'More' });
    await expect(heading.parentElement?.getBoundingClientRect().width).toBe(1);
    await expect(body.getByRole('link', { name: 'Reports' })).toBeVisible();
  },
};

/** Tab moves from the sheet to its first control, the close button, which draws the focus ring. */
export const Focused: Story = {
  render: (args) => <Opened {...args} />,
  play: async ({ userEvent }) => {
    await atRest();
    const body = within(document.body);
    await waitFor(() => expect(body.getByRole('dialog')).toHaveFocus());
    await userEvent.tab();
    const close = body.getByRole('button', { name: 'Close' });
    await expect(close).toHaveFocus();
    const ring = getComputedStyle(close);
    await expect(ring.outlineStyle).toBe('solid');
    await expect(parseFloat(ring.outlineWidth)).toBe(2);
  },
};

/**
 * A sheet opened from a trigger in a dark card is dark while the page is light, and the scrim keeps the page's
 * opacity. The play opens it from the keyboard, so the trigger holds focus when the sheet opens: that is the
 * origin the sheet copies its theme from.
 */
export const InDarkScope: Story = {
  render: (args) => (
    <div
      data-theme="dark"
      data-testid="dark-scope"
      style={{ padding: 24, borderRadius: 'var(--radius-stadium)', background: 'var(--color-canvas)' }}
    >
      <Card>
        <CardBody>
          <p>A card in a dark block.</p>
          <SheetTrigger>
            <Button variant="secondary">Filter transactions</Button>
            <Sheet {...args} />
          </SheetTrigger>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Filter transactions' })).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    const sheet = await atRest();
    await expect(sheet).toHaveAttribute('data-theme', 'dark');
    await expect(only('.sheet-scrim')).not.toHaveAttribute('data-theme');
    await expect(only('.sheet-overlay')).not.toHaveAttribute('data-theme');
    const scope = canvas.getByTestId('dark-scope');
    await expect(getComputedStyle(sheet).backgroundColor).toBe(tokenColor('--color-float', scope));
  },
};

/**
 * Opened from a page scrolled down, the sheet still sits on the bottom edge of the viewport and the scrim
 * covers what is in view. React Aria puts its scroller at the page's scroll offset inside an overlay it places
 * at the document's origin, the page's size: an overlay fixed to the viewport would push the sheet down by
 * however far the page is scrolled, and a scrim the viewport's height would cover only the top of the page.
 * The play opens it from the keyboard, since a click would scroll its trigger into view.
 */
export const ScrolledPage: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ paddingBlock: 1000 }}>
      <SheetTrigger>
        <Button variant="secondary">Filter transactions</Button>
        <Sheet {...args} />
      </SheetTrigger>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    const trigger = canvas.getByRole('button', { name: 'Filter transactions' });
    trigger.scrollIntoView({ block: 'center' });
    const scrolled = window.scrollY;
    await expect(scrolled).toBeGreaterThan(200);
    trigger.focus({ preventScroll: true });
    await userEvent.keyboard('{Enter}');
    const sheet = await atRest();
    await expect(window.scrollY).toBe(scrolled);
    const box = sheet.getBoundingClientRect();
    await expect(box.bottom).toBeCloseTo(window.innerHeight, 0);
    await expect(box.top).toBeGreaterThan(0);
    const scrim = only('.sheet-scrim').getBoundingClientRect();
    await expect(scrim.top).toBeLessThanOrEqual(0);
    await expect(scrim.bottom).toBeGreaterThanOrEqual(window.innerHeight);
    const hit = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2);
    await expect(sheet.contains(hit)).toBe(true);
  },
};

/**
 * The backdrop's fit to the shared scrim holds in any order the stylesheets load. An app may import each
 * component's file on its own, and a bundler may put overlay.css after sheet.css: the play restates the shared
 * scrim rule after everything else in the components layer, as a late overlay.css would, and the backdrop still
 * sits under the sheet and covers a scrolled page's view, since its variant outranks that rule.
 */
export const ScrimInAnyOrder: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ paddingBlock: 1000 }}>
      <SheetTrigger>
        <Button variant="secondary">Filter transactions</Button>
        <Sheet {...args} />
      </SheetTrigger>
    </div>
  ),
  play: async ({ canvas, userEvent }) => {
    // First, in a style of its own, a one-class variant of the kind the backdrop once had. It outranks the shared
    // rule in overlay.css, and only the late rule below outranks it, so the probe reads these values unless the
    // late rule is in force.
    const variant = document.createElement('style');
    variant.textContent = `@layer components {
      .scrim-probe {
        z-index: auto;
        transition: none;
      }
    }`;
    document.head.append(variant);
    const late = document.createElement('style');
    late.textContent = `@layer components {
      .overlay-scrim {
        z-index: var(--z-modal);
        height: var(--visual-viewport-height, 100dvh);
        transition: background-color 180ms ease;
      }
    }`;
    document.head.append(late);
    // The positive control: a scrim with that one-class variant loses to the late rule, so it reads the late
    // values only if the late rule is in force. It fails if the late style is never applied or lands in an
    // earlier layer, and the checks below then prove the backdrop's variant outranks the rule, not that it never
    // applied.
    const probe = document.createElement('div');
    probe.className = 'overlay-scrim scrim-probe';
    document.body.append(probe);
    try {
      await expect(getComputedStyle(probe).zIndex).toBe('1000');
      await expect(getComputedStyle(probe).transitionDuration).toBe('0.18s');
      const trigger = canvas.getByRole('button', { name: 'Filter transactions' });
      trigger.scrollIntoView({ block: 'center' });
      await expect(window.scrollY).toBeGreaterThan(200);
      trigger.focus({ preventScroll: true });
      await userEvent.keyboard('{Enter}');
      await atRest();
      const scrim = only('.sheet-scrim');
      const style = getComputedStyle(scrim);
      await expect(style.zIndex).toBe('auto');
      await expect(style.transitionDuration).toBe('0s');
      const box = scrim.getBoundingClientRect();
      await expect(box.top).toBeLessThanOrEqual(0);
      await expect(box.bottom).toBeGreaterThanOrEqual(window.innerHeight);
    } finally {
      probe.remove();
      late.remove();
      variant.remove();
    }
  },
};

/**
 * The swipe is the browser's own scroll: React Aria slides the sheet on a scroller two viewports tall, and
 * closes it once it has scrolled out. A swipe down takes that scroller to its start, which is what this does;
 * the touch gesture itself is the docs test's and the spike's. The smooth scroll is load-bearing. On desktop
 * Safari, React Aria's exit waits for the next `scrollend` once the sheet has left the screen, and after an
 * instant scroll that event can come before the exit starts and never again: in Linux WebKit, the engine CI
 * runs, the sheet then stayed mounted and invisible. A smooth scroll ends after the sheet has left.
 */
export const ScrollToDismiss: Story = {
  tags: ['no-visual'],
  render: (args) => <Opened {...args} />,
  play: async () => {
    await atRest();
    only('[data-sheet-scroll]').scrollTo({ top: 0, behavior: 'smooth' });
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull(), { timeout: 1500 });
  },
};

/**
 * A press above a sheet that can be dismissed closes it. It lands on React Aria's stage, which covers the
 * backdrop, and React Aria's press-outside handling closes the sheet: the backdrop itself is inert.
 */
export const PressOutside: Story = {
  tags: ['no-visual'],
  render: (args) => <Opened {...args} />,
  play: async ({ userEvent }) => {
    const sheet = await atRest();
    const stage = sheet.parentElement;
    if (!stage) throw new Error('No stage');
    await userEvent.click(stage);
    await waitFor(() => expect(within(document.body).queryByRole('dialog')).toBeNull(), { timeout: 1500 });
  },
};

/** An address with no break in it: nothing for the browser to wrap at. */
const LONG = `https://example.com/${'segment'.repeat(9)}end`;

/**
 * A title and a footer that hold a long address with no break in it wrap it inside the sheet, which is 36rem
 * wide at most, so this holds on any screen.
 */
export const LongText: Story = {
  tags: ['no-visual'],
  args: { title: LONG, footer: LONG },
  render: (args) => <Opened {...args} />,
  play: async () => {
    const sheet = await atRest();
    for (const part of ['.sheet-header-text', '.sheet-title', '.sheet-footer']) {
      const element = only(part);
      await expect(element.scrollWidth, part).toBeLessThanOrEqual(element.clientWidth);
    }
    await expect(sheet.scrollWidth).toBeLessThanOrEqual(sheet.clientWidth);
  },
};

/**
 * A filter sheet opened from the "More" sheet: React Aria numbers the second 1 in its stack, the second scrim
 * goes transparent so one paints, and Escape closes the top sheet only and gives focus back to its trigger.
 */
export const Stacked: Story = {
  tags: ['no-visual'],
  args: {
    title: 'More',
    isTitleHidden: true,
    description: undefined,
    children: (
      <SheetTrigger>
        <Button variant="secondary">Filter transactions</Button>
        <Sheet title="Filter transactions" footer={SHOW}>
          {FILTERS}
        </Sheet>
      </SheetTrigger>
    ),
    footer: undefined,
  },
  render: (args) => <Opened {...args} trigger="More" />,
  play: async ({ userEvent }) => {
    await atRest();
    const body = within(document.body);
    const inner = body.getByRole('button', { name: 'Filter transactions' });
    await userEvent.click(inner);
    const top = await body.findByRole('dialog', { name: 'Filter transactions' });
    await waitFor(() => expect(top).toHaveFocus(), { timeout: 5000 });
    const overlays = [...document.querySelectorAll<HTMLElement>('.sheet-overlay')];
    await expect(overlays).toHaveLength(2);
    await expect(overlays[1]).toHaveAttribute('data-stack-index', '1');
    await expect(top.closest('.sheet')).toHaveAttribute('data-stack-index', '1');
    await expect(overlays[0]).toHaveAttribute('data-has-descendants');
    const [under, over] = [...document.querySelectorAll<HTMLElement>('.sheet-scrim')];
    if (!under || !over) throw new Error('No scrims');
    await expect(over).toHaveAttribute('data-stacked');
    await expect(getComputedStyle(over).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    await expect(under).not.toHaveAttribute('data-stacked');
    await userEvent.keyboard('{Escape}');
    // Focus is on the trigger as soon as the top sheet has left the page, not a frame later: the first sheet
    // takes focus from the body 500ms after it has risen, and on a slow machine the top one leaves near that
    // moment.
    await waitFor(() => expect(document.querySelectorAll('.sheet')).toHaveLength(1));
    await expect(inner).toHaveFocus();
    await expect(body.getByRole('dialog', { name: 'More' })).toBeInTheDocument();
  },
};

/**
 * A sheet a button must close: Escape, a press above it and a swipe do nothing, and its close button closes it.
 * A press above the sheet lands on React Aria's stage, which covers the backdrop, so that is what is pressed.
 */
export const NotDismissable: Story = {
  tags: ['no-visual'],
  args: { isDismissable: false },
  render: (args) => <Opened {...args} />,
  play: async ({ userEvent }) => {
    const sheet = await atRest();
    const body = within(document.body);
    await userEvent.keyboard('{Escape}');
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(body.getByRole('dialog')).toBeInTheDocument();
    const stage = sheet.parentElement;
    if (!stage) throw new Error('No stage');
    await userEvent.click(stage);
    await new Promise((resolve) => setTimeout(resolve, 400));
    await expect(body.getByRole('dialog')).toBeInTheDocument();
    await userEvent.click(body.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull(), { timeout: 1500 });
  },
};

/**
 * A field in the sheet takes focus, and React Aria writes the visual viewport's height on the overlay. The
 * content caps at 92% of it, so with an on-screen keyboard that shrinks the visual viewport to 400px, as the
 * play then stands in for, a long sheet is no taller than 368px and its edges. Where it sits, on the layout
 * viewport's bottom edge, is not what this proves.
 */
export const KeyboardUp: Story = {
  tags: ['no-visual'],
  args: {
    title: 'Add a payee',
    description: undefined,
    children: (
      <div style={{ display: 'grid', gap: 24 }}>
        <TextField label="Payee" />
        {ROWS}
      </div>
    ),
  },
  render: (args) => (
    <div style={{ width: 375, maxWidth: '100%' }}>
      <Opened {...args} trigger="Add a payee" />
    </div>
  ),
  play: async ({ userEvent }) => {
    const sheet = await atRest();
    const field = within(document.body).getByRole('textbox', { name: 'Payee' });
    await userEvent.click(field);
    await expect(field).toHaveFocus();
    await expect(field.getBoundingClientRect().bottom).toBeLessThan(window.innerHeight);
    // React Aria's own reading: the visual viewport's height at its scale.
    const viewport = window.visualViewport;
    const visible = viewport ? viewport.height * viewport.scale : document.documentElement.clientHeight;
    const overlay = only('.sheet-overlay');
    const written = parseFloat(overlay.style.getPropertyValue('--visual-viewport-height'));
    await expect(written).toBeCloseTo(visible, 0);
    // A keyboard that leaves 400px in view: the content caps at 92% of it, 368px, and the sheet adds its edges.
    overlay.style.setProperty('--visual-viewport-height', '400px');
    await waitFor(() =>
      expect(only('.sheet-content').getBoundingClientRect().height).toBeLessThanOrEqual(368.5),
    );
    await expect(sheet.getBoundingClientRect().height).toBeLessThanOrEqual(370.5);
    // The body scrolls inside what is left.
    const body = only('.sheet-body');
    await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
  },
};
