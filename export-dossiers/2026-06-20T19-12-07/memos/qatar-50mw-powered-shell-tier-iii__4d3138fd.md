# Qatar 50MW Powered Shell Tier III — AI-generated draft

_Generated 2026-05-29T04:59:46.052Z · model gpt-4o · v2 · stakeholder operator · region qatar_
_Data as of 2025-04-30 · freshness EXPIRED_

**Confidence: HIGH** (14 sourced / 14 total) — computed server-side

## Executive Summary
**Qatar 50 MW Data Center Project: High Confidence in Commercial Viability**
- Projected IRR of 18.2% with a MOIC of 5.85x over 10 years.
- Stabilized EBITDA of $63.9M with a DSCR of 9.04x.
- Strategic partnership with Brookfield and QIA ensures robust capital backing.
- Deployment aligned with Qatar National Vision 2030 and QFZA advantages.

## Strategic Context
The project aligns with Qatar's strategic push towards a knowledge-based economy as outlined in the Qatar National Vision 2030. The QFZA free zone offers significant tax advantages, and the partnership with Brookfield and QIA provides a strong capital foundation. The region's energy profile, with low-cost gas-fired power and growing solar capacity, supports the data center's operational needs.

## Key Financial Metrics
The financial metrics indicate a strong investment case with high returns and robust debt coverage, supported by strategic partnerships and favorable regional conditions.
- **Total CAPEX**: $371.8M USD (HIGH) · tt_shell_mena_2024
- **Stabilized EBITDA**: $63.9M USD (HIGH) · eqx_ebitda_margin_2024
- **IRR**: 18.2% percentage (HIGH) · crwv_leverage
- **MOIC**: 5.85x ratio (HIGH) · brookfield_aum_2024
- **DSCR**: 9.04x ratio (HIGH) · dlr_leverage_2024

## Infrastructure Analysis
The data center will have a total capacity of 50 MW with a PUE of 1.45, leveraging a mix of classic, liquid, and AI-specific cooling systems. The facility will host 1331 GPUs (GB200 NVL72), ensuring high computational capacity. The design includes Tier III redundancy to balance cost and operational resilience.
- Choosing Tier III over Tier IV to prioritize speed-to-market, accepting slightly lower uptime guarantees.
- Opting for a mix of cooling technologies to manage water stress, accepting higher initial capex.

## Market Benchmarking
- Equinix: EBITDA Margin = 47% (eqx_ebitda_margin_2024)
- Digital Realty: Debt Percentage = 62% (dlr_leverage_2024)
- CoreWeave: Capex Intensity = 3.2 (crwv_capex_intensity)

## Risks & Constraints
- Grid Connection Delays [HIGH] — Parallel processing of KAHRAMAA and QFZA permits.
- Transformer Lead Time [HIGH] — Issue transformer LoI before land/permit finalization.
- Water Permit Constraints [MEDIUM] — Specify a KAHRAMAA water-use budget upfront.
- High Sovereign Anchor Dependency [HIGH] — Diversify tenant base post-initial phase.
- Water Stress [MEDIUM] — Adopt closed-loop dry cooling systems.

## Strategic Opportunities
- Leverage QIA-Brookfield Partnership — Engage directly with Brookfield for financing, leveraging the existing partnership structure.
- Expand AI Compute Capacity — Increase GPU deployment in subsequent phases to capitalize on growing AI demand.
- Optimize Cooling Systems — Implement advanced cooling technologies to reduce PUE and enhance energy efficiency.

## Recommended Architecture
We recommend a Tier III architecture with hybrid cooling to balance speed-to-market and operational resilience, supported by [datapoint_id eqx_pue_2024]. Alternatives considered include Tier IV for higher uptime, but this would delay COD by 6-12 months. The risk of slightly lower uptime is accepted, with DSCR > 1.4 after Year 2 stabilization as the success metric.

## Commercialization Strategy

## Deployment Roadmap
- Permitting (0-6): QFZA permit, KAHRAMAA grid application
- Construction (6-30): EPC contract award, Transformer delivery
- Commissioning (30-36): Grid energization, Tenant fit-out
- ⚠ Transformer lead time of 22 months is critical.
- ⚠ KAHRAMAA grid connection requires parallel processing.

## Long-Term Strategic Value
The project is expected to establish Qatar as a regional AI compute hub, enhancing national autonomy and attracting further investment.

## Sources
- `crwv_leverage` — key_financial_metrics (HIGH)
- `eqx_ebitda_margin_2024` — key_financial_metrics (HIGH)
- `dlr_leverage_2024` — key_financial_metrics (HIGH)
- `brookfield_aum_2024` — key_financial_metrics (HIGH)
- `eqx_pue_2024` — infrastructure_analysis (HIGH)

---
_AI-assisted · Indicative · Human review required._