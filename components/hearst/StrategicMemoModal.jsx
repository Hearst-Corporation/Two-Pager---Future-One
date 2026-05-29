'use client';

// StrategicMemoModal — Sprint 1.
//
// Drawer/modal plein écran qui appelle /api/admin/hearst/strategic-memo et
// rend les 11 sections + confidence block en format institutionnel
// (boardroom-ready, pas markdown raw).
//
// Props :
//   open          : boolean
//   onClose       : () => void
//   payload       : { scenario, projection, archetype_outcome, hardware_breakdown, source_map, confidence_score }
//   oracle?       : { stakeholder?, region?, overlays? }
//   userQuestion? : string (optional contextual question to seed the memo)
//   title?        : string (header title — defaults to "Strategic Memo")
//
// Aucun token hex, tout via var(--cp-*).
// Aucune refonte d'autre composant. Pure addition.

import { useEffect, useMemo, useState, useCallback } from 'react';
import ScenarioVisualizer from '@/components/hearst/ScenarioVisualizer';
import {
  useMemoJob,
  startMemoJob,
  hideMemoModal,
  formatElapsed,
} from '@/lib/hearst-memo-job-store';

const CONFIDENCE_TONE = {
  HIGH:   { color: 'var(--ct-status-success)',  bg: 'var(--ct-status-success-soft)',  border: 'var(--ct-status-success-border)' },
  MEDIUM: { color: 'var(--ct-status-warning)',  bg: 'var(--ct-status-warning-soft)',  border: 'var(--ct-status-warning-border)' },
  LOW:    { color: 'var(--ct-status-danger)',   bg: 'var(--ct-status-danger-soft)',   border: 'var(--ct-status-danger-border)' },
};

const SEVERITY_TONE = CONFIDENCE_TONE;

function ConfidenceTag({ level }) {
  const lvl = (level || 'MEDIUM').toUpperCase();
  const tone = CONFIDENCE_TONE[lvl] || CONFIDENCE_TONE.MEDIUM;
  return (
    <span style={{ ...S.tag, background: tone.bg, color: tone.color, border: `1px solid ${tone.border}` }}>
      {lvl === 'HIGH' ? 'HIGH CONFIDENCE' : lvl === 'LOW' ? 'LOW VISIBILITY' : 'MEDIUM CONFIDENCE'}
    </span>
  );
}

function Section({ id, label, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section style={S.section} aria-labelledby={`memo-${id}-h`}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        style={S.sectionHead}
        id={`memo-${id}-h`}
      >
        <span style={S.sectionLabel}>{label}</span>
        <span style={S.sectionChevron}>{open ? '−' : '+'}</span>
      </button>
      {open && <div style={S.sectionBody}>{children}</div>}
    </section>
  );
}

/**
 * Timeline live affichée pendant le loading.
 *
 * Sprint 3.2 — Honnêteté :
 *   On NE PEUT PAS savoir côté client où en est la cascade serveur (pas de
 *   SSE pour l'instant). Donc :
 *     - On affiche l'elapsed time (vrai)
 *     - On affiche tous les modèles de la cascade en énumération sans
 *       marquer un actif (on mentirait)
 *     - On ajoute une jauge de progression vs SLA cible (90s) pour donner
 *       au user un signal de "normal vs anormal"
 *   Quand le memo est done, meta.model_used montre le vrai modèle qui a
 *   répondu, et meta.timing_ms.llm donne la vraie durée.
 */
const SLA_TARGET_MS = 60_000;   // Cible normale : <60s
const SLA_WARNING_MS = 120_000; // Au-delà : c'est lent
const SLA_DANGER_MS = 240_000;  // Au-delà : très anormal

function MemoTimeline({ elapsedMs, cascade }) {
  const pct = Math.min(100, (elapsedMs / SLA_DANGER_MS) * 100);
  const slaTone =
    elapsedMs < SLA_TARGET_MS ? 'normal' :
    elapsedMs < SLA_WARNING_MS ? 'warning' :
    'danger';
  const slaLabel =
    slaTone === 'normal' ? 'within target' :
    slaTone === 'warning' ? 'slower than usual' :
    'cascade fallback in progress';
  const slaColor =
    slaTone === 'normal' ? 'var(--ct-status-success)' :
    slaTone === 'warning' ? 'var(--ct-status-warning)' :
    'var(--ct-status-danger)';

  return (
    <div style={S.timelineWrap}>
      <div style={S.timelineHeader}>
        <span style={S.timelineSpinner} />
        <span style={S.timelineLabel}>Generating strategic memo…</span>
        <span style={S.timelineElapsed}>{formatElapsed(elapsedMs)}</span>
      </div>

      {/* Jauge SLA — vraie information sur la latence vs target */}
      <div style={S.slaWrap}>
        <div style={S.slaBar}>
          <div style={{ ...S.slaFill, width: `${pct}%`, background: slaColor }} />
          <div style={{ ...S.slaTarget, left: `${(SLA_TARGET_MS / SLA_DANGER_MS) * 100}%` }} />
        </div>
        <div style={{ ...S.slaLabel, color: slaColor }}>{slaLabel}</div>
      </div>

      {/* Cascade énumérée sans mensonge sur le stage actuel.
          Le vrai modèle utilisé sera révélé quand le memo arrive (meta.model_used). */}
      <div style={S.cascadeWrap}>
        <div style={S.cascadeLabel}>Fallback chain :</div>
        <div style={S.cascadeList}>
          {cascade.map((model) => (
            <span key={model} style={S.cascadeChip}>{model}</span>
          ))}
          <span style={{ ...S.cascadeChip, ...S.cascadeChipFallback }}>claude-sonnet-4-6</span>
          <span style={{ ...S.cascadeChip, ...S.cascadeChipFallback }}>gpt-4o</span>
        </div>
      </div>

      <div style={S.timelineHint}>
        Vous pouvez fermer cette fenêtre — le memo continue d'être généré en arrière-plan.
        Vous serez notifié quand il sera prêt.
      </div>
    </div>
  );
}

function toMarkdown(memo, meta) {
  if (!memo) return '';
  const lines = [];
  lines.push(`# Strategic Memo — ${new Date().toISOString().slice(0, 10)}`);
  lines.push('');
  if (meta) {
    lines.push(`_Generated by ORACLE · stakeholder=${meta.oracle_ctx?.stakeholder} · region=${meta.oracle_ctx?.region} · overlays=[${(meta.oracle_ctx?.overlays || []).join(', ')}] · model=${meta.model_used}_`);
    lines.push('');
  }
  // Executive Summary
  if (memo.executive_summary) {
    lines.push('## 1. Executive Summary');
    lines.push(`**${memo.executive_summary.headline || ''}**  · _${memo.executive_summary.overall_confidence || 'MED'} CONFIDENCE_`);
    for (const b of memo.executive_summary.bullets || []) lines.push(`- ${b}`);
    lines.push('');
  }
  // Confidence
  if (memo.confidence_block) {
    lines.push('## Confidence');
    const c = memo.confidence_block;
    lines.push(`- Overall : **${c.confidence_level}**`);
    lines.push(`- Source density : ${c.source_density}`);
    lines.push(`- Estimation quality : ${c.estimation_quality}`);
    if (c.known_unknowns?.length) {
      lines.push('- Known unknowns :');
      for (const u of c.known_unknowns) lines.push(`  - ${u}`);
    }
    lines.push('');
  }
  const blocks = [
    ['2. Strategic Context', 'strategic_context', m => m.skip ? '_Not material for this question._' : m.body],
    ['3. Key Financial Metrics', 'key_financial_metrics', m => {
      const rows = (m.metrics || []).map(x => `| ${x.label} | ${x.value} ${x.unit || ''} | ${x.confidence} | ${x.source || '—'} |`).join('\n');
      return `| Metric | Value | Conf. | Source |\n|---|---|---|---|\n${rows}\n\n${m.narrative || ''}`;
    }],
    ['4. Infrastructure Analysis', 'infrastructure_analysis', m => {
      const t = (m.tradeoffs || []).map(x => `- ${x}`).join('\n');
      return `${m.body || ''}\n\n**Trade-offs**\n${t}`;
    }],
    ['5. Market Benchmarking', 'market_benchmarking', m => (m.comparables || []).map(c => `- **${c.name}** — ${c.metric} : ${c.value} _(${c.source})_`).join('\n')],
    ['6. Risks & Constraints', 'risks_constraints', m => (m.items || []).map(r => `- **[${r.severity}]** ${r.label} _(${r.category})_ — mitigation : ${r.mitigation}${r.dependency ? ` · dep : ${r.dependency}` : ''}`).join('\n')],
    ['7. Strategic Opportunities', 'strategic_opportunities', m => (m.items || []).map(o => `- **${o.label}** _(${o.confidence})_ — ${o.execution_path}`).join('\n')],
    ['8. Recommended Architecture', 'recommended_architecture', m => {
      const c = m.config || {};
      return `- MW : ${c.mw}\n- Tier : ${c.tier}\n- Cooling : ${c.cooling}\n- Rack mix : ${c.rack_mix}\n- GPU SKU : ${c.gpu_sku}\n- Networking : ${c.networking}\n- Phasing : ${c.phasing}\n\n${m.rationale || ''}`;
    }],
    ['9. Commercialization Strategy', 'commercialization_strategy', m => `- Pricing : ${m.pricing}\n- Contract : ${m.contract_structure}\n- Anchor tenant : ${m.anchor_tenant}\n- Ramp : ${m.ramp_profile}`],
    ['10. Deployment Roadmap', 'deployment_roadmap', m => {
      const phases = (m.phases || []).map(p => `- **${p.label}** (+${p.months_from_t0}) : ${(p.gating_events || []).join(', ')}`).join('\n');
      const flags = (m.reality_check_flags || []).map(f => `> ⚠ ${f}`).join('\n');
      return `${phases}\n\n${flags}`;
    }],
    ['11. Long-Term Strategic Value', 'long_term_strategic_value', m => `${m.ten_year_arc || ''}\n\n${(m.speculative_branches || []).map(s => `- _(LOW VIS)_ ${s}`).join('\n')}`],
  ];
  for (const [title, key, fn] of blocks) {
    if (!memo[key]) continue;
    lines.push(`## ${title}`);
    lines.push(fn(memo[key]));
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * StrategicMemoModal — view layer pour le store memo-job global.
 *
 * Le state (loading / memo / error / elapsed) est désormais dans
 * lib/hearst-memo-job-store.js → le job survit à la fermeture de la modale,
 * un badge bottom-right reprend le relais visuel, et un toast s'affiche au
 * done.
 *
 * Props legacy `open` / `onClose` / `payload` / `oracle` / `userQuestion`
 * / `audience` / `title` restent acceptés pour ne pas casser les callers,
 * mais ils sont ignorés silencieusement — c'est `startMemoJob({...})` qui
 * pilote l'ouverture et le payload désormais.
 */
export default function StrategicMemoModal(_legacyProps) {
  const job = useMemoJob();
  const open    = job.modal_visible;
  const loading = job.status === 'loading';
  const error   = job.status === 'error' ? job.error : null;
  const memo    = job.result?.memo || null;
  const meta    = job.result?.meta || null;
  const title   = job.request?.title || 'Strategic Memo';

  const refetch = useCallback(() => {
    if (job.request) startMemoJob(job.request);
  }, [job.request]);

  // ESC ferme la modale (sans tuer le job)
  useEffect(() => {
    if (!open) return;
    function onKey(e) { if (e.key === 'Escape') hideMemoModal(); }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const md = useMemo(() => toMarkdown(memo, meta), [memo, meta]);

  function downloadMd() {
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `strategic-memo-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function copyMd() {
    if (navigator?.clipboard?.writeText) navigator.clipboard.writeText(md);
  }
  function printMemo() { window.print(); }

  if (!open) return null;

  // Backdrop click : ferme la modale visuellement mais NE TUE PAS le job en cours.
  // Le badge bottom-right + toast prennent le relais. Click intérieur stopPropagation.
  return (
    <div style={S.backdrop} role="dialog" aria-label={title} onClick={hideMemoModal}>
      <div style={S.modal} onClick={e => e.stopPropagation()}>
        <header style={S.head}>
          <div>
            <h2 style={S.title}>{title}</h2>
            {meta && (
              <div style={S.meta}>
                <span>{meta.oracle_ctx.stakeholder} · {meta.oracle_ctx.region}</span>
                {meta.oracle_ctx.overlays?.length > 0 && <span> · {meta.oracle_ctx.overlays.join(', ')}</span>}
                <span> · {meta.model_used}</span>
                <span> · {new Date(meta.generated_at).toLocaleString()}</span>
              </div>
            )}
            {meta && (
              <div style={S.intelChips}>
                {meta.audience && (
                  <span style={{ ...S.intelChip, background: 'var(--cp-accent-soft, var(--cp-surface-0))', color: 'var(--cp-accent)', border: '1px solid var(--cp-accent-border, var(--cp-border))' }}
                    title="Memo audience profile">
                    {meta.audience}
                  </span>
                )}
                {/* Reduced to 3 chips max (audience already above) :
                    sources + tensions + memo_quality grade. Reality flags
                    surface only when present (warning-toned). Comparables
                    and live signals counts dropped — visible in their
                    respective sections. */}
                {meta.intelligence_brief && (
                  <>
                    <span style={S.intelChip} title="Datapoints injected from the intelligence layer">
                      {meta.intelligence_brief.datapoints_count} sources
                    </span>
                    <span style={S.intelChip} title="Decision tensions surfaced">
                      {meta.intelligence_brief.tensions_count} tensions
                    </span>
                    {meta.intelligence_brief.reality_violations_count > 0 && (
                      <span style={{ ...S.intelChip, background: 'var(--ct-status-warning-soft)', color: 'var(--ct-status-warning)', border: '1px solid var(--ct-status-warning-border)' }}
                        title="Reality-layer violations detected (operationally constrained)"
                      >
                        {meta.intelligence_brief.reality_violations_count} reality flags
                      </span>
                    )}
                  </>
                )}
                {memo?.memo_quality?.overall_grade && (
                  <span style={{
                    ...S.intelChip,
                    background: memo.memo_quality.overall_grade === 'A' ? 'var(--ct-status-success-soft)'
                      : memo.memo_quality.overall_grade === 'B' ? 'var(--cp-surface-0)'
                      : 'var(--ct-status-warning-soft)',
                    color: memo.memo_quality.overall_grade === 'A' ? 'var(--ct-status-success)'
                      : memo.memo_quality.overall_grade === 'B' ? 'var(--cp-text-muted)'
                      : 'var(--ct-status-warning)',
                    border: '1px solid var(--cp-border)',
                  }}
                    title="Memo quality grade (banned phrases + citations + tradeoffs + tensions)">
                    grade {memo.memo_quality.overall_grade}
                  </span>
                )}
              </div>
            )}
          </div>
          <div style={S.actions}>
            <button type="button" onClick={refetch} disabled={loading} style={S.actionBtn} title="Regenerate">↻</button>
            <button type="button" onClick={copyMd} disabled={!memo} style={S.actionBtn} title="Copy markdown">⧉</button>
            <button type="button" onClick={downloadMd} disabled={!memo} style={S.actionBtn} title="Download .md">↓</button>
            <button type="button" onClick={printMemo} disabled={!memo} style={S.actionBtn} title="Print / Save PDF">⎙</button>
            <button type="button" onClick={hideMemoModal} style={S.closeBtn} aria-label="Close (job continues in background)">×</button>
          </div>
        </header>

        <div style={S.body}>
          {loading && <MemoTimeline elapsedMs={job.elapsed_ms} cascade={job.cascade} />}
          {error && <div style={S.error}>Error : {error}</div>}
          {memo && (
            <article style={S.memo}>
              {/* Executive Summary — toujours ouvert */}
              {memo.executive_summary && (
                <div style={S.execBlock}>
                  <div style={S.execHead}>
                    <span style={S.execNum}>01</span>
                    <span style={S.execTitle}>Executive Summary</span>
                    <ConfidenceTag level={memo.executive_summary.overall_confidence} />
                  </div>
                  {memo.executive_summary.headline && (
                    <p style={S.headline}>{memo.executive_summary.headline}</p>
                  )}
                  <ul style={S.bullets}>
                    {(memo.executive_summary.bullets || []).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                </div>
              )}

              {/* Confidence block — toujours ouvert */}
              {memo.confidence_block && (
                <div style={S.confBlock}>
                  <div style={S.confHead}>
                    <span style={S.confLabel}>Confidence</span>
                    <ConfidenceTag level={memo.confidence_block.confidence_level} />
                    <span style={S.confDensity}>{memo.confidence_block.source_density}</span>
                  </div>
                  <p style={S.confEst}>{memo.confidence_block.estimation_quality}</p>
                  {memo.confidence_block.known_unknowns?.length > 0 && (
                    <div style={S.unknowns}>
                      <div style={S.unknownsLabel}>Known unknowns</div>
                      <ul>{memo.confidence_block.known_unknowns.map((u, i) => <li key={i}>{u}</li>)}</ul>
                    </div>
                  )}
                </div>
              )}

              {/* Strategic Context */}
              {memo.strategic_context && !memo.strategic_context.skip && (
                <Section id="ctx" label="02 · Strategic Context">
                  <p>{memo.strategic_context.body}</p>
                </Section>
              )}

              {/* Key Financial Metrics */}
              {memo.key_financial_metrics && (
                <Section id="fin" label="03 · Key Financial Metrics">
                  <table style={S.table}>
                    <thead><tr><th style={S.th}>Metric</th><th style={S.th}>Value</th><th style={S.th}>Conf.</th><th style={S.th}>Source</th></tr></thead>
                    <tbody>
                      {(memo.key_financial_metrics.metrics || []).map((m, i) => (
                        <tr key={i}>
                          <td style={S.td}>{m.label}</td>
                          <td style={S.td}><strong>{m.value}</strong> {m.unit && <span style={S.unit}>{m.unit}</span>}</td>
                          <td style={S.td}><ConfidenceTag level={m.confidence} /></td>
                          <td style={S.tdMuted}>{m.source || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {memo.key_financial_metrics.narrative && <p style={S.narrative}>{memo.key_financial_metrics.narrative}</p>}
                </Section>
              )}

              {/* Infrastructure Analysis */}
              {memo.infrastructure_analysis && (
                <Section id="infra" label="04 · Infrastructure Analysis">
                  <p>{memo.infrastructure_analysis.body}</p>
                  {memo.infrastructure_analysis.tradeoffs?.length > 0 && (
                    <>
                      <div style={S.sublabel}>Trade-offs</div>
                      <ul>{memo.infrastructure_analysis.tradeoffs.map((t, i) => <li key={i}>{t}</li>)}</ul>
                    </>
                  )}
                </Section>
              )}

              {/* Market Benchmarking */}
              {memo.market_benchmarking && (
                <Section id="bench" label="05 · Market Benchmarking">
                  <ul style={S.compList}>
                    {(memo.market_benchmarking.comparables || []).map((c, i) => (
                      <li key={i}><strong>{c.name}</strong> — {c.metric} : <strong>{c.value}</strong> <span style={S.cite}>({c.source})</span></li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Risks & Constraints */}
              {memo.risks_constraints && (
                <Section id="risks" label="06 · Risks & Constraints">
                  <ul style={S.riskList}>
                    {(memo.risks_constraints.items || []).map((r, i) => {
                      const tone = SEVERITY_TONE[(r.severity || 'MED').toUpperCase()] || SEVERITY_TONE.MEDIUM;
                      return (
                        <li key={i} style={{ borderLeft: `3px solid ${tone.color}`, paddingLeft: 10 }}>
                          <div><strong>{r.label}</strong> <span style={S.cat}>· {r.category}</span></div>
                          <div style={S.mit}>Mitigation : {r.mitigation}</div>
                          {r.dependency && <div style={S.dep}>Dependency : {r.dependency}</div>}
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {/* Strategic Opportunities */}
              {memo.strategic_opportunities && (
                <Section id="opp" label="07 · Strategic Opportunities">
                  <ul style={S.oppList}>
                    {(memo.strategic_opportunities.items || []).map((o, i) => (
                      <li key={i}>
                        <strong>{o.label}</strong> <ConfidenceTag level={o.confidence} />
                        <div style={S.exec}>Execution : {o.execution_path}</div>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Recommended Architecture */}
              {memo.recommended_architecture && (
                <Section id="arch" label="08 · Recommended Architecture">
                  <table style={S.configTable}>
                    <tbody>
                      {Object.entries(memo.recommended_architecture.config || {}).map(([k, v]) => (
                        <tr key={k}><td style={S.configKey}>{k}</td><td style={S.configVal}>{v}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  {memo.recommended_architecture.rationale && <p style={S.narrative}>{memo.recommended_architecture.rationale}</p>}
                </Section>
              )}

              {/* Commercialization Strategy */}
              {memo.commercialization_strategy && (
                <Section id="comm" label="09 · Commercialization Strategy">
                  <table style={S.configTable}>
                    <tbody>
                      <tr><td style={S.configKey}>Pricing</td><td style={S.configVal}>{memo.commercialization_strategy.pricing}</td></tr>
                      <tr><td style={S.configKey}>Contract structure</td><td style={S.configVal}>{memo.commercialization_strategy.contract_structure}</td></tr>
                      <tr><td style={S.configKey}>Anchor tenant</td><td style={S.configVal}>{memo.commercialization_strategy.anchor_tenant}</td></tr>
                      <tr><td style={S.configKey}>Ramp profile</td><td style={S.configVal}>{memo.commercialization_strategy.ramp_profile}</td></tr>
                    </tbody>
                  </table>
                </Section>
              )}

              {/* Deployment Roadmap */}
              {memo.deployment_roadmap && (
                <Section id="roadmap" label="10 · Deployment Roadmap">
                  <ol style={S.phaseList}>
                    {(memo.deployment_roadmap.phases || []).map((p, i) => (
                      <li key={i}>
                        <strong>{p.label}</strong> <span style={S.phaseTime}>+{p.months_from_t0} mo</span>
                        {p.gating_events?.length > 0 && (
                          <ul style={S.gating}>{p.gating_events.map((g, j) => <li key={j}>{g}</li>)}</ul>
                        )}
                      </li>
                    ))}
                  </ol>
                  {memo.deployment_roadmap.reality_check_flags?.length > 0 && (
                    <div style={S.realityFlags}>
                      <div style={S.realityLabel}>Reality-check flags</div>
                      {memo.deployment_roadmap.reality_check_flags.map((f, i) => (
                        <div key={i} style={S.realityFlag}>⚠ {f}</div>
                      ))}
                    </div>
                  )}
                </Section>
              )}

              {/* Long-Term Strategic Value */}
              {memo.long_term_strategic_value && (
                <Section id="lt" label="11 · Long-Term Strategic Value">
                  <p>{memo.long_term_strategic_value.ten_year_arc}</p>
                  {memo.long_term_strategic_value.speculative_branches?.length > 0 && (
                    <>
                      <div style={S.sublabel}>Speculative branches <ConfidenceTag level="LOW" /></div>
                      <ul>{memo.long_term_strategic_value.speculative_branches.map((s, i) => <li key={i}>{s}</li>)}</ul>
                    </>
                  )}
                </Section>
              )}

              {/* Decision Tensions — explicit tradeoffs */}
              {memo.decision_tensions?.length > 0 && (
                <Section id="tensions" label="Decision tensions · explicit tradeoffs">
                  <ul style={S.tensionList}>
                    {memo.decision_tensions.map((t, i) => {
                      const brief = meta?.intelligence_brief?.tensions?.find(x => x.id === t.id);
                      return (
                        <li key={i} style={S.tensionItem}>
                          <div style={S.tensionLabel}>{brief?.label || t.id}</div>
                          {brief && (
                            <div style={S.tensionPoles}>
                              <span style={S.poleA}>A · {brief.pole_a?.name}</span>
                              <span style={S.poleSep}>vs</span>
                              <span style={S.poleB}>B · {brief.pole_b?.name}</span>
                            </div>
                          )}
                          <div style={S.tensionVerdict}>{t.verdict}</div>
                        </li>
                      );
                    })}
                  </ul>
                </Section>
              )}

              {/* Live Intelligence Block */}
              {(() => {
                const li = memo?.live_intelligence || null;
                const freshnessTag = (tag) => {
                  const MAP = {
                    FRESH: { bg: 'var(--ct-status-success-soft)', color: 'var(--ct-status-success)', border: 'var(--ct-status-success-border)' },
                    OK: { bg: 'var(--ct-status-success-soft)', color: 'var(--ct-status-success)', border: 'var(--ct-status-success-border)' },
                    STALE: { bg: 'var(--ct-status-warning-soft)', color: 'var(--ct-status-warning)', border: 'var(--ct-status-warning-border)' },
                    EXPIRED: { bg: 'var(--ct-status-danger-soft)', color: 'var(--ct-status-danger)', border: 'var(--ct-status-danger-border)' },
                    NO_LIVE_DATA: { bg: 'var(--cp-surface-0)', color: 'var(--cp-text-muted)', border: 'var(--cp-border)' },
                  };
                  const tone = MAP[(tag || 'NO_LIVE_DATA').toUpperCase()] || MAP.NO_LIVE_DATA;
                  return <span style={{ ...S.tag, ...tone }}>{tag || 'NO_LIVE_DATA'}</span>;
                };
                return (
                  <Section id="live-intel" label="Infrastructure Intelligence">
                    {li ? (
                      <>
                        <div style={S.liveRow}>
                          <span style={S.liveLabel}>GPU Pricing</span>
                          {freshnessTag(li.gpu_pricing?.freshness_tag)}
                          <span style={S.liveVal}>{li.gpu_pricing?.summary || 'No summary'}</span>
                        </div>
                        <div style={S.liveRow}>
                          <span style={S.liveLabel}>Energy</span>
                          {freshnessTag(li.energy?.freshness_tag)}
                          <span style={S.liveVal}>{li.energy?.summary || 'No summary'}</span>
                          {li.energy?.tariff_used && <span style={S.cite}>tariff: {li.energy.tariff_used}</span>}
                        </div>
                        {li.signals?.length > 0 && (
                          <div style={{ marginTop: 10 }}>
                            <div style={S.sublabel}>Infrastructure signals</div>
                            <ul style={S.riskList}>
                              {li.signals.map((sig, i) => {
                                const tone = SEVERITY_TONE[(sig.severity || 'MEDIUM').toUpperCase()] || SEVERITY_TONE.MEDIUM;
                                return (
                                  <li key={i} style={{ borderLeft: `3px solid ${tone.color}`, paddingLeft: 10 }}>
                                    <div><strong>{sig.title}</strong> <span style={S.cat}>· {sig.severity}</span></div>
                                    {sig.implication && <div style={S.mit}>{sig.implication}</div>}
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        )}
                        {li.freshness_summary && <p style={{ ...S.narrative, fontStyle: 'italic', marginTop: 10 }}>{li.freshness_summary}</p>}
                        {li.volatility_summary && <p style={{ ...S.narrative, fontStyle: 'italic' }}>{li.volatility_summary}</p>}
                      </>
                    ) : (
                      <div style={S.liveNoData}>
                        Live data layer wired but not yet active.{' '}
                        <a href="/api/admin/hearst/gpu-prices" target="_blank" rel="noreferrer" style={S.sourceLink}>
                          Check /api/admin/hearst/gpu-prices
                        </a>
                      </div>
                    )}
                  </Section>
                );
              })()}

              {/* Visualization Preview Block */}
              {(() => {
                const vizMeta = memo?.visualization || meta?.visualization || null;
                const hasViz = vizMeta != null;
                return hasViz ? (
                  <Section id="viz" label="Visualization Preview">
                    {vizMeta.summary && <p style={S.narrative}>{vizMeta.summary}</p>}
                    {vizMeta.topology_summary && <p style={S.narrative}>{vizMeta.topology_summary}</p>}
                    <div style={S.vizWrapper}>
                      <ScenarioVisualizer simulation={job.request?.payload} mode="auto" />
                    </div>
                  </Section>
                ) : null;
              })()}

              {/* Beginner Explanation Block */}
              {(() => {
                const exp = memo?.explainability || null;
                if (!exp) return null;
                return (
                  <Section id="explain" label="Explanation · plain language">
                    <div style={S.audienceChipRow}>
                      <span style={S.sublabel}>Audience</span>
                      <span style={{ ...S.tag, background: 'var(--cp-accent-soft, var(--cp-surface-0))', color: 'var(--cp-accent)', border: '1px solid var(--cp-accent-border, var(--cp-border))' }}>
                        {exp.audience || meta?.audience || 'investor'}
                      </span>
                    </div>
                    {exp.simplified_takeaways?.length > 0 && (
                      <>
                        <div style={S.sublabel}>Key takeaways</div>
                        <ul style={S.bullets}>
                          {exp.simplified_takeaways.map((t, i) => <li key={i}>{t}</li>)}
                        </ul>
                      </>
                    )}
                    {exp.jargon_translations && Object.keys(exp.jargon_translations).length > 0 && (
                      <>
                        <div style={{ ...S.sublabel, marginTop: 12 }}>Glossary</div>
                        <table style={S.table}>
                          <tbody>
                            {Object.entries(exp.jargon_translations).map(([term, def]) => (
                              <tr key={term}>
                                <td style={S.configKey}>{term}</td>
                                <td style={S.configVal}>{def}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </>
                    )}
                    {exp.why_this_recommendation && (
                      <div style={S.whyBox}>
                        <div style={S.sublabel}>Why this recommendation</div>
                        <p style={S.narrative}>{exp.why_this_recommendation}</p>
                      </div>
                    )}
                  </Section>
                );
              })()}

              {/* Intelligence layer sources actually used */}
              {meta?.intelligence_brief && (
                <Section id="intel" label="Intelligence layer · sources used">
                  {memo.intelligence_sources?.length > 0 && (
                    <>
                      <div style={S.sublabel}>Datapoints cited</div>
                      <ul style={S.sourceList}>
                        {memo.intelligence_sources.map((s, i) => {
                          const dp = meta.intelligence_brief.datapoints?.find(x => x.id === s.datapoint_id);
                          return (
                            <li key={i} style={S.sourceItem}>
                              <span style={S.sourceId}>{s.datapoint_id}</span>
                              <ConfidenceTag level={s.trust} />
                              <span style={S.sourceUsed}>· {s.used_for}</span>
                              {dp?.source_name && (
                                <span style={S.sourceMeta}>
                                  · {dp.source_name}
                                  {dp.url && <> · <a href={dp.url} target="_blank" rel="noreferrer" style={S.sourceLink}>↗</a></>}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}
                  {meta.intelligence_brief.comparables?.length > 0 && (
                    <>
                      <div style={{ ...S.sublabel, marginTop: 12 }}>Comparable peers (full profiles)</div>
                      <ul style={S.compFullList}>
                        {meta.intelligence_brief.comparables.map((c, i) => (
                          <li key={i} style={S.compFullItem}>
                            <strong>{c.entity_id}</strong>
                            <ul style={S.compDim}>
                              {Object.entries(c.profile || {}).slice(0, 5).map(([k, v]) => (
                                <li key={k}><em style={S.compKey}>{k}</em> : {v}</li>
                              ))}
                            </ul>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                  {meta.intelligence_brief.absorption && (
                    <>
                      <div style={{ ...S.sublabel, marginTop: 12 }}>Commercial absorption · {meta.intelligence_brief.absorption.label}</div>
                      <div style={S.absorption}>
                        <div>Demand maturity : <strong>{meta.intelligence_brief.absorption.demand_maturity}</strong></div>
                        <div>Realistic pipeline 2030 : <strong>{meta.intelligence_brief.absorption.realistic_pipeline_2030_mw} MW</strong></div>
                        <div>Oversupply risk 2027 : <strong>{meta.intelligence_brief.absorption.oversupply_risk_2027}</strong></div>
                        <div>Customer concentration risk : <strong>{meta.intelligence_brief.absorption.customer_concentration_risk}</strong></div>
                      </div>
                    </>
                  )}
                </Section>
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}

const S = {
  // Backdrop : z-index 1010 pour passer au-dessus du FAB chat (1002), badge (1002),
  // toast (1003) et chat rail droit. Couleur sombre + blur pour occulter le contenu.
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 1010,
    background: 'rgba(0, 0, 0, 0.72)',
    backdropFilter: 'blur(6px)',
    WebkitBackdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'center',
    padding: '32px 16px',
  },
  // Modal : fond OPAQUE (--ct-bg-deep est solide #1A050B, contrairement à
  // --cp-surface-* qui sont des rgba quasi-transparents). On empile :
  //   1. --cp-bg-deep en base (opaque)
  //   2. --cp-surface-2 par-dessus (légère élévation)
  // → boardroom-grade sans transparence parasite.
  modal: {
    width: '100%',
    maxWidth: 960,
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(var(--cp-surface-2), var(--cp-surface-2)), var(--cp-bg-deep)',
    border: '1px solid var(--cp-border-strong, var(--cp-border))',
    borderRadius: 14,
    overflow: 'hidden',
    boxShadow: '0 24px 64px -16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.06) inset',
  },

  head: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, padding: '16px 20px', borderBottom: '1px solid var(--cp-border)' },
  title: { fontSize: 16, fontWeight: 800, color: 'var(--cp-text-primary)', margin: 0, letterSpacing: 0.3 },
  meta: { fontSize: 10, color: 'var(--cp-text-muted)', marginTop: 4, fontFamily: 'ui-monospace, monospace' },

  actions: { display: 'flex', gap: 6 },
  actionBtn: { width: 32, height: 32, padding: 0, background: 'var(--cp-surface-2)', color: 'var(--cp-text-primary)', border: '1px solid var(--cp-border)', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  closeBtn: { width: 32, height: 32, padding: 0, background: 'transparent', color: 'var(--cp-text-muted)', border: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 },

  body: { padding: 20, overflowY: 'auto', flex: 1 },
  loading: { padding: 32, textAlign: 'center', color: 'var(--cp-text-muted)', fontSize: 13 },

  // Timeline (loading state) — visible transparency
  timelineWrap: {
    padding: '24px 20px',
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  timelineHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    fontSize: 13,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
  },
  timelineSpinner: {
    display: 'inline-block',
    width: 14,
    height: 14,
    borderRadius: '50%',
    border: '2px solid var(--cp-border)',
    borderTopColor: 'var(--cp-accent-maroon, var(--cp-accent))',
    animation: 'memo-spin 0.9s linear infinite',
  },
  timelineLabel: { flex: 1 },
  timelineElapsed: {
    fontFamily: 'ui-monospace, monospace',
    fontSize: 12,
    fontWeight: 800,
    color: 'var(--cp-text-strong)',
    fontVariantNumeric: 'tabular-nums',
  },
  // SLA bar — vraie info sur latence vs target
  slaWrap: { display: 'flex', flexDirection: 'column', gap: 4 },
  slaBar: {
    position: 'relative',
    height: 6,
    background: 'var(--cp-surface-0)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  slaFill: {
    position: 'absolute',
    inset: 0,
    right: 'auto',
    height: '100%',
    borderRadius: 999,
    transition: 'width 1s linear, background 300ms ease',
  },
  slaTarget: {
    position: 'absolute',
    top: -2,
    height: 10,
    width: 2,
    background: 'var(--cp-border-strong)',
  },
  slaLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Cascade enumeration (no false "active" stage — we don't have SSE)
  cascadeWrap: { display: 'flex', flexDirection: 'column', gap: 6 },
  cascadeLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--cp-text-muted)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cascadeList: {
    display: 'flex',
    gap: 6,
    flexWrap: 'wrap',
  },
  cascadeChip: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '3px 8px',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    fontSize: 10,
    fontFamily: 'ui-monospace, monospace',
    letterSpacing: 0.2,
  },
  cascadeChipFallback: {
    background: 'var(--cp-accent-soft, var(--cp-surface-0))',
    color: 'var(--cp-accent)',
    borderColor: 'var(--cp-accent-border, var(--cp-border))',
  },

  timelineHint: {
    fontSize: 11,
    color: 'var(--cp-text-muted)',
    fontStyle: 'italic',
    lineHeight: 1.5,
    paddingTop: 8,
    borderTop: '1px dashed var(--cp-border)',
  },
  error: { padding: 16, background: 'var(--ct-status-danger-soft)', color: 'var(--ct-status-danger)', border: '1px solid var(--ct-status-danger-border)', borderRadius: 10, fontSize: 12, fontWeight: 600 },

  memo: { display: 'flex', flexDirection: 'column', gap: 16 },

  execBlock: { padding: 20, background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 12 },
  execHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  execNum: { fontSize: 11, fontWeight: 800, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  execTitle: { fontSize: 13, fontWeight: 800, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 0.5, flex: 1 },
  headline: { fontSize: 16, fontWeight: 700, color: 'var(--cp-text-primary)', lineHeight: 1.4, margin: '4px 0 12px' },
  bullets: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: 'var(--cp-text-body)', lineHeight: 1.5 },

  confBlock: { padding: 16, background: 'var(--cp-surface-0)', border: '1px dashed var(--cp-border)', borderRadius: 10 },
  confHead: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  confLabel: { fontSize: 10, fontWeight: 800, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  confDensity: { fontSize: 11, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', marginLeft: 'auto' },
  confEst: { fontSize: 12, color: 'var(--cp-text-body)', margin: '4px 0', lineHeight: 1.5 },
  unknowns: { marginTop: 8 },
  unknownsLabel: { fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },

  section: { background: 'var(--cp-surface-2)', border: '1px solid var(--cp-border)', borderRadius: 10, overflow: 'hidden' },
  sectionHead: { width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', font: 'inherit' },
  sectionLabel: { fontSize: 12, fontWeight: 800, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  sectionChevron: { fontSize: 18, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace' },
  sectionBody: { padding: '0 16px 16px', fontSize: 13, color: 'var(--cp-text-body)', lineHeight: 1.6 },

  sublabel: { fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 12, marginBottom: 4 },

  tag: { display: 'inline-block', fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 999, letterSpacing: 0.5, whiteSpace: 'nowrap' },

  table: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  th: { textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--cp-border)', fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 },
  td: { padding: '8px 10px', borderBottom: '1px solid var(--cp-border)', verticalAlign: 'top' },
  tdMuted: { padding: '8px 10px', borderBottom: '1px solid var(--cp-border)', color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', fontSize: 11 },
  unit: { fontSize: 10, color: 'var(--cp-text-muted)' },
  narrative: { marginTop: 8, fontSize: 12, color: 'var(--cp-text-body)', lineHeight: 1.5 },

  compList: { margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 },
  cite: { color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', fontSize: 11 },

  riskList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  cat: { fontSize: 10, color: 'var(--cp-text-muted)' },
  mit: { fontSize: 12, color: 'var(--cp-text-body)', marginTop: 2 },
  dep: { fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2 },

  oppList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  exec: { fontSize: 12, color: 'var(--cp-text-body)', marginTop: 2 },

  configTable: { width: '100%', borderCollapse: 'collapse', fontSize: 12 },
  configKey: { padding: '6px 10px', borderBottom: '1px solid var(--cp-border)', fontSize: 10, fontWeight: 700, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, width: 160 },
  configVal: { padding: '6px 10px', borderBottom: '1px solid var(--cp-border)', color: 'var(--cp-text-primary)' },

  phaseList: { margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12 },
  phaseTime: { fontSize: 10, color: 'var(--cp-text-muted)', fontFamily: 'ui-monospace, monospace', marginLeft: 8 },
  gating: { margin: '4px 0 0', paddingLeft: 18, fontSize: 11, color: 'var(--cp-text-muted)' },

  realityFlags: { marginTop: 12, padding: 12, background: 'var(--ct-status-warning-soft)', border: '1px solid var(--ct-status-warning-border)', borderRadius: 10 },
  realityLabel: { fontSize: 10, fontWeight: 800, color: 'var(--ct-status-warning)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  realityFlag: { fontSize: 12, color: 'var(--ct-status-warning)', lineHeight: 1.5, padding: '4px 0' },

  // Intelligence chips in header
  intelChips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  intelChip: { fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 999, background: 'var(--cp-surface-0)', color: 'var(--cp-text-muted)', border: '1px solid var(--cp-border)', letterSpacing: 0.3, fontFamily: 'ui-monospace, monospace' },

  // Tensions block
  tensionList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 },
  tensionItem: { borderLeft: '3px solid var(--cp-accent)', paddingLeft: 12 },
  tensionLabel: { fontSize: 12, fontWeight: 800, color: 'var(--cp-text-primary)', textTransform: 'uppercase', letterSpacing: 0.5 },
  tensionPoles: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--cp-text-muted)', marginTop: 2, fontFamily: 'ui-monospace, monospace' },
  poleA: {},
  poleB: {},
  poleSep: { color: 'var(--cp-text-faint)' },
  tensionVerdict: { fontSize: 12, color: 'var(--cp-text-body)', marginTop: 4, lineHeight: 1.5 },

  // Intelligence sources block
  sourceList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 },
  sourceItem: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sourceId: { fontFamily: 'ui-monospace, monospace', color: 'var(--cp-text-primary)', fontSize: 11 },
  sourceUsed: { color: 'var(--cp-text-muted)' },
  sourceMeta: { color: 'var(--cp-text-muted)', fontSize: 11 },
  sourceLink: { color: 'var(--cp-accent)', textDecoration: 'none' },

  compFullList: { margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 },
  compFullItem: { paddingLeft: 12, borderLeft: '2px solid var(--cp-border)' },
  compDim: { margin: '4px 0 0', paddingLeft: 16, fontSize: 11, color: 'var(--cp-text-body)', lineHeight: 1.5 },
  compKey: { color: 'var(--cp-text-muted)', fontStyle: 'italic' },

  absorption: { fontSize: 12, color: 'var(--cp-text-body)', lineHeight: 1.6, padding: '8px 12px', background: 'var(--cp-surface-0)', borderRadius: 8, border: '1px solid var(--cp-border)' },

  // Live intelligence block
  liveRow: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '6px 0', borderBottom: '1px solid var(--cp-border)', flexWrap: 'wrap' },
  liveLabel: { fontSize: 10, fontWeight: 800, color: 'var(--cp-text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, width: 90, flexShrink: 0, paddingTop: 2 },
  liveVal: { fontSize: 12, color: 'var(--cp-text-body)', lineHeight: 1.5, flex: 1 },
  liveNoData: { fontSize: 12, color: 'var(--cp-text-muted)', fontStyle: 'italic', padding: '8px 0' },

  // Visualization block
  vizWrapper: { marginTop: 12, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--cp-border)' },

  // Explainability block
  audienceChipRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  whyBox: { marginTop: 12, padding: '12px 14px', background: 'var(--cp-surface-0)', borderRadius: 10, border: '1px solid var(--cp-border)' },
};
