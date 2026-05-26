// Matrice de "fit" Business Model × Client Type — pour le tableau
// B2BMatrix dans le simulateur. Les cellules vides sont em-dash.
//
// fit = 1..5 (5 = match parfait, 1 = très mauvais match)
// pricing_typical = $/kW/mo OU $/gpu-hour selon le model
// margin_typical_pct = ratio 0..1 (e.g. 0.55 = 55% EBITDA margin)

/**
 * Group des CLIENT_TYPES en B2B/B2G/B2C (B2C-adjacent).
 */
export const CLIENT_GROUPS = {
  b2b: ['hyperscalers', 'operators', 'neocloud', 'enterprise', 'banks', 'telecoms'],
  b2g: ['qatar_gov', 'defense'],
  b2c: ['ai_startups'], // technically B2B but retail-volume tier
};

/**
 * Group des BUSINESS_MODELS en familles.
 */
export const BUSINESS_MODEL_GROUPS = {
  colocation: ['retail_colo', 'wholesale_colo', 'hyperscale_lease'],
  lease:      ['powered_shell', 'turnkey', 'equinix_zone', 'multi_operator'],
  cloud_ai:   ['gpu_cloud', 'ai_training', 'ai_inference'],
  sovereign:  ['sovereign_ai', 'government'],
  enterprise: ['enterprise'],
};

/**
 * Matrice principale. Clé = `${businessModelId}::${clientTypeId}`.
 * Cellules manquantes = em-dash (pas de match significatif).
 */
export const FIT_MATRIX = {
  // ── Per-rack rental ──────────────────────────────────────────
  'retail_colo::enterprise':   { fit: 5, pricing: 250, margin: 0.55, note: 'Core Equinix business' },
  'retail_colo::banks':        { fit: 5, pricing: 230, margin: 0.55, note: 'Heavy compliance needs' },
  'retail_colo::telecoms':     { fit: 4, pricing: 200, margin: 0.50, note: 'Carrier hub pattern' },
  'retail_colo::ai_startups':  { fit: 2, pricing: 280, margin: 0.45, note: 'Small footprints, high churn' },

  // ── Bulk rental ───────────────────────────────────────
  'wholesale_colo::hyperscalers': { fit: 5, pricing: 110, margin: 0.42, note: 'Standard hyperscale pattern' },
  'wholesale_colo::operators':    { fit: 4, pricing: 105, margin: 0.40, note: 'Carrier multi-tenant' },
  'wholesale_colo::neocloud':     { fit: 4, pricing: 115, margin: 0.42, note: 'CoreWeave/Lambda anchor' },
  'wholesale_colo::enterprise':   { fit: 3, pricing: 130, margin: 0.45, note: 'Large enterprise only' },

  // ── Big Tech lease (long lease on empty shell) ───────────────────────
  'hyperscale_lease::hyperscalers': { fit: 5, pricing: 115, margin: 0.42, note: 'Meta x Blue Owl Hyperion ($27B)' },
  'hyperscale_lease::operators':    { fit: 4, pricing: 110, margin: 0.40, note: 'Equinix xScale style' },
  'hyperscale_lease::qatar_gov':    { fit: 4, pricing: 130, margin: 0.50, note: 'Government anchor option' },

  // ── Shell only ──────────────────────────────────────────────
  'powered_shell::hyperscalers': { fit: 5, pricing: 95,  margin: 0.65, note: 'Lowest cost, tenant fits equipment' },
  'powered_shell::operators':    { fit: 5, pricing: 90,  margin: 0.60, note: 'Equinix as anchor tenant' },
  'powered_shell::neocloud':     { fit: 3, pricing: 105, margin: 0.55, note: 'Liquid cooling responsibility' },

  // ── Turnkey (built-to-order) ────────────────────────────────────────────────────
  'turnkey::operators':    { fit: 4, pricing: 140, margin: 0.40, note: 'Built to spec' },
  'turnkey::qatar_gov':    { fit: 5, pricing: 160, margin: 0.50, note: 'Government build-to-suit' },
  'turnkey::defense':      { fit: 5, pricing: 180, margin: 0.55, note: 'Isolated + compliance' },

  // ── Equinix Zone / Multi-operator ──────────────────────────────
  'equinix_zone::hyperscalers':   { fit: 4, pricing: 120, margin: 0.45, note: 'Equinix-operated zone' },
  'multi_operator::hyperscalers': { fit: 4, pricing: 115, margin: 0.45, note: 'Multi-tenant campus' },
  'multi_operator::operators':    { fit: 5, pricing: 110, margin: 0.43, note: 'Brookfield InfraCo model' },

  // ── GPU rental cloud ───────────────────────────────
  'gpu_cloud::ai_startups':    { fit: 5, pricing: '$2.49/h H100', margin: 0.35, note: 'Lambda public price' },
  'gpu_cloud::neocloud':       { fit: 4, pricing: '$1.89-3/h',    margin: 0.40, note: 'Bulk GPU rental' },
  'gpu_cloud::enterprise':     { fit: 4, pricing: '$3.50/h',      margin: 0.45, note: 'Reserved cluster' },
  'gpu_cloud::hyperscalers':   { fit: 2, pricing: '—',            margin: 0.30, note: 'Tech giants build their own' },

  // ── AI Training / Inference ────────────────────────────────────
  'ai_training::ai_startups':   { fit: 5, pricing: '$5/h GB200', margin: 0.40, note: 'Cutting-edge training' },
  'ai_training::qatar_gov':     { fit: 5, pricing: 'cost+15%',   margin: 0.55, note: 'Government training' },
  'ai_training::enterprise':    { fit: 3, pricing: '$4.50/h',    margin: 0.42, note: 'In-house model development' },
  'ai_inference::ai_startups':  { fit: 5, pricing: '$1-2/h',     margin: 0.40, note: 'Inference-as-a-service' },
  'ai_inference::enterprise':   { fit: 4, pricing: '$2-3/h',     margin: 0.50, note: 'Production inference' },
  'ai_inference::banks':        { fit: 3, pricing: '$3-4/h',     margin: 0.50, note: 'On-premise style with SLA' },

  // ── Government AI ───────────────────────────────────────────────
  'sovereign_ai::qatar_gov':    { fit: 5, pricing: 'negotiated', margin: 0.60, note: 'Qai mandate' },
  'sovereign_ai::defense':      { fit: 5, pricing: 'negotiated', margin: 0.55, note: 'Defense rules + isolated' },
  'sovereign_ai::enterprise':   { fit: 2, pricing: 'restricted', margin: 0.40, note: 'Strategic only' },

  // ── Government / Defense ───────────────────────────────────────
  'government::qatar_gov':      { fit: 5, pricing: 'cost+20%',   margin: 0.45, note: 'Standard government contract' },
  'government::defense':        { fit: 5, pricing: 'cost+25%',   margin: 0.50, note: 'Higher security premium' },

  // ── Enterprise ──────────────────────────────────────────────────
  'enterprise::enterprise':     { fit: 5, pricing: 220, margin: 0.55, note: 'Large enterprise backup site' },
  'enterprise::banks':          { fit: 5, pricing: 240, margin: 0.55, note: 'Top-tier financial' },
  'enterprise::telecoms':       { fit: 4, pricing: 180, margin: 0.50, note: 'Carrier-grade SLA' },
};

/**
 * Convertit le score fit (0-5) en token CSS pour coloring de la cellule.
 */
export function fitColor(fit) {
  if (!fit || fit <= 0) return 'transparent';
  if (fit === 1) return 'color-mix(in oklch, var(--cp-text-faint) 18%, transparent)';
  if (fit === 2) return 'color-mix(in oklch, var(--cp-surface-1) 70%, transparent)';
  if (fit === 3) return 'color-mix(in oklch, var(--cp-info-bg) 80%, transparent)';
  if (fit === 4) return 'color-mix(in oklch, var(--cp-success-bg) 70%, transparent)';
  return 'color-mix(in oklch, var(--cp-accent-strong) 40%, transparent)';
}

/**
 * Lookup convenience.
 */
export function getFit(businessModelId, clientTypeId) {
  return FIT_MATRIX[`${businessModelId}::${clientTypeId}`] || null;
}
