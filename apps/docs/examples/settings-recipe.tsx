'use client';

import {
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardTitle,
  ConditionalFields,
  ConfirmDialog,
  CopyButton,
  DescriptionList,
  DescriptionListItem,
  DialogTrigger,
  FieldExtras,
  NumberField,
  PageHeader,
  PanelLayout,
  PanelNav,
  PanelNavItem,
  PanelSection,
  PickerOption,
  Repeater,
  RouterProvider,
  SaveBar,
  Select,
  Switch,
  Text,
  TextField,
  ThemeSwitch,
  toast,
  useConfirm,
  type ThemeChoice,
} from '@snapshot-ui/react';
import { useTheme } from 'next-themes';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactElement,
} from 'react';
import {
  CONNECTIONS,
  DEFAULT_MODEL,
  DEFAULT_TIERS,
  DEFAULT_TIERS_LABEL,
  dollars,
  FIRST_SAVED,
  MAX_TIERS,
  MODELS,
  MONTH_OF_BILLS,
  PROVIDERS,
  SECTIONS,
  SETUP_ADDRESS,
  WAITS,
  type Saved,
  type SettingsSection,
  type Tier,
} from './settings-data';

/** The search parameter that holds the open section. The basic example above reads its own, `section`. */
const PARAM = 'settings';

/** What every section is given: what is saved, how to save its part, and how to say it holds unsaved changes. */
interface SectionProps {
  saved: Saved;
  save: (patch: Partial<Saved>) => void;
  onDirty: (isDirty: boolean) => void;
}

/** Tells the page whether the section holds unsaved changes, and that it holds none once it has gone. */
function useReportDirty(onDirty: (isDirty: boolean) => void, isDirty: boolean): void {
  useEffect(() => {
    onDirty(isDirty);
  }, [onDirty, isDirty]);
  useEffect(
    () => () => {
      onDirty(false);
    },
    [onDirty],
  );
}

/** Your server action goes here; the example waits a moment instead. */
const stubAction = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 400));

const STACK: CSSProperties = { display: 'grid', gap: 'var(--spacing-separate)', minWidth: 0 };

// ---- Coach ------------------------------------------------------------------------------------------------------

let madeTiers = 0;
const newTierId = (): string => {
  madeTiers += 1;
  return `tier-${String(madeTiers)}`;
};

/** Whether two lists of tiers hold the same amounts and waits, in order; ids aside. */
const sameTiers = (a: readonly Omit<Tier, 'id'>[], b: readonly Omit<Tier, 'id'>[]): boolean =>
  a.length === b.length &&
  a.every((tier, index) => b[index]?.amount === tier.amount && b[index].wait === tier.wait);

/** A row whose fields are all empty means none: it is dropped when the tiers are saved. */
const isBlank = (tier: Tier): boolean => tier.amount === null && tier.wait === null;

/**
 * The rows' errors, by row id: an amount an earlier tier already waits from, and, once a save has been tried, a
 * tier with an amount and no wait or a wait and no amount.
 */
function tierErrors(tiers: readonly Tier[], checkMissing: boolean): Record<string, string> {
  const errors: Record<string, string> = {};
  tiers.forEach((tier, index) => {
    const { amount } = tier;
    if (amount !== null && tiers.slice(0, index).some((other) => other.amount === amount)) {
      errors[tier.id] = `Another tier waits from ${dollars(amount)}`;
    } else if (checkMissing && !isBlank(tier) && (tier.amount === null || tier.wait === null)) {
      errors[tier.id] = 'Enter an amount and a wait, or remove the tier';
    }
  });
  return errors;
}

function Coach({ saved, save, onDirty }: SectionProps): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>(() => [...saved.tiers]);
  const [cushion, setCushion] = useState<number | null>(saved.cushion);
  const [checkMissing, setCheckMissing] = useState(false);
  const [problem, setProblem] = useState('');
  const rowErrors = tierErrors(tiers, checkMissing);
  const tiersChanged = !sameTiers(tiers, saved.tiers);
  const cushionChanged = cushion !== saved.cushion;
  const changes = Number(tiersChanged) + Number(cushionChanged);
  useReportDirty(onDirty, changes > 0);
  return (
    <>
      <div style={STACK}>
        <Card>
          <CardBody>
            {/* One offer for the whole set: a reset replaces the rows and focuses the first row's amount. */}
            <FieldExtras
              scope="group"
              fieldLabel="Wait tiers"
              defaultOffer={{
                value: DEFAULT_TIERS_LABEL,
                isCurrent: sameTiers(tiers, DEFAULT_TIERS),
                onTake: () => {
                  setTiers(DEFAULT_TIERS.map((tier) => ({ ...tier, id: newTierId() })));
                },
              }}
            >
              <Repeater<Tier>
                label="Wait tiers"
                description="A payment up to an amount waits this long before it counts."
                value={tiers}
                onChange={setTiers}
                createRow={() => ({ id: newTierId(), amount: null, wait: null })}
                rowLabel={(index) => `Tier ${String(index + 1)}`}
                minRows={0}
                maxRows={MAX_TIERS}
                rowErrors={rowErrors}
                isChanged={tiersChanged}
                labels={{
                  add: 'Add a tier',
                  empty: 'No tiers. The coach never waits.',
                  full: (max) => `${String(max)} of ${String(max)}. Remove a tier to add another.`,
                }}
              >
                {(tier, { update, error }) => (
                  <>
                    <NumberField
                      label="Up to"
                      money={{ symbol: '$' }}
                      value={tier.amount}
                      isInvalid={error !== undefined}
                      onChange={(amount) => {
                        update({ ...tier, amount });
                      }}
                    />
                    <Select
                      label="Wait"
                      placeholder="Choose a wait"
                      value={tier.wait}
                      isInvalid={error !== undefined}
                      onChange={(key) => {
                        update({ ...tier, wait: key === null ? null : String(key) });
                      }}
                    >
                      {WAITS.map(([id, name]) => (
                        <PickerOption key={id} id={id}>
                          {name}
                        </PickerOption>
                      ))}
                    </Select>
                  </>
                )}
              </Repeater>
            </FieldExtras>
            {/* A line under the offer, so its button never wraps into the card's bottom corner on a narrow card. */}
            <Text>Saved tiers are sorted by amount.</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            {/* Empty by default, never prefilled: the suggestion is an edit the reader takes. */}
            <FieldExtras
              fieldLabel="Cushion"
              suggestion={{
                value: '$2,340',
                reason: 'a month of your fixed bills',
                isCurrent: cushion === MONTH_OF_BILLS,
                onTake: () => {
                  setCushion(MONTH_OF_BILLS);
                },
              }}
            >
              <NumberField
                label="Cushion"
                description="Empty keeps a month of your fixed bills."
                money={{ symbol: '$' }}
                value={cushion}
                isChanged={cushionChanged}
                onChange={setCushion}
              />
            </FieldExtras>
          </CardBody>
        </Card>
      </div>
      <SaveBar
        message={
          changes === 0 ? 'Coach' : `${String(changes)} ${changes === 1 ? 'change' : 'changes'} to Coach`
        }
        isDirty={changes > 0}
        actionLabel="Save"
        onAction={async () => {
          setCheckMissing(true);
          const kept = tiers.filter((tier) => !isBlank(tier));
          if (Object.keys(tierErrors(kept, true)).length > 0) {
            setProblem('Fix the tiers marked above.');
            return;
          }
          setProblem('');
          // Rows whose fields are all empty mean none; the rest are sorted by amount, as the server keeps them.
          const sorted = [...kept].sort((a, b) => (a.amount ?? 0) - (b.amount ?? 0));
          await stubAction();
          save({ tiers: sorted, cushion });
          setTiers(sorted);
          setCheckMissing(false);
          toast({ title: 'Coach saved', tone: 'success' });
        }}
        onCancel={() => {
          setTiers([...saved.tiers]);
          setCushion(saved.cushion);
          setCheckMissing(false);
          setProblem('');
        }}
        status={problem}
        statusTone="error"
      />
    </>
  );
}

// ---- Notifications ----------------------------------------------------------------------------------------------

function Notifications({ saved, save, onDirty }: SectionProps): ReactElement {
  const [pushAmounts, setPushAmounts] = useState(saved.pushAmounts);
  const [weeklyEmail, setWeeklyEmail] = useState(saved.weeklyEmail);
  const id = useId();
  const changes = Number(pushAmounts !== saved.pushAmounts) + Number(weeklyEmail !== saved.weeklyEmail);
  useReportDirty(onDirty, changes > 0);
  return (
    <>
      <div style={STACK}>
        <Card>
          <CardBody>
            <Switch
              isSelected={pushAmounts}
              onChange={setPushAmounts}
              isChanged={pushAmounts !== saved.pushAmounts}
            >
              Push amounts
            </Switch>
            <Switch
              isSelected={weeklyEmail}
              onChange={setWeeklyEmail}
              isChanged={weeklyEmail !== saved.weeklyEmail}
              aria-controls={id}
            >
              Weekly email
            </Switch>
            {/* No field at all: a status line and a button, hidden with the email. */}
            <ConditionalFields id={id} isShown={weeklyEmail}>
              <Text>Last sent Monday at 9:00 to you@example.com</Text>
              <div>
                <Button
                  variant="secondary"
                  onPress={() => {
                    toast({ title: 'Test email sent to you@example.com', tone: 'success' });
                  }}
                >
                  Send a test
                </Button>
              </div>
            </ConditionalFields>
            <Text>A push names the amount only while Push amounts is on.</Text>
          </CardBody>
        </Card>
      </div>
      <SaveBar
        message={
          changes === 0
            ? 'Notifications'
            : `${String(changes)} ${changes === 1 ? 'change' : 'changes'} to Notifications`
        }
        isDirty={changes > 0}
        actionLabel="Save"
        onAction={async () => {
          await stubAction();
          save({ pushAmounts, weeklyEmail });
          toast({ title: 'Notifications saved', tone: 'success' });
        }}
        onCancel={() => {
          setPushAmounts(saved.pushAmounts);
          setWeeklyEmail(saved.weeklyEmail);
        }}
      />
    </>
  );
}

// ---- Bank sync --------------------------------------------------------------------------------------------------

function BankSync(): ReactElement {
  return (
    <Card>
      <CardBody>
        <DescriptionList>
          {CONNECTIONS.map((connection) => (
            <DescriptionListItem key={connection.name} term={connection.name}>
              {connection.state}
            </DescriptionListItem>
          ))}
        </DescriptionList>
      </CardBody>
    </Card>
  );
}

// ---- AI assistant -----------------------------------------------------------------------------------------------

function Assistant({ saved, save, onDirty }: SectionProps): ReactElement {
  const [key, setKey] = useState(saved.assistantKey);
  const [model, setModel] = useState(saved.model);
  const changes = Number(key !== saved.assistantKey) + Number(model !== saved.model);
  useReportDirty(onDirty, changes > 0);
  const modelName = (choice: string): string => MODELS.find(([each]) => each === choice)?.[1] ?? choice;
  return (
    <>
      <div style={STACK}>
        <Card>
          <CardBody>
            <TextField
              label="API key"
              type="password"
              description="From your provider's dashboard."
              value={key}
              isChanged={key !== saved.assistantKey}
              onChange={setKey}
            />
            <FieldExtras
              fieldLabel="Model"
              defaultOffer={{
                value: modelName(DEFAULT_MODEL),
                isCurrent: model === DEFAULT_MODEL,
                onTake: () => {
                  setModel(DEFAULT_MODEL);
                },
              }}
            >
              <Select
                label="Model"
                value={model}
                isChanged={model !== saved.model}
                onChange={(choice) => {
                  setModel(String(choice));
                }}
              >
                {MODELS.map(([id, name]) => (
                  <PickerOption key={id} id={id}>
                    {name}
                  </PickerOption>
                ))}
              </Select>
            </FieldExtras>
          </CardBody>
        </Card>
      </div>
      <SaveBar
        message={
          changes === 0
            ? 'AI assistant'
            : `${String(changes)} ${changes === 1 ? 'change' : 'changes'} to AI assistant`
        }
        isDirty={changes > 0}
        actionLabel="Save"
        onAction={async () => {
          await stubAction();
          save({ assistantKey: key, model });
          toast({ title: 'AI assistant saved', tone: 'success' });
        }}
        onCancel={() => {
          setKey(saved.assistantKey);
          setModel(saved.model);
        }}
      />
    </>
  );
}

// ---- Logos ------------------------------------------------------------------------------------------------------

function Logos({ saved, save, onDirty }: SectionProps): ReactElement {
  const [logos, setLogos] = useState(saved.logos);
  const [provider, setProvider] = useState(saved.logoProvider);
  const [key, setKey] = useState(saved.logoKey);
  const form = useRef<HTMLFormElement>(null);
  const id = useId();
  // Hidden fields are kept, never sent and never counted: under an off gate they mean "unchanged".
  const changes =
    Number(logos !== saved.logos) +
    (logos ? Number(provider !== saved.logoProvider) + Number(key !== saved.logoKey) : 0);
  useReportDirty(onDirty, changes > 0);
  return (
    <>
      <form
        ref={form}
        style={STACK}
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <Card>
          <CardBody>
            {/* The gate sends `logos` only while on, so the server knows what an absent key means. */}
            <Switch
              name="logos"
              isSelected={logos}
              onChange={setLogos}
              isChanged={logos !== saved.logos}
              aria-controls={id}
            >
              Show bank logos
            </Switch>
            <ConditionalFields id={id} isShown={logos}>
              <Select
                label="Provider"
                name="logoProvider"
                value={provider}
                isChanged={provider !== saved.logoProvider}
                onChange={(choice) => {
                  setProvider(String(choice));
                }}
              >
                {PROVIDERS.map(([value, name]) => (
                  <PickerOption key={value} id={value}>
                    {name}
                  </PickerOption>
                ))}
              </Select>
              <TextField
                label="API key"
                name="logoKey"
                type="password"
                description="Kept while logos are off, and never sent."
                value={key}
                isChanged={key !== saved.logoKey}
                onChange={setKey}
              />
            </ConditionalFields>
            <Text>Logos come from your provider, never from your bank.</Text>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <DescriptionList>
              <DescriptionListItem
                term="Setup address"
                actions={<CopyButton value={SETUP_ADDRESS} labels={{ copy: 'Copy Setup address' }} />}
              >
                {/* A break opportunity after each part, so a narrow column wraps the address between its words. */}
                <code style={{ fontSize: 'var(--text-small)' }}>
                  https://
                  <wbr />
                  hooks.example.com/
                  <wbr />
                  logos/
                  <wbr />
                  7Fq2
                </code>
              </DescriptionListItem>
              <DescriptionListItem term="Last update">None yet</DescriptionListItem>
            </DescriptionList>
          </CardBody>
        </Card>
      </form>
      <SaveBar
        message={
          changes === 0 ? 'Logos' : `${String(changes)} ${changes === 1 ? 'change' : 'changes'} to Logos`
        }
        isDirty={changes > 0}
        actionLabel="Save"
        onAction={async () => {
          const element = form.current;
          if (element === null) return;
          // What a server action receives: with logos off, no provider and no key.
          const data = new FormData(element);
          const sent = (name: string): string | undefined => {
            const value = data.get(name);
            return typeof value === 'string' ? value : undefined;
          };
          await stubAction();
          save({
            logos: data.has('logos'),
            logoProvider: sent('logoProvider') ?? saved.logoProvider,
            logoKey: sent('logoKey') ?? saved.logoKey,
          });
          toast({ title: 'Logos saved', tone: 'success' });
        }}
        onCancel={() => {
          setLogos(saved.logos);
          setProvider(saved.logoProvider);
          setKey(saved.logoKey);
        }}
      />
    </>
  );
}

// ---- Appearance -------------------------------------------------------------------------------------------------

const subscribeNothing = (): (() => void) => () => undefined;

/** next-themes' stored theme as a ThemeSwitch value; anything else is System. */
const themeChoice = (theme: string | undefined): ThemeChoice =>
  theme === 'light' || theme === 'dark' ? theme : 'system';

/**
 * Applied at once, outside every SaveBar, and never Changed. Here it drives the docs site's own theme; in an app,
 * `onChange` sets `data-theme` on `<html>` and a server action writes the cookie the root layout reads.
 */
function Appearance(): ReactElement {
  const { theme, setTheme } = useTheme();
  // The choice is known only in the browser, so the switch shows none until then.
  const mounted = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  return (
    <Card>
      <CardBody>
        <ThemeSwitch label="Appearance" value={mounted ? themeChoice(theme) : null} onChange={setTheme} />
        <Text>Applied at once, on this device. There is nothing to save.</Text>
      </CardBody>
    </Card>
  );
}

// ---- Data and Danger zone ---------------------------------------------------------------------------------------

function Data(): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={4}>Transactions</CardTitle>
        <CardActions>
          <Button
            variant="secondary"
            onPress={() => {
              toast({ title: 'Your export is being made. We will email you a link.', tone: 'info' });
            }}
          >
            Export transactions
          </Button>
        </CardActions>
      </CardHeader>
      <CardBody>
        <Text>A CSV of every transaction, with its category and notes.</Text>
      </CardBody>
    </Card>
  );
}

/** A plain card with a danger button: danger is the action's, and a card is never red (error means a failure). */
function DangerZone({ save }: SectionProps): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={4}>Your data</CardTitle>
        <CardActions>
          <DialogTrigger>
            <Button variant="danger">Delete all data</Button>
            <ConfirmDialog
              tone="danger"
              title="Delete all data?"
              description="Every transaction, tier and setting goes, and your bank connections close. This cannot be undone."
              confirmLabel="Delete all data"
              onConfirm={() => {
                save(FIRST_SAVED);
                toast({ title: 'All data deleted', tone: 'info' });
              }}
            />
          </DialogTrigger>
        </CardActions>
      </CardHeader>
      <CardBody>
        <Text>Delete your transactions, tiers and settings, and close your bank connections.</Text>
      </CardBody>
    </Card>
  );
}

/** Each section's cards, by its key. A key with none draws nothing. */
const BODIES: Record<string, (props: SectionProps) => ReactElement> = {
  coach: Coach,
  notifications: Notifications,
  'bank-sync': BankSync,
  assistant: Assistant,
  logos: Logos,
  appearance: Appearance,
  data: Data,
  danger: DangerZone,
};

// ---- The page ---------------------------------------------------------------------------------------------------

interface PageProps extends Omit<SectionProps, 'onDirty'> {
  sectionKey: string | null;
  pathname: string;
  onDirty: (section: SettingsSection, isDirty: boolean) => void;
}

/** The page at `?settings=`, or at the index with none: the URL is the state, and the layout holds none. */
function Settings({ sectionKey, pathname, saved, save, onDirty }: PageProps): ReactElement {
  const open = SECTIONS.find((section) => section.key === sectionKey);
  const view = open === undefined ? 'index' : 'section';
  // At the index the split face shows the first section beside the list, marked isDefault.
  const shown = open ?? SECTIONS[0];
  const Body = shown === undefined ? undefined : BODIES[shown.key];
  const onShownDirty = useCallback(
    (isDirty: boolean) => {
      if (shown !== undefined) onDirty(shown, isDirty);
    },
    [onDirty, shown],
  );
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-part)', width: '100%', minWidth: 0 }}>
      {/* The shell's header holds the page's title; here it is a second-level heading, since the docs page has
          its own h1. */}
      <PageHeader title="Settings" headingLevel={2} />
      <PanelLayout
        view={view}
        sectionKey={open?.key}
        backHref={pathname}
        backLabel="Settings"
        nav={
          <PanelNav aria-label="Settings">
            {SECTIONS.map((section) => (
              <PanelNavItem
                key={section.key}
                href={`${pathname}?${PARAM}=${section.key}`}
                isCurrent={section.key === open?.key}
                isDefault={view === 'index' && section === SECTIONS[0]}
                description={section.description}
                end={section.end?.(saved)}
              >
                {section.name}
              </PanelNavItem>
            ))}
          </PanelNav>
        }
      >
        {shown === undefined ? null : (
          <PanelSection title={shown.name} description={shown.description} headingLevel={3}>
            {Body === undefined ? null : (
              // Keyed by the section, so another one opens with what is saved.
              <Body key={shown.key} saved={saved} save={save} onDirty={onShownDirty} />
            )}
          </PanelSection>
        )}
      </PanelLayout>
    </div>
  );
}

/**
 * Resolves once focus has left the question's dialog, which gives it back to what opened it as it closes, or after
 * a second at most. A section change moves focus to the next heading only when focus is in the layout, so the
 * router waits for it.
 */
const focusBack = (): Promise<void> =>
  new Promise((resolve) => {
    const started = performance.now();
    const check = (): void => {
      const active = document.activeElement;
      const placed =
        active !== null && active !== document.body && active.closest('[role="alertdialog"]') === null;
      if (placed || performance.now() - started > 1000) resolve();
      else requestAnimationFrame(check);
    };
    requestAnimationFrame(check);
  });

function SettingsFromUrl(props: Omit<PageProps, 'sectionKey'>): ReactElement {
  return <Settings {...props} sectionKey={useSearchParams().get(PARAM)} />;
}

export default function SettingsRecipe(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  // In an app the server holds these; the example keeps them in state so Save shows its effect.
  const [saved, setSaved] = useState<Saved>(FIRST_SAVED);
  const save = useCallback((patch: Partial<Saved>) => {
    setSaved((current) => ({ ...current, ...patch }));
  }, []);
  // The section holding unsaved changes, read by navigate: a ref, since leaving needs no render.
  const dirty = useRef<SettingsSection | null>(null);
  const onDirty = useCallback((section: SettingsSection, isDirty: boolean) => {
    if (isDirty) dirty.current = section;
    else if (dirty.current === section) dirty.current = null;
  }, []);
  const { confirm, dialog } = useConfirm();
  const leave = async (href: string): Promise<void> => {
    const section = dirty.current;
    if (section !== null) {
      // Focus goes back to the link pressed, and the layout then gives the next section's heading focus.
      const isSure = await confirm({
        tone: 'danger',
        title: 'Discard changes?',
        description: `The changes you made in ${section.name} will be lost.`,
        confirmLabel: 'Discard changes',
        cancelLabel: 'Keep editing',
      });
      if (!isSure) return;
      dirty.current = null;
      // Go once the question has given focus back to the link, so the layout sees a change made from inside it.
      await focusBack();
    }
    router.push(href, { scroll: false });
  };
  const props = { pathname, saved, save, onDirty };
  return (
    // An app wraps its whole tree once; the example wraps only itself. Every link of the page goes through
    // navigate, which asks before it leaves a section with unsaved changes.
    <RouterProvider
      navigate={(href) => {
        void leave(href);
      }}
    >
      <div style={{ width: '100%', minWidth: 0 }}>
        {/* The page is static, so the server renders the fallback: the index, Coach beside the list. */}
        <Suspense fallback={<Settings {...props} sectionKey={null} />}>
          <SettingsFromUrl {...props} />
        </Suspense>
      </div>
      {dialog}
    </RouterProvider>
  );
}
