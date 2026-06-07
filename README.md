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

- **Design system** : `app/(cockpit)/admin/hearst/cp-tokens.css` (canon `--cp-*`). Pas d'OpenClaw (`dark-theme.css`, `lib/design-system/tokens` supprimés). Login `/admin/login` reste en `--color-*` legacy.
- **Nav** : `OracleRailNav` porté dans `.ct-rail-left` (desktop) + `.oracle-mobile-nav` sur `body` (<600px).
- **Chat drawer** : `ChatToggleFAB` + `chat-fab.css` (<900px).
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
