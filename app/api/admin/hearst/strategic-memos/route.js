// GET /api/admin/hearst/strategic-memos
//
// Critical Deliverables branch (P3/P4/P7) — Report Library / retrieval.
// Lists persisted strategic memos with filters. Summary columns only (no full
// memo_json) so the library list stays light; fetch one via [id] for detail.
//
// Filters (querystring): project_id, scenario_id, region, stakeholder, status,
//   since (ISO date), until (ISO date), limit.

import { NextResponse } from 'next/server';
import { requireProfile, getAdminClient } from '@/lib/supabase-admin';
import { dbErrorResponse } from '@/lib/api-errors';

const SUMMARY_COLS = 'id,title,project_id,scenario_id,region,stakeholder,audience,provider_used,confidence_level,data_as_of,generation_time_ms,status,version,created_at,updated_at';

export async function GET(req) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;

  const sp = new URL(req.url).searchParams;
  const supa = getAdminClient();
  let q = supa.from('strategic_memos').select(SUMMARY_COLS).order('created_at', { ascending: false });

  if (sp.get('project_id'))   q = q.eq('project_id', sp.get('project_id'));
  if (sp.get('scenario_id'))  q = q.eq('scenario_id', sp.get('scenario_id'));
  if (sp.get('region'))       q = q.eq('region', sp.get('region'));
  if (sp.get('stakeholder'))  q = q.eq('stakeholder', sp.get('stakeholder'));
  if (sp.get('status'))       q = q.eq('status', sp.get('status'));
  if (sp.get('since'))        q = q.gte('created_at', sp.get('since'));
  if (sp.get('until'))        q = q.lte('created_at', sp.get('until'));
  q = q.limit(Math.min(Number(sp.get('limit')) || 200, 500));

  const { data, error } = await q;
  if (error) return dbErrorResponse(error, '[strategic-memos][GET]');
  return NextResponse.json({ memos: data, count: data.length });
}
