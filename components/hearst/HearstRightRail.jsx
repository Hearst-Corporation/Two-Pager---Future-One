'use client';

import { useState } from 'react';

const ITEMS = [
  { id: 'sources', title: 'Score sources sous seuil', snippet: '0 % — seuil IC 70 %', hot: true },
  { id: 'data-room', title: 'Data room incomplète', snippet: '0/0 documents — 0 %' },
  { id: 'capex', title: 'CAPEX/MW sans source', snippet: 'Hypothèse critique non sourcée' },
];

function RailItem({ item }) {
  const [hover, setHover] = useState(false);
  const isHot = item.hot;
  return (
    <button
      type="button"
      aria-label={`${item.title}: ${item.snippet}`}
      style={{
        ...S.item,
        ...(isHot ? S.itemHot : {}),
        ...(hover ? S.itemHover : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={S.itemBody}>
        {item.title}
        <span style={{ ...S.itemSnippet, ...(isHot ? S.itemSnippetHot : {}) }}>
          {item.snippet}
        </span>
      </span>
    </button>
  );
}

export default function HearstRightRail({ children }) {
  return (
    <aside aria-label="Advisor et alertes prioritaires" className="cockpit-rail-right" style={S.rail}>
      {children && (
        <div style={S.chatSlot}>
          {children}
        </div>
      )}
      <div style={S.alertsBlock}>
        <h3 style={S.title}>Alertes prioritaires</h3>
        <div style={S.list}>
          {ITEMS.map((item) => (
            <RailItem key={item.id} item={item} />
          ))}
        </div>
      </div>
    </aside>
  );
}

const S = {
  rail: {
    position: 'relative',
    zIndex: 'var(--cp-z-rails)',
    width: 'var(--cp-rail-right)',
    flexShrink: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 0,
  },
  chatSlot: {
    flex: 1,
    minHeight: '200px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    borderBottom: '1px solid var(--cp-border-strong)',
  },
  alertsBlock: {
    flexShrink: 0,
    padding: 'var(--cp-space-6) var(--cp-space-5) var(--cp-space-5)',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  title: {
    fontSize: 'var(--cp-font-sm)',
    fontWeight: 'var(--cp-weight-medium)',
    color: 'var(--cp-text-muted)',
    letterSpacing: 'var(--cp-tracking-wide)',
    textTransform: 'uppercase',
    margin: '0 0 var(--cp-space-4) 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 'var(--cp-space-2)',
  },
  item: {
    appearance: 'none',
    border: 'none',
    background: 'var(--cp-surface-0)',
    color: 'var(--cp-text-body)',
    textAlign: 'left',
    padding: 'var(--cp-space-3) var(--cp-space-4)',
    borderRadius: 'var(--cp-radius-md)',
    fontSize: 'var(--cp-font-sm)',
    lineHeight: 'var(--cp-leading-normal)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 'var(--cp-space-4)',
    transition: 'background var(--cp-dur-base) var(--cp-ease), color var(--cp-dur-base) var(--cp-ease)',
  },
  itemHover: {
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-strong)',
  },
  itemHot: {
    background: 'var(--cp-surface-2)',
    color: 'var(--cp-text-strong)',
    borderLeft: '3px solid var(--cp-accent-strong)',
    paddingLeft: 'calc(var(--cp-space-4) - 3px)',
  },
  itemBody: {
    display: 'block',
    lineHeight: 'var(--cp-leading-normal)',
  },
  itemSnippet: {
    display: 'block',
    marginTop: 'var(--cp-space-1)',
    fontSize: 'var(--cp-font-xs)',
    color: 'var(--cp-text-faint)',
  },
  itemSnippetHot: {
    color: 'var(--cp-text-body)',
  },
};
