'use client';

import { LineChart } from '@snapshot-ui/charts';
import {
  Avatar,
  Badge,
  Breadcrumb,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardBody,
  CardHeader,
  CardNote,
  CardTitle,
  ConfirmDialog,
  DataTable,
  DescriptionList,
  DescriptionListItem,
  Dialog,
  Gauge,
  Heading,
  IconButton,
  Link,
  Menu,
  MenuItem,
  MenuTrigger,
  MonthGrid,
  PageColumn,
  PageHeader,
  RouterProvider,
  StatTile,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  TextField,
  type DataTableColumn,
} from '@snapshot-ui/react';
import { Ellipsis } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Suspense,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type RefObject,
} from 'react';
import {
  ACCOUNT_TYPES,
  ACCOUNTS,
  BALANCE_DAYS,
  balanceSeries,
  balanceValue,
  COVERAGE,
  COVERAGE_STATES,
  dollars,
  MONTH_LABELS,
  MONTH_NAMES,
  ROW_MARKS,
  SCORE,
  SCORE_BANDS,
  SCORE_MARKS,
  scoreBand,
  UTILIZATION_MARKS,
  utilizationOf,
  type Account,
} from './accounts-data';

/** What every view is given: the accounts the app holds, where each one lives, and what changes them. */
interface ViewProps {
  accounts: readonly Account[];
  listHref: string;
  hrefOf: (id: string, tab?: 'credit') => string;
  focusHeadingRef: RefObject<boolean>;
  rename: (id: string, nickname: string) => void;
  remove: (id: string) => void;
}

/** Gives focus to the heading a view opened with, once, after an action elsewhere moved the reader to it. */
function useHeadingFocus(header: RefObject<HTMLElement | null>, focusHeadingRef: RefObject<boolean>): void {
  useEffect(() => {
    if (!focusHeadingRef.current) return;
    focusHeadingRef.current = false;
    const heading = header.current?.querySelector<HTMLElement>('.page-header-title');
    if (heading == null) return;
    // A heading that takes focus from a script only, as a side panel's does.
    heading.tabIndex = -1;
    heading.focus();
  }, [header, focusHeadingRef]);
}

/** A sum of balances, as the app's server totals them; the possible duplicate is counted once, as itself. */
const total = (accounts: readonly Account[], types: readonly Account['type'][]): number =>
  accounts
    .filter((account) => types.includes(account.type) && account.isPossibleDuplicate !== true)
    .reduce((sum, account) => sum + balanceValue(account), 0);

/** The summary over the list: four StatTiles, net worth with its change. */
function Summary({ accounts }: { accounts: readonly Account[] }): ReactElement {
  const cash = total(accounts, ['checking', 'savings']);
  const investments = total(accounts, ['investment']);
  const owed = total(accounts, ['credit']);
  return (
    <div className="tile-row">
      <StatTile label="Cash" value={dollars(cash)} caption="Checking and savings" />
      <StatTile label="Investments" value={dollars(investments)} caption="At their last price" />
      <StatTile label="Owed" value={dollars(owed)} caption="Across your cards" />
      <StatTile
        label="Net worth"
        value={dollars(cash + investments - owed)}
        change={{ direction: 'up', label: 'Up $1,204.50 since September' }}
        caption="Cash and investments, less what you owe"
      />
    </div>
  );
}

/** The bank feed in words: a neutral Badge while it syncs, an error Badge and the fix when it failed. */
function Feed({ account, href }: { account: Account; href: string }): ReactElement {
  return (
    <span
      style={{
        display: 'inline-flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '4px var(--spacing-part)',
      }}
    >
      {account.feed === 'failed' ? (
        <>
          <Badge tone="error">Failed</Badge>
          <Link href={href} aria-label={`Reconnect ${account.name}`}>
            Reconnect
          </Link>
        </>
      ) : (
        <Badge>Connected</Badge>
      )}
      {account.isPossibleDuplicate === true ? <Badge tone="warning">Possible duplicate</Badge> : null}
    </span>
  );
}

const nameOf = (account: Account): string => `${account.name} ending ${account.lastFour}`;

/** The Accounts page: the summary, then a table per type, each row opening its account. */
function AccountsView({ accounts, hrefOf, focusHeadingRef }: ViewProps): ReactElement {
  const header = useRef<HTMLElement>(null);
  useHeadingFocus(header, focusHeadingRef);
  const id = useId();
  const columns: readonly DataTableColumn<Account>[] = [
    {
      id: 'bank',
      header: 'Bank',
      isHeaderHidden: true,
      width: '4rem',
      // The bank's logo, named by the bank; a square, as a logo is. In the list face it leads the item's title.
      cell: (account) => (
        <Avatar name={account.institution} initials={account.initials} shape="square" size="sm" />
      ),
      listSlot: 'title',
    },
    {
      id: 'account',
      header: 'Account',
      isRowHeader: true,
      cell: (account) => (
        <>
          {nameOf(account)}
          <span className="data-table-cell-meta">{account.coverage}</span>
        </>
      ),
      textValue: nameOf,
    },
    {
      id: 'feed',
      header: 'Bank feed',
      // Reconnect leads to the account, whose page an app gives the bank's sign-in.
      cell: (account) => <Feed account={account} href={`${hrefOf(account.id)}#reconnect`} />,
      textValue: (account) => (account.feed === 'failed' ? 'Failed' : 'Connected'),
      listSlot: 'meta',
      // Two Badges may not fit one line of a phone's list: the line wraps, and so does a Badge's word.
      overflow: 'wrap',
    },
    {
      id: 'balance',
      header: 'Balance',
      align: 'end',
      cell: (account) => (
        <>
          {account.balance}
          <span className="data-table-cell-meta">{account.balanceDate}</span>
        </>
      ),
      textValue: (account) => account.balance,
      listSlot: 'end',
    },
  ];
  return (
    <>
      <PageHeader
        ref={header}
        // An example on a docs page, which has its own h1; a page's own header keeps the default, 1.
        headingLevel={2}
        title="Accounts"
        description="Every account you hold, by type, with what its bank last sent."
      />
      <PageColumn className="stack">
        <Summary accounts={accounts} />
        {ACCOUNT_TYPES.map((type) => {
          const rows = accounts.filter((account) => account.type === type.id);
          if (rows.length === 0) return null;
          return (
            <section key={type.id} aria-labelledby={`${id}-${type.id}`} className="stack" style={{ gap: 8 }}>
              <Heading level={3} size={4} id={`${id}-${type.id}`}>
                {type.label}
              </Heading>
              <DataTable
                aria-labelledby={`${id}-${type.id}`}
                items={rows}
                columns={columns}
                getKey={(account) => account.id}
                getRowHref={(account) => hrefOf(account.id)}
              />
            </section>
          );
        })}
      </PageColumn>
    </>
  );
}

/** The balance over the last weeks, in a card. */
function Balance({ account }: { account: Account }): ReactElement {
  const id = useId();
  const end = balanceValue(account);
  const top = Math.max(1000, Math.ceil(end / 1000) * 1000);
  return (
    <Card as="section" aria-labelledby={id}>
      <CardHeader>
        <CardTitle id={id} level={3}>
          Balance
        </CardTitle>
        <CardNote>{`${account.balance} on ${account.balanceDate}`}</CardNote>
      </CardHeader>
      <LineChart
        aria-labelledby={id}
        series={[balanceSeries(end)]}
        xLabels={BALANCE_DAYS}
        yDomain={[0, top]}
        yTicks={[
          { value: 0, label: '$0' },
          { value: top / 2, label: dollars(top / 2).replace('.00', '') },
          { value: top, label: dollars(top).replace('.00', '') },
        ]}
        height={160}
      />
    </Card>
  );
}

/**
 * The Details card: a server component in an app, the list of what the account is. Its Edit and its More menu
 * are the client leaves: Edit opens a Dialog, More holds Merge (a Dialog) and Remove (a ConfirmDialog).
 */
function Details({
  account,
  reconnectHref,
  rename,
  remove,
}: { account: Account; reconnectHref: string } & Pick<ViewProps, 'rename' | 'remove'>): ReactElement {
  const id = useId();
  const [open, setOpen] = useState<'edit' | 'merge' | 'remove' | null>(null);
  const [nickname, setNickname] = useState(account.nickname);
  const close = (isOpen: boolean): void => {
    if (!isOpen) setOpen(null);
  };
  const edit = (): void => {
    setNickname(account.nickname);
    setOpen('edit');
  };
  return (
    <Card as="section" aria-labelledby={id}>
      <CardHeader>
        <CardTitle id={id} level={3}>
          Details
        </CardTitle>
        {/* At most two visible actions: Edit, and the rest in More. */}
        <CardActions>
          <Button variant="secondary" aria-label="Edit details" onPress={edit}>
            Edit
          </Button>
          <MenuTrigger>
            <IconButton aria-label="More actions" variant="outline">
              <Ellipsis />
            </IconButton>
            <Menu
              onAction={(key) => {
                setOpen(key === 'merge' ? 'merge' : 'remove');
              }}
            >
              <MenuItem id="merge">Merge</MenuItem>
              <MenuItem id="remove" variant="danger">
                Remove
              </MenuItem>
            </Menu>
          </MenuTrigger>
        </CardActions>
      </CardHeader>
      <CardBody>
        <DescriptionList>
          <DescriptionListItem term="Name">{account.name}</DescriptionListItem>
          <DescriptionListItem term="Type">{account.typeLabel}</DescriptionListItem>
          <DescriptionListItem term="Institution">{account.institution}</DescriptionListItem>
          <DescriptionListItem term="Last four" isNumeric>
            {account.lastFour}
          </DescriptionListItem>
          <DescriptionListItem term="Bank feed">
            <Feed account={account} href={reconnectHref} />
          </DescriptionListItem>
          {account.creditLimit === undefined ? null : (
            <DescriptionListItem term="Credit limit" isNumeric>
              {account.creditLimit}
            </DescriptionListItem>
          )}
          {account.apr === undefined ? null : (
            <DescriptionListItem term="APR" isNumeric>
              {account.apr}
            </DescriptionListItem>
          )}
          {/* A missing value: a link to add it, where the value would be. It opens the same form as Edit. */}
          <DescriptionListItem
            term="Nickname"
            emptyValue={
              // With no address it is a button to assistive technology, and opens Edit's form.
              <Link onPress={edit}>Add a nickname</Link>
            }
          >
            {account.nickname}
          </DescriptionListItem>
        </DescriptionList>
      </CardBody>
      <Dialog
        isOpen={open === 'edit'}
        onOpenChange={close}
        title="Edit details"
        description="A nickname shows beside the account's name in your lists."
        actions={({ close: done }) => (
          <>
            <Button variant="secondary" onPress={done}>
              Cancel
            </Button>
            <Button
              onPress={() => {
                rename(account.id, nickname.trim());
                done();
              }}
            >
              Save details
            </Button>
          </>
        )}
      >
        <TextField label="Nickname" value={nickname} onChange={setNickname} />
      </Dialog>
      <Dialog
        isOpen={open === 'merge'}
        onOpenChange={close}
        title={`Merge ${account.name}`}
        description="Its transactions move into the account you choose, and this one closes."
        actions={({ close: done }) => (
          <>
            <Button variant="secondary" onPress={done}>
              Cancel
            </Button>
            <Button onPress={done}>Merge accounts</Button>
          </>
        )}
      />
      <ConfirmDialog
        isOpen={open === 'remove'}
        onOpenChange={close}
        tone="danger"
        title={`Remove ${account.name}?`}
        description="Its transactions and its history leave every report. This cannot be undone."
        confirmLabel={`Remove ${account.name}`}
        onConfirm={() => {
          remove(account.id);
        }}
      />
    </Card>
  );
}

/**
 * The range's ends, under the semicircle's ends: an lg dial is 160px wide and centred in the gauge, and its arc
 * ends 80px down, so each figure sits just under its end. The meter reports the range already, so these repeat it
 * for the eye only (spec correction 41).
 */
const END: CSSProperties = {
  position: 'absolute',
  insetBlockStart: 'calc(5rem + var(--spacing-part))',
  fontSize: 'var(--text-small)',
  lineHeight: 'var(--text-small--line-height)',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-slate)',
};

const SMALL: CSSProperties = {
  margin: 0,
  fontSize: 'var(--text-small)',
  lineHeight: 'var(--text-small--line-height)',
};

/** The score: an lg semicircle on 300 to 850 with the bands' four edges as marks, its ends, and the bands in words. */
function Score(): ReactElement {
  const { caption, tone } = scoreBand(SCORE);
  return (
    <Card as="section" aria-labelledby="accounts-score-title">
      <CardHeader>
        <CardTitle id="accounts-score-title" level={3}>
          Credit score
        </CardTitle>
        <CardNote>From your bureau on Oct 1</CardNote>
      </CardHeader>
      <CardBody>
        <div className="stack" style={{ justifyItems: 'center' }}>
          <div style={{ position: 'relative', display: 'inline-grid' }}>
            <Gauge
              aria-labelledby="accounts-score-title"
              form="semicircle"
              size="lg"
              minValue={300}
              maxValue={850}
              value={SCORE}
              valueLabel={`${String(SCORE)} of 850, ${caption}`}
              figure={String(SCORE)}
              figureCaption={caption}
              tone={tone}
              marks={SCORE_MARKS}
            />
            <span aria-hidden="true" style={{ ...END, insetInlineStart: 'calc(50% - 5rem)' }}>
              300
            </span>
            <span aria-hidden="true" style={{ ...END, insetInlineEnd: 'calc(50% - 5rem)' }}>
              850
            </span>
          </div>
          {/* The bands said once: Fair and Poor are both warning, told apart by the word and the marks. */}
          <ul
            style={{
              ...SMALL,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '4px var(--spacing-peer)',
              padding: 0,
              listStyle: 'none',
            }}
          >
            {SCORE_BANDS.map(({ word, range }) => (
              <li key={word}>
                <span style={{ fontWeight: 500 }}>{word}</span>{' '}
                <span style={{ color: 'var(--color-slate)', fontVariantNumeric: 'tabular-nums' }}>
                  {range}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardBody>
    </Card>
  );
}

/** Utilization: the cards' total as an md ring with its two thresholds and their words. */
function Utilization({ accounts }: { accounts: readonly Account[] }): ReactElement {
  const overall = utilizationOf(accounts.filter((account) => account.type === 'credit'));
  const over = overall > 30;
  return (
    <Card as="section" aria-labelledby="accounts-utilization-title">
      <CardHeader>
        <CardTitle id="accounts-utilization-title" level={3}>
          Utilization
        </CardTitle>
        <CardNote>How much of your cards' limits you use</CardNote>
      </CardHeader>
      <CardBody>
        <div style={{ display: 'grid', justifyItems: 'center' }}>
          <Gauge
            label="Across your cards"
            value={overall}
            valueLabel={`${String(overall)}% of your limits${over ? ', above 30%' : ''}`}
            figure={`${String(overall)}%`}
            // A word at md: the value text under the ring says the rest.
            figureCaption={over ? 'High' : undefined}
            tone={over ? 'warning' : 'neutral'}
            marks={UTILIZATION_MARKS}
          />
        </div>
      </CardBody>
    </Card>
  );
}

/** Each card's utilization as a 32px ring in its row, the thresholds said once above the table. */
function Cards({ accounts }: { accounts: readonly Account[] }): ReactElement {
  const id = useId();
  const columns: readonly DataTableColumn<Account>[] = [
    { id: 'card', header: 'Card', cell: nameOf, isRowHeader: true },
    {
      id: 'utilization',
      header: 'Utilization',
      // Named with its row, since the column header names the cell; the value text beside it says the share.
      cell: (card) => {
        const used = card.utilization ?? 0;
        return (
          <Gauge
            aria-label={`Utilization, ${nameOf(card)}`}
            size="sm"
            value={used}
            valueLabel={used > 30 ? `${String(used)}%, above 30%` : `${String(used)}%`}
            tone={used > 30 ? 'warning' : 'neutral'}
            marks={ROW_MARKS}
          />
        );
      },
      textValue: (card) => `${String(card.utilization ?? 0)}%`,
      listSlot: 'meta',
      overflow: 'wrap',
    },
    { id: 'balance', header: 'Balance', cell: (card) => card.balance, align: 'end', listSlot: 'end' },
  ];
  return (
    <section aria-labelledby={id} style={{ display: 'grid', gap: 'var(--spacing-part)' }}>
      <Heading level={3} size={4} id={id}>
        Your cards
      </Heading>
      {/* The thresholds, said once: every row's ring draws them with no words. */}
      <p className="copy copy-small" style={SMALL}>
        Utilization marks: best under 10%, and keep it under 30%.
      </p>
      <DataTable
        aria-labelledby={id}
        items={accounts.filter((account) => account.type === 'credit')}
        columns={columns}
        getKey={(card) => card.id}
      />
    </section>
  );
}

/** Which statements the app holds for the card, a month to a cell, with the sentence and the hidden table. */
function Coverage({ account }: { account: Account }): ReactElement | null {
  const years = COVERAGE[account.id];
  if (years === undefined) return null;
  return (
    <Card>
      <MonthGrid
        label="Statement coverage"
        states={COVERAGE_STATES}
        years={years}
        monthLabels={MONTH_LABELS}
        monthNames={MONTH_NAMES}
      />
    </Card>
  );
}

const GRID: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(20rem, 100%), 1fr))',
  gap: 'var(--spacing-separate)',
  alignItems: 'start',
};

/** An account's page: its header, then Overview, and Credit for a card, chosen by the URL. */
function AccountView({
  account,
  tab,
  listHref,
  hrefOf,
  accounts,
  rename,
  remove,
}: ViewProps & { account: Account; tab: 'overview' | 'credit' }): ReactElement {
  const overview = (
    <div className="stack" style={{ gap: 'var(--spacing-separate)' }}>
      <Balance account={account} />
      <Details
        account={account}
        reconnectHref={`${hrefOf(account.id)}#reconnect`}
        rename={rename}
        remove={remove}
      />
    </div>
  );
  return (
    <>
      <PageHeader
        headingLevel={2}
        breadcrumbs={
          <Breadcrumbs>
            <Breadcrumb href={listHref}>Accounts</Breadcrumb>
            <Breadcrumb>{account.name}</Breadcrumb>
          </Breadcrumbs>
        }
        title={account.nickname === '' ? account.name : `${account.name} (${account.nickname})`}
        description={`${account.typeLabel} at ${account.institution}, ending ${account.lastFour}.`}
      />
      <PageColumn>
        {account.type === 'credit' ? (
          // The URL holds the tab; the arrows move focus, and Enter or Space follows the focused tab's link.
          <Tabs selectedKey={tab} keyboardActivation="manual">
            <TabList aria-label={account.name}>
              <Tab id="overview" href={hrefOf(account.id)}>
                Overview
              </Tab>
              <Tab id="credit" href={hrefOf(account.id, 'credit')}>
                Credit
              </Tab>
            </TabList>
            {/* One panel, the route's content, with the selected key as its id. */}
            <TabPanel id={tab}>
              {tab === 'credit' ? (
                <div className="stack" style={{ gap: 'var(--spacing-separate)' }}>
                  <div style={GRID}>
                    <Score />
                    <Utilization accounts={accounts} />
                  </div>
                  <Cards accounts={accounts} />
                  <Coverage account={account} />
                </div>
              ) : (
                overview
              )}
            </TabPanel>
          </Tabs>
        ) : (
          overview
        )}
      </PageColumn>
    </>
  );
}

/** The view the URL names: an account under `?account=`, its credit tab under `&tab=credit`, or the list. */
function Views({ params, ...props }: ViewProps & { params: URLSearchParams }): ReactElement {
  const account = props.accounts.find((each) => each.id === params.get('account'));
  if (account === undefined) return <AccountsView {...props} />;
  const tab = account.type === 'credit' && params.get('tab') === 'credit' ? 'credit' : 'overview';
  // Keyed by the account, so another one opens afresh.
  return <AccountView key={account.id} {...props} account={account} tab={tab} />;
}

function ViewsFromUrl(props: ViewProps): ReactElement {
  const params = useSearchParams();
  return <Views {...props} params={new URLSearchParams(params)} />;
}

/** The first state: no parameters, as the static page's server renders it. */
const FIRST = new URLSearchParams();

export default function AccountsRecipe(): ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const hrefOf = useCallback(
    (id: string, tab?: 'credit'): string =>
      `${pathname}?account=${encodeURIComponent(id)}${tab === undefined ? '' : `&tab=${tab}`}`,
    [pathname],
  );
  // In an app the server holds these; the example keeps them in state so Save and Remove show their effect.
  const [accounts, setAccounts] = useState<readonly Account[]>(ACCOUNTS);
  const focusHeadingRef = useRef(false);
  const props: ViewProps = {
    accounts,
    listHref: pathname,
    hrefOf,
    focusHeadingRef,
    rename: (id, nickname) => {
      setAccounts((current) => current.map((each) => (each.id === id ? { ...each, nickname } : each)));
    },
    remove: (id) => {
      setAccounts((current) => current.filter((each) => each.id !== id));
      // The list's heading takes focus once it is drawn, never the page's body.
      focusHeadingRef.current = true;
      router.push(pathname, { scroll: false });
    },
  };
  return (
    // An app wraps its whole tree once; the example wraps only itself.
    <RouterProvider
      navigate={(href) => {
        router.push(href, { scroll: false });
      }}
    >
      <div style={{ width: '100%', minWidth: 0 }}>
        {/* The page is static, so the server renders the fallback: the Accounts page. */}
        <Suspense fallback={<Views {...props} params={FIRST} />}>
          <ViewsFromUrl {...props} />
        </Suspense>
      </div>
    </RouterProvider>
  );
}
