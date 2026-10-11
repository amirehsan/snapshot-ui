import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { Text } from './Text';

describe('Text', () => {
  it('is a paragraph in the body size and the default tone', () => {
    render(<Text>Changes apply to everyone.</Text>);
    const text = screen.getByText('Changes apply to everyone.');
    expect(text.tagName).toBe('P');
    expect(text).toHaveAttribute('class', 'copy');
  });

  it.each(['p', 'span', 'div'] as const)('renders a %s element with as="%s"', (as) => {
    render(<Text as={as}>Label</Text>);
    expect(screen.getByText('Label').tagName).toBe(as.toUpperCase());
  });

  it.each([
    ['body', 'default', 'copy'],
    ['small', 'default', 'copy copy-small'],
    ['body', 'muted', 'copy copy-muted'],
    ['small', 'muted', 'copy copy-small copy-muted'],
  ] as const)('size %s in tone %s renders class "%s"', (size, tone, expected) => {
    render(
      <Text size={size} tone={tone}>
        Label
      </Text>,
    );
    expect(screen.getByText('Label')).toHaveAttribute('class', expected);
  });

  it('merges a custom className after the library classes', () => {
    render(
      <Text size="small" className="extra">
        Label
      </Text>,
    );
    expect(screen.getByText('Label')).toHaveAttribute('class', 'copy copy-small extra');
  });

  it('forwards a ref to the element it renders', () => {
    const paragraph = createRef<HTMLParagraphElement>();
    const span = createRef<HTMLSpanElement>();
    render(
      <>
        <Text ref={paragraph}>Paragraph</Text>
        <Text as="span" ref={span}>
          Span
        </Text>
      </>,
    );
    expect(paragraph.current).toBeInstanceOf(HTMLParagraphElement);
    expect(span.current).toBeInstanceOf(HTMLSpanElement);
  });

  it('passes other attributes through', () => {
    render(
      <Text id="note" data-theme="dark" lang="fa" dir="rtl">
        Label
      </Text>,
    );
    const text = screen.getByText('Label');
    expect(text).toHaveAttribute('id', 'note');
    expect(text).toHaveAttribute('data-theme', 'dark');
    expect(text).toHaveAttribute('lang', 'fa');
    expect(text).toHaveAttribute('dir', 'rtl');
  });

  it('has no axe violations in any size and tone', async () => {
    const { container } = render(
      <div>
        <Text>Body</Text>
        <Text size="small">Small</Text>
        <Text tone="muted">Muted</Text>
        <Text as="span" size="small" tone="muted">
          Small and muted
        </Text>
      </div>,
    );
    await expectNoA11yViolations(container);
  });
});
