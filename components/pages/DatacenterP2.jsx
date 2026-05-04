'use client';

/**
 * DatacenterP2 — One-pager "Partner Stack" pour /datacenter.
 * Reprend EXACTEMENT le layout de P2InsideLeft (locks 270/220/100/90),
 * remplace uniquement textes et footer pour mettre en avant les partenaires
 * datacenter/mining de Hearst : Kontena · B-Global Tech · Gatti Services.
 * Hardware & control plane propriétaires Hearst poussés dans le dark band.
 */
export default function DatacenterP2() {
  return (
    <div style={S.page}>
      {/* ============== TOP HERO (270px) ============== */}
      <section style={S.hero}>
        <div style={S.heroImage} />
        <div style={S.heroOverlay} />

        <div style={S.tag}>BUILT WITH WORLD-CLASS PARTNERS</div>

        <div style={S.heroContent}>
          <h1 style={S.title}>
            WE BUILD WITH
            <br />
            <span style={S.titleAccent}>THE BEST.</span>
            <br />
            NOTHING LESS.
          </h1>

          <p style={S.intro}>
            Hearst Qatar partners with the operators, engineers and builders<br />
            who already power the world's most demanding compute and<br />
            mining sites. Sovereign-grade requires sovereign-grade partners.
          </p>

          <blockquote style={S.quote}>
            From <strong>industrial Bitcoin mining</strong> to <strong>AI supercomputing</strong> — we deploy
            proprietary hardware, modular architectures and 24/7 operations
            at industrial scale, with a track record across four continents.
          </blockquote>
        </div>
      </section>

      {/* ============== DARK BAND (220px) ============== */}
      <section style={S.darkBand}>
        {/* Left: Logo Block */}
        <div style={S.logoBlock}>
          {/* 360° Edge Texts */}
        <div style={{ ...S.edgeText, ...S.edgeTop }}>DESIGN</div>
        <div style={{ ...S.edgeText, ...S.edgeRight }}>BUILD</div>
        <div style={{ ...S.edgeText, ...S.edgeBottom }}>OPERATE</div>
        <div style={{ ...S.edgeText, ...S.edgeLeft }}>HARDWARE</div>

          <img src="/hearst-h.svg" alt="Hearst H" style={S.hearstLogo} />
        </div>

        {/* Right: Text Block */}
        <div style={S.textBlock}>
          <div style={S.eyebrow}>THE PARTNER STACK</div>
          <div style={S.darkHeadline}>
            Mining-grade resilience.
            <br />
            Hyperscale-grade engineering.
            <br />
            <span style={S.darkHeadlineAccent}>One sovereign stack.</span>
          </div>
          <p style={S.darkBody}>
            From industrial Bitcoin mining to AI supercomputing, Hearst<br />
            masters both ends of the compute spectrum — and brings<br />
            <strong>proprietary hardware and a sovereign control plane</strong> into every site.
          </p>
          <p style={S.darkBody}>
            Three world-class partners. One sovereign operator. Built in<br />
            Qatar, governed by <strong>Hearst</strong>, deployed to industrial standard.
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
          logoSrc="/partners/kontena.svg"
          logoAlt="Kontena"
          body={
            <>
              Modular AI/HPC data centers.<br />
              <strong>Proprietary modular architecture.</strong>
            </>
          }
          website="kontena.tech"
        />
        <FooterCol
          logoSrc="/partners/bglobal.svg"
          logoAlt="B-Global Tech"
          body={
            <>
              Data center engineering.<br />
              <strong>8 offices · 4 continents · 15+ yrs.</strong>
            </>
          }
          website="b-global.tech"
        />
        <FooterCol
          logoSrc="/partners/gatti.svg"
          logoAlt="Gatti Services"
          body={
            <>
              24/7 ops & Smart PDUs.<br />
              <strong>Proprietary hardware in the rack.</strong>
            </>
          }
          website="gatti-services.com"
        />
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function FooterCol({ logoSrc, logoAlt, body, website }) {
  return (
    <div style={S.footerCol}>
      <img src={logoSrc} alt={logoAlt} style={S.footerLogo} />
      <div style={S.footerBody}>{body}</div>
      {website && <div style={S.footerWebsite}>{website}</div>}
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
    backgroundImage: "url('/u2883995211_Aerial_view_of_Qatari_national_infrastructure_compl_7847dc8e-b81a-4064-ab48-565fdfc5a324.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 50%',
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
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  footerLogo: {
    height: 18,
    width: 'auto',
    maxWidth: '100%',
    display: 'block',
    objectFit: 'contain',
    objectPosition: 'left center',
  },
  footerBody: {
    fontSize: 6,
    lineHeight: 1.35,
    color: 'var(--color-gray-300)',
    fontWeight: 500,
  },
  footerWebsite: {
    fontSize: 6.5,
    fontWeight: 800,
    letterSpacing: 0.5,
    color: 'var(--color-accent-strong)',
    textTransform: 'lowercase',
    marginTop: 1,
  },
};
