'use client';

// CopilotPanel — deterministic Copilot recommendation panel.
//
// Sits above the Simulator Pro sections, below the header.
// Shows one recommendation at a time from copilot-rules.js.
// No LLM. No fetch. Pure deterministic output.
//
// Props:
//   suggestion   : RecommendedSetup | null   — from buildCopilotSuggestion()
//   onApply(fields_to_apply) → void          — parent opens ApplyModal
//   onDismiss() → void

import { useState } from 'react';

const CONFIDENCE_LABEL = {
  HIGH:   { text: 'High confidence',   color: 'var(--cp-text-primary)' },
  MEDIUM: { text: 'Medium confidence', color: 'var(--cp-text-muted)'   },
  LOW:    { text: 'Low confidence',    color: 'var(--cp-text-muted)'   },
};

const OBJECTIVE_LABEL = {
  maximize_irr: 'Maximize IRR',
  minimize_risk: 'Reduce risk',
  conservative: 'Conservative case',
  ic_case: 'IC readiness',
  balance: 'Balanced improvement',
};

export default function CopilotPanel({ suggestion, onApply, onDismiss }) {
  const [expanded, setExpanded] = useState(false);

  if (!suggestion) return null;

  const conf = CONFIDENCE_LABEL[suggestion.confidence] || CONFIDENCE_LABEL.MEDIUM;
  const objLabel = OBJECTIVE_LABEL[suggestion.objective] || suggestion.objective;

  return (
    <div style={S.wrap} role="region" aria-label="Copilot suggestion">
      {/* ── Top row ───────────────────────────────────────────────────── */}
      <div style={S.topRow}>
        <div style={S.badge}>✦ Copilot</div>
        <div style={S.objChip}>{objLabel}</div>
        <div style={{ ...S.confChip, color: conf.color }}>{conf.text}</div>
        <button
          type="button"
          onClick={onDismiss}
          style={S.dismissBtn}
          aria-label="Dismiss suggestion"
        >
          ✕
        </button>
      </div>

      {/* ── Summary ───────────────────────────────────────────────────── */}
      <div style={S.label}>{suggestion.label}</div>
      <p style={S.rationale}>{suggestion.rationale}</p>

      {/* ── Why? expanded ─────────────────────────────────────────────── */}
      {expanded && (
        <div style={S.expandBox}>
          {suggestion.tradeoffs && suggestion.tradeoffs.length > 0 && (
            <div style={S.tradeoffsBlock}>
              <div style={S.expandLabel}>Expected tradeoffs</div>
              <ul style={S.tradeoffList}>
                {suggestion.tradeoffs.map((t, i) => (
                  <li key={i} style={S.tradeoffItem}>
                    <span style={t.type === 'advantage' ? S.plus : S.minus}>
                      {t.type === 'advantage' ? '+' : '−'}
                    </span>
                    {t.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {suggestion.fields_to_apply && suggestion.fields_to_apply.length > 0 && (
            <div style={S.fieldsBlock}>
              <div style={S.expandLabel}>Changes proposed</div>
              <ul style={S.fieldList}>
                {suggestion.fields_to_apply.map(f => (
                  <li key={f.field} style={S.fieldItem}>
                    <span style={S.fieldName}>{f.label || f.field}</span>
                    <span style={S.fieldArrow}>
                      <span style={S.currentVal}>{formatVal(f.current)}</span>
                      <span style={S.arrow}> → </span>
                      <span style={S.recVal}>{formatVal(f.value)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div style={S.actions}>
        <button
          type="button"
          onClick={() => onApply(suggestion.fields_to_apply)}
          style={S.btnApply}
        >
          Apply
        </button>
        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          style={S.btnWhy}
        >
          {expanded ? 'Hide details' : 'Why?'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={S.btnDismiss}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

function formatVal(v) {
  if (v == null) return '—';
  if (typeof v === 'number') {
    if (v <= 1 && v >= 0 && String(v).includes('.')) return `${(v * 100).toFixed(0)}%`;
    if (v > 1 && v <= 100 && Number.isInteger(v)) return `${v}`;
  }
  return String(v);
}

const S = {
  wrap: {
    background: 'var(--cp-surface-2)',
    border: '1px solid var(--cp-border)',
    borderLeft: '3px solid var(--cp-accent-maroon, var(--cp-accent))',
    borderRadius: 10,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: 'var(--cp-accent-maroon, var(--cp-accent))',
  },
  objChip: {
    fontSize: 11,
    fontWeight: 600,
    padding: '3px 10px',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    color: 'var(--cp-text-muted)',
    letterSpacing: 0.3,
  },
  confChip: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  dismissBtn: {
    marginLeft: 'auto',
    background: 'transparent',
    border: 'none',
    color: 'var(--cp-text-muted)',
    cursor: 'pointer',
    fontSize: 14,
    lineHeight: 1,
    padding: 0,
    flexShrink: 0,
  },
  label: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    lineHeight: '20px',
  },
  rationale: {
    fontSize: 13,
    color: 'var(--cp-text-body)',
    lineHeight: '20px',
    margin: 0,
  },

  // Expanded block
  expandBox: {
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 8,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  expandLabel: {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'var(--cp-text-muted)',
    marginBottom: 6,
  },
  tradeoffsBlock: {},
  tradeoffList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  tradeoffItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    fontSize: 12,
    color: 'var(--cp-text-body)',
    lineHeight: '18px',
  },
  plus:  { color: 'var(--cp-text-primary)', fontWeight: 800, flexShrink: 0, width: 12 },
  minus: { color: 'var(--cp-text-muted)',   fontWeight: 800, flexShrink: 0, width: 12 },

  fieldsBlock: {},
  fieldList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  fieldItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    fontSize: 12,
    gap: 8,
  },
  fieldName:   { color: 'var(--cp-text-muted)' },
  fieldArrow:  { display: 'flex', alignItems: 'baseline', gap: 2 },
  currentVal:  { color: 'var(--cp-text-muted)', textDecoration: 'line-through', fontSize: 11 },
  arrow:       { color: 'var(--cp-text-muted)', fontSize: 11 },
  recVal:      { color: 'var(--cp-accent-maroon, var(--cp-accent))', fontWeight: 700 },

  // Action buttons
  actions: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    paddingTop: 2,
  },
  btnApply: {
    height: 32,
    padding: '0 18px',
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 0.3,
  },
  btnWhy: {
    height: 32,
    padding: '0 16px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnDismiss: {
    height: 32,
    padding: '0 16px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
};
