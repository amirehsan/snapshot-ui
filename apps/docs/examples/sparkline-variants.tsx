import { Sparkline } from '@snapshot-ui/charts';
import { Card, Eyebrow } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { SPENDING } from './sparkline-data';

export default function SparklineVariants(): ReactElement {
  return (
    <div className="sample-column">
      <Card>
        <div className="stack">
          <div className="row spread">
            <Eyebrow>Default</Eyebrow>
            <Sparkline data={SPENDING} />
          </div>
          <div className="row spread">
            <Eyebrow>With area</Eyebrow>
            <Sparkline data={SPENDING} hasArea />
          </div>
          <div className="row spread">
            <Eyebrow>No end point</Eyebrow>
            <Sparkline data={SPENDING} hasEndPoint={false} />
          </div>
          <div className="row spread">
            <Eyebrow>Flat</Eyebrow>
            <Sparkline data={[64, 64, 64, 64, 64, 64, 64, 64, 64, 64]} />
          </div>
        </div>
      </Card>
    </div>
  );
}
