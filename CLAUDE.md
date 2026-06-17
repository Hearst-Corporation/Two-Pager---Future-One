# CLAUDE.md — Oracle

Stack : Next.js 14 · React 18 · Supabase (`crm`) · OpenAI.

Dev : `npm run dev` → port **5005**. Gate : `npm run check`.

Front Hearst : `app/admin/hearst/` — landing, simulator (`POST /simulate`), sources (`GET /sources`), financial (base case), workspace (`GET /project` + `GET /scenarios`), stubs deals/dossier.

API : `app/api/admin/hearst/` (simulate, scenarios, sources, memos, project).
