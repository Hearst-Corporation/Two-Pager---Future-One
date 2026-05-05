'use client';

/* ============================================================
   FUTUR ONE — Pitch deck for Qai Chairman, 6 May 2026
   Posture : Hearst Qatar as a sovereign champion presenting
   its capabilities. No comparative. No positioning vs others.
   ============================================================ */

const ACCENT = 'var(--color-accent-strong)';
const TEXT_DIM = 'var(--color-text-secondary)';
const TEXT_FAINT = 'var(--color-text-muted)';

/* ============================================================ */
/* SLIDE 0 — COVER                                              */
/* ============================================================ */
export function S00Cover() {
  return (
    <div style={S.slide}>
      <div
        style={{
          ...S.bg,
          backgroundImage: "url('/cover-facade.png')",
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(180deg, rgba(245,245,246,0.85) 0%, rgba(245,245,246,0.65) 40%, rgba(245,245,246,0.98) 100%)',
        }}
      />

      <div style={S.topBar}>
        <div style={S.micro}>STATE OF QATAR</div>
        <div style={S.micro}>STRICTLY CONFIDENTIAL</div>
      </div>

      <div style={S.coverCenter}>
        <div style={S.coverEyebrow}>A SOVEREIGN AI CHAMPION FOR QATAR</div>
        <h1 style={S.coverTitle}>
          FUTUR<br />ONE.
        </h1>
        <div style={S.coverDivider} />
        <div style={{ ...S.coverSubtitle, color: 'var(--color-text-secondary)' }}>
          Presented by <span style={{ color: 'var(--color-text-primary)', fontWeight: 700 }}>Hearst Qatar</span>
          <br />
          To His Excellency Abdullah Hamad Al-Misnad — Chairman & Managing Director, Qai
        </div>
      </div>

      <div style={S.bottomBar}>
        <div style={S.micro}>UNDER THE PATRONAGE OF SHEIKH MOHAMMED AL-THANI</div>
        <div style={{ ...S.micro, color: ACCENT }}>DOHA · MAY 2026</div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 1 — VISION : AI = NEW STRATEGIC RESOURCE                */
/* ============================================================ */
export function S01Vision2030() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div style={{ ...S.splitTextLeft, flex: '0 0 55%' }}>
          <div style={S.eyebrow}>OUR CONVICTION</div>
          <h2 style={S.h2}>
            The 20th-century resource was <span style={{ color: ACCENT }}>gas.</span>
            <br />
            The 21st-century resource is <span style={{ color: ACCENT }}>compute.</span>
          </h2>
          <p style={{ ...S.lead, maxWidth: 800 }}>
            Qatar built a global champion on the strategic resource of the last century.
            The next century will reward the states that own their compute, govern their data,
            and host the human ecosystem that turns that compute into value.
            We are here to help carry that flag.
          </p>
        </div>

        <div style={{ ...S.splitTextRight, flex: '0 0 45%', background: 'var(--color-gray-900)', color: '#fff' }}>
          <div style={{ ...S.threeCol, display: 'flex', flexDirection: 'column', gap: 40, marginTop: 0 }}>
            <Pillar
              label="ENERGY"
              value="QatarEnergy"
              note="The 20th-century champion. Sovereign. Globally branded. Built over decades."
            />
            <Pillar
              label="AVIATION"
              value="Qatar Airways"
              note="Sovereign global flag-carrier. Skytrax #1. A national identity in the sky."
            />
            <Pillar
              label="INTELLIGENCE"
              value="FUTUR ONE"
              valueAccent
              note="The 21st-century champion. Qatari brand. Qatari operator. Qatari soil."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 2 — HEARST QATAR : WHO WE ARE                          */
/* ============================================================ */
export function S02WhoWeAre() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div
          style={{
            ...S.splitImage,
            flex: '0 0 35%',
            backgroundImage: "url('/hero-datacenter.png')",
          }}
        />

        <div style={{ ...S.splitTextRight, flex: '0 0 65%' }}>
          <div style={S.eyebrow}>HEARST QATAR · WHO WE ARE</div>
          <h2 style={S.h2}>
            A sovereign-grade operator
            <br />
            of <span style={{ color: ACCENT }}>compute, energy and capital.</span>
          </h2>
          <p style={{ ...S.lead, maxWidth: 800 }}>
            Hearst is an industrial operator of high-density compute infrastructure with a track
            record across ten countries. Hearst Qatar is the sovereign vehicle that brings this
            operational discipline home — under Qatari governance, with Qatari capital,
            to serve Qatar National Vision 2030.
          </p>

          <div style={{ ...S.whoGrid, marginTop: 64 }}>
            <WhoStat value="10" label="countries of operation" />
            <WhoStat value="7" label="energy-compute sites" />
            <WhoStat value="10K" label="machines under management" />
            <WhoStat value="2 EH/s" label="aggregate hashrate capacity" />
          </div>

          <div style={{ ...S.callout, marginTop: 64 }}>
            <div style={S.calloutText}>
              We are not a fund. We are not a consultant. <strong>We are an operator.</strong>
              <br />
              Industrial scale. Sovereign discipline. Qatari ambition.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 3 — OUR CAPABILITIES                                    */
/* ============================================================ */
export function S03Capabilities() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div style={{ ...S.splitTextLeft, flex: '0 0 65%' }}>
          <div style={S.eyebrow}>WHAT WE BRING TO QATAR</div>
          <h2 style={S.h2}>
            Six capabilities. <span style={{ color: ACCENT }}>One champion.</span>
          </h2>

          <div style={{ ...S.capGrid, marginTop: 64 }}>
            <Capability
              title="Data Center Operations"
              line="Tier-III/IV high-density facilities. PUE 1.2. Liquid cooling. 24/7 industrial discipline."
            />
            <Capability
              title="Energy & Compute"
              line="Behind-the-meter power. Sustainable cooling. Energy-to-compute optimisation at scale."
            />
            <Capability
              title="GPU & AI Infrastructure"
              line="High-density GPU fleet management. Hopper today. Blackwell-ready. AI-optimised whitespace."
            />
            <Capability
              title="Sovereign Governance"
              line="Partners who have delivered for sovereign states — A*STAR national supercomputer (Singapore), national-grade datacenters across Europe and Asia."
            />
            <Capability
              title="Founder & Talent Programs"
              line="Sourcing, residency, mentorship. The human layer that turns compute into value."
            />
            <Capability
              title="Capital Structuring"
              line="LP/GP architecture. Sovereign-grade reporting. Long-term alignment with Qatari interests."
            />
          </div>
        </div>

        <div
          style={{
            ...S.splitImage,
            flex: '0 0 35%',
            backgroundImage: "url('/water-compute.png')",
          }}
        />
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 4 — THE CAMPUS                                          */
/* ============================================================ */
export function S04Champion() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div style={{ ...S.splitLeft, flex: '0 0 50%', paddingRight: 40 }}>
          <div style={S.eyebrow}>THE PROJECT</div>
          <h2 style={{ ...S.h2, fontSize: 64 }}>
            FUTUR ONE — the
            <br />
            <span style={{ color: ACCENT }}>national AI campus</span> of Qatar.
          </h2>

          <div style={S.championStrip}>
            <div style={S.championItem}>
              <div style={S.championLabel}>HOLDING</div>
              <div style={S.championValue}>Qatari</div>
            </div>
            <div style={S.championDot}>·</div>
            <div style={S.championItem}>
              <div style={S.championLabel}>CAPITAL</div>
              <div style={S.championValue}>Qatari</div>
            </div>
            <div style={S.championDot}>·</div>
            <div style={S.championItem}>
              <div style={S.championLabel}>BRAND</div>
              <div style={S.championValue}>Qatari</div>
            </div>
            <div style={S.championDot}>·</div>
            <div style={S.championItem}>
              <div style={S.championLabel}>GOVERNANCE</div>
              <div style={S.championValue}>Qatari</div>
            </div>
          </div>

          <p style={{ ...S.lead, maxWidth: 980, marginTop: 64 }}>
            A 100,000 m² master-planned campus on Qatari soil. 200 MW IT capacity.
            4,000 residents — founders, engineers, families. 150 startups in active residency.
            Operated under <strong>Hearst Qatar</strong>, designed by <strong>Foster + Partners</strong>,
            built and run by sovereign-grade partners.
          </p>
        </div>

        <div style={{ ...S.splitRight, flex: '0 0 50%' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: "url('/aerial-white.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center left',
            }}
          />
          <div style={{ ...S.overlay, background: 'linear-gradient(90deg, rgba(240,240,243,1) 0%, rgba(240,240,243,0) 15%)' }} />
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 5 — ARCHITECTURE & MASTERPLAN                          */
/* ============================================================ */
export function S05Architecture() {
  return (
    <div style={S.slide}>
      <div
        style={{
          ...S.bg,
          backgroundImage: "url('/hub-masterplan.png')",
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, rgba(240,240,243,1) 0%, rgba(240,240,243,0.9) 45%, rgba(240,240,243,0) 100%)',
        }}
      />

      <div style={{ ...S.splitLayout, width: '60%' }}>
        <div style={S.splitRightPadded}>
          <div style={S.eyebrow}>THE MASTERPLAN</div>
          <h2 style={{ ...S.h2, maxWidth: 800 }}>
            A campus where <span style={{ color: ACCENT }}>silicon</span> and <span style={{ color: ACCENT }}>life</span> live together.
          </h2>

          <div style={{ ...S.archGrid, marginTop: 64, display: 'flex', flexDirection: 'column' }}>
            <ArchBlock title="THE COMPUTE CORE" line="200 MW IT · sovereign GPU clusters · liquid-cooled · Tier-IV resilient" />
            <ArchBlock title="THE INNOVATION DISTRICT" line="150 startups in residency · labs · meeting rooms · demo spaces" />
            <ArchBlock title="THE LIVING QUARTER" line="4,000 residents · housing · schools · healthcare · retail" />
            <ArchBlock title="THE PUBLIC FORUM" line="Auditorium · plazas · gardens · the place Qatar shows the world" />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 6 — THE STACK                                          */
/* ============================================================ */
export function S06Stack() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div style={{ ...S.splitLeft, flex: '0 0 35%', padding: 0 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: "url('/hub-interior.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
            }}
          />
        </div>

        <div style={{ ...S.splitRightPadded, flex: '0 0 65%' }}>
          <div style={S.eyebrow}>OUR EXECUTION TEAM</div>
          <h2 style={S.h2}>
            Operators who have already
            <br />
            <span style={{ color: ACCENT }}>delivered for sovereign states.</span>
          </h2>

          <div style={{ ...S.stackGrid, marginTop: 64 }}>
            <StackCard
              name="Hearst Qatar"
              role="Operator & sovereign vehicle"
              line1="10,000 machines · 2 EH/s · 10 countries"
              line2="Qatari governance · Qatari capital"
            />
            <StackCard
              name="Foster + Partners"
              role="Master architect"
              line1="Apple Park · 260,000 m²"
              line2="James H. Clark Center, Stanford"
            />
            <StackCard
              name="Kontena · KONNECT"
              role="Modular DC platform"
              line1="700 MW deployed globally"
              line2="Yondr 200 MW · Sedenak 500 MW"
            />
            <StackCard
              name="B-Global Tech"
              role="Sovereign supercomputing"
              line1="A*STAR national supercomputer"
              line2="Singapore · $270M project"
            />
            <StackCard
              name="JB Pastor & Fils"
              role="Construction lead"
              line1="High-spec European builder"
              line2="Heritage on sovereign campuses"
            />
            <StackCard
              name="Gatti Services"
              role="24/7 operations"
              line1="Smart hands · Smart PDUs"
              line2="Real-time power monitoring"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 7 — THE METHOD                                         */
/* ============================================================ */
export function S07Method() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div style={{ ...S.splitLeft, flex: '0 0 50%', paddingRight: 40 }}>
          <div style={S.eyebrow}>THE METHOD · 4 PHASES</div>
          <h2 style={S.h2}>
            From <span style={{ color: ACCENT }}>incubation</span> to <span style={{ color: ACCENT }}>global anchor.</span>
          </h2>
          <p style={{ ...S.lead, maxWidth: 980 }}>
            A funnel that turns Qatari compute into Qatari-headquartered champions —
            targeting 70% follow-on funding at 18 months.
          </p>

          <div style={{ ...S.phases, marginTop: 64, flexDirection: 'column', gap: 16 }}>
            <PhaseBox n="01" title="INCUBATE" line="Pre-seed → Seed" sub="3–6 months · 20–30 / cohort" />
            <PhaseBox n="02" title="ACCELERATE" line="Seed → Series A" sub="6–9 months · 20–30 / cohort" />
            <PhaseBox n="03" title="SCALE" line="Series A → B+" sub="Rolling · 20–30 companies" />
            <PhaseBox n="04" title="ANCHOR" line="Global Tech Bridge" sub="Long-term tenancy · M&A" accent />
          </div>
        </div>

        <div style={{ ...S.splitRight, flex: '0 0 50%' }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: "url('/hub-life.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center left',
            }}
          />
          <div style={{ ...S.overlay, background: 'linear-gradient(90deg, rgba(240,240,243,1) 0%, rgba(240,240,243,0) 15%)' }} />
          
          <div style={{ position: 'absolute', bottom: 100, right: 100, background: 'var(--color-surface)', padding: '32px', borderRadius: 12, boxShadow: '0 20px 40px -10px rgba(0,0,0,0.1)', maxWidth: 320 }}>
            <div style={{ fontSize: 72, fontWeight: 900, color: ACCENT, letterSpacing: -3, lineHeight: 1 }}>
              70%
            </div>
            <div style={{ fontSize: 16, color: 'var(--color-text-primary)', fontWeight: 700, lineHeight: 1.4, marginTop: 12 }}>
              Follow-on funding target at 18 months
            </div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 8, lineHeight: 1.5 }}>
              The benchmark for a campus operated as a product, not as a rental space.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 8 — THE NUMBERS                                        */
/* ============================================================ */
export function S08Numbers() {
  return (
    <div style={S.slide}>
      <div
        style={{
          ...S.bg,
          backgroundImage: "url('/amphitheater.png')",
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, rgba(240,240,243,1) 0%, rgba(240,240,243,0.9) 55%, rgba(240,240,243,0) 100%)',
        }}
      />

      <div style={{ ...S.splitLayout, width: '65%' }}>
        <div style={S.splitRightPadded}>
          <div style={S.eyebrow}>THE CAMPUS · AT FULL CAPACITY</div>
          <h2 style={S.h2}>
            What <span style={{ color: ACCENT }}>FUTUR ONE</span> looks like.
          </h2>

          <div style={{ ...S.bigStats, marginTop: 64, gridTemplateColumns: 'repeat(2, 1fr)', gap: 40 }}>
            <BigStat value="100K" label="m² master-planned campus" />
            <BigStat value="200 MW" label="IT power capacity" />
            <BigStat value="4,000" label="residents · founders & teams" />
            <BigStat value="150" label="active residency startups" />
          </div>

          <div style={{ ...S.bandRow, marginTop: 64, gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            <div style={S.bandItem}><strong>0% tax</strong> · QFC environment</div>
            <div style={S.bandItem}><strong>Full ownership</strong> · founder-friendly</div>
            <div style={S.bandItem}><strong>Qatar Label Program</strong> · sovereign certification</div>
            <div style={S.bandItem}><strong>Housing · Education · Healthcare</strong> packages</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 9 — ALIGNMENT WITH QATAR NATIONAL VISION 2030          */
/* ============================================================ */
export function S09Alignment() {
  return (
    <div style={S.slide}>
      <div style={S.splitLayout}>
        <div style={{ ...S.splitLeft, flex: '0 0 35%', padding: 0 }}>
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundImage: "url('/desalination.png')",
              backgroundSize: 'cover',
              backgroundPosition: 'center right',
            }}
          />
        </div>

        <div style={{ ...S.splitRightPadded, flex: '0 0 65%' }}>
          <div style={S.eyebrow}>ALIGNED WITH QATAR NATIONAL VISION 2030</div>
          <h2 style={S.h2}>
            Four pillars. <span style={{ color: ACCENT }}>One campus.</span>
          </h2>
          <p style={{ ...S.lead, maxWidth: 800 }}>
            FUTUR ONE is designed from day one to serve the four pillars
            of Qatar National Vision 2030 — not as a side effect, but as its central thesis.
          </p>

          <div style={{ ...S.alignGrid, marginTop: 64 }}>
            <AlignCard
              pillar="HUMAN DEVELOPMENT"
              line="A campus that trains 4,000 residents and 150 startup teams in the disciplines that will run the next economy. Qatari talent at the core."
            />
            <AlignCard
              pillar="ECONOMIC DEVELOPMENT"
              line="Diversification beyond hydrocarbons. A new asset class — sovereign AI infrastructure — owned and operated by Qatar."
            />
            <AlignCard
              pillar="SOCIAL DEVELOPMENT"
              line="Housing, education, healthcare integrated on campus. A place where Qatari families and global founders live as one community."
            />
            <AlignCard
              pillar="ENVIRONMENTAL DEVELOPMENT"
              line="Sustainable cooling. Behind-the-meter power. PUE 1.2. A campus designed to make compute compatible with Qatari climate ambitions."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 10 — CLOSING                                           */
/* ============================================================ */
export function S10Closing() {
  return (
    <div style={S.slide}>
      <div
        style={{
          ...S.bg,
          backgroundImage: "url('/back-cover.png')",
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(180deg, rgba(240,240,243,0.9) 0%, rgba(240,240,243,0.7) 50%, rgba(240,240,243,1) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 100px 80px',
          textAlign: 'center',
        }}
      >
        <div style={{ ...S.eyebrow, marginBottom: 32 }}>QATAR · 2026</div>

        <div style={{ fontSize: 96, fontWeight: 900, lineHeight: 0.95, letterSpacing: -3, maxWidth: 1100 }}>
          AI is the <span style={{ color: ACCENT }}>new gas.</span>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 22,
            fontStyle: 'italic',
            color: 'var(--color-text-secondary)',
            maxWidth: 820,
            lineHeight: 1.5,
            fontWeight: 400,
          }}
        >
          Qatar mastered the resource of the 20th century.
          <br />
          We are here to help carry the next one.
        </div>

        <div
          style={{
            marginTop: 80,
            padding: '20px 36px',
            border: `1px solid ${ACCENT}`,
            borderRadius: 4,
            fontSize: 13,
            letterSpacing: 3,
            fontWeight: 800,
            color: 'var(--color-text-primary)',
            textTransform: 'uppercase',
          }}
        >
          Hearst Qatar · FUTUR ONE
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SUB-COMPONENTS                                               */
/* ============================================================ */

function Pillar({ label, value, valueAccent, note }) {
  return (
    <div style={S.pillar}>
      <div style={S.pillarLabel}>{label}</div>
      <div
        style={{
          ...S.pillarValue,
          color: valueAccent ? ACCENT : 'var(--color-text-primary)',
        }}
      >
        {value}
      </div>
      <div style={S.pillarNote}>{note}</div>
    </div>
  );
}

function WhoStat({ value, label }) {
  return (
    <div style={S.whoStat}>
      <div style={S.whoStatValue}>{value}</div>
      <div style={S.whoStatLabel}>{label}</div>
    </div>
  );
}

function Capability({ title, line }) {
  return (
    <div style={S.capCard}>
      <div style={S.capTitle}>{title}</div>
      <div style={S.capLine}>{line}</div>
    </div>
  );
}

function ArchBlock({ title, line }) {
  return (
    <div style={S.archCard}>
      <div style={S.archTitle}>{title}</div>
      <div style={S.archLine}>{line}</div>
    </div>
  );
}

function PhaseBox({ n, title, line, sub, accent }) {
  return (
    <div style={{ ...S.phaseBox, ...(accent ? S.phaseBoxAccent : null) }}>
      <div style={S.phaseN}>{n}</div>
      <div style={S.phaseTitle}>{title}</div>
      <div style={S.phaseLine}>{line}</div>
      <div style={S.phaseSub}>{sub}</div>
    </div>
  );
}

function PhaseArrow() {
  return (
    <div style={S.phaseArrow}>
      <svg width="24" height="14" viewBox="0 0 24 14" fill="none">
        <path d="M0 7 L20 7 M14 1 L20 7 L14 13" stroke="var(--color-gray-300)" strokeWidth="1" />
      </svg>
    </div>
  );
}

function StackCard({ name, role, line1, line2 }) {
  return (
    <div style={S.stackCard}>
      <div style={S.stackRole}>{role}</div>
      <div style={S.stackName}>{name}</div>
      <div style={S.stackLine}>{line1}</div>
      <div style={S.stackLineDim}>{line2}</div>
    </div>
  );
}

function BigStat({ value, label }) {
  return (
    <div style={S.bigStat}>
      <div style={S.bigStatValue}>{value}</div>
      <div style={S.bigStatLabel}>{label}</div>
    </div>
  );
}

function AlignCard({ pillar, line }) {
  return (
    <div style={S.alignCard}>
      <div style={S.alignPillar}>{pillar}</div>
      <div style={S.alignLine}>{line}</div>
    </div>
  );
}

/* ============================================================ */
/* STYLES                                                       */
/* ============================================================ */

const S = {
  slide: {
    width: '100vw',
    height: '100vh',
    position: 'relative',
    overflow: 'hidden',
    color: 'var(--color-text-primary)',
    background: 'linear-gradient(135deg, #FDFDFD 0%, #F0F0F3 100%)',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 1,
  },
  padded: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '80px 100px',
  },
  splitLayout: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },
  splitTextLeft: {
    flex: '0 0 50%',
    padding: '80px 60px 80px 100px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
  },
  splitTextRight: {
    flex: '0 0 50%',
    padding: '80px 100px 80px 60px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 3,
  },
  splitImage: {
    flex: '0 0 50%',
    position: 'relative',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 1,
  },
  zoneLight: {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
    backdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(0,0,0,0.05)',
  },
  zoneDarker: {
    background: 'linear-gradient(180deg, rgba(0,0,0,0.02) 0%, rgba(0,0,0,0.05) 100%)',
    borderTop: '1px solid rgba(0,0,0,0.05)',
  },

  eyebrow: {
    fontSize: 11,
    letterSpacing: 4,
    fontWeight: 800,
    color: ACCENT,
    textTransform: 'uppercase',
    marginBottom: 32,
  },
  h2: {
    fontSize: 64,
    fontWeight: 900,
    lineHeight: 1.05,
    letterSpacing: -2,
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  lead: {
    fontSize: 19,
    lineHeight: 1.5,
    color: TEXT_DIM,
    marginTop: 32,
    fontWeight: 400,
  },
  body: {
    fontSize: 16,
    lineHeight: 1.6,
    color: TEXT_DIM,
    marginTop: 16,
    fontWeight: 400,
  },
  subhead: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 800,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    marginBottom: 24,
  },

  /* Cover */
  topBar: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    padding: '0 100px',
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: '0 100px',
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  micro: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 700,
    color: 'var(--color-text-muted)',
    textTransform: 'uppercase',
  },
  coverCenter: {
    position: 'relative',
    zIndex: 3,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: '0 100px',
  },
  coverEyebrow: {
    fontSize: 12,
    letterSpacing: 5,
    fontWeight: 800,
    color: ACCENT,
    marginBottom: 28,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: 180,
    fontWeight: 900,
    lineHeight: 0.85,
    letterSpacing: -8,
    margin: 0,
    color: 'var(--color-text-primary)',
  },
  coverDivider: {
    width: 80,
    height: 3,
    background: ACCENT,
    margin: '40px 0 28px',
  },
  coverSubtitle: {
    fontSize: 16,
    lineHeight: 1.7,
    color: TEXT_DIM,
    fontWeight: 400,
    maxWidth: 600,
  },

  /* Pillars */
  threeCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 56,
  },
  pillar: {
    paddingTop: 28,
    borderTop: '1px solid var(--color-border-medium)',
  },
  pillarLabel: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 800,
    color: TEXT_FAINT,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  pillarValue: {
    fontSize: 38,
    fontWeight: 900,
    letterSpacing: -1,
    lineHeight: 1,
    marginBottom: 16,
  },
  pillarNote: {
    fontSize: 13,
    color: TEXT_DIM,
    lineHeight: 1.5,
    fontWeight: 400,
  },

  /* Who we are stats */
  whoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 32,
  },
  whoStat: {
    paddingTop: 24,
    borderTop: '1px solid rgba(255,255,255,0.3)',
  },
  whoStatValue: {
    fontSize: 56,
    fontWeight: 900,
    color: '#fff',
    letterSpacing: -2,
    lineHeight: 1,
    marginBottom: 12,
  },
  whoStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: 600,
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: 1.4,
  },

  /* Capabilities grid */
  capGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  capCard: {
    padding: '32px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderLeft: `4px solid ${ACCENT}`,
    minHeight: 160,
    borderRadius: '0 12px 12px 0',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
  },
  capTitle: {
    fontSize: 16,
    fontWeight: 900,
    color: 'var(--color-text-primary)',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  capLine: {
    fontSize: 13,
    color: TEXT_DIM,
    lineHeight: 1.55,
    fontWeight: 400,
  },

  /* Champion strip */
  championStrip: {
    marginTop: 56,
    display: 'flex',
    alignItems: 'flex-end',
    gap: 24,
    paddingTop: 32,
    borderTop: `1px solid var(--color-border-medium)`,
  },
  championItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  championLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 800,
    color: TEXT_FAINT,
    textTransform: 'uppercase',
  },
  championValue: {
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: -1,
    color: ACCENT,
    lineHeight: 1,
  },
  championDot: {
    fontSize: 32,
    color: 'var(--color-gray-300)',
    paddingBottom: 4,
  },

  /* Architecture grid */
  archGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 16,
    maxWidth: 920,
  },
  archCard: {
    padding: '32px',
    background: 'rgba(255,255,255,0.9)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 12,
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
  },
  archTitle: {
    fontSize: 12,
    letterSpacing: 2.5,
    fontWeight: 800,
    color: ACCENT,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  archLine: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.5,
    fontWeight: 500,
  },

  /* Callout */
  callout: {
    padding: '32px 40px',
    borderLeft: `4px solid ${ACCENT}`,
    background: 'var(--color-surface)',
    borderRadius: '0 12px 12px 0',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
  },
  calloutText: {
    fontSize: 18,
    fontWeight: 500,
    lineHeight: 1.55,
    color: 'var(--color-text-primary)',
  },

  /* Phases */
  phases: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 0,
    width: '100%',
  },
  phaseBox: {
    flex: 1,
    padding: '32px 28px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
  },
  phaseBoxAccent: {
    background: 'rgba(190,18,60,0.04)',
    borderColor: ACCENT,
  },
  phaseArrow: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 14px',
  },
  phaseN: {
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: 800,
    color: ACCENT,
  },
  phaseTitle: {
    fontSize: 18,
    fontWeight: 900,
    color: 'var(--color-text-primary)',
    letterSpacing: 1,
  },
  phaseLine: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
    marginTop: 4,
  },
  phaseSub: {
    fontSize: 12,
    color: TEXT_DIM,
    fontWeight: 400,
  },

  /* Stack grid */
  stackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 16,
  },
  stackCard: {
    padding: '32px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
  },
  stackRole: {
    fontSize: 10,
    letterSpacing: 3,
    fontWeight: 800,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  stackName: {
    fontSize: 22,
    fontWeight: 900,
    color: 'var(--color-text-primary)',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  stackLine: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    fontWeight: 600,
  },
  stackLineDim: {
    fontSize: 12,
    color: TEXT_DIM,
    fontWeight: 400,
  },

  /* Big stats */
  bigStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 32,
  },
  bigStat: {
    paddingTop: 24,
    borderTop: '1px solid var(--color-border-medium)',
  },
  bigStatValue: {
    fontSize: 72,
    fontWeight: 900,
    color: 'var(--color-text-primary)',
    letterSpacing: -3,
    lineHeight: 1,
    marginBottom: 12,
  },
  bigStatLabel: {
    fontSize: 12,
    color: TEXT_DIM,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bandRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
    paddingTop: 28,
    borderTop: '1px solid var(--color-border-light)',
  },
  bandItem: {
    fontSize: 13,
    color: 'var(--color-text-secondary)',
    fontWeight: 500,
    lineHeight: 1.4,
  },

  /* Alignment Vision 2030 */
  alignGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 18,
  },
  alignCard: {
    padding: '36px 40px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 12,
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.05)',
  },
  alignPillar: {
    fontSize: 12,
    letterSpacing: 2.5,
    fontWeight: 800,
    color: ACCENT,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  alignLine: {
    fontSize: 14,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.55,
    fontWeight: 400,
  },
};
