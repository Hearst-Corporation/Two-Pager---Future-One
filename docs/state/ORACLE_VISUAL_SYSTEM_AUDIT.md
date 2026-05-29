# ORACLE_VISUAL_SYSTEM_AUDIT.md

**Verified:** 2026-05-29 · code + live runtime (:5005, real `crm` data). Facts only.

## PHASE 2 — page-by-page (nav-reachable + the 4 orphans)

Nav surfaces: **Bottom bar** (4 groups) + **Left rail** (16 favourites). Orphans = in neither.

| Page | Purpose | User | First action | Primary CTA | Dead ends | Dup actions | Placeholder | Hardcoded | Demo | Broken hierarchy |
|---|---|---|---|---|---|---|---|---|---|---|
| **Brief** `/` | Operational dashboard (deals, health, signals, activity) | CEO/PM | scan KPIs | open deal / launch sim | — | overlaps Executive | no | `geography:'qatar'` in widget sim-call (input, not display) | no | no |
| **Simulator** | Build plan, compute projection | Analyst/CEO | pick MW/archetype | Save / Generate memo | — | — | no | input defaults only | no | no |
| **Executive** ⚠️orphan | Board 5-sec overview | CEO/Board | read KPIs | Open dossier | — | overlaps Brief | no | project-name fallback (==real DB name) | no | no |
| **Dossier** ⚠️orphan | Full 11-section memo reader | CEO/Board | pick memo | read / PDF | — | canonical (others link in) | no | no | no | no |
| **Library** | Memo archive + status workflow | Analyst | filter | change status / open in Dossier | — | links INTO dossier | no | no | no | no |
| **Reports** | Printable financial summary | Investor | read | browser Print→PDF | print dialog friction | overlaps Dossier/Documents | no | title now DB-bound (`project?.name`) | no | no |
| **Documents** | Export template launcher | Investor Rel | pick scenario | Generate | 🔴 **404 on all 6** (export/* missing) | maps 6→3 routes | no | template metadata | no | yes (buttons fail) |
| **Financial** | 10-yr deep dive | CFO/Analyst | pick scenario | Export Excel/Memo | 🔴 **Excel & Memo PDF → 404** | — | no | no | no | no |
| **Scenarios** | Compare scenarios | Analyst | compare | New / Clone | — | inventory vs Financial detail | no | 33 fixed COMPARE_ROWS (labels) | no | no |
| **Assumptions** | Edit 42 fields | Analyst | pick scenario | inline Save (PATCH) | — | — | no | no | no | no |
| **Engine** | Pipeline/source audit | Admin | pick tab | export JSON/MD | — | — | no | catalogs (P3 internal) | no | no |
| **Deals** | Deal Kanban | CEO/Ops | scan board | add/move deal | — | — | no | no | no | no |
| **Pipeline** | Prospect funnel | Analyst | scan | add prospect | empty (0 rows) | name-clash w/ legacy `/admin/pipeline` | no | no | no | no |
| **Contracts** | Contract registry | Legal | scan | add | empty (0 rows) | — | no | no | no | no |
| **Data Room** | Diligence checklist | Analyst | scan | advance status | — | — | no | no | no | no |
| **Sources** | Intelligence ledger | Analyst | filter | use-in-model | ~1 row | — | no | PUBLIC_SOURCES lib (P3 sourced) | no | no |
| **Timeline** | Gantt | PM | read | — (static) | — | — | no | no | no | no |
| **Risks** | Risk matrix | Risk Officer | rate | set severity (PATCH) | — | — | no | 25 risk labels (template) | no | no |
| **Changelog**(audit) | Mutation log | Compliance | filter | load more | — | — | no | no | no | no |
| **Visual Preview** ⚠️orphan | 7 placeholders QA | Admin | pick tab | — | — | — | **YES (all 7)** | DEMO_SCENARIOS/PHASES | **YES (gated)** | no |
| **About** ⚠️orphan | Education primer | All | read | — | — | — | no | glossary (static, P3) | no | no |
| **Profile** | Session profile | User | — | — | stub (11 l.) | — | no | no | no | no |
| **Hub** | redirect shell | — | — | — | redirect-only (9 l.) | — | no | no | no | no |

### Special-attention findings (verified at runtime)
- **Executive & Dossier**: production-quality, real data, **but in NO nav** (rail `ALL_DESTINATIONS` omits both; bottom-bar `matchAny` omits both). Orphaned.
- **Library / Reports / Dossier / Documents**: 4 surfaces over the same memos. Code already routes Library→Dossier and Executive→Dossier (dossier is de-facto canonical). Reports duplicates a financial-summary; Documents is the intended export hub but its routes 404.
- **Simulator / Strategic Memo / Dashboard**: all real, all 200 at runtime. No placeholder/fake values in display.
- **Visual Preview**: the only screen showing placeholders; clearly gated "not for presentation". Correct.
- **Memos are all `draft` (0 approved)** — the board-facing "Approved" KPI on Executive reads 0. Data state, not a bug.
