export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initServerSentry } = await import('./lib/sentry/server-init');
    initServerSentry();
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    const { initEdgeSentry } = await import('./lib/sentry/edge-init');
    initEdgeSentry();
  }
}
