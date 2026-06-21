// @enable-adrien:layer=front-cockpit v=1
// lint-tokens.mjs — source de vérité UNIQUE par couche de tokens.
// Scanne tous les .css de app/ et components/ (hors node_modules/.next) et vérifie :
//   • aucun token (--x) défini dans 2+ de NOS fichiers (SoT ambiguë / conflit) ;
//   • --cp-*    défini UNIQUEMENT dans cp-tokens.css ;
//   • --color-* défini UNIQUEMENT dans globals.css.
// --ct-* vit dans la copie locale éditable du DS (`cockpit-shell/`). Ce lint
// garde seulement l'hygiène applicative --cp-* / --color-* ; il ne verrouille
// pas l'édition du design system local.

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const DEF_RE = /^\s*(--[a-z0-9-]+)\s*:/i;
const SKIP = [/node_modules/, /\.next/, /coverage/, /playwright-report/];

const CP_SOT = 'app/(cockpit)/admin/hearst/cp-tokens.css';
// --color-* legacy = globals.css (login). La surface presentation/ est un
// domaine de tokens autonome (cf. « design libre par repo ») et possède sa
// propre source --color-* ; l'invariant « une seule source par token » ci-dessous
// continue d'interdire toute duplication entre ces fichiers.
const COLOR_SOT = ['app/globals.css', 'app/(cockpit)/presentation/presentation-tokens.css'];

function walkCss(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (SKIP.some(r => r.test(f))) continue;
    const st = statSync(f);
    if (st.isDirectory()) walkCss(f, out);
    else if (f.endsWith('.css')) out.push(f);
  }
  return out;
}

const files = ['app', 'components']
  .map(d => join(ROOT, d))
  .flatMap(d => walkCss(d));

// token -> Set(fichiers où il est défini)
const map = new Map();
for (const f of files) {
  const rel = relative(ROOT, f);
  const defs = new Set();
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = line.match(DEF_RE);
    if (m) defs.add(m[1]);
  }
  for (const t of defs) {
    if (!map.has(t)) map.set(t, new Set());
    map.get(t).add(rel);
  }
}

const errors = [];
for (const [token, fileset] of map) {
  const where = [...fileset];
  if (where.length > 1) {
    errors.push(`${token} défini dans ${where.length} fichiers : ${where.join(', ')} → une seule source`);
    continue;
  }
  const only = where[0];
  if (token.startsWith('--cp-') && only !== CP_SOT) {
    errors.push(`${token} (--cp-*) défini dans ${only} → doit vivre dans ${CP_SOT}`);
  }
  if (token.startsWith('--color-') && !COLOR_SOT.includes(only)) {
    errors.push(`${token} (--color-*) défini dans ${only} → doit vivre dans ${COLOR_SOT.join(' ou ')}`);
  }
}

if (errors.length) {
  console.error('✗ lint-tokens : sources de vérité tokens violées :');
  errors.forEach(e => console.error(`  • ${e}`));
  process.exit(1);
}
console.log(`✓ lint-tokens : ${map.size} tokens — sources uniques (--cp-→cp-tokens.css · --color-→globals.css)`);
