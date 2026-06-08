import { describe, it, expect } from 'vitest';
import {
  resolveCitation,
  resolveCitationsInText,
  resolveSourceLabel,
} from '../../lib/citation-resolver.js';
import { DATAPOINT_BY_ID } from '../../lib/oracle-intelligence/index.js';
import { MISSING_LABEL } from '../../lib/hearst-constants.js';

// A real datapoint id that exists in the library, with a source_name.
const REAL_ID = Object.keys(DATAPOINT_BY_ID).find(
  (id) => DATAPOINT_BY_ID[id]?.notes?.source_name,
);

describe('citation-resolver', () => {
  it('resolves a real datapoint_id to its human source_name', () => {
    const r = resolveCitation(REAL_ID);
    expect(r.resolved).toBe(true);
    expect(r.label).toBe(DATAPOINT_BY_ID[REAL_ID].notes.source_name);
    expect(r.label).not.toMatch(/datapoint_id/);
  });

  it('returns MISSING_LABEL for an unknown id (never invents a source)', () => {
    const r = resolveCitation('totally_fake_id_xyz');
    expect(r.resolved).toBe(false);
    expect(r.label).toBe(MISSING_LABEL);
  });

  it('treats the ENGINE sentinel as a non-datapoint engine label', () => {
    const r = resolveCitation('ENGINE');
    expect(r.label).toBe('Engine projection');
  });

  it('handles null/undefined gracefully', () => {
    expect(resolveCitation(null).label).toBe(MISSING_LABEL);
    expect(resolveCitation(undefined).resolved).toBe(false);
  });

  it('replaces an inline [datapoint_id X] token with the resolved source name', () => {
    const out = resolveCitationsInText(
      `We recommend review because metrics show 24% IRR supported by [datapoint_id ${REAL_ID}].`,
    );
    expect(out).not.toMatch(/\[datapoint_id/);
    expect(out).toContain(DATAPOINT_BY_ID[REAL_ID].notes.source_name);
  });

  it('removes an unresolved token and cleans the orphan "supported by"', () => {
    const out = resolveCitationsInText('Strong returns supported by [datapoint_id fake_xyz].');
    expect(out).not.toMatch(/\[datapoint_id/);
    expect(out).not.toMatch(/supported by\s*\./i);
    expect(out).toBe('Strong returns.');
  });

  it('leaves text without tokens unchanged (modulo trim)', () => {
    const txt = 'A clean sentence with no citation token.';
    expect(resolveCitationsInText(txt)).toBe(txt);
  });

  it('resolveSourceLabel maps an intelligence_sources entry to a human label', () => {
    const r = resolveSourceLabel({ datapoint_id: REAL_ID, used_for: 'x', trust: 'HIGH' });
    expect(r.label).toBe(DATAPOINT_BY_ID[REAL_ID].notes.source_name);
    const miss = resolveSourceLabel({ datapoint_id: 'nope', used_for: 'x', trust: 'LOW' });
    expect(miss.label).toBe(MISSING_LABEL);
  });
});
