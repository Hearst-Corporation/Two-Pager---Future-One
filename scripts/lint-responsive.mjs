// scripts/lint-responsive.mjs — Hearst PURE DATA GRID contract guard.
//
// The legacy layout contract (cockpitFrame / HearstPageShell variants /
// mobileCardList / canonical breakpoints / summaryGrid / overview rules /
// no-100vh / no-100vw / wrap --ct-* tokens …) NO LONGER EXISTS. The design
// system was rewritten as a pure data grid. All those rules are obsolete and
// have been removed.
//
// Minimal, non-blocking invariant: the grid stylesheet exists and still
// defines the canonical `.coreGrid` layout class.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CSS = join(ROOT, 'app', 'admin', 'hearst', 'hearst.module.css');

let css;
try {
  css = readFileSync(CSS, 'utf8');
} catch {
  console.error(`✗ lint-responsive : missing stylesheet ${CSS}`);
  process.exit(1);
}

if (!css.includes('.coreGrid')) {
  console.error('✗ lint-responsive : hearst.module.css is missing the canonical `.coreGrid` class.');
  process.exit(1);
}

console.log('✓ lint-responsive : pure data grid contract OK (.coreGrid present).');
process.exit(0);
