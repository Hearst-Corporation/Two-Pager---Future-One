'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import KpiCard from '@/components/hearst/KpiCard';
import AlertBanner from '@/components/hearst/AlertBanner';
import QuickStartWizard from '@/components/hearst/QuickStartWizard';
import { detectAlerts } from '@/lib/hearst-alerts';

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

export default function HearstOverview() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [dataRoom, setDataRoom] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wizardDismissed, setWizardDismissed] = useState(false);

  const load = useCallback(async () => {
    try {
      const pRes = await fetch('/api/admin/hearst/project');
      if (!pRes.ok) throw new Error('Failed to load project');
      const pData = await pRes.json();
      const proj = pData.project;
      setProject(proj);

      const [sRes, drRes] = await Promise.all([
        fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`),
        fetch(`/api/admin/hearst/data-room?project_id=${proj.id}`),
      ]);
      const sData = await sRes.json();
      const drData = await drRes.json();
      setScenarios(sData.scenarios || []);
      setDataRoom(drData.items || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div style={S.loading}>Initializing HEARST module…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const base = scenarios.find(s => s.name?.toLowerCase().includes('base') || s.scenario_type === 'base') || scenarios[0];
  const proj = base?.projection || {};
  const alerts = detectAlerts(base, project);

  const drTotal = dataRoom.length;
  const drApproved = dataRoom.filter(d => d.status === 'approved' || d.status === 'reviewed').length;
  const sourceScore = base?.source_score ?? 0;

  const showWizard = !wizardDismissed && base && !base.total_mw && (proj.irr == null);
  const cta = pickContextualCta({ proj, sourceScore, drApproved, drTotal });

  // Health pill color
  const healthColor = sourceScore >= 70 ? 'var(--color-success)' : sourceScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)';

  return (
    <>
    {showWizard && (
      <QuickStartWizard
        scenarioId={base.id}
        onDone={() => { setWizardDismissed(true); load(); }}
        onSkip={() => setWizardDismissed(true)}
      />
    )}
    <div style={S.wrap}>

      {/* Compact health pill — replaces the 4-item status bar */}
      <div style={S.healthRow}>
        <div style={S.healthPill}>
          <span style={S.healthLabel}>{base?.name || 'Project Health'}</span>
          <span style={S.healthSep}>·</span>
          <span style={{ ...S.healthStat, color: healthColor }}>{sourceScore}/100 sourced</span>
          <span style={S.healthSep}>·</span>
          <span style={S.healthStat}>{drApproved}/{drTotal} docs</span>
        </div>
      </div>

      {/* Smart Alerts — only the critical ones, max 3 */}
      {alerts.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <AlertBanner alerts={alerts.filter(a => a.severity === 'critical').slice(0, 3)} />
        </div>
      )}

      {/* Hero KPIs — 4 only */}
      <div style={S.heroGrid}>
        <KpiCard label="Project IRR" value={proj.irr} format="pct" highlight={proj.irr != null} />
        <KpiCard label="Project NPV" value={proj.npv} format="currency" />
        <KpiCard label="Stabilized EBITDA" value={proj.stabilized_ebitda} format="currency" note="Annual" />
        <KpiCard label="MOIC" value={proj.moic} format="x" note="Exit multiple of money" />
      </div>

      {/* Secondary stats — compact line, no card chrome */}
      <div style={S.secondaryRow}>
        <Stat label="IT Capacity" value={base?.total_mw != null ? fmt(base.total_mw, 'mw') : '—'} />
        <Stat label="Total CAPEX" value={proj.total_capex != null ? fmt(proj.total_capex, 'currency') : '—'} />
        <Stat label="Stab. Revenue" value={proj.stabilized_revenue != null ? fmt(proj.stabilized_revenue, 'currency') : '—'} />
        <Stat label="DSCR (Stab.)" value={proj.dscr_stabilized != null ? fmt(proj.dscr_stabilized, 'x') : '—'} />
        <Stat label="Payback" value={proj.payback_years != null ? fmt(proj.payback_years, 'years') : '—'} />
        <Stat label="Terminal Value" value={proj.terminal_value != null ? fmt(proj.terminal_value, 'currency') : '—'} />
      </div>

      {/* Scenario comparison strip */}
      {scenarios.length > 1 && (
        <div style={S.scenarioStrip}>
          <div style={S.sectionTitle}>SCENARIO COMPARISON · IRR</div>
          <div style={S.scenarioRow}>
            {scenarios.map(s => {
              const irr = s.projection?.irr;
              const color = s.name?.toLowerCase().includes('upside') ? 'var(--color-success)'
                : s.name?.toLowerCase().includes('down') ? 'var(--color-error)' : '#2563EB';
              return (
                <div key={s.id} style={{ ...S.scenarioChip, borderColor: color }}>
                  <div style={{ ...S.scenarioName, color }}>{s.name}</div>
                  <div style={{ ...S.scenarioIrr, color }}>{irr != null ? fmt(irr, 'pct') : 'N/A'}</div>
                  <div style={S.scenarioScore}>Score {s.source_score ?? 0}/100</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single contextual CTA — replaces the 13-card module grid + the 2 status-bar buttons */}
      <div style={S.ctaWrap}>
        <div style={S.ctaCopy}>
          <div style={S.ctaEyebrow}>NEXT BEST ACTION</div>
          <div style={S.ctaTitle}>{cta.label}</div>
        </div>
        <Link href={cta.href} style={{
          ...S.ctaBtn,
          background: cta.tone === 'critical' ? 'var(--color-error)' :
                      cta.tone === 'warning'  ? 'var(--color-warning)' :
                                                'var(--color-accent-strong)',
        }}>
          Go →
        </Link>
      </div>

      {/* Missing inputs warning — compact, only when present */}
      {proj.missing_inputs?.length > 0 && (
        <div style={S.missingWrap}>
          <div style={S.missingTitle}>MISSING INPUTS ({proj.missing_inputs.length})</div>
          <div style={S.missingList}>
            {proj.missing_inputs.map((m, i) => (
              <span key={i} style={S.missingTag}>{m}</span>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
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
  wrap: { display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 16px', borderRight: '1px solid var(--color-border-light)' },
  label: { fontSize: 9, fontWeight: 700, letterSpacing: 1.4, color: 'var(--color-text-muted)', textTransform: 'uppercase' },
  value: { fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' },
};

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--color-error)', fontSize: 13, background: 'var(--color-bg-secondary)', borderRadius: 6 },

  healthRow: { marginBottom: 18 },
  healthPill: {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 999,
    padding: '6px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
  },
  healthLabel: { color: 'var(--color-text-primary)', fontWeight: 700 },
  healthSep: { color: 'var(--color-border-medium)' },
  healthStat: { fontWeight: 600 },

  heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 },

  secondaryRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 8,
    padding: '8px 0',
    marginBottom: 24,
  },

  scenarioStrip: {
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 8, padding: '14px 18px', marginBottom: 20,
  },
  scenarioRow: { display: 'flex', gap: 12, marginTop: 10 },
  scenarioChip: {
    flex: 1, border: '2px solid', borderRadius: 8, padding: '10px 14px',
    background: 'var(--color-bg-main)',
  },
  scenarioName: { fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  scenarioIrr: { fontSize: 22, fontWeight: 900, marginBottom: 2 },
  scenarioScore: { fontSize: 10, color: 'var(--color-text-muted)' },
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--color-text-muted)', textTransform: 'uppercase' },

  ctaWrap: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 8,
    padding: '14px 20px',
    marginBottom: 20,
  },
  ctaCopy: { display: 'flex', flexDirection: 'column', gap: 2 },
  ctaEyebrow: { fontSize: 9, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-muted)', textTransform: 'uppercase' },
  ctaTitle: { fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' },
  ctaBtn: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    fontSize: 12, fontWeight: 700, letterSpacing: 0.4,
    color: 'var(--color-text-inverse)',
    padding: '9px 18px', borderRadius: 6,
    textDecoration: 'none',
    transition: 'filter .12s ease',
  },

  missingWrap: {
    background: 'var(--color-bg-secondary)',
    border: '1px solid var(--color-border-light)',
    borderLeft: '3px solid var(--color-error)',
    borderRadius: 6,
    padding: '12px 16px',
  },
  missingTitle: { fontSize: 10, fontWeight: 700, color: 'var(--color-error)', marginBottom: 8, letterSpacing: 1.5 },
  missingList: { display: 'flex', flexWrap: 'wrap', gap: 6 },
  missingTag: {
    fontSize: 11,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-medium)',
    color: 'var(--color-error)',
    padding: '2px 8px', borderRadius: 4,
  },
};
