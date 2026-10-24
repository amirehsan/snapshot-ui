import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ComponentType, type ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { Dialog } from '../dialog';
import { MultiSelect } from '../multi-select';
import { PickerOption } from '../picker';
import { CLEAR_OF_FOOT } from '../stories/corner';
import { firePaste, textTransfer } from '../stories/drag';
import { focusOn } from '../stories/focus';
import { pressRealKeys } from '../stories/keys';
import { tokenColor } from '../stories/paint';
import { QUIET_MS } from '../utils/quiet';
import { domainPreset, emailPreset, pathPreset } from './presets';
import { TagInput, type TagInputBaseProps } from './TagInput';

const ANA = 'ana@example.com';
const BO = 'bo@example.com';
const CY = 'cy@example.com';

/** Twelve addresses for a long list, one of them 60 characters, which ellipsizes at 12rem. */
const TWELVE = [
  ANA,
  BO,
  CY,
  'dee@example.com',
  'eli@example.org',
  'fay@example.net',
  'gus@example.com',
  'hal@example.io',
  'the.accounts.payable.team.for.the.western.region@example.com',
  'ivy@example.com',
  'jo@example.co.uk',
  'kim@example.com',
];

const meta = {
  title: 'Components/TagInput',
  // The props are a union, since the field needs a name, and Storybook cannot narrow a union.
  component: TagInput as ComponentType<TagInputBaseProps>,
  args: {
    label: 'Invite people',
    description: 'Separate addresses with commas or spaces.',
    preset: emailPreset,
    defaultValue: [ANA, BO],
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(36rem, 100%)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<TagInputBaseProps>;

export default meta;
type Story = StoryObj<typeof meta>;

function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

const tagTexts = (scope: ParentNode): string[] =>
  [...scope.querySelectorAll('.tag-input-tag-text')].map((text) => text.textContent);

/** The field size the frame reads, in pixels, under whatever density and shape wrap it. */
const fieldSize = (element: Element): number =>
  parseFloat(getComputedStyle(element).getPropertyValue('--size-field'));

/** Five seconds, where a busy runner is slow. */
const SLOW = { timeout: 5000 };

/**
 * Listens on the document for a focusout that leaves focus on nothing while focus was inside `scope`, which is
 * focus falling to the body (lesson 10); `stop` takes the listener off and returns how many there were.
 */
function watchLostFocus(scope: Element): () => number {
  let lost = 0;
  const onFocusOut = (event: FocusEvent): void => {
    if (event.relatedTarget === null && event.target instanceof Node && scope.contains(event.target))
      lost += 1;
  };
  document.addEventListener('focusout', onFocusOut, true);
  return () => {
    document.removeEventListener('focusout', onFocusOut, true);
    return lost;
  };
}

/** Sets a text box's text as the browser's own editing does, so React hears the input event. */
function typeInto(input: HTMLInputElement, text: string, init: InputEventInit = {}): void {
  Reflect.set(HTMLInputElement.prototype, 'value', text, input);
  input.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', ...init }));
}

/** Each shape and density a play measures in, put back after. */
async function inEachLook(check: (look: string) => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of [
      ['rounded', 'comfortable'],
      ['rounded', 'compact'],
      ['soft', 'comfortable'],
      ['soft', 'compact'],
      ['square', 'comfortable'],
      ['square', 'compact'],
    ] as const) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check(`${nextShape} ${nextDensity}`);
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

/**
 * Two addresses: MultiSelect's bone pills, each at 500 with a small slate X, in a frame a field tall, and the box
 * after them with no placeholder.
 */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.tag-input-control');
    await expect(frame.getBoundingClientRect().height).toBe(fieldSize(frame));
    await expect(tagTexts(canvasElement)).toEqual([ANA, BO]);
    const tag = find(canvasElement, '.tag-input-tag');
    await expect(getComputedStyle(tag).backgroundColor).toBe(tokenColor('--color-bone'));
    await expect(getComputedStyle(tag).fontWeight).toBe('500');
    await expect(tag.getBoundingClientRect().height).toBe(fieldSize(frame) - 12);
    const remove = find(canvasElement, '.tag-input-tag-remove').getBoundingClientRect();
    await expect([remove.width, remove.height]).toEqual([20, 20]);
    await expect(find(canvasElement, '.tag-input-input')).not.toHaveAttribute('placeholder');
  },
};

/** The email preset with three addresses and its hint. */
export const Emails: Story = {
  args: { defaultValue: [ANA, BO, CY], placeholder: 'name@example.com' },
};

/** The domain preset: three domains, one a wildcard. */
export const Domains: Story = {
  args: {
    label: 'Allowed domains',
    description: 'Only people at these domains can join. Use *.example.com for every subdomain.',
    preset: domainPreset,
    defaultValue: ['example.com', '*.example.org', 'example.net'],
  },
};

/** The path preset: three paths, one with a wildcard. */
export const Paths: Story = {
  args: {
    label: 'Excluded paths',
    description: 'Pages under these paths are left out. Separate them with commas or spaces.',
    preset: pathPreset,
    defaultValue: ['/admin', '/blog/drafts/*', '/checkout'],
  },
};

/** Two addresses added, "ana@example" left in the box after Enter, with the error line under the hint. */
export const RefusedText: Story = {
  args: { defaultValue: [BO, CY], defaultInputValue: 'ana@example' },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('textbox');
    await focusOn(box);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(find(canvasElement, '.field-error')).toBeVisible());
    box.blur();
    await expect(box).toHaveValue('ana@example');
    await expect(tagTexts(canvasElement)).toEqual([BO, CY]);
  },
};

/** Three of three: the count "3/3" in the label row, a fourth left in the box, and the limit's error line. */
export const AtTheLimit: Story = {
  args: { defaultValue: [ANA, BO, CY], maxValues: 3, defaultInputValue: 'dee@example.com' },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole('textbox');
    await focusOn(box);
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(find(canvasElement, '.field-error')).toHaveTextContent('You can add up to 3'));
    box.blur();
    await expect(find(canvasElement, '.field-head .field-counter')).toHaveTextContent('3/3');
  },
};

/** Changed: the clay chip in the label row and the light signal orange edge on the frame. */
export const Changed: Story = {
  args: { isChanged: true },
};

/** Changed with no label: the clay dot at the frame's end, and the box stopping short of it. */
export const UnlabelledChanged: Story = {
  args: {
    label: undefined,
    description: undefined,
    'aria-label': 'Allowed domains',
    preset: domainPreset,
    defaultValue: ['example.com', 'example.org'],
    isChanged: true,
  },
};

/** Disabled: the frame's disabled look, the tags taupe and not focusable. */
export const Disabled: Story = {
  args: { isDisabled: true },
};

/** Read only: the tags readable and focusable, with no remove buttons, and the box read only. */
export const ReadOnly: Story = {
  args: { isReadOnly: true },
};

/** Twelve addresses wrapping row by row, the 60-character one ellipsized at 12rem, the box on a row of its own. */
export const ManyTags: Story = {
  args: { defaultValue: TWELVE },
};

/** A TagInput at a card's foot, clear of the card's bottom curve. */
export const InCard: Story = {
  tags: ['density'],
  render: (args) => (
    <Card as="section" aria-label="Sharing" style={{ width: '100%', maxWidth: '32rem' }}>
      <CardHeader>
        <CardTitle level={2}>Sharing</CardTitle>
      </CardHeader>
      <CardBody>
        <div style={CLEAR_OF_FOOT}>
          <TagInput {...args} label="Invite people" />
        </div>
      </CardBody>
    </Card>
  ),
};

/** A pasted list of three, split at once: three tags, the box empty, and "Added 3" said after the pause. */
export const PasteSplits: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: [] },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole<HTMLInputElement>('textbox');
    await focusOn(box);
    firePaste(box, textTransfer(`${ANA}, ${BO}\n${CY}`));
    await waitFor(() => expect(tagTexts(canvasElement)).toEqual([ANA, BO, CY]), SLOW);
    await expect(box).toHaveValue('');
    const status = find(canvasElement, '.tag-input-status');
    await expect(status).toBeEmptyDOMElement();
    await new Promise((resolve) => setTimeout(resolve, QUIET_MS));
    await waitFor(() => expect(status).toHaveTextContent(/^Added 3$/), SLOW);
  },
};

/**
 * An input method composing: the comma inside the composition commits nothing, and neither does its Enter;
 * the composition's end splits the text.
 */
export const Composition: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: [] },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole<HTMLInputElement>('textbox');
    await focusOn(box);
    box.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true, data: '' }));
    typeInto(box, 'ana@', { isComposing: true, inputType: 'insertCompositionText', data: 'ana@' });
    typeInto(box, `${ANA},`, { isComposing: true, inputType: 'insertCompositionText', data: `${ANA},` });
    box.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true, isComposing: true }),
    );
    await waitFor(() => expect(box).toHaveValue(`${ANA},`));
    await expect(tagTexts(canvasElement)).toEqual([]);
    box.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true, data: `${ANA},` }));
    await waitFor(() => expect(tagTexts(canvasElement)).toEqual([ANA]), SLOW);
    await expect(box).toHaveValue('');
  },
};

/** An Android keyboard: an input event carrying "ana@example.com," with no keydown at all still adds one tag. */
export const AndroidInput: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: [] },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole<HTMLInputElement>('textbox');
    await focusOn(box);
    typeInto(box, `${ANA},`, { data: ',' });
    await waitFor(() => expect(tagTexts(canvasElement)).toEqual([ANA]), SLOW);
    await expect(box).toHaveValue('');
  },
};

/** Backspace held down in the empty box: one tag comes back, then its letters go, and the tag before it stays. */
export const HeldBackspace: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: [ANA, BO] },
  play: async ({ canvasElement }) => {
    const box = within(canvasElement).getByRole<HTMLInputElement>('textbox');
    await focusOn(box);
    // One press, then three repeats of the held key, then its release.
    if (!(await pressRealKeys('{Backspace>4/}'))) return;
    await waitFor(() => expect(tagTexts(canvasElement)).toEqual([ANA]), SLOW);
    await waitFor(() => expect(box).toHaveValue(BO.slice(0, -3)), SLOW);
  },
};

/**
 * Enter on a middle tag takes it back: focus and the caret at the box's end. Delete on the last tag removes it
 * and focus goes to the one before. Focus never falls to the body on the way.
 */
export const TakeBackFocus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: [ANA, BO, CY] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const field = find(canvasElement, '.tag-input');
    const stop = watchLostFocus(field);
    try {
      await focusOn(canvas.getByRole('row', { name: BO }));
      await userEvent.keyboard('{Enter}');
      const box = canvas.getByRole<HTMLInputElement>('textbox');
      await waitFor(() => expect(box).toHaveFocus(), SLOW);
      await expect(box).toHaveValue(BO);
      await waitFor(() => expect(box.selectionStart).toBe(BO.length), SLOW);
      await expect(tagTexts(canvasElement)).toEqual([ANA, CY]);
      await focusOn(canvas.getByRole('row', { name: CY }));
      await userEvent.keyboard('{Delete}');
      await waitFor(() => expect(canvas.getByRole('row', { name: ANA })).toHaveFocus(), SLOW);
      await expect(tagTexts(canvasElement)).toEqual([ANA]);
    } finally {
      await expect(stop()).toBe(0);
    }
  },
};

function DialogField(): ReactElement {
  const [isOpen, setOpen] = useState(true);
  return (
    <>
      <output data-testid="open">{isOpen ? 'open' : 'closed'}</output>
      <Dialog title="Share the report" isOpen={isOpen} onOpenChange={setOpen}>
        <TagInput label="Invite people" preset={emailPreset} />
      </Dialog>
    </>
  );
}

/** In a Dialog: Escape with text clears the text and the Dialog stays; Escape again closes it. */
export const EscapeInDialog: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <DialogField />,
  play: async ({ canvasElement }) => {
    const page = within(document.body);
    const box = page.getByRole<HTMLInputElement>('textbox', { name: 'Invite people' });
    await focusOn(box);
    await userEvent.keyboard('ana@exa');
    await waitFor(() => expect(box).toHaveValue('ana@exa'));
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(box).toHaveValue(''));
    await expect(page.getByRole('dialog')).toBeInTheDocument();
    await expect(within(canvasElement).getByTestId('open')).toHaveTextContent('open');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(within(canvasElement).getByTestId('open')).toHaveTextContent('closed'), SLOW);
  },
};

function SaveForm(): ReactElement {
  const [sent, setSent] = useState<string[] | null>(null);
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSent(new FormData(event.currentTarget).getAll('invite').map(String));
      }}
      style={{ display: 'grid', gap: 'var(--spacing-separate)' }}
    >
      <TagInput label="Invite people" name="invite" preset={emailPreset} defaultValue={[ANA]} />
      <div>
        <Button type="submit">Save</Button>
      </div>
      <output data-testid="sent">{sent === null ? '' : sent.join(' ')}</output>
    </form>
  );
}

/** An address typed and followed by a press on Save is added at the press, before the release submits. */
export const BlurBeforeSave: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SaveForm />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const box = canvas.getByRole<HTMLInputElement>('textbox');
    await focusOn(box);
    await userEvent.keyboard(BO);
    await waitFor(() => expect(box).toHaveValue(BO));
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(canvas.getByTestId('sent')).toHaveTextContent(`${ANA} ${BO}`), SLOW);
    await expect(tagTexts(canvasElement)).toEqual([ANA, BO]);
  },
};

/**
 * Text typed before hydration stays in the box: the play draws the server's HTML, types into it, then hydrates,
 * and the next Enter adds what was typed (risk R3).
 */
export const TypedBeforeHydration: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <div data-testid="host" />,
  play: async ({ canvasElement }) => {
    const host = within(canvasElement).getByTestId('host');
    const element = (
      <TagInput label="Invite people" name="invite" preset={emailPreset} defaultValue={[ANA]} />
    );
    host.innerHTML = renderToString(element);
    const box = find(host, 'input.tag-input-input') as HTMLInputElement;
    Reflect.set(HTMLInputElement.prototype, 'value', BO, box);
    const root = hydrateRoot(host, element);
    try {
      // Hydration attaches React's handlers in tasks of its own; the server's markup already carries data-rac.
      await new Promise((resolve) => setTimeout(resolve, 300));
      await expect(box).toHaveValue(BO);
      await focusOn(box);
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(tagTexts(host)).toEqual([ANA, BO]), SLOW);
    } finally {
      root.unmount();
    }
  },
};

/** The same three tags in a TagInput and a MultiSelect, side by side. */
function SideBySide(): ReactElement {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', width: '48rem' }}>
      <TagInput label="Tag input" preset={emailPreset} defaultValue={[ANA, BO, CY]} />
      <MultiSelect label="Multi-select" defaultValue={['ana', 'bo', 'cy']}>
        <PickerOption id="ana">{ANA}</PickerOption>
        <PickerOption id="bo">{BO}</PickerOption>
        <PickerOption id="cy">{CY}</PickerOption>
      </MultiSelect>
    </div>
  );
}

/**
 * One object (Review Focus 1): a TagInput and a MultiSelect with the same tags draw the same frame, tags, corners
 * and remove circles in every shape and density, within 1px, colors exactly. Only the frame's end padding differs:
 * MultiSelect's makes room for its button.
 */
export const SameAsMultiSelect: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <SideBySide />,
  play: async ({ canvasElement }) => {
    const ours = find(canvasElement, '.tag-input');
    const theirs = find(canvasElement, '.multi-select');
    await inEachLook(async (look) => {
      await waitFor(
        () =>
          expect(find(ours, '.tag-input-control').getBoundingClientRect().height).toBeCloseTo(
            find(theirs, '.multi-select-control').getBoundingClientRect().height,
            0,
          ),
        SLOW,
      );
      const frames = [find(ours, '.tag-input-control'), find(theirs, '.multi-select-control')].map((frame) =>
        getComputedStyle(frame),
      );
      const [a, b] = frames;
      if (!a || !b) throw new Error('Two frames expected');
      for (const property of [
        'padding-top',
        'padding-bottom',
        'padding-inline-start',
        'border-top-left-radius',
        'border-bottom-right-radius',
        'border-top-color',
        'background-color',
      ]) {
        await expect(a.getPropertyValue(property), `${look} frame ${property}`).toBe(
          b.getPropertyValue(property),
        );
      }
      const ourTags = [...ours.querySelectorAll<HTMLElement>('.tag-input-tag')];
      const theirTags = [...theirs.querySelectorAll<HTMLElement>('.multi-select-tag')];
      await expect(ourTags).toHaveLength(theirTags.length);
      for (const [index, tag] of ourTags.entries()) {
        const twin = theirTags[index];
        if (!twin) throw new Error('A tag expected');
        const [mine, other] = [tag, twin].map((each) => each.getBoundingClientRect());
        if (!mine || !other) throw new Error('Two boxes expected');
        await expect(Math.abs(mine.width - other.width), `${look} tag width`).toBeLessThanOrEqual(1);
        await expect(Math.abs(mine.height - other.height), `${look} tag height`).toBeLessThanOrEqual(1);
        const [own, its] = [tag, twin].map((each) => getComputedStyle(each));
        if (!own || !its) throw new Error('Two styles expected');
        for (const property of ['border-top-left-radius', 'background-color', 'color', 'font-weight']) {
          await expect(own.getPropertyValue(property), `${look} tag ${property}`).toBe(
            its.getPropertyValue(property),
          );
        }
        const [ourRemove, theirRemove] = [
          find(tag, '.tag-input-tag-remove'),
          find(twin, '.multi-select-tag-remove'),
        ];
        const [r1, r2] = [ourRemove, theirRemove].map((each) => each.getBoundingClientRect());
        if (!r1 || !r2) throw new Error('Two remove boxes expected');
        await expect(Math.abs(r1.width - r2.width), `${look} remove width`).toBeLessThanOrEqual(1);
        await expect(Math.abs(r1.height - r2.height), `${look} remove height`).toBeLessThanOrEqual(1);
        await expect(getComputedStyle(ourRemove, '::before').inset).toBe(
          getComputedStyle(theirRemove, '::before').inset,
        );
        await expect(getComputedStyle(ourRemove).color).toBe(getComputedStyle(theirRemove).color);
      }
    });
  },
};

/**
 * The tags in their frame: each corner concentric with the frame's (its radius less the 6px between them), the
 * box never narrower than 8rem, on a row of its own once less is left, and a 60-character tag cut at 12rem.
 */
export const TagsInPlace: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  args: { defaultValue: TWELVE },
  play: async ({ canvasElement }) => {
    const frame = find(canvasElement, '.tag-input-control');
    await inEachLook(async (look) => {
      await waitFor(
        () => expect(frame.getBoundingClientRect().height).toBeGreaterThan(fieldSize(frame)),
        SLOW,
      );
      const frameRadius = parseFloat(getComputedStyle(frame).borderTopLeftRadius);
      for (const tag of canvasElement.querySelectorAll<HTMLElement>('.tag-input-tag')) {
        const { height } = tag.getBoundingClientRect();
        const drawn = Math.min(parseFloat(getComputedStyle(tag).borderTopLeftRadius), height / 2);
        await expect(
          Math.abs(drawn - Math.min(Math.max(0, frameRadius - 6), height / 2)),
          look,
        ).toBeLessThanOrEqual(1);
      }
      const box = find(canvasElement, '.tag-input-input').getBoundingClientRect();
      await expect(box.width, `${look} box`).toBeGreaterThanOrEqual(128 - 1);
      const tags = [...canvasElement.querySelectorAll('.tag-input-tag')];
      const last = tags.at(-1)?.getBoundingClientRect();
      if (!last) throw new Error('No tags');
      // On the last tag's row only if 8rem was left beside it.
      if (Math.abs(box.top - last.top) < 1) await expect(box.left).toBeGreaterThanOrEqual(last.right);
      const long = [...canvasElement.querySelectorAll<HTMLElement>('.tag-input-tag-text')].find(
        (text) => text.textContent.length === 60,
      );
      if (!long) throw new Error('No 60-character tag');
      await expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(192 + 0.5);
      await expect(long.scrollWidth).toBeGreaterThan(long.clientWidth);
    });
  },
};
