'use client';

import React, { memo } from 'react';
import { BUSINESS_MODELS, CLIENT_TYPES } from '@/lib/hearst-constants';
import { BUSINESS_MODEL_GROUPS, CLIENT_GROUPS, getFit, fitColor } from '@/lib/hearst-fit-matrix';
import { UI } from '@/lib/ui-strings';

const BM_ID_TO_LABEL = Object.fromEntries(BUSINESS_MODELS.map(b => [b.id, b.label]));
const CT_ID_TO_LABEL = Object.fromEntries(CLIENT_TYPES.map(c => [c.id, c.label]));

const COL_GROUPS = [
  { label: 'Businesses', ids: CLIENT_GROUPS.b2b, color: 'var(--cp-accent-maroon)' },
  { label: 'Government', ids: CLIENT_GROUPS.b2g, color: 'var(--cp-accent-maroon)' },
  { label: 'Startups',   ids: CLIENT_GROUPS.b2c, color: 'var(--cp-text-primary)' },
];

const ROW_GROUPS = [
  { label: 'Renting space',    ids: BUSINESS_MODEL_GROUPS.colocation },
  { label: 'Leasing buildings', ids: BUSINESS_MODEL_GROUPS.lease },
  { label: 'Cloud / AI',        ids: BUSINESS_MODEL_GROUPS.cloud_ai },
  { label: 'Government AI',     ids: BUSINESS_MODEL_GROUPS.sovereign },
  { label: 'Enterprise',        ids: BUSINESS_MODEL_GROUPS.enterprise },
];

function fmtPricing(p) {
  if (p == null) return '—';
  if (typeof p === 'string') return p;
  return `$${p}/kW`;
}
function fmtMargin(m) {
  if (m == null) return '';
  return `${Math.round(m * 100)}%`;
}

function B2BMatrix({ selected, onCellClick }) {
  const allClientIds = COL_GROUPS.flatMap(g => g.ids);

  return (
    <div style={S.scroller}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.thCorner}>{UI.B2B_TH_CORNER}</th>
            {COL_GROUPS.map(g => (
              <th key={g.label} colSpan={g.ids.length}
                style={{ ...S.thGroup, color: g.color, borderBottomColor: g.color }}>
                {g.label}
              </th>
            ))}
          </tr>
          <tr>
            <th style={S.thSub}></th>
            {allClientIds.map(ct => (
              <th key={ct} style={S.thCol}>{CT_ID_TO_LABEL[ct] || ct}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROW_GROUPS.map(rowGroup => (
            <React.Fragment key={rowGroup.label}>
              <tr>
                <th colSpan={allClientIds.length + 1} style={S.rowGroupHdr}>{rowGroup.label}</th>
              </tr>
              {rowGroup.ids.map(bm => (
                <tr key={bm}>
                  <td style={S.tdRowLabel}>{BM_ID_TO_LABEL[bm] || bm}</td>
                  {allClientIds.map(ct => {
                    const fit = getFit(bm, ct);
                    const isSelected = selected?.businessModelId === bm && selected?.clientTypeId === ct;
                    if (!fit) {
                      return <td key={ct} style={S.tdEmpty}>—</td>;
                    }
                    return (
                      <td key={ct}
                        style={{
                          ...S.tdCell,
                          background: fitColor(fit.fit),
                          outline: isSelected ? '2px solid var(--cp-accent-maroon)' : 'none',
                        }}
                        onClick={() => onCellClick?.({ businessModelId: bm, clientTypeId: ct, fit })}
                        title={fit.note}>
                        <div style={S.tdPricing}>{fmtPricing(fit.pricing)}</div>
                        <div style={S.tdMargin}>{fmtMargin(fit.margin)}</div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default memo(B2BMatrix);

const S = {
  scroller: {
    width: '100%',
    maxWidth: '100%',
    overflowX: 'auto',
    overflowY: 'hidden',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
  },
  table: {
    width: '100%',
    minWidth: 980,
    borderCollapse: 'collapse',
    fontSize: 'var(--cp-font-micro)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-md)',
    overflow: 'hidden',
  },
  thCorner: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    background: 'var(--cp-surface-0)',
    textAlign: 'left',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-muted)',
    borderBottom: '2px solid var(--cp-border)',
    position: 'sticky',
    left: 0,
    zIndex: 'var(--cp-z-content)',
  },
  thGroup: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-black)',
    textAlign: 'center',
    background: 'var(--cp-surface-0)',
    borderBottom: '2px solid',
    letterSpacing: 'var(--cp-tracking-eyebrow)',
    textTransform: 'uppercase',
  },
  thSub: { background: 'var(--cp-surface-0)' },
  thCol: {
    padding: 'var(--cp-space-2) var(--cp-space-2)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-semibold)',
    textAlign: 'center',
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    borderBottom: '1px solid var(--cp-border)',
    maxWidth: 90,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rowGroupHdr: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    letterSpacing: 'var(--cp-tracking-wider)',
    color: 'var(--cp-text-muted)',
    background: 'var(--cp-surface-0)',
    textAlign: 'left',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--cp-border)',
  },
  tdRowLabel: {
    padding: 'var(--cp-space-2) var(--cp-space-3)',
    fontSize: 'var(--cp-font-xs)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    borderBottom: '1px solid var(--cp-border)',
    position: 'sticky',
    left: 0,
    zIndex: 'var(--cp-z-content)',
    minWidth: 132,
    maxWidth: 150,
  },
  tdCell: {
    padding: 'var(--cp-space-2) var(--cp-space-1)',
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid var(--cp-border)',
    borderLeft: '1px solid var(--cp-border)',
    minWidth: 68,
  },
  tdEmpty: {
    padding: 'var(--cp-space-2) var(--cp-space-1)',
    textAlign: 'center',
    color: 'var(--cp-text-faint)',
    borderBottom: '1px solid var(--cp-border)',
    borderLeft: '1px solid var(--cp-border)',
    fontSize: 'var(--cp-font-sm)',
  },
  tdPricing: {
    fontWeight: 'var(--cp-weight-bold)',
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-primary)',
  },
  tdMargin: {
    fontSize: 'var(--cp-font-micro)',
    color: 'var(--cp-text-muted)',
    marginTop: 'var(--cp-space-1)',
  },
};
