import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent as ReactClipboardEvent,
  type DragEvent as ReactDragEvent,
  type ReactElement,
} from 'react';
import {
  DropZone,
  isDirectoryDropItem,
  isFileDropItem,
  Text,
  useDrop,
  type DropItem,
  type DropOperation,
} from 'react-aria-components';
import { expect, userEvent, waitFor } from 'storybook/test';
import { focusOn } from '../stories/focus';

/**
 * The spike FileDropZone and PageDropZone are built on (plan Task 2, Step 1; spec risks R1 and R2), kept as the
 * record of what the zones rely on in Chromium, WebKit and Firefox. A drag of files cannot be made by a test
 * runner's pointer, so every play builds the events itself: a `DataTransfer` holding `File`s, put on a
 * `DragEvent` or a `ClipboardEvent` by its constructor where the engine takes it there, and defined on the
 * event otherwise. Each play logs what it saw, one line per story and engine, `drop-spike <engine> <story>
 * <json>`, which the runner prints when the play fails, and pins where the engines differ in `FOUND`, so the
 * file is the record of the plan's spike results (spec correction 5 and "Spike results (Task 2)").
 */
const meta = {
  title: 'Checks/Drop spike',
  tags: ['no-visual', 'webkit', 'firefox'],
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

type Engine = 'chromium' | 'webkit' | 'firefox';

/** The engine, for the log line and for what the spike found each engine does. */
function engine(): Engine {
  const agent = navigator.userAgent;
  if (agent.includes('Firefox/')) return 'firefox';
  if (agent.includes('Chrome/')) return 'chromium';
  return 'webkit';
}

/** What the spike found an engine does, where the engines differ. */
const inThis = <Found extends Record<Engine, unknown>>(found: Found): Found[Engine] => found[engine()];

/** Logs what a play saw. The runner prints a play's log when the play fails, so a failure carries its facts. */
function record(story: string, facts: Record<string, unknown>): void {
  console.log(`drop-spike ${engine()} ${story} ${JSON.stringify(facts)}`);
}

/**
 * How each engine builds the play's events and reads its transfer, as the spike found it. A script's transfer
 * allows no operation ('none') and Chromium and WebKit ignore its setter; and React Aria reads a dropped file
 * only through `webkitGetAsEntry()`, which in Chromium gives no entry for a file a script made, so there React
 * Aria's `onDrop` sees no file item for a synthetic drop, though the native transfer holds the files in every
 * engine. A real drop from the desktop has its entries; the library reads the transfer
 * itself so a play and a real drop take one path (spec correction 5).
 */
const FOUND = {
  dragEvent: { chromium: 'constructor', webkit: 'constructor', firefox: 'constructor' },
  // Firefox's ClipboardEvent constructor drops `clipboardData`, so the play defines it on the event.
  pasteEvent: { chromium: 'constructor', webkit: 'constructor', firefox: 'defined' },
  effectAllowed: {
    chromium: { initial: 'none', setterTook: false },
    webkit: { initial: 'none', setterTook: false },
    firefox: { initial: 'none', setterTook: true },
  },
  entry: { chromium: null, webkit: 'file', firefox: 'file' },
} as const satisfies Record<string, Record<Engine, unknown>>;

/** The files React Aria's `onDrop` reads from a synthetic drop of `names` in this engine. */
const reactAriaReads = (names: readonly string[]): readonly string[] =>
  inThis(FOUND.entry) === null ? [] : names;

const pdf = (): File => new File(['%PDF-1.7'], 'invoice.pdf', { type: 'application/pdf' });
const png = (): File => new File(['PNG'], 'receipt.png', { type: 'image/png' });

/** What a new transfer allows, and whether its setter took 'all', per engine, for the log. */
let initialEffect = '';
let effectSetterTook = false;

/**
 * Makes `data` allow every operation, as a drag from another app does. A transfer a script makes allows none
 * ('none'), and an engine may ignore the setter outside a real drag's `dragstart`; React Aria cancels a drag
 * that allows none, so where the setter does not take, the play defines the property on the transfer.
 */
function allowAll(data: DataTransfer): void {
  initialEffect = data.effectAllowed;
  data.effectAllowed = 'all';
  // Read again: the setter may not have taken.
  effectSetterTook = (data.effectAllowed as string) === 'all';
  if (!effectSetterTook) Object.defineProperty(data, 'effectAllowed', { value: 'all' });
}

/** A `DataTransfer` holding `files`, as a drag from the desktop holds them. */
function transfer(files: readonly File[]): DataTransfer {
  const data = new DataTransfer();
  for (const file of files) data.items.add(file);
  allowAll(data);
  return data;
}

/** A transfer holding text only, as a drag of a link or a selection does. */
function textTransfer(): DataTransfer {
  const data = new DataTransfer();
  data.setData('text/plain', 'Not a file');
  allowAll(data);
  return data;
}

/** How the engine took the transfer: through the event's constructor, or defined on the event by the play. */
type Built = 'constructor' | 'defined';

/**
 * A bubbling, cancelable drag event holding `data`. Where the engine's `DragEvent` constructor drops the
 * transfer (or has no `DragEvent`), the event is a plain `Event` with `dataTransfer` defined on it, which is
 * all React and React Aria read.
 */
function dragEvent(type: string, data: DataTransfer, at = { x: 10, y: 10 }): { event: Event; built: Built } {
  const init = { bubbles: true, cancelable: true, composed: true, clientX: at.x, clientY: at.y };
  if (typeof DragEvent === 'function') {
    const event = new DragEvent(type, { ...init, dataTransfer: data });
    if (event.dataTransfer === data) return { event, built: 'constructor' };
  }
  const event = new MouseEvent(type, init);
  Object.defineProperty(event, 'dataTransfer', { value: data });
  return { event, built: 'defined' };
}

/** Dispatches `type` on `target` holding `data`, and returns whether its default was prevented. */
function fire(target: EventTarget, type: string, data: DataTransfer): { prevented: boolean; built: Built } {
  const { event, built } = dragEvent(type, data);
  target.dispatchEvent(event);
  return { prevented: event.defaultPrevented, built };
}

/** A paste holding `data`, through `ClipboardEvent`'s constructor where it keeps the data, else defined. */
function pasteEvent(data: DataTransfer): { event: Event; built: Built } {
  const init = { bubbles: true, cancelable: true, composed: true };
  if (typeof ClipboardEvent === 'function') {
    const event = new ClipboardEvent('paste', { ...init, clipboardData: data });
    if (event.clipboardData === data) return { event, built: 'constructor' };
    Object.defineProperty(event, 'clipboardData', { value: data });
    return { event, built: 'defined' };
  }
  const event = new Event('paste', init);
  Object.defineProperty(event, 'clipboardData', { value: data });
  return { event, built: 'defined' };
}

/** Whether a drag holds files: `types` includes 'Files' in every engine, Safari's included. */
const holdsFiles = (data: DataTransfer | null): boolean => data?.types.includes('Files') === true;

/** What each item of a transfer looks like to a reader that does not go through React Aria. */
function describeItems(data: DataTransfer | null): Record<string, unknown>[] {
  if (data === null) return [];
  return [...data.items].map((item) => {
    const entry =
      typeof item.webkitGetAsEntry === 'function'
        ? item.webkitGetAsEntry()
        : ('no webkitGetAsEntry' as const);
    return {
      kind: item.kind,
      type: item.type,
      entry: entry === null ? null : typeof entry === 'string' ? entry : entry.isFile ? 'file' : 'directory',
      file: item.getAsFile()?.name ?? null,
    };
  });
}

/** What a React Aria drop event held, the files read. */
async function readDrop(event: {
  items: readonly DropItem[];
  dropOperation: DropOperation;
}): Promise<Record<string, unknown>> {
  const files = await Promise.all(event.items.filter(isFileDropItem).map((item) => item.getFile()));
  return {
    operation: event.dropOperation,
    kinds: event.items.map((item) => item.kind),
    files: files.map((file) => file.name),
    directories: event.items.filter(isDirectoryDropItem).length,
  };
}

/** The facts a story's parts write as the play runs, read back by the play. */
interface Seen {
  drops: Record<string, unknown>[];
  native: Record<string, unknown>[];
  pastes: Record<string, unknown>[];
  operations: string[];
}

const seen: Seen = { drops: [], native: [], pastes: [], operations: [] };

function resetSeen(): void {
  seen.drops = [];
  seen.native = [];
  seen.pastes = [];
  seen.operations = [];
}

/**
 * A box with React Aria's `useDrop` and no drop button, as FileDropZone's box would be: 'copy' for a drag
 * holding files and 'cancel' otherwise, read from the native event in the capture phase, since React Aria's
 * `DragTypes` does not say whether the drag holds files.
 */
function UseDropBox({ label = 'Drop files here' }: { label?: string }): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const files = useRef(false);
  const { dropProps, isDropTarget } = useDrop({
    ref,
    hasDropButton: false,
    getDropOperation: (): DropOperation => {
      const operation: DropOperation = files.current ? 'copy' : 'cancel';
      seen.operations.push(operation);
      return operation;
    },
    onDrop: (event) => {
      void readDrop(event).then((facts) => {
        seen.drops.push(facts);
      });
    },
  });
  const note = (event: ReactDragEvent<HTMLDivElement>): void => {
    files.current = holdsFiles(event.dataTransfer);
  };
  return (
    <div
      {...dropProps}
      ref={ref}
      data-testid="box"
      data-drop-target={isDropTarget || undefined}
      onDragEnterCapture={note}
      onDragOverCapture={note}
      onDropCapture={(event) => {
        seen.native.push({
          types: [...event.dataTransfer.types],
          files: [...event.dataTransfer.files].map((file) => file.name),
          items: describeItems(event.dataTransfer),
        });
      }}
      style={{ padding: 24, border: '2px dashed var(--color-boundary)', width: 'min(24rem, 100%)' }}
    >
      <span data-testid="child">{label}</span>
    </div>
  );
}

const boxOf = (scope: HTMLElement): HTMLElement => {
  const box = scope.querySelector<HTMLElement>('[data-testid="box"]');
  if (box === null) throw new Error('No box');
  return box;
};

/**
 * (a) A drop holding two files reaches `useDrop`'s `onDrop` on a box with no drop button: the box turns drop
 * target on the drag's entry, and the drop reads as React Aria reads it and as the native transfer holds it.
 */
export const UseDropFiles: Story = {
  render: () => <UseDropBox />,
  play: async ({ canvasElement }) => {
    resetSeen();
    const box = boxOf(canvasElement);
    const data = transfer([pdf(), png()]);
    const enter = fire(box, 'dragenter', data);
    const over = fire(box, 'dragover', data);
    await waitFor(() => expect(box).toHaveAttribute('data-drop-target'));
    const drop = fire(box, 'drop', data);
    await waitFor(() => expect(seen.drops).toHaveLength(1));
    await waitFor(() => expect(box).not.toHaveAttribute('data-drop-target'));
    const facts = {
      built: enter.built,
      effectAllowed: { initial: initialEffect, setterTook: effectSetterTook },
      types: [...data.types],
      prevented: { enter: enter.prevented, over: over.prevented, drop: drop.prevented },
      operations: seen.operations,
      reactAria: seen.drops[0],
      native: seen.native[0],
    };
    record('UseDropFiles', facts);
    await expect(drop.prevented).toBe(true);
    await expect(seen.operations[0]).toBe('copy');
    await expect(seen.native[0]?.files).toEqual(['invoice.pdf', 'receipt.png']);
    await expect(facts.built).toBe(inThis(FOUND.dragEvent));
    await expect(facts.effectAllowed).toEqual(inThis(FOUND.effectAllowed));
    await expect(describeItems(data).map((item) => item.entry)).toEqual([
      inThis(FOUND.entry),
      inThis(FOUND.entry),
    ]);
    await expect(seen.drops[0]?.files).toEqual(reactAriaReads(['invoice.pdf', 'receipt.png']));
  },
};

/** A drag of text over the same box is cancelled: no drop look, and its drop reads no file. */
export const UseDropText: Story = {
  render: () => <UseDropBox />,
  play: async ({ canvasElement }) => {
    resetSeen();
    const box = boxOf(canvasElement);
    const data = textTransfer();
    fire(box, 'dragenter', data);
    fire(box, 'dragover', data);
    await expect(box).not.toHaveAttribute('data-drop-target');
    fire(box, 'drop', data);
    await waitFor(() => expect(seen.drops).toHaveLength(1));
    record('UseDropText', { operations: seen.operations, reactAria: seen.drops[0], native: seen.native[0] });
    await expect(seen.operations).toContain('cancel');
    await expect(seen.drops[0]?.files).toEqual([]);
  },
};

/**
 * (b) The same through React Aria's `DropZone`, with its hidden button taken out of the tab order through a
 * ref: Tab from the button before it reaches the button after it, and the drop reaches `onDrop`.
 */
function DropZoneBox(): ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const hidden = ref.current?.querySelector('button');
    if (hidden) hidden.tabIndex = -1;
  }, []);
  return (
    <div style={{ display: 'grid', gap: 16, width: 'min(24rem, 100%)' }}>
      <button type="button">Before</button>
      {/* The drop's native transfer, read before React Aria's handler on the zone, for the log. */}
      <div
        onDropCapture={(event) => {
          seen.native.push({
            files: [...event.dataTransfer.files].map((file) => file.name),
            items: describeItems(event.dataTransfer),
          });
        }}
      >
        <DropZone
          ref={ref}
          data-testid="box"
          getDropOperation={(types) => {
            seen.operations.push(types.has('application/pdf') ? 'pdf' : 'other');
            return 'copy';
          }}
          onDrop={(event) => {
            void readDrop(event).then((facts) => {
              seen.drops.push(facts);
            });
          }}
          style={{ padding: 24, border: '2px dashed var(--color-boundary)' }}
        >
          <Text slot="label">Drop files here</Text>
        </DropZone>
      </div>
      <button type="button">After</button>
    </div>
  );
}

export const DropZoneFiles: Story = {
  render: () => <DropZoneBox />,
  play: async ({ canvasElement }) => {
    resetSeen();
    const box = boxOf(canvasElement);
    const [before, hidden, after] = [...canvasElement.querySelectorAll('button')];
    if (before === undefined || hidden === undefined || after === undefined) throw new Error('No buttons');
    await waitFor(() => expect(hidden.tabIndex).toBe(-1));
    await focusOn(before);
    if (!before.isConnected) throw new Error('The story has gone');
    await userEvent.tab();
    await waitFor(() => expect(after).toHaveFocus());
    const data = transfer([pdf(), png()]);
    fire(box, 'dragenter', data);
    fire(box, 'dragover', data);
    const drop = fire(box, 'drop', data);
    await waitFor(() => expect(seen.drops).toHaveLength(1));
    record('DropZoneFiles', {
      hiddenName: hidden.getAttribute('aria-label'),
      operations: seen.operations,
      reactAria: seen.drops[0],
      native: seen.native[0],
      prevented: drop.prevented,
    });
    await expect(drop.prevented).toBe(true);
    await expect(seen.native[0]?.files).toEqual(['invoice.pdf', 'receipt.png']);
    await expect(seen.drops[0]?.files).toEqual(reactAriaReads(['invoice.pdf', 'receipt.png']));
  },
};

/**
 * (c) A paste on a focused button bubbles to the box around it with the clipboard's files, the zone's way in
 * for Ctrl+V (ruling 3); the box prevents its default.
 */
function PasteBox(): ReactElement {
  const onPaste = (event: ReactClipboardEvent<HTMLDivElement>): void => {
    const files = [...event.clipboardData.files];
    seen.pastes.push({
      target: (event.target as Element).tagName.toLowerCase(),
      files: files.map((file) => file.name),
      types: [...event.clipboardData.types],
    });
    if (files.length > 0) event.preventDefault();
  };
  return (
    // A paste on the button bubbles here; the button is the tab stop.
    <div
      data-testid="box"
      onPaste={onPaste}
      style={{ padding: 24, border: '2px dashed var(--color-boundary)' }}
    >
      <button type="button">Choose files</button>
    </div>
  );
}

export const PasteOnButton: Story = {
  render: () => <PasteBox />,
  play: async ({ canvasElement }) => {
    resetSeen();
    const button = canvasElement.querySelector('button');
    if (button === null) throw new Error('No button');
    await focusOn(button);
    const { event, built } = pasteEvent(transfer([png()]));
    button.dispatchEvent(event);
    const text = pasteEvent(textTransfer());
    button.dispatchEvent(text.event);
    record('PasteOnButton', {
      built,
      pastes: seen.pastes,
      prevented: event.defaultPrevented,
      textPrevented: text.event.defaultPrevented,
    });
    await expect(seen.pastes[0]).toEqual(
      expect.objectContaining({ target: 'button', files: ['receipt.png'] }),
    );
    await expect(event.defaultPrevented).toBe(true);
    await expect(text.event.defaultPrevented).toBe(false);
    await expect(built).toBe(inThis(FOUND.pasteEvent));
  },
};

/**
 * (d) The page zone's counter on the document: one up on every `dragenter` holding files, one down on every
 * `dragleave`, so a drag that crosses a parent and two children, as Firefox reports each boundary, comes back to
 * zero only when it leaves the last; a drop and `dragend` reset it. `types` includes 'Files' on the enter.
 */
const counter = { depth: 0, shown: false, peak: 0, typesOnEnter: [] as string[][] };

function CounterBox(): ReactElement {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    counter.depth = 0;
    counter.shown = false;
    counter.peak = 0;
    counter.typesOnEnter = [];
    const show = (next: boolean): void => {
      counter.shown = next;
      setShown(next);
    };
    const enter = (event: DragEvent): void => {
      counter.typesOnEnter.push([...(event.dataTransfer?.types ?? [])]);
      if (!holdsFiles(event.dataTransfer)) return;
      counter.depth += 1;
      counter.peak = Math.max(counter.peak, counter.depth);
      if (counter.depth === 1) show(true);
    };
    const leave = (): void => {
      if (counter.depth === 0) return;
      counter.depth -= 1;
      if (counter.depth === 0) show(false);
    };
    const end = (): void => {
      counter.depth = 0;
      show(false);
    };
    document.addEventListener('dragenter', enter);
    document.addEventListener('dragleave', leave);
    document.addEventListener('drop', end);
    document.addEventListener('dragend', end);
    return () => {
      document.removeEventListener('dragenter', enter);
      document.removeEventListener('dragleave', leave);
      document.removeEventListener('drop', end);
      document.removeEventListener('dragend', end);
    };
  }, []);
  return (
    <div
      data-testid="parent"
      data-shown={shown || undefined}
      style={{ padding: 24, display: 'grid', gap: 8 }}
    >
      <div data-testid="one">One</div>
      <div data-testid="two">Two</div>
    </div>
  );
}

export const Counter: Story = {
  render: () => <CounterBox />,
  play: async ({ canvasElement }) => {
    const get = (id: string): HTMLElement => {
      const element = canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (element === null) throw new Error(`No ${id}`);
      return element;
    };
    const [parent, one, two] = [get('parent'), get('one'), get('two')];
    const data = transfer([pdf()]);
    // Firefox's order across child boundaries: the enter on the next element before the leave of the last.
    const steps: [HTMLElement, string][] = [
      [parent, 'dragenter'],
      [one, 'dragenter'],
      [parent, 'dragleave'],
      [two, 'dragenter'],
      [one, 'dragleave'],
      [parent, 'dragenter'],
      [two, 'dragleave'],
    ];
    const depths: number[] = [];
    for (const [target, type] of steps) {
      fire(target, type, data);
      depths.push(counter.depth);
    }
    await waitFor(() => expect(parent).toHaveAttribute('data-shown'));
    const textEnter = fire(parent, 'dragenter', textTransfer());
    const afterText = counter.depth;
    fire(parent, 'dragleave', data);
    await waitFor(() => expect(parent).not.toHaveAttribute('data-shown'));
    const leftAt = counter.depth;
    // A drop and a dragend each reset it, wherever the counter stood.
    fire(one, 'dragenter', data);
    fire(two, 'dragenter', data);
    fire(two, 'drop', data);
    const afterDrop = counter.depth;
    fire(one, 'dragenter', data);
    fire(one, 'dragend', data);
    const afterEnd = counter.depth;
    record('Counter', {
      depths,
      afterText,
      textPrevented: textEnter.prevented,
      leftAt,
      afterDrop,
      afterEnd,
      peak: counter.peak,
      typesOnEnter: counter.typesOnEnter,
    });
    await expect(depths).toEqual([1, 2, 1, 2, 1, 2, 1]);
    await expect(afterText).toBe(1);
    await expect(leftAt).toBe(0);
    await expect(afterDrop).toBe(0);
    await expect(afterEnd).toBe(0);
    await expect(counter.typesOnEnter[0]).toContain('Files');
    await waitFor(() => expect(parent).not.toHaveAttribute('data-shown'));
  },
};

/**
 * (e) A missed drop: while held, a document listener prevents the default of a files `dragover` and `drop`
 * that land beside the box, so the browser never opens the file in the tab; a drop into a text field, a native
 * file input, a drag of text and a drop the box already took are left alone.
 */
function isEditable(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  if (target.closest('input, textarea, [contenteditable=""], [contenteditable="true"]') !== null) return true;
  return false;
}

function MissedDropBox(): ReactElement {
  useEffect(() => {
    const hold = (event: DragEvent): void => {
      if (event.defaultPrevented || !holdsFiles(event.dataTransfer) || isEditable(event.target)) return;
      event.preventDefault();
    };
    document.addEventListener('dragover', hold);
    document.addEventListener('drop', hold);
    return () => {
      document.removeEventListener('dragover', hold);
      document.removeEventListener('drop', hold);
    };
  }, []);
  return (
    <div style={{ display: 'grid', gap: 16, width: 'min(24rem, 100%)' }}>
      <UseDropBox />
      <p data-testid="beside">Beside the box</p>
      <input aria-label="Notes" data-testid="text" />
      <input type="file" aria-label="Attachment" data-testid="file" />
    </div>
  );
}

export const MissedDrop: Story = {
  render: () => <MissedDropBox />,
  play: async ({ canvasElement }) => {
    resetSeen();
    const get = (id: string): HTMLElement => {
      const element = canvasElement.querySelector<HTMLElement>(`[data-testid="${id}"]`);
      if (element === null) throw new Error(`No ${id}`);
      return element;
    };
    const data = transfer([pdf()]);
    const beside = { over: fire(get('beside'), 'dragover', data), drop: fire(get('beside'), 'drop', data) };
    const text = fire(get('text'), 'drop', data);
    const file = fire(get('file'), 'drop', data);
    const words = fire(get('beside'), 'drop', textTransfer());
    const box = fire(get('box'), 'drop', data);
    await waitFor(() => expect(seen.drops).toHaveLength(1));
    record('MissedDrop', {
      beside: { over: beside.over.prevented, drop: beside.drop.prevented },
      text: text.prevented,
      file: file.prevented,
      words: words.prevented,
      box: box.prevented,
      boxFiles: seen.native[0]?.files,
    });
    await expect(beside.over.prevented).toBe(true);
    await expect(beside.drop.prevented).toBe(true);
    await expect(text.prevented).toBe(false);
    await expect(file.prevented).toBe(false);
    await expect(words.prevented).toBe(false);
    await expect(box.prevented).toBe(true);
    await expect(seen.native[0]?.files).toEqual(['invoice.pdf']);
  },
};

/**
 * (f) A drop target drawn mid-drag, as the page overlay appears under the pointer: a `dragenter` holding files
 * on the document draws a `useDrop` box, and the enter, over and drop that follow on it reach its `onDrop`.
 */
function DrawnMidDragBox(): ReactElement {
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const enter = (event: DragEvent): void => {
      if (holdsFiles(event.dataTransfer)) setDrawn(true);
    };
    document.addEventListener('dragenter', enter);
    return () => {
      document.removeEventListener('dragenter', enter);
    };
  }, []);
  return (
    <div style={{ display: 'grid', gap: 16, width: 'min(24rem, 100%)' }}>
      <p data-testid="page">The page</p>
      {drawn ? <UseDropBox label="Drop to upload" /> : null}
    </div>
  );
}

export const DrawnMidDrag: Story = {
  render: () => <DrawnMidDragBox />,
  play: async ({ canvasElement }) => {
    resetSeen();
    const page = canvasElement.querySelector('[data-testid="page"]');
    if (page === null) throw new Error('No page');
    const data = transfer([pdf(), png()]);
    fire(page, 'dragenter', data);
    const box = await waitFor(() => boxOf(canvasElement));
    fire(box, 'dragenter', data);
    fire(box, 'dragover', data);
    await waitFor(() => expect(box).toHaveAttribute('data-drop-target'));
    fire(box, 'drop', data);
    await waitFor(() => expect(seen.drops).toHaveLength(1));
    record('DrawnMidDrag', { reactAria: seen.drops[0], native: seen.native[0] });
    await expect(seen.native[0]?.files).toEqual(['invoice.pdf', 'receipt.png']);
    await expect(seen.drops[0]?.files).toEqual(reactAriaReads(['invoice.pdf', 'receipt.png']));
  },
};
