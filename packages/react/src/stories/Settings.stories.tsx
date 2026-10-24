import type { Meta, StoryObj } from '@storybook/react-vite';
import { LifeBuoy, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { expect, within } from 'storybook/test';
import { AccountMenu } from '../account-menu';
import { AppShell } from '../app-shell';
import { Card, CardBody } from '../card';
import { FieldExtras } from '../field-extras';
import { MenuItem, MenuSeparator } from '../menu';
import { NumberField } from '../number-field';
import { PageHeader } from '../page-header';
import { PanelLayout, PanelNav, PanelNavItem, PanelSection } from '../panel-layout';
import { PickerOption } from '../picker';
import { Repeater } from '../repeater';
import { SaveBar } from '../save-bar';
import { Select } from '../select';
import { ThemeMenu, type ThemeChoice } from '../theme-switch';
import { DemoNav } from './shell-fixture';

/**
 * The Settings recipe's Coach section in an app's shell, static and with no router: the rail with the person's
 * AccountMenu in its footer, the page's header, and the PanelLayout at Coach with its wait tiers, its cushion and a
 * clean SaveBar. The split face at 1280 and the list face's section with Back at 375, so the concentric audit and
 * the baselines see the batch's parts together.
 */
const meta = {
  title: 'Pages/Settings',
  tags: ['density'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The consumer's sections, in its order; nothing here counts them. */
const SECTIONS = [
  { key: 'coach', name: 'Coach', description: 'How long a payment waits before it counts.' },
  { key: 'notifications', name: 'Notifications', description: 'What we tell you, and where.' },
  {
    key: 'bank-sync',
    name: 'Bank sync',
    description: 'Connected accounts and how often they sync.',
    end: '2 connected',
  },
  { key: 'assistant', name: 'AI assistant', description: 'The key and the model the assistant uses.' },
  { key: 'logos', name: 'Logos', description: 'Bank logos beside your transactions.', end: 'Off' },
  { key: 'appearance', name: 'Appearance', description: 'The theme, applied at once.' },
  { key: 'data', name: 'Data', description: 'Export your transactions.' },
  { key: 'danger', name: 'Danger zone', description: 'Delete everything we hold for you.' },
] as const;

/** A wait tier: up to an amount, in cents, a payment waits this long. */
interface Tier {
  id: string;
  amount: number | null;
  wait: string | null;
}

/** The person's menu: Settings, the theme as a submenu, Help, a rule and Sign out. */
function PersonMenu(): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice>('system');
  return (
    <AccountMenu name="Ada Lovelace" detail="ada@example.com">
      <MenuItem id="settings" icon={<SettingsIcon />}>
        Settings
      </MenuItem>
      <ThemeMenu value={theme} onChange={setTheme} />
      <MenuItem id="help" icon={<LifeBuoy />}>
        Help
      </MenuItem>
      <MenuSeparator />
      <MenuItem id="sign-out" icon={<LogOut />}>
        Sign out
      </MenuItem>
    </AccountMenu>
  );
}

let madeTiers = 0;

/** Coach: the wait tiers with the default set offered under them, the cushion with its suggestion, and Save. */
function Coach(): ReactElement {
  const [tiers, setTiers] = useState<Tier[]>([
    { id: 'small', amount: 20000, wait: 'three' },
    { id: 'large', amount: 80000, wait: 'two-weeks' },
  ]);
  const [cushion, setCushion] = useState<number | null>(null);
  return (
    <div style={{ display: 'grid', gap: 'var(--spacing-separate)', minWidth: 0 }}>
      <Card>
        <CardBody>
          <FieldExtras
            scope="group"
            fieldLabel="Wait tiers"
            defaultOffer={{
              value: '$100 waits 3 days, $500 a week, $1,500 a month',
              isCurrent: false,
              onTake: () => undefined,
            }}
          >
            <Repeater<Tier>
              label="Wait tiers"
              description="A payment up to an amount waits this long before it counts."
              value={tiers}
              onChange={setTiers}
              createRow={() => {
                madeTiers += 1;
                return { id: `tier-${String(madeTiers)}`, amount: null, wait: null };
              }}
              rowLabel={(index) => `Tier ${String(index + 1)}`}
              minRows={0}
              maxRows={3}
              labels={{
                add: 'Add a tier',
                empty: 'No tiers. The coach never waits.',
                full: (max) => `${String(max)} of ${String(max)}. Remove a tier to add another.`,
              }}
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
                    placeholder="Choose a wait"
                    value={tier.wait}
                    onChange={(key) => {
                      update({ ...tier, wait: key === null ? null : String(key) });
                    }}
                  >
                    <PickerOption id="day">A day</PickerOption>
                    <PickerOption id="three">3 days</PickerOption>
                    <PickerOption id="week">A week</PickerOption>
                    <PickerOption id="two-weeks">Two weeks</PickerOption>
                    <PickerOption id="month">A month</PickerOption>
                  </Select>
                </>
              )}
            </Repeater>
          </FieldExtras>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <FieldExtras
            fieldLabel="Cushion"
            suggestion={{
              value: '$2,340',
              reason: 'a month of your fixed bills',
              isCurrent: cushion === 234000,
              onTake: () => {
                setCushion(234000);
              },
            }}
          >
            <NumberField
              label="Cushion"
              description="Empty keeps a month of your fixed bills."
              money={{ symbol: '$' }}
              value={cushion}
              onChange={setCushion}
            />
          </FieldExtras>
        </CardBody>
      </Card>
      <SaveBar message="Coach" actionLabel="Save" onAction={() => undefined} onCancel={() => undefined} />
    </div>
  );
}

/** The page at Coach: the list beside it at 1280, and Back above it at 375. */
export const Default: Story = {
  render: () => (
    <AppShell sidebar={<DemoNav footer={<PersonMenu />} />} header={<PageHeader title="Settings" />}>
      <div style={{ padding: 'var(--spacing-inset)' }}>
        <PanelLayout
          view="section"
          sectionKey="coach"
          backHref="#settings"
          backLabel="Settings"
          nav={
            <PanelNav aria-label="Settings">
              {SECTIONS.map((section) => (
                <PanelNavItem
                  key={section.key}
                  href={`#settings-${section.key}`}
                  isCurrent={section.key === 'coach'}
                  description={section.description}
                  end={'end' in section ? section.end : undefined}
                >
                  {section.name}
                </PanelNavItem>
              ))}
            </PanelNav>
          }
        >
          <PanelSection title="Coach" description="How long a payment waits before it counts.">
            <Coach />
          </PanelSection>
        </PanelLayout>
      </div>
    </AppShell>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const coach = canvas.getByRole('region', { name: 'Coach' });
    const tiers = within(coach).getByRole('group', { name: 'Wait tiers' });
    await expect(tiers.querySelector('legend')).toHaveTextContent('Wait tiers');
    await expect(within(tiers).getByRole('button', { name: 'Add a tier' })).toHaveAccessibleDescription(
      '2 of 3',
    );
    const rail = canvasElement.querySelector('.sidebar:not(.sidebar-drawer)');
    const trigger = rail?.querySelector('.account-menu-trigger');
    await expect(trigger).toHaveAccessibleName('Ada Lovelace');
  },
};
