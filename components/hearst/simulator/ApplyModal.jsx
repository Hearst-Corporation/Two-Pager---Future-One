'use client';

// ApplyModal — confirmation gate before any Copilot recommendation is dispatched.
//
// Props:
//   fields   : FieldToApply[]  — fields_to_apply from the recommendation
//   onConfirm(fields) → void   — called with final (possibly edited) fields
//   onCancel()  → void         — no dispatch, modal closes
//
// Behaviour:
//   Default mode: read-only table of Current → Recommended.
//   Edit mode:    each recommended value becomes an editable input.
//   Confirm fires onConfirm with the (possibly edited) fields.
//   Cancel fires onCancel — guaranteed no dispatch.

import { useState } from 'react';
import { fmtFieldValue, fieldLabel } from '@/lib/copilot-rules';

export default function ApplyModal({ fields, onConfirm, onCancel }) {
  const [editing, setEditing] = useState(false);
  // Local editable copy — values start as recommendation, user may override.
  const [edits, setEdits] = useState(() =>
    Object.fromEntries(fields.map(f => [f.field, f.value]))
  );

  if (!fields || fields.length === 0) return null;

  function handleConfirm() {
    // Build final fields array with user-edited values merged in.
    const finalFields = fields.map(f => ({
      ...f,
      value: edits[f.field] !== undefined ? edits[f.field] : f.value,
    }));
    onConfirm(finalFields);
  }

  function handleEditChange(fieldKey, rawVal) {
    // Coerce to number if the original value was numeric.
    const original = fields.find(f => f.field === fieldKey)?.value;
    const coerced  = typeof original === 'number' ? (parseFloat(rawVal) || 0) : rawVal;
    setEdits(prev => ({ ...prev, [fieldKey]: coerced }));
  }

  return (
    <div style={S.overlay} role="dialog" aria-modal="true" aria-label="Apply recommendation">
      <div style={S.modal}>
        <h2 style={S.title}>Apply recommendation</h2>
        <p style={S.sub}>
          Review the proposed changes. Confirm to apply, or edit values before applying.
        </p>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Field</th>
              <th style={S.th}>Current</th>
              <th style={S.th}>Recommended</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(f => (
              <tr key={f.field} style={S.tr}>
                <td style={S.td}>{fieldLabel(f.field)}</td>
                <td style={{ ...S.td, color: 'var(--cp-text-muted)' }}>
                  {fmtFieldValue(f.field, f.current)}
                </td>
                <td style={S.tdRec}>
                  {editing ? (
                    <input
                      type={typeof f.value === 'number' ? 'number' : 'text'}
                      value={edits[f.field] ?? f.value}
                      onChange={e => handleEditChange(f.field, e.target.value)}
                      style={S.editInput}
                    />
                  ) : (
                    <span style={S.recVal}>{fmtFieldValue(f.field, f.value)}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={S.actions}>
          <button type="button" onClick={handleConfirm} style={S.btnConfirm}>
            Confirm
          </button>
          {!editing && (
            <button type="button" onClick={() => setEditing(true)} style={S.btnEdit}>
              Edit values
            </button>
          )}
          {editing && (
            <button type="button" onClick={() => setEditing(false)} style={S.btnEdit}>
              Preview
            </button>
          )}
          <button type="button" onClick={onCancel} style={S.btnCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9000,
  },
  modal: {
    background: 'var(--cp-surface-1)',
    border: '1px solid var(--cp-border)',
    borderRadius: 12,
    padding: 32,
    width: 520,
    maxWidth: '92vw',
    display: 'flex',
    flexDirection: 'column',
    gap: 20,
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  title: {
    fontSize: 18,
    fontWeight: 800,
    color: 'var(--cp-text-primary)',
    margin: 0,
    letterSpacing: -0.2,
  },
  sub: {
    fontSize: 13,
    color: 'var(--cp-text-muted)',
    margin: 0,
    lineHeight: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 13,
  },
  th: {
    textAlign: 'left',
    padding: '6px 10px',
    color: 'var(--cp-text-muted)',
    borderBottom: '1px solid var(--cp-border)',
    fontWeight: 600,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  tr: {
    borderBottom: '1px solid var(--cp-border)',
  },
  td: {
    padding: '10px 10px',
    color: 'var(--cp-text-body)',
    verticalAlign: 'middle',
  },
  tdRec: {
    padding: '10px 10px',
    verticalAlign: 'middle',
  },
  recVal: {
    color: 'var(--cp-accent-maroon, var(--cp-accent))',
    fontWeight: 700,
    fontSize: 13,
  },
  editInput: {
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 6,
    color: 'var(--cp-text-primary)',
    fontSize: 13,
    padding: '4px 8px',
    width: '100%',
    maxWidth: 120,
    outline: 'none',
  },
  actions: {
    display: 'flex',
    gap: 8,
    paddingTop: 4,
    flexWrap: 'wrap',
  },
  btnConfirm: {
    height: 36,
    padding: '0 20px',
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
    color: 'var(--cp-text-strong)',
    border: 'none',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 0.3,
  },
  btnEdit: {
    height: 36,
    padding: '0 18px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnCancel: {
    height: 36,
    padding: '0 18px',
    background: 'transparent',
    color: 'var(--cp-text-muted)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    marginLeft: 'auto',
  },
};
