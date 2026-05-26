'use client';

const MODE_CONFIG = {
  capital_first: {
    label: 'How much to invest',
    suffix: '$',
    placeholder: '500,000,000',
    description: 'Total money to invest (USD). We estimate how much capacity (MW) this can build in Qatar.',
    parseValue: (s) => parseFloat(String(s).replace(/[\s,]/g, '')) || 0,
    formatValue: (v) => {
      if (!v) return '';
      return v.toLocaleString('en-US');
    },
  },
  mw_first: {
    label: 'How big (in MW of power)',
    suffix: 'MW',
    placeholder: '50',
    description: 'Target power capacity. You can split into phases in advanced settings.',
    parseValue: (s) => parseFloat(s) || 0,
    formatValue: (v) => (v ? String(v) : ''),
  },
  target_irr_first: {
    label: 'Yearly return you want',
    suffix: '%',
    placeholder: '18',
    description: 'Tell us your target return — we work backwards on the lever you choose (Pricing / Build cost / Debt level / Size).',
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
            <span>Estimated capacity: <b>{derived.mw} MW</b> at ${(derived.capex_per_mw_used / 1e6).toFixed(1)}M per MW (Qatar market data)</span>
          )}
          {mode === 'mw_first' && value > 0 && (
            <span>Estimated cost: <b>~${((value * 10_900_000 * 1.1) / 1e6).toFixed(0)}M</b> to build</span>
          )}
          {mode === 'target_irr_first' && solver && (
            <span>
              {solver.converged
                ? <>Solved in {solver.iterations} steps. Required value: <b>{solver.lever_value?.toFixed(1)}</b></>
                : <>Couldn't find an answer. Try a smaller return target, or change the lever.</>}
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
    gap: 6,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8,
    padding: '14px 18px',
  },
  label: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 1.5,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 36,
    fontWeight: 900,
    padding: '4px 0',
    border: 'none',
    background: 'transparent',
    color: 'var(--cp-text-primary)',
    outline: 'none',
    minWidth: 0,
  },
  suffix: {
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
  },
  desc: {
    fontSize: 11,
    color: 'var(--cp-text-muted)',
    marginTop: 4,
  },
  derived: {
    fontSize: 12,
    color: 'var(--cp-text-primary)',
    marginTop: 8,
    padding: '6px 10px',
    background: 'var(--cp-info-bg)',
    borderRadius: 6,
  },
};
