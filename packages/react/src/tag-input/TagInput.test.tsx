import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef, useState, type ReactElement } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '../../test/a11y';
import { formOf } from '../../test/dom';
import { Dialog } from '../dialog';
import { QUIET_MS } from '../utils/quiet';
import { domainPreset, emailPreset, pathPreset } from './presets';
import { TagInput, type TagInputProps } from './TagInput';

const ANA = 'ana@example.com';
const BO = 'bo@example.com';
const CY = 'cy@example.com';

/** An invite field, as the sharing form draws it. */
function Invite(props: Partial<TagInputProps>): ReactElement {
  return (
    <TagInput
      label="Invite people"
      description="Separate addresses with commas or spaces."
      preset={emailPreset}
      {...(props as object)}
    />
  );
}

const box = (): HTMLInputElement => screen.getByRole('textbox');
const tagTexts = (container: HTMLElement): string[] =>
  [...container.querySelectorAll('.tag-input-tag-text')].map((text) => text.textContent);
const tag = (text: string): HTMLElement => screen.getByRole('row', { name: text });
const errorLine = (container: HTMLElement): Element | null => container.querySelector('.field-error');
const status = (container: HTMLElement): Element => {
  const host = container.querySelector('.tag-input-status');
  if (!host) throw new Error('No status host');
  return host;
};

/** Runs the frame a focus move waits for. */
const nextFrame = async (): Promise<void> => {
  await act(async () => {
    await new Promise((resolve) => requestAnimationFrame(resolve));
  });
};

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('TagInput', () => {
  it('draws the field, the frame with its tags and box, the hint, and an empty status host in order', () => {
    const { container } = render(<Invite defaultValue={[ANA, BO]} name="invite" maxValues={10} />);
    const field = container.firstElementChild;
    expect(field).toHaveClass('field', 'tag-input');
    expect([...(field?.children ?? [])].map((child) => child.className || child.tagName)).toEqual([
      'field-head',
      'input tag-input-control',
      'field-description',
      'INPUT',
      'INPUT',
      'tag-input-status',
    ]);
    const frame = container.querySelector('.tag-input-control');
    expect(frame?.lastElementChild).toBe(box());
    expect(tagTexts(container)).toEqual([ANA, BO]);
    expect(container.querySelector('.field-head .field-counter')).toHaveTextContent('2/10');
    expect(status(container)).toHaveAttribute('role', 'status');
    expect(status(container)).toHaveAttribute('aria-live', 'polite');
    expect(status(container)).toBeEmptyDOMElement();
  });

  it.each([['{Enter}'], [','], [';'], [' ']])('adds an email ended by %s', async (key) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Invite onChange={onChange} />);
    await user.type(box(), `${ANA}${key}`);
    expect(tagTexts(container)).toEqual([ANA]);
    expect(onChange).toHaveBeenLastCalledWith([ANA]);
    expect(box()).toHaveValue('');
  });

  it('commits a value whose delimiter arrives in an input event with no keydown, the Android path', () => {
    const { container } = render(<Invite />);
    fireEvent.change(box(), { target: { value: `${ANA},` } });
    expect(tagTexts(container)).toEqual([ANA]);
    expect(box()).toHaveValue('');
  });

  it('commits nothing while composing, and splits the text when the composition ends', () => {
    const { container } = render(<Invite />);
    fireEvent.compositionStart(box());
    fireEvent.change(box(), { target: { value: `${ANA},` } });
    expect(tagTexts(container)).toEqual([]);
    expect(box()).toHaveValue(`${ANA},`);
    fireEvent.keyDown(box(), { key: 'Enter', isComposing: true });
    expect(tagTexts(container)).toEqual([]);
    fireEvent.compositionEnd(box());
    expect(tagTexts(container)).toEqual([ANA]);
    expect(box()).toHaveValue('');
  });

  it('leaves Enter to the input method while isComposing or keyCode is 229', () => {
    const { container } = render(<Invite defaultInputValue={ANA} />);
    expect(fireEvent.keyDown(box(), { key: 'Enter', isComposing: true })).toBe(true);
    expect(fireEvent.keyDown(box(), { key: 'Enter', keyCode: 229 })).toBe(true);
    expect(tagTexts(container)).toEqual([]);
    // A plain Enter is the field's: it adds and is prevented, so no form submits.
    expect(fireEvent.keyDown(box(), { key: 'Enter' })).toBe(false);
    expect(tagTexts(container)).toEqual([ANA]);
  });

  it('splits a paste holding a delimiter or a new line at once, and leaves a single pasted value in the box', async () => {
    const user = userEvent.setup();
    const { container } = render(<Invite />);
    await user.click(box());
    await user.paste(`${ANA}, ${BO}\n${CY}`);
    expect(tagTexts(container)).toEqual([ANA, BO, CY]);
    expect(box()).toHaveValue('');
    await user.paste('dee@example.com');
    expect(tagTexts(container)).toHaveLength(3);
    expect(box()).toHaveValue('dee@example.com');
  });

  it('keeps refused text in the box joined by the preset join, with the error line and a custom validity, until the text changes', async () => {
    const user = userEvent.setup();
    const { container } = render(<Invite />);
    await user.click(box());
    await user.paste(`ana@example, ${BO}`);
    // The paste ends with no delimiter after bo, so Enter commits the rest.
    await user.keyboard('{Enter}');
    expect(tagTexts(container)).toEqual([BO]);
    expect(box()).toHaveValue('ana@example');
    expect(errorLine(container)).toHaveTextContent(
      'Enter email addresses in the correct format, like name@example.com',
    );
    expect(container.firstElementChild).toHaveAttribute('data-invalid');
    expect(box().validity.customError).toBe(true);
    expect(box().validationMessage).toBe(
      'Enter email addresses in the correct format, like name@example.com',
    );
    expect(box()).toHaveAttribute(
      'aria-describedby',
      expect.stringContaining(errorLine(container)?.id ?? '-'),
    );
    await user.type(box(), '.com');
    expect(errorLine(container)).toBeNull();
    expect(box().validity.valid).toBe(true);
    await user.keyboard('{Enter}');
    expect(tagTexts(container)).toEqual([BO, ANA]);
  });

  it("says the preset's words for refused text and the limit's for the limit, over the app's errorMessage", async () => {
    const user = userEvent.setup();
    const { container } = render(<Invite errorMessage="Check the addresses" maxValues={1} />);
    await user.type(box(), 'nope{Enter}');
    expect(errorLine(container)).toHaveTextContent(
      /^Enter email addresses in the correct format, like name@example\.com$/,
    );
    await user.clear(box());
    await user.type(box(), `${ANA}, ${BO}{Enter}`);
    expect(errorLine(container)).toHaveTextContent(/^You can add up to 1$/);
  });

  it('keeps several refused candidates in their order, joined by the join', async () => {
    const user = userEvent.setup();
    render(<Invite />);
    await user.click(box());
    await user.paste(`nope, ${ANA}, also-nope`);
    await user.keyboard('{Enter}');
    expect(box()).toHaveValue('nope, also-nope');
  });

  it('drops a duplicate, keeps the tag it matched where it was, and says so', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const { container } = render(<Invite defaultValue={[ANA, BO]} />);
    await user.type(box(), 'Ana@Example.com{Enter}');
    expect(tagTexts(container)).toEqual([ANA, BO]);
    expect(box()).toHaveValue('');
    expect(errorLine(container)).toBeNull();
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status(container)).toHaveTextContent('Ana@example.com is already added');
  });

  it('stops at maxValues, says so in the error line and counts against it', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Invite defaultValue={[ANA]} maxValues={2} onChange={onChange} />);
    expect(container.querySelector('.field-counter')).toHaveTextContent('1/2');
    await user.click(box());
    await user.paste(`${BO}, ${CY}`);
    await user.keyboard('{Enter}');
    expect(tagTexts(container)).toEqual([ANA, BO]);
    expect(onChange).toHaveBeenLastCalledWith([ANA, BO]);
    expect(box()).toHaveValue(CY);
    expect(errorLine(container)).toHaveTextContent('You can add up to 2');
    expect(container.querySelector('.field-counter')).toHaveTextContent('2/2');
    // The count never blocks typing.
    await user.type(box(), 'x');
    expect(box()).toHaveValue(`${CY}x`);
  });

  it('takes the last tag back on Backspace in an empty box, once per press', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container } = render(<Invite defaultValue={[ANA, BO]} onChange={onChange} />);
    await user.click(box());
    await user.keyboard('{Backspace}');
    expect(tagTexts(container)).toEqual([ANA]);
    expect(onChange).toHaveBeenLastCalledWith([ANA]);
    expect(box()).toHaveValue(BO);
    // A held key's repeats take back nothing more.
    fireEvent.change(box(), { target: { value: '' } });
    fireEvent.keyDown(box(), { key: 'Backspace', repeat: true });
    expect(tagTexts(container)).toEqual([ANA]);
    await nextFrame();
    expect(box()).toHaveFocus();
  });

  it('takes a tag back on Enter and removes it on Backspace or Delete', async () => {
    const user = userEvent.setup();
    const { container } = render(<Invite defaultValue={[ANA, BO, CY]} />);
    await user.tab();
    expect(tag(ANA)).toHaveFocus();
    await user.keyboard('{ArrowRight}{Enter}');
    expect(tagTexts(container)).toEqual([ANA, CY]);
    expect(box()).toHaveValue(BO);
    await nextFrame();
    expect(box()).toHaveFocus();
    expect(box().selectionStart).toBe(BO.length);
    await user.tab({ shift: true });
    await user.keyboard('{Delete}');
    await nextFrame();
    expect(tagTexts(container)).toHaveLength(1);
    expect(document.activeElement).toHaveClass('tag-input-tag');
    await user.keyboard('{Backspace}');
    await nextFrame();
    expect(tagTexts(container)).toEqual([]);
    expect(box()).toHaveFocus();
  });

  it.each([['Delete'], ['Backspace']])(
    'removes one tag per press of %s held on a tag, never the next',
    async (key) => {
      const user = userEvent.setup();
      const onChange = vi.fn();
      const { container } = render(<Invite defaultValue={[ANA, BO, CY]} onChange={onChange} />);
      await user.tab();
      expect(tag(ANA)).toHaveFocus();
      fireEvent.keyDown(tag(ANA), { key });
      expect(tagTexts(container)).toEqual([BO, CY]);
      expect(tag(BO)).toHaveFocus();
      // The held key's repeats land on the tag that took focus, and remove nothing more.
      fireEvent.keyDown(tag(BO), { key, repeat: true });
      fireEvent.keyDown(tag(BO), { key, repeat: true });
      expect(tagTexts(container)).toEqual([BO, CY]);
      expect(onChange).toHaveBeenCalledTimes(1);
      fireEvent.keyUp(tag(BO), { key });
      fireEvent.keyDown(tag(BO), { key });
      expect(tagTexts(container)).toEqual([CY]);
    },
  );

  it('names each remove button by its tag and removes the tag by a press', async () => {
    const user = userEvent.setup();
    const { container } = render(<Invite defaultValue={[ANA, BO]} />);
    await user.click(screen.getByRole('button', { name: `Remove ${ANA}` }));
    expect(tagTexts(container)).toEqual([BO]);
    await nextFrame();
    expect(tag(BO)).toHaveFocus();
  });

  it('commits valid text on blur out of the frame, not on focus moving to a tag, and not with commitsOnBlur false', async () => {
    const user = userEvent.setup();
    const { container, unmount } = render(
      <>
        <Invite defaultValue={[ANA]} />
        <button type="button">Save</button>
      </>,
    );
    await user.type(box(), BO);
    await user.tab({ shift: true });
    expect(tag(ANA)).toHaveFocus();
    expect(tagTexts(container)).toEqual([ANA]);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(tagTexts(container)).toEqual([ANA, BO]);
    expect(screen.getByRole('button', { name: 'Save' })).toHaveFocus();
    unmount();
    const off = render(
      <>
        <Invite commitsOnBlur={false} />
        <button type="button">Save</button>
      </>,
    );
    await user.type(box(), BO);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(tagTexts(off.container)).toEqual([]);
    expect(box()).toHaveValue(BO);
  });

  it('keeps refused text with its error on blur', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <Invite />
        <button type="button">Save</button>
      </>,
    );
    await user.type(box(), 'ana@example');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(box()).toHaveValue('ana@example');
    expect(errorLine(container)).toHaveTextContent('Enter email addresses');
  });

  it('clears the text on Escape and keeps a surrounding Dialog open, and lets Escape through from an empty box', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(
      <Dialog title="Share" isOpen onOpenChange={onOpenChange}>
        <Invite />
      </Dialog>,
    );
    await user.type(box(), 'ana@exa');
    await user.keyboard('{Escape}');
    expect(box()).toHaveValue('');
    expect(onOpenChange).not.toHaveBeenCalled();
    await user.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('leaves Escape to the input method while isComposing or keyCode is 229, and keeps the text', () => {
    render(<Invite />);
    fireEvent.compositionStart(box());
    fireEvent.change(box(), { target: { value: 'ana' } });
    fireEvent.keyDown(box(), { key: 'Escape', isComposing: true });
    fireEvent.keyDown(box(), { key: 'Escape', keyCode: 229 });
    expect(box()).toHaveValue('ana');
  });

  it('writes one hidden input per value, one empty value when there are none, and form on each', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <>
        <form id="share" />
        <Invite name="invite" form="share" defaultValue={[ANA, BO]} />
      </>,
    );
    const form = formOf(container);
    expect(new FormData(form).getAll('invite')).toEqual([ANA, BO]);
    const hidden = container.querySelectorAll('input[type="hidden"]');
    for (const input of hidden) expect(input).toHaveAttribute('form', 'share');
    // The box has no name: typed text is never submitted.
    expect(box()).not.toHaveAttribute('name');
    await user.click(screen.getByRole('button', { name: `Remove ${ANA}` }));
    await user.click(screen.getByRole('button', { name: `Remove ${BO}` }));
    expect(new FormData(form).getAll('invite')).toEqual(['']);
  });

  it('resets to the first value and clears the text and the error on a form reset', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <form>
        <Invite name="invite" defaultValue={[ANA]} />
        <button type="reset">Reset</button>
      </form>,
    );
    await user.type(box(), `${BO},nope{Enter}`);
    expect(tagTexts(container)).toEqual([ANA, BO]);
    expect(errorLine(container)).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Reset' }));
    expect(tagTexts(container)).toEqual([ANA]);
    expect(box()).toHaveValue('');
    expect(errorLine(container)).toBeNull();
    expect(new FormData(formOf(container)).getAll('invite')).toEqual([ANA]);
  });

  it.each([['native'], ['aria']] as const)(
    'stops an empty required list with the native required, and lets a list with values submit, in %s validation',
    async (behavior) => {
      const user = userEvent.setup();
      const onSubmit = vi.fn((event: SubmitEvent) => {
        event.preventDefault();
      });
      const { container } = render(
        <form>
          <Invite name="invite" isRequired validationBehavior={behavior} />
          <button type="submit">Send</button>
        </form>,
      );
      formOf(container).addEventListener('submit', onSubmit);
      expect(box()).toHaveAttribute('aria-required', 'true');
      if (behavior === 'native') {
        expect(box()).toBeRequired();
        await user.click(screen.getByRole('button', { name: 'Send' }));
        expect(onSubmit).not.toHaveBeenCalled();
        expect(box()).toHaveFocus();
        expect(container.firstElementChild?.firstElementChild).not.toBeNull();
      } else {
        expect(box()).not.toHaveAttribute('required');
      }
      await user.type(box(), `${ANA}{Enter}`);
      expect(box()).not.toHaveAttribute('required');
      expect(box()).toHaveAttribute('aria-required', 'true');
      await user.click(screen.getByRole('button', { name: 'Send' }));
      expect(onSubmit).toHaveBeenCalledTimes(1);
    },
  );

  it('blocks a submit while refused text sits in the box', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: SubmitEvent) => {
      event.preventDefault();
    });
    const { container } = render(
      <form>
        <Invite name="invite" />
        <button type="submit">Send</button>
      </form>,
    );
    formOf(container).addEventListener('submit', onSubmit);
    await user.type(box(), 'nope{Enter}');
    await user.click(screen.getByRole('button', { name: 'Send' }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('runs validate on the whole list and draws isInvalid', async () => {
    const user = userEvent.setup();
    const validate = vi.fn((list: readonly string[]) =>
      list.length > 1 ? 'Invite one person at a time' : null,
    );
    const { container } = render(
      <form>
        <Invite validate={validate} defaultValue={[ANA]} validationBehavior="aria" />
      </form>,
    );
    expect(validate).toHaveBeenLastCalledWith([ANA]);
    expect(errorLine(container)).toBeNull();
    await user.type(box(), `${BO}{Enter}`);
    expect(validate).toHaveBeenLastCalledWith([ANA, BO]);
    expect(errorLine(container)).toHaveTextContent('Invite one person at a time');
    const forced = render(<Invite isInvalid errorMessage="Check the addresses" />);
    expect(forced.container.firstElementChild).toHaveAttribute('data-invalid');
    expect(forced.container.querySelector('.field-error')).toHaveTextContent('Check the addresses');
  });

  it('says added values, duplicates, take-backs and removals once per QUIET_MS', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: (ms) => vi.advanceTimersByTime(ms) });
    const { container } = render(<Invite defaultValue={[ANA]} />);
    await user.click(box());
    await user.paste(`${BO}, ${CY}, dee@example.com,`);
    expect(status(container)).toBeEmptyDOMElement();
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status(container)).toHaveTextContent(/^Added 3$/);
    await user.type(box(), `${ANA},`);
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status(container)).toHaveTextContent(`${ANA} is already added`);
    await user.keyboard('{Backspace}');
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status(container)).toHaveTextContent('Editing dee@example.com');
    await user.keyboard('{Enter}');
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status(container)).toHaveTextContent(/^Added dee@example\.com$/);
    await user.click(screen.getByRole('button', { name: `Remove ${BO}` }));
    act(() => {
      vi.advanceTimersByTime(QUIET_MS);
    });
    expect(status(container)).toHaveTextContent(`Removed ${BO}`);
    // One node per sentence, so the same words twice are said twice.
    expect(status(container).children).toHaveLength(1);
  });

  it('draws the Changed chip and the changed edge, and the changed mark when unlabelled', () => {
    const { container } = render(<Invite isChanged defaultValue={[ANA]} />);
    expect(container.firstElementChild).toHaveAttribute('data-changed');
    const chip = container.querySelector('.field-changed');
    expect(chip).toHaveTextContent('Changed');
    expect(box().getAttribute('aria-describedby')?.split(' ')).toContain(chip?.id);
    const unlabelled = render(
      <TagInput
        aria-label="Allowed domains"
        preset={domainPreset}
        isChanged
        defaultValue={['example.com']}
      />,
    );
    const root = unlabelled.container.firstElementChild;
    expect(root).toHaveAttribute('data-unlabelled');
    const mark = unlabelled.container.querySelector('.tag-input-control > .field-changed-mark');
    expect(mark).toHaveTextContent('Changed');
    expect(within(unlabelled.container).getByRole('textbox').getAttribute('aria-describedby')).toContain(
      mark?.id,
    );
  });

  it('keeps tags readable and nothing removable while read only, and draws disabled tags in a disabled group', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { container, unmount } = render(<Invite defaultValue={[ANA, BO]} isReadOnly onChange={onChange} />);
    expect(screen.queryByRole('button', { name: /Remove/ })).toBeNull();
    expect(box()).toHaveAttribute('readonly');
    await user.tab();
    expect(tag(ANA)).toHaveFocus();
    await user.keyboard('{Enter}{Delete}{Backspace}');
    await user.click(box());
    await user.keyboard('{Backspace}');
    expect(tagTexts(container)).toEqual([ANA, BO]);
    expect(onChange).not.toHaveBeenCalled();
    unmount();
    const disabled = render(<Invite defaultValue={[ANA, BO]} isDisabled />);
    const group = within(disabled.container).getByRole('group', { name: 'Added Invite people' });
    expect(group).toHaveAttribute('aria-disabled', 'true');
    expect(within(disabled.container).queryByRole('grid')).toBeNull();
    expect(box()).toBeDisabled();
    expect(disabled.container.querySelector('.tag-input-control')).toHaveAttribute('data-disabled');
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('applies the preset inputProps and autoCorrect off to the box, and data-ltr for a left-to-right preset', () => {
    const { container } = render(<Invite />);
    expect(box()).toHaveAttribute('inputmode', 'email');
    expect(box()).toHaveAttribute('autocomplete', 'off');
    expect(box()).toHaveAttribute('autocapitalize', 'none');
    expect(box()).toHaveAttribute('spellcheck', 'false');
    expect(box()).toHaveAttribute('dir', 'ltr');
    expect(box()).toHaveAttribute('enterkeyhint', 'enter');
    expect(box()).toHaveAttribute('autocorrect', 'off');
    expect(container.firstElementChild).toHaveAttribute('data-ltr');
    const plain = render(<TagInput label="Tags" />);
    expect(plain.container.firstElementChild).not.toHaveAttribute('data-ltr');
    expect(within(plain.container).getByRole('textbox')).not.toHaveAttribute('dir');
    expect(within(plain.container).getByRole('textbox')).toHaveAttribute('autocorrect', 'off');
  });

  it('splits on commas and new lines with no preset, and accepts any text', async () => {
    const user = userEvent.setup();
    const { container } = render(<TagInput label="Tags" />);
    await user.type(within(container).getByRole('textbox'), 'red fox, blue{Enter}');
    expect(tagTexts(container)).toEqual(['red fox', 'blue']);
  });

  it('never calls onChange with a value the preset refuses', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<TagInput label="Excluded paths" preset={pathPreset} onChange={onChange} />);
    await user.click(box());
    await user.paste('/blog, /a#b, shop\n');
    await user.type(box(), '{Enter}');
    const all = onChange.mock.calls.flatMap(([list]) => list as string[]);
    expect(all.length).toBeGreaterThan(0);
    for (const value of all) expect(pathPreset.isValid(value)).toBe(true);
    expect(box()).toHaveValue('/a#b');
  });

  it('follows a controlled value and text', async () => {
    const user = userEvent.setup();
    function Controlled(): ReactElement {
      const [value, setValue] = useState<string[]>([ANA]);
      const [text, setText] = useState('');
      return (
        <>
          <Invite value={value} onChange={setValue} inputValue={text} onInputChange={setText} />
          <output>{`${value.join('|')}#${text}`}</output>
        </>
      );
    }
    render(<Controlled />);
    await user.type(box(), 'bo@');
    expect(document.querySelector('output')).toHaveTextContent(`${ANA}#bo@`);
    await user.type(box(), 'example.com ');
    expect(document.querySelector('output')).toHaveTextContent(`${ANA}|${BO}#`);
  });

  it('keeps text typed before hydration, which the first update would otherwise put back', async () => {
    const element = <Invite name="invite" defaultValue={[ANA]} />;
    const host = document.createElement('div');
    host.innerHTML = renderToString(element);
    document.body.append(host);
    const input = host.querySelector('input.tag-input-input');
    if (!(input instanceof HTMLInputElement)) throw new Error('No box');
    input.value = BO;
    let root: Root | undefined;
    await act(async () => {
      root = hydrateRoot(host, element);
      await Promise.resolve();
    });
    try {
      expect(input).toHaveValue(BO);
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(tagTexts(host)).toEqual([ANA, BO]);
    } finally {
      act(() => {
        root?.unmount();
      });
      host.remove();
    }
  });

  it('passes className and ref to the root and inputRef to the box', () => {
    const ref = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    const { container } = render(<Invite className="invite" ref={ref} inputRef={inputRef} />);
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current).toHaveClass('field', 'tag-input', 'invite');
    expect(inputRef.current).toBe(box());
  });

  const AXE_CASES: [name: string, element: ReactElement][] = [
    ['empty', <Invite key="empty" />],
    ['with tags', <Invite key="tags" defaultValue={[ANA, BO]} name="invite" maxValues={10} />],
    ['refused text', <Invite key="refused" defaultInputValue="ana@example" isInvalid />],
    ['past the limit', <Invite key="limit" defaultValue={[ANA, BO]} maxValues={2} isInvalid />],
    ['changed', <Invite key="changed" defaultValue={[ANA]} isChanged />],
    [
      'unlabelled and changed',
      <TagInput
        key="unlabelled"
        aria-label="Allowed domains"
        preset={domainPreset}
        defaultValue={['example.com']}
        isChanged
      />,
    ],
    ['read only', <Invite key="readonly" defaultValue={[ANA, BO]} isReadOnly />],
    ['disabled', <Invite key="disabled" defaultValue={[ANA, BO]} isDisabled />],
  ];

  it.each(AXE_CASES)('has no axe violations %s', async (_name, element) => {
    const { container } = render(element);
    await expectNoA11yViolations(container);
  });

  it('types the value as a list and the preset as a whole object', () => {
    // @ts-expect-error The value is a list of strings, never one string.
    const one = <TagInput label="Invite" value="ana@example.com" />;
    const partial = (
      <TagInput
        label="Invite"
        // @ts-expect-error A preset says what is valid.
        preset={{
          split: (text: string) => [text],
          normalize: (text: string) => text,
          delimiters: [','],
          join: ', ',
          invalidMessage: () => '',
        }}
      />
    );
    expect([one, partial]).toHaveLength(2);
  });
});
