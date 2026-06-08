'use client';

import { Card } from '@/components/hearst/ui';

const MODE_CONFIG = {
  capital_first: {
    label: 'How much to invest',
    suffix: '$',
    placeholder: '500,000,000',
    description: 'Total money to invest (USD). We estimate capacity (MW) buildable in Qatar.',
    parseValue: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0,
    formatValue: (v) => (!v ? '' : v.toLocaleString('en-US')),
  },
  mw_first: {
    label: 'How big (MW of power)',
    suffix: 'MW',
    placeholder: '50',
    description: 'Target power capacity. Split into phases in advanced settings.',
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
  target_irr_first: {
    label: 'Yearly return target',
    suffix: '%',
    placeholder: '18',
    description: 'We work backwards on the lever you choose (Pricing / Build / Debt / Size).',
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
};

export default function InputFieldHero({ mode, value, onChange, derived, solver }) {
  const cfg = MODE_CONFIG[mode] || MODE_CONFIG.mw_first;

  return (
    <Card surface={0} padding="lg" style={S.wrap}>
      <div style={S.label}>{cfg.label}</div>
      <div style={S.row}>
        <input
          type="text"
          value={cfg.formatValue(value)}
          onChange={e => onChange?.(cfg.parseValue(e.target.value))}
          placeholder={cfg.placeholder}
          style={S.input}
        />
        <span style={S.suffix}>{cfg.suffix}</span>
      </div>
      <div style={S.desc}>{cfg.description}</div>
      {derived && (
        <div className="cp-surface-accent-soft" style={S.derived}>
          {mode === 'capital_first' && derived.mw != null && (
            <span>Estimated capacity: <b>{derived.mw} MW</b> · ${(derived.capex_per_mw_used / 1e6).toFixed(1)}M/MW (Qatar market)</span>
          )}
          {mode === 'mw_first' && value > 0 && (
            <span>Industry benchmark: ~${((value * 10_900_000 * 1.1) / 1e6).toFixed(0)}M est. total · actual CAPEX after Run</span>
          )}
          {mode === 'target_irr_first' && solver && (
            <span>
              {solver.converged
                ? <>Solved in {solver.iterations} steps · required: <b>{solver.lever_value?.toFixed(1)}</b></>
                : <>No solution. Try a smaller target or change the lever.</>}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3)',
    justifyContent: 'space-between',
    minHeight: 154,
  },
  label: {
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 'var(--cp-space-2)',
    paddingBottom: 'var(--cp-space-2)',
    borderBottom: '2px solid var(--cp-border)',
  },
  // Hero display field — display tokens dédiés, hors échelle texte courante.
  input: {
    flex: 1,
    fontSize: 'var(--cp-display-input)',
    lineHeight: 'var(--cp-space-12)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-tight)',
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    minWidth: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  suffix: {
    fontSize: 'var(--cp-display-unit)',
    fontWeight: 'var(--cp-weight-black)',
    color: 'var(--cp-text-muted)',
  },
  desc: {
    fontSize: 'var(--cp-font-xs)',
    lineHeight: 'var(--cp-leading-tight)',
    color: 'var(--cp-text-muted)',
  },
  // Bandeau d'info plat (pas une cp-card) — fond accent-soft + radius léger,
  // sans bordure/ombre pour ne pas réintroduire une boîte imbriquée.
  derived: {
    fontSize: 'var(--cp-font-sm)',
    color: 'var(--cp-text-primary)',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    borderRadius: 'var(--cp-radius-md)',
    marginTop: 'auto',
  },
};
