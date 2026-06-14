import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtPctRaw, fmtYears, MISSING } from '@/lib/hearst-format';

export function buildAssumptionRows(scenario, projection, state) {
  const capexPerMw = projection?.total_capex && scenario?.total_mw
    ? projection.total_capex / scenario.total_mw
    : null;
  const elec = state.electricity_price_mwh ?? scenario?.electricity_price_mwh;

  return [
    {
      label: UI.SIM_ASSUMPTION_CONSTRUCTION_LABEL,
      value: capexPerMw != null ? `${fmtUSD(capexPerMw)} / MW` : UI.SIM_ASSUMPTION_CONSTRUCTION_VALUE,
    },
    {
      label: UI.SIM_ASSUMPTION_EXIT_LABEL,
      value: scenario?.exit_year != null ? fmtYears(scenario.exit_year) : UI.SIM_ASSUMPTION_EXIT_VALUE,
    },
    {
      label: UI.SIM_ASSUMPTION_PUE_LABEL,
      value: scenario?.pue != null ? String(scenario.pue) : UI.SIM_ASSUMPTION_PUE_VALUE,
    },
    {
      label: UI.SIM_ASSUMPTION_RESERVATION_LABEL,
      value: scenario?.target_occupancy_pct != null
        ? fmtPctRaw(scenario.target_occupancy_pct, 0)
        : UI.SIM_ASSUMPTION_RESERVATION_VALUE,
    },
    {
      label: UI.SIM_ELECTRICITY_LABEL,
      value: elec != null ? `${elec} ${UI.SIM_ELECTRICITY_UNIT}` : MISSING,
    },
  ];
}
