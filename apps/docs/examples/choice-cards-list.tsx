import { ChoiceCard, ChoiceCards } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function ChoiceCardsList(): ReactElement {
  return (
    <ChoiceCards
      label="Notifications"
      description="You can change this at any time."
      name="notifications"
      defaultValue="digest"
      style={{ width: '100%', minWidth: 0, maxWidth: '36rem' }}
    >
      <ChoiceCard value="each" description="An email for every payment, as it clears.">
        Every payment
      </ChoiceCard>
      <ChoiceCard value="digest" description="One email on Monday mornings with the week before it.">
        Weekly digest
      </ChoiceCard>
      <ChoiceCard value="none" description="Check the activity page when you want to.">
        None
      </ChoiceCard>
    </ChoiceCards>
  );
}
