import { render } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ReactElement } from 'react';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Skeleton } from './Skeleton';

describe('Skeleton', () => {
  it('is exported from the package index', () => {
    expect(library.Skeleton).toBe(Skeleton);
  });

  it('is an aria-hidden span with no text, a line by default', () => {
    const { container } = render(<Skeleton />);
    const skeleton = root(container);
    expect(skeleton.tagName).toBe('SPAN');
    expect(skeleton).toHaveAttribute('class', 'skeleton');
    expect(skeleton).toHaveAttribute('aria-hidden', 'true');
    expect(skeleton).toHaveAttribute('data-shape', 'line');
    expect(skeleton.textContent).toBe('');
    expect(skeleton.childNodes).toHaveLength(0);
    // Nothing to reach by Tab and nothing to read.
    expect(skeleton).not.toHaveAttribute('tabindex');
    expect(skeleton).not.toHaveAttribute('role');
  });

  it('marks its shape as data-shape line, block or circle', () => {
    for (const shape of ['line', 'block', 'circle'] as const) {
      const { container, unmount } = render(<Skeleton shape={shape} />);
      expect(root(container)).toHaveAttribute('data-shape', shape);
      unmount();
    }
  });

  it('writes width and height as inline sizes only when given, and no style attribute without them', () => {
    const { container, rerender } = render(<Skeleton />);
    expect(root(container)).not.toHaveAttribute('style');

    rerender(<Skeleton width="12rem" />);
    expect(root(container)).toHaveAttribute('style', 'inline-size: 12rem;');

    rerender(<Skeleton shape="block" height="6rem" />);
    expect(root(container)).toHaveAttribute('style', 'block-size: 6rem;');

    rerender(<Skeleton shape="block" width="60%" height="6rem" />);
    const style = (root(container) as HTMLElement).style;
    expect(style.inlineSize).toBe('60%');
    expect(style.blockSize).toBe('6rem');
    // Physical sizes are never written, so the stylesheet's logical ones stay in charge in either direction.
    expect(style.width).toBe('');
    expect(style.height).toBe('');
  });

  it('gives a circle one diameter for both sides, from width or else height, so it stays round', () => {
    const { container, rerender } = render(<Skeleton shape="circle" width="2rem" />);
    let style = (root(container) as HTMLElement).style;
    expect(style.inlineSize).toBe('2rem');
    expect(style.blockSize).toBe('2rem');
    rerender(<Skeleton shape="circle" height="3rem" />);
    style = (root(container) as HTMLElement).style;
    expect(style.inlineSize).toBe('3rem');
    expect(style.blockSize).toBe('3rem');
    rerender(<Skeleton shape="circle" width="2rem" height="5rem" />);
    style = (root(container) as HTMLElement).style;
    expect(style.blockSize).toBe('2rem');
  });

  it('passes className', () => {
    const { container } = render(<Skeleton shape="circle" className="extra" />);
    expect(root(container)).toHaveAttribute('class', 'skeleton extra');
  });

  it('stays a server component: no use client directive and no React Aria import', () => {
    const source = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'Skeleton.tsx'), 'utf8');
    expect(source).not.toMatch(/use client/);
    expect(source).not.toMatch(/react-aria-components/);
  });

  /** The holder says Loading once, in its own status; the skeleton beside it says nothing. */
  const loading = (skeleton: ReactElement): ReactElement => (
    <div aria-busy="true">
      <span role="status">Loading</span>
      {skeleton}
    </div>
  );

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['as a line beside a Loading status', () => loading(<Skeleton />)],
    ['as a block beside a Loading status', () => loading(<Skeleton shape="block" height="6rem" />)],
    ['as a circle beside a Loading status', () => loading(<Skeleton shape="circle" />)],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });

  it('takes only the three shapes in its types', () => {
    // @ts-expect-error a skeleton is a line, a block or a circle
    const square = <Skeleton shape="square" />;
    expect(square).toBeTruthy();
  });
});
