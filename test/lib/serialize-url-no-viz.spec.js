/**
 * Guard: serializeStateToUrl() must NOT emit `viz` as a URL param.
 * Viz tabs live on /simulator/results only (?viz= read from window.location).
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

function extractSerializeFnBody(src) {
  const start = src.indexOf('export function serializeStateToUrl(');
  if (start === -1) throw new Error('serializeStateToUrl not found in source');
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
  it('source does not call params.set with "viz" key', () => {
    const body = extractSerializeFnBody(SOURCE);
    expect(body).not.toMatch(/params\.set\(\s*['"]viz['"]/);
  });

  it('serialized URL does not contain the key "viz"', () => {
    const params = new URLSearchParams(serializeStateToUrl(INITIAL_STATE));
    expect(params.has('viz')).toBe(false);
  });

  it('serialized URL still contains expected config keys', () => {
    const params = new URLSearchParams(serializeStateToUrl(INITIAL_STATE));
    expect(params.has('mode')).toBe(true);
    expect(params.has('arch')).toBe(true);
    expect(params.has('elec')).toBe(true);
  });
});
