// lib/hearst-alerts.js
// Smart Alerts — derive sourcing gaps and project risk signals from scenario + project state.
// Canonical label/message strings live in hearst-constants.js (SMART_ALERTS) — not duplicated here.

import { SMART_ALERTS } from '@/lib/hearst-constants';

/**
 * Detect active smart alerts for a given scenario + project.
 *
 * @param {object|null} scenario  - A hearst_scenarios row (or projection object with source_id fields)
 * @param {object|null} project   - A hearst_projects row (has site_readiness)
 * @returns {{ id: string, message: string, severity: string, field: string }[]}
 */
export function detectAlerts(scenario, project) {
  const alerts = [];
  const s = scenario || {};
  const p = project || {};

  // Build a lookup for canonical alert definitions
  const META = Object.fromEntries(SMART_ALERTS.map(a => [a.id, a]));

  function push(id) {
    const meta = META[id];
    if (meta) alerts.push({ id: meta.id, message: meta.message, severity: meta.severity, field: meta.field });
  }

  // critical: PUE not sourced
  if (!s.pue_source_id) push('pue_unsourced');

  // critical: electricity price not sourced
  if (!s.electricity_price_source_id) push('elec_unsourced');

  // critical: capex not triangulated — requires both shell and MEP sources
  if (!s.capex_shell_source_id || !s.capex_mep_source_id) push('capex_unsourced');

  // critical: no colocation pricing sourced at all
  if (!s.price_retail_source_id && !s.price_wholesale_source_id && !s.price_hyperscale_source_id) {
    push('revenue_unsourced');
  }

  // warning: exit multiple set but not sourced
  if (s.exit_multiple && !s.exit_multiple_source_id) push('exit_multiple');

  // warning: debt terms set but not sourced
  if (s.debt_interest_rate && !s.debt_interest_source_id) push('debt_terms');

  // info: greenfield site — high execution risk
  if (p.site_readiness === 'greenfield') push('greenfield_risk');

  return alerts;
}
