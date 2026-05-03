'use client';

/**
 * P3 — Intérieur droite (numéroté "02 / 04" dans le doc).
 * Reproduit la grille du visuel envoyé :
 *   - Header : "THE METHOD." + sous-titre + page num
 *   - Strip : 4 phases (Incubate / Accelerate / Scale / Anchor) avec flèches
 *   - Mid : Hub diagram (gauche) + 70% follow-on funding (droite) + citation
 *   - Image bâtiment + 4 stats overlay
 *   - Bottom strip : tagline + Qatar Label
 */
export default function P3InsideRight() {
  return (
    <div style={S.page}>
      {/* ============== HEADER ============== */}
      <section style={S.header}>
        <div style={S.headerTop}>
          <h1 style={S.title}>
            THE <span style={S.titleAccent}>METHOD.</span>
          </h1>
          <div style={S.pageNum}>
            <div>02 / 04</div>
            <div style={S.pageNumBar} />
          </div>
        </div>
        <p style={S.subtitle}>
          Our proprietary 4-phase program transforms early-stage companies into global category
          leaders through infrastructure, capital and AI.
        </p>
      </section>

      {/* ============== 4 PHASES ============== */}
      <section style={S.phases}>
        <div style={S.phasesInner}>
          <Phase
            n="01"
            icon="seed"
            title="INCUBATE"
            line1="Pre-seed → Seed"
            line2="3–6 months"
            line3="20–30 / batch"
          />
          <Arrow />
          <Phase
            n="02"
            icon="rocket"
            title="ACCELERATE"
            line1="Seed → Series A"
            line2="6–9 months"
            line3="20–30 / cohort"
          />
          <Arrow />
          <Phase
            n="03"
            icon="chart"
            title="SCALE"
            line1="Series A → B+"
            line2="Rolling"
            line3="20–30 companies"
          />
          <Arrow />
          <Phase
            n="04"
            icon="anchor"
            title="ANCHOR"
            line1="Big Tech Bridge"
            line2="Rolling"
            line3="POCs • M&A"
          />
        </div>
      </section>

      {/* ============== MID : HUB + FUNDING ============== */}
      <section style={S.mid}>
        <div style={S.midLeft}>
          <div style={S.eyebrow}>THE SOVEREIGN AI INFRASTRUCTURE HUB</div>
          <div style={S.midSubtitle}>
            One integrated ecosystem.
            <br />
            Unlimited scale.
          </div>
          <Hub />
        </div>

        <div style={S.midRight}>
          <div style={S.eyebrow}>
            FOLLOW-ON FUNDING
            <br />
            AT 18 MONTHS
          </div>
          <div style={S.bigStat}>70%</div>
          <FundingGrid />
          <div style={S.legend}>
            <div style={S.legendRow}>
              <div style={{ ...S.legendDot, background: '#d4d4d4' }} />
              <span>MENA AVERAGE (&lt; 10%)</span>
            </div>
            <div style={S.legendRow}>
              <div style={{ ...S.legendDot, background: '#1a1a1a' }} />
              <span>FUTUR ONE TARGET (70%)</span>
            </div>
          </div>
          <blockquote style={S.midQuote}>
            “We will be the world's first fully AI-managed campus, orchestrating every dimension
            from sports and health to energy optimization and beyond.”
          </blockquote>
        </div>
      </section>

      {/* ============== PICTURE (placeholder photo entre mid et building) ============== */}
      <section style={S.picture} aria-label="Placeholder — photo" />

      {/* ============== BUILDING IMAGE ============== */}
      <section style={S.building}>
        <div style={S.buildingImg} aria-label="Placeholder — image campus" />
        <div style={S.buildingOverlay} />
        <div style={S.statsRow}>
          <StatRow icon="rack" value="150" label="STARTUPS MAX CAPACITY" />
          <StatRow icon="people" value="4 K" label={`RESIDENTS\n(FOUNDERS & TEAMS)`} />
          <StatRow icon="building" value="100 K" label="SQM TOTAL CAMPUS" />
          <StatRow icon="bolt" value="€400M" label="PHASE 1 CAPEX" />
        </div>
        <div style={S.buildingFooter}>
          <div>
            <div style={S.tagline}>Sovereign by design.</div>
            <div style={{ ...S.tagline, color: '#bdbdbd' }}>Global by intent.</div>
          </div>
          <div style={S.qatarText}>
            <strong>QATAR LABEL PROGRAM</strong> · Official certification for high-potential
            companies.
            <br />
            0% tax environment · Fast company setup · Full ownership.
            <br />
            Housing, education, healthcare packages.
          </div>
        </div>
      </section>
    </div>
  );
}

/* ---------- sub-blocks ---------- */

function Phase({ n, icon, title, line1, line2, line3 }) {
  return (
    <div style={S.phase}>
      <div style={S.phaseN}>{n}</div>
      <div style={S.phaseIcon}>
        <PhaseIcon kind={icon} />
      </div>
      <div style={S.phaseTitle}>{title}</div>
      <div style={S.phaseLine1}>{line1}</div>
      <div style={S.phaseLine2}>{line2}</div>
      <div style={S.phaseLine2}>{line3}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div style={S.arrow}>
      <div style={S.arrowLine} />
      <div style={S.arrowHead}>›</div>
    </div>
  );
}

function PhaseIcon({ kind }) {
  const stroke = '#1a1a1a';
  const sz = 18;
  if (kind === 'seed')
    return (
      <div style={{ width: sz, height: sz, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 2,
            width: 1,
            height: '70%',
            background: stroke,
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 2,
            left: '20%',
            width: '60%',
            height: '40%',
            border: `1px solid ${stroke}`,
            borderRadius: '50% 0',
          }}
        />
      </div>
    );
  if (kind === 'rocket')
    return (
      <div
        style={{
          width: sz * 0.6,
          height: sz,
          border: `1px solid ${stroke}`,
          borderRadius: '50% 50% 20% 20%',
          margin: '0 auto',
        }}
      />
    );
  if (kind === 'chart')
    return (
      <div style={{ width: sz, height: sz, display: 'flex', alignItems: 'flex-end', gap: 1 }}>
        <div style={{ flex: 1, height: '40%', background: stroke }} />
        <div style={{ flex: 1, height: '65%', background: stroke }} />
        <div style={{ flex: 1, height: '90%', background: stroke }} />
      </div>
    );
  if (kind === 'anchor')
    return (
      <div style={{ width: sz, height: sz, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 1.5,
            height: '100%',
            background: stroke,
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            width: 6,
            height: 6,
            border: `1px solid ${stroke}`,
            borderRadius: '50%',
            transform: 'translateX(-50%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: '10%',
            width: '80%',
            height: 1.5,
            background: stroke,
            borderRadius: 2,
          }}
        />
      </div>
    );
  return null;
}

function Hub() {
  // FUTUR ONE central + 6 satellites disposés en hexagone
  const satellites = [
    { angle: -90, key: 'COMPUTE & HPC', sub: 'Tier IV Data Centers\nHigh-Density Racks\nMassive Scale', textSide: 'right', textOffset: 50, textOffsetY: -30 },
    { angle: -30, key: 'ENERGY', sub: 'Reliable Power\nSustainable\nOptimized', textSide: 'right', textOffset: 35, textOffsetY: -30 },
    { angle: 30, key: 'INFRASTRUCTURE', sub: 'Campus & Facilities\nConnectivity\nSecurity' },
    { angle: 90, key: 'TALENT & COMMUNITY', sub: 'Engineers · Researchers\nEntrepreneurs · Operators' },
    { angle: 150, key: 'CAPITAL', sub: 'Sovereign Funds\nCo-investment\nLong-Term Alignment' },
    { angle: 210, key: 'AI SERVICES', sub: 'Models · Data\nTools · Platforms\nSupport', textSide: 'left', textOffset: 40, textOffsetY: -30 },
  ];

  const radius = 78;

  return (
    <div style={S.hub}>
      {/* radial connectors : du bord du cercle central jusqu'au satellite */}
      {satellites.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        const startOffsetX = 28 * Math.cos(rad); // 28 = rayon du cercle central
        const startOffsetY = 28 * Math.sin(rad);
        const lineLen = radius - 28 - 8; // 8 = rayon du dot satellite
        return (
          <div
            key={`line-${s.key}`}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              width: lineLen,
              height: 1,
              background: '#9a9a9a',
              transform: `translate(${startOffsetX}px, ${startOffsetY}px) rotate(${s.angle}deg)`,
              transformOrigin: '0 50%',
            }}
          />
        );
      })}

      {/* center */}
      <div style={S.hubCenter}>
        <div style={{ fontSize: 11, fontWeight: 800, lineHeight: 1.05 }}>FUTUR ONE</div>
        <div style={{ fontSize: 7, opacity: 0.85, marginTop: 1 }}>QATAR</div>
      </div>

      {/* satellites */}
      {satellites.map((s) => {
        const rad = (s.angle * Math.PI) / 180;
        const x = Math.cos(rad) * radius;
        const y = Math.sin(rad) * radius;
        const rightSide = Math.cos(rad) > 0.1;
        const leftSide = Math.cos(rad) < -0.1;
        return (
          <div
            key={s.key}
            style={{
              position: 'absolute',
              left: '50%',
              top: '50%',
              transform: `translate(${x}px, ${y + 15}px) translate(-50%, -50%)`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: 90,
            }}
          >
            <div style={S.satDot} />
            <div
              style={{
                transform: s.textSide === 'right' ? `translateX(${s.textOffset ?? 12}px) translateY(${s.textOffsetY ?? 0}px)` : s.textSide === 'left' ? `translateX(-${s.textOffset ?? 12}px) translateY(${s.textOffsetY ?? 0}px)` : undefined,
              }}
            >
              <div
                style={{
                  fontSize: 7,
                  fontWeight: 700,
                  marginTop: 3,
                  textAlign: s.textSide === 'right' ? 'left' : s.textSide === 'left' ? 'right' : 'center',
                  letterSpacing: 0.4,
                }}
              >
                {s.key}
              </div>
              <div
                style={{
                  fontSize: 6,
                  lineHeight: 1.3,
                  color: '#666',
                  whiteSpace: 'pre-line',
                  textAlign: s.textSide === 'right' ? 'left' : s.textSide === 'left' ? 'right' : 'center',
                  marginTop: 1,
                }}
              >
                {s.sub}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function FundingGrid() {
  // 10x10 grid, 70 cells "filled"
  const cells = Array.from({ length: 100 }, (_, i) => i);
  return (
    <div style={S.fundingGrid}>
      {cells.map((i) => {
        const filled = i < 70;
        return (
          <div
            key={i}
            style={{
              ...S.fundingCell,
              background: filled ? '#1a1a1a' : '#e0e0e0',
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
  const stroke = 'rgba(255,255,255,.7)';
  const sz = 18;
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
      <div style={{ width: sz, height: sz, color: stroke, fontSize: 18, lineHeight: 1, fontWeight: 700, textAlign: 'center' }}>↯</div>
    );
  return null;
}

/* ---------- styles ---------- */
/* Page totale = 680px. Sections en pixels exacts — heights LOCKED, ne plus toucher.
   header(122) + phases(102) + mid(282, padding-top 80) + picture(82) + building(92) = 680. */

const SECTION = { flexShrink: 0, flexGrow: 0, minHeight: 0, overflow: 'hidden' };

const S = {
  page: {
    width: '100%',
    height: '100%',
    background: '#fff',
    color: '#111',
    fontFamily:
      'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },

  /* HEADER */
  header: {
    ...SECTION,
    height: 122,
    padding: '34px 22px 18px',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 30,
    fontWeight: 800,
    letterSpacing: -0.6,
    margin: 0,
    lineHeight: 1,
  },
  titleAccent: {
    color: '#666',
  },
  pageNum: {
    fontSize: 9,
    fontWeight: 500,
    textAlign: 'right',
    color: '#444',
  },
  pageNumBar: {
    width: 18,
    height: 1.5,
    background: '#888',
    marginLeft: 'auto',
    marginTop: 3,
  },
  subtitle: {
    fontSize: 8.5,
    lineHeight: 1.45,
    color: '#444',
    marginTop: 6,
    maxWidth: '78%',
  },

  /* PHASES */
  phases: {
    ...SECTION,
    overflow: 'visible',
    height: 102,
    display: 'flex',
    alignItems: 'stretch',
    padding: '0 22px',
    gap: 4,
    borderBottom: '1px solid #e8e8e8',
  },
  /* wrapper interne pour décaler le contenu vers le haut sans toucher la box */
  phasesInner: {
    flex: 1,
    display: 'flex',
    alignItems: 'stretch',
    gap: 4,
    position: 'relative',
    top: -12,
  },
  phase: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },
  phaseN: {
    fontSize: 28,
    fontWeight: 800,
    color: '#dcdcdc',
    lineHeight: 1,
    letterSpacing: -1,
  },
  phaseIcon: {
    height: 22,
    display: 'flex',
    alignItems: 'center',
    marginTop: 2,
  },
  phaseTitle: {
    fontSize: 9,
    fontWeight: 800,
    letterSpacing: 1,
    marginTop: 4,
  },
  phaseLine1: {
    fontSize: 7.5,
    color: '#222',
    marginTop: 2,
  },
  phaseLine2: {
    fontSize: 7,
    color: '#666',
    marginTop: 1,
  },
  arrow: {
    width: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 26,
    flexShrink: 0,
  },
  arrowLine: {
    width: 12,
    height: 1,
    background: '#888',
  },
  arrowHead: {
    fontSize: 12,
    color: '#888',
    marginLeft: -2,
    lineHeight: 1,
  },

  /* MID */
  mid: {
    ...SECTION,
    height: 282,
    display: 'flex',
    padding: '15px 22px 10px',
    gap: 16,
    borderBottom: '1px solid #e8e8e8',
  },

  /* PICTURE (placeholder photo entre mid et building) */
  picture: {
    ...SECTION,
    height: 82,
    background:
      'repeating-linear-gradient(45deg, #ececec, #ececec 10px, #e0e0e0 10px, #e0e0e0 20px)',
    borderBottom: '1px solid #e8e8e8',
  },
  midLeft: {
    flex: '0 0 58%',
    position: 'relative',
  },
  midRight: {
    flex: 1,
    position: 'relative',
  },
  eyebrow: {
    fontSize: 7,
    letterSpacing: 1.4,
    fontWeight: 700,
    color: '#1a1a1a',
    lineHeight: 1.4,
  },
  midSubtitle: {
    fontSize: 9,
    color: '#222',
    marginTop: 4,
    lineHeight: 1.3,
  },
  hub: {
    position: 'relative',
    width: '100%',
    height: 158,
    marginTop: 11.5,
  },
  hubCenter: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#1a1a1a',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    zIndex: 2,
  },
  satDot: {
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#1a1a1a',
  },

  /* FUNDING */
  bigStat: {
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: -1.5,
    marginTop: 6,
    lineHeight: 1,
  },
  fundingGrid: {
    marginTop: 6,
    width: '100%',
    aspectRatio: '5 / 3',
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridAutoRows: '1fr',
    gap: 1.5,
  },
  fundingCell: {
    width: '100%',
    height: '100%',
  },
  legend: {
    marginTop: 6,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  legendRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 6.5,
    color: '#444',
    letterSpacing: 0.4,
    fontWeight: 600,
  },
  legendDot: {
    width: 8,
    height: 8,
  },
  midQuote: {
    margin: '8px 0 0',
    fontSize: 7.5,
    fontStyle: 'italic',
    color: '#444',
    lineHeight: 1.4,
  },

  /* BUILDING */
  building: {
    ...SECTION,
    height: 92,
    position: 'relative',
  },
  buildingImg: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, #555 0%, #2c2c2c 60%, #1a1a1a 100%)',
  },
  buildingOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(0,0,0,.1) 0%, rgba(0,0,0,.6) 100%)',
  },
  statsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 10,
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr 1fr',
    padding: '0 22px',
    gap: 8,
    color: '#fff',
  },
  buildingFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 8,
    padding: '0 22px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 16,
    color: '#fff',
  },
  tagline: {
    fontSize: 12,
    fontWeight: 600,
    fontStyle: 'italic',
    lineHeight: 1.2,
    color: '#fff',
  },
  qatarText: {
    fontSize: 6,
    lineHeight: 1.4,
    color: '#cfcfcf',
    textAlign: 'right',
    maxWidth: '52%',
  },
  statRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  statRowValue: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1,
  },
  statRowLabel: {
    fontSize: 5.5,
    color: '#cfcfcf',
    marginTop: 2,
    letterSpacing: 0.4,
    fontWeight: 600,
    whiteSpace: 'pre-line',
    lineHeight: 1.2,
  },

};
