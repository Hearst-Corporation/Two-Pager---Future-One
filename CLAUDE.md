# CLAUDE.md — Oracle (Hearst / Futur One Qatar)

## Projet
Oracle = cockpit d'investissement infrastructure datacenter (Qatar / Hearst).
Parcours : configurer un scénario → simuler → sauvegarder → résultats → mémo stratégique
→ dossier décisionnel → export PDF.
`/` redirige vers `/admin/hearst/simulator`. Le produit brochure A3 (FoldableA3, P1Cover…P4Back)
n'existe plus.
Stack : Next.js 14 · React 18 · inline styles + `var(--cp-*)` (pas de Tailwind, pas de CSS
modules) · Supabase (schéma `crm`, service_role) · Kimi K2.6 via Hypercli · `@hearst/cockpit-shell`.

---

## 🚨 RÈGLES ABSOLUES — INFRASTRUCTURE (NON NÉGOCIABLE)

### Dev server → port **5005**, toujours.
- `npm run dev` lance **exclusivement** sur `http://localhost:5005`
  (`package.json` : `"dev": "next dev -p 5005"`, `"start": "next start -p 5005"`).
- Ne **JAMAIS** lancer sur 3000, 3001 ou autre. Ne **JAMAIS** changer le port sans demande.
- Toute URL communiquée pointe sur `localhost:5005`.
- Avant de démarrer : `lsof -nP -iTCP:5005 -sTCP:LISTEN`. Ne pas relancer si un serveur tourne
  déjà (Next basculerait sur 5006/5007 et casserait la règle).

---

## Architecture des pages (cockpit)
Toutes sous `app/(cockpit)/admin/hearst/` (+ `layout.jsx` = shell 3 colonnes) :
| Page | Rôle |
|---|---|
| `page.jsx` | Dashboard d'entrée |
| `simulator/page.jsx` | Config scénario + projection live (POST /simulate, debounce 300ms) |
| `simulator/results/page.jsx` | Résultats : IRR/NPV/MOIC, export MD, generate memo |
| `financial/page.jsx` | Multi-scénarios, dette, waterfall, sensibilité |
| `deals/page.jsx` | Référence modèles deal (statique) |
| `workspace/page.jsx` | Index scénarios + mémos |
| `dossier/page.jsx` | Decision Canvas, gouvernance, PDF par mémo |
| `sources/page.jsx` | Bibliothèque benchmarks + CRUD `hearst_sources` |

Auth + login : `app/admin/login/`, `app/admin/auth/callback/`. APIs : 10 routes sous
`app/api/admin/hearst/` (toutes authentifiées via `requireProfile`/`authedWrite`) +
`app/api/cockpit-chat/` (auth optionnelle) + `app/api/health/` (public).

## Navigation
- Rail primaire : `components/OracleRailNav.jsx` — 6 sections (Simulator · Financial · Deals ·
  Workspace · Dossier · Sources).
- Secondaire : `SectionTabs` (modeling / library).

## Moteur financier
- `lib/hearst-calculations.js` — IRR (Newton-Raphson), NPV, MOIC, payback, DSCR, projection 10 ans,
  dette (annuité + IO selon `site_readiness`), waterfall 3 tiers (dette → pref 8% → equity).
- `lib/hearst-bootstrap.js` — préremplissage depuis `PUBLIC_SOURCES_LIBRARY` (statique).
- `lib/hearst-deal-structures.js` — 8 archétypes (`powered_shell` recommandé).
- `lib/hearst-solver.js` — 3 modes (mw_first / capital_first / target_irr_first).
- `lib/hearst-fit-matrix.js` — affichage uniquement (NON branché au calcul).
- `lib/oracle-intelligence/` (datapoints statiques) · `lib/oracle-live/` (scrapers best-effort) ·
  `lib/strategic-memo-store.js` (persistance Supabase).
- Principe : pas de nombre inventé → champ manquant = `null` / `MISSING_LABEL`
  (`'N/A — Source Required'`).

## Design system — tokens
- Canon : `--cp-*` défini dans `app/(cockpit)/admin/hearst/cp-tokens.css` (bridge `--cp-*` →
  `--ct-*` upstream `@hearst/cockpit-shell/tokens.css`). Surfaces dans `cockpit.css`, FAB chat
  dans `components/hearst/chat-fab.css`.
- `app/globals.css` `--color-*` = **legacy login uniquement** — interdit dans le module Hearst.
- **Jamais de hex hardcodé ni de `--color-*`** dans `components/hearst/**` et les pages cockpit :
  utiliser un token `--cp-*`. (ESLint `no-restricted-syntax` ; ⚠️ l'override `files` ne couvre
  aujourd'hui que `components/hearst/**` — les pages sous `app/(cockpit)/admin/hearst/**` ne sont
  pas attrapées par le glob, rester discipliné à la main.)

## Tests
- `npm test` → vitest (212 tests : calculs, solver, archétypes, bootstrap, validators, auth,
  memo store, middleware…).
- E2E Playwright : `tests/e2e/coherence-visual.spec.ts` (8 tests, nav + tokens desktop/mobile)
  + `tests/e2e/login.spec.ts`. Config : `playwright.config.js`.
