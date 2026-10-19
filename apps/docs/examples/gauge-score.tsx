import { Card, CardBody, CardHeader, CardTitle, Gauge, type GaugeMark } from '@snapshot-ui/react';
import type { CSSProperties, ReactElement } from 'react';

/** The band edges of a 300 to 850 score: each mark's label is read as the gauge's description. */
const BANDS: GaugeMark[] = [
  { value: 580, label: 'Fair from 580' },
  { value: 670, label: 'Good from 670' },
  { value: 740, label: 'Very good from 740' },
  { value: 800, label: 'Excellent from 800' },
];

/** The bands in words, for the legend under the scores: the arc's place between the marks, said once. */
const LEGEND = [
  { word: 'Poor', range: '300 to 579' },
  { word: 'Fair', range: '580 to 669' },
  { word: 'Good', range: '670 to 739' },
  { word: 'Very good', range: '740 to 799' },
  { word: 'Excellent', range: '800 to 850' },
];

/** The app picks the word and the tone: ink from 670, warning under it, never error, which means a failure. */
function band(score: number): { caption: string; tone: 'neutral' | 'warning' } {
  if (score >= 800) return { caption: 'Excellent', tone: 'neutral' };
  if (score >= 740) return { caption: 'Very good', tone: 'neutral' };
  if (score >= 670) return { caption: 'Good', tone: 'neutral' };
  if (score >= 580) return { caption: 'Fair', tone: 'warning' };
  return { caption: 'Poor', tone: 'warning' };
}

/**
 * The range's ends, under the semicircle's ends: an lg dial is 160px wide and centred in the gauge, and its arc
 * ends 80px down, so each figure sits just under its end. The meter reports the range already, so these repeat it
 * for the eye only.
 */
const END: CSSProperties = {
  position: 'absolute',
  insetBlockStart: 'calc(5rem + var(--spacing-part))',
  fontSize: 'var(--text-small)',
  lineHeight: 'var(--text-small--line-height)',
  fontVariantNumeric: 'tabular-nums',
  color: 'var(--color-slate)',
};

function Score({ score }: { score: number }): ReactElement {
  const { caption, tone } = band(score);
  return (
    <div style={{ position: 'relative', display: 'inline-grid' }}>
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
      <span aria-hidden="true" style={{ ...END, insetInlineStart: 'calc(50% - 5rem)' }}>
        300
      </span>
      <span aria-hidden="true" style={{ ...END, insetInlineEnd: 'calc(50% - 5rem)' }}>
        850
      </span>
    </div>
  );
}

export default function GaugeScore(): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle level={3}>Credit score</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="stack">
          <div className="row" style={{ alignItems: 'flex-start', gap: 'var(--spacing-separate)' }}>
            <Score score={742} />
            {/* Fair and Poor are both warning: the word and where the arc stops between the marks tell them apart. */}
            <Score score={640} />
            <Score score={540} />
          </div>
          <ul
            className="row"
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              columnGap: 'var(--spacing-peer)',
              fontSize: 'var(--text-small)',
              lineHeight: 'var(--text-small--line-height)',
            }}
          >
            {LEGEND.map(({ word, range }) => (
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
