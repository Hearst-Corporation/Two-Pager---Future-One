'use client';

// /admin/hearst/dossier — Project Dossier (Critical Deliverables P8).
//
// Modes:
//   ?memo=<id>      → fetch single memo, render inline with full sections 01-11
//   ?scenario=<id>  → list all memos for that scenario, click to open one
//   (no params)     → list all memos, each row clicks to ?memo=<id>

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(s) { try { return new Date(s).toLocaleString(); } catch { return s; } }
function fmtDateShort(s) { try { return new Date(s).toLocaleDateString(); } catch { return s; } }

// ─── Sub-components ──────────────────────────────────────────────────────────

function ConfidenceTag({ level }) {
  const lvl = (level || 'MEDIUM').toUpperCase();
  const MAP = {
    HIGH:   { bg: 'var(--ct-status-success-soft)',  color: 'var(--ct-status-success)',  border: 'var(--ct-status-success-border)' },
    MEDIUM: { bg: 'var(--ct-status-warning-soft)',  color: 'var(--ct-status-warning)',  border: 'var(--ct-status-warning-border)' },
    MED:    { bg: 'var(--ct-status-warning-soft)',  color: 'var(--ct-status-warning)',  border: 'var(--ct-status-warning-border)' },
    LOW:    { bg: 'var(--ct-status-danger-soft)',   color: 'var(--ct-status-danger)',   border: 'var(--ct-status-danger-border)' },
  };
  const tone = MAP[lvl] || MAP.MEDIUM;
  const label = lvl === 'HIGH' ? 'HIGH' : lvl === 'LOW' ? 'LOW VIS' : 'MED';
  return (
    <span style={{ ...S.tag, background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
      {label}
    </span>
  );
}

function AccordionSection({ id, label, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={S.accordionSection} aria-labelledby={`ds-${id}`}>
      <button
        type="button"
        id={`ds-${id}`}
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={S.accordionBtn}
      >
        <span style={S.accordionLabel}>{label}</span>
        <span style={S.accordionChevron}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={S.accordionBody}>{children}</div>}
    </section>
  );
}

// ─── Full Memo Renderer (inline, no modal) ────────────────────────────────────

function MemoViewer({ memo, scenario, versions, onVersionSelect }) {
  const SEVERITY_TONE = {
    HIGH:   { color: 'var(--ct-status-danger)' },
    MED:    { color: 'var(--ct-status-warning)' },
    MEDIUM: { color: 'var(--ct-status-warning)' },
    LOW:    { color: 'var(--ct-status-success)' },
  };

  const m = memo.memo_json || {};
  const meta = memo.meta_json || {};

  return (
    <div style={S.memoViewer}>
      {/* ── Memo header ─────────────────────────────────────── */}
      <div style={S.memoHeader}>
        <div style={S.memoHeaderLeft}>
          <h2 style={S.memoTitle}>{memo.title}</h2>
          <div style={S.memoMeta}>
            {memo.provider_used && <span style={S.metaChip}>{memo.provider_used}</span>}
            {memo.confidence_level && <ConfidenceTag level={memo.confidence_level} />}
            {memo.region && <span style={S.metaChip}>{memo.region}</span>}
            {memo.stakeholder && <span style={S.metaChip}>{memo.stakeholder}</span>}
            {memo.audience && <span style={S.metaChip}>{memo.audience}</span>}
            <span style={S.metaChipMuted}>{fmtDate(memo.created_at)}</span>
            {memo.data_as_of && <span style={S.metaChipMuted}>data as of {memo.data_as_of}</span>}
          </div>
          {scenario && (
            <div style={S.scenarioLink}>
              Scenario ·{' '}
              <Link href={`/admin/hearst/dossier?scenario=${scenario.id}`} style={S.link}>
                {scenario.name || scenario.title || scenario.id.slice(0, 8) + '…'}
              </Link>
            </div>
          )}
        </div>
        <div style={S.memoHeaderRight}>
          <a
            style={S.pdfBtn}
            href={`/api/admin/hearst/strategic-memos/${memo.id}/pdf`}
            target="_blank"
            rel="noreferrer"
          >
            PDF ↓
          </a>
          {memo.scenario_id && (
            <Link
              href={`/admin/hearst/dossier?scenario=${memo.scenario_id}`}
              style={S.compareBtn}
            >
              Compare versions
            </Link>
          )}
        </div>
      </div>

      {/* ── Version selector ────────────────────────────────── */}
      {versions && versions.length > 1 && (
        <div style={S.versionBar}>
          <span style={S.versionBarLabel}>Versions ·</span>
          {versions.map(v => (
            <button
              key={v.id}
              type="button"
              onClick={() => onVersionSelect(v.id)}
              style={{
                ...S.versionChip,
                ...(v.id === memo.id ? S.versionChipActive : {}),
              }}
            >
              v{v.version}
              {v.status && <span style={S.versionStatus}> · {v.status}</span>}
            </button>
          ))}
        </div>
      )}

      {/* ── Stats strip ─────────────────────────────────────── */}
      <div style={S.statsStrip}>
        <div style={S.statBox}><div style={S.statN}>v{memo.version}</div><div style={S.statL}>Version</div></div>
        <div style={S.statBox}><div style={S.statN}>{memo.status}</div><div style={S.statL}>Status</div></div>
        <div style={S.statBox}>
          <div style={S.statN}>{memo.confidence_level || '—'}</div>
          <div style={S.statL}>Confidence</div>
        </div>
        {memo.generation_time_ms && (
          <div style={S.statBox}>
            <div style={S.statN}>{(memo.generation_time_ms / 1000).toFixed(1)}s</div>
            <div style={S.statL}>Gen time</div>
          </div>
        )}
        {meta?.intelligence_brief?.datapoints_count != null && (
          <div style={S.statBox}>
            <div style={S.statN}>{meta.intelligence_brief.datapoints_count}</div>
            <div style={S.statL}>Sources</div>
          </div>
        )}
      </div>

      {/* ── Memo content ────────────────────────────────────── */}
      <div style={S.memoContent}>

        {/* 01 — Executive Summary (expanded by default) */}
        {m.executive_summary && (
          <AccordionSection id="exec" label="01 · Executive Summary" defaultOpen>
            {m.executive_summary.headline && (
              <p style={S.headline}>{m.executive_summary.headline}</p>
            )}
            <div style={S.confRow}>
              <ConfidenceTag level={m.executive_summary.overall_confidence} />
            </div>
            <ul style={S.bullets}>
              {(m.executive_summary.bullets || []).map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </AccordionSection>
        )}

        {/* Confidence block — always show if present */}
        {m.confidence_block && (
          <div style={S.confBlock}>
            <div style={S.confBlockHead}>
              <span style={S.confBlockLabel}>Confidence</span>
              <ConfidenceTag level={m.confidence_block.confidence_level} />
              {m.confidence_block.source_density && (
                <span style={S.confDensity}>{m.confidence_block.source_density}</span>
              )}
            </div>
            {m.confidence_block.estimation_quality && (
              <p style={S.confEst}>{m.confidence_block.estimation_quality}</p>
            )}
            {m.confidence_block.known_unknowns?.length > 0 && (
              <div style={S.unknownsWrap}>
                <div style={S.unknownsLabel}>Known unknowns</div>
                <ul style={S.bullets}>
                  {m.confidence_block.known_unknowns.map((u, i) => <li key={i}>{u}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 02 — Strategic Context */}
        {m.strategic_context && !m.strategic_context.skip && (
          <AccordionSection id="ctx" label="02 · Strategic Context">
            <p style={S.narrative}>{m.strategic_context.body}</p>
          </AccordionSection>
        )}

        {/* 03 — Key Financial Metrics */}
        {m.key_financial_metrics && (
          <AccordionSection id="fin" label="03 · Key Financial Metrics">
            <table style={S.table}>
              <thead>
                <tr>
                  {['Metric', 'Value', 'Conf.', 'Source'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(m.key_financial_metrics.metrics || []).map((row, i) => (
                  <tr key={i}>
                    <td style={S.td}>{row.label}</td>
                    <td style={S.td}><strong>{row.value}</strong>{row.unit && <span style={S.unit}> {row.unit}</span>}</td>
                    <td style={S.td}><ConfidenceTag level={row.confidence} /></td>
                    <td style={{ ...S.td, color: 'var(--cp-text-muted)', fontSize: 11 }}>{row.source || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {m.key_financial_metrics.narrative && (
              <p style={S.narrative}>{m.key_financial_metrics.narrative}</p>
            )}
          </AccordionSection>
        )}

        {/* 04 — Infrastructure Analysis */}
        {m.infrastructure_analysis && (
          <AccordionSection id="infra" label="04 · Infrastructure Analysis">
            {m.infrastructure_analysis.body && (
              <p style={S.narrative}>{m.infrastructure_analysis.body}</p>
            )}
            {m.infrastructure_analysis.tradeoffs?.length > 0 && (
              <>
                <div style={S.sublabel}>Trade-offs</div>
                <ul style={S.bullets}>
                  {m.infrastructure_analysis.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </>
            )}
          </AccordionSection>
        )}

        {/* 05 — Market Benchmarking */}
        {m.market_benchmarking && (
          <AccordionSection id="bench" label="05 · Market Benchmarking">
            <ul style={S.compList}>
              {(m.market_benchmarking.comparables || []).map((c, i) => (
                <li key={i}>
                  <strong>{c.name}</strong> — {c.metric} : <strong>{c.value}</strong>
                  {c.source && <span style={S.cite}> ({c.source})</span>}
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}

        {/* 06 — Risks & Constraints */}
        {m.risks_constraints && (
          <AccordionSection id="risks" label="06 · Risks & Constraints">
            <ul style={S.riskList}>
              {(m.risks_constraints.items || []).map((r, i) => {
                const sev = (r.severity || 'MED').toUpperCase();
                const tone = SEVERITY_TONE[sev] || SEVERITY_TONE.MED;
                return (
                  <li key={i} style={{ ...S.riskItem, borderLeftColor: tone.color }}>
                    <div><strong>{r.label}</strong> <span style={S.catLabel}>· {r.category}</span></div>
                    {r.mitigation && <div style={S.mit}>Mitigation : {r.mitigation}</div>}
                    {r.dependency && <div style={S.dep}>Dependency : {r.dependency}</div>}
                  </li>
                );
              })}
            </ul>
          </AccordionSection>
        )}

        {/* 07 — Strategic Opportunities */}
        {m.strategic_opportunities && (
          <AccordionSection id="opp" label="07 · Strategic Opportunities">
            <ul style={S.oppList}>
              {(m.strategic_opportunities.items || []).map((o, i) => (
                <li key={i} style={S.oppItem}>
                  <div style={S.oppHead}>
                    <strong>{o.label}</strong>
                    {o.confidence && <ConfidenceTag level={o.confidence} />}
                  </div>
                  {o.execution_path && <div style={S.mit}>Execution : {o.execution_path}</div>}
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}

        {/* 08 — Recommended Architecture */}
        {m.recommended_architecture && (
          <AccordionSection id="arch" label="08 · Recommended Architecture">
            {Object.keys(m.recommended_architecture.config || {}).length > 0 && (
              <table style={S.configTable}>
                <tbody>
                  {Object.entries(m.recommended_architecture.config).map(([k, v]) => (
                    <tr key={k}>
                      <td style={S.configKey}>{k}</td>
                      <td style={S.configVal}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {m.recommended_architecture.rationale && (
              <p style={S.narrative}>{m.recommended_architecture.rationale}</p>
            )}
          </AccordionSection>
        )}

        {/* 09 — Commercialization Strategy */}
        {m.commercialization_strategy && (
          <AccordionSection id="comm" label="09 · Commercialization Strategy">
            <table style={S.configTable}>
              <tbody>
                {[
                  ['Pricing', m.commercialization_strategy.pricing],
                  ['Contract structure', m.commercialization_strategy.contract_structure],
                  ['Anchor tenant', m.commercialization_strategy.anchor_tenant],
                  ['Ramp profile', m.commercialization_strategy.ramp_profile],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <tr key={k}><td style={S.configKey}>{k}</td><td style={S.configVal}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </AccordionSection>
        )}

        {/* 10 — Deployment Roadmap */}
        {m.deployment_roadmap && (
          <AccordionSection id="roadmap" label="10 · Deployment Roadmap">
            <ol style={S.phaseList}>
              {(m.deployment_roadmap.phases || []).map((p, i) => (
                <li key={i}>
                  <strong>{p.label}</strong>
                  {p.months_from_t0 != null && (
                    <span style={S.phaseTime}> +{p.months_from_t0} mo</span>
                  )}
                  {p.gating_events?.length > 0 && (
                    <ul style={S.gating}>
                      {p.gating_events.map((g, j) => <li key={j}>{g}</li>)}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
            {m.deployment_roadmap.reality_check_flags?.length > 0 && (
              <div style={S.realityFlags}>
                <div style={S.realityFlagsLabel}>Reality-check flags</div>
                {m.deployment_roadmap.reality_check_flags.map((f, i) => (
                  <div key={i} style={S.realityFlag}>⚠ {f}</div>
                ))}
              </div>
            )}
          </AccordionSection>
        )}

        {/* 11 — Long-Term Strategic Value */}
        {m.long_term_strategic_value && (
          <AccordionSection id="lt" label="11 · Long-Term Strategic Value">
            {m.long_term_strategic_value.ten_year_arc && (
              <p style={S.narrative}>{m.long_term_strategic_value.ten_year_arc}</p>
            )}
            {m.long_term_strategic_value.speculative_branches?.length > 0 && (
              <>
                <div style={S.sublabel}>Speculative branches <ConfidenceTag level="LOW" /></div>
                <ul style={S.bullets}>
                  {m.long_term_strategic_value.speculative_branches.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </>
            )}
          </AccordionSection>
        )}

        {/* Decision Tensions */}
        {m.decision_tensions?.length > 0 && (
          <AccordionSection id="tensions" label="Decision tensions">
            <ul style={S.tensionList}>
              {m.decision_tensions.map((t, i) => (
                <li key={i} style={S.tensionItem}>
                  <div style={S.tensionId}>{t.id}</div>
                  <div style={S.tensionVerdict}>{t.verdict}</div>
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}

        {/* Intelligence Sources */}
        {m.intelligence_sources?.length > 0 && (
          <AccordionSection id="sources" label="Intelligence sources">
            <ul style={S.sourceList}>
              {m.intelligence_sources.map((s, i) => (
                <li key={i} style={S.sourceItem}>
                  <span style={S.sourceId}>{s.datapoint_id}</span>
                  <ConfidenceTag level={s.trust} />
                  <span style={S.sourceMeta}>· {s.used_for}</span>
                </li>
              ))}
            </ul>
          </AccordionSection>
        )}
      </div>
    </div>
  );
}

// ─── Scenario view: list memos for one scenario ───────────────────────────────

function ScenarioView({ scenarioId }) {
  const router = useRouter();
  const [memos, setMemos] = useState(null);
  const [scenario, setScenario] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [mRes, sRes] = await Promise.allSettled([
          fetch(`/api/admin/hearst/strategic-memos?scenario_id=${scenarioId}`).then(r => r.json()),
          fetch(`/api/admin/hearst/scenarios`).then(r => r.json()),
        ]);
        if (mRes.status === 'fulfilled') setMemos(mRes.value.memos || []);
        if (sRes.status === 'fulfilled') {
          const list = sRes.value.scenarios || sRes.value.rows || sRes.value || [];
          setScenario(Array.isArray(list) ? list.find(s => s.id === scenarioId) || null : null);
        }
      } catch (e) { setErr(String(e)); }
    }
    load();
  }, [scenarioId]);

  if (err) return <div style={S.err}>Error: {err}</div>;
  if (memos === null) return <div style={S.empty}>Loading scenario…</div>;

  return (
    <div>
      <div style={S.breadcrumb}>
        <Link href="/admin/hearst/dossier" style={S.breadcrumbLink}>All memos</Link>
        <span style={S.breadcrumbSep}>/</span>
        <span>Scenario · {scenario?.name || scenario?.title || scenarioId.slice(0, 8) + '…'}</span>
      </div>

      <header style={S.sectionHeader}>
        <h2 style={S.h2}>
          Scenario · {scenario?.name || scenario?.title || scenarioId.slice(0, 8) + '…'}
        </h2>
        <p style={S.sub}>{memos.length} report version{memos.length !== 1 ? 's' : ''}</p>
      </header>

      {memos.length === 0 && (
        <div style={S.empty}>No reports for this scenario yet.</div>
      )}

      <div style={S.memoCardList}>
        {memos.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => router.push(`/admin/hearst/dossier?memo=${m.id}`)}
            style={S.memoCard}
          >
            <div style={S.memoCardTop}>
              <span style={S.memoCardVersion}>v{m.version}</span>
              <ConfidenceTag level={m.confidence_level} />
              <span style={S.memoCardStatus}>{m.status}</span>
            </div>
            <div style={S.memoCardTitle}>{m.title}</div>
            <div style={S.memoCardMeta}>
              {m.provider_used && <span>{m.provider_used}</span>}
              <span>{fmtDateShort(m.created_at)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Single memo view ─────────────────────────────────────────────────────────

function MemoDetailView({ memoId }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [err, setErr] = useState(null);

  const load = useCallback(async (id) => {
    setData(null);
    setErr(null);
    try {
      const r = await fetch(`/api/admin/hearst/strategic-memos/${id}`);
      const j = await r.json();
      if (!r.ok) { setErr(j.error || 'load failed'); return; }
      setData(j);
    } catch (e) { setErr(String(e)); }
  }, []);

  useEffect(() => { load(memoId); }, [memoId, load]);

  if (err) return <div style={S.err}>Error: {err}</div>;
  if (!data) return <div style={S.empty}>Loading memo…</div>;

  return (
    <div>
      <div style={S.breadcrumb}>
        <Link href="/admin/hearst/dossier" style={S.breadcrumbLink}>All memos</Link>
        {data.memo?.scenario_id && (
          <>
            <span style={S.breadcrumbSep}>/</span>
            <Link
              href={`/admin/hearst/dossier?scenario=${data.memo.scenario_id}`}
              style={S.breadcrumbLink}
            >
              Scenario
            </Link>
          </>
        )}
        <span style={S.breadcrumbSep}>/</span>
        <span>{data.memo?.title || memoId.slice(0, 12) + '…'}</span>
      </div>

      {data.memo && (
        <MemoViewer
          memo={data.memo}
          scenario={data.scenario}
          versions={data.versions}
          onVersionSelect={id => router.push(`/admin/hearst/dossier?memo=${id}`)}
        />
      )}
    </div>
  );
}

// ─── All-memos list (default view) ───────────────────────────────────────────

function AllMemosView() {
  const [memos, setMemos] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [mRes, sRes] = await Promise.allSettled([
          fetch('/api/admin/hearst/strategic-memos').then(r => r.json()),
          fetch('/api/admin/hearst/scenarios').then(r => r.json()),
        ]);
        if (mRes.status === 'fulfilled') setMemos(mRes.value.memos || []);
        if (sRes.status === 'fulfilled') {
          const rawS = sRes.value?.scenarios || sRes.value?.rows;
          setScenarios(Array.isArray(rawS) ? rawS : []);
        }
      } catch (e) { setErr(String(e)); }
    }
    load();
  }, []);

  const scenarioName = useCallback((id) => {
    if (!id) return '—';
    const s = scenarios.find(x => x.id === id);
    return s?.name || s?.title || id.slice(0, 8) + '…';
  }, [scenarios]);

  const approvedCount = (memos || []).filter(m => m.status === 'approved').length;

  return (
    <div>
      <header style={S.sectionHeader}>
        <div>
          <h1 style={S.h1}>Project Dossier</h1>
          <p style={S.sub}>All strategic memos · versioned · exportable. Click any row to open inline.</p>
        </div>
      </header>

      <div style={S.statRow}>
        <div style={S.statBox}><div style={S.statN}>{(memos || []).length}</div><div style={S.statL}>Reports</div></div>
        <div style={S.statBox}><div style={S.statN}>{approvedCount}</div><div style={S.statL}>Approved</div></div>
        <div style={S.statBox}><div style={S.statN}>{scenarios.length}</div><div style={S.statL}>Scenarios</div></div>
      </div>

      {err && <div style={S.err}>Error: {err}</div>}
      {memos === null && <div style={S.empty}>Loading memos…</div>}
      {memos && memos.length === 0 && (
        <div style={S.empty}>No reports yet. Generate a strategic memo from the Simulator.</div>
      )}

      {memos && memos.length > 0 && (
        <table style={S.table}>
          <thead>
            <tr>
              {['Title', 'Scenario', 'Date', 'v', 'Provider', 'Confidence', 'Status', ''].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {memos.map(m => (
              <tr key={m.id} style={S.tr}>
                <td style={S.td}>
                  <Link href={`/admin/hearst/dossier?memo=${m.id}`} style={S.link}>
                    {m.title}
                  </Link>
                </td>
                <td style={S.td}>
                  {m.scenario_id
                    ? <Link href={`/admin/hearst/dossier?scenario=${m.scenario_id}`} style={S.link}>{scenarioName(m.scenario_id)}</Link>
                    : <span style={S.muted}>—</span>
                  }
                </td>
                <td style={S.td}>{fmtDateShort(m.created_at)}</td>
                <td style={S.td}>v{m.version}</td>
                <td style={S.td}>{m.provider_used || '—'}</td>
                <td style={S.td}><ConfidenceTag level={m.confidence_level} /></td>
                <td style={S.td}><span style={S.statusBadge}>{m.status}</span></td>
                <td style={S.td}>
                  <a style={S.pdf} href={`/api/admin/hearst/strategic-memos/${m.id}/pdf`} target="_blank" rel="noreferrer">PDF ↓</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── Router inner ─────────────────────────────────────────────────────────────

function DossierInner() {
  const sp = useSearchParams();
  const memoId    = sp.get('memo');
  const scenarioId = sp.get('scenario');

  return (
    <div style={S.wrap}>
      {memoId     && <MemoDetailView memoId={memoId} />}
      {!memoId && scenarioId && <ScenarioView scenarioId={scenarioId} />}
      {!memoId && !scenarioId && <AllMemosView />}
    </div>
  );
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function DossierPage() {
  return (
    <Suspense fallback={<div style={S.empty}>Loading…</div>}>
      <DossierInner />
    </Suspense>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  wrap: { maxWidth: 1280, margin: '0 auto', padding: '32px 32px 96px' },

  // Typography
  h1: { fontSize: 'var(--cp-font-2xl, 28px)', fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0 },
  h2: { fontSize: 'var(--cp-font-xl, 22px)', fontWeight: 700, color: 'var(--cp-text-primary)', margin: 0 },
  sub: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', marginTop: 6 },
  narrative: { margin: '6px 0', fontSize: 13, color: 'var(--cp-text-body)', lineHeight: 1.6 },
  headline: { fontSize: 16, fontWeight: 700, color: 'var(--cp-text-primary)', lineHeight: 1.4, margin: '4px 0 12px' },
  sublabel: { fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },

  // Layout
  sectionHeader: { marginBottom: 20 },
  statRow: { display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' },
  statBox: { padding: '12px 18px', borderRadius: 10, background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', minWidth: 110 },
  statN: { fontSize: 22, fontWeight: 700, color: 'var(--cp-text-primary)' },
  statL: { fontSize: 11, color: 'var(--cp-text-muted)', textTransform: 'uppercase', marginTop: 2 },

  // Table (list view)
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)' },
  th: { textAlign: 'left', padding: '8px 10px', color: 'var(--cp-text-muted)', borderBottom: '1px solid var(--cp-border)', fontWeight: 600, textTransform: 'uppercase', fontSize: 11 },
  tr: { borderBottom: '1px solid var(--cp-border)', cursor: 'pointer' },
  td: { padding: '8px 10px', color: 'var(--cp-text-body)', verticalAlign: 'middle' },

  // Links & actions
  link: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 500 },
  muted: { color: 'var(--cp-text-faint)' },
  pdf: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 600, fontSize: 12 },
  statusBadge: { fontSize: 11, padding: '2px 7px', borderRadius: 6, background: 'var(--cp-surface-0)', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)' },

  // Breadcrumb
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--cp-text-muted)', marginBottom: 20 },
  breadcrumbLink: { color: 'var(--cp-accent)', textDecoration: 'none' },
  breadcrumbSep: { color: 'var(--cp-text-faint)' },

  // Memo viewer
  memoViewer: { display: 'flex', flexDirection: 'column', gap: 16 },
  memoHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '20px', background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', borderRadius: 12 },
  memoHeaderLeft: { flex: 1 },
  memoHeaderRight: { display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 },
  memoTitle: { fontSize: 20, fontWeight: 800, color: 'var(--cp-text-primary)', margin: '0 0 8px' },
  memoMeta: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  metaChip: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'var(--cp-surface-0)', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', fontFamily: 'ui-monospace, monospace', letterSpacing: 0.3 },
  metaChipMuted: { fontSize: 10, color: 'var(--cp-text-faint)', fontFamily: 'ui-monospace, monospace', alignSelf: 'center' },
  scenarioLink: { fontSize: 12, color: 'var(--cp-text-muted)', marginTop: 4 },
  pdfBtn: { padding: '7px 14px', borderRadius: 8, background: 'var(--cp-accent)', color: '#fff', textDecoration: 'none', fontSize: 12, fontWeight: 700 },
  compareBtn: { padding: '6px 12px', borderRadius: 8, background: 'var(--cp-surface-0)', color: 'var(--cp-accent)', border: '1px solid var(--cp-border)', textDecoration: 'none', fontSize: 12, fontWeight: 600 },

  // Version bar
  versionBar: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '10px 16px', background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)', borderRadius: 10 },
  versionBarLabel: { fontSize: 11, color: 'var(--cp-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 },
  versionChip: { padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, border: '1px solid var(--cp-border)', background: 'var(--cp-surface-1)', color: 'var(--cp-text-muted)', cursor: 'pointer' },
  versionChipActive: { background: 'var(--cp-accent)', color: '#fff', borderColor: 'var(--cp-accent)' },
  versionStatus: { fontWeight: 400, fontSize: 10 },

  // Stats strip
  statsStrip: { display: 'flex', gap: 10, flexWrap: 'wrap' },

  // Memo content
  memoContent: { display: 'flex', flexDirection: 'column', gap: 8 },

  // Confidence row
  confRow: { marginBottom: 8 },

  // Confidence block (always-visible summary)
  confBlock: { padding: 14, background: 'var(--cp-surface-0)', border: '1px dashed var(--cp-border)', borderRadius: 10 },
  confBlockHead: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 },
  confBlockLabel: { fontSize: 10, fontWeight: 800, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  confDensity: { fontSize: 11, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', marginLeft: 'auto' },
  confEst: { fontSize: 12, color: 'var(--cp-text-body)', margin: '4px 0', lineHeight: 1.5 },
  unknownsWrap: { marginTop: 8 },
  unknownsLabel: { fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  // Accordion
  accordionSection: { background: 'var(--cp-surface-1)', border: '1px solid var(--cp-border)', borderRadius: 10, overflow: 'hidden' },
  accordionBtn: { width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' },
  accordionLabel: { fontSize: 12, fontWeight: 800, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  accordionChevron: { fontSize: 18, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  accordionBody: { padding: '0 16px 16px', fontSize: 13, color: 'var(--cp-text-body)', lineHeight: 1.6 },

  // Bullets & lists
  bullets: { margin: '6px 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 5 },
  compList: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 },
  cite: { color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', fontSize: 11 },
  unit: { fontSize: 10, color: 'var(--cp-text-muted)' },

  // Risk items
  riskList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  riskItem: { borderLeft: '3px solid var(--cp-border)', paddingLeft: 10 },
  catLabel: { fontSize: 10, color: 'var(--cp-text-muted)' },
  mit: { fontSize: 12, color: 'var(--cp-text-body)', marginTop: 2 },
  dep: { fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2 },

  // Opportunities
  oppList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  oppItem: {},
  oppHead: { display: 'flex', alignItems: 'center', gap: 8 },

  // Config table (arch / comm)
  configTable: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  configKey: { padding: '6px 10px', borderBottom: '1px solid var(--cp-border)', fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, width: 160, verticalAlign: 'top' },
  configVal: { padding: '6px 10px', borderBottom: '1px solid var(--cp-border)', color: 'var(--cp-text-primary)' },

  // Roadmap
  phaseList: { margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 },
  phaseTime: { fontSize: 10, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', marginLeft: 8 },
  gating: { margin: '4px 0 0', paddingLeft: 18, fontSize: 11, color: 'var(--cp-text-muted)' },
  realityFlags: { marginTop: 12, padding: 12, background: 'var(--ct-status-warning-soft)', border: '1px solid var(--ct-status-warning-border)', borderRadius: 10 },
  realityFlagsLabel: { fontSize: 10, fontWeight: 800, color: 'var(--ct-status-warning)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  realityFlag: { fontSize: 12, color: 'var(--ct-status-warning)', lineHeight: 1.5, padding: '4px 0' },

  // Tensions
  tensionList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  tensionItem: { borderLeft: '3px solid var(--cp-accent)', paddingLeft: 12 },
  tensionId: { fontSize: 11, fontWeight: 800, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 0.5, fontFamily: 'ui-monospace, monospace' },
  tensionVerdict: { fontSize: 12, color: 'var(--cp-text-body)', marginTop: 4, lineHeight: 1.5 },

  // Sources
  sourceList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 },
  sourceItem: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontSize: 11 },
  sourceId: { fontFamily: 'ui-monospace, monospace', color: 'var(--cp-text-primary)', fontSize: 11 },
  sourceMeta: { color: 'var(--cp-text-muted)' },

  // Scenario card list
  memoCardList: { display: 'flex', flexDirection: 'column', gap: 10 },
  memoCard: { padding: '14px 16px', borderRadius: 10, border: '1px solid var(--cp-border)', background: 'var(--cp-surface-1)', cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit', color: 'inherit', transition: 'border-color 0.15s' },
  memoCardTop: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 },
  memoCardVersion: { fontSize: 11, fontWeight: 700, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  memoCardStatus: { fontSize: 10, padding: '2px 7px', borderRadius: 6, background: 'var(--cp-surface-0)', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', fontWeight: 600 },
  memoCardTitle: { fontSize: 14, fontWeight: 700, color: 'var(--cp-text-primary)', marginBottom: 4 },
  memoCardMeta: { display: 'flex', gap: 10, fontSize: 11, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },

  // Shared
  tag: { display: 'inline-block', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, letterSpacing: 0.5, whiteSpace: 'nowrap' },
  err: { padding: 12, borderRadius: 8, background: 'var(--ct-status-danger-soft, #3a1a1f)', color: 'var(--ct-status-danger)', border: '1px solid var(--ct-status-danger-border)', marginBottom: 12 },
  empty: { padding: 40, color: 'var(--cp-text-muted)', textAlign: 'center', fontSize: 14 },
};
