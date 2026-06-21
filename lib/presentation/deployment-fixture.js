/**
 * deployment-fixture.js — Snapshot ÉDITABLE de la projection servie à
 * /presentation/deployment (DeploymentSimP2).
 *
 * POURQUOI un fixture plutôt que le live :
 *   La page de présentation doit être stable et complète pour itérer le design
 *   librement (pas de fetch, pas de champ `—` qui clignote). Ces chiffres sont
 *   un VRAI run du moteur financier (POST /api/admin/hearst/simulate), pas des
 *   valeurs inventées — voir _meta.source. Tu peux ÉDITER n'importe quelle
 *   valeur ci-dessous à la main pour le rendu (c'est le but).
 *
 * SCÉNARIO FIGÉ : "Powered Shell phasé, hyperscale Qatar" (100 MW, archétype B).
 *   Vérifié cohérent vs la data sourcée : IRR 10.5% > WACC 10%, NPV positif,
 *   DSCR 1.46 (bankable), MOIC 2.33x sur 8 ans, J-curve propre. confidence 100.
 *
 * NOTE — 2 champs ajoutés À LA MAIN (l'API /simulate ne les accepte pas dans
 *   scenario_overrides) : `site_readiness` et `cod_offset_months`. Sur un run
 *   live brut ils valent null/0 ; ici on pose les valeurs réalistes du cas
 *   powered_shell (constantes SITE_READINESS de lib/hearst-constants.js).
 *
 * Pour re-tirer ce run depuis l'engine, voir _meta.rerun.
 */

export const DEPLOYMENT_FIXTURE = {
  _meta: {
    label: 'Powered Shell phasé — hyperscale Qatar',
    source: 'POST /api/admin/hearst/simulate (run live vérifié, 2026-06-21)',
    confidence_score: 100,
    warnings: [
      'CAPEX RECONCILIATION — bottom-up $6.71M/MW vs benchmark $8.85M/MW (-24%). Attendu pour un powered shell (ni MEP ni cooling).',
    ],
    rerun: {
      input_mode: 'mw_first',
      input_value: { total_mw: 100 },
      archetype_id: 'powered_shell',
      geography: 'qatar',
      scenario_overrides: {
        phase1_complete_year: 2, phase2_complete_year: 4, phase3_complete_year: 6,
        phase1_mw: 40, phase2_mw: 30, phase3_mw: 30,
        exit_multiple: 18, exit_year: 8,
        debt_pct: 40, debt_interest_rate: 6.5, debt_term_years: 12,
        start_year: 2026, capex_land_per_mw: 500000,
        target_occupancy_pct: 90, annual_escalation_pct: 3,
        price_hyperscale_kw_month: 125,
      },
    },
  },

  scenario: {
    total_mw: 100,
    debt_pct: 40,
    debt_interest_rate: 5, // 6.5 base − 150 bps archétype powered_shell
    phase1_mw: 40, phase2_mw: 30, phase3_mw: 30,
    phase1_complete_year: 2, phase2_complete_year: 4, phase3_complete_year: 6,
    exit_multiple: 18,
    exit_year: 8,
    start_year: 2026,
    pue: 1.45,
    electricity_price_mwh: 0, // NNN : le locataire paie l'électricité
    target_occupancy_pct: 90,
    site_readiness: 'powered_shell', // ajouté à la main (non injectable via API)
    cod_offset_months: 9, // ajouté à la main (cf. SITE_READINESS.powered_shell)
  },

  projection: {
    irr: 0.1049682407365663,
    irr_post_tax: 0.1047, // amortissement 15 ans → taxable_income positif dès ~y10 (léger décrochage vs pré-tax)
    npv: 15959962.246213634,
    moic: 2.33,
    payback_years: null, // structurel : l'equity ne revient que via l'exit (TV)
    dscr_stabilized: 1.46,
    total_capex: 671000000,
    equity_invested: 402600000,
    stabilized_ebitda: 48202616,
    terminal_value: 997194028,
    cod_offset_months: 9, // aligné sur scenario (ci-dessus)
    construction_years: 0,
    years: [
      { year: 1,  calendar_year: 2026, mw_live: 20,  occupancy_pct: 25, revenue: 2475000,  ebitda: 2475000,  free_cash_flow: -10994500, cumulative_fcf: -413594500, dscr: 0.18 },
      { year: 2,  calendar_year: 2027, mw_live: 40,  occupancy_pct: 45, revenue: 9177300,  ebitda: 9177300,  free_cash_flow: -23318624, cumulative_fcf: -436913124, dscr: 0.28 },
      { year: 3,  calendar_year: 2028, mw_live: 55,  occupancy_pct: 60, revenue: 17329801, ebitda: 17329801, free_cash_flow: -15329172, cumulative_fcf: -452242296, dscr: 0.53 },
      { year: 4,  calendar_year: 2029, mw_live: 70,  occupancy_pct: 70, revenue: 26504093, ebitda: 26504093, free_cash_flow: -6338366,  cumulative_fcf: -458580663, dscr: 0.80 },
      { year: 5,  calendar_year: 2030, mw_live: 85,  occupancy_pct: 78, revenue: 36937510, ebitda: 36937510, free_cash_flow: 3886382,   cumulative_fcf: -454694280, dscr: 1.12 },
      { year: 6,  calendar_year: 2031, mw_live: 100, occupancy_pct: 84, revenue: 48202616, ebitda: 48202616, free_cash_flow: 14926185,  cumulative_fcf: -439768094, dscr: 1.46 },
      { year: 7,  calendar_year: 2032, mw_live: 100, occupancy_pct: 88, revenue: 52012918, ebitda: 52012918, free_cash_flow: 18660281,  cumulative_fcf: -421107812, dscr: 1.58 },
      { year: 8,  calendar_year: 2033, mw_live: 100, occupancy_pct: 91, revenue: 55399668, ebitda: 55399668, free_cash_flow: 21979296,  cumulative_fcf: 483487418,  dscr: 1.68 },
      { year: 9,  calendar_year: 2034, mw_live: 100, occupancy_pct: 93, revenue: 58315760, ebitda: 58315760, free_cash_flow: 24837067,  cumulative_fcf: 508324485,  dscr: 1.77 },
      { year: 10, calendar_year: 2035, mw_live: 100, occupancy_pct: 95, revenue: 61356958, ebitda: 61356958, free_cash_flow: 27817441,  cumulative_fcf: 536141927,  dscr: 1.86 },
    ],
  },

  waterfall: {
    summary: {
      total_equity: 402600000,
      total_debt: 268400000,
      pref_rate: 0.08,
      terminal_value: 997194028,
    },
  },

  archetype_outcome: {
    id: 'powered_shell',
    label: 'Shell + Long Lease',
    code: 'B',
    score: 87,
    scores: { brand: 5, bankability: 5, speed: 4, control: 4, margin: 3, exit: 5 },
  },
};

export default DEPLOYMENT_FIXTURE;
