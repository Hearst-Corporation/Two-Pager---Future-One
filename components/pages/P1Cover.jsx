'use client';

/**
 * P1 — Couverture
 * Dimensions strictes : 480x680px
 * Design ultra-minimaliste, institutionnel et luxueux.
 */
export default function P1Cover() {
  return (
    <div style={S.page}>
      <div style={S.bgImage} />
      <div style={S.overlay} />

      <div style={S.topBar}>
        <div style={S.microText}>STATE OF QATAR</div>
        <div style={S.microText}>CONFIDENTIAL</div>
      </div>

      <div style={S.content}>
        <div style={S.logoWrapper}>
          <svg width="40" height="44" viewBox="0 0 91 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 43.4041L41.5946 74H61L19.7092 34L10 43.4041Z" fill="var(--color-accent-strong)"/>
            <path d="M80 57.8356L48.4056 28H29L70.2908 67L80 57.8356Z" fill="var(--color-accent-strong)"/>
            <path d="M23 8H7V92H23V8Z" fill="var(--color-accent-strong)"/>
            <path d="M82 8H65V92H82V8Z" fill="var(--color-accent-strong)"/>
          </svg>
        </div>
        
        <h1 style={S.title}>
          FUTUR<br />ONE
        </h1>
        <div style={S.subtitle}>
          THE SOVEREIGN AI<br />
          INFRASTRUCTURE HUB
        </div>
      </div>

      <div style={S.bottomBar}>
        <div style={S.bottomText}>HEARST QATAR</div>
        <div style={S.bottomTextAccent}>2026</div>
      </div>
    </div>
  );
}

const S = {
  page: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'var(--color-gray-900)',
    color: 'var(--color-surface)',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('/cover-facade.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(26,29,36,0.1) 0%, rgba(26,29,36,0.6) 60%, rgba(26,29,36,0.85) 100%)',
    zIndex: 1,
  },
  topBar: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '30px 30px',
  },
  microText: {
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: 700,
    color: 'var(--color-gray-300)',
  },
  content: {
    position: 'relative',
    zIndex: 2,
    padding: '0 30px',
    marginBottom: '60px', /* Pousse le contenu vers le bas pour laisser l'image respirer en haut */
  },
  logoWrapper: {
    marginBottom: 24,
  },
  title: {
    fontSize: 64,
    fontWeight: 900,
    lineHeight: 0.85,
    letterSpacing: -2,
    margin: '0 0 16px 0',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 3,
    lineHeight: 1.4,
    color: 'var(--color-gray-300)',
    borderLeft: '2px solid var(--color-accent-strong)',
    paddingLeft: 12,
  },
  bottomBar: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: '30px 30px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '0 30px',
  },
  bottomText: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1.5,
  },
  bottomTextAccent: {
    fontSize: 8,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-accent-strong)',
  },
};
