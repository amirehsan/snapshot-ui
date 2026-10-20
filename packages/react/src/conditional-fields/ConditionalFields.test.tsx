import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, onTestFinished, vi, type MockInstance } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf, root } from '../../test/dom';
import { Button } from '../button';
import * as library from '../index';
import { PickerOption } from '../picker';
import { Select } from '../select';
import { Switch } from '../switch';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { ConditionalFields } from './ConditionalFields';

/*
 * jsdom has no layout and none of Chromium's focus fix-up: a field in a group that turns hidden keeps focus here,
 * as it does in Firefox. So these tests prove the attributes, the submission and where focus is given; the plays
 * prove the moves in three engines (lesson 10).
 */

/** Waits for the next frame, after anything a frame was asked to do. */
const nextFrame = (): Promise<void> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

/** Listens to console.warn for one test, quietly. */
function warnings(): MockInstance<typeof console.warn> {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  onTestFinished(() => {
    warn.mockRestore();
  });
  return warn;
}

/** The group's fieldset in `container`. */
const group = (container: HTMLElement): HTMLFieldSetElement => {
  const fieldset = container.querySelector<HTMLFieldSetElement>('fieldset.conditional-fields');
  if (!fieldset) throw new Error('No conditional fields');
  return fieldset;
};

/** The names a form would send, in order. */
const sentNames = (container: HTMLElement): string[] => [...new FormData(formOf(container)).keys()];

/** The logo settings: the gate, then the provider and the key it shows. */
function LogoForm({
  defaultShown = true,
  submitsWhenHidden,
  isRequired = false,
  onSubmit,
  after,
}: {
  defaultShown?: boolean;
  submitsWhenHidden?: boolean;
  isRequired?: boolean;
  onSubmit?: () => void;
  after?: ReactNode;
}): ReactElement {
  const [logo, setLogo] = useState(defaultShown);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit?.();
      }}
    >
      <Switch isSelected={logo} onChange={setLogo} aria-controls="logo-fields">
        Show bank logos
      </Switch>
      <ConditionalFields id="logo-fields" isShown={logo} submitsWhenHidden={submitsWhenHidden}>
        <Select label="Provider" name="logoProvider" defaultValue="northwind">
          <PickerOption id="northwind">Northwind Logos</PickerOption>
          <PickerOption id="fabrikam">Fabrikam Marks</PickerOption>
        </Select>
        <TextField
          label="API key"
          name="logoKey"
          type="password"
          isRequired={isRequired}
          onKeyDown={(event) => {
            // The app's own shortcut, which turns the gate off while focus is in the group.
            if (event.key === 'Escape') setLogo(false);
          }}
        />
      </ConditionalFields>
      {after}
      <button type="submit">Save</button>
    </form>
  );
}

/** The gate: the switch's input, which carries the switch role. */
const gate = (): HTMLElement => screen.getByRole('switch', { name: 'Show bank logos' });

/** The key field, found whether or not the group is hidden from the accessibility tree. */
const keyField = (container: HTMLElement): HTMLInputElement => {
  const input = container.querySelector<HTMLInputElement>('input[name="logoKey"]');
  if (!input) throw new Error('No key field');
  return input;
};

afterEach(() => {
  if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
});

describe('ConditionalFields', () => {
  it('is exported from the package', () => {
    expect(library.ConditionalFields).toBe(ConditionalFields);
  });

  it.each([
    [false, ['hidden', 'inert', 'disabled', 'data-hidden']],
    [true, []],
  ])('when isShown is %s writes %j', (isShown, written) => {
    const { container } = render(
      <ConditionalFields id="group" isShown={isShown}>
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    const fieldset = group(container);
    for (const name of ['hidden', 'inert', 'disabled', 'data-hidden']) {
      expect(fieldset.hasAttribute(name), name).toBe(written.includes(name));
    }
  });

  it('is a fieldset with its class, the rest props, className and ref, and its id from useId when not given', () => {
    const ref = createRef<HTMLFieldSetElement>();
    const { container } = render(
      <ConditionalFields isShown ref={ref} className="logo" data-testid="logo-group" title="Logos">
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    const fieldset = root(container);
    expect(fieldset.tagName).toBe('FIELDSET');
    expect(fieldset).toHaveClass('conditional-fields', 'logo');
    expect(fieldset).toHaveAttribute('data-testid', 'logo-group');
    expect(fieldset).toHaveAttribute('title', 'Logos');
    expect(ref.current).toBe(fieldset);
    // The id the gate's aria-controls names, readable through the ref.
    expect(ref.current?.id).not.toBe('');
  });

  it('keeps hidden and inert but not disabled under submitsWhenHidden', () => {
    const { container } = render(
      <ConditionalFields id="group" isShown={false} submitsWhenHidden>
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    const fieldset = group(container);
    expect(fieldset).toHaveAttribute('hidden');
    expect(fieldset).toHaveAttribute('inert');
    expect(fieldset).toHaveAttribute('data-hidden');
    expect(fieldset).not.toHaveAttribute('disabled');
  });

  it('has role none without a name, and is a named group with aria-label', () => {
    const { container, rerender } = render(
      <ConditionalFields id="group" isShown>
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    expect(group(container)).toHaveAttribute('role', 'none');
    rerender(
      <ConditionalFields id="group" isShown aria-label="Logo provider">
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    expect(group(container)).not.toHaveAttribute('role');
    expect(screen.getByRole('group', { name: 'Logo provider' })).toBe(group(container));
    rerender(
      <>
        <h3 id="logo-title">Logo provider</h3>
        <ConditionalFields id="group" isShown aria-labelledby="logo-title">
          <input aria-label="Field" />
        </ConditionalFields>
      </>,
    );
    expect(screen.getByRole('group', { name: 'Logo provider' })).toBe(group(container));
  });

  it('keeps typed values across a hide and a show', async () => {
    const user = userEvent.setup();
    const { container } = render(<LogoForm />);
    await user.click(screen.getByRole('button', { name: /Provider/ }));
    await user.click(screen.getByRole('option', { name: 'Fabrikam Marks' }));
    await user.type(screen.getByLabelText('API key'), 'sk-4417');

    await user.click(gate());
    expect(group(container)).toHaveAttribute('hidden');
    expect(keyField(container)).toHaveValue('sk-4417');

    await user.click(gate());
    expect(group(container)).not.toHaveAttribute('hidden');
    expect(screen.getByLabelText('API key')).toHaveValue('sk-4417');
    expect(container.querySelector('.select-value')).toHaveTextContent('Fabrikam Marks');
  });

  it("leaves hidden fields out of the form's FormData", async () => {
    const user = userEvent.setup();
    const { container } = render(<LogoForm />);
    await user.type(screen.getByLabelText('API key'), 'sk-4417');
    expect(sentNames(container)).toEqual(expect.arrayContaining(['logoProvider', 'logoKey']));
    await user.click(gate());
    expect(sentNames(container)).not.toContain('logoProvider');
    expect(sentNames(container)).not.toContain('logoKey');
  });

  it('sends them under submitsWhenHidden', async () => {
    const user = userEvent.setup();
    const { container } = render(<LogoForm submitsWhenHidden />);
    await user.type(screen.getByLabelText('API key'), 'sk-4417');
    await user.click(gate());
    expect(group(container)).toHaveAttribute('hidden');
    const sent = new FormData(formOf(container));
    expect(sent.get('logoKey')).toBe('sk-4417');
    expect(sent.get('logoProvider')).toBe('northwind');
  });

  it('does not send a secret key typed and then hidden', async () => {
    const user = userEvent.setup();
    const { container } = render(<LogoForm />);
    await user.type(screen.getByLabelText('API key'), 'sk-live-0042');
    await user.click(gate());
    expect(new FormData(formOf(container)).has('logoKey')).toBe(false);
    await user.click(gate());
    expect(new FormData(formOf(container)).get('logoKey')).toBe('sk-live-0042');
    expect(screen.getByLabelText('API key')).toHaveValue('sk-live-0042');
  });

  it('lets a form with a hidden required field submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const { container } = render(<LogoForm defaultShown={false} isRequired onSubmit={onSubmit} />);
    const form = formOf(container);
    expect(form.checkValidity()).toBe(true);
    act(() => {
      form.requestSubmit();
    });
    expect(onSubmit).toHaveBeenCalledOnce();
    // Shown, the empty required key is checked again and blocks the save.
    await user.click(gate());
    expect(form.checkValidity()).toBe(false);
  });

  it('never leaves a shown group disabled', () => {
    const states: [isShown: boolean, submitsWhenHidden: boolean][] = [
      [true, false],
      [false, false],
      [true, false],
      [false, true],
      [true, true],
      [false, false],
      [false, true],
      [true, true],
      [true, false],
    ];
    const { container, rerender } = render(
      <ConditionalFields id="group" isShown>
        <input aria-label="Field" name="field" />
      </ConditionalFields>,
    );
    for (const [isShown, submitsWhenHidden] of states) {
      rerender(
        <ConditionalFields id="group" isShown={isShown} submitsWhenHidden={submitsWhenHidden}>
          <input aria-label="Field" name="field" />
        </ConditionalFields>,
      );
      const fieldset = group(container);
      if (isShown) {
        expect(fieldset).not.toHaveAttribute('disabled');
        expect(fieldset).not.toHaveAttribute('hidden');
        expect(fieldset).not.toHaveAttribute('inert');
        expect(fieldset.disabled).toBe(false);
      } else {
        expect(fieldset.disabled).toBe(!submitsWhenHidden);
      }
    }
  });

  it("draws no field inside as disabled: React Aria's fields keep their own isDisabled false", async () => {
    const user = userEvent.setup();
    const { container } = render(<LogoForm />);
    await user.click(gate());
    await user.click(gate());
    expect(container.querySelector('[data-disabled]')).toBeNull();
  });

  it('gives focus to the gate when the group hides while holding focus', async () => {
    const user = userEvent.setup();
    const { container } = render(<LogoForm />);
    await user.click(screen.getByLabelText('API key'));
    await user.keyboard('{Escape}');
    expect(group(container)).toHaveAttribute('hidden');
    await act(nextFrame);
    expect(gate()).toHaveFocus();
  });

  it('falls back to the element before the group, then main', async () => {
    warnings();
    const Group = ({ isShown }: { isShown: boolean }): ReactElement => (
      <ConditionalFields id="no-gate" isShown={isShown}>
        <input aria-label="Field" />
      </ConditionalFields>
    );
    const before = render(
      <>
        <button type="button">Before</button>
        <button type="button" tabIndex={-1}>
          Not by Tab
        </button>
        <Group isShown />
        <button type="button">After</button>
      </>,
    );
    act(() => {
      screen.getByRole('textbox', { name: 'Field' }).focus();
    });
    before.rerender(
      <>
        <button type="button">Before</button>
        <button type="button" tabIndex={-1}>
          Not by Tab
        </button>
        <Group isShown={false} />
        <button type="button">After</button>
      </>,
    );
    await act(nextFrame);
    expect(screen.getByRole('button', { name: 'Before' })).toHaveFocus();
    before.unmount();

    const alone = render(
      <main tabIndex={-1}>
        <Group isShown />
      </main>,
    );
    act(() => {
      screen.getByRole('textbox', { name: 'Field' }).focus();
    });
    alone.rerender(
      <main tabIndex={-1}>
        <Group isShown={false} />
      </main>,
    );
    await act(nextFrame);
    expect(alone.container.querySelector('main')).toHaveFocus();
  });

  it('moves nothing when the group shows, or hides without focus', async () => {
    const user = userEvent.setup();
    render(<LogoForm after={<button type="button">Elsewhere</button>} />);
    // The reader turns the gate off: focus is on the gate, and stays.
    await user.click(gate());
    await act(nextFrame);
    expect(gate()).toHaveFocus();
    // And on again: the fields follow the gate in the tab order, and focus stays on it.
    await user.click(gate());
    await act(nextFrame);
    expect(gate()).toHaveFocus();
    // Hidden by a key on another control: focus was never in the group, so it stays where it is.
    const elsewhere = screen.getByRole('button', { name: 'Elsewhere' });
    act(() => {
      elsewhere.focus();
    });
    act(() => {
      gate().click();
    });
    await act(nextFrame);
    expect(document.activeElement).toBe(elsewhere);
  });

  it('takes no focus from the body when focus was never in the group', async () => {
    const { rerender } = render(
      <>
        <button type="button" aria-controls="group">
          Gate
        </button>
        <ConditionalFields id="group" isShown>
          <input aria-label="Field" />
        </ConditionalFields>
      </>,
    );
    expect(document.activeElement).toBe(document.body);
    rerender(
      <>
        <button type="button" aria-controls="group">
          Gate
        </button>
        <ConditionalFields id="group" isShown={false}>
          <input aria-label="Field" />
        </ConditionalFields>
      </>,
    );
    await act(nextFrame);
    expect(document.activeElement).toBe(document.body);
  });

  it('cancels its move when the group shows again before the frame', async () => {
    const { rerender } = render(
      <>
        <button type="button" aria-controls="group">
          Gate
        </button>
        <ConditionalFields id="group" isShown>
          <input aria-label="Field" />
        </ConditionalFields>
      </>,
    );
    const field = screen.getByRole('textbox', { name: 'Field' });
    act(() => {
      field.focus();
    });
    for (const isShown of [false, true]) {
      rerender(
        <>
          <button type="button" aria-controls="group">
            Gate
          </button>
          <ConditionalFields id="group" isShown={isShown}>
            <input aria-label="Field" />
          </ConditionalFields>
        </>,
      );
    }
    await act(nextFrame);
    expect(field).toHaveFocus();
  });

  it('moves nothing on the server render or on hydration', async () => {
    const page = (
      <main tabIndex={-1}>
        <button type="button" aria-controls="logo-fields">
          Show bank logos
        </button>
        <ConditionalFields id="logo-fields" isShown={false}>
          <input aria-label="API key" name="logoKey" />
        </ConditionalFields>
      </main>
    );
    const html = renderToString(page);
    expect(html).toContain('hidden=""');
    expect(html).toContain('inert=""');
    expect(html).toContain('disabled=""');
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.append(container);
    const recoverable = vi.fn();
    let hydrated: Root | undefined;
    act(() => {
      hydrated = hydrateRoot(container, page, { onRecoverableError: recoverable });
    });
    await act(nextFrame);
    expect(recoverable).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(document.body);
    act(() => {
      hydrated?.unmount();
    });
    container.remove();
  });

  it('warns once when no gate points at the group', () => {
    const warn = warnings();
    const { rerender } = render(
      <ConditionalFields id="lonely" isShown>
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    rerender(
      <ConditionalFields id="lonely" isShown={false}>
        <input aria-label="Field" />
      </ConditionalFields>,
    );
    expect(warn).toHaveBeenCalledOnce();
    expect(String(warn.mock.calls[0]?.[0])).toContain('aria-controls="lonely"');
  });

  it('does not warn when a gate points at the group among other ids', () => {
    const warn = warnings();
    render(
      <>
        <button type="button" aria-controls="other logo-fields">
          Gate
        </button>
        <ConditionalFields id="logo-fields" isShown>
          <input aria-label="Field" />
        </ConditionalFields>
      </>,
    );
    expect(warn).not.toHaveBeenCalled();
  });

  it("lets the gate's aria-controls reach the switch's input", () => {
    render(
      <Switch isSelected aria-controls="logo-fields">
        Show bank logos
      </Switch>,
    );
    expect(gate()).toHaveAttribute('aria-controls', 'logo-fields');
    expect(gate().tagName).toBe('INPUT');
  });

  /** The weekly email: no field at all, a status line and a button the hidden fieldset disables, unseen. */
  function WeeklyEmail({ isShown }: { isShown: boolean }): ReactElement {
    return (
      <>
        <Switch isSelected={isShown} aria-controls="weekly-email">
          Weekly email
        </Switch>
        <ConditionalFields id="weekly-email" isShown={isShown}>
          <Text>Last sent Monday at 9:00, to you@example.com.</Text>
          <Button variant="secondary">Send a test</Button>
        </ConditionalFields>
      </>
    );
  }

  it("disables the weekly email's button while hidden, and gives it back when shown", () => {
    const { container, rerender } = render(<WeeklyEmail isShown={false} />);
    const button = container.querySelector('button');
    expect(button?.matches(':disabled')).toBe(true);
    rerender(<WeeklyEmail isShown />);
    expect(screen.getByRole('button', { name: 'Send a test' }).matches(':disabled')).toBe(false);
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['shown', <LogoForm key="shown" />],
    ['hidden', <LogoForm key="hidden" defaultShown={false} />],
    [
      'named',
      <form key="named">
        <Switch isSelected aria-controls="named-fields">
          Show bank logos
        </Switch>
        <ConditionalFields id="named-fields" isShown aria-label="Logo provider">
          <TextField label="API key" name="logoKey" />
        </ConditionalFields>
      </form>,
    ],
    ['the weekly email group', <WeeklyEmail key="email" isShown />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });
});
