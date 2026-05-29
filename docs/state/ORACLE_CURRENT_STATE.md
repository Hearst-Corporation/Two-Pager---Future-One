# ORACLE_CURRENT_STATE.md — independent reconciliation

**Verified:** 2026-05-29 · fresh agent · facts only, no recommendations.
**Trust basis:** current code, live DB (`crm` schema), live runtime (`localhost:5005`), build output. Reports/tickets/screenshots/commit-messages NOT trusted.

---

## PHASE 1 — RECONCILIATION (facts)

| # | Item | Verified value |
|---|---|---|
| 1 | Current branch | `main` |
| 2 | HEAD SHA | `a0d005b02763ca09fa351a755dd0d26bf30aef4e` |
| 3 | origin/main SHA | `a0d005b…` — **HEAD == origin/main (synced)** |
| 4 | Uncommitted tracked | **0** (63 untracked artefacts = loose PNG screenshots at repo root) |
| 5 | Build | `✓ Compiled successfully` · **84/84 static pages**. (`TypeError …'os'` is a benign Next lockfile-patch warning, not a failure.) |
| 6 | Runtime | `next dev` boots on **:5005** in ~2s; key API routes respond 200 (see Phase 5) |
| 7 | Database | Live. Tables in **`crm` schema** (NOT `public`). Real data present. |
| 8 | Feature flags | `NEXT_PUBLIC_VISUAL_PLACEHOLDER_MODE` **absent** → placeholder mode ON (fail-safe). `NEXT_PUBLIC_SAFE_DEMO_MODE` **absent** → demo badge OFF. `ADMIN_DEV_AUTOLOGIN_EMAIL` set. |
| 9 | Routes | 23 ORACLE pages under `/admin/hearst/*`; 56 API routes; plus legacy `/admin/*` + marketing `/pitch*`,`/rdc*`,`/brochure` (separate products in same repo). |
| 10 | Navigation | Bottom bar = 4 groups (Brief·Simulator·Hub·Library). Left rail = 16 favourite destinations. |

### Database reality (live, `crm` schema, project `zrvlmhuymhyrzonnihce`)
| Table | Rows |
|---|---|
| hearst_projects | **1** (name="HEARST Qatar AI & Data Center Hub", country=Qatar) |
| hearst_scenarios | **31** |
| strategic_memos | **15** (all `draft`; providers: claude-opus-4-8, gpt-4o) |
| hearst_deals | **3** |
| hearst_data_room | **26** |
| hearst_market_signals | **42** |
| hearst_gpu_catalog | **4** |
| hearst_contracts | **0** (empty) |
| hearst_pipeline | **0** (empty) |
| hearst_sources | **1** |

> ⚠️ **Important correction of prior belief:** the MCP-default Supabase project in the global config (`pjwyntugyswabgpavtyt`) has **zero hearst tables**. The app actually uses `zrvlmhuymhyrzonnihce`, and the hearst tables live in the **`crm` schema**, not `public`. Any audit that queried `public.hearst_*` would wrongly conclude "no data". Runtime proves the data is real.

### What exists / what is real / placeholder / quarantined / dead / demo / production-facing

- **Real & production-facing:** 22 functional `/admin/hearst/*` screens backed by live `crm` tables; the financial engine (`/api/.../simulate` → 200); the memo PDF generator (`strategic-memos/[id]/pdf` → 200, Puppeteer).
- **Placeholder (by design):** all 7 spatial visuals render `SpatialPlaceholder` (placeholder mode ON). See ORACLE_SPATIAL_READINESS_AUDIT.
- **Quarantined:** `components/hearst/visuals/_quarantine/` — 7 legacy SVG renderers + README. Imported nowhere.
- **Dead/broken at runtime:** `export/memo`, `export/xlsx`, `export/term-sheet` → **404** (referenced by Documents + Financial). `hub` page = 9-line redirect stub. `profile` = 11-line stub.
- **Demo-only:** `DEMO_SCENARIOS`/`DEMO_PHASES` in `visuals-preview` (gated "not for presentation"); imported by no other screen.
- **Empty data (not broken, just unseeded):** contracts, pipeline, sources screens render but have ~0 rows.
- **Separate products in repo (not ORACLE):** legacy DevHub `/admin/*` (initiatives/operators/workstreams); marketing `/pitch*`,`/brochure`,`/rdc*`.
