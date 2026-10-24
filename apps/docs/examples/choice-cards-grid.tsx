import { ChoiceCard, ChoiceCards } from '@snapshot-ui/react';
import type { ReactElement } from 'react';
import { DARK_PICTURE, LIGHT_PICTURE, SYSTEM_PICTURE } from './pictures';

export default function ChoiceCardsGrid(): ReactElement {
  return (
    <ChoiceCards
      label="Theme"
      name="appearance"
      layout="grid"
      defaultValue="system"
      style={{ width: '100%', minWidth: 0, maxWidth: '40rem' }}
    >
      <ChoiceCard value="light" picture={<img src={LIGHT_PICTURE} alt="" />} description="A warm cream page.">
        Light
      </ChoiceCard>
      <ChoiceCard value="dark" picture={<img src={DARK_PICTURE} alt="" />} description="For low light.">
        Dark
      </ChoiceCard>
      <ChoiceCard
        value="system"
        picture={<img src={SYSTEM_PICTURE} alt="" />}
        description="Follows the device."
      >
        System
      </ChoiceCard>
    </ChoiceCards>
  );
}
