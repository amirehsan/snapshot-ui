import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type CSSProperties, type ReactElement } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { PickerOption } from '../picker';
import { Select } from '../select';
import { CLEAR_OF_FOOT } from '../stories/corner';
import { focusOn } from '../stories/focus';
import { Switch } from '../switch';
import { TextField } from '../text-field';
import { ConditionalFields } from './ConditionalFields';

const meta = {
  title: 'Components/ConditionalFields',
  component: ConditionalFields,
  parameters: { layout: 'padded' },
  args: { isShown: true, children: null },
} satisfies Meta<typeof ConditionalFields>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A form's own column: its fields a peer gap apart, the conditional group among them. */
const FORM: CSSProperties = { display: 'grid', gap: 'var(--spacing-peer)', maxInlineSize: '28rem' };

/** The app's own words: a provider of bank logos and the key it signs requests with. */
interface LogoFieldsProps {
  defaultShown: boolean;
  /** Turns the gate off from inside the group, as an app's own Escape shortcut does. */
  closesOnEscape?: boolean;
  /** Called with the names the form sent, in order. */
  onSent?: (names: string[]) => void;
  /** Whether the form ends at a card's foot, where Save keeps clear of the corner. */
  isAtCardFoot?: boolean;
}

/** The gate, the provider and the key under it, and a Save after the group. */
function LogoFields({
  defaultShown,
  closesOnEscape = false,
  onSent,
  isAtCardFoot = false,
}: LogoFieldsProps): ReactElement {
  const [logo, setLogo] = useState(defaultShown);
  return (
    <form
      style={FORM}
      onSubmit={(event) => {
        event.preventDefault();
        onSent?.([...new FormData(event.currentTarget).keys()]);
      }}
    >
      <Switch
        isSelected={logo}
        onChange={setLogo}
        aria-controls="logo-fields"
        description="Show each transaction with its bank's logo."
      >
        Show bank logos
      </Switch>
      <ConditionalFields id="logo-fields" isShown={logo}>
        <Select label="Provider" name="logoProvider" defaultValue="northwind">
          <PickerOption id="northwind">Northwind Logos</PickerOption>
          <PickerOption id="fabrikam">Fabrikam Marks</PickerOption>
        </Select>
        <TextField
          label="API key"
          name="logoKey"
          type="password"
          description="From your provider's dashboard. Kept while logos are off, and never sent."
          onKeyDown={
            closesOnEscape
              ? (event) => {
                  if (event.key === 'Escape') setLogo(false);
                }
              : undefined
          }
        />
      </ConditionalFields>
      {/* At a card's foot, Save stops at the corner inset, clear of the curve. */}
      <div style={isAtCardFoot ? CLEAR_OF_FOOT : undefined}>
        <Button type="submit">Save</Button>
      </div>
    </form>
  );
}

/** The gate on: the provider and the key under it, lined up with the Switch, no indent. */
export const Shown: Story = { render: () => <LogoFields defaultShown /> };

/** The gate off: only the Switch, and nothing drawn where the fields were. */
export const Hidden: Story = { render: () => <LogoFields defaultShown={false} /> };

/** In a settings card under its title, the gate on: the card's padding holds in compact density. */
export const LogoProvider: Story = {
  tags: ['density'],
  render: () => (
    <Card style={{ maxInlineSize: '32rem' }}>
      <CardHeader>
        <CardTitle level={3}>Logos</CardTitle>
      </CardHeader>
      <CardBody>
        <LogoFields defaultShown isAtCardFoot />
      </CardBody>
    </Card>
  ),
};

/** A press and typing: the browser's own through Playwright in a Vitest story run, Storybook's in its UI. */
interface Presses {
  click: (element: Element) => Promise<void>;
  keyboard: (text: string) => Promise<void>;
}

/**
 * Playwright's real pointer and keys, which run the browser's own Tab order and focus fix-up, in a Vitest story
 * run; Storybook's simulated ones in its own UI. `vitest/browser` is served only in Vitest's browser mode, so it is
 * imported only there, as `stories/resize.ts` does.
 */
async function realPresses(simulated: Presses): Promise<Presses> {
  if (!(globalThis as { __vitest_browser__?: unknown }).__vitest_browser__) return simulated;
  // Untyped on purpose: the module's types declare its own matchers globally, which the unit tests' types refuse.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion -- a literal would load those types
  const browser = (await import('vitest/browser' as string)) as { userEvent: Presses };
  return browser.userEvent;
}

/** Five seconds, where a busy runner is slow. */
const LONG = { timeout: 5000 };

/** The story's line that says what the form sent. */
function SentLine({ names }: { names: string[] | null }): ReactElement {
  return (
    <output data-testid="sent" style={{ display: 'block', marginBlockStart: 'var(--spacing-peer)' }}>
      {names === null ? 'Nothing sent yet' : `Sent: ${names.join(', ')}`}
    </output>
  );
}

/**
 * Ruling 3: a key typed, then the gate turned off, and the form saved: the key is not sent. Turned on again, the key
 * is there, and sent. Three engines.
 */
export const HiddenNotSubmitted: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: function Render() {
    const [names, setNames] = useState<string[] | null>(null);
    return (
      <>
        <LogoFields defaultShown onSent={setNames} />
        <SentLine names={names} />
      </>
    );
  },
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const presses = await realPresses(userEvent);
    const key = canvas.getByLabelText('API key');
    // The switch draws its track; its input is clipped, so the pointer presses the label, as a reader does.
    const gate = canvas.getByText('Show bank logos');
    const save = canvas.getByRole('button', { name: 'Save' });
    const sent = canvas.getByTestId('sent');
    await presses.click(key);
    await presses.keyboard('sk-live-0042');
    await presses.click(gate);
    await waitFor(() => expect(canvasElement.querySelector('.conditional-fields')).toHaveAttribute('hidden'));
    await presses.click(save);
    await waitFor(() => expect(sent).toHaveTextContent(/^Sent:/), LONG);
    await expect(sent).not.toHaveTextContent('logoKey');
    await expect(sent).not.toHaveTextContent('logoProvider');

    await presses.click(gate);
    await waitFor(() => expect(canvas.getByLabelText('API key')).toHaveValue('sk-live-0042'));
    await presses.click(save);
    await waitFor(() => expect(sent).toHaveTextContent('logoKey'), LONG);
    await expect(sent).toHaveTextContent('logoProvider');
  },
};

/** The gate off: Tab from the Switch goes past the hidden fields to Save, in the browser's own tab order. */
export const NotInTabOrder: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <LogoFields defaultShown={false} />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const presses = await realPresses(userEvent);
    const gate = canvas.getByRole('switch', { name: 'Show bank logos' });
    await focusOn(gate);
    await presses.keyboard('{Tab}');
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Save' })).toHaveFocus(), LONG);
  },
};

/**
 * The group hides while focus is in it, by the app's own Escape shortcut in the key: focus goes to the gate, never
 * the body. Chromium blurs the field as its group turns hidden, before the part's frame; WebKit and Firefox keep it
 * on the hidden field until the part moves it. Focus may sit on the body for one frame at most. Three engines.
 */
export const FocusToGateWhenHidden: Story = {
  tags: ['no-visual', 'webkit', 'firefox'],
  render: () => <LogoFields defaultShown closesOnEscape />,
  play: async ({ canvasElement, userEvent }) => {
    const canvas = within(canvasElement);
    const presses = await realPresses(userEvent);
    const gate = canvas.getByRole('switch', { name: 'Show bank logos' });
    await focusOn(canvas.getByLabelText('API key'));
    // Every frame from the key on, the longest run of frames with focus on the body or nothing.
    let run = 0;
    let longest = 0;
    let watching = true;
    const sample = (): void => {
      const active = document.activeElement;
      run = active === null || active === document.body ? run + 1 : 0;
      longest = Math.max(longest, run);
      if (watching) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
    try {
      await presses.keyboard('{Escape}');
      await waitFor(() =>
        expect(canvasElement.querySelector('.conditional-fields')).toHaveAttribute('hidden'),
      );
      await waitFor(() => expect(gate).toHaveFocus(), LONG);
      // Two frames more, to see that focus stays.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      await expect(gate).toHaveFocus();
    } finally {
      watching = false;
    }
    await expect(longest).toBeLessThanOrEqual(1);
  },
};
