-- Migration: Create hearst_deals table
-- Run this in Supabase SQL editor or via CLI

CREATE TABLE IF NOT EXISTS crm.hearst_deals (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id            UUID NOT NULL REFERENCES hearst_projects(id) ON DELETE CASCADE,
  operator_id           TEXT NOT NULL,
  operator_name         TEXT NOT NULL,
  deal_type             TEXT NOT NULL CHECK (deal_type IN ('powered_shell','wholesale_lease','hyperscale_anchor','jv','sale_leaseback','manage_only')),
  status                TEXT NOT NULL DEFAULT 'prospecting' CHECK (status IN ('prospecting','term_sheet_sent','due_diligence','negotiation','signed','live')),
  capacity_mw           NUMERIC(12,2),
  price_kw_month        NUMERIC(10,2),
  contract_term_years   INTEGER,
  expected_close_date   DATE,
  linked_scenario_id    UUID REFERENCES hearst_scenarios(id) ON DELETE SET NULL,
  notes                 TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast project lookup
CREATE INDEX IF NOT EXISTS hearst_deals_project_id_idx ON crm.hearst_deals(project_id);
CREATE INDEX IF NOT EXISTS hearst_deals_status_idx ON crm.hearst_deals(status);

-- RLS: same pattern as other hearst tables (admin only)
ALTER TABLE crm.hearst_deals ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'hearst_deals' AND policyname = 'hearst_deals_admin_all') THEN
    CREATE POLICY "hearst_deals_admin_all" ON crm.hearst_deals FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
