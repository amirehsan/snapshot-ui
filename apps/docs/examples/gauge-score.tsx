import { Card, CardBody, CardHeader, CardTitle, Gauge, type GaugeMark } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

/** The band edges of a 300 to 850 score: each mark's label is read as the gauge's description. */
const BANDS: GaugeMark[] = [
  { value: 580, label: 'Fair from 580' },
  { value: 670, label: 'Good from 670' },
  { value: 740, label: 'Very good from 740' },
  { value: 800, label: 'Excellent from 800' },
];

/** The app picks the word and the tone: ink from 670, warning under it, never error, which means a failure. */
function band(score: number): { caption: string; tone: 'neutral' | 'warning' } {
  if (score >= 800) return { caption: 'Excellent', tone: 'neutral' };
  if (score >= 740) return { caption: 'Very good', tone: 'neutral' };
  if (score >= 670) return { caption: 'Good', tone: 'neutral' };
  if (score >= 580) return { caption: 'Fair', tone: 'warning' };
  return { caption: 'Poor', tone: 'warning' };
}

function Score({ score }: { score: number }): ReactElement {
  const { caption, tone } = band(score);
  return (
    <Gauge
      label="Credit score"
      form="semicircle"
      size="lg"
      minValue={300}
      maxValue={850}
      value={score}
      valueLabel={`${String(score)} of 850, ${caption}`}
      figure={String(score)}
      figureCaption={caption}
      tone={tone}
      marks={BANDS}
    />
  );
}

export default function GaugeScore(): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={3}>Credit score</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--spacing-separate)' }}>
          <Score score={742} />
          {/* Fair and Poor are both warning: the word and where the arc stops between the marks tell them apart. */}
          <Score score={640} />
          <Score score={540} />
        </div>
      </CardBody>
    </Card>
  );
}
