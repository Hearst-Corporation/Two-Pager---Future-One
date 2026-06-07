// @enable-adrien:layer=front-cockpit v=1
// lint-cockpit.mjs — couleurs hardcodées + tokens cross-layer dans le cockpit.
// Détecte, dans app/(cockpit)/ et components/hearst/ :
//   • hex hardcodé (#rgb..#rrggbbaa) hors var()
//   • fonctions couleur littérales rgb()/rgba()/hsl()/hsla()
//   • usage direct de var(--ct-*)  → doit passer par --cp-* (source de vérité projet)
//   • usage de var(--color-*)      → palette legacy interdite dans le cockpit
// Baseline legacy gelée par SIGNATURE (cf. _lint-baseline.mjs). exit 1 sur nouvelle violation.
// Échappatoire ligne : // cockpit-lint-allow   ·   Régénérer : --update-baseline

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { loadBaseline, saveBaselineKey, sig } from './_lint-baseline.mjs';

const ROOT = process.cwd();
const UPDATE = process.argv.includes('--update-baseline');
const BASELINE_KEY = 'cockpit';

// Fichiers de définition de tokens — JAMAIS scannés (ils DÉFINISSENT les valeurs).
const TOKEN_FILES = [
  /cp-tokens\.css$/, /globals\.css$/, /tokens\.css$/, /cockpit\.css$/,
  /chat-fab\.css$/, /accents\.json$/, /tokens\.core\.json$/,
];

const ALLOW_PATHS = [
  /node_modules/, /\.next/, /\.bak/, /coverage/, /playwright-report/,
  /test\//, /\.spec\./, /\.test\./, /scripts\//, /public\//, /docs\//,
];

const SCAN_EXTS = new Set(['.jsx', '.tsx', '.js', '.ts', '.css', '.scss']);

// Scope : seulement app/(cockpit)/ et components/hearst/
const COCKPIT_SCOPE = [join(ROOT, 'app/(cockpit)'), join(ROOT, 'components/hearst')];
const inScope = (file) => COCKPIT_SCOPE.some(s => file.startsWith(s));

// Règles de détection — chacune renvoie le 1er motif trouvé (ou null).
const RULES = [
  {
    label: 'couleur hex hardcodée',
    find: (line) => {
      const stripped = line.replace(/var\(--[^)]+\)/g, '');
      const m = stripped.match(/#[0-9a-fA-F]{3,8}\b/);
      return m ? m[0] : null;
    },
  },
  {
    label: 'fonction couleur hardcodée (rgb/hsl)',
    find: (line) => {
      const m = line.match(/\b(?:rgba?|hsla?)\([^)]*\)/);
      return m ? m[0] : null;
    },
  },
  {
    label: 'var(--ct-*) en direct → utiliser un --cp-*',
    find: (line) => {
      const m = line.match(/var\(\s*--ct-[a-z0-9-]+/i);
      return m ? m[0].replace(/\s+/g, '') : null;
    },
  },
  {
    label: 'var(--color-*) legacy interdit dans le cockpit',
    find: (line) => {
      const m = line.match(/var\(\s*--color-[a-z0-9-]+/i);
      return m ? m[0].replace(/\s+/g, '') : null;
    },
  },
];

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (ALLOW_PATHS.some(re => re.test(full))) continue;
    if (TOKEN_FILES.some(re => re.test(full))) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (SCAN_EXTS.has(extname(entry))) files.push(full);
  }
  return files;
}

// Collecte des violations : [{ rel, line, num, label, match, signature }]
const violations = [];
for (const file of walk(ROOT)) {
  if (!inScope(file)) continue;
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('cockpit-lint-allow')) return;
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    const noComment = line.replace(/\/\/.*/, '');
    for (const rule of RULES) {
      const match = rule.find(noComment);
      if (match) {
        violations.push({ rel, num: i + 1, label: rule.label, match, signature: sig(rel, line) });
      }
    }
  });
}

if (UPDATE) {
  saveBaselineKey(BASELINE_KEY, violations.map(v => v.signature));
  console.log(`✓ lint-cockpit : baseline régénérée (${new Set(violations.map(v => v.signature)).size} signature(s) gelée(s))`);
  process.exit(0);
}

const baseline = new Set(loadBaseline()[BASELINE_KEY] || []);
let legacy = 0;
const fresh = [];
for (const v of violations) {
  if (baseline.has(v.signature)) {
    legacy++;
    console.warn(`WARN  ${v.rel}:${v.num}  ${v.label} (${v.match}) [baseline]`);
  } else {
    fresh.push(v);
    console.error(`ERR   ${v.rel}:${v.num}  ${v.label} (${v.match}) → remplacer par var(--cp-*)`);
  }
}

if (fresh.length > 0) {
  console.error(`\n✗ lint-cockpit : ${fresh.length} nouvelle(s) violation(s) hors baseline.`);
  console.error(`  Corrige-les, ou (si legacy assumé) régénère : node scripts/lint-cockpit.mjs --update-baseline`);
  process.exit(1);
}
if (legacy > 0) console.warn(`⚠ lint-cockpit : ${legacy} violation(s) legacy gelée(s) — corrige progressivement`);
else console.log('✓ lint-cockpit : aucune couleur/token hardcodé hors tokens');
