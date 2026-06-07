<!-- @enable-adrien:layer=front-cockpit v=1 -->
<!-- AGENTS.md — cible ≤200 lignes. Source de vérité locale. Lis CECI avant toute feature. -->
# Oracle — guide agent

> Stack : Next.js 14 · React 18 · Supabase · Kimi K2.6 · Port **5005**
> Gate : `npm run check` (exit 0 = livrable)

<!-- enable:section=tldr -->
## 1. TL;DR
- Scaffolder : `node scripts/new-feature.mjs <resource> --ts=YYYYMMDDHHMMSS`
- Tests : `npm test` (vitest, 214 tests)
- Gate : `npm run check` — la mauvaise façon ÉCHOUE ici.
- Auth : toutes les routes API passent par `requireProfile` / `authedWrite`.
- Tokens : `var(--cp-*)` uniquement — jamais de hex hardcodé dans `app/(cockpit)/` ni `components/hearst/`.

<!-- enable:section=recette -->
## 2. Recette canonique (nouvelle page)
```bash
node scripts/new-feature.mjs analytics --ts=20260607120000
# → crée app/(cockpit)/admin/hearst/analytics/page.jsx
# → crée app/api/admin/hearst/analytics/route.js
# → imprime les 3 rappels manuels obligatoires
npm run check  # doit passer
```

<!-- enable:section=rapide -->
## 3. Le plus rapide
1. `node scripts/new-feature.mjs <resource>` — génère page + route
2. Ajouter entrée dans `components/OracleRailNav.jsx → SECTIONS[]` (keystone NAV)
3. Ajouter clé `NAV_<RESOURCE>` dans `lib/ui-strings.ts`
4. `npm run check` — vert = livrable

Le scaffolder NE TOUCHE PAS : `layout.jsx` (keystone), `OracleRailNav.jsx` (NAV source de vérité).

<!-- enable:section=primitives -->
## 4. Primitives (composer, NE PAS recoder)
- **UI** : `import { Button, Card, Table, Row, Cell, Field, Badge, SectionHead, Eyebrow, KpiGrid, KpiCard } from '@/components/hearst/ui'` — catalogue `components/hearst/ui/README.md`. Interdit de recoder un bouton/carte/table/champ en inline.
- **Auth** : `requireProfile(req)` (viewer+) · `authedWrite(req)` (editor+) — `lib/auth-server.js`
- **DB** : `getAdminClient()` — `lib/supabase-admin.js` (service_role, server-only)
- **Calculs** : `lib/hearst-calculations.js` (IRR Newton-Raphson, NPV, MOIC, waterfall)
- **Solver** : `lib/hearst-solver.js` (3 modes : mw_first / capital_first / target_irr_first)
- **Tokens DS** : `grep -r "var(--cp-" app/(cockpit)/admin/hearst/cp-tokens.css`
- **Nav routes** : `grep -n "href:" components/OracleRailNav.jsx`
- **Strings UI** : `lib/ui-strings.ts` → `UI.*`

<!-- enable:section=interdits -->
## 5. Interdits → gate

| INTERDIT | ÉCHOUE VIA |
|---|---|
| Couleur hex / `rgb()` / `hsl()` hors `var(--cp-*)` dans cockpit | `npm run lint:cockpit` |
| `var(--ct-*)` ou `var(--color-*)` en direct dans le cockpit | `npm run lint:cockpit` (passe par `--cp-*`) |
| Token défini hors de sa source (`--cp-*`→cp-tokens.css · `--color-*`→globals.css) ou en double | `npm run lint:tokens` |
| String UI en dur (nouvelle ligne) | `npm run lint:strings` |
| Secret hardcodé (`sk-ant-`, `ghp_`, etc.) | `npm run lint:secrets` |
| Page-section sans entrée dans `OracleRailNav.jsx → SECTIONS[]` | `npm run lint:nav` |
| Build cassé (import/JSX) dans une page sans test | `npm run check:ci` (lance `next build`) |
| `getAdminClient()` dans un composant client | convention — import server-only |

> Baselines gelées par **signature** (`scripts/.lint-baseline.json`) : seules les
> *nouvelles* violations échouent. Toucher une ligne legacy la « réactive » → corrige-la.
> Régénérer (legacy assumé) : `node scripts/lint-cockpit.mjs --update-baseline`.

<!-- enable:section=gotchas -->
## 6. Gotchas du repo
- Port **5005** toujours (`npm run dev` → localhost:5005). Ne jamais changer.
- `requireProfile` est dans `lib/auth-server.js`, **pas** un middleware Next.js.
- `service_role` = bypass RLS complet → uniquement dans `app/api/`, jamais côté client.
- Kimi K2.6 via Hypercli (`HYPERCLI_API_KEY`) — endpoint `/api/cockpit-chat/`.
- Mémo fallback = `_generation_mode: 'deterministic_fallback'` dans le JSON.
- Le moteur financier **ne fabrique jamais** de données : `null` / `'N/A — Source Required'` si manquant.
- `useEffect(..., [])` init-only = pattern intentionnel sur simulator/page.jsx.
- CSP : `unsafe-eval` retiré en prod (Next.js HMR en dev uniquement).

<!-- enable:section=livrer -->
## 7. Avant de livrer
```bash
npm run check     # lint:secrets + lint:cockpit + lint:strings + lint:nav + test (rapide)
npm run check:ci  # + next build — PROUVE que l'app compile (à lancer avant toute PR)
npm run doctor    # préflight env (dit ce qui manque pour dev/build)
```
