# Data Center Only — Benchmarks consolidés (moyenne la plus juste)

> Modèle : **colocation full-ops, Hearst propriétaire-exploitant**, loue les MW dédiés à un prix $/kW/mois.
> **Zéro serveur / zéro GPU fourni** (le client amène ses machines). Qatar / MENA.
>
> Méthode : 10 sous-agents — 9 sur la data sourcée du repo (`datapoints.js`, `hearst-constants.js`,
> `hearst-scenario-cases.js`) + 1 recherche web marché réel 2024-2025 (T&T, CBRE, JLL, Uptime,
> datacenterHawk, GlobalPetrolPrices, Alantra, DCD). Chaque valeur = croisement repo × marché.
> Généré le 2026-06-21.

---

## ⚑ Correction majeure — le management fee

**Le moteur force un fee de 12 % (archétype `manage_only`), ce qui est FAUX pour ce modèle.**
Le `operator_fee_pct` est un coût payé **à un opérateur tiers**, pas ce que Hearst encaisse.
Pour un **owner-operator qui loue ses propres MW, le fee doit être 0 %** (Hearst garde toute la marge,
et porte déjà ses vrais opex : staff, maintenance, assurance, G&A). Booker un fee qu'on se paie à
soi-même = double-comptage. Confirmé par 2 agents indépendants. → **fee 0 % dans le modèle.**

---

## Tableau de calibration — moyenne la plus juste

| Paramètre | **Repo (sourcé)** | **Marché réel (web 2024-25)** | **★ MOYENNE RETENUE** | Confiance |
|---|---|---|---|---|
| **Capex total / MW** (Tier III, hot, hors land) | 7–9 M$ (CBRE/Equinix/Vantage MENA) | 8,8 M$ UAE · 10,8 M$ Saudi (T&T 2024) | **≈ 9,0 M$/MW** (fourchette 8–10,5) | Haute |
| → shell | 4,4 M$ (T&T MENA) | — | 4,4 M$ | Haute |
| → MEP | 3,8 M$ (T&T) | — | 3,8 M$ | Haute |
| → substation | 1,2 M$ (T&T) | — | 1,2 M$ | Haute |
| → cooling (climat chaud) | 1,5 M$ (T&T hot, Qatar 1,4–1,8) | +3–5 % été Gulf | 1,55 M$ | Haute |
| → grid | 0,8 M$ (Ooredoo Qatar) | — | 0,8 M$ | Moyenne |
| → land | **non sourcé** (N/A) | — | **N/A — à sourcer** | — |
| → contingency | 10 % (défaut moteur) | — | 10 % | — |
| **Prix lease $/kW/mois** (hyperscale/wholesale) | hyperscale 110 (NTT MENA) · wholesale 95–130 | wholesale Gulf ~110–140 (extrapolé) | **≈ 120 $/kW/mois** (fourchette 110–140) | Moyenne |
| → retail colo (plafond, non pertinent ici) | 155 (JLL Qatar) | 150–200 | 155 (référence haute) | Moyenne |
| **PUE** (colocation, air, climat chaud) | 1,45 (médiane ; floor air 1,40) | 1,45–1,55 (Uptime/ME +3–5 % été) | **≈ 1,45** (conservateur 1,55) | Haute |
| **Électricité industrielle Qatar** | $30 (bootstrap, artefact) vs **$42** (KAHRAMAA datapoint) | $36–43/MWh (GlobalPetrolPrices/Climatescope) | **≈ $42/MWh** (le $30 sous-estime) | Haute |
| **EBITDA margin** (full-ops, porte tous opex) | Equinix 47 % · Digital Realty 43 % | Equinix 47 %→51 % · DLR ~54 % · stabilisé ~50 % | **≈ 50–55 %** (PAS 55–65 % = c'est du NNN) | Haute |
| **Leverage (debt %)** | 62 % DLR · 65 % Brookfield · case Base 65 % | LTV 55–65 % (greenfield) | **≈ 65 %** (fourchette 60–70) | Haute |
| **Taux de dette** | base 6,5 % + Qatar ; case Base 7 % | 6,5–7,5 % (Gulf single-asset) | **≈ 7,0 %** | Haute |
| **Terme de dette** | 12 (défaut) · 15 (case Base) · JBIC 25 ans (MEEZA/Ooredoo) | 10–20 ans | **15 ans** | Haute |
| **DSCR** | covenant 1,25 · cible 1,35 · strong 1,50 | cible ~1,3–1,5 | covenant **1,25** / cible **1,35** | Haute |
| **Exit multiple (EV/EBITDA)** | base 16–18× Qatar (impliqué cap 5,5–6,25 %) | 15–22× prudent Gulf (25–30× = trophy US) | **≈ 15×** (cap ~6,75 %) | Moyenne |
| **Cap rate de sortie** | Qatar 6–8 % (premium émergent vs US 5–6 %) | 6,5–7,5 % Gulf (US + prime pays) | **≈ 6,75 %** | Moyenne |
| **IRR equity cible** (stabilisé, levered) | 15 % (Brookfield = hurdle IC) ; QIA 12 % | greenfield net 14–18 % / gross 18–22 % | **≈ 15 %** (12 % tranche souveraine) | Haute |
| **MOIC cible** (10 ans) | infra 1,8–2,5× (3–4× = AI dev) | — | **≈ 2,0–2,5×** | Haute |
| **WACC / discount** | 10 % (Damodaran Qatar Aa, +0,41 pt vs US) | 9–11 % | **10 %** | Haute |
| **Preferred return** | 8 % (LP hurdle standard) | 8 % | **8 %** | Haute |
| **Occupancy stabilisé** | 90 % (case Base, JLL) ; vacance MENA <5 % | 95–96 % implicite | **90 %** (80 % prudent / 95 % upside) | Haute |
| **Ramp-up** (an1→an10) | 25→45→60→70→78→84→88→91→93→95 % | — | idem (courbe moteur) | Haute |
| **Escalation loyers** | 2 % (défaut, sous-calibré) · 3 % (Mayer Brown Qatar) | 2,5–3 % | **3 %/an fixe** | Haute |
| **Phasing** | 3 phases 40/30/30, années 2/4/6 | — | idem | Haute |
| **COD offset** (powered shell) | 9 mois ; greenfield grid Qatar 24 mois | grid KAHRAMAA 24 mois | **9 mois** (24 si greenfield) | Haute |
| **Operator fee** | 12 % (manage_only) — **FAUX pour owner-op** | 10–15 % = fee opérateur TIERS | **0 %** (Hearst garde tout) | Haute |
| **Impôt sociétés** | 10 % (défaut moteur, Law 24/2018) | — | **0 % QFZA** (Free Zone, Law 34/2005, 20 ans) | Haute |
| **Amortissement** | ~~10 ans~~ → **15 ans** straight-line | Qatar GTA Art. 16 (bâti 5 %=20 ans, MEP/clim 20-25 %=4-5 ans, élec 5 %=20 ans) + REIT 10-K (DLR ~21 ans, Equinix ~15-17 ans) | **15 ans** (blend pondéré capex) | Haute |
| **Capital gains (exit)** | 10 % (exemptable QFZA) | — | 0 % sous QFZA | Moyenne |
| **Equity split** | Hearst 20 / Brookfield 55 / QIA 25 (hypothèse) | comps : Brookfield lead 55–80 % | 20 / 55 / 25 | Moyenne (non signé) |

---

## Comps réels Qatar/Gulf (calibration)

- **MEEZA (Qatar)** — 4e DC Doha, **$219M pour +44 MW** (phase 1 : 24 MW dont 6 MW IA), facilité islamique
  Dukhan Bank 2025. ⇒ ~$5M/MW (expansion sur infra existante, plancher). Dette JBIC 25 ans.
- **Ooredoo (Qatar)** — QR2Md / **$1Md pour >120 MW** ⇒ ~$8,3M/MW (cohérent T&T UAE $8,8M).
- **Khazna (UAE)** — national champion, ~150 MW op., pipeline 1 GW (850 MW d'ici 2029). Benchmark structure.
- **Landings hyperscaler Doha** — Google ($1B/5y, 30 MW), Microsoft ($1B/10y, 25–40→80 MW), Oracle
  ($1,5B, 1ère gov region OCI). ⇒ fenêtre 60–100 MW = exactement la cible.
- **Précédent capital** : QIA × Brookfield × Qai **$20B AI** (~60 % leverage) = modèle du capital stack.

## Contraintes infra Qatar (build-path)
- Grid headroom : **8 000 MW national** / **200 MW réservés digital-infra** (MOU QIA-KAHRAMAA).
- Lead times : transformateur 50 MVA **22 mois**, connexion grid 50 MW **24 mois**, permis QFZA **6 mois**.
- Climat : free cooling bloqué (>45 °C), liquid/dry-cooling obligatoire, water stress 4,7/5.
- Élec : parmi les moins chères au monde ($36–42/MWh) = **avantage compétitif structurel**.

---

## Écarts moteur à corriger (pour un modèle juste)
1. **Fee 12 % → 0 %** (owner-operator). Le plus matériel : ~5–12 pts de marge EBITDA récupérés.
2. **Électricité $30 → $42** (le bootstrap mélange tarif commercial $28 + industriel $32).
3. **Tax 10 % → 0 %** si logé en QFZA Free Zone (override `tax_rate_pct: 0`).
4. **Escalation 2 % → 3 %** (sous-calibrée vs Mayer Brown Qatar).
5. **Occupancy bootstrap 80 % → 90 %** (case Base).
6. **`manage_only` n'a pas de fee neutralisable** via l'API → le vrai owner-operator demande soit un
   patch moteur (archétype `owner_operator` fee 0), soit un fixture édité à la main.
