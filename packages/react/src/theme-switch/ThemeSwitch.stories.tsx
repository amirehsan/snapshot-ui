import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactElement } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { Menu, MenuItem, MenuSeparator, MenuTrigger } from '../menu';
import { MENU_ROW_A11Y } from '../stories/a11y';
import { Text } from '../typography';
import { ThemeMenu, ThemeSwitch, type ThemeChoice, type ThemeSwitchProps } from './ThemeSwitch';

const meta = {
  title: 'Components/ThemeSwitch',
  parameters: { layout: 'padded', a11y: MENU_ROW_A11Y },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The app's own state for the reader's theme, as its cookie holds it. The story keeps the choice and draws it;
 * it never sets the page's theme, so a picture shows the switch in the theme the run asks for.
 */
function Controlled({
  start = 'system',
  ...props
}: Partial<Omit<ThemeSwitchProps, 'value' | 'onChange'>> & { start?: ThemeChoice | null }): ReactElement {
  const [theme, setTheme] = useState<ThemeChoice | null>(start);
  return <ThemeSwitch {...props} value={theme} onChange={setTheme} />;
}

/** An Appearance card, as a Settings section holds it: the switch on a row of its own, outside any form. */
function Appearance({ children }: { children: ReactElement }): ReactElement {
  return (
    <div style={{ maxWidth: '36rem' }}>
      <Card>
        <CardHeader>
          <CardTitle level={3}>Appearance</CardTitle>
        </CardHeader>
        <CardBody>
          {children}
          <Text>Applied at once, on this device.</Text>
        </CardBody>
      </Card>
    </div>
  );
}

/** System, Light and Dark as a segmented control at System, each with its icon, in an Appearance card. */
export const Segmented: Story = {
  tags: ['density'],
  render: () => (
    <Appearance>
      <Controlled label="Theme" />
    </Appearance>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('radiogroup', { name: 'Theme' });
    await expect(within(group).getByRole('radio', { name: 'System' })).toBeChecked();
    const options = [...group.querySelectorAll('.segmented-option')];
    await expect(options.map((option) => option.textContent)).toEqual(['System', 'Light', 'Dark']);
    for (const icon of group.querySelectorAll('.segmented-icon')) {
      await expect(icon.getBoundingClientRect().width).toBe(16);
    }
  },
};

/** The radio look: three rows, Dark chosen, each with its icon before its word. */
export const Radio: Story = {
  render: () => (
    <Appearance>
      <Controlled look="radio" label="Theme" start="dark" />
    </Appearance>
  ),
};

/**
 * The section display in an account menu, opened by its default: a Theme heading over System, Light and Dark,
 * Light chosen with the ink pill and its check.
 */
export const MenuSection: Story = {
  parameters: { docs: { story: { inline: false, height: '420px' } } },
  render: () => (
    <MenuTrigger defaultOpen>
      <Button variant="secondary">Ada Lovelace</Button>
      <Menu>
        <MenuItem id="settings">Settings</MenuItem>
        <MenuSeparator />
        <ThemeMenu value="light" onChange={() => undefined} display="section" />
        <MenuSeparator />
        <MenuItem id="sign-out">Sign out</MenuItem>
      </Menu>
    </MenuTrigger>
  ),
  play: async () => {
    const section = await waitFor(() => within(document.body).getByRole('group', { name: 'Theme' }));
    await expect(
      within(section)
        .getAllByRole('menuitemradio')
        .map((item) => item.getAttribute('aria-checked')),
    ).toEqual(['false', 'true', 'false']);
  },
};
