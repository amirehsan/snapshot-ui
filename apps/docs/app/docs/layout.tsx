import pkg from '@snapshot-ui/react/package.json';
import type { ReactElement, ReactNode } from 'react';
import { DocsShell } from '@/components/shell/docs-shell';
import { source } from '@/lib/source';
import '@/components/shell/shell.css';

export default function DocsLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <DocsShell tree={source.getPageTree()} version={pkg.version}>
      {children}
    </DocsShell>
  );
}
