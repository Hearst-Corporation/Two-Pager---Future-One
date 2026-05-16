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

  // Health pill color — using cockpit semantic tokens
  const healthColor = sourceScore >= 70 ? 'var(--cp-success)' : sourceScore >= 40 ? 'var(--cp-warning)' : 'var(--cp-error)';

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

      {/* Compact health pill */}
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
        <div style={{ marginBottom: 'var(--cp-space-6)' }}>
          <AlertBanner alerts={alerts.filter(a => a.severity === 'critical').slice(0, 3)} />
        </div>
      )}

      {/* Hero KPIs — 4 only */}
      <div style={S.heroGrid}>
        <KpiCard label="Project IRR" value={proj.irr} format="pct" highlight={proj.irr != null} />
        <KpiCard label="Project NPV" value={proj.npv} format="currency" />
        <KpiCard label="Stabilized EBITDA" value={proj.stabilized_ebitda} format="currency" sublabel="Annual" />
        <KpiCard label="MOIC" value={proj.moic} format="x" sublabel="Exit multiple of money" />
      </div>

      {/* Secondary stats */}
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
              const color = s.name?.toLowerCase().includes('upside') ? 'var(--cp-success)'
                : s.name?.toLowerCase().includes('down') ? 'var(--cp-error)' : 'var(--cp-info)';
              return (
                <div key={s.id} style={{ ...S.scenarioChip, boxShadow: `inset 0 0 0 1px ${color}` }}>
                  <div style={{ ...S.scenarioName, color }}>{s.name}</div>
                  <div style={{ ...S.scenarioIrr, color }}>{irr != null ? fmt(irr, 'pct') : 'N/A'}</div>
                  <div style={S.scenarioScore}>Score {s.source_score ?? 0}/100</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Single contextual CTA */}
      <div style={S.ctaWrap}>
        <div style={S.ctaCopy}>
          <div style={S.ctaEyebrow}>NEXT BEST ACTION</div>
          <div style={S.ctaTitle}>{cta.label}</div>
        </div>
        <Link
          href={cta.href}
          aria-label={`Aller : ${cta.label}`}
          style={{
            ...S.ctaBtn,
            background: cta.tone === 'critical' ? 'var(--cp-error)' :
                        cta.tone === 'warning'  ? 'var(--cp-warning)' :
                                                  'var(--cp-accent)',
            color:      cta.tone === 'warning'  ? 'var(--cp-bg-deep)' :
                                                  'var(--cp-text-strong)',
          }}
        >
          Go →
        </Link>
      </div>

      {/* Missing inputs warning */}
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
    <div className="cp-stat" style={SStat.wrap}>
      <div style={SStat.label}>{label}</div>
      <div style={SStat.value}>{value}</div>
    </div>
  );
}

const SStat = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-1) var(--cp-space-4)',
  },
  label: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 'var(--cp-font-md)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-primary)',
  },
};

const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-6)',
  },
  loading: {
    padding: 'var(--cp-space-9)',
    textAlign: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 'var(--cp-font-md)',
  },
  error: {
    padding: 'var(--cp-space-6)',
    color: 'var(--cp-error)',
    fontSize: 'var(--cp-font-base)',
    background: 'var(--cp-error-bg)',
    borderRadius: 'var(--cp-radius-md)',
  },

  healthRow: { marginBottom: 0 },
  healthPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-pill)',
    padding: 'var(--cp-space-1) var(--cp-space-4)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-body)',
  },
  healthLabel: { color: 'var(--cp-text-primary)', fontWeight: 'var(--cp-weight-bold)' },
  healthSep: { color: 'var(--cp-text-faint)' },
  healthStat: { fontWeight: 'var(--cp-weight-semibold)' },

  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 'var(--cp-space-4)',
  },

  secondaryRow: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'nowrap',
    overflowX: 'auto',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
    padding: 'var(--cp-space-3) var(--cp-space-2)',
  },

  scenarioStrip: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
    padding: 'var(--cp-space-4) var(--cp-space-5)',
  },
  scenarioRow: { display: 'flex', gap: 'var(--cp-space-3)', marginTop: 'var(--cp-space-2)' },
  scenarioChip: {
    flex: 1,
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    background: 'var(--cp-surface-1)',
    transition: 'transform var(--cp-dur-base) var(--cp-ease-out)',
  },
  scenarioName: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    textTransform: 'uppercase',
    marginBottom: 'var(--cp-space-1)',
  },
  scenarioIrr: {
    fontSize: 'var(--cp-font-xl)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-tight)',
    marginBottom: 'var(--cp-space-1)',
  },
  scenarioScore: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)' },
  sectionTitle: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },

  ctaWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 'var(--cp-space-4)',
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-lg)',
    padding: 'var(--cp-space-4) var(--cp-space-6)',
  },
  ctaCopy: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  ctaEyebrow: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-black)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
  },
  ctaTitle: {
    fontSize: 'var(--cp-font-md)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-text-strong)',
  },
  ctaBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 'var(--cp-space-1)',
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wide)',
    padding: 'var(--cp-space-2) var(--cp-space-5)',
    borderRadius: 'var(--cp-radius-sm)',
    textDecoration: 'none',
    transition: 'filter var(--cp-dur-fast) var(--cp-ease)',
  },

  missingWrap: {
    background: 'var(--cp-error-bg)',
    borderLeft: '3px solid var(--cp-error)',
    borderRadius: 'var(--cp-radius-md)',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
  },
  missingTitle: {
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    color: 'var(--cp-error)',
    marginBottom: 'var(--cp-space-2)',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
  },
  missingList: { display: 'flex', flexWrap: 'wrap', gap: 'var(--cp-space-1)' },
  missingTag: {
    fontSize: 'var(--cp-font-xs)',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    color: 'var(--cp-error)',
    padding: 'var(--cp-space-0) var(--cp-space-2)',
    borderRadius: 'var(--cp-radius-xs)',
  },
};
