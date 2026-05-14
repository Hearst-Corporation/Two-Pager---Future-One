// components/hearst/AdvisorToolCard.jsx
// Compact card rendered inline inside an assistant message for tool_use / tool_result blocks.

import { useState } from 'react';
import { C } from '@/lib/admin-tokens';

const TOOL_ICON = {
  get_project_state: '📊',
  get_scenario_details: '🔍',
  list_sources: '📎',
  list_public_sources_library: '📚',
  update_scenario: '✏️',
  create_source: '➕',
  attach_source_to_scenario: '🔗',
  create_scenario: '🆕',
  add_pipeline_prospect: '🎯',
  update_data_room_item: '🗂',
  run_what_if_projection: '🧪',
  compare_scenarios: '⚖️',
  generate_executive_report: '📄',
};

function summarizeInput(name, input) {
  if (!input) return null;
  if (name === 'update_scenario') {
    const fields = input.fields ? Object.keys(input.fields).length : 0;
    return `${fields} field${fields > 1 ? 's' : ''}: ${Object.keys(input.fields || {}).slice(0, 3).join(', ')}${fields > 3 ? '…' : ''}`;
  }
  if (name === 'create_source') return `${input.metric_id} ← ${input.source_name}`;
  if (name === 'attach_source_to_scenario') return `${input.field_name}`;
  if (name === 'create_scenario') return `${input.name} (${input.scenario_type})`;
  if (name === 'run_what_if_projection') {
    const o = input.overrides ? Object.keys(input.overrides) : [];
    return `overrides: ${o.slice(0, 3).join(', ')}${o.length > 3 ? '…' : ''}`;
  }
  if (name === 'compare_scenarios') return `${(input.scenario_ids || []).length} scenarios`;
  if (name === 'generate_executive_report') return `audience: ${input.audience || 'investor'}`;
  if (name === 'list_sources') return input.metric_id ? `metric: ${input.metric_id}` : 'all';
  if (name === 'add_pipeline_prospect') return `${input.prospect_name} (${input.prospect_type})`;
  if (name === 'update_data_room_item') return `status → ${input.status || 'unchanged'}`;
  return null;
}

function summarizeResult(name, content) {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed.error) return { ok: false, text: parsed.error };
    if (name === 'update_scenario' && parsed.updated_fields) {
      return { ok: true, text: `${parsed.updated_fields.length} field(s) updated · source score ${parsed.source_score}` };
    }
    if (name === 'create_source' && parsed.source_id) {
      return { ok: true, text: `source ${parsed.source_id.slice(0, 8)}…` };
    }
    if (name === 'attach_source_to_scenario' && parsed.ok) {
      return { ok: true, text: `source score → ${parsed.source_score}` };
    }
    if (name === 'create_scenario' && parsed.scenario_id) {
      const irr = parsed.projection?.irr;
      return { ok: true, text: `${parsed.name} · IRR ${irr != null ? (irr * 100).toFixed(1) + '%' : 'N/A'}` };
    }
    if (name === 'run_what_if_projection' && parsed.delta) {
      const d = parsed.delta;
      const fmtDelta = (v, unit) => v == null ? '—' : (unit === '%' ? `${v >= 0 ? '+' : ''}${(v * 100).toFixed(1)}pts` : unit === '$' ? `${v >= 0 ? '+' : ''}$${(v / 1e6).toFixed(0)}M` : `${v >= 0 ? '+' : ''}${v.toFixed(2)}`);
      return { ok: true, text: `Δ IRR ${fmtDelta(d.irr, '%')} · Δ NPV ${fmtDelta(d.npv, '$')}` };
    }
    if (name === 'generate_executive_report' && parsed.returns) {
      return { ok: true, text: `report ready · ${(parsed.returns.irr * 100).toFixed(1)}% IRR` };
    }
    if (name === 'list_sources') return { ok: true, text: `${parsed.count || 0} sources` };
    if (name === 'get_project_state') {
      return { ok: true, text: `${parsed.scenarios?.length || 0} scenarios · ${parsed.sources_count || 0} sources · ${parsed.active_alerts?.length || 0} alerts` };
    }
    if (parsed.ok) return { ok: true, text: 'done' };
    return { ok: true, text: 'ok' };
  } catch {
    return { ok: true, text: content.slice(0, 80) + (content.length > 80 ? '…' : '') };
  }
}

export default function AdvisorToolCard({ call }) {
  const [expanded, setExpanded] = useState(false);
  const icon = TOOL_ICON[call.name] || '🔧';
  const inputSummary = call.input ? summarizeInput(call.name, call.input) : null;
  const resultSummary = call.result ? summarizeResult(call.name, call.result) : null;

  const status = call.status || 'pending';
  const statusColor = status === 'error' ? C.error : status === 'done' ? C.success : C.warning;
  const statusDot = status === 'error' ? '✗' : status === 'done' ? '✓' : '⋯';

  return (
    <div style={S.card}>
      <div style={S.row} onClick={() => setExpanded(!expanded)}>
        <span style={S.icon}>{icon}</span>
        <code style={S.name}>{call.name}</code>
        {inputSummary && <span style={S.inputSummary}>· {inputSummary}</span>}
        {resultSummary && <span style={{ ...S.resultSummary, color: resultSummary.ok ? C.success : C.error }}>→ {resultSummary.text}</span>}
        <span style={{ ...S.status, color: statusColor }}>{statusDot}</span>
      </div>
      {expanded && (
        <div style={S.expanded}>
          {call.input && (
            <pre style={S.json}>input: {JSON.stringify(call.input, null, 2)}</pre>
          )}
          {call.result && (
            <pre style={S.json}>result: {call.result}</pre>
          )}
        </div>
      )}
    </div>
  );
}

const S = {
  card: {
    background: C.bgMain,
    border: `1px solid ${C.borderLight}`,
    borderRadius: 6,
    margin: '6px 0',
    fontSize: 11,
    overflow: 'hidden',
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 8px', cursor: 'pointer',
  },
  icon: { fontSize: 12 },
  name: {
    fontFamily: 'ui-monospace, Menlo, monospace',
    fontSize: 10.5,
    color: C.textPrimary,
    fontWeight: 600,
  },
  inputSummary: { color: C.textMuted, fontSize: 10.5 },
  resultSummary: { marginLeft: 'auto', fontSize: 10.5, fontWeight: 600 },
  status: { fontWeight: 800, fontSize: 12, marginLeft: 4 },
  expanded: { padding: '4px 8px 8px 8px', borderTop: `1px solid ${C.borderLight}` },
  json: {
    fontFamily: 'ui-monospace, Menlo, monospace',
    fontSize: 10,
    margin: '4px 0',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    color: C.textMuted,
    maxHeight: 200,
    overflow: 'auto',
  },
};
