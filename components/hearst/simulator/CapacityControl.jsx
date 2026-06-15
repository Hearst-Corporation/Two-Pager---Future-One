'use client';
import { ACTIONS } from '@/lib/hearst-simulator-state';

export default function CapacityControl({ value, dispatch }) {
  return (
    <div data-capacity-field>
      <input
        type="number"
        min={0}
        value={value ?? ''}
        onChange={(e) => dispatch({ type: ACTIONS.SET_MW, value: Number(e.target.value) })}
        placeholder="50"
        className="institutional-input"
        aria-label="Target capacity in Megawatts"
      />
      <span className="institutional-unit">Megawatts (MW)</span>
    </div>
  );
}
