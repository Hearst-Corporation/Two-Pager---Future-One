# ORACLE_DEAD_CODE.md
## Code That Exists But Does Nothing

---

## 1. CASCADE ARRAY (Display-Only)

**File:** `lib/hearst-memo-job-store.js:25`
```javascript
const CASCADE = ['kimi-k2.6', 'kimi-k2.5', 'glm-5', 'minimax-m2.5'];
```
**Status:** NEVER used for actual API calls. Only stored in job state for UI display.  
**Impact:** Users see "cascade" progress but only ONE model is ever called.

---

## 2. estimateCurrentStage() (Removed but Referenced)

**File:** `lib/hearst-memo-job-store.js:236-239`
```javascript
// estimateCurrentStage() retiré au Sprint 3.2 — c'était une heuristique
// cliente (25s par modèle) qui mentait sur la vraie position dans la cascade
```
**Status:** Comment admits the feature was removed because it lied.  
**Impact:** Historical dead code reference.

---

## 3. Oracle-Visualization Index (Wrong Module System)

**File:** `lib/oracle-visualization/index.js`
```javascript
const { build2DDiagramSpec, buildTopologySpec, buildDeploymentPhaseSpec } = require('./specs');
module.exports = { ... };
```
**Status:** Uses CommonJS (`require`) in an ESM codebase. Never imported correctly.  
**Impact:** The actual route imports directly from `./specs.js` or uses the functions from `oracle-visualization/specs.js`.

---

## 4. @hearst NPM Packages (Local Tarballs)

**Files:**
- `hearst-cockpit-shell-0.2.0.tgz`
- `hearst-hub-sdk-0.2.0.tgz`
- `hearst-review-mode-0.1.0.tgz`

**Status:** Referenced in `package.json` as `file:./hearst-*.tgz`. Not published to npm.  
**Impact:** Creates illusion of published SDKs. Just local tarballs.

---

## 5. Scoring Model Placeholders

**File:** `lib/oracle-system-prompt.js:331`
```javascript
// ── Scoring model placeholders (framework only — no full impl yet) ──
```
**Status:** Framework exists but no implementation.  
**Impact:** Prompt references scoring that doesn't exist.

---

## 6. GPU Pricing Fallback Chain (Never Reached)

**File:** `lib/oracle-live/index.js:35-46`
```javascript
export async function getGpuPricingBrief(ctx) {
  try {
    const mod = await import('./gpu-pricing.js');
    if (typeof mod.getGpuPricingBrief === 'function') {
      return mod.getGpuPricingBrief(ctx);
    }
  } catch (_err) {
    // gpu-pricing.js not yet available — fall through
  }
  return mu('gpu_pricing', ...);
}
```
**Status:** `gpu-pricing.js` ALWAYS exists now. The fallback to `markUnavailable` is dead code.  
**Impact:** Misleading architecture comment suggests modularity that doesn't exist.

---

## 7. Energy Brief Fallback (Never Reached)

**File:** `lib/oracle-live/index.js:60-71`
```javascript
export async function getEnergyBrief(ctx) {
  try {
    const mod = await import('./energy.js');
    if (typeof mod.getEnergyBrief === 'function') {
      return mod.getEnergyBrief(ctx);
    }
  } catch (_err) {
    // energy.js not yet available — fall through
  }
  return mu('energy_tariff', ...);
}
```
**Status:** `energy.js` ALWAYS exists. Fallback is dead code.

---

## 8. Infrastructure Signals Fallback (Never Reached)

**File:** `lib/oracle-live/index.js:85-95`
```javascript
export async function getInfrastructureSignals(ctx) {
  try {
    const mod = await import('./infra-signals.js');
    if (typeof mod.getInfrastructureSignals === 'function') {
      return mod.getInfrastructureSignals(ctx);
    }
  } catch (_err) {
    // infra-signals.js not yet available — fall through
  }
  return [];
}
```
**Status:** `infra-signals.js` ALWAYS exists. Fallback is dead code.

---

## 9. Build Placeholder API Keys

**File:** `lib/llm/kimi.ts:25,35,43`
```typescript
apiKey: process.env.HYPERCLI_API_KEY || "build-placeholder",
apiKey: process.env.ANTHROPIC_API_KEY || "build-placeholder",
apiKey: process.env.OPENAI_API_KEY || "build-placeholder",
```
**Status:** Fallback strings that will cause runtime failures if env vars are missing.  
**Impact:** Build succeeds but runtime fails. Dead code paths in production.

---

## 10. Cockpit-Template Page

**File:** `app/admin/cockpit-template/page.jsx`
```jsx
export default function CockpitTemplatePage() {
  return (
    <div>
      <div>Titre de la page</div>
      <p>Remplacez ce contenu par vos composants.</p>
      {/* Exemple de grille KPI */}
      {['KPI 1', 'KPI 2', 'KPI 3', 'KPI 4'].map(label => (
        <div key={label}>
          <div>{label}</div>
          <div>—</div>
        </div>
      ))}
    </div>
  );
}
```
**Status:** Raw template with French placeholder text. Accessible in production.  
**Impact:** Unprofessional exposure. No route guard excludes it.

---

## 11. TODO: persist discount_rate_pct

**File:** `lib/hearst-calculations.js:333`
```javascript
// TODO: persist discount_rate_pct on hearst_scenarios in a later wave
```
**Status:** Comment from prior development. Feature not implemented.  
**Impact:** `discount_rate_pct` is read from scenario but not persisted in schema.

---

## 12. TODO: relax advisor tool trigger

**File:** `app/api/admin/hearst/advisor/route.js:461`
```javascript
// TODO: relax to only trigger when both turns are pure-read tools — current
```
**Status:** Incomplete optimization.  
**Impact:** Minor — advisor may trigger more often than needed.

---

## 13. RDC-3D and RDC-Photos Routes

**Files:** `app/rdc-3d/`, `app/rdc-photos/`
**Status:** Exist but unverified. May be empty or placeholder.  
**Impact:** Unknown — not audited in depth.

---

## 14. hearst_market_signals Table (Referenced, Never Created)

**Status:** Referenced in code comments but no DDL exists.  
**Impact:** Code may reference a table that doesn't exist.

---

## 15. active_scenario_id FK (Commented/Disabled)

**File:** `scripts/hearst-schema.sql`
```sql
active_scenario_id      uuid,
-- FK intentionally omitted: fresh DBs may not have scenarios yet
```
**Status:** No foreign key constraint.  
**Impact:** Data integrity risk.
