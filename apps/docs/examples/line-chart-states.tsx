'use client';

import { LineChart } from '@snapshot-ui/charts';
import { Button, Card, EmptyState } from '@snapshot-ui/react';
import { ChartLine, CloudOff } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { DAYS, THIS_MONTH, TICKS } from './line-chart-data';

export default function LineChartStates(): ReactElement {
  // A failed load the reader can retry: Try again draws the chart, as a fetch that succeeded would.
  const [hasFailed, setFailed] = useState(true);
  return (
    <div className="chart-sample stack">
      <Card>
        <LineChart
          aria-label="Spending in October, loading"
          series={[THIS_MONTH]}
          xLabels={DAYS}
          yTicks={TICKS}
          status="loading"
        />
      </Card>
      <Card>
        <LineChart
          aria-label="Spending in November"
          series={[{ label: 'This month', points: [] }]}
          xLabels={[]}
          status="empty"
          statusContent={
            <EmptyState
              headingLevel={3}
              icon={<ChartLine />}
              title="No spending yet"
              description="November's spending shows here once a transaction arrives."
            />
          }
        />
      </Card>
      <Card>
        <LineChart
          aria-label="Spending in October, after a retry"
          series={[THIS_MONTH]}
          xLabels={DAYS}
          yTicks={TICKS}
          status={hasFailed ? 'error' : 'ready'}
          statusContent={
            <EmptyState
              headingLevel={3}
              icon={<CloudOff />}
              title="The chart could not be loaded"
              description="Check your connection, then try again."
              action={
                <Button
                  variant="secondary"
                  onPress={() => {
                    setFailed(false);
                  }}
                >
                  Try again
                </Button>
              }
            />
          }
        />
      </Card>
    </div>
  );
}
