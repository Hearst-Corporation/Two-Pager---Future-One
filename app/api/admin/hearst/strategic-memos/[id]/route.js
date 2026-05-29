// GET   /api/admin/hearst/strategic-memos/[id]  — retrieve one full memo (+ versions, + scenario link)
// PATCH /api/admin/hearst/strategic-memos/[id]  — lifecycle status transition (P6)
//
// Critical Deliverables branch (P3/P6/P7).

import { NextResponse } from 'next/server';
import { requireProfile, authedWrite, getAdminClient } from '@/lib/supabase-admin';

const STATUSES = ['draft', 'reviewed', 'approved', 'archived'];

export async function GET(_req, { params }) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;
  const supa = getAdminClient();

  const { data: memo, error } = await supa.from('strategic_memos').select('*').eq('id', params.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!memo) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // P3: open report -> see originating scenario; and all sibling versions.
  let scenario = null;
  if (memo.scenario_id) {
    const { data: sc } = await supa.from('hearst_scenarios').select('*').eq('id', memo.scenario_id).maybeSingle();
    scenario = sc || null;
  }
  let versions = [];
  if (memo.scenario_id) {
    const { data: vs } = await supa.from('strategic_memos')
      .select('id,version,status,provider_used,confidence_level,created_at')
      .eq('scenario_id', memo.scenario_id).order('version', { ascending: true });
    versions = vs || [];
  }
  return NextResponse.json({ memo, scenario, versions });
}

export async function PATCH(req, { params }) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const status = body?.status;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: `invalid_status — must be one of ${STATUSES.join(', ')}` }, { status: 400 });
  }
  const supa = getAdminClient();
  const { data, error } = await supa.from('strategic_memos')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', params.id).select('id,status,version,updated_at').maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ ok: true, memo: data });
}
