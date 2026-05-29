# ORACLE_BROKEN_FLOWS.md
## User Flows That Fail, Mislead, or Don't Work As Claimed

---

## 1. MEMO GENERATION → PERSISTENCE (Fragile Flow)

**Flow:** User clicks "Generate Memo" → API call → LLM generates → DB persists

**Broken at:**
```javascript
// app/api/admin/hearst/strategic-memo/route.js:477-490
let persisted = null;
try {
  persisted = await persistMemo({...});
} catch (e) {
  persisted = { error: e?.message || 'persist_failed' };
}

return NextResponse.json({
  memo,
  persisted,  // May contain { error: ... }
  ...
});
```

**Problem:** DB failure is caught but the user receives the memo anyway. The memo is "not lost" but also not persisted. The UI may not clearly show the persistence failure.

**Severity:** HIGH  
**Proof:** `app/api/admin/hearst/strategic-memo/route.js:477-490`

---

## 2. SIMULATOR → PROJECTION → REALITY (False Precision)

**Flow:** User inputs MW/capital/archetype → API calculates → Returns IRR/NPV/MOIC

**Broken at multiple points:**

### A. Interest-Only Debt Service
```javascript
// lib/hearst-calculations.js:274-276
const yearly_debt_service = (debt_amount && debt_interest_rate)
  ? debt_amount * ((debt_interest_rate || 0) / 100)  // INTEREST ONLY
  : null;
```
The projection uses simple interest calculation, NOT the amortization schedule from `generateDebtSchedule()`. DSCR is computed with wrong debt service.

### B. Wrong Preferred Return
```javascript
// lib/hearst-calculations.js:692-694
hearst_pref_accrued = (hearst_pref_accrued + hearst_equity_in) * PREF_RATE;
```
Compounds on FULL equity every year. Should compound on UNRETURNED equity only.

### C. Hardcoded Occupancy
```javascript
// lib/hearst-calculations.js:236
const ramp = [0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95];
```
Same curve for Qatar sovereign AI, US hyperscale, and European colo.

**Severity:** CRITICAL  
**Proof:** `lib/hearst-calculations.js:236,274-276,692-694`

---

## 3. DEMO MODE → "SAFE" PRESENTATION (Deceptive Flow)

**Flow:** Enable SAFE_DEMO_MODE → Present to investors → Features "work"

**Broken at:**
```javascript
// lib/demo-mode.js
export const DEMO_DISABLED_RESPONSE = {
  error: 'disabled_in_demo_mode',
  message: 'This surface is disabled...',
};
```

**What happens:**
1. Advisor button → 503 error (hidden by badge)
2. Chat button → 503 error (hidden by badge)
3. Live data refresh → 503 error
4. GPU prices → 503 error

**The "Demo Mode" badge implies robustness. It actually means "5 features are killed so they can't fail."**

**Severity:** HIGH  
**Proof:** `lib/demo-mode.js`, `app/api/admin/hearst/advisor/route.js` (demo check)

---

## 4. AUTH → DEV BYPASS → PRODUCTION LEAK (Security Flow)

**Flow:** Developer sets `ADMIN_DEV_AUTOLOGIN_EMAIL` → Deploys → Env var leaks → Anyone can access

**Broken at:**
```javascript
// lib/supabase-server.js:9-11
const DEV_AUTOLOGIN_EMAIL = process.env.NODE_ENV === 'development' 
  ? process.env.ADMIN_DEV_AUTOLOGIN_EMAIL : null;
```

**Problem:** The check is `NODE_ENV === 'development'`. If a production deployment accidentally has `NODE_ENV=development` OR if the env var is set in production, the bypass activates.

**Severity:** CRITICAL  
**Proof:** `lib/supabase-server.js:9-11`, `lib/supabase-server.js:46-58`

---

## 5. INTELLIGENCE LAYER → MEMO (Static Data Flow)

**Flow:** Simulator sends scenario → Intelligence layer enriches → Memo has "live" data

**Broken at:**
```javascript
// lib/oracle-intelligence/datapoints.js — ALL 140 datapoints are hardcoded
D('eqx_retail_price_2024', 'equinix', ..., '2025-02-15', ...,
  { price_retail_colo_kw_month: 165, ... })
```

The "intelligence brief" is a static JSON file. The memo claims "live intelligence" but the data is:
- Hardcoded
- Months old (timestamps like '2025-02-15')
- Never updated
- Sourced from public filings, not APIs

**Severity:** CRITICAL  
**Proof:** `lib/oracle-intelligence/datapoints.js` (326 lines)

---

## 6. GPU PRICING → MEMO (Failed Live Data Flow)

**Flow:** Memo requests GPU pricing → Scraper fetches live data → Returns to memo

**Broken at:**
```javascript
// lib/oracle-live/providers/coreweave.js:40-84
export async function fetchProviderCoreWeave(sku) {
  return {
    status: 'unavailable',
    price_usd_hour: null,
    notes: 'no public pricing endpoint — CoreWeave uses enterprise quote flow',
  };
}
```

CoreWeave ALWAYS returns unavailable. Lambda scraping is fragile. The memo receives static anchors, not live data.

**Severity:** HIGH  
**Proof:** `lib/oracle-live/providers/coreweave.js`, `lib/oracle-live/providers/lambda.js`

---

## 7. COCKPIT TEMPLATE → PRODUCTION (Exposed Flow)

**Flow:** User navigates to `/admin/cockpit-template`

**Broken at:**
```jsx
// app/admin/cockpit-template/page.jsx
export default function CockpitTemplatePage() {
  return (
    <div>
      <div>Titre de la page</div>
      <p>Remplacez ce contenu par vos composants.</p>
      <div>KPI 1 —</div>
      <div>KPI 2 —</div>
    </div>
  );
}
```

No route guard. No auth check. No exclusion from production. Raw template with French placeholder text is accessible.

**Severity:** MEDIUM  
**Proof:** `app/admin/cockpit-template/page.jsx`

---

## 8. SHARED WORKSPACE → DATA INTEGRITY (Collaboration Flow)

**Flow:** Editor A edits operator → Editor B edits same operator → Data loss

**Broken at:**
```javascript
// lib/auth-guards.js:146
if (allowSharedWorkspace) return row;
```

All core tables use `allowSharedWorkspace: true`. There is NO optimistic locking. NO edit timestamps. NO conflict detection. Last write wins.

**Severity:** HIGH  
**Proof:** `lib/auth-guards.js:10-21`, `lib/auth-guards.js:146`

---

## 9. HEARST BRIEF TODAY → HARDCODED SCENARIO (Misleading Flow)

**Flow:** User opens `/admin/hearst` → Sees "Today's Brief"

**Broken at:**
```javascript
// app/(cockpit)/admin/hearst/page.jsx:53-62
fetch('/api/admin/hearst/simulate', {
  method: 'POST',
  body: JSON.stringify({
    input_mode: 'mw_first',
    input_value: { total_mw: 50 },     // HARDCODED
    archetype_id: 'powered_shell',      // HARDCODED
    geography: 'qatar',                 // HARDCODED
  }),
})
```

The "Today" panel ALWAYS runs Qatar 50MW powered_shell. It does NOT reflect the user's actual project, active scenario, or saved data.

**Severity:** MEDIUM  
**Proof:** `app/(cockpit)/admin/hearst/page.jsx:53-62`

---

## 10. RLS DISABLED → DIRECT DB ACCESS (Security Flow)

**Flow:** API uses service_role → Bypasses RLS → Direct table access

**Broken at:**
```sql
-- scripts/hearst-schema.sql:13
-- NOTE: RLS currently disabled on these tables
```

```javascript
// lib/auth-guards.js:6-8
// Every app/api/admin/** route is reached through service_role
// (see lib/supabase-admin.js → getAdminClient), which BYPASSES RLS.
```

If the service_role key leaks, the entire database is exposed. No RLS = no defense in depth.

**Severity:** CRITICAL  
**Proof:** `scripts/hearst-schema.sql:13`, `lib/auth-guards.js:6-8`

---

## 11. SOURCES DB → INTELLIGENCE ENGINE (Disconnected Flow)

**Flow:** User adds source in `/admin/hearst/sources` → Source appears in memos

**Broken at:** The intelligence engine uses `lib/oracle-intelligence/datapoints.js` (hardcoded), NOT the DB sources table.

**Two parallel systems:**
1. DB sources table — managed by UI, unused by engine
2. Hardcoded datapoints.js — used by engine, not editable by users

**Severity:** HIGH  
**Proof:** `lib/oracle-intelligence/datapoints.js`, `app/(cockpit)/admin/hearst/sources/page.jsx`

---

## 12. SPATIAL VISUALIZATION → PLACEHOLDER (Broken Promise Flow)

**Flow:** User expects 3D campus view → Sees placeholder

**Broken at:**
```typescript
// lib/spatial/placeholder-mode.ts
// By design, placeholder mode ON (fail-safe default).
```

The spatial system is DESIGNED to show placeholders. The 3D components exist but the manifest blocks them.

**Severity:** HIGH  
**Proof:** `lib/spatial/placeholder-mode.ts`, `lib/spatial/assets/manifest.ts`

---

## 13. DEBT SCHEDULE → PROJECTION (Disconnected Flow)

**Flow:** `generateDebtSchedule()` creates amortization → Projection uses it

**Broken at:** The projection uses `yearly_debt_service = debt_amount * interest_rate` (interest-only), NOT the amortization schedule.

```javascript
// lib/hearst-calculations.js:274-276 (projection)
const yearly_debt_service = (debt_amount && debt_interest_rate)
  ? debt_amount * ((debt_interest_rate || 0) / 100)
  : null;

// vs generateDebtSchedule() which computes proper French annuity
// BUT the projection never calls it
```

**Severity:** CRITICAL  
**Proof:** `lib/hearst-calculations.js:274-276` vs `lib/hearst-calculations.js:529-617`

---

## 14. WATERFALL → PREFERRED RETURN (Mathematically Wrong Flow)

**Flow:** `generateWaterfall()` distributes cash → Preferred return calculated

**Broken at:**
```javascript
// lib/hearst-calculations.js:692-694
hearst_pref_accrued = (hearst_pref_accrued + hearst_equity_in) * PREF_RATE;
```

This adds the FULL equity invested to the accrued preference every year, then compounds. Correct formula: `(hearst_pref_accrued + hearst_equity_in - hearst_pref_paid) * PREF_RATE`.

**Severity:** CRITICAL  
**Proof:** `lib/hearst-calculations.js:692-694`
