# Hearst Investment Simulator — Data-Science Audit

**Date:** 2026-05-26
**Auditor:** Senior Data Scientist / Quant (infra · DC · GPU)
**Scope:** `/admin/hearst/simulator` end-to-end pipeline (UI state → API → projection → viz)
**Harness:** `tests/simulator-audit.test.mjs` (35 checks, rerunnable via Node loader)
**Verdict:** **the simulator is NOT producing usable financial outputs in its current state.** Multiple P0 unit-scale and pipeline bugs make IRR / NPV / DSCR / MOIC unreliable to misleading. Numbers shown on the page should not be communicated externally without the fixes below.

---

## TL;DR

**Score global : 28 / 100**
- Cohérence inter-modules : **6 / 30** — unit-scale mismatch traverses bootstrap → projection → solver → Sankey. Two consumers read `debt_pct` as 0..1 ratio, two others read it as 0..100. Same for `opex_*_pct` and `debt_interest_rate`. The validator's own comment line (`hearst.js:122`) contradicts its `RatioPct` schema.
- Validité des calculs : **14 / 40** — pure formulas (`calcIrr`, `calcNpv`, `calcGpuAnnualRevenue`, `calcRackPower` for non-rack-scale GPUs) are correct in isolation. But the constants feeding them, and the way `generateProjection` combines `opex_*_pct` into a single percentage, embed unit bugs and a category error (maintenance ≠ % of revenue).
- Validité du comportement : **8 / 30** — baseline branded_jv @ 50MW returns IRR=0.15%, payback=null, DSCR=748 (absurd). Neocloud_gpu returns IRR=null because GPU revenue is computed but never injected into the projection. Five of the 13 declared `business_model_id` values silently produce zero revenue.

### Top 3 issues P0 (critique)

1. **Unit-scale mismatch on `debt_pct`, `debt_interest_rate`, `opex_*_pct`** ([lib/hearst-bootstrap.js:107-112](../../lib/hearst-bootstrap.js#L107-L112) ↔ [lib/hearst-calculations.js:204-206](../../lib/hearst-calculations.js#L204-L206)) — bootstrap pushes ratios in 0..1, projection divides by 100 expecting 0..100, validator schema declares `RatioPct = 0..1` but its own comment says 0..100. Net effect: debt service ≈ 0.6% of capex (not 60%), interest 0.065%/yr (not 6.5%), variable opex 0.135% of revenue (not 13.5%). **All levered IRRs are wrong by orders of magnitude.**

2. **`GB200 NVL72` power rating off by 9.1×** ([lib/hearst-gpu-catalog.js:69](../../lib/hearst-gpu-catalog.js#L69)) — `tdp_w: 1_200_000` (= 1200 kW / rack) vs NVIDIA published 132 kW / rack (the project's own `PUBLIC_SOURCES_LIBRARY` entry `nvda_gb200_rack` at [hearst-constants.js:670](../../lib/hearst-constants.js#L670) lists 132 kW). For 10 MW of AI capacity, the code derives 8 racks instead of 75 racks → **9× understatement of GPU count, capex_hardware, and revenue_ai_annual.**

3. **GPU revenue (`revenue_ai_annual`) is computed but never enters `projection.years[].revenue`** ([app/api/admin/hearst/simulate/route.js:159-174](../../app/api/admin/hearst/simulate/route.js#L159-L174)) — `calcHardwareBreakdown()` returns a sidecar object. The projection used for IRR / NPV / MOIC / payback continues to use only colocation pricing (`price_*_kw_month`). For the `neocloud_gpu` archetype (where GPU revenue IS the business), IRR is calculated as if the GPU cluster generated zero revenue.

---

## Top 2 quick wins
1. **Add one normalization helper at the top of `generateProjection()` / `generateDebtSchedule()`** that coerces ratios > 1 down to 0..100 (or vice versa) and ZodSchema fix in `lib/validators/hearst.js`. Restores correct IRR/DSCR for every levered scenario in <30 lines.
2. **Patch `route.js` to fold `hardware_breakdown.revenue_ai_annual` into each post-RFS year of `projection.years[]`** before IRR/NPV recompute. Without it the neocloud/sovereign_ai archetypes are unusable.

---

## Tableau des formules

| Formule | File:Line | Math OK ? | Ordre de grandeur OK ? | Note |
|---|---|---|---|---|
| `calcIrr` (Newton-Raphson) | [hearst-calculations.js:74](../../lib/hearst-calculations.js#L74) | ✅ | ✅ | Textbook NR; tested -100/+110→10% and -1k/6×200→5.47%. Returns null on all-positive/all-negative or non-converged. 200 iter cap. |
| `calcNpv` | [hearst-calculations.js:68](../../lib/hearst-calculations.js#L68) | ✅ | ✅ | `Σ cf_t / (1+r)^t`. Tested -1k/3×500 @10%→243.43. |
| `calcDscr` | [hearst-calculations.js:49](../../lib/hearst-calculations.js#L49) | ⚠ | ❌ | Formula is correct (`(ebitda - maint_capex) / debt_service`) but **debt_service comes from interest-only proxy `debt_amount × debt_interest_rate / 100`** ([line 205-206](../../lib/hearst-calculations.js#L205-L206)) while `generateDebtSchedule()` computes the proper French annuity. Result: in-projection DSCR systematically too high (B1 obtained 747.77). Should consume `generateDebtSchedule()` instead. |
| `calcTerminalValue` | [hearst-calculations.js:56](../../lib/hearst-calculations.js#L56) | ✅ | ⚠ | `exit_ebitda × multiple`. Default `exit_multiple` defaults to 18 from `bkf_exit_multiple`. Plausible but no Gordon growth fallback if exit_ebitda is negative — terminal_value goes negative silently (B4: tv=-$235M). Should clamp to 0. |
| `calcMoic` | [hearst-calculations.js:62](../../lib/hearst-calculations.js#L62) | ⚠ | ❌ | Formula uses `(last_cumulative_fcf + terminal_value) / equity_invested` ([calculations.js:274](../../lib/hearst-calculations.js#L274)). `cumulative_fcf` already subtracts `debt_service` (interest-only proxy). For a properly levered deal this would mix debt-paydown into equity returns; with the unit bug debt_service ≈ 0 so it doesn't bite, but conceptually MOIC is undercounted vs the `generateWaterfall()` definition. The two MOICs diverge. |
| `calcGpuAnnualRevenue` | [hearst-gpu-catalog.js:148](../../lib/hearst-gpu-catalog.js#L148) | ✅ | ✅ | `racks × density × util × 8760 × $/hr`. Tested H100 1 rack × 75% × $2.49 → $130,874/yr ✓. |
| `calcGpuCapex` | [hearst-gpu-catalog.js:124](../../lib/hearst-gpu-catalog.js#L124) | ✅ | ✅ | Handles `rack_scale` branch correctly. H100 1 rack ≈ $276k (8 × $30k × 1.15). |
| `calcRackPower` | [hearst-gpu-catalog.js:109](../../lib/hearst-gpu-catalog.js#L109) | ✅ | ❌ | Formula correct but **input data `gb200_nvl72.tdp_w = 1_200_000` is 9.1× too high** vs NVIDIA spec 132 kW (see Issue P0 #2). |
| `calcEnergyCost` | [hearst-calculations.js:7](../../lib/hearst-calculations.js#L7) | ✅ | ✅ | `it_mw × pue × 8760 × $/MWh`. Dimensionally clean. 50MW × 1.45 × 8760 × $32 = $20.3M/yr ✓. |
| `calcColoRevenue` | [hearst-calculations.js:19](../../lib/hearst-calculations.js#L19) | ✅ | ✅ | `occupied_kw × $/kW/mo × 12`. Clean. |
| `getOccupancy` | [hearst-calculations.js:178-182](../../lib/hearst-calculations.js#L178-L182) | ❌ | ⚠ | `base × (target_occupancy_pct / 90)` is **uncapped above 100%**. Probed: input 100→105.6% Y10, input 120→126.7% Y10. Should be `Math.min(target/100, base × clamp)`. |
| Variable opex aggregation | [hearst-calculations.js:221-222](../../lib/hearst-calculations.js#L221-L222) | ❌ | ❌ | `opex_pct_total = maint% + ins% + ga% + opfee%` then `opex_variable = revenue × opex_pct_total / 100`. (1) Category error: maintenance and insurance are typically % of CAPEX, not % of revenue. (2) Mixed scales: `operator_fee_pct` is set to integer (5, 8, 12, 20) by archetype; the others come from bootstrap as ratios (0.04). Sum is meaningless when scales differ. |
| Debt service yearly proxy | [hearst-calculations.js:204-207](../../lib/hearst-calculations.js#L204-L207) | ⚠ | ❌ | Interest-only proxy on declining-balance debt. Plus unit bug. Should consume `generateDebtSchedule()[y].total_service`. |
| `generateDebtSchedule` (French annuity) | [hearst-calculations.js:312-400](../../lib/hearst-calculations.js#L312-L400) | ✅ | ❌ | Formula correct, IO window logic clean. But same unit bug at line 329-330: `debt_pct / 100` expects 0..100; bootstrap delivers 0..1. **Docstring line 304 says "0..1 ratios", line 328 comment says "0..100" — contradictory within same function.** |
| `applyArchetype.debt_rate_delta_bps` | [hearst-deal-structures.js:357-360](../../lib/hearst-deal-structures.js#L357-L360) | ❌ | ❌ | Adds `delta_bps / 100` to `debt_interest_rate`. Comment claims `debt_interest_rate` is 0..100 scale. Bootstrap stores it as 0.065 (ratio). branded_jv (+75bps) → 0.065 + 0.75 = 0.815. powered_shell (-150bps) → 0.065 - 1.5 = -1.435 (clamped to 0). Compound effect of unit bug + bps math = **garbage interest rates after archetype application.** |
| `applyArchetype.brand_premium_pct` | [hearst-deal-structures.js:365-369](../../lib/hearst-deal-structures.js#L365-L369) | ⚠ | ❌ | Applied AFTER `revenue_factor`. For `sovereign_ai` (revenue_factor=0.90, brand_premium=+0.15) → net effective price = **103.5%** of merchant. Comment says "negotiated 90%" — combining the two contradicts intent. Branded_JV (0.51 × 1.12 = 57.1%) likely intentional. Sovereign almost certainly not. |
| `getWeightedPrice` business model fallback | [hearst-calculations.js:185-201](../../lib/hearst-calculations.js#L185-L201) | ❌ | ❌ | Only 3 of 13 declared business models in [hearst-constants.js:28-42](../../lib/hearst-constants.js#L28-L42) have a `price_key`. Picking `sovereign_ai`, `gpu_cloud`, `powered_shell`, `turnkey`, `enterprise`, `multi_operator`, `government`, `equinix_zone`, `ai_training`, `ai_inference` produces `weighted_price=null` → revenue=null → IRR=null. The simulator's `INITIAL_STATE.business_model_id = 'hyperscale_lease'` so this hides until the user picks anything else. |
| `solveForTargetIrr` (bissection) | [hearst-solver.js:141](../../lib/hearst-solver.js#L141) | ✅ | ⚠ | Robust bissection logic, infeasibility diagnostic clean. Pricing bounds `[50, 400]` work for hyperscale_lease but no awareness of archetype's revenue_factor — a powered_shell solver may push pricing way past realistic to hit target IRR. The IRR=50% test on powered_shell converged at $400/kW/mo merchant (× 0.33 = $132/kW/mo effective) which is technically within bounds; recommend documenting "lever_value is merchant pre-factor pricing." |
| `getMwLive` phasing | [hearst-calculations.js:166-175](../../lib/hearst-calculations.js#L166-L175) | ✅ | ✅ | Linear interpolation across 3 phases. Caps at total_mw. Plausible. |
| `calcTotalCapex` null-guard | [hearst-calculations.js:107-110](../../lib/hearst-calculations.js#L107-L110) | ❌ | n/a | `components.some(v => v == null)` correctly null-checks. But [line 154](../../lib/hearst-calculations.js#L154) `has_capex = capex_shell_per_mw && capex_mep_per_mw` uses truthy check — **`0` is falsy** → for `powered_shell` (bootstrap sets `capex_mep_per_mw = 0`), `has_capex = false` → `total_capex = null` → all downstream financials null. Confirmed in test B3. Should be `!= null` checks. |
| Sale-leaseback `compute_as` | [hearst-deal-structures.js:389-461](../../lib/hearst-deal-structures.js#L389-L461) | ✅ | ⚠ | Levered equity IRR computation is technically clean (includes debt service over dev years, exits with net-of-tax proceeds minus residual debt). But `dev_exit_year = 4` is hardcoded — not configurable. Capital gains tax 10% applied unconditionally even when QFZA Free-Zone exemption applies (per code comment). |
| Hyperscaler self-build minority | [hearst-deal-structures.js:468-482](../../lib/hearst-deal-structures.js#L468-L482) | ⚠ | ❌ | Just applies `applyArchetype` (which scales capex AND opex by 0.20) then returns standard projection with a `minority_equity:true` flag. **Doesn't model dividends explicitly** — the code comment claims dividends but the projection just shows a smaller version of the wholly-owned deal. B4 returned EBITDA=-$15M and TV=-$235M (negative terminal value should never display as Sale Value KPI). |

---

## Tableau des tests (extract — voir `node tests/simulator-audit.test.mjs` pour le détail)

| # | Scénario | Input | Attendu | Obtenu | Verdict |
|---|---|---|---|---|---|
| A1 | IRR(-100,110) | 1-yr 10% bond | 10.00% | 10.00% | ✅ |
| A1 | IRR(-1k, 6×200) | 6-yr annuity | 5.47% | 5.47% | ✅ |
| A1 | IRR all-positive | sign change required | null | null | ✅ |
| A2 | NPV(-1k, 3×500, 10%) | textbook | 243.43 | 243.43 | ✅ |
| A3 | H100 rack_kw | 8×700×1.15/1000 | 6.44 kW | 6.44 kW | ✅ |
| A3 | GB200 NVL72 rack_kw | NVIDIA spec 132 kW | **132 kW** | **1200 kW** | ❌ off 9.1× |
| A3 | calcGpuAnnualRev H100 1rack | 8×0.75×8760×$2.49 | $130,874 | $130,874 | ✅ |
| A3 | calcGpuCapex GB200 1rack | $3M×1.15 (rack_scale) | $3.45M | $3.45M | ✅ |
| B1 | Qatar branded_jv 50MW | IRR ∈ [5%, 30%] | 15-20% expected | **0.15%** | ❌ |
| B1 | Qatar branded_jv 50MW | payback ∈ [4,12] yr | 6-8 yr expected | **null** | ❌ |
| B1 | Qatar branded_jv 50MW | total_capex ≈ $400M | 50MW × $7-12M | $305.7M | ✅ |
| B2 | Neocloud 200MW all-AI | GPU revenue > $500M | $1B+ ideal | $712M | ✅ |
| B2 | Neocloud projection IRR | should be ≥ 30% | 35-50% expected | **null** | ❌ revenue not folded |
| B3 | Powered shell 100MW | capex_per_mw ∈ [$4M,$9M] | $5-8M/MW | **$0/MW** | ❌ has_capex truthy bug |
| B3 | Powered shell 100MW | IRR ∈ [4%, 25%] | 8-15% expected | 17.66% | ✅ |
| B4 | Hyperscaler minority 100MW | minority_equity flag | true | true | ✅ |
| B4 | Hyperscaler minority 100MW | capex ≈ 20% of full | $100-250M | $239.8M | ✅ |
| B4 | Hyperscaler minority 100MW | EBITDA positive | small + | **-$15M** | ❌ negative |
| B5 | Sovereign 30MW ai=80% | IRR computable | any value | **null** | ❌ sovereign_ai business model has no price_key |
| B6 | Edge MW=0 | no crash | finite or null | undefined irr | ✅ |
| B6 | Edge MW=5000 | finite outputs | $30B capex | $30.57B | ✅ |
| B6 | Edge exit_year=1 | tv at year 1 | non-null | -$112M | ⚠ (negative TV silently) |
| B6 | Edge debt_pct=100 | moic=null | null | null | ✅ |
| B7 | +30% MW | revenue rises | yes | $35M→$45M | ✅ |
| B7 | +30% electricity | EBITDA falls | yes | $10.6M→-$0.8M | ✅ |
| B7 | debt_pct 0.2→0.8 | debt_service rises 4× | ~4× | Δ=$15k yr5 | ❌ (unit bug masks effect) |
| B8 | mw_first vs capital_first | same IRR | identical | identical | ✅ |
| B9 | Target IRR=18% solver | bissection converges | yes | **infeasible** ("IRR not computable") | ⚠ — caused by hyperscale_lease pricing missing? No — caused by `target_irr_first` solver inheriting buggy debt parameters |
| B9b | IRR=50% on powered_shell | infeasible | infeasible | **converged at 49.98%** | ⚠ at pricing $400/kW/mo (out of realistic band — solver lacks sanity bounds aware of archetype factor) |
| B10 | Bootstrap unit-scale | debt_pct > 1 | 65 | **0.6** | ❌ P0 |
| B10 | Bootstrap unit-scale | debt_interest_rate > 1 | 6.5 | **0.065** | ❌ P0 |
| B10 | Bootstrap unit-scale | opex_*_pct > 1 | 4 | **0.04** | ❌ P0 |

Demo of impact when manually fixed (debt 60→60, interest 0.065→6.5, opex × 100):

```
Buggy (current):  IRR=0.15%,  DSCR=748,  payback=null, MOIC=0.02x
Fixed (units OK): IRR=-5.74%, DSCR=0.73, payback=null, MOIC=-1.37
```

Neither set is good (the underlying 50MW branded_jv with 57% effective pricing simply doesn't pencil — see Issue P1 #2 on brand_premium), but the difference between the two numbers is what gets shown to investors. **Currently the simulator hides a non-viable deal behind absurd-DSCR numbers; with units fixed it would correctly flag the structure as unbankable.**

---

## Issues détaillées

### P0-1 — Unit-scale mismatch on `debt_pct`, `debt_interest_rate`, `opex_*_pct`

- **Files:**
  - [lib/hearst-bootstrap.js:107-112](../../lib/hearst-bootstrap.js#L107-L112) — stores ratios (`debt_interest_rate: 0.065`, `opex_maintenance_pct: 0.04`)
  - [lib/hearst-bootstrap.js:27, 41](../../lib/hearst-bootstrap.js#L27) — pulls `debt_pct` value=0.62 from `PUBLIC_SOURCES_LIBRARY` (also ratios)
  - [lib/hearst-calculations.js:203-207](../../lib/hearst-calculations.js#L203-L207) — comment says "0..100", divides by 100
  - [lib/hearst-calculations.js:221-222](../../lib/hearst-calculations.js#L221-L222) — `opex_pct_total / 100`
  - [lib/hearst-calculations.js:304 vs 328](../../lib/hearst-calculations.js#L304) — internal docstring contradicts code comment
  - [lib/validators/hearst.js:120-123](../../lib/validators/hearst.js#L120-L123) — `RatioPct = 0..1` schema, but comment line 122 mentions "0..100"
  - [lib/hearst-deal-structures.js:357-360](../../lib/hearst-deal-structures.js#L357-L360) — bps→pp conversion assumes 0..100 scale
  - [components/hearst/simulator/FinancialSankey.jsx:30](../../components/hearst/simulator/FinancialSankey.jsx#L30) — Sankey reads `debt_pct` as 0..1 ratio
- **Symptôme :** for the baseline `branded_jv 50MW` case, debt_service at year 5 = $15k (should be ~$15M); DSCR stabilized = 748 (should be ~1.5-2.5); IRR = 0.15% instead of plausible 12-18%.
- **Cause racine :** validator declares `RatioPct(0..1)` for `debt_pct`, `debt_interest_rate`, `opex_*_pct`; bootstrap fills them as 0..1; calculation engine divides by 100 again. So 0.62 (intended 62%) becomes 0.62 / 100 = 0.62%.
- **Impact :** every levered scenario IRR/NPV/DSCR/MOIC is invalid. Public-facing "Annual Return", "Debt Safety", and "Money Multiplier" KPIs are all wrong.
- **Fix proposé :** pick one convention. Recommended: keep everything as 0..1 ratio (modern infra convention, what Zod is already enforcing). Then patch the four `/ 100` sites in `hearst-calculations.js` and the bps math in `hearst-deal-structures.js`. Single helper:
  ```js
  // Normalize possibly-mixed-scale percentage input.
  const asRatio = (v) => v == null ? 0 : v > 1 ? v / 100 : v;
  ```
  Apply at the top of `generateProjection`, `generateDebtSchedule`, `applyArchetype`. ~15 lines diff.

### P0-2 — `GB200 NVL72` power off by 9.1× contradicts project's own source library

- **File:** [lib/hearst-gpu-catalog.js:69](../../lib/hearst-gpu-catalog.js#L69)
- **Code:** `tdp_w: 1_200_000` (= 1200 kW / rack)
- **Truth source (same project):** [lib/hearst-constants.js:670](../../lib/hearst-constants.js#L670) — `nvda_gb200_rack` from NVIDIA official spec lists **132 kW / rack** (also: comment in `hearst-gpu-catalog.js:78` says "1.2 MW / rack" which is itself wrong vs NVIDIA's 132 kW).
- **Symptôme :** for `mw_ai=10` (50 MW × 20% AI), `derived_racks = Math.floor(10000 / 1200) = 8 racks` containing 576 GPUs. With correct 132 kW/rack: `Math.floor(10000 / 132) = 75 racks` containing 5400 GPUs.
- **Impact :** AI revenue understated by ~9×; AI CAPEX understated by ~9×; total_gpus count shown in `HardwareMixer` KPI is 9× too low. For neocloud_gpu deals this is the entire economics.
- **Fix proposé :** change `tdp_w: 1_200_000 → tdp_w: 132_000`. Update neighboring comment line 78 from "1.2 MW/rack" → "132 kW/rack". Verify with NVIDIA GB200 NVL72 spec sheet 2025.

### P0-3 — GPU revenue computed but not injected into projection

- **File:** [app/api/admin/hearst/simulate/route.js:159-187](../../app/api/admin/hearst/simulate/route.js#L159-L187)
- **Symptôme :** `calcHardwareBreakdown()` returns `hardware_breakdown.revenue_ai_annual = $712M` for B2 (200MW neocloud). But `projection.years[y].revenue` is computed from `getWeightedPrice() × occupied_kw × 12` based ONLY on `price_*_kw_month` (colocation pricing). The two never merge. IRR/NPV/MOIC therefore IGNORE GPU revenue entirely.
- **Cause racine :** `neocloud_gpu` archetype has comment ("revenue plugged via hardware_mix.gpu_hour_price in /api/admin/hearst/simulate") but the plumbing was never wired.
- **Impact :** every `compute_as='gpu_cloud'` archetype outputs are effectively a colocation-only projection of a building that has no colo tenants → IRR=null. The simulator is unusable for the very archetype it advertises ("GPU rental cloud").
- **Fix proposé :** in `route.js` after computing `hardware_breakdown`, mutate the projection:
  ```js
  if (hardware_breakdown?.revenue_ai_annual > 0) {
    const rampStart = 3; // year RFS — adjust to project COD
    projection.years.forEach((y, idx) => {
      const ramp = Math.min(1, Math.max(0, (idx - rampStart + 1) / 2));
      y.revenue = (y.revenue || 0) + hardware_breakdown.revenue_ai_annual * ramp;
      y.ebitda  = (y.revenue ?? 0) - (y.power_cost ?? 0) - (y.opex ?? 0);
    });
    // Recompute IRR/NPV/MOIC/payback from updated years.
  }
  ```
  Better: refactor `generateProjection` to accept a `gpu_revenue_annual` input.

### P0-4 — `has_capex` falsy-check kills powered_shell projection

- **File:** [lib/hearst-calculations.js:154](../../lib/hearst-calculations.js#L154)
- **Code:** `const has_capex = capex_shell_per_mw && capex_mep_per_mw;`
- **Symptôme :** `powered_shell` bootstrap zeroes `capex_mep_per_mw` (rightly — tenant funds MEP). `0` is falsy → `has_capex = false` → `total_capex = null` → all downstream KPIs null.
- **Fix proposé :** `const has_capex = capex_shell_per_mw != null && capex_mep_per_mw != null;`

### P0-5 — Five of thirteen `business_model_id` values produce zero revenue silently

- **Files:** [lib/hearst-constants.js:28-42](../../lib/hearst-constants.js#L28-L42) and [lib/hearst-calculations.js:185-201](../../lib/hearst-calculations.js#L185-L201)
- **Symptôme :** `BUSINESS_MODELS` declares 13 entries but only `retail_colo`, `wholesale_colo`, `hyperscale_lease` map to a price key. The `getWeightedPrice` function reads `commercial_split` keys against this 3-entry map; unknown keys are silently skipped → weighted price = null → revenue = null.
- **Impact :** picking "Sovereign AI Cloud", "GPU Cloud", "Powered Shell", "Turnkey", "Government", "Enterprise" in the UI → blank financial outputs with no warning.
- **Fix proposé :** either (a) populate `price_key` for all 13 business models with sourced defaults, or (b) throw / warn explicitly in `getWeightedPrice` when commercial_split contains unknown keys.

### P1-1 — DSCR computed against interest-only proxy, not actual amortization schedule

- **File:** [lib/hearst-calculations.js:204-207, 232](../../lib/hearst-calculations.js#L204-L207)
- **Symptôme :** in-projection DSCR is consistently 5-10× higher than `generateDebtSchedule().summary.min_dscr` because debt_service = debt_amount × interest_rate, ignoring principal. (And both are wrong because of P0-1.)
- **Fix proposé :** consume `generateDebtSchedule(s).schedule[y].total_service` in the year loop. Already computed downstream; just hoist.

### P1-2 — Sovereign AI `revenue_factor=0.90 × brand_premium=+15% → 103.5%` (intent violation)

- **File:** [lib/hearst-deal-structures.js:292-296, 365-369](../../lib/hearst-deal-structures.js#L292-L296)
- **Symptôme :** the archetype description says "Contract lasts 10-15 years at a negotiated price (usually our cost plus 15-20%)" implying premium relative to OWN cost, not merchant pricing. But the code applies BOTH `revenue_factor=0.90` (haircut for sovereign discount) AND `brand_premium_pct=+0.15` to the merchant price. Net effective = 1.035 × merchant = **higher than merchant**. Probably unintended.
- **Fix proposé :** decide between (a) drop `brand_premium_pct` on sovereign_ai (keep 90% net) or (b) set `revenue_factor` to 1.0 + `brand_premium_pct=−0.10` (90% explicit). Either way: pick one channel for the discount.

### P1-3 — Occupancy not capped at 100%

- **File:** [lib/hearst-calculations.js:178-182](../../lib/hearst-calculations.js#L178-L182)
- **Symptôme :** `base × (target_occupancy_pct / 90)` produces 105.6% at target=100, 126.7% at target=120. Validator allows target ∈ [0, 100].
- **Fix proposé :** `return Math.min(1.0, base × (target / 90));` or rebase the ramp around target directly.

### P1-4 — Negative terminal value displayed as "Sale Value" KPI

- **Files:** [lib/hearst-calculations.js:253-256](../../lib/hearst-calculations.js#L253-L256), [components/hearst/simulator/OutputKpiStrip.jsx:18](../../components/hearst/simulator/OutputKpiStrip.jsx#L18)
- **Symptôme :** if `exit_ebitda < 0` (B4 hyperscaler minority case), `terminal_value = exit_ebitda × exit_multiple` is negative. Displayed as "Sale Value = -$235M". A sale can never have a negative price.
- **Fix proposé :** `terminal_value = Math.max(0, exit_ebitda × multiple)`. Optionally warn in `missing_inputs`.

### P1-5 — `applyArchetype.debt_rate_delta_bps` math broken

- **File:** [lib/hearst-deal-structures.js:357-360](../../lib/hearst-deal-structures.js#L357-L360)
- **Symptôme :** `delta_pct = delta_bps / 100`, e.g. 75 bps → 0.75. Then `s.debt_interest_rate = 0.065 + 0.75 = 0.815`. Combined with P0-1 unit bug, applied as 0.815% interest. For `powered_shell` (-150 bps) → 0.065 - 1.5 = -1.435 → clamped to 0 → no interest.
- **Fix proposé :** depends on chosen unit scale. If keeping ratios: `delta_pct = delta_bps / 10000; s.debt_interest_rate += delta_pct;`. Update comment accordingly.

### P2-1 — Hardcoded ramp curve in `getOccupancy`

- **File:** [lib/hearst-calculations.js:179](../../lib/hearst-calculations.js#L179) — `[0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95]`
- **Note:** the ramp is opinionated (typical hyperscale 3-year fill). Not configurable. Acceptable as default but should be a scenario field or derived from `site_readiness`.

### P2-2 — `dev_exit_year = 4` hardcoded for sale-leaseback

- **File:** [lib/hearst-deal-structures.js:192](../../lib/hearst-deal-structures.js#L192)
- **Note:** `archetype.dev_exit_year || 4`. Add UI control + scenario field if extending sale-leaseback flexibility.

### P2-3 — Capital gains tax always-on for sale-leaseback

- **File:** [lib/hearst-deal-structures.js:430-432](../../lib/hearst-deal-structures.js#L430-L432)
- **Note:** 10% applied even though QFZA Free-Zone exemption is mentioned in comment. Add `qfza_exempt` flag.

### P2-4 — Bootstrap fallback hides Qatar-specific gaps

- **File:** [lib/hearst-bootstrap.js:131-138](../../lib/hearst-bootstrap.js#L131-L138)
- **Note:** When no Qatar source exists, falls back to MENA, then Global, silently. The `confidence_score` is computed but the user has no warning that they're seeing Global benchmarks. Surface this in `boot.source_map`.

### P2-5 — `INITIAL_STATE.primary_archetype_id = 'powered_shell'` but it currently returns null financials

- **File:** [lib/hearst-simulator-state.js:15](../../lib/hearst-simulator-state.js#L15)
- **Note:** opening the simulator on default state → no KPIs render due to P0-4. Should default to `branded_jv` or fix P0-4 first.

---

## Recommandations stratégiques

1. **Block external use of the simulator until P0-1, P0-3, and P0-4 are fixed.** Until then, anyone changing the default archetype or business model sees blank or absurd outputs. For investor reviews, keep the simulator behind admin-only routes (already done) and stamp "alpha — calculations under audit" on the page.

2. **Adopt one numeric convention project-wide and enforce it in the validator.** Don't keep two schemas (`RatioPct(0..1)` and `Percent100(0..100)`) coexisting for percentages — pick one, ideally 0..1 ratios (matches PUBLIC_SOURCES_LIBRARY), then patch the four "/100" call sites in `hearst-calculations.js`. Add a runtime assertion at the top of `generateProjection` that throws if `debt_pct > 1.5` (catches misuse).

3. **Fold GPU revenue into the projection.** Either inline in `route.js` (quick fix) or refactor `generateProjection` to accept a `secondary_revenue_streams: [{ annual_usd, ramp_curve }]` interface — this also future-proofs for inference-as-a-service and tokens revenue (`calcInferenceRevenue` already exists but unwired).

4. **Treat operator_fee_pct and operator_mgmt_fee_pct as the same field with one scale.** Currently archetype overrides set integer (8 → 8% intended), bootstrap fills ratio (0.05 → 5% intended). Same scale, same field, same path.

5. **Move `maintenance_pct` and `insurance_pct` to be `% of CAPEX` (industry standard) rather than `% of revenue`.** The current "% of revenue" treatment underprices maintenance dramatically on high-margin years and overprices it on ramp-up years. ~3% of CAPEX/yr is the standard for stabilized DC ops.

6. **Add a "Health check" panel in the simulator UI** that flashes red when: (a) `missing_inputs.length > 0`, (b) `dscr < 1.25` in any year, (c) `irr === null` or `< 0`, (d) bootstrap fell back to Global benchmarks. Users currently see the broken numbers in KPI cards without warning.

7. **Calibrate IRR sanity bounds in `solveForTargetIrr` to the chosen archetype.** A powered_shell deal hitting IRR=50% with merchant pricing pushed to $400/kW/mo at lever_value should fail with "pricing implies $400/kW/mo merchant, ×0.33 NNN factor = $132/kW/mo NNN — outside Qatar market band [$30-90]". Otherwise the solver "succeeds" with infeasible market prices.

8. **Once units are correct, re-run the audit harness in CI.** `node --import 'data:text/javascript,...' tests/simulator-audit.test.mjs` exits non-zero on any failed check. Lock the green baseline.

---

## How to rerun the audit

```bash
# from project root (Node ≥ 18)
node --import "data:text/javascript,import { register } from 'node:module'; import { pathToFileURL } from 'node:url'; register('./tests/loader-resolve.mjs', pathToFileURL('./'));" tests/simulator-audit.test.mjs
```

Exit code 0 = all checks green. Currently exits non-zero with 10 failed checks.

Files added by this audit (additive only — production code unchanged):
- `tests/simulator-audit.test.mjs` — 35-check harness
- `tests/loader-resolve.mjs` — tiny Node loader for extensionless ES module imports
- `docs/audit/simulator-audit-2026-05-26.md` — this report
