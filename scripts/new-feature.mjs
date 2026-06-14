// @enable-adrien:layer=front-cockpit v=1
// new-feature.mjs — scaffolder de page cockpit pour Oracle.
// Usage : node scripts/new-feature.mjs <resource> [--ts=YYYYMMDDHHMMSS]
// Exemple : node scripts/new-feature.mjs analytics --ts=20260607120000
//
// Génère :
//   app/(cockpit)/admin/hearst/<resource>/page.jsx
//   app/api/admin/hearst/<resource>/route.js
//
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const resource = args.find(a => !a.startsWith('--'));
const tsArg = args.find(a => a.startsWith('--ts='))?.replace('--ts=', '') || '0000_RENAME_ME';

if (!resource) {
  console.error('Usage: node scripts/new-feature.mjs <resource> [--ts=YYYYMMDDHHMMSS]');
  process.exit(1);
}

const pascal = resource.charAt(0).toUpperCase() + resource.slice(1);
const pageDir = join(ROOT, `app/(cockpit)/admin/hearst/${resource}`);
const pagePath = join(pageDir, 'page.jsx');
const apiDir = join(ROOT, `app/api/admin/hearst/${resource}`);
const apiPath = join(apiDir, 'route.js');

// Refus atomique si UNE cible existe
const targets = [pagePath, apiPath];
const existing = targets.filter(existsSync);
if (existing.length > 0) {
  console.error(`✗ Refus : fichier(s) existant(s) — supprime-les manuellement :`);
  existing.forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

// Keystone guard — layout.jsx est un fichier partagé, pas une ressource scaffolder.
mkdirSync(pageDir, { recursive: true });
writeFileSync(pagePath, `'use client';

import { useEffect, useState } from 'react';
import { UI } from '@/lib/ui-strings';
import { SectionHead, Card } from '@/components/hearst/ui';

export default function ${pascal}Page() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/admin/hearst/${resource}');
        if (!r.ok) throw new Error(\`HTTP \${r.status}\`);
        const json = await r.json();
        setData(json);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="oracle-page">
      <SectionHead title="${pascal}" />
      {loading && <div style={S.empty}>{UI.STATE_LOADING}</div>}
      {err && <div style={S.error} role="alert">{UI.STATE_ERROR}: {err}</div>}
      {!loading && !err && !data && <div style={S.empty}>No data.</div>}
      {!loading && !err && data && (
        <Card padding="lg">{/* TODO: render data via Table/KpiGrid/… */}</Card>
      )}
    </div>
  );
}

const S = {
  empty: { color: 'var(--cp-text-muted)', padding: 'var(--cp-space-6) var(--cp-space-0)' },
  error: { color: 'var(--cp-error)', padding: 'var(--cp-space-3)', background: 'var(--cp-error-bg)', borderRadius: 'var(--cp-radius-md)' },
};
`);

// Génération route API
mkdirSync(apiDir, { recursive: true });
writeFileSync(apiPath, `// app/api/admin/hearst/${resource}/route.js
// Généré par scripts/new-feature.mjs — ${tsArg}
// Auth : requireProfile (viewer+). Pour écriture : authedWrite.

import { NextResponse } from 'next/server';
import { requireProfile } from '@/lib/auth-server';
import { getAdminClient } from '@/lib/supabase-admin';

export async function GET(req) {
  const profile = await requireProfile(req);
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const supa = getAdminClient();
  const { data, error } = await supa
    .from('${resource}')
    .select('*')
    .limit(100);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ${resource}: data });
}
`);

console.log(`\n✓ Scaffolded "${resource}" :`);
console.log(`  ${pagePath}`);
console.log(`  ${apiPath}`);
console.log(`  Optionnel : OracleRailNav.jsx + ui-strings.ts si la page doit apparaître dans la nav.\n`);
