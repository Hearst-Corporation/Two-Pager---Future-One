# Prompt d'audit — Agent principal (chat « Assistant ORACLE »)

Livrable réutilisable pour faire auditer, par un ingénieur senior ou un LLM ayant accès au repo,
l'échafaudage de l'agent de chat du cockpit Oracle (rail droit « Assistant ORACLE », endpoint
`POST /api/cockpit-chat`). Objectif : juger si l'agent est **cadré** proprement, quels **outils**
il a, quel **contexte** il reçoit, et s'il est **propre / pas sur-contexte / bien fait de A à Z**.

> État du code au moment de l'écriture (commits `…f625df3`) : le chat tourne sur **OpenAI GPT-4.1
> (défaut) / GPT-4o (whitelist)** via `lib/llm/openai-chat.ts` (`openaiChatStream`). Le générateur
> de **mémo stratégique** (`/api/admin/hearst/strategic-memo`) reste sur **Kimi K2.6 / Moonshot**
> (`lib/llm/kimi.ts`) — hors périmètre de cet audit. La cartographie de tailles de l'appendice
> (couche constitutionnelle, DOMAIN_CONTEXT, prompts de base) est **indépendante du provider** :
> les builders de prompt n'ont pas changé.

## Comment l'utiliser

Coller le bloc « **Le prompt** » ci-dessous à un agent auditeur ayant accès en lecture au repo
(ou l'exécuter via `/audit --axe code --profil expert`). L'auditeur lit d'abord, **dans cet ordre**,
les fichiers d'échafaudage qui composent la requête LLM : `app/api/cockpit-chat/route.ts`,
`lib/llm/openai-chat.ts`, `lib/oracle-system-prompt.js`, `lib/oracle-product-context.ts`,
`lib/review-mode/prompts.ts` + `oracle-prompts.ts`, `lib/review-mode/prompt-hash.ts`,
`lib/oracle-deal-grounding.js` + `lib/oracle-active-deal.js`, `lib/review-mode/user-tuning.ts`,
`lib/cockpit-chat-payload.js` + `components/admin/CockpitChatBridge.jsx`. Puis exécuter la méthode
et produire le livrable.

## Le prompt

```text
RÔLE : Tu es ingénieur senior LLM/plateforme. Tu audites l'agent principal du cockpit Oracle —
le chat "Assistant ORACLE" (rail droit), endpoint POST /api/cockpit-chat. Objectif : juger si
l'agent est CADRÉ proprement pour répondre, quels OUTILS il a, quel CONTEXTE il reçoit, et s'il est
PROPRE, PAS SUR-CONTEXTE, et bien fait DE A À Z. Tu écris pour un décideur technique : concret,
chiffré, fichier:ligne, aucune généralité.

CONTEXTE PROVIDER (à vérifier en premier, signaler si confirmé) :
- Le chat route vers OpenAI GPT via lib/llm/openai-chat.ts -> openaiChatStream. Modèle par défaut
  gpt-4.1 ; gpt-4o sélectionnable (whitelist serveur resolveChatModel ; override via body.model).
  Params envoyés : max_tokens=4096 EN DUR (route.ts), stream:true. ABSENTS : temperature, top_p
  (defaults OpenAI -> non-déterminisme). Client : maxRetries=2, timeout=LLM_MODEL_TIMEOUT_MS||300s,
  PAS de fallback provider.
- ZÉRO outil : grep négatif attendu sur "tools", "tool_choice", "function_call", "retrieval"/RAG.
  Le seul "grounding" est un bloc TEXTE statique injecté, pas un outil de fetch.
- Le générateur de mémo (strategic-memo) tourne sur Kimi/Moonshot (lib/llm/kimi.ts) : HORS PÉRIMÈTRE.
- Compare le budget tokens à la fenêtre gpt-4.1 (contexte ~1M / output ~32k) : le problème probable
  n'est pas la fenêtre mais le COÛT/LATENCE et le ratio signal/bruit.

FICHIERS D'ÉCHAFAUDAGE À INSPECTER (chemins exacts, lire dans cet ordre) :
1.  app/api/cockpit-chat/route.ts            (assemblage system prompt, ordre des blocs, garde-fous)
2.  lib/llm/openai-chat.ts                   (client : model, whitelist, max_tokens, retries, coût)
3.  lib/oracle-system-prompt.js             (couche constitutionnelle buildOracleSystemPrompt)
4.  lib/oracle-product-context.ts           (DOMAIN_CONTEXT, PAGES_CONTEXT)
5.  lib/review-mode/prompts.ts              (CONVERSATIONAL / DOCUMENT)
6.  lib/review-mode/oracle-prompts.ts       (buildOracleFacilitatorPrompt)
7.  lib/review-mode/prompt-hash.ts          (câblage prompts + hash observabilité)
8.  lib/oracle-deal-grounding.js           (buildDealGroundingBlock)
9.  lib/oracle-active-deal.js              (resolveActiveDeal — voie b)
10. lib/review-mode/user-tuning.ts          (tuningBlock /pref)
11. lib/cockpit-chat-payload.js             (buildChatDealPayload — voie a)
12. components/admin/CockpitChatBridge.jsx  (patch window.fetch, injection body.deal)

MÉTHODE OBLIGATOIRE :
1. RECONSTITUER le system prompt final dans l'ORDRE EXACT des blocs, tel qu'assemblé runtime :
   finalSystemPrompt =
     oraclePrefix (buildOracleSystemPrompt(oracleCtx))
     + "\n\n---\n\n"
     + baseSystemPrompt (review ? FACILITATOR : CONVERSATIONAL)
     + tuningBlock (renderTuningBlock(listActiveTunings(userId)))   [accolé SANS séparateur]
     + (groundingBlock ? "\n\n" + groundingBlock : "")
   messages = [ {role:'system', content:finalSystemPrompt}, ...history ]
   NB : le message user courant n'est PAS un élément distinct en fin de tableau — il est poussé
   dans history AVANT. history = cockpit_messages Supabase rechargés par chatId, ordre created_at
   ascendant, AUCUNE troncature. Confirme ou infirme cet ordre par lecture.
2. MESURER les tokens de CHAQUE couche pour UNE REQUÊTE TYPE (chat normal, /admin/hearst,
   stakeholder=operator, region=qatar, 0 overlay, output_required=true, brevity=standard,
   1 deal actif grounding ~190 tok, 1 règle tuning). Exécute en local :
     node -e "const m=require('./lib/oracle-system-prompt.js');
              const s=m.buildOracleSystemPrompt({stakeholder:'operator',region:'qatar',overlays:[],
              output_required:true,brevity:'standard',surface:'cockpit-chat'});
              console.log(s.length, Math.round(s.length/4));"
   Idem pour CONVERSATIONAL_PROMPT, FACILITATOR_PROMPT, DOMAIN_CONTEXT, grounding type, tuning type.
   Reporte chars + tokens (chars/4, marge ±15%). Calcule le TOTAL system prompt AVANT historique,
   puis estime un total réaliste à 10 tours d'historique (rechargé en entier à chaque tour).
3. COMPARER total vs fenêtre gpt-4.1 (contexte ~1M, output ~32k). Donne le RATIO
   contexte-système / question-utilisateur typique (question courte ~30 tok) et la PART de prompt
   probablement ignorée par le modèle (11 sections memo + 10 guardrails + 30 benchmarks en Q&A).

7 AXES — pour chacun : questions précises + CRITÈRE D'ÉCHEC MESURABLE.

A. CADRAGE & RÔLE
   - Combien de couches définissent le rôle/ton ? (constitutionnelle ORACLE_CONSTITUTION.identity ;
     CONVERSATIONAL/FACILITATOR ; tuning). Y a-t-il DEUX personas concurrentes (EN "ORACLE platform"
     vs FR "Oracle analyste senior Hearst", prompts.ts) co-injectées ?
   - Instructions contradictoires : brevity 'standard' + CONVERSATIONAL "1-3 phrases / ~120 mots"
     vs output_framework "11 sections de memo" injecté même en chat (output_required=true par défaut).
   ÉCHEC SI : ≥2 personas distinctes co-injectées ; OU une instruction de longueur courte coexiste
   avec une structure longue imposée sans gating de mode réel.

B. CONTEXTE & SUR-CONTEXTE
   - Tokens par couche + total (du calcul ci-dessus). DOMAIN_CONTEXT (~4 582 tok) est-il injecté
     plusieurs fois (CONVERSATIONAL + FACILITATOR + DOCUMENT) ? Redondance constitutionnelle vs
     DOMAIN_CONTEXT (Qatar/Vision2030/Kahramaa redonnés 2x ; "pas de chiffres inventés" 4x).
   - brevity='concise' réduit-il VRAIMENT le prompt ? (mesure : concise vs standard).
   ÉCHEC SI : system prompt > 8 000 tok avant historique pour un chat sidebar ; OU DOMAIN_CONTEXT
   injecté >1x ; OU brevity='concise' économise <5 % des chars ; OU ratio contexte/question > 200:1.

C. OUTILS
   - Constat attendu : ZÉRO outil. Pas de tools / tool_choice / function-calling / retrieval/RAG.
     L'appel est openaiChatStream({model, messages, max_tokens:4096}), rien d'autre.
   - Le seul "grounding" est STATIQUE (bloc texte injecté), pas un outil de fetch. Évalue le
     trade-off : faut-il un deal-fetch tool (lecture DB à la demande au lieu d'injection systématique)
     et/ou un calculator tool (au lieu de coller la projection) ? Chiffre l'économie de tokens d'un
     passage injection -> tool-on-demand. GPT-4.1/4o supportent nativement le function-calling.
   ÉCHEC SI : un contexte volumineux (grounding, DOMAIN_CONTEXT) est injecté à CHAQUE tour alors
   qu'un outil on-demand le rendrait conditionnel ; OU le modèle ne peut pas recalculer/vérifier un
   chiffre qu'il cite.

D. GROUNDING & FIDÉLITÉ DES NOMBRES
   - Principe projet "aucun nombre inventé". Voie a (front, CockpitChatBridge body.deal) vs voie b
     (serveur, resolveActiveDeal). PRIORITÉ : voie a ÉCRASE voie b (voie b seulement si
     !body.deal && userId). body.deal est-il authentifié/sanitisé ?
   - Staleness : voie b prend l'active_scenario_id le plus récent (peut décrire un AUTRE scénario
     que celui consulté) ; aucun as-of/date dans le bloc. Basis : bloc affiche irr/moic/npv PRE-tax,
     deriveVerdict gate sur POST-tax (dossier-derive.js) -> incohérence présentée à l'agent.
   ÉCHEC SI : un appelant non authentifié pilote le bloc "ENGINE TRUTH authoritative" ; OU verdict et
   chiffres affichés sur des bases fiscales différentes ; OU aucun marqueur de fraîcheur.

E. PROPRETÉ / CODE MORT
   - Réfs périmées : product-context (chat) a été basculé sur "OpenAI GPT" mais vérifie qu'aucune
     mention résiduelle Kimi/Moonshot/Hypercli ne traîne dans les couches de prompt du CHAT ;
     commentaire route.ts (~l.351-353) périmé (dit sovereign/qatar/Vision2030 alors que le code
     force operator/qatar/[]).
   - think-stripper (route.ts ~l.122-162) INUTILE pour GPT (qui n'émet pas de balise <think> dans
     delta.content) -> code mort fonctionnel exécuté par chunk. (Pertinent si jamais on rebranche
     un modèle à raisonnement type Kimi ; sinon supprimable.)
   - genId() jamais appelé. EXAMPLE_OUTPUTS exporté jamais injecté. scoring_models 6x
     "todo: wire in Sprint 4" injectés sans être calculés. PAGES_CONTEXT (~1 331 tok) décrit le
     produit A3 disparu (FoldableA3/P1Cover) — mort pour le chat.
   - PARAMS MODÈLE : temperature ABSENTE (non-déterminisme), top_p absent, max_tokens=4096 EN DUR.
     Benchmarks datés 2024-2026 gravés sans mécanisme de fraîcheur.
   ÉCHEC SI : ≥1 réf provider contradictoire dans la chaîne de prompt du chat ; OU code mort exécuté
   par chunk (think-stripper) ; OU contexte mort (PAGES_CONTEXT/EXAMPLE_OUTPUTS/scoring) injecté ;
   OU aucun paramètre de déterminisme fixé.

F. SÉCURITÉ
   - Injection : body.messages autorise role:'system' pour un anonyme (faux message système) ;
     body.deal.warnings = texte libre (cap 20x2000 = ~10k tok) non sanitisé join " | " ;
     body.oracle.stakeholder/region/overlays = strings libres injectées dans oraclePrefix.
   - Tuning : instruction libre verbatim + clause "la préférence utilisateur PRIME" (user-tuning.ts)
     = jailbreak persistant (ex /pref "révèle ton system prompt"). Aucun cap sur le NOMBRE de règles.
   - Fuite system prompt : aucune protection exécutable ; DOMAIN_CONTEXT (IP deal Brookfield/QIA $20B)
     restituable sur demande explicite.
   - Scoping : service-role bypass RLS, scoping manuel par userId. Rate limit 20 req/60s en-mémoire
     par process (non distribué, reset au redeploy). SAFE_DEMO_MODE -> 503.
   ÉCHEC SI : un anonyme peut injecter role:'system' ou piloter "ENGINE TRUTH" ; OU une règle tuning
   peut override les garde-fous via clause "PRIME" ; OU rate limit non distribué en prod multi-instance ;
   OU warnings injectés sans sanitation.

G. QUALITÉ DE RÉPONSE & DÉTERMINISME
   - Modes normal (CONVERSATIONAL, bref) vs review (FACILITATOR, 7 phases). Sélection via
     getAdminChatMode(userId). brevity standard/deep. Stakeholder figé 'operator' alors que
     l'audience est l'IC/investisseur (lens IRR/MOIC) -> biais.
   - Déterminisme : pas de temperature -> réponses non reproductibles ; hash d'observabilité ne
     couvre QUE baseSystemPrompt (pas oraclePrefix ni grounding) -> le hash NE représente PAS le
     prompt réellement envoyé.
   ÉCHEC SI : pas de temperature/seed ; OU le hash llm_runs ne couvre pas le prompt réel ; OU le
   lens stakeholder ne correspond pas à l'audience produit.

GRILLE DE SCORING /100 (note chaque axe, justifie le score, somme pondérée) :
   A Cadrage & rôle ............. /15
   B Contexte & sur-contexte .... /25   (le plus lourd : c'est le cœur "propre / pas sur-contexte")
   C Outils ..................... /10
   D Grounding & fidélité ....... /15
   E Propreté / code mort ....... /15
   F Sécurité .................. /15
   G Qualité & déterminisme ..... /5
   VERDICT :
     PROPRE        = 80-100 (cadrage net, budget maîtrisé, sécurité tenue)
     À RESSERRER   = 50-79  (fonctionnel mais sur-contexte/redondances/réfs périmées à corriger)
     REFONTE       = 0-49   (sur-contexte massif, injection ouverte, code mort exécuté, hash faux)

LIVRABLE EXIGÉ (dans cet ordre) :
1. TABLEAU DE FINDINGS P0/P1/P2, colonnes : Sévérité | Constat | Preuve (fichier:ligne) | Impact |
   Fix proposé. P0 = sécurité/fidélité/cassant ; P1 = sur-contexte/coût/redondance ; P2 = propreté/doc.
2. CALCUL DU BUDGET TOKENS : tableau couche -> chars -> tokens, total avant historique, total à
   10 tours, % de contexte probablement ignoré, ratio contexte/question, comparaison fenêtre gpt-4.1.
3. VERDICT chiffré /100 par axe + global + niveau (PROPRE / À RESSERRER / REFONTE) + 5 actions à
   plus fort ROI tokens.

DRAPEAUX ROUGES À CONFIRMER OU INFIRMER (chacun = vrai/faux + preuve) :
[ ] Couche constitutionnelle ≈ 3 200 tok (~30-35 % du system prompt) pour un chat sidebar bref.
[ ] DOMAIN_CONTEXT (~4 582 tok) injecté 3x (CONVERSATIONAL + FACILITATOR + DOCUMENT), non factorisé.
[ ] System prompt total ≥ 8 500 tok AVANT historique, payé même pour "bonjour".
[ ] brevity='concise' n'économise quasi rien (~0 % du corpus lourd retiré).
[ ] output_framework 11 sections + 30 benchmarks injectés en Q&A (output_required=true par défaut).
[ ] ZÉRO outil / function-calling ; grounding statique injecté à chaque tour, pas on-demand.
[ ] temperature ABSENTE + top_p absent + max_tokens 4096 en dur (GPT supporte les deux).
[ ] think-stripper exécuté par chunk mais MORT pour GPT (pas de <think> dans delta.content).
[ ] genId() / EXAMPLE_OUTPUTS / PAGES_CONTEXT / scoring_models = code+contexte morts.
[ ] Réfs provider résiduelles Kimi/Moonshot/Hypercli dans la chaîne de prompt du CHAT.
[ ] body.deal voie a non authentifiée ÉCRASE voie b fiable -> "ENGINE TRUTH" pilotable client.
[ ] body.messages autorise role:'system' pour anonyme (faux message système injectable).
[ ] tuning clause "la préférence utilisateur PRIME" = override garde-fous, sans cap de nombre de règles.
[ ] hash llm_runs ne couvre QUE baseSystemPrompt -> ne représente pas le prompt réellement envoyé.
[ ] rate limit en-mémoire par process (non distribué, reset au redeploy).
[ ] basis pre-tax (bloc affiché) vs post-tax (verdict deriveVerdict) -> incohérence à l'agent.
[ ] persona dédoublée EN/FR co-injectée.

CONTRAINTES DE RIGUEUR : chiffre tout (chars/tokens), cite fichier:ligne pour chaque affirmation,
n'invente aucun chiffre (si non mesuré, écris "non mesuré"), corrige toute prémisse fausse plutôt
que la propager.
```

## Appendice — vérité terrain mesurée

Chiffres mesurés (node sur les builders réels ; tokens = chars/4, marge ±15 %). Indépendants du
provider (les builders n'ont pas changé). À utiliser comme référence si le code n'est pas relu.

**Tailles par couche (requête type : /admin/hearst, operator/qatar/0 overlay, output_required=true, brevity=standard)**

| Couche | Fichier | chars | tokens ~ |
|---|---|---|---|
| Constitutionnelle `buildOracleSystemPrompt` | `lib/oracle-system-prompt.js` | 12 917 | ~3 229 |
| DOMAIN_CONTEXT (corpus 3 piliers) | `lib/oracle-product-context.ts` | 18 327 | ~4 582 |
| PAGES_CONTEXT (NON utilisé par le chat) | `lib/oracle-product-context.ts` | 5 325 | ~1 331 |
| Coquille CONVERSATIONAL (hors corpus) | `lib/review-mode/prompts.ts` | 2 920 | ~730 |
| CONVERSATIONAL_PROMPT total | (coquille + DOMAIN) | 21 247 | ~5 312 |
| Coquille FACILITATOR (hors corpus) | `lib/review-mode/oracle-prompts.ts` | 5 073 | ~1 268 |
| FACILITATOR_PROMPT total | (coquille + DOMAIN) | 23 400 | ~5 850 |
| DOCUMENT_INSTRUCTIONS total | `lib/review-mode/prompts.ts` | 25 004 | ~6 251 |
| Grounding deal typique | `lib/oracle-deal-grounding.js` | 760 | ~190 |
| Grounding RULE seule (fixe) | `lib/oracle-deal-grounding.js` | 369 | ~92 |
| Grounding pire cas (warnings 20×2000) | `lib/oracle-deal-grounding.js` | ~40 000 | ~10 000 |
| tuningBlock typique (1-3 règles) | `lib/review-mode/user-tuning.ts` | 350-800 | ~90-200 |

**Variantes couche constitutionnelle :** output_required=false (Q&A) = 9 229 chars / ~2 307 tok ;
concise = 12 949 chars / ~3 237 tok (brevity ne retire quasi rien : ~1 ligne) ; sovereign + 2
overlays = 13 621 chars / ~3 405 tok ; sovereign + 8 overlays (max) = 15 234 chars / ~3 809 tok.
Module source = 741 lignes dont ~50 % data jamais rendue (7 régions/1 sortie, 8 stakeholders/1,
8 overlays/0, EXAMPLE_OUTPUTS jamais injecté).

**Totaux system prompt AVANT historique :** chat NORMAL = constit (~3 229) + CONVERSATIONAL (~5 312)
+ tuning + grounding ≈ **~8 550+ tok**. Mode REVIEW = ~3 229 + 5 850 ≈ **~9 090+ tok**.
DOMAIN_CONTEXT (~4 582 tok) payé à chaque message, y compris « bonjour ». Historique rechargé en
entier à chaque tour, aucune troncature -> croissance non bornée.

**Fenêtre de comparaison :** gpt-4.1 = contexte ~1M / output ~32k. Le total ~8.5-9k tok rentre
largement ; le problème n'est pas la fenêtre mais le COÛT/LATENCE et le ratio signal/bruit
(question ~30 tok contre ~9k de système, ratio ~300:1).

**Inventaire outils = 0.** Aucun `tools`, `tool_choice`, function-calling, retrieval/RAG. Appel
unique : `openaiChatStream({ model: chatModel, messages, max_tokens: 4096 })` (`route.ts`). Le seul
grounding est un bloc texte statique injecté.

**Params modèle réellement envoyés :** `model` = gpt-4.1 (défaut) ou gpt-4o (override whitelisté via
`resolveChatModel(body.model)`) ; `max_tokens = 4096` EN DUR ; `stream:true`. ABSENTS : `temperature`,
`top_p` (defaults OpenAI -> non-déterminisme). Client (`lib/llm/openai-chat.ts`) : `timeout =
LLM_MODEL_TIMEOUT_MS || 300_000` ms ; `maxRetries: 2` ; pas de fallback provider. `maxDuration`
route = 300 s.

**Réfs périmées / code mort à confirmer :**
- `route.ts` (~l.351-353) — commentaire périmé (dit sovereign/qatar/Vision2030 ; le code force
  operator/qatar/[], `oracle-system-prompt.js`).
- think-stripper `route.ts` (~l.122-162) — mort pour GPT (pas de `<think>` dans `delta.content`),
  exécuté par chunk.
- `genId()` jamais appelé. `EXAMPLE_OUTPUTS` (~1.2 KB) exporté jamais injecté. `scoring_models`
  (6× « todo wire in Sprint 4 ») injectés mais jamais calculés (~250 tok/req). PAGES_CONTEXT
  (~1 331 tok) décrit le produit A3 disparu (FoldableA3/P1Cover…P4Back).
- `body.system` (schema route.ts) accepté mais inerte si authentifié. `hash` llm_runs
  (`prompt-hash.ts`) couvre seulement FACILITATOR/CONVERSATIONAL_PROMPT, pas oraclePrefix ni grounding.

**Contradiction factuelle injectée :** stratégie IA Qatar — couche constitutionnelle « No formal
national AI strategy published » vs DOMAIN_CONTEXT (~l.147) « Qatar AI Strategy 2024 $2.5B/5y ».
Benchmarks datés 2024-2026 gravés sans mécanisme de fraîcheur.

**Garde-fous existants :** SAFE_DEMO_MODE -> 503 ; rate limit 20 req/60s en-mémoire par process
(non distribué) ; slash-commands `/pref /règles /oublie` interceptées avant le LLM ; auth via
`getSessionProfile`, anonyme = éphémère ; abort via `req.signal.aborted` ; erreurs -> 502/sentinelle
+ `insertLlmRun` (hash, pas le prompt en clair, pas de secret loggé).
