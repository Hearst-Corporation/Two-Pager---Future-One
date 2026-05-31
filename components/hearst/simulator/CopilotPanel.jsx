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
  const [isReviewing, setIsReviewing] = useState(false);

  if (!suggestion) return null;

  const conf = CONFIDENCE_LABEL[suggestion.confidence] || CONFIDENCE_LABEL.MEDIUM;
  const objLabel = OBJECTIVE_LABEL[suggestion.objective] || suggestion.objective;

  if (isReviewing) {
    return (
      <div style={S.wrap} role="region" aria-label="Review Copilot changes">
        <div style={S.topRow}>
          <div style={S.badge}>Review Changes</div>
        </div>
        <div style={S.label}>Confirm to apply these changes</div>
        
        <div style={S.expandBox}>
          <div style={S.fieldsBlock}>
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
        </div>

        <div style={S.actions}>
          <button
            type="button"
            onClick={() => {
              setIsReviewing(false);
              onApply(suggestion.fields_to_apply);
            }}
            style={S.btnApply}
          >
            Confirm Apply
          </button>
          <button
            type="button"
            onClick={() => setIsReviewing(false)}
            style={S.btnDismiss}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap} role="region" aria-label="Copilot suggestion">
      {/* ── Top row ───────────────────────────────────────────────────── */}
      <div style={S.topRow}>
        <div style={S.badge}>Copilot Recommendation</div>
        <div style={S.objChip}>{objLabel}</div>
        <div style={{ ...S.confChip, color: conf.color }}>{conf.text}</div>
      </div>

      {/* ── Summary ───────────────────────────────────────────────────── */}
      <div style={S.label}>{suggestion.label}</div>
      <p style={S.rationale}>{suggestion.rationale}</p>

      {/* ── Details always visible ─────────────────────────────────────────────── */}
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

      {/* ── Actions ───────────────────────────────────────────────────── */}
      <div style={S.actions}>
        <button
          type="button"
          onClick={() => setIsReviewing(true)}
          style={S.btnApply}
        >
          Apply Changes
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
    borderRadius: 'var(--cp-radius-md, 8px)',
    padding: 'var(--cp-space-4, 16px) var(--cp-space-5, 20px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3, 12px)',
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cp-space-2, 8px)',
    flexWrap: 'wrap',
  },
  badge: {
    fontSize: 'var(--cp-font-sm, 12px)',
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'var(--cp-text-primary)',
  },
  objChip: {
    fontSize: 'var(--cp-font-xs, 11px)',
    fontWeight: 600,
    padding: 'var(--cp-space-1, 4px) var(--cp-space-3, 12px)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 0.3,
  },
  confChip: {
    fontSize: 'var(--cp-font-xs, 11px)',
    fontWeight: 600,
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 'var(--cp-font-md, 14px)',
    fontWeight: 700,
    color: 'var(--cp-text-primary)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
  },
  rationale: {
    fontSize: 'var(--cp-font-base, 13px)',
    color: 'var(--cp-text-body)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
    margin: 0,
  },

  // Expanded block
  expandBox: {
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    padding: 'var(--cp-space-3, 12px) var(--cp-space-4, 16px)',
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-3, 12px)',
  },
  expandLabel: {
    fontSize: 'var(--cp-font-xs, 11px)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'var(--cp-text-muted)',
    marginBottom: 'var(--cp-space-2, 8px)',
  },
  tradeoffsBlock: {},
  tradeoffList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2, 8px)',
  },
  tradeoffItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-2, 8px)',
    fontSize: 'var(--cp-font-sm, 12px)',
    color: 'var(--cp-text-body)',
    lineHeight: 'var(--cp-leading-normal, 1.6)',
  },
  plus:  { color: 'var(--cp-text-primary)', fontWeight: 700, flexShrink: 0, width: 12 },
  minus: { color: 'var(--cp-text-muted)',   fontWeight: 700, flexShrink: 0, width: 12 },

  fieldsBlock: {},
  fieldList: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-1, 4px)',
  },
  fieldItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    fontSize: 'var(--cp-font-sm, 12px)',
    gap: 'var(--cp-space-2, 8px)',
  },
  fieldName:   { color: 'var(--cp-text-muted)' },
  fieldArrow:  { display: 'flex', alignItems: 'baseline', gap: 'var(--cp-space-1, 4px)' },
  currentVal:  { color: 'var(--cp-text-muted)', textDecoration: 'line-through', fontSize: 'var(--cp-font-xs, 11px)' },
  arrow:       { color: 'var(--cp-text-muted)', fontSize: 'var(--cp-font-xs, 11px)' },
  recVal:      { color: 'var(--cp-accent-maroon, var(--cp-accent))', fontWeight: 600 },

  // Action buttons
  actions: {
    display: 'flex',
    gap: 'var(--cp-space-2, 8px)',
    flexWrap: 'wrap',
    paddingTop: 'var(--cp-space-1, 4px)',
  },
  btnApply: {
    height: 32,
    padding: '0 var(--cp-space-4, 16px)',
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 'var(--cp-radius-md, 8px)',
    fontSize: 'var(--cp-font-sm, 12px)',
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 0.3,
  },
  btnDismiss: {
    height: 32,
    padding: '0 var(--cp-space-4, 16px)',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md, 8px)',
    fontSize: 'var(--cp-font-sm, 12px)',
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
};
