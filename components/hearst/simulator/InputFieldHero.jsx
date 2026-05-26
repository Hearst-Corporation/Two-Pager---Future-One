'use client';

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
    <div style={S.wrap}>
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
        <div style={S.derived}>
          {mode === 'capital_first' && derived.mw != null && (
            <span>Estimated capacity: <b>{derived.mw} MW</b> · ${(derived.capex_per_mw_used / 1e6).toFixed(1)}M/MW (Qatar market)</span>
          )}
          {mode === 'mw_first' && value > 0 && (
            <span>Estimated cost: <b>~${((value * 10_900_000 * 1.1) / 1e6).toFixed(0)}M</b> to build</span>
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
    </div>
  );
}

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 20,
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    paddingBottom: 8,
    borderBottom: '2px solid var(--cp-border)',
  },
  input: {
    flex: 1,
    fontSize: 44,
    lineHeight: '48px',
    fontWeight: 900,
    letterSpacing: -1,
    padding: 0,
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    minWidth: 0,
    fontVariantNumeric: 'tabular-nums',
  },
  suffix: {
    fontSize: 24,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
  },
  desc: {
    fontSize: 11,
    lineHeight: '16px',
    color: 'var(--cp-text-muted)',
  },
  derived: {
    fontSize: 12,
    color: 'var(--cp-text-primary)',
    padding: '8px 12px',
    background: 'var(--cp-accent-soft)',
    borderRadius: 6,
    marginTop: 'auto',
  },
};
