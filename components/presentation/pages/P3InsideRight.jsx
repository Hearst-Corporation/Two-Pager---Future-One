'use client';

/**
 * P3 — Intérieur droite (numéroté "02 / 04" dans le doc).
 * Design Éditorial "Print-Ready" Ultra Premium validé.
 * 
 * LAYOUT LOCKS RESPECTÉS :
 * header(122) + phases(102) + mid(282) + picture(82) + building(92) = 680px
 */
export default function P3InsideRight() {
  return (
    <div style={S.page}>
      {/* ============== HEADER (122px) ============== */}
      <section style={S.header}>
        <div style={S.headerTop}>
          <h1 style={S.title}>
            THE <span style={S.titleAccent}>ARCHITECTURE.</span>
          </h1>
        </div>
        <p style={S.subtitle}>
          A sovereign joint venture combining state capital, founding operators and Tier-1
          industrial partners to build, operate and monetize Qatar's AI compute base.
        </p>
      </section>

      {/* ============== 4 PHASES (102px) ============== */}
      <section style={S.phases}>
        <div style={S.phasesInner}>
          {/* Ligne horizontale traversant tous les cercles */}
          <div style={S.phasesLine} />
          <Phase
            n="01"
            title="INCUBATE"
            line1="Pre seed → Seed"
            line2="3 to 6 months"
            line3="20 to 30 / cohort"
          />
          <div style={S.arrow}>›</div>
          <Phase
            n="02"
            title="ACCELERATE"
            line1="Seed → Series A"
            line2="6 to 9 months"
            line3="20 to 30 / cohort"
          />
          <div style={S.arrow}>›</div>
          <Phase
            n="03"
            title="SCALE"
            line1="Series A → B+"
            line2="Rolling"
            line3="20 to 30 companies"
          />
          <div style={S.arrow}>›</div>
          <Phase
            n="04"
            title="ANCHOR"
            line1="Global Tech Bridge"
            line2="Long-term tenancy"
            line3="Hyperscalers • M&A"
          />
        </div>
      </section>

      {/* ============== MID : HUB + FUNDING (282px) ============== */}
      <section style={S.mid}>
        <div style={S.midLeft}>
          <div style={{ ...S.eyebrow, color: 'var(--color-accent-strong)' }}>THE SOVEREIGN AI COMPUTE BASE</div>
          <div style={{ ...S.midSubtitle, fontWeight: 800, fontSize: 9, letterSpacing: -0.2 }}>
            One integrated platform.
            <br />
            Four sovereign control points.
          </div>
          <Hub />
          <div style={S.hubQuote}>
            "Sovereign by design. Global by intent."
          </div>
        </div>

        <div style={S.midRight}>
          <div style={S.eyebrow}>
            FOLLOW-ON FUNDING
            <br />
            18-MONTH TARGET
          </div>
          <div style={S.bigStat}>70%</div>
          <FundingGrid />
          <div style={S.legend}>
            <div style={S.legendRow}>
              <div style={{ ...S.legendDot, background: 'var(--color-gray-200)' }} />
              <span>MENA AVERAGE (&lt; 10%)</span>
            </div>
            <div style={S.legendRow}>
              <div style={{ ...S.legendDot, background: 'var(--color-accent-strong)' }} />
              <span>FUTUR ONE TARGET (70%)</span>
            </div>
          </div>
          <blockquote style={S.midQuote}>
            "Operated as the world's first fully AI-managed sovereign campus — from compute
            allocation and energy governance to security, tenant orchestration and capital flow."
          </blockquote>
        </div>
      </section>

      {/* ============== PICTURE (82px) ============== */}
      {/* On utilise le haut de l'image masterplan pour faire une continuité visuelle avec le building */}
      <section style={S.picture} aria-label="Placeholder — photo" />

      {/* ============== BUILDING IMAGE (92px) ============== */}
      <section style={S.building}>
        <div style={S.buildingImg} aria-label="Image campus" />
        <div style={S.buildingOverlay} />
        <div style={S.statsRow}>
          <StatRow icon="rack" value="150" label="STARTUPS / ACTIVE RESIDENCY" />
          <StatRow icon="people" value="4 K" label={`RESIDENTS\n(FOUNDERS & TEAMS)`} />
          <StatRow icon="building" value="100 K" label="SQM TOTAL CAMPUS" />
          <StatRow icon="bolt" value="200 MW" label="IT POWER CAPACITY" />
        </div>
        <div style={S.buildingFooter}>
          <div style={S.qatarText}>
            <span style={{ color: 'var(--color-text-inverse)', fontWeight: 800 }}>QATAR LABEL PROGRAM</span> &nbsp;·&nbsp; Official certification for high-potential companies. &nbsp;·&nbsp; 0% tax environment &nbsp;·&nbsp; Fast company setup &nbsp;·&nbsp; Full ownership. &nbsp;·&nbsp; Housing, education, healthcare packages.
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function Phase({ n, title, line1, line2, line3 }) {
  return (
    <div style={S.phase}>
      <div style={S.phaseWatermark}>{n}</div>
      <div style={S.phaseContent}>
        <div style={S.phaseNode} />
        <div style={S.phaseTitle}>{title}</div>
        <div style={S.phaseDesc}>
          {line1}<br />
          <span style={S.phaseDescLight}>{line2}</span><br />
          <span style={S.phaseDescLight}>{line3}</span>
        </div>
      </div>
    </div>
  );
}

function Hub() {
  const cx = 117, cy = 90;
  const ff = 'system-ui, -apple-system, sans-serif';

  return (
    <div style={S.hub}>
      <svg viewBox="0 0 235 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
        {/* Background Tech Grid */}
        <defs>
          <pattern id="techGrid" width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="var(--color-gray-200)" strokeWidth="0.5" opacity="0.6" />
            <circle cx="12" cy="12" r="0.5" fill="var(--color-gray-300)" />
          </pattern>
        </defs>
        <rect width="235" height="180" fill="url(#techGrid)" />

        {/* Outer Blueprint Rings */}
        <circle cx={cx} cy={cy} r="70" fill="none" stroke="var(--color-gray-300)" strokeWidth="0.5" />
        <circle cx={cx} cy={cy} r="66" fill="none" stroke="var(--color-gray-300)" strokeWidth="0.5" strokeDasharray="2 4" />
        <circle cx={cx} cy={cy} r="40" fill="none" stroke="var(--color-gray-300)" strokeWidth="0.5" />

        {/* Precision Crosshairs */}
        <line x1={cx} y1="5" x2={cx} y2="175" stroke="var(--color-gray-300)" strokeWidth="0.5" strokeDasharray="3 3" />
        <line x1="15" y1={cy} x2="220" y2={cy} stroke="var(--color-gray-300)" strokeWidth="0.5" strokeDasharray="3 3" />

        {/* Data Traces (PCB Style) */}
        <path d={`M ${cx} ${cy} L 85 45 L 45 45`} fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5" />
        <path d={`M ${cx} ${cy} L 149 45 L 189 45`} fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5" />
        <path d={`M ${cx} ${cy} L 85 135 L 45 135`} fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5" />
        <path d={`M ${cx} ${cy} L 149 135 L 189 135`} fill="none" stroke="var(--color-gray-400)" strokeWidth="1.5" />

        {/* Trace Accents (Red) */}
        <path d={`M 85 45 L 45 45`} fill="none" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
        <path d={`M 149 45 L 189 45`} fill="none" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
        <path d={`M 85 135 L 45 135`} fill="none" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
        <path d={`M 149 135 L 189 135`} fill="none" stroke="var(--color-accent-strong)" strokeWidth="1.5" />

        {/* Core Background to hide grid lines */}
        <circle cx={cx} cy={cy} r="20" fill="var(--color-surface)" stroke="var(--color-gray-300)" strokeWidth="0.5" />

        {/* Core Logo */}
        <svg x={cx - 12} y={cy - 13} width="24" height="26" viewBox="0 0 91 100" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 43.4041L41.5946 74H61L19.7092 34L10 43.4041Z" fill="var(--color-accent-strong)"/>
          <path d="M80 57.8356L48.4056 28H29L70.2908 67L80 57.8356Z" fill="var(--color-accent-strong)"/>
          <path d="M23 8H7V92H23V8Z" fill="var(--color-accent-strong)"/>
          <path d="M82 8H65V92H82V8Z" fill="var(--color-accent-strong)"/>
        </svg>

        {/* Micro-typography / Tech Specs */}
        <text x={cx + 26} y={cy - 26} fill="var(--color-gray-400)" fontSize="4" fontFamily={ff} letterSpacing="1">CORE.01</text>
        <text x={cx - 26} y={cy + 30} fill="var(--color-gray-400)" fontSize="4" fontFamily={ff} letterSpacing="1" textAnchor="end">QATAR.AI</text>

        {/* Nodes */}
        {/* COMPUTE (Top Left) */}
        <g transform="translate(45, 45)">
          <circle cx="0" cy="0" r="3" fill="var(--color-surface)" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
          <text x="-8" y="-4" textAnchor="end" fill="var(--color-gray-900)" fontSize="7" fontWeight="900" letterSpacing="0.5" fontFamily={ff}>COMPUTE</text>
          <text x="-8" y="4" textAnchor="end" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>High-density GPU</text>
          <text x="-8" y="11" textAnchor="end" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>AI-optimized DCs</text>
        </g>

        {/* ENERGY (Top Right) */}
        <g transform="translate(189, 45)">
          <circle cx="0" cy="0" r="3" fill="var(--color-surface)" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
          <text x="8" y="-4" textAnchor="start" fill="var(--color-gray-900)" fontSize="7" fontWeight="900" letterSpacing="0.5" fontFamily={ff}>ENERGY</text>
          <text x="8" y="4" textAnchor="start" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>Reliable power</text>
          <text x="8" y="11" textAnchor="start" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>Sustainable</text>
        </g>

        {/* CAPITAL (Bottom Left) */}
        <g transform="translate(45, 135)">
          <circle cx="0" cy="0" r="3" fill="var(--color-surface)" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
          <text x="-8" y="-4" textAnchor="end" fill="var(--color-gray-900)" fontSize="7" fontWeight="900" letterSpacing="0.5" fontFamily={ff}>CAPITAL</text>
          <text x="-8" y="4" textAnchor="end" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>Sovereign anchor</text>
          <text x="-8" y="11" textAnchor="end" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>Strategic LPs</text>
        </g>

        {/* TALENT (Bottom Right) */}
        <g transform="translate(189, 135)">
          <circle cx="0" cy="0" r="3" fill="var(--color-surface)" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
          <text x="8" y="-4" textAnchor="start" fill="var(--color-gray-900)" fontSize="7" fontWeight="900" letterSpacing="0.5" fontFamily={ff}>TALENT</text>
          <text x="8" y="4" textAnchor="start" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>Engineers & R&D</text>
          <text x="8" y="11" textAnchor="start" fill="var(--color-gray-500)" fontSize="5" fontWeight="700" fontFamily={ff}>Founders</text>
        </g>
      </svg>
    </div>
  );
}

function FundingGrid() {
  const cells = Array.from({ length: 100 }, (_, i) => i);
  return (
    <div style={S.fundingGrid}>
      {cells.map((i) => {
        const active = i < 70;
        const isPrimary = active && (i % 3 === 0);
        return (
          <div
            key={i}
            style={{
              ...S.fundingCell,
              background: active 
                ? (isPrimary ? 'var(--color-accent-primary)' : 'var(--color-accent-strong)') 
                : 'var(--color-gray-200)'
            }}
          />
        );
      })}
    </div>
  );
}

function StatRow({ icon, value, label }) {
  return (
    <div style={S.statRow}>
      <RowIcon kind={icon} />
      <div>
        <div style={S.statRowValue}>{value}</div>
        <div style={S.statRowLabel}>{label}</div>
      </div>
    </div>
  );
}

function RowIcon({ kind }) {
  const stroke = 'color-mix(in srgb, var(--color-surface) 40%, transparent)';
  const sz = 16;
  if (kind === 'rack')
    return (
      <div style={{ width: sz, height: sz, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <div style={{ flex: 1, border: `1px solid ${stroke}` }} />
        <div style={{ flex: 1, border: `1px solid ${stroke}` }} />
        <div style={{ flex: 1, border: `1px solid ${stroke}` }} />
      </div>
    );
  if (kind === 'people')
    return <div style={{ width: sz, height: sz, border: `1px solid ${stroke}`, borderRadius: '50%' }} />;
  if (kind === 'building')
    return (
      <div style={{ width: sz, height: sz, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, border: `1px solid ${stroke}` }} />
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '60%',
            height: '60%',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1,
          }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ border: `1px solid ${stroke}` }} />
          ))}
        </div>
      </div>
    );
  if (kind === 'bolt')
    return (
      <div style={{ width: sz, height: sz, color: 'color-mix(in srgb, var(--color-surface) 60%, transparent)', fontSize: 16, lineHeight: 1, fontWeight: 800, textAlign: 'center' }}>↯</div>
    );
  return null;
}

/* ---------- styles ---------- */
/* Page totale = 680px. Sections en pixels exacts — heights LOCKED.
   header(122) + phases(102) + mid(282) + picture(82) + building(92) = 680. */

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
  },

  /* HEADER (122px) */
  header: {
    ...SECTION,
    height: 122,
    padding: '34px 26px 18px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: 900,
    letterSpacing: -1,
    margin: 0,
    lineHeight: 1,
    textTransform: 'uppercase',
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  pageNum: {
    fontSize: 9,
    fontWeight: 700,
    textAlign: 'right',
    color: 'var(--color-text-secondary)',
    letterSpacing: 1,
  },
  pageNumBar: {
    width: 18,
    height: 1.5,
    background: 'var(--color-gray-900)',
    marginLeft: 'auto',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: 'var(--color-text-secondary)',
    marginTop: 8,
    maxWidth: '85%',
    fontWeight: 500,
  },

  /* PHASES (102px) */
  phases: {
    ...SECTION,
    overflow: 'visible',
    height: 102,
    display: 'flex',
    alignItems: 'stretch',
    padding: '0 26px',
    borderBottom: '1px solid var(--color-border-light)',
  },
  phasesInner: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-between',
    position: 'relative',
    top: -5,
  },
  phase: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    paddingRight: 10,
  },
  phaseWatermark: {
    position: 'absolute',
    top: -15,
    left: -5,
    fontSize: 64,
    fontWeight: 900,
    color: 'var(--color-gray-200)',
    lineHeight: 1,
    letterSpacing: -3,
    zIndex: 1,
  },
  phaseContent: {
    position: 'relative',
    zIndex: 2,
    paddingTop: 15,
  },
  phaseNode: {
    width: 6,
    height: 6,
    background: 'var(--color-surface)',
    border: '1.5px solid var(--color-accent-strong)',
    borderRadius: '50%',
    marginBottom: 12,
  },
  phaseTitle: {
    fontSize: 8,
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  phaseDesc: {
    fontSize: 7,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
    fontWeight: 600,
    borderLeft: '1px solid var(--color-gray-300)',
    paddingLeft: 6,
    marginLeft: 2,
  },
  phaseDescLight: {
    color: 'var(--color-text-muted)',
    fontWeight: 500,
  },
  phasesLine: {
    position: 'absolute',
    left: 3,
    right: 3,
    top: 18,
    height: 1,
    background: 'var(--color-gray-300)',
    zIndex: 0,
  },
  arrow: {
    color: 'var(--color-gray-300)',
    fontSize: 12,
    paddingTop: 30,
    fontWeight: 300,
    margin: '0 5px',
  },

  /* MID (282px) */
  mid: {
    ...SECTION,
    height: 282,
    display: 'flex',
    padding: '15px 26px 10px',
    gap: 16,
    borderBottom: '1px solid var(--color-border-light)',
  },
  midLeft: {
    flex: '0 0 55%',
    position: 'relative',
  },
  midRight: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 1.5,
    fontWeight: 800,
    color: 'var(--color-text-primary)',
    lineHeight: 1.4,
    textTransform: 'uppercase',
  },
  midSubtitle: {
    fontSize: 8.5,
    color: 'var(--color-text-secondary)',
    marginTop: 4,
    lineHeight: 1.3,
    fontWeight: 500,
  },

  /* ==========================================
     HUB DIAGRAM (Electronic Ribbon Matrix)
     ========================================== */
  hub: {
    position: 'relative',
    width: '100%',
    height: 180,
    marginTop: 15,
  },
  hubQuote: {
    marginTop: 12,
    fontSize: 8.5,
    fontStyle: 'italic',
    fontWeight: 800,
    color: 'var(--color-accent-strong)',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  /* FUNDING */
  bigStat: {
    fontSize: 42,
    fontWeight: 900,
    letterSpacing: -1.5,
    marginTop: 8,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
  },
  fundingGrid: {
    marginTop: 10,
    width: '100%',
    aspectRatio: '10 / 5',
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gap: 1.5,
  },
  fundingCell: {
    width: '100%',
    height: '100%',
  },
  legend: {
    marginTop: 10,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 6,
    color: 'var(--color-text-secondary)',
    letterSpacing: 0.5,
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  legendDot: {
    width: 10,
    height: 5,
  },
  midQuote: {
    margin: 'auto 0 0 0',
    fontSize: 7.5,
    fontStyle: 'italic',
    color: 'var(--color-text-secondary)',
    lineHeight: 1.4,
    borderLeft: '2px solid var(--color-gray-300)',
    paddingLeft: 8,
  },

  /* PICTURE (82px) */
  picture: {
    ...SECTION,
    height: 82,
    backgroundImage: "url('/u2883995211_httpss.mj.run0EzymJvOvRs_Aerial_masterplan_view_of__2273042f-e6f1-4e14-a216-b976ea0fdab7.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 20%', /* Haut de l'image */
  },

  /* BUILDING (92px) */
  building: {
    ...SECTION,
    height: 92,
    position: 'relative',
  },
  buildingImg: {
    position: 'absolute',
    inset: 0,
    backgroundImage: "url('/u2883995211_httpss.mj.run0EzymJvOvRs_Aerial_masterplan_view_of__2273042f-e6f1-4e14-a216-b976ea0fdab7.png')",
    backgroundSize: 'cover',
    backgroundPosition: 'center 80%', /* Bas de l'image pour faire la continuité */
  },
  buildingOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, transparent 0%, color-mix(in srgb, var(--color-gray-900) 75%, transparent) 100%)',
  },
  statsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 22,
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    padding: '0 26px',
    gap: 8,
    color: 'var(--color-text-inverse)',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: 800,
    lineHeight: 1,
  },
  statRowLabel: {
    fontSize: 5,
    color: 'var(--color-gray-300)',
    marginTop: 2,
    letterSpacing: 0.5,
    fontWeight: 600,
    textTransform: 'uppercase',
  },
  buildingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 10,
    padding: '0 26px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    color: 'var(--color-text-inverse)',
  },
  tagline: {
    fontSize: 10,
    fontWeight: 700,
    fontStyle: 'italic',
    lineHeight: 1.2,
  },
  qatarText: {
    fontSize: 5.5,
    lineHeight: 1.4,
    color: 'var(--color-gray-300)',
    textAlign: 'center',
    maxWidth: '100%',
  },
};
