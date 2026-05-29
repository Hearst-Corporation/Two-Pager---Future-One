/**
 * app/api/inngest/route.js
 *
 * Inngest HTTP handler — serves GET/POST/PUT for the Inngest dev server
 * and cloud event ingestion.
 *
 * If the `inngest` package is not installed this route degrades gracefully:
 * GET returns a 503 with an actionable message instead of crashing the build.
 */

import { NextResponse } from 'next/server';

// ─── Lazy Inngest bootstrap ───────────────────────────────────────────────────

let _handlers = null;

async function getHandlers() {
  if (_handlers) return _handlers;

  try {
    const [{ serve }, { inngest }, { oracleRefreshDaily }] = await Promise.all([
      import('inngest/next'),
      import('@/lib/inngest/client.js'),
      import('@/lib/inngest/oracle-refresh.js'),
    ]);

    const functions = [oracleRefreshDaily].filter(Boolean);

    _handlers = serve({ client: inngest, functions });
  } catch (err) {
    console.warn('[api/inngest] Inngest package unavailable:', err?.message);
    _handlers = null;
  }

  return _handlers;
}

// ─── Route handlers ───────────────────────────────────────────────────────────

export async function GET(req) {
  const h = await getHandlers();
  if (!h) {
    return NextResponse.json(
      { error: 'inngest_unavailable', hint: 'Install the `inngest` package to enable the cron pipeline.' },
      { status: 503 }
    );
  }
  return h.GET(req);
}

export async function POST(req) {
  const h = await getHandlers();
  if (!h) {
    return NextResponse.json({ error: 'inngest_unavailable' }, { status: 503 });
  }
  return h.POST(req);
}

export async function PUT(req) {
  const h = await getHandlers();
  if (!h) {
    return NextResponse.json({ error: 'inngest_unavailable' }, { status: 503 });
  }
  return h.PUT(req);
}
