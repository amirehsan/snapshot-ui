'use client';

import { Checkbox, CheckboxGroup } from '@snapshot-ui/react';
import { useState, type ReactElement } from 'react';

const SAVED = ['email'];

export default function CheckboxGroupExample(): ReactElement {
  const [channels, setChannels] = useState(SAVED);
  const isChanged = channels.length !== SAVED.length || channels.some((channel) => !SAVED.includes(channel));
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <CheckboxGroup
        label="Notify me by"
        description="Pick as many as you like."
        name="channels"
        value={channels}
        onChange={setChannels}
        isChanged={isChanged}
      >
        <Checkbox value="email">Email</Checkbox>
        <Checkbox value="sms">Text message</Checkbox>
        <Checkbox value="push">Push notification</Checkbox>
      </CheckboxGroup>
      <CheckboxGroup label="Show in the summary" orientation="horizontal" defaultValue={['pages']}>
        <Checkbox value="pages">Pages</Checkbox>
        <Checkbox value="comments">Comments</Checkbox>
        <Checkbox value="traffic">Traffic</Checkbox>
      </CheckboxGroup>
    </div>
  );
}
