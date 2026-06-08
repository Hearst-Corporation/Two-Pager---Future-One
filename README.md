# Hearst Oracle — Cockpit & Simulator

Application Next.js : cockpit opérationnel HEARST (`/admin/hearst/*`) — simulateur financier, mémos stratégiques, sources, deals.

> **Entry** — `/` redirige vers `/admin/hearst/simulator` (middleware auth → `/admin/login`).

## Stack

- **Next.js 14** (App Router)
- **React 18** — inline styles + tokens CSS `--cp-*`
- **Cockpit shell local** — layout 3 colonnes (rail nav · contenu · advisor/chat)
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

cockpit-shell/
  src/                  ← composants shell éditables localement
  tokens.css            ← tokens --ct-* éditables localement
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

- **Design system — copie locale éditable** : le DS Cockpit vit dans ce repo (`cockpit-shell/` + CSS local). C'est LA copie de ce repo, éditable librement ici : composants, tokens (`--ct-*`), CSS se modifient directement. Pas de source centrale à mettre à jour, pas de resync, pas de repack. Les pages applicatives passent par `app/(cockpit)/admin/hearst/cp-tokens.css` (`--cp-*`), `Card`, `KpiGrid`, `KpiCard` et `lib/cp-styles.js` (`T`/`S`/`RC`). Strings UI : `lib/ui-strings.ts`. Seule règle : garder la cohérence visuelle interne du repo.
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
