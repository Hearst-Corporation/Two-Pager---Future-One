// lib/memo-confidence.js
//
// Wave 1 (C1 / C7 / C11 / C12) — server-side confidence + freshness for the
// strategic memo. Extracted from the route handler so the logic is unit-testable
// and the same rules apply everywhere. These values ORIGINATE from code; the LLM
// may explain them but must not generate them.

// C1 — an unresolved Promise must never reach the LLM prompt or the JSON
// response (JSON.stringify(Promise) silently yields {}).
export function assertNoPromises(obj, label = 'object') {
  for (const [k, v] of Object.entries(obj || {})) {
    if (v instanceof Promise) {
      throw new Error(`${label}.${k} is an unresolved Promise — must be awaited before serialization (C1).`);
    }
  }
}

// C11/C12 — freshness status from a datapoint timestamp.
// 0-90d CURRENT · 91-180d AGING · 181-365d STALE · 365d+ EXPIRED.
export function freshnessStatusFromTimestamp(timestamp, now = Date.now()) {
  if (!timestamp) return 'EXPIRED';
  const days = (now - new Date(timestamp).getTime()) / 86_400_000;
  if (days <= 90) return 'CURRENT';
  if (days <= 180) return 'AGING';
  if (days <= 365) return 'STALE';
  return 'EXPIRED';
}

// C12 — freshness summary for the whole brief. data_as_of = newest datapoint;
// overall_status = the MEDIAN-aged datapoint's status (one fresh point can't
// mask a stale set).
export function computeDataFreshness(datapoints = [], now = Date.now()) {
  const enriched = datapoints.map(d => ({
    id: d.id, timestamp: d.timestamp, status: freshnessStatusFromTimestamp(d.timestamp, now),
  }));
  const status_counts = enriched.reduce((acc, d) => { acc[d.status] = (acc[d.status] || 0) + 1; return acc; }, {});
  const dated = datapoints.filter(d => d.timestamp);
  const sortedAsc = [...dated].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const data_as_of = sortedAsc.length ? sortedAsc[sortedAsc.length - 1].timestamp : null;
  const median = sortedAsc.length ? sortedAsc[Math.floor(sortedAsc.length / 2)] : null;
  const overall_status = median ? freshnessStatusFromTimestamp(median.timestamp, now) : 'EXPIRED';
  return { data_as_of, overall_status, status_counts, datapoints: enriched, computed_by: 'server' };
}

// C7 — confidence computed from real trust + freshness scores. Stale data caps it.
export function computeConfidenceBlock(datapoints = []) {
  const total = datapoints.length || 0;
  const sourced = datapoints.filter(d => d.source_authority === 'tier_1' || d.source_authority === 'tier_2').length;
  const trusts = datapoints.map(d => d.trust ?? 0);
  const freshs = datapoints.map(d => d.freshness ?? 0);
  const meanTrust = trusts.length ? trusts.reduce((a, b) => a + b, 0) / trusts.length : 0;
  const meanFresh = freshs.length ? freshs.reduce((a, b) => a + b, 0) / freshs.length : 0;
  let confidence_level = 'LOW';
  if (meanTrust >= 70 && meanFresh >= 0.4) confidence_level = 'HIGH';
  else if (meanTrust >= 50 && meanFresh >= 0.2) confidence_level = 'MEDIUM';
  return {
    confidence_level,
    source_density: `${sourced} sourced / ${total} total`,
    mean_trust_score: Math.round(meanTrust),
    mean_freshness_score: Math.round(meanFresh * 100) / 100,
    computed_by: 'server',
  };
}
