import { LineChart, type LinePoint } from '@snapshot-ui/charts';
import { Button, Dialog, DialogTrigger } from '@snapshot-ui/react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';

/**
 * The two packages together, which neither package's own stories may do: neither imports the other. A chart in
 * the library's Dialog, whose React Aria overlay closes on any Escape that reaches it, prevented or not.
 */

const DAYS = Array.from({ length: 7 }, (_, index) => `Oct ${String(index + 1)}`);

const point = (value: number): LinePoint => ({ value, valueLabel: `$${value.toFixed(2)}` });

const meta = {
  title: 'Compositions/LineChart in a Dialog',
  tags: ['no-visual'],
  parameters: { docs: { story: { inline: false, height: '480px' } } },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** The one element on the page that matches `selector`, wherever the overlay portaled it. */
const only = (selector: string): HTMLElement => {
  const found = document.querySelector<HTMLElement>(selector);
  if (!found) throw new Error(`No ${selector}`);
  return found;
};

/** The first Escape hides the chart's readout and leaves the dialog open; the second closes the dialog. */
export const EscapeHidesTheReadoutFirst: Story = {
  render: () => (
    <DialogTrigger defaultOpen>
      <Button variant="secondary">Open the chart</Button>
      <Dialog title="Spending this week">
        <LineChart
          aria-label="Spending this week"
          series={[{ label: 'This week', points: [42.1, 38.5, 55, 61.2, 47.8, 33.4, 29.9].map(point) }]}
          xLabels={DAYS}
        />
      </Dialog>
    </DialogTrigger>
  ),
  play: async ({ userEvent }) => {
    const plot = await waitFor(() => only('.dialog .line-chart-plot'));
    plot.focus();
    await waitFor(() => expect(only('.dialog .line-chart-readout')).toBeVisible());

    await userEvent.keyboard('{Escape}');
    await expect(document.querySelector('.line-chart-readout')).toBeNull();
    // A closing dialog stays in the page while it exits, so the play waits past its exit and looks again.
    await new Promise((resolve) => setTimeout(resolve, 500));
    await expect(only('.dialog')).not.toHaveAttribute('data-exiting');
    await expect(only('.dialog')).toBeVisible();
    await expect(plot).toHaveFocus();

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('.dialog')).toBeNull());
  },
};
