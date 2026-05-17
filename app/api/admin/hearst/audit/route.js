import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';

// Module-level rate limiter (5 req/min per actor)
const AUDIT_RL_WINDOW = 60_000;
const AUDIT_RL_MAX = 5;
const auditRlBuckets = new Map(); // actorId -> { count, windowStart }

function checkAuditRateLimit(actorId) {
  const now = Date.now();
  const bucket = auditRlBuckets.get(actorId);
  if (!bucket || now - bucket.windowStart >= AUDIT_RL_WINDOW) {
    auditRlBuckets.set(actorId, { count: 1, windowStart: now });
    return { allowed: true };
  }
  if (bucket.count >= AUDIT_RL_MAX) {
    const retryAfter = Math.ceil((AUDIT_RL_WINDOW - (now - bucket.windowStart)) / 1000);
    return { allowed: false, retryAfter };
  }
  bucket.count++;
  return { allowed: true };
}

export async function GET(req) {
  const r = await requireProfile('viewer');
  if (r instanceof NextResponse) return r;
  const rl = checkAuditRateLimit(r.profile.id);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests' }, {
      status: 429,
      headers: { 'Retry-After': String(rl.retryAfter) },
    });
  }
  const supa = getAdminClient();
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });

  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 1000);
  const entity_type = searchParams.get('entity_type');

  let q = supa
    .from('hearst_audit_log')
    .select('*')
    .eq('project_id', project_id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (entity_type) q = q.eq('entity_type', entity_type);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ entries: data || [] });
}
