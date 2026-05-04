'use client';

/**
 * P2 — Intérieur gauche (numéroté "01 / 04" dans le doc).
 * Reproduit EXACTEMENT la maquette fournie dans la capture d'écran :
 * - Hero : Robot avec citation (ligne rouge).
 * - Dark Band : Bloc blanc avec logo "H/N" à gauche, texte à droite.
 * - Building : Data center rouge.
 * - Footer : Bande sombre avec 3 colonnes et icônes.
 */
export default function P2InsideLeft() {
  return (
    <div style={S.page}>
      {/* ============== TOP HERO (270px) ============== */}
      <section style={S.hero}>
        <div style={S.heroImage} />
        <div style={S.heroOverlay} />

        <div style={S.tag}>ALIGNED WITH QATAR NATIONAL VISION 2030</div>

        <div style={S.heroContent}>
          <h1 style={S.title}>
            FUTUR ONE
            <br />
            <span style={S.titleAccent}>THE NEXT</span>
            <br />
            STRATEGIC RESOURCE.
          </h1>

          <p style={S.intro}>
            Qatar built one of the world's most successful sovereign industries<br />
            on the strategic resource of the 20th century.<br />
            The next one is <strong>intelligence</strong>.
          </p>

          <blockquote style={S.quote}>
            <strong>FUTUR ONE</strong> is the proposed sovereign vehicle to capture,
            deploy and govern that resource — founded and operated by
            <strong>Hearst Qatar</strong>.
          </blockquote>
        </div>
      </section>

      {/* ============== DARK BAND (220px) ============== */}
      <section style={S.darkBand}>
        {/* Left: Logo Block */}
        <div style={S.logoBlock}>
          {/* 360° Edge Texts */}
        <div style={{ ...S.edgeText, ...S.edgeTop }}>COMPUTE</div>
        <div style={{ ...S.edgeText, ...S.edgeRight }}>ENERGY</div>
        <div style={{ ...S.edgeText, ...S.edgeBottom }}>CAPITAL</div>
        <div style={{ ...S.edgeText, ...S.edgeLeft }}>TALENT</div>

          <img src="/hearst-h.svg" alt="Hearst H" style={S.hearstLogo} />
        </div>

        {/* Right: Text Block */}
        <div style={S.textBlock}>
          <div style={S.eyebrow}>THE STRATEGIC THESIS</div>
          <div style={S.darkHeadline}>
            Compute is the new oil and gas.
            <br />
            Sovereign control is the new advantage.
            <br />
            <span style={S.darkHeadlineAccent}>The window is now.</span>
          </div>
          <p style={S.darkBody}>
            Within the next decade, sovereign AI compute capacity will<br />
            determine which states sit at the table of global economic<br />
            and security decisions.
          </p>
          <p style={S.darkBody}>
            <strong>FUTUR ONE</strong> proposes the architecture to put Qatar at that<br />
            table — built domestically, governed sovereignly, operated<br />
            to industrial standard.
          </p>
        </div>
      </section>

      {/* ============== BUILDING IMAGE (100px) ============== */}
      <section style={S.building}>
        <div style={S.buildingImage} />
      </section>

      {/* ============== FOOTER 3 COLS (90px) ============== */}
      <section style={S.footer}>
        <FooterCol
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          }
          title="FOUNDED & OPERATED BY"
          body={
            <>
              <strong>Hearst Qatar.</strong>
            </>
          }
        />
        <FooterCol
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 4H4v4 M16 4h4v4 M8 20H4v-4 M16 20h4v-4" />
            </svg>
          }
          title="BUILT BY"
          body={
            <>
              Designed by <strong>Foster + Partners</strong>.<br />
              Built by <strong>JB Pastor & Fils</strong>.
            </>
          }
        />
        <FooterCol
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 6h16 M4 12h16 M4 18h16" />
            </svg>
          }
          title="PROPOSED STRUCTURE"
          body={
            <>
              Sovereign joint venture.
            </>
          }
        />
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function FooterCol({ icon, title, body }) {
  return (
    <div style={S.footerCol}>
      <div style={S.footerIcon}>{icon}</div>
      <div>
        <div style={S.footerTitle}>{title}</div>
        <div style={S.footerBody}>{body}</div>
      </div>
    </div>
  );
}

/* ---------- styles ---------- */
/* Page totale = 680px. Sections en pixels exacts.
   hero(270) + darkBand(220) + building(100) + footer(90) = 680. */

const SECTION = { flexShrink: 0, flexGrow: 0, minHeight: 0, overflow: 'hidden' };

const S = {
  page: {
    width: '100%',
    height: '100%',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },

  /* HERO (270px) */
  hero: {
    ...SECTION,
    position: 'relative',
    height: 270,
    color: 'var(--color-text-inverse)',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('/u2883995211_Futuristic_autonomous_data_center_sleek_white_and_g_c37cb699-e8fc-449d-b31f-380b4bde83a2.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 20%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(90deg, rgba(26,29,36,0.85) 0%, rgba(26,29,36,0.5) 45%, rgba(26,29,36,0) 100%)',
  },
  tag: {
    position: 'absolute',
    top: 22,
    left: 26,
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: 700,
    color: 'var(--color-gray-300)',
    zIndex: 2,
    textTransform: 'uppercase',
  },
  pageNum: {
    position: 'absolute',
    top: 22,
    right: 26,
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'right',
    color: 'var(--color-text-inverse)',
    zIndex: 2,
    letterSpacing: 1,
  },
  heroContent: {
    position: 'absolute',
    left: 26,
    top: 35,
    width: '75%',
    zIndex: 2,
  },
  title: {
    fontSize: 34,
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: -1,
    margin: 0,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  intro: {
    marginTop: 16,
    fontSize: 7.5,
    lineHeight: 1.5,
    color: 'var(--color-gray-200)',
    fontWeight: 500,
  },
  quote: {
    margin: '16px 0 0',
    paddingLeft: 10,
    borderLeft: '2px solid var(--color-gray-400)',
    fontSize: 7,
    lineHeight: 1.5,
    fontStyle: 'italic',
    color: 'var(--color-gray-300)',
    fontWeight: 500,
  },
  quoteAuthor: {
    fontSize: 6,
    fontWeight: 800,
    fontStyle: 'normal',
    color: 'var(--color-surface)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* DARK BAND (233px) */
  darkBand: {
    ...SECTION,
    height: 233,
    display: 'flex',
  },
  logoBlock: {
    flex: '0 0 44%',
    backgroundColor: 'var(--color-surface)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid var(--color-border-light)',
    position: 'relative',
  },
  hearstLogo: {
    width: '55%',
    height: 'auto',
    display: 'block',
  },
  edgeText: {
    position: 'absolute',
    fontSize: 5.5,
    fontWeight: 700,
    letterSpacing: 3,
    color: 'var(--color-gray-700)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  edgeTop: {
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  edgeBottom: {
    bottom: 16,
    left: '50%',
    transform: 'translateX(-50%)',
  },
  edgeLeft: {
    left: 16,
    top: '50%',
    transform: 'translate(-50%, -50%) rotate(-90deg)',
  },
  edgeRight: {
    right: 16,
    top: '50%',
    transform: 'translate(50%, -50%) rotate(90deg)',
  },
  textBlock: {
    flex: 1,
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    padding: '30px 26px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 1.5,
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  darkHeadline: {
    fontSize: 14,
    lineHeight: 1.2,
    fontWeight: 700,
    fontStyle: 'italic',
    letterSpacing: -0.5,
  },
  darkHeadlineAccent: {
    color: 'var(--color-accent-strong)',
  },
  darkBody: {
    fontSize: 7,
    lineHeight: 1.5,
    margin: '12px 0 0',
    color: 'var(--color-gray-300)',
    fontWeight: 500,
  },

  /* BUILDING (100px) */
  building: {
    ...SECTION,
    height: 100,
    position: 'relative',
  },
  buildingImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('/u2883995211_httpss.mj.runAqWLlCjmmwo_Futuristic_digital_inside__cf0c651c-4400-4007-8b65-e9266d3fa6e7.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 50%',
  },

  /* FOOTER (77px) */
  footer: {
    ...SECTION,
    height: 77,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    padding: '16px 26px',
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    alignItems: 'flex-start', /* Aligne tout en haut */
  },
  footerCol: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
  },
  footerIcon: {
    color: 'var(--color-gray-400)',
    marginTop: 0, /* Retire le margin-top pour que l'icône soit le point d'ancrage haut */
  },
  footerTitle: {
    fontSize: 7,
    letterSpacing: 1,
    fontWeight: 800,
    marginBottom: 6,
    color: 'var(--color-accent-strong)',
    textTransform: 'uppercase',
    lineHeight: 1,
    marginTop: 2, /* Aligne visuellement le texte avec le haut de l'icône */
  },
  footerBody: {
    fontSize: 6,
    lineHeight: 1.4,
    color: 'var(--color-gray-300)',
    fontWeight: 500,
  },
};
