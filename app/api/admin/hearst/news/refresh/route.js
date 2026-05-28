// POST /api/admin/hearst/news/refresh
//
// Phase 2 — Brief news scraper.
// Fetch 3 flux RSS publics + envoie chaque item à Kimi (Hypercli) pour scoring
// de pertinence (1-5) + résumé court + classification (category, impacts_metric),
// puis upsert dans crm.hearst_market_signals (unique sur URL).
//
// Le parsing RSS est fait à la main (regex) pour éviter une dépendance
// supplémentaire. Si un feed casse, il est skip silencieusement (log warn) —
// les autres feeds remontent normalement.
//
// Budget Kimi : 1 appel batch par feed (5-15 items condensés en 1 prompt).
// Rate-limit module-level (1 refresh / 5 min / actor).

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { kimi, KIMI_MODEL, kimiChatCompletion } from '@/lib/llm/kimi';

const FEEDS = [
  { source: 'nvidia',    label: 'NVIDIA Blog',          url: 'https://blogs.nvidia.com/feed/' },
  { source: 'toms',      label: "Tom's Hardware",       url: 'https://www.tomshardware.com/feeds/all' },
  { source: 'arstech',   label: 'Ars Technica',         url: 'https://feeds.arstechnica.com/arstechnica/index' },
  { source: 'theverge',  label: 'The Verge',            url: 'https://www.theverge.com/rss/index.xml' },
];

const MAX_ITEMS_PER_FEED = 10;
const REFRESH_RL_WINDOW = 5 * 60 * 1000;
const refreshRlBuckets = new Map();

function checkRefreshRateLimit(actorId) {
  if (process.env.NODE_ENV !== 'production') return { allowed: true };
  const now = Date.now();
  const bucket = refreshRlBuckets.get(actorId);
  if (!bucket || now - bucket.startedAt >= REFRESH_RL_WINDOW) {
    refreshRlBuckets.set(actorId, { count: 1, startedAt: now });
    return { allowed: true };
  }
  if (bucket.count >= 1) {
    const retryAfter = Math.ceil((REFRESH_RL_WINDOW - (now - bucket.startedAt)) / 1000);
    return { allowed: false, retryAfter };
  }
  bucket.count++;
  return { allowed: true };
}

function decodeHtml(s) {
  if (!s) return s;
  return s
    .replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .trim();
}

function pick(content, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = content.match(re);
  return m ? decodeHtml(m[1]) : null;
}

function parseRss(xml) {
  const items = [];
  const itemRe = /<item[\s>][\s\S]*?<\/item>/gi;
  const matches = xml.match(itemRe) || [];
  for (const itemXml of matches) {
    const title = pick(itemXml, 'title');
    const link = pick(itemXml, 'link');
    const desc = pick(itemXml, 'description') || pick(itemXml, 'content:encoded');
    const pubDate = pick(itemXml, 'pubDate') || pick(itemXml, 'dc:date');
    if (!title || !link) continue;
    items.push({
      title,
      url: link.trim(),
      raw_description: desc ? desc.slice(0, 600) : null,
      published_at: pubDate ? new Date(pubDate).toISOString() : null,
    });
    if (items.length >= MAX_ITEMS_PER_FEED) break;
  }
  return items;
}

async function fetchFeed(feed) {
  try {
    const r = await fetch(feed.url, {
      headers: { 'User-Agent': 'HearstOracleBriefBot/1.0' },
      cache: 'no-store',
    });
    if (!r.ok) {
      console.warn(`[news/refresh] feed ${feed.source} HTTP ${r.status}`);
      return { source: feed.source, label: feed.label, items: [], error: `HTTP ${r.status}` };
    }
    const xml = await r.text();
    const items = parseRss(xml);
    return { source: feed.source, label: feed.label, items, error: null };
  } catch (e) {
    console.warn(`[news/refresh] feed ${feed.source} error:`, e.message);
    return { source: feed.source, label: feed.label, items: [], error: e.message };
  }
}

const KIMI_SYSTEM = `Tu es un analyste de marché pour Hearst Corporation, qui investit dans des data centers
et de l'infrastructure IA (hyperscale, GPU clouds, sovereign AI) au Qatar et en MENA.
Pour chaque article fourni, retourne UN objet JSON strict avec les champs :
  - "relevance_score": entier 1-5 (5 = impact direct sur le modèle Hearst, 1 = peu pertinent)
  - "category": un de ["hardware","energy","policy","market","partnership","other"]
  - "impacts_metric": un de ["pricing","capex","pue","tax","gpu","demand"] ou null si rien de précis
  - "summary": 1-2 phrases en français qui expliquent pourquoi l'article importe pour Hearst.
Réponds UNIQUEMENT par un JSON array, sans commentaire markdown.`;

async function scoreItemsWithKimi(items) {
  if (items.length === 0) return [];
  const compact = items.map((it, i) => ({
    i,
    t: it.title,
    d: it.raw_description ? it.raw_description.slice(0, 300) : '',
  }));
  const userPrompt = `Voici ${items.length} articles à classer. Réponds par un array JSON de la même longueur,
chaque élément ayant {i, relevance_score, category, impacts_metric, summary}.
Articles : ${JSON.stringify(compact)}`;

  try {
    const { response: r } = await kimiChatCompletion({
      model: KIMI_MODEL,
      messages: [
        { role: 'system', content: KIMI_SYSTEM },
        { role: 'user',   content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });
    const content = r.choices?.[0]?.message?.content;
    if (!content) return items.map(() => null);

    let parsed;
    try { parsed = JSON.parse(content); } catch { return items.map(() => null); }
    const arr = Array.isArray(parsed) ? parsed
      : Array.isArray(parsed.items) ? parsed.items
      : Array.isArray(parsed.results) ? parsed.results
      : Array.isArray(parsed.articles) ? parsed.articles
      : null;
    if (!arr) return items.map(() => null);
    const byIdx = new Map(arr.map(x => [x.i, x]));
    return items.map((_, i) => byIdx.get(i) || null);
  } catch (e) {
    console.warn('[news/refresh] Kimi error:', e.message);
    return items.map(() => null);
  }
}

export async function POST() {
  const auth = await requireProfile('editor');
  if (auth instanceof NextResponse) return auth;

  const rl = checkRefreshRateLimit(auth.profile.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }

  const supa = getAdminClient();

  const feedResults = await Promise.all(FEEDS.map(fetchFeed));

  let total_fetched = 0;
  let total_inserted = 0;
  let total_skipped = 0;
  const errors = [];

  for (const fr of feedResults) {
    if (fr.error) {
      errors.push({ source: fr.source, error: fr.error });
      continue;
    }
    total_fetched += fr.items.length;
    if (fr.items.length === 0) continue;

    const scored = await scoreItemsWithKimi(fr.items);

    const rows = fr.items.map((it, i) => {
      const s = scored[i] || {};
      return {
        source: fr.source,
        source_label: fr.label,
        title: it.title,
        url: it.url,
        summary: s.summary || it.raw_description?.slice(0, 240) || null,
        relevance_score: Math.max(1, Math.min(5, Number(s.relevance_score) || 3)),
        category: s.category || null,
        impacts_metric: s.impacts_metric || null,
        published_at: it.published_at,
        raw_meta: { kimi: s, raw_description: it.raw_description?.slice(0, 240) || null },
      };
    });

    const { data, error } = await supa
      .from('hearst_market_signals')
      .upsert(rows, { onConflict: 'url', ignoreDuplicates: false })
      .select('id, url');

    if (error) {
      console.warn(`[news/refresh] upsert ${fr.source} failed:`, error.message);
      errors.push({ source: fr.source, error: error.message });
      total_skipped += rows.length;
    } else {
      total_inserted += data?.length || 0;
    }
  }

  return NextResponse.json({
    ok: true,
    feeds: feedResults.map(f => ({ source: f.source, label: f.label, fetched: f.items.length, error: f.error })),
    summary: { total_fetched, total_inserted, total_skipped },
    errors,
  });
}
