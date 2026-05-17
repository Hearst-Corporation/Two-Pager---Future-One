'use client';
import { useState } from 'react';

/**
 * 5-question modal that seeds a Base Case scenario with enough inputs to
 * produce a valid IRR. Cuts the cold-start from ~91 clicks to ~10.
 *
 * Props:
 *   scenarioId  — the Base Case scenario UUID to PATCH (required)
 *   onDone      — fn() called after successful save (refresh parent)
 *   onSkip      — fn() called when user dismisses without saving
 */
const STEPS = [
  {
    key: 'total_mw',
    title: 'IT Capacity',
    question: 'How many MW of IT load will the campus deliver at full build?',
    note: 'Common scale: 20–100 MW Phase 1, 200–500 MW at full campus build.',
    unit: 'MW',
    type: 'number',
    placeholder: '100',
    min: 1, max: 1000,
  },
  {
    key: 'capex_shell_per_mw',
    title: 'Shell CAPEX per MW',
    question: 'Approximate construction cost per MW of IT load (shell + structure).',
    note: 'Liquid-ready hyperscale grade: ~$4M/MW for shell alone. Total all-in incl. MEP, cooling, substation, grid: ~$10–14M/MW.',
    unit: '$/MW',
    type: 'number',
    placeholder: '4000000',
    min: 100000, max: 50000000,
  },
  {
    key: 'price_retail_colo_kw_month',
    title: 'Target Retail Colo Price',
    question: 'What $/kW/month retail colocation rate are you underwriting?',
    note: 'NoVA 2025: $180–215. Qatar should price 15–25% below US tier-1 = ~$140–180.',
    unit: '$/kW/mo',
    type: 'number',
    placeholder: '160',
    min: 10, max: 1000,
  },
  {
    key: 'debt_pct',
    title: 'Debt Share',
    question: 'What percentage of total CAPEX will be financed by debt (vs equity)?',
    note: 'Brookfield typical: 60–75% senior debt on stabilised assets. Greenfield: 50–65%.',
    unit: '%',
    type: 'number',
    placeholder: '60',
    min: 0, max: 95,
  },
  {
    key: 'exit_multiple',
    title: 'Exit EBITDA Multiple',
    question: 'What multiple of stabilised EBITDA do you expect at exit?',
    note: '2024–25 hyperscale data-center comps: 16–22× EBITDA. Tier-2 markets / frontier: 12–16×.',
    unit: 'x',
    type: 'number',
    placeholder: '14',
    min: 5, max: 30,
    step: 0.5,
  },
];

export default function QuickStartWizard({ scenarioId, onDone, onSkip }) {
  const [step, setStep] = useState(0);
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const current = STEPS[step];
  const currentValue = values[current.key] ?? '';
  const isLast = step === STEPS.length - 1;

  function next() {
    if (currentValue === '') return;
    if (isLast) save();
    else setStep(s => s + 1);
  }

  function back() {
    if (step === 0) onSkip?.();
    else setStep(s => s - 1);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      // Coerce to numbers (all 5 fields are numeric in DB)
      const payload = {};
      for (const s of STEPS) {
        const v = values[s.key];
        if (v !== '' && v != null) payload[s.key] = parseFloat(v);
      }
      // Provide reasonable defaults for the secondary inputs the projection engine needs
      // so an IRR can compute immediately. These can be overridden in Assumptions later.
      payload.pue = payload.pue ?? 1.5;
      payload.electricity_price_mwh = payload.electricity_price_mwh ?? 40;
      payload.target_occupancy_pct = payload.target_occupancy_pct ?? 85;
      payload.capex_mep_per_mw = payload.capex_mep_per_mw ?? Math.round(payload.capex_shell_per_mw * 0.75);
      payload.capex_substation_per_mw = payload.capex_substation_per_mw ?? Math.round(payload.capex_shell_per_mw * 0.375);
      payload.capex_cooling_per_mw = payload.capex_cooling_per_mw ?? Math.round(payload.capex_shell_per_mw * 0.25);
      payload.capex_grid_per_mw = payload.capex_grid_per_mw ?? Math.round(payload.capex_shell_per_mw * 0.125);
      payload.debt_interest_rate = payload.debt_interest_rate ?? 6;

      const res = await fetch(`/api/admin/hearst/scenarios/${scenarioId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Save failed (${res.status})`);
      }
      onDone?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); next(); }
    if (e.key === 'Escape') { e.preventDefault(); onSkip?.(); }
  }

  return (
    <div style={S.backdrop} role="dialog" aria-modal="true" aria-labelledby="qs-title">
      <div style={S.modal}>
        {/* Header */}
        <div style={S.header}>
          <div>
            <div style={S.eyebrow}>QUICK START · {step + 1} / {STEPS.length}</div>
            <div id="qs-title" style={S.title}>{current.title}</div>
          </div>
          <button onClick={onSkip} style={S.closeBtn} aria-label="Skip wizard">✕</button>
        </div>

        {/* Progress bar */}
        <div style={S.progress}>
          <div style={{ ...S.progressFill, width: ((step + 1) / STEPS.length) * 100 + '%' }} />
        </div>

        {/* Body */}
        <div style={S.body}>
          <div style={S.question}>{current.question}</div>
          <div style={S.note}>{current.note}</div>

          <div style={S.inputWrap}>
            <input
              type={current.type}
              value={currentValue}
              onChange={e => setValues(v => ({ ...v, [current.key]: e.target.value }))}
              onKeyDown={onKey}
              placeholder={current.placeholder}
              min={current.min}
              max={current.max}
              step={current.step}
              autoFocus
              style={S.input}
            />
            <span style={S.unit}>{current.unit}</span>
          </div>

          {error && <div style={S.error}>⛔ {error}</div>}
        </div>

        {/* Footer */}
        <div style={S.footer}>
          <button onClick={back} style={S.secondaryBtn} disabled={saving}>
            {step === 0 ? 'Skip wizard' : '← Back'}
          </button>
          <button
            onClick={next}
            disabled={currentValue === '' || saving}
            style={{
              ...S.primaryBtn,
              opacity: currentValue === '' || saving ? 0.5 : 1,
              cursor: currentValue === '' || saving ? 'not-allowed' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : isLast ? 'Generate Base Case →' : 'Next →'}
          </button>
        </div>

        {/* Foot note */}
        <div style={S.disclaimer}>
          Values become the Base Case scenario. Refine them in Assumptions afterwards.
          PUE, electricity, occupancy and OPEX components get reasonable Qatar defaults.
        </div>
      </div>
    </div>
  );
}

const S = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 100,
    background: 'var(--cp-scrim)',
    backdropFilter: 'blur(6px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
    fontFamily: '"Inter", sans-serif',
  },
  modal: {
    width: '100%', maxWidth: 520,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 12,
    boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
    padding: '20px 24px 12px',
  },
  eyebrow: {
    fontSize: 10, fontWeight: 800, letterSpacing: 2,
    color: 'var(--cp-accent-strong)', textTransform: 'uppercase', marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: 800, color: 'var(--cp-text-primary)' },
  closeBtn: {
    fontSize: 14, color: 'var(--cp-text-muted)',
    background: 'transparent', border: 'none', cursor: 'pointer',
    padding: 4, lineHeight: 1,
  },
  progress: {
    height: 3, background: 'var(--cp-border)', margin: '0 24px 18px',
  },
  progressFill: {
    height: '100%', background: 'var(--cp-accent-strong)', transition: 'width .25s ease',
  },
  body: { padding: '0 24px 12px' },
  question: { fontSize: 14, fontWeight: 600, color: 'var(--cp-text-primary)', marginBottom: 6, lineHeight: 1.5 },
  note: { fontSize: 12, color: 'var(--cp-text-muted)', marginBottom: 18, lineHeight: 1.55 },
  inputWrap: { display: 'flex', alignItems: 'center', gap: 8 },
  input: {
    flex: 1, fontSize: 16, fontWeight: 600,
    padding: '10px 14px',
    border: '2px solid var(--cp-border)', borderRadius: 8,
    background: 'var(--cp-bg-deep)', color: 'var(--cp-text-primary)',
  },
  unit: {
    fontSize: 12, fontWeight: 700, color: 'var(--cp-text-muted)',
    minWidth: 60, textAlign: 'right',
  },
  error: {
    fontSize: 12, fontWeight: 600, color: 'var(--cp-error)',
    background: 'var(--cp-surface-1)', padding: '8px 12px', borderRadius: 6, marginTop: 12,
  },
  footer: {
    display: 'flex', justifyContent: 'space-between', gap: 12,
    padding: '12px 24px 18px',
    borderTop: '1px solid var(--cp-border)',
    marginTop: 12,
  },
  primaryBtn: {
    fontSize: 13, fontWeight: 700,
    background: 'var(--cp-accent-strong)', color: 'var(--cp-text-strong)',
    border: 'none', borderRadius: 6, padding: '10px 18px', cursor: 'pointer',
  },
  secondaryBtn: {
    fontSize: 12, fontWeight: 600,
    background: 'transparent', color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)', borderRadius: 6,
    padding: '10px 14px', cursor: 'pointer',
  },
  disclaimer: {
    fontSize: 10, color: 'var(--cp-text-muted)',
    padding: '0 24px 16px', textAlign: 'center', lineHeight: 1.55,
    fontStyle: 'italic',
  },
};
