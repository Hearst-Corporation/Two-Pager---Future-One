// @enable-adrien:layer=front-cockpit v=1
// lint-strings.mjs — détecte les strings UI en dur dans les composants React.
// Baseline legacy gelée par SIGNATURE (cf. _lint-baseline.mjs). exit 1 sur nouvelle violation.
// Échappatoire ligne : // strings-lint-allow   ·   Régénérer : --update-baseline

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { loadBaseline, saveBaselineKey, sig } from './_lint-baseline.mjs';

const ROOT = process.cwd();
const UPDATE = process.argv.includes('--update-baseline');
const BASELINE_KEY = 'strings';

// Strings à signaler : texte JSX visible > 3 mots en dur dans des balises UI.
const UI_STRING_RES = [
  { re: />([A-Z][a-z]+ [a-z]+ [a-z]+[^<]{0,60})<\//, label: 'texte JSX en dur (3+ mots)' },
  { re: /placeholder=["']([A-Z][a-zA-Z ]{5,})["']/, label: 'placeholder en dur' },
  { re: /aria-label=["']([A-Z][a-zA-Z ]{8,})["']/, label: 'aria-label en dur' },
  { re: /title=["']([A-Z][a-zA-Z ]{8,})["']/, label: 'title en dur' },
];

const ALLOW_PATHS = [
  /node_modules/, /\.next/, /\.bak/, /coverage/, /playwright-report/,
  /test\//, /\.spec\./, /\.test\./, /scripts\//,
  /\.claude\//,  // worktrees agents + artefacts : jamais scannés (copies du repo).
];

const ALLOW_FILES = [
  /cp-tokens\.css/, /globals\.css/, /CLAUDE\.md/, /AGENTS\.md/, /README/, /ui-strings\.ts/,
];

const SCAN_EXTS = new Set(['.jsx', '.tsx']);

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (ALLOW_PATHS.some(re => re.test(full))) continue;
    if (ALLOW_FILES.some(re => re.test(full))) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files);
    else if (SCAN_EXTS.has(extname(entry))) files.push(full);
  }
  return files;
}

const violations = [];
for (const file of walk(ROOT)) {
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('strings-lint-allow')) return;
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*')) return;
    for (const { re, label } of UI_STRING_RES) {
      if (re.test(line)) {
        // `title=` sur un composant (<SectionHead title="…">) = prop de CONTENU (titre rendu),
        // pas un attribut tooltip HTML → équivaut au children d'un <h2>, non visé par cette règle.
        if (label === 'title en dur' && /<[A-Z][A-Za-z0-9]/.test(line)) continue;
        violations.push({ rel, num: i + 1, label, signature: sig(rel, line) });
      }
    }
  });
}

if (UPDATE) {
  saveBaselineKey(BASELINE_KEY, violations.map(v => v.signature));
  console.log(`✓ lint-strings : baseline régénérée (${new Set(violations.map(v => v.signature)).size} signature(s) gelée(s))`);
  process.exit(0);
}

const baseline = new Set(loadBaseline()[BASELINE_KEY] || []);
let legacy = 0;
const fresh = [];
for (const v of violations) {
  if (baseline.has(v.signature)) {
    legacy++;
    console.warn(`WARN  ${v.rel}:${v.num}  ${v.label} [baseline]`);
  } else {
    fresh.push(v);
    console.error(`ERR   ${v.rel}:${v.num}  ${v.label} → extraire dans lib/ui-strings.ts`);
  }
}

if (fresh.length > 0) {
  console.error(`\n✗ lint-strings : ${fresh.length} nouvelle(s) string(s) UI hors baseline.`);
  console.error(`  Extrais-les dans lib/ui-strings.ts, ou régénère : node scripts/lint-strings.mjs --update-baseline`);
  process.exit(1);
}
if (legacy > 0) console.warn(`⚠ lint-strings : ${legacy} string(s) UI legacy gelée(s) — corrige progressivement`);
else console.log('✓ lint-strings : aucune string UI en dur');
