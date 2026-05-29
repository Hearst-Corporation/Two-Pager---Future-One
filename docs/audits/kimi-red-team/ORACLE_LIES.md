# ORACLE_LIES.md
## Every Discrepancy Between Claim and Reality

---

## LIE #1: "AI Model Cascade"

**Claim:** "Modèle : Kimi cascade (kimi-k2.6 → k2.5 → glm-5 → minimax-m2.5)"

**Source:** `app/api/admin/hearst/strategic-memo/route.js:14`

**Reality:** Single LLM call.
```javascript
// route.js:369-378
const { response, model_used } = await kimiChatCompletion({
  model: KIMI_MODEL,  // ONE MODEL
  messages: [...],
  temperature: 0.0,
  max_tokens: 16000,
});
```

The `CASCADE` array in `lib/hearst-memo-job-store.js:25` is ONLY used for UI display. It never triggers multiple models.

**Severity:** HIGH  
**Proof:** `lib/hearst-memo-job-store.js:25`, `app/api/admin/hearst/strategic-memo/route.js:369`

---

## LIE #2: "Live GPU Pricing Intelligence"

**Claim:** "GPU Pricing Intelligence (Live Scrapers)" — "Calls all provider scrapers in parallel"

**Source:** `lib/oracle-live/gpu-pricing.js:1-12`

**Reality:** 
- CoreWeave: `status: 'unavailable'` — "no public pricing endpoint" (`providers/coreweave.js:53`)
- Lambda: HTML scraping that likely fails in practice
- All results cached in-memory (lost on restart)
- Static anchors from hardcoded `datapoints.js` are the ONLY reliable data

**Severity:** CRITICAL  
**Proof:** `lib/oracle-live/providers/coreweave.js:40-84`, `lib/oracle-live/gpu-pricing.js:214-247`

---

## LIE #3: "Live Energy Tariff Data"

**Claim:** "Energy Intelligence Layer. Regional electricity tariff data..."

**Source:** `lib/oracle-live/energy.js:1-6`

**Reality:** Every value is hardcoded:
```javascript
// lib/oracle-live/energy.js:71-76
qatar: {
  electricity_tariff_industrial_usd_mwh: {
    value: 42,        // HARDCODED
    range_low: 38,    // HARDCODED
    range_high: 48,   // HARDCODED
    confidence: 'high',
    source_datapoint_id: 'kahramaa_tariff_industrial',  // References static datapoint
  },
```

No API calls. No real-time data. No KAHRAMAA integration.

**Severity:** CRITICAL  
**Proof:** `lib/oracle-live/energy.js:62-452` — every region is hardcoded

---

## LIE #4: "3D Spatial Visualization"

**Claim:** "3D spatial visualization of data center campuses"

**Reality:** Placeholder mode is the DEFAULT and ONLY mode:
```typescript
// lib/spatial/placeholder-mode.ts:14-18
 * When a view cannot be rendered (missing assets, WebGL failure, unapproved geometry),
 * shows a placeholder. This prevents unvetted/candidate geometry from ever
 * reaching a boardroom screen.
 * 
 * By design, placeholder mode ON (fail-safe default).
```

**Severity:** CRITICAL  
**Proof:** `lib/spatial/placeholder-mode.ts`

---

## LIE #5: "Secure Multi-User Workspace with Ownership"

**Claim:** "Re-usable IDOR / ownership guards for admin API routes"

**Source:** `lib/auth-guards.js:1-6`

**Reality:**
```javascript
// lib/auth-guards.js:10-16
// The Prese Hub data model is a single-tenant shared workspace:
//   - crm.operators / partners / initiatives / tasks / hearst_* have NO owner_id.
//   - The only rows with a per-user identity are: comments, notifications, profiles
```

Any editor can edit any operator, partner, or initiative. The `allowSharedWorkspace: true` flag bypasses ALL ownership checks.

**Severity:** CRITICAL  
**Proof:** `lib/auth-guards.js:10-21`, `lib/auth-guards.js:146`

---

## LIE #6: "Demo Mode = Robustness"

**Claim:** "SAFE_DEMO_MODE. A single environment flag that disables every surface capable of failing live"

**Source:** `lib/demo-mode.js:1-8`

**Reality:** Demo mode KILLS features, it doesn't harden them:
- Returns 503 for advisor, chat, live data, GPU prices
- The "Demo Mode" badge implies robustness
- Actually means "5 features are disabled so they can't embarrass us"

**Severity:** HIGH  
**Proof:** `lib/demo-mode.js:22-25`

---

## LIE #7: "Production-Ready Auth"

**Claim:** Secure authentication with role-based access

**Reality:** Dev auto-login bypass:
```javascript
// lib/supabase-server.js:46-58
const DEV_AUTOLOGIN_EMAIL = process.env.NODE_ENV === 'development' 
  ? process.env.ADMIN_DEV_AUTOLOGIN_EMAIL : null;

if (DEV_AUTOLOGIN_EMAIL) {
  // BYPASSES normal auth entirely — creates fake session
  return { user: { id: profile.id, email: profile.email }, profile };
}
```

If `ADMIN_DEV_AUTOLOGIN_EMAIL` is set in production (env leak), anyone gets auto-authenticated.

**Severity:** CRITICAL  
**Proof:** `lib/supabase-server.js:9-11`, `lib/supabase-server.js:46-58`

---

## LIE #8: "RLS-Protected Database"

**Claim:** Schema with security policies

**Reality:** RLS explicitly disabled on all HEARST tables:
```sql
-- scripts/hearst-schema.sql:13
-- NOTE: RLS currently disabled on these tables — to be addressed in a separate security wave.
```

All HEARST tables use `service_role` bypass. The `auth-guards.js` comment admits this.

**Severity:** CRITICAL  
**Proof:** `scripts/hearst-schema.sql:13`, `lib/auth-guards.js:6-8`

---

## LIE #9: "Intelligence Layer = Live Data"

**Claim:** "Sprint 2 — Infrastructure Intelligence Layer" with "~140 structured datapoints"

**Source:** `lib/oracle-intelligence/datapoints.js:1-12`

**Reality:** All 140 datapoints are hardcoded JavaScript objects:
```javascript
// lib/oracle-intelligence/datapoints.js:37-50
D('eqx_retail_price_2024', 'equinix', 'datacenter_operator', 'global', '10k', 'tier_1', 
  '2025-02-15', 'high', 'medium', 'pricing', 5,
  { price_retail_colo_kw_month: 165, unit: '$/kW/month' },
  { source_name: 'Equinix FY2024 10-K', ... }),
```

No database. No API. No updates. Static JSON since creation.

**Severity:** CRITICAL  
**Proof:** `lib/oracle-intelligence/datapoints.js` — 326 lines of hardcoded data

---

## LIE #10: "Financial Engine = Institutional-Grade"

**Claim:** "Authorized Calculation Engine. NEVER invent a number."

**Source:** `lib/hearst-calculations.js:1-4`

**Reality:**
1. **Interest-only debt** in projections (no principal amortization)
2. **Wrong preferred return** compounding (compounds on full equity, not unreturned)
3. **Hardcoded occupancy curve** for all scenarios
4. **GPU refresh NOT modeled** (explicitly admitted in code)

The engine presents IRR/NPV/MOIC with decimal precision based on these flaws.

**Severity:** CRITICAL  
**Proof:** `lib/hearst-calculations.js:274-276`, `lib/hearst-calculations.js:692-694`, `lib/hearst-calculations.js:236`, `lib/hearst-calculations.js:412-414`

---

## LIE #11: "Unified Product"

**Claim:** "ORACLE — Decision-support platform"

**Reality:** Two completely independent systems:
1. Brochure/Landing — Static marketing (A3 brochure, pitch deck)
2. Cockpit HEARST — CRM + Simulator

They share no code, no data, no navigation. The README explicitly admits this.

**Severity:** HIGH  
**Proof:** `README.md:5-7`

---

## LIE #12: "Board-Ready Executive Dashboard"

**Claim:** "Everything a Sheikh / QIA / Equinix reviewer needs in 5 seconds"

**Source:** `app/(cockpit)/admin/hearst/executive/page.jsx:4-7`

**Reality:** A 182-line React component that:
- Shows memo counts
- Lists recent reports
- Displays hardcoded "recommended actions"
- Has NO interactive charts
- Has NO drill-down
- Has NO real-time data
- Has NO export functionality

**Severity:** MEDIUM  
**Proof:** `app/(cockpit)/admin/hearst/executive/page.jsx` — 182 lines total

---

## LIE #13: "Cockpit Chat = AI Assistant"

**Claim:** Persistent AI chat with tool use

**Reality:** 
- Chat persistence schema exists (`cockpit_chats`, `cockpit_messages`)
- BUT demo mode disables it (503)
- AND the advisor endpoint requires `ANTHROPIC_API_KEY`
- Tool definitions exist but execution quality unverified

**Severity:** MEDIUM  
**Proof:** `scripts/migrations/2026-05-18_003_cockpit_chat.sql`, `lib/demo-mode.js`

---

## LIE #14: "GPU Catalog = Live Database"

**Claim:** "Catalogue des SKU GPU disponibles (H100, H200, GB200, MI300X, ...)"

**Source:** `scripts/migrations/2026-05-26_004_simulator_extensions.sql`

**Reality:** 
- DB table `hearst_gpu_catalog` exists
- BUT the actual simulator uses hardcoded JS catalog (`lib/hearst-gpu-catalog.js`)
- DB is seeded with 4 SKUs but never updated
- The simulator reducer hardcodes `gpu_sku_id: 'gb200_nvl72'`

**Severity:** MEDIUM  
**Proof:** `lib/hearst-simulator-state.js:27`, `lib/hearst-gpu-catalog.js`

---

## LIE #15: "Source Compliance Tracking"

**Claim:** "Every numeric or qualitative input must link to a source row"

**Reality:** 
- `calcSourceScore()` exists and tracks 12 source_id fields
- BUT the bootstrap process uses `PUBLIC_SOURCES_LIBRARY` (hardcoded JS)
- The archetype defaults are hardcoded in seed SQL
- No enforcement that users actually link sources

**Severity:** MEDIUM  
**Proof:** `lib/hearst-calculations.js:849-860`, `scripts/seed-simulator-2026.sql`
