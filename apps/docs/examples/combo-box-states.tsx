import { ComboBox, PickerOption } from '@snapshot-ui/react';
import type { ReactElement } from 'react';

const OPTIONS = (
  <>
    <PickerOption id="cafe-luna">Café Luna</PickerOption>
    <PickerOption id="corner-mart">Corner Mart</PickerOption>
    <PickerOption id="harbor-books">Harbor Books</PickerOption>
  </>
);

export default function ComboBoxStates(): ReactElement {
  return (
    <div className="stack" style={{ width: '100%', maxWidth: '24rem' }}>
      <ComboBox label="Merchant" defaultValue="corner-mart" isChanged>
        {OPTIONS}
      </ComboBox>
      <ComboBox label="Payee" placeholder="Type a merchant" isInvalid errorMessage="Choose a merchant.">
        {OPTIONS}
      </ComboBox>
      <ComboBox label="Archived merchant" defaultValue="harbor-books" isDisabled>
        {OPTIONS}
      </ComboBox>
    </div>
  );
}
