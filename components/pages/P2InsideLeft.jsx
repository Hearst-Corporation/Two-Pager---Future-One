'use client';

/**
 * P2 — Intérieur gauche (numéroté "01 / 04" dans le doc).
 * Reproduit la grille du visuel envoyé par l'utilisateur :
 *   - Hero haut (image data-center) + titre + intro + citation
 *   - Bande sombre : "The Opportunity" + 4 stats (2x2)
 *   - Image bâtiment
 *   - Footer 3 colonnes : Built By / Tech Stack / Qatar Label
 *
 * Style volontairement neutre : fonte système, palette gris/noir/blanc,
 * pas d'emoji ni de couleur d'accent. Tokens définitifs à appliquer après.
 */
export default function P2InsideLeft() {
  return (
    <div style={S.page}>
      {/* ============== TOP HERO ============== */}
      <section style={S.hero}>
        <div style={S.heroImage} aria-label="Placeholder — image data center" />
        <div style={S.heroOverlay} />

        <div style={S.tag}>ALIGNED WITH QNV 2030</div>
        <div style={S.pageNum}>
          <div>01 / 04</div>
          <div style={S.pageNumBar} />
        </div>

        <div style={S.heroContent}>
          <h1 style={S.title}>
            FUTUR ONE
            <br />
            <span style={S.titleAccent}>NO LIMITS,</span>
            <br />
            BY AI.
          </h1>

          <p style={S.intro}>
            <strong>FUTUR ONE</strong> is an AI sovereign innovation hub operated by{' '}
            <strong>Hearst Qatar</strong> in partnership with top-tier global players.
          </p>

          <blockquote style={S.quote}>
            <span style={S.quoteMark}>"</span>
            We will allocate compute capacity, energy, and HPC infrastructure to support the
            development of your projects at the scale required to empower the next generation of
            founders and future industry leaders.
          </blockquote>
        </div>
      </section>

      {/* ============== DARK BAND ============== */}
      <section style={S.darkBand}>
        <div style={S.darkLeft}>
          <div style={S.eyebrow}>THE OPPORTUNITY</div>
          <div style={S.darkHeadline}>
            High-potential founders.
            <br />
            Undercapitalized markets.
            <br />
            <span style={S.darkHeadlineAccent}>Sovereign-grade infrastructure.</span>
          </div>
          <p style={S.darkBody}>
            <strong>FUTUR ONE</strong> concentrates compute, capital and living infrastructure into
            one controlled environment designed to accelerate company creation and scale.
          </p>
          <p style={S.darkBody}>
            A controlled ecosystem where infrastructure, residency and capital operate as one
            sovereign platform.
          </p>
        </div>

        <div style={S.statsGrid}>
          <Stat shape="square" value="150" label={`STARTUPS MAX\nCAPACITY`} />
          <Stat shape="circle" value="4 K" label={`RESIDENTS\n(FOUNDERS & TEAMS)`} />
          <Stat shape="grid" value="100 K" label={`SQM TOTAL\nCAMPUS`} />
          <Stat shape="bolt" value="€400M" label={`PHASE 1\nCAPEX`} />
        </div>
      </section>

      {/* ============== BUILDING IMAGE ============== */}
      <section style={S.building} aria-label="Placeholder — image campus" />

      {/* ============== FOOTER 3 COLS ============== */}
      <section style={S.footer}>
        <FooterCol
          icon="hex"
          title="BUILT BY"
          body={
            <>
              <strong>Hearst Qatar</strong> — Sovereign Project Initiator & Strategic Operator.
              <br />
              Designed by Pritzker Prize architect <strong>Lord Norman Foster</strong>.
              <br />
              Engineering & Construction by <strong>JB Pastor & Fils</strong>, Monaco.
            </>
          }
        />
        <FooterCol
          icon="stack"
          title="TECHNOLOGY STACK"
          body={<>In collaboration with Tier-1 hyperscalers and silicon partners.</>}
        />
        <FooterCol
          icon="shield"
          title="QATAR LABEL PROGRAM"
          body={
            <>
              Official certification for high-potential companies.
              <br />
              0% tax environment • Fast company setup.
              <br />
              Full ownership • Housing, education, healthcare packages.
            </>
          }
        />
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function Stat({ shape, value, label }) {
  return (
    <div style={S.stat}>
      <ShapeIcon shape={shape} />
      <div>
        <div style={S.statValue}>{value}</div>
        <div style={S.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function FooterCol({ icon, title, body }) {
  return (
    <div style={S.footerCol}>
      <ShapeIcon shape={icon} on="light" />
      <div>
        <div style={S.footerTitle}>{title}</div>
        <div style={S.footerBody}>{body}</div>
      </div>
    </div>
  );
}

function ShapeIcon({ shape, on = 'dark' }) {
  const stroke = on === 'dark' ? 'rgba(255,255,255,.55)' : 'rgba(0,0,0,.55)';
  const size = on === 'dark' ? 18 : 16;
  return (
    <div
      style={{
        width: size,
        height: size,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: shape === 'circle' ? `1px solid ${stroke}` : 'none',
        borderRadius: shape === 'circle' ? '50%' : 0,
      }}
    >
      {shape === 'square' && <div style={{ width: '70%', height: '70%', border: `1px solid ${stroke}` }} />}
      {shape === 'grid' && (
        <div
          style={{
            width: '78%',
            height: '78%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gridTemplateRows: '1fr 1fr',
            gap: 1,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ border: `1px solid ${stroke}` }} />
          ))}
        </div>
      )}
      {shape === 'bolt' && (
        <div style={{ fontSize: size * 0.7, lineHeight: 1, color: stroke, fontWeight: 700 }}>↯</div>
      )}
      {shape === 'hex' && (
        <div
          style={{
            width: '80%',
            height: '80%',
            border: `1px solid ${stroke}`,
            transform: 'rotate(30deg)',
            clipPath: 'polygon(50% 0, 100% 25%, 100% 75%, 50% 100%, 0 75%, 0 25%)',
          }}
        />
      )}
      {shape === 'stack' && (
        <div style={{ width: '78%', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ height: 2, background: stroke }} />
          <div style={{ height: 2, background: stroke }} />
          <div style={{ height: 2, background: stroke }} />
        </div>
      )}
      {shape === 'shield' && (
        <div
          style={{
            width: '70%',
            height: '80%',
            border: `1px solid ${stroke}`,
            borderRadius: '50% 50% 30% 30% / 20% 20% 80% 80%',
          }}
        />
      )}
    </div>
  );
}

/* ---------- styles ---------- */
/* Page totale = 680px. Sections en pixels exacts.
   hero(320) + darkBand(170) + building(100) + footer(90) = 680. */

const SECTION = { flexShrink: 0, flexGrow: 0, minHeight: 0, overflow: 'hidden' };

const S = {
  page: {
    width: '100%',
    height: '100%',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  /* HERO */
  hero: {
    ...SECTION,
    position: 'relative',
    height: 270,
    color: 'var(--color-text-inverse)',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, var(--color-gray-850) 0%, var(--color-gray-750) 30%, var(--color-gray-600) 60%, var(--color-gray-850) 100%)',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(90deg, rgba(0,0,0,.55) 0%, rgba(0,0,0,.2) 55%, rgba(0,0,0,0) 80%)',
  },
  tag: {
    position: 'absolute',
    top: 18,
    left: 22,
    fontSize: 8,
    letterSpacing: 1.6,
    fontWeight: 700,
    color: 'var(--color-gray-300)',
    zIndex: 2,
  },
  pageNum: {
    position: 'absolute',
    top: 18,
    right: 22,
    fontSize: 9,
    fontWeight: 500,
    textAlign: 'right',
    color: 'var(--color-gray-200)',
    zIndex: 2,
  },
  pageNumBar: {
    width: 18,
    height: 1.5,
    background: 'var(--color-gray-400)',
    marginLeft: 'auto',
    marginTop: 3,
  },
  heroContent: {
    position: 'absolute',
    left: 22,
    top: 46,
    width: '54%',
    zIndex: 2,
  },
  title: {
    fontSize: 28,
    lineHeight: 0.98,
    fontWeight: 800,
    letterSpacing: -0.6,
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  intro: {
    marginTop: 12,
    fontSize: 8.5,
    lineHeight: 1.4,
    color: 'var(--color-gray-200)',
  },
  quote: {
    margin: '10px 0 0',
    paddingLeft: 14,
    position: 'relative',
    fontSize: 8,
    lineHeight: 1.4,
    fontStyle: 'italic',
    color: 'var(--color-gray-300)',
  },
  quoteMark: {
    position: 'absolute',
    left: 0,
    top: -3,
    fontSize: 18,
    lineHeight: 1,
    color: 'var(--color-gray-400)',
    fontStyle: 'normal',
  },

  /* DARK BAND */
  darkBand: {
    ...SECTION,
    height: 220,
    background: 'var(--color-dark-surface)',
    color: 'var(--color-text-inverse)',
    padding: '14px 22px',
    display: 'flex',
    gap: 16,
  },
  darkLeft: {
    flex: '0 0 50%',
  },
  eyebrow: {
    fontSize: 7.5,
    letterSpacing: 1.6,
    fontWeight: 700,
    color: 'var(--color-gray-400)',
    marginBottom: 8,
  },
  darkHeadline: {
    fontSize: 14,
    lineHeight: 1.25,
    fontStyle: 'italic',
    fontWeight: 500,
  },
  darkHeadlineAccent: {
    color: 'var(--color-accent-soft)',
  },
  darkBody: {
    fontSize: 8,
    lineHeight: 1.5,
    margin: '8px 0 0',
    color: 'var(--color-gray-300)',
  },

  /* STATS */
  statsGrid: {
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    borderTop: '1px solid rgba(255,255,255,.12)',
    borderLeft: '1px solid rgba(255,255,255,.12)',
  },
  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 8px',
    borderRight: '1px solid rgba(255,255,255,.12)',
    borderBottom: '1px solid rgba(255,255,255,.12)',
    minWidth: 0,
  },
  statValue: {
    fontSize: 17,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: -0.3,
    whiteSpace: 'nowrap',
  },
  statLabel: {
    fontSize: 6,
    color: 'var(--color-gray-400)',
    marginTop: 4,
    letterSpacing: 0.6,
    fontWeight: 600,
    whiteSpace: 'pre-line',
    lineHeight: 1.2,
  },

  /* BUILDING */
  building: {
    ...SECTION,
    height: 100,
    background:
      'linear-gradient(180deg, var(--color-gray-500) 0%, var(--color-gray-700) 60%, var(--color-gray-800) 100%)',
  },

  /* FOOTER */
  footer: {
    ...SECTION,
    height: 90,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 14,
    padding: '12px 18px',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
  },
  footerCol: {
    display: 'flex',
    gap: 8,
  },
  footerTitle: {
    fontSize: 7,
    letterSpacing: 1.2,
    fontWeight: 700,
    marginBottom: 3,
    color: 'var(--color-text-primary)',
  },
  footerBody: {
    fontSize: 6.5,
    lineHeight: 1.4,
    color: 'var(--color-text-secondary)',
  },
};
