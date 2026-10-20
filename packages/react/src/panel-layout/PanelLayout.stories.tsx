import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement, type ReactNode } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { AppShell } from '../app-shell';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { RouterProvider } from '../link';
import { NumberField } from '../number-field';
import { PageHeader } from '../page-header';
import { PickerOption } from '../picker';
import { Repeater } from '../repeater';
import { Select } from '../select';
import { focusOn } from '../stories/focus';
import { resizeViewport } from '../stories/resize';
import { DemoNav } from '../stories/shell-fixture';
import { DESKTOP } from '../stories/viewports';
import { Switch } from '../switch';
import { TextField } from '../text-field';
import { Text } from '../typography';
import { PanelLayout, PanelNav, PanelNavItem } from './PanelLayout';
import { PanelRow } from './PanelRow';
import { PanelSection } from './PanelSection';

const meta = {
  title: 'Components/PanelLayout',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** One section of the consumer's page: its key, its name, its list face line and its end state. */
interface Section {
  key: string;
  name: string;
  description: string;
  end?: string;
}

/** The consumer's eight sections (ruling 2.1), in an order nothing here counts on. */
const SECTIONS: readonly Section[] = [
  { key: 'coach', name: 'Coach', description: 'How the coach waits before a charge.' },
  { key: 'notifications', name: 'Notifications', description: 'What we tell you, and where.' },
  {
    key: 'bank-sync',
    name: 'Bank sync',
    description: 'Connected accounts and how often they sync.',
    end: '2 connected',
  },
  { key: 'assistant', name: 'AI assistant', description: 'What the assistant may read.' },
  { key: 'logos', name: 'Logos', description: 'Bank logos beside your transactions.', end: 'Off' },
  { key: 'appearance', name: 'Appearance', description: 'The theme and the density.' },
  { key: 'data', name: 'Data', description: 'Export or import your data.' },
  { key: 'danger', name: 'Danger zone', description: 'Delete your account.' },
];

/** The same eight with names and end states that wrap. */
const LONG_SECTIONS: readonly Section[] = SECTIONS.map((section) =>
  section.key === 'bank-sync'
    ? {
        ...section,
        name: 'Bank sync and the accounts we read every morning',
        end: '2 connected, 1 waiting for you to sign in again',
      }
    : section.key === 'notifications'
      ? { ...section, name: 'Notifications by email, push and the weekly summary', end: 'Weekly' }
      : section,
);

/** The index's address and a section's. */
const INDEX = '/settings';
const hrefOf = (key: string): string => `${INDEX}/${key}`;

/** The view and the open section an address names. */
function read(path: string): { view: 'index' | 'section'; sectionKey?: string } {
  const key = path.startsWith(`${INDEX}/`) ? path.slice(INDEX.length + 1) : '';
  return key === '' ? { view: 'index' } : { view: 'section', sectionKey: key };
}

/** What a section holds: a card or two of fields, as the consumer's page draws them. */
function SectionBody({ section }: { section: Section }): ReactElement {
  if (section.key === 'coach') {
    return (
      <Card>
        <CardHeader>
          <CardTitle level={3}>Wait</CardTitle>
        </CardHeader>
        <CardBody>
          <Select label="Wait" description="How long a payment waits before it counts." defaultValue="three">
            <PickerOption id="day">1 day</PickerOption>
            <PickerOption id="three">3 days</PickerOption>
            <PickerOption id="week">A week</PickerOption>
          </Select>
          <Text>A payment under the first tier counts at once.</Text>
        </CardBody>
      </Card>
    );
  }
  return (
    <Card>
      <CardHeader>
        <CardTitle level={3}>Options</CardTitle>
      </CardHeader>
      <CardBody>
        <Switch defaultSelected={section.end !== 'Off'}>Turn on {section.name.toLowerCase()}</Switch>
        <Text>{section.description}</Text>
      </CardBody>
    </Card>
  );
}

/** A wait tier of the Coach section: up to an amount, in cents, a payment waits this long. */
interface Tier {
  id: string;
  amount: number | null;
  wait: string;
}

/** How many tiers the stories have made, so each new row has an id of its own. */
let madeTiers = 0;

/** Coach's card: its wait tiers in a Repeater, two of at most three, as the consumer's page draws them. */
function CoachTiers(): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 'small', amount: 10000, wait: 'three' },
    { id: 'large', amount: 50000, wait: 'week' },
  ]);
  return (
    <Card>
      <CardHeader>
        <CardTitle level={3}>Wait tiers</CardTitle>
      </CardHeader>
      <CardBody>
        <Repeater<Tier>
          label="Wait tiers"
          value={tiers}
          onChange={setTiers}
          createRow={() => {
            madeTiers += 1;
            return { id: `tier-${String(madeTiers)}`, amount: null, wait: 'three' };
          }}
          rowLabel={(index) => `Tier ${String(index + 1)}`}
          maxRows={3}
          labels={{ add: 'Add a tier' }}
        >
          {(tier, { update }) => (
            <>
              <NumberField
                label="Up to"
                money={{ symbol: '$' }}
                value={tier.amount}
                onChange={(amount) => {
                  update({ ...tier, amount });
                }}
              />
              <Select
                label="Wait"
                value={tier.wait}
                onChange={(key) => {
                  update({ ...tier, wait: String(key) });
                }}
              >
                <PickerOption id="three">3 days</PickerOption>
                <PickerOption id="week">A week</PickerOption>
                <PickerOption id="month">A month</PickerOption>
              </Select>
            </>
          )}
        </Repeater>
      </CardBody>
    </Card>
  );
}

/** The settings page at `path`, its links through the story's own router. */
function SettingsPage({
  path,
  sections = SECTIONS,
  navLabel = 'Settings sections',
  backLabel = 'Settings',
  children,
}: {
  path: string;
  sections?: readonly Section[];
  navLabel?: string;
  backLabel?: string;
  children?: (section: Section) => ReactNode;
}): ReactElement {
  const { view, sectionKey } = read(path);
  const first = sections[0];
  if (!first) throw new Error('No sections');
  const open = sections.find((section) => section.key === sectionKey) ?? first;
  return (
    <PanelLayout
      view={view}
      sectionKey={sectionKey}
      backHref={INDEX}
      backLabel={backLabel}
      nav={
        <PanelNav aria-label={navLabel}>
          {sections.map((section) => (
            <PanelNavItem
              key={section.key}
              href={hrefOf(section.key)}
              isCurrent={view === 'section' && section.key === sectionKey}
              isDefault={view === 'index' && section === first}
              description={section.description}
              end={section.end}
            >
              {section.name}
            </PanelNavItem>
          ))}
        </PanelNav>
      }
    >
      <PanelSection title={open.name} description={open.description}>
        {children ? children(open) : <SectionBody section={open} />}
      </PanelSection>
    </PanelLayout>
  );
}

/** A settings page with its own router, starting at `start`. */
function Settings({
  start = hrefOf('coach'),
  style,
  ...props
}: {
  start?: string;
  style?: CSSProperties;
  sections?: readonly Section[];
  navLabel?: string;
  children?: (section: Section) => ReactNode;
}): ReactElement {
  const [path, setPath] = useState(start);
  return (
    <RouterProvider navigate={setPath}>
      <div style={{ width: '100%', ...style }}>
        <SettingsPage path={path} {...props} />
      </div>
    </RouterProvider>
  );
}

/** A frame `width` wide, or the width it has when that is less. */
const frame = (width: string): CSSProperties => ({ width, maxWidth: '100%' });

/** The first element matching `selector` inside `scope`. */
function find(scope: ParentNode, selector: string): HTMLElement {
  const element = scope.querySelector<HTMLElement>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

/** Whether an element is drawn: it, and every element around it, has a box. */
const isDrawn = (element: Element): boolean => element.getClientRects().length > 0;

/** The page scrolls sideways by this many px: 0 when everything fits the screen. */
const sideways = (): number => document.documentElement.scrollWidth - document.documentElement.clientWidth;

/**
 * Samples `document.activeElement` every frame until `stop` is called, and returns how many frames found the
 * body: a part that moves focus in the frame after React's commit leaves it there for one frame at most.
 */
function watchBody(): () => number {
  let frames = 0;
  let running = true;
  const sample = (): void => {
    if (!running) return;
    if (document.activeElement === document.body) frames += 1;
    requestAnimationFrame(sample);
  };
  requestAnimationFrame(sample);
  return () => {
    running = false;
    return frames;
  };
}

/** Runs `check` in each shape and density, putting the page's own back after. */
async function inEveryTheme(check: () => Promise<void>): Promise<void> {
  const root = document.documentElement;
  const { shape, density } = root.dataset;
  try {
    for (const [nextShape, nextDensity] of [
      ['rounded', 'comfortable'],
      ['rounded', 'compact'],
      ['soft', 'comfortable'],
      ['square', 'comfortable'],
    ] as const) {
      root.dataset.shape = nextShape;
      root.dataset.density = nextDensity;
      await check();
    }
  } finally {
    root.dataset.shape = shape ?? 'rounded';
    root.dataset.density = density ?? 'comfortable';
  }
}

/** Two cards of the record's widths: a small choice and the form it decides, or two of one column each. */
function Pair({ layout }: { layout: 'halves' | 'third-two-thirds' }): ReactElement {
  return layout === 'halves' ? (
    <PanelRow layout="halves">
      <Card>
        <CardHeader>
          <CardTitle level={3}>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <TextField label="Name" defaultValue="Ada Lovelace" />
          <Text>Shown on your exports.</Text>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={3}>Sign in</CardTitle>
        </CardHeader>
        <CardBody>
          <TextField label="Email" defaultValue="ada@example.com" />
          <Text>We send a code to this address.</Text>
        </CardBody>
      </Card>
    </PanelRow>
  ) : (
    <PanelRow layout="third-two-thirds">
      <Card>
        <CardHeader>
          <CardTitle level={3}>Theme</CardTitle>
        </CardHeader>
        <CardBody>
          <Switch defaultSelected>Follow the system</Switch>
          <Text>Light or dark, as your device is.</Text>
        </CardBody>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle level={3}>Density</CardTitle>
        </CardHeader>
        <CardBody>
          <Select label="Rows" defaultValue="comfortable">
            <PickerOption id="comfortable">Comfortable</PickerOption>
            <PickerOption id="compact">Compact</PickerOption>
          </Select>
          <Text>Compact fits more rows on a screen, and keeps every target at 36px or more.</Text>
        </CardBody>
      </Card>
    </PanelRow>
  );
}

// ---- Shot ----------------------------------------------------------------------------------------------------

/** The split face: the list beside Coach, "Bank sync" ending "2 connected" and "Logos" "Off". */
export const Default: Story = {
  tags: ['density'],
  render: () => <Settings />,
};

/** The index at 1280: the list beside the default section, Coach drawn current and no link aria-current. */
export const IndexSplit: Story = {
  globals: DESKTOP,
  render: () => <Settings start={INDEX} />,
};

/** The index in a 375px frame: the list alone, with descriptions, end states and chevrons. */
export const ListFaceIndex: Story = {
  render: () => <Settings start={INDEX} style={frame('375px')} />,
};

/** A section in a 375px frame: Back above Logos, and no list. */
export const ListFaceSection: Story = {
  render: () => <Settings start={hrefOf('logos')} style={frame('375px')} />,
};

/** In a 70rem frame, two halves and a third beside two thirds, each card at its own height. */
export const CardPairs: Story = {
  tags: ['density'],
  render: () => (
    <div style={{ ...frame('70rem'), display: 'grid', gap: 'var(--spacing-peer)' }}>
      <Pair layout="halves" />
      <Pair layout="third-two-thirds" />
    </div>
  ),
};

/** Names and end states that wrap, on the split face and never cut. */
export const LongNames: Story = {
  render: () => <Settings start={hrefOf('bank-sync')} sections={LONG_SECTIONS} />,
};

/** In an AppShell with "Settings" in its header: the nav sticks under the header, Coach open with its card. */
export const InAppShell: Story = {
  tags: ['density'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AppShell sidebar={<DemoNav />} header={<PageHeader title="Settings" />}>
      <div style={{ padding: 'var(--spacing-inset)' }}>
        <Settings>
          {(section) => (section.key === 'coach' ? <CoachTiers /> : <SectionBody section={section} />)}
        </Settings>
      </div>
    </AppShell>
  ),
};

// ---- Checks, not shot ------------------------------------------------------------------------------------------

/**
 * The face follows the layout's own width, not the viewport's: at 47rem the index is the list alone and a section
 * is Back and the section; at 49rem both are the list beside the section. Then on a 1440px screen a layout in a
 * 40rem frame is still the list face.
 */
export const FaceAtItsWidth: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-case="index-47">
        <Settings start={INDEX} style={frame('47rem')} navLabel="Sections at 47rem" />
      </div>
      <div data-case="section-47">
        <Settings start={hrefOf('logos')} style={frame('47rem')} navLabel="Logos at 47rem" />
      </div>
      <div data-case="index-49">
        <Settings start={INDEX} style={frame('49rem')} navLabel="Sections at 49rem" />
      </div>
      <div data-case="section-49">
        <Settings start={hrefOf('data')} style={frame('49rem')} navLabel="Data at 49rem" />
      </div>
      <div data-case="index-40">
        <Settings start={INDEX} style={frame('40rem')} navLabel="Sections at 40rem" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const at = (name: string): HTMLElement => find(canvasElement, `[data-case="${name}"]`);
    const faces = (name: string): { side: boolean; main: boolean; back: boolean } => ({
      side: isDrawn(find(at(name), '.panel-layout-side')),
      main: isDrawn(find(at(name), '.panel-layout-main')),
      back: isDrawn(find(at(name), '.panel-layout-back')),
    });
    await waitFor(() => expect(faces('index-47')).toEqual({ side: true, main: false, back: false }), {
      timeout: 5000,
    });
    await waitFor(() => expect(faces('section-47')).toEqual({ side: false, main: true, back: true }), {
      timeout: 5000,
    });
    await waitFor(() => expect(faces('index-49')).toEqual({ side: true, main: true, back: false }), {
      timeout: 5000,
    });
    await waitFor(() => expect(faces('section-49')).toEqual({ side: true, main: true, back: false }), {
      timeout: 5000,
    });
    // The pill is drawn on the split face only: Coach by its data-default at 49rem, nothing at 47rem.
    const ink = (name: string): string =>
      getComputedStyle(find(at(name), '.panel-nav-link[data-default]')).backgroundColor;
    await expect(ink('index-49')).not.toBe(ink('index-47'));
    await expect(at('index-49').querySelector('[aria-current]')).toBeNull();
    try {
      if (!(await resizeViewport(1440, 900))) return;
      await waitFor(() => expect(window.innerWidth).toBe(1440), { timeout: 5000 });
      await waitFor(() => expect(faces('index-40')).toEqual({ side: true, main: false, back: false }), {
        timeout: 5000,
      });
    } finally {
      await resizeViewport(1200, 900);
    }
  },
};

/**
 * Focus after a section change, never the body for more than a frame. On the split face a press on "Logos" puts
 * focus on its heading. In a 375px frame a press on "Data" in the list puts it on the heading, though Chromium
 * has blurred the link to the body as its column turned display: none; then Back by Enter puts it on the "Data"
 * link, which the list face draws again.
 */
export const FocusOnSectionChange: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-case="split">
        <Settings style={frame('60rem')} />
      </div>
      <div data-case="list">
        <Settings start={INDEX} style={frame('375px')} navLabel="Phone settings sections" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const split = within(find(canvasElement, '[data-case="split"]'));
    const list = find(canvasElement, '[data-case="list"]');
    const listed = within(list);

    let stop = watchBody();
    await userEvent.click(split.getByRole('link', { name: 'Logos' }));
    await waitFor(() => expect(split.getByRole('heading', { name: 'Logos' })).toHaveFocus(), {
      timeout: 5000,
    });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(split.getByRole('link', { name: 'Logos' })).toHaveAttribute('aria-current', 'page');

    stop = watchBody();
    await userEvent.click(listed.getByRole('link', { name: 'Data' }));
    await waitFor(() => expect(listed.getByRole('heading', { name: 'Data' })).toHaveFocus(), {
      timeout: 5000,
    });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(isDrawn(find(list, '.panel-layout-side'))).toBe(false);

    const back = listed.getByRole('link', { name: 'Settings' });
    await focusOn(back);
    stop = watchBody();
    await userEvent.keyboard('{Enter}');
    const data = listed.getByRole('link', { name: 'Data' });
    await waitFor(() => expect(data).toHaveFocus(), { timeout: 5000 });
    await expect(stop()).toBeLessThanOrEqual(1);
    await expect(isDrawn(data)).toBe(true);
  },
};

/**
 * A resize that turns the face, as a narrowed window or a turned tablet does, hides the column that held focus,
 * which the engine blurs to the body. Focus goes to the open section's heading when the list face hides the current
 * link and when the split face hides Back, and at the index to the default section's link when the list face hides
 * the section beside it; never the body for more than two frames, the observer's and the move's.
 */
export const FocusOnFaceTurn: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-case="section" style={frame('60rem')}>
        <Settings start={hrefOf('logos')} navLabel="Sections as the face turns" />
      </div>
      <div data-case="index" style={frame('60rem')}>
        <Settings start={INDEX} navLabel="The index as the face turns" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const section = find(canvasElement, '[data-case="section"]');
    const index = find(canvasElement, '[data-case="index"]');
    const turn = async (holder: HTMLElement, width: string, target: HTMLElement): Promise<void> => {
      const stop = watchBody();
      holder.style.width = width;
      await waitFor(() => expect(target).toHaveFocus(), { timeout: 5000 });
      await expect(stop()).toBeLessThanOrEqual(2);
    };
    const heading = within(section).getByRole('heading', { name: 'Logos' });

    // The split face: the current link holds focus, then the list face hides it.
    await waitFor(() => expect(isDrawn(find(section, '.panel-layout-side'))).toBe(true), { timeout: 5000 });
    await focusOn(within(section).getByRole('link', { name: 'Logos' }));
    await turn(section, '30rem', heading);

    // The list face's section: Back holds focus, then the split face hides it.
    await focusOn(within(section).getByRole('link', { name: 'Settings' }));
    await turn(section, '60rem', heading);

    // The index beside its default section: a switch there holds focus, then the list face hides the section.
    await focusOn(find(index, '.panel-layout-main button'));
    await turn(index, '30rem', within(index).getByRole('link', { name: 'Coach' }));
  },
};

/** A navigation the reader started outside the layout, as from a command palette: focus stays where it was. */
export const FocusFromOutside: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => {
    function Page(): ReactElement {
      const [path, setPath] = useState(hrefOf('coach'));
      return (
        <RouterProvider navigate={setPath}>
          <div style={{ display: 'grid', gap: 'var(--spacing-peer)', width: '100%' }}>
            <button
              type="button"
              onClick={() => {
                setPath(hrefOf('logos'));
              }}
            >
              Go to Logos
            </button>
            <SettingsPage path={path} />
          </div>
        </RouterProvider>
      );
    }
    return <Page />;
  },
  play: async ({ canvas }) => {
    // Focus was in the layout before, then the reader moved to the palette's button and went from there.
    await focusOn(canvas.getByRole('link', { name: 'Data' }));
    const go = canvas.getByRole('button', { name: 'Go to Logos' });
    await userEvent.click(go);
    await waitFor(() => expect(canvas.getByRole('heading', { name: 'Logos' })).toBeVisible(), {
      timeout: 5000,
    });
    // Two frames after the commit, focus is still on the button.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    await expect(go).toHaveFocus();
  },
};

/** On the split face in a shell, scrolled 400px: the nav's top stays a peer step under --page-sticky-top. */
export const NavSticks: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: DESKTOP,
  parameters: { layout: 'fullscreen' },
  render: () => (
    <AppShell sidebar={<DemoNav />} header={<PageHeader title="Settings" />}>
      <div style={{ padding: 'var(--spacing-inset)' }}>
        <Settings>{() => <div style={{ blockSize: '2400px' }} aria-hidden="true" />}</Settings>
      </div>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const side = find(canvasElement, '.panel-layout-side');
    const nav = find(canvasElement, '.panel-nav');
    const pixels = (value: string): number => {
      const probe = document.createElement('div');
      probe.style.position = 'absolute';
      probe.style.blockSize = value;
      side.append(probe);
      const { height } = probe.getBoundingClientRect();
      probe.remove();
      return height;
    };
    try {
      await waitFor(() => expect(pixels('var(--page-sticky-top, 0px)')).toBeGreaterThan(0), {
        timeout: 5000,
      });
      window.scrollTo({ top: 400, behavior: 'instant' });
      await waitFor(() => expect(window.scrollY).toBe(400), { timeout: 5000 });
      const expected = pixels('calc(var(--page-sticky-top, 0px) + var(--spacing-peer))');
      await waitFor(
        () => expect(Math.abs(nav.getBoundingClientRect().top - expected)).toBeLessThanOrEqual(1),
        {
          timeout: 5000,
        },
      );
    } finally {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  },
};

/** A row at 65rem stacks its cards; at 67rem it pairs a third beside two thirds, each at its own height. */
export const PairsAtItsWidth: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div data-case="65" style={frame('65rem')}>
        <Pair layout="third-two-thirds" />
      </div>
      <div data-case="67" style={frame('67rem')}>
        <Pair layout="third-two-thirds" />
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    const cells = (name: string): [DOMRect, DOMRect] => {
      const [first, second] = [
        ...find(canvasElement, `[data-case="${name}"]`).querySelectorAll('.panel-row-cell > .card'),
      ].map((card) => card.getBoundingClientRect());
      if (!first || !second) throw new Error('Two cards');
      return [first, second];
    };
    // Stacked: the second under the first, both the row's width.
    await waitFor(
      () => {
        const [first, second] = cells('65');
        return expect({
          below: second.top > first.bottom - 1,
          sameWidth: Math.abs(second.width - first.width) < 1,
        }).toEqual({ below: true, sameWidth: true });
      },
      { timeout: 5000 },
    );
    // Paired: side by side, the two thirds twice the third's width, and each card at its own height.
    await waitFor(
      () => {
        const [first, second] = cells('67');
        return expect({
          sameTop: Math.abs(second.top - first.top) < 1,
          beside: second.left > first.right - 1,
          twice: Math.abs(second.width - 2 * first.width) < 2,
          ownHeights: Math.abs(second.height - first.height) > 1,
        }).toEqual({ sameTop: true, beside: true, twice: true, ownHeights: true });
      },
      { timeout: 5000 },
    );
  },
};

/** A 320px phone: a layout and a row in a flex: 1 wrapper, a 1fr grid and two up, no sideways scroll. */
export const OnANarrowPhone: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  globals: { viewport: { value: 'narrow' } },
  parameters: {
    viewport: { options: { narrow: { name: 'Narrow phone', styles: { width: '320px', height: '640px' } } } },
  },
  render: () => (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)' }}>
      <div style={{ display: 'flex' }}>
        <div data-holder="" style={{ flex: 1 }}>
          <Settings start={INDEX} navLabel="Sections in a flex wrapper" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr' }}>
        <div data-holder="">
          <Settings start={hrefOf('bank-sync')} sections={LONG_SECTIONS} navLabel="Sections in a grid" />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-part)' }}>
        <div data-holder="">
          <Settings start={INDEX} navLabel="Sections two up" />
        </div>
        <div data-holder="">
          <Pair layout="halves" />
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <div data-holder="" style={{ flex: 1 }}>
          <Pair layout="third-two-thirds" />
        </div>
      </div>
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(window.innerWidth).toBe(320);
    await inEveryTheme(async () => {
      await waitFor(() => expect(sideways()).toBeLessThanOrEqual(0), { timeout: 5000 });
      for (const holder of canvasElement.querySelectorAll<HTMLElement>('[data-holder]')) {
        const part = find(holder, '.panel-layout, .panel-row');
        const box = part.getBoundingClientRect();
        const room = holder.getBoundingClientRect();
        await expect(box.left).toBeGreaterThanOrEqual(room.left - 1);
        await expect(box.right).toBeLessThanOrEqual(room.right + 1);
        // Not collapsed to its intrinsic 0: it fills its holder.
        await expect(box.width).toBeGreaterThanOrEqual(room.width - 1);
        await expect(box.right).toBeLessThanOrEqual(document.documentElement.clientWidth);
      }
    });
  },
};
