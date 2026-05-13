// HEARST Qatar AI & Data Center Hub — Shared constants
// Used across admin pages, API routes, and calculation engine.

import { C } from './admin-tokens';

export const SOURCE_TYPES = {
  official_source:   { label: 'Official Source',   color: C.success,  bg: C.successBg },
  uploaded_document: { label: 'Uploaded Document', color: C.info,     bg: C.infoBg    },
  admin_input:       { label: 'Admin Input',        color: C.warning,  bg: C.warningBg },
  calculated:        { label: 'Calculated',         color: '#7C3AED',  bg: '#EDE9FE'   },
  contract:          { label: 'Contract',           color: '#0891B2',  bg: '#CFFAFE'   },
};

export const MISSING_LABEL = 'N/A — Source Required';
export const ADMIN_INPUT_LABEL = 'Admin Input Required';
export const CONTRACT_REQUIRED_LABEL = 'Contract Required';
export const LENDER_REQUIRED_LABEL = 'Lender Term Sheet Required';

export const SITE_READINESS = {
  greenfield:      { label: 'Greenfield — Nothing Ready',        risk: 5, dev_months: 12, contingency_pct: 0.20, cod_offset_months: 36 },
  land_secured:    { label: 'Land Secured',                      risk: 4, dev_months: 10, contingency_pct: 0.15, cod_offset_months: 30 },
  power_reserved:  { label: 'Power Reserved',                    risk: 3, dev_months:  8, contingency_pct: 0.12, cod_offset_months: 24 },
  substation_ready:{ label: 'Substation Ready',                  risk: 2, dev_months:  6, contingency_pct: 0.10, cod_offset_months: 18 },
  powered_shell:   { label: 'Powered Shell Ready',               risk: 1, dev_months:  3, contingency_pct: 0.05, cod_offset_months:  9 },
  operational:     { label: 'Operational Expansion',             risk: 1, dev_months:  2, contingency_pct: 0.05, cod_offset_months:  6 },
};

export const BUSINESS_MODELS = [
  { id: 'retail_colo',      label: 'Retail Colocation',                 price_key: 'price_retail_colo_kw_month',   margin_range: [0.45, 0.65] },
  { id: 'wholesale_colo',   label: 'Wholesale Colocation',              price_key: 'price_wholesale_kw_month',     margin_range: [0.40, 0.55] },
  { id: 'hyperscale_lease', label: 'Hyperscale Lease',                  price_key: 'price_hyperscale_kw_month',    margin_range: [0.35, 0.50] },
  { id: 'powered_shell',    label: 'Powered Shell',                     price_key: null,                           margin_range: [0.55, 0.70] },
  { id: 'turnkey',          label: 'Turnkey Data Center',               price_key: null,                           margin_range: [0.40, 0.55] },
  { id: 'equinix_zone',     label: 'Equinix-operated Zone',             price_key: null,                           margin_range: [0.30, 0.45] },
  { id: 'multi_operator',   label: 'Multi-operator Zone',               price_key: null,                           margin_range: [0.35, 0.50] },
  { id: 'sovereign_ai',     label: 'Sovereign AI Cloud',                price_key: null,                           margin_range: [0.50, 0.70] },
  { id: 'gpu_cloud',        label: 'GPU Cloud',                         price_key: null,                           margin_range: [0.30, 0.60] },
  { id: 'ai_training',      label: 'AI Training Cluster',               price_key: null,                           margin_range: [0.35, 0.55] },
  { id: 'ai_inference',     label: 'AI Inference Cluster',              price_key: null,                           margin_range: [0.40, 0.60] },
  { id: 'government',       label: 'Government / Defense / Sovereign',  price_key: null,                           margin_range: [0.45, 0.65] },
  { id: 'enterprise',       label: 'Enterprise / Banking / Telecom',    price_key: null,                           margin_range: [0.40, 0.60] },
];

export const CLIENT_TYPES = [
  { id: 'hyperscalers',  label: 'Hyperscalers (AWS, Microsoft, Google, Oracle, Meta)',   contract_term_yr: [10, 20], risk: 'low' },
  { id: 'operators',     label: 'Operators (Equinix, Digital Realty, NTT, Vantage)',     contract_term_yr: [5, 15],  risk: 'low' },
  { id: 'neocloud',      label: 'Neocloud / GPU (CoreWeave, Lambda, Crusoe, RunPod)',    contract_term_yr: [1, 5],   risk: 'medium' },
  { id: 'qatar_gov',     label: 'Qatar Government / QIA / Qai',                         contract_term_yr: [5, 20],  risk: 'low' },
  { id: 'defense',       label: 'Defense / Sovereign',                                  contract_term_yr: [5, 15],  risk: 'low' },
  { id: 'banks',         label: 'Banks',                                                 contract_term_yr: [3, 10],  risk: 'low' },
  { id: 'telecoms',      label: 'Telecoms',                                              contract_term_yr: [5, 10],  risk: 'medium' },
  { id: 'enterprise',    label: 'Large Enterprises',                                     contract_term_yr: [3, 7],   risk: 'medium' },
  { id: 'ai_startups',   label: 'AI Startups',                                           contract_term_yr: [1, 3],   risk: 'high' },
];

export const OPERATOR_STRATEGIES = [
  { id: 'equinix_only',      label: 'Single Operator — Equinix Only',               control: 2, bankability: 5, speed: 4, margin: 3 },
  { id: 'digital_realty',    label: 'Single Operator — Digital Realty Only',        control: 2, bankability: 5, speed: 4, margin: 3 },
  { id: 'ntt_only',          label: 'Single Operator — NTT Only',                   control: 2, bankability: 4, speed: 4, margin: 3 },
  { id: 'multi_operator',    label: 'Multi-Operator Campus',                         control: 4, bankability: 4, speed: 3, margin: 4 },
  { id: 'hearst_managed',    label: 'HEARST-owned / Third-Party Managed',            control: 5, bankability: 3, speed: 3, margin: 5 },
  { id: 'hearst_equinix',    label: 'HEARST-owned / Equinix-operated Zone',          control: 4, bankability: 4, speed: 3, margin: 4 },
  { id: 'brookfield_infra',  label: 'Brookfield InfraCo + Multiple OpCos',           control: 3, bankability: 5, speed: 3, margin: 4 },
  { id: 'powered_shell',     label: 'Powered Shell Leased to Operators',             control: 3, bankability: 4, speed: 5, margin: 3 },
  { id: 'jv_equinix',        label: 'JV with Equinix',                               control: 3, bankability: 5, speed: 3, margin: 4 },
  { id: 'jv_multi',          label: 'JV with Multiple Operators',                    control: 3, bankability: 4, speed: 3, margin: 4 },
];

export const CAPEX_COMPONENTS = [
  { key: 'capex_land_per_mw',       label: 'Land Cost',           unit: '$/MW', source_key: 'capex_land_source_id' },
  { key: 'capex_shell_per_mw',      label: 'Shell / Core',        unit: '$/MW', source_key: 'capex_shell_source_id' },
  { key: 'capex_mep_per_mw',        label: 'MEP',                 unit: '$/MW', source_key: 'capex_mep_source_id' },
  { key: 'capex_substation_per_mw', label: 'Substation',          unit: '$/MW', source_key: 'capex_substation_source_id' },
  { key: 'capex_grid_per_mw',       label: 'Grid Connection',     unit: '$/MW', source_key: 'capex_grid_source_id' },
  { key: 'capex_cooling_per_mw',    label: 'Cooling',             unit: '$/MW', source_key: 'capex_cooling_source_id' },
];

export const OPEX_COMPONENTS = [
  { key: 'electricity_price_mwh',    label: 'Electricity Price',     unit: '$/MWh',     source_key: 'electricity_price_source_id', critical: true },
  { key: 'pue',                      label: 'PUE',                   unit: 'ratio',     source_key: 'pue_source_id',               critical: true },
  { key: 'opex_maintenance_pct',     label: 'Maintenance',           unit: '% revenue', source_key: null,                          critical: false },
  { key: 'opex_staff_annual_musd',   label: 'Staff (annual)',        unit: '$M/yr',     source_key: null,                          critical: false },
  { key: 'opex_insurance_pct',       label: 'Insurance',             unit: '% revenue', source_key: null,                          critical: false },
  { key: 'opex_ga_pct',              label: 'G&A',                   unit: '% revenue', source_key: null,                          critical: false },
  { key: 'opex_operator_mgmt_fee_pct', label: 'Operator Mgmt Fee',  unit: '% revenue', source_key: null,                          critical: false },
];

export const DATA_ROOM_REQUIRED = [
  // Corporate
  { category: 'corporate', title: 'Corporate Structure / UBO', required: true,  metric_ids: [] },
  { category: 'corporate', title: 'KYC / AML Documentation',  required: true,  metric_ids: [] },
  // Land
  { category: 'land',    title: 'Land Title or Land Lease',   required: true,  metric_ids: ['capex_land_per_mw'] },
  { category: 'land',    title: 'Site Coordinates',            required: true,  metric_ids: [] },
  // Power
  { category: 'power',   title: 'Power Allocation Letter',     required: true,  metric_ids: ['electricity_price_mwh'] },
  { category: 'power',   title: 'KAHRAMAA Tariff / PPA / Grid Connection Letter', required: true, metric_ids: ['electricity_price_mwh'] },
  { category: 'power',   title: 'Substation Status Report',    required: true,  metric_ids: ['capex_substation_per_mw'] },
  // Permits
  { category: 'permits', title: 'Zoning and Permits',          required: true,  metric_ids: [] },
  { category: 'permits', title: 'Government Support Letter',    required: false, metric_ids: [] },
  { category: 'permits', title: 'QIA / Qai / Al Thani Confirmation', required: false, metric_ids: [] },
  // Technical
  { category: 'technical', title: 'EPC Quote',                 required: true,  metric_ids: ['capex_shell_per_mw','capex_mep_per_mw'] },
  { category: 'technical', title: 'MEP Quote',                 required: true,  metric_ids: ['capex_mep_per_mw'] },
  { category: 'technical', title: 'Cooling Proposal',          required: true,  metric_ids: ['capex_cooling_per_mw'] },
  { category: 'technical', title: 'Fiber / Carrier Letters',   required: false, metric_ids: [] },
  // Commercial
  { category: 'commercial', title: 'Operator LOIs',            required: true,  metric_ids: ['target_occupancy_pct'] },
  { category: 'commercial', title: 'Equinix Proposal',         required: false, metric_ids: [] },
  { category: 'commercial', title: 'Digital Realty / NTT / Other Proposals', required: false, metric_ids: [] },
  { category: 'commercial', title: 'Hyperscaler LOIs',         required: false, metric_ids: ['price_hyperscale_kw_month'] },
  { category: 'commercial', title: 'Commercial Pipeline',      required: true,  metric_ids: [] },
  // Financial
  { category: 'financial', title: 'Financing Term Sheets',     required: true,  metric_ids: ['debt_pct','debt_interest_rate'] },
  { category: 'financial', title: 'Brookfield Term Sheet or Correspondence', required: true, metric_ids: [] },
  // Legal
  { category: 'legal',   title: 'Legal Structure Memo',        required: true,  metric_ids: [] },
  { category: 'legal',   title: 'Export Controls Memo',         required: false, metric_ids: [] },
  { category: 'tax',     title: 'Tax Structure Advice',         required: false, metric_ids: [] },
  // ESG
  { category: 'esg',     title: 'ESG / Water Report',           required: false, metric_ids: [] },
  // Insurance
  { category: 'insurance', title: 'Insurance Quote',            required: false, metric_ids: [] },
];

export const SMART_ALERTS = [
  { id: 'pue_unsourced',       message: 'PUE not sourced — energy cost cannot be calculated.',          severity: 'critical', field: 'pue_source_id' },
  { id: 'elec_unsourced',      message: 'Electricity price not from PPA or utility contract.',           severity: 'critical', field: 'electricity_price_source_id' },
  { id: 'capex_unsourced',     message: 'Capex per MW not triangulated — at least 2 sources required.', severity: 'critical', field: 'capex_shell_source_id' },
  { id: 'revenue_unsourced',   message: 'No sourced colocation pricing — revenue engine blocked.',       severity: 'critical', field: 'price_retail_source_id' },
  { id: 'exit_multiple',       message: 'Exit multiple not supported by transaction comps.',             severity: 'warning',  field: 'exit_multiple_source_id' },
  { id: 'debt_terms',          message: 'Debt terms not supported by lender term sheet.',               severity: 'warning',  field: 'debt_interest_source_id' },
  { id: 'greenfield_risk',     message: 'Greenfield site — high execution risk and no revenue for 36+ months.', severity: 'info', field: 'site_readiness' },
];

export const PUBLIC_SOURCES_LIBRARY = [
  { title: 'JLL — 2026 Global Data Center Outlook',         source_org: 'JLL',              document_type: 'market_report',     url: 'https://www.jll.com/en-us/insights/market-outlook/data-center-outlook',                  caveat: 'Global benchmark — not Qatar-specific.' },
  { title: 'CBRE — Global Data Center Trends 2025',         source_org: 'CBRE',             document_type: 'market_report',     url: 'https://www.cbre.com/insights/reports/global-data-center-trends-2025',                   caveat: 'Global benchmark — triangulate for Qatar.' },
  { title: 'Turner & Townsend — DC Construction Cost Index 2025-2026', source_org: 'Turner & Townsend', document_type: 'market_report', url: 'https://www.turnerandtownsend.com/insights/data-centre-construction-cost-index-2025-2026/', caveat: 'Construction cost index, liquid cooling premium.' },
  { title: 'Uptime Institute — Tier Classification System', source_org: 'Uptime Institute', document_type: 'technical_datasheet', url: 'https://uptimeinstitute.com/tiers', caveat: 'Tier standards and certification framework.' },
  { title: 'QIA — Brookfield & Qai $20B AI Infrastructure Partnership', source_org: 'QIA', document_type: 'government_source', url: 'https://www.qia.qa/en/Newsroom/Pages/Brookfield-and-Qai-Form-%2420-Billion-Strategic-Investment-Partnership-for-AI-Infrastructure.aspx', caveat: 'Qatar/Brookfield/Qai strategic context.' },
  { title: 'Brookfield — Brookfield & Qai AI Infrastructure Partnership', source_org: 'Brookfield', document_type: 'investor_presentation', url: 'https://bam.brookfield.com/press-releases/brookfield-and-qai-form-20-billion-strategic-investment-partnership-ai', caveat: 'Brookfield role and AI infrastructure mandate.' },
  { title: 'KAHRAMAA — Qatar Electricity & Water Tariff',   source_org: 'KAHRAMAA',         document_type: 'government_source', url: 'https://km.qa/CustomerService/Pages/Tariff.aspx', caveat: 'Official Qatar utility tariff. Not a PPA — requires data center contract.' },
  { title: 'Equinix — Annual Report / 10-K 2024',           source_org: 'Equinix',          document_type: 'annual_report',     url: 'https://investor.equinix.com/sec-filings/annual-reports', caveat: 'Equinix strategy, xScale, AI/cloud leasing.' },
  { title: 'Digital Realty — SEC 10-K 2024',                source_org: 'Digital Realty',   document_type: 'sec_filing',        url: 'https://www.sec.gov/Archives/edgar/data/1297996/000155837025001424/dlr-20241231x10k.htm', caveat: 'Official company filing.' },
  { title: 'NTT Global Data Centers',                        source_org: 'NTT',              document_type: 'market_report',     url: 'https://services.global.ntt/en-us/services-and-products/global-data-centers', caveat: 'Global footprint and operator positioning.' },
  { title: 'Lambda AI Cloud Pricing',                        source_org: 'Lambda',           document_type: 'pricing_page',      url: 'https://lambda.ai/pricing', caveat: 'Lambda vendor pricing only — not universal GPU market price.' },
  { title: 'NVIDIA GB200 NVL72 Official Page',               source_org: 'NVIDIA',           document_type: 'technical_datasheet', url: 'https://www.nvidia.com/en-us/data-center/gb200-nvl72/', caveat: 'Official rack-scale architecture specs.' },
  { title: 'SEC — Super Micro / Prime Data Centers MCSA',   source_org: 'SEC',              document_type: 'actual_contract',   url: 'https://www.sec.gov/Archives/edgar/data/1375365/000137536524000026/prime-supermicroxmcsaxco.htm', caveat: 'Public Master Colocation Services Agreement.' },
  { title: 'SEC — Turn Key Datacenter Lease',               source_org: 'SEC',              document_type: 'lease',             url: 'https://www.sec.gov/Archives/edgar/data/1156378/000119312507268313/dex1028.htm', caveat: 'Public turnkey data center lease structure.' },
  { title: 'Mayer Brown — Structuring Data Center Contracts', source_org: 'Mayer Brown',    document_type: 'legal_memo',        url: 'https://www.mayerbrown.com/-/media/files/perspectives-events/publications/2023/08/factors-to-consider-when-structuring-data-centercontracts.pdf', caveat: 'Legal structuring of DC contracts.' },
  { title: 'Ooredoo — MENA Digital Hub Expansion',          source_org: 'Ooredoo',          document_type: 'market_report',     url: 'https://www.ooredoo.com/en/media/news_view/ooredoo-group-appoints-sunita-bottse-as-ceo-of-mena-digital-hub-its-new-data-centre-company/', caveat: 'Local/regional competitor context.' },
];

export const STATUS_COLORS = {
  missing:     { label: 'Missing',     color: '#DC2626', bg: '#FEE2E2' },
  in_progress: { label: 'In Progress', color: '#D97706', bg: '#FEF3C7' },
  uploaded:    { label: 'Uploaded',    color: '#2563EB', bg: '#DBEAFE' },
  reviewed:    { label: 'Reviewed',    color: '#7C3AED', bg: '#EDE9FE' },
  approved:    { label: 'Approved',    color: '#059669', bg: '#D1FAE5' },
};

export const SCENARIO_COLORS = {
  downside: '#DC2626',
  base:     '#2563EB',
  upside:   '#059669',
  custom:   '#7C3AED',
};

export const DATA_ROOM_CATEGORIES = [
  { id: 'corporate',   label: 'Corporate',          icon: '🏢' },
  { id: 'land',        label: 'Land',               icon: '📍' },
  { id: 'power',       label: 'Power',              icon: '⚡' },
  { id: 'permits',     label: 'Permits',            icon: '📋' },
  { id: 'technical',   label: 'Technical',          icon: '⚙️' },
  { id: 'commercial',  label: 'Commercial',         icon: '🤝' },
  { id: 'financial',   label: 'Financial',          icon: '💰' },
  { id: 'legal',       label: 'Legal',              icon: '⚖️' },
  { id: 'esg',         label: 'ESG',                icon: '🌱' },
  { id: 'tax',         label: 'Tax',                icon: '📊' },
  { id: 'insurance',   label: 'Insurance',          icon: '🛡️' },
];
