import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactElement } from 'react';
import { expect, waitFor } from 'storybook/test';
import { Badge } from '../badge';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardNote, CardTitle } from '../card';
import { Kbd } from '../kbd';
import { Link } from '../link';
import { PageColumn, PageHeader } from '../page-header';
import { focusOn } from '../stories/focus';
import { pressRealKeys } from '../stories/keys';
import { ELEMENTS, modelOutput, ownContent, PICTURE, Rendered } from '../stories/prose';
import { PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { Eyebrow, Heading, Text } from '../typography';
import { COACHING_NOTE, GOALS_GUIDE_FA, MONTHLY_REPORT, NESTED } from './fixtures';
import { Prose, ProseScroll, type ProseProps } from './Prose';

const meta = {
  title: 'Components/Prose',
  component: Prose,
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
} satisfies Meta<ProseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

const rect = (element: Element): DOMRect => element.getBoundingClientRect();

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** The six-column table of the monthly report, in its named scrolling region. */
const WIDE_TABLE: ReactElement = (
  <ProseScroll aria-label="Spending by category, September and October, table">
    <table>
      <thead>
        <tr>
          <th scope="col">Category</th>
          {['September', 'October', 'Change', 'Share', 'Budget'].map((name) => (
            <th key={name} scope="col" style={{ textAlign: 'right' }}>
              {name}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {[
          ['Rent', '$1,450.00', '$1,450.00', '$0.00', '44%', '$1,450.00'],
          ['Groceries', '$588.15', '$612.40', '+$24.25', '19%', '$650.00'],
          ['Eating out', '$431.00', '$286.90', '-$144.10', '9%', '$300.00'],
          ['Transport', '$214.60', '$198.30', '-$16.30', '6%', '$250.00'],
          ['Utilities', '$176.20', '$181.75', '+$5.55', '6%', '$200.00'],
        ].map(([category = '', ...figures]) => (
          <tr key={category}>
            <th scope="row">{category}</th>
            {figures.map((figure, index) => (
              <td key={index} style={{ textAlign: 'right' }}>
                {figure}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </ProseScroll>
);

/**
 * Every element Prose styles: headings by step (h1 at the section step, h2 at the card title's, h3 to h6 at the
 * subhead, the last two slate), a paragraph with a link, bold, italic, keys, inline code, a mark and a footnote
 * mark, lists three deep, a quote, a code block, a table in its region, a figure, a rule, a definition list and
 * footnotes.
 */
export const Default: Story = {
  render: () => <Prose as="article">{ELEMENTS}</Prose>,
};

/**
 * In a Card: the card's padding is the article's inset, an h2 starts it, and the code block at its foot takes
 * the card's concentric corner: 7px in Rounded, 19px compact, the micro step in Soft and 0 in Square.
 */
export const InCard: Story = {
  tags: ['density'],
  render: () => (
    <Card style={{ maxWidth: '40rem' }}>
      <Prose>
        <Rendered markdown={COACHING_NOTE} components={modelOutput('Your week, table')} />
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard */}
        <pre tabIndex={0}>
          <code>{'Travel fund: $1,240.00 of $2,000.00'}</code>
        </pre>
      </Prose>
    </Card>
  ),
  play: async ({ canvasElement }) => {
    const pre = find(canvasElement, 'pre');
    const card = find(canvasElement, '.card');
    // The block is the card's last part, at its foot, and its corner is the card's less the edge and padding.
    const style = getComputedStyle(card);
    const expected = Math.max(
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--radius-micro')) || 0,
      parseFloat(style.borderTopLeftRadius) - parseFloat(style.borderTopWidth) - parseFloat(style.paddingTop),
    );
    await expect(Math.abs(parseFloat(getComputedStyle(pre).borderBottomLeftRadius) - expected)).toBeLessThan(
      1,
    );
  },
};

/**
 * An article page: a PageHeader and a PageColumn holding `Prose as="article"`. The text keeps its 70ch measure
 * from the column's start edge, under the title, while the table takes the column's width.
 */
export const InPageColumn: Story = {
  parameters: { layout: 'fullscreen' },
  render: () => (
    <>
      <PageHeader eyebrow="Reports" title="October" description="Your month, written for you." />
      <PageColumn>
        <Prose as="article">
          <Rendered markdown={MONTHLY_REPORT} components={modelOutput('Spending by category, table')} />
        </Prose>
      </PageColumn>
    </>
  ),
  play: async ({ canvasElement }) => {
    const title = find(canvasElement, '.page-header-title');
    const paragraph = find(canvasElement, '.prose p');
    await expect(Math.abs(rect(paragraph).left - rect(title).left)).toBeLessThan(1);
  },
};

/** Lists, quotes, code and a table nested four levels deep, each level by the same rules. */
export const Nested: Story = {
  render: () => (
    <Prose>
      <Rendered markdown={NESTED} components={modelOutput('Weeks of October, table')} />
    </Prose>
  ),
};

/** A long line scrolls inside its code block, which takes focus; inline code beside it stays in the line. */
export const CodeBlocks: Story = {
  render: () => (
    <Prose style={{ maxWidth: '40rem' }}>
      <p>
        Export your budgets with <code>snapshot export --budgets</code>, then read the file:
      </p>
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard */}
      <pre tabIndex={0}>
        <code>
          {'const budgets = await readBudgets({ from: "2026-01-01", to: "2026-12-31", categories: ["groceries", "eating out", "transport", "utilities"] });\n' +
            'for (const budget of budgets) {\n' +
            '\tconsole.log(budget.name, budget.limit);\n' +
            '}'}
        </code>
      </pre>
      <p>Each line keeps its indent, two columns to a tab.</p>
    </Prose>
  ),
};

/** Six columns of figures in a ProseScroll, which scrolls inside the article on a phone. */
export const WideTable: Story = {
  render: () => (
    <Prose>
      <h2>October by category</h2>
      <p>Each category against September and its budget.</p>
      {WIDE_TABLE}
      <p>Refunds are counted in the month they arrive.</p>
    </Prose>
  ),
};

/** A figure with its caption, an image inline, and a rule. */
export const Figures: Story = {
  render: () => (
    <Prose style={{ maxWidth: '40rem' }}>
      <h2>Where it went</h2>
      <figure>
        <img src={PICTURE} alt="Spending by category in October, rent first" width={640} height={280} />
        <figcaption>Spending by category in October.</figcaption>
      </figure>
      <hr />
      <p>
        The chart is drawn from the same figures as the table, and the picture{' '}
        <img src={PICTURE} alt="" width={48} height={21} /> sits in its line as text does.
      </p>
    </Prose>
  ),
};

/**
 * Model output as the consumer renders it on the server: react-markdown with `skipHtml`, its links and images
 * turned into `prose-unlinked` and `prose-image` spans, the table in a ProseScroll. The link reads as the text
 * around it, the bare address breaks anywhere, the image with alt text shows it in a small slate box, the one
 * with none is not drawn, and the HTML the model wrote is gone.
 */
export const ModelOutput: Story = {
  render: () => (
    <Prose as="article">
      <Rendered markdown={MONTHLY_REPORT} components={modelOutput('Spending by category, table')} />
    </Prose>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelectorAll('a, img')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('.prose-unlinked')).toHaveLength(2);
    const [image, empty] = [...canvasElement.querySelectorAll<HTMLElement>('.prose-image')];
    await expect(image).toHaveTextContent('Spending by category in October, rent first');
    await expect(empty && getComputedStyle(empty).display).toBe('none');
    const unlinked = find(canvasElement, '.prose-unlinked');
    const paragraph = unlinked.closest('p');
    if (!paragraph) throw new Error('The link sits in a paragraph');
    await expect(getComputedStyle(unlinked).color).toBe(getComputedStyle(paragraph).color);
    await expect(getComputedStyle(unlinked).textDecorationLine).toBe('none');
  },
};

/** Library components inside an article: a Badge in the text, and a Card and a Button under not-prose. */
export const WithComponents: Story = {
  render: () => (
    <Prose as="article" style={{ maxWidth: '40rem' }}>
      <h2>
        Your week <Badge tone="info">New</Badge>
      </h2>
      <p>The groceries budget held for the third week running.</p>
      <div className="not-prose">
        <Card>
          <CardHeader>
            <CardTitle level={3}>Travel fund</CardTitle>
            <CardNote>$1,240.00 of $2,000.00</CardNote>
          </CardHeader>
          <CardBody>
            <Text>Move $20.00 on payday to stay on track.</Text>
          </CardBody>
        </Card>
      </div>
      <p className="not-prose">
        <Button variant="secondary">Open the budget</Button>
      </p>
      <p>Each looks as it does outside the article.</p>
    </Prose>
  ),
};

/** The parts the twin story compares, each in a plain block, so the prose box's spacing between blocks is not
 * what differs. */
function Twins({ testId }: { testId: string }): ReactElement {
  const id = (name: string): string => `${testId}-${name}`;
  return (
    <>
      <div>
        <Heading level={2} size={2} data-testid={id('heading')}>
          Settings
        </Heading>
      </div>
      <div>
        <Text data-testid={id('text')}>A sentence of body copy.</Text>
      </div>
      <div>
        <Text size="small" tone="muted" data-testid={id('small')}>
          A small, muted line.
        </Text>
      </div>
      <div>
        <Eyebrow data-testid={id('eyebrow')}>Workspace</Eyebrow>
      </div>
      <div>
        <Link href="#budgets" data-testid={id('link')}>
          Budgets
        </Link>
      </div>
      <div>
        <Kbd data-testid={id('kbd')}>Esc</Kbd>
      </div>
      <div>
        <Badge tone="info" data-testid={id('badge')}>
          Beta
        </Badge>
      </div>
      <div>
        <Button data-testid={id('button')}>Save</Button>
      </div>
      <div>
        <Card data-testid={id('card')}>
          <CardHeader>
            <CardTitle level={3} data-testid={id('card-title')}>
              Travel fund
            </CardTitle>
            <CardNote data-testid={id('card-note')}>$1,240.00 of $2,000.00</CardNote>
          </CardHeader>
          <CardBody>Saved monthly.</CardBody>
        </Card>
      </div>
    </>
  );
}

const TWINS = [
  'heading',
  'text',
  'small',
  'eyebrow',
  'link',
  'kbd',
  'badge',
  'button',
  'card',
  'card-title',
  'card-note',
] as const;

const COMPARED = [
  'font-family',
  'font-size',
  'line-height',
  'font-weight',
  'font-style',
  'letter-spacing',
  'color',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'padding-top',
  'padding-left',
  'border-top-left-radius',
  'border-bottom-right-radius',
  'text-decoration-line',
] as const;

/**
 * Prose never reaches a component: each part inside the prose box computes the same type, color, spacing and
 * corner as its twin outside it, with no not-prose.
 */
export const ComponentsUnchanged: Story = {
  tags: ['no-visual'],
  render: () => (
    <div style={{ display: 'grid', gap: 24, gridTemplateColumns: '1fr 1fr' }}>
      <Prose data-testid="inside">
        <Twins testId="inside" />
      </Prose>
      <div>
        <Twins testId="outside" />
      </div>
    </div>
  ),
  play: async ({ canvas }) => {
    for (const name of TWINS) {
      const inside = getComputedStyle(canvas.getByTestId(`inside-${name}`));
      const outside = getComputedStyle(canvas.getByTestId(`outside-${name}`));
      for (const property of COMPARED) {
        await expect(`${name} ${property}: ${inside.getPropertyValue(property)}`).toBe(
          `${name} ${property}: ${outside.getPropertyValue(property)}`,
        );
      }
    }
  },
};

/**
 * At 375px the six-column table scrolls inside its region, which is named and takes focus, and ArrowRight
 * scrolls it, while the page does not scroll sideways. Run in three engines: only Chromium makes a scrolling
 * box focusable by itself.
 */
export const WideTableScrolls: Story = {
  tags: ['no-visual', 'viewport-phone', 'webkit', 'firefox'],
  globals: PHONE,
  render: () => (
    // In a flex row, as an app's column often is: the region adds no width of its own, so the item keeps its
    // basis and the table scrolls inside it.
    <div style={{ display: 'flex' }}>
      <Prose style={{ flex: '1 1 20rem' }}>
        <p>Each category against September and its budget.</p>
        {WIDE_TABLE}
      </Prose>
    </div>
  ),
  play: async ({ canvas, canvasElement }) => {
    const region = canvas.getByRole('region', { name: 'Spending by category, September and October, table' });
    await waitFor(() => expect(window.innerWidth).toBeLessThanOrEqual(375));
    await waitFor(() => expect(region.scrollWidth).toBeGreaterThan(region.clientWidth + 40));
    const root = document.documentElement;
    await expect(root.scrollWidth).toBeLessThanOrEqual(root.clientWidth);
    // The table keeps its rows and columns.
    await expect(getComputedStyle(find(canvasElement, 'table')).display).toBe('table');
    await expect(region).toHaveAttribute('tabindex', '0');
    await focusOn(region);
    try {
      // The browser scrolls a focused box by its own default action, which only a real key starts.
      if (await pressRealKeys('{ArrowRight}{ArrowRight}{ArrowRight}')) {
        await waitFor(() => expect(Math.abs(region.scrollLeft)).toBeGreaterThan(0), { timeout: 5000 });
      }
    } finally {
      region.scrollLeft = 0;
    }
  },
};

/**
 * The goals guide in Persian draws in Vazirmatn from the static folder, with no network, and its headings
 * take no tracking. Run in three engines, since each loads and matches a face its own way.
 */
export const VazirmatnLoaded: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div dir="rtl" lang="fa" data-font="vazirmatn" style={{ maxWidth: '40rem' }}>
      <Prose as="article">
        <Rendered markdown={GOALS_GUIDE_FA} components={ownContent('پس‌انداز هر ماه، جدول')} />
      </Prose>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await document.fonts.ready;
    const faces = await document.fonts.load('500 16px Vazirmatn', 'هدف');
    await expect(faces.length).toBeGreaterThan(0);
    for (const face of faces) await expect(face.status).toBe('loaded');
    await expect(document.fonts.check('16px Vazirmatn', 'هدف')).toBe(true);
    const heading = find(canvasElement, 'h2');
    await expect(getComputedStyle(heading).fontFamily).toMatch(/^"?Vazirmatn/);
    await expect(getComputedStyle(heading).letterSpacing).toBe('normal');
  },
};
