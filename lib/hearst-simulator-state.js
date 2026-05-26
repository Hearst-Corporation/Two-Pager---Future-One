// Reducer + initial state pour la page /admin/hearst/simulator.
// Source unique du state d'entrée du simulator. Le scénario hydraté
// (avec defaults Qatar + solver) est calculé côté serveur via
// POST /api/admin/hearst/simulate.

export const INITIAL_STATE = {
  // Mode d'entrée
  mode: 'mw_first',
  capital_usd: 500_000_000,
  total_mw: 50,
  target_irr_pct: 18,
  target_irr_lever: 'pricing',

  // Archétype sélection
  primary_archetype_id: 'powered_shell',
  compare_archetype_ids: ['neocloud_gpu', 'sovereign_ai'],

  // Business / client (pour matrice B2B/B2C)
  business_model_id: 'hyperscale_lease',
  client_type_id: 'hyperscalers',

  // Hardware mix
  hardware_mix: {
    classic_pct: 60,
    liquid_pct: 25,
    ai_pct: 15,
    gpu_sku_id: 'gb200_nvl72',
    num_racks: null,        // dérivé par défaut depuis mw_ai
    utilization_pct: 75,
    gpu_hour_price: 5.0,
  },

  // Geography (pour bootstrap)
  geography: 'qatar',

  // Visualisation active dans le tab switcher
  active_viz: 'radar', // 'radar' | 'network' | 'matrix' | 'sankey'
};

export const ACTIONS = {
  SET_MODE: 'SET_MODE',
  SET_CAPITAL: 'SET_CAPITAL',
  SET_MW: 'SET_MW',
  SET_IRR_TARGET: 'SET_IRR_TARGET',
  SET_IRR_LEVER: 'SET_IRR_LEVER',
  SET_PRIMARY_ARCHETYPE: 'SET_PRIMARY_ARCHETYPE',
  TOGGLE_COMPARE_ARCHETYPE: 'TOGGLE_COMPARE_ARCHETYPE',
  SET_BUSINESS_MODEL: 'SET_BUSINESS_MODEL',
  SET_CLIENT_TYPE: 'SET_CLIENT_TYPE',
  SET_HARDWARE_MIX: 'SET_HARDWARE_MIX',
  APPLY_PRESET: 'APPLY_PRESET',
  SET_ACTIVE_VIZ: 'SET_ACTIVE_VIZ',
  RESET: 'RESET',
  HYDRATE_FROM_URL: 'HYDRATE_FROM_URL',
};

export function simulatorReducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_MODE:
      return { ...state, mode: action.value };

    case ACTIONS.SET_CAPITAL:
      return { ...state, capital_usd: Math.max(0, action.value || 0) };

    case ACTIONS.SET_MW:
      return { ...state, total_mw: Math.max(0, action.value || 0) };

    case ACTIONS.SET_IRR_TARGET:
      return { ...state, target_irr_pct: Math.max(0, Math.min(60, action.value || 0)) };

    case ACTIONS.SET_IRR_LEVER:
      return { ...state, target_irr_lever: action.value };

    case ACTIONS.SET_PRIMARY_ARCHETYPE:
      return { ...state, primary_archetype_id: action.value };

    case ACTIONS.TOGGLE_COMPARE_ARCHETYPE: {
      const current = state.compare_archetype_ids || [];
      const id = action.value;
      const next = current.includes(id)
        ? current.filter(x => x !== id)
        : [...current, id].slice(-4); // max 4
      return { ...state, compare_archetype_ids: next };
    }

    case ACTIONS.SET_BUSINESS_MODEL:
      return { ...state, business_model_id: action.value };

    case ACTIONS.SET_CLIENT_TYPE:
      return { ...state, client_type_id: action.value };

    case ACTIONS.SET_HARDWARE_MIX:
      return { ...state, hardware_mix: { ...state.hardware_mix, ...action.value } };

    case ACTIONS.APPLY_PRESET:
      return { ...state, ...action.value };

    case ACTIONS.SET_ACTIVE_VIZ:
      return { ...state, active_viz: action.value };

    case ACTIONS.RESET:
      return { ...INITIAL_STATE };

    case ACTIONS.HYDRATE_FROM_URL:
      return { ...state, ...(action.value || {}) };

    default:
      return state;
  }
}

/**
 * Construit le payload pour POST /api/admin/hearst/simulate
 * depuis le state du reducer.
 */
export function buildSimulatePayload(state) {
  const archetype_id = state.primary_archetype_id;

  let input_value;
  switch (state.mode) {
    case 'capital_first':
      input_value = { total_capex_usd: state.capital_usd };
      break;
    case 'target_irr_first':
      input_value = {
        target_irr_pct: state.target_irr_pct,
        lever: state.target_irr_lever,
        total_mw: state.total_mw,
      };
      break;
    case 'mw_first':
    default:
      input_value = { total_mw: state.total_mw };
      break;
  }

  const hardware_mix = { ...state.hardware_mix };
  if (hardware_mix.num_racks == null) delete hardware_mix.num_racks;

  return {
    input_mode: state.mode,
    input_value,
    archetype_id,
    business_model_id: state.business_model_id,
    client_type_id: state.client_type_id,
    geography: state.geography,
    hardware_mix,
  };
}

/**
 * Sérialise un sous-ensemble du state dans URL search params.
 */
export function serializeStateToUrl(state) {
  const params = new URLSearchParams();
  params.set('mode', state.mode);
  if (state.mode === 'capital_first') params.set('cap', String(state.capital_usd));
  if (state.mode === 'mw_first') params.set('mw', String(state.total_mw));
  if (state.mode === 'target_irr_first') {
    params.set('irr', String(state.target_irr_pct));
    params.set('lever', state.target_irr_lever);
  }
  params.set('arch', state.primary_archetype_id);
  if (state.compare_archetype_ids?.length) {
    params.set('cmp', state.compare_archetype_ids.join(','));
  }
  params.set('viz', state.active_viz);
  return params.toString();
}

export function parseStateFromUrl(searchParams) {
  if (!searchParams) return null;
  const mode = searchParams.get('mode') || INITIAL_STATE.mode;
  const next = { mode };
  if (mode === 'capital_first' && searchParams.get('cap')) {
    next.capital_usd = Number(searchParams.get('cap')) || INITIAL_STATE.capital_usd;
  }
  if (mode === 'mw_first' && searchParams.get('mw')) {
    next.total_mw = Number(searchParams.get('mw')) || INITIAL_STATE.total_mw;
  }
  if (mode === 'target_irr_first') {
    if (searchParams.get('irr')) next.target_irr_pct = Number(searchParams.get('irr')) || INITIAL_STATE.target_irr_pct;
    if (searchParams.get('lever')) next.target_irr_lever = searchParams.get('lever');
  }
  if (searchParams.get('arch')) next.primary_archetype_id = searchParams.get('arch');
  if (searchParams.get('cmp')) next.compare_archetype_ids = searchParams.get('cmp').split(',').filter(Boolean);
  if (searchParams.get('viz')) next.active_viz = searchParams.get('viz');
  return next;
}

export const QATAR_PRESETS = [
  {
    id: 'powered_shell_100',
    label: 'Big Tech 100MW (Long Lease)',
    mode: 'mw_first',
    total_mw: 100,
    primary_archetype_id: 'powered_shell',
    business_model_id: 'hyperscale_lease',
  },
  {
    id: 'tier3_greenfield_50',
    label: 'Standard 50MW data center',
    mode: 'mw_first',
    total_mw: 50,
    primary_archetype_id: 'branded_jv',
    business_model_id: 'wholesale_colo',
  },
  {
    id: 'sovereign_ai_30',
    label: 'Government AI 30MW',
    mode: 'mw_first',
    total_mw: 30,
    primary_archetype_id: 'sovereign_ai',
    business_model_id: 'sovereign_ai',
    hardware_mix: { classic_pct: 0, liquid_pct: 20, ai_pct: 80, gpu_sku_id: 'gb200_nvl72', utilization_pct: 80, gpu_hour_price: 5 },
  },
  {
    id: 'neocloud_200',
    label: 'GPU rental cloud 200MW',
    mode: 'capital_first',
    capital_usd: 2_400_000_000,
    primary_archetype_id: 'neocloud_gpu',
    business_model_id: 'gpu_cloud',
    hardware_mix: { classic_pct: 0, liquid_pct: 30, ai_pct: 70, gpu_sku_id: 'h100_sxm5', utilization_pct: 75, gpu_hour_price: 2.49 },
  },
];
