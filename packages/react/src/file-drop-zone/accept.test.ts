import { describe, expect, it } from 'vitest';
import { acceptFiles, filesOf, holdsFiles, matchesType, type FileAcceptance } from './accept';

/** A file of `size` bytes named `name`, of MIME type `type`. */
const file = (name: string, type: string, size = 4): File => new File(['x'.repeat(size)], name, { type });

const PDF = file('invoice.pdf', 'application/pdf');
const PNG = file('receipt.png', 'image/png');
const JPEG = file('photo.JPG', 'image/jpeg');
const HEIC = file('IMG_0001.HEIC', '');
const EXE = file('setup.exe', 'application/x-msdownload');
const BLANK = file('blank.pdf', 'application/pdf', 0);
const BLANK_EXE = file('empty.exe', 'application/x-msdownload', 0);
const BIG = file('big.png', 'image/png', 99);

type Acceptance = Omit<FileAcceptance, 'onFiles'>;

describe('matchesType', () => {
  const CASES: [name: string, file: File, types: string[], matches: boolean][] = [
    ['a MIME type', PDF, ['application/pdf'], true],
    ['another MIME type', PNG, ['application/pdf'], false],
    ['a wildcard', PNG, ['image/*'], true],
    ['a wildcard of another kind', PDF, ['image/*'], false],
    ['an extension, any case', JPEG, ['.jpg'], true],
    ['an extension in capitals', PDF, ['.PDF'], true],
    ['an entry with spaces', PDF, ['  application/pdf  '], true],
    ['an empty MIME type, by its extension', HEIC, ['image/*', '.heic'], true],
    ['an empty MIME type, against a MIME entry alone', HEIC, ['image/*', 'image/heic'], false],
    ['a type with parameters', file('notes.txt', 'text/plain;charset=utf-8'), ['text/plain'], true],
    ['no entries, which take any file', EXE, [], true],
    ['only empty entries, which take any file', EXE, ['', '  '], true],
  ];

  it.each(CASES)('matches %s', (_name, input, types, matches) => {
    expect(matchesType(input, types)).toBe(matches);
  });
});

describe('acceptFiles', () => {
  const CASES: [
    name: string,
    files: File[],
    acceptance: Acceptance,
    accepted: File[],
    rejected: [File, string][],
  ][] = [
    ['refuses a file with no bytes as empty', [BLANK], {}, [], [[BLANK, 'empty']]],
    ['refuses a file over maxFileSize as size', [PDF], { maxFileSize: 3 }, [], [[PDF, 'size']]],
    ['takes a file exactly at maxFileSize', [PDF], { maxFileSize: 4 }, [PDF], []],
    ['takes one file by default and refuses the rest as count', [PDF, PNG], {}, [PDF], [[PNG, 'count']]],
    ['sets no limit with allowsMultiple', [PDF, PNG, JPEG], { allowsMultiple: true }, [PDF, PNG, JPEG], []],
    [
      'counts only accepted files toward maxFiles',
      [EXE, PDF, PNG, JPEG],
      { allowsMultiple: true, maxFiles: 2, acceptedFileTypes: ['application/pdf', 'image/*'] },
      [PDF, PNG],
      [
        [EXE, 'type'],
        [JPEG, 'count'],
      ],
    ],
    [
      'refuses for the first reason that holds: a zero-byte file of the wrong type is type',
      [BLANK_EXE],
      { acceptedFileTypes: ['.pdf'], maxFileSize: 0 },
      [],
      [[BLANK_EXE, 'type']],
    ],
    [
      'keeps the order of both lists',
      [PNG, EXE, PDF, BIG],
      { allowsMultiple: true, acceptedFileTypes: ['image/*', '.pdf'], maxFileSize: 10 },
      [PNG, PDF],
      [
        [EXE, 'type'],
        [BIG, 'size'],
      ],
    ],
  ];

  it.each(CASES)('%s', (_name, files, acceptance, accepted, rejected) => {
    const result = acceptFiles(files, acceptance);
    expect(result.accepted).toEqual(accepted);
    expect(result.rejected.map(({ file: refused, reason }) => [refused, reason])).toEqual(rejected);
  });

  it('refuses an empty file as empty and a wrong type before it, in the order given', () => {
    const { accepted, rejected } = acceptFiles([BLANK_EXE, BLANK, PNG, BIG, EXE, PDF], {
      allowsMultiple: true,
      acceptedFileTypes: ['image/*', '.pdf'],
      maxFileSize: 10,
    });
    expect(accepted).toEqual([PNG, PDF]);
    expect(rejected).toEqual([
      { file: BLANK_EXE, reason: 'type' },
      { file: BLANK, reason: 'empty' },
      { file: BIG, reason: 'size' },
      { file: EXE, reason: 'type' },
    ]);
  });

  it('refuses a folder as type before any other check', () => {
    const folder = new File([], 'Receipts');
    const { accepted, rejected } = acceptFiles([folder, PDF], { allowsMultiple: true }, new Set([folder]));
    expect(accepted).toEqual([PDF]);
    expect(rejected).toEqual([{ file: folder, reason: 'type' }]);
  });

  it('returns both lists empty for no files, which the parts never pass on', () => {
    expect(acceptFiles([], {})).toEqual({ accepted: [], rejected: [] });
  });
});

/** A transfer's item, as an engine gives it: a file with an entry or none, a folder, or a string. */
const item = (
  kind: 'file' | 'string',
  value: File | null,
  entry: { isFile: boolean; isDirectory: boolean; name: string } | null = null,
): DataTransferItem =>
  ({
    kind,
    type: value?.type ?? 'text/plain',
    getAsFile: () => value,
    webkitGetAsEntry: () => entry,
  }) as unknown as DataTransferItem;

const transferOf = (items: DataTransferItem[], files: File[] = []) =>
  ({ items, files }) as unknown as DataTransfer;

describe('filesOf', () => {
  it('reads each file item in order, with or without an entry', () => {
    const { files, folders } = filesOf(
      transferOf([
        item('file', PDF, { isFile: true, isDirectory: false, name: 'invoice.pdf' }),
        item('string', null),
        item('file', PNG),
      ]),
    );
    expect(files).toEqual([PDF, PNG]);
    expect(folders.size).toBe(0);
  });

  it('stands a folder as an empty File of its name, and never reads it', () => {
    const { files, folders } = filesOf(
      transferOf([
        item('file', null, { isFile: false, isDirectory: true, name: 'Receipts' }),
        item('file', PDF),
      ]),
    );
    expect(files.map((each) => [each.name, each.size])).toEqual([
      ['Receipts', 0],
      ['invoice.pdf', 4],
    ]);
    expect(files.filter((each) => folders.has(each))).toEqual(files.slice(0, 1));
  });

  it('falls back to the files list where the items hold no file', () => {
    expect(filesOf(transferOf([], [PDF])).files).toEqual([PDF]);
    expect(filesOf(null).files).toEqual([]);
  });
});

describe('holdsFiles', () => {
  it("is true when the types include 'Files', and false otherwise", () => {
    expect(holdsFiles({ types: ['Files'] })).toBe(true);
    expect(holdsFiles({ types: ['text/plain', 'Files'] })).toBe(true);
    expect(holdsFiles({ types: ['text/plain'] })).toBe(false);
    expect(holdsFiles(null)).toBe(false);
  });
});
