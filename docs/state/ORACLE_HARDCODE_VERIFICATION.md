# ORACLE_HARDCODE_VERIFICATION.md

**Verified:** 2026-05-29 · independent grep + live DB cross-check. Ticket NOT trusted; sub-agent classifications independently re-judged against runtime reality.

## Method
Grepped `app/(cockpit)/admin/hearst/`, `components/hearst/`, `lib/` (excluding node_modules, _quarantine, .claude/worktrees, docs) for DEMO_/MOCK_/TEST_/FAKE_, literal regions, project names, providers, dates, MW/CAPEX/IRR. Each hit re-judged: **display value (bad) vs input default / engine constant (acceptable)**, cross-checked against the live `crm` DB.

## Findings (re-classified after runtime cross-check)

### P0 — production lie
**NONE.** No fake value is displayed as real in any institutional view (executive/dossier/library/reports/financial/simulator). All displayed financials come from `/api/.../simulate` (200) or `crm` tables.

> A sub-agent flagged the executive project-name fallback and a widget `geography:'qatar'` as "P0". **Rejected after verification:** the live DB has exactly 1 project named `"HEARST Qatar AI & Data Center Hub"`, country=Qatar. The fallback equals the real value and only shows if `project.name` is null (never, since auto-created). The `geography:'qatar'` is a widget *input* to a sim call, not a displayed truth. Not a lie.

### P1 — production inconsistency
| File:line | Literal | Why P1 |
|---|---|---|
| `executive/page.jsx:64,80` | `project?.name \|\| 'HEARST Qatar AI & Data Center Hub'` | Hardcoded fallback string. Harmless today (==DB value) but would mislead if project renamed. Cosmetic robustness. |
| `reports/page.jsx:108` (already fixed in `3063057`) | was `'HEARST Qatar Data Center Hub'` (variant) | Label inconsistency — **already corrected** to DB-bound + canonical string. Listed for completeness; now resolved. |

### P2 — demo-only acceptable
| File:line | Literal | Gate |
|---|---|---|
| `visuals-preview/page.jsx:11-17` | `DEMO_SCENARIOS` (5 fake IRR/MOIC/CAPEX/MW, regions Qatar/KSA/UAE) | Page header "not for presentation"; placeholder mode; imported by no other screen |
| `visuals-preview/page.jsx:19-23` | `DEMO_PHASES` (Q4 2026 / Q2 2028 / Q2 2029) | idem |

### P3 — internal tooling / acceptable defaults
| File:line | Literal | Why acceptable |
|---|---|---|
| `app/(cockpit)/admin/hearst/page.jsx:60` | `geography:'qatar'` | Brief widget sim *input*, not display; project IS Qatar |
| `app/api/.../simulate/route.js:114,125` | `geography='qatar'`, `requested_mw ?? 50` | **Engine input defaults** — out of scope (engine untouchable), not displayed values |
| `lib/hearst-bootstrap.js:98-123` | qatar/50MW/2026/equity splits/6.5% | **New-scenario seed defaults**, overrideable; engine territory |
| `lib/hearst-constants.js` | `PUBLIC_SOURCES_LIBRARY` (48 benchmarks) | Sourced, caveated, confidence-scored reference data; used to pre-fill, not asserted as project truth |
| `scenarios/page.jsx:16` | 33 `COMPARE_ROWS` | column *labels*, not data |
| `risks/page.jsx` | 25 risk category labels | template labels, not data |

## Verdict
ORACLE is **truthful in its institutional surface**. The only production-facing hardcode is a cosmetic project-name fallback (P1, equals reality). All fake numbers are confined to the gated demo page (P2). Engine defaults (P3) are inputs, not displayed claims. **Zero P0.**
