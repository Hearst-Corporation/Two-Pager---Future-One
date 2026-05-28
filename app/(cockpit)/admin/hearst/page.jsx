'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ─── helpers ─────────────────────────────────────────────────
function fmtUsd(v) {
  if (v == null) return '—';
  if (Math.abs(v) >= 1e9) return '$' + (v / 1e9).toFixed(1) + 'B';
  if (Math.abs(v) >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
  return '$' + v.toLocaleString();
}
function fmtPct(v) {
  if (v == null) return '—';
  return (v * 100).toFixed(1) + '%';
}
function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const SEVERITY_COLOR = {
  P0: 'var(--ct-status-danger, var(--cp-error))',
  P1: 'var(--ct-status-warning)',
  P2: 'var(--cp-text-muted)',
};

const STAGE_ORDER = ['lead', 'qualified', 'loi', 'diligence', 'committed', 'closed', 'rejected'];

// ─── sub-panels ──────────────────────────────────────────────

function TodayPanel({ projectId }) {
  const [deals, setDeals] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [simResult, setSimResult] = useState(null);
  const [recentLog, setRecentLog] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/admin/hearst/deals?project_id=${projectId}`).then(r => r.json()),
      fetch('/api/admin/hearst/audit/inventory').then(r => r.json()),
      fetch(`/api/admin/hearst/audit?project_id=${projectId}&limit=6`).then(r => r.json()),
      fetch('/api/admin/hearst/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_mw: 50, geography: 'qatar' }),
      }).then(r => r.json()),
    ])
      .then(([d, inv, log, sim]) => {
        setDeals(d.deals || []);
        setInventory(inv);
        setRecentLog(log.entries || []);
        setSimResult(sim);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={S.panelLoading}>Loading…</div>;
  if (error) return <div style={S.panelError}>Error: {error}</div>;

  // deals by stage
  const stageCounts = {};
  (deals || []).forEach(d => {
    stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
  });

  const proj = simResult?.projection || {};
  const summary = inventory?.health_summary || {};
  const warnings = (inventory?.health_warnings || [])
    .filter(w => w.severity === 'P0' || w.severity === 'P1')
    .slice(0, 5);
  const allWarnings = inventory?.health_warnings || [];
  const confidence = inventory?.confidence_score ?? null;

  return (
    <div style={S.todayGrid}>
      {/* Card 1 — Deals */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>Deals en cours</span>
          <span style={S.cardBadge}>{(deals || []).length}</span>
        </div>
        {(deals || []).length === 0 ? (
          <div style={S.empty}>No deals yet.</div>
        ) : (
          <div style={S.stageList}>
            {STAGE_ORDER.filter(s => stageCounts[s]).map(stage => (
              <div key={stage} style={S.stageRow}>
                <span style={S.stageName}>{stage}</span>
                <span style={S.stageCount}>{stageCounts[stage]}</span>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/hearst/pipeline" style={S.cta}>Open Pipeline →</Link>
      </div>

      {/* Card 2 — Project health */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>Project health</span>
          {confidence != null && (
            <span style={{ ...S.cardBadge, background: confidence >= 70 ? 'var(--ct-status-success-soft, rgba(16,185,129,0.15))' : 'var(--ct-status-warning-soft, rgba(245,158,11,0.15))', color: confidence >= 70 ? 'var(--ct-status-success)' : 'var(--ct-status-warning)' }}>
              {confidence}/100
            </span>
          )}
        </div>
        <div style={S.kpiGrid}>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>Total CAPEX</div>
            <div style={S.kpiValue}>{fmtUsd(proj.total_capex)}</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>Stab. Revenue</div>
            <div style={S.kpiValue}>{fmtUsd(proj.stabilized_revenue)}</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>IRR</div>
            <div style={S.kpiValue}>{fmtPct(proj.irr)}</div>
          </div>
          <div style={S.kpi}>
            <div style={S.kpiLabel}>Confidence</div>
            <div style={S.kpiValue}>{confidence != null ? `${confidence}/100` : '—'}</div>
          </div>
        </div>
        <Link href="/admin/hearst/simulator" style={S.cta}>Open Simulator →</Link>
      </div>

      {/* Card 3 — Alerts */}
      <div style={S.card}>
        <div style={S.cardHeader}>
          <span style={S.cardTitle}>Alertes</span>
          <span style={{ ...S.cardBadge, background: allWarnings.filter(w => w.severity === 'P0').length > 0 ? 'var(--ct-status-danger-soft)' : undefined, color: allWarnings.filter(w => w.severity === 'P0').length > 0 ? 'var(--ct-status-danger)' : undefined }}>
            {allWarnings.filter(w => w.severity === 'P0' || w.severity === 'P1').length} P0/P1
          </span>
        </div>
        {warnings.length === 0 ? (
          <div style={S.empty}>No critical warnings.</div>
        ) : (
          <div style={S.alertList}>
            {warnings.map((w, i) => (
              <div key={i} style={S.alertRow}>
                <span style={{ ...S.severityDot, background: SEVERITY_COLOR[w.severity] || 'var(--cp-text-muted)' }} />
                <span style={S.alertMsg}>{w.message || w.field || 'Unknown warning'}</span>
              </div>
            ))}
          </div>
        )}
        <Link href="/admin/hearst/engine?tab=health" style={S.cta}>Open Engine →</Link>
      </div>

      {/* Recent activity */}
      <div style={S.activityBlock}>
        <div style={S.activityTitle}>Recent activity</div>
        {recentLog.length === 0 ? (
          <div style={S.empty}>No recent audit entries.</div>
        ) : (
          <div style={S.activityList}>
            {recentLog.map((entry, i) => (
              <div key={i} style={S.activityRow}>
                <span style={S.activityText}>
                  {entry.field_name
                    ? `${entry.field_name} updated`
                    : entry.action || 'Entry'}
                  {entry.table_name ? ` · ${entry.table_name}` : ''}
                </span>
                <span style={S.activityTime}>{timeAgo(entry.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const RELEVANCE_TONE = {
  5: { bg: 'var(--cp-accent-soft)', fg: 'var(--cp-accent)' },
  4: { bg: 'var(--cp-accent-soft)', fg: 'var(--cp-accent)' },
  3: { bg: 'var(--cp-surface-2)',   fg: 'var(--cp-text-body)' },
  2: { bg: 'var(--cp-surface-2)',   fg: 'var(--cp-text-muted)' },
  1: { bg: 'var(--cp-surface-2)',   fg: 'var(--cp-text-muted)' },
};

const CATEGORY_LABEL = {
  hardware:    'HW',
  energy:      'Energy',
  policy:      'Policy',
  market:      'Market',
  partnership: 'Partnership',
  other:       'Other',
};

function relTime(iso) {
  if (!iso) return '—';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 30 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

function MarketPanel() {
  const [signals, setSignals] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [minScore, setMinScore] = useState(3);

  const load = useCallback(async (score = minScore) => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch(`/api/admin/hearst/news?limit=50&min_score=${score}`);
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setSignals(data.signals || []);
      setSummary(data.summary || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [minScore]);

  useEffect(() => { load(); }, [load]);

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const r = await fetch('/api/admin/hearst/news/refresh', { method: 'POST' });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        if (r.status === 429) throw new Error(`Rate limited — retry in ${body.error || 'a few minutes'}.`);
        throw new Error(body.error || `HTTP ${r.status}`);
      }
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div style={S.marketWrap}>
      <header style={S.marketHead}>
        <div>
          <h2 style={S.marketTitle}>Market signals</h2>
          <div style={S.marketSub}>
            {summary?.total != null && `${summary.total} signaux`}
            {summary?.last_fetched_at && ` · dernier fetch ${relTime(summary.last_fetched_at)}`}
          </div>
        </div>
        <div style={S.marketActions}>
          <select
            value={minScore}
            onChange={e => setMinScore(Number(e.target.value))}
            style={S.marketSelect}
            aria-label="Pertinence minimale"
          >
            <option value={1}>All</option>
            <option value={3}>≥ 3</option>
            <option value={4}>≥ 4</option>
            <option value={5}>= 5 only</option>
          </select>
          <button
            type="button"
            onClick={refresh}
            disabled={refreshing}
            style={{ ...S.marketBtn, opacity: refreshing ? 0.6 : 1 }}
          >
            {refreshing ? 'Fetching…' : 'Refresh'}
          </button>
        </div>
      </header>

      {error && <div style={S.panelError}>{error}</div>}

      {loading ? (
        <div style={S.panelLoading}>Loading signals…</div>
      ) : signals.length === 0 ? (
        <div style={S.emptyPanel}>
          <p style={S.emptyBody}>Aucun signal stocké encore.</p>
          <p style={S.emptyMuted}>Clique « Refresh » pour fetcher DCD / NVIDIA / Tom&apos;s Hardware.</p>
        </div>
      ) : (
        <div style={S.signalList}>
          {signals.map(s => {
            const tone = RELEVANCE_TONE[s.relevance_score] || RELEVANCE_TONE[3];
            return (
              <article key={s.id} style={S.signalCard}>
                <header style={S.signalHead}>
                  <span style={{ ...S.signalScore, background: tone.bg, color: tone.fg }}>
                    {s.relevance_score}/5
                  </span>
                  <span style={S.signalSource}>{s.source_label || s.source}</span>
                  {s.category && <span style={S.signalCategory}>{CATEGORY_LABEL[s.category] || s.category}</span>}
                  {s.impacts_metric && <span style={S.signalImpact}>impacts: {s.impacts_metric}</span>}
                  <span style={S.signalTime}>{relTime(s.published_at || s.fetched_at)}</span>
                </header>
                <h3 style={S.signalTitle}>
                  {s.url
                    ? <a href={s.url} target="_blank" rel="noreferrer" style={S.signalLink}>{s.title}</a>
                    : s.title}
                </h3>
                {s.summary && <p style={S.signalSummary}>{s.summary}</p>}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivityPanel({ projectId }) {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!projectId) return;
    fetch(`/api/admin/hearst/audit?project_id=${projectId}&limit=50`)
      .then(r => r.json())
      .then(d => setEntries(d.entries || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [projectId]);

  if (loading) return <div style={S.panelLoading}>Loading activity…</div>;
  if (error) return <div style={S.panelError}>Error: {error}</div>;
  if (entries.length === 0) return <div style={S.empty}>No audit entries found.</div>;

  return (
    <div style={S.activityFullList}>
      {entries.map((entry, i) => (
        <div key={i} style={S.activityFullRow}>
          <div style={S.activityFullLeft}>
            <span style={S.activityFullField}>
              {entry.field_name ? `${entry.field_name} updated` : entry.action || 'Entry'}
            </span>
            {entry.table_name && <span style={S.activityFullTable}>{entry.table_name}</span>}
          </div>
          <span style={S.activityTime}>{timeAgo(entry.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────

const TABS = [
  { id: 'today',    label: 'Today' },
  { id: 'market',   label: 'Market' },
  { id: 'activity', label: 'Activity' },
];

export default function BriefPage() {
  const [tab, setTab] = useState('today');
  const [projectId, setProjectId] = useState(null);
  const [projectLoading, setProjectLoading] = useState(true);
  const [projectError, setProjectError] = useState(null);

  useEffect(() => {
    fetch('/api/admin/hearst/project')
      .then(r => r.json())
      .then(d => setProjectId(d.project?.id || null))
      .catch(e => setProjectError(e.message))
      .finally(() => setProjectLoading(false));
  }, []);

  if (projectLoading) return <div style={S.loading}>Initializing HEARST module…</div>;
  if (projectError) return <div style={S.error}>Error: {projectError}</div>;

  return (
    <div style={S.wrap}>
      <header style={S.header}>
        <div>
          <h1 style={S.title}>Brief</h1>
          <div style={S.subtitle}>Where the project stands today.</div>
        </div>
      </header>

      <div style={S.tabBar} role="tablist">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            style={{ ...S.tabBtn, ...(tab === t.id ? S.tabBtnActive : {}) }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'today'    && <TodayPanel projectId={projectId} />}
      {tab === 'market'   && <MarketPanel />}
      {tab === 'activity' && <ActivityPanel projectId={projectId} />}
    </div>
  );
}

// ─── styles ──────────────────────────────────────────────────
const S = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
    maxWidth: 1280,
    margin: '0 auto',
    padding: '32px 32px 96px',
  },

  // Market panel
  marketWrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  marketHead: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  marketTitle: { fontSize: 18, fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0 },
  marketSub: { fontSize: 12, color: 'var(--cp-text-muted)', marginTop: 4 },
  marketActions: { display: 'flex', gap: 8, alignItems: 'center' },
  marketSelect: {
    height: 32, padding: '0 10px',
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    borderRadius: 8, color: 'var(--cp-text-primary)', fontSize: 12,
  },
  marketBtn: {
    height: 32, padding: '0 16px',
    background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', border: 'none',
    borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', letterSpacing: 0.3,
  },
  signalList: { display: 'flex', flexDirection: 'column', gap: 8 },
  signalCard: {
    padding: 16,
    background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)',
    borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 6,
  },
  signalHead: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', fontSize: 11 },
  signalScore: { fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 999, letterSpacing: 0.5 },
  signalSource: { fontSize: 11, fontWeight: 700, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  signalCategory: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px',
    background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)',
    color: 'var(--cp-text-muted)', borderRadius: 999, letterSpacing: 0.5,
  },
  signalImpact: { fontSize: 10, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  signalTime: { fontSize: 11, color: 'var(--cp-text-muted)', marginLeft: 'auto' },
  signalTitle: { fontSize: 14, fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0, lineHeight: 1.4 },
  signalLink: { color: 'inherit', textDecoration: 'none' },
  signalSummary: { fontSize: 12, color: 'var(--cp-text-body)', lineHeight: 1.5, margin: 0 },

  loading: {
    padding: 48,
    textAlign: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 14,
  },
  error: {
    padding: '12px 16px',
    color: 'var(--cp-error)',
    background: 'var(--cp-error-bg)',
    borderRadius: 10,
    fontSize: 13,
    fontWeight: 600,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingBottom: 16,
    borderBottom: '1px solid var(--cp-border)',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: -0.4,
    color: 'var(--cp-text-primary)',
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--cp-text-muted)',
    marginTop: 4,
  },

  // tabs
  tabBar: {
    display: 'inline-flex',
    gap: 4,
    padding: 4,
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  tabBtn: {
    fontSize: 12,
    fontWeight: 700,
    height: 32,
    padding: '0 18px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: 'none',
    borderRadius: 999,
    cursor: 'pointer',
    letterSpacing: 0.3,
    transition: 'all 0.15s ease',
  },
  tabBtnActive: {
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
    color: 'var(--cp-text-strong)',
  },

  // today grid
  todayGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },

  // cards row
  card: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    letterSpacing: 0.2,
  },
  cardBadge: {
    fontSize: 11,
    fontWeight: 700,
    padding: '3px 10px',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    color: 'var(--cp-text-muted)',
  },

  // stage list
  stageList: { display: 'flex', flexDirection: 'column', gap: 6 },
  stageRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
    borderBottom: '1px solid var(--cp-border)',
  },
  stageName: {
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--cp-text-body)',
    textTransform: 'capitalize',
  },
  stageCount: {
    fontSize: 13,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
  },

  // kpi grid inside card
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
  },
  kpi: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    background: 'var(--cp-surface-1)',
    borderRadius: 8,
    padding: '10px 12px',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    fontVariantNumeric: 'tabular-nums',
  },

  // alerts
  alertList: { display: 'flex', flexDirection: 'column', gap: 8 },
  alertRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
  },
  severityDot: {
    flexShrink: 0,
    width: 8,
    height: 8,
    borderRadius: '50%',
    marginTop: 4,
  },
  alertMsg: {
    fontSize: 12,
    color: 'var(--cp-text-body)',
    lineHeight: '18px',
  },

  // cta link
  cta: {
    display: 'inline-block',
    marginTop: 'auto',
    fontSize: 12,
    fontWeight: 700,
    color: 'var(--cp-accent)',
    textDecoration: 'none',
    letterSpacing: 0.3,
  },

  // empty state
  empty: {
    fontSize: 12,
    color: 'var(--cp-text-faint)',
    fontStyle: 'italic',
  },

  // recent activity (below the 3 cards)
  activityBlock: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  activityTitle: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'var(--cp-text-muted)',
  },
  activityList: { display: 'flex', flexDirection: 'column', gap: 6 },
  activityRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  },
  activityText: { color: 'var(--cp-text-body)' },
  activityTime: { color: 'var(--cp-text-faint)', flexShrink: 0 },

  // market / empty panel
  emptyPanel: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    maxWidth: 560,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    margin: 0,
  },
  emptyBody: {
    fontSize: 13,
    color: 'var(--cp-text-body)',
    lineHeight: '20px',
    margin: 0,
  },
  emptyMuted: {
    fontSize: 12,
    color: 'var(--cp-text-faint)',
    margin: 0,
  },

  // panel level loading / error
  panelLoading: {
    padding: 32,
    textAlign: 'center',
    color: 'var(--cp-text-muted)',
    fontSize: 13,
  },
  panelError: {
    padding: '12px 16px',
    color: 'var(--cp-error)',
    background: 'var(--cp-error-bg)',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
  },

  // activity full panel
  activityFullList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 10,
    overflow: 'hidden',
  },
  activityFullRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    padding: '12px 20px',
    borderBottom: '1px solid var(--cp-border)',
    fontSize: 12,
  },
  activityFullLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  activityFullField: {
    color: 'var(--cp-text-body)',
    fontWeight: 500,
  },
  activityFullTable: {
    fontSize: 11,
    fontWeight: 600,
    padding: '2px 8px',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    color: 'var(--cp-text-muted)',
    letterSpacing: 0.3,
  },
};
