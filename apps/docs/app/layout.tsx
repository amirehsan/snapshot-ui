import type { Metadata } from 'next';
import { Sofia_Sans, Vazirmatn } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';
import './site.css';
import { PREPAINT } from '@/lib/prepaint';

// Self-hosted by Next at build time, as a variable font so the 450 body weight
// exists, with a metric-matched fallback so nothing shifts while it loads. The
// italic too, which emphasis in prose draws in: base.css turns synthesis off.
const sofia = Sofia_Sans({
  subsets: ['latin'],
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-sans',
});

// The Persian face, first in the sans stack under lang="fa" (site.css), as an app
// sets it for its Persian pages. Only those pages draw it, so it is not preloaded.
const persian = Vazirmatn({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-persian',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://snapshotui.com'),
  title: { default: 'Snapshot UI', template: '%s | Snapshot UI' },
  description: 'Calm, accessible React components for settings, dashboards and apps.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en" className={`${sofia.variable} ${persian.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: PREPAINT }} />
      </head>
      <body>
        <ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
