'use client';
import { useState, useEffect, useCallback, useMemo, useDeferredValue, useRef } from 'react';
import Link from 'next/link';
import KpiCard from '@/components/hearst/KpiCard';
import { generateProjection } from '@/lib/hearst-calculations';
import { useSimulation } from '@/lib/hearst-simulation-context';

function fmt(v, type) {
  if (v == null) return 'N/A';
  if (type === 'currency') return '$' + (v >= 1e9 ? (v / 1e9).toFixed(1) + 'B' : v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v.toLocaleString());
  if (type === 'pct') return (v * 100).toFixed(1) + '%';
  if (type === 'x') return v.toFixed(2) + 'x';
  if (type === 'mw') return v.toFixed(0) + ' MW';
  if (type === 'years') return v.toFixed(1) + ' yr';
  return v;
}

function pickContextualCta({ proj, sourceScore, drApproved, drTotal }) {
  if (proj.missing_inputs?.length > 0) {
    return { href: '/admin/hearst/assumptions', label: `Fix ${proj.missing_inputs.length} missing input${proj.missing_inputs.length > 1 ? 's' : ''}`, tone: 'critical' };
  }
  if (sourceScore < 70) {
    return { href: '/admin/hearst/sources', label: 'Improve source compliance', tone: 'warning' };
  }
  if (drTotal > 0 && drApproved / drTotal < 0.7) {
    return { href: '/admin/hearst/data-room', label: `Upload ${drTotal - drApproved} remaining documents`, tone: 'warning' };
  }
  return { href: '/admin/hearst/financial', label: 'Review 10-year projection', tone: 'primary' };
}

const SLIDERS = [
  { key: 'total_mw',               label: 'IT Capacity',     unit: 'MW',       min: 5,   max: 500,  step: 5,    fmt: v => `${v} MW` },
  { key: 'target_occupancy_pct',   label: 'Occupancy',       unit: '%',        min: 30,  max: 100,  step: 1,    fmt: v => `${v}%` },
  { key: 'price_hyperscale_kw_month', label: 'Hyperscale $/kW', unit: '$/kW/mo', min: 60, max: 250, step: 5,   fmt: v => `$${v}` },
  { key: 'electricity_price_mwh',  label: 'Électricité',     unit: '$/MWh',    min: 20,  max: 120,  step: 1,    fmt: v => `$${v}` },
  { key: 'exit_multiple',          label: 'Exit multiple',   unit: '×',        min: 8,   max: 30,   step: 0.5,  fmt: v => `${v}×` },
  { key: 'debt_pct',               label: 'Levier dette',    unit: '%',        min: 0,   max: 90,   step: 1,    fmt: v => `${v}%` },
];

const KNOB_SIZE = 64;
const KNOB_R = 28;
const START_ANGLE = -135;
const END_ANGLE = 135;

function Knob({ def, value, onChange }) {
  const pct = (value - def.min) / (def.max - def.min);
  const angle = START_ANGLE + pct * (END_ANGLE - START_ANGLE);
  const dragRef = useRef(null);

  function polarToXY(deg, r) {
    const rad = (deg - 90) * (Math.PI / 180);
    const cx = KNOB_SIZE / 2;
    return { x: cx + r * Math.cos(rad), y: cx + r * Math.sin(rad) };
  }

  function describeArc(from, to, r) {
    const s = polarToXY(from, r);
    const e = polarToXY(to, r);
    const large = (to - from + 360) % 360 > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  }

  function startDrag(e) {
    e.preventDefault();
    const startY = e.touches ? e.touches[0].clientY : e.clientY;
    const startVal = value;
    const range = def.max - def.min;

    function onMove(ev) {
      const clientY = ev.touches ? ev.touches[0].clientY : ev.clientY;
      const delta = (startY - clientY) / 120;
      const next = Math.min(def.max, Math.max(def.min,
        Math.round((startVal + delta * range) / def.step) * def.step
      ));
      onChange(next);
    }
    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onUp);
  }

  const tick = polarToXY(angle, 18);
  const cx = KNOB_SIZE / 2;

  return (
    <div style={SK.wrap}>
      <svg
        width={KNOB_SIZE} height={KNOB_SIZE}
        style={SK.svg}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        ref={dragRef}
      >
        {/* track arc */}
        <path d={describeArc(START_ANGLE, END_ANGLE, KNOB_R)} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" strokeLinecap="round" />
        {/* fill arc */}
        {pct > 0 && <path d={describeArc(START_ANGLE, angle, KNOB_R)} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="3" strokeLinecap="round" />}
        {/* knob body */}
        <circle cx={cx} cy={cx} r="20" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
        {/* indicator dot */}
        <circle cx={tick.x} cy={tick.y} r="2.5" fill="rgba(255,255,255,0.9)" />
      </svg>
      <div style={SK.label}>{def.label}</div>
      <div style={SK.val}>{def.fmt(value)}</div>
    </div>
  );
}

export default function HearstOverview() {
  const [scenarios, setScenarios] = useState([]);
  const [dataRoom, setDataRoom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { overrides, setOverrides } = useSimulation();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    try {
      const pRes = await fetch('/api/admin/hearst/project');
      if (!pRes.ok) throw new Error('Failed to load project');
      const pData = await pRes.json();
      const [sRes, drRes] = await Promise.all([
        fetch(`/api/admin/hearst/scenarios?project_id=${pData.project.id}`),
        fetch(`/api/admin/hearst/data-room?project_id=${pData.project.id}`),
      ]);
      const sc = (await sRes.json()).scenarios || [];
      setScenarios(sc);
      setDataRoom((await drRes.json()).items || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const base = scenarios.find(s => s.name?.toLowerCase().includes('base') || s.scenario_type === 'base') || scenarios[0];

  useEffect(() => {
    if (!base || overrides !== null) return;
    const seed = {};
    for (const sl of SLIDERS) seed[sl.key] = base[sl.key] ?? sl.min;
    setOverrides(seed);
  }, [base, overrides, setOverrides]);

  const deferredOverrides = useDeferredValue(overrides);

  const liveScenario = useMemo(() => {
    if (!base || !deferredOverrides) return base;
    return { ...base, ...deferredOverrides };
  }, [base, deferredOverrides]);

  const proj = useMemo(() => {
    if (!liveScenario) return {};
    return generateProjection(liveScenario);
  }, [liveScenario]);

  const isDirty = useMemo(() => {
    if (!base || !overrides) return false;
    return SLIDERS.some(sl => overrides[sl.key] !== (base[sl.key] ?? sl.min));
  }, [base, overrides]);

  async function saveOverrides() {
    if (!base || !overrides || !isDirty) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/hearst/scenarios/${base.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(overrides),
      });
      if (!res.ok) throw new Error('Save failed');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      await load();
    } catch {
      // silent — sliders still work
    } finally {
      setSaving(false);
    }
  }

  function resetOverrides() {
    if (!base) return;
    const seed = {};
    for (const sl of SLIDERS) seed[sl.key] = base[sl.key] ?? sl.min;
    setOverrides(seed);
  }

  if (loading) return <div style={S.loading}>Initializing HEARST module…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const drTotal = dataRoom.length;
  const drApproved = dataRoom.filter(d => d.status === 'approved' || d.status === 'reviewed').length;
  const sourceScore = base?.source_score ?? 0;
  const cta = pickContextualCta({ proj, sourceScore, drApproved, drTotal });
  const healthColor = sourceScore >= 70 ? 'var(--cp-accent)' : sourceScore >= 40 ? 'var(--cp-text-body)' : 'var(--cp-error)';

  return (
    <div style={S.wrap}>

      {/* Health pill */}
      <div style={S.healthRow}>
        <div style={S.healthPill}>
          <span style={S.healthLabel}>{base?.name || 'Project Health'}</span>
          <span style={S.healthSep}>·</span>
          <span style={{ ...S.healthStat, color: healthColor }}>{sourceScore}/100 sourced</span>
          <span style={S.healthSep}>·</span>
          <span style={S.healthStat}>{drApproved}/{drTotal} docs</span>
        </div>
        {isDirty && (
          <div style={S.dirtyBar}>
            <span style={S.dirtyLabel}>Simulation non sauvegardée</span>
            <button onClick={resetOverrides} style={S.resetBtn}>Annuler</button>
            <button onClick={saveOverrides} disabled={saving} style={S.saveBtn}>
              {saved ? '✓ Sauvegardé' : saving ? 'Sauvegarde…' : 'Sauvegarder'}
            </button>
          </div>
        )}
      </div>



      <div style={S.kpiCol}>
        <div style={S.heroGrid}>
          <KpiCard label="Project IRR" value={proj.irr} format="pct" highlight={proj.irr != null} />
          <KpiCard label="Project NPV" value={proj.npv} format="currency" />
          <KpiCard label="Stabilized EBITDA" value={proj.stabilized_ebitda} format="currency" sublabel="Annual" />
          <KpiCard label="MOIC" value={proj.moic} format="x" sublabel="Exit multiple of money" />
        </div>

        <div style={S.secondaryRow}>
          <Stat label="IT Capacity" value={liveScenario?.total_mw != null ? fmt(liveScenario.total_mw, 'mw') : '—'} />
          <Stat label="Total CAPEX" value={proj.total_capex != null ? fmt(proj.total_capex, 'currency') : '—'} />
          <Stat label="Stab. Revenue" value={proj.stabilized_revenue != null ? fmt(proj.stabilized_revenue, 'currency') : '—'} />
          <Stat label="DSCR (Stab.)" value={proj.dscr_stabilized != null ? fmt(proj.dscr_stabilized, 'x') : '—'} />
          <Stat label="Payback" value={proj.payback_years != null ? fmt(proj.payback_years, 'years') : '—'} />
          <Stat label="Terminal Value" value={proj.terminal_value != null ? fmt(proj.terminal_value, 'currency') : '—'} />
        </div>

        {scenarios.length > 1 && (
          <div style={S.scenarioStrip}>
            <div style={S.sectionTitle}>SCENARIO COMPARISON · IRR</div>
            <div style={S.scenarioRow}>
              {scenarios.map(s => {
                const irr = s.projection?.irr;
                const color = 'var(--cp-text-primary)';
                return (
                  <div key={s.id} style={{ ...S.scenarioChip, boxShadow: `inset 0 0 0 1px var(--cp-border)` }}>
                    <div style={{ ...S.scenarioName, color }}>{s.name}</div>
                    <div style={{ ...S.scenarioIrr, color }}>{irr != null ? fmt(irr, 'pct') : 'N/A'}</div>
                    <div style={S.scenarioScore}>Score {s.source_score ?? 0}/100</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={S.ctaWrap}>
          <div style={S.ctaCopy}>
            <div style={S.ctaEyebrow}>NEXT BEST ACTION</div>
            <div style={S.ctaTitle}>{cta.label}</div>
          </div>
          <Link href={cta.href} aria-label={`Aller : ${cta.label}`} style={S.ctaBtn}>
            Go →
          </Link>
        </div>
      </div>

      {overrides && (
        <div style={S.sliderPanel}>
          <div style={S.sliderTitle}>SIMULATION EN DIRECT</div>
          <div style={S.sliderGrid}>
            {SLIDERS.map(def => (
              <Knob
                key={def.key}
                def={def}
                value={overrides[def.key] ?? def.min}
                onChange={v => setOverrides(o => ({ ...o, [def.key]: v }))}
              />
            ))}
            {isDirty && (
              <div style={S.irrDelta}>
                <span style={S.irrDeltaLabel}>IRR live</span>
                <span style={{ ...S.irrDeltaVal, color: 'var(--cp-text-primary)' }}>
                  {proj.irr != null ? fmt(proj.irr, 'pct') : 'N/A'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={SStat.wrap}>
      <div style={SStat.label}>{label}</div>
      <div style={SStat.value}>{value}</div>
    </div>
  );
}

const SStat = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)', padding: 'var(--cp-space-1) var(--cp-space-4)' },
  label: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-text-muted)', textTransform: 'uppercase' },
  value: { fontSize: 'var(--cp-font-md)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-primary)' },
};

const SK = {
  wrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'ns-resize', userSelect: 'none' },
  svg: { cursor: 'ns-resize', display: 'block' },
  label: { fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
  val: { fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.90)', fontVariantNumeric: 'tabular-nums', textAlign: 'center' },
};

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-6)' },
  loading: { padding: 'var(--cp-space-9)', textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-md)' },
  error: { padding: 'var(--cp-space-6)', color: 'var(--cp-error)', fontSize: 'var(--cp-font-base)', background: 'var(--cp-error-bg)', borderRadius: 'var(--cp-radius-md)' },

  healthRow: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-4)', flexWrap: 'wrap' },
  healthPill: { display: 'inline-flex', alignItems: 'center', gap: 'var(--cp-space-2)', background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-pill)', padding: 'var(--cp-space-1) var(--cp-space-4)', fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-body)' },
  healthLabel: { color: 'var(--cp-text-primary)', fontWeight: 'var(--cp-weight-bold)' },
  healthSep: { color: 'var(--cp-text-faint)' },
  healthStat: { fontWeight: 'var(--cp-weight-semibold)' },

  dirtyBar: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', marginLeft: 'auto' },
  dirtyLabel: { fontSize: 11, color: 'var(--cp-text-muted)', fontStyle: 'italic' },
  resetBtn: { fontSize: 11, fontWeight: 600, padding: '4px 10px', border: '1px solid var(--cp-border)', borderRadius: 6, background: 'transparent', color: 'var(--cp-text-muted)', cursor: 'pointer' },
  saveBtn: { fontSize: 11, fontWeight: 700, padding: '4px 12px', border: 'none', borderRadius: 6, background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', cursor: 'pointer' },

  kpiCol: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-5)' },
  heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--cp-space-4)' },

  secondaryRow: { display: 'flex', alignItems: 'center', flexWrap: 'nowrap', overflowX: 'auto', background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-lg)', padding: 'var(--cp-space-3) var(--cp-space-2)' },

  scenarioStrip: { background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-lg)', padding: 'var(--cp-space-4) var(--cp-space-5)' },
  scenarioRow: { display: 'flex', gap: 'var(--cp-space-3)', marginTop: 'var(--cp-space-2)' },
  scenarioChip: { flex: 1, border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-md)', padding: 'var(--cp-space-2) var(--cp-space-3)', background: 'var(--cp-surface-1)' },
  scenarioName: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-wider)', textTransform: 'uppercase', marginBottom: 'var(--cp-space-1)' },
  scenarioIrr: { fontSize: 'var(--cp-font-xl)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-tight)', marginBottom: 'var(--cp-space-1)' },
  scenarioScore: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)' },
  sectionTitle: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-text-muted)', textTransform: 'uppercase' },

  ctaWrap: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--cp-space-4)', background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-lg)', padding: 'var(--cp-space-4) var(--cp-space-6)' },
  ctaCopy: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  ctaEyebrow: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-black)', letterSpacing: 'var(--cp-tracking-eyebrow)', color: 'var(--cp-text-muted)', textTransform: 'uppercase' },
  ctaTitle: { fontSize: 'var(--cp-font-md)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-strong)' },
  ctaBtn: { display: 'inline-flex', alignItems: 'center', gap: 'var(--cp-space-1)', fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-bold)', letterSpacing: 'var(--cp-tracking-wide)', padding: 'var(--cp-space-2) var(--cp-space-5)', borderRadius: 'var(--cp-radius-sm)', textDecoration: 'none' },

  sliderPanel: { background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', borderRadius: 'var(--cp-radius-lg)', padding: 'var(--cp-space-5) var(--cp-space-6)' },
  sliderTitle: { fontSize: 10, fontWeight: 800, letterSpacing: 2, color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginBottom: 'var(--cp-space-4)' },
  sliderGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 'var(--cp-space-6)' },

  irrDelta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--cp-border)', paddingTop: 'var(--cp-space-3)', marginTop: 'var(--cp-space-1)' },
  irrDeltaLabel: { fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--cp-text-muted)' },
  irrDeltaVal: { fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' },
};
