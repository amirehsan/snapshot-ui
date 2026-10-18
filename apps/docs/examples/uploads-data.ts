import type { UploadItem } from '@snapshot-ui/react';

/**
 * Six files, one in each status, as an app's uploads provider would hold them: the names, reasons and progress
 * words are the app's. The docs make no request, so nothing here is ever uploaded.
 */
export const UPLOADS: UploadItem[] = [
  { id: 'receipt-march', name: 'receipt-march.pdf', status: 'waiting' },
  {
    id: 'invoice-0142',
    name: 'invoice-0142.pdf',
    status: 'uploading',
    progress: 0.45,
    progressLabel: '1.8 of 4 MB',
  },
  { id: 'statement-september', name: 'statement-september.pdf', status: 'reading' },
  { id: 'lease-agreement', name: 'lease-agreement.pdf', status: 'saved', href: '#lease-agreement' },
  {
    id: 'corner-mart',
    name: 'Receipt-2026-10-14-corner-mart-and-the-long-weekend.jpg',
    status: 'review',
    reason: 'The total could not be read',
    href: '#corner-mart',
  },
  { id: 'holiday-video', name: 'holiday-video.mov', status: 'failed', reason: 'Not a PDF, JPG or PNG' },
];
