import { render, screen } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Card, CardBody, CardHeader, CardNote, CardTitle } from './Card';

interface PartProps {
  className?: string;
  ref?: (node: HTMLElement | null) => void;
  'data-testid'?: string;
}

/** Every part, with the element it renders and the class it always carries. */
const parts: [name: string, tag: string, baseClass: string, part: (props: PartProps) => ReactElement][] = [
  ['Card', 'DIV', 'card', (props) => <Card {...props}>Text</Card>],
  ['CardHeader', 'DIV', 'card-header', (props) => <CardHeader {...props}>Text</CardHeader>],
  ['CardTitle', 'H2', 'card-title', (props) => <CardTitle {...props}>Text</CardTitle>],
  ['CardNote', 'P', 'card-note', (props) => <CardNote {...props}>Text</CardNote>],
  ['CardBody', 'DIV', 'card-body', (props) => <CardBody {...props}>Text</CardBody>],
];

describe.each(parts)('%s', (_name, tag, baseClass, part) => {
  it(`renders a ${tag.toLowerCase()} with the ${baseClass} class and nothing else`, () => {
    render(part({ 'data-testid': 'part' }));
    const element = screen.getByTestId('part');
    expect(element.tagName).toBe(tag);
    expect(element).toHaveAttribute('class', baseClass);
    expect(element).toHaveTextContent('Text');
  });

  it('merges a className after its own class', () => {
    render(part({ 'data-testid': 'part', className: 'extra' }));
    expect(screen.getByTestId('part')).toHaveAttribute('class', `${baseClass} extra`);
  });

  it('forwards a ref to its element', () => {
    let received: HTMLElement | null = null;
    render(
      part({
        'data-testid': 'part',
        ref: (node) => {
          received = node;
        },
      }),
    );
    expect(received).toBe(screen.getByTestId('part'));
  });
});

describe('Card', () => {
  it.each(['div', 'section', 'article'] as const)('as renders a %s element', (as) => {
    render(
      <Card as={as} data-testid="card">
        Text
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card.tagName).toBe(as.toUpperCase());
    expect(card).toHaveClass('card');
    // as chooses the element and is not an attribute.
    expect(card).not.toHaveAttribute('as');
  });

  it('passes other HTML attributes through, data-theme included', () => {
    render(
      <Card id="notifications" data-theme="light" style={{ width: 320 }} data-testid="card">
        Text
      </Card>,
    );
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'notifications');
    expect(card).toHaveAttribute('data-theme', 'light');
    expect(card).toHaveStyle({ width: '320px' });
  });

  it('is a region when it is a section named by its title', () => {
    render(
      <Card as="section" aria-labelledby="notifications-title">
        <CardHeader>
          <CardTitle id="notifications-title">Notifications</CardTitle>
        </CardHeader>
      </Card>,
    );
    expect(screen.getByRole('region', { name: 'Notifications' })).toHaveClass('card');
  });

  it('is not a region when it is an article, or a section without a name', () => {
    render(
      <>
        <Card as="article" aria-label="Notifications" data-testid="article">
          Text
        </Card>
        <Card as="section" data-testid="section">
          Text
        </Card>
      </>,
    );
    // An article is not a landmark, named or not, and an unnamed section is not announced.
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: 'Notifications' })).toHaveClass('card');
    expect(screen.getByTestId('section')).toHaveClass('card');
  });

  it('nests: a card inside a card is another card with its own parts', () => {
    render(
      <Card data-testid="outer">
        <CardHeader>
          <CardTitle>Workspace</CardTitle>
        </CardHeader>
        <CardBody>
          <Card data-testid="inner">
            <CardHeader>
              <CardTitle level={3}>Danger zone</CardTitle>
            </CardHeader>
            <CardBody>Delete this workspace.</CardBody>
          </Card>
        </CardBody>
      </Card>,
    );
    const outer = screen.getByTestId('outer');
    const inner = screen.getByTestId('inner');
    expect(outer).toContainElement(inner);
    expect(inner).toHaveAttribute('class', 'card');
    // The corner step is the stylesheet's `.card > .card, .card-body .card`, so the markup is the same at every depth.
    expect(outer.querySelectorAll('.card')).toHaveLength(1);
    expect(inner.querySelectorAll('.card-header, .card-title, .card-body')).toHaveLength(3);
    expect(screen.getByRole('heading', { level: 2, name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Danger zone' })).toBeInTheDocument();
  });

  it('stays a server component: no use client directive and no React Aria import', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Card.tsx'), 'utf8');
    expect(source).not.toMatch(/use client/);
    expect(source).not.toMatch(/react-aria-components/);
  });
});

describe('CardHeader', () => {
  it('adds no banner landmark, however many cards sit at page level', async () => {
    // A <header> outside sectioning content is the page's banner, so two cards that each used one
    // would fail axe's landmark-no-duplicate-banner. A card is a div by default, so its header is a div.
    const { container } = render(
      <>
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
          </CardHeader>
        </Card>
      </>,
    );
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});

describe('CardTitle', () => {
  it('is a level 2 heading by default', () => {
    render(<CardTitle>Notifications</CardTitle>);
    expect(screen.getByRole('heading', { level: 2, name: 'Notifications' })).toHaveClass('card-title');
  });

  it.each([1, 2, 3, 4] as const)('level %i renders the matching heading element', (level) => {
    render(<CardTitle level={level}>Notifications</CardTitle>);
    const heading = screen.getByRole('heading', { level });
    expect(heading.tagName).toBe(`H${level}`);
    // The element changes with the level; the look does not.
    expect(heading).toHaveAttribute('class', 'card-title');
    expect(heading).not.toHaveAttribute('level');
  });
});

describe('a composed card', () => {
  it('has no axe violations as a section, an article or nested', async () => {
    const { container } = render(
      <>
        <Card as="section" aria-labelledby="one">
          <CardHeader>
            <CardTitle id="one">Notifications</CardTitle>
            <CardNote>Where we reach you, and how often.</CardNote>
          </CardHeader>
          <CardBody>
            <p>Product updates</p>
            <Card as="article" aria-labelledby="two">
              <CardHeader>
                <CardTitle id="two" level={3}>
                  Digest
                </CardTitle>
              </CardHeader>
              <CardBody>Every Tuesday morning.</CardBody>
            </Card>
          </CardBody>
        </Card>
        <Card>Just content</Card>
      </>,
    );
    await expectNoA11yViolations(container);
  });
});
