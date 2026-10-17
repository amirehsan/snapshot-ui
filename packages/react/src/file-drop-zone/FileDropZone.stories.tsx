import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CSSProperties, ReactElement, ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Button } from '../button';
import { Dialog } from '../dialog';
import { TextField } from '../text-field';
import {
  blank,
  dragOver,
  dropOn,
  exe,
  filesTransfer,
  fireDrag,
  firePaste,
  pdf,
  png,
  textTransfer,
} from '../stories/drag';
import { focusOn } from '../stories/focus';
import { DemoHeader, DemoNav } from '../stories/shell-fixture';
import { DESKTOP, PHONE, VIEWPORT_OPTIONS } from '../stories/viewports';
import { FileButton } from './FileButton';
import { FileDropZone, type FileDropZoneProps } from './FileDropZone';
import { PageDropZone } from './PageDropZone';

const onFiles = fn();

const meta = {
  title: 'Components/FileDropZone',
  component: FileDropZone,
  args: {
    label: 'Receipts',
    description: 'PDF, JPG or PNG, up to 10 MB',
    acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    maxFileSize: 10_000_000,
    allowsMultiple: true,
    onFiles,
  },
  parameters: { layout: 'padded', viewport: { options: VIEWPORT_OPTIONS } },
  // Each zone in a box as wide as a form column, or the canvas when it is narrower.
  render: (args) => (
    <div style={{ width: 'min(32rem, 100%)' }}>
      <FileDropZone {...args} />
    </div>
  ),
} satisfies Meta<FileDropZoneProps>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The one element with this class inside `scope`. */
function part(scope: ParentNode, name: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(`.${name}`);
  if (!element) throw new Error(`No .${name}`);
  return element;
}

/** A dashed boundary box with a slate upload icon over "Drag files here or" and the secondary button. */
export const Default: Story = {
  tags: ['density'],
  play: async ({ canvasElement }) => {
    const box = part(canvasElement, 'file-drop-zone-box');
    const style = getComputedStyle(box);
    await expect(style.borderTopStyle).toBe('dashed');
    await expect(style.borderTopWidth).toBe('2px');
    await expect(box.getBoundingClientRect().height).toBeGreaterThanOrEqual(128);
    // The icon over the line: a centered column at this width.
    const icon = part(canvasElement, 'file-drop-zone-icon').getBoundingClientRect();
    const line = part(canvasElement, 'file-drop-zone-line').getBoundingClientRect();
    await expect(icon.bottom).toBeLessThanOrEqual(line.top);
  },
};

/** One file: "Drag a file here or" and "Choose a file". */
export const Single: Story = {
  args: { label: 'Receipt', allowsMultiple: false, description: 'PDF, JPG or PNG, up to 10 MB' },
};

/** A drag holding files over the box: solid ink on the 5% wash, and "Drop to upload" in the hint's place. */
export const DropTarget: Story = {
  play: async ({ canvasElement }) => {
    const box = part(canvasElement, 'file-drop-zone-box');
    dragOver(box, filesTransfer([pdf()]));
    await waitFor(() => expect(box).toHaveAttribute('data-drop-target'));
    await expect(part(canvasElement, 'file-drop-zone')).toHaveAttribute('data-drop-target');
    await expect(getComputedStyle(box).borderTopStyle).toBe('solid');
    await expect(part(canvasElement, 'file-drop-zone-drop')).toBeVisible();
    await expect(part(canvasElement, 'file-drop-zone-hint')).not.toBeVisible();
  },
};

/** A drop of an empty file and a program: neither is added, and the zone says so in its red line. */
export const Refused: Story = {
  play: async ({ canvasElement }) => {
    onFiles.mockClear();
    const box = part(canvasElement, 'file-drop-zone-box');
    const [empty, program] = [blank(), exe()];
    dropOn(box, filesTransfer([empty, program]));
    await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
    await expect(onFiles).toHaveBeenCalledWith(
      [],
      [
        { file: empty, reason: 'empty' },
        { file: program, reason: 'type' },
      ],
    );
    await waitFor(() =>
      expect(part(canvasElement, 'file-drop-zone-status')).toHaveTextContent('2 files were not added'),
    );
    await expect(box).not.toHaveAttribute('data-drop-target');
  },
};

export const Disabled: Story = {
  args: { isDisabled: true },
};

/** In an 18rem column the icon sits beside the line. */
export const Narrow: Story = {
  render: (args) => (
    <div style={{ width: 'min(18rem, 100%)' }}>
      <FileDropZone {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const icon = part(canvasElement, 'file-drop-zone-icon').getBoundingClientRect();
    const line = part(canvasElement, 'file-drop-zone-line').getBoundingClientRect();
    await expect(icon.right).toBeLessThanOrEqual(line.left);
  },
};

/** A Persian field: the label, the hint and the button in the reader's words, from the right. */
export const RightToLeft: Story = {
  render: () => (
    <I18nProvider locale="fa-IR">
      <div dir="rtl" lang="fa" style={{ width: 'min(32rem, 100%)' }}>
        <FileDropZone
          label="رسیدها"
          description="PDF، JPG یا PNG، تا ۱۰ مگابایت"
          allowsMultiple
          labels={{
            dragHint: 'فایل‌ها را اینجا بکشید یا',
            choose: 'انتخاب فایل‌ها',
            drop: 'برای بارگذاری رها کنید',
            rejected: (count) => `${count} فایل اضافه نشد`,
          }}
          onFiles={onFiles}
        />
      </div>
    </I18nProvider>
  ),
};

/** The three faces of a FileButton: a primary Upload, a secondary Choose files, and Take a photo for a phone. */
export const FileButtons: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-part)' }}>
      <FileButton allowsMultiple onFiles={onFiles}>
        Upload
      </FileButton>
      <FileButton variant="secondary" allowsMultiple onFiles={onFiles}>
        Choose files
      </FileButton>
      <FileButton
        variant="secondary"
        capture="environment"
        acceptedFileTypes={['image/*', '.heic']}
        onFiles={onFiles}
      >
        Take a photo
      </FileButton>
    </div>
  ),
};

/** A page in the shell with a page zone, its Upload button in the header: the keyboard's way in. */
function Documents({ children }: { children?: ReactNode }): ReactElement {
  return (
    <AppShell sidebar={<DemoNav />} header={<DemoHeader title="Documents" />}>
      <div style={{ display: 'grid', gap: 'var(--spacing-peer)', padding: 'var(--spacing-inset)' }}>
        <div>
          <FileButton allowsMultiple onFiles={onFiles}>
            Upload
          </FileButton>
        </div>
        <p data-testid="page">Invoices, receipts and statements, newest first.</p>
        {children}
      </div>
      <PageDropZone
        title="Drop files to upload"
        description="To Documents, 2026"
        acceptedFileTypes={['application/pdf', 'image/*']}
        allowsMultiple
        onFiles={onFiles}
      />
    </AppShell>
  );
}

/** Files dragged over the page: the overlay covers the workspace and leaves the rail in view. */
export const PageOverlay: Story = {
  tags: ['viewport-desktop'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => <Documents />,
  play: async ({ canvasElement }) => {
    fireDrag(part(canvasElement, 'app-shell'), 'dragenter', filesTransfer([pdf()]));
    const overlay = await waitFor(() => part(document, 'page-drop-zone'));
    const rail = part(canvasElement, 'sidebar').getBoundingClientRect();
    const box = overlay.getBoundingClientRect();
    await expect(box.left).toBeGreaterThanOrEqual(rail.right);
    await expect(overlay).toHaveAttribute('aria-hidden', 'true');
  },
};

/** The same at 375: no rail, so the overlay is inset 16px from every edge. */
export const PageOverlayPhone: Story = {
  tags: ['!viewport-desktop', 'viewport-phone'],
  globals: PHONE,
  parameters: { layout: 'fullscreen' },
  render: () => <Documents />,
  play: async ({ canvasElement }) => {
    fireDrag(part(canvasElement, 'app-shell'), 'dragenter', filesTransfer([pdf()]));
    const overlay = await waitFor(() => part(document, 'page-drop-zone'));
    const box = overlay.getBoundingClientRect();
    await expect(box.left).toBeCloseTo(16, 0);
    await expect(box.top).toBeCloseTo(16, 0);
    await expect(window.innerWidth - box.right).toBeCloseTo(16, 0);
    await expect(window.innerHeight - box.bottom).toBeCloseTo(16, 0);
  },
};

// ---- Plays in three engines -----------------------------------------------------------------------------

/** A box a form column wide. */
const COLUMN: CSSProperties = { display: 'grid', gap: 'var(--spacing-peer)', width: 'min(32rem, 100%)' };

/**
 * A drop holding a PDF and a program reaches onFiles once, the PDF accepted and the program refused as a type,
 * and the zone says so; React Aria's drop target state comes and goes. Three engines.
 */
export const DropReachesOnFiles: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement }) => {
    onFiles.mockClear();
    const box = part(canvasElement, 'file-drop-zone-box');
    const data = filesTransfer([pdf(), exe()]);
    dragOver(box, data);
    await waitFor(() => expect(box).toHaveAttribute('data-drop-target'));
    await expect(fireDrag(box, 'drop', data)).toBe(true);
    await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
    const [accepted, rejected] = onFiles.mock.calls[0] as [File[], { file: File; reason: string }[]];
    await expect(accepted.map((file) => file.name)).toEqual(['invoice.pdf']);
    await expect(rejected.map(({ file, reason }) => [file.name, reason])).toEqual([['setup.exe', 'type']]);
    await waitFor(() => expect(box).not.toHaveAttribute('data-drop-target'));
    await waitFor(() =>
      expect(part(canvasElement, 'file-drop-zone-status')).toHaveTextContent('1 files were not added'),
    );
    // A drag of text is no drop target and its drop adds nothing.
    dragOver(box, textTransfer());
    await expect(box).not.toHaveAttribute('data-drop-target');
    fireDrag(box, 'drop', textTransfer());
    await expect(onFiles).toHaveBeenCalledTimes(1);
  },
};

/** Ctrl+V on the zone's button: a paste holding a file reaches onFiles through the same check. Three engines. */
export const PasteReachesOnFiles: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  play: async ({ canvasElement }) => {
    onFiles.mockClear();
    const button = within(canvasElement).getByRole('button', { name: 'Choose files' });
    await focusOn(button);
    const file = png();
    await expect(firePaste(button, filesTransfer([file]))).toBe(true);
    await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
    const [accepted, rejected] = onFiles.mock.calls[0] as [File[], unknown[]];
    await expect(accepted.map((each) => each.name)).toEqual(['receipt.png']);
    await expect(rejected).toEqual([]);
    // A paste of text is left alone.
    await expect(firePaste(button, textTransfer())).toBe(false);
    await expect(onFiles).toHaveBeenCalledTimes(1);
  },
};

/** Tab reaches the zone's button and goes on past the zone: one stop (ruling 3). Three engines. */
export const OneTabStop: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div style={COLUMN}>
      <div>
        <Button variant="secondary">Before</Button>
      </div>
      <FileDropZone {...args} />
      <div>
        <Button variant="secondary">After</Button>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const before = canvas.getByRole('button', { name: 'Before' });
    const tab = async (): Promise<void> => {
      // A play that outlived its story, past a timeout, stops here rather than typing into the next story.
      if (!before.isConnected) throw new Error('The story has gone');
      await userEvent.tab();
    };
    await focusOn(before);
    await tab();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Choose files' })).toHaveFocus());
    await tab();
    await waitFor(() => expect(canvas.getByRole('button', { name: 'After' })).toHaveFocus());
  },
};

/**
 * While a zone is mounted, a files drop beside it is prevented, so the browser never opens the file in the tab;
 * a drop into a text field is left to it. Three engines.
 */
export const MissedDrop: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: (args) => (
    <div style={COLUMN}>
      <FileDropZone {...args} />
      <p data-testid="beside">Beside the zone</p>
      <TextField label="Notes" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    onFiles.mockClear();
    const beside = within(canvasElement).getByTestId('beside');
    const data = filesTransfer([pdf()]);
    await expect(fireDrag(beside, 'dragover', data)).toBe(true);
    await expect(fireDrag(beside, 'drop', data)).toBe(true);
    const notes = within(canvasElement).getByRole('textbox', { name: 'Notes' });
    await expect(fireDrag(notes, 'drop', data)).toBe(false);
    await expect(fireDrag(beside, 'drop', textTransfer())).toBe(false);
    await expect(onFiles).not.toHaveBeenCalled();
  },
};

/** A page with a page zone and two blocks a drag crosses, outside a shell. */
function CounterPage(): ReactElement {
  return (
    <div style={COLUMN}>
      <p data-testid="one">Invoices</p>
      <p data-testid="two">Receipts</p>
      <PageDropZone title="Drop files to upload" allowsMultiple onFiles={onFiles} />
    </div>
  );
}

/**
 * The page zone's counter in three engines: the overlay shows on the first enter holding files, stays while
 * the drag crosses child boundaries in Firefox's order (the enter on the next before the leave of the last) and
 * onto the overlay drawn under it, leaves when the last leave brings the count to zero, and leaves on dragend.
 * A drag of text never shows it.
 */
export const DragCounter: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <CounterPage />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const [one, two] = [canvas.getByTestId('one'), canvas.getByTestId('two')];
    const overlay = (): HTMLElement | null => document.querySelector<HTMLElement>('.page-drop-zone');
    fireDrag(one, 'dragenter', textTransfer());
    await expect(overlay()).toBeNull();
    const data = filesTransfer([pdf()]);
    fireDrag(one, 'dragenter', data);
    const drawn = await waitFor(() => {
      const found = overlay();
      if (found === null) throw new Error('No overlay');
      return found;
    });
    fireDrag(drawn, 'dragenter', data);
    fireDrag(one, 'dragleave', data);
    fireDrag(two, 'dragenter', data);
    fireDrag(drawn, 'dragleave', data);
    await expect(overlay()).not.toBeNull();
    fireDrag(two, 'dragleave', data);
    await waitFor(() => expect(overlay()).toBeNull());
    fireDrag(one, 'dragenter', data);
    await waitFor(() => expect(overlay()).not.toBeNull());
    fireDrag(one, 'dragend', data);
    await waitFor(() => expect(overlay()).toBeNull());
  },
};

/** A drop on the overlay runs the check, reaches onFiles once and the overlay leaves. Three engines. */
export const OverlayDrop: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <CounterPage />,
  play: async ({ canvasElement }) => {
    onFiles.mockClear();
    const data = filesTransfer([pdf(), blank()]);
    fireDrag(within(canvasElement).getByTestId('one'), 'dragenter', data);
    const drawn = await waitFor(() => part(document, 'page-drop-zone'));
    await expect(dropOn(drawn, data)).toBe(true);
    await waitFor(() => expect(onFiles).toHaveBeenCalledTimes(1));
    const [accepted, rejected] = onFiles.mock.calls[0] as [File[], { file: File; reason: string }[]];
    await expect(accepted.map((file) => file.name)).toEqual(['invoice.pdf']);
    await expect(rejected.map(({ file, reason }) => [file.name, reason])).toEqual([['blank.pdf', 'empty']]);
    await waitFor(() => expect(document.querySelector('.page-drop-zone')).toBeNull());
  },
};

/** Under an open dialog the page zone stands down: a drag holding files shows no overlay. Chromium. */
export const StandsDownUnderModal: Story = {
  tags: ['no-visual'],
  render: () => (
    <>
      <CounterPage />
      <Dialog defaultOpen title="Rename the folder" actions={<Button slot="close">Done</Button>} />
    </>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => expect(document.querySelector('.dialog')).not.toBeNull());
    fireDrag(within(canvasElement).getByTestId('one'), 'dragenter', filesTransfer([pdf()]));
    // Long enough for a render that would draw it.
    await new Promise((resolve) => setTimeout(resolve, 100));
    await expect(document.querySelector('.page-drop-zone')).toBeNull();
  },
};
