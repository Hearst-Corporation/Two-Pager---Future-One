# ORACLE_DECISION_FLOW_AUDIT.md

**Verified:** 2026-05-29 · live runtime endpoint tests + nav code. Facts only.

## Traced flow: Login → Dashboard → Simulator → Generate → Memo → Library → Dossier → PDF

| Step | Path | Runtime result | Clicks from prior | Notes |
|---|---|---|---|---|
| Login | `/admin/login` → default `next='/admin'` | redirects to **legacy DevHub**, not ORACLE | 1 | 🔴 **wrong product** (default `/admin`, hardcoded in login:22 + middleware:95/121) |
| Dashboard | `/admin/hearst` (Brief) | 200, real deals/health/signals | manual URL | reachable via bottom-bar once in ORACLE |
| Simulator | `/admin/hearst/simulator` | 200; `POST /simulate` → **200** | 1 (bottom bar) | engine works |
| Generate | memo job (async) from Simulator | job → `strategic_memos` row created | 1 | works; 15 memos exist |
| Memo (read) | `/admin/hearst/dossier?memo=…` | 200, 11-section render | 1 (link) | Dossier is canonical reader |
| Library | `/admin/hearst/library` | 200, 15 memos table | 1 (bottom bar) | titles link INTO dossier |
| Dossier | `/admin/hearst/dossier` | 200 | 🔴 **orphan** (no nav entry) | reachable only via in-content links or typed URL |
| PDF | `strategic-memos/[id]/pdf` | **200** (Puppeteer) | 1 (link) | the export that works |

## Defects (verified at runtime)

| Type | Detail |
|---|---|
| 🔴 Dead end | `POST export/memo` → **404**, `export/xlsx` → **404**, `export/term-sheet` → **404**. Financial "Excel/Memo PDF" buttons and all 6 Documents templates fail. |
| 🔴 Orphan screen | **Dossier** and **Executive** in no nav (rail `ALL_DESTINATIONS` + bottom-bar `matchAny` both omit them). |
| 🔴 Break (entry) | Login lands in legacy `/admin`, not ORACLE. |
| 🔁 Loop / duplicated destination | Memo viewing reachable from Library, Reports, Dossier, Documents — 4 doors, 1 canonical (Dossier). |
| ⚠️ Redundant clicks | Reports export = browser Print dialog (vs one-click PDF that exists for memos). |
| ⚠️ State gap | All 15 memos are `draft` → Executive "Approved" KPI = 0; no approved board pack exists yet (data state). |

## Working spine (verified 200)
`Simulator → /simulate → save scenario → generate memo → Dossier → memo PDF` is **end-to-end functional**. The breaks are at the **edges**: entry (login redirect), discoverability (orphans), and bulk export (export/* 404) — not in the core compute→narrative chain.
