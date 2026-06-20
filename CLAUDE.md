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
| Variants | `HearstPageShell` | `"home"` (overview) · `"data"` (registers/cards) · `"editorial"` (panels+tables) · `"instrument"` (simulator) |
| Editorial | `variant="editorial"` | financial — `.cockpitPanel` + scroll local tables |
| Data | `variant="data"` | sources, deals, workspace, dossier — panels + cards mobile |
| Instruments | `variant="instrument"` | `.simLayout` — controls + projection + metrics. Pas de `summaryGrid` / `simStatusStrip`. |
| CSS | `hearst.module.css` | No `100vw` (except nav drawer), no `100vh` |

**Canonical breakpoints (closed — no ad-hoc thresholds):** `max-width` 1280 / 1024 / 768 / 430, `max-height` 720 / 520, `(orientation:landscape)`, `prefers-reduced-motion`. `min-width` pairing guards (769px, 1281px) allowed. Enforced by `lint:responsive` against pages, components, and `hearst.module.css`.

Scaffold : `npm run new:feature -- <resource>` → always emits `HearstPageShell variant="data"`.

## Hearst Composition Contract

Chaque route a une **intention produit** unique. Same DS, écrans différents — ne pas les confondre.

- **Overview** (`/admin/hearst`) = cockpit state, **pas** landing page. État courant + preuve + action + risque + output.
- **Simulator** = instrument, pas document.
- **Sources** = data register, pas table dump générique.
- **Financial** = investment readout, pas spreadsheet dump.
- **Dossier** = board pack, pas portail de routes.

Règles transverses :
- Les pages **ne dupliquent pas** la nav du haut avec de grosses route-cards.
- Pas de hero marketing sauf scope explicite.
- Chaque page répond à : **current state · evidence · action · risk · output**.

Enforced par `lint:responsive` (règles `overview-*` sur `page.jsx`).

## Routes

| Path | Role | Variant | API |
|---|---|---|---|
| `/admin/hearst` | Entry map | `home` | — |
| `/admin/hearst/simulator` | Live projection | `instrument` | `POST /simulate` |
| `/admin/hearst/sources` | Evidence register | `data` | `GET /sources` |
| `/admin/hearst/financial` | Base case | `editorial` | `POST /simulate` |
| `/admin/hearst/deals` | Deal archetypes | `data` | `GET /deals` |
| `/admin/hearst/workspace` | Saved scenarios | `data` | `GET /project`, `GET /scenarios` |
| `/admin/hearst/dossier` | Strategic memos | `data` | `GET /strategic-memos` |

## Design system — copie locale éditable

Le DS Cockpit vit entièrement dans ce repo (`app/admin/hearst/hearst.module.css` + `app/globals.css`).
C'est LA copie de ce repo, éditable librement : tokens `--ct-*`, composants, CSS se modifient directement.
Pas de source centrale à synchroniser, pas de tarball, pas de repack. Seule règle : cohérence visuelle interne.

## API · Env

`app/api/admin/hearst/` — simulate, scenarios, sources, deals, project, strategic-memos.

`.env.local.example` → `.env.local` (Supabase + `OPENAI_API_KEY`). Preflight : `npm run doctor`.
