'use client';

import { Button, Radio, RadioGroup, Text } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

export default function RadioGroupValidation(): ReactElement {
  const [chosen, setChosen] = useState('');
  return (
    <form
      className="stack"
      style={{ width: '100%', maxWidth: '24rem' }}
      onSubmit={(event) => {
        event.preventDefault();
        const plan = new FormData(event.currentTarget).get('plan');
        setChosen(typeof plan === 'string' ? plan : '');
      }}
    >
      <RadioGroup label="Plan" name="plan" isRequired errorMessage="Choose a plan to continue.">
        <Radio value="free">Free</Radio>
        <Radio value="team">Team</Radio>
        <Radio value="business">Business</Radio>
      </RadioGroup>
      <div className="row">
        <Button type="submit">Continue</Button>
      </div>
      <Text tone="muted" role="status">
        {chosen ? `You chose the ${chosen} plan.` : ''}
      </Text>
    </form>
  );
}
