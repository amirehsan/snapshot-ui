import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Eyebrow,
  IconButton,
  SegmentedControl,
  SegmentedControlItem,
  TextField,
} from '@snapshot-ui/react';
import { Search } from 'lucide-react';
import type { ReactElement } from 'react';

function Controls(): ReactElement {
  return (
    <>
      <div className="row">
        <Button>Save changes</Button>
        <IconButton aria-label="Search">
          <Search />
        </IconButton>
      </div>
      <SegmentedControl aria-label="Period" defaultValue="month">
        <SegmentedControlItem value="week">Week</SegmentedControlItem>
        <SegmentedControlItem value="month">Month</SegmentedControlItem>
      </SegmentedControl>
      <TextField aria-label="Workspace name" defaultValue="Northwind Studio" />
      <Card>
        <CardHeader>
          <CardTitle level={3}>Profile</CardTitle>
        </CardHeader>
        <CardBody>
          <p>How the rest of the team sees you.</p>
        </CardBody>
      </Card>
    </>
  );
}

export default function DensityControls(): ReactElement {
  return (
    <div className="density-samples">
      <div className="density-sample">
        <Eyebrow>Comfortable</Eyebrow>
        <Controls />
      </div>
      <div className="density-sample" data-density="compact">
        <Eyebrow>Compact</Eyebrow>
        <Controls />
      </div>
    </div>
  );
}
