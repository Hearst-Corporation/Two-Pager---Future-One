# TICKET — EXECUTIVE-DOSSIER-PROMOTION (BLOCKER 2)

**Status:** READY · spec only (no code)
**Priority:** P0 — best deliverables are unreachable
**Opened:** 2026-05-29
**Scope:** make Executive and Dossier reachable from primary navigation.

---

## Problem

`executive` (183 l., board dashboard) and `dossier` (805 l., full 11-section memo viewer) are the two most board-facing screens — and **neither is in any navigation entry point**. They are reachable only by typing the URL or via in-content links from other screens. The product hides its best deliverables.

## Current nav architecture (verified from code)

ORACLE has TWO nav surfaces:

### Bottom bar — PRIMARY nav, 4 groups (`components/OracleBottomBar.jsx`)
| Group | href | matchAny prefixes |
|---|---|---|
| Brief | `/admin/hearst` | (exact) |
| Simulator | `/admin/hearst/simulator` | simulator, engine, scenarios, financial, assumptions |
| Hub | `/admin/hearst/hub` | hub, pipeline, deals, contracts, data-room |
| Library | `/admin/hearst/library` | library, sources, reports, timeline, risks, audit, **documents** |

🔴 **Proof of orphaning:** the Library group's `matchAny` (OracleBottomBar.jsx:58) lists reports/documents but **NOT `dossier` and NOT `executive`**. They belong to no group → never highlighted, never entered.

### Left rail — favourites, 17 destinations (`components/hearst/HearstLeftRail.jsx:28-43`)
User-configurable favourites. `dossier`, `executive`, `about`, `profile`, `visuals-preview` are **absent from `ALL_DESTINATIONS`** → cannot even be added as a favourite.

## Where they should live (proposal)

| Screen | Proposed home | Rationale |
|---|---|---|
| **Executive** | **Default landing** (see [[LOGIN-REDIRECT-CORRECTION]]) + own top-level slot OR replace/augment "Brief" | It IS the 5-second board overview; Brief is the operational twin (see [[MEMO-INFORMATION-ARCHITECTURE]] for Brief↔Executive overlap) |
| **Dossier** | **Canonical destination of the Library group** | It is already the memo viewer that Library/Executive link INTO (library:76 → `dossier?memo=`; executive:83,102,58 → `dossier`). Make the group's primary href = dossier, demote the table to a tab. |

## Bottom bar impact
- Add `dossier` and `executive` to `matchAny` of the relevant groups (minimum fix: stop them being orphaned for active-state).
- Decision needed: does Executive become its own bottom-bar slot, or does it replace Brief? (4-slot constraint — see Risk.) **Recommended:** Library group's primary href → `dossier`; Executive becomes the landing (Blocker 1) and/or replaces Brief as group 1.

## Left rail impact
- Add `dossier` and `executive` to `ALL_DESTINATIONS` (HearstLeftRail.jsx:28-43) so they can be favourited.

## Mobile impact
Bottom bar is the mobile-primary surface (4 fixed slots). Adding a 5th slot harms thumb ergonomics → prefer **re-pointing an existing group's primary href** over adding slots. No rail on small screens (rail has no responsive hide rule today — separate observation, out of scope).

## Role impact
- CEO/Board: gains direct access to the two screens built for them (today: zero nav path).
- Analyst: unaffected (already reaches dossier via Library links).
- Admin: unaffected.

## Estimated impact
**High value, low surface.** Edits confined to 2 nav config files (`OracleBottomBar.jsx`, `HearstLeftRail.jsx`) + the landing constant from Blocker 1. No screen logic changes, no new routes.

## Acceptance criteria
- Executive reachable in ≤1 click from primary nav (or is the landing).
- Dossier reachable in ≤1 click (Library group primary or tab).
- Both can be added as left-rail favourites.
- Active-state highlight works when on `dossier`/`executive`.
- No 5th bottom-bar slot on mobile.
