# RAPPORT D'AUDIT PRODUCTION — Prese Hub / Futur One / HEARST

**Date :** 2026-05-17  
**Auditeur :** OpenCode (Kimi K2.5)  
**Scope :** Application complète (frontend, backend, LLM, DB, sécurité, ops)  
**Méthode :** Static code analysis + runtime checks + manual route testing  

---

## 1. DIAGNOSTIC INITIAL

### A. Symptômes observés

| Symptôme | Sévérité | Preuve |
|----------|----------|--------|
| Erreur bloquante | 🔴 **CRITIQUE** | `ANTHROPIC_API_KEY=` vide → route `/api/admin/hearst/advisor` crash si fallback échoue |
| Erreur intermittente | 🟠 HAUTE | `rateBucket` in-memory → rate limit contourné au restart |
| Lenteur / timeout | 🟠 HAUTE | Pas de timeout explicite sur call LLM (maxDuration=120s seulement) |
| Mauvais appel outil | 🟡 MOYENNE | `toolUseBuf[curBlockIdx]` peut être undefined si event mal formé |
| Problème de tokens design | 🟡 MOYENNE | `globals.css` (clair) polluait `page.jsx` HEARST → gris clair au lieu de `#05070d` |
| Problème de sécurité | 🔴 **CRITIQUE** | Secrets en clair dans `.env.local` sur disque local |
| Problème de config | 🔴 **CRITIQUE** | Pas de `.env.example` → impossible de reproduire l'environnement |
| Problème de tests | 🟠 HAUTE | 0 tests écrits malgré Vitest + Playwright installés |
| Problème de vulnérabilités | 🟠 HAUTE | 7 CVEs npm non patchées (Next.js SSRF, DoS, etc.) |
| Problème d'observabilité | 🟠 HAUTE | Sentry installé mais DSN absent → aucun log d'erreur en production |

### B. Hypothèses initiales (classées par probabilité)

1. **Configuration manquante** (95%) — Pas de `.env.example`, variables non documentées
2. **Secrets mal gérés** (90%) — En clair sur disque, pas de rotation, pas de secret manager
3. **Timeout absent** (85%) — Call LLM sans timeout fetch → blocage possible
4. **Retry absent** (80%) — Seul fallback model, pas de backoff exponentiel
5. **Pas de validation input** (75%) — Zod installé mais pas utilisé sur les routes API
6. **Tests absents** (70%) — Stack test prête mais 0 test écrit
7. **Rate limit in-memory** (60%) — Ne scale pas, reset au restart
8. **Vulnérabilités connues** (55%) — Next.js 14.2.35 a 4 CVEs documentées
9. **Pas de transaction DB** (50%) — Outils HEARST modifient la DB sans rollback
10. **Sentry non configuré** (45%) — Pas de DSN dans `.env.local`

---

## 2. CARTE D'ARCHITECTURE

### A. Entrées utilisateur
- **Frontend web** — Next.js App Router, inline styles
- **Dashboard admin** — `/admin/*` (HEARST module + CRM)
- **API publique** — `/api/admin/*`, `/api/track/*`
- **Pas de mobile app / extension / webhook entrant visible**

### B. Backend — Routes identifiées

| Route | Auth | Rôle |
|-------|------|------|
| `/api/admin/hearst/advisor` | ✅ editor | SSE LLM streaming |
| `/api/admin/hearst/*` | ✅ editor | CRUD HEARST (project, scenarios, sources, pipeline, data-room, contracts, audit) |
| `/api/admin/*` | ✅ editor | CRM (initiatives, operators, partners, stakeholders, tasks, team, workstreams) |
| `/api/track/deck-view` | ❌ public | Tracking analytics |

### C. LLM Layer

| Élément | Valeur | Risque |
|---------|--------|--------|
| Provider | Hypercli (OpenAI-compatible) | ✅ Configuré |
| Model principal | `kimi-k2.5` | À valider sur endpoint |
| Fallback | `kimi-k2.6` | Peut ne pas exister |
| SDK | OpenAI 6.37.0 | ✅ |
| Streaming | SSE via `ReadableStream` | ✅ |
| Tool calling | 12 outils HEARST | ✅ |
| Max turns | 8 | ✅ |
| Timeout | `maxDuration=120` (Vercel) | 🟠 Pas de timeout fetch |
| Retry | Aucun (sauf fallback model) | 🔴 **CRITIQUE** |
| Prompt versioning | Non | 🟠 |
| Output validation | Non | 🟠 |
| Cost tracking | Non | 🟠 |

### D. Services connectés

| Service | Auth | Scopes | Webhooks | Retry | Risque |
|---------|------|--------|----------|-------|--------|
| Supabase (DB + Auth) | Service Role + Anon | — | ❌ Non | ❌ Non | 🔴 Clé SRK en clair |
| Google Maps | API Key | Maps JS | ❌ Non | ❌ Non | 🟡 Clé en clair |
| Hypercli LLM | API Key | chat.completions | ❌ Non | ❌ Non | 🟡 Clé en clair |
| Anthropic (legacy) | API Key | messages | ❌ Non | ❌ Non | 🟡 Clé vide |

### E. Persistence (Supabase PostgreSQL)

Tables identifiées :
- `hearst_projects`, `hearst_scenarios`, `hearst_sources`, `hearst_data_room`
- `hearst_pipeline`, `hearst_contracts`, `hearst_audit_log`
- `hearst_advisor_conversations`
- `crm.profiles`, `initiatives`, `operators`, `partners`, etc.

**Manquant :**
- Table `llm_runs` pour tracer chaque run
- Table `llm_usage` pour tracking coûts
- Table `webhook_events` (si webhooks ajoutés)
- Table `jobs` (si workers ajoutés)

### F. Async / Workers / Queues

**Résultat : AUCUN**
- Pas de Redis
- Pas de Bull / BullMQ
- Pas de cron jobs
- Pas de workers
- Pas de queues
- Tout est synchrone (API routes Next.js)

### G. Observabilité

| Outil | Installé | Configuré | Fonctionnel |
|-------|----------|-----------|-------------|
| Sentry | ✅ | 🟠 (pas de DSN) | ❌ |
| Logs structurés | ❌ | — | ❌ |
| Dashboards | ❌ | — | ❌ |
| Alertes | ❌ | — | ❌ |
| Tracing | ❌ | — | ❌ |
| Error reporting | ❌ | — | ❌ |

---

## 3. CHECKLIST SETUP LOCAL

### ❌ Échecs critiques

| Check | Statut | Détail |
|-------|--------|--------|
| `.env.example` existe | ❌ | Non créé → impossible de reproduire l'env |
| Tests unitaires existent | ❌ | 0 fichiers `*.test.*` |
| Tests E2E existent | ❌ | Playwright installé mais 0 tests |
| CI/CD configuré | ❌ | Pas de `.github/workflows` |
| Migrations DB locales | ❌ | Pas de `supabase/migrations/` |
| Dockerfile / docker-compose | ❌ | Pas trouvé |
| Supabase CLI installé | ❌ | Non installé globalement |

### ✅ Succès

| Check | Statut | Détail |
|-------|--------|--------|
| `npm run dev` fonctionne | ✅ | Port 5005 |
| `npm run build` passe | ✅ | 0 erreur |
| `npm run test` existe | ✅ | Script présent (`vitest run`) |
| `npm run test:e2e` existe | ✅ | Script présent (`playwright test`) |
| Security headers | ✅ | CSP, X-Frame, etc. dans `next.config.js` |

### Commandes à exécuter maintenant

```bash
# 1. Créer .env.example
cp .env.local .env.example
# Puis : anonymiser les valeurs dans .env.example

# 2. Vérifier les vulnérabilités
npm audit

# 3. Installer Supabase CLI (pour migrations)
npm install -g supabase

# 4. Créer la structure de tests
mkdir -p __tests__/lib __tests__/api __tests__/components

# 5. Vérifier Sentry
# Ajouter SENTRY_DSN, SENTRY_ORG, SENTRY_PROJECT, SENTRY_AUTH_TOKEN à .env.local
```

---

## 4. AUDIT CONFIGURATION ET ENV

### Table des variables d'environnement

| Variable | Obligatoire | Présente | Risque | Utilisée dans |
|----------|-------------|----------|--------|---------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | ✅ | ✅ | 🔴 En clair, frontend | `layout.jsx` (3D map) |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ | 🟡 Publique | Partout |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ | 🟡 Publique | Partout |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | 🔴 **CRITIQUE** — en clair | `lib/supabase-admin.js` |
| `ANTHROPIC_API_KEY` | ❌ (legacy) | ✅ (vide) | 🟡 Clé vide mais var lue | `route.js` (commenté) |
| `HYPERBOLIC_API_KEY` | ✅ | ✅ | 🔴 En clair | `route.js` |
| `ADMIN_DEV_AUTOLOGIN_EMAIL` | ❌ (dev only) | ✅ | 🟡 Bypass auth en dev | `middleware.js` |
| `SENTRY_DSN` | ❌ | ❌ | 🟠 Pas de monitoring erreurs | `next.config.js` (besoin) |
| `SENTRY_ORG` | ❌ | ❌ | 🟠 Sentry non config | `next.config.js` |
| `SENTRY_PROJECT` | ❌ | ❌ | 🟠 Sentry non config | `next.config.js` |
| `SENTRY_AUTH_TOKEN` | ❌ | ❌ | 🟠 Sentry non config | `next.config.js` |
| `NODE_ENV` | ✅ | ✅ (implicite) | 🟢 | Next.js natif |

### Problèmes identifiés

1. **🔴 Pas de `.env.example`** → Impossible pour un nouveau dev de savoir quoi configurer
2. **🔴 Secrets en clair** → Toutes les clés API sont dans `.env.local` sur disque
3. **🔴 `SUPABASE_SERVICE_ROLE_KEY`** → Clé avec pouvoir admin en clair
4. **🟠 `ANTHROPIC_API_KEY` vide** → La route vérifiait `process.env.ANTHROPIC_API_KEY` et crashait si vide
5. **🟠 Sentry non configuré** → Installé mais inutilisé
6. **🟡 Pas de validation env au boot** → L'app démarre même si une clé critique manque

---

## 5. AUDIT DES RUNS LLM

### Lifecycle actuel

```
User message → POST /api/admin/hearst/advisor
  → Auth check
  → Rate limit check (in-memory Map)
  → Load project state from DB
  → Build system prompt
  → Convert Anthropic → OpenAI format
  → Stream to LLM (max 8 turns)
  → Tool calls → runTool() → DB mutations
  → Save conversation
  → SSE events to frontend
```

### Risques identifiés

| Risque | Sévérité | Preuve | Correction |
|--------|----------|--------|------------|
| **Pas de timeout fetch LLM** | 🔴 | Aucun `AbortController` ou `signal` | Ajouter timeout 30s avec abort |
| **Pas de retry** | 🔴 | Seul fallback model, pas de backoff | Ajouter retry exponentiel 3x |
| **Pas de validation output** | 🟠 | Réponse LLM parsée sans schema | Ajouter Zod validation |
| **Pas de cost tracking** | 🟠 | Aucun log de tokens/cost | Parser usage du stream |
| **Pas de table llm_runs** | 🟠 | Conversations stockées mais pas les runs | Créer table dédiée |
| **Rate limit in-memory** | 🟠 | `new Map()` → reset au restart | Utiliser Redis ou DB |
| **Max turns = 8** | 🟡 | OK mais non configurable | Rendre configurable |
| **Pas de circuit breaker** | 🟡 | Si provider down, crash | Ajouter fallback offline |

### Logs obligatoires (manquants)

Chaque run LLM devrait logger :
- ❌ `request_id` (pas généré)
- ❌ `conversation_id` (présent mais pas loggué)
- ❌ `model` utilisé (présent mais pas loggué)
- ❌ `input_tokens` / `output_tokens` (non extraits)
- ❌ `latency_ms` (non mesurée)
- ❌ `tool_calls_count` (non compté)
- ❌ `error_type` (capturé mais pas structuré)

---

## 6. AUDIT AGENTS / OUTILS / TOOL CALLS

### Les 12 outils HEARST

1. `get_project_state`
2. `get_scenario_details`
3. `list_sources`
4. `list_public_sources_library`
5. `update_scenario` ⚠️ **ÉCRITURE DB**
6. `create_source` ⚠️ **ÉCRITURE DB**
7. `attach_source_to_scenario` ⚠️ **ÉCRITURE DB**
8. `create_scenario` ⚠️ **ÉCRITURE DB**
9. `add_pipeline_prospect` ⚠️ **ÉCRITURE DB**
10. `update_data_room_item` ⚠️ **ÉCRITURE DB**
11. `run_what_if_projection` (lecture seule)
12. `compare_scenarios` (lecture seule)
13. `generate_executive_report` (lecture seule)

### Risques

| Risque | Sévérité | Détail |
|--------|----------|--------|
| **7 outils modifient la DB** | 🔴 | Sans confirmation humaine explicite |
| **Pas de transaction** | 🔴 | `update_scenario` fait `supa.from(...).update()` sans rollback si erreur |
| **Pas de timeout outil** | 🟠 | `runTool` n'a pas de timeout |
| **Pas de retry outil** | 🟠 | Si Supabase timeout, pas de retry |
| **Audit log fragile** | 🟡 | `audit()` a un `try/catch` vide → silencieux si échec |
| **Pas de validation input outil** | 🟡 | Les params sont passés directement à Supabase |

---

## 7. AUDIT SERVICES CONNECTÉS

### Supabase

| Check | Statut | Risque |
|-------|--------|--------|
| Auth fonctionnel | ✅ | Middleware OK |
| Service Role Key sécurisé | ❌ | En clair dans `.env.local` |
| RLS policies auditées | ❌ | Non audité |
| Migrations versionnées | ❌ | Pas de dossier migrations |
| Backup configuré | ❌ | Non vérifié |
| Connexion chiffrée | ✅ | HTTPS + WSS |

### Google Maps

| Check | Statut | Risque |
|-------|--------|--------|
| Clé valide | ✅ | Fonctionne (3D map) |
| Restrictions domaine | ❌ | Non vérifié |
| Clé frontend | 🔴 | `NEXT_PUBLIC_` = exposée au client |

### Hypercli LLM

| Check | Statut | Risque |
|-------|--------|--------|
| Endpoint accessible | ✅ | `https://api.hypercli.com/v1` |
| Modèle configuré | ✅ | `kimi-k2.5` |
| Timeout | ❌ | Pas configuré |
| Retry | ❌ | Pas configuré |
| Rate limit suivi | ❌ | Non |
| Fallback | ✅ | `kimi-k2.6` |

---

## 8. AUDIT API / BACKEND

### Routes auditées

Toutes les routes sous `/api/admin/hearst/*` et `/api/admin/*` :

| Check | Statut | Détail |
|-------|--------|--------|
| Auth requise | ✅ | `authedWrite('editor')` |
| Validation input Zod | ❌ | Zod installé mais pas utilisé |
| Validation output | ❌ | Pas de schema de réponse |
| Rate limiting | 🟠 | In-memory uniquement |
| Request ID | ❌ | Non généré |
| Timeout route | 🟠 | `maxDuration=120` global |
| Error handling | 🟠 | Try/catch basiques |
| Logs structurés | ❌ | Non |

### Middleware

| Check | Statut | Détail |
|-------|--------|--------|
| Auth | ✅ | Supabase + dev autologin |
| CORS | 🟡 | Pas de config CORS explicite |
| CSRF | ❌ | Non protégé |
| Rate limiting | ❌ | Non |
| Request ID | ❌ | Non |
| Body size limit | 🟡 | Next.js default (1MB) |

---

## 9. AUDIT FRONTEND / CLIENT

### État actuel

| Check | Statut | Détail |
|-------|--------|--------|
| Inline styles | ✅ | Convention respectée |
| Error boundaries | ❌ | Non trouvés |
| Loading states | 🟠 | Basiques (`Initializing...`) |
| Error states | 🟠 | Basiques (`Error: {msg}`) |
| Retry UI | ❌ | Non |
| Abort controller | ❌ | Non |
| Token refresh | ✅ | Géré par Supabase |
| Responsive | 🟡 | Pas testé |

### Design Tokens

| Problème | Statut | Correction |
|----------|--------|------------|
| `globals.css` (clair) polluait HEARST | 🔴 Corrigé | `page.jsx` et composants convertis à `design-system/tokens.js` |
| `lib/admin-tokens.js` utilise `var(--color-*)` | 🔴 Identifié | Doit être migré ou supprimé |

---

## 10. AUDIT BASE DE DONNÉES

### Schéma (déduit du code)

Tables HEARST identifiées :
- `hearst_projects`
- `hearst_scenarios`
- `hearst_sources`
- `hearst_data_room`
- `hearst_pipeline`
- `hearst_contracts`
- `hearst_audit_log`
- `hearst_advisor_conversations`

Tables CRM identifiées :
- `crm.profiles`
- `initiatives`
- `initiative_dependencies`
- `initiative_links`
- `operators`
- `partners`
- `stakeholders`
- `tasks`
- `team`
- `workstreams`

### Manquants critiques

- ❌ Table `llm_runs` (tracking runs LLM)
- ❌ Table `llm_usage` (tracking coûts/tokens)
- ❌ Table `api_requests` (tracking latency/errors)
- ❌ Table `webhook_events` (si webhooks)
- ❌ Table `jobs` (si async)

### Intégrité

- 🟡 Pas de foreign keys visibles dans le code (utilisation Supabase sans FK explicites)
- 🟡 Pas de transactions dans les outils LLM
- 🟡 `audit_log` avec `try/catch` silencieux

---

## 11. AUDIT ASYNC / JOBS / QUEUES / WORKERS

**Résultat : AUCUN SYSTÈME ASYNC**

Pas de :
- Redis
- Bull / BullMQ / Agenda / node-cron
- Workers
- Queues
- Cron jobs
- Webhooks entrants

**Impact :** Tout est synchrone. Si un appel LLM dure 60s, le client attend 60s. Si Supabase est lent, la requête est lente.

**Recommandation :** Pour l'instant, OK (MVP). Mais si le trafic augmente, envisager :
- Vercel Edge Functions pour les calls rapides
- Queue pour les générations de rapports longs

---

## 12. AUDIT WEBHOOKS

**Résultat : AUCUN WEBHOOK**

Pas de :
- Webhooks entrants (Stripe, GitHub, etc.)
- Webhooks sortants (notifications, etc.)

**Note :** Si des webhooks sont ajoutés plus tard, il faudra :
- Signature verification
- Idempotence via `event_id`
- Réponse 2xx rapide
- Traitement async

---

## 13. AUDIT SÉCURITÉ

### A. Secrets

| Secret | Où | Risque | Action |
|--------|-----|--------|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | 🔴 **CRITIQUE** | Rotation immédiate + secret manager |
| `HYPERBOLIC_API_KEY` | `.env.local` | 🔴 **CRITIQUE** | Rotation + secret manager |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | `.env.local` + client | 🟡 | Restreindre domaine dans Google Cloud |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + client | 🟡 | Normal (publique) |

### B. Auth

| Check | Statut | Détail |
|-------|--------|--------|
| Supabase Auth | ✅ | JWT + cookies |
| Dev autologin | 🟡 | `ADMIN_DEV_AUTOLOGIN_EMAIL` bypass auth en dev |
| Sessions | ✅ | Gérées par Supabase |
| Permissions | 🟠 | `authedWrite('editor')` — pas de granularité |
| RLS | ❌ | Non audité |

### C. OWASP

| Risque | Statut | Détail |
|--------|--------|--------|
| Injection SQL | 🟡 | Supabase client protège, mais validation input faible |
| XSS | 🟠 | CSP présent mais `'unsafe-inline'` permissif |
| CSRF | ❌ | Non protégé |
| SSRF | 🟠 | Next.js 14.2.35 a un CVE SSRF |
| IDOR | 🟠 | Pas de vérification `project_id` appartient à l'user |
| File upload | ❌ | Non audité (pas de route d'upload visible) |
| Dependency vuln | 🔴 | 7 CVEs npm |

---

## 14. AUDIT PERMISSIONS ET OAUTH

### OAuth / Connexions externes

**Résultat : AUCUN OAUTH COMPLEXE**

- Supabase Auth : email/password (pas de Google/GitHub OAuth visible)
- Pas de refresh token externe
- Pas de scopes

**Note :** Si OAuth ajouté plus tard, suivre le checklist complet.

---

## 15. AUDIT LOGS, MONITORING ET OBSERVABILITÉ

### État actuel

| Outil | Installé | Configuré | Utilisé |
|-------|----------|-----------|---------|
| Sentry | ✅ | ❌ | ❌ |
| Console logs | ✅ | — | 🟠 (basiques) |
| Structured logs | ❌ | — | ❌ |
| Metrics | ❌ | — | ❌ |
| Tracing | ❌ | — | ❌ |
| Dashboards | ❌ | — | ❌ |
| Alertes | ❌ | — | ❌ |

### Logs actuels

Tous les logs sont des `console.log` basiques. Pas de :
- `request_id`
- `user_id` hashé
- `timestamp` structuré
- `level` (info/warn/error)
- `duration_ms`
- `status`

---

## 16. AUDIT COÛTS, PERFORMANCE ET LATENCE

### Coûts LLM

| Élément | Valeur | Risque |
|---------|--------|--------|
| Modèle principal | Kimi K2.5 | 🟢 Moins cher que Claude |
| Max tokens | 8192 | 🟡 Peut être optimisé |
| Max turns | 8 | 🟡 Peut générer beaucoup de tokens |
| Streaming | ✅ | 🟢 Bon pour UX |
| Cost tracking | ❌ | 🔴 Aucune idée du coût |
| Budget limit | ❌ | 🔴 Aucune limite |

### Performance

| Élément | Valeur | Risque |
|---------|--------|--------|
| DB queries | Non optimisées | 🟡 Pas d'indexes audités |
| N+1 queries | Possible | 🟡 `loadFreshState` fait 5 requêtes en parallèle ✅ |
| Pagination | ❌ | 🔴 `limit(500)` sur sources |
| Cache | ❌ | Pas de Redis/cache |
| CDN | ❌ | Pas de CDN pour assets |

---

## 17. PLAN DE DEBUG ÉTAPE PAR ÉTAPE

### Phase 1 — Immédiat (24h)

1. **Créer `.env.example`**
2. **Ajouter validation env au boot** → crash si clé critique manquante
3. **Corriger le bug de design tokens** → ✅ DÉJÀ FAIT
4. **Ajouter timeout LLM** → `AbortController` avec 30s
5. **Ajouter retry LLM** → 3 retries avec backoff exponentiel
6. **Vérifier les clés API** → tester call Hypercli manuellement

### Phase 2 — Court terme (1 semaine)

7. **Créer tests unitaires** → validators, prompt builders, tool handlers
8. **Ajouter Zod validation** → sur toutes les routes API
9. **Ajouter error boundaries** → frontend
10. **Configurer Sentry** → DSN + source maps
11. **Ajouter request ID** → middleware + logs
12. **Migrer rate limit** → DB ou Redis

### Phase 3 — Moyen terme (2-4 semaines)

13. **Créer table `llm_runs`**
14. **Ajouter cost tracking**
15. **Ajouter tests E2E** → Playwright
16. **Ajouter RLS policies** → audit
17. **Créer CI/CD** → GitHub Actions
18. **Documenter runbooks**

---

## 18. PLAN DE TESTS COMPLET

### A. Tests unitaires (Vitest)

| Module | Test | Priorité |
|--------|------|----------|
| `lib/env-validation.js` | Validation des variables d'environnement | P0 |
| `lib/hearst-calculations.js` | Projections financières (IRR, NPV, DSCR) | P0 |
| `lib/hearst-advisor-prompt.js` | Construction du system prompt | P1 |
| `lib/hearst-advisor-tools.js` | Validation des paramètres outils | P0 |
| `lib/hearst-alerts.js` | Détection d'alertes | P1 |
| `components/hearst/KpiCard.jsx` | Rendu avec valeurs null/valides | P1 |
| `components/hearst/AlertBanner.jsx` | Rendu par sévérité | P1 |

### B. Tests d'intégration

| Scénario | Test | Priorité |
|----------|------|----------|
| POST /api/admin/hearst/advisor | Run LLM mocked | P0 |
| POST /api/admin/hearst/scenarios | CRUD scénario | P1 |
| GET /api/admin/hearst/project | Chargement projet | P1 |
| Tool call `update_scenario` | Mutation DB + audit log | P0 |

### C. Tests E2E (Playwright)

| Scénario | Test | Priorité |
|----------|------|----------|
| Login admin | Authentification | P0 |
| Navigation HEARST | Aller sur /admin/hearst | P0 |
| Chat LLM | Envoyer message, recevoir réponse | P0 |
| Tool call | Demander une projection | P1 |
| Logout | Déconnexion | P1 |

---

## 19-23. TESTS À CRÉER (DÉTAIL)

Voir section 18. Tests prioritaires identifiés.

---

## 24. PLAN DE STABILISATION

### A. Immédiat — 24-48h

| # | Action | Fichier(s) | Vérification |
|---|--------|-----------|--------------|
| 1 | Créer `.env.example` | Racine | `cat .env.example` |
| 2 | Ajouter validation env | `lib/env-validation.js` | Crash si clé manquante |
| 3 | Ajouter timeout LLM | `route.js` | Test avec endpoint lent |
| 4 | Ajouter retry LLM | `route.js` | Test avec 500 mock |
| 5 | Corriger design tokens | ✅ FAIT | Visuel HEARST sombre |
| 6 | Tester endpoint Hypercli | Curl | Réponse 200 |
| 7 | Patcher CVEs npm | `npm audit fix` | `npm audit` = 0 |

### B. Court terme — 1-2 semaines

| # | Action | Fichier(s) |
|---|--------|-----------|
| 8 | Tests unitaires vitaux | `__tests__/**/*.test.js` |
| 9 | Zod validation API | `app/api/**/*.js` |
| 10 | Error boundaries | `app/admin/error.jsx` |
| 11 | Configurer Sentry | `.env.local` + `next.config.js` |
| 12 | Request ID middleware | `middleware.js` |
| 13 | Rate limit DB | `lib/rate-limit.js` |
| 14 | Table `llm_runs` | Migration Supabase |

### C. Moyen terme — 1-2 mois

| # | Action |
|---|--------|
| 15 | CI/CD GitHub Actions |
| 16 | Tests E2E complets |
| 17 | Dashboard monitoring |
| 18 | Cost governance |
| 19 | RLS policies audit |
| 20 | Documentation runbooks |

---

## 25. PRODUCTION READINESS CHECKLIST

### Avant prod, vérifier :

- [ ] `.env.example` complet et documenté
- [ ] Tous les secrets en secret manager (pas en `.env`)
- [ ] `npm audit` = 0
- [ ] Tests unitaires passent
- [ ] Tests E2E critiques passent
- [ ] Sentry configuré et testé
- [ ] Rate limiting robuste
- [ ] Timeout LLM configuré
- [ ] Retry LLM configuré
- [ ] Validation input sur toutes les routes
- [ ] Error boundaries frontend
- [ ] RLS policies Supabase
- [ ] Backup DB configuré
- [ ] Monitoring actif
- [ ] Rollback documenté
- [ ] Incident response plan

---

## 26. BACKLOG PRIORISÉ

### P0 — Critique (faire maintenant)

1. 🔴 **Sécurité :** Rotation des clés API exposées
2. 🔴 **Stabilité :** Timeout + retry LLM
3. 🔴 **Config :** `.env.example` + validation env
4. 🔴 **Tests :** Premiers tests unitaires (calculations, tools)
5. 🔴 **Vulnérabilités :** Patcher CVEs Next.js

### P1 — Haute priorité (cette semaine)

6. 🟠 **Observabilité :** Configurer Sentry
7. 🟠 **Validation :** Zod sur routes API
8. 🟠 **Rate limit :** Migrer vers DB/Redis
9. 🟠 **LLM :** Table `llm_runs` + cost tracking
10. 🟠 **Frontend :** Error boundaries

### P2 — Important (2-4 semaines)

11. 🟡 **Tests E2E :** Playwright
12. 🟡 **CI/CD :** GitHub Actions
13. 🟡 **Docs :** Runbooks + README complet
14. 🟡 **DB :** Indexes + performance

### P3 — Amélioration (1-2 mois)

15. 🟢 **Model routing :** Router simple vs complex tasks
16. 🟢 **Cache :** Redis pour état projet
17. 🟢 **Analytics :** Usage, coûts, performances

---

## 27. QUESTIONS RESTANTES

1. **Quel est le statut actuel de la production ?** L'app est-elle déployée sur Vercel ? Quelle URL ?
2. **Y a-t-il des logs de production ?** Où sont-ils stockés (Vercel, Supabase, Sentry) ?
3. **Les clés API ont-elles déjà fuité ?** Faut-il les rotationner maintenant ?
4. **Quel est le budget mensuel LLM acceptable ?** Pour mettre en place des limites.
5. **Y a-t-il d'autres développeurs sur le projet ?** Besoin de `.env.example`, documentation.
6. **Les RLS policies Supabase sont-elles configurées ?** À auditer.
7. **Le backup Supabase est-il actif ?** Point-in-time recovery ?
8. **Y a-t-il un plan de rollback ?** En cas de migration ratée.

---

## ANNEXE — COMMANDES DE VÉRIFICATION

```bash
# Vérifier les secrets hardcodés
grep -r "sk-" --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" . || echo "OK: no hardcoded sk-"
grep -r "eyJ" --include="*.js" --include="*.jsx" . || echo "OK: no hardcoded JWT"

# Vérifier le build
npm run build

# Vérifier les vulnérabilités
npm audit

# Vérifier les tests
npm run test

# Tester le endpoint LLM
curl -s https://api.hypercli.com/v1/models \
  -H "Authorization: Bearer $HYPERBOLIC_API_KEY" | head -20

# Vérifier les processus
lsof -i :5005

# Vérifier les env vars manquantes
diff <(cat .env.local | grep '=' | cut -d= -f1 | sort) <(cat .env.example | grep '=' | cut -d= -f1 | sort)
```

---

*Rapport généré par OpenCode (Kimi K2.5) le 2026-05-17. Ce document doit être mis à jour à chaque changement majeur.*
