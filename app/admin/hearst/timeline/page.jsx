'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const PHASES = [
  { id: 'dev',          label: 'Development & Permitting', color: '#6B7280', months: 4 },
  { id: 'finance',      label: 'Financial Close',           color: '#2563EB', months: 3 },
  { id: 'construction', label: 'Construction',              color: '#D97706', months: 18 },
  { id: 'commissioning',label: 'Commissioning & Testing',   color: '#7C3AED', months: 2 },
  { id: 'operations',   label: 'Phase 1 Operations',        color: '#059669', months: 12 },
  { id: 'expansion',    label: 'Phase 2 Expansion',         color: '#0891B2', months: 12 },
];

const MILESTONES = [
  { month: 0,  label: 'Project Kickoff',          phase: 'dev' },
  { month: 4,  label: 'Permits Secured',           phase: 'dev' },
  { month: 7,  label: 'Financial Close',           phase: 'finance' },
  { month: 8,  label: 'Construction Start',        phase: 'construction' },
  { month: 26, label: 'Structural Completion',     phase: 'construction' },
  { month: 28, label: 'First COD (Phase 1)',       phase: 'commissioning' },
  { month: 40, label: 'Stabilized Occupancy',      phase: 'operations' },
  { month: 28, label: 'Phase 2 Design Start',      phase: 'expansion' },
  { month: 40, label: 'Phase 2 COD',              phase: 'expansion' },
];

const TOTAL_MONTHS = 51;
const MONTH_W = 18;

export default function TimelinePage() {
  const [project, setProject] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offsets, setOffsets] = useState({});

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios } = await sRes.json();
        const base = scenarios?.find(s => s.scenario_type === 'base' || s.name?.toLowerCase().includes('base')) || scenarios?.[0];
        setScenario(base);

        // Use construction_months from scenario to adjust phases
        if (base?.construction_months) {
          setOffsets({ construction: base.construction_months });
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <div style={S.loading}>Loading timeline…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const constructionMonths = offsets.construction || (scenario?.construction_months) || 18;
  const codOffset = scenario?.cod_offset_months ?? (4 + 3 + constructionMonths + 2);

  // Build dynamic phases based on scenario inputs
  const dynamicPhases = [
    { id: 'dev',          label: 'Development & Permitting', color: '#6B7280', start: 0, duration: 4 },
    { id: 'finance',      label: 'Financial Close',           color: '#2563EB', start: 4, duration: 3 },
    { id: 'construction', label: 'Construction',              color: '#D97706', start: 7, duration: constructionMonths },
    { id: 'commissioning',label: 'Commissioning & Testing',   color: '#7C3AED', start: 7 + constructionMonths, duration: 2 },
    { id: 'phase1_ops',   label: 'Phase 1 Operations',        color: '#059669', start: 7 + constructionMonths + 2, duration: 12 },
    { id: 'phase2',       label: 'Phase 2 Expansion',         color: '#0891B2', start: 7 + constructionMonths + 2, duration: 14 },
  ];

  const totalMonths = Math.max(...dynamicPhases.map(p => p.start + p.duration)) + 4;

  const startYear = scenario?.planned_cod
    ? new Date(scenario.planned_cod).getFullYear() - Math.ceil(codOffset / 12)
    : new Date().getFullYear();

  const MTHS = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  return (
    <div style={S.wrap}>
      <div style={S.topBar}>
        <div style={S.pageTitle}>Development Timeline</div>
        <div style={S.codInfo}>
          Planned COD: <strong>{scenario?.planned_cod || 'N/A — Set in Assumptions'}</strong>
          {' '}·{' '}Construction: <strong>{constructionMonths} months</strong>
        </div>
      </div>

      {!scenario?.planned_cod && (
        <div style={S.warning}>
          Set Planned COD and Construction Duration in the{' '}
          <Link href="/admin/hearst/assumptions" style={{ color: '#1D4ED8', fontWeight: 700, textDecoration: 'underline' }}>Assumptions tab →</Link>
          {' '}to generate an accurate timeline.
        </div>
      )}

      {/* Timeline chart */}
      <div style={S.chartWrap}>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: totalMonths * MONTH_W + 200 }}>

            {/* Month header */}
            <div style={{ display: 'flex', marginLeft: 200, marginBottom: 2 }}>
              {Array.from({ length: totalMonths }, (_, i) => (
                <div key={i} style={{ width: MONTH_W, flexShrink: 0, fontSize: 8, color: 'var(--color-text-muted)', textAlign: 'center', borderLeft: i % 12 === 0 ? '1px solid rgba(0,0,0,0.1)' : 'none' }}>
                  {i % 3 === 0 ? 'M' + (i + 1) : ''}
                </div>
              ))}
            </div>

            {/* Year markers */}
            <div style={{ display: 'flex', marginLeft: 200, marginBottom: 8 }}>
              {Array.from({ length: totalMonths }, (_, i) => (
                <div key={i} style={{ width: MONTH_W, flexShrink: 0, fontSize: 9, color: '#2563EB', textAlign: 'center', fontWeight: i % 12 === 0 ? 700 : 400 }}>
                  {i % 12 === 0 ? startYear + Math.floor(i / 12) : ''}
                </div>
              ))}
            </div>

            {/* Phase bars */}
            {dynamicPhases.map(phase => (
              <div key={phase.id} style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
                <div style={S.phaseLabel}>{phase.label}</div>
                <div style={{ position: 'relative', flex: 1, height: 28 }}>
                  <div style={{
                    position: 'absolute',
                    left: phase.start * MONTH_W,
                    width: phase.duration * MONTH_W,
                    height: '100%',
                    background: phase.color,
                    borderRadius: 4,
                    opacity: 0.85,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 8,
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                  }}>
                    <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      {phase.duration}mo
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {/* Milestone markers */}
            <div style={{ position: 'relative', height: 60, marginLeft: 200 }}>
              {MILESTONES.map((m, i) => {
                const month = m.month === 28 && m.phase === 'commissioning' ? 7 + constructionMonths : m.month;
                const x = month * MONTH_W;
                const phase = dynamicPhases.find(p => p.id === m.phase);
                const color = phase?.color || '#6B7280';
                return (
                  <div key={i} style={{ position: 'absolute', left: x, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: 2, height: 16, background: color }} />
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: -1 }} />
                    <div style={{ fontSize: 8, color, fontWeight: 700, whiteSpace: 'nowrap', marginTop: 2, transform: 'rotate(-35deg)', transformOrigin: 'top left', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Phase legend */}
      <div style={S.legend}>
        {dynamicPhases.map(p => (
          <div key={p.id} style={S.legendItem}>
            <div style={{ width: 12, height: 12, borderRadius: 2, background: p.color, flexShrink: 0 }} />
            <span style={S.legendLabel}>{p.label}</span>
            <span style={S.legendDur}>{p.duration}mo</span>
          </div>
        ))}
      </div>

      {/* Critical path summary */}
      <div style={S.criticalPath}>
        <div style={S.sectionTitle}>CRITICAL PATH TO COD</div>
        <div style={S.cpRow}>
          <div style={S.cpStep}><span style={S.cpNum}>1</span><span>Development & Permitting (4 mo)</span></div>
          <div style={S.cpArrow}>→</div>
          <div style={S.cpStep}><span style={S.cpNum}>2</span><span>Financial Close (3 mo)</span></div>
          <div style={S.cpArrow}>→</div>
          <div style={S.cpStep}><span style={S.cpNum}>3</span><span>Construction ({constructionMonths} mo)</span></div>
          <div style={S.cpArrow}>→</div>
          <div style={S.cpStep}><span style={S.cpNum}>4</span><span>Commissioning (2 mo)</span></div>
          <div style={S.cpArrow}>→</div>
          <div style={{ ...S.cpStep, background: '#D1FAE5', color: '#059669', fontWeight: 800 }}>COD</div>
        </div>
      </div>
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
  error: { padding: 24, color: '#DC2626', fontSize: 13, background: '#FEF2F2', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' },
  codInfo: { fontSize: 12, color: 'var(--color-text-muted)' },
  warning: { fontSize: 12, color: '#92400E', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, padding: '8px 14px', marginBottom: 20 },
  chartWrap: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: '20px 16px 12px', marginBottom: 20, overflowX: 'auto' },
  phaseLabel: { width: 200, flexShrink: 0, fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', paddingRight: 12, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  legend: { display: 'flex', flexWrap: 'wrap', gap: '8px 20px', marginBottom: 20, background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: '12px 16px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6 },
  legendLabel: { fontSize: 11, color: 'var(--color-text-muted)' },
  legendDur: { fontSize: 10, color: 'var(--color-text-muted)', background: 'var(--color-bg-main)', padding: '1px 6px', borderRadius: 10 },
  criticalPath: { background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: 8, padding: '16px 20px' },
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--color-text-muted)', marginBottom: 12 },
  cpRow: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cpStep: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, background: 'var(--color-bg-main)', padding: '6px 12px', borderRadius: 20, color: 'var(--color-text-muted)' },
  cpNum: { width: 18, height: 18, borderRadius: '50%', background: '#2563EB', color: '#fff', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  cpArrow: { color: 'var(--color-text-muted)', fontWeight: 700 },
};
