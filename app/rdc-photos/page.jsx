'use client';
/* eslint-disable @next/next/no-img-element */

import { useState, useEffect } from 'react';

const BASE = '/rdc-research';

const SECTIONS = [
  {
    id: 'aerial',
    title: 'Aerial views',
    subtitle: 'Drone & satellite — site footprint and double-arc signature roof',
    items: [
      { src: `${BASE}/aerial/drone_top_down_signature.jpg`, caption: 'Zenith view — signature double-arc roof, two parallel curved wings + central spine + interior courtyards', source: 'Redco' },
      { src: `${BASE}/aerial/drone_three_quarter_west.jpg`, caption: '¾ aerial west — long curved façade, signature green-glass band, surrounding desert', source: 'Redco' },
      { src: `${BASE}/aerial/drone_distant_overview.jpg`, caption: 'Drone distant — full complex with desert backdrop, plaza in foreground', source: 'Redco' },
      { src: `${BASE}/aerial/drone_north_facade.jpg`, caption: 'Drone north façade — green glass curtain wall, MEP rooftop units visible', source: 'Redco' },
      { src: `${BASE}/aerial/satellite_z18_mosaic.jpg`, caption: 'Esri satellite z18 mosaic — RDC plot in Education City context', source: 'Esri World Imagery' },
      { src: `${BASE}/aerial/satellite_z19_mosaic.jpg`, caption: 'Esri satellite z19 mosaic — high zoom on Education City', source: 'Esri World Imagery' },
      { src: `${BASE}/aerial/wikimedia_Qatar_Education_City_aerial_view_asv2024-10.jpg`, caption: 'Education City aerial 2024 — full campus context', source: 'Wikimedia Commons' },
      { src: `${BASE}/aerial/wikimedia_Aerial_view_of_Education_City_in_Al_Rayyan.jpg`, caption: 'Aerial Al Rayyan — Education City overview', source: 'Wikimedia Commons' },
      { src: `${BASE}/aerial/wikimedia_Aerial_view_of_Education_City_in_Al_Rayyan_(Al_Shagub).jpg`, caption: 'Aerial Al Shagub — adjacent district', source: 'Wikimedia Commons' },
    ],
  },
  {
    id: 'facade',
    title: 'Façades & exterior',
    subtitle: 'Limestone cladding, green-glass curtain walls, cantilevered canopies',
    items: [
      { src: `${BASE}/facade/facade_dusk_full_view.jpg`, caption: 'Dusk view — full eastern façade, the iconic green-glass curve at golden hour', source: 'Redco' },
      { src: `${BASE}/facade/facade_main_entrance.jpg`, caption: 'Main entrance — limestone cladding + curved green glass + cantilever roof', source: 'Redco' },
      { src: `${BASE}/facade/facade_three_quarter_north.jpg`, caption: '¾ view north — long curved façade meeting central pavilion', source: 'Redco' },
      { src: `${BASE}/facade/facade_plaza_two_wings.jpg`, caption: 'Plaza panorama — two glass wings face each other across the central courtyard', source: 'Redco' },
      { src: `${BASE}/facade/facade_inner_courtyard.jpg`, caption: 'Inner courtyard — pedestrian spine between B1 and B2', source: 'Redco' },
      { src: `${BASE}/facade/facade_west_panorama.jpg`, caption: 'West panorama at dusk — full site context', source: 'Redco' },
      { src: `${BASE}/facade/facade_plaza_canopy_misty.jpg`, caption: 'Plaza canopy in morning fog — dramatic angled cantilever (signature shot)', source: 'Wikimedia Commons' },
    ],
  },
  {
    id: 'interior',
    title: 'Interiors',
    subtitle: 'Public halls, circulation, finishes',
    items: [
      { src: `${BASE}/interior/hall_monumental_staircase.jpg`, caption: 'Monumental hall — full-height glazing, marble floors, monumental staircase, suspended drum lights', source: 'Redco' },
    ],
  },
  {
    id: 'labs',
    title: 'Laboratories',
    subtitle: 'Research benches, equipment, biomedical labs',
    items: [
      { src: `${BASE}/labs/lab_main_benches.jpg`, caption: 'Open lab — central benches, fume hoods, mobile cabinets with green accents (HBKU branding)', source: 'Redco' },
      { src: `${BASE}/labs/lab_sequencing_equipment.jpg`, caption: 'Sequencing bench — black countertops + fluorescent task lighting + scientific instruments', source: 'Redco' },
      { src: `${BASE}/labs/lab_microscope_room.jpg`, caption: 'Microscope room — research-grade microscope with monitor, isolated equipment', source: 'Redco' },
    ],
  },
  {
    id: 'renders',
    title: 'Architectural renders',
    subtitle: 'Original Perkins+Will design renderings (pre-construction)',
    items: [
      { src: `${BASE}/renders/render_aerial_SE.jpg`, caption: 'Original aerial render SE — pre-construction massing, color study', source: 'Perkins+Will / Redco' },
      { src: `${BASE}/renders/render_entrance_concept.jpg`, caption: 'Entrance concept render — limestone + glass language confirmed in built version', source: 'Perkins+Will / Redco' },
      { src: `${BASE}/renders/render_street_canopy.jpg`, caption: 'Street view render — canopy and entrance treatment', source: 'Perkins+Will / Redco' },
    ],
  },
  {
    id: 'context',
    title: 'Education City context',
    subtitle: 'Surrounding campus — QF HQ, Ceremonial Court, walkways',
    items: [
      { src: `${BASE}/context/wikimedia_Qatar_Foundation_Headquarters,_Education_City-2014.jpg`, caption: 'Qatar Foundation HQ (OMA) — neighboring building', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_Education_City_Ceremonial_Court.jpg`, caption: 'Education City Ceremonial Court — closest metro stop to RDC', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_View_of_Education_City_from_Carnegie_Mellon_University_Qatar.jpg`, caption: 'View from CMU Qatar — campus density', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_LAS_Building_at_Education_City.jpg`, caption: 'LAS Building — Education City architecture vocabulary', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_Latticework_at_Ceremonial_Court_in_Education_City.jpg`, caption: 'Latticework — recurring façade element across campus', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_Shaded_walkway_of_Ceremonial_Court_in_Education_City.jpg`, caption: 'Shaded walkway — Ceremonial Court', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_Long_walkway_shaded_by_palm_trees_during_rainy_day_in_Education_City.jpg`, caption: 'Palm-shaded walkway — campus circulation', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_Student_Center_in_Education_City_Qatar.jpg`, caption: 'Student Center — Education City', source: 'Wikimedia' },
      { src: `${BASE}/context/wikimedia_Road_in_Education_City_Qatar.jpg`, caption: 'Education City road network', source: 'Wikimedia' },
    ],
  },
];

const TOTAL_COUNT = SECTIONS.reduce((n, s) => n + s.items.length, 0);

export default function RDCPhotosPage() {
  const [lightbox, setLightbox] = useState(null);
  const [activeSection, setActiveSection] = useState('aerial');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div>
          <div style={S.eyebrow}>
            <span style={S.accent}>FUTUR</span> ONE — SITE INSPECTION DOSSIER
          </div>
          <h1 style={S.h1}>QF · Research & Development Complex</h1>
          <div style={S.subtitle}>
            Education City · Doha · Phase 1A (2013–2016) · Perkins+Will · Redco Al Mana · QAR 1.5 Bn
          </div>
        </div>
        <div style={S.counter}>
          <div style={S.counterNum}>{TOTAL_COUNT}</div>
          <div style={S.counterLabel}>photos<br />collected</div>
        </div>
      </header>

      <nav style={S.nav}>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => setActiveSection(s.id)}
            style={{
              ...S.navLink,
              ...(activeSection === s.id ? S.navLinkActive : null),
            }}
          >
            {s.title}
            <span style={S.navCount}>{s.items.length}</span>
          </a>
        ))}
      </nav>

      {SECTIONS.map((section) => (
        <section key={section.id} id={section.id} style={S.section}>
          <div style={S.sectionHeader}>
            <h2 style={S.h2}>{section.title}</h2>
            <div style={S.sectionSub}>{section.subtitle}</div>
          </div>
          <div style={S.grid}>
            {section.items.map((item) => (
              <figure
                key={item.src}
                style={S.figure}
                onClick={() => setLightbox(item)}
              >
                <div style={S.imgWrap}>
                  <img src={item.src} alt={item.caption} style={S.img} loading="lazy" />
                </div>
                <figcaption style={S.caption}>
                  <span style={S.captionText}>{item.caption}</span>
                  <span style={S.captionSource}>{item.source}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}

      {lightbox && (
        <div style={S.lightbox} onClick={() => setLightbox(null)}>
          <img src={lightbox.src} alt={lightbox.caption} style={S.lightboxImg} />
          <div style={S.lightboxCaption}>
            <div style={S.lightboxText}>{lightbox.caption}</div>
            <div style={S.lightboxSource}>Source : {lightbox.source}</div>
          </div>
          <button style={S.closeBtn} onClick={() => setLightbox(null)} aria-label="Close">
            ×
          </button>
        </div>
      )}

      <footer style={S.footer}>
        <div>
          Sources : <a style={S.link} href="https://rcalmana.com/project/hamad-bin-khalifa-research-and-development-complex/" target="_blank" rel="noreferrer">Redco Al Mana</a>
          {' · '}
          <a style={S.link} href="https://commons.wikimedia.org/wiki/Category:Education_City" target="_blank" rel="noreferrer">Wikimedia Commons</a>
          {' · '}
          <a style={S.link} href="https://www.archilovers.com/projects/193449/qatar-research-and-development-complex.html" target="_blank" rel="noreferrer">Perkins+Will (Archilovers)</a>
          {' · '}
          <a style={S.link} href="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/" target="_blank" rel="noreferrer">Esri World Imagery</a>
        </div>
      </footer>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    background: 'var(--color-dark-surface)',
    color: 'rgba(255,255,255,0.92)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '40px 6vw 80px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 32,
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    marginBottom: 28,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 12,
  },
  accent: { color: 'var(--color-accent-strong)' },
  h1: {
    fontSize: 48,
    fontWeight: 900,
    letterSpacing: -1.5,
    margin: 0,
    lineHeight: 1.05,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 14,
    letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.55)',
  },
  counter: {
    textAlign: 'right',
    paddingTop: 6,
  },
  counterNum: {
    fontSize: 56,
    fontWeight: 900,
    letterSpacing: -2,
    color: 'var(--color-accent-strong)',
    lineHeight: 1,
  },
  counterLabel: {
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    marginTop: 6,
  },
  nav: {
    position: 'sticky',
    top: 0,
    background: 'rgba(10,10,10,0.92)',
    backdropFilter: 'blur(12px)',
    margin: '0 -6vw',
    padding: '14px 6vw',
    display: 'flex',
    gap: 4,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    zIndex: 50,
    flexWrap: 'wrap',
  },
  navLink: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    padding: '8px 14px',
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },
  navLinkActive: {
    color: '#fff',
    background: 'rgba(141,27,61,0.25)',
  },
  navCount: {
    fontSize: 9,
    fontWeight: 800,
    background: 'rgba(255,255,255,0.1)',
    padding: '2px 6px',
    borderRadius: 999,
    minWidth: 18,
    textAlign: 'center',
  },
  section: {
    marginTop: 56,
    scrollMarginTop: 80,
  },
  sectionHeader: {
    marginBottom: 24,
    paddingBottom: 14,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  h2: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: -0.5,
    margin: 0,
  },
  sectionSub: {
    marginTop: 6,
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 0.3,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 20,
  },
  figure: {
    margin: 0,
    background: 'var(--color-dark-surface)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 4,
    overflow: 'hidden',
    cursor: 'zoom-in',
    transition: 'all 0.25s ease',
  },
  imgWrap: {
    width: '100%',
    aspectRatio: '4 / 3',
    overflow: 'hidden',
    background: 'var(--color-gray-800)',
  },
  img: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.4s ease',
  },
  caption: {
    padding: '12px 14px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  captionText: {
    fontSize: 12,
    lineHeight: 1.5,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 0.2,
  },
  captionSource: {
    fontSize: 9,
    letterSpacing: 1.5,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    fontWeight: 700,
  },
  lightbox: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.95)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    cursor: 'zoom-out',
    flexDirection: 'column',
  },
  lightboxImg: {
    maxWidth: '95%',
    maxHeight: '85vh',
    objectFit: 'contain',
    boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
  },
  lightboxCaption: {
    marginTop: 18,
    textAlign: 'center',
    maxWidth: 720,
  },
  lightboxText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 0.3,
    lineHeight: 1.5,
  },
  lightboxSource: {
    marginTop: 6,
    fontSize: 10,
    letterSpacing: 2,
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  closeBtn: {
    position: 'absolute',
    top: 24,
    right: 32,
    width: 44,
    height: 44,
    border: '1px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 24,
    fontWeight: 300,
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  footer: {
    marginTop: 80,
    paddingTop: 24,
    borderTop: '1px solid rgba(255,255,255,0.08)',
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.5,
  },
  link: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'underline',
    textDecorationColor: 'rgba(141,27,61,0.5)',
  },
};
