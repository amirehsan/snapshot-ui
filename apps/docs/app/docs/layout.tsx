import { ToastRegion } from '@snapshot-ui/react';
import pkg from '@snapshot-ui/react/package.json';
import type { ReactElement, ReactNode } from 'react';
import { DocsShell } from '@/components/shell/docs-shell';
import { source } from '@/lib/source';
import '@/components/shell/shell.css';

export default function DocsLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <>
      <DocsShell tree={source.getPageTree()} version={pkg.version}>
        {children}
      </DocsShell>
      {/* The site's one toast region, at the root of the docs and outside the shell, so its status host is
          never inside a hidden tab panel or the workspace the drawer makes inert. */}
      <ToastRegion />
    </>
  );
}
