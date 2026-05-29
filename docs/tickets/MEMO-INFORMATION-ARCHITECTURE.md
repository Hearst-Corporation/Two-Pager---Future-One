# TICKET — MEMO-INFORMATION-ARCHITECTURE (BLOCKER 3)

**Status:** READY · spec only (no code)
**Priority:** P1 — fragmentation, not breakage
**Opened:** 2026-05-29
**Scope:** 4 screens expose overlapping memo/report content. Define ownership.

---

## Problem

Library, Reports, Dossier, Documents all surface the same underlying strategic-memo / scenario data in different shapes. Users cannot tell which is canonical.

## Ownership of each screen (verified from code)

| Screen | File | Lines | What it actually does | Data |
|---|---|---|---|---|
| **Library** | `library/page.jsx` | 119 | Filterable TABLE of all memos; status workflow (draft→reviewed→approved→archived); **titles already link INTO Dossier** (`library:76` → `dossier?memo=`) | `strategic-memos` GET/PATCH |
| **Reports** | `reports/page.jsx` | 203 | Single static printable FINANCIAL summary (cover + KPI tables + scenario compare); browser-print → PDF | project + scenarios + data-room |
| **Dossier** | `dossier/page.jsx` | 805 | Full 11-section memo VIEWER (3 modes: all-memos table / scenario list / memo detail) + per-memo PDF link | `strategic-memos`, `strategic-memos/[id]`, scenarios |
| **Documents** | `documents/page.jsx` | 195 | Export template launcher (6 templates → `export/*` routes) — **routes missing, see** [[EXPORT-PIPELINE-AUDIT]] | scenarios + export APIs (404) |

## Overlap matrix

| Capability | Library | Reports | Dossier | Documents |
|---|:--:|:--:|:--:|:--:|
| List all memos | ✅ table | — | ✅ table mode | — |
| Read full memo (11 sections) | — | — | ✅ **only here** | — |
| Memo status workflow | ✅ **only here** | — | — | — |
| Scenario comparison | — | ✅ | ✅ | — |
| Financial summary doc | — | ✅ **only here** | partial | — |
| PDF export (working) | ✅ per-memo link | ⚠️ via print dialog | ✅ per-memo link | 🔴 404 |
| Multi-template export | — | — | — | ✅ (broken) |

**Key fact:** the code already treats **Dossier as the canonical viewer** — Library and Executive link into `dossier?memo=`/`dossier?scenario=`. The fragmentation is mostly a NAVIGATION/labelling problem, not a data problem.

## Canonical destinations (proposal)

| Role | Canonical screen | Verdict |
|---|---|---|
| **Read a memo (narrative)** | **Dossier** | KEEP — single source of truth for reading |
| **Archive / status workflow** | **Library** | KEEP — distinct job (table + status PATCH); demote to "index that feeds Dossier" |
| **Export deliverables** | **Documents** | KEEP — once routes fixed (Blocker 4); becomes the export hub |
| **Financial summary PDF** | folded into **Documents** (`Financial Model` / `One-Pager` templates) | **MERGE** — Reports' unique value (financial summary) becomes a Documents template; the standalone Reports screen is retired from nav |

### Screens to MERGE
- **Reports → Documents.** Its only unique capability (printable financial summary) is already a planned Documents template (`xlsx`, `one-pager`). Retire Reports from nav; keep the route until the Documents template covers it.

### Screens to KEEP
- **Dossier** (canonical reader) · **Library** (archive + workflow index) · **Documents** (export hub, pending Blocker 4).

## Effort
**Low.** No data model change. Work = (a) nav re-pointing (Library group primary → Dossier, see [[EXECUTIVE-DOSSIER-PROMOTION]]), (b) retire Reports from nav, (c) ensure Documents covers the financial-summary template. No memo/PDF engine change (forbidden by mission).

## Acceptance criteria
- Exactly ONE screen reads full memos (Dossier).
- Library is clearly the archive/workflow index, linking into Dossier (already true in code).
- Reports no longer appears as a peer in nav; its content path exists in Documents.
- No duplicate "view memo" entry points in primary nav.
