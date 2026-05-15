'use client';
/* eslint-disable @next/next/no-img-element */

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
        <img src="/futur-one-h-accent.svg" alt="Hearst" style={S.heroLogo} />

        <div style={S.heroContent}>
          <h1 style={S.title}>
            WE BUILD WITH
            <br />
            <span style={S.titleAccent}>THE BEST.</span>
            <br />
            NOTHING LESS.
          </h1>

          <p style={S.intro}>
            Hearst Qatar partners with the engineers behind <strong>Yondr 200&nbsp;MW</strong>,<br />
            <strong>Sedenak 500&nbsp;MW</strong> and <strong>A*STAR's national supercomputer</strong> — from<br />
            Tier&nbsp;III hyperscale campuses in Asia to LEED-certified facilities in Europe.
          </p>
        </div>

        {/* KPIs alignés en bas du hero, en rouge */}
        <div style={S.heroKpis}>
          <HeroKpi value="500 MW" label="DEPLOYED" />
          <HeroKpi value="TIER III" label="LEED CERTIFIED" />
          <HeroKpi value="PUE 1.2" label="LIQUID COOLING" />
          <HeroKpi value="4 CONT." label="GLOBAL TRACK RECORD" />
        </div>
      </section>

      {/* ============== DARK BAND (220px) — split 44/56 : manifesto | photo ============== */}
      <section style={S.darkBand}>
        {/* Left : manifesto sur fond clair (à la place du H) */}
        <div style={S.manifestoBlock}>
          <img src="/hearst-h.svg" alt="" style={S.manifestoWatermark} />
          <div style={S.manifestoContent}>
            <div style={S.eyebrow}>THE PARTNER STACK</div>
            <div style={S.manifestoHeadline}>
              We don't outsource excellence.
              <br />
              <span style={S.darkHeadlineAccent}>We assemble it.</span>
            </div>
            <p style={S.manifestoBody}>
              Three world-class partners. Proprietary hardware.
              Mining-grade resilience meets hyperscale-grade engineering —
              governed by <strong>Hearst Qatar</strong>.
            </p>
          </div>
        </div>

        {/* Right : photo plein cadre */}
        <div style={S.darkBandPhoto} />
      </section>

      {/* ============== BUILDING IMAGE (125px) — 3 photos côte à côte ============== */}
      <section style={S.building}>
        <BuildingTile image="/partners/hardware.jpg" title="HARDWARE" />
        <BuildingTile image="/partners/connectivity.jpg" title="CONNECTIVITY" />
        <BuildingTile image="/partners/software.jpg" title="SOFTWARE" last />
      </section>

      {/* ============== FOOTER 3 COLS (90px) ============== */}
      <section style={S.footer}>
        <FooterCol
          logoSrc="/partners/kontena.svg"
          logoAlt="Kontena"
          watermarkSrc="/partners/kontena-icon.svg"
          line1="Modular AI/HPC data centers."
          line2="KONNECT modular DC platform."
          ceo="Jef Laurijssen, Founder"
          website="kontena.eu"
        />
        <FooterCol
          logoSrc="/partners/bglobal.svg"
          logoAlt="B-Global Tech"
          watermarkSrc="/partners/bglobal-icon.svg"
          line1="Data center engineering."
          line2="8 offices · 4 continents · 15+ yrs."
          ceo="Carles Cortadas, CEO"
          website="b-global.tech"
        />
        <FooterCol
          logoSrc="/partners/gatti.svg"
          logoAlt="Gatti Services"
          watermarkSrc="/partners/gatti-icon.svg"
          line1="24/7 Smart Hands · Smart PDUs."
          line2="Real-time power monitoring."
          ceo="Christof Stührmann, CEO"
          website="gatti-services.com"
        />
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function FooterCol({ logoSrc, logoAlt, line1, line2, ceo, website, watermarkSrc }) {
  return (
    <div style={S.footerCol}>
      {watermarkSrc && <img src={watermarkSrc} alt="" style={S.footerWatermark} />}
      <img src={logoSrc} alt={logoAlt} style={S.footerLogo} />
      <div style={S.footerLine1}>{line1}</div>
      <div style={S.footerLine2}>{line2}</div>
      {ceo && <div style={S.footerCeo}>{ceo}</div>}
      <div style={S.footerWebsite}>{website}</div>
    </div>
  );
}

function HeroKpi({ value, label }) {
  return (
    <div style={S.heroKpiItem}>
      <div style={S.heroKpiValue}>{value}</div>
      <div style={S.heroKpiLabel}>{label}</div>
    </div>
  );
}

function BuildingTile({ image, title, last }) {
  return (
    <div
      style={{
        ...S.buildingTile,
        backgroundImage: `url('${image}')`,
        ...(last ? { borderRight: 'none' } : null),
      }}
    >
      <div style={S.buildingTileOverlay} />
      <div style={S.buildingTileTitle}>{title}</div>
    </div>
  );
}

/* ---------- styles ---------- */
/* Page totale = 680px. Sections en pixels exacts.
   hero(270) + darkBand(195) + building(125) + footer(90) = 680.
   Variante /datacenter : photos building +25px, manifesto compacté. */

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
    background: `
      linear-gradient(90deg, rgba(26,29,36,0.85) 0%, rgba(26,29,36,0.5) 45%, rgba(26,29,36,0) 100%),
      linear-gradient(0deg, rgba(26,29,36,0.85) 0%, rgba(26,29,36,0) 35%)
    `,
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
  heroLogo: {
    position: 'absolute',
    top: 19, /* Ajustement au pixel près pour le centrage optique avec le texte */
    right: 26,
    height: 14,
    width: 'auto',
    zIndex: 2,
    color: 'var(--color-accent-strong)', /* Utilise la variable exacte du bordeaux/rouge accent */
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
  heroKpis: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: 16,
    zIndex: 2,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    paddingTop: 14,
    borderTop: '1px solid rgba(232, 65, 66, 0.5)', /* Opacité augmentée pour l'impression */
  },
  heroKpiItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  heroKpiValue: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: -0.3,
    color: 'var(--color-accent-strong)',
    lineHeight: 1,
  },
  heroKpiLabel: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: 'var(--color-gray-200)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  quoteAuthor: {
    fontSize: 6,
    fontWeight: 800,
    fontStyle: 'normal',
    color: 'var(--color-surface)',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },

  /* DARK BAND (195px) — split 44/56 : manifesto (clair, gauche) | photo (droite) */
  darkBand: {
    ...SECTION,
    height: 195,
    display: 'flex',
  },
  manifestoBlock: {
    flex: '0 0 44%',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    borderRight: '1px solid var(--color-border-light)',
    padding: '20px 26px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  manifestoWatermark: {
    position: 'absolute',
    right: 0, /* Décalé vers la gauche (à l'intérieur du bloc) */
    bottom: -10, /* Remonté légèrement */
    height: 140,
    opacity: 0.06,
    pointerEvents: 'none',
    zIndex: 0,
  },
  manifestoContent: {
    position: 'relative',
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  manifestoHeadline: {
    fontSize: 13,
    lineHeight: 1.22,
    fontWeight: 700,
    fontStyle: 'italic',
    letterSpacing: -0.4,
    color: 'var(--color-text-primary)',
    marginBottom: 12,
  },
  darkHeadlineAccent: {
    color: 'var(--color-accent-strong)',
  },
  manifestoBody: {
    fontSize: 7,
    lineHeight: 1.5,
    margin: 0,
    color: 'var(--color-gray-700)',
    fontWeight: 500,
  },
  darkBandPhoto: {
    flex: 1,
    backgroundImage: "linear-gradient(rgba(26,29,36,0.2), rgba(26,29,36,0.2)), url('/partners/aerial-dc-campus.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 50%',
  },

  /* BUILDING (125px) — 3 photos côte à côte avec titre HARDWARE / CONNECTIVITY / SOFTWARE */
  building: {
    ...SECTION,
    height: 125,
    display: 'flex',
  },
  buildingTile: {
    flex: 1,
    position: 'relative',
    backgroundSize: 'cover',
    backgroundPosition: 'center 50%',
    borderRight: '1px solid var(--color-gray-900)',
    overflow: 'hidden',
  },
  buildingTileOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(26,29,36,0.2) 0%, rgba(26,29,36,0.2) 45%, rgba(26,29,36,0.9) 100%)',
  },
  buildingTileTitle: {
    position: 'absolute',
    left: 16, /* Décalé de 12 à 16 pour une marge plus premium */
    bottom: 10,
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: 2,
    color: 'var(--color-text-inverse)',
    textTransform: 'uppercase',
    zIndex: 2,
  },

  /* FOOTER (90px) — repris à sa hauteur d'origine */
  footer: {
    ...SECTION,
    height: 90,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    padding: '16px 26px',
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    alignItems: 'stretch', /* Modifié pour que les colonnes prennent toute la hauteur */
  },
  footerCol: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    overflow: 'hidden',
  },
  footerWatermark: {
    position: 'absolute',
    right: 0,
    top: '50%',
    transform: 'translateY(-50%)', /* Centrage vertical parfait */
    height: 55, /* Taille optimale pour la case */
    width: 55,
    objectFit: 'contain',
    objectPosition: 'center right',
    opacity: 0.05,
    pointerEvents: 'none',
    zIndex: 0,
    filter: 'brightness(0) invert(1)',
  },
  footerLogo: {
    height: 16,
    width: 'auto',
    maxWidth: '100%',
    display: 'block',
    objectFit: 'contain',
    objectPosition: 'left center',
  },
  footerLine1: {
    fontSize: 7.5,
    lineHeight: 1,
    color: 'var(--color-gray-300)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  footerLine2: {
    fontSize: 7.5,
    lineHeight: 1,
    color: 'var(--color-text-inverse)',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  footerCeo: {
    fontSize: 6.5,
    lineHeight: 1,
    color: 'var(--color-gray-400)',
    fontWeight: 600,
    fontStyle: 'italic',
    letterSpacing: 0.2,
    whiteSpace: 'nowrap',
    marginTop: 1,
  },
  footerWebsite: {
    fontSize: 7.5,
    fontWeight: 800,
    letterSpacing: 0.5,
    color: 'var(--color-accent-strong)',
    textTransform: 'lowercase',
    whiteSpace: 'nowrap',
  },
};
