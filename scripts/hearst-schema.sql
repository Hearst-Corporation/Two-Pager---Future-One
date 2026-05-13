-- ============================================================
-- hearst-schema.sql
-- Project  : future-one (Supabase project ID: zrvlmhuymhyrzonnihce)
-- Schema   : crm
-- Generated: 2026-05-13
-- Author   : adrien@hearstcorporation.io
--
-- NOTE: RLS currently disabled on these tables — to be addressed
-- in a separate security wave.
--
-- This file is a VERSIONED DDL snapshot of the 7 hearst_* tables
-- that exist in production. It is IDEMPOTENT (CREATE TABLE IF NOT
-- EXISTS) and safe to replay on a fresh database.
-- It does NOT include RLS policies or seed data.
-- ============================================================

CREATE SCHEMA IF NOT EXISTS crm;

-- ============================================================
-- 1. hearst_projects
--    One row per HEARST deal / investment thesis.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_projects (
    id                      uuid          NOT NULL DEFAULT gen_random_uuid(),
    name                    text          NOT NULL DEFAULT 'HEARST Qatar AI & Data Center Hub',
    country                 text          NOT NULL DEFAULT 'Qatar',
    sponsor                 text          NOT NULL DEFAULT 'HEARST',
    institutional_partner   text                   DEFAULT 'Qatar Government / Al Thani / QIA / Qai',
    infrastructure_investor text                   DEFAULT 'Brookfield',
    potential_operator      text                   DEFAULT 'Multi-Operator',
    currency                text          NOT NULL DEFAULT 'USD',
    launch_date             date,
    projection_years        integer       NOT NULL DEFAULT 10,
    site_readiness          text          NOT NULL DEFAULT 'greenfield',
    active_scenario_id      uuid,
    created_by              uuid,
    created_at              timestamptz   NOT NULL DEFAULT now(),
    updated_at              timestamptz   NOT NULL DEFAULT now(),

    CONSTRAINT hearst_projects_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_projects_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES crm.profiles(id)
);

-- ============================================================
-- 2. hearst_scenarios
--    Financial model scenarios (base / downside / upside / custom)
--    linked to a project.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_scenarios (
    id                              uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id                      uuid        NOT NULL,
    name                            text        NOT NULL,
    scenario_type                   text        NOT NULL DEFAULT 'base',
    version                         integer     NOT NULL DEFAULT 1,
    description                     text,
    is_active                       boolean              DEFAULT false,
    is_locked                       boolean              DEFAULT false,

    -- Capacity phasing
    total_mw                        numeric,
    total_mw_source_id              uuid,
    phase1_mw                       numeric,
    phase1_complete_year            integer              DEFAULT 2,
    phase2_mw                       numeric,
    phase2_complete_year            integer              DEFAULT 4,
    phase3_mw                       numeric,
    phase3_complete_year            integer              DEFAULT 6,

    -- Power
    pue                             numeric,
    pue_source_id                   uuid,
    target_occupancy_pct            numeric,
    start_year                      integer              DEFAULT 2026,

    -- CAPEX
    capex_shell_per_mw              numeric,
    capex_shell_source_id           uuid,
    capex_mep_per_mw                numeric,
    capex_mep_source_id             uuid,
    capex_substation_per_mw         numeric,
    capex_substation_source_id      uuid,
    capex_cooling_per_mw            numeric,
    capex_cooling_source_id         uuid,
    capex_grid_per_mw               numeric,
    capex_grid_source_id            uuid,
    capex_contingency_pct           numeric              DEFAULT 0.10,
    capex_liquid_cooling_premium_per_mw numeric,
    capex_land_per_mw               numeric,
    capex_land_source_id            uuid,

    -- OPEX
    electricity_price_mwh           numeric,
    electricity_price_source_id     uuid,
    opex_maintenance_pct            numeric,
    opex_staff_annual_musd          numeric,
    opex_insurance_pct              numeric,
    opex_ga_pct                     numeric,
    opex_operator_mgmt_fee_pct      numeric,

    -- Revenue
    price_retail_colo_kw_month      numeric,
    price_retail_source_id          uuid,
    price_wholesale_kw_month        numeric,
    price_wholesale_source_id       uuid,
    price_hyperscale_kw_month       numeric,
    price_hyperscale_source_id      uuid,
    annual_escalation_pct           numeric              DEFAULT 0.02,

    -- Capital structure
    equity_hearst_pct               numeric,
    equity_brookfield_pct           numeric,
    equity_qatar_pct                numeric,
    debt_pct                        numeric,
    debt_interest_rate              numeric,
    debt_interest_source_id         uuid,

    -- Exit
    exit_multiple                   numeric,
    exit_multiple_source_id         uuid,
    exit_year                       integer              DEFAULT 10,

    -- Commercial / Model output
    commercial_split                jsonb                DEFAULT '{"retail_colo": 100}'::jsonb,
    operator_strategy               text                 DEFAULT 'multi_operator',
    projection_data                 jsonb                DEFAULT '{}'::jsonb,
    last_calculated_at              timestamptz,

    created_by                      uuid,
    created_at                      timestamptz NOT NULL DEFAULT now(),
    updated_at                      timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT hearst_scenarios_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_scenarios_scenario_type_check
        CHECK (scenario_type = ANY (ARRAY['downside'::text, 'base'::text, 'upside'::text, 'custom'::text])),
    CONSTRAINT hearst_scenarios_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id),
    CONSTRAINT hearst_scenarios_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES crm.profiles(id),
    CONSTRAINT hearst_scenarios_pue_source_id_fkey
        FOREIGN KEY (pue_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_total_mw_source_id_fkey
        FOREIGN KEY (total_mw_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_electricity_price_source_id_fkey
        FOREIGN KEY (electricity_price_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_capex_shell_source_id_fkey
        FOREIGN KEY (capex_shell_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_capex_mep_source_id_fkey
        FOREIGN KEY (capex_mep_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_capex_substation_source_id_fkey
        FOREIGN KEY (capex_substation_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_capex_cooling_source_id_fkey
        FOREIGN KEY (capex_cooling_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_capex_grid_source_id_fkey
        FOREIGN KEY (capex_grid_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_capex_land_source_id_fkey
        FOREIGN KEY (capex_land_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_price_retail_source_id_fkey
        FOREIGN KEY (price_retail_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_price_wholesale_source_id_fkey
        FOREIGN KEY (price_wholesale_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_price_hyperscale_source_id_fkey
        FOREIGN KEY (price_hyperscale_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_debt_interest_source_id_fkey
        FOREIGN KEY (debt_interest_source_id) REFERENCES crm.hearst_sources(id),
    CONSTRAINT hearst_scenarios_exit_multiple_source_id_fkey
        FOREIGN KEY (exit_multiple_source_id) REFERENCES crm.hearst_sources(id)
);

-- ============================================================
-- 3. hearst_sources
--    Evidence / citation ledger: every numeric or qualitative
--    input must link to a source row.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_sources (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id              uuid,
    metric_id               text        NOT NULL,
    metric_name             text        NOT NULL,
    value                   numeric,
    value_text              text,
    unit                    text,
    currency                text                 DEFAULT 'USD',
    geography               text,
    date_published          date,
    date_accessed           date                 DEFAULT CURRENT_DATE,
    source_name             text        NOT NULL,
    source_type             text        NOT NULL,
    source_url              text,
    document_title          text,
    page_number             text,
    quoted_excerpt          text,
    confidence_score        integer,
    triangulation_status    text                 DEFAULT 'pending',
    second_source_id        uuid,
    third_source_id         uuid,
    used_in_model           boolean              DEFAULT false,
    used_in_scenario        text                 DEFAULT 'all',
    last_updated            timestamptz          DEFAULT now(),
    admin_override          boolean              DEFAULT false,
    override_reason         text,
    calculation_formula     text,
    caveat                  text,
    applicability_to_qatar  text,
    created_by              uuid,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT hearst_sources_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_sources_source_type_check
        CHECK (source_type = ANY (ARRAY[
            'official_source'::text,
            'uploaded_document'::text,
            'admin_input'::text,
            'calculated'::text,
            'contract'::text
        ])),
    CONSTRAINT hearst_sources_confidence_score_check
        CHECK (confidence_score >= 1 AND confidence_score <= 5),
    CONSTRAINT hearst_sources_triangulation_status_check
        CHECK (triangulation_status = ANY (ARRAY['pending'::text, 'single'::text, 'triangulated'::text])),
    CONSTRAINT hearst_sources_used_in_scenario_check
        CHECK (used_in_scenario = ANY (ARRAY['all'::text, 'downside'::text, 'base'::text, 'upside'::text])),
    CONSTRAINT hearst_sources_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id),
    CONSTRAINT hearst_sources_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES crm.profiles(id)
);

-- ============================================================
-- 4. hearst_data_room
--    Document checklist: required and optional files per project.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_data_room (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id              uuid        NOT NULL,
    category                text        NOT NULL,
    document_type           text        NOT NULL,
    title                   text        NOT NULL,
    description             text,
    status                  text        NOT NULL DEFAULT 'missing',
    file_url                text,
    file_name               text,
    required_for_base_case  boolean              DEFAULT false,
    linked_metric_ids       text[]               DEFAULT '{}'::text[],
    reviewer_id             uuid,
    reviewed_at             timestamptz,
    notes                   text,
    created_by              uuid,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT hearst_data_room_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_data_room_status_check
        CHECK (status = ANY (ARRAY[
            'missing'::text,
            'in_progress'::text,
            'uploaded'::text,
            'reviewed'::text,
            'approved'::text
        ])),
    CONSTRAINT hearst_data_room_category_check
        CHECK (category = ANY (ARRAY[
            'corporate'::text,
            'land'::text,
            'power'::text,
            'permits'::text,
            'technical'::text,
            'commercial'::text,
            'financial'::text,
            'legal'::text,
            'esg'::text,
            'tax'::text,
            'insurance'::text
        ])),
    CONSTRAINT hearst_data_room_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id),
    CONSTRAINT hearst_data_room_reviewer_id_fkey
        FOREIGN KEY (reviewer_id) REFERENCES crm.profiles(id),
    CONSTRAINT hearst_data_room_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES crm.profiles(id)
);

-- ============================================================
-- 5. hearst_contracts
--    Public contract library and reference document repository.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_contracts (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id              uuid        NOT NULL,
    document_type           text        NOT NULL,
    title                   text        NOT NULL,
    source_org              text,
    author                  text,
    date_published          date,
    url                     text,
    jurisdiction            text,
    relevance_to_hearst     text,
    extracted_numbers       jsonb                DEFAULT '{}'::jsonb,
    extracted_clauses       jsonb                DEFAULT '{}'::jsonb,
    usable_in_model         boolean              DEFAULT false,
    confidence              integer,
    citation                text,
    notes                   text,
    created_by              uuid,
    created_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT hearst_contracts_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_contracts_confidence_check
        CHECK (confidence >= 1 AND confidence <= 5),
    CONSTRAINT hearst_contracts_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id),
    CONSTRAINT hearst_contracts_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES crm.profiles(id)
);

-- ============================================================
-- 6. hearst_pipeline
--    Commercial prospect tracking (tenants / operators).
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_pipeline (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id              uuid        NOT NULL,
    prospect_name           text        NOT NULL,
    prospect_type           text        NOT NULL,
    mw_requested            numeric,
    target_price_kw_month   numeric,
    probability_pct         integer,
    expected_signing_date   date,
    contract_length_years   integer,
    status                  text        NOT NULL DEFAULT 'prospect',
    credit_quality          text,
    strategic_value         text,
    cooling_type            text,
    fit_out_required        boolean              DEFAULT false,
    notes                   text,
    created_by              uuid,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT hearst_pipeline_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_pipeline_status_check
        CHECK (status = ANY (ARRAY[
            'prospect'::text,
            'loi'::text,
            'term_sheet'::text,
            'contracted'::text
        ])),
    CONSTRAINT hearst_pipeline_probability_pct_check
        CHECK (probability_pct >= 0 AND probability_pct <= 100),
    CONSTRAINT hearst_pipeline_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id),
    CONSTRAINT hearst_pipeline_created_by_fkey
        FOREIGN KEY (created_by) REFERENCES crm.profiles(id)
);

-- ============================================================
-- 7. hearst_audit_log
--    Immutable audit trail for all admin write operations.
-- ============================================================
CREATE TABLE IF NOT EXISTS crm.hearst_audit_log (
    id                      uuid        NOT NULL DEFAULT gen_random_uuid(),
    project_id              uuid,
    actor_id                uuid,
    action                  text        NOT NULL,
    entity_type             text,
    entity_id               uuid,
    field_name              text,
    previous_value          text,
    new_value               text,
    impact_description      text,
    created_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT hearst_audit_log_pkey PRIMARY KEY (id),
    CONSTRAINT hearst_audit_log_project_id_fkey
        FOREIGN KEY (project_id) REFERENCES crm.hearst_projects(id),
    CONSTRAINT hearst_audit_log_actor_id_fkey
        FOREIGN KEY (actor_id) REFERENCES crm.profiles(id)
);

-- ============================================================
-- Forward reference fix: hearst_projects.active_scenario_id
-- Add FK after hearst_scenarios is created.
-- (Omitted from table body above to avoid circular dep.)
-- ============================================================
-- ALTER TABLE crm.hearst_projects
--     ADD CONSTRAINT IF NOT EXISTS hearst_projects_active_scenario_id_fkey
--     FOREIGN KEY (active_scenario_id) REFERENCES crm.hearst_scenarios(id);
-- ^ Uncomment if applying to a fresh DB with no existing data.

-- End of hearst-schema.sql
