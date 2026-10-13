import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { StatTile, type StatTileChange } from './StatTile';

const UP: StatTileChange = { direction: 'up', label: 'Up 12% from last month' };

/** The `d` of every path in the change line's arrow. */
const arrowPaths = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.stat-tile-arrow svg path')].map((path) => path.getAttribute('d') ?? '');

describe('StatTile', () => {
  let warn: MockInstance<typeof console.warn>;
  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });
  afterEach(() => {
    warn.mockRestore();
  });

  it('renders the label and the value, and only the slots it is given', () => {
    const { container, rerender } = render(<StatTile label="Spending" value="$1,284.50" />);
    const body = container.querySelector('.stat-tile > .stat-tile-body');
    if (!body) throw new Error('No body');
    expect([...body.children].map((child) => child.className)).toEqual([
      'stat-tile-label',
      'copy copy-numeral-sm stat-tile-value',
    ]);
    expect(body.querySelector('.stat-tile-label')).toHaveTextContent('Spending');
    expect(body.querySelector('.stat-tile-value')).toHaveTextContent('$1,284.50');

    // Every slot, in DOM order: the trend after the value, so a named trend is read after it.
    rerender(
      <StatTile
        label="Spending"
        value="$1,284.50"
        change={UP}
        caption="Across all accounts"
        trend={<svg aria-hidden="true" />}
      />,
    );
    expect([...body.children].map((child) => child.className)).toEqual([
      'stat-tile-label',
      'copy copy-numeral-sm stat-tile-value',
      'stat-tile-trend',
      'stat-tile-change',
      'stat-tile-caption',
    ]);
    expect(body.querySelector('.stat-tile-caption')).toHaveTextContent('Across all accounts');
    expect(body.querySelector('.stat-tile-trend > svg')).not.toBeNull();
  });

  it('draws the value as a small numeral', () => {
    const { container } = render(<StatTile label="Spending" value="$1,284.50" />);
    const value = container.querySelector('.stat-tile-value');
    expect(value?.tagName).toBe('P');
    expect(value).toHaveAttribute('class', 'copy copy-numeral-sm stat-tile-value');
  });

  it('renders the label as a p, or as a heading at level', () => {
    const { container, rerender } = render(<StatTile label="Spending" value="$1,284.50" />);
    expect(container.querySelector('.stat-tile-label')?.tagName).toBe('P');
    expect(screen.queryByRole('heading')).toBeNull();
    rerender(<StatTile label="Spending" value="$1,284.50" level={3} />);
    const heading = screen.getByRole('heading', { level: 3, name: 'Spending' });
    expect(heading).toHaveClass('stat-tile-label');
  });

  it('draws the change line with its arrow hidden, its direction and its tone, neutral by default', () => {
    const { container, rerender } = render(<StatTile label="Spending" value="$1,284.50" change={UP} />);
    const change = container.querySelector('.stat-tile-change');
    expect(change?.tagName).toBe('P');
    expect(change).toHaveAttribute('data-direction', 'up');
    expect(change).toHaveAttribute('data-tone', 'neutral');
    expect([...(change?.children ?? [])].map((child) => child.className)).toEqual([
      'stat-tile-arrow',
      'stat-tile-change-label',
    ]);
    expect(container.querySelector('.stat-tile-arrow')).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelector('.stat-tile-change-label')).toHaveTextContent('Up 12% from last month');

    for (const tone of ['gain', 'warning', 'neutral'] as const) {
      rerender(<StatTile label="Income" value="$5,000" change={{ ...UP, direction: 'down', tone }} />);
      expect(container.querySelector('.stat-tile-change')).toHaveAttribute('data-tone', tone);
      expect(container.querySelector('.stat-tile-change')).toHaveAttribute('data-direction', 'down');
    }
  });

  it('draws a dash for flat, an up arrow for up and a down arrow for down, and never mirrors them', () => {
    const { container, rerender } = render(<StatTile label="Spending" value="$1" change={UP} />);
    expect(arrowPaths(container)).toEqual(['M12 19V5', 'm5 12 7-7 7 7']);
    rerender(<StatTile label="Spending" value="$1" change={{ ...UP, direction: 'down' }} />);
    expect(arrowPaths(container)).toEqual(['M12 5v14', 'm19 12-7 7-7-7']);
    rerender(<StatTile label="Spending" value="$1" change={{ ...UP, direction: 'flat' }} />);
    expect(arrowPaths(container)).toEqual(['M5 12h14']);

    const arrow = container.querySelector('.stat-tile-arrow');
    const svg = arrow?.querySelector('svg');
    expect(arrow).toHaveAttribute('class', 'stat-tile-arrow');
    expect(arrow).not.toHaveAttribute('style');
    expect(svg).not.toHaveAttribute('class');
    expect(svg).not.toHaveAttribute('style');
    expect(svg).not.toHaveAttribute('transform');
    expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
    expect(svg).toHaveAttribute('focusable', 'false');
  });

  it('is a div with no React Aria attribute without href', () => {
    const { container } = render(
      <StatTile label="Spending" value="$1,284.50" change={UP} caption="Across all accounts" />,
    );
    const tile = root(container);
    expect(tile.tagName).toBe('DIV');
    expect(tile).toHaveAttribute('class', 'stat-tile');
    expect(screen.queryByRole('link')).toBeNull();
    expect(container.innerHTML).not.toMatch(/data-rac|data-hovered|data-focus-visible/);
  });

  it('is one link with href, named by its label, value, change and caption in order', () => {
    const { container } = render(
      <StatTile
        href="/spending"
        label="Spending"
        value="$1,284.50"
        change={UP}
        caption="Across all accounts"
        trend={<svg aria-hidden="true" />}
      />,
    );
    const link = screen.getByRole('link', {
      name: 'Spending $1,284.50 Up 12% from last month Across all accounts',
    });
    expect(screen.getAllByRole('link')).toHaveLength(1);
    expect(link).toBe(root(container));
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/spending');
    expect(link).toHaveAttribute('class', 'stat-tile');
    expect(link).not.toHaveAttribute('aria-describedby');
    expect(link.querySelector('.stat-tile-body')).not.toBeNull();
  });

  it('routes a press through RouterProvider', async () => {
    const user = userEvent.setup();
    const navigate = vi.fn();
    render(
      <library.RouterProvider navigate={navigate}>
        <StatTile href="/spending" label="Spending" value="$1,284.50" />
      </library.RouterProvider>,
    );
    await user.click(screen.getByRole('link'));
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0]?.[0]).toBe('/spending');
  });

  it('warns once when a linked tile holds a focusable element, and not otherwise', () => {
    const { rerender, unmount } = render(
      <StrictMode>
        <StatTile
          href="/spending"
          label="Spending"
          value="$1"
          caption={<button type="button">Hide</button>}
        />
      </StrictMode>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      'StatTile with href holds a focusable element; a link cannot hold a link or a button. Move it out of the tile.',
    );
    rerender(
      <StrictMode>
        <StatTile
          href="/spending"
          label="Spending"
          value="$2"
          caption={<button type="button">Hide</button>}
        />
      </StrictMode>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    unmount();

    warn.mockClear();
    render(<StatTile label="Spending" value="$1" caption={<button type="button">Hide</button>} />);
    render(
      <StatTile href="/spending" label="Spending" value="$1" change={UP} caption="Across all accounts" />,
    );
    render(
      <StatTile href="/spending" label="Spending" value="$1" trend={<span tabIndex={-1}>chart</span>} />,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it('treats a trend or a caption of false, null or an empty string as absent', () => {
    for (const empty of [false, null, '']) {
      const { container, unmount } = render(
        <StatTile label="Spending" value="$1" trend={empty} caption={empty} />,
      );
      expect(container.querySelector('.stat-tile-trend')).toBeNull();
      expect(container.querySelector('.stat-tile-caption')).toBeNull();
      unmount();
    }
  });

  it('passes className, ref and attributes to the root, linked or not', () => {
    const plainRef = createRef<HTMLElement>();
    const plain = render(
      <StatTile
        label="Spending"
        value="$1"
        ref={plainRef}
        className="extra"
        id="spending"
        data-testid="tile"
      />,
    );
    const div = root(plain.container);
    expect(plainRef.current).toBe(div);
    expect(div).toHaveAttribute('class', 'stat-tile extra');
    expect(div).toHaveAttribute('id', 'spending');
    expect(div).toHaveAttribute('data-testid', 'tile');
    plain.unmount();

    const linkRef = createRef<HTMLElement>();
    const linked = render(
      <StatTile
        href="/spending"
        label="Spending"
        value="$1"
        ref={linkRef}
        className="extra"
        id="spending"
        data-testid="tile"
      />,
    );
    const anchor = root(linked.container);
    expect(anchor.tagName).toBe('A');
    expect(linkRef.current).toBe(anchor);
    expect(anchor).toHaveAttribute('class', 'stat-tile extra');
    expect(anchor).toHaveAttribute('id', 'spending');
    expect(anchor).toHaveAttribute('data-testid', 'tile');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('StatTile');
  });

  it('has no axe violations plain, linked, with a heading level and with every tone', async () => {
    const { container } = render(
      <div>
        <StatTile label="Spending" value="$1,284.50" change={UP} caption="Across all accounts" />
        <StatTile
          href="/spending"
          label="Spending"
          value="$1,284.50"
          change={UP}
          caption="Across all accounts"
          trend={<svg aria-hidden="true" />}
        />
        <StatTile label="Balance" value="$9,000" level={2} />
        <StatTile
          label="Income"
          value="$5,000"
          change={{ direction: 'up', label: 'Up $420 from last month', tone: 'gain' }}
        />
        <StatTile
          label="Savings"
          value="$12,000"
          change={{ direction: 'flat', label: 'No change in 3 weeks', tone: 'warning' }}
        />
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
