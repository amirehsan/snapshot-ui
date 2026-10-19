import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, waitFor } from 'storybook/test';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { CollapsibleCard } from '../collapsible-card';
import { Link } from '../link';
import { DESKTOP, VIEWPORT_OPTIONS } from '../stories/viewports';
import { DescriptionList, DescriptionListItem } from './DescriptionList';

/** An account's details, as the first consumer's details card lists them. */
const DETAILS = [
  <DescriptionListItem key="name" term="Name">
    Everyday Visa
  </DescriptionListItem>,
  <DescriptionListItem key="type" term="Type">
    Credit card
  </DescriptionListItem>,
  <DescriptionListItem key="institution" term="Institution">
    Northwind Bank
  </DescriptionListItem>,
  <DescriptionListItem key="last-four" term="Last four" isNumeric>
    4821
  </DescriptionListItem>,
  // A feed that syncs is neutral: success means a save, never a state that is merely fine.
  <DescriptionListItem key="feed" term="Bank feed">
    <Badge>Connected</Badge>
  </DescriptionListItem>,
  <DescriptionListItem key="limit" term="Credit limit" isNumeric>
    $5,000.00
  </DescriptionListItem>,
  <DescriptionListItem key="apr" term="APR" isNumeric>
    24.9%
  </DescriptionListItem>,
];

/** An unbroken 34-character account number, the longest an IBAN runs: nothing for the browser to wrap at. */
const IBAN = 'GB29NWBK60161331926819000000000000';

const meta = {
  title: 'Components/DescriptionList',
  component: DescriptionList,
  // Padded, not centered: a list is a size container and takes no width from its content, so it needs a block
  // to fill. Centered, the canvas shrinks to its content, and the list, with no width of its own, to nothing.
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  args: { children: DETAILS },
} satisfies Meta<typeof DescriptionList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first element with this class inside `scope`. */
const part = (scope: ParentNode, name: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** A row's grid areas as the browser computed them, with its whitespace closed up. */
const areas = (row: Element): string => getComputedStyle(row).gridTemplateAreas.replace(/\s+/g, ' ');

/** A length on the tokens, in px, as it resolves inside `scope`: the holder's properties included. */
const lengthIn = (scope: Element, value: string): number => {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.inlineSize = value;
  scope.append(probe);
  const { width } = probe.getBoundingClientRect();
  probe.remove();
  return width;
};

/**
 * Seven rows at the canvas's width: terms in slate beside ink values at 1280, above them at 375, where the
 * canvas is under 30rem.
 */
export const Default: Story = { tags: ['density'] };

/** In a 20rem frame the list stacks at every screen width: its own width decides, not the screen's. */
export const Stacked: Story = {
  render: (args) => (
    <div style={{ width: '20rem', maxWidth: '100%' }}>
      <DescriptionList {...args} />
    </div>
  ),
};

/**
 * A row's controls in a dd of their own, each named with its term: Edit beside the name, and Reconnect beside a
 * feed that failed, an error Badge, since a feed that failed is a failure. An empty nickname shows a link to add
 * it in place of the value, with no action.
 */
export const WithActions: Story = {
  tags: ['density'],
  args: {
    children: [
      <DescriptionListItem
        key="name"
        term="Name"
        actions={
          <Button variant="secondary" aria-label="Edit Name">
            Edit
          </Button>
        }
      >
        Everyday Visa
      </DescriptionListItem>,
      // A missing value is added from where it would be, GOV.UK's pattern, not from an action beside "Not set".
      <DescriptionListItem
        key="nickname"
        term="Nickname"
        emptyValue={<Link href="#nickname">Add a nickname</Link>}
      />,
      <DescriptionListItem
        key="feed"
        term="Bank feed"
        actions={
          <Link href="#reconnect" aria-label="Reconnect the bank feed">
            Reconnect
          </Link>
        }
      >
        <Badge tone="error">Failed</Badge>
      </DescriptionListItem>,
      <DescriptionListItem key="limit" term="Credit limit" isNumeric>
        $5,000.00
      </DescriptionListItem>,
    ],
  },
};

/** "Not set" in slate for an empty value, or the app's own words, here a link to add the value. */
export const EmptyValues: Story = {
  args: {
    children: [
      <DescriptionListItem key="name" term="Name">
        Everyday Visa
      </DescriptionListItem>,
      <DescriptionListItem key="nickname" term="Nickname" />,
      <DescriptionListItem key="notes" term="Notes" emptyValue={<Link href="#notes">Add a note</Link>} />,
      <DescriptionListItem key="balance" term="Balance" isNumeric>
        {0}
      </DescriptionListItem>,
    ],
  },
};

const LONG = [
  <DescriptionListItem key="statement" term="Name on the statement">
    Everyday Visa Platinum Rewards for Travel and Dining
  </DescriptionListItem>,
  <DescriptionListItem key="address" term="Billing address">
    12 Harbour Street, Flat 4
    <br />
    Northgate, Springfield
    <br />
    SP1 2AB, United Kingdom
  </DescriptionListItem>,
  <DescriptionListItem key="iban" term="IBAN">
    {IBAN}
  </DescriptionListItem>,
];

/**
 * A term of four words wraps in its column, an address keeps its three lines, and an unbroken 34-character
 * IBAN breaks anywhere inside its column, in a 24rem frame and at the canvas's width. Nothing truncates.
 */
export const LongValues: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div style={{ width: '24rem', maxWidth: '100%' }}>
        <DescriptionList>{LONG}</DescriptionList>
      </div>
      <DescriptionList>{LONG}</DescriptionList>
    </div>
  ),
  play: async ({ canvasElement }) => {
    for (const list of canvasElement.querySelectorAll('.description-list')) {
      const box = list.getBoundingClientRect();
      for (const value of list.querySelectorAll('.description-list-value')) {
        await expect(value.getBoundingClientRect().right).toBeLessThanOrEqual(box.right + 0.5);
        await expect(value.scrollWidth).toBeLessThanOrEqual(value.clientWidth + 1);
      }
    }
  },
};

/** Amounts, a percentage and the last four digits in tabular figures, left to right in every direction. */
export const NumericValues: Story = {
  args: {
    children: [
      <DescriptionListItem key="limit" term="Credit limit" isNumeric>
        $5,000.00
      </DescriptionListItem>,
      <DescriptionListItem key="apr" term="APR" isNumeric>
        24.9%
      </DescriptionListItem>,
      <DescriptionListItem key="last-four" term="Last four" isNumeric>
        4821
      </DescriptionListItem>,
      <DescriptionListItem key="balance" term="Balance" isNumeric>
        -$1,240.00
      </DescriptionListItem>,
    ],
  },
};

/** No rule between rows, for a short list that needs no separation. */
export const NoDividers: Story = { args: { hasDividers: false } };

/** The details card: Edit at the foot of the list stands clear of the card's bottom end curve. */
function DetailsCard({
  hasHeader = true,
  label = 'Details',
}: {
  hasHeader?: boolean;
  label?: string;
}): ReactElement {
  const edit = (
    <Button variant="secondary" aria-label="Edit Nickname">
      Edit
    </Button>
  );
  return (
    <Card as="section" aria-label={label} style={{ width: '100%', maxWidth: '36rem' }}>
      {hasHeader ? (
        <CardHeader>
          <CardTitle level={3}>Details</CardTitle>
        </CardHeader>
      ) : null}
      <CardBody>
        <DescriptionList>
          {hasHeader ? null : (
            <DescriptionListItem term="Nickname" actions={edit}>
              Travel card
            </DescriptionListItem>
          )}
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
          <DescriptionListItem term="Type">Credit card</DescriptionListItem>
          <DescriptionListItem term="Institution">Northwind Bank</DescriptionListItem>
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
          {hasHeader ? (
            <DescriptionListItem term="Nickname" actions={edit}>
              Travel card
            </DescriptionListItem>
          ) : null}
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

/**
 * The list as a card's body, its last row Nickname with an Edit: the row grows by the corner inset less the
 * card's padding, 7px in Rounded and 19px in compact, so Edit stands clear of the bottom end curve and stays on
 * the column's end edge, level with the value's first line.
 */
export const InCard: Story = {
  tags: ['density'],
  render: () => <DetailsCard />,
};

/** Persian terms and values read from the right, a limit still left to right, and the actions at the left. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <DescriptionList>
          <DescriptionListItem term="نام">ویزای روزمره</DescriptionListItem>
          <DescriptionListItem term="نوع">کارت اعتباری</DescriptionListItem>
          <DescriptionListItem term="سقف اعتبار" isNumeric>
            $5,000.00
          </DescriptionListItem>
          <DescriptionListItem
            term="نام مستعار"
            emptyValue="تنظیم نشده"
            actions={
              <Button variant="secondary" aria-label="ویرایش نام مستعار">
                ویرایش
              </Button>
            }
          />
        </DescriptionList>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const value = part(canvasElement, 'description-list-value[data-numeric]');
    await expect(value).toHaveTextContent('$5,000.00');
    await expect(getComputedStyle(value).direction).toBe('ltr');
  },
};

/**
 * The layout follows the list's own width in a page 1280px wide: a 29rem frame stacks, 31rem sets the terms
 * beside their values, with one term column on every row with and without actions, and 29rem stacks again. A
 * 40rem frame holding `layout="stacked"` stays stacked.
 */
export const SwitchesAtItsWidth: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-testid="auto" style={{ width: '29rem' }}>
        <DescriptionList>
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
          <DescriptionListItem term="Nickname" actions={<Link href="#nickname">Add</Link>} />
          <DescriptionListItem term="Credit limit" isNumeric>
            $5,000.00
          </DescriptionListItem>
        </DescriptionList>
      </div>
      <div data-testid="stacked" style={{ width: '40rem' }}>
        <DescriptionList layout="stacked">
          <DescriptionListItem term="Name">Everyday Visa</DescriptionListItem>
        </DescriptionList>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const frame = part(canvasElement, 'description-list').parentElement;
    if (!frame) throw new Error('No frame');
    const rows = [...frame.querySelectorAll('.description-list-item')];
    const [first] = rows;
    if (!first) throw new Error('No rows');
    const STACKED = '"term term" "value value"';
    const SIDE = '"term value value"';
    try {
      await waitFor(() => expect(areas(first)).toBe(STACKED), { timeout: 5000 });
      frame.style.width = '31rem';
      await waitFor(() => expect(areas(first)).toBe(SIDE), { timeout: 5000 });
      // One term column: every value starts at the same edge, with actions on its row or not.
      const starts = rows.map((row) => part(row, 'description-list-value').getBoundingClientRect().left);
      for (const start of starts) await expect(Math.abs(start - (starts[0] ?? 0))).toBeLessThan(1);
      await expect(areas(rows[1] ?? first)).toBe('"term value actions"');
      frame.style.width = '29rem';
      await waitFor(() => expect(areas(first)).toBe(STACKED), { timeout: 5000 });
    } finally {
      frame.style.width = '29rem';
    }
    const held = canvasElement.querySelector('[data-testid="stacked"] .description-list-item');
    if (!held) throw new Error('No held row');
    await expect(areas(held)).toBe(STACKED);
  },
};

/**
 * In a flex row, which sizes its items from their content, the list has none to give, so the app gives it a
 * width, and the list fills it.
 */
export const InAFlexRow: Story = {
  tags: ['no-visual'],
  render: (args) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-inset)' }}>
      <DescriptionList {...args} style={{ width: '24rem', maxWidth: '100%' }} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const list = part(canvasElement, 'description-list');
    const frame = list.parentElement?.getBoundingClientRect().width ?? 0;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    await expect(
      Math.abs(list.getBoundingClientRect().width - Math.min(24 * rem, frame)),
    ).toBeLessThanOrEqual(1);
    // Its rows fill it too, so the width given is the width drawn.
    const row = part(list, 'description-list-item');
    await expect(
      Math.abs(row.getBoundingClientRect().width - list.getBoundingClientRect().width),
    ).toBeLessThan(1);
  },
};

/** The rows a corner case measures, the last with an Edit. */
function caseRows(): ReactElement[] {
  const edit = (
    <Button variant="secondary" aria-label="Edit Nickname">
      Edit
    </Button>
  );
  const nickname = (
    <DescriptionListItem key="nickname" term="Nickname" actions={edit}>
      Travel card
    </DescriptionListItem>
  );
  return [
    <DescriptionListItem key="name" term="Name">
      Everyday Visa
    </DescriptionListItem>,
    <DescriptionListItem key="limit" term="Credit limit" isNumeric>
      $5,000.00
    </DescriptionListItem>,
    nickname,
  ];
}

/** A card 36rem wide at most, named, so its list sits terms beside values at 1280. */
const CASE_CARD = { width: '100%', maxWidth: '36rem' } as const;

/**
 * A row's controls clear of a card's corner, measured in each place a list can stand in a card. Rounded,
 * comfortable and compact: where the rule applies, the Edit stands at least the card's corner inset from the
 * card's edge, and the row grows by the inset less the padding on that side only. Soft and Square: every row
 * keeps the Dense data padding, since the card's padding already clears the curve.
 *
 * - `foot`: the list ends the card's body, side by side.
 * - `head`: the list starts a card with no header, so its first row moves down.
 * - `direct`: the list is the card's own last child, with no body.
 * - `collapsible`: the list ends a collapsible card's body.
 * - `stacked`: the list ends the body but is stacked, so Edit is on the term's line at the row's top, clear
 *   of the curve, and the row keeps its padding.
 * - `followed`: the list is followed by a paragraph in the body, so it is not at the card's foot.
 */
export const CornerClear: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <DetailsCard />
      <DetailsCard hasHeader={false} label="Nickname" />
      <Card as="section" aria-label="Directly in the card" data-case="direct" style={CASE_CARD}>
        <DescriptionList>{caseRows()}</DescriptionList>
      </Card>
      <CollapsibleCard title="Collapsible details" level={3} data-case="collapsible" style={CASE_CARD}>
        <DescriptionList>{caseRows()}</DescriptionList>
      </CollapsibleCard>
      <Card as="section" aria-label="Stacked details" data-case="stacked" style={CASE_CARD}>
        <CardBody>
          <DescriptionList layout="stacked">{caseRows()}</DescriptionList>
        </CardBody>
      </Card>
      <Card as="section" aria-label="Details and a note" data-case="followed" style={CASE_CARD}>
        <CardBody>
          <DescriptionList>{caseRows()}</DescriptionList>
          <p>Synced with the bank every morning.</p>
        </CardBody>
      </Card>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const root = document.documentElement;
    const { shape, density } = root.dataset;
    const cards = [...canvasElement.querySelectorAll<HTMLElement>(':scope > div > .card')];
    const [footCard, headCard] = cards;
    const caseCard = (name: string): HTMLElement => {
      const card = cards.find((each) => each.dataset.case === name);
      if (!card) throw new Error(`No ${name} card`);
      return card;
    };
    if (!footCard || !headCard) throw new Error('No cards');
    const lastRow = (card: Element): Element => {
      const row = card.querySelector('.description-list-item:last-child');
      if (!row) throw new Error('No last row');
      return row;
    };
    const firstRow = headCard.querySelector('.description-list-item:first-child');
    if (!firstRow) throw new Error('No first row');
    const button = (row: Element): DOMRect => part(row, 'button').getBoundingClientRect();
    const padding = (row: Element, side: 'Top' | 'Bottom'): number =>
      parseFloat(getComputedStyle(row)[`padding${side}`]);
    /** How much more padding the row has at `side` than at the other side. */
    const grown = (row: Element, side: 'Top' | 'Bottom'): number =>
      padding(row, side) - padding(row, side === 'Top' ? 'Bottom' : 'Top');
    try {
      for (const [nextShape, nextDensity] of [
        ['rounded', 'comfortable'],
        ['rounded', 'compact'],
        ['soft', 'comfortable'],
        ['square', 'comfortable'],
      ] as const) {
        root.dataset.shape = nextShape;
        root.dataset.density = nextDensity;
        // The rows hold terms beside values at this width, so Edit ends the row's first line; stacked holds.
        await waitFor(() => expect(areas(lastRow(footCard))).toBe('"term value actions"'), { timeout: 5000 });
        await waitFor(() => expect(areas(lastRow(caseCard('collapsible')))).toBe('"term value actions"'), {
          timeout: 5000,
        });
        await expect(areas(lastRow(caseCard('stacked')))).toBe('"term actions" "value value"');
        const inset = lengthIn(footCard, 'var(--holder-corner-inset)');
        const extra = inset - lengthIn(footCard, 'var(--holder-pad)');
        if (nextShape === 'rounded') {
          await expect(extra).toBeGreaterThan(0);
          for (const card of [footCard, caseCard('direct'), caseCard('collapsible')]) {
            await expect(
              card.getBoundingClientRect().bottom - button(lastRow(card)).bottom,
            ).toBeGreaterThanOrEqual(inset - 1);
          }
          await expect(button(firstRow).top - headCard.getBoundingClientRect().top).toBeGreaterThanOrEqual(
            inset - 1,
          );
        } else {
          await expect(extra).toBe(0);
        }
        // The row grows by the inset less the padding, and only on the side at the card's edge.
        for (const card of [footCard, caseCard('direct'), caseCard('collapsible')]) {
          await expect(Math.abs(grown(lastRow(card), 'Bottom') - extra)).toBeLessThan(1);
        }
        await expect(Math.abs(grown(firstRow, 'Top') - extra)).toBeLessThan(1);
        // Stacked, or not at the card's foot, the last row keeps the Dense data padding.
        for (const name of ['stacked', 'followed']) {
          await expect(Math.abs(grown(lastRow(caseCard(name)), 'Bottom'))).toBeLessThan(1);
        }
      }
    } finally {
      root.dataset.shape = shape ?? 'rounded';
      root.dataset.density = density ?? 'comfortable';
    }
  },
};
