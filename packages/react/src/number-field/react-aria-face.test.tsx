import { act } from '@testing-library/react';
import { useContext, useMemo, type ReactElement, type ReactNode } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import {
  Button,
  Group,
  I18nProvider,
  Input,
  InputContext,
  Label,
  NumberField,
  ToggleButton,
  type InputProps,
} from 'react-aria-components';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useHydrated } from '../utils/useHydrated';

/*
 * The spike of the plan's Task 1, kept as the record of what NumberField relies on in React Aria 1.22.1, with no
 * wrapper: the server face (ruling 1, spec corrections 1, 2 and 5) and the slot rule (spec correction 7).
 */

const LOCALES = ['en-US', 'de-DE', 'fa-IR'] as const;
const TWO_DIGITS = { minimumFractionDigits: 2, maximumFractionDigits: 2 } as const;

interface FaceInputProps {
  /** The input's text before hydration. */
  face: string;
  /** Sets inputMode in both passes; without it React Aria's platform choice reaches the DOM. */
  inputMode?: InputProps['inputMode'];
}

/** React Aria's input with its context re-provided: no role description, and the face until hydrated. */
function FaceInput({ face, inputMode }: FaceInputProps): ReactElement {
  const context = useContext(InputContext) as InputProps | null;
  const hydrated = useHydrated();
  const own = useMemo(() => {
    const rest = { ...context };
    delete rest['aria-roledescription'];
    return {
      ...rest,
      ...(inputMode === undefined ? {} : { inputMode }),
      ...(hydrated ? {} : { value: face }),
    };
  }, [context, face, hydrated, inputMode]);
  return (
    <InputContext value={own}>
      <Input />
    </InputContext>
  );
}

function Field({ children }: { children: ReactNode }): ReactElement {
  return (
    <NumberField value={-1234.5} formatOptions={TWO_DIGITS} name="amount">
      <Label>Amount</Label>
      <Group>{children}</Group>
    </NumberField>
  );
}

const inLocale = (locale: string, element: ReactElement): string =>
  renderToString(<I18nProvider locale={locale}>{element}</I18nProvider>);

/** Hydrates `html` with `element` on a mocked iPhone and returns the two spies a mismatch would call. */
function hydrateOnIPhone(html: string, element: ReactElement) {
  vi.spyOn(navigator, 'platform', 'get').mockReturnValue('iPhone');
  const container = document.createElement('div');
  container.innerHTML = html;
  document.body.append(container);
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const recoverable = vi.fn();
  let root: Root | undefined;
  act(() => {
    root = hydrateRoot(container, element, { onRecoverableError: recoverable });
  });
  const input = container.querySelector('input:not([type="hidden"])');
  const cleanup = (): void => {
    act(() => {
      root?.unmount();
    });
    container.remove();
  };
  return { consoleError, recoverable, input, cleanup };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('React Aria NumberField, the server face', () => {
  it('writes the input value the app passes over its own formatted text on the server', () => {
    const html = inLocale(
      'de-DE',
      <Field>
        <Input value="-1234.50" />
      </Field>,
    );
    expect(html).toContain('value="-1234.50"');
    expect(html).not.toContain('1.234,50');
    // Its hidden input holds the number as String writes it.
    expect(html).toMatch(/<input type="hidden" name="amount" value="-1234.5"/);
  });

  it('writes one HTML in en-US, de-DE and fa-IR once the input context drops aria-roledescription and sets the value', () => {
    // The control: React Aria's own input differs by locale in its text and its role description.
    const raw = LOCALES.map((locale) =>
      inLocale(
        locale,
        <Field>
          <Input />
        </Field>,
      ),
    );
    expect(new Set(raw).size).toBe(3);
    expect(raw[0]).toContain('aria-roledescription="Number field"');
    expect(raw[1]).toContain('aria-roledescription="Nummernfeld"');

    const faced = LOCALES.map((locale) =>
      inLocale(
        locale,
        <Field>
          <FaceInput face="-1234.50" inputMode="decimal" />
        </Field>,
      ),
    );
    expect(faced[1]).toBe(faced[0]);
    expect(faced[2]).toBe(faced[0]);
    expect(faced[0]).not.toContain('aria-roledescription');
    expect(faced[0]).toContain('value="-1234.50"');
    expect(faced[0]).toContain('inputMode="decimal"');
  });

  it('hydrates that HTML on a mocked iPhone with inputMode set, with no recoverable error and no console error', () => {
    const element = (
      <Field>
        <FaceInput face="-1234.50" inputMode="decimal" />
      </Field>
    );
    const html = renderToString(element);
    const { consoleError, recoverable, input, cleanup } = hydrateOnIPhone(html, element);
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    // From the render after hydration React Aria's own text shows.
    expect(input).toHaveValue('-1,234.50');
    expect(input).toHaveAttribute('inputmode', 'decimal');
    cleanup();
  });

  it('logs an attribute mismatch on a mocked iPhone without the fixed inputMode, which the hydration test catches', () => {
    const element = (
      <Field>
        <FaceInput face="-1234.50" />
      </Field>
    );
    // jsdom's own platform is no phone, so the server's HTML says numeric; an iPhone with negatives says text.
    const html = renderToString(element);
    expect(html).toContain('inputMode="numeric"');
    const { consoleError, recoverable, cleanup } = hydrateOnIPhone(html, element);
    // React 19 never patches an attribute and reports it only through console.error, not as recoverable.
    expect(recoverable).not.toHaveBeenCalled();
    expect(consoleError).toHaveBeenCalled();
    expect(String(consoleError.mock.calls[0]?.[0])).toMatch(/didn't match/);
    cleanup();
  });

  it('throws for a Button with no slot inside a NumberField, and takes a ToggleButton', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(() =>
      renderToString(
        <Field>
          <Button>Negative</Button>
          <Input />
        </Field>,
      ),
    ).toThrow(/A slot prop is required/);
    const html = renderToString(
      <Field>
        <ToggleButton isSelected aria-label="Negative" />
        <Input />
      </Field>,
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('data-selected="true"');
  });
});
