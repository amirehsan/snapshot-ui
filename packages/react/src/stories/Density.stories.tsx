import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search } from 'lucide-react';
import { Button } from '../button';
import { Card, CardBody, CardHeader, CardTitle } from '../card';
import { IconButton } from '../icon-button';
import { SegmentedControl, SegmentedControlItem } from '../segmented-control';
import { TextField } from '../text-field';

/**
 * Every part that reads the density tokens, in one story, for the computed-height check in
 * apps/storybook/tests/visual/cascade.spec.ts. That check opens this story with and without the
 * `density:compact` global, under a mouse and under a touch screen, and reads the height of each test id
 * and the card's padding. The story only renders, so it is `no-visual`, and its a11y check runs in both
 * themes. The compact look is baselined by the `density` tag on each component's own stories instead.
 */
const meta = {
  title: 'Checks/Density',
  tags: ['no-visual'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: 24, width: 'min(28rem, calc(100vw - 2rem))' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button data-testid="button">Save changes</Button>
        <IconButton aria-label="Search" data-testid="icon-button">
          <Search />
        </IconButton>
      </div>
      <TextField label="Name" data-testid="field" />
      <SegmentedControl label="Appearance" defaultValue="light" data-testid="md">
        <SegmentedControlItem value="light">Light</SegmentedControlItem>
        <SegmentedControlItem value="dark">Dark</SegmentedControlItem>
      </SegmentedControl>
      <SegmentedControl label="Period" size="sm" defaultValue="month" data-testid="sm">
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="month">Month</SegmentedControlItem>
      </SegmentedControl>
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <p>How the rest of the team sees you.</p>
        </CardBody>
      </Card>
    </div>
  ),
};
