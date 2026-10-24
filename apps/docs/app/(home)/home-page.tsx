'use client';

import {
  Card,
  CardBody,
  CardHeader,
  CardNote,
  CardTitle,
  Eyebrow,
  Heading,
  IconButton,
  SegmentedControl,
  SegmentedControlItem,
  Switch,
  Text,
  TextField,
} from '@snapshot-ui/react';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type ReactElement } from 'react';
import { SearchDialog } from '@/components/shell/search';
import { useMounted, useShape } from '@/lib/document-state';
import { wrapTab } from '@/lib/focus-trap';
import { writeShape, type Shape } from '@/lib/prepaint';
import { useCopy } from '@/lib/use-copy';
import { Orbit } from './orbit';

const INSTALL = 'pnpm add @snapshot-ui/react @snapshot-ui/core';

type AxisTheme = 'light' | 'dark';

export function HomePage(): ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  // The Theme axes specimen's own two attributes, apart from the page's theme and Corners.
  const [axisTheme, setAxisTheme] = useState<AxisTheme>('light');
  const [axisShape, setAxisShape] = useState<Shape>('rounded');
  // The Corners switch shows a value only the browser knows, so it settles after hydration.
  const mounted = useMounted();
  const shape = useShape();
  const { outcome, copy } = useCopy(INSTALL);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // What changes at the phone width, whenever the width changes. The footer's columns fold on
    // a phone and stay open everywhere else; where they cannot be folded their summaries are not
    // focus stops either. The install command scrolls sideways on a phone, so there a keyboard
    // must be able to reach it.
    const phone = matchMedia('(width < 768px)');
    const apply = (): void => {
      document.querySelectorAll<HTMLElement>('.footer-col').forEach((column) => {
        column.toggleAttribute('open', !phone.matches);
        const summary = column.querySelector('summary');
        if (phone.matches) summary?.removeAttribute('tabindex');
        else if (summary) summary.tabIndex = -1;
      });
      const command = document.querySelector<HTMLElement>('.install-command');
      if (phone.matches) command?.setAttribute('tabindex', '0');
      else command?.removeAttribute('tabindex');
    };
    apply();
    phone.addEventListener('change', apply);
    return () => {
      phone.removeEventListener('change', apply);
    };
  }, []);

  // The open menu is a modal dialog: it takes focus, holds the page still, closes on Escape
  // and keeps Tab inside, and everything behind it is inert (see the render below).
  useEffect(() => {
    if (!menuOpen) return;
    const button = menuButton.current;
    document.body.style.overflow = 'hidden';
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMenuOpen(false);
      else if (event.key === 'Tab') wrapTab(event, '#nav-overlay');
    };
    // Past 1024px the menu button and the overlay are gone and the links are in the bar,
    // so a window widened with the menu open closes it.
    const wide = matchMedia('(width >= 1024px)');
    const onWiden = (): void => {
      if (wide.matches) setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    wide.addEventListener('change', onWiden);
    return () => {
      document.removeEventListener('keydown', onKey);
      wide.removeEventListener('change', onWiden);
      // Also on leaving the page with the menu open, so the next page can scroll.
      document.body.style.overflow = '';
      // Focus goes back to the menu button, or to the first link in the bar when the
      // window is wide enough to have hidden the button, and never to <body>.
      if (button && button.getClientRects().length > 0) button.focus();
      else document.querySelector<HTMLElement>('.nav-links a')?.focus();
    };
  }, [menuOpen]);

  const toggleTheme = (): void => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const changeShape = (next: Shape): void => {
    writeShape(next);
  };

  return (
    <>
      <div className="nav-wrap" inert={menuOpen}>
        <nav className="nav" aria-label="Main">
          <Link className="brand" href="/">
            <svg viewBox="0 0 26 26" fill="none" aria-hidden>
              <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="21.5" cy="7" r="3.5" fill="var(--color-signal-light)" />
            </svg>
            snapshot ui
          </Link>
          <div className="nav-links">
            <Link href="/docs">Docs</Link>
            <Link href="/docs/components/button">Components</Link>
            <Link href="/docs/theming">Theming</Link>
            <a href="https://github.com/amirehsan/snapshot-ui/releases">Changelog</a>
          </div>
          <div className="nav-actions">
            <IconButton
              aria-label="Search the docs"
              onPress={() => {
                setSearchOpen(true);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 5 5" />
              </svg>
            </IconButton>
            <IconButton aria-label="Toggle dark mode" onPress={toggleTheme}>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 14.5A8.2 8.2 0 0 1 9.5 4 8.2 8.2 0 1 0 20 14.5z" />
              </svg>
            </IconButton>
            <IconButton href="https://github.com/amirehsan/snapshot-ui" aria-label="GitHub">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2a10 10 0 0 0-3.16 19.49c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.9-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.02a9.6 9.6 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.38.2 2.4.1 2.65.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.68-4.57 4.93.36.31.68.92.68 1.85v2.74c0 .27.18.58.69.48A10 10 0 0 0 12 2z" />
              </svg>
            </IconButton>
            <Link className="button nav-cta" href="/docs/installation">
              Get started
            </Link>
            <IconButton
              ref={menuButton}
              className="nav-menu"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              aria-controls="nav-overlay"
              onPress={() => {
                setMenuOpen(true);
              }}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </IconButton>
          </div>
        </nav>
      </div>
      <div
        className="nav-overlay"
        id="nav-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
        hidden={!menuOpen}
      >
        <div className="nav-overlay-head">
          <span className="brand">
            <svg viewBox="0 0 26 26" fill="none" aria-hidden>
              <circle cx="13" cy="13" r="10" stroke="currentColor" strokeWidth="2" />
              <circle cx="21.5" cy="7" r="3.5" fill="var(--color-signal-light)" />
            </svg>
            snapshot ui
          </span>
          <IconButton
            ref={closeButton}
            variant="outline"
            aria-label="Close menu"
            onPress={() => {
              setMenuOpen(false);
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </IconButton>
        </div>
        <nav className="nav-overlay-links" aria-label="Menu">
          <Link className="heading heading-2" href="/docs">
            Docs
          </Link>
          <Link className="heading heading-2" href="/docs/components/button">
            Components
          </Link>
          <Link className="heading heading-2" href="/docs/theming">
            Theming
          </Link>
          <a className="heading heading-2" href="https://github.com/amirehsan/snapshot-ui/releases">
            Changelog
          </a>
        </nav>
        <Link className="button button-large" href="/docs/installation">
          Get started
        </Link>
      </div>

      <main className="page" inert={menuOpen}>
        <section className="hero">
          <div>
            <Eyebrow>Component library</Eyebrow>
            <Heading level={1}>Calm interfaces for settings, dashboards and apps.</Heading>
          </div>
          <div className="hero-side">
            <p className="lede">
              Snapshot UI is an accessible React library in a warm, editorial voice: cream surfaces, one
              typeface and corners that round with intent. Plain HTML is next.
            </p>
            <div className="row">
              <Link className="button button-large" href="/docs/installation">
                Get started
              </Link>
              <Link className="button button-secondary button-large" href="/docs/components/button">
                Browse components
              </Link>
            </div>
            <div className="install">
              <span className="install-command" role="group" aria-label="Install command">
                <b>$</b> pnpm add @snapshot-ui/react @snapshot-ui/core
              </span>
              <IconButton
                aria-label="Copy install command"
                onPress={() => {
                  void copy();
                }}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {outcome === 'Copied' ? (
                    <path d="m5 12.5 5 5 9-10" />
                  ) : (
                    <>
                      <rect x="9" y="9" width="11" height="11" rx="2" />
                      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                    </>
                  )}
                </svg>
              </IconButton>
              <span className="visually-hidden" role="status">
                {outcome}
              </span>
            </div>
            <div className="shape-switch">
              <Text as="span" size="small" tone="muted">
                Corners
              </Text>
              <SegmentedControl
                aria-label="Corners"
                name="shape"
                size="sm"
                value={mounted ? shape : null}
                onChange={(next) => {
                  changeShape(next as Shape);
                }}
              >
                <SegmentedControlItem value="rounded">Rounded</SegmentedControlItem>
                <SegmentedControlItem value="soft">Soft</SegmentedControlItem>
                <SegmentedControlItem value="square">Square</SegmentedControlItem>
              </SegmentedControl>
            </div>
          </div>
        </section>

        <section className="frame" data-theme="dark" aria-label="Components at work">
          <svg
            className="frame-arc"
            viewBox="0 0 1180 560"
            preserveAspectRatio="none"
            fill="none"
            aria-hidden
          >
            <path
              d="M-20 470 C 260 300, 620 620, 1200 120"
              stroke="var(--color-signal-light)"
              strokeWidth="1.5"
            />
          </svg>
          <Card className="frame-card" data-theme="light">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardNote>Where we reach you, and how often.</CardNote>
            </CardHeader>
            <div className="settings-list">
              <div className="setting">
                <Switch description="A short note when something ships." defaultSelected>
                  Product updates
                </Switch>
              </div>
              <div className="setting">
                <Switch description="Every Tuesday morning.">Weekly digest</Switch>
              </div>
              <div className="setting">
                <Switch description="Always on for owners." defaultSelected>
                  Security alerts
                </Switch>
              </div>
            </div>
          </Card>
          <Card className="frame-card frame-card-offset" data-theme="light">
            <CardHeader>
              <CardTitle>Workspace</CardTitle>
              <CardNote>Shown in the header and in every invite.</CardNote>
            </CardHeader>
            <CardBody>
              <TextField
                label="Workspace name"
                description="Pick a name your team will recognize."
                defaultValue="Northwind Studio"
                isChanged
              />
              <SegmentedControl label="Theme" name="demo-theme" defaultValue="system">
                <SegmentedControlItem value="light">Light</SegmentedControlItem>
                <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
                <SegmentedControlItem value="system">System</SegmentedControlItem>
              </SegmentedControl>
              <div className="row push-end">
                <button className="button button-tertiary" type="button">
                  Discard
                </button>
                <button className="button" type="button">
                  Save changes
                </button>
              </div>
            </CardBody>
          </Card>
          <div className="frame-toast" data-theme="light" role="status">
            <span className="frame-toast-dot">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m5 12.5 5 5 9-10" />
              </svg>
            </span>
            Saved. Your changes are live.
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <Eyebrow>Foundations</Eyebrow>
              <Heading level={2}>One voice, measured rather than chosen by eye.</Heading>
            </div>
            <p className="lede">
              Every color pairing is checked for contrast in both themes, every corner comes from one scale,
              and every component is keyboard first.
            </p>
          </div>
          <Orbit>
            <article className="portrait">
              <div className="portrait-circle">
                <span className="portrait-glyph">Aa</span>
                <Link className="satellite" href="/docs/design-principles" aria-label="Typography">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <Eyebrow>Type</Eyebrow>
              <Heading level={3}>One family, at a body weight of 450.</Heading>
            </article>
            <article className="portrait">
              <div className="portrait-circle">
                <div className="shape-stack">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <Link className="satellite" href="/docs/theming" aria-label="Shape">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <Eyebrow>Shape</Eyebrow>
              <Heading level={3}>Rounded, Soft or Square, from one attribute.</Heading>
            </article>
            <article className="portrait">
              <div className="portrait-circle">
                <div className="contrast-glyph">
                  <span>Aa</span>
                  <span>Aa</span>
                </div>
                <Link className="satellite" href="/docs/design-principles" aria-label="Accessibility">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
              <Eyebrow>Access</Eyebrow>
              <Heading level={3}>WCAG 2.2 AA, built on React Aria.</Heading>
            </article>
          </Orbit>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <Eyebrow>Theme axes</Eyebrow>
              <Heading level={2}>Two switches. Every component follows.</Heading>
            </div>
            <p className="lede">
              Set data-theme and data-shape on any element. A light card inside a dark page just works.
            </p>
          </div>
          <div className="axes">
            <div className="axes-controls">
              <SegmentedControl
                label="Theme"
                name="axes-theme"
                value={axisTheme}
                onChange={(next) => {
                  setAxisTheme(next as AxisTheme);
                }}
              >
                <SegmentedControlItem value="light">Light</SegmentedControlItem>
                <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
              </SegmentedControl>
              <SegmentedControl
                label="Shape"
                name="axes-shape"
                value={axisShape}
                onChange={(next) => {
                  setAxisShape(next as Shape);
                }}
              >
                <SegmentedControlItem value="rounded">Rounded</SegmentedControlItem>
                <SegmentedControlItem value="soft">Soft</SegmentedControlItem>
                <SegmentedControlItem value="square">Square</SegmentedControlItem>
              </SegmentedControl>
              <pre className="axes-code">
                <code>
                  {'<section\n  data-theme="'}
                  <b>{axisTheme}</b>
                  {'"\n  data-shape="'}
                  <b>{axisShape}</b>
                  {'">'}
                </code>
              </pre>
            </div>
            <section
              className="axes-stage"
              aria-label="Specimen"
              data-theme={axisTheme}
              data-shape={axisShape}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Billing</CardTitle>
                  <CardNote>Receipts and the plan your team is on.</CardNote>
                </CardHeader>
                <CardBody>
                  <TextField label="Billing email" defaultValue="finance@northwind.studio" />
                  <div className="settings-list">
                    <div className="setting">
                      <Switch description="One message per invoice." defaultSelected>
                        Email receipts
                      </Switch>
                    </div>
                  </div>
                  <SegmentedControl label="Billing cycle" name="demo-cycle" defaultValue="yearly">
                    <SegmentedControlItem value="monthly">Monthly</SegmentedControlItem>
                    <SegmentedControlItem value="yearly">Yearly</SegmentedControlItem>
                  </SegmentedControl>
                  <div className="row push-end">
                    <button className="button button-tertiary" type="button">
                      Discard
                    </button>
                    <button className="button" type="button">
                      Save changes
                    </button>
                  </div>
                </CardBody>
              </Card>
            </section>
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <div>
              <Eyebrow>Components</Eyebrow>
              <Heading level={2}>Everything a dashboard asks for.</Heading>
            </div>
            <p className="lede">
              From a single switch to the whole app shell. Published as you build, at 0.x, from the first
              phase.
            </p>
          </div>
          <div className="catalog">
            <Card className="catalog-group" id="forms">
              <Eyebrow>Forms</Eyebrow>
              <div className="chips">
                <Link className="chip" href="/docs/components/button">
                  Button
                </Link>
                <Link className="chip" href="/docs/components/icon-button">
                  Icon button
                </Link>
                <Link className="chip" href="/docs/components/text-field">
                  Text field
                </Link>
                <Link className="chip" href="/docs/components/text-area">
                  Text area
                </Link>
                <Link className="chip" href="/docs/components/checkbox">
                  Checkbox
                </Link>
                <Link className="chip" href="/docs/components/radio-group">
                  Radio group
                </Link>
                <Link className="chip" href="/docs/components/switch">
                  Switch
                </Link>
                <Link className="chip" href="/docs/components/segmented-control">
                  Segmented control
                </Link>
                <Link className="chip" href="/docs/components/select">
                  Select
                </Link>
                <Link className="chip" href="/docs/components/combo-box">
                  Combo box
                </Link>
                <span className="chip chip-soon">Tag input</span>
              </div>
            </Card>
            <Card className="catalog-group" id="dates-and-media">
              <Eyebrow>Dates and media</Eyebrow>
              <div className="chips">
                <Link className="chip" href="/docs/components/date-picker">
                  Date picker
                </Link>
                <Link className="chip chip-new" href="/docs/components/date-range-picker">
                  Date range picker
                </Link>
                <span className="chip chip-soon">Time field</span>
                <span className="chip chip-soon">Color field</span>
                <span className="chip chip-soon">Icon picker</span>
                <span className="chip chip-soon">Media input</span>
                <span className="chip chip-soon">Slider</span>
                <span className="chip chip-soon">Rich text</span>
              </div>
            </Card>
            <Card className="catalog-group" id="lists-and-data">
              <Eyebrow>Lists and data</Eyebrow>
              <div className="chips">
                <Link className="chip chip-new" href="/docs/components/data-table">
                  Data table
                </Link>
                <span className="chip chip-soon">Sortable list</span>
                <span className="chip chip-soon">Tree builder</span>
                <span className="chip chip-soon">Master detail</span>
                <span className="chip chip-soon">Transfer list</span>
                <Link className="chip" href="/docs/components/stat-tile">
                  Stat tile
                </Link>
                <Link className="chip" href="/docs/components/empty-state">
                  Empty state
                </Link>
                <Link className="chip chip-new" href="/docs/charts/bar-chart">
                  Charts
                </Link>
              </div>
            </Card>
            <Card className="catalog-group" id="overlays-and-shell">
              <Eyebrow>Overlays and shell</Eyebrow>
              <div className="chips">
                <Link className="chip" href="/docs/components/dialog">
                  Dialog
                </Link>
                <Link className="chip" href="/docs/components/toast">
                  Toast
                </Link>
                <Link className="chip" href="/docs/components/tooltip">
                  Tooltip
                </Link>
                <Link className="chip" href="/docs/components/menu">
                  Menu
                </Link>
                <Link className="chip" href="/docs/components/drawer">
                  Drawer
                </Link>
                <Link className="chip" href="/docs/components/command-palette">
                  Command palette
                </Link>
                <Link className="chip" href="/docs/components/sidebar">
                  Sidebar
                </Link>
                <Link className="chip" href="/docs/components/save-bar">
                  Save bar
                </Link>
              </div>
            </Card>
          </div>
          <p className="catalog-legend">Dashed chips are on the roadmap. Everything else has a page.</p>
        </section>

        <section className="cta">
          <span className="watermark" aria-hidden />
          <div className="cta-inner">
            <Eyebrow>Open source, MIT</Eyebrow>
            <Heading level={2}>Start with a button. Ship the whole settings page.</Heading>
            <div className="row">
              <Link className="button button-large" href="/docs/components/button">
                Read the docs
              </Link>
              <a
                className="button button-secondary button-large"
                href="https://github.com/amirehsan/snapshot-ui"
              >
                Star on GitHub
              </a>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer" data-theme="dark" inert={menuOpen}>
        <div className="page">
          <Heading level={2}>Everything you need to build a calm product, whenever you need it.</Heading>
          <div className="footer-cols">
            <details className="footer-col" open>
              <summary>Docs</summary>
              <div className="footer-links">
                <Link href="/docs">Introduction</Link>
                <Link href="/docs/installation">Installation</Link>
                <Link href="/docs/theming">Theming</Link>
                <Link href="/docs/routing">Routing</Link>
                <Link href="/docs/design-principles">Design principles</Link>
              </div>
            </details>
            <details className="footer-col" open>
              <summary>Components</summary>
              <div className="footer-links">
                <Link href="/#forms">Forms</Link>
                <Link href="/#dates-and-media">Dates and media</Link>
                <Link href="/#lists-and-data">Lists and data</Link>
                <Link href="/#overlays-and-shell">Overlays and shell</Link>
                <Link href="/docs/charts/bar-chart">Charts</Link>
              </div>
            </details>
            <details className="footer-col" open>
              <summary>Community</summary>
              <div className="footer-links">
                <a href="https://github.com/amirehsan/snapshot-ui">
                  GitHub <span aria-hidden="true">&#8599;</span>
                </a>
                <a href="https://github.com/amirehsan/snapshot-ui/discussions">
                  Discussions <span aria-hidden="true">&#8599;</span>
                </a>
                <a href="https://github.com/amirehsan/snapshot-ui/blob/main/CONTRIBUTING.md">Contributing</a>
                <a href="https://github.com/amirehsan/snapshot-ui/blob/main/CODE_OF_CONDUCT.md">
                  Code of conduct
                </a>
              </div>
            </details>
            <details className="footer-col" open>
              <summary>Project</summary>
              <div className="footer-links">
                <a href="https://github.com/amirehsan/snapshot-ui/releases">Changelog</a>
                <a href="https://github.com/amirehsan/snapshot-ui/blob/main/SECURITY.md">Security</a>
                <a href="https://github.com/amirehsan/snapshot-ui/blob/main/LICENSE">MIT License</a>
              </div>
            </details>
          </div>
          <div className="footer-bottom">
            <span>&#169; 2026 Snapshot UI. Released under the MIT License.</span>
            <span>Built on React Aria</span>
          </div>
        </div>
      </footer>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
