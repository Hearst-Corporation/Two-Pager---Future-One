# TICKET — LOGIN-REDIRECT-CORRECTION (BLOCKER 1)

**Status:** READY · spec only (no code)
**Priority:** P0 — entry point defect
**Opened:** 2026-05-29
**Scope:** redirect chain that lands an authenticated user in the wrong product.

---

## Problem

After login, the user lands on `/admin` — the **legacy DevHub product** (initiatives / operators / workstreams), NOT ORACLE (`/admin/hearst/*`). The user enters the wrong application and must manually type an ORACLE URL.

## Exact redirect chain (verified from code)

| Step | File:line | Behaviour |
|---|---|---|
| 1 | `app/admin/login/page.jsx:22` | `const next = sp.get('next') \|\| '/admin'` — **default destination is `/admin`** |
| 2 | `app/admin/login/page.jsx:38` | OAuth `emailRedirectTo = .../admin/auth/callback?next=${next}` |
| 3 | `app/admin/login/page.jsx:56` | password path: `window.location.href = next` |
| 4 | `app/admin/auth/callback/route.js:11,26,29` | `next = safeNextPath(...)`; `target.pathname = next`; redirect to `target` |
| 5 | `middleware.js:95` | DEV_AUTOLOGIN: logged-in user on `/admin/login` → redirect `url.pathname = '/admin'` |
| 6 | `middleware.js:121` | prod: already-logged-in user on `/admin/login` → redirect `url.pathname = '/admin'` |
| 7 | `middleware.js:133-135` | unauthenticated → `/admin/login?next=${safeNextPath(pathname)}` (this part is correct) |

**Root cause:** the default landing path `'/admin'` is hardcoded in **4 places** (login:22, middleware:95, middleware:121, and implicitly callback via `next`). There is no single source of truth for "ORACLE home".

## Files involved
- `app/admin/login/page.jsx` (default `next`, 2 redirect paths)
- `app/admin/auth/callback/route.js` (consumes `next`, redirects)
- `middleware.js` (2 hardcoded `/admin` bounces + `safeNextPath`)
- `lib/*` — `safeNextPath` definition (validate allowed prefixes)

## Middleware involved
`middleware.js` — note: subdomain rewrite already does the right thing for `oracle.hearst.app` (`middleware.js:71-74`: `/` → `/admin/hearst`). The defect is only on the **path-based** flow (login → `/admin`), not the subdomain flow.

## Auth flow involved
Supabase SSR (`createServerClient`), magic-link + password. PKCE callback at `app/admin/auth/callback/route.js`. `next` param is the single carrier of post-login destination.

## Proposed correction (spec, do not implement here)
1. Define ONE constant, e.g. `ORACLE_HOME = '/admin/hearst/executive'` (per architecture audit: Executive is the chosen default landing — see [[EXECUTIVE-DOSSIER-PROMOTION]]), in a shared module.
2. Replace the 4 hardcoded `'/admin'` defaults with `ORACLE_HOME`.
3. Keep `safeNextPath` but ensure its allow-list permits `/admin/hearst/*`.
4. Leave the legacy `/admin` DevHub reachable by explicit URL only (do not delete — out of scope).

## Side effects to watch
- `safeNextPath` allow-list must not reject the new default.
- Deep-link `?next=` (user clicked a protected ORACLE URL while logged out) must still win over the default — preserve precedence `next || ORACLE_HOME`.
- DEV_AUTOLOGIN branch (middleware:95) must use the same constant or dev lands in legacy.
- Subdomain `oracle.hearst.app` flow already lands in `/admin/hearst` — verify no double redirect.

## Estimated impact
**High value, low surface.** ~4 one-line edits + 1 constant. No new routes, no UI. Fixes the #1 first-impression defect for every role.

## Acceptance criteria
- Fresh login (no `?next`) → lands on `ORACLE_HOME`, not `/admin`.
- Login with `?next=/admin/hearst/dossier` → lands on dossier.
- Legacy `/admin` still reachable by typing the URL.
- Build green; `test/middleware.spec.js` updated/passing.
