# RLS Migration Plan (C4) — Wave 1 deliverable

**Status:** PLAN ONLY. No migration is applied in Wave 1. This document is the
execution path for a later wave.

## Problem (confirmed)

Row-Level Security is **disabled on every table** (`alter table … disable row
level security` across `scripts/crm-schema*.sql`, e.g. `crm-schema.sql:163-167`,
`crm-schema-v6.sql:223-225`). Every `app/api/admin/**` route reaches the DB via
the **service_role** client (`lib/supabase-admin.js`), which bypasses RLS by
design. The entire security boundary is therefore the Next.js application layer:
one forgotten guard, one SSRF/tool-injection reaching `getAdminClient`, or one
leaked service_role key = full read/write of every row, with **no DB-side
defense in depth**.

## Table inventory

### `crm.*` (shared-workspace today; no `owner_id` on most)
| Table | Per-user identity column | RLS target |
|---|---|---|
| `crm.profiles` | `id` (= auth.uid) | self-row read/write; admin read-all |
| `crm.comments` | `author_id` | author write; workspace read |
| `crm.notifications` | `recipient_id` | recipient-only read/write |
| `crm.operators` | — | workspace read; editor write |
| `crm.partners` | — | workspace read; editor write |
| `crm.initiatives` / `initiative_operators` / `initiative_partners` / `initiative_dependencies` | — | workspace read; editor write |
| `crm.workstreams` / `crm.tasks` | — | workspace read; editor write |
| `crm.stakeholders` / `crm.events` / `crm.activity_log` | `actor_id` (nullable) | workspace read; editor write; log append-only |
| `crm.documents` | `actor_id` | uploader+admin write; workspace read |
| `crm.deck_links` / `crm.deck_views` | `actor_id` | editor write; public tracker exempt |

### `crm.hearst_*` (carry `project_id`)
| Table | Scope column | RLS target |
|---|---|---|
| `hearst_projects` | `id` | membership-scoped |
| `hearst_scenarios` / `hearst_pipeline` / `hearst_sources` / `hearst_data_room` / `hearst_contracts` | `project_id` | membership-scoped via project |
| `hearst_advisor_conversations` | `actor_id` + `project_id` | owner-only |
| `hearst_archetype_defaults` / `hearst_gpu_catalog` | reference data | read-all; service_role write |
| `hearst_audit_log` | `actor_id` | append-only; no update/delete |

## Policy inventory (target)

1. **Role claim source.** Add a `role` (`viewer|editor|admin`) lookup from
   `crm.profiles` exposed to policies via a `SECURITY DEFINER` helper
   `crm.current_role()` keyed on `auth.uid()`.
2. **Membership table (new).** `crm.project_members(project_id, profile_id,
   role)` — replaces the implicit single-tenant "shared workspace" with an
   explicit boundary. Required before multi-sovereign use (see C-Major tenant
   isolation).
3. **Standard policy shape per table:**
   - `SELECT`: `auth.uid() is not null` AND (workspace tables) OR
     `project_id in (select project_id from crm.project_members where profile_id = auth.uid())` (hearst tables).
   - `INSERT/UPDATE/DELETE`: `crm.current_role() in ('editor','admin')` plus the
     membership predicate; author-owned tables additionally check
     `author_id = auth.uid()`.
   - `hearst_audit_log`: `INSERT` allowed to authenticated; **no** `UPDATE`/`DELETE`
     policy (append-only, tamper-evident).
   - `crm.notifications`: `recipient_id = auth.uid()` for all verbs.

## Execution path (later wave, ordered by blast-radius)

1. **Phase 0 — keep service_role for writes, move READS to the per-request
   auth client.** Today reads also use service_role. Switching reads to the
   anon/auth client is what makes RLS actually apply without breaking writes.
2. **Phase 1 — enable RLS + `SELECT` policies on the highest-sensitivity tables
   first:** `hearst_data_room`, `crm.documents`, `hearst_scenarios`,
   `hearst_contracts`. Verify the cockpit still reads correctly.
3. **Phase 2 — add write policies; restrict service_role to a minimal set of
   trusted server operations** (audit-log append, cross-project admin jobs).
4. **Phase 3 — introduce `crm.project_members` and flip hearst tables from
   shared-workspace to membership-scoped.** Reject client-supplied `project_id`
   as an authorization boundary (it becomes a filter only).
5. **Phase 4 — `hearst_audit_log` append-only enforcement** + a CI test that
   asserts every `app/api/admin/**` mutating route is covered by an RLS policy.

## Acceptance for the future migration (not Wave 1)

- `rls = on` on all tables; every table has at least a `SELECT` policy.
- A direct PostgREST call with an authenticated **non-service** JWT can only
  read its own project's rows.
- service_role usage is inventoried and minimized.
