# ORACLE — NAVIGATION & DECISION-FLOW CORRECTION PACKAGE

**Date:** 2026-05-29 · **Status:** specification package, no code written
**Inputs:** Product Architecture Audit (accepted) → 4 blockers
**Constraint:** no new features. Connect the product; don't grow it.

---

## 1. EXECUTIVE SUMMARY (1 page)

ORACLE's screens are individually production-ready, but the product is **disconnected at four seams**. None require new functionality — all four are wiring/navigation defects that make a finished product feel broken to a decision-maker.

1. **Login lands in the wrong product.** A user who signs in arrives at `/admin` (the legacy DevHub), not ORACLE. The default destination `'/admin'` is hardcoded in 4 places with no single source of truth. *(P0)*

2. **The two board screens are invisible.** `Executive` (the 5-second overview) and `Dossier` (the full memo reader) are in **no navigation surface** — provably orphaned (the bottom-bar Library group's `matchAny` omits both). The product hides exactly what the CEO came to see. *(P0)*

3. **The memo experience is fragmented across four screens.** Library, Reports, Dossier, Documents overlap. The code already treats **Dossier as canonical** (others link into it), so this is a labelling/nav problem, not a data problem — plus one true merge (Reports → Documents). *(P1)*

4. **Export buttons dead-end.** Eight export buttons across Financial and Documents POST to three routes (`export/memo`, `export/term-sheet`, `export/xlsx`) that **do not exist**. A proven Puppeteer PDF pattern already exists (`strategic-memos/[id]/pdf`) to model them on. *(P1)*

**Bottom line:** two P0 navigation fixes (tiny surface, huge first-impression impact) unblock the CEO journey end-to-end; two P1 fixes (memo IA + exports) close the analyst's decision loop. Together they turn "a simulator with orphaned deliverables" into "a connected decision flow" — with zero new features.

---

## 2. THE 4 TICKET DOCUMENTS

| # | Ticket | Blocker |
|---|---|---|
| 1 | [LOGIN-REDIRECT-CORRECTION.md](LOGIN-REDIRECT-CORRECTION.md) | Login → wrong product |
| 2 | [EXECUTIVE-DOSSIER-PROMOTION.md](EXECUTIVE-DOSSIER-PROMOTION.md) | Board screens orphaned |
| 3 | [MEMO-INFORMATION-ARCHITECTURE.md](MEMO-INFORMATION-ARCHITECTURE.md) | Memo fragmentation |
| 4 | [EXPORT-PIPELINE-AUDIT.md](EXPORT-PIPELINE-AUDIT.md) | Export dead-ends |

---

## 3. PRIORITY ORDER

1. **Ticket 1 — Login redirect** (P0). Nothing else matters if the user never reaches ORACLE.
2. **Ticket 2 — Executive/Dossier promotion** (P0). Depends on Ticket 1's landing constant.
3. **Ticket 3 — Memo IA** (P1). Depends on Ticket 2's nav re-pointing.
4. **Ticket 4 — Export pipeline** (P1). Independent of 1–3; needed for Ticket 3's "export hub" to fully hold.

Recommended sequence: **1 → 2 → 3**, with **4 in parallel** (no shared files with 1–3).

---

## 4. ESTIMATED EFFORT

| Ticket | Surface | Effort | Notes |
|---|---|---|---|
| 1 — Login | 4 one-line edits + 1 constant | **XS** | login page, callback, middleware ×2 |
| 2 — Promotion | 2 nav config files | **S** | OracleBottomBar.jsx, HearstLeftRail.jsx |
| 3 — Memo IA | nav re-point + retire Reports from nav | **S** | no data model change |
| 4 — Exports | 3 new API routes | **M** | memo/term-sheet wrap existing Puppeteer; xlsx needs sheet lib |

Total: roughly **one focused sprint**, dominated by Ticket 4's xlsx generator.

---

## 5. DEPENDENCIES

```
Ticket 1 (login constant ORACLE_HOME)
   └─▶ Ticket 2 (uses ORACLE_HOME as landing; promotes Executive/Dossier)
          └─▶ Ticket 3 (Library group → Dossier canonical; Reports retired)
                 └─▶ relies on ─▶ Ticket 4 (export routes exist for Documents hub)
Ticket 4  ── independent file set ──  can start immediately, in parallel
```

- T2 needs T1's shared landing constant.
- T3 needs T2's nav re-pointing to be in place.
- T3's "Reports → Documents" consolidation needs T4's routes to exist.
- T4 shares no files with T1–T3 → parallelisable.

---

## 6. RISK IF IGNORED

| Ticket | Risk if not fixed |
|---|---|
| 1 — Login | Every first session starts in the wrong product. Demo/board risk: a Minister logs in and sees a DevHub task list. **Credibility loss on contact.** |
| 2 — Promotion | The CEO experience the product was built for is unreachable. The best assets (Executive, Dossier) appear not to exist. **Perceived as unfinished.** |
| 3 — Memo IA | Users distrust which report is "the real one"; status workflow, financial summary, and narrative scatter. **Decision confidence erodes.** |
| 4 — Exports | The decision loop cannot close — no board pack leaves the tool. Analysts model, then **hit a wall at "share it."** Silent failures look like bugs. |

---

## CRITICAL RULE (honoured)
No code. No commits. No route changes. No UI changes. No recommendations beyond these four blockers. This package is specification only — the final navigation-and-flow correction plan before any further architecture work.
