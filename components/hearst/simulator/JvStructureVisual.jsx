'use client';

import { INVESTMENT_STRUCTURE } from '@/lib/hearst-config-presets';
import { UI } from '@/lib/ui-strings';

const { sponsor_equity_pct, operator_equity_pct } = INVESTMENT_STRUCTURE;

export default function JvStructureVisual() {
  return (
    <div data-sim-jv-visual>
      <div data-sim-jv-top>
        <div data-sim-jv-party>
          <strong>{UI.SIM_JV_PARTY_QIA}</strong>
          <span>{UI.SIM_JV_QIA_ROLE}</span>
        </div>
        <div data-sim-jv-party>
          <strong>{UI.SIM_JV_PARTY_HEARST}</strong>
          <span>{UI.SIM_JV_HEARST_ROLE}</span>
        </div>
      </div>
      <div data-sim-jv-line />
      <div data-sim-jv-vehicle>
        <span>{UI.SIM_JV1_LABEL}</span>
        <strong>{UI.SIM_JV1_NAME}</strong>
      </div>
      <div data-sim-jv-line />
      <div data-sim-jv-bottom>
        <div data-sim-jv-vehicle>
          <span>{sponsor_equity_pct}%</span>
          <strong>{UI.SIM_JV_SHARE_QIA_HEARST}</strong>
        </div>
        <div data-sim-jv-vehicle data-sim-equinix>
          <span>{operator_equity_pct}%</span>
          <strong>{UI.SIM_JV_SHARE_EQUINIX}</strong>
        </div>
      </div>
      <p data-sim-jv-note>{UI.SIM_JV_NOTE}</p>
    </div>
  );
}
