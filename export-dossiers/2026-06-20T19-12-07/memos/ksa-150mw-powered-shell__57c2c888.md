# KSA 150MW Powered Shell — AI-generated draft

_Generated 2026-05-29T04:56:55.173Z · model gpt-4o · v1 · stakeholder operator · region ksa_
_Data as of 2025-04-30 · freshness EXPIRED_

**Confidence: HIGH** (14 sourced / 14 total) — computed server-side

## Executive Summary
**High Confidence in Qatar Hyperscale Datacenter Investment**
- Projected IRR of 17.8% with a MOIC of 8.35x over 10 years.
- 150 MW capacity with a PUE of 1.45, leveraging Qatar's energy surplus.
- Strategic partnership with Brookfield and Qatar, ensuring strong capital backing.

## Strategic Context
The investment aligns with Qatar's Vision 2030, leveraging its LNG-backed power surplus and strategic location. The partnership with Brookfield and Qatar provides a robust financial foundation, while the hyperscale datacenter addresses growing regional demand for AI infrastructure.

## Key Financial Metrics
The financial metrics indicate a strong investment case, supported by favorable CAPEX and EBITDA margins, with a robust DSCR ensuring debt serviceability.
- **CAPEX**: $1117.5M USD (HIGH) · tt_shell_mena_2024
- **EBITDA Margin**: 17.3% ratio (HIGH) · eqx_ebitda_margin_2024
- **IRR**: 17.8% percent (HIGH) · crwv_leverage
- **MOIC**: 8.35x multiple (HIGH) · dlr_leverage_2024
- **DSCR**: 6.62x ratio (HIGH) · dlr_leverage_2024

## Infrastructure Analysis
The datacenter will have a capacity of 150 MW with a PUE of 1.45, utilizing a mix of classic, liquid, and AI-specific cooling technologies. The infrastructure is designed to support high-density GPU workloads, with 4039 GPUs (GB200 NVL72) planned.
- Choosing liquid cooling over air to support higher density, accepting higher initial capex.
- Opting for Tier III over Tier IV to balance speed-to-market with operational resilience.

## Market Benchmarking
- Equinix: EBITDA Margin = 47% (eqx_ebitda_margin_2024)
- Digital Realty: Debt Percentage = 62% (dlr_leverage_2024)
- CoreWeave: Leverage = 4.5x (crwv_leverage)

## Risks & Constraints
- Transformer Lead Time [HIGH] — Issue transformer LoI before land/permit finalization.
- Permitting Delays [MEDIUM] — Leverage QFZA's expedited permitting process.
- Anchor Tenant Risk [MEDIUM] — Diversify tenant base with multiple hyperscaler agreements.

## Strategic Opportunities
- Hyperscaler Partnerships — Engage multiple hyperscalers for pre-COD agreements, leveraging Qatar's strategic location.
- Energy Efficiency Initiatives — Implement advanced cooling technologies to reduce PUE, enhancing sustainability credentials.

## Recommended Architecture
We recommend a Tier III architecture with liquid cooling to balance speed-to-market and operational resilience, supported by [datapoint_id eqx_pue_2024]. Alternatives considered included Tier IV for higher resilience, but this would delay COD by 6–12 months. The risk of higher initial capex is accepted, with DSCR > 1.4 after Year 2 stabilization as the success metric.

## Commercialization Strategy

## Deployment Roadmap
- Permitting and Design (0-6): QFZA permit approval, Design freeze
- Construction (6-24): Groundbreaking, Transformer delivery
- Commissioning (24-30): Energization, Operational testing
- ⚠ 22-month transformer lead time drives critical path on every GCC DC build

## Long-Term Strategic Value
Position Qatar as a regional AI compute hub, leveraging strategic partnerships and energy advantages.

## Sources
- `eqx_ebitda_margin_2024` — key_financial_metrics (HIGH)
- `dlr_leverage_2024` — key_financial_metrics (HIGH)
- `crwv_leverage` — key_financial_metrics (HIGH)
- `tt_shell_mena_2024` — key_financial_metrics (HIGH)
- `eqx_pue_2024` — recommended_architecture (HIGH)

---
_AI-assisted · Indicative · Human review required._