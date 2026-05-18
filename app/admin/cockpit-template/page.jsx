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
  wrap: { display: 'flex', flexDirection: 'column', gap: 'var(--ct-space-6)' },
  eyebrow: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ct-text-muted)',
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--ct-text-primary)',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  sub: { fontSize: 13, color: 'var(--ct-text-muted)', margin: 0 },

  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
  kpiCard: {
    background: 'var(--ct-surface-1)',
    border: '1px solid var(--ct-border)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: 'var(--ct-shadow-depth)',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    color: 'var(--ct-text-muted)',
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: 800,
    color: 'var(--ct-text-primary)',
    letterSpacing: '-0.02em',
  },

  card: {
    background: 'var(--ct-surface-1)',
    border: '1px solid var(--ct-border)',
    borderRadius: 12,
    padding: '20px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    boxShadow: 'var(--ct-shadow-depth)',
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: 'var(--ct-text-muted)',
  },
  cardBody: {
    fontSize: 13,
    color: 'var(--ct-text-body)',
    margin: 0,
    lineHeight: 1.6,
  },
};
