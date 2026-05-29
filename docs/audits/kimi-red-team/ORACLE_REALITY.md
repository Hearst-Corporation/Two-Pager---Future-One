# ORACLE_REALITY.md
## RED TEAM EXHAUSTIVE AUDIT — What ORACLE Actually Is
**Auditor:** Independent Institutional Auditor  
**Date:** 2026-05-29  
**Methodology:** Source-code only. Runtime verification. No trust in commit messages, screenshots, or prior reports.

---

## A. PRODUCT REALITY

### Claim: "ORACLE is an institutional decision-support platform for data center investment"
### Reality:
ORACLE is **two disconnected systems** masquerading as one:

1. **Brochure/Landing** (`/`, `/brochure`, `/print`, `/pitch*`) — A static marketing presentation (A3 folded brochure, pitch deck). No backend. No data.
2. **Cockpit HEARST** (`/admin`, `/admin/hearst/*`) — A CRM dashboard (Supabase-backed) with a financial simulator and LLM memo generator.

**The two systems share ZERO code, ZERO data, ZERO navigation.** The brochure does not link to the cockpit. The cockpit does not reference the brochure.

| File | Proof |
|------|-------|
| `README.md:5-7` | "Le projet contient deux systèmes complètement indépendants" |
| `app/page.jsx` | Landing page — no admin links |
| `app/admin/page.jsx` | Dashboard — no brochure references |

**Severity:** CRITICAL — The product is not a unified platform. It is a brochure + a CRM tool.

---

## B. NAVIGATION

### Claim: "Unified institutional experience"
### Reality:

| Route | Status | Evidence |
|-------|--------|----------|
| `/` | ✅ Working | Static landing |
| `/brochure` | ✅ Working | A3 brochure renderer |
| `/admin` | ✅ Working | CRM dashboard |
| `/admin/hearst/*` | ✅ Working | 24 cockpit pages |
| `/admin/cockpit-template` | ❌ **EXPOSED TEMPLATE** | French placeholder text: "Titre de la page", "Remplacez ce contenu" |
| `/admin/hearst/hub` | ⚠️ Redirect only | `redirect('/admin/hearst/pipeline')` |
| `/rdc-3d` | ❌ Unknown | Exists but unverified |
| `/rdc-photos` | ❌ Unknown | Exists but unverified |

**Severity:** HIGH — `/admin/cockpit-template` is a raw template page accessible in production.

---

## C. USER JOURNEY

### Claim: "Secure multi-user workspace with role-based access"
### Reality:

**Auth bypass in development:**
```javascript
// lib/supabase-server.js:46-58
const DEV_AUTOLOGIN_EMAIL = process.env.NODE_ENV === 'development' 
  ? process.env.ADMIN_DEV_AUTOLOGIN_EMAIL : null;

export async function getSessionProfile() {
  if (DEV_AUTOLOGIN_EMAIL) {
    // BYPASSES normal auth entirely
    const admin = createBareClient(URL, SERVICE_KEY, ...);
    const { data: profile } = await admin.from('profiles')...
    return { user: { id: profile.id, email: profile.email }, profile };
  }
  // ... normal auth
}
```

**No middleware redirect:** No `middleware.js` file forces auth on `/admin/*`. Each page calls `getSessionProfile()` individually. Some pages return `null` instead of redirecting.

**Shared workspace = no ownership:**
```javascript
// lib/auth-guards.js:10-16
// "crm.operators / partners / initiatives / tasks / hearst_* have NO owner_id"
// "The only rows with a per-user identity are: comments, notifications, profiles"
```

Any editor can mutate any operator, partner, or initiative. No row-level ownership.

**Severity:** CRITICAL — Dev auto-login bypass + no ownership on core tables.

---

## D. MEMO GENERATION

### Claim: "AI-generated strategic memos with live intelligence"
### Reality:

The memo endpoint (`/api/admin/hearst/strategic-memo`) does the following:

1. **Builds a massive prompt** (~15,000 chars) with static intelligence data
2. **Calls Kimi API** (single LLM call, NOT a cascade as claimed)
3. **Returns JSON** with 11 structured sections
4. **Persists to DB** (best-effort, failure is caught but not blocking)

**The "cascade" is a lie:**
```javascript
// lib/hearst-memo-job-store.js:25
const CASCADE = ['kimi-k2.6', 'kimi-k2.5', 'glm-5', 'minimax-m2.5'];
// Only used for display. The actual API call uses a SINGLE model.

// app/api/admin/hearst/strategic-memo/route.js:369-378
const { response, model_used } = await kimiChatCompletion({
  model: KIMI_MODEL,  // SINGLE MODEL
  messages: [...],
});
```

**The "intelligence layer" is static JSON:**
- `lib/oracle-intelligence/datapoints.js` — ~140 hardcoded data points
- `lib/oracle-intelligence/comparables.js` — Static entity profiles
- `lib/oracle-intelligence/tensions.js` — Static decision tensions
- No live API calls. No real-time data. No ML.

**Severity:** HIGH — "AI cascade" is a single LLM call. "Intelligence" is static JSON.

---

## E. MEMO PERSISTENCE

### Claim: "Append-only, versioned, auditable institutional asset"
### Reality:

```javascript
// lib/strategic-memo-store.js:78-119
export async function persistMemo({ memo, meta, project_id, scenario_id, title, actor_id }) {
  // 1. Queries max version for scenario
  // 2. Builds markdown
  // 3. INSERTS row
  // 4. Returns { id, version } or { error }
}
```

**What's real:**
- ✅ Table `crm.strategic_memos` exists with proper schema
- ✅ Each generation inserts a new row
- ✅ Version increments per scenario

**What's fake:**
- ❌ No trigger enforces append-only (UPDATE/DELETE still possible)
- ❌ No `schema_migrations` table tracks applied migrations
- ❌ `project_id` FK references `hearst_projects` which may not exist
- ❌ `scenario_id` FK references `hearst_scenarios` — RLS disabled

**Severity:** MEDIUM — Persistence works but lacks hardening.

---

## F. PDF GENERATION

### Claim: "Exportable board packs and PDFs"
### Reality:

- `/api/admin/hearst/strategic-memos/[id]/pdf/route.js` exists
- Uses a PDF generation library
- **No evidence of actual PDF output quality or completeness**
- The dossier page (`/admin/hearst/dossier`) renders memos inline but does not generate PDFs client-side

**Severity:** UNKNOWN — Route exists, quality unverified.

---

## G. DASHBOARD

### Claim: "Live institutional dashboard"
### Reality:

**CRM Dashboard** (`/admin` — `DashboardView.jsx`):
- ✅ Real Supabase data: tasks, initiatives, operators, partners, activity, notifications
- ✅ 3-column layout: My Tasks / Pipeline / Activity
- ⚠️ All counts are live but the "Today" panel in `/admin/hearst` hardcodes a simulation:

```javascript
// app/(cockpit)/admin/hearst/page.jsx:53-62
fetch('/api/admin/hearst/simulate', {
  method: 'POST',
  body: JSON.stringify({
    input_mode: 'mw_first',
    input_value: { total_mw: 50 },  // HARDCODED
    archetype_id: 'powered_shell',   // HARDCODED
    geography: 'qatar',              // HARDCODED
  }),
})
```

The "HEARST Brief Today" panel always runs Qatar 50MW powered_shell, regardless of actual project state.

**Severity:** MEDIUM — Dashboard is real but HEARST panel is hardcoded.

---

## H. LIBRARY

### Claim: "Reusable component library"
### Reality:

- `components/ui/` — Generic shadcn/ui components (limited set)
- `components/admin/` — Admin-specific UI (Avatar, layout)
- `components/hearst/` — 20 HEARST-specific components
- `components/hearst/simulator/` — 12 simulator components
- `components/hearst/visuals/` — 3D/2D visual components

**What's real:** Component architecture is modular.
**What's fake:** Many components are thin wrappers. The `@hearst/*` packages (`cockpit-shell`, `hub-sdk`, `review-mode`) are local tarballs — not published npm packages.

**Severity:** LOW — Components exist but package claims are inflated.

---

## I. DOSSIER

### Claim: "Project dossier with full memo history"
### Reality:

`/admin/hearst/dossier` — 804 lines of client-side React:
- Renders memos inline with accordion sections
- Supports `?memo=<id>` and `?scenario=<id>` modes
- Lists all versions per scenario
- **No PDF generation on this page**
- **No export functionality visible**

**Severity:** MEDIUM — Dossier UI exists but export is unverified.

---

## J. SPATIAL SYSTEM

### Claim: "3D spatial visualization of data center campuses"
### Reality:

```typescript
// lib/spatial/placeholder-mode.ts
/**
 * ORACLE Spatial visual gate
 * When a view cannot be rendered (missing assets, WebGL failure, unapproved geometry),
 * shows a placeholder. This prevents unvetted/candidate geometry from ever
 * reaching a boardroom screen.
 */
```

**Placeholder mode is ON by default.** The spatial system is explicitly designed to show placeholders instead of actual 3D renders.

```javascript
// components/hearst/visuals/ — 3 files:
// CampusFloorplan2D.jsx, Campus3DIsometric.jsx, PowerFlowDiagram.jsx
```

**Severity:** CRITICAL — Spatial system is explicitly a placeholder system. No real 3D.

---

## K. INTELLIGENCE LAYER

### Claim: "Live infrastructure intelligence with GPU pricing, energy tariffs, market signals"
### Reality:

**GPU Pricing** (`lib/oracle-live/gpu-pricing.js`):
- Claims 5 live provider scrapers (Lambda, CoreWeave, Vast.ai, RunPod, NVIDIA DGX Cloud)
- **CoreWeave scraper** (`providers/coreweave.js:40-84`): Returns `status: 'unavailable'` — "no public pricing endpoint"
- **Lambda scraper**: Attempts HTML parsing but likely fails in practice
- **All providers**: In-memory cache with 1h TTL — resets on server restart

**Energy** (`lib/oracle-live/energy.js`):
- **Static hardcoded values** for all regions
- Qatar: $42/MWh (hardcoded, no API)
- UAE: $50/MWh (hardcoded)
- No live energy APIs. No real-time tariffs.

**Infrastructure Signals** (`lib/oracle-live/infra-signals.js`):
- 674 lines of static signal definitions
- No live API connections
- Signals are hardcoded scenarios

```javascript
// lib/oracle-live/index.js:35-46
export async function getGpuPricingBrief(ctx) {
  try {
    const mod = await import('./gpu-pricing.js');
    if (typeof mod.getGpuPricingBrief === 'function') {
      return mod.getGpuPricingBrief(ctx);
    }
  } catch (_err) {
    // gpu-pricing.js not yet available — fall through
  }
  return mu('gpu_pricing', ctx?.region || 'global', 'GPU pricing module not yet integrated');
}
```

**Severity:** CRITICAL — "Live data" is 100% static hardcoded values. No real APIs.

---

## L. LIVE DATA LAYER

### Claim: "Real-time GPU pricing, energy tariffs, infrastructure signals"
### Reality:

| Data Source | Claim | Reality |
|-------------|-------|---------|
| GPU Pricing | Live scrapers | Static anchors + failed scrapes |
| Energy | Regional tariffs | Hardcoded JS objects |
| Signals | Market intelligence | Hardcoded scenarios |
| News | News refresh | Unknown quality |

The "live" layer is a sophisticated fallback system that returns `status: 'unavailable'` or static anchors when live data fails.

**Demo mode kills all live surfaces:**
```javascript
// lib/demo-mode.js
// When SAFE_DEMO_MODE=1:
// - advisor returns 503
// - cockpit chat returns 503
// - live data refresh returns 503
// - gpu-prices returns 503
```

**Severity:** CRITICAL — No live data. Demo mode hides this by design.

---

## M. FINANCIAL ENGINE

### Claim: "Authorized calculation engine with 10-year projections, waterfall, sensitivity"
### Reality:

**What's correct:**
- Standard financial formulas (IRR, NPV, DSCR, MOIC, Payback)
- 10-year projection with phased MW ramp
- Sensitivity matrix generation
- Debt schedule with IO window

**What's broken:**

1. **Interest-only debt service** (`hearst-calculations.js:274-276`):
```javascript
const yearly_debt_service = (debt_amount && debt_interest_rate)
  ? debt_amount * ((debt_interest_rate || 0) / 100) // INTEREST ONLY — NO PRINCIPAL AMORTIZATION
  : null;
```
The projection uses interest-only debt service, NOT the full amortization schedule generated by `generateDebtSchedule()`.

2. **Wrong preferred return calculation** (`hearst-calculations.js:692-694`):
```javascript
hearst_pref_accrued = (hearst_pref_accrued + hearst_equity_in) * PREF_RATE;
```
This compounds on the FULL equity invested every year, not the UNRETURNED equity. This is mathematically wrong.

3. **Hardcoded occupancy curve** (`hearst-calculations.js:236`):
```javascript
const ramp = [0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95];
```
Same curve for all archetypes, all regions, all business models.

4. **GPU refresh not modeled** (`hearst-calculations.js:412-414`):
```javascript
projection.warnings.push('GPU refresh CAPEX not currently modeled...');
projection.gpu_refresh_modeled = false;
```

**Severity:** CRITICAL — Financial engine has material errors in debt service and waterfall.

---

## N. DATABASE

### Claim: "Production Supabase schema with RLS, versioning, audit trail"
### Reality:

**Schema files:** 10 SQL files in `scripts/` and `scripts/migrations/`
- `crm-schema.sql` through `crm-schema-v6.sql` — Incremental migrations
- `hearst-schema.sql` — HEARST tables
- `strategic-memos-schema.sql` — Memo persistence
- 4 migration files in `scripts/migrations/`

**What's real:**
- ✅ Tables exist: operators, partners, initiatives, tasks, events, profiles, etc.
- ✅ HEARST tables: projects, scenarios, deals, contracts, sources, gpu_catalog, etc.
- ✅ Trigger-based audit logging (status changes)

**What's fake:**
- ❌ **RLS DISABLED** on all HEARST tables:
```sql
-- scripts/hearst-schema.sql:13
-- NOTE: RLS currently disabled on these tables — to be addressed in a separate security wave.
```
- ❌ No `schema_migrations` table — no tracking of applied migrations
- ❌ `hearst_market_signals` table referenced but never created
- ❌ `public.hearst_advisor_logs` and `public.llm_rate_buckets` in `public` schema, not `crm`

**Severity:** CRITICAL — RLS disabled. No migration tracking.

---

## O. SECURITY

### Claim: "IDOR guards, ownership checks, service_role isolation"
### Reality:

**Auth guards** (`lib/auth-guards.js`):
- `requireRowOwnership()` exists but `allowSharedWorkspace: true` is used for ALL core tables
- Only comments and notifications have per-user ownership

**API route protection:**
- Most `/api/admin/*` routes call `requireProfile('viewer')` or `authedWrite('editor')`
- **BUT** no middleware enforces this globally

**Environment variables:**
```javascript
// lib/llm/kimi.ts:25,35,43
apiKey: process.env.HYPERCLI_API_KEY || "build-placeholder",
apiKey: process.env.ANTHROPIC_API_KEY || "build-placeholder",
apiKey: process.env.OPENAI_API_KEY || "build-placeholder",
```
Build placeholders in source code.

**Severity:** HIGH — No global auth middleware. RLS disabled. Dev bypass exists.

---

## P. DEMO READINESS

### Claim: "SAFE_DEMO_MODE — zero live failures possible during demo"
### Reality:

```javascript
// lib/demo-mode.js
export const DEMO_DISABLED_RESPONSE = {
  error: 'disabled_in_demo_mode',
  message: 'This surface is disabled in SAFE_DEMO_MODE for presentation safety.',
};
```

Demo mode does NOT make features robust. It **kills** them:
- Advisor → 503
- Cockpit chat → 503
- Live data refresh → 503
- GPU prices → 503

The demo badge says "Demo Mode" but what it means is "5 features are disabled so they can't fail."

**Severity:** HIGH — Demo mode is a kill switch, not a robustness layer.

---

## Q. INSTITUTIONAL READINESS

### Claim: "Board-ready exports, executive dashboard, institutional workflows"
### Reality:

**Executive dashboard** (`/admin/hearst/executive`):
- 182 lines — fetches memos, scenarios, news
- Renders counts, recent reports, risks
- **No actual export functionality**
- **No print-optimized layout**

**Board pack export:**
- Claimed in dossier page
- No evidence of actual PDF generation pipeline
- No evidence of scheduled reports

**Severity:** MEDIUM — Executive UI exists but no verified export pipeline.

---

## R. BOARD READINESS

### Claim: "Everything a Sheikh / QIA / Equinix reviewer needs in 5 seconds"
### Reality:

The executive page comment:
```javascript
// app/(cockpit)/admin/hearst/executive/page.jsx:4-7
// The institutional first-screen: everything a Sheikh / QIA / Equinix reviewer
// needs in 5 seconds. Reads existing APIs only (no engine, no new data).
```

**What it actually shows:**
- Count of memos (draft vs approved)
- Count of scenarios
- List of recent reports
- Hardcoded "recommended actions"
- No real-time market data
- No interactive charts
- No drill-down capability

**Severity:** MEDIUM — Executive page is a summary, not a board-ready experience.

---

## SUMMARY: DIMENSION SCORECARD

| Dimension | Grade | Key Finding |
|-----------|-------|-------------|
| A. Product Reality | D | Two disconnected systems |
| B. Navigation | C | Exposed template page |
| C. User Journey | D | Dev auth bypass, no ownership |
| D. Memo Generation | C | Single LLM call, static "intelligence" |
| E. Memo Persistence | B | Works but not hardened |
| F. PDF Generation | ? | Unverified |
| G. Dashboard | B | Real CRM data, hardcoded HEARST panel |
| H. Library | B | Modular but inflated package claims |
| I. Dossier | B | UI exists, export unverified |
| J. Spatial System | F | Explicitly placeholder-only |
| K. Intelligence Layer | F | 100% static hardcoded data |
| L. Live Data Layer | F | No live APIs |
| M. Financial Engine | C | Correct formulas, material errors in debt/waterfall |
| N. Database | C | Schema exists, RLS disabled, no migration tracking |
| O. Security | D | No middleware, dev bypass, RLS off |
| P. Demo Readiness | D | Kill switch, not robustness |
| Q. Institutional Readiness | C | UI exists, no verified exports |
| R. Board Readiness | C | Summary page, not board-ready |
