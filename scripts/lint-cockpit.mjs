// @enable-adrien:layer=front-cockpit v=1
// lint-cockpit.mjs — couleurs hardcodées + tokens cross-layer dans le cockpit.
// Détecte, dans app/(cockpit)/ et components/hearst/ :
//   • hex hardcodé (#rgb..#rrggbbaa) hors var()
//   • fonctions couleur littérales rgb()/rgba()/hsl()/hsla()
//   • usage direct de var(--ct-*)  → doit passer par --cp-* (source de vérité projet)
//   • usage de var(--color-*)      → palette legacy interdite dans le cockpit
//   • [GUARD-A] surface peinte en inline : background:var(--cp-surface*) + border|borderRadius
//     dans le même bloc de style → utiliser <Card> (baseline gelée, warn sur existant, err sur nouveau)
//   [GUARD-B TODO] carte peinte imbriquée : deux cp-card / <Card> sans variant="flat|bare"
//     détectés en imbrication dans le même fichier. Non implémenté : la détection multi-ligne
//     JSX par regex est trop fragile (faux positifs sur les variantes conditionnelles, les Card
//     dans les .map(), les Card<Button>…). À implémenter proprement avec un AST (babel/acorn)
//     qui track la profondeur des JSXOpeningElements portant className~cp-card ou tag=Card.
// Baseline legacy gelée par SIGNATURE (cf. _lint-baseline.mjs). exit 1 sur nouvelle violation.
// Échappatoire ligne : // cockpit-lint-allow   ·   Régénérer : --update-baseline

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, relative, extname } from 'path';
import { loadBaseline, saveBaselineKey, sig } from './_lint-baseline.mjs';

const ROOT = process.cwd();
const UPDATE = process.argv.includes('--update-baseline');
const BASELINE_KEY = 'cockpit';
const BASELINE_KEY_SURFACE = 'cockpit-surface-painted';

// Fichiers de définition de tokens — JAMAIS scannés (ils DÉFINISSENT les valeurs).
const TOKEN_FILES = [
  /cp-tokens\.css$/, /globals\.css$/, /tokens\.css$/, /cockpit\.css$/,
  /chat-fab\.css$/, /accents\.json$/, /tokens\.core\.json$/,
];

const ALLOW_PATHS = [
  /node_modules/, /\.next/, /\.bak/, /coverage/, /playwright-report/,
  /test\//, /\.spec\./, /\.test\./, /scripts\//, /public\//, /docs\//,
  /\.claude\//,  // worktrees agents + artefacts : jamais scannés (copies du repo).
];

const SCAN_EXTS = new Set(['.jsx', '.tsx', '.js', '.ts', '.css', '.scss']);

// Scope : app/(cockpit)/, components/hearst/, components/admin/
// + fichiers de présentation DS dans lib/ (source de vérité des styles inline).
const COCKPIT_SCOPE_PREFIXES = [
  join(ROOT, 'app/(cockpit)'),
  join(ROOT, 'components/hearst'),
  join(ROOT, 'components/admin'),
];
const COCKPIT_SCOPE_FILES = new Set([
  join(ROOT, 'lib/cp-styles.js'),
  join(ROOT, 'lib/admin-tokens.js'),
  join(ROOT, 'lib/hearst-results-view.js'),
  join(ROOT, 'lib/z-index.js'),
  join(ROOT, 'components/OracleRailNav.jsx'),
]);
const inScope = (file) =>
  COCKPIT_SCOPE_PREFIXES.some(s => file.startsWith(s)) ||
  COCKPIT_SCOPE_FILES.has(file);

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

// ── GUARD-A : carte peinte à la main en inline ────────────────────────────────
// Détecte une VRAIE carte recodée en style inline plutôt qu'avec <Card> : la
// signature complète d'un conteneur-carte sur une même ligne de style-object —
//   • background: 'var(--cp-surface…'   (surface tokenisée)
//   • ET  border  (1px solid …)         (cadre)
//   • ET  borderRadius                  (coins arrondis)
//   • ET  boxShadow                     (profondeur — propre aux cartes)
// Les badges, boutons, selects, cellules de tableau et chips combinent surface +
// border + radius mais N'ONT PAS de boxShadow : ils ne sont pas flaggés (légitimes
// en inline). Exiger boxShadow élimine ces faux positifs et ne garde que les cartes.
//
// Périmètre : .jsx, .tsx, .js, .ts dans le cockpit scope.
// Échappatoire ligne : // cockpit-lint-allow
function hasPaintedSurface(line) {
  if (!line.includes('--cp-surface')) return false;
  const hasBg = /background['"]?\s*:\s*['"]?var\(\s*--cp-surface/i.test(line);
  if (!hasBg) return false;
  const hasBorder = /\bborder['"]?\s*:/i.test(line);
  const hasRadius = /\bborderRadius['"]?\s*:/i.test(line);
  const hasShadow = /\bboxShadow['"]?\s*:/i.test(line);
  return hasBorder && hasRadius && hasShadow;
}

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
// Guard-A violations (surface peinte en inline) — baseline séparée.
const surfaceViolations = [];

for (const file of walk(ROOT)) {
  if (!inScope(file)) continue;
  const rel = relative(ROOT, file);
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (line.includes('cockpit-lint-allow')) return;
    const t = line.trim();
    if (t.startsWith('//') || t.startsWith('*') || t.startsWith('/*')) return;
    const noComment = line.replace(/\/\/.*/, '');

    // ── Règles couleur/token existantes ──
    for (const rule of RULES) {
      const match = rule.find(noComment);
      if (match) {
        violations.push({ rel, num: i + 1, label: rule.label, match, signature: sig(rel, line) });
      }
    }

    // ── Guard-A : surface peinte en inline ──
    if (hasPaintedSurface(noComment)) {
      surfaceViolations.push({
        rel,
        num: i + 1,
        label: 'surface peinte en inline : utiliser <Card>',
        signature: sig(rel, line),
      });
    }
  });
}

if (UPDATE) {
  saveBaselineKey(BASELINE_KEY, violations.map(v => v.signature));
  saveBaselineKey(BASELINE_KEY_SURFACE, surfaceViolations.map(v => v.signature));
  const total = new Set(violations.map(v => v.signature)).size
              + new Set(surfaceViolations.map(v => v.signature)).size;
  console.log(`✓ lint-cockpit : baseline régénérée (${total} signature(s) gelée(s))`);
  process.exit(0);
}

const allBaselines = loadBaseline();
const baseline        = new Set(allBaselines[BASELINE_KEY]        || []);
const baselineSurface = new Set(allBaselines[BASELINE_KEY_SURFACE] || []);

// ── Rapport règles couleur/token ──
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

// ── Rapport Guard-A : surface peinte en inline ──
let legacySurface = 0;
const freshSurface = [];
for (const v of surfaceViolations) {
  if (baselineSurface.has(v.signature)) {
    legacySurface++;
    console.warn(`WARN  ${v.rel}:${v.num}  [guard-a] ${v.label} [baseline]`);
  } else {
    freshSurface.push(v);
    console.error(`ERR   ${v.rel}:${v.num}  [guard-a] ${v.label}`);
  }
}

if (fresh.length > 0) {
  console.error(`\n✗ lint-cockpit : ${fresh.length} nouvelle(s) violation(s) hors baseline.`);
  console.error(`  Corrige-les, ou (si legacy assumé) régénère : node scripts/lint-cockpit.mjs --update-baseline`);
  process.exit(1);
}
if (freshSurface.length > 0) {
  console.error(`\n✗ lint-cockpit [guard-a] : ${freshSurface.length} nouvelle(s) surface(s) peinte(s) en inline.`);
  console.error(`  Remplace par <Card variant="card">, ou régénère : node scripts/lint-cockpit.mjs --update-baseline`);
  process.exit(1);
}

if (legacy > 0) console.warn(`⚠ lint-cockpit : ${legacy} violation(s) legacy gelée(s) — corrige progressivement`);
else console.log('✓ lint-cockpit : aucune couleur/token hardcodé hors tokens');

if (legacySurface > 0) {
  console.warn(`⚠ lint-cockpit [guard-a] : ${legacySurface} surface(s) inline legacy gelée(s) — migrer vers <Card>`);
} else {
  console.log('✓ lint-cockpit [guard-a] : aucune surface peinte en inline');
}
