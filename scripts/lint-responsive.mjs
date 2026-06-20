// scripts/lint-responsive.mjs — Hearst layout contract guard (anti-régression).
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { globSync } from 'glob';

const ROOT = process.cwd();

const PAGE_FILES = globSync('app/admin/hearst/**/page.jsx', { cwd: ROOT, absolute: true });
const COMPONENT_FILES = globSync('app/admin/hearst/components/*.{jsx,tsx}', { cwd: ROOT, absolute: true });
const CSS_FILES = globSync('app/admin/hearst/**/*.css', { cwd: ROOT, absolute: true });
const LAYOUT_FILES = [
  join(ROOT, 'app/admin/hearst/layout.jsx'),
  join(ROOT, 'app/globals.css'),
].filter(existsSync);

const rel = (file) => file.replace(ROOT + '/', '');

const errors = [];

/** @type {Record<string, string>} */
const ROUTE_VARIANTS = {
  'app/admin/hearst/page.jsx': 'home',
  'app/admin/hearst/simulator/page.jsx': 'instrument',
  'app/admin/hearst/financial/page.jsx': 'editorial',
  'app/admin/hearst/sources/page.jsx': 'data',
  'app/admin/hearst/deals/page.jsx': 'data',
  'app/admin/hearst/workspace/page.jsx': 'data',
  'app/admin/hearst/dossier/page.jsx': 'data',
};

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

  if (/style=\{\{/.test(content)) {
    fail(file, 'no-inline-style', 'Pas de style inline — utiliser hearst.module.css.');
  }

  const expectedVariant = ROUTE_VARIANTS[r];
  if (expectedVariant) {
    const variantMatch = content.match(/variant=["'](\w+)["']/);
    if (!variantMatch) {
      fail(file, 'hearst-variant-required', `variant="${expectedVariant}" requis pour cette route.`);
    } else if (variantMatch[1] !== expectedVariant) {
      fail(
        file,
        'hearst-variant-mismatch',
        `variant="${variantMatch[1]}" — attendu "${expectedVariant}" pour ${r}.`,
      );
    }
  }

  if (content.includes('sourcesTable') && !content.includes('mobileCardList')) {
    fail(file, 'data-mobile-cards', 'Table register: ajouter mobileCardList pour le tier mobile ≤768px.');
  }

  // ── Composition Contract — Overview must stay an operational cockpit, not a landing portal ──
  if (r === 'app/admin/hearst/page.jsx') {
    // 1. No route-card portal as the page structure (the top nav already links every section).
    if (/\brouteGrid\b|\brouteCard\b/.test(content)) {
      fail(file, 'overview-no-route-portal', 'Overview = cockpit state, pas un portail de route-cards (la nav couvre déjà la navigation).');
    }
    // 2. No "illustrative / preview only" placeholder KPIs that weaken confidence.
    if (/illustrativeNote\b/.test(content) || /illustrative model/i.test(content) || /preview only/i.test(content)) {
      fail(file, 'overview-no-illustrative-kpi', 'Overview: pas de KPI "illustrative / preview only" — afficher l\'état réel.');
    }
    // 3. No marketing hero (large narrative band) reintroduced.
    if (/homeMetricsBand\b|homeHero\b/.test(content) || /control surface for the sovereign/i.test(content)) {
      fail(file, 'overview-no-marketing-hero', 'Overview: pas de hero marketing — bandeau d\'état cockpit uniquement.');
    }
    // 4. Must use cockpit primitives (so it composes like the rest of the product).
    if (!/cockpitPanel\b|cockpitOverview\b/.test(content)) {
      fail(file, 'overview-cockpit-primitives', 'Overview doit utiliser les primitives cockpit (.cockpitPanel / .cockpitOverview).');
    }
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

// ── Root layout + globals ──
for (const file of LAYOUT_FILES) {
  const content = readFileSync(file, 'utf-8');
  const r = rel(file);

  if (/\b100vh\b/.test(content)) {
    fail(file, 'no-100vh', '100vh interdit — utiliser 100dvh.');
  }

  if (r === 'app/admin/hearst/layout.jsx') {
    if (!content.includes('hearst.module.css')) {
      fail(file, 'hearst-layout-css', 'HearstLayout doit importer hearst.module.css.');
    }
    if (!content.includes('styles.wrap')) {
      fail(file, 'hearst-layout-wrap', 'HearstLayout doit utiliser .wrap.');
    }
    if (!content.includes('HearstNav')) {
      fail(file, 'hearst-layout-nav', 'HearstLayout doit inclure HearstNav.');
    }
  }
}

// ── CSS: toxic patterns + canonical breakpoints + removed-class regression ──
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

    if (/\b100vw\b/.test(line)) {
      const drawerMin = /--ct-drawer-w/.test(line) && /min\(/.test(line);
      const legacyDrawerMin = /min\(\s*\d+px\s*,\s*100vw\s*\)/.test(line);
      if (!drawerMin && !legacyDrawerMin) {
        fail(file, 'no-100vw', `L${i + 1}: 100vw interdit (sauf min(..., 100vw) drawer).`);
      }
    }

    if (/\.simSummaryGrid\b/.test(line)) {
      fail(file, 'no-sim-summary-grid', `L${i + 1}: .simSummaryGrid retiré — interdit de le réintroduire.`);
    }
    if (/\.simStatusStrip\b/.test(line)) {
      fail(file, 'no-sim-status-strip', `L${i + 1}: .simStatusStrip retiré — bandeau statut redondant interdit.`);
    }

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

  if (file.endsWith('hearst.module.css') && !/\.wrap\s*\{/.test(content)) {
    fail(file, 'hearst-wrap-tokens', 'hearst.module.css doit déclarer les tokens sur .wrap.');
  }
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
