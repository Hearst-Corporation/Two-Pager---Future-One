# TICKET — EXPORT-PIPELINE-AUDIT (BLOCKER 4)

**Status:** READY · spec only (no code)
**Priority:** P1 — functional dead-ends
**Opened:** 2026-05-29
**Scope:** every export button, the route it calls, whether that route exists.

---

## Problem

Export buttons on Financial and Documents POST to `/api/admin/hearst/export/*` routes that **do not exist** → clicks fail (404 / non-blob response → blob error).

## Every export button → route → status (verified from code)

| Screen | Button | File:line | Route called | Route file exists? |
|---|---|---|---|---|
| Financial | ⬇ Excel | `financial/page.jsx:96,163` | `POST /api/admin/hearst/export/xlsx` | 🔴 **MISSING** |
| Financial | ⬇ Memo PDF | `financial/page.jsx:96,166` | `POST /api/admin/hearst/export/memo` | 🔴 **MISSING** |
| Documents | Investment Memo | `documents/page.jsx:6,53` | `POST /api/admin/hearst/export/memo` | 🔴 **MISSING** |
| Documents | Term Sheet | `documents/page.jsx:7,53` | `POST /api/admin/hearst/export/term-sheet` | 🔴 **MISSING** |
| Documents | Financial Model | `documents/page.jsx:8,53` | `POST /api/admin/hearst/export/xlsx` | 🔴 **MISSING** |
| Documents | CAPEX Schedule | `documents/page.jsx:9,53` | `POST /api/admin/hearst/export/xlsx` | 🔴 **MISSING** |
| Documents | Lender Package | `documents/page.jsx:10,53` | `POST /api/admin/hearst/export/memo` | 🔴 **MISSING** |
| Documents | One-Pager Teaser | `documents/page.jsx:11,53` | `POST /api/admin/hearst/export/memo` | 🔴 **MISSING** |

**Distinct missing routes (3):** `export/memo`, `export/term-sheet`, `export/xlsx`.
Confirmed absent: no file under `app/api/admin/hearst/export/`.

## The export that DOES work (reference model)

`GET /api/admin/hearst/strategic-memos/[id]/pdf/route.js` — fully functional:
- builds HTML (`buildHtml`, line 124) with data-driven financial SVGs
- renders via **Puppeteer** (`route.js:216-219`, `headless:'new'`)
- returns `Content-Type: application/pdf` (line 224)

This is the proven pattern. The 3 missing routes should follow it (Puppeteer→PDF for memo/term-sheet/lender/one-pager; a sheet lib for xlsx).

## Current behaviour
- Financial: `handleExport()` (line 96) fetches the missing route → non-OK / non-blob → `URL.createObjectURL` on an error body → broken download or thrown error. Button shows spinner then fails silently/with toast.
- Documents: `generate(tpl)` (line 53) same failure; state machine goes idle→loading→error.

## Expected behaviour
Each button returns a downloadable file:
- `export/memo` → PDF (reuse `buildHtml` + Puppeteer from the working route; accept scenario_id in POST body).
- `export/term-sheet` → PDF (shorter template).
- `export/xlsx` → Excel (financial model / CAPEX tabs).

## Notes / scope guardrails
- This ticket **inventories** the gap. Implementation is NOT in scope here (mission = no code).
- The memo/PDF ENGINE must not be changed (mission constraint). New export routes should COMPOSE the existing memo PDF generator, not modify it.
- 6 Documents templates map to only 3 routes — `capex` reuses `xlsx`, `lender-pack`/`one-pager` reuse `memo`. Differentiation (page count, tabs) must be carried in the POST body, not new engines.

## Effort
**Medium.** 3 new API routes. `memo`/`term-sheet`/`one-pager`/`lender` can wrap the existing Puppeteer HTML pipeline (low). `xlsx` needs a sheet generator (medium — new dependency or server-side CSV/xlsx build).

## Dependency
Blocker 3 ([[MEMO-INFORMATION-ARCHITECTURE]]) routes financial-summary export INTO Documents → these routes must exist for that consolidation to hold.

## Acceptance criteria
- All 8 buttons produce a valid file download (no 404).
- `export/memo` reuses the existing memo PDF generator (no engine fork).
- Failure states surface a clear error, not a corrupt blob.
- Build green.
