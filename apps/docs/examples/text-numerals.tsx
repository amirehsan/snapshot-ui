import { Eyebrow, Text } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

export default function TextNumerals(): ReactElement {
  return (
    <div style={{ display: 'grid', gap: 32, justifyItems: 'start' }}>
      <div style={{ display: 'grid', gap: 8 }}>
        <Eyebrow>Balance</Eyebrow>
        {/* A 44px "$12,345.67" is 230px, which does not fit a 212px column, so this hero shows a shorter figure. */}
        <Text as="span" size="numeral">
          $2,345.67
        </Text>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '24px 32px' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          <Eyebrow>Spent</Eyebrow>
          <Text as="span" size="numeral-sm">
            $4,210.00
          </Text>
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <Eyebrow>Arrived</Eyebrow>
          <Text as="span" size="numeral-sm" style={{ color: 'var(--color-gain)' }}>
            +$1,980.00
          </Text>
        </div>
      </div>
    </div>
  );
}
