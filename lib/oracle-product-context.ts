// lib/oracle-product-context.ts
// Two contexts injected into the Cockpit chat depending on mode :
//   - PAGES_CONTEXT  → consumed by @hearst/review-mode (review mode, product review checklist)
//   - DOMAIN_CONTEXT → consumed by buildConversationalPrompt (normal mode, expert conversation)
//
// PAGES_CONTEXT lists routes + zones + non-negotiables so the review facilitator can
// anchor remarks on real pages and the document generator can produce P0/P1/P2 items.
//
// DOMAIN_CONTEXT compresses the three domain pillars (data centers, ecosystem, business
// models & finance) into a single string the conversational expert injects in its system
// prompt to answer questions on DC tech, GCC ecosystem, deal archetypes and KPIs.

import type { ProductContext } from "@hearst/review-mode";

// ────────────────────────────────────────────────────────────────────────────
// PAGES_CONTEXT — for review mode
// ────────────────────────────────────────────────────────────────────────────

const PAGES_CONTEXT_TEXT = `# Carte des pages Oracle / Future One Qatar

Projet : présentation A3 plié (4 pages publiques) + Cockpit admin HEARST (2 pages actives). Stack Next.js 14 (App Router) + Supabase + Kimi K2.6 via Moonshot AI.

## Routes publiques (présentation A3 + pitches)

- \`/\` — Redirige vers \`/admin/hearst\`.
- \`/pitch\` — Pitch deck principal (hub).
- \`/pitch-hub\`, \`/pitch-datacenter\`, \`/pitch-mining\` — Variantes thématiques.
- \`/pitch-op-hub\`, \`/pitch-op-datacenter\`, \`/pitch-op-mining\` — Variantes "operator".
- \`/datacenter\` — Page data center publique.
- \`/brochure\` — Brochure deux-pager.
- \`/print\` — Vue print A3 plié (FoldableA3 — REF_W=480, REF_H=680, 4 pages portrait).
  - P1 Cover (\`components/pages/P1Cover.jsx\`) — image cover-facade + titre FUTUR ONE.
  - P2 InsideLeft (\`components/pages/P2InsideLeft.jsx\`) — hero dark 270px + opportunity band 230px + building 100px + footer 80px.
  - P3 InsideRight (\`components/pages/P3InsideRight.jsx\`) — header 122 + phases 102 + mid 282 + picture 82 + building 92 (total 680).
  - P4 Back (\`components/pages/P4Back.jsx\`) — image back-cover + "AI is the new gas."
- \`/rdc-3d\`, \`/rdc-photos\` — Pages immersives.

## Routes Cockpit admin HEARST (\`/admin/hearst/*\`)

- \`/admin/hearst/simulator\` — Investment Simulator. Zone : mode switcher (Simple / Pro), input hero (MW / Capital / IRR), deal archetypes, equipment mix, visualisations (radar / network / matrix / sankey), résultats (KPIs, gantt, 10-year projection), CTA bar (save plan, export MD), génération de mémo stratégique.
- \`/admin/hearst/dossier\` — Decision Canvas & Memo Approval. Zone : canvas de décision, approbation de mémos stratégiques, workflow institutionnel.

## Routes \`/admin/*\` (cockpit générique non-Hearst, hors scope review prioritaire)

\`/admin\`, \`/admin/login\`, \`/admin/activity\`, \`/admin/cockpit-template\`, \`/admin/initiative/[id]\`, \`/admin/notifications\`, \`/admin/operator/[id]\`, \`/admin/partner/[id]\`, \`/admin/partners\`, \`/admin/pipeline\`, \`/admin/roadmap\`, \`/admin/team\`, \`/admin/today\`.

## Non-négociables produit (INTERDICTION d'enfreindre dans toute proposition)

- **Port dev = 5005 EXCLUSIVEMENT** (\`next dev -p 5005\`). Ne jamais proposer 3000/3001/autre, ne jamais modifier \`package.json\` dev script.
- **Design system Cockpit** : tokens \`--ct-*\` uniquement, accents via \`<html data-product="...">\`, composants \`<hearst-asset id="...">\` quand catalog dispo. Aucun hex hardcodé hors \`tokens.core.json\`.
- **Layout locks A3** (P1–P4 portrait 480×680) :
  - P3 InsideRight totaux verrouillés : header 122 + phases 102 + mid 282 + picture 82 + building 92 = 680.
  - P2 InsideLeft : hero 270 + darkBand 230 + building 100 + footer 80 = 680.
  - Constante \`SECTION = { flexShrink: 0, flexGrow: 0, minHeight: 0, overflow: 'hidden' }\` invariante.
  - Ne jamais ajouter padding/margin/gap sur les conteneurs de section sans compensation.
  - REF_W=480 et REF_H=680 dans \`FoldableA3.jsx\` invariants.
- **Inline styles** : ce projet n'utilise PAS Tailwind ni CSS modules. Tout style dans \`style={{...}}\` ou \`globals.css\` :root tokens.
- **Tokens couleur** définis dans \`app/globals.css\` (\`:root\`). Jamais de hex hardcodé dans les composants, toujours \`var(--color-*)\`.
- **Source-strict financial engine** : si un input requis est null, \`lib/hearst-calculations.js\` retourne null (jamais d'invention). Ne jamais proposer de pré-remplir un champ sans \`source_id\`.
- **Deal archetype recommandé = \`powered_shell\` (code B, score 87)** : tout le pitch Hearst repose dessus. Comp directe Meta×Blue Owl Hyperion ($27B, Oct 2025). Ne jamais suggérer d'élever un autre archetype sans raison forte.
- **Capital stack documenté = HEARST + Brookfield + Qatar government** (cf. \`equity_hearst_pct / equity_brookfield_pct / equity_qatar_pct\`). Ne pas inventer d'autre partenaire dans le modèle sans donnée source.
- **Pas de hardcoded API keys**, jamais. Toutes les clés (\`MOONSHOT_API_KEY\`, \`SUPABASE_*\`) via \`process.env.*\`.
- **Auth obligatoire sur \`/admin/**\`** via middleware Supabase. Ne pas proposer de désactiver l'auth.
- **RLS Supabase active sur toutes les tables**. Ne jamais proposer une route qui bypass RLS sauf via \`SUPABASE_SERVICE_ROLE_KEY\` côté serveur.
- **Cockpit shell** = \`@hearst/cockpit-shell@0.2.0\` (tarball local). Toujours réutiliser ses primitives plutôt que recoder un layout chat.
- **Slogans figés du pitch** : "Compute is the new oil and gas. Government control is the new advantage. The window is now." (P2) · "AI IS THE NEW GAS." (P4). Ne pas reformuler dans les pages de prés.
- **Partenaires nommés figés** : design Foster + Partners, construction JB Pastor & Fils. Ne pas changer dans la prés sans demande explicite.

## Vocabulaire produit interne (pour ancrer les remarques)

Archétypes deals : \`powered_shell\` / \`branded_jv\` / \`manage_only\` / \`white_label\` / \`sale_leaseback\`. Tables Supabase : \`cockpit_chats\`, \`cockpit_messages\`, \`hearst_deals\`, \`hearst_scenarios\`, \`hearst_sources\`, \`hearst_contracts\`, \`admin_chat_mode\`, \`review_documents\`, \`llm_runs\`. Composants clés : \`OracleRailNav.jsx\` (nav sections, rail gauche + mobile), \`OracleAdvisorRail.jsx\` (IC advisor rail droit), \`StrategicMemoModal.jsx\` (génération mémo).`;

export const PAGES_CONTEXT: ProductContext = { text: PAGES_CONTEXT_TEXT };

// ────────────────────────────────────────────────────────────────────────────
// DOMAIN_CONTEXT — for normal (conversational expert) mode
// ────────────────────────────────────────────────────────────────────────────

export const DOMAIN_CONTEXT: string = `# Corpus expert Oracle / Future One Qatar — 3 piliers (data centers · écosystème · business models & finance)

## PILIER 1 — DATA CENTERS

### Tier Uptime Institute
- Tier I : 99.671% (~28.8h/an), N, CAPEX ~7–10 k$/kW.
- Tier II : 99.741% (~22h/an), N+1, CAPEX ~10–13 k$/kW.
- Tier III : 99.982% (~1.6h/an), N+1 dual-path, maintenance sans shutdown. CAPEX ~12–18 k$/kW. Standard hyperscale/colo.
- Tier IV : 99.995% (~26 min/an), 2N ou 2N+1, dual-path actif, compartmentalization, 96h fuel. CAPEX ~20–25 k$/kW.
- Tier (Uptime certif) vs Rated (TIA-942). Future One = exiger TCCF (Tier III Certified Constructed Facility) min.

### Density & Cooling
- Density (kW/rack) : legacy 3–7 / high-density 10–20 / hyperscale 30–50 / AI training H100-B200-MI300X 80–132 / NVIDIA GB200 NVL72 **120 kW/rack** / Rubin Ultra projeté 600 kW/rack (2027).
- >25 kW/rack ⇒ liquid cooling obligatoire ; >50 kW ⇒ air pulsé inopérant.
- Air : CRAC (DX) vs CRAH (eau glacée). Hot/cold aisle containment +20–30% efficacité.
- Liquid : RDHx ≤40 kW/rack ; Direct-to-chip 30–45°C warm-water ; CDU isole boucles.
- Immersion single-phase PUE 1.03–1.05 ; two-phase >250 kW/rack (incertitude PFAS).
- Qatar = free cooling bloqué (sec >45°C, wet-bulb >30°C, free cooling <100h/an). Solution : liquid + dry coolers warm-water 40°C+ ou seawater Doha bay.

### PUE & WUE
- PUE industry avg 1.55–1.58 (Uptime 2024). Hyperscale best Google 1.09, Meta 1.08. Qatar air-cooled 1.45–1.65 réaliste, liquid-cooled 1.15–1.25 atteignable.
- WUE avg 1.8 L/kWh. Qatar cible WUE <0.2 (dry coolers + immersion/DTC, sacrifice PUE pour WUE).

### Power topology
- Utility feeds 2N depuis 2 substations indépendantes (Kahramaa 132/220 kV).
- UPS static double-conversion 96–97% (ECO 99%) Li-ion 15 ans vs VRLA 5–7. Rotary Hitec/Piller sans batterie.
- Generators diesel Tier 4 Final 72–96h. Fuel cells Bloom Energy gaz naturel SOFC.
- ATS <16 ms, RPP, busways Starline/Universal Electric.

### Connectivity
- Carrier-neutral obligatoire. Câbles sous-marins Qatar : AAE-1, FALCON, GBI, 2Africa (atterrage Doha 2024), MENA Cable.
- Latences cibles : Doha–Mumbai 30 ms, Doha–Frankfurt 95 ms, Doha–Singapore 110 ms.

### Sustainability
- PPA corporate / sleeved / VPPA (financial hedge + RECs).
- Qatar : Al-Kharsaah 800 MW solaire (TotalEnergies/QatarEnergy COD 2022), Mesaieed 875 MW planifié. Target 4 GW / 30% renouvelable 2030 (QNV2030 = 18%).

### Qatar regulatory & power
- MOTC + CRA (licensing Class A/B, 12–18 mois, capital min QAR 1M).
- PDPPL Law 13/2016 : data localization, transferts soumis à consentement + équivalence.
- NIA v2.0 : classification C1–C4, hosting domestique pour C3/C4.
- QFZ (Ras Bufontas + Umm Alhoul) : 20 ans tax holiday, 0% corporate, repatriation 100%.
- QFC : régime common law, 10% corporate, idéal holding/finco.
- Kahramaa monopole : ~11 GW (2024), tarif industriel **$0.03–0.05/kWh** (parmi les plus bas mondiaux). Connexion HV pour DC >20 MW, lead time 18–24 mois. Pas de wheeling, pas de PPA tiers (sauf via QatarEnergy Renewables).

### Market & valuation
- Demande globale DC 10–15% CAGR 2024–2030. Absorption 7–9 GW/an 2024 vs 3 GW 2021. MENA pipeline >1 GW post-2023 (CAGR 18–22%).
- Hyperscale BTS pre-lease 10–20 ans (15+5+5), NNN, escalators CPI cap 3–4% ou fixed 2–3%/an. Tenant credit A–AAA → SOFR+150–250 bps, LTV 65–75%. Build 18–30 mois. **Time-to-power 12–18 mois Qatar/GCC vs 36+ US = arbitrage majeur**.
- Stabilized YoC 9–13% emerging, 7–9% Tier-1.
- TCAC $/kW/mo : US Tier-1 $130–180 / EU $150–200 / Qatar/GCC $160–220 / Singapour $250–320.
- Capex $/MW : shell+power $8–14M, fit-out $3–6M, total $11–20M ; AI-ready liquid +$2–4M.
- EBITDA margin : colo mature 40–48%, hyperscale BTS 48–58%.
- EV/EBITDA REITs 18–24x (Equinix 22, DR 19, KDC 20). Private mature 20–28x. Emerging 12–16x.
- Cap rates : prime US/EU 5.0–6.5%, Tier-2 7.0–8.5%, **GCC 7.5–9.5%**.
- $/MW transactions : Tier-1 $25–55M, émergent $15–25M, AI-ready >$50M.
- Comps : AirTrunk→Blackstone $16B (Sept 2024) ~800 MW ~$20M/MW. CyrusOne→KKR+GIP $15B (2022). Switch→DigitalBridge $11B (2022). Aligned ~$40B (2025) Macquarie. Compass Brookfield/OTPP $5.5B (2023) 800 MW white-label. **Meta×Blue Owl Hyperion $27B (Oct 2025)** Blue Owl 80% + Meta lease 15 ans = comp directe archetype Hearst.
- AI factories : xAI Colossus Memphis (200 MW→1 GW), Stargate OpenAI/Oracle/SoftBank $500B (Abilene TX 1.2 GW phase 1), Anthropic-Amazon Indiana 2.2 GW, Meta Hyperion Louisiana 2 GW. US constraints (NoVa/Phoenix/Dallas) queues 5–7 ans → **GCC arbitrage** (gaz $2–4/MMBtu, government capex, permitting rapide). Précédents G42/Microsoft $1.5B (Apr 2024), PIF HUMAIN $40B (May 2025).

## PILIER 2 — ÉCOSYSTÈME (compagnies, hyperscalers, capital)

### Hyperscalers anchor tenants
- **AWS** : me-south-1 Bahrain (Jul 2019), me-central-1 UAE (Aug 2022, $5B/15y), me-central-2 KSA annoncée 2024 ($5.3B, livraison 2026–27). Edge Doha via Ooredoo. Requirements Tier III+ (IV préféré), 30–50 MW scalable 100–200 MW, PUE ≤1.3, commitment 15 ans + 2×5, pricing $130–180/kW/mo.
- **Microsoft Azure** : UAE North Dubai + UAE Central Abu Dhabi, **Qatar Central Doha (Aug 2022)** Ooredoo/MOTC, gov Qatar tier-1 customer ~$1B/10y. Saudi Riyadh annoncée 2023→2026. Azure Arc + Governmentty, ISO 27001/27017/27018. Requirements 25–40 MW initial → 80 MW.
- **Google Cloud** : **Doha me-central1 lancée Jun 2023 — 1er hyperscaler à atterrir Qatar**, partenaire MOTC, $1B/5y. Government Controls (Assured Workloads, External Key Manager). Requirements 30 MW initial, PUE ≤1.2.
- **Oracle Cloud (OCI)** : Government Cloud Qatar Doha déployée Oct 2022 via Ooredoo, **1ère government region OCI mondiale** (Dedicated Region C@C). Min 6 racks $6M+/an. Autres : Jeddah, Riyadh, Dubai, Abu Dhabi. $1.5B région.
- **IBM Cloud** : MZRs Doha (Mannai 2023) + Cairo. **Alibaba** : Dubai 2016, négociations Doha 2025. **Huawei** : Riyadh 2022 + Cairo 2023, $400M Saudi 2024, aligned gov MENA.

### AI labs & néo-tenants
- Stargate Project $500B/4y. G42 (Microsoft $1.5B Apr 2024, Cerebras $900M). PIF HUMAIN $40B (May 2025). Anthropic via AWS/GCP. xAI Colossus 2 (1M GPU H200). Mistral/Cohere/Inflection tickets 5–15 MW. Qatar AI Strategy 2024 $2.5B/5y.

### Government & enterprise tenants Qatar
- MOTC Qatar Gov Cloud (~15 MW), QatarEnergy IT (8–12 MW), Qatar Airways (3–5), QNB (4–6 dual-site), Aljazeera (3–4), Ooredoo (8–10).
- Mix tenants BTS 30 MW : 20–25 hyperscaler + 3–5 government + 3–5 retail colo + 2–5 AI. Revenue mix : 65% hyperscaler ($110–130/kW) / 25% government ($180–220/kW) / 10% retail ($250–350/kW).

### Government Wealth Funds GCC
- **QIA** ~$475B (Qatar). Cible $500B 2030. Allocation infra ~15%. CEO Mohammed Al-Sowaidi. Deals : Mandiant (pré-Google), Sila Realty $200M (2024), Reliance Jio $1B (2020).
- **PIF Saudi** ~$925B → $2T 2030. Vision 2030 Digital. HUMAIN $40B AI (Nvidia/AMD/Qualcomm), Center3 carve-out STC $1B+. Gov Yasir Al-Rumayyan.
- **Mubadala (UAE)** ~$330B. G42 (Microsoft $1.5B Apr 2024), Khazna stake history, Yahsat. CEO Khaldoon Al Mubarak.
- **ADQ** ~$240B. GlobalLink DC JV, stake e&. **ADIA** ~$1T (passif via Brookfield/KKR). **KIA Kuwait** ~$1T. **ICD Dubai** ~$320B. **Oman IA** ~$50B. **Bahrain Mumtalakat** ~$18B.

### Operators régionaux DC
- **Khazna (UAE)** Mubadala+G42+IHC, ~150 MW operational, pipeline 1+ GW. Partenaire MS/Oracle/AWS UAE.
- **MEEZA (Qatar)** incumbent national, M-VAULT 1–5, gov+Aljazeera+Ooredoo, IPO Doha 2023, ~40 MW, ambitions hyperscale.
- **Ooredoo DC**, **Vodafone Qatar IDC**, **STC Solutions / Center3 (Saudi)**, **Mobily DC**, **e&/Etisalat by e&**, **Equinix MENA** (Dubai 2022 via Itnet), **Batelco Bahrain** (AWS partner), **Omantel DC** (MS Oman), **Gulf Data Hub UAE** ~30 MW.

### Capital alternatif & banques
- Blackstone (AirTrunk $16B), Brookfield ($30B+ digital infra, Data4, Compass), KKR (CoolIT, GTR, joint-bid AirTrunk perdant), GIP→BlackRock 2024 ($100B+), Macquarie (AirTrunk vendeur 2020 $3B exit 5x, Aligned ~$40B 2025), EQT (EdgeConneX), IPI Partners ($7B+ DC), Stonepeak (Cologix, Digital Edge), AustralianSuper (AirTrunk co-investor), DigitalBridge (Vantage, DataBank, Switch).
- Banques GCC : QNB (lead Qatar sukuk+conv), FAB, Emirates NBD, SNB, Riyad, Mashreq, ADCB. International : Crédit Agricole CIB, MUFG, SMBC, HSBC, ING, Standard Chartered, Société Générale, Goldman Sachs IP.

### Hearst & Futur One (ancré sur le repo)
- Le repo traite Hearst exclusivement comme acteur infra/data center (sponsor opérationnel + brand).
- Capital stack tripartite documenté : \`equity_hearst_pct / equity_brookfield_pct / equity_qatar_pct\` (\`lib/hearst-deal-structures.js\` l. 369–371). **HEARST + Brookfield + sponsor étatique qatari**.
- Brookfield = partenaire financier de référence ("HEARST/Brookfield" pour completion guarantees). Compass Datacenters (Brookfield/OTPP, $5.5B acq 2023) = preferred white-label provider.
- Futur One = "proposed government vehicle to capture, deploy and govern that resource — founded and operated by Hearst Qatar" (P2InsideLeft l. 37–40). Government JV combining state capital + founding operators + Tier-1 industrial partners.
- Acteurs government nommés : QIA + QCRI. Operators candidates : Equinix, NTT, Digital Realty, Vantage, EdgeConnex. O&M : Schneider, Vertiv, Equinix Services. Design Foster + Partners. Construction JB Pastor & Fils.
- The Method (P3InsideRight) : pipeline 4 phases — 01 INCUBATE (pre-seed→seed, 3–6 mo, 20–30 par cohorte) / 02 ACCELERATE (seed→Series A, 6–9 mo) / 03 SCALE (rolling, 20–30 companies) / 04 ANCHOR (Global Tech Bridge, long-term tenancy, hyperscalers + M&A).
- Hub diagram 4 control points : COMPUTE / ENERGY / CAPITAL / TALENT. Slogan "Government by design. Global by intent."
- Funding mechanism : target 70% follow-on à 18 mois (vs MENA <10%). KPI campus : 150 startups, 4K residents, 100K sqm, 200 MW IT power.
- Slogans pitch : "Compute is the new oil and gas. Government control is the new advantage. The window is now." (P2). "AI IS THE NEW GAS. Qatar mastered the resource of the 20th century. The next one is intelligence." (P4 back).

## PILIER 3 — BUSINESS MODELS & FINANCE

### Deal Archetypes (source : \`lib/hearst-deal-structures.js\`)

Scoring 6 dims (brand / bankability / speed / control / margin / exit, 1–5) → composite ×20. Capital gains tax Qatar 10% (Law 24/2018, exemptable QFZA). Dev margin fallback 15%.

#### A. \`powered_shell\` (code B) — **RECOMMANDÉ — composite 87/100**
- Capex HEARST : shell 1.0 + substation 1.0 + grid 1.0 + land 1.0. MEP=0, cooling=0 (tenant). Revenue 0.33 (NNN ~40–80 $/kW/mo). Opex 0. operator_fee 0%. debt_rate_delta -150 bps (NNN tenant covenant pricing < merchant).
- Scores : brand 5 / bankability 5 / speed 4 / control 4 / margin 3 / exit 5.
- HEARST possède terrain + shell + powered infra ; opérateur (Equinix/NTT) locataire NNN 15–20 ans, escalator 3%/an, tech-refresh DLC ≥100 kW/rack /7 ans à charge tenant.
- Comp : **Meta×Blue Owl Hyperion (Oct 2025, $27B, Blue Owl 80%, Meta lease ~15 ans)**.

#### B. \`branded_jv\` (code A) — NON RECOMMANDÉ — composite 63/100
- Capex factor 0.51 toutes composantes. Revenue 0.51. Opex 0.51. operator_fee 0%. debt_rate_delta +75 bps. brand_premium +12%.
- Scores : brand 3 / bankability 3 / speed 2 / control 4 / margin 4 / exit 3.
- SPV co-investi 51/49. Gouvernance HEARST CEO+Chair, opérateur CFO+COO. Tag/drag/ROFR.
- Comp : Equinix×Omantel MC1 Oman (2020), mais brand reste "Equinix MC1".

#### C. \`manage_only\` (code C) — composite 77/100
- Capex 1.0 partout. Revenue 1.0. Opex 1.0. operator_fee 12% revenue. debt_rate_delta 0.
- Scores : brand 5 / bankability 2 / speed 3 / control 5 / margin 5 / exit 3.
- HEARST owns 100%, commercialise direct. Opérateur (Schneider/Vertiv) O&M @ 12%, KPIs uptime ≥99.999% clawback, swap 12-mo notice.
- HEARST porte tout (lease-up, construction, ops, power). Lenders exigent completion guarantees Brookfield.

#### D. \`white_label\` (code D) — composite 80/100
- Capex 1.0. Revenue 1.0. Opex 1.0. operator_fee 20% revenue. debt_rate_delta +50 bps.
- Scores : brand 5 / bankability 4 / speed 3 / control 4 / margin 4 / exit 4.
- HEARST owns 100%, brand-facing. Opérateur anonyme (Compass model). NDA + brand silence covenant.
- Comp : Compass Datacenters (Brookfield/OTPP $5.5B 2023, 800 MW).

#### E. \`sale_leaseback\` (code E) — référence downside — composite 63/100
- compute_as: 'one_time_sale'. sale_yield_target 0.07 (7% cap rate). dev_exit_year 4. tax_rate 0.10 (Qatar CGT).
- Scores : brand 1 / bankability 5 / speed 5 / control 1 / margin 2 / exit 5.
- HEARST develop, vend stabilisé (≥80% occ), optionnel lease-back partiel. Sale proceeds = stabilized_ebitda/0.07 ou fallback total_capex × 1.15.
- "❌ DEFEATS THE BRAND PURPOSE" — uniquement si mandat Qatar politiquement intenable.

#### Recommandation Qatar : powered_shell (B), évolution naturelle vers BTS si hyperscaler signe pre-COD. Fallback white_label (Compass/Brookfield) si pas d'anchor à 18 mois.

### Formules codées (\`lib/hearst-calculations.js\` — source-strict, null si input manquant)
- Energy Cost = it_mw × pue × 8760 × electricity_price_mwh.
- Occupied kW = it_mw × 1000 × occupancy_pct/100.
- Colocation Revenue = occupied_kw × monthly_price_kw × 12.
- EBITDA = revenue − power_cost − opex.
- DSCR = (EBITDA − maintenance_capex) / debt_service.
- Terminal Value = exit_ebitda × exit_multiple (exit multiple, pas Gordon).
- MOIC = (last_cumulative_fcf + terminal_value) / equity_invested.
- NPV = Σ CF_t / (1+r)^t avec t=0 inclus (CF₀ = −capex).
- IRR : Newton-Raphson 200 iter, tol 1e-8, guess 0.10, null si non-convergent.
- Total Capex = (shell+mep+sub+cooling+grid+land+liquid_premium) × total_mw × (1 + capex_contingency_pct/100).
- Projection 10Y : ramp MW linéaire P1/P2/P3 (années 2/4/6), occupancy ramp hardcodée [0, 0.25, 0.45, 0.60, 0.70, 0.78, 0.84, 0.88, 0.91, 0.93, 0.95], escalation (1 + annual_escalation_pct/100)^(y-1), maintenance 2% revenue.
- Debt : annuité française PMT = (P×r)/(1−(1+r)^-n). IO window selon site_readiness (greenfield 2 / land_secured-power_reserved-substation_ready 1 / powered_shell-operational 0). Covenant breach <1.25 DSCR.
- Waterfall 3-tier : Tier 1 lender → Tier 2 pref 8% compound → Tier 3 résiduel split par equity share + terminal value.

### Benchmarks finance
- IRR hurdles : 12–18% levered equity core, 18–25% greenfield, 25%+ value-add. QIA cible 15–20%.
- WACC US/EU 7–9% ; Qatar country premium 150–250 bps (Aa3 stable, peg USD 3.64) → WACC Qatar DC 9–11%. Repo fallback 10%.
- MOIC 5–7y : core 1.8–2.5x / value-add 2.5–3.5x / greenfield 3.5x+. Future One platform cible >3.0x sur 10 ans.
- DSCR banks : min 1.20–1.40, lockup ~1.10, default <1.05.
- EBITDA margin stabilisé : hyperscale 55–70%, colo retail 45–55%.
- Cap rates DC 2025–2026 : prime hyperscale US/EU 5.0–6.0% (Equinix/DR), secondary 6.0–7.0%, GCC 6.5–8.5%.
- Yield-on-cost : hyperscale BTS 9–13%, wholesale 10–13%, retail 11–14%, emerging 13%+. Future One Qatar viser >12% YoC.
- $/kW/mo 2025–2026 : hyperscale BTS $100–140 / wholesale $135–165 / retail $200+. GCC premium +10–20%.
- Churn hyperscale 2–4%, retail 8–12%.
- Opex hors power : staff $200–400k/FTE, 0.5–1 FTE/MW IT. Maintenance 2–4% capex/an. Insurance 0.3–0.6%. Opex/kW critical $20–35/an/kW.

### Capital stack
- Sponsor equity (GP) 2–5% total equity. Carry 20% > hurdle 8%, catch-up 50/50 ou 100%. European waterfall.
- LP equity : QIA anchor cible $300–500M ticket (20–35% LP commitments). Co-anchor : Mubadala, ADIA, PIF. Institutionals CDPQ/OTPP/GIC/Temasek/APG/PGGM/AustralianSuper/CalPERS tickets $50–150M.
- Preferred equity 8–10% PIK-able. Providers KKR Strategic Capital, Brookfield Super-Core, BlackRock GIP.
- Senior debt PF : LTC 60–70% construction, LTV 55–65% stabilized. DSCR 1.30 base / 1.20 lockup. Debt sizing 7–8x EBITDA. Mini-perm 12–15y refi yr 5–7. Pricing SOFR+200–350 bps IG hyperscaler, +350–500 merchant. Commit fee 40–75 bps, upfront 100–175 bps.
- Mezzanine SOFR+700–1200 bps (cash+PIK 50/50), 7–10y, warrants 1–3%. Providers Blackstone TacOpps, Ares Infra Debt, Apollo Hybrid, Antin Mid Cap, AMP Capital infra debt, EIG.
- Green bonds / SLL : ICMA GBP éligible si PUE <1.4 + PPA 80% + water reuse. GCC green sukuk $25B+ 2024. Margin ratchet ±5–15 bps sur KPIs.
- ECAs : JBIC/NEXI (Japon), Korea Exim/K-SURE, Sinosure (Chine), US EXIM, Bpifrance. Tranches SOFR+100–180 bps, 15–18y.
- Sukuk islamic : Ijara (sale-leaseback DC = profit rate), Murabaha, Wakala. Lead QNB Capital, Dukhan, QIB, Masraf Al Rayan, Standard Chartered Saadiq, HSBC Amanah, FAB Islamic. Tenor 7–15y, profit SOFR-eq + 220–350 bps.

### Exit paths
- Sale-leaseback to DC REIT (Digital Realty, Equinix, Khazna, Keppel DC REIT, Mapletree). Cap 6–8%.
- IPO platform : DigiCo ASX/SGX 2024 $2B, Cellnex (EV/EBITDA 22x peak), Bharti Hexacom BSE 2024, Equinix REIT conv, GDS NASDAQ/HKEX. Listings cibles QSE/DFM/ADX/LSE/SGX.
- Secondary infra fund : Brookfield, KKR, Macquarie, EQT, GIP (BlackRock), IPI Partners, Stonepeak, DigitalBridge, AustralianSuper direct, OMERS, CPP Investments.
- Trade sale hyperscaler (Microsoft, Meta rare, AWS preference build, Google). Multiples 25–30x EBITDA.
- Strategic telco : Ooredoo, e&, STC, Zain, Batelco.
- Recap/refinance yr 4–5 : lever up 65→75% LTV, distribute $200–400M, IRR uplift +300–500 bps. Continuation vehicle via Lexington/Ardian/Coller/HarbourVest.

### Hold & multiples sortie
- Hold 5–8y core-plus/value-add. EV/EBITDA 15–22x mature contracted, 10–14x merchant.
- Comps 2023–2025 : $25–50M/MW (Equinix Asia $30–45, Khazna $28–35, AirTrunk $24B Blackstone ~$40M/MW Sept 2024).

### Sensitivities pitch QIA
- Power ±20% (impact EBITDA majeur 40–60% opex). Lease rate ±10%. Occupancy ±10%. PUE ±15%. Exit multiple ±30% (IRR 200–500 bps). FX QAR/USD peg 3.64 = low risk.
- Stress combiné : occupancy −10% + power +20% + exit −20% doit maintenir DSCR >1.10 et IRR >10%.

### Tracking metrics LP
- Financial : NAV quarterly (Kroll/JLL/CBRE/Cushman), DPI, TVPI, RVPI, IRR realized vs projected, MOIC.
- Operational : MW commissioned vs plan, MW contracted, occupancy %, churn, ARPU/MW, PUE 12M, WUE, uptime SLA 99.999%, customer concentration top 5, WAULT 8–12 ans.

### Benchmarks Qatar pitch (synthèse)
- Stabilized YoC 10–12%, exit cap 7.5–8.5%, $/MW build $14–18M shell+power, $/MW exit $28–38M, IRR levered 18–24%, equity multiple 2.2–2.8x sur 7 ans.`;
