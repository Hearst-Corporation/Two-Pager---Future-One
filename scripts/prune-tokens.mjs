// @enable-adrien:layer=front-cockpit v=1
// prune-tokens.mjs — détecte (et supprime avec --write) les --cp-* MORTS.
//
// Un token --cp-x est MORT si AUCUNE de ces formes ne le référence dans le code
// (app/ components/ lib/ cockpit-shell/, hors cp-tokens.css lui-même) :
//   • statique   : var(--cp-x)            (le cas courant)
//   • alias      : var(--cp-x) dans la valeur d'un AUTRE token vivant de cp-tokens.css
//   • DYNAMIQUE  : var(--cp-PREFIX-${...}) → tout --cp-PREFIX-* est considéré VIVANT
//                  dès qu'un template `var(--cp-PREFIX-${ existe (ex. --cp-op-${id}).
//                  C'est le piège des couleurs opérateurs : ne JAMAIS supprimer un
//                  token dont le préfixe est résolu en runtime.
//
// Par défaut : rapport read-only, exit 0 (jamais bloquant — c'est un outil, pas un gate).
//   node scripts/prune-tokens.mjs            → liste les morts
//   node scripts/prune-tokens.mjs --write    → supprime les lignes mortes de cp-tokens.css
//
// Après --write : relancer `npm run check` (le rendu ne doit pas bouger, par définition
// rien n'utilisait ces tokens) avant de committer.

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, relative } from 'path';

const ROOT = process.cwd();
const WRITE = process.argv.includes('--write');
const CP_FILE = join(ROOT, 'app/(cockpit)/admin/hearst/cp-tokens.css');

const SKIP = [/node_modules/, /\.next/, /coverage/, /playwright-report/, /\.bak/];
const CODE_EXTS = new Set(['.js', '.jsx', '.ts', '.tsx', '.css']);

function walk(dir, out = []) {
  let entries;
  try { entries = readdirSync(dir); } catch { return out; }
  for (const e of entries) {
    const f = join(dir, e);
    if (SKIP.some(re => re.test(f))) continue;
    let st;
    try { st = statSync(f); } catch { continue; }
    if (st.isDirectory()) walk(f, out);
    else if (CODE_EXTS.has(f.slice(f.lastIndexOf('.')))) out.push(f);
  }
  return out;
}

// 1. Tous les --cp-* DÉFINIS dans cp-tokens.css (avec n° de ligne).
const cpLines = readFileSync(CP_FILE, 'utf8').split('\n');
const defined = []; // { name, lineIdx }
const DEF_RE = /^\s*(--cp-[a-z0-9-]+)\s*:/i;
cpLines.forEach((line, i) => {
  const m = line.match(DEF_RE);
  if (m) defined.push({ name: m[1], lineIdx: i });
});

// 2. Corpus de TOUT le code (hors la définition elle-même) + valeurs des autres tokens.
const files = ['app', 'components', 'lib', 'cockpit-shell'].flatMap(d => walk(join(ROOT, d)));
const corpus = files
  .filter(f => f !== CP_FILE)
  .map(f => readFileSync(f, 'utf8'))
  .join('\n');
// Inclut aussi cp-tokens.css pour les références CROISÉES (alias var(--cp-a) -> --cp-b),
// mais on retire la colonne de DÉFINITION pour ne pas qu'un token se "voie" lui-même.
const cpValuesOnly = cpLines
  .map(l => l.replace(DEF_RE, '')) // enlève "  --cp-x:" en tête, garde la valeur
  .join('\n');
const haystack = corpus + '\n' + cpValuesOnly;

// 3. Préfixes résolus DYNAMIQUEMENT : `var(--cp-PREFIX-${  →  PREFIX vivant en bloc.
const dynPrefixes = new Set();
for (const m of haystack.matchAll(/var\(\s*--cp-([a-z0-9-]+?)-\$\{/gi)) {
  dynPrefixes.add(m[1].toLowerCase()); // ex. "op"
}

function isReferenced(name) {
  // name = "--cp-op-aws" → prefix-aware
  const bare = name.slice('--cp-'.length); // "op-aws"
  const prefix = bare.includes('-') ? bare.slice(0, bare.indexOf('-')) : bare;
  if (dynPrefixes.has(prefix.toLowerCase())) return true; // résolu en runtime → vivant
  // référence directe var(--cp-x) suivie de , ou ) ou espace
  const re = new RegExp('var\\(\\s*' + name.replace(/[-]/g, '\\$&') + '\\s*[,)]');
  return re.test(haystack);
}

const dead = defined.filter(d => !isReferenced(d.name));

// ── Rapport ────────────────────────────────────────────────────────────────
if (dynPrefixes.size) {
  console.log(`ℹ préfixes dynamiques protégés (--cp-${[...dynPrefixes].join('-* / --cp-')}-*) : jamais supprimés\n`);
}
if (!dead.length) {
  console.log('✓ prune-tokens : aucun --cp-* mort.');
  process.exit(0);
}
console.log(`${dead.length} token(s) --cp-* mort(s) (0 référence statique / dynamique) :`);
for (const d of dead) console.log(`  ${d.name}   (cp-tokens.css:${d.lineIdx + 1})`);

if (!WRITE) {
  console.log('\n→ read-only. Pour supprimer : node scripts/prune-tokens.mjs --write');
  process.exit(0);
}

// ── Suppression ──────────────────────────────────────────────────────────────
const deadLines = new Set(dead.map(d => d.lineIdx));
const kept = cpLines.filter((_, i) => !deadLines.has(i));
writeFileSync(CP_FILE, kept.join('\n'));
console.log(`\n✓ ${dead.length} ligne(s) supprimée(s) de cp-tokens.css.`);
console.log('→ Relance `npm run check` puis commit (le rendu ne doit pas bouger).');
