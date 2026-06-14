import { describe, it, expect } from 'vitest';
import { buildAssumptionRows } from '@/lib/simulator-assumptions';
import { formatBusinessClientPair } from '@/lib/hearst-results-view';
import { UI } from '@/lib/ui-strings';

describe('buildAssumptionRows', () => {
  it('uses engine scenario fields when available', () => {
    const rows = buildAssumptionRows(
      { total_mw: 50, exit_year: 10, pue: 1.45, target_occupancy_pct: 80, electricity_price_mwh: 42 },
      { total_capex: 371_800_000 },
      { electricity_price_mwh: 42 },
    );
    expect(rows.find((r) => r.label === UI.SIM_ASSUMPTION_PUE_LABEL)?.value).toBe('1.45');
    expect(rows.find((r) => r.label === UI.SIM_ASSUMPTION_RESERVATION_LABEL)?.value).toBe('80%');
    expect(rows.find((r) => r.label === UI.SIM_ELECTRICITY_LABEL)?.value).toBe(`42 ${UI.SIM_ELECTRICITY_UNIT}`);
  });

  it('falls back to UI placeholders when scenario is empty', () => {
    const rows = buildAssumptionRows(null, null, { electricity_price_mwh: 42 });
    expect(rows.find((r) => r.label === UI.SIM_ASSUMPTION_CONSTRUCTION_LABEL)?.value)
      .toBe(UI.SIM_ASSUMPTION_CONSTRUCTION_VALUE);
  });
});

describe('formatBusinessClientPair', () => {
  it('returns catalog labels for known ids', () => {
    expect(formatBusinessClientPair('hyperscale_lease', 'hyperscalers'))
      .toBe('Hyperscale Lease / Hyperscalers (AWS, Microsoft, Google, Oracle, Meta)');
  });
});
