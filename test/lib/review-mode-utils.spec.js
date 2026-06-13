import { describe, it, expect } from 'vitest';
import { estimateTokens, TOKENS_PER_CHAR_FR } from '../../lib/review-mode/tokens';
import { sha256Hex } from '../../lib/review-mode/hash';

describe('review-mode tokens', () => {
  it('estimateTokens returns 0 for empty string', () => {
    expect(estimateTokens('')).toBe(0);
  });

  it('estimateTokens scales with length', () => {
    const n = estimateTokens('abcd');
    expect(n).toBe(Math.ceil(4 * TOKENS_PER_CHAR_FR));
  });
});

describe('sha256Hex', () => {
  it('returns a 64-char hex digest', () => {
    const h = sha256Hex('oracle');
    expect(h).toMatch(/^[a-f0-9]{64}$/);
  });
});
