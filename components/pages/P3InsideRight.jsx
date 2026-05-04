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

      {/* ============== 4 PHASES (102px) ============== */}
      <section style={S.phases}>
        <div style={S.phasesInner}>
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
            line2="Rolling"
            line3="POCs • M&A"
          />
        </div>
      </section>

      {/* ============== MID : HUB + FUNDING (282px) ============== */}
      <section style={S.mid}>
        <div style={S.midLeft}>
          <div style={{ ...S.eyebrow, color: 'var(--color-accent-strong)' }}>THE SOVEREIGN AI INFRASTRUCTURE HUB</div>
          <div style={S.midSubtitle}>
            One integrated ecosystem.
            <br />
            Unlimited scale.
          </div>
          <Hub />
        </div>

        <div style={S.midRight}>
          <div style={S.eyebrow}>
            SUBSEQUENT FUNDING
            <br />
            AT 18 MONTHS
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
            "We will be the world's first fully AI-managed campus, orchestrating every dimension
            from sports and health to energy optimization and beyond."
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
          <StatRow icon="bolt" value="€400M" label="PHASE 1 CAPEX" />
        </div>
        <div style={S.buildingFooter}>
          <div>
            <div style={S.tagline}>Sovereign by design.</div>
            <div style={{ ...S.tagline, color: 'var(--color-gray-300)' }}>Global by intent.</div>
          </div>
          <div style={S.qatarText}>
            <strong style={{ color: 'var(--color-text-inverse)' }}>QATAR LABEL PROGRAM</strong> · Official certification for high-potential
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
  const nodes = [
    { id: 'n1', x: 180, y: 30, title: 'AI SERVICES', desc: 'Models • Data\nTools • Platforms', align: 'right', side: 'left' },
    { id: 'n2', x: 420, y: 30, title: 'COMPUTE & HPC', desc: 'Tier IV Data Centers\nHigh density racks', align: 'left', side: 'right' },
    { id: 'n3', x: 180, y: 90, title: 'ENERGY', desc: 'Reliable Power\nSustainable', align: 'right', side: 'left' },
    { id: 'n4', x: 420, y: 90, title: 'INFRASTRUCTURE', desc: 'Campus & Facilities\nConnectivity', align: 'left', side: 'right' },
    { id: 'n5', x: 180, y: 150, title: 'TALENT', desc: 'Engineers • Researchers\nEntrepreneurs', align: 'right', side: 'left' },
    { id: 'n6', x: 420, y: 150, title: 'CAPITAL', desc: 'Sovereign Funds\nJoint investment', align: 'left', side: 'right' }
  ];

  const renderNappe = (startX, startY, endX, endY) => {
    const lines = [-12, -9, -6, -3, 0, 3, 6, 9, 12];
    const midX = (startX + endX) / 2;
    return (
      <g key={`${startX}-${startY}-${endY}`}>
        {lines.map((off, i) => {
          const isAccent = i === 4 || i === 1 || i === 7;
          const color = isAccent ? 'var(--color-accent-strong)' : 'var(--color-gray-400)';
          const strokeW = isAccent ? 1.2 : 0.5;
          const opacity = isAccent ? 1 : 0.4;
          
          return (
            <path
              key={i}
              d={`M ${startX} ${startY + off} C ${midX} ${startY + off}, ${midX} ${endY + off}, ${endX} ${endY + off}`}
              fill="none"
              stroke={color}
              strokeWidth={strokeW}
              opacity={opacity}
            />
          );
        })}
      </g>
    );
  };

  return (
    <div style={S.hub}>
      <svg viewBox="0 0 600 180" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        {/* Background Grid */}
        <pattern id="dotGrid" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill="var(--color-gray-300)" opacity="0.3"/>
        </pattern>
        <rect width="100%" height="100%" fill="url(#dotGrid)" />

        {/* Vertical Data Bus behind CPU */}
        <g stroke="var(--color-gray-300)" strokeWidth="0.5" opacity="0.4">
          {[-24, -16, -8, 0, 8, 16, 24].map(off => (
            <line key={`v-${off}`} x1={300 + off} y1="0" x2={300 + off} y2="180" />
          ))}
        </g>

        {/* Nappes (Ribbon Cables) */}
        {renderNappe(240, 50, 188, 30)}
        {renderNappe(240, 90, 188, 90)}
        {renderNappe(240, 130, 188, 150)}
        
        {renderNappe(360, 50, 412, 30)}
        {renderNappe(360, 90, 412, 90)}
        {renderNappe(360, 130, 412, 150)}

        {/* Nodes (Connectors) */}
        <g>
          {nodes.map(n => (
            <g key={n.id} transform={`translate(${n.x}, ${n.y})`}>
              {/* Connector port */}
              <rect x={n.side === 'left' ? -4 : -4} y="-16" width="8" height="32" rx="2" fill="var(--color-surface)" stroke="var(--color-gray-900)" strokeWidth="1.5" />
              {/* Pins */}
              {[-12, -9, -6, -3, 0, 3, 6, 9, 12].map(off => (
                <line key={`pin-${off}`} x1={n.side === 'left' ? 4 : -4} y1={off} x2={n.side === 'left' ? 8 : -8} y2={off} stroke="var(--color-gray-900)" strokeWidth="1" />
              ))}
              <circle cx="0" cy="0" r="2.5" fill="var(--color-accent-strong)" />
            </g>
          ))}
        </g>

        {/* Central Core (CPU) */}
        <g transform="translate(300, 90)">
          {/* CPU Base */}
          <rect x="-55" y="-75" width="110" height="150" rx="4" fill="var(--color-surface)" stroke="var(--color-gray-900)" strokeWidth="1.5" />
          <rect x="-46" y="-66" width="92" height="132" rx="2" fill="var(--color-gray-900)" />
          
          {/* CPU Pins */}
          {[-60, -45, -30, -15, 0, 15, 30, 45, 60].map(off => (
            <g key={`cpupin-${off}`}>
              <line x1="-55" y1={off} x2="-60" y2={off} stroke="var(--color-gray-900)" strokeWidth="1.5" />
              <line x1="55" y1={off} x2="60" y2={off} stroke="var(--color-gray-900)" strokeWidth="1.5" />
            </g>
          ))}

          {/* Core Text */}
          <text x="0" y="-6" textAnchor="middle" fill="var(--color-surface)" fontSize="18" fontWeight="900" letterSpacing="2" fontFamily="system-ui, -apple-system, sans-serif">FUTUR</text>
          <text x="0" y="14" textAnchor="middle" fill="var(--color-surface)" fontSize="18" fontWeight="900" letterSpacing="2" fontFamily="system-ui, -apple-system, sans-serif">ONE</text>
          <text x="0" y="32" textAnchor="middle" fill="var(--color-accent-strong)" fontSize="8" fontWeight="800" letterSpacing="3" fontFamily="system-ui, -apple-system, sans-serif">QATAR</text>
        </g>
      </svg>

      {/* HTML Text Overlays */}
      {nodes.map(n => {
        const isLeft = n.side === 'left';
        const style = {
          position: 'absolute',
          top: `${(n.y / 180) * 100}%`,
          transform: 'translateY(-50%)',
          width: 76,
          textAlign: n.align,
        };
        
        if (isLeft) {
          style.left = 0;
        } else {
          style.right = 0;
        }

        return (
          <div key={`txt-${n.id}`} style={style}>
            <div style={S.hubSatTitle}>{n.title}</div>
            <div style={S.hubSatDesc}>
              {n.desc.split('\n').map((line, j) => <div key={j}>{line}</div>)}
            </div>
          </div>
        );
      })}
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
  const stroke = 'rgba(255,255,255,.4)';
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
      <div style={{ width: sz, height: sz, color: 'rgba(255,255,255,.6)', fontSize: 16, lineHeight: 1, fontWeight: 800, textAlign: 'center' }}>↯</div>
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
  hubSatTitle: {
    fontSize: 6.5,
    fontWeight: 900,
    color: 'var(--color-text-primary)',
    letterSpacing: 0.5,
  },
  hubSatDesc: {
    fontSize: 5.5,
    color: 'var(--color-text-secondary)',
    marginTop: 2,
    lineHeight: 1.3,
    fontWeight: 600,
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
    background: 'linear-gradient(180deg, rgba(26,29,36,0) 0%, rgba(26,29,36,0.75) 100%)',
  },
  statsRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 12,
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
    justifyContent: 'space-between',
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
    textAlign: 'right',
    maxWidth: '55%',
  },
};
