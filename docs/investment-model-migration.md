# Migration moteur financier — Cartographie & Classification

> **Date :** 2026-06-21
> **But :** dégager le terrain pour accueillir un modèle financier simple, transparent et
> défendable issu du HTML canonique, **sans casser l'app existante** et **sans rien
> supprimer à l'aveugle**.
>
> **Mode appliqué :** audit conservateur. Aucune suppression effectuée. Aucun chiffre ni
> formule du moteur modifié. Seuls ajouts : doc + emplacement réservé `lib/investment-model/`
> + marqueurs `TO_BE_REPLACED_BY_CANONICAL_QATAR_MODEL`.

---

## 0. Source canonique

| Fichier | Rôle | Touché ? |
|---|---|---|
| `docs/qatar-sovereign-investor-memorandum.html` | **Source de vérité** : modèle financier + narratif + scénarios Qatar | ❌ JAMAIS |
| `docs/qatar-sovereign-two-pager.html` | Version courte | ❌ JAMAIS |

Standalone : **aucun import** de ces HTML dans `app/`, `components/`, `lib/`. Ils ne sont
couplés à rien — c'est délibéré. Le futur modèle les transcrira à l'identique dans
`lib/investment-model/`.

---

## 1. Cartographie (résumé)

Couvert par 4 explorations parallèles read-only. Constat global : **le moteur historique
est dense, interconnecté et fortement testé (36 fichiers de tests vitest). Aucun fichier
scénario/calcul/source n'est mort.** Tout export majeur a au moins un consommateur réel
(routes API `simulate` / `strategic-memo` / `scenarios` / `cockpit-chat`, pages cockpit, PDF).

Conséquence : **il n'y a PAS de code mort à supprimer en sécurité aujourd'hui.** Le problème
n'est pas du code orphelin, c'est un moteur auquel l'utilisateur ne fait plus confiance
(returns surévalués, double-count GPU/TV, hypothèses opaques — cf. audit 2026-06).
La bonne action n'est donc pas la suppression mais la **mise en quarantaine + remplacement
planifié**.

### Flux d'appel du moteur actuel
```
POST /api/admin/hearst/simulate
  ├─ bootstrapScenarioFromSources()      (lib/hearst-bootstrap.js)
  ├─ solveScenarioForMode()              (lib/hearst-solver.js)
  ├─ projectArchetype() → generateProjection()  (lib/hearst-deal-structures.js → lib/hearst-calculations.js)
  ├─ calcHardwareBreakdown()             (lib/hearst-gpu-catalog.js)
  ├─ foldGpuRevenue()                    (lib/hearst-calculations.js)
  ├─ generateDebtSchedule()
  └─ generateWaterfall()

POST /api/admin/hearst/strategic-memo
  ├─ resolveTruthProjection() → projectArchetype()/generateProjection()+foldGpuRevenue()
  ├─ buildIntelligenceBrief()            (lib/oracle-intelligence/*)
  ├─ getGpuPricingBrief/getEnergyBrief/getInfrastructureSignals()  (lib/oracle-live/*)
  ├─ Kimi/OpenAI LLM
  ├─ reconcileMetricsWithEngine()        (lib/engine-reconcile.js)
  └─ persistMemo()
```

---

## 2. Classification

### 🟢 KEEP — générique, réutilisable, à préserver tel quel

| Élément | Chemin | Raison |
|---|---|---|
| Formatters | `lib/hearst-format.js` | Glyphes USD/%/x/MW/yr, agnostique du moteur. Le futur modèle réutilise. |
| Primitives DS | `components/hearst/ui/*` (Button, Card, Table, Field, Badge, SectionHead, Eyebrow, KpiGrid) | Pur rendu, tokens `--cp-*`. |
| Composants de viz | `KpiCard`, `CapitalDonut`, `CapitalStructureGrid`, `ProjectionChart`, `GanttTimeline`, `Tornado`, `ArchetypeRadar`, `FinancialSankey`, `EcosystemNetwork` | Rendu paramétré par données, réutilisable par le futur renderer. |
| Layout / nav | `app/(cockpit)/admin/hearst/layout.jsx`, `components/OracleRailNav.jsx` | Shell 3 colonnes, indépendant du calcul. |
| Export PDF (structure) | `app/api/admin/hearst/strategic-memos/[id]/pdf/route.js` (mécanique HTML→PDF) | Le pipeline d'export est réutilisable ; seules les données source changeront. |
| Infra transverse | `lib/logger.js`, `lib/retry-with-backoff.js`, `lib/env-validation.js`, `lib/supabase-*.js`, `lib/auth-guards.js` | Hors périmètre modèle, sain. |
| Tests utiles génériques | `test/.../logger.spec.js`, `retry-with-backoff.spec.js`, `env-validation.spec.js`, `middleware.spec.js`, `api/idor.spec.js`, `api/auth-guards-wiring.spec.js`, `validators/hearst.spec.js` | Sécurité/infra, à garder. |

### 🟡 QUARANTINE — potentiellement utile mais non fiable / trop couplé

> Reste **en place et fonctionnel** (l'app ne casse pas). Marqué `TO_BE_REPLACED`.
> À ne PAS étendre. Sera retiré quand le modèle canonique sera live.

| Élément | Chemin | Raison quarantaine |
|---|---|---|
| Moteur de calcul | `lib/hearst-calculations.js` (59 KB) | Cœur, mais audité comme surévaluant les returns (FCFE floor, IDC, double-count GPU/TV). Non fiable → remplacement, pas patch. |
| Archétypes (×8) | `lib/hearst-deal-structures.js` | 8 archétypes opaques, scaling factors non sourcés. Le HTML n'en a pas besoin. |
| Solver inverse | `lib/hearst-solver.js` | Dépend de `generateProjection()` quarantiné. |
| Bootstrap sources | `lib/hearst-bootstrap.js` | Préremplissage médiane depuis `PUBLIC_SOURCES_LIBRARY` — logique de dérivation opaque. |
| GPU catalog/fold | `lib/hearst-gpu-catalog.js` | Source du double-count signalé à l'audit. |
| Cas scénarios | `lib/hearst-scenario-cases.js` | 3 cas (conservative/base/upside) à overrides figés ≠ bear/base/bull du HTML. |
| Réconciliation/dérivation | `lib/engine-reconcile.js`, `lib/dossier-derive.js`, `lib/returns-composition.js`, `lib/hearst-board-metrics.js`, `lib/hearst-results-view.js`, `lib/memo-confidence.js` | Lisent les sorties du moteur quarantiné → à re-pointer vers le futur modèle. |
| Grounding deal | `lib/oracle-active-deal.js`, `lib/oracle-deal-grounding.js`, `lib/advisor-context-from-scenario.js` | Réinjectent les métriques moteur dans le chat. |
| Intelligence statique | `lib/oracle-intelligence/*` (datapoints, comparables, tensions, absorption, reality, entities) | Benchmarks alimentant le LLM. Utiles comme corpus, mais non vérifiés ; ne pas les confondre avec la vérité chiffrée du HTML. |
| Sources library | `lib/hearst-constants.js` (`PUBLIC_SOURCES_LIBRARY`, `FINANCIAL_THRESHOLDS`, etc.) | Massivement consommé ; contient des seuils financiers à re-valider contre le HTML. |
| Presets/picker/fit | `lib/hearst-config-presets.js`, `lib/financial-scenario-picker.js`, `lib/hearst-fit-matrix.js` (affichage only) | Couplés aux archétypes historiques. |

### 🔴 DELETE CANDIDATE — obsolète / redondant (suppression à VALIDER, pas faite)

> Aucune suppression appliquée. Liste de candidats à confirmer manuellement.

| Élément | Chemin | Pourquoi candidat | Preuve d'usage |
|---|---|---|---|
| Scrapers live | `lib/oracle-live/*` (gpu-pricing, energy, infra-signals, providers/) | Best-effort, alimentent uniquement le mémo LLM ; fragiles, non testés sur le réseau. | Appelés par `strategic-memo` (await Promise.allSettled) — **PAS mort**, donc suppression = perte de feature, pas de cleanup. À trancher : garde-t-on l'enrichissement live ? |
| Explainability | `lib/oracle-explainability.js` (133 KB) | Énorme pour 3 usages dans une seule route. | Importé par `strategic-memo/route.js` (explainMetric, simplifyTechnicalTerm, detectJargon). **PAS mort.** Candidat à allègement, pas à suppression sèche. |

**Verdict DELETE :** **rien ne qualifie pour suppression immédiate sûre.** Les deux candidats
sont effectivement utilisés. Les supprimer = retirer une feature (enrichissement live /
vulgarisation mémo), pas nettoyer du mort. → décision produit requise, hors périmètre de ce passage.

### 🔵 REWRITE LATER — à remplacer par le modèle canonique du HTML

| Domaine | Remplacé par |
|---|---|
| Tout le calcul `lib/hearst-calculations.js` | `lib/investment-model/calculations/` |
| Archétypes `lib/hearst-deal-structures.js` + cas `lib/hearst-scenario-cases.js` | `lib/investment-model/scenarios/` (bear/base/bull canoniques) |
| Inputs épars (bootstrap, presets, thresholds) | `lib/investment-model/assumptions/` |
| Dérivations board/dossier/returns | `lib/investment-model/renderers/` + `formatters/` |
| Garde-fous "pas de nombre inventé" | `lib/investment-model/validation/` |

---

## 3. Dépendances clés (pour le futur découplage)

- `simulate/route.js` est le **point d'entrée** : tout le moteur quarantiné part de là.
- `strategic-memo/route.js` est le **convergent** : moteur + intelligence + live + LLM.
- Les pages `simulator`, `simulator/results`, `financial`, `dossier` **lisent** les sorties
  (elles ne calculent pas) → faciles à re-pointer vers le futur modèle plus tard.
- Les composants de viz sont **data-driven** → réutilisables sans modification.

---

## 4. Recommandation

**SAFE TO PROCEED** sur la préparation (fait : doc + squelette + marqueurs).
**NEEDS DECISION** avant toute suppression (`oracle-live/*`, `oracle-explainability.js`) et
avant de brancher quoi que ce soit dans `lib/investment-model/` :

1. Garde-t-on l'enrichissement live (`oracle-live`) et la vulgarisation (`oracle-explainability`)
   dans le futur produit, ou on les retire au passage au modèle canonique ?
2. Quels scénarios canoniques exacts (bear/base/bull) extrait-on du HTML, et avec quels inputs ?

Tant que ces décisions ne sont pas prises, **on n'implémente pas** le moteur et **on ne supprime rien**.
