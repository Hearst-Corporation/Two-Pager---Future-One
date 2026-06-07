// @enable-adrien:layer=front-cockpit v=1
// _lint-baseline.mjs — baseline gelée PARTAGÉE (signatures, pas un compteur).
//
// Une violation legacy est gelée par sa SIGNATURE = `relpath :: ligne normalisée`.
// → résilient au déplacement de lignes (le numéro de ligne ne fait pas partie de
//   la signature) ; toucher une ligne legacy la rend « nouvelle » → elle doit être
//   corrigée (c'est voulu) ; toute nouvelle ligne fautive échoue.
// Régénération : `node scripts/lint-<x>.mjs --update-baseline`.

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PATH = join(process.cwd(), 'scripts/.lint-baseline.json');

export function loadBaseline() {
  if (!existsSync(PATH)) return {};
  try { return JSON.parse(readFileSync(PATH, 'utf8')); } catch { return {}; }
}

/** Remplace UNE clé (ex: 'cockpit' | 'strings') sans toucher aux autres. */
export function saveBaselineKey(key, signatures) {
  const all = loadBaseline();
  all[key] = Array.from(new Set(signatures)).sort();
  writeFileSync(PATH, JSON.stringify(all, null, 2) + '\n');
}

/** Signature stable : chemin relatif + ligne normalisée (espaces compactés). */
export function sig(relpath, line) {
  return `${relpath} :: ${line.trim().replace(/\s+/g, ' ')}`;
}
