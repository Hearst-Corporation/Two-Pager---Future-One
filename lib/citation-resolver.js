// citation-resolver.js — résout les références datapoint_id en libellés de source
// lisibles, et nettoie les tokens `[datapoint_id X]` qui fuient dans le texte des
// mémos (dossier + PDF + markdown).
//
// Règle "zéro source inventée" : un id non résolu N'EST JAMAIS remplacé par un
// faux label. Soit on résout vers le vrai source_name (DATAPOINTS), soit on
// affiche MISSING_LABEL ('N/A — Source Required'), soit on retire le token.
//
// Source de vérité : lib/oracle-intelligence/datapoints.js (DATAPOINT_BY_ID).

import { DATAPOINT_BY_ID, ENTITY_BY_ID } from './oracle-intelligence/index.js';
import { MISSING_LABEL } from './hearst-constants.js';

// Token brut tel qu'imposé par l'ancien prompt / le fallback : `[datapoint_id X]`
// (X = id alphanumérique avec _ et -, ou ENGINE pour le fallback sans datapoint).
const CITATION_TOKEN_RE = /\[datapoint_id\s+([A-Za-z0-9_-]+)\]/g;

/**
 * Résout un datapoint_id en libellé de source humain.
 * @param {string} id
 * @returns {{ id: string, label: string, url: string|null, resolved: boolean }}
 *   resolved=false quand l'id est inconnu / sentinelle → label = MISSING_LABEL.
 */
export function resolveCitation(id) {
  if (!id || typeof id !== 'string') {
    return { id: String(id ?? ''), label: MISSING_LABEL, url: null, resolved: false };
  }
  // Sentinelle du fallback déterministe : pas un vrai datapoint.
  if (id === 'ENGINE') {
    return { id, label: 'Engine projection', url: null, resolved: true };
  }
  const dp = DATAPOINT_BY_ID[id];
  if (!dp) {
    return { id, label: MISSING_LABEL, url: null, resolved: false };
  }
  const sourceName = dp.notes?.source_name;
  const entityName = ENTITY_BY_ID?.[dp.entity_id]?.name;
  const label = sourceName || entityName || MISSING_LABEL;
  return { id, label, url: dp.notes?.url || null, resolved: Boolean(sourceName || entityName) };
}

/**
 * Remplace tous les tokens `[datapoint_id X]` d'un texte par le libellé de source
 * résolu, entre parenthèses. Token non résolu → retiré proprement (on ne laisse
 * jamais le crochet brut, on n'invente jamais de source).
 *
 * Ex. "...24% IRR supported by [datapoint_id crwv_leverage]."
 *   → "...24% IRR supported by (CoreWeave S-1, 2024)."
 * Token non résolu → la mention "supported by " orpheline est aussi nettoyée.
 *
 * @param {string} text
 * @returns {string}
 */
export function resolveCitationsInText(text) {
  if (!text || typeof text !== 'string') return text || '';
  let out = text.replace(CITATION_TOKEN_RE, (_m, id) => {
    const { label, resolved } = resolveCitation(id);
    return resolved ? `(${label})` : '';
  });
  // Nettoie les amorces orphelines laissées par un token retiré
  // ("supported by ." / "supported by  ." / "per ." ...).
  out = out
    .replace(/\bsupported by\s*([.,;])/gi, '$1')
    .replace(/\bsupported by\s*$/i, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;])/g, '$1')
    .trim();
  return out;
}

/**
 * Libellé d'affichage d'une entrée intelligence_sources (qui porte un datapoint_id
 * brut). Retourne le source_name résolu ou MISSING_LABEL — jamais l'id brut.
 * @param {{ datapoint_id?: string }} source
 * @returns {{ label: string, url: string|null, resolved: boolean, id: string }}
 */
export function resolveSourceLabel(source) {
  const id = source?.datapoint_id || '';
  return resolveCitation(id);
}
