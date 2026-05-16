/**
 * lib/auth-guards.js
 *
 * Re-usable IDOR / ownership guards for admin API routes.
 *
 * Every `app/api/admin/**` route is reached through service_role
 * (see lib/supabase-admin.js → getAdminClient), which BYPASSES RLS.
 * Ownership therefore must be enforced in application code.
 *
 * The Prese Hub data model is a **single-tenant shared workspace**:
 *   - crm.operators / partners / initiatives / tasks / hearst_*  have NO `owner_id`.
 *   - The only rows with a per-user identity are:
 *       • crm.comments       (author_id)
 *       • crm.notifications  (recipient_id)
 *       • crm.profiles       (id)
 *       • crm.hearst_advisor_conversations (actor_id)
 *
 * For the shared tables, use:
 *     await requireRowOwnership({ table, id, actorId, allowSharedWorkspace: true })
 * which only verifies existence (404) and never returns 403.
 *
 * For author-owned tables, use:
 *     await requireRowOwnership({ table, id, actorId, ownerColumn: 'author_id' })
 *
 * Optionally allow admin-bypass:
 *     await requireRowOwnership({ ..., adminProfile: profile })
 *
 * The helper THROWS a Response (never returns one) — your route should
 * wrap calls in try/catch and `return err` if `err instanceof Response`.
 *
 * @example Express-style usage in a Next.js route handler
 * ```js
 * import { NextResponse } from 'next/server';
 * import { authedWrite } from '@/lib/supabase-admin';
 * import { requireRowOwnership } from '@/lib/auth-guards';
 *
 * export async function PATCH(req, { params }) {
 *   const auth = await authedWrite('editor');
 *   if (auth instanceof NextResponse) return auth;
 *
 *   try {
 *     // Shared-workspace table: only confirms existence
 *     await requireRowOwnership({
 *       table: 'hearst_scenarios',
 *       id: params.id,
 *       actorId: auth.actor,
 *       allowSharedWorkspace: true,
 *     });
 *   } catch (err) {
 *     if (err instanceof Response) return err;
 *     throw err;
 *   }
 *
 *   const body = await req.json();
 *   const { data, error } = await auth.supa
 *     .from('hearst_scenarios')
 *     .update(body)
 *     .eq('id', params.id)
 *     .select()
 *     .single();
 *   if (error) return NextResponse.json({ error: error.message }, { status: 500 });
 *   return NextResponse.json({ scenario: data });
 * }
 * ```
 *
 * @example Author-owned record (comments)
 * ```js
 * await requireRowOwnership({
 *   table: 'comments',
 *   id,
 *   actorId: auth.actor,
 *   ownerColumn: 'author_id',
 *   adminProfile: auth.profile, // admins can edit any comment
 * });
 * ```
 */

import { getAdminClient } from '@/lib/supabase-admin';

/**
 * Verify a row exists and (optionally) belongs to the actor.
 *
 * Returns the row on success.
 * THROWS a `Response` (404 / 403 / 500) on failure — callers should
 * catch and `return err` when `err instanceof Response`.
 *
 * @param {Object}  opts
 * @param {string}  opts.table                  Table name within the `crm` schema (e.g. `'hearst_scenarios'`).
 *                                              If a fully-qualified name like `'public.foo'` is passed, the
 *                                              schema prefix is stripped — getAdminClient() is already bound
 *                                              to the `crm` schema.
 * @param {string}  opts.id                     Primary-key value of the row to guard.
 * @param {string}  opts.actorId                Acting profile id (from `auth.actor` / `profile.id`).
 * @param {string}  [opts.ownerColumn='owner_id']   Column on the row that identifies the owner.
 * @param {boolean} [opts.allowSharedWorkspace=false]
 *                                              If true, skip the ownership check (still verifies existence).
 *                                              Set this for tables that are intentionally shared workspace-wide
 *                                              (operators, partners, initiatives, tasks, hearst_*).
 * @param {Object}  [opts.adminProfile]         Optional profile object; if `adminProfile.role === 'admin'`,
 *                                              ownership check is bypassed.
 * @param {string}  [opts.idColumn='id']        Column used for the primary key lookup.
 * @returns {Promise<Object>} The row.
 */
export async function requireRowOwnership({
  table,
  id,
  actorId,
  ownerColumn = 'owner_id',
  allowSharedWorkspace = false,
  adminProfile = null,
  idColumn = 'id',
}) {
  if (!table || !id || !actorId) {
    throw new Response(
      JSON.stringify({ error: 'bad_guard_args' }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }

  // getAdminClient() is already bound to `crm`. If the caller passed a
  // `<schema>.<table>` we strip the schema portion to avoid PostgREST
  // refusing the request.
  const tableName = table.includes('.') ? table.split('.').pop() : table;

  const supabase = getAdminClient();

  const { data: row, error } = await supabase
    .from(tableName)
    .select('*')
    .eq(idColumn, id)
    .maybeSingle();

  if (error) {
    throw new Response(
      JSON.stringify({ error: 'lookup_failed', detail: error.message }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
  if (!row) {
    throw new Response(
      JSON.stringify({ error: 'not_found' }),
      { status: 404, headers: { 'content-type': 'application/json' } },
    );
  }

  if (allowSharedWorkspace) return row;
  if (adminProfile && adminProfile.role === 'admin') return row;

  if (row[ownerColumn] !== actorId) {
    throw new Response(
      JSON.stringify({ error: 'forbidden' }),
      { status: 403, headers: { 'content-type': 'application/json' } },
    );
  }

  return row;
}
