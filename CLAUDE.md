# CLAUDE.md — Oracle

Stack : Next.js 14 · React 18 · Supabase (`crm`) · OpenAI · CSS Modules (`--ct-*`, no Tailwind).

Dev : `npm run dev` → **5005**. Gate : `npm run check` (includes `lint:responsive`).

## Hearst layout contract (`app/admin/hearst/`)

**Strict — do not bypass.**

Chain: `HearstLayout` (`.wrap` 100dvh + nav + `.pageStage`) → `HearstPageShell` (renders `main.cockpitFrame`, `+cockpitFrameLocked` for instruments) → `header.pageHead` + body.

| Layer | Owner | Rule |
|---|---|---|
| Viewport | `.wrap` in `layout.jsx` | `100dvh`, scroll inside `main`, never on `document` |
| Page frame | `HearstPageShell` only | NEVER `<main className={styles.cockpitFrame}>` in pages |
| Variants | `HearstPageShell` | `"editorial"` (data) · `"home"` (overview) · `"instrument"` (simulator only) |
| Editorial | `variant="editorial"` | financial — `.cockpitPanel` + scroll local tables |
| Data | `variant="data"` | sources, deals, workspace, dossier — panels + cards mobile |
| Instruments | `variant="instrument"` | `.simLayout` — controls + projection + metrics. Pas de `summaryGrid` / `simStatusStrip`. |
| CSS | `hearst.module.css` | No `100vw` (except nav drawer), no `100vh` |

**Canonical breakpoints (closed — no ad-hoc thresholds):** `max-width` 1280 / 1024 / 768 / 430, `max-height` 720 / 520, `(orientation:landscape)`, `prefers-reduced-motion`. `min-width` pairing guards allowed. Enforced by `lint:responsive` against pages, components, and `hearst.module.css`.

Scaffold : `npm run new:feature -- <resource>` → always emits `HearstPageShell variant="editorial"`.

## Routes

| Path | Role | API |
|---|---|---|
| `/admin/hearst` | Entry map | — |
| `/admin/hearst/simulator` | Live projection | `POST /simulate` |
| `/admin/hearst/sources` | Evidence register | `GET /sources` |
| `/admin/hearst/financial` | Base case | `POST /simulate` |
| `/admin/hearst/deals` | Deal archetypes | `GET /deals` |
| `/admin/hearst/workspace` | Saved scenarios | `GET /project`, `GET /scenarios` |
| `/admin/hearst/dossier` | Strategic memos | `GET /strategic-memos` |

## API · Env

`app/api/admin/hearst/` — simulate, scenarios, sources, deals, project, strategic-memos.

`.env.local.example` → `.env.local` (Supabase + `OPENAI_API_KEY`). Preflight : `npm run doctor`.
