'use client';

/*
 * What the Prose stories and tests render: every element Prose styles, and react-markdown with the map an app
 * gives it for model output. It is story and test code only and never ships: the build starts from
 * src/index.ts, which never imports this folder, tsconfig.build.json leaves it out, and the 'use client' guard
 * skips it. It carries the directive because the server components test scans every .tsx under src that is not
 * a test or a story; it holds no state.
 */
import type { ReactElement } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ProseScroll } from '../prose';

/**
 * A picture with no request: a small chart drawn as an svg data address, so a story and its baseline need no
 * network. Its colors are the picture's own, as a photo's are.
 */
export const PICTURE: string =
  'data:image/svg+xml,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="280" viewBox="0 0 640 280">' +
      '<rect width="640" height="280" fill="#ebe7e1"/>' +
      '<rect x="48" y="40" width="440" height="36" fill="#141413"/>' +
      '<rect x="48" y="96" width="300" height="36" fill="#141413"/>' +
      '<rect x="48" y="152" width="180" height="36" fill="#141413"/>' +
      '<rect x="48" y="208" width="120" height="36" fill="#696969"/>' +
      '</svg>',
  );

/**
 * The map an app gives react-markdown for model output (spec 8.10 and 8.11): a link becomes its text, an image
 * its alt text, a table scrolls in a named region, and a code block takes focus so it scrolls by keys.
 */
export const modelOutput = (tableLabel: string): Components => ({
  // A link within the page, such as a footnote's, stays a link; any other becomes its text.
  a: ({ children, ...link }) => {
    // react-markdown's tree node is not an attribute of the link.
    delete link.node;
    return link.href?.startsWith('#') ? (
      <a {...link}>{children}</a>
    ) : (
      <span className="prose-unlinked">{children}</span>
    );
  },
  img: ({ alt }) => <span className="prose-image">{alt}</span>,
  table: ({ children }) => (
    <ProseScroll aria-label={tableLabel}>
      <table>{children}</table>
    </ProseScroll>
  ),
  pre: ({ children }) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard
    <pre tabIndex={0}>{children}</pre>
  ),
});

/**
 * The map for an app's own content, such as the goals guide: its links stay links, and its table and code
 * blocks scroll as model output's do.
 */
export const ownContent = (tableLabel: string): Components => ({
  table: ({ children }) => (
    <ProseScroll aria-label={tableLabel}>
      <table>{children}</table>
    </ProseScroll>
  ),
  pre: ({ children }) => (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard
    <pre tabIndex={0}>{children}</pre>
  ),
});

/** Markdown rendered as the consumer's server component renders it: GitHub's tables and footnotes, no HTML. */
export function Rendered({
  markdown,
  components,
}: {
  markdown: string;
  components: Components;
}): ReactElement {
  return (
    <Markdown remarkPlugins={[remarkGfm]} skipHtml components={components}>
      {markdown}
    </Markdown>
  );
}

/** Every element Prose styles (spec 8.2), in the order an article might hold them. */
export const ELEMENTS: ReactElement = (
  <>
    <h1>A year of spending</h1>
    <p>
      The <strong>summary</strong> comes first, then the details. You spent <em>less</em> on eating out than
      in any month since March, and the <a href="#refunds">refunds</a> are listed below. Press <kbd>Ctrl</kbd>{' '}
      and <kbd>K</kbd> to search, and open <code>Settings &gt; Budgets</code> to change a limit. The total is{' '}
      <mark>$38,912.40</mark>, about 3% under plan.<sup>1</sup> Water is written H<sub>2</sub>O.
    </p>
    <h2>Where the money went</h2>
    <p>Rent and groceries were most of it, as they are every month.</p>
    <h3>The large categories</h3>
    <ul>
      <li>
        Rent, the same every month
        <ul>
          <li>
            paid on the first
            <ul>
              <li>by transfer</li>
            </ul>
          </li>
        </ul>
      </li>
      <li>Groceries, up a little in the winter</li>
    </ul>
    <h4>In order</h4>
    <ol>
      <li>
        Rent
        <ol>
          <li>
            The flat
            <ol>
              <li>The parking space</li>
            </ol>
          </li>
        </ol>
      </li>
      <li>Groceries</li>
      <li>Transport</li>
    </ol>
    <h5>A smaller heading</h5>
    <p>Each step below the fourth looks like it, and the last two are slate.</p>
    <h6>The smallest heading</h6>
    <blockquote>
      <p>Spend on what you value, and cut back hard on what you do not.</p>
    </blockquote>
    {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- a code block that scrolls must take focus to scroll by keyboard */}
    <pre tabIndex={0}>
      <code>{'const total = categories.reduce((sum, category) => sum + category.spent, 0);'}</code>
    </pre>
    <ProseScroll aria-label="Spending by quarter, table">
      <table>
        <caption>Spending by quarter</caption>
        <thead>
          <tr>
            <th scope="col">Quarter</th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Spent
            </th>
            <th scope="col" style={{ textAlign: 'right' }}>
              Budget
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">First</th>
            <td style={{ textAlign: 'right' }}>$9,812.40</td>
            <td style={{ textAlign: 'right' }}>$10,000.00</td>
          </tr>
          <tr>
            <th scope="row">Second</th>
            <td style={{ textAlign: 'right' }}>$9,430.10</td>
            <td style={{ textAlign: 'right' }}>$10,000.00</td>
          </tr>
        </tbody>
      </table>
    </ProseScroll>
    <figure>
      <img src={PICTURE} alt="Spending by category, rent first" width={640} height={280} />
      <figcaption>Spending by category for the year.</figcaption>
    </figure>
    <hr />
    <dl>
      <dt>Budget</dt>
      <dd>The most you plan to spend in a category in a month.</dd>
      <dt>Refund</dt>
      <dd>Money a merchant sent back, drawn below zero.</dd>
    </dl>
    <section className="footnotes" data-footnotes>
      <ol>
        <li id="note-1">Against the plan you set in January.</li>
      </ol>
    </section>
  </>
);
