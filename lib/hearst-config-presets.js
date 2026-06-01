// Config-layer presets for the simulator's preset-driven sections.
// Leaf module: imports nothing, imported only by the page / input components.
//
// MODEL_DEFAULTS — per operating-model (archetype) canonical buyer/product pair,
// derived directly from the fit=5 anchors in hearst-fit-matrix.js. Selecting an
// operating-model card applies these so the B2B matrix always highlights an
// on-grid cell (no off-grid combos like sovereign_ai::hyperscalers) and the
// engine never receives an incoherent business_model_id / archetype pairing.

export const MODEL_DEFAULTS = {
  // powered_shell::hyperscalers fit 5 — INITIAL_STATE anchor (hyperscale_lease).
  powered_shell:          { business_model_id: 'hyperscale_lease', client_type_id: 'hyperscalers' },
  // gpu_cloud::ai_startups fit 5 — Lambda public price anchor.
  neocloud_gpu:           { business_model_id: 'gpu_cloud',        client_type_id: 'ai_startups' },
  // hyperscale_lease::hyperscalers fit 5 — tech-giant partnership has no business
  // model of its own; the long-lease pattern is the natural default.
  hyperscaler_self_build: { business_model_id: 'hyperscale_lease', client_type_id: 'hyperscalers' },
  // sovereign_ai::qatar_gov fit 5 — Qai mandate anchor.
  sovereign_ai:           { business_model_id: 'sovereign_ai',     client_type_id: 'qatar_gov' },
};
