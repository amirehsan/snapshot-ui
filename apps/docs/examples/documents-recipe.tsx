'use client';

import {
  Breadcrumb,
  Breadcrumbs,
  DatePicker,
  FileButton,
  Link,
  NumberField,
  PageColumn,
  PageDropZone,
  PageHeader,
  RouterProvider,
  SaveBar,
  Switch,
  Text,
  TextField,
  UploadTray,
  type FileRejection,
  type UploadItem,
} from '@snapshot-ui/react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from 'react';
import {
  dayLabel,
  DOCUMENTS,
  documentOf,
  outcomeOf,
  sizeLabel,
  type DocumentLine,
  type DocumentRecord,
} from './documents-data';

/** What the Upload button, the page zone and the server take: list an extension beside each MIME type. */
const TYPES = ['application/pdf', '.pdf', 'image/jpeg', '.jpg', '.jpeg', 'image/png', '.png', '.heic'];

/** A row of the tray, with the size the app keeps to write its progress words. */
interface Upload extends UploadItem {
  id: string;
  size: number;
}

/** The uploads provider an app keeps in its root layout: the files in flight and the documents they became. */
interface Uploads {
  items: Upload[];
  documents: DocumentRecord[];
  add: (files: File[]) => void;
  retry: (id: UploadItem['id']) => void;
  remove: (id: UploadItem['id']) => void;
  cancel: (id: UploadItem['id']) => void;
  clear: () => void;
  cancelAll: () => void;
  save: (record: DocumentRecord) => void;
}

/**
 * The provider's state and its upload code. In an app each file goes to the server with `XMLHttpRequest`, whose
 * `upload.onprogress` moves the bar; here timers stand in for the request and for the server's reading, since the
 * docs make no request.
 */
function useUploads(hrefOf: (id: string) => string): Uploads {
  const [items, setItems] = useState<Upload[]>([]);
  const [documents, setDocuments] = useState<DocumentRecord[]>(() => [...DOCUMENTS]);
  const timers = useRef(new Map<string, number[]>());
  const count = useRef(0);

  const stop = useCallback((id: string): void => {
    for (const timer of timers.current.get(id) ?? []) window.clearTimeout(timer);
    timers.current.delete(id);
  }, []);
  useEffect(() => {
    const all = timers.current;
    return () => {
      for (const list of all.values()) for (const timer of list) window.clearTimeout(timer);
      all.clear();
    };
  }, []);

  const put = useCallback((next: Upload): void => {
    setItems((current) => current.map((item) => (item.id === next.id ? next : item)));
  }, []);

  /** Sends one file: waiting, then uploading in five steps, then read by the server, then its outcome. */
  const run = useCallback(
    (id: string, name: string, size: number, delay: number): void => {
      stop(id);
      const steps: [number, () => void][] = [];
      for (let step = 0; step <= 5; step += 1) {
        const progress = step / 5;
        steps.push([
          delay + step * 200,
          () => {
            put({
              id,
              name,
              size,
              status: 'uploading',
              progress,
              progressLabel: sizeLabel(size * progress, size),
            });
          },
        ]);
      }
      steps.push([
        delay + 1200,
        () => {
          put({ id, name, size, status: 'reading' });
        },
      ]);
      steps.push([
        delay + 2400,
        () => {
          timers.current.delete(id);
          const outcome = outcomeOf({ name, size });
          if (outcome.status === 'failed') {
            put({ id, name, size, status: 'failed', reason: outcome.reason });
            return;
          }
          // The file is a document now: it joins the list, and its row links there.
          setDocuments((current) => [
            documentOf(id, name, outcome),
            ...current.filter((each) => each.id !== id),
          ]);
          put(
            outcome.status === 'review'
              ? { id, name, size, status: 'review', reason: outcome.reason, href: hrefOf(id) }
              : { id, name, size, status: 'saved', href: hrefOf(id) },
          );
        },
      ]);
      timers.current.set(
        id,
        steps.map(([ms, step]) => window.setTimeout(step, ms)),
      );
    },
    [hrefOf, put, stop],
  );

  const add = (files: File[]): void => {
    const added = files.map((file): Upload => {
      count.current += 1;
      return { id: `upload-${String(count.current)}`, name: file.name, size: file.size, status: 'waiting' };
    });
    setItems((current) => [...added, ...current]);
    // Two at a time would be a real app's queue; here each starts a moment after the one before.
    added.forEach((item, index) => {
      run(item.id, item.name, item.size, 400 + index * 400);
    });
  };
  const drop = (ids: readonly string[]): void => {
    for (const id of ids) stop(id);
    setItems((current) => current.filter((item) => !ids.includes(item.id)));
  };
  const settled = (item: Upload): boolean =>
    item.status === 'saved' || item.status === 'review' || item.status === 'failed';
  return {
    items,
    documents,
    add,
    retry: (id) => {
      const item = items.find((each) => each.id === id);
      if (item === undefined) return;
      put({ id: item.id, name: item.name, size: item.size, status: 'waiting' });
      run(item.id, item.name, item.size, 400);
    },
    remove: (id) => {
      drop([String(id)]);
    },
    // A cancelled upload is aborted (`request.abort()`) and leaves the list.
    cancel: (id) => {
      drop([String(id)]);
    },
    clear: () => {
      drop(items.filter(settled).map((item) => item.id));
    },
    cancelAll: () => {
      drop(
        items
          .filter((item) => item.status === 'waiting' || item.status === 'uploading')
          .map((item) => item.id),
      );
    },
    save: (record) => {
      setDocuments((current) => current.map((each) => (each.id === record.id ? record : each)));
    },
  };
}

/** Gives focus to the heading a view opened with, once, after the save bar's action moved to it. */
function useHeadingFocus(header: RefObject<HTMLElement | null>, focusHeadingRef: RefObject<boolean>): void {
  useEffect(() => {
    if (!focusHeadingRef.current) return;
    focusHeadingRef.current = false;
    const heading = header.current?.querySelector<HTMLElement>('.page-header-title');
    if (heading == null) return;
    // A heading that takes focus from a script only, as a side panel's does.
    heading.tabIndex = -1;
    heading.focus();
  }, [header, focusHeadingRef]);
}

interface ViewProps {
  uploads: Uploads;
  listHref: string;
  hrefOf: (id: string) => string;
  focusHeadingRef: RefObject<boolean>;
}

/** The Documents page: its header with the Upload button, the page zone behind a switch, and the documents. */
function DocumentsView({ uploads, hrefOf, focusHeadingRef }: ViewProps): ReactElement {
  const header = useRef<HTMLElement>(null);
  useHeadingFocus(header, focusHeadingRef);
  const [isOn, setOn] = useState(false);
  const [refused, setRefused] = useState<string[]>([]);
  const take = (accepted: File[], rejected: FileRejection[]): void => {
    uploads.add(accepted);
    setRefused(rejected.map(({ file }) => file.name));
  };
  return (
    <>
      <PageHeader
        ref={header}
        // An example on a docs page, which has its own h1; a page's own header keeps the default, 1.
        headingLevel={2}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb href="/docs">Home</Breadcrumb>
            <Breadcrumb>Documents</Breadcrumb>
          </Breadcrumbs>
        }
        title="Documents"
        description="Receipts and statements, read and filed. Review each one the server has read."
        actions={
          // The page zone's keyboard twin, beside the title it uploads to.
          <FileButton acceptedFileTypes={TYPES} allowsMultiple onFiles={take}>
            Upload
          </FileButton>
        }
      />
      <PageColumn className="stack">
        <Switch isSelected={isOn} onChange={setOn}>
          Drop anywhere on this page
        </Switch>
        {refused.length === 0 ? null : (
          <Text size="small" tone="muted" className="documents-refused">
            {`Not added: ${refused.join(', ')}`}
          </Text>
        )}
        <ul className="stack" style={{ margin: 0, padding: 0, listStyle: 'none' }} aria-label="Documents">
          {uploads.documents.map((record) => (
            <li key={record.id} style={{ display: 'grid', gap: '0.25rem' }}>
              <Link href={hrefOf(record.id)}>{record.name}</Link>
              <Text size="small" tone="muted">
                {`${record.isReviewed ? 'Reviewed' : 'To review'}, ${String(record.lines.length)} ${
                  record.lines.length === 1 ? 'line' : 'lines'
                }`}
              </Text>
            </li>
          ))}
        </ul>
      </PageColumn>
      {/* In an app, mount the page zone at the page's root, beside its header: it draws its overlay in the shell. */}
      {isOn ? (
        <PageDropZone
          title="Drop files to upload"
          description="To Documents"
          acceptedFileTypes={TYPES}
          allowsMultiple
          onFiles={take}
        />
      ) : null}
    </>
  );
}

const head: CSSProperties = { textAlign: 'start', fontWeight: 500, paddingBlockEnd: 4 };

/** A document's review: a grid of fields per line and a save bar that moves on to the next document. */
function DocumentView({
  uploads,
  listHref,
  hrefOf,
  focusHeadingRef,
  record,
}: ViewProps & { record: DocumentRecord }): ReactElement {
  const router = useRouter();
  const header = useRef<HTMLElement>(null);
  useHeadingFocus(header, focusHeadingRef);
  const [lines, setLines] = useState(record.lines);
  const [problem, setProblem] = useState('');
  const change = (id: string, patch: Partial<DocumentLine>): void => {
    setLines((current) => current.map((line) => (line.id === id ? { ...line, ...patch } : line)));
  };
  const savedOf = (id: string): DocumentLine | undefined => record.lines.find((line) => line.id === id);
  const changes = lines.reduce((sum, line) => {
    const saved = savedOf(line.id);
    return sum + (['date', 'amount', 'memo'] as const).filter((key) => saved?.[key] !== line[key]).length;
  }, 0);
  const invalid = lines.filter((line) => line.date === null || line.amount <= 0).length;
  const others = uploads.documents.filter((each) => !each.isReviewed && each.id !== record.id);
  const next = others[0];
  return (
    <>
      <PageHeader
        ref={header}
        headingLevel={2}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb href="/docs">Home</Breadcrumb>
            <Breadcrumb href={listHref}>Documents</Breadcrumb>
            <Breadcrumb>{record.name}</Breadcrumb>
          </Breadcrumbs>
        }
        title={record.name}
        description={record.isReviewed ? 'Reviewed.' : 'Check each line against the document, then confirm.'}
      />
      <PageColumn>
        {/* The holder of the grid and its save bar, whose last child the bar is. */}
        <section aria-label="Review" style={{ width: '100%', minWidth: 0 }}>
          <div style={{ width: '100%', overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: '8px 12px', marginInline: -8 }}>
              <thead>
                <tr>
                  {['Line', 'Date', 'Amount', 'Memo'].map((name) => (
                    <th key={name} id={`${record.id}-${name.toLowerCase()}`} scope="col" style={head}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => {
                  const saved = savedOf(line.id);
                  // Each field is named by its column's header and its line: "Date Line 1".
                  const named = (column: string): string => `${record.id}-${column} ${record.id}-${line.id}`;
                  return (
                    <tr key={line.id}>
                      <th id={`${record.id}-${line.id}`} scope="row" style={{ ...head, fontWeight: 450 }}>
                        {`Line ${String(index + 1)}`}
                      </th>
                      <td style={{ minWidth: '12rem' }}>
                        <DatePicker
                          aria-labelledby={named('date')}
                          value={line.date}
                          valueLabel={line.date === null ? undefined : dayLabel(line.date)}
                          today="2026-10-16"
                          isChanged={line.date !== saved?.date}
                          isInvalid={line.date === null}
                          errorMessage="Enter the date on the document."
                          onChange={(date) => {
                            change(line.id, { date });
                          }}
                        />
                      </td>
                      <td style={{ minWidth: '9rem' }}>
                        <NumberField
                          aria-labelledby={named('amount')}
                          money={{ symbol: '$' }}
                          value={line.amount}
                          isChanged={line.amount !== saved?.amount}
                          isInvalid={line.amount <= 0}
                          errorMessage="Enter the amount paid."
                          onChange={(amount) => {
                            change(line.id, { amount: amount ?? 0 });
                          }}
                        />
                      </td>
                      <td style={{ minWidth: '12rem' }}>
                        <TextField
                          aria-labelledby={named('memo')}
                          value={line.memo}
                          isChanged={line.memo !== saved?.memo}
                          onChange={(memo) => {
                            change(line.id, { memo });
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <SaveBar
            message={
              changes === 0
                ? `${record.name}, ${String(lines.length)} ${lines.length === 1 ? 'line' : 'lines'}`
                : `${String(changes)} ${changes === 1 ? 'change' : 'changes'} to ${record.name}`
            }
            isDirty={changes > 0}
            actionLabel={
              next === undefined ? 'Confirm' : `Confirm and review next (${String(others.length)} left)`
            }
            // Never disabled: a press with an invalid field is answered in the status.
            onAction={async () => {
              if (invalid > 0) {
                setProblem(`${String(invalid)} ${invalid === 1 ? 'line needs' : 'lines need'} attention.`);
                return;
              }
              setProblem('');
              // Your request goes here; the example waits a moment instead.
              await new Promise((resolve) => setTimeout(resolve, 500));
              uploads.save({ ...record, lines, isReviewed: true });
              // The next document's heading takes focus once its view is drawn.
              focusHeadingRef.current = true;
              router.push(next === undefined ? listHref : hrefOf(next.id), { scroll: false });
            }}
            onCancel={() => {
              setProblem('');
              setLines(record.lines);
            }}
            status={problem}
            statusTone="error"
          />
        </section>
      </PageColumn>
    </>
  );
}

/** The view the URL names: a document under `?doc=`, or the Documents page. */
function Views({ params, ...props }: ViewProps & { params: URLSearchParams }): ReactElement {
  const record = props.uploads.documents.find((each) => each.id === params.get('doc'));
  return record === undefined ? (
    <DocumentsView {...props} />
  ) : (
    // Keyed by the document, so another one starts its review afresh.
    <DocumentView key={record.id} {...props} record={record} />
  );
}

function ViewsFromUrl(props: ViewProps): ReactElement {
  const params = useSearchParams();
  return <Views {...props} params={new URLSearchParams(params)} />;
}

/** The first state: no parameters, as the static page's server renders it. */
const FIRST = new URLSearchParams();

export default function DocumentsRecipe(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const hrefOf = useCallback((id: string): string => `${pathname}?doc=${encodeURIComponent(id)}`, [pathname]);
  // In an app this is the provider in the root layout, above every page.
  const uploads = useUploads(hrefOf);
  const focusHeadingRef = useRef(false);
  const props: ViewProps = { uploads, listHref: pathname, hrefOf, focusHeadingRef };
  return (
    // An app wraps its whole tree once; the example wraps only itself.
    <RouterProvider
      navigate={(href) => {
        router.push(href, { scroll: false });
      }}
    >
      <div style={{ width: '100%', minWidth: 0 }}>
        {/* The page is static, so the server renders the fallback: the Documents page. */}
        <Suspense fallback={<Views {...props} params={FIRST} />}>
          <ViewsFromUrl {...props} />
        </Suspense>
        {/* Outside both views, as AppShell's floating slot is outside every page: a navigation keeps it. */}
        <UploadTray
          items={uploads.items}
          onRetry={uploads.retry}
          onRemove={uploads.remove}
          onCancel={uploads.cancel}
          onClear={uploads.clear}
          onCancelAll={uploads.cancelAll}
        />
      </div>
    </RouterProvider>
  );
}
