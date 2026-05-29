-- Wave A — institutional memo approval attribution
-- Applied to project future-one (zrvlmhuymhyrzonnihce) on 2026-05-29 via Supabase migration.
-- Additive + nullable + reversible. Existing rows keep NULLs (unattributed history).
--
-- Pairs with the state machine + audit-trail in
--   app/api/admin/hearst/strategic-memos/[id]/route.js  (PATCH)
-- which stamps these columns and writes crm.hearst_audit_log on each transition.

ALTER TABLE crm.strategic_memos
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES crm.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES crm.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz;

-- Rollback:
-- ALTER TABLE crm.strategic_memos
--   DROP COLUMN IF EXISTS reviewed_by, DROP COLUMN IF EXISTS reviewed_at,
--   DROP COLUMN IF EXISTS approved_by, DROP COLUMN IF EXISTS approved_at;
