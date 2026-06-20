# Qatar 50MW Opus Test — AI-generated draft

_Generated 2026-05-29T08:48:32.389Z · model claude-opus-4-8 · v1 · stakeholder investor · region qatar_
_Data as of 2025-04-30 · freshness EXPIRED_

**Confidence: HIGH** (14 sourced / 14 total) — computed server-side

## Executive Summary
**50 MW Qatar powered-shell: underwriteable at 18.2% levered IRR / 5.85x MOIC if anchor LOI + KAHRAMAA MOU + transformer LoI precede financing close**
- Base case returns hold: IRR 18.2%, MOIC 5.85x, NPV $607M, DSCR 9.10x [ASSUMED projection inputs] — DSCR is implausibly high for 60% leverage and signals the model may be under-counting debt service or over-counting NNN rent; re-test before IC.
- CAPEX $440M = $8.8M/MW, consistent with T&T MENA shell $4.4M + MEP $3.8M + ~$1.2M substation (tt_shell_mena_2024, tt_mep_mena_2024) before the $1.5M/MW Qatar dry-cooling premium — confirm cooling premium is inside the $440M, not on top.
- Pricing of $120/kW/mo sits between DLR wholesale $95 (dlr_wholesale_price_2024) and Equinix retail $165 (eqx_retail_price_2024); defensible with Qatar +10-15% scarcity premium but only with a signed anchor.
- Critical path is electrical + grid, not construction: 22-mo transformer + 24-mo KAHRAMAA connection must run in parallel from T0 or energisation slips to 2029 (transformer_shortage_global, qatar_grid_connection_timeline).
- Lowest-friction capital is the QIA-Brookfield $20B AI vehicle (brookfield_qia_partnership_unlock); equity split Hearst 40 / Brookfield 30 / Qatar 30 already aligns the financing channel.

## Strategic Context
Qatar is an emerging DC market (absorption ~80 MW/yr, 600 MW realistic pipeline to 2030) where supply is gated by power and permits, not demand — keeping 2027 oversupply risk low and the +10-15% scarcity premium intact. The structural unlock is the QIA-Brookfield $20B AI partnership (May 2024), which makes a QFZA-domiciled, anchor-backed powered shell financeable at 60-65% LTV without a 6-12 month general capital raise. QFZA delivers a 0% corporate tax / 100% foreign ownership / 6-month permit regime (qfza_tax_regime, mena_permit_timeline_free_zone) versus 18-24 months elsewhere. The binding constraint is electrical procurement: 22-month transformers and a 24-month KAHRAMAA connection define the timeline, not the building. For an investor, the thesis is a power-and-permit-arbitrage NNN asset with sovereign-anchored absorption — attractive returns conditional on disciplined sequencing.

## Key Financial Metrics
Capex per MW is well-anchored to T&T MENA tier-2 data. The return stack (IRR/MOIC/NPV/TV) is from the scenario projection and should be treated as MEDIUM-LOW until stabilized EBITDA is restored and DSCR re-derived — 9.10x DSCR is not consistent with 60% leverage at 6.5% and almost certainly overstates coverage. Pricing at $120/kW/mo is defensible inside the DLR-to-Equinix band with the Qatar scarcity premium.
- **Total CAPEX**: 440 $M ($8.8M/MW) (HIGH) · tt_shell_mena_2024 + tt_mep_mena_2024
- **Levered IRR**: 18.2 % (MEDIUM) · ASSUMED projection — sensitive to anchor LOI + rent escalation
- **MOIC**: 5.85 x (LOW) · ASSUMED projection — 5.85x at 18.2% IRR over 7yr implies aggressive TV; re-test
- **Payback**: 6.2 years (MEDIUM) · ASSUMED projection
- **DSCR**: 9.10 x (LOW) · ASSUMED projection — implausibly high for 60% debt @6.5%; likely model error
- **NPV**: 607 $M (LOW) · ASSUMED projection — discount rate undisclosed
- **Terminal Value (Yr7)**: 1180 $M (LOW) · ASSUMED projection — exit cap not disclosed; benchmark DLR ~6% (dlr_leverage_2024 entity)
- **Hyperscale rent**: 120 $/kW/mo (MEDIUM) · dlr_wholesale_price_2024 ($95) + eqx_retail_price_2024 ($165)
- **Target EBITDA margin (landlord)**: 55-65 % (MEDIUM) · eqx_ebitda_margin_2024 (47% full-stack; landlord higher)
- **Debt / leverage**: 60 % @ 6.5% (HIGH) · dlr_leverage_2024 (62% public REIT comp)

## Infrastructure Analysis
50 MW IT load at PUE 1.4 (air-cooled floor for Qatar; no year-round free-cooling window). Water stress at 4.7/5 forces closed-loop adiabatic + DLC hybrid from day one — wet-cooling will not clear KAHRAMAA environmental review post-2025, adding ~$1.5M/MW cooling premium (qatar_water_stress_premium). Powered-shell archetype means Hearst delivers shell + MEP + substation under NNN; tenant funds fit-out and owns GPUs, so this is a landlord/real-estate return, not a GPU-cloud return. Tier III (N+1) is the commercial sweet spot vs Tier IV given anchor SLAs. KAHRAMAA grid headroom (~8 GW) exists but a new 50 MW connection is a fixed 24-month process. PUE floor improves to ~1.2 only on liquid-cooled GPU halls.
- Choosing Tier III (N+1) over Tier IV (N+N) because anchor hyperscale/sovereign SLAs are met at 99.982% and COD lands 4-8 months sooner, accepting ~13 bps higher annual SLA-credit exposure if uptime dips.
- Choosing powered-shell NNN over neocloud GPU ownership because it removes GPU obsolescence and utilization risk (CoreWeave post-ramp 78% util, crwv_utilization_post_ramp), accepting lower revenue/MW (~$120/kW/mo vs GPU-hour upside).
- Choosing closed-loop adiabatic + DLC over wet-tower cooling because wet-cooling fails KAHRAMAA review, accepting +$1.5M/MW (~$75M on 50 MW) capex.
- Choosing air-cooled PUE 1.4 base over full-liquid PUE 1.2 because anchor may not be GPU-dense at COD, accepting higher opex/MWh until liquid retrofit ($750K/MW) is triggered by tenant demand.

## Market Benchmarking
- Digital Realty: Wholesale price = $95/kW/mo; 62% debt; 43% EBITDA margin (dlr_wholesale_price_2024, dlr_leverage_2024, dlr_ebitda_margin_2024)
- Equinix: Retail colo price / PUE / margin = $165/kW/mo; PUE 1.45; 47% EBITDA margin (eqx_retail_price_2024, eqx_pue_2024, eqx_ebitda_margin_2024)
- Khazna (GCC peer): Steady-state occupancy / anchor model = ~80% on hyperscale leases, sovereign backstop (G42/Microsoft) (comparables.khazna.profile)
- Brookfield (Hyperion JV): Mega-vehicle template / LTV = 80/20 JV, $27B; QIA $20B AI vehicle reference (brookfield_aum_2024, comparables.brookfield.profile)
- CoreWeave: GPU-cloud utilization / leverage = 78% post-ramp util; 4.5x net debt/EBITDA (crwv_utilization_post_ramp, crwv_leverage)

## Risks & Constraints
- 22-month transformer + 15-month MV switchgear lead times on critical path [HIGH] — Issue transformer LoI (Schneider/Siemens) + dual-source ABB/Hitachi before land/permit close; over-spec switchgear 20%. Adds ~3% capex, halves slip exposure.
- KAHRAMAA 50 MW connection fixed 24-month process; serial sequencing slips to 2029 [HIGH] — Submit KAHRAMAA application same day as QFZA permit; pre-application substation proximity study before site short-listing.
- Sovereign anchor likely >70% of Phase 1 revenue [HIGH] — Sign anchor LOI covering >=60% capacity before construction start; pre-agree Brookfield/Blackstone sale-leaseback exit to cap downside.
- Water stress 4.7/5 forces dry-cooling; wet designs fail KAHRAMAA review post-2025 [MEDIUM] — Default to closed-loop adiabatic + DLC; file water-use budget in permit application upfront. Budget +$1.5M/MW.
- KAHRAMAA monopoly tariff — no PPA arbitrage, 3-5%/yr administrative creep [MEDIUM] — Pass-through power via NNN structure so escalation is tenant-borne; model 4%/yr tariff creep in opex.

## Strategic Opportunities
- Finance via QIA-Brookfield $20B AI vehicle at 60-65% LTV — WHY: brookfield_qia_partnership_unlock — capital is explicitly designated for GCC AI DC and seeking deployment assets. ALTERNATIVE considered: general infra fund raise (adds 6-12 mo friction). RISK accepted: Brookfield re-underwrites complexity, so first pass must be plain-vanilla NNN. METRIC: IC approval within 3-6 months of data-room (QFZA entity + KAHRAMAA MOU + anchor LOI).
- Position as 18-month time-to-power advantage to hyperscaler procurement — WHY: hyperscaler_capex_acceleration ($210B/yr top-4 capex, 3% wholesale vacancy) + QFZA 6-mo permit. ALTERNATIVE: sovereign-only anchor (narrower demand). RISK accepted: hyperscaler may demand 15yr NNN with penalty clauses on COD slip. METRIC: signed LOI on >=60% capacity at >=$120/kW/mo before ground-break.
- Build 3% annual rent escalation into lease heads of terms — WHY: wholesale_rent_growth_momentum (12% YoY rent growth) — static rent leaves $1.5-2M/MW on table over 10yr. ALTERNATIVE: flat rent for anchor concession (simpler but value-leaking). RISK accepted: anchor may resist escalator, trading slight rent for term. METRIC: blended escalator >=3% in executed lease.
- Conditional build-to-suit with anchor funding 30-40% of build — WHY: gcc_oversupply_risk_2027 (25% oversupply probability without anchor) — BTS caps developer vacancy to residual speculative tranche. ALTERNATIVE: fully speculative shell (400-600bps IRR risk). RISK accepted: BTS narrows tenant flexibility and ties asset to one credit. METRIC: anchor capital contribution >=30% + 20yr NNN lock.

## Recommended Architecture
WHY: Powered-shell NNN at Tier III matches the financeable archetype for the QIA-Brookfield vehicle and the hyperscaler third-party relief-valve demand (hyperscaler_capex_acceleration), while closed-loop dry cooling is mandatory under Qatar water stress (qatar_water_stress_premium). ALTERNATIVE considered: neocloud GPU-ownership — rejected because it imports utilization risk (78% post-ramp, crwv_utilization_post_ramp) and GPU obsolescence onto a real-estate investor balance sheet. RISK accepted: Tier III (not IV) carries ~13 bps higher SLA-credit exposure and sovereign anchor >70% concentration. METRIC of success: DSCR > 1.4x sustained after Year 2 stabilization (NOT the reported 9.10x, which must be re-derived) and Phase 1 occupancy >=80% at COD.

## Commercialization Strategy

## Deployment Roadmap
- Pre-development: site, QFZA + KAHRAMAA filings, transformer LoI (0-6): QFZA permit filing (6-mo fast-track), KAHRAMAA grid application SAME DAY as QFZA, Transformer LoI issued (front-run 22-mo lead), MV switchgear LoI (15-mo lead), Anchor LOI >=60% capacity
- Financing close + EPC pre-award (6-12): QIA-Brookfield IC approval, KAHRAMAA utility MOU, EPC contract lock (3-6mo after anchor LOI), Data room complete
- Construction: shell + MEP + private substation (12-30): Civil works, Substation build 12-18mo, Transformer delivery (~22mo from LoI), DLC cooling plant install
- Grid energisation + commissioning (24-30): KAHRAMAA connection complete (~24mo from application), Switchgear energisation, Tier III validation
- COD + Phase 1 ramp (30-42): Anchor fit-out, 80% occupancy at COD, 90% by Yr2, Phase 2 gate: Phase 1 >=80%
- ⚠ Electrical procurement is the binding critical path: without transformer LoI in hand at T0, energisation slips to late 2027-2029 (transformer_shortage_global + qatar_grid_connection_timeline). Theoretically sound, but operationally unrealistic before 2028 COD if KAHRAMAA and QFZA are sequenced in series rather than parallel.
- ⚠ MV switchgear (15-mo) must be ordered alongside transformers or electrical energisation slips 3-6 months.
- ⚠ Reported DSCR of 9.10x is internally inconsistent with 60% leverage @6.5% and stabilized EBITDA reported N/A — underwriteable as a base case only once EBITDA is restored and coverage re-derived; financing close before that is not advisable.
- ⚠ Wet-cooling design will not clear KAHRAMAA environmental review post-2025 — closed-loop adiabatic + DLC mandatory, +$1.5M/MW; confirm this premium is inside the $440M CAPEX.

## Long-Term Strategic Value
Phase 1 (25-50 MW) establishes a QFZA-domiciled, sovereign-anchored NNN asset financeable through the QIA-Brookfield channel. Over a 7-year hold the asset compounds on 3% rent escalation and 12% market rent momentum into a Yr7 exit (TV ~$1180M [LOW confidence, exit cap undisclosed]) via sale-leaseback to Brookfield/Blackstone or roll-up into a regional platform. Beyond 7 years, expansion to the ~600 MW Qatar 2030 pipeline positions Hearst as a multi-asset GCC platform alongside Khazna, with Qatar's $42/MWh tariff (lowest in GCC) as the durable cost moat.

## Sources
- `tt_shell_mena_2024` — key_financial_metrics CAPEX, infrastructure_analysis (HIGH)
- `tt_mep_mena_2024` — key_financial_metrics CAPEX (HIGH)
- `dlr_wholesale_price_2024` — key_financial_metrics pricing, market_benchmarking (HIGH)
- `eqx_retail_price_2024` — market_benchmarking pricing band (HIGH)
- `qfza_tax_regime` — strategic_context, commercialization_strategy (HIGH)
- `mena_permit_timeline_free_zone` — strategic_context, deployment_roadmap (HIGH)
- `crwv_utilization_post_ramp` — infrastructure_analysis tradeoff, recommended_architecture (HIGH)
- `dlr_leverage_2024` — key_financial_metrics leverage benchmark (HIGH)
- `eqx_ebitda_margin_2024` — key_financial_metrics margin target (HIGH)
- `brookfield_aum_2024` — strategic_opportunities financing, market_benchmarking (HIGH)

---
_AI-assisted · Indicative · Human review required._