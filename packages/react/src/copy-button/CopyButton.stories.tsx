import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, spyOn, userEvent, waitFor, within } from 'storybook/test';
import { DescriptionList, DescriptionListItem } from '../description-list';
import { focusOn } from '../stories/focus';
import { Prose } from '../prose';
import { Text } from '../typography';
import { CopyButton } from './CopyButton';

/** A webhook address an app shows on its settings page, where the reader copies it into another service. */
const ADDRESS = 'https://hooks.example.com/ledger/7Fq2';

/** An answer an assistant wrote, which the reader copies into a note. */
const ANSWER =
  'Spending on food is down 12% this month, mostly from fewer restaurant visits. Groceries held steady at $410.';

const MONO: CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: 'var(--text-small)' };

const meta = {
  title: 'Components/CopyButton',
  component: CopyButton,
  parameters: { layout: 'padded' },
  args: { value: ADDRESS, labels: { copy: 'Copy webhook address' } },
} satisfies Meta<typeof CopyButton>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The first element with this class inside `scope`. */
const part = (scope: ParentNode, name: string): HTMLElement => {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
};

/** The glyph the stylesheet shows: the one of the two that is drawn. */
const shownGlyph = (scope: ParentNode): string | null => {
  const shown = [...scope.querySelectorAll<HTMLElement>('.copy-button-glyph')].filter(
    (glyph) => getComputedStyle(glyph).display !== 'none',
  );
  return shown.length === 1 ? (shown[0]?.dataset.glyph ?? null) : null;
};

/** The open tip, which React Aria portals to the body. */
const openTip = (): HTMLElement | null => document.querySelector<HTMLElement>('[role="tooltip"]');

/**
 * Whether this engine lets the page read the clipboard: Chromium with the permission granted. WebKit and Firefox
 * need a real gesture for the clipboard, and Firefox does not know the permission's name, so they answer false.
 */
const canReadClipboard = async (): Promise<boolean> => {
  try {
    const state = await navigator.permissions.query({ name: 'clipboard-read' as PermissionName });
    return state.state === 'granted';
  } catch {
    return false;
  }
};

/** The address beside its button, as a settings row draws a value to copy. */
const AddressRow = (args: Story['args']) => (
  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 'var(--spacing-part)' }}>
    <code style={MONO}>{ADDRESS}</code>
    <CopyButton {...args} value={ADDRESS} />
  </div>
);

/** A ghost icon button beside the monospaced address it copies, named for what it copies. */
export const Icon: Story = { render: (args) => <AddressRow {...args} /> };

/** The word look: a secondary button with the glyph and its name, for a copy that needs saying. */
export const WithWord: Story = {
  args: {
    look: 'button',
    value:
      'Webhook address: https://hooks.example.com/ledger/7Fq2\nSigning secret: shown once, in your email',
    labels: { copy: 'Copy setup details' },
  },
};

/** In a DescriptionList row's actions, named "Copy" and the term, level with the value's line. */
export const InDescriptionList: Story = {
  render: () => (
    <DescriptionList>
      <DescriptionListItem term="Provider">Northwind Hooks</DescriptionListItem>
      <DescriptionListItem
        term="Setup address"
        actions={<CopyButton value={ADDRESS} labels={{ copy: 'Copy Setup address' }} />}
      >
        <span style={MONO}>{ADDRESS}</span>
      </DescriptionListItem>
    </DescriptionList>
  ),
};

/**
 * Under a Prose answer, in its footer: outside the part an app marks `aria-busy` while the answer streams, so the
 * status is heard. Here the answer has finished, so its body says `aria-busy="false"`.
 */
export const UnderAnAnswer: Story = {
  render: () => (
    <article
      aria-label="Answer"
      style={{ display: 'grid', gap: 'var(--spacing-part)', maxInlineSize: '40rem' }}
    >
      <Prose aria-busy={false}>
        <p>{ANSWER}</p>
      </Prose>
      <footer>
        <CopyButton value={ANSWER} labels={{ copy: 'Copy answer' }} />
      </footer>
    </article>
  ),
};

/**
 * A copy said in every engine. In Chromium with the clipboard permission granted, a real copy is read back from
 * the clipboard. Then every engine stubs `writeText` with a resolved promise, since WebKit's and Firefox's
 * clipboards need a real gesture: Enter copies, the status says "Copied", the check shows, the tip shows the
 * outcome, the name stays and focus stays on the button, and after the hold the status is empty again.
 */
export const CopyStatus: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => <AddressRow {...args} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Copy webhook address' });
    const root = part(canvasElement, 'copy-button');
    const status = part(canvasElement, 'copy-button-status');
    await expect(status).toBeEmptyDOMElement();
    if (await canReadClipboard()) {
      await focusOn(button);
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(status).toHaveTextContent('Copied'), { timeout: 5000 });
      await expect(await navigator.clipboard.readText()).toBe(ADDRESS);
      await waitFor(() => expect(status).toBeEmptyDOMElement(), { timeout: 5000 });
    }
    const write = spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    try {
      await focusOn(button);
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(status).toHaveTextContent('Copied'), { timeout: 5000 });
      await expect(write).toHaveBeenCalledWith(ADDRESS);
      await expect(root).toHaveAttribute('data-outcome', 'copied');
      await expect(shownGlyph(root)).toBe('check');
      await waitFor(() => expect(openTip()).toHaveTextContent('Copied'), { timeout: 5000 });
      await expect(button).toHaveAccessibleName('Copy webhook address');
      await expect(button).toHaveFocus();
      await waitFor(() => expect(status).toBeEmptyDOMElement(), { timeout: 5000 });
      await expect(root).not.toHaveAttribute('data-outcome');
      await expect(shownGlyph(root)).toBe('copy');
      // The outcome's tip leaves with the hold, after its exit animation.
      await waitFor(() => expect(openTip()).toBeNull(), { timeout: 5000 });
      await expect(button).toHaveFocus();
    } finally {
      write.mockRestore();
    }
  },
};

/**
 * A refused copy, by a pointer press: `writeText` rejects and the copy command answers false, so the status and
 * the tip say "Copy failed", the copy glyph stays, and focus stays on the button.
 */
export const CopyFailed: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => <AddressRow {...args} />,
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Copy webhook address' });
    const root = part(canvasElement, 'copy-button');
    const status = part(canvasElement, 'copy-button-status');
    const write = spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const command = spyOn(document, 'execCommand').mockReturnValue(false);
    try {
      await userEvent.click(button);
      await waitFor(() => expect(status).toHaveTextContent('Copy failed'), { timeout: 5000 });
      await expect(command).toHaveBeenCalledWith('copy');
      await expect(root).toHaveAttribute('data-outcome', 'failed');
      await expect(shownGlyph(root)).toBe('copy');
      await waitFor(() => expect(openTip()).toHaveTextContent('Copy failed'), { timeout: 5000 });
      await expect(button).toHaveAccessibleName('Copy webhook address');
      await expect(button).toHaveFocus();
    } finally {
      write.mockRestore();
      command.mockRestore();
    }
  },
};

/**
 * Where the Clipboard API is missing, as on a page served over plain http, the document's copy command copies.
 * The command is stubbed to send the copy event a browser sends, since a play's press is no real gesture: the
 * event carries the value as plain text, the selection the part made is gone, the reader's own is back, and
 * focus never left the button.
 */
export const CopyByCommand: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div style={{ display: 'grid', gap: 'var(--spacing-part)' }}>
      <Text data-testid="selected">Selected before the copy</Text>
      <AddressRow {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'Copy webhook address' });
    const status = part(canvasElement, 'copy-button-status');
    const selected = within(canvasElement).getByTestId('selected');
    const sent: DataTransfer[] = [];
    const missing = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    const command = spyOn(document, 'execCommand').mockImplementation((name) => {
      if (name !== 'copy') return false;
      const data = new DataTransfer();
      const event = new ClipboardEvent('copy', { bubbles: true, cancelable: true, clipboardData: data });
      // Firefox's constructor drops clipboardData, so it is defined on the event.
      if (event.clipboardData !== data) Object.defineProperty(event, 'clipboardData', { value: data });
      document.dispatchEvent(event);
      sent.push(data);
      return event.defaultPrevented;
    });
    try {
      await focusOn(button);
      const before = document.createRange();
      before.selectNodeContents(selected);
      document.getSelection()?.removeAllRanges();
      document.getSelection()?.addRange(before);
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(status).toHaveTextContent('Copied'), { timeout: 5000 });
      await expect(command).toHaveBeenCalledWith('copy');
      await expect(sent[0]?.getData('text/plain')).toBe(ADDRESS);
      await expect(canvasElement.querySelector('.copy-button-source')).toBeNull();
      await expect(document.getSelection()?.toString()).toBe('Selected before the copy');
      await expect(button).toHaveFocus();
    } finally {
      command.mockRestore();
      if (missing) Object.defineProperty(navigator, 'clipboard', missing);
      else Reflect.deleteProperty(navigator, 'clipboard');
      document.getSelection()?.removeAllRanges();
    }
  },
};

/**
 * Right to left, in a Persian DescriptionList: the button stands at the row's inline end, now its left, and its
 * glyphs are not mirrored, since a copy glyph has no direction.
 */
export const RightToLeft: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa">
        <DescriptionList>
          <DescriptionListItem
            term="نشانی راه‌اندازی"
            actions={<CopyButton value={ADDRESS} labels={{ copy: 'کپی نشانی راه‌اندازی' }} />}
          >
            <span style={MONO} dir="ltr">
              {ADDRESS}
            </span>
          </DescriptionListItem>
        </DescriptionList>
      </div>
    </I18nProvider>
  ),
  play: async ({ canvasElement }) => {
    const button = within(canvasElement).getByRole('button', { name: 'کپی نشانی راه‌اندازی' });
    const value = part(canvasElement, 'description-list-value');
    await waitFor(
      () =>
        expect(button.getBoundingClientRect().right).toBeLessThanOrEqual(
          value.getBoundingClientRect().left + 1,
        ),
      { timeout: 5000 },
    );
    for (const glyph of canvasElement.querySelectorAll('.copy-button-glyph, .copy-button-glyph svg')) {
      const style = getComputedStyle(glyph);
      await expect(style.scale).toMatch(/^(none|1)$/);
      await expect(style.transform).toBe('none');
    }
  },
};
