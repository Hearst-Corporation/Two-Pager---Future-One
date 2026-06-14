# Oracle — guide rapide

Stack : Next.js 14 · React 18 · Supabase (`crm`) · OpenAI · port dev **5005**.

```bash
npm install
npm run dev          # http://localhost:5005
npm run check        # lint:secrets + eslint + tests
npm run check:ci     # + next build
npm run doctor
```

Cockpit : `app/(cockpit)/admin/hearst/*` · APIs : `app/api/admin/hearst/*`, `app/api/cockpit-chat/`.

Scaffolder optionnel : `node scripts/new-feature.mjs <resource>`
