'use client';

import React, { memo } from 'react';
import { BUSINESS_MODELS, CLIENT_TYPES } from '@/lib/hearst-constants';
import { BUSINESS_MODEL_GROUPS, CLIENT_GROUPS, getFit, fitColor } from '@/lib/hearst-fit-matrix';
import { UI } from '@/lib/ui-strings';

const BM_ID_TO_LABEL = Object.fromEntries(BUSINESS_MODELS.map(b => [b.id, b.label]));
const CT_ID_TO_LABEL = Object.fromEntries(CLIENT_TYPES.map(c => [c.id, c.label]));

/** Short column headers — full label stays in `title` (matrix must fit panel width, no horizontal scroll). */
const CT_SHORT_LABEL = {
  hyperscalers: 'Hyperscalers',
  operators: 'Operators',
  neocloud: 'Neocloud',
  qatar_gov: 'Qatar Gov',
  defense: 'Defense',
  banks: 'Banks',
  telecoms: 'Telecoms',
  enterprise: 'Enterprise',
  ai_startups: 'Startups',
};

const BM_SHORT_LABEL = {
  retail_colo: 'Retail colo',
  wholesale_colo: 'Wholesale',
  hyperscale_lease: 'Hyperscale',
  powered_shell: 'Powered shell',
  turnkey: 'Turnkey',
  equinix_zone: 'Equinix zone',
  multi_operator: 'Multi-op',
  sovereign_ai: 'Gov AI cloud',
  gpu_cloud: 'GPU cloud',
  ai_training: 'AI training',
  ai_inference: 'AI inference',
  government: 'Government',
  enterprise: 'Enterprise',
};

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

  const colPct = `${(100 - 17) / allClientIds.length}%`;

  return (
    <div data-b2b-matrix style={S.scroller}>
      <table style={S.table}>
        <colgroup>
          <col style={{ width: '17%' }} />
          {allClientIds.map((ct) => (
            <col key={ct} style={{ width: colPct }} />
          ))}
        </colgroup>
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
              <th key={ct} style={S.thCol} title={CT_ID_TO_LABEL[ct] || ct}>
                {CT_SHORT_LABEL[ct] || CT_ID_TO_LABEL[ct] || ct}
              </th>
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
                  <td style={S.tdRowLabel} title={BM_ID_TO_LABEL[bm] || bm}>
                    {BM_SHORT_LABEL[bm] || BM_ID_TO_LABEL[bm] || bm}
                  </td>
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
                        <div className="b2b-pricing" style={S.tdPricing}>{fmtPricing(fit.pricing)}</div>
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
    minWidth: 0,
    overflowX: 'hidden',
    overflowY: 'hidden',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-md)',
  },
  table: {
    width: '100%',
    minWidth: 0,
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
    fontSize: 'var(--cp-font-micro)',
    background: 'var(--cp-surface-2)',
    borderRadius: 'var(--cp-radius-md)',
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
    padding: 'var(--cp-space-1) var(--cp-space-1)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-semibold)',
    textAlign: 'center',
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    borderBottom: '1px solid var(--cp-border)',
    whiteSpace: 'normal',
    lineHeight: 'var(--cp-leading-tight)',
    overflowWrap: 'anywhere',
    verticalAlign: 'bottom',
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
    padding: 'var(--cp-space-1) var(--cp-space-2)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-semibold)',
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-0)',
    borderBottom: '1px solid var(--cp-border)',
    whiteSpace: 'normal',
    lineHeight: 'var(--cp-leading-tight)',
    overflowWrap: 'anywhere',
    verticalAlign: 'middle',
  },
  tdCell: {
    padding: 'var(--cp-space-1)',
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: '1px solid var(--cp-border)',
    borderLeft: '1px solid var(--cp-border)',
    verticalAlign: 'middle',
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
