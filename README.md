# Oracle — FUTUR ONE / Hearst Qatar

Board-level investment interface for the Hearst Qatar AI infrastructure program.

## Quick start

```bash
cp .env.local.example .env.local
npm install
npm run doctor          # optional env preflight
npm run dev             # http://localhost:5005
```

Quality gate:

```bash
npm run check           # lint:secrets + lint:responsive + lint + vitest
npm run check:ci        # check + production build
```

## Hearst responsive contract

Enforced by `npm run lint:responsive` (in `check`).

- **Shell** — every route uses `<HearstPageShell>`; never manual `<main>` / `cockpitFrame`. Chain: `HearstLayout` (`.wrap` 100dvh + nav + `.pageStage`) → `HearstPageShell` (`main.cockpitFrame`, `+cockpitFrameLocked` for instruments) → `header.pageHead` + body.
- **Variants** — `"home"` (overview) · `"editorial"` (financial) · `"data"` (sources, deals, workspace, dossier) · `"instrument"` (simulator) + `.simLayout`.
- **Simulator** — controls + projection + metrics. Pas de `simStatusStrip`, `simSummaryGrid`, ni `summaryGrid`.
- **Viewport** — `100dvh` via `.wrap`; `100vw` / `100vh` forbidden in Hearst pages and CSS.
- **Breakpoints** — closed canonical set, no ad-hoc thresholds: `max-width` 1280 / 1024 / 768 / 430, `max-height` 720 / 520, plus `(orientation:landscape)` and `prefers-reduced-motion`. `min-width` pairing guards are allowed.
- **Scroll** — no `overflow:hidden` on wrappers without a local scroller.

| Route | API |
|---|---|
| `/admin/hearst` | — |
| `/admin/hearst/simulator` | `POST /api/admin/hearst/simulate` |
| `/admin/hearst/sources` | `GET /api/admin/hearst/sources` |
| `/admin/hearst/financial` | `POST /api/admin/hearst/simulate` |
| `/admin/hearst/deals` | `GET /api/admin/hearst/deals` |
| `/admin/hearst/workspace` | `GET /api/admin/hearst/project`, `GET /scenarios` |
| `/admin/hearst/dossier` | `GET /api/admin/hearst/strategic-memos` |

Scaffold: `npm run new:feature -- <resource>` → `HearstPageShell` page + API route; wire in `HearstNav.jsx`.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server port **5005** |
| `npm run check` | Secrets + responsive + lint + tests |
| `npm run lint:responsive` | Hearst layout contract guard |
| `npm run new:feature` | Scaffold Hearst page + API |
| `npm run doctor` | Env preflight |

Stack: Next.js 14 · React 18 · Supabase · OpenAI · CSS Modules (`hearst.module.css`).

## Design system

Single source of truth for the Hearst cockpit:

| Layer | File | Tokens |
|---|---|---|
| Fonts | `app/layout.jsx` | `--font-satoshi` via `next/font/local` |
| Global shell | `app/globals.css` | `--font-sans`, `--color-login-*`, `--color-error-*` |
| Hearst cockpit | `app/admin/hearst/hearst.module.css` | `--ct-*`, `--text-*` scoped on `.wrap` |

- **No Tailwind.** All Hearst UI consumes tokens through CSS module classes — never inline `var(--ct-*)` in JSX.
- **Legacy `--cp-*` removed** (`admin-tokens.js`, `cp-tokens.css`, `cockpit-shell/tokens.css`).
- **Login** (`/admin/login`) uses `--color-login-*` (light theme). **Hearst** uses dark `--ct-*` under `.wrap`.
- **Guards:** `npm run lint:responsive` enforces shell contract, canonical breakpoints, route variants, mobile card parity, and no inline styles on Hearst pages.
- **Shared UI:** `HearstPageShell`, `HearstRegisterStates` (error/loading/empty), `HearstNav`, `DataCenterProjection`.
