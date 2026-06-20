'use client';

import PropTypes from 'prop-types';
import { getCase } from '@/lib/hearst-scenario-cases';
import { UI } from '@/lib/ui-strings';

// Human labels for the engine fields surfaced in the assumptions table.
// Object values (not JSX text) — short, data-layer, not user-facing chrome.
const FIELD_LABELS = {
  electricity_price_mwh: 'Power price',
  price_hyperscale_kw_month: 'Tenant price (hyperscale)',
  target_occupancy_pct: 'Utilization / occupancy',
  pue: 'PUE',
  capex_contingency_pct: 'CAPEX contingency',
  opex_maintenance_pct: 'Maintenance OPEX',
  debt_interest_rate: 'Debt rate',
  debt_pct: 'Leverage',
  debt_term_years: 'Debt tenor',
  exit_multiple: 'Exit multiple',
};

const CONF_COLOR = {
  high: 'var(--cp-status-success)',
  medium: 'var(--cp-status-warning)',
  low: 'var(--cp-status-danger)',
};

/**
 * CaseProvenance — sourced-assumptions table for the active investment case.
 * Read-only provenance panel: every driver shows its value, confidence,
 * classification (confirmed/estimated/benchmarked) and clickable source.
 *
 * @param {object} props
 * @param {string} props.caseId active case id
 */
export default function CaseProvenance({ caseId }) {
  const kase = getCase(caseId);
  const ctx = kase.context || {};

  return (
    <div style={S.wrap}>
      <div style={S.head}>
        <span style={S.title}>{UI.SIM_CASE_ASSUMPTIONS_TITLE}</span>
        <span style={S.hint}>{UI.SIM_CASE_ASSUMPTIONS_HINT}</span>
      </div>

      {kase.id === 'base' && <p style={S.baseNote}>{UI.SIM_CASE_BASE_NOTE}</p>}

      <div style={S.tableScroll}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>{UI.SIM_CASE_COL_DRIVER}</th>
              <th style={{ ...S.th, textAlign: 'right' }}>{UI.SIM_CASE_COL_VALUE}</th>
              <th style={S.th}>{UI.SIM_CASE_COL_CONF}</th>
              <th style={S.th}>{UI.SIM_CASE_COL_CLASS}</th>
              <th style={S.th}>{UI.SIM_CASE_COL_SOURCE}</th>
            </tr>
          </thead>
          <tbody>
            {kase.assumptions.map((row) => (
              <tr key={row.field}>
                <td style={S.tdDriver}>{FIELD_LABELS[row.field] || row.field}</td>
                <td style={S.tdValue}>
                  {row.value}
                  <span style={S.unit}> {row.unit}</span>
                </td>
                <td style={S.td}>
                  <span style={{ ...S.dot, background: CONF_COLOR[row.confidence] || 'var(--cp-text-faint)' }} />
                  {row.confidence}
                </td>
                <td style={{ ...S.td, color: 'var(--cp-text-muted)' }}>{row.classification}</td>
                <td style={S.td}>
                  <a href={row.sourceUrl} target="_blank" rel="noopener noreferrer" style={S.srcLink}>
                    {row.source}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={S.context}>
        <span style={S.contextTitle}>{UI.SIM_CASE_CONTEXT_TITLE}</span>
        <div style={S.contextGrid}>
          <div style={S.contextItem}><span style={S.contextLabel}>{UI.SIM_CASE_CONTEXT_DSCR}</span><span style={S.contextValue}>{ctx.dscr_target}×</span></div>
          <div style={S.contextItem}><span style={S.contextLabel}>{UI.SIM_CASE_CONTEXT_RISK}</span><span style={S.contextValue}>{ctx.risk_premium_bps} bps</span></div>
          <div style={S.contextItem}><span style={S.contextLabel}>{UI.SIM_CASE_CONTEXT_TENANT}</span><span style={S.contextValue}>{ctx.tenant_mix}</span></div>
          <div style={{ ...S.contextItem, gridColumn: '1 / -1' }}><span style={S.contextLabel}>{UI.SIM_CASE_CONTEXT_RAMP}</span><span style={S.contextValue}>{ctx.ramp_note}</span></div>
        </div>
      </div>
    </div>
  );
}

CaseProvenance.propTypes = {
  caseId: PropTypes.string.isRequired,
};

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-3)', minWidth: 0 },
  head: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  title: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },
  hint: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-faint)' },
  baseNote: {
    margin: 0,
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-muted)',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-sm)',
    borderLeft: '2px solid var(--cp-border-strong)',
  },
  tableScroll: { overflowX: 'auto', minWidth: 0 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-xs)' },
  th: {
    textAlign: 'left',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    color: 'var(--cp-text-faint)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wide)',
    borderBottom: '1px solid var(--cp-border-base)',
    whiteSpace: 'nowrap',
  },
  td: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    color: 'var(--cp-text-primary)',
    borderBottom: '1px solid var(--cp-border-base)',
    whiteSpace: 'nowrap',
  },
  tdDriver: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    color: 'var(--cp-text-primary)',
    fontWeight: 'var(--cp-weight-semibold)',
    borderBottom: '1px solid var(--cp-border-base)',
    whiteSpace: 'nowrap',
  },
  tdValue: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    color: 'var(--cp-text-strong)',
    fontWeight: 'var(--cp-weight-bold)',
    textAlign: 'right',
    fontVariantNumeric: 'tabular-nums',
    borderBottom: '1px solid var(--cp-border-base)',
    whiteSpace: 'nowrap',
  },
  unit: { color: 'var(--cp-text-faint)', fontWeight: 'var(--cp-weight-semibold)' },
  dot: {
    display: 'inline-block',
    width: 'var(--cp-space-2)',
    height: 'var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-pill)',
    marginRight: 'var(--cp-space-2)',
    verticalAlign: 'middle',
  },
  srcLink: { color: 'var(--cp-accent-maroon)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)' },
  context: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-3)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-md)',
  },
  contextTitle: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    textTransform: 'uppercase',
    letterSpacing: 'var(--cp-tracking-wide)',
    color: 'var(--cp-text-faint)',
  },
  contextGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 'var(--cp-space-2) var(--cp-space-4)',
  },
  contextItem: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
  contextLabel: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-faint)', textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wide)' },
  contextValue: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-primary)', fontWeight: 'var(--cp-weight-semibold)' },
};
