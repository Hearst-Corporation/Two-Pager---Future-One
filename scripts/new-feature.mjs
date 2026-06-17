// new-feature.mjs — scaffolder de page Hearst pour Oracle.
// Usage : node scripts/new-feature.mjs <resource> [--ts=YYYYMMDDHHMMSS]
// Exemple : node scripts/new-feature.mjs analytics --ts=20260607120000
//
// Contract: pages MUST use HearstPageShell (never manual cockpitFrame / <main>).
// Guard: npm run lint:responsive
//
// Génère :
//   app/admin/hearst/<resource>/page.jsx   (HearstPageShell variant="data")
//   app/admin/hearst/<resource>/layout.jsx
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
const pageDir = join(ROOT, `app/admin/hearst/${resource}`);
const pagePath = join(pageDir, 'page.jsx');
const layoutPath = join(pageDir, 'layout.jsx');
const apiDir = join(ROOT, `app/api/admin/hearst/${resource}`);
const apiPath = join(apiDir, 'route.js');

const targets = [pagePath, layoutPath, apiPath];
const existing = targets.filter(existsSync);
if (existing.length > 0) {
  console.error('✗ Refus : fichier(s) existant(s) — supprime-les manuellement :');
  existing.forEach(f => console.error(`  ${f}`));
  process.exit(1);
}

mkdirSync(pageDir, { recursive: true });
writeFileSync(layoutPath, `export const metadata = {
  title: 'FUTUR ONE | ${pascal}',
};

export default function ${pascal}Layout({ children }) {
  return children;
}
`);

writeFileSync(pagePath, `'use client';
// Layout contract: HearstPageShell owns <main>/cockpitFrame — do not add manual wrappers.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../hearst.module.css';
import { parseApiError } from '../utils/format';
import HearstPageShell from '../components/HearstPageShell';

export default function ${pascal}Page() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/admin/hearst/${resource}');
        if (!res.ok) {
          throw new Error(await parseApiError(res, 'Could not load ${resource}.'));
        }
        const data = await res.json();
        if (!active) return;
        setItems(Array.isArray(data.${resource}) ? data.${resource} : []);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadData();
    return () => { active = false; };
  }, [reloadKey]);

  const count = items?.length ?? 0;

  return (
    <HearstPageShell
      variant="data"
      eyebrow="${pascal}"
      title="${pascal}"
      context={
        loading
          ? 'Loading…'
          : error
            ? 'Unavailable'
            : \`\${count} on record\`
      }
      bodyAriaLive="polite"
      bodyAriaBusy={loading}
    >
        {error ? (
          <div className={styles.errorState} role="alert">
            <span>{error}</span>
            <div className={styles.errorActions}>
              <button
                type="button"
                onClick={() => setReloadKey((k) => k + 1)}
                className={styles.retryButton}
              >
                Retry
              </button>
              <Link href="/admin/hearst" className={styles.errorBack}>← Back to Overview</Link>
            </div>
          </div>
        ) : loading ? (
          <div className={styles.loadingState}>Loading…</div>
        ) : count === 0 ? (
          <div className={styles.emptyState}>No ${resource} on record yet.</div>
        ) : (
          <section className={styles.cockpitPanel}>
            <div className={styles.cockpitPanelHead}>
              <h2 className={styles.cockpitPanelTitle}>${pascal}</h2>
              <span className={styles.cockpitPanelContext}>{count} total</span>
            </div>
            <div className={styles.cockpitPanelScrollWrap}>
              <div className={styles.cockpitPanelScroll}>
                {/* TODO: table or readout */}
                <pre>{JSON.stringify(items, null, 2)}</pre>
              </div>
            </div>
          </section>
        )}
    </HearstPageShell>
  );
}
`);

mkdirSync(apiDir, { recursive: true });
writeFileSync(apiPath, `// app/api/admin/hearst/${resource}/route.js
// Généré par scripts/new-feature.mjs — ${tsArg}

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

  if (error) {
    console.error('[hearst/${resource}] GET failed:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ${resource}: data });
}
`);

console.log(`\n✓ Scaffolded "${resource}" :`);
console.log(`  ${pagePath}`);
console.log(`  ${layoutPath}`);
console.log(`  ${apiPath}`);
console.log('  → HearstPageShell variant="data" (never manual cockpitFrame)');
console.log('  → add a link in app/admin/hearst/components/HearstNav.jsx\n');
