// @enable-adrien:layer=front-cockpit v=1
// lint-nav.mjs — chaque section du cockpit doit être atteignable depuis le rail.
// Règle : tout sous-dossier DIRECT de app/(cockpit)/admin/hearst/ contenant un
// page.jsx (= une section) doit avoir une entrée `href: '/admin/hearst/<dir>'`
// dans components/OracleRailNav.jsx → SECTIONS[].
// Les sous-routes profondes (ex: simulator/results) et l'index ne sont PAS des
// sections → non vérifiés. exit 1 si une section n'est pas câblée.

import { readFileSync, readdirSync, existsSync, statSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const PAGES_DIR = join(ROOT, 'app/(cockpit)/admin/hearst');
const NAV_FILE = join(ROOT, 'components/OracleRailNav.jsx');

// 1. Sections présentes sur le disque (sous-dossiers directs avec page.jsx).
const sections = readdirSync(PAGES_DIR).filter(entry => {
  const full = join(PAGES_DIR, entry);
  return statSync(full).isDirectory() && existsSync(join(full, 'page.jsx'));
});

// 2. hrefs déclarés dans le rail.
const navSrc = readFileSync(NAV_FILE, 'utf8');
const hrefs = new Set([...navSrc.matchAll(/href:\s*['"]([^'"]+)['"]/g)].map(m => m[1]));

// 3. Sections sans entrée nav.
const missing = sections.filter(s => !hrefs.has(`/admin/hearst/${s}`));
// 4. Entrées nav qui pointent vers une section disparue (orphelines) — warn.
const navSections = [...hrefs]
  .map(h => h.match(/^\/admin\/hearst\/([^/]+)$/)?.[1])
  .filter(Boolean);
const orphans = navSections.filter(s => !sections.includes(s));

for (const o of orphans) {
  console.warn(`WARN  OracleRailNav.jsx → href '/admin/hearst/${o}' n'a pas de page.jsx correspondante`);
}

if (missing.length > 0) {
  console.error('✗ lint-nav : section(s) sans entrée dans OracleRailNav.jsx → SECTIONS[] :');
  for (const m of missing) {
    console.error(`  • '${m}' → ajouter { id: '${m}', href: '/admin/hearst/${m}', label: '…', matchAny: ['/admin/hearst/${m}'] }`);
  }
  process.exit(1);
}

console.log(`✓ lint-nav : ${sections.length} section(s) câblée(s) dans le rail`);
