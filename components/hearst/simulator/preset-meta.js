// preset-meta.js — EDITORIAL metadata for the 4 primary investment-thesis cards.
//
// This is NEOPHYTE-FACING GUIDANCE, not engine output. The numbers here
// (return band, capital intensity) are indicative ranges meant to orient a
// non-expert BEFORE they run the model — they are deliberately shown as bands
// ("8–10%"), never as the live computed figure. The real, scenario-specific
// IRR / capital / MOIC come from the engine and are rendered by the live
// metrics panel / results, the single source of truth for computed values.
// Keyed by the real archetype id (lib/hearst-deal-structures).

export const PRESET_META = {
  powered_shell: {
    tagline: 'The secured yield',
    ideal_for: 'Passive, long-horizon capital',
    return_band: '8–10%',
    risk: 'low',
    complexity: 'low',
    capital: 'very_high',
    partner: 'AWS · Microsoft · Google',
    bullets: [
      '15-year fixed lease — minimal operating exposure',
      'Lowest risk profile, easiest to finance with debt',
    ],
  },
  sovereign_ai: {
    tagline: 'Data sovereignty',
    ideal_for: 'Secured, state-backed projects',
    return_band: '12–15%',
    risk: 'low',
    complexity: 'high',
    capital: 'high',
    partner: 'Government entities',
    bullets: [
      'Premium rent under a 10–15 year state contract',
      'Compliance & security heavy; subsidies possible',
    ],
  },
  neocloud_gpu: {
    tagline: 'The technology bet',
    ideal_for: 'Maximising ROI on the AI wave',
    return_band: '25%+',
    risk: 'very_high',
    complexity: 'very_high',
    capital: 'high',
    partner: 'CoreWeave · Lambda Labs',
    bullets: [
      'Variable GPU-hour revenue, highest upside',
      'Short-cycle hardware and heavy energy opex',
    ],
  },
  hyperscaler_self_build: {
    tagline: 'The minority stake',
    ideal_for: 'Exposure without operating the asset',
    return_band: '10–14%',
    risk: 'low',
    complexity: 'medium',
    capital: 'medium',
    partner: 'AWS · Google · Meta',
    bullets: [
      'A tech giant builds and runs the facility',
      'We hold a 15–30% passive equity position',
    ],
  },
};

// Human labels for the ordinal levels — neutral, jargon-free.
export const LEVEL_LABEL = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  very_high: 'Very high',
};
