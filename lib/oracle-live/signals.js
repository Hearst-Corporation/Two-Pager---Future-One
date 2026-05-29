// lib/oracle-live/signals.js
//
// Sprint 3 — Infrastructure Signal helpers.
// Defines the signal schema and validation. No hardcoded signals here —
// Agent 4 (infra-signals.js) supplies the actual signal content.

// ────────────────────────────────────────────────────────────────────────
// Enums
// ────────────────────────────────────────────────────────────────────────

export const SIGNAL_SEVERITIES = ['low', 'medium', 'high', 'critical'];

// ────────────────────────────────────────────────────────────────────────
// Required fields for a Signal
// ────────────────────────────────────────────────────────────────────────

const SIGNAL_REQUIRED = [
  'id',
  'title',
  'severity',
  'category',
  'region',
  'affected_archetypes',
  'explanation',
  'implication',
  'confidence',
  'freshness',
  'recommended_action',
];

// ────────────────────────────────────────────────────────────────────────
// Validation
// ────────────────────────────────────────────────────────────────────────

/**
 * Validates an infrastructure signal against the required schema.
 *
 * @param {Object} s - The signal object to validate.
 * @returns {{ ok: boolean, errors: string[] }}
 */
export function validateSignal(s) {
  const errors = [];

  for (const k of SIGNAL_REQUIRED) {
    if (s[k] === undefined || s[k] === null) {
      errors.push(`missing field: ${k}`);
    }
  }

  if (s.severity && !SIGNAL_SEVERITIES.includes(s.severity)) {
    errors.push(`unknown severity: ${s.severity} (expected one of: ${SIGNAL_SEVERITIES.join(', ')})`);
  }

  if (s.affected_archetypes !== undefined) {
    if (!Array.isArray(s.affected_archetypes)) {
      errors.push('affected_archetypes must be an array of strings');
    } else if (s.affected_archetypes.length === 0) {
      errors.push('affected_archetypes must contain at least one archetype');
    }
  }

  if (s.confidence !== undefined && s.confidence !== null) {
    if (typeof s.confidence !== 'number' || s.confidence < 0 || s.confidence > 1) {
      errors.push(`confidence must be a number in [0,1], got: ${s.confidence}`);
    }
  }

  if (s.freshness !== undefined && s.freshness !== null) {
    if (typeof s.freshness !== 'number' || s.freshness < 0 || s.freshness > 1) {
      errors.push(`freshness must be a number in [0,1], got: ${s.freshness}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

// ────────────────────────────────────────────────────────────────────────
// Sorting helper
// ────────────────────────────────────────────────────────────────────────

/**
 * Returns an integer weight for sorting signals by severity (highest first).
 *
 * critical → 4
 * high     → 3
 * medium   → 2
 * low      → 1
 * unknown  → 0
 *
 * @param {'low'|'medium'|'high'|'critical'} severity
 * @returns {number} Weight in range 1..4 (0 for unrecognised values).
 */
export function signalSeverityWeight(severity) {
  const weights = { critical: 4, high: 3, medium: 2, low: 1 };
  return weights[severity] ?? 0;
}
