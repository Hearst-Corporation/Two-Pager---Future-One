// Wave 1 — strategic memo trust fixes (C1 / C7 / C11 / C12).
import { describe, it, expect } from 'vitest';
import {
  assertNoPromises,
  freshnessStatusFromTimestamp,
  computeDataFreshness,
  computeConfidenceBlock,
} from '../lib/memo-confidence.js';

describe('C1 — liveBrief must never contain Promise values', () => {
  it('throws when a value is an unresolved Promise', () => {
    const bad = { gpu_pricing: Promise.resolve({ prices: [] }), energy: {}, signals: [] };
    expect(() => assertNoPromises(bad, 'liveBrief')).toThrow(/unresolved Promise/);
  });
  it('passes when all values are resolved', () => {
    const good = { gpu_pricing: { prices: [] }, energy: {}, signals: [] };
    expect(() => assertNoPromises(good, 'liveBrief')).not.toThrow();
  });
});

describe('C11/C12 — freshness status labels from real timestamps', () => {
  const NOW = new Date('2026-05-29').getTime();
  const daysAgo = (n) => new Date(NOW - n * 86_400_000).toISOString();
  it('maps age buckets to CURRENT/AGING/STALE/EXPIRED', () => {
    expect(freshnessStatusFromTimestamp(daysAgo(30), NOW)).toBe('CURRENT');
    expect(freshnessStatusFromTimestamp(daysAgo(120), NOW)).toBe('AGING');
    expect(freshnessStatusFromTimestamp(daysAgo(300), NOW)).toBe('STALE');
    expect(freshnessStatusFromTimestamp(daysAgo(500), NOW)).toBe('EXPIRED');
    expect(freshnessStatusFromTimestamp(null, NOW)).toBe('EXPIRED');
  });
  it('never reports a year-old datapoint as current (regression for C12)', () => {
    // The real intelligence layer's newest datapoint is 2025-10-01.
    expect(freshnessStatusFromTimestamp('2025-10-01', NOW)).not.toBe('CURRENT');
    expect(freshnessStatusFromTimestamp('2024-01-01', NOW)).toBe('EXPIRED');
  });
  it('computeDataFreshness reports data_as_of + median-based overall status', () => {
    const dps = [
      { id: 'a', timestamp: daysAgo(500) },
      { id: 'b', timestamp: daysAgo(300) },
      { id: 'c', timestamp: daysAgo(20) },
    ];
    const f = computeDataFreshness(dps, NOW);
    expect(f.data_as_of).toBe(dps[2].timestamp);   // newest
    expect(f.overall_status).toBe('STALE');         // median = 300d
    expect(f.status_counts.EXPIRED).toBe(1);
    expect(f.computed_by).toBe('server');
  });
});

describe('C7 — confidence originates from code, not the model', () => {
  it('caps confidence LOW when data is stale even if authority is high', () => {
    const stale = [
      { source_authority: 'tier_1', confidence: 'high', trust: 80, freshness: 0.05 },
      { source_authority: 'tier_1', confidence: 'high', trust: 78, freshness: 0.08 },
    ];
    const c = computeConfidenceBlock(stale);
    expect(c.confidence_level).toBe('LOW');           // freshness gate bites
    expect(c.source_density).toBe('2 sourced / 2 total');
    expect(c.computed_by).toBe('server');
  });
  it('rates HIGH only when trust AND freshness are both strong', () => {
    const good = [
      { source_authority: 'tier_1', confidence: 'high', trust: 85, freshness: 0.7 },
      { source_authority: 'tier_2', confidence: 'high', trust: 75, freshness: 0.6 },
    ];
    expect(computeConfidenceBlock(good).confidence_level).toBe('HIGH');
  });
  it('counts only tier_1/tier_2 as sourced', () => {
    const mixed = [
      { source_authority: 'tier_1', trust: 60, freshness: 0.3 },
      { source_authority: 'tier_3', trust: 40, freshness: 0.3 },
      { source_authority: 'tier_5', trust: 20, freshness: 0.3 },
    ];
    expect(computeConfidenceBlock(mixed).source_density).toBe('1 sourced / 3 total');
  });
});
