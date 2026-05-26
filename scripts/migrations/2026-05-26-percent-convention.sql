-- 2026-05-26: Percent convention migration.
-- Migrates any legacy rows in crm.hearst_scenarios that still have ratio-scale
-- values (0..1) for percent fields to percent-scale (0..100).
-- Guarded by `<= 1 AND > 0` to be idempotent — re-running won't double-multiply.
--
-- WHEN TO RUN: after deploying A11/A19 application code (which expects percent-scale
-- inputs), BEFORE allowing users to interact with any existing scenarios.
-- Safe to run multiple times; already-migrated rows are skipped by the WHERE guard.
--
-- Affected fields:
--   debt_pct, debt_interest_rate, target_occupancy_pct,
--   capex_contingency_pct, annual_escalation_pct,
--   opex_maintenance_pct, opex_insurance_pct, opex_ga_pct,
--   opex_operator_mgmt_fee_pct,
--   equity_hearst_pct, equity_brookfield_pct, equity_qatar_pct
--
-- NOTE: equity_*_pct are normalized at consumption (waterfall does X/raw_sum)
-- so their stored scale doesn't change financial outputs. The migration here
-- only aligns their stored representation with the new convention.

BEGIN;

UPDATE crm.hearst_scenarios SET
  debt_pct                   = debt_pct                   * 100  WHERE debt_pct                   <= 1 AND debt_pct                   > 0;
UPDATE crm.hearst_scenarios SET
  debt_interest_rate         = debt_interest_rate         * 100  WHERE debt_interest_rate         <= 1 AND debt_interest_rate         > 0;
UPDATE crm.hearst_scenarios SET
  target_occupancy_pct       = target_occupancy_pct       * 100  WHERE target_occupancy_pct       <= 1 AND target_occupancy_pct       > 0;
UPDATE crm.hearst_scenarios SET
  capex_contingency_pct      = capex_contingency_pct      * 100  WHERE capex_contingency_pct      <= 1 AND capex_contingency_pct      > 0;
UPDATE crm.hearst_scenarios SET
  annual_escalation_pct      = annual_escalation_pct      * 100  WHERE annual_escalation_pct      <= 1 AND annual_escalation_pct      > 0;
UPDATE crm.hearst_scenarios SET
  opex_maintenance_pct       = opex_maintenance_pct       * 100  WHERE opex_maintenance_pct       <= 1 AND opex_maintenance_pct       > 0;
UPDATE crm.hearst_scenarios SET
  opex_insurance_pct         = opex_insurance_pct         * 100  WHERE opex_insurance_pct         <= 1 AND opex_insurance_pct         > 0;
UPDATE crm.hearst_scenarios SET
  opex_ga_pct                = opex_ga_pct                * 100  WHERE opex_ga_pct                <= 1 AND opex_ga_pct                > 0;
UPDATE crm.hearst_scenarios SET
  opex_operator_mgmt_fee_pct = opex_operator_mgmt_fee_pct * 100  WHERE opex_operator_mgmt_fee_pct <= 1 AND opex_operator_mgmt_fee_pct > 0;
UPDATE crm.hearst_scenarios SET
  equity_hearst_pct          = equity_hearst_pct          * 100  WHERE equity_hearst_pct          <= 1 AND equity_hearst_pct          > 0;
UPDATE crm.hearst_scenarios SET
  equity_brookfield_pct      = equity_brookfield_pct      * 100  WHERE equity_brookfield_pct      <= 1 AND equity_brookfield_pct      > 0;
UPDATE crm.hearst_scenarios SET
  equity_qatar_pct           = equity_qatar_pct           * 100  WHERE equity_qatar_pct           <= 1 AND equity_qatar_pct           > 0;

-- After migration, alter defaults to percent so future INSERTs without these fields don't introduce ratio values.
ALTER TABLE crm.hearst_scenarios ALTER COLUMN capex_contingency_pct     SET DEFAULT 10;
ALTER TABLE crm.hearst_scenarios ALTER COLUMN annual_escalation_pct     SET DEFAULT 2;

COMMIT;
