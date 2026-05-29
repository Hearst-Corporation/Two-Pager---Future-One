// lib/executive-language.js
//
// Boardroom Experience — Executive Mode.
// Translates technical metrics into plain-language labels + a one-word verdict,
// WITHOUT changing any value. Pure presentation: { label, verdict, tone, raw, hint }.
// tone ∈ excellent | strong | adequate | caution | weak (drives colour only).
//
// No engine logic, no recomputation — formatting + thresholds only.

const TONE = { excellent: 'excellent', strong: 'strong', adequate: 'adequate', caution: 'caution', weak: 'weak' };

function band(v, cuts) {
  // cuts = [ [threshold, tone, verdict], ... ] descending; returns first match
  for (const [t, tone, verdict] of cuts) if (v >= t) return { tone, verdict };
  const last = cuts[cuts.length - 1];
  return { tone: last[1], verdict: last[2] };
}

export const fmtUsd = (v) => v == null ? '—' : (Math.abs(v) >= 1e9 ? `$${(v / 1e9).toFixed(2)}B` : `$${(v / 1e6).toFixed(0)}M`);
export const fmtPct = (v) => v == null ? '—' : `${(v * 100).toFixed(1)}%`;
export const fmtX   = (v) => v == null ? '—' : `${v.toFixed(2)}×`;

// Each translator: raw value -> executive card content.
export const exec = {
  irr(v) {
    const { tone, verdict } = band(v ?? -1, [[0.20, TONE.excellent, 'Exceptional'], [0.15, TONE.strong, 'Strong'], [0.10, TONE.adequate, 'Acceptable'], [-1, TONE.caution, 'Below hurdle']]);
    return { label: 'Annual Return (IRR)', verdict, tone, raw: fmtPct(v), hint: 'Levered, modelled' };
  },
  moic(v) {
    // NOTE: institutional 10-yr infra MOIC ≈ 2–3×; flag anything that reads too rich.
    const { tone, verdict } = band(v ?? 0, [[8, TONE.caution, 'Verify exit'], [4, TONE.strong, 'High'], [2.5, TONE.strong, 'Healthy'], [1.5, TONE.adequate, 'Modest'], [0, TONE.weak, 'Thin']]);
    return { label: 'Equity Multiple (MOIC)', verdict, tone, raw: fmtX(v), hint: 'Cash returned ÷ invested' };
  },
  npv(v) {
    const tone = v > 0 ? TONE.strong : TONE.weak;
    return { label: 'Net Present Value', verdict: v > 0 ? 'Value-accretive' : 'Below hurdle', tone, raw: fmtUsd(v), hint: 'At 10% discount' };
  },
  capex(v) {
    return { label: 'Total Capital', verdict: 'Build cost', tone: TONE.adequate, raw: fmtUsd(v), hint: 'Bottom-up estimate' };
  },
  capexPerMw(v) {
    const { tone, verdict } = band(v ?? 0, [[20e6, TONE.adequate, 'GPU-heavy'], [11e6, TONE.caution, 'Rich'], [5e6, TONE.strong, 'In band'], [0, TONE.adequate, 'Shell-class']]);
    return { label: 'Capital Intensity', verdict, tone, raw: v ? `$${(v / 1e6).toFixed(1)}M/MW` : '—', hint: 'Benchmark ≈ $8.9M/MW' };
  },
  payback(v) {
    const { tone, verdict } = band(v ? (12 - v) : -1, [[6, TONE.strong, 'Fast'], [2, TONE.adequate, 'Typical'], [-1, TONE.caution, 'Long']]);
    return { label: 'Payback Period', verdict, tone, raw: v ? `${v} yrs` : '—', hint: 'Years to recover capital' };
  },
  dscr(v) {
    const { tone, verdict } = band(v ?? 0, [[1.8, TONE.excellent, 'Very strong'], [1.4, TONE.strong, 'Strong'], [1.2, TONE.adequate, 'Adequate'], [0, TONE.caution, 'Tight']]);
    return { label: 'Debt Coverage', verdict, tone, raw: v ? fmtX(v) : '—', hint: `DSCR ${v ? v.toFixed(2) : '—'}` };
  },
  pue(v) {
    const { tone, verdict } = band(v ? (2 - v) : 0, [[0.65, TONE.excellent, 'Excellent'], [0.55, TONE.strong, 'Efficient'], [0.45, TONE.adequate, 'Typical'], [0, TONE.caution, 'High draw']]);
    return { label: 'Energy Efficiency', verdict, tone, raw: v ? `PUE ${v}` : '—', hint: 'Lower is better' };
  },
  confidence(level, sourceDensity) {
    const map = { HIGH: TONE.strong, MEDIUM: TONE.adequate, LOW: TONE.caution };
    return { label: 'Evidence Confidence', verdict: level || '—', tone: map[level] || TONE.adequate, raw: sourceDensity || '', hint: 'Sourced ÷ total inputs' };
  },
  cod(months, dataAsOf) {
    return { label: 'Commercial Operation', verdict: months ? `${Math.ceil(months / 12)} yr build` : 'Phased', tone: TONE.adequate, raw: months ? `T+${months} mo` : '—', hint: dataAsOf ? `as of ${dataAsOf}` : '' };
  },
};

// Hex tones for PDF (institutional palette, not the app's CSS vars).
export const TONE_HEX = {
  excellent: '#1b7a4b', strong: '#2f6f8f', adequate: '#7a6a1f', caution: '#b3661a', weak: '#a23030',
};
