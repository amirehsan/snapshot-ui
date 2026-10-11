import type { Metadata } from 'next';
import { Sofia_Sans } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import type { ReactElement, ReactNode } from 'react';
import '@snapshot-ui/core/styles.css';
import '@snapshot-ui/core/base.css';
import './site.css';
import { PREPAINT } from '@/lib/prepaint';

// Self-hosted by Next at build time, as a variable font so the 450 body weight
// exists, with a metric-matched fallback so nothing shifts while it loads.
const sofia = Sofia_Sans({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL('https://snapshotui.com'),
  title: { default: 'Snapshot UI', template: '%s | Snapshot UI' },
  description: 'Calm, accessible React components for settings, dashboards and apps.',
};

export default function RootLayout({ children }: { children: ReactNode }): ReactElement {
  return (
    <html lang="en" className={sofia.variable} suppressHydrationWarning>
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
