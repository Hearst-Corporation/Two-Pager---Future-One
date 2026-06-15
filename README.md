# Hearst Oracle

Cockpit HEARST — simulateur financier, mémos stratégiques, dossier décisionnel.

## Stack

Next.js 14 · React 18 · Supabase (`crm`) · OpenAI · shell local `cockpit-shell/`

## Démarrage

```bash
npm install
npm run dev
```

→ [http://localhost:5005](http://localhost:5005) (port 5005)

```bash
npm run check      # lint + tests
npm run check:ci   # + build
npm run doctor     # vérif env
```

Après un build avec le dev actif : `npm run dev:clean`

## Routes principales

| URL | Rôle |
|-----|------|
| `/admin/hearst/simulator` | Configuration scénario |
| `/admin/hearst/simulator/results` | Résultats |
| `/admin/hearst/financial` | Modèle financier |
| `/admin/hearst/workspace` | Scénarios sauvegardés |
| `/admin/hearst/dossier` | Mémos / décision |
| `/admin/hearst/deals` | Structures deal |
| `/admin/hearst/sources` | Sources |

## Structure

```
app/(cockpit)/admin/hearst/   pages cockpit
app/api/admin/hearst/         APIs métier
app/api/cockpit-chat/         chat OpenAI
cockpit-shell/                shell UI (éditable localement)
components/hearst/            widgets Oracle
lib/                          moteur financier, validators, LLM
lib/hearst-config-presets.js  defaults modèle + structure JV (timeline, split equity)
```

## Design tokens

Palette cockpit : `cockpit-shell/tokens.css` (`--ct-*`) → `app/(cockpit)/admin/hearst/cp-tokens.css` (`--cp-*`).
Surfaces glass, ombres hero, échelle d’opacité et typo fluide : source unique dans `cp-tokens.css` ; pages consomment `var(--cp-*)` (pas de `rgba`/`#` en dur dans les CSS page).

Prototypes HTML : `design/sources-intelligence/*.html` pour les concepts Sources Intelligence et `report-lab/*.html` pour les concepts mémo/PDF.

Chat : rail droit **fixe** desktop (`chat-fab.css`) ; drawer + FAB uniquement &lt;900px.
