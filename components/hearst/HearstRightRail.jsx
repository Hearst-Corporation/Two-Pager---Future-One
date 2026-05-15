'use client';

const ITEMS = [
  { id: 'sources', title: 'Score sources sous seuil', snippet: '0 % — seuil IC 70 %', hot: true },
  { id: 'data-room', title: 'Data room incomplète', snippet: '0/0 documents — 0 %' },
  { id: 'capex', title: 'CAPEX/MW sans source', snippet: 'Hypothèse critique non sourcée' },
];

export default function HearstRightRail() {
  return (
    <aside aria-label="Contexte" className="cockpit-rail-right" style={S.rail}>
      <h3 style={S.title}>Alertes prioritaires</h3>
      <div style={S.list}>
        {ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            style={{ ...S.item, ...(item.hot ? S.itemHot : {}) }}
          >
            <span style={S.itemBody}>
              {item.title}
              <span style={{ ...S.itemSnippet, ...(item.hot ? S.itemSnippetHot : {}) }}>
                {item.snippet}
              </span>
            </span>
          </button>
        ))}
      </div>
    </aside>
  );
}

const S = {
  rail: {
    position: 'relative',
    zIndex: 20,
    width: 320,
    flexShrink: 0,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '56px 32px',
    overflowY: 'auto',
  },
  title: {
    fontSize: 13,
    fontWeight: 500,
    color: 'rgba(245, 245, 245, 0.40)',
    paddingLeft: 16,
    marginBottom: 16,
    margin: '0 0 16px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  item: {
    appearance: 'none',
    border: 'none',
    background: 'transparent',
    color: 'rgba(245, 245, 245, 0.65)',
    textAlign: 'left',
    padding: 16,
    borderRadius: 8,
    fontSize: 15,
    lineHeight: 1.35,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 16,
    transition: 'background 0.15s ease, color 0.15s ease',
  },
  itemHot: {
    background: 'rgba(255, 255, 255, 0.08)',
    color: '#ffffff',
  },
  itemBody: {
    display: 'block',
    lineHeight: 1.35,
  },
  itemSnippet: {
    display: 'block',
    marginTop: 4,
    fontSize: 13,
    color: 'rgba(245, 245, 245, 0.40)',
  },
  itemSnippetHot: {
    color: 'rgba(245, 245, 245, 0.65)',
  },
};
