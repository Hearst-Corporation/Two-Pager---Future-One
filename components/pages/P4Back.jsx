'use client';

export default function P4Back() {
  return (
    <div style={S.page}>
      <div style={S.bg} />
      <div style={S.overlay} />
      <div style={S.content}>
        <div style={S.headline}>
          <span style={S.white}>AI</span>
          <br />
          <span style={S.white}>is the</span>
          <br />
          <span style={S.accent}>new gas.</span>
        </div>
        <div style={S.sub}>COMPUTE IS THE INFRASTRUCTURE OF NATIONS</div>
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
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'url(/back-cover.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,.2) 100%)',
  },
  content: {
    position: 'absolute',
    top: '50%',
    left: 28,
    transform: 'translateY(-50%)',
  },
  headline: {
    fontSize: 66,
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 1.0,
    letterSpacing: -1,
  },
  white: {
    color: 'var(--color-text-inverse)',
  },
  accent: {
    color: 'var(--color-accent-strong)',
  },
  sub: {
    marginTop: 18,
    fontSize: 7.5,
    letterSpacing: 2,
    fontWeight: 600,
    fontStyle: 'normal',
    color: 'rgba(255,255,255,.45)',
  },
};
