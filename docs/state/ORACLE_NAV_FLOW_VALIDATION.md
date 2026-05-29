# ORACLE — NAV & DECISION-FLOW VALIDATION (B1–B4)

**Date:** 2026-05-29 · **Mode:** validation only (no new feature work)
**Verdict:** ✅ All four blockers from the NAV-FLOW-CORRECTION-PACKAGE are **already implemented and verified**.

The decision-flow correction was delivered by `981f530 fix(nav): route users into ORACLE
executive decision flow` (on `main`) and refined by the cockpit hardening on branch
`chore/tri-cleanup-security`. This document records the runtime evidence; no new
navigation code was written for this sprint (re-implementing would violate the
"connect the product, don't grow it" rule).

---

## Evidence

### Build
- `npm run build` → **exit 0**, "✓ Compiled successfully". All routes present:
  `/admin/hearst/executive`, `/dossier`, `/library`, `/financial`, `/documents`,
  `/api/admin/hearst/strategic-memos/[id]/pdf`.

### B1 — Login lands in ORACLE (not legacy /admin)
- `ORACLE_HOME = '/admin/hearst/executive'` defined once in `lib/url-helpers.js`.
- `app/admin/login/page.jsx` → `next = safeNextPath(sp.get('next'))` (falls back to ORACLE_HOME).
- `app/admin/auth/callback/route.js` → `safeNextPath(...)`.
- `middleware.js:95,121` → both bounces use `ORACLE_HOME`; subdomain rewrite → `/admin/hearst/executive`.
- **Runtime:** `/admin/hearst` → 307 → `/admin/hearst/executive`. Unauthenticated `/admin/hearst/executive` → 307 → login. No hardcoded `'/admin'` default remains.

### B2 — Executive + Dossier reachable from primary nav
- Bottom bar (`components/OracleBottomBar.jsx`) slots = **Executive · Simulator · Hub · Dossier** — both board screens are ≤1-click primary slots, with active-state highlight.
- Canonical `.ct-bottom-bar` structure (ported from the reference Cockpit), label "Cockpit".
- *Note:* the legacy `HearstLeftRail` favourites overlay was removed (it stacked on the package-native `.ct-rail-left`); the bottom bar is the single nav surface.

### B3 — Memo destination clarity (Dossier canonical)
- **Runtime click-path validated:** Library → click "Qatar 50MW Opus Test" → lands on
  `/admin/hearst/dossier?memo=3ace5cee-…` with the correct memo's full 11-section reader rendered.
- All 15 Library titles link to `/admin/hearst/dossier?memo=<id>`; scenario cells → `?scenario=<id>`.
- Reports is not a peer nav slot (grouped under the Dossier group's `matchAny`).

### B4 — No export dead-ends
- **Runtime:** a real memo PDF downloaded (`oracle-memo-qatar-50mw-opus-test-v1.pdf`); the per-memo
  PDF route returns `200 application/pdf`.
- `financial/page.jsx`: Excel button `disabled` ("not available yet"); memo export → Dossier PDF link.
- `documents/page.jsx`: Investment Memo → "Open in Dossier"; Term Sheet / Financial Model / CAPEX /
  Lender / One-Pager → "Not available yet". **Zero POST to a missing `export/*` route; zero 404; no fake success.**

### Guardrails honoured
- `visuals-preview` reachable only by URL (200), absent from all nav `matchAny` → hidden. ✓
- Spatial system / Spatial Composer / CampusScene / Three.js / GLB / intelligence layer / live data layer: **untouched**. ✓
- Financial engine (`lib/hearst-calculations.js`, `lib/hearst-deal-structures.js`,
  `lib/hearst-gpu-catalog.js`): restored byte-identical to `main` — **not modified** by this work. ✓

---

## Remaining (out of this sprint, optional)
- True server-side exports (Term Sheet / xlsx) — currently honestly disabled per EXPORT-PIPELINE-AUDIT; would require new routes (deferred; "no new export engine" constraint).
- Local dev-server static-chunk serving is flaky after a build↔dev `.next` churn; production
  build (exit 0) confirms chunks are valid — a dev-runtime artifact, not an app defect.
