import { ChoiceCard, ChoiceCards } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ChoiceCardsDetails(): ReactElement {
  return (
    <ChoiceCards
      label="Plan"
      description="Prices include tax."
      name="plan"
      defaultValue="yearly"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem' }}
    >
      <ChoiceCard value="monthly" description="Billed every month. Cancel any time." detail="$12 a month">
        Monthly
      </ChoiceCard>
      <ChoiceCard value="yearly" description="Two months free." detail="$120 a year">
        Yearly
      </ChoiceCard>
      <ChoiceCard value="starter" description="One account and no exports." detail="Free">
        Starter
      </ChoiceCard>
    </ChoiceCards>
  );
}
