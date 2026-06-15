/**
 * oracle-visualization/specs.js
 * Pure data builders — no React, no SVG, no side effects.
 * All coordinates are in logical units 0-1000.
 */

// ---------------------------------------------------------------------------
// Color token mapping (no hex — consumers use var(--cp-*))
// ---------------------------------------------------------------------------
const KIND_COLOR = {
  classic: 'var(--cp-accent)',
  liquid:  'var(--cp-surface-2)',
  ai:      'var(--cp-highlight)',
  air:     'var(--cp-surface-1)',
  hybrid:  'var(--cp-surface-3)',
};

// Density reference kW per rack by kind (industry-standard approximations)
// classic ≈ 6 kW/rack  (standard ASHRAE A1-A2 air-cooled)
// liquid  ≈ 30 kW/rack (rear-door / in-row liquid cooling)
// ai      ≈ 130 kW/rack (GB200 NVL rack-scale, direct liquid)
const DENSITY_KW_PER_RACK = {
  classic: 6,
  liquid:  30,
  ai:      130,
};

// cooling pattern tokens: air uses subtle fill, liquid uses striped pattern
const COOLING_FILL_TOKEN = {
  air:    'var(--cp-surface-1)',
  liquid: 'var(--cp-surface-2)',
  hybrid: 'var(--cp-surface-3)',
};
const COOLING_PATTERN_ID = {
  air:    'pattern-air',
  liquid: 'pattern-liquid',
  hybrid: 'pattern-hybrid',
};

// ---------------------------------------------------------------------------
// build2DDiagramSpec
// ---------------------------------------------------------------------------
/**
 * @param {{ scenario: { total_mw: number, hardware_mix: { classic_pct: number, liquid_pct: number, ai_pct: number } } }} simulation
 * @returns {object} DiagramSpec
 */
function build2DDiagramSpec(simulation) {
  const scenario = simulation?.scenario ?? {};
  const total_mw = Number(scenario.total_mw ?? 100);
  const mix = scenario.hardware_mix ?? { classic_pct: 60, liquid_pct: 25, ai_pct: 15 };

  const classic_pct = Number(mix.classic_pct ?? 60);
  const liquid_pct  = Number(mix.liquid_pct  ?? 25);
  const ai_pct      = Number(mix.ai_pct      ?? 15);

  // ------------------------------------------------------------------
  // Layout constants (logical 1000×1000 canvas)
  // ------------------------------------------------------------------
  const CANVAS_W = 1000;
  const CANVAS_H = 1000;

  const POWER_ZONE_H   = 120;
  const COOLING_ZONE_H = 100;
  const RACK_Y = POWER_ZONE_H + 20;
  const RACK_H = CANVAS_H - POWER_ZONE_H - COOLING_ZONE_H - 40;
  const RACK_W = CANVAS_W;

  // ------------------------------------------------------------------
  // Power zones
  // ------------------------------------------------------------------
  const power_zones = [
    {
      x: 0,
      y: 0,
      w: CANVAS_W / 2,
      h: POWER_ZONE_H,
      label: 'Primary Grid Feed',
      mw_capacity: Math.round(total_mw * 0.6),
    },
    {
      x: CANVAS_W / 2,
      y: 0,
      w: CANVAS_W / 2,
      h: POWER_ZONE_H,
      label: 'Backup / Renewables',
      mw_capacity: Math.round(total_mw * 0.4),
    },
  ];

  // ------------------------------------------------------------------
  // Cooling zones — proportional to mix, with pattern_id + fill_token
  // ------------------------------------------------------------------
  const total_pct = (classic_pct + liquid_pct + ai_pct) || 100;
  const cool_y = CANVAS_H - COOLING_ZONE_H;

  const rawCooling = [
    {
      x: 0,
      y: cool_y,
      w: Math.round(CANVAS_W * (classic_pct / total_pct)),
      h: COOLING_ZONE_H,
      kind:       'air',
      fill_token: COOLING_FILL_TOKEN.air,
      pattern_id: COOLING_PATTERN_ID.air,
      label:      'Air Cooling',
    },
    {
      x: Math.round(CANVAS_W * (classic_pct / total_pct)),
      y: cool_y,
      w: Math.round(CANVAS_W * (liquid_pct / total_pct)),
      h: COOLING_ZONE_H,
      kind:       'liquid',
      fill_token: COOLING_FILL_TOKEN.liquid,
      pattern_id: COOLING_PATTERN_ID.liquid,
      label:      'Liquid Cooling',
    },
    {
      x: Math.round(CANVAS_W * ((classic_pct + liquid_pct) / total_pct)),
      y: cool_y,
      w: Math.round(CANVAS_W * (ai_pct / total_pct)),
      h: COOLING_ZONE_H,
      kind:       'hybrid',
      fill_token: COOLING_FILL_TOKEN.hybrid,
      pattern_id: COOLING_PATTERN_ID.hybrid,
      label:      'Direct Liquid (AI)',
    },
  ];
  const cooling_zones = rawCooling.filter(z => z.w > 0);

  // ------------------------------------------------------------------
  // Rack blocks — width proportional to MW, height constant
  // density_kw_per_rack added for label display
  // ------------------------------------------------------------------
  const kinds = [
    { kind: 'classic', pct: classic_pct },
    { kind: 'liquid',  pct: liquid_pct  },
    { kind: 'ai',      pct: ai_pct      },
  ].filter(k => k.pct > 0);

  const BLOCK_GAP = 10;
  const usable_w  = RACK_W - (kinds.length - 1) * BLOCK_GAP;

  let cursor_x = 0;
  const rack_blocks = kinds.map(({ kind, pct }) => {
    const w               = Math.round(usable_w * (pct / total_pct));
    const mw              = Math.round(total_mw * (pct / total_pct));
    const density_kw      = DENSITY_KW_PER_RACK[kind] ?? 6;
    // estimated rack count: 1 MW = 1000 kW
    const rack_count      = Math.round((mw * 1000) / density_kw);
    const density_kw_per_rack = density_kw;

    const block = {
      x: cursor_x,
      y: RACK_Y,
      w,
      h: RACK_H,
      kind,
      mw,
      label:             `${kind.charAt(0).toUpperCase() + kind.slice(1)} — ${mw} MW`,
      density_kw_per_rack,
      rack_count,
    };
    cursor_x += w + BLOCK_GAP;
    return block;
  });

  // ------------------------------------------------------------------
  // Summary line (consumed by InfrastructureDiagram header)
  // ------------------------------------------------------------------
  const ai_label = ai_pct > 0 ? ' · high-density cluster' : '';
  const summary = `${total_mw} MW · ${classic_pct}% standard / ${liquid_pct}% dense / ${ai_pct}% high-density${ai_label}`;

  // ------------------------------------------------------------------
  // Legend — include density hint
  // ------------------------------------------------------------------
  const legend = [
    { kind: 'classic', label: `Standard capacity`,    color_token: KIND_COLOR.classic },
    { kind: 'liquid',  label: `Dense / advanced cooling`,  color_token: KIND_COLOR.liquid  },
    { kind: 'ai',      label: `High-density compute`,        color_token: KIND_COLOR.ai      },
  ];

  return {
    type: '2d_floorplan',
    total_mw,
    summary,
    rack_blocks,
    power_zones,
    cooling_zones,
    legend,
  };
}

// ---------------------------------------------------------------------------
// buildTopologySpec
// ---------------------------------------------------------------------------
/**
 * @param {object} simulation
 * @returns {object} TopologySpec
 */
function buildTopologySpec() {
  // Standard data-center topology. x/y in logical 0-1000.
  const nodes = [
    { id: 'utility',      label: 'Utility Grid',    kind: 'utility',      x: 500, y:  50 },
    { id: 'sub_a',        label: 'Substation A',    kind: 'substation',   x: 300, y: 200 },
    { id: 'sub_b',        label: 'Substation B',    kind: 'substation',   x: 700, y: 200 },
    { id: 'mep_a',        label: 'MEP / UPS A',     kind: 'mep',          x: 300, y: 380 },
    { id: 'mep_b',        label: 'MEP / UPS B',     kind: 'mep',          x: 700, y: 380 },
    { id: 'ws_classic',   label: 'Classic Hall',    kind: 'whitespace',   x: 200, y: 580 },
    { id: 'ws_liquid',    label: 'Liquid Hall',     kind: 'whitespace',   x: 500, y: 580 },
    { id: 'ws_ai',        label: 'AI Cluster',      kind: 'whitespace',   x: 800, y: 580 },
    { id: 'fabric',       label: 'Spine Fabric',    kind: 'fabric',       x: 400, y: 760 },
    { id: 'interconnect', label: 'Interconnect/IX', kind: 'interconnect', x: 700, y: 760 },
  ];

  const edges = [
    { from: 'utility',    to: 'sub_a',        kind: 'power',   label: '~60%'   },
    { from: 'utility',    to: 'sub_b',        kind: 'power',   label: '~40%'   },
    { from: 'sub_a',      to: 'mep_a',        kind: 'power',   label: ''       },
    { from: 'sub_b',      to: 'mep_b',        kind: 'power',   label: ''       },
    { from: 'mep_a',      to: 'ws_classic',   kind: 'power',   label: ''       },
    { from: 'mep_a',      to: 'ws_liquid',    kind: 'power',   label: ''       },
    { from: 'mep_b',      to: 'ws_liquid',    kind: 'power',   label: ''       },
    { from: 'mep_b',      to: 'ws_ai',        kind: 'power',   label: ''       },
    { from: 'ws_classic', to: 'ws_liquid',    kind: 'cooling', label: 'air'    },
    { from: 'ws_liquid',  to: 'ws_ai',        kind: 'cooling', label: 'liquid' },
    { from: 'ws_classic', to: 'fabric',       kind: 'fiber',   label: ''       },
    { from: 'ws_liquid',  to: 'fabric',       kind: 'fiber',   label: ''       },
    { from: 'ws_ai',      to: 'fabric',       kind: 'fiber',   label: ''       },
    { from: 'fabric',     to: 'interconnect', kind: 'fiber',   label: 'IX'     },
  ];

  const summary = `${nodes.length} nodes · ${edges.length} edges`;

  return { type: 'topology', summary, nodes, edges };
}

// ---------------------------------------------------------------------------
// buildDeploymentPhaseSpec
// ---------------------------------------------------------------------------
/**
 * Sequential / overlapping phase timeline for a data-center build-out.
 * Phases chain realistically:
 *   Permits   0  → 9 mo
 *   Grid      6  → 24 mo  (overlap with Permits)
 *   EPC      12  → COD    (overlap with Grid)
 *   COD      <phase1_complete_yr*12>  → +2 mo  (milestone)
 *   Ramp     <COD+2>  → exit
 *
 * @param {object} simulation
 * @returns {object} PhaseSpec
 */
function buildDeploymentPhaseSpec(simulation) {
  const scenario = simulation?.scenario ?? {};

  const start_year         = Number(scenario.start_year           ?? 2026);
  const exit_year_offset   = Number(scenario.exit_year            ?? 10);
  const phase1_complete_yr = Number(scenario.phase1_complete_year ?? 3);

  const total_months   = exit_year_offset * 12;
  const cod_month      = phase1_complete_yr * 12;  // e.g. 36 for year 3

  // Sequential / overlapping anchors
  const permits_start   = 0;
  const permits_dur     = Math.min(9, cod_month - 3);  // 0-9

  const grid_start      = 6;                            // overlap with permits
  const grid_dur        = Math.min(18, cod_month - grid_start - 2); // 6-24

  const epc_start       = 12;                           // construction starts
  const epc_dur         = Math.max(1, cod_month - epc_start);

  const cod_start_m     = cod_month;
  const cod_dur         = 2;                            // milestone window

  const ramp_start      = cod_month + cod_dur;
  const ramp_dur        = Math.max(1, total_months - ramp_start);

  const phases = [
    {
      id:              'permits',
      label:           'Permits & Planning',
      start_month:     permits_start,
      duration_months: permits_dur,
      gating_events:   ['Environmental clearance', 'Grid connection agreement'],
    },
    {
      id:              'grid',
      label:           'Grid Infrastructure',
      start_month:     grid_start,
      duration_months: grid_dur,
      gating_events:   ['Substation design freeze', 'Utility contract execution'],
    },
    {
      id:              'epc',
      label:           'EPC / Construction',
      start_month:     epc_start,
      duration_months: epc_dur,
      gating_events:   ['Foundation pour', 'Steel erection', 'MEP rough-in'],
    },
    {
      id:              'cod',
      label:           `COD Phase 1 (${start_year + phase1_complete_yr})`,
      start_month:     cod_start_m,
      duration_months: cod_dur,
      gating_events:   ['OFFTAKE activation', 'First revenue MW'],
    },
    {
      id:              'ramp',
      label:           'Ramp & Expansion',
      start_month:     ramp_start,
      duration_months: ramp_dur,
      gating_events:   ['Phase 2 capex decision', 'Exit / recapitalisation'],
    },
  ].filter(p => p.duration_months > 0);

  const summary = `${total_months} mo total · ${phases.length} phases · COD Y${phase1_complete_yr}`;

  return { type: 'gantt_phases', summary, total_months, phases };
}

module.exports = { build2DDiagramSpec, buildTopologySpec, buildDeploymentPhaseSpec };
