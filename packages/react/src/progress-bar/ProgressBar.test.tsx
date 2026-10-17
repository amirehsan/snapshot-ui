import { render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { describe, expect, it } from 'vitest';
import * as library from '../index';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { ProgressBar } from './ProgressBar';

/** The progress bar: the track, which carries the role. */
const bar = (): HTMLElement => screen.getByRole('progressbar');

/** The four value attributes the track carries while determinate, in a fixed order. */
const values = (element: Element): (string | null)[] =>
  ['aria-valuemin', 'aria-valuemax', 'aria-valuenow', 'aria-valuetext'].map((name) =>
    element.getAttribute(name),
  );

describe('ProgressBar', () => {
  it('puts the progressbar role on the track, with the label in the head', () => {
    const { container } = render(<ProgressBar label="Uploading invoice.pdf" value={45} />);
    const track = bar();
    expect(track).toHaveClass('progress-bar-track');
    expect(track.parentElement).toBe(root(container));
    expect(root(container)).toHaveClass('progress-bar');
    expect(root(container)).not.toHaveAttribute('role');

    // In DOM order: the head, then the track holding the fill.
    expect([...root(container).children].map((child) => child.className)).toEqual([
      'progress-bar-head',
      'progress-bar-track',
    ]);
    expect([...track.children].map((child) => [child.tagName, child.className])).toEqual([
      ['SPAN', 'progress-bar-fill'],
    ]);
    const head = container.querySelector('.progress-bar-head');
    expect([...(head?.children ?? [])].map((child) => [child.tagName, child.className])).toEqual([
      ['SPAN', 'progress-bar-label'],
      ['SPAN', 'progress-bar-value'],
    ]);
    expect(container.querySelector('.progress-bar-label')).toHaveTextContent('Uploading invoice.pdf');
    expect(screen.getByRole('progressbar', { name: 'Uploading invoice.pdf' })).toBe(track);
  });

  it('values the track while determinate: min, max, now clamped, and the value text', () => {
    const { rerender } = render(<ProgressBar label="Uploading" value={45} />);
    expect(values(bar())).toEqual(['0', '100', '45', '45%']);

    rerender(<ProgressBar label="Uploading" value={140} />);
    expect(values(bar())).toEqual(['0', '100', '100', '100%']);

    rerender(<ProgressBar label="Uploading" value={-5} />);
    expect(values(bar())).toEqual(['0', '100', '0', '0%']);

    rerender(<ProgressBar label="Uploading" minValue={10} maxValue={20} value={15} />);
    expect(values(bar())).toEqual(['10', '20', '15', '50%']);

    // No value at all is the start of the range.
    rerender(<ProgressBar label="Uploading" minValue={10} maxValue={20} />);
    expect(values(bar())).toEqual(['10', '20', '10', '0%']);
  });

  it('writes the default value text as an ASCII percentage, rounded to a whole number', () => {
    const { container, rerender } = render(<ProgressBar label="Uploading" value={33.333} />);
    expect(bar()).toHaveAttribute('aria-valuetext', '33%');
    expect(container.querySelector('.progress-bar-value')).toHaveTextContent('33%');

    rerender(<ProgressBar label="Uploading" value={66.5} />);
    expect(bar()).toHaveAttribute('aria-valuetext', '67%');

    // A Persian locale changes nothing: the default is never Intl, so the server and the browser agree.
    rerender(
      <I18nProvider locale="fa-IR">
        <ProgressBar label="در حال بارگذاری" value={33.333} />
      </I18nProvider>,
    );
    expect(bar()).toHaveAttribute('aria-valuetext', '33%');
    expect(container.querySelector('.progress-bar-value')).toHaveTextContent(/^33%$/);
  });

  it('takes valueLabel in the head and as aria-valuetext, hidden from the head itself', () => {
    const { container } = render(<ProgressBar label="Uploading" value={30} valueLabel="1.2 of 4 MB" />);
    const value = container.querySelector('.progress-bar-value');
    expect(value).toHaveTextContent('1.2 of 4 MB');
    expect(value).toHaveAttribute('aria-hidden', 'true');
    expect(bar()).toHaveAttribute('aria-valuetext', '1.2 of 4 MB');
    expect(bar()).toHaveAttribute('aria-valuenow', '30');
  });

  it('writes no value attributes while indeterminate, and describes the track by a valueLabel shown on purpose', () => {
    const { container, rerender } = render(
      <ProgressBar label="Reading receipt.jpg" isIndeterminate value={45} valueLabel="Page 2" />,
    );
    expect(values(bar())).toEqual([null, null, null, null]);
    expect(bar()).toHaveAttribute('data-indeterminate', '');
    // showValueLabel defaults to false while indeterminate.
    expect(container.querySelector('.progress-bar-value')).toBeNull();
    expect(bar()).not.toHaveAttribute('aria-describedby');

    rerender(
      <ProgressBar label="Reading receipt.jpg" isIndeterminate valueLabel="Page 2 of 4" showValueLabel />,
    );
    const value = container.querySelector('.progress-bar-value');
    expect(value).toHaveTextContent('Page 2 of 4');
    expect(value?.id).not.toBe('');
    expect(bar()).toHaveAttribute('aria-describedby', value?.id);
    expect(bar()).toHaveAccessibleDescription('Page 2 of 4');
    expect(values(bar())).toEqual([null, null, null, null]);

    // Determinate again: the attribute goes.
    rerender(<ProgressBar label="Reading receipt.jpg" value={45} />);
    expect(bar()).not.toHaveAttribute('data-indeterminate');
  });

  it('draws an empty track and reports minValue when maxValue is not above minValue', () => {
    const { rerender } = render(<ProgressBar label="Uploading" minValue={10} maxValue={10} value={10} />);
    expect(values(bar())).toEqual(['10', '10', '10', '0%']);
    expect(bar().style.getPropertyValue('--progress-bar-value')).toBe('0%');

    rerender(<ProgressBar label="Uploading" minValue={20} maxValue={10} value={15} />);
    // The maximum is never reported under the minimum.
    expect(values(bar())).toEqual(['20', '20', '20', '0%']);
    expect(bar().style.getPropertyValue('--progress-bar-value')).toBe('0%');
  });

  it('names the track in every branch: aria-labelledby, aria-label, the label, else the value text', () => {
    const { container, rerender } = render(<ProgressBar label="Uploading" value={45} />);
    const label = container.querySelector('.progress-bar-label');
    expect(label?.id).not.toBe('');
    expect(bar()).toHaveAttribute('aria-labelledby', label?.id);
    expect(bar()).not.toHaveAttribute('aria-label');

    rerender(<ProgressBar aria-label="Uploading invoice.pdf" value={45} />);
    expect(container.querySelector('.progress-bar-label')).toBeNull();
    expect(bar()).toHaveAttribute('aria-label', 'Uploading invoice.pdf');
    expect(bar()).not.toHaveAttribute('aria-labelledby');

    rerender(
      <>
        <h2 id="upload-heading">Invoices</h2>
        <ProgressBar label="Uploading" aria-label="Sending" aria-labelledby="upload-heading" value={45} />
      </>,
    );
    expect(screen.getByRole('progressbar', { name: 'Invoices' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-label');

    // A blank aria-labelledby or aria-label falls through to the next name.
    rerender(<ProgressBar label="Uploading" aria-label=" " aria-labelledby="" value={45} />);
    expect(screen.getByRole('progressbar', { name: 'Uploading' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-label');

    // A label of only spaces names nothing; with nothing else the value text names the bar.
    rerender(<ProgressBar label="  " aria-label="" value={45} showValueLabel={false} />);
    expect(screen.getByRole('progressbar', { name: '45%' })).toBe(bar());
    expect(container.querySelector('.progress-bar-label')).toBeNull();
  });

  it('names an indeterminate bar that nothing else names "Loading", as Spinner does', () => {
    // The types ask for a name, but a blank label passes them and names nothing; indeterminate, there is no
    // value text to fall back on.
    const { container, rerender } = render(<ProgressBar label="" isIndeterminate />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-labelledby');
    expect(container.querySelector('.progress-bar-head')).toBeNull();

    rerender(<ProgressBar label="  " aria-label=" " aria-labelledby="" isIndeterminate valueLabel="" />);
    expect(screen.getByRole('progressbar', { name: 'Loading' })).toBe(bar());
    expect(container.querySelector('.progress-bar-head')).toBeNull();
    expect(values(bar())).toEqual([null, null, null, null]);

    // A valueLabel that names something is drawn and names the bar before the fallback does.
    rerender(<ProgressBar label="" isIndeterminate valueLabel="Page 2 of 4" />);
    expect(screen.getByRole('progressbar', { name: 'Page 2 of 4' })).toBe(bar());
    expect(bar()).not.toHaveAttribute('aria-label');

    // Any name of the caller's wins over it.
    rerender(<ProgressBar label="" aria-label="Reading receipt.jpg" isIndeterminate />);
    expect(screen.getByRole('progressbar', { name: 'Reading receipt.jpg' })).toBe(bar());
  });

  it('treats a blank valueLabel as absent: the percentage while determinate, nothing while indeterminate', () => {
    const { container, rerender } = render(<ProgressBar label="Uploading" value={45} valueLabel="" />);
    expect(bar()).toHaveAttribute('aria-valuetext', '45%');
    expect(container.querySelector('.progress-bar-value')).toHaveTextContent(/^45%$/);

    rerender(<ProgressBar label="Uploading" value={45} valueLabel="  " />);
    expect(bar()).toHaveAttribute('aria-valuetext', '45%');

    // Unnamed, the percentage names the bar, never an empty span.
    rerender(<ProgressBar label="" value={45} valueLabel="" showValueLabel={false} />);
    expect(screen.getByRole('progressbar', { name: '45%' })).toBe(bar());

    // Indeterminate, shown on purpose: nothing to show, so no empty value and no description.
    rerender(<ProgressBar label="Reading" isIndeterminate valueLabel="" showValueLabel />);
    expect(container.querySelector('.progress-bar-value')).toBeNull();
    expect(bar()).not.toHaveAttribute('aria-describedby');
    expect(screen.getByRole('progressbar', { name: 'Reading' })).toBe(bar());
  });

  it('draws no head with an aria-label and showValueLabel false', () => {
    const { container } = render(
      <ProgressBar aria-label="Uploading invoice.pdf" value={60} showValueLabel={false} />,
    );
    expect(container.querySelector('.progress-bar-head')).toBeNull();
    expect([...root(container).children].map((child) => child.className)).toEqual(['progress-bar-track']);
    expect(bar()).toHaveAttribute('aria-valuetext', '60%');
  });

  it('sets --progress-bar-value on the track only while determinate', () => {
    const { rerender } = render(<ProgressBar label="Uploading" value={45} />);
    expect(bar().style.getPropertyValue('--progress-bar-value')).toBe('45%');

    // A share with at most three decimals.
    rerender(<ProgressBar label="Uploading" maxValue={3} value={1} />);
    expect(bar().style.getPropertyValue('--progress-bar-value')).toBe('33.333%');

    rerender(<ProgressBar label="Uploading" value={140} />);
    expect(bar().style.getPropertyValue('--progress-bar-value')).toBe('100%');

    // Turning indeterminate takes the property away.
    rerender(<ProgressBar label="Reading" isIndeterminate value={45} />);
    expect(bar().style.getPropertyValue('--progress-bar-value')).toBe('');
  });

  it('writes no style at all while indeterminate', () => {
    render(<ProgressBar label="Reading" isIndeterminate value={45} />);
    expect(bar()).not.toHaveAttribute('style');
  });

  it('is never a live region', () => {
    const { container } = render(
      <div>
        <ProgressBar label="Uploading" value={45} />
        <ProgressBar label="Reading" isIndeterminate valueLabel="Page 2" showValueLabel />
      </div>,
    );
    expect(container.querySelector('[role="status"], [role="alert"], [aria-live]')).toBeNull();
  });

  it('passes className, ref and the rest props to the root, and aria-describedby to the track', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <>
        <ProgressBar
          label="Uploading"
          value={45}
          ref={ref}
          className="extra"
          id="upload"
          data-testid="progress"
          aria-describedby="note"
        />
        <p id="note">Keep this tab open.</p>
      </>,
    );
    const element = root(container);
    expect(ref.current).toBe(element);
    expect(element.tagName).toBe('DIV');
    expect(element).toHaveAttribute('class', 'progress-bar extra');
    expect(element).toHaveAttribute('id', 'upload');
    expect(element).toHaveAttribute('data-testid', 'progress');
    expect(element).not.toHaveAttribute('aria-describedby');
    expect(bar()).toHaveAttribute('aria-describedby', 'note');
    expect(bar()).toHaveAccessibleDescription('Keep this tab open.');
  });

  it('puts the caller description before the shown value text while indeterminate', () => {
    render(
      <>
        <p id="note">Keep this tab open.</p>
        <ProgressBar
          label="Reading"
          isIndeterminate
          valueLabel="Page 2"
          showValueLabel
          aria-describedby="note"
        />
      </>,
    );
    expect(bar()).toHaveAccessibleDescription('Keep this tab open. Page 2');
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('ProgressBar');
  });

  it('requires a name and a numeric value in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops requiring it.
    // @ts-expect-error a progress bar with no label, aria-label or aria-labelledby has no name
    const unnamed = <ProgressBar value={45} />;
    // @ts-expect-error the value is a number
    const text = <ProgressBar label="Uploading" value="45" />;
    expect(unnamed).toBeTruthy();
    expect(text).toBeTruthy();
  });

  const AXE_CASES: [name: string, element: () => ReactElement][] = [
    ['labelled at 45%', () => <ProgressBar label="Uploading invoice.pdf" value={45} />],
    [
      'named by aria-label with no head',
      () => <ProgressBar aria-label="Uploading invoice.pdf" value={60} showValueLabel={false} />,
    ],
    [
      'with a valueLabel',
      () => <ProgressBar label="Uploading invoice.pdf" value={30} valueLabel="1.2 of 4 MB" />,
    ],
    ['indeterminate with a label', () => <ProgressBar label="Reading receipt.jpg" isIndeterminate />],
    ['indeterminate with an empty label', () => <ProgressBar label="" isIndeterminate />],
    ['with an empty valueLabel', () => <ProgressBar label="" value={45} valueLabel="" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element());
    await expectNoA11yViolations(container);
  });
});
