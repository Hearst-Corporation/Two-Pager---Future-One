# Prese Hub — Supabase Migrations

This directory holds versioned, **additive** SQL migrations applied on top of the
schemas declared in `scripts/crm-schema*.sql` and `scripts/hearst-schema.sql`.

Production carries real data. Treat every file here as a one-way ratchet.

## Naming convention

```
YYYY-MM-DD_NNN_short_description.sql
```

- `YYYY-MM-DD` — date the migration was authored (UTC).
- `NNN` — zero-padded order on that day (`001`, `002`, ...).
- `short_description` — snake_case, terse (e.g. `hearst_advisor_logs`).

Filenames must sort chronologically with `ls`. Never rename a file once it has
been applied to any environment.

## How to apply

The orchestrator (human) is the only operator allowed to run these. **No agent
runs `psql`, `supabase db push`, or hits the SQL editor directly.**

1. Create a Supabase branch from main:
   ```
   supabase branches create staging-YYYY-MM-DD
   ```
2. Apply the migration on the branch (Studio SQL editor or
   `supabase db push --linked` after switching to the branch).
3. Smoke-test against the branch DB: insert a row, run the expected app code
   path, check indexes (`\d+ table_name`).
4. Once green, apply the same file unchanged to production via Studio SQL
   editor or `supabase db push` against the prod project.
5. Commit the file. Do not edit applied migrations — write a follow-up.

## Rules

- **ADDITIVE ONLY.** Allowed: `CREATE TABLE IF NOT EXISTS`,
  `CREATE INDEX IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS` (nullable or with a
  safe default), `CREATE OR REPLACE FUNCTION/VIEW`, additive `GRANT`.
- **Forbidden:** `DROP TABLE`, `DROP COLUMN`, `ALTER COLUMN` that changes type,
  renames of any object, `TRUNCATE`, `DELETE` without a `WHERE` scoped to the
  migration's own new rows.
- Every file must be safe to re-run (idempotent via `IF NOT EXISTS` /
  `CREATE OR REPLACE`).
- Never set `NOT NULL` on an existing column without a prior backfill migration.

## Rollback strategy

We never drop. "Rollback" means:

1. Stop using the new table/column from app code (revert the deploy).
2. Leave the schema object in place as an orphan; it costs nothing.
3. If a true rewind is unavoidable, author an explicit
   `YYYY-MM-DD_NNN_rollback_<description>.sql` and have the orchestrator run it
   manually — but assume orphan tables are the default outcome.

This keeps prod data intact even when a feature is reverted mid-flight.
