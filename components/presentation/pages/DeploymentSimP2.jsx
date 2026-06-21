'use client';
/* eslint-disable @next/next/no-img-element */

/**
 * DeploymentSimP2 — One-pager "Deployment Simulation" pour /presentation/deployment.
 * Reprend EXACTEMENT la charte de DatacenterP2 (locks 270/195/125/90 = 680),
 * mais les chiffres sont pilotés par la réponse live du moteur financier
 * (POST /api/admin/hearst/simulate) passée en prop `data`.
 *
 * 4 sections :
 *   HERO (270)      — KPI returns (IRR / NPV / MOIC / PAYBACK)
 *   DARK BAND (195) — Capex & capacité (gauche) | mini-graph 10 ans (droite)
 *   TILES (125)     — Archétype : 6 scores (jauges 5 segments)
 *   FOOTER (90)     — Archétype · Phasing · Timeline
 *
 * Principe "pas de nombre inventé" : tout champ null → MISSING ('—').
 */
import {
  fmtUSD,
  fmtPctFromRatio,
  fmtPctRaw,
  fmtX,
  fmtMW,
  fmtYears,
  MISSING,
} from '@/lib/hearst-format';

const SCORE_DIMS = [
  { key: 'brand', label: 'BRAND' },
  { key: 'bankability', label: 'BANKABILITY' },
  { key: 'speed', label: 'SPEED' },
  { key: 'control', label: 'CONTROL' },
  { key: 'margin', label: 'MARGIN' },
  { key: 'exit', label: 'EXIT' },
];

export default function DeploymentSimP2({ data }) {
  const projection = data?.projection ?? null;
  const scenario = data?.scenario ?? null;
  const outcome = data?.archetype_outcome ?? null;
  const summary = data?.waterfall?.summary ?? null;
  const years = projection?.years ?? [];

  // Dérivés null-safe (num ET dénom présents, dénom ≠ 0, sinon null)
  const totalMw = scenario?.total_mw ?? null;
  const totalCapex = projection?.total_capex ?? null;
  const capexPerMw =
    totalCapex != null && totalMw != null && totalMw !== 0 ? totalCapex / totalMw : null;
  const equity = projection?.equity_invested ?? summary?.total_equity ?? null;
  const debtEquity =
    summary?.total_debt != null && summary?.total_equity != null && summary.total_equity !== 0
      ? summary.total_debt / summary.total_equity
      : null;

  return (
    <div style={S.page}>
      {/* ============== HERO (270px) — KPI returns ============== */}
      <section style={S.hero}>
        <div style={S.heroImage} />
        <div style={S.heroOverlay} />

        <div style={S.tag}>LIVE FINANCIAL SIMULATION</div>
        <img src="/futur-one-h-accent.svg" alt="Hearst" style={S.heroLogo} />

        <div style={S.heroContent}>
          <h1 style={S.title}>
            DEPLOYMENT
            <br />
            <span style={S.titleAccent}>{outcome?.label || 'SIMULATION'}</span>
          </h1>
          <p style={S.intro}>
            {fmtMW(totalMw)}
            {outcome?.code ? <> · Archetype {outcome.code}</> : null} · Qatar — modeled on Oracle's
            sourced financial engine. Every figure traces to a benchmark, never invented.
          </p>
        </div>

        <div style={S.heroKpis}>
          <HeroKpi value={fmtPctFromRatio(projection?.irr_post_tax ?? projection?.irr)} label="EQUITY IRR" />
          <HeroKpi value={fmtUSD(projection?.npv)} label="NPV @ WACC" />
          <HeroKpi value={fmtX(projection?.moic)} label="MOIC" />
          <HeroKpi value={fmtYears(projection?.payback_years)} label="PAYBACK" />
        </div>
      </section>

      {/* ============== DARK BAND (195px) — Capex (gauche) | mini-graph (droite) ============== */}
      <section style={S.darkBand}>
        <div style={S.manifestoBlock}>
          <img src="/hearst-h.svg" alt="" style={S.manifestoWatermark} />
          <div style={S.manifestoContent}>
            <div style={S.eyebrow}>CAPEX &amp; CAPACITY</div>
            <div style={S.statGrid}>
              <Stat label="Total capacity" value={fmtMW(totalMw)} />
              <Stat label="Total capex" value={fmtUSD(totalCapex)} />
              <Stat label="Capex / MW" value={fmtUSD(capexPerMw)} />
              <Stat label="Equity invested" value={fmtUSD(equity)} />
              <Stat
                label="Debt / equity"
                value={debtEquity != null ? fmtX(debtEquity) : fmtPctRaw(scenario?.debt_pct)}
              />
              <Stat label="DSCR (stabilized)" value={fmtX(projection?.dscr_stabilized)} />
            </div>
          </div>
        </div>

        <div style={S.graphBlock}>
          <div style={S.graphTitle}>10-YEAR CUMULATIVE FCF</div>
          <FcfGraph years={years} />
        </div>
      </section>

      {/* ============== TILES (125px) — Archétype : 6 scores ============== */}
      <section style={S.building}>
        {SCORE_DIMS.map((d, i) => (
          <ScoreTile
            key={d.key}
            label={d.label}
            score={outcome?.scores ? outcome.scores[d.key] : null}
            last={i === SCORE_DIMS.length - 1}
          />
        ))}
      </section>

      {/* ============== FOOTER (90px) — Archétype · Phasing · Timeline ============== */}
      <section style={S.footer}>
        <FooterCol
          eyebrow="ARCHETYPE"
          line1={outcome?.label || MISSING}
          line2={outcome?.code ? `Model ${outcome.code}` : MISSING}
          line3={outcome?.score != null ? `Fit score ${Math.round(outcome.score)}/100` : MISSING}
        />
        <FooterCol
          eyebrow="PHASING"
          line1={`P1 · ${phaseYear(scenario?.phase1_complete_year)}`}
          line2={`P2 · ${phaseYear(scenario?.phase2_complete_year)}`}
          line3={`P3 · ${phaseYear(scenario?.phase3_complete_year)}`}
        />
        <FooterCol
          eyebrow="TIMELINE"
          line1={`COD offset · ${months(scenario?.cod_offset_months ?? projection?.cod_offset_months)}`}
          line2={`Start · ${scenario?.start_year ?? MISSING}`}
          line3={`Exit · ${scenario?.exit_year ?? MISSING}`}
        />
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function HeroKpi({ value, label }) {
  return (
    <div style={S.heroKpiItem}>
      <div style={S.heroKpiValue}>{value}</div>
      <div style={S.heroKpiLabel}>{label}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={S.statItem}>
      <div style={S.statLabel}>{label}</div>
      <div style={S.statValue}>{value}</div>
    </div>
  );
}

function ScoreTile({ label, score, last }) {
  const filled = typeof score === 'number' ? Math.max(0, Math.min(5, Math.round(score))) : 0;
  const known = typeof score === 'number';
  return (
    <div style={{ ...S.scoreTile, ...(last ? { borderRight: 'none' } : null) }}>
      <div style={S.scoreLabel}>{label}</div>
      <div style={S.scoreGauge}>
        {[0, 1, 2, 3, 4].map((seg) => (
          <span
            key={seg}
            style={{
              ...S.scoreSeg,
              background: seg < filled ? 'var(--color-accent-strong)' : 'var(--color-gray-700)',
            }}
          />
        ))}
      </div>
      <div style={S.scoreValue}>{known ? `${filled}/5` : MISSING}</div>
    </div>
  );
}

function FooterCol({ eyebrow, line1, line2, line3 }) {
  return (
    <div style={S.footerCol}>
      <div style={S.footerEyebrow}>{eyebrow}</div>
      <div style={S.footerLine1}>{line1}</div>
      <div style={S.footerLine2}>{line2}</div>
      <div style={S.footerLine3}>{line3}</div>
    </div>
  );
}

/**
 * Mini-graph SVG 10 ans — polyline normalisée sur cumulative_fcf.
 * viewBox 100×40, preserveAspectRatio:none, trait non-scaling.
 * < 2 points exploitables → MISSING.
 */
function FcfGraph({ years }) {
  const W = 100;
  const H = 40;
  const PAD = 3;
  const series = (years || [])
    .map((y) => (typeof y?.cumulative_fcf === 'number' ? y.cumulative_fcf : null))
    .filter((v) => v != null);

  if (series.length < 2) {
    return <div style={S.graphMissing}>{MISSING}</div>;
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const n = series.length;

  const pts = series
    .map((v, i) => {
      const x = PAD + (i / (n - 1)) * (W - 2 * PAD);
      const yNorm = H - PAD - ((v - min) / range) * (H - 2 * PAD);
      return `${x.toFixed(1)},${yNorm.toFixed(1)}`;
    })
    .join(' ');

  // Ligne de zéro (J-curve) si la série traverse 0
  let zeroLine = null;
  if (min < 0 && max > 0) {
    const y0 = (H - PAD - ((0 - min) / range) * (H - 2 * PAD)).toFixed(1);
    zeroLine = (
      <line
        x1={PAD}
        y1={y0}
        x2={W - PAD}
        y2={y0}
        stroke="var(--color-gray-400)"
        strokeWidth="0.5"
        strokeDasharray="2 2"
        vectorEffect="non-scaling-stroke"
      />
    );
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={S.graphSvg}>
      {zeroLine}
      <polyline
        points={pts}
        fill="none"
        stroke="var(--color-accent-strong)"
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/* ---------- helpers ---------- */

function phaseYear(v) {
  return typeof v === 'number' ? String(v) : MISSING;
}
function months(v) {
  return typeof v === 'number' ? `${v} mo` : MISSING;
}

/* ---------- styles ---------- */
/* Page totale = 680px. hero(270) + darkBand(195) + building(125) + footer(90) = 680. */

const SECTION = { flexShrink: 0, flexGrow: 0, minHeight: 0, overflow: 'hidden' };

const S = {
  page: {
    width: '100%',
    height: '100%',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    position: 'relative',
  },

  /* HERO (270px) */
  hero: {
    ...SECTION,
    position: 'relative',
    height: 270,
    color: 'var(--color-text-inverse)',
  },
  heroImage: {
    position: 'absolute',
    inset: 0,
    backgroundImage:
      "url('/u2883995211_Aerial_view_of_Qatari_national_infrastructure_compl_7847dc8e-b81a-4064-ab48-565fdfc5a324.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 50%',
  },
  heroOverlay: {
    position: 'absolute',
    inset: 0,
    background: `
      linear-gradient(90deg, rgba(26,29,36,0.88) 0%, rgba(26,29,36,0.55) 45%, rgba(26,29,36,0.1) 100%),
      linear-gradient(0deg, rgba(26,29,36,0.9) 0%, rgba(26,29,36,0) 40%)
    `,
  },
  tag: {
    position: 'absolute',
    top: 22,
    left: 26,
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: 700,
    color: 'var(--color-gray-300)',
    zIndex: 2,
    textTransform: 'uppercase',
  },
  heroLogo: {
    position: 'absolute',
    top: 19,
    right: 26,
    height: 14,
    width: 'auto',
    zIndex: 2,
    color: 'var(--color-accent-strong)',
  },
  heroContent: {
    position: 'absolute',
    left: 26,
    top: 40,
    width: '78%',
    zIndex: 2,
  },
  title: {
    fontSize: 34,
    lineHeight: 0.95,
    fontWeight: 900,
    letterSpacing: -1,
    margin: 0,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  intro: {
    marginTop: 14,
    fontSize: 7.5,
    lineHeight: 1.5,
    color: 'var(--color-gray-200)',
    fontWeight: 500,
  },
  heroKpis: {
    position: 'absolute',
    left: 26,
    right: 26,
    bottom: 16,
    zIndex: 2,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 12,
    paddingTop: 14,
    borderTop: '1px solid rgba(232, 65, 66, 0.5)',
  },
  heroKpiItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  heroKpiValue: {
    fontSize: 13,
    fontWeight: 900,
    letterSpacing: -0.3,
    color: 'var(--color-accent-strong)',
    lineHeight: 1,
    whiteSpace: 'nowrap',
  },
  heroKpiLabel: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 1.2,
    color: 'var(--color-gray-200)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },

  /* DARK BAND (195px) — split 44/56 : capex (clair) | graph (sombre) */
  darkBand: {
    ...SECTION,
    height: 195,
    display: 'flex',
  },
  manifestoBlock: {
    flex: '0 0 44%',
    background: 'var(--color-surface)',
    color: 'var(--color-text-primary)',
    borderRight: '1px solid var(--color-border-light)',
    padding: '18px 26px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  manifestoWatermark: {
    position: 'absolute',
    right: 0,
    bottom: -10,
    height: 140,
    opacity: 0.06,
    pointerEvents: 'none',
    zIndex: 0,
  },
  manifestoContent: {
    position: 'relative',
    zIndex: 1,
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 2,
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  statGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    rowGap: 11,
    columnGap: 14,
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
    overflow: 'hidden',
  },
  statLabel: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 0.6,
    color: 'var(--color-gray-500)',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
  },
  statValue: {
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: -0.3,
    color: 'var(--color-text-primary)',
    lineHeight: 1.05,
    whiteSpace: 'nowrap',
  },
  graphBlock: {
    flex: 1,
    background: 'var(--color-gray-900)',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 20px 22px',
    overflow: 'hidden',
  },
  graphTitle: {
    fontSize: 7,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-gray-300)',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  graphSvg: {
    width: '100%',
    flex: 1,
    minHeight: 0,
    display: 'block',
  },
  graphMissing: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-gray-500)',
    fontSize: 16,
    fontWeight: 700,
  },

  /* TILES (125px) — 6 score tiles */
  building: {
    ...SECTION,
    height: 125,
    display: 'flex',
    background: 'var(--color-gray-900)',
  },
  scoreTile: {
    flex: 1,
    position: 'relative',
    borderRight: '1px solid var(--color-gray-800)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    padding: '0 6px',
    overflow: 'hidden',
  },
  scoreLabel: {
    fontSize: 6,
    fontWeight: 800,
    letterSpacing: 1,
    color: 'var(--color-gray-300)',
    textTransform: 'uppercase',
    textAlign: 'center',
    whiteSpace: 'nowrap',
  },
  scoreGauge: {
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    width: 14,
  },
  scoreSeg: {
    display: 'block',
    width: '100%',
    height: 5,
    borderRadius: 1,
  },
  scoreValue: {
    fontSize: 9,
    fontWeight: 900,
    letterSpacing: -0.2,
    color: 'var(--color-text-inverse)',
  },

  /* FOOTER (90px) — 3 cols texte */
  footer: {
    ...SECTION,
    height: 90,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    padding: '16px 26px',
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    alignItems: 'stretch',
    borderTop: '1px solid var(--color-gray-800)',
  },
  footerCol: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
    overflow: 'hidden',
  },
  footerEyebrow: {
    fontSize: 6.5,
    fontWeight: 800,
    letterSpacing: 1.5,
    color: 'var(--color-accent-strong)',
    textTransform: 'uppercase',
    marginBottom: 2,
    whiteSpace: 'nowrap',
  },
  footerLine1: {
    fontSize: 7.5,
    lineHeight: 1.1,
    color: 'var(--color-text-inverse)',
    fontWeight: 700,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    maxWidth: '100%',
  },
  footerLine2: {
    fontSize: 7.5,
    lineHeight: 1.1,
    color: 'var(--color-gray-300)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
  footerLine3: {
    fontSize: 7.5,
    lineHeight: 1.1,
    color: 'var(--color-gray-300)',
    fontWeight: 500,
    whiteSpace: 'nowrap',
  },
};
