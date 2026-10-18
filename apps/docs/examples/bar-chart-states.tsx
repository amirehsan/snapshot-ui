'use client';

import { BarChart } from '@snapshot-ui/charts';
import { Button, Card, EmptyState } from '@snapshot-ui/react';
import { ChartColumn, CloudOff } from 'lucide-react';
import { useState, type ReactElement } from 'react';
import { BY_CATEGORY, CATEGORIES } from './insights-data';

export default function BarChartStates(): ReactElement {
  // A failed load the reader can retry: Try again draws the chart, as a fetch that succeeded would.
  const [hasFailed, setFailed] = useState(true);
  return (
    <div className="chart-sample stack">
      <Card>
        <BarChart
          aria-label="Spending by category, loading"
          orientation="horizontal"
          categories={CATEGORIES}
          series={[BY_CATEGORY]}
          status="loading"
        />
      </Card>
      <Card>
        <BarChart
          aria-label="Spending by category, November"
          orientation="horizontal"
          categories={[]}
          series={[{ label: 'November', values: [] }]}
          status="empty"
          statusContent={
            <EmptyState
              headingLevel={3}
              icon={<ChartColumn />}
              title="No spending yet"
              description="November's spending shows here once a transaction arrives."
            />
          }
        />
      </Card>
      <Card>
        <BarChart
          aria-label="Spending by category, October"
          orientation="horizontal"
          categories={CATEGORIES}
          series={[BY_CATEGORY]}
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
