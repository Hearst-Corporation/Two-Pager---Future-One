// GET /api/admin/hearst/news
//
// Phase 2 — list des signaux marché ingérés par /api/admin/hearst/news/refresh.
// Query params :
//   - limit        : 1-100 (default 25)
//   - min_score    : 1-5  (default 3 — institutional relevance floor; the
//                    Executive dashboard shows infrastructure signals only)
//   - source       : filtre par source ('dcd', 'nvidia', 'toms', ...)
//   - category     : filtre par category
//   - impacts      : filtre par impacts_metric
//
// Read-only, requireProfile('viewer').

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(req.url);
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25', 10) || 25));
  const minScore = Math.max(1, Math.min(5, parseInt(searchParams.get('min_score') || '3', 10) || 3));
  const source = searchParams.get('source');
  const category = searchParams.get('category');
  const impacts = searchParams.get('impacts');

  const supa = getAdminClient();
  let q = supa
    .from('hearst_market_signals')
    .select('id, source, source_label, title, url, summary, relevance_score, category, impacts_metric, published_at, fetched_at')
    .gte('relevance_score', minScore)
    // Institutional relevance first — rank by the score Kimi computed at
    // ingestion (previously discarded; the panel showed the most RECENT items
    // regardless of relevance, surfacing off-topic consumer-tech news).
    .order('relevance_score', { ascending: false, nullsFirst: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('fetched_at',   { ascending: false })
    .limit(limit);

  if (source)   q = q.eq('source', source);
  if (category) q = q.eq('category', category);
  if (impacts)  q = q.eq('impacts_metric', impacts);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const signals = data || [];
  const summary = {
    total: signals.length,
    by_source: signals.reduce((acc, s) => { acc[s.source] = (acc[s.source] || 0) + 1; return acc; }, {}),
    by_category: signals.reduce((acc, s) => { if (s.category) acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {}),
    last_fetched_at: signals[0]?.fetched_at || null,
  };

  return NextResponse.json({ signals, summary });
}
