# CLAUDE.md — Oracle

Stack : Next.js 14 · React 18 · Supabase (`crm`) · OpenAI · CSS Modules (`--ct-*`, no Tailwind).

Dev : `npm run dev` → **5005**.

## Design system — PURE DATA
NO RULES. NO LAYOUT CONTRACT. NO BOXES.
The design system is now 100% pure data grid.

## Routes

| Path | Role | API |
|---|---|---|
| `/admin/hearst` | Entry map | — |
| `/admin/hearst/simulator` | Live projection | `POST /simulate` |
| `/admin/hearst/sources` | Evidence register | `GET /sources` |
| `/admin/hearst/financial` | Base case | `POST /simulate` |
| `/admin/hearst/deals` | Deal archetypes | `GET /deals` |
| `/admin/hearst/workspace` | Saved scenarios | `GET /project`, `GET /scenarios` |
| `/admin/hearst/dossier` | Strategic memos | `GET /strategic-memos` |

## API · Env

`app/api/admin/hearst/` — simulate, scenarios, sources, deals, project, strategic-memos.

`.env.local.example` → `.env.local` (Supabase + `OPENAI_API_KEY`). Preflight : `npm run doctor`.
