import { PickerOption, PickerSection, Select } from '@snapshot-ui/react';
import { Briefcase, Car, House, ShoppingCart, Undo2 } from 'lucide-react';
import type { ReactElement } from 'react';

export default function SelectDetails(): ReactElement {
  return (
    <Select label="Category" defaultValue="groceries" style={{ width: '100%', maxWidth: '24rem' }}>
      <PickerSection title="Spending">
        <PickerOption
          id="groceries"
          icon={<ShoppingCart />}
          description="Supermarkets and markets"
          end="$1,204.50"
        >
          Groceries
        </PickerOption>
        <PickerOption id="rent" icon={<House />} end="$2,100.00">
          Rent
        </PickerOption>
        <PickerOption id="transport" icon={<Car />} description="Fuel, fares and parking" end="$318.20">
          Transport
        </PickerOption>
      </PickerSection>
      <PickerSection title="Income">
        <PickerOption id="salary" icon={<Briefcase />} end="$6,400.00">
          Salary
        </PickerOption>
        <PickerOption id="refunds" icon={<Undo2 />}>
          Refunds
        </PickerOption>
      </PickerSection>
    </Select>
  );
}
