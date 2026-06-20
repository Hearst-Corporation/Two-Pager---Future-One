# Strategic Memo — AI-generated draft

_Generated 2026-06-15T04:57:15.096Z · model gpt-4.1 · v1 · stakeholder operator · region qatar_
_Data as of 2025-04-30 · freshness EXPIRED_

**Confidence: HIGH** (14 sourced / 14 total) — computed server-side

## Executive Summary
**50 MW Qatar Powered Shell: High-Confidence, Financeable, but CAPEX Underwrite Requires Reconciliation**
- IRR 13.5% post-tax, MOIC 3.29x, DSCR 2.16x (as of 2025-04-30, EXPIRED data).
- CAPEX modeled at $6.16M/MW is 30% below regional benchmarks—reconcile before relying on returns.
- QIA-Brookfield anchor de-risks financing; grid and transformer lead times are gating.
- Occupancy risk high (>70% government anchor); pricing at $36.3/kW/mo holds scarcity premium.
- Recommend proceed to EPC pre-award only after CAPEX validation and parallel grid/permit process.

## Strategic Context
Qatar's AI infrastructure push is capitalized by the QIA-Brookfield partnership, with KAHRAMAA grid headroom and QFZA free-zone regime enabling rapid deployment. Demand is sovereign-anchored, but market absorption is still maturing. Scarcity premium on rents is expected to persist through 2027. Grid and supply chain constraints (transformers, cooling) are the main schedule risks. Data as of 2025-04-30 (EXPIRED).

## Key Financial Metrics
Returns are attractive if CAPEX holds, but modeled cost is 30% below regional benchmarks. EBITDA margin and DSCR are robust. IRR/MOIC must be stress-tested at $8.85M/MW CAPEX. Occupancy and pricing assumptions are credible given current market scarcity.
- **Total CAPEX**: $371.8M  (HIGH) · engine
- **Stabilized EBITDA**: $37.3M  (HIGH) · engine
- **IRR (post-tax)**: 13.5%  (HIGH) · engine
- **MOIC (post-tax)**: 3.29x  (HIGH) · engine
- **Payback**: Not provided years (LOW) · no public comparable - LOW VISIBILITY
- **DSCR**: 2.16x  (HIGH) · engine
- **NPV (post-tax)**: $72.3M  (HIGH) · engine
- **Terminal Value**: $702.3M  (HIGH) · engine
- **PUE**: 1.45 ratio (HIGH) · eqx_pue_2024
- **Stabilized Revenue**: $63.9M  (HIGH) · engine

## Infrastructure Analysis
50 MW powered shell, PUE 1.45, mix of classic (30 MW), liquid (12.5 MW), and AI (7.5 MW) racks. Cooling: hybrid air/liquid, closed-loop dry to address water stress. Tier III+ redundancy. 1331 high-density GPUs. Network: carrier-neutral, Ooredoo/Vodafone fiber, subsea landing ready. Grid: KAHRAMAA, 24-month connection. Hardware refresh at year 8 (85% of initial hardware CAPEX).
- Choosing hybrid air/liquid cooling over full immersion to balance capex and operational complexity, accepting 15–25% capex premium for closed-loop dry cooling.
- Tier III+ redundancy over Tier IV to accelerate COD by 6–8 months, accepting lower SLA (99.982% vs 99.995%).
- High-density GPU racks require liquid cooling, increasing supply chain risk (CDU lead times 6–12 months).
- Carrier-neutral fabric over hyperscaler-only to enable future multi-tenant monetization, accepting slower initial ramp.
- Shell + long lease model over full-stack fit-out to minimize upfront capex, accepting lower service margin.

## Market Benchmarking
- Equinix: EBITDA Margin = 47% (eqx_ebitda_margin_2024)
- Digital Realty: EBITDA Margin = 43% (dlr_ebitda_margin_2024)
- Khazna: Occupancy = ~80% (hyperscale anchor) (intelligence_brief.comparables)

## Key Concerns
- KAHRAMAA grid connection (50 MW) [HIGH] — Parallel permit and grid application; pre-order transformers.
- Transformer and CDU lead times [HIGH] — Order at EPC award; lock supplier slots early.
- Government anchor >70% of phase 1 [HIGH] — Phase-in multi-tenant leasing post-stabilization.
- QFZA/tax regime stability [MEDIUM] — Structure for QFZA compliance; monitor for regime changes.
- Water-stressed cooling environment [MEDIUM] — Closed-loop dry cooling; desalination backup.

## Strategic Opportunities
- QIA-Brookfield JV financing — Leverage QIA-Brookfield vehicle for 60–65% LTV, 5.5–7% exit cap rate; requires anchor LOI and EPC pre-award. Metric: financing close within 3 months of anchor.
- Sovereign anchor lease-up — Secure QIA or government anchor for >70% of phase 1; phase-in enterprise/hyperscaler tenants post-stabilization. Metric: occupancy >80% by year 2.
- Carrier-neutral interconnect layer — Deploy Ooredoo/Vodafone fiber and subsea landing; monetize cross-connects post-stabilization. Metric: interconnect revenue >10% of total by year 5.

## Recommended Architecture
Hybrid cooling and Tier III+ balance speed and resilience (Equinix, DLR comps). Alternatives: full Tier IV (slower, higher capex), air-only (density ceiling). Risk: supply chain delays (transformers, CDUs). Metric: COD within 30 months, DSCR >1.4 at stabilization.

## Revenue Model

## What Happens Next
- Permitting & Grid Application (0–6): QFZA permit, KAHRAMAA grid application (parallel)
- EPC Award & Procurement (6–12): EPC contract, Transformer/CDU order, Anchor LOI
- Construction & Fit-Out (12–36): Shell completion, MEP install, Substation energization
- Commissioning & Ramp (36–42): COD, Tenant fit-out, Occupancy ramp
- ⚠ CAPEX RECONCILIATION WARNING — bottom-up $6.16M/MW vs benchmark $8.85M/MW (delta -30%). Reconcile before relying on IRR/MOIC.
- ⚠ 22-month transformer lead time drives critical path on every GCC DC build
- ⚠ KAHRAMAA 50 MW grid connection: 24-month process — must run in parallel, not series

## Long-Term Strategic Value
Asset delivers 50 MW of AI-ready capacity, anchors Qatar's regional compute hub ambitions, and provides stable cash yield with upside on exit. Compute autonomy and regional leadership improve if multi-tenant ramp succeeds post-government anchor.

## Sources
- Equinix FY2024 10-K — key_financial_metrics, market_benchmarking (undefined)
- Digital Realty FY2024 10-K — key_financial_metrics, market_benchmarking (undefined)
- Equinix 2024 Global Impact Report — key_financial_metrics, infrastructure_analysis (undefined)
- CoreWeave FY2024 S-1 — key_financial_metrics, risk (undefined)
- QFZA framework (Law No. 34/2005 + amendments) — risk, strategic_context (undefined)

---
_AI-assisted · Indicative · Human review required._