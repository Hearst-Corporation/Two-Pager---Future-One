-- HEARST Simulator Extensions — input modes, hardware mix, GPU catalog,
-- archetype defaults.
--
-- Read/written by:
--   - `app/api/admin/hearst/simulate/route.js`     (stateless preview)
--   - `app/api/admin/hearst/catalog/gpus/route.js` (GET)
--   - `app/(cockpit)/admin/hearst/simulator/page.jsx` (save as scenario)
--
-- Additive, idempotent. Re-running is safe.
-- RLS intentionally left off for parity with existing hearst_* tables
-- (see scripts/hearst-schema.sql header). Future security wave to address.

-- ============================================================
-- 1. crm.hearst_gpu_catalog
--    Catalogue des SKU GPU disponibles (H100, H200, GB200, MI300X, …).
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_gpu_catalog (
    id                 uuid          NOT NULL DEFAULT gen_random_uuid(),
    sku                text          NOT NULL,
    vendor             text          NOT NULL,
    tdp_w              numeric       NOT NULL,
    msrp_usd           numeric       NOT NULL,
    density_per_rack   integer       NOT NULL,
    perf_tflops_fp16   numeric,
    perf_tflops_fp8    numeric,
    hbm_gb             integer,
    available_from     date,
    use_case           text,
    reference_url      text,
    source_id          uuid,
    notes              text,
    created_at         timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT hearst_gpu_catalog_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_gpu_catalog_sku_unique UNIQUE (sku),
    CONSTRAINT hearst_gpu_catalog_use_case_check
        CHECK (use_case IN ('training', 'inference', 'mixed') OR use_case IS NULL),
    CONSTRAINT hearst_gpu_catalog_source_fkey
        FOREIGN KEY (source_id) REFERENCES crm.hearst_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS hearst_gpu_catalog_vendor_idx
    ON crm.hearst_gpu_catalog (vendor);

-- ============================================================
-- 2. crm.hearst_archetype_defaults
--    Defaults par couple (archetype × business_model × geography) —
--    seed des paramètres CAPEX/OPEX/pricing typiques.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_archetype_defaults (
    id                  uuid          NOT NULL DEFAULT gen_random_uuid(),
    archetype_id        text          NOT NULL,
    business_model_id   text          NOT NULL,
    geography           text          NOT NULL DEFAULT 'qatar',
    capex_per_mw_usd    numeric,
    opex_pct            numeric,
    pricing_kw_month    numeric,
    margin_pct          numeric,
    source_id           uuid,
    notes               text,
    created_at          timestamptz   NOT NULL DEFAULT now(),
    updated_at          timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT hearst_archetype_defaults_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_archetype_defaults_archetype_check
        CHECK (archetype_id IN (
            'powered_shell','branded_jv','manage_only','white_label','sale_leaseback',
            'neocloud_gpu','hyperscaler_self_build','sovereign_ai'
        )),
    CONSTRAINT hearst_archetype_defaults_unique
        UNIQUE (archetype_id, business_model_id, geography),
    CONSTRAINT hearst_archetype_defaults_source_fkey
        FOREIGN KEY (source_id) REFERENCES crm.hearst_sources(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS hearst_archetype_defaults_arch_idx
    ON crm.hearst_archetype_defaults (archetype_id);
CREATE INDEX IF NOT EXISTS hearst_archetype_defaults_bm_idx
    ON crm.hearst_archetype_defaults (business_model_id);
CREATE INDEX IF NOT EXISTS hearst_archetype_defaults_geo_idx
    ON crm.hearst_archetype_defaults (geography);

-- ============================================================
-- 3. crm.hearst_scenarios — colonnes simulator
--    Permet de tracer la provenance d'un scenario (mode d'entrée
--    + valeur saisie + mix hardware) au moment du "Save as Scenario".
-- ============================================================
ALTER TABLE crm.hearst_scenarios
    ADD COLUMN IF NOT EXISTS input_mode   text  DEFAULT 'mw_first';

ALTER TABLE crm.hearst_scenarios
    ADD COLUMN IF NOT EXISTS input_value  jsonb DEFAULT '{}'::jsonb;

ALTER TABLE crm.hearst_scenarios
    ADD COLUMN IF NOT EXISTS hardware_mix jsonb DEFAULT '{}'::jsonb;

-- Ajout du CHECK sans bloquer si déjà présent.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.constraint_column_usage
        WHERE table_schema = 'crm'
          AND table_name   = 'hearst_scenarios'
          AND constraint_name = 'hearst_scenarios_input_mode_check'
    ) THEN
        ALTER TABLE crm.hearst_scenarios
            ADD CONSTRAINT hearst_scenarios_input_mode_check
            CHECK (input_mode IN ('mw_first', 'capital_first', 'target_irr_first'));
    END IF;
END $$;
