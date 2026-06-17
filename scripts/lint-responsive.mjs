// scripts/lint-responsive.mjs — Hearst layout contract guard (anti-régression).
import { readFileSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

const ROOT = process.cwd();

const PAGE_FILES = globSync('app/admin/hearst/**/page.jsx', { cwd: ROOT, absolute: true });
const COMPONENT_FILES = globSync('app/admin/hearst/components/*.{jsx,tsx}', { cwd: ROOT, absolute: true });
const CSS_FILES = globSync('app/admin/hearst/**/*.css', { cwd: ROOT, absolute: true });

const rel = (file) => file.replace(ROOT + '/', '');

const errors = [];

function fail(file, rule, message) {
  errors.push({ file: rel(file), rule, message });
}

// ── Pages: HearstPageShell + no manual frame ──
for (const file of PAGE_FILES) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  if (!content.includes('HearstPageShell')) {
    fail(file, 'hearst-page-shell', 'Doit utiliser <HearstPageShell>.');
  }

  if (
    /className=\{[^}]*styles\.cockpitFrame(Locked)?/.test(content)
    || /<main\s+className/.test(content)
  ) {
    fail(file, 'no-manual-cockpit-frame', 'Ne pas assigner cockpitFrame / <main> manuellement.');
  }

  if (/\b100vw\b/.test(content) || /\b100vh\b/.test(content)) {
    fail(file, 'no-toxic-viewport', 'Pas de 100vw / 100vh dans les pages.');
  }

  if (/overflow\s*:\s*['"]?hidden['"]?/.test(content) || /overflowHidden/.test(content)) {
    fail(file, 'no-overflow-hidden', 'Pas de overflow:hidden inline dans les pages.');
  }

  if (r.includes('simulator/') && /\bsummaryGrid\b|\bsimSummaryGrid\b/.test(content)) {
    fail(file, 'no-sim-summary-grid', 'Simulator: pas de summaryGrid / simSummaryGrid.');
  }
}

// ── Components (except shell): no manual frame ──
for (const file of COMPONENT_FILES) {
  if (file.endsWith('HearstPageShell.jsx')) continue;
  const content = readFileSync(file, 'utf-8');

  if (/className=\{[^}]*styles\.cockpitFrame/.test(content) || /<main\s+className/.test(content)) {
    fail(file, 'no-manual-cockpit-frame', 'Composant: pas de cockpitFrame / <main> manuel.');
  }

  if (/\b100vw\b/.test(content) || /\b100vh\b/.test(content)) {
    fail(file, 'no-toxic-viewport', 'Pas de 100vw / 100vh dans les composants.');
  }
}

// ── CSS: toxic patterns + canonical breakpoints + removed-class regression ──
// Set de breakpoints CANONIQUE (fermé — aucun seuil ad-hoc).
const CANONICAL_MAX_WIDTH = new Set([1280, 1024, 768, 430]);
const CANONICAL_MAX_HEIGHT = new Set([720, 520]);

for (const file of CSS_FILES) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

    if (/\b100vh\b/.test(line)) {
      fail(file, 'no-100vh', `L${i + 1}: 100vh interdit (utiliser 100dvh).`);
    }

    if (/\b100vw\b/.test(line) && !/min\([^)]*100vw/.test(line)) {
      fail(file, 'no-100vw', `L${i + 1}: 100vw interdit (sauf min(..., 100vw) drawer).`);
    }

    // Régression du pattern "grille-résumé déguisée" retiré du simulateur.
    if (/\.simSummaryGrid\b/.test(line)) {
      fail(file, 'no-sim-summary-grid', `L${i + 1}: .simSummaryGrid retiré — interdit de le réintroduire.`);
    }
    if (/\.simStatusStrip\b/.test(line)) {
      fail(file, 'no-sim-status-strip', `L${i + 1}: .simStatusStrip retiré — bandeau statut redondant interdit.`);
    }

    // Breakpoints canoniques — on ne contraint QUE max-width / max-height.
    // Les guards min-width (ex. "(max-height: 720px) and (min-width: 769px)") sont autorisés.
    if (/@media/.test(line)) {
      const maxRe = /\(\s*(max-width|max-height)\s*:\s*(\d+)px\s*\)/g;
      let m;
      while ((m = maxRe.exec(line)) !== null) {
        const kind = m[1];
        const px = Number(m[2]);
        const allowed = kind === 'max-width' ? CANONICAL_MAX_WIDTH : CANONICAL_MAX_HEIGHT;
        if (!allowed.has(px)) {
          fail(
            file,
            'breakpoint-hors-canon',
            `L${i + 1}: ${kind}:${px}px hors set canonique {largeur 1280/1024/768/430, hauteur 720/520}.`,
          );
        }
      }
    }
  });
}

if (errors.length) {
  console.error('🚨 lint-responsive: contrat Hearst violé\n');
  for (const e of errors) {
    console.error(`✗ [${e.rule}] ${e.file}: ${e.message}`);
  }
  console.error('');
  process.exit(1);
}

console.log('✓ lint-responsive : contrat layout Hearst respecté.');
