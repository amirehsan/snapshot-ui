import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, StrictMode, useRef, useState, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { Dialog } from '../dialog';
import * as library from '../index';
import { NumberField } from '../number-field';
import { PickerOption } from '../picker';
import { SaveBar } from '../save-bar';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { Select } from '../select';
import { Switch } from '../switch';
import { TextField } from '../text-field';
import { FieldExtras, type FieldOffer } from './FieldExtras';

/*
 * An offer is drawn while the field does not hold its value, and taking it calls the app's setter and nothing
 * else. Focus then goes to the field's control in the frame after React's commit, so each test that reads focus
 * waits for that frame. The keyboard presses are a key down and up on the focused button, which React Aria
 * answers as a keyboard press, as the CopyButton's tests send them.
 */

/** An offer of `value`, current or not, whose take is a spy unless one is given. */
const offer = (value: string, isCurrent = false, onTake: () => void = vi.fn()): FieldOffer => ({
  value,
  isCurrent,
  onTake,
});

/** Focuses `element` and presses it with Enter, as a keyboard does. */
function press(element: HTMLElement): void {
  act(() => {
    element.focus();
  });
  act(() => {
    fireEvent.keyDown(element, { key: 'Enter' });
    fireEvent.keyUp(element, { key: 'Enter' });
  });
}

/** Lets two animation frames pass, so the part's move after the commit has run, and React draw what follows. */
async function frames(): Promise<void> {
  for (let count = 0; count < 2; count += 1) {
    await act(async () => {
      await new Promise((resolve) => requestAnimationFrame(resolve));
    });
  }
}

/** The offer lines, in order. */
const lines = (container: HTMLElement): HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('.field-offer'),
];

/** The part's polite status host. */
function status(container: HTMLElement): HTMLElement {
  const host = container.querySelector<HTMLElement>('.field-extras-status');
  if (!host) throw new Error('No status');
  return host;
}

/** The days a payment waits before it is counted, as a settings page offers them. */
const WAITS = [
  ['day', '1 day'],
  ['three', '3 days'],
  ['week', 'A week'],
] as const;

/** The money field "Cushion", in cents, with a suggestion, controlled by the test's state. */
function Cushion({
  start = null,
  withRef = false,
  onChange,
}: {
  start?: number | null;
  withRef?: boolean;
  onChange?: (value: number | null) => void;
}): ReactElement {
  const [cents, setCents] = useState<number | null>(start);
  const inputRef = useRef<HTMLInputElement>(null);
  const set = (value: number | null): void => {
    setCents(value);
    onChange?.(value);
  };
  return (
    <FieldExtras
      fieldLabel="Cushion"
      controlRef={withRef ? inputRef : undefined}
      suggestion={{
        value: '$2,340',
        reason: 'a month of your fixed bills',
        isCurrent: cents === 234000,
        onTake: () => {
          set(234000);
        },
      }}
    >
      <NumberField label="Cushion" money={{ symbol: '$' }} value={cents} onChange={set} inputRef={inputRef} />
    </FieldExtras>
  );
}

/** The Select "Wait", saved at a week, with its default of 3 days. */
function Wait({ withRef = false }: { withRef?: boolean }): ReactElement {
  const [wait, setWait] = useState<string>('week');
  const controlRef = useRef<HTMLElement>(null);
  return (
    <FieldExtras
      fieldLabel="Wait"
      controlRef={withRef ? controlRef : undefined}
      defaultOffer={{
        value: '3 days',
        isCurrent: wait === 'three',
        onTake: () => {
          setWait('three');
        },
      }}
    >
      <Select
        label="Wait"
        value={wait}
        onChange={(key) => {
          setWait(String(key));
        }}
        ref={(node) => {
          controlRef.current = node?.querySelector('button') ?? null;
        }}
      >
        {WAITS.map(([id, name]) => (
          <PickerOption key={id} id={id}>
            {name}
          </PickerOption>
        ))}
      </Select>
    </FieldExtras>
  );
}

/** The Switch "Push amounts", on, with its default of off. */
function PushAmounts({ withRef = false }: { withRef?: boolean }): ReactElement {
  const [on, setOn] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <FieldExtras
      fieldLabel="Push amounts"
      controlRef={withRef ? inputRef : undefined}
      defaultOffer={{
        value: 'Off',
        isCurrent: !on,
        onTake: () => {
          setOn(false);
        },
      }}
    >
      <Switch isSelected={on} onChange={setOn} inputRef={inputRef}>
        Push amounts
      </Switch>
    </FieldExtras>
  );
}

/** The SegmentedControl "Week starts", on Sunday, with its default of Monday. */
function WeekStarts({ withRef = false }: { withRef?: boolean }): ReactElement {
  const [day, setDay] = useState('sunday');
  const controlRef = useRef<HTMLElement>(null);
  return (
    <FieldExtras
      fieldLabel="Week starts"
      controlRef={withRef ? controlRef : undefined}
      defaultOffer={{
        value: 'Monday',
        isCurrent: day === 'monday',
        onTake: () => {
          setDay('monday');
        },
      }}
    >
      <SegmentedControl
        label="Week starts"
        value={day}
        onChange={setDay}
        ref={(node) => {
          // The option a take chose: React Aria's radio group keeps only the selected radio in the tab order.
          controlRef.current = node?.querySelector('input[value="monday"]') ?? null;
        }}
      >
        <SegmentedControlItem value="monday">Monday</SegmentedControlItem>
        <SegmentedControlItem value="sunday">Sunday</SegmentedControlItem>
      </SegmentedControl>
    </FieldExtras>
  );
}

/** The control each field's take should leave focused. */
const CONTROLS: [name: string, element: (withRef: boolean) => ReactElement, control: () => HTMLElement][] = [
  [
    'NumberField',
    (withRef) => <Cushion withRef={withRef} />,
    () => screen.getByRole('textbox', { name: 'Cushion' }),
  ],
  [
    'Select',
    (withRef) => <Wait withRef={withRef} />,
    () => {
      const trigger = screen
        .getAllByRole('button')
        .find((each) => each.getAttribute('aria-haspopup') === 'listbox');
      if (!trigger) throw new Error('No trigger');
      return trigger;
    },
  ],
  [
    'Switch',
    (withRef) => <PushAmounts withRef={withRef} />,
    () => screen.getByRole('switch', { name: 'Push amounts' }),
  ],
  [
    'SegmentedControl',
    (withRef) => <WeekStarts withRef={withRef} />,
    () => screen.getByRole('radio', { name: 'Monday' }),
  ],
];

/** The quiet hours, a pair of fields reset together, from 10 PM to 7 AM by default. */
function QuietHours({ onTake }: { onTake?: () => void }): ReactElement {
  const [hours, setHours] = useState({ from: '11 PM', to: '6 AM' });
  const isDefault = hours.from === '10 PM' && hours.to === '7 AM';
  return (
    <FieldExtras
      scope="group"
      fieldLabel="Quiet hours"
      defaultOffer={{
        value: '10 PM to 7 AM',
        isCurrent: isDefault,
        onTake: () => {
          setHours({ from: '10 PM', to: '7 AM' });
          onTake?.();
        },
      }}
    >
      <TextField
        label="From"
        value={hours.from}
        onChange={(from) => {
          setHours({ ...hours, from });
        }}
      />
      <TextField
        label="To"
        value={hours.to}
        onChange={(to) => {
          setHours({ ...hours, to });
        }}
      />
    </FieldExtras>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('FieldExtras', () => {
  it('is exported from the package', () => {
    expect(library.FieldExtras).toBe(FieldExtras);
  });

  it('wraps its field in div.field-extras, with className, ref and the rest on the root', () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(
      <FieldExtras
        fieldLabel="Wait"
        className="mine"
        data-testid="extras"
        ref={ref}
        defaultOffer={offer('3 days')}
      >
        <TextField label="Wait" defaultValue="A week" />
      </FieldExtras>,
    );
    const part = root(container);
    expect(part.tagName).toBe('DIV');
    expect(part).toHaveClass('field-extras', 'mine');
    expect(part).toHaveAttribute('data-scope', 'field');
    expect(part).toHaveAttribute('data-testid', 'extras');
    expect(ref.current).toBe(part);
    // The field first, then the offer, then the status host, which takes no place in the line's grid.
    expect([...part.children].map((child) => child.className)).toEqual([
      expect.stringMatching(/^field\b/),
      'field-offer',
      'field-extras-status',
    ]);
  });

  it.each([['default'], ['suggestion']] as const)('draws a %s offer only while it is not current', (kind) => {
    const props = (isCurrent: boolean) =>
      kind === 'default'
        ? { defaultOffer: offer('3 days', isCurrent) }
        : { suggestion: offer('3 days', isCurrent) };
    const { container, rerender } = render(
      <FieldExtras fieldLabel="Wait" {...props(false)}>
        <TextField label="Wait" />
      </FieldExtras>,
    );
    expect(lines(container)).toHaveLength(1);
    expect(lines(container)[0]).toHaveAttribute('data-kind', kind);
    rerender(
      <FieldExtras fieldLabel="Wait" {...props(true)}>
        <TextField label="Wait" />
      </FieldExtras>,
    );
    expect(lines(container)).toHaveLength(0);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('draws the suggestion before the default, and only the default when their values are equal', () => {
    const { container, rerender } = render(
      <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340')} defaultOffer={offer('$1,000')}>
        <TextField label="Cushion" />
      </FieldExtras>,
    );
    expect(lines(container).map((line) => line.dataset.kind)).toEqual(['suggestion', 'default']);
    rerender(
      <FieldExtras fieldLabel="Cushion" suggestion={offer('$1,000')} defaultOffer={offer('$1,000')}>
        <TextField label="Cushion" />
      </FieldExtras>,
    );
    expect(lines(container).map((line) => line.dataset.kind)).toEqual(['default']);
    // A field at the default holds the suggestion of the same value too: nothing is offered.
    rerender(
      <FieldExtras
        fieldLabel="Cushion"
        suggestion={offer('$1,000', true)}
        defaultOffer={offer('$1,000', true)}
      >
        <TextField label="Cushion" />
      </FieldExtras>,
    );
    expect(lines(container)).toHaveLength(0);
  });

  it("names each button with its word and the field's label, and describes it by the offer's words", () => {
    render(
      <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340')} defaultOffer={offer('$1,000')}>
        <TextField label="Cushion" />
      </FieldExtras>,
    );
    const use = screen.getByRole('button', { name: 'Use, Cushion' });
    const reset = screen.getByRole('button', { name: 'Reset to default, Cushion' });
    expect(use).toHaveAccessibleDescription('Suggested: $2,340');
    expect(reset).toHaveAccessibleDescription('Default: $1,000');
    // The field's name is read, not seen: the button shows its word alone, which starts its name.
    expect(use).toHaveTextContent(/^Use$/);
    expect(reset).toHaveTextContent(/^Reset to default$/);
    expect(use).toHaveClass('button', 'button-tertiary', 'field-offer-button');
    expect(use).toHaveAttribute('type', 'button');
  });

  it('adds the reason after the suggested value', () => {
    const { container } = render(
      <FieldExtras
        fieldLabel="Cushion"
        suggestion={{ ...offer('$2,340'), reason: 'a month of your fixed bills' }}
      >
        <TextField label="Cushion" />
      </FieldExtras>,
    );
    expect(container.querySelector('.field-offer-text')).toHaveTextContent(
      'Suggested: $2,340, a month of your fixed bills',
    );
    expect(screen.getByRole('button', { name: 'Use, Cushion' })).toHaveAccessibleDescription(
      'Suggested: $2,340, a month of your fixed bills',
    );
  });

  it('takes its words from labels', () => {
    render(
      <FieldExtras
        fieldLabel="Bereitschaft"
        suggestion={offer('2.340 $')}
        defaultOffer={offer('1.000 $')}
        labels={{
          default: (value) => `Standard: ${value}`,
          reset: 'Zurücksetzen',
          suggested: (value) => `Vorschlag: ${value}`,
          use: 'Übernehmen',
        }}
      >
        <TextField label="Bereitschaft" />
      </FieldExtras>,
    );
    expect(screen.getByRole('button', { name: 'Übernehmen, Bereitschaft' })).toHaveAccessibleDescription(
      'Vorschlag: 2.340 $',
    );
    expect(screen.getByRole('button', { name: 'Zurücksetzen, Bereitschaft' })).toHaveAccessibleDescription(
      'Standard: 1.000 $',
    );
  });

  it('calls onTake and nothing else: no value read, nothing prefilled, no Changed chip', () => {
    const onTake = vi.fn();
    const onChange = vi.fn();
    const { container } = render(
      <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340', false, onTake)}>
        <TextField label="Cushion" onChange={onChange} />
      </FieldExtras>,
    );
    const input = screen.getByRole('textbox', { name: 'Cushion' });
    // Never a placeholder and never a value the reader did not choose.
    expect(input).toHaveValue('');
    expect(input).not.toHaveAttribute('placeholder');
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    expect(onTake).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
    expect(input).toHaveValue('');
    expect(container.querySelector('[data-changed]')).toBeNull();
  });

  it.each(CONTROLS)("focuses %s's control after a take", async (_name, element, control) => {
    for (const withRef of [true, false]) {
      const { unmount } = render(element(withRef));
      press(screen.getByRole('button', { name: /^Reset to default|^Use/ }));
      await frames();
      expect(screen.queryByRole('button', { name: /^Reset to default|^Use/ })).toBeNull();
      expect(control()).toHaveFocus();
      unmount();
    }
  });

  it("focuses a signed money field's text box, not the sign button drawn before it", async () => {
    function Balance(): ReactElement {
      const [cents, setCents] = useState<number | null>(-5000);
      return (
        <FieldExtras
          fieldLabel="Opening balance"
          defaultOffer={{
            value: '$0.00',
            isCurrent: cents === 0,
            onTake: () => {
              setCents(0);
            },
          }}
        >
          <NumberField
            label="Opening balance"
            money={{ symbol: '$' }}
            allowsNegative
            value={cents}
            onChange={setCents}
          />
        </FieldExtras>
      );
    }
    const { container } = render(<Balance />);
    // The sign button comes first in the field, and takes focus by Tab.
    const sign = container.querySelector<HTMLElement>('.number-field-sign');
    expect(sign).not.toBeNull();
    expect(sign?.tabIndex).toBe(0);
    press(screen.getByRole('button', { name: 'Reset to default, Opening balance' }));
    await frames();
    expect(screen.getByRole('textbox', { name: 'Opening balance' })).toHaveFocus();
  });

  it("focuses the group's first control after a group take", async () => {
    render(<QuietHours />);
    press(screen.getByRole('button', { name: 'Reset to default, Quiet hours' }));
    await frames();
    expect(screen.getByRole('textbox', { name: 'From' })).toHaveValue('10 PM');
    expect(screen.getByRole('textbox', { name: 'From' })).toHaveFocus();
  });

  it('moves focus after a pointer press too, never to the body', async () => {
    const user = userEvent.setup();
    render(<Cushion />);
    const use = screen.getByRole('button', { name: 'Use, Cushion' });
    // Safari leaves a pressed button unfocused, so the press starts from the body.
    use.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
    await user.click(use);
    expect(document.activeElement).not.toBe(use);
    await frames();
    expect(document.activeElement).not.toBe(document.body);
    expect(screen.getByRole('textbox', { name: 'Cushion' })).toHaveFocus();
  });

  it('gives focus to the offer left, or main, when the taken offer leaves and the field takes none', async () => {
    function Locked(): ReactElement {
      const [taken, setTaken] = useState<string[]>([]);
      return (
        <main>
          <FieldExtras
            fieldLabel="Cushion"
            suggestion={{
              ...offer('$2,340'),
              isCurrent: taken.includes('use'),
              onTake: () => {
                setTaken([...taken, 'use']);
              },
            }}
            defaultOffer={{
              ...offer('$1,000'),
              isCurrent: taken.includes('reset'),
              onTake: () => {
                setTaken([...taken, 'reset']);
              },
            }}
          >
            <TextField label="Cushion" isDisabled />
          </FieldExtras>
        </main>
      );
    }
    render(<Locked />);
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    expect(screen.getByRole('button', { name: 'Reset to default, Cushion' })).toHaveFocus();
    press(screen.getByRole('button', { name: 'Reset to default, Cushion' }));
    await frames();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });

  it('leaves focus where the app put it when its setter moves focus elsewhere', async () => {
    function Asks(): ReactElement {
      const [asking, setAsking] = useState(false);
      return (
        <>
          <FieldExtras
            fieldLabel="Wait"
            defaultOffer={{
              ...offer('3 days'),
              onTake: () => {
                setAsking(true);
              },
            }}
          >
            <TextField label="Wait" defaultValue="A week" />
          </FieldExtras>
          <Dialog isOpen={asking} onOpenChange={setAsking} title="Reset every wait?">
            Every tier goes back to its default.
          </Dialog>
        </>
      );
    }
    const { container } = render(<Asks />);
    press(screen.getByRole('button', { name: 'Reset to default, Wait' }));
    await frames();
    const dialog = await screen.findByRole('dialog');
    expect(dialog.contains(document.activeElement)).toBe(true);
    // The modal hides the page from the accessibility tree, so the field is found by its markup.
    expect(document.querySelector('.field input')).not.toHaveFocus();
    // Nothing is reset yet, the dialog asks first, so the status says nothing.
    await frames();
    expect(status(container)).toBeEmptyDOMElement();
  });

  it('focuses controlRef rather than the first control when it names another', async () => {
    function Hours(): ReactElement {
      const toRef = useRef<HTMLInputElement>(null);
      const [to, setTo] = useState('6 AM');
      return (
        <FieldExtras
          scope="group"
          fieldLabel="Quiet hours"
          controlRef={toRef}
          defaultOffer={{
            ...offer('7 AM', to === '7 AM'),
            onTake: () => {
              setTo('7 AM');
            },
          }}
        >
          <TextField label="From" defaultValue="10 PM" />
          <TextField label="To" value={to} onChange={setTo} inputRef={toRef} />
        </FieldExtras>
      );
    }
    render(<Hours />);
    press(screen.getByRole('button', { name: 'Reset to default, Quiet hours' }));
    await frames();
    expect(screen.getByRole('textbox', { name: 'To' })).toHaveFocus();
  });

  it('moves focus to the field even when the setter leaves the pressed offer drawn', async () => {
    // A setter that clamps or refuses leaves the offer in place, and the button that holds focus with it.
    render(
      <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340')}>
        <TextField label="Cushion" />
      </FieldExtras>,
    );
    const use = screen.getByRole('button', { name: 'Use, Cushion' });
    press(use);
    expect(use).toHaveFocus();
    await frames();
    expect(screen.getByRole('textbox', { name: 'Cushion' })).toHaveFocus();
  });

  it("moves focus to the group's first field when a press leaves focus in a field of the group", async () => {
    const user = userEvent.setup();
    render(<QuietHours />);
    await user.click(screen.getByRole('textbox', { name: 'To' }));
    const reset = screen.getByRole('button', { name: 'Reset to default, Quiet hours' });
    // Safari does not focus a pressed button, so focus stays in To through the press.
    reset.addEventListener('mousedown', (event) => {
      event.preventDefault();
    });
    await user.click(reset);
    await frames();
    expect(screen.getByRole('textbox', { name: 'From' })).toHaveFocus();
  });

  it('moves nothing and says nothing once the part has left before its frame', async () => {
    function Leaves(): ReactElement {
      const [shown, setShown] = useState(true);
      return (
        <main>
          <button type="button">Elsewhere</button>
          {shown ? (
            <FieldExtras
              fieldLabel="Cushion"
              suggestion={{
                ...offer('$2,340'),
                onTake: () => {
                  setShown(false);
                },
              }}
            >
              <TextField label="Cushion" />
            </FieldExtras>
          ) : null}
        </main>
      );
    }
    render(<Leaves />);
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    act(() => {
      elsewhere.focus();
    });
    await frames();
    expect(elsewhere).toHaveFocus();
  });

  it('keeps the words of a later take for their whole hold', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    function Both(): ReactElement {
      const [value, setValue] = useState('');
      return (
        <FieldExtras
          fieldLabel="Cushion"
          suggestion={{
            ...offer('$2,340', value === '$2,340'),
            onTake: () => {
              setValue('$2,340');
            },
          }}
          defaultOffer={{
            ...offer('$1,000', value === '$1,000'),
            onTake: () => {
              setValue('$1,000');
            },
          }}
        >
          <TextField label="Cushion" value={value} onChange={setValue} />
        </FieldExtras>
      );
    }
    const { container } = render(<Both />);
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    press(screen.getByRole('button', { name: 'Reset to default, Cushion' }));
    await frames();
    // Five seconds after the first take, the second's words have three seconds left.
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(status(container)).toHaveTextContent('Set to the default');
    act(() => {
      vi.advanceTimersByTime(2500);
    });
    expect(status(container)).toBeEmptyDOMElement();
  });

  it('says a second take again, as a new node, when an app gives both takes the same words', async () => {
    function Same(): ReactElement {
      const [value, setValue] = useState('');
      return (
        <FieldExtras
          fieldLabel="Cushion"
          suggestion={{
            ...offer('$2,340', value === '$2,340'),
            onTake: () => {
              setValue('$2,340');
            },
          }}
          defaultOffer={{
            ...offer('$1,000', value === '$1,000'),
            onTake: () => {
              setValue('$1,000');
            },
          }}
          labels={{ usedStatus: 'Done', resetStatus: 'Done' }}
        >
          <TextField label="Cushion" value={value} onChange={setValue} />
        </FieldExtras>
      );
    }
    const { container } = render(<Same />);
    const host = status(container);
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    const first = host.firstElementChild;
    expect(first).toHaveTextContent('Done');
    press(screen.getByRole('button', { name: 'Reset to default, Cushion' }));
    await frames();
    expect(host.firstElementChild).toHaveTextContent('Done');
    expect(host.firstElementChild).not.toBe(first);
  });

  it('lifts the measure for a group', () => {
    const { container } = render(<QuietHours />);
    expect(root(container)).toHaveAttribute('data-scope', 'group');
  });

  it('says a take politely, once per take, in a status that is empty until then', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const { container } = render(
      <>
        <Cushion />
        <Wait />
      </>,
    );
    const [cushion, wait] = [...container.querySelectorAll<HTMLElement>('.field-extras')];
    if (!cushion || !wait) throw new Error('No parts');
    const host = status(cushion);
    expect(host).toHaveAttribute('role', 'status');
    expect(host).toHaveAttribute('aria-live', 'polite');
    expect(host).toHaveAttribute('aria-atomic', 'true');
    expect(host).toBeEmptyDOMElement();
    press(within(cushion).getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    expect(host).toHaveTextContent('Set to the suggestion');
    press(within(wait).getByRole('button', { name: 'Reset to default, Wait' }));
    await frames();
    expect(status(wait)).toHaveTextContent('Set to the default');
    // The words leave after a while, so a reader browsing later meets no stale news.
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(host).toBeEmptyDOMElement();
    expect(status(wait)).toBeEmptyDOMElement();
  });

  it("speaks after focus has moved, and says only what the field's own words do not", async () => {
    const { container } = render(<Cushion />);
    const host = status(container);
    const input = screen.getByRole('textbox', { name: 'Cushion' });
    // What held focus each time the status changed. A screen reader reads a focus move at once, cutting a
    // polite status said before it, so the status speaks once the field holds focus, after the field's words.
    const heldFocus: (Element | null)[] = [];
    new MutationObserver(() => {
      heldFocus.push(document.activeElement);
    }).observe(host, { childList: true, subtree: true, characterData: true });
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    expect(heldFocus).toEqual([input]);
    // The field is read as "Cushion, 2,340.00": the status adds what happened, not the label and value again.
    expect(host).toHaveTextContent(/\S/);
    expect(host.textContent).not.toMatch(/Cushion|2,340/);
  });

  it('writes each take as a new node, so the same offer taken again is said again', async () => {
    const user = userEvent.setup();
    function Again(): ReactElement {
      const [wait, setWait] = useState('A week');
      return (
        <FieldExtras
          fieldLabel="Wait"
          defaultOffer={{
            ...offer('3 days', wait === '3 days'),
            onTake: () => {
              setWait('3 days');
            },
          }}
        >
          <TextField label="Wait" value={wait} onChange={setWait} />
        </FieldExtras>
      );
    }
    const { container } = render(<Again />);
    const host = status(container);
    press(screen.getByRole('button', { name: 'Reset to default, Wait' }));
    await frames();
    const first = host.firstElementChild;
    expect(first).not.toBeNull();
    // Typed away from the default, the offer is back; taken again, it is said again.
    await user.type(screen.getByRole('textbox', { name: 'Wait' }), '0');
    press(screen.getByRole('button', { name: 'Reset to default, Wait' }));
    await frames();
    expect(host.firstElementChild).not.toBeNull();
    expect(host.firstElementChild).not.toBe(first);
    expect(host.childElementCount).toBe(1);
  });

  it('says nothing of a take the field does not hold, and empties when the taken offer comes back', async () => {
    function Refused(): ReactElement {
      const [wait, setWait] = useState('A week');
      return (
        <FieldExtras
          fieldLabel="Wait"
          suggestion={offer('1 day')}
          defaultOffer={{
            ...offer('3 days', wait === '3 days'),
            onTake: () => {
              setWait('3 days');
            },
          }}
        >
          <TextField label="Wait" value={wait} onChange={setWait} />
        </FieldExtras>
      );
    }
    const user = userEvent.setup();
    const { container } = render(<Refused />);
    const host = status(container);
    // The suggestion's setter here sets nothing, so its offer stays drawn: nothing was set, and nothing is said.
    press(screen.getByRole('button', { name: 'Use, Wait' }));
    await frames();
    expect(host).toBeEmptyDOMElement();
    press(screen.getByRole('button', { name: 'Reset to default, Wait' }));
    await frames();
    expect(host).toHaveTextContent('Set to the default');
    // The field leaves the default, by typing or a Cancel, before the words have gone: they would be stale.
    await user.type(screen.getByRole('textbox', { name: 'Wait' }), '0');
    expect(host).toBeEmptyDOMElement();
  });

  it('says a take with its own words from labels', async () => {
    function German(): ReactElement {
      const [value, setValue] = useState('');
      return (
        <FieldExtras
          fieldLabel="Cushion"
          suggestion={{
            ...offer('$2,340', value === '$2,340'),
            onTake: () => {
              setValue('$2,340');
            },
          }}
          defaultOffer={{
            ...offer('$1,000', value === '$1,000'),
            onTake: () => {
              setValue('$1,000');
            },
          }}
          labels={{ usedStatus: 'Vorschlag übernommen', resetStatus: 'Standard gesetzt' }}
        >
          <TextField label="Cushion" value={value} onChange={setValue} />
        </FieldExtras>
      );
    }
    const { container } = render(<German />);
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    expect(status(container)).toHaveTextContent('Vorschlag übernommen');
    press(screen.getByRole('button', { name: 'Reset to default, Cushion' }));
    await frames();
    expect(status(container)).toHaveTextContent('Standard gesetzt');
  });

  it('warns once when its status speaks inside aria-busy="true"', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    render(
      <div aria-busy="true">
        <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340')} defaultOffer={offer('$1,000')}>
          <TextField label="Cushion" />
        </FieldExtras>
      </div>,
    );
    expect(warn).not.toHaveBeenCalled();
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    press(screen.getByRole('button', { name: 'Reset to default, Cushion' }));
    await frames();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/aria-busy/);
  });

  it('takes once and says it once under StrictMode', async () => {
    const onChange = vi.fn();
    const { container } = render(
      <StrictMode>
        <Cushion onChange={onChange} />
      </StrictMode>,
    );
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(status(container).childElementCount).toBe(1);
    expect(screen.getByRole('textbox', { name: 'Cushion' })).toHaveFocus();
  });

  describe("beside the field's validation", () => {
    it('never submits or checks the form it sits in', () => {
      const onSubmit = vi.fn((event: SubmitEvent) => {
        event.preventDefault();
      });
      const onInvalid = vi.fn();
      const { container } = render(
        <form>
          <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340')}>
            <TextField label="Cushion" name="cushion" isRequired />
          </FieldExtras>
        </form>,
      );
      const form = container.querySelector('form');
      if (!form) throw new Error('No form');
      form.addEventListener('submit', onSubmit);
      form.addEventListener('invalid', onInvalid, true);
      press(screen.getByRole('button', { name: 'Use, Cushion' }));
      expect(onSubmit).not.toHaveBeenCalled();
      expect(onInvalid).not.toHaveBeenCalled();
      // The offer has no name and no value of its own, so the form sends only the field.
      expect([...new FormData(form).keys()]).toEqual(['cushion']);
    });

    it("draws its offers after the field's error, and leaves the field's description and state alone", () => {
      const { container } = render(
        <FieldExtras fieldLabel="Cushion" suggestion={offer('$2,340')} defaultOffer={offer('$1,000')}>
          <TextField
            label="Cushion"
            description="Kept aside each month."
            isInvalid
            errorMessage="Enter an amount under $10,000."
            defaultValue="$12,000"
          />
        </FieldExtras>,
      );
      const input = screen.getByRole('textbox', { name: 'Cushion' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
      // The field is described by its own words only: no offer joins its description.
      expect(input).toHaveAccessibleDescription(expect.not.stringContaining('Suggested'));
      expect(input).toHaveAccessibleDescription(expect.stringContaining('Enter an amount under $10,000.'));
      const error = container.querySelector('.field-error');
      const first = lines(container)[0];
      if (!error || !first) throw new Error('No error or offer');
      expect(error.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      // The offer is never drawn as an error: its words are slate, the stylesheet's, with no tone of their own.
      expect(first).not.toHaveAttribute('data-invalid');
    });

    it('keeps the field invalid after a take until the app says otherwise', async () => {
      function Checked(): ReactElement {
        const [text, setText] = useState('$12,000');
        return (
          <FieldExtras
            fieldLabel="Cushion"
            suggestion={{
              ...offer('$2,340'),
              isCurrent: text === '$2,340',
              onTake: () => {
                setText('$2,340');
              },
            }}
          >
            <TextField
              label="Cushion"
              value={text}
              onChange={setText}
              isInvalid={text === '$12,000'}
              errorMessage="Enter an amount under $10,000."
            />
          </FieldExtras>
        );
      }
      render(<Checked />);
      const input = screen.getByRole('textbox', { name: 'Cushion' });
      expect(input).toHaveAttribute('aria-invalid', 'true');
      press(screen.getByRole('button', { name: 'Use, Cushion' }));
      await frames();
      // The app's own check, run on the new value, clears the error; the part did nothing to it.
      expect(input).not.toHaveAttribute('aria-invalid');
      expect(input).toHaveFocus();
    });
  });

  describe('with the Changed chip and a SaveBar', () => {
    /** A settings form saved at a week: its Changed chip and the bar follow the app's comparison. */
    function Settings(): ReactElement {
      const [saved, setSaved] = useState('week');
      const [wait, setWait] = useState('week');
      const isDirty = wait !== saved;
      return (
        <form
          onSubmit={(event) => {
            event.preventDefault();
          }}
        >
          <FieldExtras
            fieldLabel="Wait"
            defaultOffer={{
              value: '3 days',
              isCurrent: wait === 'three',
              onTake: () => {
                setWait('three');
              },
            }}
          >
            <Select
              label="Wait"
              value={wait}
              isChanged={isDirty}
              onChange={(key) => {
                setWait(String(key));
              }}
            >
              {WAITS.map(([id, name]) => (
                <PickerOption key={id} id={id}>
                  {name}
                </PickerOption>
              ))}
            </Select>
          </FieldExtras>
          <SaveBar
            message={isDirty ? '1 change to Coach' : 'Coach'}
            isDirty={isDirty}
            actionLabel="Save"
            warnsOnUnload={false}
            onAction={() => {
              setSaved(wait);
            }}
            onCancel={() => {
              setWait(saved);
            }}
          />
        </form>
      );
    }

    it('counts a take as an edit: dirty after it, clean and offered again after Cancel', async () => {
      const user = userEvent.setup();
      const { container } = render(<Settings />);
      expect(container.querySelector('[data-changed]')).toBeNull();
      expect(screen.getByRole('group', { name: 'Coach' })).toBeInTheDocument();
      press(screen.getByRole('button', { name: 'Reset to default, Wait' }));
      await frames();
      // The app's comparison makes the field Changed and the bar dirty; the offer has left.
      expect(screen.getByRole('group', { name: '1 change to Coach' })).toBeInTheDocument();
      expect(container.querySelector('[data-changed]')).not.toBeNull();
      expect(screen.queryByRole('button', { name: 'Reset to default, Wait' })).toBeNull();
      // Cancel puts the saved value back, and with it the offer.
      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      const question = await screen.findByRole('alertdialog', { name: 'Discard changes?' });
      await user.click(within(question).getByRole('button', { name: 'Discard changes' }));
      expect(await screen.findByRole('button', { name: 'Reset to default, Wait' })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: 'Coach' })).toBeInTheDocument();
      expect(container.querySelector('[data-changed]')).toBeNull();
      // The reset was undone, so its words leave the status with it.
      expect(status(container)).toBeEmptyDOMElement();
    });

    it('stays out of the way once saved at the default: no offer and no chip', async () => {
      const { container } = render(<Settings />);
      press(screen.getByRole('button', { name: 'Reset to default, Wait' }));
      await frames();
      press(screen.getByRole('button', { name: 'Save' }));
      await frames();
      expect(screen.getByRole('group', { name: 'Coach' })).toBeInTheDocument();
      expect(container.querySelector('[data-changed]')).toBeNull();
      expect(lines(container)).toHaveLength(0);
    });
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    [
      'default',
      <FieldExtras key="default" fieldLabel="Wait" defaultOffer={offer('3 days')}>
        <TextField label="Wait" defaultValue="A week" />
      </FieldExtras>,
    ],
    [
      'suggestion',
      <FieldExtras
        key="suggestion"
        fieldLabel="Cushion"
        suggestion={{ ...offer('$2,340'), reason: 'a month of your fixed bills' }}
      >
        <TextField label="Cushion" />
      </FieldExtras>,
    ],
    [
      'both',
      <FieldExtras
        key="both"
        fieldLabel="Cushion"
        suggestion={offer('$2,340')}
        defaultOffer={offer('$1,000')}
      >
        <TextField label="Cushion" />
      </FieldExtras>,
    ],
    ['group', <QuietHours key="group" />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('has no axe violations after a take, with its status said', async () => {
    const { container } = render(<Cushion />);
    press(screen.getByRole('button', { name: 'Use, Cushion' }));
    await frames();
    expect(status(container)).toHaveTextContent('Set to the suggestion');
    await expectNoA11yViolations(container);
  });

  it('requires a field label and an onTake for each offer, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error every button's name ends with the field's label
    const unlabelled = <FieldExtras defaultOffer={offer('3 days')}>x</FieldExtras>;
    const untaken = (
      // @ts-expect-error an offer is taken by the app's setter
      <FieldExtras fieldLabel="Wait" defaultOffer={{ value: '3 days', isCurrent: false }}>
        x
      </FieldExtras>
    );
    expect(unlabelled).toBeTruthy();
    expect(untaken).toBeTruthy();
  });
});
