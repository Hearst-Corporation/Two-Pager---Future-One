// Minimal stub — kills the post-login 404 while the front is rebuilt from scratch.
// Target of the `/`, `/admin` and admin-host `/` redirects (see app/page.jsx,
// app/admin/page.jsx, next.config.js redirects, middleware ORACLE_HOME).
// Styling uses ONLY existing globals.css vars (dark RootLayout theme).
// No cp-* tokens, no design-system primitives, no shell.

export const metadata = {
  title: 'Oracle — Hearst',
};

export default function HearstHome() {
  return (
    <main style={S.wrap}>
      <div style={S.card}>
        <div style={S.eyebrow}>ORACLE / HEARST</div>
        <h1 style={S.title}>Front reset in progress</h1>
        <p style={S.sub}>
          The simulator front is being rebuilt from scratch. The financial
          engine and APIs are untouched.
        </p>
        <nav style={S.links}>
          <a href="/admin/login" style={S.link}>Sign in →</a>
          <a href="/api/health" style={S.linkMuted}>API health</a>
        </nav>
      </div>
    </main>
  );
}

const S = {
  wrap: {
    minHeight: '100vh',
    display: 'grid',
    placeItems: 'center',
    padding: 24,
    fontFamily: 'var(--font-sans)',
  },
  card: {
    width: 480,
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    textAlign: 'left',
  },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-login-text-muted)',
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    letterSpacing: -1,
    margin: 0,
    color: 'var(--color-text-inverse)',
  },
  sub: {
    fontSize: 14,
    lineHeight: 1.5,
    margin: 0,
    color: 'var(--color-login-text-muted)',
  },
  links: {
    display: 'flex',
    gap: 20,
    alignItems: 'center',
    marginTop: 8,
  },
  link: {
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.5,
    color: 'var(--color-text-inverse)',
  },
  linkMuted: {
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-login-text-muted)',
  },
};
