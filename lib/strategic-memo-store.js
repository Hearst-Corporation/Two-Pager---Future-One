// lib/strategic-memo-store.js
//
// Critical Deliverables branch — persistence layer for strategic memos.
// A generated memo becomes a permanent, versioned, auditable institutional asset.
//
// Append-only: each generation inserts a NEW row. Versioning is per scenario_id
// (one scenario -> many memo versions, P3). Rows are never overwritten (P2).

import { getAdminClient } from './supabase-admin';

const SECTION_ORDER = [
  ['executive_summary', 'Executive Summary'],
  ['confidence_block', 'Confidence'],
  ['strategic_context', 'Strategic Context'],
  ['key_financial_metrics', 'Key Financial Metrics'],
  ['infrastructure_analysis', 'Infrastructure Analysis'],
  ['market_benchmarking', 'Market Benchmarking'],
  ['risks_constraints', 'Key Concerns'],
  ['strategic_opportunities', 'Strategic Opportunities'],
  ['recommended_architecture', 'Recommended Architecture'],
  ['commercialization_strategy', 'Revenue Model'],
  ['deployment_roadmap', 'What Happens Next'],
  ['long_term_strategic_value', 'Long-Term Strategic Value'],
];

/**
 * Build a complete, self-contained markdown rendering of the memo for storage
 * and export. Best-effort: tolerates missing sections.
 */
export function buildMemoMarkdown(memo, meta = {}) {
  if (!memo || typeof memo !== 'object') return '';
  const L = [];
  const exec = memo.executive_summary || {};
  L.push(`# ${meta.title || 'Strategic Memo'} — AI-generated draft`);
  L.push('');
  L.push(`_Generated ${meta.generated_at || ''} · model ${meta.provider_used || meta.model_used || 'n/a'} · v${meta.version ?? 1} · stakeholder ${meta.stakeholder || 'n/a'} · region ${meta.region || 'n/a'}_`);
  if (memo.data_freshness?.data_as_of) L.push(`_Data as of ${memo.data_freshness.data_as_of} · freshness ${memo.data_freshness.overall_status}_`);
  L.push('');
  const cb = memo.confidence_block || {};
  if (cb.confidence_level) L.push(`**Confidence: ${cb.confidence_level}** (${cb.source_density || 'n/a'}) — computed server-side`);
  L.push('');
  if (exec.headline) { L.push(`## Executive Summary`); L.push(`**${exec.headline}**`); (exec.bullets || []).forEach(b => L.push(`- ${b}`)); L.push(''); }

  for (const [key, label] of SECTION_ORDER) {
    if (key === 'executive_summary' || key === 'confidence_block') continue;
    const s = memo[key];
    if (!s || s.skip) continue;
    L.push(`## ${label}`);
    if (typeof s === 'string') { L.push(s); }
    else {
      if (s.body) L.push(s.body);
      if (s.narrative) L.push(s.narrative);
      if (Array.isArray(s.metrics)) s.metrics.forEach(m => L.push(`- **${m.label}**: ${m.value} ${m.unit || ''} ${m.confidence ? `(${m.confidence})` : ''} ${m.source ? `· ${m.source}` : ''}`));
      if (Array.isArray(s.comparables)) s.comparables.forEach(c => L.push(`- ${c.name}: ${c.metric} = ${c.value} (${c.source})`));
      if (Array.isArray(s.items)) s.items.forEach(it => L.push(`- ${it.label}${it.severity ? ` [${it.severity}]` : ''}${it.mitigation ? ` — ${it.mitigation}` : ''}${it.execution_path ? ` — ${it.execution_path}` : ''}`));
      if (Array.isArray(s.tradeoffs)) s.tradeoffs.forEach(t => L.push(`- ${t}`));
      if (s.rationale) L.push(s.rationale);
      if (s.ten_year_arc) L.push(s.ten_year_arc);
      if (Array.isArray(s.phases)) s.phases.forEach(p => L.push(`- ${p.label} (${p.months_from_t0}): ${(p.gating_events || []).join(', ')}`));
      if (Array.isArray(s.reality_check_flags)) s.reality_check_flags.forEach(f => L.push(`- ⚠ ${f}`));
    }
    L.push('');
  }
  if (Array.isArray(memo.intelligence_sources) && memo.intelligence_sources.length) {
    L.push('## Sources');
    memo.intelligence_sources.forEach(s => L.push(`- \`${s.datapoint_id}\` — ${s.used_for} (${s.trust})`));
    L.push('');
  }
  L.push('---');
  L.push('_AI-assisted · Indicative · Human review required._');
  return L.join('\n');
}

/**
 * Persist a generated memo as a new versioned row. No user action required.
 * Returns { id, version } or { error }.
 */
export async function persistMemo({ memo, meta, project_id = null, scenario_id = null, title, actor_id = null }) {
  const supa = getAdminClient();

  // Versioning (P2/P3): version = max(version)+1 for this scenario; v1 otherwise.
  let version = 1;
  try {
    if (scenario_id) {
      const { data: prev } = await supa
        .from('strategic_memos')
        .select('version')
        .eq('scenario_id', scenario_id)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (prev?.version) version = prev.version + 1;
    }
  } catch { /* fall back to v1 */ }

  const exec = memo?.executive_summary || {};
  const row = {
    project_id,
    scenario_id,
    title: title || exec.headline?.slice(0, 120) || 'Strategic Memo',
    executive_summary: exec.headline || null,
    memo_json: memo,
    memo_markdown: buildMemoMarkdown(memo, { ...meta, version, title }),
    stakeholder: meta?.stakeholder || null,
    region: meta?.region || null,
    audience: meta?.audience || null,
    provider_used: meta?.provider_used || meta?.model_used || null,
    generation_time_ms: meta?.generation_time_ms ?? null,
    confidence_level: memo?.confidence_block?.confidence_level || null,
    data_as_of: memo?.data_freshness?.data_as_of || null,
    status: 'draft',
    version,
    created_by: actor_id,
  };

  const { data, error } = await supa.from('strategic_memos').insert(row).select('id, version, status, created_at').single();
  if (error) return { error: error.message };
  return { id: data.id, version: data.version, status: data.status, created_at: data.created_at };
}
