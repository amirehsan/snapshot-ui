'use client';

import { Button, ChoiceCard, ChoiceCards, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = 'month';

export default function ChoiceCardsStates(): ReactElement {
  const [value, setValue] = useState<string | null>(SAVED);
  const [sent, setSent] = useState<string | null>(null);
  return (
    <form
      className="stack"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem', gridTemplateColumns: 'minmax(0, 1fr)' }}
      onSubmit={(event) => {
        event.preventDefault();
        const billing = new FormData(event.currentTarget).get('billing');
        setSent(typeof billing === 'string' ? billing : null);
      }}
    >
      <ChoiceCards
        label="Billing"
        description="Choose another option to see the Changed chip."
        name="billing"
        isRequired
        errorMessage="Choose how you pay to continue."
        value={value}
        onChange={setValue}
        isChanged={value !== SAVED}
      >
        <ChoiceCard value="month" description="Pay at the start of each month." detail="$12">
          Every month
        </ChoiceCard>
        <ChoiceCard value="year" description="Pay once and save two months." detail="$120">
          Every year
        </ChoiceCard>
        <ChoiceCard
          value="team"
          description="For five people or more. Ask us to turn it on."
          detail="$40"
          isDisabled
        >
          Team
        </ChoiceCard>
      </ChoiceCards>
      <ChoiceCards label="Region" name="region" isRequired errorMessage="Choose where we keep your data.">
        <ChoiceCard value="eu" description="Kept in Frankfurt and Dublin.">
          Europe
        </ChoiceCard>
        <ChoiceCard value="us" description="Kept in Virginia and Oregon.">
          United States
        </ChoiceCard>
      </ChoiceCards>
      <div className="row">
        <Button type="submit">Save</Button>
      </div>
      {sent === null ? null : (
        <Text size="small" tone="muted">
          Saved: {sent}
        </Text>
      )}
    </form>
  );
}
