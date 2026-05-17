'use client';

export default function CockpitTemplatePage() {
  return (
    <div style={S.wrap}>
      <div style={S.eyebrow}>COCKPIT TEMPLATE</div>
      <h1 style={S.title}>Titre de la page</h1>
      <p style={S.sub}>Remplacez ce contenu par vos composants.</p>

      {/* Exemple de grille KPI */}
      <div style={S.kpiGrid}>
        {['KPI 1', 'KPI 2', 'KPI 3', 'KPI 4'].map(label => (
          <div key={label} style={S.kpiCard}>
            <div style={S.kpiLabel}>{label}</div>
            <div style={S.kpiValue}>—</div>
          </div>
        ))}
      </div>

      {/* Exemple de carte contenu */}
      <div style={S.card}>
        <div style={S.cardTitle}>Section</div>
        <p style={S.cardBody}>Ajoutez votre contenu ici.</p>
      </div>
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 24 },
  eyebrow: { fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,245,245,0.48)' },
  title: { fontSize: 28, fontWeight: 800, color: 'rgba(245,245,245,0.92)', margin: 0, letterSpacing: '-0.02em' },
  sub: { fontSize: 13, color: 'rgba(245,245,245,0.55)', margin: 0 },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  kpiCard: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  kpiLabel: { fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,245,245,0.48)' },
  kpiValue: { fontSize: 28, fontWeight: 800, color: 'rgba(245,245,245,0.92)', letterSpacing: '-0.02em' },

  card: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.10)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  cardTitle: { fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(245,245,245,0.48)' },
  cardBody: { fontSize: 13, color: 'rgba(245,245,245,0.72)', margin: 0, lineHeight: 1.6 },
};
