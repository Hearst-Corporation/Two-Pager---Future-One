# Hearst Oracle — Cockpit & Simulator

Application Next.js : cockpit opérationnel HEARST (`/admin/hearst/*`) — simulateur financier, mémos stratégiques, sources, deals.

> **Entry** — `/` redirige vers `/admin/hearst/simulator` (middleware auth → `/admin/login`).

## Stack

- **Next.js 14** (App Router)
- **React 18** — inline styles + tokens CSS `--cp-*`
- **@hearst/cockpit-shell** — layout 3 colonnes (rail nav · contenu · advisor/chat)
- **Supabase** — auth + tables `crm.*`

## Structure

```
app/
  (cockpit)/admin/hearst/
    layout.jsx          ← CockpitShell + OracleRailNav + memo modals
    cp-tokens.css       ← canon design system (--cp-*)
    cockpit.css         ← cp-card, rail chat dock
    simulator/          ← config scénario
    simulator/results/  ← résultats + visualisations
    financial/ sources/ workspace/ dossier/ deals/
  api/
    cockpit-chat/       ← Kimi via Hypercli (deal + pathname + historique scopé via CockpitChatBridge)
    admin/hearst/       ← simulate, scenarios, memos, sources, project

components/
  OracleRailNav.jsx     ← nav 6 sections (rail desktop + barre mobile)
  hearst/               ← advisor, memo, KPI, simulator widgets
```

## Lancer le projet

```bash
npm install
npm run dev
```

> **Port fixe 5005** — `npm run dev` et `npm run start` utilisent `-p 5005`. Ne pas lancer sur 3000.
> **Après `check:ci` ou build avec le dev actif** — `npm run dev:clean` (kill 5005 + purge `.next` + relance).

Ouvrir [http://localhost:5005](http://localhost:5005).

### Cockpit HEARST

- **Design system** : `app/(cockpit)/admin/hearst/cp-tokens.css` (canon `--cp-*`, z-index `--cp-z-*`, opérateurs `--cp-op-*`). Anatomie page : `.oracle-page` + `.oracle-page-header h1` à **24px** (`--cp-font-2xl`, `oracle-layout.css`) — `SectionHead hero` réservé au titre de page, H2 section via `SectionHead` défaut. Les surfaces passent par `Card` (`surface={0|1|2|3}`, `accent`, `hover`, `variant="flat|bare"` pour les conteneurs imbriqués) ; grilles KPI via `KpiGrid` + `KpiCard` (`financial`, `deals`, `results`, `dossier`). Styles partagés : `lib/cp-styles.js` (`T`/`S`/`RC`) — `financial`, `workspace`, `dossier`, `sources`, `simulator`/`results`, charts simulateur (`accentAlert`, `loadingPanel`/`loadingCard`). Chat scopé : `CockpitChatBridge` → `setActiveChat` (`@hearst/cockpit-shell` 0.2.0 patché). Strings UI : `lib/ui-strings.ts` (`UI.*`, gate `lint:strings` sans baseline legacy). Cockpit Dark Glass ; login `/admin/login` reste outsider (hex legacy). Breakpoints : 600px / 900px.
- **Nav** : `OracleRailNav` porté dans `.ct-rail-left` (desktop) + `.oracle-mobile-nav` sur `body` (<600px).
- **Chat** : rail droit toujours visible desktop (`chat-fab.css`, `--cp-chat-rail-width`) ; drawer + `ChatToggleFAB` uniquement &lt;900px.
- **Accent shell** : `HearstLayoutClient` → `ORACLE_PRODUCTS[].color` doit être un **hex** (`#8A1538`), jamais `var(--cp-accent)` — `ThemeAccent` écrit `--ct-accent` sur `<html>` et une référence circulaire casse toutes les couleurs au mount.
- **Vérif DS** : `npm run test:e2e -- tests/e2e/coherence-visual.spec.ts` (8 tests). Journal : `docs/coherence-fix-plan.md`.

### Routes cockpit

| URL | Page |
|---|---|
| `/admin/hearst/simulator` | Configuration scénario |
| `/admin/hearst/simulator/results?scenario=<id>` | Résultats complets |
| `/admin/hearst/financial` | Modèle financier |
| `/admin/hearst/sources` | Sources & contrats |
| `/admin/hearst/workspace` | Scénarios sauvegardés |
| `/admin/hearst/dossier` | Mémos stratégiques / Decision Canvas |
| `/admin/hearst/deals` | Structures deal |
| `/api/health` | Smoke-test (Railway) |

### Tests

```bash
npx tsc --noEmit
npm test
npm run test:e2e -- tests/e2e/coherence-visual.spec.ts
npm run test:e2e   # login.spec skip si ADMIN_DEV_AUTOLOGIN_EMAIL dans .env.local
```
