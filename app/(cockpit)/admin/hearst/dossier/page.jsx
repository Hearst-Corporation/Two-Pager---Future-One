'use client';

// /admin/hearst/dossier — Project Dossier · Decision Canvas (Critical Deliverables P8).
//
// A board user must understand the decision in 10 seconds: verdict → KPIs →
// category → risks → recommendation → next action, all above the fold. The full
// written memo lives below as continuous analytics; raw detail collapses into an
// appendix. No accordion wall.
//
// Modes:
//   ?memo=<id>      → fetch single memo, render the Decision Canvas
//   ?scenario=<id>  → list all memos for that scenario
//   (no params)     → list all memos
//
// Design: sober, near-monochrome, cockpit-canon typography. ONE bordeaux accent
// (--cp-accent) reserved for the primary action + the verdict keyline. No status
// colours, no badges/pills/chips. Tokens only — no hardcoded hex/rgb. Responsive
// via auto-fit grids + intrinsic wrapping.
//
// Rendering / UX only — reads existing memo_json (+ _exec_projection), scenario
// and report data. No financial-engine, memo-generation or approval-API changes.

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  deriveVerdict, deriveCategory, deriveKpis, topRisks, deriveDecision,
  deriveCapitalStack, fmtUsd,
} from '@/lib/dossier-derive';
import { Card, SectionHead, Button, Table, Row, Cell, KpiGrid, KpiCard } from '@/components/hearst/ui';
import { S as CP } from '@/lib/cp-styles';
import { UI } from '@/lib/ui-strings';

const DOSSIER_ERR = { ...CP.error, padding: 'var(--cp-space-3)', border: '1px solid var(--cp-border)', marginBottom: 'var(--cp-space-3)' };
const DOSSIER_EMPTY = { ...CP.empty, padding: 'var(--cp-space-9)', fontSize: 'var(--cp-font-md)' };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(s) { try { return new Date(s).toLocaleString(); } catch { return s; } }
function fmtDateShort(s) { try { return new Date(s).toLocaleDateString(); } catch { return s; } }

const CATEGORY_DESC = {
  'Powered Shell':          'Landlord delivers shell + power; tenant fits out and operates. NNN lease, real-estate risk profile.',
  'Hyperscale Campus':      'Multi-building campus leased to hyperscale operators at scale.',
  'AI Factory':             'Dense GPU training / inference cluster, liquid-cooled.',
  'GPU Cloud':              'Owned GPUs rented as compute — utilization and obsolescence exposure.',
  'Enterprise Colocation':  'Retail / wholesale colocation for enterprise tenants.',
  'Government Compute':     'State-anchored national AI / compute capacity.',
  'Edge Campus':            'Distributed edge sites positioned close to demand.',
};

// ─── Sub-components ──────────────────────────────────────────────────────────

// Confidence rendered as a quiet typographic label (no badge / no colour).
function ConfidenceLabel({ level }) {
  const lvl = (level || 'MEDIUM').toUpperCase();
  const label = lvl === 'HIGH' ? UI.DOSSIER_CONF_HIGH : lvl === 'LOW' ? UI.DOSSIER_CONF_LOW : UI.DOSSIER_CONF_MED;
  return <span style={S.confLabel}>{label}</span>;
}

function Collapsible({ label, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card as="section" variant="card" surface={1} style={{ padding: 0, overflow: 'hidden' }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} style={S.appendixBtn}>
        <span style={S.appendixLabel}>{label}</span>
        <span style={S.appendixChevron}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={S.appendixBody}>{children}</div>}
    </Card>
  );
}

function Placeholder({ children }) {
  return <div style={S.placeholder}>{children || UI.DOSSIER_PLACEHOLDER_DEFAULT}</div>;
}

// ─── Visual Story blocks ─────────────────────────────────────────────────────

function CapitalStack({ stack }) {
  if (!stack) return <Placeholder>{UI.DOSSIER_PLACEHOLDER_STACK}</Placeholder>;
  return (
    <div>
      <div style={S.stackBar}>
        <div style={{ ...S.stackSeg, width: `${stack.debtPct}%`, background: 'var(--cp-text-muted)' }} title={`Debt ${stack.debtPct}%`} />
        <div style={{ ...S.stackSeg, width: `${stack.equityPct}%`, background: 'var(--cp-accent)' }} title={`Equity ${stack.equityPct}%`} />
      </div>
      <div style={S.stackLegend}>
        <span><span style={{ ...S.dot, background: 'var(--cp-text-muted)' }} /> Debt {stack.debtPct}%</span>
        <span><span style={{ ...S.dot, background: 'var(--cp-accent)' }} /> Equity {stack.equityPct}%</span>
      </div>
      {stack.split.length > 0 && (
        <div style={S.splitWrap}>
          <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_EQUITY_SPONSORS}</div>
          {stack.split.map(s => (
            <div key={s.name} style={S.splitRow}>
              <span style={S.splitName}>{s.name}</span>
              <div style={S.splitTrack}><div style={{ ...S.splitFill, width: `${s.pct}%` }} /></div>
              <span style={S.splitPct}>{s.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function parseMonths(v) {
  if (v == null) return null;
  const nums = String(v).match(/\d+(\.\d+)?/g);
  if (!nums) return null;
  const a = parseFloat(nums[0]);
  const b = nums[1] != null ? parseFloat(nums[1]) : a;
  return { start: Math.min(a, b), end: Math.max(a, b) };
}

function DeploymentTimeline({ phases }) {
  if (!phases?.length) return <Placeholder>{UI.DOSSIER_PLACEHOLDER_TIMELINE}</Placeholder>;
  const ranges = phases.map(p => parseMonths(p.months_from_t0));
  const maxMonth = Math.max(...ranges.map(r => r?.end || 0), 1);
  return (
    <div style={S.timeline}>
      {phases.map((p, i) => {
        const r = ranges[i] || { start: 0, end: maxMonth };
        const left = (r.start / maxMonth) * 100;
        const width = Math.max(2, ((r.end - r.start) / maxMonth) * 100);
        return (
          <div key={i} style={S.tlRow}>
            <div style={S.tlLabel} title={p.label}>{p.label}</div>
            <div style={S.tlTrack}>
              <div style={{ ...S.tlBar, left: `${left}%`, width: `${width}%` }} />
            </div>
            <div style={S.tlMonths}>{p.months_from_t0 != null ? `${p.months_from_t0} mo` : '—'}</div>
          </div>
        );
      })}
    </div>
  );
}

function BenchmarkPosition({ comparables }) {
  if (!comparables?.length) return <Placeholder>{UI.DOSSIER_PLACEHOLDER_COMPARABLES}</Placeholder>;
  return (
    <ul style={S.benchList}>
      {comparables.map((c, i) => (
        <li key={i} style={S.benchRow}>
          <span style={S.benchName}>{c.name}</span>
          <span style={S.benchMetric}>{c.metric}</span>
          <span style={S.benchValue}>{c.value}</span>
          {c.source && <span style={S.benchSrc}>{c.source}</span>}
        </li>
      ))}
    </ul>
  );
}

function Cashflow({ years }) {
  if (!years?.length) return <Placeholder>{UI.DOSSIER_CASHFLOW_PLACEHOLDER}</Placeholder>;
  const vals = years.flatMap(y => [y.rev, y.ebitda, y.fcf].filter(v => v != null));
  const max = Math.max(...vals.map(Math.abs), 1);
  return (
    <div style={S.cashWrap}>
      {years.map((y, i) => {
        const h = (v) => `${Math.max(2, (Math.abs(v || 0) / max) * 100)}%`;
        return (
          <div key={i} style={S.cashCol}>
            <div style={S.cashBars}>
              <div style={{ ...S.cashBar, height: h(y.rev), background: 'var(--cp-accent)' }} title={`Revenue ${fmtUsd(y.rev) || '—'}`} />
              <div style={{ ...S.cashBar, height: h(y.ebitda), background: 'var(--cp-text-muted)' }} title={`EBITDA ${fmtUsd(y.ebitda) || '—'}`} />
              <div style={{ ...S.cashBar, height: h(y.fcf), background: 'var(--cp-text-faint)' }} title={`FCF ${fmtUsd(y.fcf) || '—'}`} />
            </div>
            <div style={S.cashYr}>Y{y.y}</div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Decision Canvas ──────────────────────────────────────────────────────────

function DecisionCanvas({ memo, scenario, versions, onVersionSelect, onStatusChange }) {
  const m = memo.memo_json || {};
  const verdict = deriveVerdict(m);
  const category = deriveCategory(m);
  const kpis = deriveKpis(m);
  const risks = topRisks(m, 5);
  const decision = deriveDecision(m, memo.status);
  const capStack = deriveCapitalStack(m, scenario);
  const fresh = m.data_freshness || {};
  const phases = m.deployment_roadmap?.phases || [];
  const comparables = m.market_benchmarking?.comparables || [];

  // Approval — buttons PATCH the status (server enforces the state machine +
  // attributes who/when + writes the audit trail), then reload.
  const [govBusy, setGovBusy] = useState(false);
  const [govErr, setGovErr] = useState(null);
  async function transition(next) {
    setGovBusy(true); setGovErr(null);
    try {
      const r = await fetch(`/api/admin/hearst/strategic-memos/${memo.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setGovErr(j.error || `HTTP ${r.status}`); return; }
      onStatusChange && onStatusChange();
    } catch (e) { setGovErr(String(e)); } finally { setGovBusy(false); }
  }

  // Quiet identity line — region · version · status · data freshness · provider.
  const ident = [
    memo.region,
    `v${memo.version}`,
    memo.status,
    fresh.data_as_of ? `Data as of ${fresh.data_as_of}${fresh.overall_status ? ` (${fresh.overall_status})` : ''}` : null,
    memo.provider_used,
  ].filter(Boolean);

  return (
    <div style={S.canvas}>
      {/* ── HERO VERDICT ──────────────────────────────────────────── */}
      <Card as="section" variant="card" surface={1} padding="lg" style={{ borderLeft: '3px solid var(--cp-accent)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' }}>
        <div style={S.heroTop}>
          <div style={S.heroIdent}>
            <div style={S.identLine}>{ident.join('  ·  ')}</div>
            <h1 style={S.heroTitle}>{memo.title}</h1>
          </div>

          <div style={S.heroActions}>
            <a style={S.pdfBtn} href={`/api/admin/hearst/strategic-memos/${memo.id}/pdf`} target="_blank" rel="noreferrer">
              {UI.DOSSIER_BTN_EXPORT_PDF}
            </a>
            <div style={S.govRow}>
              {memo.status === 'draft' && (
                <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('reviewed')}>{UI.DOSSIER_BTN_MARK_REVIEWED}</Button>
              )}
              {memo.status === 'reviewed' && (
                <>
                  <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('approved')}>{UI.DOSSIER_BTN_APPROVE}</Button>
                  <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('draft')}>{UI.DOSSIER_BTN_SEND_BACK}</Button>
                </>
              )}
              {memo.status === 'approved' && (
                <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('archived')}>{UI.DOSSIER_BTN_ARCHIVE}</Button>
              )}
              {memo.status === 'archived' && (
                <Button variant="secondary" size="sm" disabled={govBusy} onClick={() => transition('draft')}>{UI.DOSSIER_BTN_REOPEN}</Button>
              )}
            </div>
            {(memo.approved_at || memo.reviewed_at) && (
              <div style={S.govNote}>
                {memo.approved_at ? UI.DOSSIER_GOV_APPROVED(fmtDate(memo.approved_at)) : UI.DOSSIER_GOV_REVIEWED(fmtDate(memo.reviewed_at))}
              </div>
            )}
            {govErr && <div style={S.govErr}>{govErr}</div>}
          </div>
        </div>

        <div style={S.verdictRow}>
          <div style={S.verdictBadge}>{verdict.label}</div>
          <div style={S.verdictMeta}>
            <span style={S.eyebrow}>{UI.DOSSIER_EYEBROW_VERDICT}</span>
            {verdict.drivers?.length > 0 && <span style={S.verdictDrivers}>{verdict.drivers.join('  ·  ')}</span>}
            <span style={S.verdictNote}>{UI.DOSSIER_VERDICT_NOTE}</span>
          </div>
        </div>

        {decision.recommendation && <p style={S.heroLead}>{decision.recommendation}</p>}
      </Card>

      {/* ── KPI STRIP ─────────────────────────────────────────────── */}
      <section style={S.kpiStrip}>
        {kpis.map(k => (
          <Card key={k.key} variant="card" surface={1} padding="md">
            <div style={S.kpiLabel}>{k.label}</div>
            <div style={S.kpiValue}>{k.value || '—'}</div>
            {k.sub && <div style={S.kpiSub}>{k.sub}</div>}
          </Card>
        ))}
      </section>

      {/* ── OPPORTUNITY CATEGORY ──────────────────────────────────── */}
      <Card as="section" variant="card" surface={0} style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-4)', flexWrap: 'wrap', paddingTop: 'var(--cp-space-3)', paddingBottom: 'var(--cp-space-3)', paddingLeft: 'var(--cp-space-5)', paddingRight: 'var(--cp-space-5)' }}>
        <span style={S.eyebrow}>{UI.DOSSIER_EYEBROW_OPPORTUNITY}</span>
        <span style={S.categoryName}>{category || UI.DOSSIER_CATEGORY_NOT_CLASSIFIED}</span>
        <span style={S.categoryDesc}>
          {category ? CATEGORY_DESC[category] : UI.DOSSIER_CATEGORY_NOT_INFERRED}
        </span>
      </Card>

      {/* ── DECISION CARD + RISK CARDS ────────────────────────────── */}
      <section style={S.twoCol}>
        <Card variant="card" surface={1} style={{ padding: 'var(--cp-space-5)' }}>
          <SectionHead title={UI.DOSSIER_SECTION_RECOMMENDATION} />
          {decision.why && <p style={S.body}>{decision.why}</p>}
          {decision.conditions.length > 0 && (
            <div style={S.condWrap}>
              <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_CONDITIONS}</div>
              <ul style={S.condList}>
                {decision.conditions.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </div>
          )}
          <div style={S.nextAction}>
            <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_NEXT_ACTION}</div>
            <div style={S.nextPrimary}>{decision.nextAction.primary}</div>
            <div style={S.nextDetail}>{decision.nextAction.detail}</div>
          </div>
        </Card>

        <div style={S.riskCol}>
          <SectionHead title={UI.DOSSIER_SECTION_TOP_RISKS} hint={UI.DOSSIER_RISKS_HINT(risks.length)} />
          {risks.length === 0 && <Placeholder>{UI.DOSSIER_PLACEHOLDER_RISKS}</Placeholder>}
          <div style={S.riskGrid}>
            {risks.map((r, i) => {
              const sv = (r.severity || 'MED').toUpperCase();
              return (
                <Card key={i} variant="card" surface={1} padding="sm" style={{ borderLeft: '3px solid var(--cp-border-strong)' }}>
                  <div style={S.riskHead}>
                    <span style={S.sevLabel}>{sv === 'MEDIUM' ? 'MED' : sv}</span>
                    {r.category && <span style={S.riskCat}>{r.category}</span>}
                  </div>
                  <div style={S.riskTitle}>{r.label}</div>
                  {r.dependency && <div style={S.riskWhy}>{UI.DOSSIER_RISK_WHY} {r.dependency}</div>}
                  {r.mitigation && <div style={S.riskMit}>{UI.DOSSIER_MITIGATION_PREFIX}{r.mitigation}</div>}
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── VISUAL STORY ──────────────────────────────────────────── */}
      <section>
        <SectionHead title={UI.DOSSIER_SECTION_VISUAL_STORY} hint={UI.DOSSIER_SECTION_VISUAL_STORY_HINT} />
        <div style={S.vizGrid}>
          <Card variant="card" surface={1} style={{ padding: 'var(--cp-space-4)' }}>
            <div style={S.vizTitle}>{UI.DOSSIER_VIZ_CAPITAL_STACK}</div>
            <CapitalStack stack={capStack} />
          </Card>
          <Card variant="card" surface={1} style={{ padding: 'var(--cp-space-4)' }}>
            <div style={S.vizTitle}>{UI.DOSSIER_VIZ_DEPLOYMENT_TIMELINE}</div>
            <DeploymentTimeline phases={phases} />
          </Card>
          <Card variant="card" surface={1} style={{ padding: 'var(--cp-space-4)' }}>
            <div style={S.vizTitle}>{UI.DOSSIER_VIZ_BENCHMARK_POSITION}</div>
            <BenchmarkPosition comparables={comparables} />
          </Card>
          <Card variant="card" surface={1} style={{ padding: 'var(--cp-space-4)' }}>
            <div style={S.vizTitle}>{UI.DOSSIER_VIZ_CASHFLOW_TRAJECTORY}</div>
            <Cashflow years={m._exec_projection?.years} />
          </Card>
        </div>
      </section>

      {/* ── ANALYTICS (continuous) ────────────────────────────────── */}
      <section style={S.analytics}>
        <SectionHead title={UI.DOSSIER_SECTION_ANALYTICS} hint={UI.DOSSIER_SECTION_ANALYTICS_HINT} />

        {m.strategic_context && !m.strategic_context.skip && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_STRATEGIC_CONTEXT}>
            <p style={S.body}>{m.strategic_context.body}</p>
          </AnalyticsBlock>
        )}

        {m.key_financial_metrics && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_FINANCIAL_METRICS}>
            <table style={S.table}>
              <thead><tr>{[UI.DOSSIER_TH_METRIC, UI.DOSSIER_TH_VALUE, UI.DOSSIER_TH_CONF, UI.DOSSIER_TH_SOURCE].map(h => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
              <tbody>
                {(m.key_financial_metrics.metrics || []).map((row, i) => (
                  <tr key={i}>
                    <td style={S.td}>{row.label}</td>
                    <td style={S.td}><strong>{row.value}</strong>{row.unit && <span style={S.unit}> {row.unit}</span>}</td>
                    <td style={S.td}><ConfidenceLabel level={row.confidence} /></td>
                    <td style={S.tdMuted}>{row.source || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {m.key_financial_metrics.narrative && <p style={S.body}>{m.key_financial_metrics.narrative}</p>}
          </AnalyticsBlock>
        )}

        {m.infrastructure_analysis && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_INFRASTRUCTURE}>
            {m.infrastructure_analysis.body && <p style={S.body}>{m.infrastructure_analysis.body}</p>}
            {m.infrastructure_analysis.tradeoffs?.length > 0 && (
              <>
                <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_TRADEOFFS}</div>
                <ul style={S.bullets}>{m.infrastructure_analysis.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}</ul>
              </>
            )}
            {Object.keys(m.recommended_architecture?.config || {}).length > 0 && (
              <table style={S.configTable}>
                <tbody>
                  {Object.entries(m.recommended_architecture.config).map(([k, v]) => (
                    <tr key={k}><td style={S.configKey}>{k}</td><td style={S.configVal}>{v}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            {m.recommended_architecture?.rationale && <p style={S.body}>{m.recommended_architecture.rationale}</p>}
          </AnalyticsBlock>
        )}

        {m.market_benchmarking?.structural_differences?.length > 0 && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_MARKET_BENCHMARKING}>
            <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_PEERS}</div>
            <ul style={S.bullets}>{m.market_benchmarking.structural_differences.map((d, i) => <li key={i}>{d}</li>)}</ul>
          </AnalyticsBlock>
        )}

        {m.commercialization_strategy && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_REVENUE_MODEL}>
            <table style={S.configTable}>
              <tbody>
                {[
                  [UI.DOSSIER_ROW_PRICING, m.commercialization_strategy.pricing],
                  [UI.DOSSIER_ROW_CONTRACT, m.commercialization_strategy.contract_structure],
                  [UI.DOSSIER_ROW_ANCHOR, m.commercialization_strategy.anchor_tenant],
                  [UI.DOSSIER_ROW_RAMP, m.commercialization_strategy.ramp_profile],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <tr key={k}><td style={S.configKey}>{k}</td><td style={S.configVal}>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </AnalyticsBlock>
        )}

        {m.long_term_strategic_value && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_LONG_TERM_VALUE}>
            {m.long_term_strategic_value.ten_year_arc && <p style={S.body}>{m.long_term_strategic_value.ten_year_arc}</p>}
            {m.long_term_strategic_value.speculative_branches?.length > 0 && (
              <>
                <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_SPECULATIVE}</div>
                <ul style={S.bullets}>{m.long_term_strategic_value.speculative_branches.map((s, i) => <li key={i}>{s}</li>)}</ul>
              </>
            )}
          </AnalyticsBlock>
        )}

        {m.intelligence_sources?.length > 0 && (
          <AnalyticsBlock title={UI.DOSSIER_BLOCK_SOURCES}>
            <ul style={S.sourceList}>
              {m.intelligence_sources.map((s, i) => (
                <li key={i} style={S.sourceItem}>
                  <span style={S.sourceId}>{s.datapoint_id}</span>
                  <ConfidenceLabel level={s.trust} />
                  <span style={S.sourceMeta}>· {s.used_for}</span>
                </li>
              ))}
            </ul>
          </AnalyticsBlock>
        )}
      </section>

      {/* ── APPENDIX (collapsed) ──────────────────────────────────── */}
      {versions && versions.length > 1 && (
        <Card variant="card" surface={0} style={{ display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', flexWrap: 'wrap', paddingTop: 'var(--cp-space-2)', paddingBottom: 'var(--cp-space-2)', paddingLeft: 'var(--cp-space-4)', paddingRight: 'var(--cp-space-4)' }}>
          <span style={S.eyebrow}>{UI.DOSSIER_EYEBROW_VERSIONS}</span>
          {versions.map(v => (
            <button key={v.id} type="button" onClick={() => onVersionSelect(v.id)}
              style={{ ...S.versionChip, ...(v.id === memo.id ? S.versionChipActive : {}) }}>
              v{v.version}{v.status ? ` · ${v.status}` : ''}
            </button>
          ))}
        </Card>
      )}

      <Collapsible label={UI.DOSSIER_APPENDIX_LABEL}>
        {m.decision_tensions?.length > 0 && (
          <div>
            <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_DECISION_TENSIONS}</div>
            <ul style={S.tensionList}>
              {m.decision_tensions.map((t, i) => (
                <li key={i} style={S.tensionItem}>
                  <div style={S.tensionId}>{t.id}</div>
                  <div style={S.body}>{t.verdict}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_GEN_METADATA}</div>
          <table style={S.configTable}>
            <tbody>
              {[
                [UI.DOSSIER_META_PROVIDER, memo.provider_used],
                [UI.DOSSIER_META_CONFIDENCE, memo.confidence_level],
                [UI.DOSSIER_META_STAKEHOLDER, memo.stakeholder],
                [UI.DOSSIER_META_AUDIENCE, memo.audience],
                [UI.DOSSIER_META_GEN_TIME, memo.generation_time_ms != null ? `${(memo.generation_time_ms / 1000).toFixed(1)}s` : null],
                [UI.DOSSIER_META_CREATED, fmtDate(memo.created_at)],
                [UI.DOSSIER_META_DATA_AS_OF, memo.data_as_of],
                [UI.DOSSIER_META_SCENARIO, memo.scenario_id || '—'],
              ].filter(([, v]) => v != null).map(([k, v]) => (
                <tr key={k}><td style={S.configKey}>{k}</td><td style={S.configVal}>{v}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div style={S.eyebrow}>{UI.DOSSIER_EYEBROW_FULL_JSON}</div>
          <pre style={S.pre}>{JSON.stringify(m, null, 2)}</pre>
        </div>
      </Collapsible>
    </div>
  );
}

function AnalyticsBlock({ title, children }) {
  return (
    <div style={S.analyticsBlock}>
      <h3 style={S.analyticsTitle}>{title}</h3>
      {children}
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
        const pRes = await fetch('/api/admin/hearst/project');
        const { project: proj } = await pRes.json();
        const [mRes, sRes] = await Promise.allSettled([
          fetch(`/api/admin/hearst/strategic-memos?scenario_id=${scenarioId}`).then(r => r.json()),
          fetch(`/api/admin/hearst/scenarios?project_id=${proj?.id}`).then(r => r.json()),
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

  if (err) return <div style={DOSSIER_ERR}>Error: {err}</div>;
  if (memos === null) return <div style={DOSSIER_EMPTY}>{UI.DOSSIER_LOADING_SCENARIO}</div>;

  return (
    <div>
      <div style={S.breadcrumb}>
        <Link href="/admin/hearst/dossier" style={S.breadcrumbLink}>{UI.DOSSIER_BREADCRUMB_ALL_MEMOS}</Link>
        <span style={S.breadcrumbSep}>/</span>
        <span>{UI.DOSSIER_BREADCRUMB_SCENARIO} · {scenario?.name || scenario?.title || scenarioId.slice(0, 8) + '…'}</span>
      </div>

      <header style={S.sectionHeader}>
        <h2 style={S.h2}>{UI.DOSSIER_BREADCRUMB_SCENARIO} · {scenario?.name || scenario?.title || scenarioId.slice(0, 8) + '…'}</h2>
        <p style={S.sub}>{UI.DOSSIER_REPORT_VERSIONS(memos.length)}</p>
      </header>

      {memos.length === 0 && <div style={DOSSIER_EMPTY}>{UI.DOSSIER_NO_SCENARIO_REPORTS}</div>}

      <div style={S.memoCardList}>
        {memos.map(mm => (
          <Card key={mm.id} as="button" variant="card" surface={1} padding="sm" onClick={() => router.push(`/admin/hearst/dossier?memo=${mm.id}`)} style={{ cursor: 'pointer', textAlign: 'left', width: '100%', font: 'inherit', color: 'inherit' }}>
            <div style={S.memoCardTop}>
              <span style={S.memoCardVersion}>v{mm.version}</span>
              <ConfidenceLabel level={mm.confidence_level} />
              <span style={S.memoCardStatus}>{mm.status}</span>
            </div>
            <div style={S.memoCardTitle}>{mm.title}</div>
            <div style={S.memoCardMeta}>
              {mm.provider_used && <span>{mm.provider_used}</span>}
              <span>{fmtDateShort(mm.created_at)}</span>
            </div>
          </Card>
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
    setData(null); setErr(null);
    try {
      const r = await fetch(`/api/admin/hearst/strategic-memos/${id}`);
      const j = await r.json();
      if (!r.ok) { setErr(j.error || 'load failed'); return; }
      setData(j);
    } catch (e) { setErr(String(e)); }
  }, []);

  useEffect(() => { load(memoId); }, [memoId, load]);

  if (err) return <div style={DOSSIER_ERR}>Error: {err}</div>;
  if (!data) return <div style={DOSSIER_EMPTY}>{UI.DOSSIER_LOADING_MEMO}</div>;

  return (
    <div>
      <div style={S.breadcrumb}>
        <Link href="/admin/hearst/dossier" style={S.breadcrumbLink}>{UI.DOSSIER_BREADCRUMB_ALL_MEMOS}</Link>
        {data.memo?.scenario_id && (
          <>
            <span style={S.breadcrumbSep}>/</span>
            <Link href={`/admin/hearst/dossier?scenario=${data.memo.scenario_id}`} style={S.breadcrumbLink}>{UI.DOSSIER_BREADCRUMB_SCENARIO}</Link>
          </>
        )}
        <span style={S.breadcrumbSep}>/</span>
        <span>{data.memo?.title || memoId.slice(0, 12) + '…'}</span>
      </div>

      {data.memo && (
        <DecisionCanvas
          memo={data.memo}
          scenario={data.scenario}
          versions={data.versions}
          onVersionSelect={id => router.push(`/admin/hearst/dossier?memo=${id}`)}
          onStatusChange={() => load(memoId)}
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
        const pRes = await fetch('/api/admin/hearst/project');
        const { project: proj } = await pRes.json();
        const [mRes, sRes] = await Promise.allSettled([
          fetch('/api/admin/hearst/strategic-memos').then(r => r.json()),
          fetch(`/api/admin/hearst/scenarios?project_id=${proj?.id}`).then(r => r.json()),
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

  const approvedCount = (memos || []).filter(mm => mm.status === 'approved').length;

  return (
    <div>
      <header className="oracle-page-header">
        <h1>{UI.DOSSIER_PAGE_TITLE}</h1>
        <p className="oracle-subtitle">{UI.DOSSIER_PAGE_SUBTITLE}</p>
      </header>

      <KpiGrid cols={3} style={{ marginBottom: 'var(--cp-space-6)' }}>
        <KpiCard label={UI.DOSSIER_KPI_REPORTS} value={(memos || []).length} format="display" size="sm" />
        <KpiCard label={UI.DOSSIER_KPI_APPROVED} value={approvedCount} format="display" size="sm" />
        <KpiCard label={UI.DOSSIER_KPI_SCENARIOS} value={scenarios.length} format="display" size="sm" />
      </KpiGrid>

      {err && <div style={DOSSIER_ERR}>Error: {err}</div>}
      {memos === null && <div style={DOSSIER_EMPTY}>{UI.DOSSIER_LOADING_MEMOS}</div>}
      {memos && memos.length === 0 && <div style={DOSSIER_EMPTY}>{UI.WS_NO_REPORTS}</div>}

      {memos && memos.length > 0 && (
        <Table
          scroll
          head={[UI.DOSSIER_TH_TITLE, UI.DOSSIER_TH_SCENARIO, UI.DOSSIER_TH_DATE, UI.DOSSIER_TH_VERSION_COL, UI.DOSSIER_TH_PROVIDER, UI.DOSSIER_TH_CONFIDENCE, UI.DOSSIER_TH_STATUS, '']}
        >
          {memos.map(mm => (
            <Row key={mm.id}>
              <Cell label style={S.titleCell} title={mm.title}><Link href={`/admin/hearst/dossier?memo=${mm.id}`} style={S.link}>{mm.title}</Link></Cell>
              <Cell style={S.scenarioCell}>
                {mm.scenario_id
                  ? <Link href={`/admin/hearst/dossier?scenario=${mm.scenario_id}`} style={S.link}>{scenarioName(mm.scenario_id)}</Link>
                  : <span style={S.muted}>—</span>}
              </Cell>
              <Cell>{fmtDateShort(mm.created_at)}</Cell>
              <Cell>v{mm.version}</Cell>
              <Cell>{mm.provider_used || '—'}</Cell>
              <Cell><ConfidenceLabel level={mm.confidence_level} /></Cell>
              <Cell><span style={S.statusText}>{mm.status}</span></Cell>
              <Cell style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                <a style={S.pdf} href={`/api/admin/hearst/strategic-memos/${mm.id}/pdf`} target="_blank" rel="noreferrer">PDF ↓</a>
              </Cell>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

// ─── Router inner ─────────────────────────────────────────────────────────────

function DossierInner() {
  const sp = useSearchParams();
  const memoId = sp.get('memo');
  const scenarioId = sp.get('scenario');

  return (
    <div className="oracle-page">
      {memoId && <MemoDetailView memoId={memoId} />}
      {!memoId && scenarioId && <ScenarioView scenarioId={scenarioId} />}
      {!memoId && !scenarioId && <AllMemosView />}
    </div>
  );
}

export default function DossierPage() {
  return (
    <Suspense fallback={<div style={DOSSIER_EMPTY}>{UI.DOSSIER_LOADING_FALLBACK}</div>}>
      <DossierInner />
    </Suspense>
  );
}

// ─── Styles — tokens only, cockpit canon (H1 20/800 · H2 13/700 · eyebrow 10/800 CAPS) ─

const EYEBROW = {
  fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-muted)',
  textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wider)',
};

const S = {
  // Typography / shared (canon)
  h2: { fontSize: 'var(--cp-font-lg)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', margin: 'var(--cp-space-0)' },
  sub: { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', marginTop: 'var(--cp-space-1)' },
  body: { margin: 'var(--cp-space-1) var(--cp-space-0)', fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 'var(--cp-leading-normal)' },
  eyebrow: { ...EYEBROW, display: 'block', marginBottom: 'var(--cp-space-1)' },
  confLabel: { fontSize: 'var(--cp-font-micro)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wide)', whiteSpace: 'nowrap' },

  // Canvas
  canvas: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-6)' },

  heroTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--cp-space-4)', flexWrap: 'wrap' },
  heroIdent: { flex: '1 1 calc(var(--cp-space-8) * 10)', minWidth: 0 },
  identLine: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'capitalize', marginBottom: 'var(--cp-space-2)' },
  heroTitle: { fontSize: 'var(--cp-font-2xl)', fontWeight: 'var(--cp-weight-black)', letterSpacing: 'var(--cp-tracking-tight)', color: 'var(--cp-text-primary)', margin: 'var(--cp-space-0)', lineHeight: 'var(--cp-leading-tight)' },
  heroActions: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)', alignItems: 'flex-end', flexShrink: 0 },
  heroLead: { fontSize: 'var(--cp-font-md)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-primary)', lineHeight: 'var(--cp-leading-tight)', margin: 'var(--cp-space-0)', maxWidth: 'calc(var(--cp-space-9) * 22 + var(--cp-space-5))' },

  verdictRow: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-4)', flexWrap: 'wrap' },
  verdictBadge: { fontSize: 'var(--cp-font-2xl)', fontWeight: 'var(--cp-weight-black)', letterSpacing: 'var(--cp-tracking-wide)', color: 'var(--cp-text-primary)', textTransform: 'uppercase', lineHeight: 'var(--cp-leading-tight)', paddingLeft: 'var(--cp-space-4)', borderLeft: '3px solid var(--cp-accent)' },
  verdictMeta: { display: 'flex', flexDirection: 'column', gap: 'calc(var(--cp-space-1) / 2)', minWidth: 0 },
  verdictDrivers: { fontSize: 'var(--cp-font-base)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-body)' },
  verdictNote: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-faint)', fontStyle: 'italic' },

  pdfBtn: { padding: 'var(--cp-space-2) var(--cp-space-4)', borderRadius: 'var(--cp-radius-sm)', background: 'var(--cp-accent)', color: 'var(--cp-text-strong)', textDecoration: 'none', fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-bold)', whiteSpace: 'nowrap' },
  govRow: { display: 'flex', gap: 'var(--cp-space-1)', justifyContent: 'flex-end', flexWrap: 'wrap' },
  govNote: { fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-semibold)', color: 'var(--cp-text-muted)' },
  govErr: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-error)', maxWidth: 'calc(var(--cp-space-9) * 5 + var(--cp-space-5))', textAlign: 'right' },

  // ── KPI strip (auto-fit grid → responsive) ──
  kpiStrip: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(calc(var(--cp-space-9) * 3 + var(--cp-space-5)), 1fr))', gap: 'var(--cp-space-3)' },
  kpiLabel: { ...EYEBROW, marginBottom: 'var(--cp-space-2)' },
  kpiValue: { fontSize: 'var(--cp-font-2xl)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', lineHeight: 'var(--cp-leading-tight)', fontVariantNumeric: 'tabular-nums' },
  kpiSub: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', marginTop: 'var(--cp-space-1)' },

  categoryName: { fontSize: 'var(--cp-font-lg)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', letterSpacing: 'var(--cp-tracking-tight)' },
  categoryDesc: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', flex: '1 1 calc(var(--cp-space-9) * 6)' },

  // ── Two-col (decision + risks) ──
  twoCol: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(calc(var(--cp-space-8) * 10), 1fr))', gap: 'var(--cp-space-4)', alignItems: 'start' },
  condWrap: { padding: 'var(--cp-space-3)', borderRadius: 'var(--cp-radius-md)', background: 'var(--cp-surface-0)', border: '1px dashed var(--cp-border)', margin: 'var(--cp-space-3) var(--cp-space-0)' },
  condList: { margin: 'var(--cp-space-0)', paddingLeft: 'var(--cp-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)', fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-body)', lineHeight: 'var(--cp-leading-normal)' },
  nextAction: { padding: 'var(--cp-space-3) var(--cp-space-4)', borderRadius: 'var(--cp-radius-md)', background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)', borderLeft: '3px solid var(--cp-accent)' },
  nextPrimary: { fontSize: 'var(--cp-font-md)', fontWeight: 'var(--cp-weight-black)', color: 'var(--cp-text-primary)', marginTop: 'calc(var(--cp-space-1) / 2)' },
  nextDetail: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-body)', marginTop: 'calc(var(--cp-space-1) / 2)', lineHeight: 'var(--cp-leading-normal)' },

  riskCol: { minWidth: 0 },
  riskGrid: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)' },
  riskHead: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', marginBottom: 'var(--cp-space-1)' },
  sevLabel: { ...EYEBROW, color: 'var(--cp-text-primary)' },
  riskCat: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', textTransform: 'uppercase', letterSpacing: 'var(--cp-tracking-wide)' },
  riskTitle: { fontSize: 'var(--cp-font-base)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', lineHeight: 'var(--cp-leading-tight)' },
  riskWhy: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', marginTop: 'var(--cp-space-1)', lineHeight: 'var(--cp-leading-tight)' },
  riskMit: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-body)', marginTop: 'calc(var(--cp-space-1) / 2)', lineHeight: 'var(--cp-leading-tight)' },

  // ── Section headings (canon H2 13/700) ──

  // ── Visual story ──
  vizGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(calc(var(--cp-space-9) * 6 + var(--cp-space-5)), 1fr))', gap: 'var(--cp-space-3)' },
  vizTitle: { ...EYEBROW, marginBottom: 'var(--cp-space-3)' },
  placeholder: { padding: 'var(--cp-space-4) var(--cp-space-3)', borderRadius: 'var(--cp-radius-sm)', background: 'var(--cp-surface-0)', border: '1px dashed var(--cp-border)', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-sm)', fontStyle: 'italic', textAlign: 'center' },

  // Capital stack
  stackBar: { display: 'flex', height: 'calc(var(--cp-space-5) + var(--cp-space-1) / 2)', borderRadius: 'var(--cp-radius-sm)', overflow: 'hidden', border: '1px solid var(--cp-border)' },
  stackSeg: { height: '100%' },
  stackLegend: { display: 'flex', gap: 'var(--cp-space-4)', marginTop: 'var(--cp-space-2)', fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-body)' },
  dot: { display: 'inline-block', width: 'var(--cp-font-micro)', height: 'var(--cp-font-micro)', borderRadius: 'var(--cp-radius-xs)', marginRight: 'var(--cp-space-1)', verticalAlign: 'middle' },
  splitWrap: { marginTop: 'var(--cp-space-3)' },
  splitRow: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', marginBottom: 'var(--cp-space-1)' },
  splitName: { fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-body)', width: 'calc(var(--cp-space-9) * 2 + var(--cp-space-1))', flexShrink: 0 },
  splitTrack: { flex: 1, height: 'var(--cp-space-2)', borderRadius: 'var(--cp-radius-pill)', background: 'var(--cp-surface-0)', overflow: 'hidden' },
  splitFill: { height: '100%', background: 'var(--cp-accent)', borderRadius: 'var(--cp-radius-pill)' },
  splitPct: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', width: 'calc(var(--cp-space-9) - var(--cp-space-1))', textAlign: 'right', fontFamily: 'ui-monospace, monospace' },

  // Timeline
  timeline: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)' },
  tlRow: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)' },
  tlLabel: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-body)', flex: '0 0 38%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  tlTrack: { position: 'relative', flex: 1, height: 'var(--cp-font-micro)', borderRadius: 'var(--cp-radius-pill)', background: 'var(--cp-surface-0)' },
  tlBar: { position: 'absolute', top: 'var(--cp-space-0)', height: '100%', background: 'var(--cp-accent)', borderRadius: 'var(--cp-radius-pill)' },
  tlMonths: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', flex: '0 0 calc(var(--cp-space-12) + var(--cp-space-2))', textAlign: 'right' },

  // Benchmark
  benchList: { margin: 'var(--cp-space-0)', padding: 'var(--cp-space-0)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)' },
  benchRow: { display: 'grid', gridTemplateColumns: '1fr auto', gap: 'var(--cp-space-0) var(--cp-space-2)', alignItems: 'baseline', paddingBottom: 'var(--cp-space-1)', borderBottom: '1px solid var(--cp-border)' },
  benchName: { fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)' },
  benchValue: { fontSize: 'var(--cp-font-base)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' },
  benchMetric: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)' },
  benchSrc: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-faint)', fontFamily: 'ui-monospace, monospace', gridColumn: '1 / -1' },

  // Cashflow
  cashWrap: { display: 'flex', alignItems: 'flex-end', gap: 'var(--cp-space-1)', height: 'calc(var(--cp-space-6) * 5)' },
  cashCol: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--cp-space-1)', height: '100%' },
  cashBars: { display: 'flex', alignItems: 'flex-end', gap: 'calc(var(--cp-space-1) / 2)', flex: 1, width: '100%', justifyContent: 'center' },
  cashBar: { width: 'calc(var(--cp-space-2) - var(--cp-space-1) / 4)', borderRadius: 'var(--cp-radius-xs) var(--cp-radius-xs) 0 0', minHeight: 'calc(var(--cp-space-1) / 2)' },
  cashYr: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },

  // ── Analytics ──
  analytics: { display: 'flex', flexDirection: 'column' },
  analyticsBlock: { padding: 'var(--cp-space-4) var(--cp-space-0)', borderBottom: '1px solid var(--cp-border)' },
  analyticsTitle: { fontSize: 'var(--cp-font-md)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', margin: 'var(--cp-space-0) var(--cp-space-0) var(--cp-space-2)' },
  bullets: { margin: 'var(--cp-space-1) var(--cp-space-0)', paddingLeft: 'var(--cp-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)', fontSize: 'var(--cp-font-base)', color: 'var(--cp-text-body)', lineHeight: 'var(--cp-leading-normal)' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)' },
  th: { textAlign: 'left', padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-muted)', borderBottom: '1px solid var(--cp-border)', fontWeight: 'var(--cp-weight-semibold)', textTransform: 'uppercase', fontSize: 'var(--cp-font-xs)' },
  td: { padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-body)', verticalAlign: 'middle', borderBottom: '1px solid var(--cp-border)' },
  tdMuted: { padding: 'var(--cp-space-2) var(--cp-space-3)', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs)', verticalAlign: 'middle', borderBottom: '1px solid var(--cp-border)' },
  unit: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)' },
  configTable: { width: '100%', borderCollapse: 'collapse', fontSize: 'var(--cp-font-sm)', marginTop: 'var(--cp-space-2)' },
  configKey: { padding: 'var(--cp-space-1) var(--cp-space-3)', borderBottom: '1px solid var(--cp-border)', ...EYEBROW, width: 'calc(var(--cp-space-8) * 5)', verticalAlign: 'top' },
  configVal: { padding: 'var(--cp-space-1) var(--cp-space-3)', borderBottom: '1px solid var(--cp-border)', color: 'var(--cp-text-primary)', fontSize: 'var(--cp-font-sm)' },
  sourceList: { margin: 'var(--cp-space-0)', padding: 'var(--cp-space-0)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-1)' },
  sourceItem: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-1)', flexWrap: 'wrap', fontSize: 'var(--cp-font-xs)' },
  sourceId: { fontFamily: 'ui-monospace, monospace', color: 'var(--cp-text-primary)', fontSize: 'var(--cp-font-xs)' },
  sourceMeta: { color: 'var(--cp-text-muted)' },

  // ── Version bar + appendix ──
  versionChip: { padding: 'var(--cp-space-1) var(--cp-space-3)', borderRadius: 'var(--cp-radius-pill)', fontSize: 'var(--cp-font-sm)', fontWeight: 'var(--cp-weight-semibold)', border: '1px solid var(--cp-border)', background: 'var(--cp-surface-1)', color: 'var(--cp-text-muted)', cursor: 'pointer' },
  versionChipActive: { background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', borderColor: 'var(--cp-border-strong)' },

  appendixBtn: { width: '100%', padding: 'var(--cp-space-3) var(--cp-space-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' },
  appendixLabel: { ...EYEBROW },
  appendixChevron: { fontSize: 'var(--cp-font-lg)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  appendixBody: { padding: 'var(--cp-space-0) var(--cp-space-4) var(--cp-space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-4)' },
  pre: { margin: 'var(--cp-space-0)', padding: 'var(--cp-space-3)', borderRadius: 'var(--cp-radius-sm)', background: 'var(--cp-surface-0)', border: '1px solid var(--cp-border)', color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs)', lineHeight: 'var(--cp-leading-normal)', overflowX: 'auto', fontFamily: 'ui-monospace, monospace' },
  tensionList: { margin: 'var(--cp-space-0)', padding: 'var(--cp-space-0)', listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)' },
  tensionItem: { borderLeft: '3px solid var(--cp-border-strong)', paddingLeft: 'var(--cp-space-3)' },
  tensionId: { ...EYEBROW, color: 'var(--cp-text-primary)', fontFamily: 'ui-monospace, monospace' },

  // ── Shared (list/scenario views) ──
  sectionHeader: { marginBottom: 'var(--cp-space-5)' },
  link: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 'var(--cp-weight-medium)' },
  // Cellule titre : libellé long et répété → on borne la largeur (ellipsis) pour ne pas
  // affamer la colonne scénario (sinon noms de scénario à la ligne sur 5-6 lignes).
  titleCell: { maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // Le nom de scénario est l'identifiant clé de la ligne → une seule ligne, jamais coupé.
  scenarioCell: { whiteSpace: 'nowrap' },
  muted: { color: 'var(--cp-text-faint)' },
  pdf: { color: 'var(--cp-accent)', textDecoration: 'none', fontWeight: 'var(--cp-weight-semibold)', fontSize: 'var(--cp-font-sm)' },
  statusText: { fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', textTransform: 'capitalize' },
  breadcrumb: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-1)', fontSize: 'var(--cp-font-sm)', color: 'var(--cp-text-muted)', marginBottom: 'var(--cp-space-5)' },
  breadcrumbLink: { color: 'var(--cp-accent)', textDecoration: 'none' },
  breadcrumbSep: { color: 'var(--cp-text-faint)' },
  memoCardList: { display: 'flex', flexDirection: 'column', gap: 'var(--cp-space-2)' },
  memoCardTop: { display: 'flex', alignItems: 'center', gap: 'var(--cp-space-2)', marginBottom: 'var(--cp-space-1)' },
  memoCardVersion: { fontSize: 'var(--cp-font-xs)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  memoCardStatus: { fontSize: 'var(--cp-font-micro)', color: 'var(--cp-text-muted)', textTransform: 'capitalize' },
  memoCardTitle: { fontSize: 'var(--cp-font-md)', fontWeight: 'var(--cp-weight-bold)', color: 'var(--cp-text-primary)', marginBottom: 'var(--cp-space-1)' },
  memoCardMeta: { display: 'flex', gap: 'var(--cp-space-3)', fontSize: 'var(--cp-font-xs)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },

};
