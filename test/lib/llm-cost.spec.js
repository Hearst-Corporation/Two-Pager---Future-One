import { describe, it, expect } from 'vitest';
import { estimateOpenAICostUsd } from '../../lib/llm/cost';

describe('estimateOpenAICostUsd', () => {
  it('returns a positive cost for gpt-4o usage', () => {
    const cost = estimateOpenAICostUsd(
      { prompt_tokens: 1000, completion_tokens: 500 },
      'gpt-4o',
    );
    expect(cost).toBeGreaterThan(0);
  });
});
