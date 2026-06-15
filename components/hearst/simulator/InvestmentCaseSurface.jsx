'use client';

import PropTypes from 'prop-types';
import { UI } from '@/lib/ui-strings';
import { fmtUSD, fmtMW, fmtPctFromRatio, fmtX, MISSING } from '@/lib/hearst-format';
import { PRESET_META, LEVEL_LABEL } from './preset-meta';

export default function InvestmentCaseSurface({
  state,
  scenario,
  projection,
  selectedArchetype,
}) {
  const capacity = scenario?.total_mw ?? state.total_mw;
  const capex = projection?.total_capex ?? scenario?.total_capex_usd ?? state.capital_usd;
  const irr = projection?.irr ?? projection?.return_metrics?.irr;
  const moic = projection?.moic;
  const npv = projection?.npv ?? projection?.return_metrics?.npv;

  const meta = PRESET_META[state.primary_archetype_id];

  return (
    <div className="is-assembling" style={{ marginBottom: '64px' }}>
      <div className="del-1" style={{ marginBottom: '48px' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1, margin: '0 0 16px 0', color: 'var(--cp-text-strong)' }}>
          {UI.SIM_CASE_VERB} <strong>{fmtUSD(capex)}</strong> {UI.SIM_CASE_INTO}{' '}
          <strong>{fmtMW(capacity, 0)}</strong> {UI.SIM_CASE_IN_QATAR_WITH}{' '}
          <strong>{selectedArchetype?.label || state.primary_archetype_id}</strong>
        </h1>
        <p style={{ fontSize: '20px', color: 'var(--cp-text-muted)', margin: 0, maxWidth: '800px', lineHeight: 1.4 }}>
          {meta?.tagline ? `${meta.tagline}. ` : ''}{UI.SIM_PAGE_SUBTITLE}
        </p>
      </div>

      <div className="del-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)' }}>
          <div style={{ fontSize: '12px', color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{UI.SIM_RESULT_RETURN}</div>
          <div style={{ fontSize: '36px', fontWeight: 300, color: 'var(--cp-text-strong)' }}>{irr != null ? fmtPctFromRatio(irr) : MISSING}</div>
        </div>
        
        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)' }}>
          <div style={{ fontSize: '12px', color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>{UI.SIM_METRIC_CAPITAL}</div>
          <div style={{ fontSize: '36px', fontWeight: 300, color: 'var(--cp-text-strong)' }}>{fmtUSD(capex)}</div>
        </div>

        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)' }}>
          <div style={{ fontSize: '12px', color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Risk Profile</div>
          <div style={{ fontSize: '36px', fontWeight: 300, color: 'var(--cp-text-strong)' }}>{meta ? LEVEL_LABEL[meta.risk] : MISSING}</div>
        </div>

        <div style={{ padding: '24px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)' }}>
          <div style={{ fontSize: '12px', color: 'var(--cp-text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>NPV</div>
          <div style={{ fontSize: '36px', fontWeight: 300, color: 'var(--cp-text-strong)' }}>{npv != null ? fmtUSD(npv) : (moic != null ? `${fmtX(moic)}x` : MISSING)}</div>
        </div>
      </div>
    </div>
  );
}

InvestmentCaseSurface.propTypes = {
  state: PropTypes.object.isRequired,
  scenario: PropTypes.object,
  projection: PropTypes.object,
  selectedArchetype: PropTypes.object,
};
