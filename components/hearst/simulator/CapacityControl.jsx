'use client';
import { Field } from '@/components/hearst/ui';
import { ACTIONS } from '@/lib/hearst-simulator-state';
import { UI } from '@/lib/ui-strings';

export default function CapacityControl({ value, dispatch }) {
  return (
    <div data-capacity-field>
      <Field
        label={UI.SIM_FIELD_SIZE_LABEL}
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => dispatch({ type: ACTIONS.SET_MW, value: Number(e.target.value) })}
        placeholder="50"
      />
    </div>
  );
}
