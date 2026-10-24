import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { PositionPad, type PadPosition, type PositionPadProps } from './PositionPad';

const NAMES = [
  'Top left',
  'Top',
  'Top right',
  'Left',
  'Center',
  'Right',
  'Bottom left',
  'Bottom',
  'Bottom right',
];

const VALUES: PadPosition[] = [
  'top-start',
  'top-center',
  'top-end',
  'center-start',
  'center',
  'center-end',
  'bottom-start',
  'bottom-center',
  'bottom-end',
];

function Pad(props: Partial<PositionPadProps>): ReactElement {
  return <PositionPad label="Text position" {...props} />;
}

const cell = (name: string): HTMLInputElement => screen.getByRole<HTMLInputElement>('radio', { name });

/** The name of the checked radio, or null. */
const chosen = (): string | null =>
  screen
    .getAllByRole<HTMLInputElement>('radio')
    .find((radio) => radio.checked)
    ?.getAttribute('aria-label') ?? null;

/** The name of the focused radio, or null. */
const focused = (): string | null =>
  document.activeElement instanceof HTMLInputElement
    ? document.activeElement.getAttribute('aria-label')
    : null;

describe('PositionPad', () => {
  it('draws nine radios in reading order, each named by its position', async () => {
    const { container } = render(
      <Pad description="Where the text sits on the banner." defaultValue="center" />,
    );
    const group = screen.getByRole('radiogroup', { name: 'Text position' });
    expect(group).toBe(root(container));
    expect(group).toHaveClass('field', 'radio-group', 'position-pad');
    expect(group).toHaveAccessibleDescription('Where the text sits on the banner.');
    const children = [...group.children].map((child) => child.className);
    expect(children).toEqual(['field-head', 'position-pad-track', 'field-description']);
    const track = group.querySelector('.position-pad-track');
    // React Aria's field wrapper holds each cell, drawn as display: contents, so the cells are the grid's items.
    const items = [...(track?.children ?? [])];
    expect(items.map((item) => item.className)).toEqual(Array(9).fill('position-pad-item'));
    const cells = items.map((item) => item.firstElementChild);
    expect(items.every((item) => item.childElementCount === 1)).toBe(true);
    for (const [at, each] of cells.entries()) {
      if (!each) throw new Error('No cell');
      expect(each.tagName).toBe('LABEL');
      expect(each).toHaveClass('position-pad-cell');
      expect(each).toHaveAttribute('data-position', VALUES[at]);
      expect(each.querySelector('.position-pad-dot')).toHaveAttribute('aria-hidden', 'true');
      const input = each.querySelector('input');
      expect(input).toHaveAttribute('type', 'radio');
      expect(input).toHaveAttribute('value', VALUES[at]);
    }
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual(NAMES);
    for (const name of NAMES) expect(screen.getByRole('radio', { name })).toBeInTheDocument();
    expect(cell('Center')).toBeChecked();
    expect(cells[4]).toHaveAttribute('data-selected', 'true');
    await expectNoA11yViolations(container);
  });

  it('uses labels for any position it names and the English defaults for the rest', () => {
    render(<Pad labels={{ 'top-start': 'بالا راست', center: 'وسط' }} />);
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('aria-label'))).toEqual([
      'بالا راست',
      'Top',
      'Top right',
      'Left',
      'وسط',
      'Right',
      'Bottom left',
      'Bottom',
      'Bottom right',
    ]);
  });

  it('moves along the row with Left and Right, into the next row, wrapping from the last to the first', async () => {
    const user = userEvent.setup();
    render(<Pad defaultValue="top-end" />);
    await user.tab();
    expect(focused()).toBe('Top right');
    await user.keyboard('{ArrowRight}');
    expect(chosen()).toBe('Left');
    expect(focused()).toBe('Left');
    await user.keyboard('{ArrowLeft}');
    expect(chosen()).toBe('Top right');
    await user.click(cell('Bottom right'));
    expect(chosen()).toBe('Bottom right');
    await user.keyboard('{ArrowRight}');
    expect(chosen()).toBe('Top left');
    expect(focused()).toBe('Top left');
    await user.keyboard('{ArrowLeft}');
    expect(chosen()).toBe('Bottom right');
  });

  it('mirrors Left and Right under dir rtl, and keeps them under dir ltr inside a right-to-left page', async () => {
    const user = userEvent.setup();
    render(
      <div dir="rtl">
        <Pad aria-label="Right to left" label={undefined} defaultValue="top-start" />
        <div dir="ltr">
          <Pad aria-label="Left to right" label={undefined} defaultValue="top-start" />
        </div>
      </div>,
    );
    const [mirrored, kept] = screen.getAllByRole('radiogroup');
    const inPad = (pad: HTMLElement | undefined, name: string): HTMLInputElement =>
      pad?.querySelector<HTMLInputElement>(`input[aria-label="${name}"]`) ?? cell('missing');
    // In right to left the start is on the right, so Arrow Left moves on in reading order and Arrow Right back.
    inPad(mirrored, 'Top left').focus();
    await user.keyboard('{ArrowLeft}');
    expect(inPad(mirrored, 'Top')).toBeChecked();
    expect(inPad(mirrored, 'Top')).toHaveFocus();
    await user.keyboard('{ArrowRight}{ArrowRight}');
    expect(inPad(mirrored, 'Bottom right')).toBeChecked();
    // A pad marked dir="ltr" on a right-to-left page keeps left as left.
    inPad(kept, 'Top left').focus();
    await user.keyboard('{ArrowRight}');
    expect(inPad(kept, 'Top')).toBeChecked();
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(inPad(kept, 'Bottom right')).toBeChecked();
  });

  it('moves by column with Up and Down and stops at the edges', async () => {
    const user = userEvent.setup();
    render(<Pad defaultValue="top-center" />);
    await user.tab();
    await user.keyboard('{ArrowDown}');
    expect(chosen()).toBe('Center');
    await user.keyboard('{ArrowDown}');
    expect(chosen()).toBe('Bottom');
    await user.keyboard('{ArrowDown}');
    expect(chosen()).toBe('Bottom');
    expect(focused()).toBe('Bottom');
    await user.keyboard('{ArrowUp}{ArrowUp}{ArrowUp}{ArrowUp}');
    expect(chosen()).toBe('Top');
    expect(focused()).toBe('Top');
  });

  it('skips disabled positions in the direction of travel and stays when none is left', async () => {
    const user = userEvent.setup();
    render(
      <Pad
        defaultValue="top-start"
        disabledPositions={['center-start', 'center', 'center-end', 'bottom-start']}
      />,
    );
    for (const name of ['Left', 'Center', 'Right', 'Bottom left']) expect(cell(name)).toBeDisabled();
    await user.tab();
    await user.keyboard('{ArrowDown}');
    // The middle row and Bottom left are disabled: nothing below Top left is left, so focus stays.
    expect(chosen()).toBe('Top left');
    expect(focused()).toBe('Top left');
    await user.keyboard('{ArrowLeft}');
    expect(chosen()).toBe('Bottom right');
    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    // Bottom, then on past the disabled row and Bottom left to Top right.
    expect(chosen()).toBe('Top right');
    await user.keyboard('{ArrowDown}');
    expect(chosen()).toBe('Bottom right');
  });

  it('moves focus without choosing while read only', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Pad defaultValue="center" isReadOnly onChange={onChange} />);
    await user.tab();
    expect(focused()).toBe('Center');
    await user.keyboard('{ArrowRight}');
    expect(focused()).toBe('Right');
    await user.keyboard('{ArrowDown}');
    expect(focused()).toBe('Bottom right');
    expect(chosen()).toBe('Center');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange once per move', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function Controlled(): ReactElement {
      const [value, setValue] = useState<PadPosition | null>('center');
      return (
        <Pad
          value={value}
          onChange={(next) => {
            onChange(next);
            setValue(next);
          }}
        />
      );
    }
    render(<Controlled />);
    await user.tab();
    await user.keyboard('{ArrowUp}');
    await user.keyboard('{ArrowLeft}');
    await user.keyboard('{ArrowUp}');
    expect(onChange.mock.calls).toEqual([['top-center'], ['top-start']]);
    expect(chosen()).toBe('Top left');
  });

  it('lets Tab land on the first enabled cell without choosing it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <>
        <button type="button">Before</button>
        <Pad disabledPositions={['top-start', 'bottom-end']} onChange={onChange} />
        <button type="button">After</button>
      </>,
    );
    await user.tab();
    await user.tab();
    expect(focused()).toBe('Top');
    expect(chosen()).toBeNull();
    await user.tab();
    expect(screen.getByRole('button', { name: 'After' })).toHaveFocus();
    await user.tab({ shift: true });
    expect(focused()).toBe('Bottom');
    expect(chosen()).toBeNull();
    await user.keyboard(' ');
    expect(chosen()).toBe('Bottom');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('bottom-center');
  });

  it('submits the chosen value and resets it on the form reset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Pad name="place" defaultValue="center" />
        <button type="reset">Reset</button>
      </form>,
    );
    const sent = (): FormDataEntryValue[] => new FormData(formOf(container)).getAll('place');
    expect(sent()).toEqual(['center']);
    await user.click(cell('Bottom right'));
    expect(sent()).toEqual(['bottom-end']);
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(chosen()).toBe('Center');
    expect(sent()).toEqual(['center']);
  });

  it('draws changed and invalid on the track, invalid winning, and no chip without a label', () => {
    const { rerender, container } = render(<Pad isChanged />);
    const group = root(container);
    expect(group).toHaveAttribute('data-changed');
    expect(screen.getByText('Changed')).toHaveClass('field-changed');
    rerender(<Pad isChanged isInvalid errorMessage="Choose where the text sits." />);
    expect(group).toHaveAttribute('data-changed');
    expect(group).toHaveAttribute('data-invalid');
    // An invalid pad shows its error line and not its chip.
    expect(screen.queryByText('Changed')).toBeNull();
    expect(screen.getByText('Choose where the text sits.')).toHaveClass('field-error');
    rerender(<PositionPad aria-label="Text position" isChanged />);
    const unlabelled = root(container);
    expect(unlabelled).toHaveAttribute('data-changed');
    expect(screen.queryByText('Changed')).toBeNull();
    expect(unlabelled.querySelector('.field-head')).toBeNull();
  });

  it('writes no aria-orientation, which means nothing for two axes', () => {
    render(<Pad />);
    expect(screen.getByRole('radiogroup')).not.toHaveAttribute('aria-orientation');
  });

  it('passes className and ref to the group', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<Pad ref={ref} className="banner-pad" />);
    expect(ref.current).toBe(root(container));
    expect(ref.current).toHaveClass('field', 'radio-group', 'position-pad', 'banner-pad');
    const { container: second } = render(
      <Pad className={({ isDisabled }) => (isDisabled ? 'off' : 'on')} isDisabled />,
    );
    expect(root(second)).toHaveClass('position-pad', 'off');
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['nothing chosen', <Pad key="none" />],
    ...(['top-start', 'top-end', 'bottom-start', 'bottom-end'] as const).map(
      (corner): [string, ReactElement] => [`${corner} chosen`, <Pad key={corner} defaultValue={corner} />],
    ),
    ['disabled positions', <Pad key="some" disabledPositions={['center-start', 'center', 'center-end']} />],
    ['invalid', <Pad key="invalid" isInvalid errorMessage="Choose where the text sits." />],
    ['changed', <Pad key="changed" defaultValue="center" isChanged />],
    ['disabled', <Pad key="disabled" defaultValue="center" isDisabled />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('types its values and leaves orientation out', () => {
    // Each @ts-expect-error line fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a value the pad does not have
    const middle = <PositionPad label="Text position" value="middle" />;
    // @ts-expect-error a pad has two axes, so it takes no orientation
    const oriented = <PositionPad label="Text position" orientation="horizontal" />;
    // @ts-expect-error a pad needs a name
    const nameless = <PositionPad />;
    expect([middle, oriented, nameless]).toHaveLength(3);
  });
});
