'use client';

export default function P1Cover() {
  return (
    <div style={S.page}>
      <div style={S.bg} />
      <div style={S.overlay} />
      <div style={S.content}>
        <div style={S.futur}>FUTUR</div>
        <div style={S.one}>ONE.</div>
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
    backgroundImage: 'url(/cover-facade.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.45) 100%)',
  },
  content: {
    position: 'absolute',
    bottom: 52,
    left: 28,
    lineHeight: 0.9,
  },
  futur: {
    fontSize: 92,
    fontWeight: 800,
    letterSpacing: -2,
    color: 'var(--color-text-inverse)',
  },
  one: {
    fontSize: 92,
    fontWeight: 800,
    letterSpacing: -2,
    color: 'var(--color-accent-strong)',
  },
};
