# `lib/investment-model/` — Futur moteur canonique (EMPLACEMENT RÉSERVÉ)

> **Statut : VIDE / EN ATTENTE.** Ce dossier ne contient encore AUCUNE logique.
> Il prépare le terrain pour le futur modèle financier **simple, transparent et défendable**
> issu du HTML canonique `docs/qatar-sovereign-investor-memorandum.html`.
>
> **Ne pas brancher ce dossier à l'app tant que le modèle n'est pas implémenté et validé.**
> Le moteur ACTUEL (`lib/hearst-calculations.js`, `lib/hearst-solver.js`,
> `lib/hearst-deal-structures.js`, etc.) reste la seule source de calcul en production.

## Pourquoi ce dossier existe

Le moteur historique (`lib/hearst-*`, `lib/oracle-*`) est complet et testé, mais
l'utilisateur ne lui fait **plus confiance** (cf. `docs/finance-engine-audit-2026-06`,
returns surévalués, double-count, hypothèses opaques). La décision est de **ne pas
réparer en place**, mais de préparer l'accueil d'un modèle neuf, traçable de bout en bout.

## Source canonique (NE PAS MODIFIER)

- `docs/qatar-sovereign-investor-memorandum.html` — **mémo investisseur Qatar = source de vérité
  temporaire** pour le modèle financier, le narratif institutionnel et les scénarios.
- `docs/qatar-sovereign-two-pager.html` — version courte.

Ces fichiers sont **standalone** (aucun import dans `app/`, `components/`, `lib/`).
Les chiffres et formules qu'ils contiennent **ne doivent pas être altérés** : c'est eux
qu'on transcrira ici, à l'identique, plus tard.

## Architecture cible (flux transparent)

```
inputs (assumptions) → calculations (déterministes) → scenarios (bear/base/bull) → renderers (institutionnel)
                                                          ↑
                                                      validation
                                                      formatters
```

| Dossier         | Rôle                                                                 |
|-----------------|----------------------------------------------------------------------|
| `assumptions/`  | Inputs bruts du modèle (voir liste ci-dessous). Aucune dérivation.    |
| `calculations/` | Fonctions pures déterministes (revenue → EBITDA → CF → TV → MOIC/IRR).|
| `scenarios/`    | Composition bear/base/bull à partir d'assumptions + calculations.    |
| `formatters/`   | Mise en forme d'affichage (USD, %, x). Peut réutiliser `lib/hearst-format.js`. |
| `validation/`   | Garde-fous : pas de nombre inventé, champ manquant = explicite.       |
| `renderers/`    | Sortie institutionnelle (tables, mémo) alignée sur le HTML canonique. |

### Inputs minimum attendus (assumptions/)
capacity MW · lease rate $/kW/month · capex per MW · EBITDA margin · escalation ·
lease-up timing · exit multiple · hold period · economic split · partner share ·
stabilization timing.

### Outputs minimum attendus (calculations/ → scenarios/)
gross revenue · EBITDA · consortium cash flow · terminal value · MOIC · IRR ·
comparaison bear/base/bull · conditions precedent / gates.

## Règles d'implémentation (à respecter quand on remplira ce dossier)

1. **Transcription fidèle du HTML**, pas de ré-invention. Toute valeur = traçable au mémo.
2. **Déterminisme total** : mêmes inputs → mêmes outputs, zéro appel réseau, zéro LLM.
3. **Pas de nombre inventé** : champ manquant = `null` + label explicite (réutiliser la
   convention `MISSING_LABEL` du repo).
4. **Pas de couplage** avec l'ancien moteur : ce dossier ne doit pas importer
   `lib/hearst-calculations.js` ni dépendre des archétypes historiques.
5. **Tests d'abord** : chaque fonction de `calculations/` arrive avec son test qui
   pin les chiffres du HTML canonique.

## Ce qui peut être réutilisé de l'existant (KEEP)

- Composants de rendu : `components/hearst/ui/*`, `KpiCard`, `CapitalDonut`,
  `ProjectionChart`, `Table`, etc. (génériques, agnostiques du moteur).
- Formatters : `lib/hearst-format.js` (`fmtUSD`, `fmtPctFromRatio`, `fmtX`, `fmtMW`, `fmtYears`).
- Layout / export PDF / structure de pages.

## Ce qui sera remplacé (REWRITE LATER)

Voir `docs/investment-model-migration.md` pour la classification complète
KEEP / QUARANTINE / DELETE CANDIDATE / REWRITE LATER.
