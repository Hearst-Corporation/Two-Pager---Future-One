# TICKET — Hardcode Elimination Audit

**Status:** VERIFIED & TRIAGED · 2026-05-29 (audit pass complete)
**Opened:** 2026-05-29

---

## RÉSULTATS DE VÉRIFICATION (pass 2026-05-29)

Vérification depuis le code (pas de confiance au ticket). Conclusion : **ORACLE est déjà largement véridique.** Les vues institutionnelles tirent 100% de leurs données des API/DB ou du moteur.

| Axe | Verdict | Preuve |
|---|---|---|
| **B2 — DEMO_* fuite ?** | ✅ AUCUNE | Seul `visuals-preview` importe `DEMO_SCENARIOS`/`DEMO_PHASES` |
| **G2 — valeurs hors-moteur ?** | ✅ AUCUNE | executive/dossier/library = `fetch()` DB ; simulator = `projection` issu de `/api/.../simulate` |
| **F2 — GCC en dur en prod ?** | ✅ AUCUNE | `regions` dérivé de `memos.map(m=>m.region)` ; `Location` fallback honnête `'Qatar'` |
| **D2 — dates figées en prod ?** | ✅ AUCUNE | aucune année/Q en dur hors `visuals-preview` (démo) |
| **C2 — providers fake en prod ?** | ✅ AUCUNE | tokens couleur uniquement (non rendus comme données) |
| **E2 — labels "live" trompeurs ?** | ✅ AUCUN | "Live" = statut de deal / trace moteur réelle ; "No live signals loaded" = état vide honnête |

### Finding réel unique → CORRIGÉ
**FIX1** — `reports/page.jsx` : nom de projet en dur. Ligne 102 (titre PDF CONFIDENTIAL, **sans fallback**) + ligne 108 (variante incohérente `'HEARST Qatar Data Center Hub'` sans "AI &"). Le nom canonique vit en DB (`project/route.js:19`, auto-créé). **Corrigé** : ligne 102 branchée sur `project?.name`, ligne 108 alignée sur la chaîne canonique. Le titre du PDF reflète désormais la DB ; incohérence de label éliminée.


**Freeze commit:** `a4f3024` — `feat(spatial): freeze checkpoint after placeholder architecture cleanup`
**Scope:** institutional ORACLE views (`/admin/hearst/*`) + spatial visual layer. Excludes standalone `/pitch-*` and `/rdc-*` marketing routes.

> Objective: inventory every hardcoded / fake / stale value that could reach a stakeholder. **No code in this ticket.** Each item is a finding to be triaged in a future sprint.

---

## A. Données hardcodées

| # | Fichier | Détail | Sévérité |
|---|---|---|---|
| A1 | `app/(cockpit)/admin/hearst/visuals-preview/page.jsx` | `DEMO_SCENARIOS` (5 objets) — IRR/MOIC/CAPEX/MW/COD/risk/confidence en dur | P2 — page QA, gated "NOT FOR PRESENTATION" |
| A2 | `app/(cockpit)/admin/hearst/visuals-preview/page.jsx` | `DEMO_PHASES` (3 phases) — durées, MW livrés, dates COD en dur | P2 — idem |
| A3 | `app/api/admin/hearst/strategic-memos/[id]/pdf/route.js` | hex inline dans le stylesheet PDF (`#7a1730`, `#9fb8c4`, `#1b7a4b`, etc.) | P3 — acceptable (PDF ne peut pas fiabiliser les CSS vars) |
| A4 | `lib/spatial/tokens.ts` | 46 hex — mais en **fallback** de `c('--color-*', '#hex')` (pattern DTCG canonique) | ✅ Non-finding — à conserver |

## B. Scénarios de démonstration

| # | Emplacement | Détail | Sévérité |
|---|---|---|---|
| B1 | `visuals-preview/page.jsx` | "Qatar 100MW", "KSA 200MW Hyperscale", "UAE 75MW GPU Cloud", "GCC 500MW Sovereign" — noms + métriques fabriqués | P2 — ne jamais réutiliser hors page placeholder |
| B2 | À vérifier | confirmer qu'aucun composant production (executive/dossier/library/simulator) n'importe `DEMO_SCENARIOS` | P1 — **vérification requise** (à ce jour : seul `visuals-preview` l'importe) |

## C. Providers / labels fake

| # | Fichier | Détail | Sévérité |
|---|---|---|---|
| C1 | `lib/spatial/tokens.ts` | noms de providers en tokens : `--color-op-ntt`, `--color-op-nvidia`, `--color-op-cbre`, `--color-op-coreweave`, `--color-op-lambda`, `--color-op-vantage`, `--color-op-qia`, `--color-op-cra`, `--color-op-mayer_brown`, `--color-op-qai` | P3 — tokens couleur, pas des données affichées ; vérifier qu'aucun n'est rendu comme libellé provider réel |
| C2 | À auditer | rechercher tout libellé provider en dur dans les renderers / cartes (non issu de la DB) | P2 |

## D. Dates figées

| # | Emplacement | Détail | Sévérité |
|---|---|---|---|
| D1 | `visuals-preview/page.jsx` | COD dates en dur : `Q4 2026`, `Q2 2028`, `Q2 2029` | P2 — démo only |
| D2 | À auditer | rechercher toute date/année en dur dans executive/dossier/library (ex. "2027", "2026") non dérivée de la donnée | P2 |

## E. Labels incohérents

| # | Fichier | Détail | Statut |
|---|---|---|---|
| E1 | `visuals-preview/page.jsx` | ~~"Top-down SVG", "Illustrative SVG (no WebGL)"~~ → corrigés en "placeholder (awaiting approved asset)" | ✅ **CORRIGÉ** dans `a4f3024` |
| E2 | À auditer | rechercher labels "live" / "AI-generated" / "real-time" trompeurs dans les vues institutionnelles | P2 |

## F. Données Qatar / UAE / KSA / GCC figées

| # | Emplacement | Détail | Sévérité |
|---|---|---|---|
| F1 | `visuals-preview/page.jsx` | régions + métriques GCC en dur dans `DEMO_SCENARIOS` (region: 'Qatar'/'KSA'/'UAE') | P2 — démo only |
| F2 | À auditer | toute valeur régionale GCC en dur dans un composant production (MW dispo, tarifs énergie, capacités grid) non issue du moteur/DB | P1 — **à inventorier** |

## G. Valeurs de simulation non issues du moteur

| # | Emplacement | Détail | Sévérité |
|---|---|---|---|
| G1 | `visuals-preview/page.jsx` | IRR/MOIC/CAPEX dans `DEMO_*` ne passent pas par le moteur financier | P2 — démo only, gated |
| G2 | À auditer | confirmer que `simulator` + `dossier` + `executive` + PDF ne calculent **que** via le moteur (aucune valeur exemple en dur dans le rendu) | P1 — **vérification requise** |

---

## Bugs adjacents identifiés (hors hardcode, à tracker séparément)

| # | Détail | Sévérité |
|---|---|---|
| BUG1 | `/api/admin/hearst/scenarios` → **400 Bad Request** quand `project_id` absent (visible sur dossier) | P1 — bug data pré-existant, page dégrade proprement |

---

## Méthode de résolution proposée (futur sprint — ne pas exécuter ici)

1. Confirmer la frontière : `DEMO_*` ne doit vivre que dans `visuals-preview` (page QA gated). Tout import ailleurs = P1.
2. Grep production views pour : valeurs numériques en dur ressemblant à IRR/MOIC/MW/CAPEX, années, noms de pays GCC, noms de providers.
3. Pour chaque finding production : remplacer par donnée moteur/DB, ou marquer explicitement "exemple / non contractuel".
4. Garder `tokens.ts` (fallbacks DTCG) et les SVG PDF (hex stylesheet) tels quels — non-findings.

**Aucun développement dans le cadre de ce ticket. Inventaire uniquement.**
