# ORACLE_EXECUTIVE_SUMMARY.md
## RED TEAM AUDIT — Executive Summary

**Auditor:** Independent Institutional Auditor  
**Date:** 2026-05-29  
**Scope:** Full source code, database schema, API routes, runtime behavior  
**Methodology:** Assume every claim is false. Trust only source code.

---

## BOTTOM LINE

**ORACLE is not a fraud, but it is a prototype dressed in production clothing.**

The system has real code, real database tables, and a working CRM. But the institutional claims — live intelligence, 3D visualization, AI cascade, board-ready exports — are either exaggerated or false.

---

## CRITICAL FINDINGS (Fix Before Any Institutional Use)

### 1. FINANCIAL ENGINE HAS MATERIAL ERRORS
- **Interest-only debt service** in projections (no principal amortization)
- **Wrong preferred return compounding** in waterfall (mathematically incorrect)
- **Hardcoded occupancy curve** for all scenarios/regions/archetypes
- **GPU refresh NOT modeled** (explicitly admitted)

**Impact:** IRR, NPV, MOIC, DSCR outputs are materially incorrect.

### 2. "LIVE DATA" IS 100% STATIC
- GPU pricing: Static anchors + failed scrapers
- Energy tariffs: Hardcoded JS objects for all regions
- Market signals: Hardcoded scenarios
- Intelligence layer: 140 hardcoded datapoints, no APIs

**Impact:** Memos claim "live intelligence" but use months-old static data.

### 3. SECURITY GAPS
- **Dev auto-login bypass** in `getSessionProfile()` (env-dependent)
- **RLS disabled** on all HEARST tables
- **No row ownership** on core CRM tables (shared workspace)
- **No auth middleware** (each page handles auth individually)

**Impact:** Any editor can mutate any record. Auth bypass possible.

### 4. SPATIAL SYSTEM IS PLACEHOLDER-ONLY
- Placeholder mode is **fail-safe default**
- 3D components exist but are **blocked by manifest**
- System is **designed to show placeholders**

**Impact:** No real 3D visualization exists.

### 5. DEMO MODE IS A KILL SWITCH
- Disables 5 features (returns 503)
- Creates illusion of robustness
- Actually hides failures by removing functionality

**Impact:** Misleading during investor presentations.

---

## HIGH FINDINGS

### 6. "AI CASCADE" IS A SINGLE LLM CALL
- Claims 4-model cascade (kimi-k2.6 → k2.5 → glm-5 → minimax)
- Reality: Single `kimiChatCompletion()` call
- CASCADE array is display-only

### 7. TWO DISCONNECTED SYSTEMS
- Brochure/Landing: Static marketing (no backend)
- Cockpit HEARST: CRM + Simulator
- They share **zero code, zero data, zero navigation**

### 8. EXPOSED TEMPLATE PAGE
- `/admin/cockpit-template` accessible in production
- French placeholder text: "Titre de la page"
- No route guard

### 9. PARALLEL SOURCE SYSTEMS
- DB sources table: Managed by UI, **unused by engine**
- Hardcoded datapoints.js: **Used by engine**, not editable

### 10. MEMO PERSISTENCE IS BEST-EFFORT
- DB failure caught but memo still returned
- User may not realize persistence failed
- No append-only enforcement (UPDATE/DELETE possible)

---

## SCORECARD

| Dimension | Grade | Verdict |
|-----------|-------|---------|
| Product Reality | D | Two disconnected systems |
| Navigation | C | Exposed template, redirect-only pages |
| User Journey | D | Auth bypass, no ownership |
| Memo Generation | C | Single LLM, static intelligence |
| Memo Persistence | B | Works but not hardened |
| PDF Generation | ? | Unverified |
| Dashboard | B | Real CRM, hardcoded HEARST panel |
| Library | B | Modular, inflated package claims |
| Dossier | B | UI exists, export unverified |
| Spatial System | F | Placeholder-only by design |
| Intelligence Layer | F | 100% static hardcoded |
| Live Data Layer | F | No live APIs |
| Financial Engine | C | Correct formulas, material errors |
| Database | C | Schema exists, RLS disabled |
| Security | D | No middleware, dev bypass, RLS off |
| Demo Readiness | D | Kill switch, not robustness |
| Institutional Readiness | C | UI exists, no verified exports |
| Board Readiness | C | Summary page, not board-ready |

**Overall Grade: D+**

---

## WHAT ORACLE ACTUALLY IS TODAY

**Answer: E. Hybrid**

**Defense:**

ORACLE is a **hybrid of three things**, none of which fully work:

1. **Financial Simulator (partial)** — The calculation engine has the skeleton of real financial modeling (IRR, NPV, DSCR, waterfall, sensitivity) but contains material errors (interest-only debt, wrong preferred return, hardcoded occupancy). It is NOT production-ready for investment decisions.

2. **Decision-Support Platform (partial)** — The CRM dashboard (`/admin`) is a real, working tool for tracking operators, partners, initiatives, and tasks. It has real users, real data, and real workflows. But it is disconnected from the simulator and has no ownership model.

3. **Intelligence Platform (fake)** — The "intelligence layer" claims live data, GPU pricing, energy tariffs, and market signals. In reality, all of this is static hardcoded JavaScript. The LLM memo generator is real (single API call to Kimi) but its "intelligence" is a well-organized collection of static estimates.

ORACLE is **NOT** an operating system (no hardware control, no real-time systems). It is **NOT** a pure financial simulator (too much CRM and UI). It is **NOT** a pure decision-support platform (the simulator and memo generator are core features). It is **NOT** a pure intelligence platform (the intelligence is fake).

It is a **hybrid prototype** with:
- A working CRM (real)
- a broken financial engine (partial)
- a fake intelligence layer (illusion)
- a placeholder spatial system (non-existent)
- a misleading demo mode (deceptive)

**Before any institutional stakeholder relies on ORACLE:**
1. Fix debt service calculation
2. Fix preferred return waterfall
3. Parameterize occupancy curves
4. Wire real APIs OR honestly label data as static
5. Enable RLS
6. Remove dev auth bypass
7. Add row ownership
8. Remove or protect template pages
9. Verify PDF export quality
10. Add comprehensive testing

---

*This audit was conducted on source code only. No runtime testing was performed. No database inspection was performed. Findings are based on static analysis of the codebase as of 2026-05-29.*
