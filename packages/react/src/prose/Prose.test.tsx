import { render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { ELEMENTS, modelOutput, Rendered } from '../stories/prose';
import { MONTHLY_REPORT, NESTED } from './fixtures';
import { Prose, ProseScroll } from './Prose';

describe('Prose', () => {
  it('is exported from the package, with ProseScroll', () => {
    expect(library.Prose).toBe(Prose);
    expect(library.ProseScroll).toBe(ProseScroll);
  });

  it.each([['div'], ['article'], ['section']] as const)('renders %s with the prose class merged', (tag) => {
    const { container } = render(
      <Prose as={tag} className="report">
        <p>October.</p>
      </Prose>,
    );
    const element = root(container);
    expect(element.tagName).toBe(tag.toUpperCase());
    expect(element.className).toBe('prose report');
    expect(element.innerHTML).toBe('<p>October.</p>');
  });

  it('renders a div by default, and adds no role, no element and no attribute of its own', () => {
    const { container } = render(<Prose>Text.</Prose>);
    expect(container.innerHTML).toBe('<div class="prose">Text.</div>');
  });

  it("passes attributes through, React's raw HTML attribute included", () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Prose
        as="article"
        ref={ref}
        id="report"
        lang="fa"
        dir="rtl"
        aria-labelledby="report-title"
        data-testid="report"
        // HTML an app sanitized itself, as the docs say to: Prose never parses or injects it.
        dangerouslySetInnerHTML={{ __html: '<h2 id="report-title">مهر</h2><p>متن.</p>' }}
      />,
    );
    const element = root(container);
    expect(ref.current).toBe(element);
    expect(element).toHaveAttribute('id', 'report');
    expect(element).toHaveAttribute('lang', 'fa');
    expect(element).toHaveAttribute('dir', 'rtl');
    expect(element).toHaveAttribute('data-testid', 'report');
    expect(element.innerHTML).toBe('<h2 id="report-title">مهر</h2><p>متن.</p>');
  });

  it('refuses another element in the types', () => {
    // @ts-expect-error A span is not a block that holds paragraphs.
    expect(() => render(<Prose as="span" />)).not.toThrow();
  });
});

describe('ProseScroll', () => {
  it('renders a named, focusable region with the class merged', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <ProseScroll ref={ref} aria-label="Spending by category, table" className="wide" id="table">
        <table>
          <tbody>
            <tr>
              <td>Rent</td>
            </tr>
          </tbody>
        </table>
      </ProseScroll>,
    );
    const region = screen.getByRole('region', { name: 'Spending by category, table' });
    expect(region.tagName).toBe('DIV');
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.className).toBe('prose-scroll wide');
    expect(region).toHaveAttribute('id', 'table');
    expect(ref.current).toBe(region);
    expect(region.querySelector('table')).not.toBeNull();
  });

  it('takes its name from another element', () => {
    render(
      <>
        <h2 id="caption">By category</h2>
        <ProseScroll aria-labelledby="caption">
          <table />
        </ProseScroll>
      </>,
    );
    expect(screen.getByRole('region', { name: 'By category' })).toHaveAttribute('tabindex', '0');
  });

  it('requires a name, and keeps its role and tab stop, in the types', () => {
    // @ts-expect-error A region that scrolls must be named.
    expect(() => render(<ProseScroll />)).not.toThrow();
    // @ts-expect-error The role is the part's own.
    expect(() => render(<ProseScroll aria-label="Table" role="group" />)).not.toThrow();
    // @ts-expect-error The tab stop is the part's own.
    expect(() => render(<ProseScroll aria-label="Table" tabIndex={-1} />)).not.toThrow();
  });
});

/** Each state axe checks, one test each. */
const AXE_CASES: [name: string, element: ReactElement][] = [
  ['every element', <Prose as="article">{ELEMENTS}</Prose>],
  [
    'a wide table in a ProseScroll',
    <Prose>
      <ProseScroll aria-label="Spending by category, table">
        <table>
          <thead>
            <tr>
              {['Category', 'September', 'October', 'Change', 'Share', 'Budget'].map((name) => (
                <th key={name} scope="col">
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {['Rent', '$1,450.00', '$1,450.00', '$0.00', '44%', '$1,450.00'].map((value, index) => (
                <td key={index}>{value}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </ProseScroll>
    </Prose>,
  ],
  [
    'the model output',
    <Prose as="article">
      <Rendered markdown={MONTHLY_REPORT} components={modelOutput('October by category, table')} />
    </Prose>,
  ],
  [
    'nested content',
    <Prose>
      <Rendered markdown={NESTED} components={modelOutput('Weeks, table')} />
    </Prose>,
  ],
];

describe('accessibility', () => {
  it.each(AXE_CASES)('has no axe violations: %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
