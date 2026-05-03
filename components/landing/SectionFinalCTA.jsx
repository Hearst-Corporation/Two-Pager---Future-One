'use client';

export default function SectionFinalCTA() {
  return (
    <section id="contact" style={S.section}>
      <img src="/aerial-campus-2.png" alt="" style={S.bg} />
      <div style={S.overlay} />

      <div style={S.content}>
        <div style={S.eyebrow}>FUTUR ONE</div>

        <div style={S.headline}>
          <span style={S.line}>AI</span>
          <span style={S.line}>is the</span>
          <span style={S.lineAccent}>new gas.</span>
        </div>

        <p style={S.sub}>COMPUTE IS THE INFRASTRUCTURE OF NATIONS.</p>
      </div>
    </section>
  );
}

const S = {
  section: {
    position: 'relative',
    color: 'var(--color-text-inverse)',
    padding: '140px 48px 120px',
    overflow: 'hidden',
    minHeight: '85vh',
    display: 'flex',
    alignItems: 'center',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(120deg, rgba(14,16,19,.85) 0%, rgba(14,16,19,.55) 60%, rgba(14,16,19,.35) 100%)',
    zIndex: 1,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    maxWidth: 1100,
    margin: '0 auto',
    width: '100%',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 24,
  },
  headline: {
    display: 'flex',
    flexDirection: 'column',
    fontSize: 'clamp(56px, 9vw, 132px)',
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 0.95,
    letterSpacing: -2.4,
  },
  line: {
    color: '#fff',
  },
  lineAccent: {
    color: 'var(--color-accent-strong)',
  },
  sub: {
    marginTop: 28,
    fontSize: 11,
    letterSpacing: 2.6,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
  },
};
