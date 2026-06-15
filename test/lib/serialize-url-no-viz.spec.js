/**
 * Source-level guard: serializeStateToUrl() must NOT emit `viz` or `active_viz`
 * as a URL parameter key.
 *
 * Context: `serializeStateToUrl` is called only from the simulator config page
 * (/admin/hearst/simulator). The `viz` tab does not exist on that page —
 * it lives exclusively on /results, which reads ?viz= directly from
 * window.location.search. Leaking `viz` from the config page pollutes shared
 * links with a phantom parameter.
 *
 * This test uses a static source read (readFileSync) so it catches the
 * serialization intent regardless of test environment quirks, and uses a
 * live runtime call to confirm the produced URLSearchParams have no viz key.
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

import { serializeStateToUrl, INITIAL_STATE } from '../../lib/hearst-simulator-state.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(
  resolve(__dirname, '../../lib/hearst-simulator-state.js'),
  'utf8',
);

/** Extracts the body of `serializeStateToUrl` from the source text. */
function extractSerializeFnBody(src) {
  const start = src.indexOf('export function serializeStateToUrl(');
  if (start === -1) throw new Error('serializeStateToUrl not found in source');
  // Walk forward to find the matching closing brace.
  let depth = 0;
  let i = start;
  while (i < src.length) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
    i++;
  }
  throw new Error('Could not find closing brace of serializeStateToUrl');
}

describe('serializeStateToUrl — no viz serialization', () => {
  // ── static source-level checks ────────────────────────────────────────────

  it('source does not call params.set with "viz" key', () => {
    const body = extractSerializeFnBody(SOURCE);
    // Matches params.set('viz', ...) or params.set("viz", ...)
    expect(body).not.toMatch(/params\.set\(\s*['"]viz['"]/);
  });

  it('source does not call params.set with "active_viz" key', () => {
    const body = extractSerializeFnBody(SOURCE);
    expect(body).not.toMatch(/params\.set\(\s*['"]active_viz['"]/);
  });

  // ── runtime checks ────────────────────────────────────────────────────────

  it('serialized URL does not contain the key "viz"', () => {
    const qs = serializeStateToUrl(INITIAL_STATE);
    const params = new URLSearchParams(qs);
    expect(params.has('viz')).toBe(false);
  });

  it('serialized URL does not contain the key "active_viz"', () => {
    const qs = serializeStateToUrl(INITIAL_STATE);
    const params = new URLSearchParams(qs);
    expect(params.has('active_viz')).toBe(false);
  });

  it('serialized URL still contains expected config keys', () => {
    const qs = serializeStateToUrl(INITIAL_STATE);
    const params = new URLSearchParams(qs);
    expect(params.has('mode')).toBe(true);
    expect(params.has('arch')).toBe(true);
    expect(params.has('elec')).toBe(true);
  });

  it('serialized URL does not contain "viz" even when active_viz is non-default', () => {
    const qs = serializeStateToUrl({ ...INITIAL_STATE, active_viz: 'sankey' });
    const params = new URLSearchParams(qs);
    expect(params.has('viz')).toBe(false);
    expect(params.has('active_viz')).toBe(false);
  });
});
