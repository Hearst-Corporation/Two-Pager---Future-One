// GET   /api/admin/hearst/strategic-memos/[id]  — retrieve one full memo (+ versions, + scenario link)
// PATCH /api/admin/hearst/strategic-memos/[id]  — lifecycle status transition (P6)
//
// Critical Deliverables branch (P3/P6/P7).

import { NextResponse } from 'next/server';
import { requireProfile, authedWrite, getAdminClient } from '@/lib/supabase-admin';
import { requireRowOwnership } from '@/lib/auth-guards';
import { dbErrorResponse } from '@/lib/api-errors';

const STATUSES = ['draft', 'reviewed', 'approved', 'archived'];

// Wave A — institutional approval state machine. A memo cannot jump
// draft → approved; it must pass through `reviewed`. Approval and review are
// attributed (who/when) and every transition is written to crm.hearst_audit_log.
const TRANSITIONS = {
  draft:    ['reviewed', 'archived'],
  reviewed: ['approved', 'draft', 'archived'],
  approved: ['reviewed', 'archived'],
  archived: ['draft'],
};

export async function GET(_req, { params }) {
  const auth = await requireProfile('viewer');
  if (auth instanceof NextResponse) return auth;
  try {
    await requireRowOwnership({
      table: 'strategic_memos',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  const supa = getAdminClient();

  const { data: memo, error } = await supa.from('strategic_memos').select('*').eq('id', params.id).maybeSingle();
  if (error) return dbErrorResponse(error, '[strategic-memos/[id]][GET]');
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
  try {
    await requireRowOwnership({
      table: 'strategic_memos',
      id: params.id,
      actorId: auth.actor,
      allowSharedWorkspace: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    throw err;
  }
  const supa = auth.supa;
  const actor = auth.actor;

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid_json' }, { status: 400 }); }
  const status = body?.status;
  if (!STATUSES.includes(status)) {
    return NextResponse.json({ error: `invalid_status — must be one of ${STATUSES.join(', ')}` }, { status: 400 });
  }

  // Load current row for the state-machine guard + audit "previous_value".
  // Include memo_json so the approval guard can inspect engine-derived projection.
  const { data: current, error: loadErr } = await supa.from('strategic_memos')
    .select('id,status,title,project_id,memo_json').eq('id', params.id).maybeSingle();
  if (loadErr) return dbErrorResponse(loadErr, '[strategic-memos/[id]][PATCH][load]');
  if (!current) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // No-op transition: nothing to attribute or log.
  if (current.status === status) return NextResponse.json({ ok: true, memo: current, unchanged: true });

  // State-machine guard — block illegal transitions (e.g. draft → approved).
  const allowed = TRANSITIONS[current.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json({
      error: `illegal_transition — "${current.status}" → "${status}" not allowed (must pass through ${allowed.join(' or ') || 'none'})`,
    }, { status: 409 });
  }

  // Part B — approval guard: block → approved if memo lacks engine-derived projection.
  // Only gates the → approved transition; reviewed/draft/archived remain free.
  if (status === 'approved') {
    const memoJson = current.memo_json || {};
    const execProj = memoJson._exec_projection;
    const hasYears = Array.isArray(execProj?.years) && execProj.years.length > 0;
    const metrics = memoJson.key_financial_metrics?.metrics || [];
    const hasEnginePinnedMetric = metrics.some(m => String(m?.source).toLowerCase() === 'engine');
    if (!execProj || !hasYears || !hasEnginePinnedMetric) {
      return NextResponse.json(
        { error: 'cannot_approve_unpinned', detail: 'Memo lacks engine-derived projection (years) or engine-pinned metrics; regenerate before approval.' },
        { status: 409 },
      );
    }
  }

  // Attribution: stamp who/when on review + approval; clear stamps on send-back.
  const nowIso = new Date().toISOString();
  const patch = { status, updated_at: nowIso };
  if (status === 'reviewed')      { patch.reviewed_by = actor; patch.reviewed_at = nowIso; }
  else if (status === 'approved') { patch.approved_by = actor; patch.approved_at = nowIso; }
  else if (status === 'draft')    { patch.reviewed_by = null; patch.reviewed_at = null; patch.approved_by = null; patch.approved_at = null; }

  const { data, error } = await supa.from('strategic_memos')
    .update(patch).eq('id', params.id)
    .select('id,status,version,updated_at,reviewed_by,reviewed_at,approved_by,approved_at').maybeSingle();
  if (error) return dbErrorResponse(error, '[strategic-memos/[id]][PATCH][update]');
  if (!data) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  // Governance audit trail — every transition is attributable.
  let auditLogged = true;
  try {
    const { error: auditErr } = await supa.from('hearst_audit_log').insert({
      project_id: current.project_id || null,
      actor_id: actor,
      action: 'memo_status_change',
      entity_type: 'strategic_memo',
      entity_id: current.id,
      field_name: 'status',
      previous_value: current.status,
      new_value: status,
      impact_description: `"${current.title || 'memo'}" ${current.status} → ${status}`,
    });
    if (auditErr) auditLogged = false;
  } catch { auditLogged = false; }

  return NextResponse.json({ ok: true, memo: data, audit_logged: auditLogged });
}
