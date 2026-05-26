'use client';

import { BUSINESS_MODELS, CLIENT_TYPES } from '@/lib/hearst-constants';
import { BUSINESS_MODEL_GROUPS, CLIENT_GROUPS, getFit, fitColor } from '@/lib/hearst-fit-matrix';

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

export default function B2BMatrix({ selected, onCellClick }) {
  const allClientIds = COL_GROUPS.flatMap(g => g.ids);

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={S.table}>
        <thead>
          <tr>
            <th style={S.thCorner}>What we sell</th>
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
            <>
              <tr key={`hdr-${rowGroup.label}`}>
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
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const S = {
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: 11,
    background: 'var(--cp-surface-2)',
    borderRadius: 8,
    overflow: 'hidden',
  },
  thCorner: {
    padding: '8px 12px',
    background: 'var(--cp-surface-0)',
    textAlign: 'left',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: 'var(--cp-text-muted)',
    borderBottom: '2px solid var(--cp-border)',
    position: 'sticky',
    left: 0,
    zIndex: 2,
  },
  thGroup: {
    padding: '6px 10px',
    fontSize: 11,
    fontWeight: 800,
    textAlign: 'center',
    background: 'var(--cp-surface-0)',
    borderBottom: '2px solid',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  thSub: { background: 'var(--cp-surface-0)' },
  thCol: {
    padding: '8px 6px',
    fontSize: 10,
    fontWeight: 600,
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
    padding: '6px 12px',
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 2,
    color: 'var(--cp-text-muted)',
    background: 'var(--cp-surface-0)',
    textAlign: 'left',
    textTransform: 'uppercase',
    borderBottom: '1px solid var(--cp-border)',
  },
  tdRowLabel: {
    padding: '8px 12px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    borderBottom: '1px solid var(--cp-border)',
    position: 'sticky',
    left: 0,
    zIndex: 1,
    minWidth: 160,
  },
  tdCell: {
    padding: '8px 6px',
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid var(--cp-border)',
    borderLeft: '1px solid var(--cp-border)',
    minWidth: 80,
  },
  tdEmpty: {
    padding: '8px 6px',
    textAlign: 'center',
    color: 'var(--cp-text-faint)',
    borderBottom: '1px solid var(--cp-border)',
    borderLeft: '1px solid var(--cp-border)',
    fontSize: 12,
  },
  tdPricing: {
    fontWeight: 700,
    fontSize: 11,
    color: 'var(--cp-text-primary)',
  },
  tdMargin: {
    fontSize: 10,
    color: 'var(--cp-text-muted)',
    marginTop: 1,
  },
};
