import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';

// Aggregate analytics for one deck-link
export async function GET(_req, { params }) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const supa = getAdminClient();

  const { data: link, error: e1 } = await supa
    .from('deck_links')
    .select('*')
    .eq('id', params.id)
    .single();
  if (e1) return NextResponse.json({ error: e1.message }, { status: 404 });

  const { data: views, error: e2 } = await supa
    .from('deck_views')
    .select('*')
    .eq('link_id', params.id)
    .order('occurred_at', { ascending: true });
  if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });

  // Aggregate per slide
  const perSlide = {};
  const sessions = new Set();
  for (const v of views) {
    sessions.add(v.session_id);
    const k = String(v.slide_index);
    if (!perSlide[k]) perSlide[k] = { slide_index: v.slide_index, slide_label: v.slide_label, views: 0, total_ms: 0 };
    perSlide[k].views += 1;
    if (v.duration_ms) perSlide[k].total_ms += v.duration_ms;
  }
  const slides = Object.values(perSlide).sort((a, b) => a.slide_index - b.slide_index);

  // Last view per session = where they "dropped off"
  const lastBySession = {};
  for (const v of views) {
    const cur = lastBySession[v.session_id];
    if (!cur || new Date(v.occurred_at) > new Date(cur.occurred_at)) {
      lastBySession[v.session_id] = v;
    }
  }
  const dropOffs = Object.values(lastBySession).map((v) => v.slide_index);

  return NextResponse.json({
    link,
    summary: {
      sessions: sessions.size,
      total_views: views.length,
      first_seen: views[0]?.occurred_at || null,
      last_seen: views.at(-1)?.occurred_at || null,
      dropOffs,
    },
    slides,
    raw: views.slice(-50),
  });
}
