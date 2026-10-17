import { describe, expect, it } from 'vitest';
import { countUploads, isInFlight, type UploadItem, type UploadStatus } from './counts';

const item = (id: number, status: UploadStatus): UploadItem => ({
  id,
  name: `file-${String(id)}.pdf`,
  status,
});

describe('countUploads', () => {
  it('counts every status and the total', () => {
    const items = [
      item(1, 'waiting'),
      item(2, 'waiting'),
      item(3, 'uploading'),
      item(4, 'reading'),
      item(5, 'saved'),
      item(6, 'saved'),
      item(7, 'saved'),
      item(8, 'review'),
      item(9, 'failed'),
    ];
    expect(countUploads(items)).toEqual({
      total: 9,
      waiting: 2,
      uploading: 1,
      reading: 1,
      saved: 3,
      review: 1,
      failed: 1,
    });
  });

  it('counts nothing as zeros', () => {
    expect(countUploads([])).toEqual({
      total: 0,
      waiting: 0,
      uploading: 0,
      reading: 0,
      saved: 0,
      review: 0,
      failed: 0,
    });
  });
});

describe('isInFlight', () => {
  it.each<[UploadStatus, boolean]>([
    ['waiting', true],
    ['uploading', true],
    ['reading', true],
    ['saved', false],
    ['review', false],
    ['failed', false],
  ])('says %s is in flight: %s', (status, expected) => {
    expect(isInFlight(status)).toBe(expected);
  });
});
