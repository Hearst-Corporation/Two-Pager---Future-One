# ORACLE_UNUSED_SYSTEMS.md
## Systems That Exist But Are Not Wired

---

## 1. @hearst/cockpit-shell NPM Package

**File:** `hearst-cockpit-shell-0.2.0.tgz` (186KB)  
**Package.json reference:** `"@hearst/cockpit-shell": "file:./hearst-cockpit-shell-0.2.0.tgz"`  
**Status:** Local tarball, not published to npm registry.  
**Usage:** Minimal — layout components may reference it but core functionality is in-repo.  
**Impact:** Creates illusion of published institutional SDK.

---

## 2. @hearst/hub-sdk NPM Package

**File:** `hearst-hub-sdk-0.2.0.tgz` (7KB)  
**Status:** Local tarball.  
**Usage:** Likely minimal — hub functionality is implemented in `app/(cockpit)/admin/hearst/hub/` (which is just a redirect).  
**Impact:** Dead weight.

---

## 3. @hearst/review-mode NPM Package

**File:** `hearst-review-mode-0.1.0.tgz` (28KB)  
**Status:** Local tarball.  
**Usage:** Review mode API routes exist (`app/api/admin/review-mode/`) but integration depth unverified.  
**Impact:** Potentially unused.

---

## 4. Spatial System (Full Implementation)

**Files:**
- `lib/spatial/placeholder-mode.ts` — 56 lines
- `lib/spatial/assets/manifest.ts` — 115 lines
- `components/hearst/visuals/CampusFloorplan2D.jsx`
- `components/hearst/visuals/Campus3DIsometric.jsx`
- `components/hearst/visuals/PowerFlowDiagram.jsx`

**Status:** Placeholder mode is DEFAULT. The 3D components exist but are NOT used because the manifest blocks them.  
**Impact:** Thousands of lines of spatial code that never renders real 3D.

---

## 5. Oracle-Visualization Spec Builders

**Files:** `lib/oracle-visualization/specs.js` (321 lines)  
**Functions:**
- `build2DDiagramSpec()` — Returns floorplan coordinates
- `buildTopologySpec()` — Returns static topology nodes/edges
- `buildDeploymentPhaseSpec()` — Returns Gantt phases

**Status:** Called by memo endpoint but the output is JSON data, not actual rendered diagrams. No consumer renders these specs as SVG/Canvas.  
**Impact:** Specs are generated but never visualized.

---

## 6. LLM Rate Limiter (Database Table)

**File:** `scripts/migrations/2026-05-16_002_llm_rate_buckets.sql`  
**Table:** `public.llm_rate_buckets`  
**Status:** Schema exists. Code uses in-memory Map instead (`app/api/admin/hearst/strategic-memo/route.js:35-51`).  
**Impact:** Database table is unused. Rate limiting is in-memory (lost on restart).

---

## 7. HEARST Advisor Logs (Database Table)

**File:** `scripts/migrations/2026-05-16_001_hearst_advisor_logs.sql`  
**Table:** `public.hearst_advisor_logs`  
**Status:** Schema exists for audit trail.  
**Usage:** Code references logging but actual INSERT frequency unverified.  
**Impact:** May be under-utilized.

---

## 8. Cockpit Chat Persistence

**File:** `scripts/migrations/2026-05-18_003_cockpit_chat.sql`  
**Tables:** `public.cockpit_chats`, `public.cockpit_messages`  
**Status:** Schema exists with RLS policies.  
**Usage:** Chat UI exists (`components/hearst/ChatContainer.jsx`) but disabled in demo mode.  
**Impact:** Full persistence layer for a feature that is often disabled.

---

## 9. Data Room API

**Files:** `app/api/admin/hearst/data-room/`  
**Status:** API routes exist.  
**Usage:** Data room page exists (`/admin/hearst/data-room`) but actual document storage/management unverified.  
**Impact:** May be lightly used.

---

## 10. Contracts API

**Files:** `app/api/admin/hearst/contracts/`  
**Status:** API routes exist.  
**Usage:** Contracts page exists but may be placeholder.  
**Impact:** Unverified.

---

## 11. Sources API + Library

**Files:**
- `app/api/admin/hearst/sources/` — CRUD for intelligence sources
- `app/(cockpit)/admin/hearst/sources/page.jsx` — Sources management UI

**Status:** Full CRUD exists.  
**Usage:** Sources are managed but the actual intelligence layer uses hardcoded `datapoints.js`, NOT the DB sources.  
**Impact:** Two parallel source systems — one in DB (unused by engine), one in JS (used by engine).

---

## 12. Archetype Defaults (DB Table)

**File:** `scripts/migrations/2026-05-26_004_simulator_extensions.sql`  
**Table:** `crm.hearst_archetype_defaults`  
**Status:** Schema exists, seeded with 25 combinations.  
**Usage:** The simulator uses hardcoded `QATAR_PRESETS` in `lib/hearst-simulator-state.js`. The DB table is queried but may not be the primary source.  
**Impact:** DB table may be secondary to hardcoded JS.

---

## 13. Pitch Deck Routes (Multiple)

**Routes:** `/pitch`, `/pitch-datacenter`, `/pitch-hub`, `/pitch-mining`, `/pitch-op-datacenter`, `/pitch-op-hub`, `/pitch-op-mining`  
**Status:** All exist.  
**Usage:** The main `/pitch` is the deck. The `-op-*` variants may be operator-specific decks.  
**Impact:** Multiple pitch routes — some may be unused.

---

## 14. Print Route

**Route:** `/print`  
**Status:** Exists.  
**Usage:** Print-optimized A3 view. May be rarely used.  
**Impact:** Low — just a view variant.

---

## 15. Review Mode API

**Files:** `app/api/admin/review-mode/`, `app/api/admin/review-document/`  
**Status:** Routes exist.  
**Usage:** Document review workflow. Integration with main UI unverified.  
**Impact:** Potentially unused institutional feature.
