'use client';
import { useState, useEffect } from 'react';
import AlertBanner from '@/components/hearst/AlertBanner';
import { detectAlerts } from '@/lib/hearst-alerts';

const RISK_CATEGORIES = [
  {
    id: 'market',
    label: 'Market Risk',
    color: 'var(--cp-info)',
    risks: [
      { id: 'demand_risk', label: 'Data Center Demand', desc: 'Qatar market adoption slower than projected' },
      { id: 'pricing_risk', label: 'Colocation Pricing', desc: 'Competitive pricing pressure from regional operators' },
      { id: 'occupancy_risk', label: 'Occupancy Ramp-up', desc: 'Longer-than-expected ramp to stabilized occupancy' },
    ],
  },
  {
    id: 'construction',
    label: 'Construction Risk',
    color: 'var(--cp-warning)',
    risks: [
      { id: 'cost_overrun', label: 'CAPEX Cost Overrun', desc: 'Construction costs exceed budget due to supply chain or labor' },
      { id: 'delay_risk', label: 'Construction Delay', desc: 'COD delayed beyond planned date' },
      { id: 'contractor_risk', label: 'EPC Contractor', desc: 'Contractor performance or solvency risk' },
    ],
  },
  {
    id: 'power',
    label: 'Power & Infrastructure Risk',
    color: 'var(--cp-violet)',
    risks: [
      { id: 'grid_risk', label: 'Grid Connection Delay', desc: 'Substation or grid connection delayed by utility' },
      { id: 'tariff_risk', label: 'Electricity Tariff Increase', desc: 'Qatar electricity tariff increase above base case' },
      { id: 'power_supply', label: 'Power Supply Reliability', desc: 'Grid stability and reliability for SLA commitments' },
    ],
  },
  {
    id: 'regulatory',
    label: 'Regulatory & Political Risk',
    color: 'var(--cp-success)',
    risks: [
      { id: 'regulatory', label: 'Regulatory / Permitting', desc: 'Changes in Qatar data center or foreign ownership regulations' },
      { id: 'geopolitical', label: 'Geopolitical', desc: 'Regional geopolitical instability impacting operations' },
      { id: 'data_sovereignty', label: 'Data Sovereignty', desc: 'Customer data localization requirements' },
    ],
  },
  {
    id: 'financial',
    label: 'Financial Risk',
    color: 'var(--cp-error)',
    risks: [
      { id: 'financing_risk', label: 'Debt Financing', desc: 'Inability to secure project finance at assumed rates' },
      { id: 'fx_risk', label: 'FX Risk', desc: 'USD/QAR exchange rate risk (Qatar maintains peg — low)' },
      { id: 'interest_risk', label: 'Interest Rate Risk', desc: 'Rising interest rates increasing debt service' },
    ],
  },
];

const SEVERITY = {
  1: { label: 'Very Low',  color: 'var(--cp-text-muted)' },
  2: { label: 'Low',       color: 'var(--cp-success)' },
  3: { label: 'Medium',    color: 'var(--cp-warning)' },
  4: { label: 'High',      color: 'var(--cp-error)' },
  5: { label: 'Critical',  color: 'var(--cp-violet)' },
};

function RiskRating({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          style={{
            width: 22, height: 22, borderRadius: 3, fontSize: 10, fontWeight: 700,
            border: '1px solid',
            background: value >= n ? SEVERITY[n]?.color : 'transparent',
            color: value >= n ? '#fff' : SEVERITY[n]?.color,
            borderColor: SEVERITY[n]?.color,
            cursor: 'pointer',
          }}
        >
          {n}
        </button>
      ))}
      {value > 0 && <span style={{ fontSize: 10, color: SEVERITY[value]?.color, marginLeft: 4 }}>{SEVERITY[value]?.label}</span>}
    </div>
  );
}

export default function RisksPage() {
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [riskRatings, setRiskRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await fetch('/api/admin/hearst/project');
        if (!pRes.ok) throw new Error('Failed to load');
        const { project: proj } = await pRes.json();
        setProject(proj);
        const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);

        // Load saved risk ratings from project meta
        if (proj.risk_ratings) setRiskRatings(proj.risk_ratings);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function persistRatings(updated) {
    const previous = riskRatings;
    setRiskRatings(updated); // optimistic
    try {
      const res = await fetch('/api/admin/hearst/project', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ risk_ratings: updated }),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
    } catch (e) {
      setRiskRatings(previous); // revert
      setError(`Risk rating save failed: ${e.message}`);
      setTimeout(() => setError(null), 4000);
    }
  }

  async function setRating(riskId, severity) {
    await persistRatings({ ...riskRatings, [riskId]: { ...riskRatings[riskId], severity } });
  }

  async function setLikelihood(riskId, likelihood) {
    await persistRatings({ ...riskRatings, [riskId]: { ...riskRatings[riskId], likelihood } });
  }

  if (loading) return <div style={S.loading}>Loading risk dashboard…</div>;
  if (error) return <div style={S.error}>Error: {error}</div>;

  const base = scenarios.find(s => s.scenario_type === 'base' || s.name?.toLowerCase().includes('base')) || scenarios[0];
  const smartAlerts = detectAlerts(base, project);

  const allRisks = RISK_CATEGORIES.flatMap(c => c.risks.map(r => ({ ...r, category: c.label, color: c.color })));
  const rated = allRisks.filter(r => riskRatings[r.id]?.severity);
  const avgSeverity = rated.length ? (rated.reduce((s, r) => s + riskRatings[r.id].severity, 0) / rated.length).toFixed(1) : null;
  const critical = rated.filter(r => riskRatings[r.id].severity >= 4).length;

  return (
    <div style={S.wrap}>
      <div style={S.topBar}>
        <div style={S.pageTitle}>Risk Dashboard</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {avgSeverity && (
            <div style={S.riskScore}>
              <span style={S.riskScoreLabel}>AVG RISK SCORE</span>
              <span style={{ ...S.riskScoreVal, color: avgSeverity >= 3.5 ? 'var(--cp-error)' : avgSeverity >= 2.5 ? 'var(--cp-warning)' : 'var(--cp-success)' }}>{avgSeverity}/5</span>
            </div>
          )}
          {critical > 0 && (
            <div style={S.criticalBadge}>{critical} Critical Risk{critical > 1 ? 's' : ''}</div>
          )}
        </div>
      </div>

      {/* Smart alerts */}
      <div style={{ marginBottom: 24 }}>
        <div style={S.sectionTitle}>SMART ALERTS</div>
        {smartAlerts.length === 0 ? (
          <div style={S.noAlerts}>No sourcing gaps detected for the active scenario.</div>
        ) : (
          <AlertBanner alerts={smartAlerts} />
        )}
      </div>

      {/* Risk matrix */}
      {RISK_CATEGORIES.map(cat => (
        <div key={cat.id} style={S.catCard}>
          <div style={{ ...S.catHeader, borderLeftColor: cat.color }}>
            <span style={{ ...S.catName, color: cat.color }}>{cat.label}</span>
            <span style={S.catCount}>
              {cat.risks.filter(r => riskRatings[r.id]?.severity).length}/{cat.risks.length} rated
            </span>
          </div>
          {cat.risks.map(risk => {
            const rating = riskRatings[risk.id] || {};
            const score = (rating.severity || 0) * (rating.likelihood || 0);
            return (
              <div key={risk.id} style={S.riskRow}>
                <div style={S.riskLeft}>
                  <div style={S.riskLabel}>{risk.label}</div>
                  <div style={S.riskDesc}>{risk.desc}</div>
                </div>
                <div style={S.riskRight}>
                  <div style={S.ratingGroup}>
                    <span style={S.ratingLabel}>SEVERITY</span>
                    <RiskRating value={rating.severity || 0} onChange={v => setRating(risk.id, v)} />
                  </div>
                  <div style={S.ratingGroup}>
                    <span style={S.ratingLabel}>LIKELIHOOD</span>
                    <RiskRating value={rating.likelihood || 0} onChange={v => setLikelihood(risk.id, v)} />
                  </div>
                  {score > 0 && (
                    <div style={{ ...S.riskScore2, background: score >= 15 ? 'var(--cp-error-bg)' : score >= 8 ? 'var(--cp-warning-bg)' : 'var(--cp-success-bg)', color: score >= 15 ? 'var(--cp-error)' : score >= 8 ? 'var(--cp-warning)' : 'var(--cp-success)' }}>
                      Score {score}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const S = {
  wrap: { fontFamily: '"Inter", sans-serif' },
  loading: { padding: 48, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 14 },
  error: { padding: 24, color: 'var(--cp-error)', fontSize: 13, background: 'var(--cp-error-bg)', borderRadius: 6 },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  pageTitle: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)' },
  riskScore: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  riskScoreLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)' },
  riskScoreVal: { fontSize: 22, fontWeight: 900 },
  criticalBadge: { fontSize: 11, fontWeight: 700, padding: '5px 12px', background: 'var(--cp-error-bg)', color: 'var(--cp-error)', borderRadius: 6, border: '1px solid var(--cp-error)' },
  sectionTitle: { fontSize: 10, fontWeight: 700, letterSpacing: 2, color: 'var(--cp-text-muted)', marginBottom: 8 },
  noAlerts: { fontSize: 12, color: 'var(--cp-success)', background: 'var(--cp-success-bg)', border: '1px solid var(--cp-success-bg)', borderRadius: 6, padding: '8px 14px' },
  catCard: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 8, marginBottom: 16, overflow: 'hidden' },
  catHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderLeft: '4px solid', background: 'var(--cp-bg-deep)', borderBottom: '1px solid var(--cp-border)' },
  catName: { fontSize: 12, fontWeight: 700, letterSpacing: 0.5 },
  catCount: { fontSize: 10, color: 'var(--cp-text-muted)' },
  riskRow: { display: 'flex', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--cp-border)' },
  riskLeft: { flex: 1 },
  riskLabel: { fontSize: 13, fontWeight: 600, color: 'var(--cp-text-primary)' },
  riskDesc: { fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2 },
  riskRight: { display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 },
  ratingGroup: { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 },
  ratingLabel: { fontSize: 9, fontWeight: 700, letterSpacing: 1.5, color: 'var(--cp-text-muted)' },
  riskScore2: { fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20 },
};
