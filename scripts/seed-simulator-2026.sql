-- HEARST Simulator — seed data
--
-- Run AFTER scripts/migrations/2026-05-26_004_simulator_extensions.sql.
-- Idempotent via ON CONFLICT DO NOTHING (unique constraints on sku /
-- (archetype_id, business_model_id, geography)).

-- ────────────────────────────────────────────────────────────
-- 1. GPU catalog — 4 SKUs
-- ────────────────────────────────────────────────────────────
INSERT INTO crm.hearst_gpu_catalog
    (sku, vendor, tdp_w, msrp_usd, density_per_rack, perf_tflops_fp16,
     perf_tflops_fp8, hbm_gb, available_from, use_case, reference_url, notes)
VALUES
    ('H100 SXM5',    'NVIDIA',    700,     30000,   8,  1979,   3958,  80,
     '2023-03-01', 'training',
     'https://www.nvidia.com/en-us/data-center/h100/',
     'Hopper. Reference rack ≈ 6 kW (8× SXM5 + host).'),
    ('H200 SXM5',    'NVIDIA',    700,     32000,   8,  1979,   3958,  141,
     '2024-04-01', 'inference',
     'https://www.nvidia.com/en-us/data-center/h200/',
     'Hopper refresh — bumped HBM to 141 GB for long-context inference.'),
    ('GB200 NVL72',  'NVIDIA',    1200000, 3000000, 72, 5000,  10000, 192,
     '2025-01-01', 'training',
     'https://www.nvidia.com/en-us/data-center/gb200-nvl72/',
     'Rack-scale Blackwell. 1.2 MW/rack — REQUIRES liquid cooling.'),
    ('MI300X',       'AMD',       750,     15000,   8,  1307,   2614,  192,
     '2023-12-06', 'inference',
     'https://www.amd.com/en/products/accelerators/instinct/mi300/mi300x.html',
     'AMD Instinct — 192 GB HBM3, cost-optimised inference.')
ON CONFLICT (sku) DO NOTHING;

-- ────────────────────────────────────────────────────────────
-- 2. Archetype defaults — Qatar geography
--    25 combinaisons (archetype × business_model) significatives.
--    Valeurs alignées sur PUBLIC_SOURCES_LIBRARY (Equinix 10-K, DR 10-K,
--    NTT MENA, T&T MENA, JLL Gulf, KAHRAMAA).
-- ────────────────────────────────────────────────────────────

-- Powered Shell NNN (recommandé) — landlord pure, locataire opère
INSERT INTO crm.hearst_archetype_defaults
    (archetype_id, business_model_id, geography, capex_per_mw_usd, opex_pct, pricing_kw_month, margin_pct, notes)
VALUES
    ('powered_shell',  'powered_shell',    'qatar', 5400000,  0.05,  NULL,  0.65, 'Shell+sub+grid+land. Locataire MEP/cooling.'),
    ('powered_shell',  'hyperscale_lease', 'qatar', 7500000,  0.08,  115,   0.60, 'NNN 15-20 yr. Hyperscaler MEP.'),
    ('powered_shell',  'wholesale_colo',   'qatar', 7500000,  0.10,   95,   0.55, 'JLL Gulf wholesale benchmark.'),

-- Branded JV 51/49 — co-investisseur, brand co-managé
    ('branded_jv',     'hyperscale_lease', 'qatar', 8500000,  0.12,  115,   0.50, 'JV avec Equinix-style operator.'),
    ('branded_jv',     'wholesale_colo',   'qatar', 8500000,  0.13,   95,   0.45, 'JV multi-operator.'),
    ('branded_jv',     'multi_operator',   'qatar', 8500000,  0.13,  100,   0.45, 'Brookfield InfraCo + OpCos.'),

-- Manage-only — operator pure, sans equity
    ('manage_only',    'enterprise',       'qatar',     NULL,   0.85, 250,   0.18, 'O&M fee only, no equity.'),
    ('manage_only',    'retail_colo',      'qatar',     NULL,   0.82, 165,   0.20, 'Equinix-style O&M.'),

-- White-label (Compass-style) — operator anonyme
    ('white_label',    'wholesale_colo',   'qatar', 9000000,  0.15,   95,   0.40, 'Compass Datacenters model.'),
    ('white_label',    'hyperscale_lease', 'qatar', 9000000,  0.13,  115,   0.45, 'Hyperscaler anonymized.'),

-- Sale-leaseback @ stabilisation
    ('sale_leaseback', 'powered_shell',    'qatar', 5400000,  0.05,  NULL,  NULL, 'Sale at 16-18× EBITDA year 5-7.'),
    ('sale_leaseback', 'hyperscale_lease', 'qatar', 7500000,  0.08,  115,   NULL, 'Brookfield bid 18-22× DC EBITDA.'),

-- Neocloud GPU (CoreWeave / Lambda style)
    ('neocloud_gpu',   'gpu_cloud',        'qatar',12000000,  0.55,  NULL,  0.40, 'GPU-hour pricing. Hardware 60% capex.'),
    ('neocloud_gpu',   'ai_training',      'qatar',12000000,  0.50,  NULL,  0.45, 'Frontier training cluster B2B.'),
    ('neocloud_gpu',   'ai_inference',     'qatar',11000000,  0.45,  NULL,  0.50, 'Inference cluster, plus de churn.'),

-- Hyperscaler self-build (HEARST minority 15-30%)
    ('hyperscaler_self_build', 'hyperscale_lease', 'qatar', 11000000, NULL,  NULL,  NULL, 'HEARST as LP. Revenue = dividends.'),
    ('hyperscaler_self_build', 'enterprise',       'qatar', 11000000, NULL,  NULL,  NULL, 'Meta/Google self-build, minority.'),

-- Sovereign AI (cluster gov-funded)
    ('sovereign_ai',   'sovereign_ai',     'qatar',13000000,  0.30,  NULL,  0.60, 'Qai mandate. Single-tenant gov.'),
    ('sovereign_ai',   'government',       'qatar',13000000,  0.35,  NULL,  0.55, 'Defense/sovereign 10-15 yr.'),
    ('sovereign_ai',   'ai_training',      'qatar',13000000,  0.30,  NULL,  0.62, 'Sovereign AI training.')
ON CONFLICT (archetype_id, business_model_id, geography) DO NOTHING;
