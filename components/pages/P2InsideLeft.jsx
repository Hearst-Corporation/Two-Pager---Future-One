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

      {/* ============== SPLIT BAND : gauche blanche / droite noire ============== */}
      <section style={S.darkBand}>
        <div style={S.bandWhite}>
          <div style={S.hearstBox}>
            <img src="/hearst-h.svg" alt="Hearst H" style={S.hearstLogo} />
          </div>
        </div>
        <div style={S.bandDark}>
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
              <strong>Hearst Qatar</strong> · designed by <strong>Foster</strong>,
              <br />
              built by <strong>JB Pastor & Fils</strong>.
            </>
          }
        />
        <FooterCol
          icon="stack"
          title="TECHNOLOGY STACK"
          body={
            <>
              Tier-1 hyperscalers
              <br />
              and silicon partners.
            </>
          }
        />
        <FooterCol
          icon="shield"
          title="QATAR LABEL PROGRAM"
          body={
            <>
              0% tax · Full ownership ·
              <br />
              Housing & healthcare.
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

function ServerRack() {
  const units = [
    { label: 'NVIDIA H200', leds: ['green', 'green', 'red'] },
    { label: 'NVIDIA H200', leds: ['green', 'green', 'green'] },
    { label: 'NVIDIA H100', leds: ['green', 'amber', 'green'] },
    { label: 'NVIDIA H100', leds: ['green', 'green', 'green'] },
    { label: 'NETWORK · 400G', leds: ['green', 'green'] },
    { label: 'STORAGE NVMe', leds: ['green', 'green', 'green'] },
  ];
  return (
    <div style={S.rackWrap}>
      <div style={S.rack}>
        <div style={S.rackHeader}>
          <span>NVIDIA · DGX</span>
          <span style={S.rackPower}>● PWR</span>
        </div>
        {units.map((u, i) => (
          <div key={i} style={S.rackUnit}>
            <div style={S.rackHandle} />
            <div style={S.rackLeds}>
              {u.leds.map((c, j) => (
                <div key={j} style={{ ...S.rackLed, background: ledColor(c) }} />
              ))}
            </div>
            <div style={S.rackLabel}>{u.label}</div>
            <div style={S.rackVent}>
              <div style={S.rackVentLine} />
              <div style={S.rackVentLine} />
              <div style={S.rackVentLine} />
            </div>
          </div>
        ))}
      </div>
      <div style={S.rackCaption}>Sovereign-grade compute</div>
    </div>
  );
}

function ledColor(c) {
  if (c === 'green') return '#22c55e';
  if (c === 'amber') return '#f59e0b';
  if (c === 'red') return 'var(--color-accent-soft)';
  return '#999';
}

function FooterCol({ icon, title, body }) {
  return (
    <div style={S.footerCol}>
      <ShapeIcon shape={icon} on="footer" />
      <div>
        <div style={S.footerTitle}>{title}</div>
        <div style={S.footerBody}>{body}</div>
      </div>
    </div>
  );
}

function ShapeIcon({ shape, on = 'dark' }) {
  const stroke = on === 'light' ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.55)';
  const size = on === 'dark' ? 18 : 14;
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
   hero(270) + darkBand(160) + building(200) + footer(50) = 680. */

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
    backgroundImage: 'url(/hero-datacenter.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
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

  /* SPLIT BAND (gauche blanche / droite noire) */
  darkBand: {
    ...SECTION,
    height: 160,
    display: 'flex',
  },
  bandWhite: {
    flex: '0 0 50%',
    background: 'var(--color-surface)',
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    color: 'var(--color-text-primary)',
    position: 'relative',
  },
  proprietaryTitle: {
    fontSize: 7.5,
    letterSpacing: 1.4,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
    alignSelf: 'flex-start',
  },
  hearstBox: {
    flex: 1,
    width: '100%',
    background: 'var(--color-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  hearstLogo: {
    height: '100%',
    width: 'auto',
    display: 'block',
  },

  /* SERVER RACK schematic */
  rackWrap: {
    width: '100%',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  rack: {
    width: 110,
    border: '1.5px solid var(--color-gray-900)',
    borderRadius: 3,
    overflow: 'hidden',
    boxShadow: '0 2px 4px rgba(0,0,0,.15)',
  },
  rackHeader: {
    fontSize: 5,
    fontWeight: 700,
    color: '#fff',
    padding: '3px 6px',
    letterSpacing: 0.6,
    background: 'linear-gradient(180deg, #2a2a2a, #14171B)',
    borderBottom: '1px solid #444',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rackPower: {
    fontSize: 4.5,
    color: '#22c55e',
  },
  rackUnit: {
    display: 'flex',
    alignItems: 'center',
    gap: 3,
    padding: '3px 5px',
    borderBottom: '1px solid #2a2a2a',
    background: 'linear-gradient(180deg, #1a1a1a, #0e0e0e)',
  },
  rackHandle: {
    width: 3,
    height: 6,
    border: '1px solid #555',
    borderRadius: 1,
    flexShrink: 0,
  },
  rackLeds: {
    display: 'flex',
    gap: 1.5,
    flexShrink: 0,
  },
  rackLed: {
    width: 2.5,
    height: 2.5,
    borderRadius: '50%',
    boxShadow: '0 0 1.5px currentColor',
  },
  rackLabel: {
    flex: 1,
    fontSize: 4.5,
    color: '#9a9a9a',
    fontWeight: 600,
    letterSpacing: 0.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  rackVent: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    flexShrink: 0,
  },
  rackVentLine: {
    width: 8,
    height: 1,
    background: '#333',
  },
  rackCaption: {
    fontSize: 5.5,
    color: 'var(--color-text-muted)',
    fontStyle: 'italic',
    marginTop: 2,
  },
  bandDark: {
    flex: '0 0 50%',
    background: 'var(--color-dark-surface)',
    color: 'var(--color-text-inverse)',
    padding: '24px 22px 14px',
  },
  eyebrow: {
    fontSize: 6.5,
    letterSpacing: 1.4,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
    marginBottom: 5,
  },
  darkHeadline: {
    fontSize: 11,
    lineHeight: 1.2,
    fontStyle: 'italic',
    fontWeight: 500,
  },
  darkHeadlineAccent: {
    color: 'var(--color-accent-soft)',
  },
  darkBody: {
    fontSize: 6.5,
    lineHeight: 1.4,
    margin: '5px 0 0',
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
    gap: 8,
    minWidth: 0,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: -0.3,
    whiteSpace: 'nowrap',
    color: 'var(--color-text-inverse)',
  },
  statLabel: {
    fontSize: 5,
    color: 'rgba(255,255,255,.75)',
    marginTop: 3,
    letterSpacing: 0.5,
    fontWeight: 600,
    whiteSpace: 'pre-line',
    lineHeight: 1.2,
  },

  /* BUILDING */
  building: {
    ...SECTION,
    height: 200,
    position: 'relative',
    backgroundImage: 'url(/p2-building.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  buildingOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,.45) 70%, rgba(0,0,0,.7) 100%)',
    pointerEvents: 'none',
  },
  buildingStats: {
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: 16,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    gap: 10,
    color: 'var(--color-text-inverse)',
  },

  /* FOOTER */
  footer: {
    ...SECTION,
    height: 50,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: 12,
    padding: '8px 18px',
    background: 'var(--color-dark-surface)',
    color: 'var(--color-text-inverse)',
  },
  footerCol: {
    display: 'flex',
    gap: 5,
    alignItems: 'flex-start',
  },
  footerTitle: {
    fontSize: 7,
    letterSpacing: 1.2,
    fontWeight: 700,
    marginBottom: 3,
    color: 'var(--color-accent-soft)',
  },
  footerBody: {
    fontSize: 6.5,
    lineHeight: 1.35,
    color: 'var(--color-gray-300)',
  },
};
