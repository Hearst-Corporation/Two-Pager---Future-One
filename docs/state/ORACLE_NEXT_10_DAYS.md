# ORACLE_NEXT_10_DAYS.md — final synthesis

**Verified:** 2026-05-29 · grounded only in current reality (code/DB/runtime). No features, no redesign, no roadmap fantasy.

---

## 1. DO NOT TOUCH
- **Financial engine** (`/api/.../simulate`, `lib/hearst-bootstrap.js`) — works (200), out of scope.
- **Memo generator + PDF** (`strategic-memos`, `strategic-memos/[id]/pdf`) — works (200, Puppeteer). Reuse, don't fork.
- **Spatial layer** (`lib/spatial`, `components/hearst/visuals`) — inert, gated, safe. Do not start CampusScene/Three.js/assets.
- **Live `crm` DB** — real data (31 scenarios, 15 memos, 42 signals). Do not reseed/migrate.
- **Cockpit shell / Kimi chat rail** — functioning.

## 2. DELETE
- **Nothing functional.** No deletions justified by current reality.
- Optional housekeeping (not urgent): the 63 loose PNG screenshots at repo root are untracked clutter — can be ignored/gitignored, not committed. Not code.
- `_quarantine/` legacy visuals: **keep** (inert, documented; deletion has no benefit and loses reference).

## 3. REFACTOR (small, justified by verified defects)
- **Login default destination**: one shared constant instead of `/admin` hardcoded in 4 places (login:22, middleware:95/121, callback). → lands in ORACLE.
- **Nav config**: add `dossier` + `executive` to `HearstLeftRail.ALL_DESTINATIONS` and to bottom-bar `matchAny`; point Library group's primary at the canonical reader. (2 files: `OracleBottomBar.jsx`, `HearstLeftRail.jsx`.)
- **Executive project-name fallback** (P1, cosmetic): same DB-bound pattern already applied to Reports in `3063057`.

## 4. BUILD NEXT (only to close existing dead-ends — not new features)
- **The 3 missing export routes**: `export/memo`, `export/term-sheet`, `export/xlsx` (all 404 live). `memo`/`term-sheet` should COMPOSE the existing memo-PDF pipeline (no engine fork). `xlsx` needs a sheet generator. This is the single largest gap between "simulator" and "delivers a board pack".

## 5. BLOCKERS
- 🔴 **Export 404 ×3** — Documents + Financial exports non-functional. Blocks "share the decision".
- 🔴 **Login → legacy product** — every fresh session starts in the wrong app.
- 🔴 **Executive & Dossier orphaned** — best board screens unreachable from nav.
- 🟠 **0 approved memos** — all 15 are `draft`; Executive "Approved" = 0. A demo needs ≥1 approved memo (data action, not code).
- 🟠 **Empty tables** — contracts (0), pipeline (0), sources (1): those screens look empty in a demo.

## 6. DEMO RISKS
- **Login lands in DevHub** → a stakeholder sees an internal task list, not ORACLE. Fix entry first.
- **Clicking any export → 404** → looks broken on stage. Avoid Documents/Financial export buttons until routes exist, or disable them.
- **Executive/Dossier require typed URLs** → presenter must know the path; not discoverable.
- **"Approved: 0" on the board KPI** → approve at least one memo before a board demo.
- **Empty Contracts/Pipeline/Sources** → either seed a few rows or keep the demo path on Simulator→Dossier (the proven 200 spine).
- **MCP/Supabase config mismatch** → the global config points at a project WITHOUT hearst tables; only `.env.local` (`zrvlmhuymhyrzonnihce`, `crm` schema) is correct. Don't debug against the wrong DB.

---

### One-line truth
ORACLE today is a **working simulator-to-memo engine** with a **real database**, whose value is **gated behind a wrong-entry login, two orphaned board screens, and three 404 export routes**. The next 10 days are about **connecting what already works**, not building more.
