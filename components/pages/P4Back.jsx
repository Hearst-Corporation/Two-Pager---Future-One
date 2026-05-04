'use client';

/**
 * P4 — Dos de couverture
 * Dimensions strictes : 480x680px
 * Design minimaliste, centré sur la citation forte.
 */
export default function P4Back() {
  return (
    <div style={S.page}>
      <div style={S.bgImage} />
      <div style={S.overlay} />

      <div style={S.topBar}>
        <div style={S.logoWrapper}>
          <svg width="24" height="26" viewBox="0 0 91 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M10 43.4041L41.5946 74H61L19.7092 34L10 43.4041Z" fill="var(--color-surface)"/>
            <path d="M80 57.8356L48.4056 28H29L70.2908 67L80 57.8356Z" fill="var(--color-surface)"/>
            <path d="M23 8H7V92H23V8Z" fill="var(--color-surface)"/>
            <path d="M82 8H65V92H82V8Z" fill="var(--color-surface)"/>
          </svg>
        </div>
      </div>

      <div style={S.content}>
        <div style={S.quoteMark}>"</div>
        <h2 style={S.quote}>
          AI IS THE<br />
          <span style={S.quoteAccent}>NEW GAS.</span>
        </h2>
        <div style={S.bridgeLine}>
          Qatar mastered the resource of the 20th century.<br />
          The next one is intelligence.
        </div>
      </div>

      <div style={S.bottomBar}>
        <div style={S.contactBlock}>
          <div style={S.contactLabel}>DELIVERED TO</div>
          <div style={S.contactValue}>By invitation only.</div>
        </div>
        <div style={S.contactBlockRight}>
          <div style={S.contactLabel}>LOCATION</div>
          <div style={S.contactValue}>Doha, State of Qatar</div>
        </div>
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
    backgroundImage: "url('/back-cover.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(26,29,36,0.7) 0%, rgba(26,29,36,0.3) 50%, rgba(26,29,36,0.85) 100%)',
    zIndex: 1,
  },
  topBar: {
    position: 'relative',
    zIndex: 2,
    padding: '30px',
    display: 'flex',
    justifyContent: 'center',
  },
  logoWrapper: {
    opacity: 0.5,
  },
  content: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    textAlign: 'center',
  },
  quoteMark: {
    fontSize: 60,
    lineHeight: 0.5,
    color: 'var(--color-accent-strong)',
    fontFamily: 'Georgia, serif',
    marginBottom: 20,
  },
  quote: {
    fontSize: 42,
    fontWeight: 900,
    lineHeight: 1,
    letterSpacing: -1,
    margin: 0,
    textTransform: 'uppercase',
  },
  quoteAccent: {
    color: 'var(--color-accent-strong)',
  },
  bridgeLine: {
    marginTop: 24,
    fontSize: 9,
    fontStyle: 'italic',
    fontWeight: 500,
    lineHeight: 1.5,
    letterSpacing: 0.5,
    color: 'var(--color-gray-300)',
  },
  bottomBar: {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'space-between',
    padding: '30px 0',
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '0 30px',
  },
  contactBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  contactBlockRight: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    textAlign: 'right',
  },
  contactLabel: {
    fontSize: 6,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-gray-400)',
  },
  contactValue: {
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: 0.5,
    color: 'var(--color-surface)',
  },
};
