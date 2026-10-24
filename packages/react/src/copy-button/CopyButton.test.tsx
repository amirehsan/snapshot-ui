import { act, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode, type ReactElement } from 'react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { root } from '../../test/dom';
import { DescriptionList, DescriptionListItem } from '../description-list';
import { Dialog } from '../dialog';
import * as library from '../index';
import { CopyButton } from './CopyButton';

/*
 * jsdom has neither the Clipboard API nor the document's copy command, so each test gives the page the ones it
 * needs, as a browser would have them, and takes them away when it ends. The presses are a key down and up on
 * the focused button, which React Aria answers as a keyboard press, as the SaveBar's tests send them.
 */

const ADDRESS = 'https://hooks.example.com/ledger/7Fq2';

/** Puts a Clipboard API with this `writeText` on the page, or takes it away with `undefined`, for one test. */
function clipboard(writeText: ((text: string) => Promise<void>) | undefined): void {
  Object.defineProperty(navigator, 'clipboard', {
    value: writeText ? { writeText } : undefined,
    configurable: true,
  });
  onTestFinished(() => {
    Reflect.deleteProperty(navigator, 'clipboard');
  });
}

/** A copy event as the browser sends one to the page's listeners, its data written by `setData`. */
interface SentCopy {
  setData: ReturnType<typeof vi.fn>;
  defaultPrevented: boolean;
}

/** A copy event as the browser sends one when the reader copies, sent to the page, and what was done with it. */
function sendCopy(): SentCopy {
  const event = new Event('copy', { bubbles: true, cancelable: true });
  const setData = vi.fn();
  Object.defineProperty(event, 'clipboardData', { value: { setData } });
  document.dispatchEvent(event);
  return { setData, defaultPrevented: event.defaultPrevented };
}

/**
 * Gives the document a copy command that sends a copy event, as a browser's does, and answers `answer`. The
 * events it sent are returned, so a test reads what the part put on them. `movesFocus` blurs the focused element
 * first, as an engine whose caret follows the selection does.
 */
function copyCommand(
  answer: boolean,
  { movesFocus = false }: { movesFocus?: boolean } = {},
): { command: ReturnType<typeof vi.fn>; sent: SentCopy[] } {
  const sent: SentCopy[] = [];
  const command = vi.fn((name: string) => {
    if (name !== 'copy') return false;
    if (movesFocus && document.activeElement instanceof HTMLElement) document.activeElement.blur();
    sent.push(sendCopy());
    return answer;
  });
  Object.defineProperty(document, 'execCommand', { value: command, configurable: true });
  onTestFinished(() => {
    Reflect.deleteProperty(document, 'execCommand');
  });
  return { command, sent };
}

/** A promise and the functions that settle it, for a clipboard that answers when the test says. */
function deferred(): { promise: Promise<void>; resolve: () => void; reject: (error: Error) => void } {
  let resolve = (): void => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((done, fail) => {
    resolve = done;
    reject = fail;
  });
  return { promise, resolve, reject };
}

/** The button, named `name`. */
const button = (name = 'Copy webhook address'): HTMLElement => screen.getByRole('button', { name });

/** The part's polite status host. */
function status(container: HTMLElement): HTMLElement {
  const host = container.querySelector<HTMLElement>('.copy-button-status');
  if (!host) throw new Error('No status');
  return host;
}

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

/** Lets the clipboard's promise settle, and React draw what follows. */
async function settle(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

/** Lets `ms` of fake time pass, and React catch up. */
function wait(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

/** The glyph the stylesheet shows: the copy glyph unless the root says copied. */
const shownGlyph = (container: HTMLElement): string =>
  root(container).getAttribute('data-outcome') === 'copied' ? 'check' : 'copy';

/** The open tip, which React Aria portals to the body, or null. */
const tip = (): HTMLElement | null => screen.queryByRole('tooltip');

/** Tab, landing on `element`: a key down makes the keyboard the input, so a tip opens on focus. */
function tabTo(element: HTMLElement): void {
  act(() => {
    fireEvent.keyDown(document.activeElement ?? document.body, { key: 'Tab' });
    element.focus();
  });
}

function Webhook(props: Partial<Parameters<typeof CopyButton>[0]>): ReactElement {
  return <CopyButton value={ADDRESS} labels={{ copy: 'Copy webhook address' }} {...props} />;
}

afterEach(() => {
  // The spies first: a spy on a fake timer function would otherwise put the fake back.
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('CopyButton', () => {
  it.each([['icon'], ['button']] as const)(
    'draws the %s look in a span.copy-button with an empty polite status',
    (look) => {
      const { container } = render(<Webhook look={look} />);
      const part = root(container);
      expect(part.tagName).toBe('SPAN');
      expect(part).toHaveClass('copy-button');
      expect(part).toHaveAttribute('data-look', look);
      expect(part).not.toHaveAttribute('data-outcome');
      const host = status(container);
      expect(host).toHaveAttribute('role', 'status');
      expect(host).toHaveAttribute('aria-live', 'polite');
      // Read whole: the words of one copy are one sentence.
      expect(host).toHaveAttribute('aria-atomic', 'true');
      expect(host).toBeEmptyDOMElement();
      // The status sits beside the button, never inside it, so the button's name is only its own.
      expect(button().contains(host)).toBe(false);
      expect(button()).toHaveClass(look === 'icon' ? 'icon-button' : 'button-secondary');
      // Both glyphs are drawn and hidden; the stylesheet shows one.
      const glyphs = [...container.querySelectorAll('.copy-button-glyph')];
      expect(glyphs.map((glyph) => glyph.getAttribute('data-glyph'))).toEqual(['copy', 'check']);
      for (const glyph of glyphs) expect(glyph).toHaveAttribute('aria-hidden', 'true');
    },
  );

  it('puts className and style on the root, and ref and the rest on the button', () => {
    const ref = createRef<HTMLButtonElement>();
    const { container } = render(
      <Webhook
        className="mine"
        style={{ marginInlineStart: 'auto' }}
        ref={ref}
        data-testid="copy"
        isDisabled
      />,
    );
    expect(root(container)).toHaveClass('copy-button', 'mine');
    // The two that place the part go on the element that is placed, so a style moves the whole part, its status
    // with it.
    expect(root(container)).toHaveStyle({ marginInlineStart: 'auto' });
    expect(button()).not.toHaveAttribute('style');
    expect(ref.current).toBe(button());
    expect(button()).toHaveAttribute('data-testid', 'copy');
    expect(button()).toBeDisabled();
  });

  it('calls writeText with the value during the press', () => {
    const calls: string[] = [];
    clipboard((text) => {
      calls.push(text);
      return Promise.resolve();
    });
    render(<Webhook />);
    press(button());
    // No promise has settled and no timer has run: the call was made inside the press's own handler, a user
    // activation, which Safari requires.
    expect(calls).toEqual([ADDRESS]);
  });

  it.each([
    ['resolves', 'Copied', 'copied'],
    ['rejects', 'Copy failed', 'failed'],
  ] as const)('when writeText %s, says %s and writes data-outcome %s', async (how, words, outcome) => {
    clipboard(() => (how === 'resolves' ? Promise.resolve() : Promise.reject(new Error('denied'))));
    const { container } = render(<Webhook />);
    press(button());
    await settle();
    expect(status(container)).toHaveTextContent(words);
    expect(root(container)).toHaveAttribute('data-outcome', outcome);
    expect(shownGlyph(container)).toBe(how === 'resolves' ? 'check' : 'copy');
  });

  it('fails when the Clipboard API is missing and the copy command is too', () => {
    clipboard(undefined);
    const onCopy = vi.fn();
    const { container } = render(<Webhook onCopy={onCopy} />);
    press(button());
    expect(status(container)).toHaveTextContent('Copy failed');
    expect(root(container)).toHaveAttribute('data-outcome', 'failed');
    expect(onCopy).toHaveBeenCalledWith(false);
  });

  it("copies by the document's copy command where the Clipboard API is missing, and keeps focus", () => {
    clipboard(undefined);
    const { command, sent } = copyCommand(true);
    // A selection the reader had made elsewhere on the page is put back after the copy.
    const elsewhere = document.createElement('p');
    elsewhere.textContent = 'Selected before';
    document.body.append(elsewhere);
    onTestFinished(() => {
      elsewhere.remove();
    });
    const onCopy = vi.fn();
    const { container } = render(<Webhook onCopy={onCopy} />);
    const named = button();
    act(() => {
      named.focus();
    });
    // Selected after the focus, which collapses jsdom's selection, as no browser does.
    const before = document.createRange();
    before.selectNodeContents(elsewhere);
    document.getSelection()?.removeAllRanges();
    document.getSelection()?.addRange(before);
    act(() => {
      fireEvent.keyDown(named, { key: 'Enter' });
      fireEvent.keyUp(named, { key: 'Enter' });
    });
    expect(command).toHaveBeenCalledWith('copy');
    // The copy event carries the value as plain text, and nothing of the page's markup.
    expect(sent).toHaveLength(1);
    expect(sent[0]?.setData).toHaveBeenCalledWith('text/plain', ADDRESS);
    expect(sent[0]?.defaultPrevented).toBe(true);
    expect(status(container)).toHaveTextContent('Copied');
    expect(onCopy).toHaveBeenCalledWith(true);
    // The text it selected for the command is gone, the reader's selection is back, and focus never left.
    expect(container.querySelector('.copy-button-source')).toBeNull();
    const selection = document.getSelection();
    expect(selection?.rangeCount).toBe(1);
    expect(selection?.getRangeAt(0).toString()).toBe('Selected before');
    expect(button()).toHaveFocus();
  });

  it('leaves the copy event alone once its copy is done, so the reader copies their own text after it', () => {
    clipboard(undefined);
    copyCommand(true);
    const { container } = render(<Webhook />);
    press(button());
    expect(status(container)).toHaveTextContent('Copied');
    const own = sendCopy();
    expect(own.setData).not.toHaveBeenCalled();
    expect(own.defaultPrevented).toBe(false);
  });

  it('puts focus back on the button where the selection took it, as caret browsing does', () => {
    clipboard(undefined);
    const { command } = copyCommand(true, { movesFocus: true });
    render(<Webhook />);
    press(button());
    expect(command).toHaveBeenCalledWith('copy');
    expect(button()).toHaveFocus();
  });

  it('falls back to the copy command when writeText rejects', async () => {
    clipboard(() => Promise.reject(new Error('blocked by a permissions policy')));
    const { sent } = copyCommand(true);
    const { container } = render(<Webhook />);
    press(button());
    await settle();
    expect(sent[0]?.setData).toHaveBeenCalledWith('text/plain', ADDRESS);
    expect(status(container)).toHaveTextContent('Copied');
    expect(button()).toHaveFocus();
  });

  it('fails when writeText rejects and the copy command does not copy', async () => {
    clipboard(() => Promise.reject(new Error('denied')));
    copyCommand(false);
    const { container } = render(<Webhook />);
    press(button());
    await settle();
    expect(status(container)).toHaveTextContent('Copy failed');
  });

  it('fails, and does not throw, when writeText throws', async () => {
    clipboard(() => {
      throw new Error('not allowed');
    });
    const { container } = render(<Webhook />);
    press(button());
    await settle();
    expect(status(container)).toHaveTextContent('Copy failed');
  });

  it('clears the outcome and the status after two seconds, and a second press restarts the hold', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    const { container } = render(<Webhook />);
    press(button());
    await settle();
    expect(status(container)).toHaveTextContent('Copied');
    wait(1500);
    press(button());
    await settle();
    wait(1500);
    // 3000ms after the first press, 1500 after the second: still held.
    expect(status(container)).toHaveTextContent('Copied');
    expect(root(container)).toHaveAttribute('data-outcome', 'copied');
    wait(499);
    expect(status(container)).toHaveTextContent('Copied');
    wait(1);
    expect(status(container)).toBeEmptyDOMElement();
    expect(root(container)).not.toHaveAttribute('data-outcome');
    expect(shownGlyph(container)).toBe('copy');
  });

  it('says each copy once: one sentence in the status, a new one for a second copy', async () => {
    clipboard(() => Promise.resolve());
    const { container } = render(<Webhook />);
    press(button());
    await settle();
    const first = status(container).firstChild;
    expect(status(container).childNodes).toHaveLength(1);
    expect(status(container).textContent).toBe('Copied');
    press(button());
    await settle();
    // The same words, written again as a new node, so a screen reader hears the second copy too, once.
    expect(status(container).childNodes).toHaveLength(1);
    expect(status(container).textContent).toBe('Copied');
    expect(status(container).firstChild).not.toBe(first);
  });

  it('says it once under StrictMode', async () => {
    clipboard(() => Promise.resolve());
    const onCopy = vi.fn();
    const { container } = render(
      <StrictMode>
        <Webhook onCopy={onCopy} />
      </StrictMode>,
    );
    press(button());
    await settle();
    expect(status(container).textContent).toBe('Copied');
    expect(onCopy).toHaveBeenCalledTimes(1);
  });

  it('ignores an earlier copy that settles after a later one', async () => {
    const slow = deferred();
    const answers = [slow.promise, Promise.resolve()];
    clipboard(() => answers.shift() ?? Promise.resolve());
    const onCopy = vi.fn();
    const { container } = render(<Webhook onCopy={onCopy} />);
    press(button());
    press(button());
    await settle();
    expect(status(container)).toHaveTextContent('Copied');
    slow.reject(new Error('late'));
    await settle();
    // The later copy's outcome stands; the app still hears about both.
    expect(status(container)).toHaveTextContent('Copied');
    expect(onCopy.mock.calls).toEqual([[true], [false]]);
  });

  it('runs no copy command for a refused copy that a later copy has superseded', async () => {
    const slow = deferred();
    const answers = [slow.promise, Promise.resolve()];
    clipboard(() => answers.shift() ?? Promise.resolve());
    const { command } = copyCommand(true);
    const onCopy = vi.fn();
    const { container, rerender } = render(<Webhook value="The old address" onCopy={onCopy} />);
    press(button());
    rerender(<Webhook value={ADDRESS} onCopy={onCopy} />);
    press(button());
    await settle();
    slow.reject(new Error('late'));
    await settle();
    // The later copy wrote the clipboard; the refused earlier one must not write its old value over it.
    expect(command).not.toHaveBeenCalled();
    expect(status(container)).toHaveTextContent('Copied');
    expect(onCopy.mock.calls).toEqual([[true], [false]]);
  });

  it('runs no copy command for a refused copy that settles after the part has left', async () => {
    const late = deferred();
    clipboard(() => late.promise);
    const { command } = copyCommand(true);
    const onCopy = vi.fn();
    const { unmount } = render(<Webhook onCopy={onCopy} />);
    press(button());
    unmount();
    late.reject(new Error('late'));
    await settle();
    // Nothing of the part is left to select from, and the page's selection is the reader's.
    expect(command).not.toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledWith(false);
  });

  it("keeps the button's name through every outcome", async () => {
    vi.useFakeTimers();
    const answers = [() => Promise.resolve(), () => Promise.reject(new Error('denied'))];
    clipboard(() => (answers.shift() ?? (() => Promise.resolve()))());
    render(<Webhook />);
    const named = button();
    press(named);
    await settle();
    expect(named).toHaveAccessibleName('Copy webhook address');
    press(named);
    await settle();
    expect(named).toHaveAccessibleName('Copy webhook address');
    wait(2000);
    expect(named).toHaveAccessibleName('Copy webhook address');
    expect(named).toHaveFocus();
  });

  it('keeps focus on the button through a copy and after the hold', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    render(<Webhook look="button" />);
    const named = button();
    press(named);
    await settle();
    expect(named).toHaveFocus();
    wait(2000);
    expect(named).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });

  it('shows the outcome in the tooltip while it holds, and the name at rest', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    render(<Webhook />);
    const named = button();
    tabTo(named);
    expect(tip()).toHaveTextContent('Copy webhook address');
    act(() => {
      fireEvent.keyDown(named, { key: 'Enter' });
      fireEvent.keyUp(named, { key: 'Enter' });
    });
    await settle();
    expect(tip()).toHaveTextContent('Copied');
    // The status says it; the tip shows it without saying it again as the button's description.
    expect(named).toHaveAccessibleDescription('');
    wait(2000);
    expect(tip()).toBeNull();
    // Back at rest, focus coming to it again shows its name.
    act(() => {
      named.blur();
    });
    tabTo(named);
    expect(tip()).toHaveTextContent('Copy webhook address');
  });

  it('keeps its name tip shut while the outcome tip holds, so a pointer that comes back shows one tip', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    render(<Webhook />);
    const named = button();
    press(named);
    await settle();
    expect(tip()).toHaveTextContent('Copied');
    // A mouse that leaves the button and comes back over it, past the tip's delay.
    act(() => {
      fireEvent.pointerMove(document.body, { pointerType: 'mouse' });
      fireEvent.pointerLeave(named, { pointerType: 'mouse' });
      fireEvent.pointerEnter(named, { pointerType: 'mouse' });
    });
    wait(1000);
    expect(screen.getAllByRole('tooltip')).toHaveLength(1);
    expect(tip()).toHaveTextContent('Copied');
  });

  it('shows the outcome in a tip for the word look too, which has none at rest', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.reject(new Error('denied')));
    render(<Webhook look="button" labels={{ copy: 'Copy setup details' }} />);
    const named = button('Copy setup details');
    tabTo(named);
    expect(tip()).toBeNull();
    press(named);
    await settle();
    expect(tip()).toHaveTextContent('Copy failed');
    wait(2000);
    expect(tip()).toBeNull();
  });

  it('closes the outcome tip on Escape and keeps the outcome', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    const { container } = render(<Webhook />);
    const named = button();
    press(named);
    await settle();
    expect(tip()).toHaveTextContent('Copied');
    act(() => {
      fireEvent.keyDown(named, { key: 'Escape' });
    });
    expect(tip()).toBeNull();
    expect(status(container)).toHaveTextContent('Copied');
    expect(named).toHaveFocus();
  });

  it('takes the Escape that closes its outcome tip, so a dialog around it stays open until the next', async () => {
    clipboard(() => Promise.resolve());
    const onOpenChange = vi.fn();
    render(
      <Dialog title="Webhook" isOpen onOpenChange={onOpenChange}>
        <Webhook />
      </Dialog>,
    );
    // The modal Dialog hides the tip's portal from the accessibility tree, so the tip is found by its role in the
    // DOM: it is for the eye, and the status says the outcome.
    const shownTip = (): Element | null => document.querySelector('[role="tooltip"]');
    const named = button();
    press(named);
    await settle();
    expect(shownTip()).toHaveTextContent('Copied');
    act(() => {
      fireEvent.keyDown(named, { key: 'Escape' });
    });
    // One Escape closes one thing, the tip, as React Aria's own tips take it.
    expect(shownTip()).toBeNull();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(named).toHaveFocus();
    act(() => {
      fireEvent.keyDown(named, { key: 'Escape' });
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes the outcome tip when focus leaves the button', async () => {
    clipboard(() => Promise.resolve());
    render(
      <>
        <Webhook />
        <button type="button">Next</button>
      </>,
    );
    press(button());
    await settle();
    expect(tip()).toHaveTextContent('Copied');
    act(() => {
      screen.getByRole('button', { name: 'Next' }).focus();
    });
    expect(tip()).toBeNull();
  });

  it('has no axe violations on the page with the outcome tip open', async () => {
    clipboard(() => Promise.resolve());
    render(<Webhook />);
    press(button());
    await settle();
    expect(tip()).toHaveTextContent('Copied');
    await expectNoA11yViolations(document.body);
  });

  it('calls onCopy with whether it worked', async () => {
    const answers = [() => Promise.resolve(), () => Promise.reject(new Error('denied'))];
    clipboard(() => (answers.shift() ?? (() => Promise.resolve()))());
    const onCopy = vi.fn();
    render(<Webhook onCopy={onCopy} />);
    press(button());
    await settle();
    press(button());
    await settle();
    expect(onCopy.mock.calls).toEqual([[true], [false]]);
  });

  it('clears its timer on unmount', async () => {
    vi.useFakeTimers();
    clipboard(() => Promise.resolve());
    const set = vi.spyOn(window, 'setTimeout');
    const clear = vi.spyOn(window, 'clearTimeout');
    const { unmount } = render(<Webhook />);
    press(button());
    await settle();
    const at = set.mock.calls.findIndex(([, delay]) => delay === 2000);
    expect(at).toBeGreaterThanOrEqual(0);
    const hold = set.mock.results[at]?.value as unknown;
    unmount();
    expect(clear).toHaveBeenCalledWith(hold);
  });

  it('starts no timer for a copy that settles after it has left', async () => {
    vi.useFakeTimers();
    const late = deferred();
    clipboard(() => late.promise);
    const set = vi.spyOn(window, 'setTimeout');
    const onCopy = vi.fn();
    const { unmount } = render(<Webhook onCopy={onCopy} />);
    press(button());
    unmount();
    late.resolve();
    await settle();
    expect(set.mock.calls.filter(([, delay]) => delay === 2000)).toEqual([]);
    // The copy happened, so the app still hears it.
    expect(onCopy).toHaveBeenCalledWith(true);
  });

  it('warns once when its status speaks inside an aria-busy ancestor', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    clipboard(() => Promise.resolve());
    render(
      <div aria-busy="true">
        <Webhook />
      </div>,
    );
    expect(warn).not.toHaveBeenCalled();
    press(button());
    await settle();
    press(button());
    await settle();
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toBe(
      'A CopyButton is inside aria-busy="true", so a screen reader may not say its status: move it out of the busy part.',
    );
  });

  it('does not warn outside an aria-busy ancestor, or under aria-busy="false"', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    clipboard(() => Promise.resolve());
    render(
      <div aria-busy="false">
        <Webhook />
      </div>,
    );
    press(button());
    await settle();
    expect(warn).not.toHaveBeenCalled();
  });

  it('takes labels, and a name that says what it copies', async () => {
    clipboard(() => Promise.reject(new Error('denied')));
    const { container } = render(
      <CopyButton value="The answer" labels={{ copy: 'Copy answer', failed: 'Nothing was copied' }} />,
    );
    const named = button('Copy answer');
    press(named);
    await settle();
    expect(status(container)).toHaveTextContent('Nothing was copied');
  });

  it("names itself Copy by default, and says Copied and Copy failed in the library's words", async () => {
    clipboard(() => Promise.resolve());
    const { container } = render(<CopyButton value="x" />);
    press(button('Copy'));
    await settle();
    expect(status(container)).toHaveTextContent('Copied');
  });

  it('reads nothing from the clipboard or navigator until a press', () => {
    const read = vi.fn(() => ({ writeText: () => Promise.resolve() }));
    Object.defineProperty(navigator, 'clipboard', { get: read, configurable: true });
    onTestFinished(() => {
      Reflect.deleteProperty(navigator, 'clipboard');
    });
    render(<Webhook />);
    expect(read).not.toHaveBeenCalled();
    press(button());
    expect(read).toHaveBeenCalled();
  });

  it('is exported from the package index', () => {
    expect(library).toHaveProperty('CopyButton');
  });

  const AXE_CASES: [name: string, element: ReactElement, copy: boolean][] = [
    ['icon at rest', <Webhook key="icon" />, false],
    ['button at rest', <Webhook key="button" look="button" labels={{ copy: 'Copy setup details' }} />, false],
    ['icon after a copy', <Webhook key="copied" />, true],
    [
      "in a DescriptionList row's actions",
      <DescriptionList key="list">
        <DescriptionListItem
          term="Setup address"
          actions={<CopyButton value={ADDRESS} labels={{ copy: 'Copy Setup address' }} />}
        >
          {ADDRESS}
        </DescriptionListItem>
      </DescriptionList>,
      false,
    ],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element, copy) => {
    clipboard(() => Promise.resolve());
    const { container } = render(element);
    if (copy) {
      press(screen.getByRole('button'));
      await settle();
      expect(status(container)).toHaveTextContent('Copied');
    }
    await expectNoA11yViolations(container);
  });

  it('requires a value, and takes no children and no onPress, in its types', () => {
    // Each @ts-expect-error line below fails `pnpm typecheck` if the type stops refusing it.
    // @ts-expect-error a copy button copies a value
    const valueless = <CopyButton />;
    // @ts-expect-error its words are labels, not children
    const worded = <CopyButton value="x">Copy</CopyButton>;
    // @ts-expect-error the press is the copy; onCopy says how it went
    const pressed = <CopyButton value="x" onPress={() => undefined} />;
    expect(valueless).toBeTruthy();
    expect(worded).toBeTruthy();
    expect(pressed).toBeTruthy();
  });
});
