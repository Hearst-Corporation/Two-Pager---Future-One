'use client';

/* ============================================================
   FUTUR ONE — Pitch deck for Qai Chairman, 6 May 2026
   Posture : Hearst Qatar as a sovereign champion presenting
   its capabilities. No comparative. No positioning vs others.
   ------------------------------------------------------------
   Design tokens are imported from ./tokens.js (single source).
   ============================================================ */

import {
  FONT_STACK,
  ACCENT,
  TEXT_DIM,
  TEXT_FAINT,
  TEXT_PRIMARY,
  TEXT_INVERSE,
  SURFACE,
  BORDER_LIGHT,
  BORDER_MEDIUM,
  T,
  W,
  LS,
  L,
  G,
} from './tokens';
import { motion } from 'framer-motion';

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.2
    }
  }
};

const fadeUpItem = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

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
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 25%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 40%, color-mix(in srgb, var(--color-bg-main) 20%, transparent) 50%, transparent 65%)',
        }}
      />

      <div style={S.topBar}>
        <div style={S.micro}>STATE OF QATAR</div>
        <div style={{ ...S.micro, color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 8px rgba(0,0,0,0.6)' }}>STRICTLY CONFIDENTIAL</div>
      </div>

      <div style={{ ...S.coverCenter, width: '55%' }}>
        <div style={S.coverEyebrow}>A SOVEREIGN AI CHAMPION FOR QATAR</div>
        <h1 style={S.coverTitle}>
          FUTUR<br />ONE.
        </h1>
        <div style={S.coverDivider} />
        <div style={S.coverSubtitle}>
          A proposal to <span style={{ color: TEXT_PRIMARY, fontWeight: W.bold }}>His Excellency Abdullah Hamad Al-Misnad</span>
          <br />
          Chairman & Managing Director, Qai
        </div>
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
      {/* Background visuel immersif (métaphore Energy -> Compute) */}
      <div
        style={{
          ...S.bg,
          backgroundImage: "url('/water-compute.png')",
        }}
      />
      {/* Fondu très doux pour intégrer l'image */}
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 35%, color-mix(in srgb, var(--color-bg-main) 60%, transparent) 55%, transparent 100%)',
        }}
      />

      <SectionHeader number="01" title="Conviction" />
      
      <div style={{ ...S.splitLayout, zIndex: 3 }}>
        <motion.div 
          style={{ ...S.splitTextLeft, justifyContent: 'center', flex: '0 0 50%' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6.5vh, 64px)' }}>
            The 20th-century resource was <span style={{ color: ACCENT }}>gas</span>.
            <br />
            The 21st-century resource is <span style={{ color: ACCENT }}>compute</span>.
          </motion.h2>
          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 680, marginTop: '4vh' }}>
            Qatar built a global champion on the strategic resource of the last century.
            The next century will reward the states that own their compute, govern their data,
            and host the human ecosystem that turns that compute into value.
            FUTUR ONE gives that ambition a sovereign home.
          </motion.p>
        </motion.div>

        {/* Colonne de droite : Cartes visuelles asymétriques */}
        <motion.div
          style={{
            ...S.splitTextRight,
            flex: '0 0 50%',
            justifyContent: 'center',
            paddingRight: '8vw',
            paddingLeft: '2vw',
            background: 'transparent',
          }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2vh' }}>
            <motion.div variants={fadeUpItem}>
              <VisionCard
                period="1990 — 2020"
                label="ENERGY"
                value="QatarEnergy"
                bgImage="/desalination.png"
              />
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <VisionCard
                period="1995 — 2025"
                label="AVIATION"
                value="Qatar Airways"
                bgImage="/aerial-white.png"
              />
            </motion.div>
            <motion.div variants={fadeUpItem}>
              <VisionCard
                period="2026 — BEYOND"
                label="INTELLIGENCE"
                value="FUTUR ONE"
                bgImage="/supercomputer.png"
                isMain
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 2 — THE TEAM                                            */
/* ============================================================ */
export function S02Team() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/hero-datacenter.png')",
          backgroundPosition: 'right center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 60%, transparent 100%)',
        }}
      />
      <SectionHeader number="02" title="The Team" />
      <div style={{ ...S.splitLayout, zIndex: 3 }}>
        <motion.div 
          style={{ ...S.splitTextLeft, justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              CONSORTIUM · GLOBAL EXPERTISE
            </div>
          </motion.div>
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            Qatari-led. Globally proven.
            <br />
            <span style={{ color: ACCENT }}>Ready to execute.</span>
          </motion.h2>
          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 800, marginTop: '3.5vh', fontSize: 'min(2.2vh, 20px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            FUTUR ONE is carried by a sovereign-aligned consortium — a Qatari principal,
            an industrial operator, a master architect, and execution partners who have
            already delivered for sovereign states.
          </motion.p>

          <motion.div variants={fadeUpItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vh 1.5vw', marginTop: '4vh' }}>
            <PremiumTeamCard
              role="OPERATOR"
              name="Hearst"
              line="Industrial compute operator · 10 countries · 2 EH/s"
              bgImage="/partners/aerial-dc-campus.png"
            />
            <PremiumTeamCard
              role="ARCHITECT"
              name="Foster + Partners"
              line="Apple Park · Bloomberg HQ · 260,000 m²"
              bgImage="/p2-building-16x9.jpg"
            />
            <PremiumTeamCard
              role="ENGINEERING & BUILD"
              name="Kontena · B-Global · Gatti"
              line="Hyperscale-grade deployments · A*STAR Singapore"
              bgImage="/partners/hardware.jpg"
            />
            <PremiumTeamCard
              role="CULTURE & HOSPITALITY"
              name="Tier-1 curation"
              line="Hospitality · cultural programming · diplomacy lounges"
              bgImage="/hub-life.png"
            />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 3 — TRACK RECORD                                        */
/* ============================================================ */
export function S03TrackRecord() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/hub-interior.png')",
          backgroundPosition: 'left center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(270deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 60%, transparent 100%)',
        }}
      />
      <SectionHeader number="03" title="Track Record" />
      <div style={{ ...S.splitLayout, zIndex: 3, justifyContent: 'flex-end' }}>
        <motion.div 
          style={{ ...S.splitTextRight, justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              TRACK RECORD · PROVEN DELIVERY
            </div>
          </motion.div>
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            Sovereign-grade delivery.
            <br />
            <span style={{ color: ACCENT }}>The risk is not theoretical.</span>
          </motion.h2>

          <motion.div variants={fadeUpItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vh 1.5vw', marginTop: '4vh' }}>
            <PremiumWhoStat
              value="Hyperscale"
              label="datacenter projects delivered"
              location="Malaysia · Norway · Europe"
              bgImage="/partners/aerial-dc-campus.png"
            />
            <PremiumWhoStat
              value="$270M"
              label="A*STAR national supercomputer"
              location="Singapore"
              bgImage="/supercomputer-wide.png"
            />
            <PremiumWhoStat
              value="260K m²"
              label="Apple Park master campus"
              location="Cupertino, USA"
              bgImage="/aerial-white.png"
            />
            <PremiumWhoStat
              value="10K"
              label="compute machines under operation"
              location="10 countries · 4 continents"
              bgImage="/hub-interior.png"
            />
          </motion.div>

          <motion.div variants={fadeUpItem} style={S.callout}>
            <div style={S.calloutText}>
              From Yondr to Sedenak. From Apple Park to A*STAR Singapore.
              <strong> FUTUR ONE combines proven components, not untested promises.</strong>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 4 — THE MONACO OF THE GCC (positionnement unifié)       */
/* ============================================================ */
export function S04Monaco() {
  return (
    <div style={S.slide}>
      <SectionHeader number="04" title="The Positioning" />
      <div
        style={{
          ...S.bg,
          backgroundImage: "url('/aerial-campus-red.png')",
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(135deg, color-mix(in srgb, var(--color-bg-main) 92%, transparent) 0%, color-mix(in srgb, var(--color-bg-main) 78%, transparent) 60%, color-mix(in srgb, var(--color-bg-main) 95%, transparent) 100%)',
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: `calc(56px + 4vh) ${L.padX} 4vh`,
        }}
      >
        <h2 style={{ ...S.h2, maxWidth: 1100 }}>
          The <span style={{ color: ACCENT }}>Monaco of the GCC.</span>
        </h2>
        <p style={{ ...S.lead, maxWidth: 920 }}>
          <strong>100,000 m² · Sovereign compute · Qatari Free Zone.</strong> A principality of
          intelligence, culture, sport and entertainment on Qatari soil.
        </p>

        <MonacoRadial />
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 5 — THE MASTERPLAN (6 quartiers)                        */
/* ============================================================ */
export function S05Masterplan() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/hub-masterplan.png')",
          backgroundPosition: 'right center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 85%, transparent) 55%, transparent 100%)',
        }}
      />
      <SectionHeader number="05" title="The Masterplan" />
      <div style={{ ...S.splitLayout, zIndex: 3 }}>
        <motion.div 
          style={{ flex: '0 0 45%', padding: L.splitPadL, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              MASTERPLAN · 100,000 M²
            </div>
          </motion.div>

          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            From <span style={{ color: ACCENT }}>sovereign compute</span>
            <br />
            to sovereign companies.
          </motion.h2>

          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 600, marginTop: '3.5vh', fontSize: 'min(2.2vh, 20px)', color: TEXT_DIM, lineHeight: 1.6 }}>
            A self-contained principality of intelligence on Qatari soil. 
            Six interconnected districts forming the most advanced founder ecosystem in the GCC.
          </motion.p>

          <motion.div variants={fadeUpItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3vh 2vw', marginTop: '5vh', maxWidth: 600 }}>
            <BigStat value="100K" label="m² campus" />
            <BigStat value="Tier-IV" label="high-density compute" />
            <BigStat value="4,000" label="residents" />
            <BigStat value="150" label="startups" />
          </motion.div>
        </motion.div>

        <motion.div 
          style={{ flex: '0 0 55%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <MasterplanOrbital />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 6 — RDI ECOSYSTEM (Qatari RDI backbone)                 */
/* ============================================================ */
export function S06RDI() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/supercomputer-wide.png')",
          backgroundPosition: 'right center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 60%, transparent 100%)',
        }}
      />
      <SectionHeader number="06" title="RDI Ecosystem" />
      <div style={{ ...S.splitLayout, zIndex: 3 }}>
        <motion.div 
          style={{ ...S.splitTextLeft, justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              RDI BACKBONE · QATAR FOUNDATION
            </div>
          </motion.div>
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            Plugged into the
            <br />
            <span style={{ color: ACCENT }}>Qatari RDI backbone.</span>
          </motion.h2>
          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 800, marginTop: '3.5vh', fontSize: 'min(2.2vh, 20px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            FUTUR ONE is the industrial bridge between Qatar's sovereign research
            backbone and the global founder ecosystem. Where research becomes
            companies. Where MNCs find a hubbed logistics platform to anchor their R&D.
          </motion.p>

          <motion.div variants={fadeUpItem} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vh 1.5vw', marginTop: '4vh' }}>
            <PremiumTeamCard
              role="NATIONAL PROGRAM"
              name="QRDI Council 2030"
              line="The national RDI backbone we plug into · QNRF research grants"
              bgImage="/aerial-white.png"
            />
            <PremiumTeamCard
              role="COMPUTE RESEARCH"
              name="QCRI · Qatar University"
              line="Translating sovereign AI research into product"
              bgImage="/water-compute-16x9.jpg"
            />
            <PremiumTeamCard
              role="ENERGY & CLIMATE"
              name="QEERI"
              line="Compute-meets-sustainability research at scale"
              bgImage="/desalination.png"
            />
            <PremiumTeamCard
              role="LIFE SCIENCES"
              name="QBRI"
              line="Health AI · biomedical applications · Qatar pipeline"
              bgImage="/hub-life.png"
            />
          </motion.div>

          <motion.div variants={fadeUpItem} style={S.callout}>
            <div style={S.calloutText}>
              <strong>Funded research yesterday. Funded companies tomorrow.</strong>
              {' '}From QRDI Council programs and QNRF grants to founder cohorts in residency.
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 7 — METHOD (timeline horizontale)                       */
/* ============================================================ */
export function S07Method() {
  return (
    <div style={S.slide}>
      <SectionHeader number="07" title="The Method" />
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: `calc(56px + 5vh) ${L.padX} 5vh`,
        }}
      >
        <h2 style={S.h2}>
          Revenue starts before
          <br />
          <span style={{ color: ACCENT }}>the monument is complete.</span>
        </h2>
        <p style={{ ...S.lead, maxWidth: 980 }}>
          Operations start <strong>day one (M0)</strong>. Construction runs in parallel —
          each new module, each new wing onboarded as it ships. Every delivered module
          becomes operational capacity.
        </p>

        <DualRail />
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 8 — 30% QATARISATION (le pivot moral)                   */
/* ============================================================ */
export function S08Qatarisation() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/hub-life.png')",
          backgroundPosition: 'right center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 60%, transparent 100%)',
        }}
      />
      <SectionHeader number="08" title="30% Qatarisation" />
      <div style={{ ...S.splitLayout, zIndex: 3 }}>
        <motion.div 
          style={{ ...S.splitTextLeft, justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              QATARISATION · YEAR 1
            </div>
          </motion.div>
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            A <span style={{ color: ACCENT }}>30% Qatari floor</span>
            <br />
            from year one.
          </motion.h2>
          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 800, marginTop: '3.5vh', fontSize: 'min(2.2vh, 20px)', color: TEXT_DIM, lineHeight: 1.6 }}>
            Qatarisation is measured across capital, jobs, suppliers and founders.
            A <strong style={{ color: TEXT_PRIMARY }}>30% floor</strong> from year one ·
            a path to <strong style={{ color: TEXT_PRIMARY }}>50% by year five</strong>.
          </motion.p>

          <motion.div variants={fadeUpItem} style={{ display: 'flex', flexDirection: 'column', gap: '4vh', marginTop: '4vh', width: '100%', maxWidth: 850 }}>
            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2vh 2vw' }}>
              <QatCard
                pct="30%"
                title="CAPITAL"
                line="Reserved tranche for Qatari investors via QFC."
              />
              <QatCard
                pct="30%"
                title="WORKFORCE"
                line="Tawteen-aligned · HBKU pipeline."
                roadmap="→ 50% by Y5"
              />
              <QatCard
                pct="30%"
                title="PROCUREMENT"
                line="Domestic supply chain first."
              />
              <QatCard
                pct="30%"
                title="FOUNDERS"
                line="45 of 150 residency seats reserved."
              />
            </div>

            {/* Curve */}
            <QatarisationCurve />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 9 — GOVERNANCE                                          */
/* ============================================================ */
export function S09Governance() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/p2-building.png')",
          backgroundPosition: 'left center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(270deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 60%, transparent 100%)',
        }}
      />
      <SectionHeader number="09" title="Governance" />
      <div style={{ ...S.splitLayout, zIndex: 3, justifyContent: 'flex-end' }}>
        <motion.div 
          style={{ ...S.splitTextRight, justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              GOVERNANCE · SOVEREIGN CONTROL
            </div>
          </motion.div>
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            <span style={{ color: ACCENT }}>Qatari control</span> with
            <br />
            world-class execution partners.
          </motion.h2>
          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 800, marginTop: '3.5vh', fontSize: 'min(2.2vh, 20px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            FUTUR ONE is a Qatari-controlled holding at QFC — sovereign chair, sovereign capital,
            international expertise as contracted partners. Beyond compliance, FUTUR ONE
            stands as an example Vision 2030 offers to the rest of the world.
          </motion.p>

          <motion.div variants={fadeUpItem} style={S.govGrid}>
            <GovRow label="HOLDING" value="Qatari-controlled · QFC-incorporated · 100% domestic capital" />
            <GovRow label="CHAIR" value="Sheikh Mohammed Al-Thani · QFC sovereign principal" />
            <GovRow label="BOARD" value="Qai · MoCI · Hearst Qatar · independent Qatari directors" />
            <GovRow label="CEO" value="Qatari national · jointly appointed with Qai" />
            <GovRow label="OPERATING PARTNER" value="Hearst Qatar · operates under Qatari governance" />
            <GovRow label="VISION 2030" value="An open window onto the world · an example to follow" />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 10 — THE ASK (3 décisions, 1 trimestre)                 */
/* ============================================================ */
export function S10Ask() {
  return (
    <div style={S.slide}>
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        style={{
          ...S.bg,
          backgroundImage: "url('/vault.png')",
          backgroundPosition: 'right center',
        }}
      />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 40%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 60%, transparent 100%)',
        }}
      />
      <SectionHeader number="10" title="The Ask" />
      <div style={{ ...S.splitLayout, zIndex: 3 }}>
        <motion.div 
          style={{ ...S.splitTextLeft, justifyContent: 'center' }}
          variants={staggerContainer}
          initial="hidden"
          animate="show"
        >
          <motion.div variants={fadeUpItem} style={{ marginBottom: '2.5vh' }}>
            <div style={{ display: 'inline-flex', padding: '0.8vh 1vw', background: 'rgba(190, 18, 60, 0.15)', border: `1px solid rgba(190, 18, 60, 0.4)`, borderRadius: 30, color: ACCENT, fontSize: T.micro + 1, fontWeight: W.bold, letterSpacing: LS.widest, textTransform: 'uppercase', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: ACCENT, boxShadow: `0 0 10px ${ACCENT}` }} />
              NEXT STEPS · 90 DAYS
            </div>
          </motion.div>
          <motion.h2 variants={fadeUpItem} style={{ ...S.h2, fontSize: 'min(6vh, 56px)', letterSpacing: LS.tight, lineHeight: 1.05 }}>
            Three decisions
            <br />
            <span style={{ color: ACCENT }}>to reach first operations.</span>
          </motion.h2>
          <motion.p variants={fadeUpItem} style={{ ...S.lead, maxWidth: 800, marginTop: '3.5vh', fontSize: 'min(2.2vh, 20px)', color: 'rgba(255,255,255,0.75)', lineHeight: 1.6 }}>
            Today's ask is alignment, not a funding decision. Capital follows diligence.
            Three concrete decisions, taken together, unlock the path to first operations.
          </motion.p>

          <motion.div variants={fadeUpItem} style={S.govGrid}>
            <GovRow
              label="MANDATE"
              value="Qai green-light to enter formal MoU phase · Q3 2026"
            />
            <GovRow
              label="SITE"
              value="Joint identification of the 100,000 m² parcel with MoCI · 90 days"
            />
            <GovRow
              label="CAPITAL"
              value="Anchor co-investment ticket alongside Qatari family offices"
            />
          </motion.div>

          <motion.div variants={fadeUpItem} style={S.callout}>
            <div style={{ ...S.calloutText, color: ACCENT, fontWeight: W.bold }}>
              First operations online · month 18 from signing.
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 11 — CLOSING                                            */
/* ============================================================ */
export function S11Closing() {
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
          background: G.overlayClosing,
        }}
      />

      <div style={S.closingStage}>
        <div style={S.eyebrow}>2026</div>

        <h2 style={S.h2Closing}>
          AI is the <span style={{ color: ACCENT }}>new gas.</span>
        </h2>

        <h3 style={{ ...S.h3, marginTop: '3vh', textAlign: 'center' }}>
          The next resource should remain <span style={{ color: ACCENT }}>Qatari.</span>
        </h3>

        <p style={S.closingItalic}>
          We mastered the resource of the 20th century.
          <br />
          FUTUR ONE is built for Qatar's next resource age.
        </p>

        <div style={S.closingSeal}>Hearst · FUTUR ONE</div>

        <div style={S.closingDate}>
          DOHA · MAY 2026 · A PROPOSAL TO HIS EXCELLENCY THE CHAIRMAN OF QAI
        </div>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SUB-COMPONENTS                                               */
/* ============================================================ */

function MasterplanOrbital() {
  const nodes = [
    { angle: -90, icon: <IconCompute />, title: "COMPUTE CORE", line: "Sovereign GPU clusters" },
    { angle: -30, icon: <IconInnovation />, title: "INNOVATION HUB", line: "150 startups · Labs" },
    { angle: 30, icon: <IconLiving />, title: "LIVING QUARTERS", line: "4,000 residents" },
    { angle: 90, icon: <IconHospitality />, title: "HOSPITALITY", line: "200 keys · QFC" },
    { angle: 150, icon: <IconSport />, title: "SPORT & WELLNESS", line: "Esports arena · Padel" },
    { angle: 210, icon: <IconCulture />, title: "CULTURE & ENT.", line: "Auditorium · Biennale" },
  ];

  return (
    <div style={{ position: 'relative', width: 'min(85vh, 900px)', height: 'min(85vh, 900px)', margin: '0 auto', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      
      {/* SVG Connections */}
      <svg viewBox="0 0 1000 1000" style={{ position: 'absolute', width: '100%', height: '100%', zIndex: 0 }}>
        {/* Outer Ring */}
        <motion.circle 
          cx="500" cy="500" r="360" 
          fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" strokeDasharray="10 20"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          style={{ transformOrigin: '500px 500px' }}
        />
        {/* Spokes */}
        {nodes.map((n, i) => {
          const rad = (n.angle * Math.PI) / 180;
          const x = 500 + Math.cos(rad) * 360;
          const y = 500 + Math.sin(rad) * 360;
          return (
            <motion.line
              key={`spoke-${i}`}
              x1="500" y1="500" x2={x} y2={y}
              stroke={ACCENT}
              strokeWidth="3"
              strokeOpacity="0.4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 0.2 + i * 0.1 }}
            />
          );
        })}
      </svg>

      {/* Central Node */}
      <motion.div
        initial={{ scale: 0, x: '-50%', y: '-50%' }}
        animate={{ scale: 1, x: '-50%', y: '-50%' }}
        transition={{ duration: 1, type: 'spring', bounce: 0.4 }}
        style={{
          position: 'absolute', top: '50%', left: '50%',
          width: '28%', height: '28%', borderRadius: '50%',
          background: 'rgba(190, 18, 60, 0.15)',
          border: `3px solid ${ACCENT}`,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          boxShadow: `0 0 100px rgba(190, 18, 60, 0.6), inset 0 0 50px rgba(190, 18, 60, 0.4)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          zIndex: 10
        }}
      >
        <div style={{ fontSize: 'min(4.5vh, 42px)', fontWeight: W.black, color: '#fff', letterSpacing: LS.wider, textAlign: 'center', lineHeight: 1 }}>FUTUR<br/>ONE</div>
        <div style={{ fontSize: 'min(1.8vh, 16px)', color: ACCENT, fontWeight: W.heavy, letterSpacing: LS.widest, marginTop: '1vh' }}>MASTERPLAN</div>
      </motion.div>

      {/* Satellite Nodes */}
      {nodes.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180;
        // 36% from center gives radius 360/1000 in SVG
        const left = 50 + Math.cos(rad) * 36;
        const top = 50 + Math.sin(rad) * 36;
        
        // Determine text box positioning based on angle
        let boxStyle = {};
        let textAlign = 'left';
        let alignItems = 'flex-start';
        
        if (n.angle === -90) { // Top
          boxStyle = { bottom: 'calc(100% + 2vh)', left: '50%', transform: 'translateX(-50%)' };
          textAlign = 'center';
          alignItems = 'center';
        } else if (n.angle === 90) { // Bottom
          boxStyle = { top: 'calc(100% + 2vh)', left: '50%', transform: 'translateX(-50%)' };
          textAlign = 'center';
          alignItems = 'center';
        } else if (n.angle < -90 || n.angle > 90) { // Left side (150, 210)
          boxStyle = { right: 'calc(100% + 1.5vw)', top: '50%', transform: 'translateY(-50%)' };
          textAlign = 'right';
          alignItems = 'flex-end';
        } else { // Right side (-30, 30)
          boxStyle = { left: 'calc(100% + 1.5vw)', top: '50%', transform: 'translateY(-50%)' };
          textAlign = 'left';
          alignItems = 'flex-start';
        }

        return (
          <motion.div
            key={`node-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 + i * 0.15, duration: 0.8, type: 'spring', bounce: 0.4 }}
            style={{
              position: 'absolute',
              left: `${left}%`,
              top: `${top}%`,
              zIndex: 15,
            }}
          >
            <div style={{ position: 'relative' }}>
              {/* Icon Circle (anchored at exactly center) */}
              <motion.div 
                whileHover={{ scale: 1.1, boxShadow: `0 0 50px ${ACCENT}` }}
                style={{
                  position: 'absolute',
                  left: '50%', top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 'min(10vh, 70px)', height: 'min(10vh, 70px)', borderRadius: '50%', 
                  background: 'rgba(20, 20, 20, 0.95)',
                  border: `2px solid ${ACCENT}`,
                  display: 'flex', justifyContent: 'center', alignItems: 'center',
                  color: '#fff',
                  boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                  cursor: 'default',
                  zIndex: 2,
                }}
              >
                <div style={{ transform: 'scale(1.4)', color: ACCENT }}>{n.icon}</div>
              </motion.div>
              
              {/* Text Box (positioned outward from icon) */}
              <div style={{
                position: 'absolute',
                ...boxStyle,
                background: 'rgba(20, 20, 20, 0.85)',
                padding: '1.5vh 1.5vw',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.15)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                boxShadow: '0 15px 30px rgba(0,0,0,0.4)',
                width: 'max-content',
                minWidth: '220px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: alignItems,
                justifyContent: 'center',
                zIndex: 1,
              }}>
                <div style={{ fontSize: 'min(1.8vh, 16px)', fontWeight: W.black, color: '#fff', letterSpacing: LS.wider, marginBottom: '0.4vh', textTransform: 'uppercase' }}>
                  {n.title}
                </div>
                <div style={{ fontSize: 'min(1.5vh, 13px)', color: 'rgba(255,255,255,0.7)', fontWeight: W.semibold, lineHeight: 1.4, textAlign: textAlign }}>
                  {n.line}
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function SectionHeader({ number, title, dark }) {
  return (
    <div
      style={{
        ...S.sectionHeader,
        color: dark ? 'rgba(255,255,255,0.85)' : TEXT_PRIMARY,
        borderBottom: dark
          ? '1px solid rgba(255,255,255,0.12)'
          : `1px solid ${BORDER_LIGHT}`,
      }}
    >
      <div style={S.sectionHeaderLeft}>
        <span style={{ ...S.sectionNumber, color: ACCENT }}>{number}</span>
        <span style={S.sectionDivider}>·</span>
        <span style={S.sectionTitle}>{title}</span>
      </div>
      <div style={S.sectionHeaderRight}>FUTUR ONE</div>
    </div>
  );
}

function Pillar({ label, value, valueAccent, note, dark }) {
  return (
    <div
      style={{
        ...S.pillar,
        borderTop: dark
          ? '1px solid rgba(255,255,255,0.18)'
          : '1px solid var(--color-border-light)',
      }}
    >
      <div
        style={{
          ...S.pillarLabel,
          color: dark ? 'rgba(255,255,255,0.55)' : TEXT_FAINT,
        }}
      >
        {label}
      </div>
      <h3
        style={{
          ...S.pillarValue,
          color: valueAccent
            ? ACCENT
            : dark
            ? TEXT_INVERSE
            : TEXT_PRIMARY,
          margin: 0,
        }}
      >
        {value}
      </h3>
      <div
        style={{
          ...S.pillarNote,
          color: dark ? 'rgba(255,255,255,0.7)' : TEXT_DIM,
        }}
      >
        {note}
      </div>
    </div>
  );
}

function PremiumWhoStat({ value, label, location, bgImage }) {
  return (
    <motion.div
      whileHover="hover"
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '2.5vh 1.5vw',
        minHeight: '22vh',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'default',
      }}
    >
      <motion.div
        variants={{
          hover: { scale: 1.05, filter: 'grayscale(0) brightness(0.9)' }
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(0.3) brightness(0.7)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
        <div style={{ fontSize: T.statM, fontWeight: W.black, color: '#fff', letterSpacing: LS.tight, lineHeight: 1, marginBottom: '1vh' }}>
          {value}
        </div>
        <div style={{ fontSize: T.micro + 2, color: 'rgba(255,255,255,0.7)', fontWeight: W.semibold, letterSpacing: LS.wide, textTransform: 'uppercase', lineHeight: 1.4 }}>
          {label}
        </div>
        {location && (
          <div style={{ marginTop: '0.6vh', fontSize: T.micro, color: ACCENT, fontWeight: W.heavy, letterSpacing: LS.widest, textTransform: 'uppercase' }}>
            {location}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function WhoStat({ value, label, location }) {
  return (
    <div style={S.whoStat}>
      <div style={S.whoStatValue}>{value}</div>
      <div style={S.whoStatLabel}>{label}</div>
      {location && <div style={S.whoStatLocation}>{location}</div>}
    </div>
  );
}

function PremiumArchBlock({ title, line, icon, bgImage }) {
  return (
    <motion.div
      whileHover="hover"
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        padding: '2vh 1.5vw',
        minHeight: '15vh',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'default',
      }}
    >
      <motion.div
        variants={{
          hover: { scale: 1.05, filter: 'grayscale(0) brightness(0.9)' }
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(0.3) brightness(0.65)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column' }}>
        {icon && <div style={{ color: ACCENT, marginBottom: '1vh', display: 'flex', alignItems: 'center' }}>{icon}</div>}
        <div style={{ fontSize: T.micro + 2, letterSpacing: LS.wider, fontWeight: W.heavy, color: '#fff', marginBottom: '0.6vh', textTransform: 'uppercase' }}>
          {title}
        </div>
        <div style={{ fontSize: 'clamp(10px, 1.4vh, 14px)', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, fontWeight: W.medium }}>
          {line}
        </div>
      </div>
    </motion.div>
  );
}

function ArchBlock({ title, line, icon }) {
  return (
    <div style={S.archCard}>
      {icon && <div style={S.archIcon}>{icon}</div>}
      <h3 style={{ ...S.archTitle, margin: 0 }}>{title}</h3>
      <div style={S.archLine}>{line}</div>
    </div>
  );
}

/* SVG icons — single stroke, accent color, consistent style */
const ICON_PROPS = {
  width: 28,
  height: 28,
  viewBox: '0 0 28 28',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};
function IconCompute() {
  return (
    <svg {...ICON_PROPS}>
      <rect x="4" y="5" width="20" height="5" rx="1" />
      <rect x="4" y="12" width="20" height="5" rx="1" />
      <rect x="4" y="19" width="20" height="5" rx="1" />
      <circle cx="8" cy="7.5" r="0.6" fill="currentColor" />
      <circle cx="8" cy="14.5" r="0.6" fill="currentColor" />
      <circle cx="8" cy="21.5" r="0.6" fill="currentColor" />
    </svg>
  );
}
function IconInnovation() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 3v3M5.6 6.6l2.1 2.1M3 14h3M22 14h3M20.3 6.6l-2.1 2.1" />
      <path d="M9.5 18a5 5 0 1 1 9 0c0 1.4-.6 2.5-1.5 3.4v1.6a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1V21.4c-.9-.9-1.5-2-1.5-3.4z" />
    </svg>
  );
}
function IconLiving() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 12L14 3l11 9" />
      <path d="M5 11v12h18V11" />
      <path d="M11 23v-7h6v7" />
    </svg>
  );
}
function IconCulture() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M14 3l2.8 7.2L24 12l-5.5 5 1.4 7.5L14 20.8 8.1 24.5 9.5 17 4 12l7.2-1.8L14 3z" />
    </svg>
  );
}
function IconSport() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="14" cy="14" r="10" />
      <circle cx="14" cy="14" r="5" />
      <circle cx="14" cy="14" r="1.4" fill="currentColor" />
    </svg>
  );
}
function IconHospitality() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="10" cy="10" r="4.5" />
      <path d="M13.5 12.5l10 10" />
      <path d="M19 17l3 3-2 2-3-3" />
    </svg>
  );
}

function StackCard({ name, role, line1, line2 }) {
  return (
    <div style={S.stackCard}>
      <div style={S.stackRole}>{role}</div>
      <h3 style={{ ...S.stackName, margin: 0 }}>{name}</h3>
      <div style={S.stackLine}>{line1}</div>
      <div style={S.stackLineDim}>{line2}</div>
    </div>
  );
}

function BigStat({ value, label }) {
  return (
    <motion.div 
      whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(0,0,0,0.08)', borderColor: 'var(--color-border-medium)' }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      style={{
        padding: '3vh 2vw',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0,0,0,0.03)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1vh',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: ACCENT,
      }} />
      <div style={{ fontSize: 'min(4.8vh, 46px)', fontWeight: W.black, color: TEXT_PRIMARY, letterSpacing: LS.tight, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontSize: T.micro + 2, color: TEXT_DIM, fontWeight: W.bold, textTransform: 'uppercase', letterSpacing: LS.wider }}>
        {label}
      </div>
    </motion.div>
  );
}

function AlignCard({ pillar, line }) {
  return (
    <div style={S.alignCard}>
      <h3 style={{ ...S.alignPillar, margin: 0 }}>{pillar}</h3>
      <div style={S.alignLine}>{line}</div>
    </div>
  );
}

function PremiumTeamCard({ role, name, line, bgImage }) {
  return (
    <motion.div
      whileHover="hover"
      style={{
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '2.5vh 1.5vw',
        minHeight: '22vh',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: 'var(--color-surface)',
        cursor: 'default',
      }}
    >
      <motion.div
        variants={{
          hover: { scale: 1.05, filter: 'grayscale(0) brightness(0.9)' }
        }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'grayscale(0.3) brightness(0.7)',
          zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(0,0,0,0) 10%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.6vh' }}>
        <div style={{ fontSize: T.micro, letterSpacing: LS.widest, fontWeight: W.heavy, color: ACCENT, textTransform: 'uppercase' }}>
          {role}
        </div>
        <div style={{ fontSize: 'min(2.4vh, 22px)', fontWeight: W.black, letterSpacing: LS.hairline, color: '#fff', lineHeight: 1.1 }}>
          {name}
        </div>
        <div style={{ fontSize: 'min(1.4vh, 12px)', color: 'rgba(255,255,255,0.7)', fontWeight: W.medium, lineHeight: 1.5 }}>
          {line}
        </div>
      </div>
    </motion.div>
  );
}

function TeamCard({ role, name, line }) {
  return (
    <div style={S.teamCard}>
      <div style={S.teamRole}>{role}</div>
      <div style={S.teamName}>{name}</div>
      <div style={S.teamLine}>{line}</div>
    </div>
  );
}

function MonacoCard({ tag, line }) {
  return (
    <div style={S.monacoCard}>
      <div style={S.monacoTag}>{tag}</div>
      <div style={S.monacoLine}>{line}</div>
    </div>
  );
}

/* MonacoRadial — Schéma central avec 6 attributs autour du noyau FUTUR ONE.
   Utilise un SVG fixe pour les lignes et une grille CSS pour les nodes texte. */
function MonacoRadial() {
  const cx = 500;
  const cy = 260;
  const r = 220; // radius for nodes
  // 6 angles, en commençant à -90° (top) puis horaire
  const angles = [-90, -30, 30, 90, 150, 210];
  const nodes = [
    { tag: 'FREE ZONE', line: 'QFC structure · Qatari governance · global capital access' },
    { tag: 'MAGNETISM', line: 'The address founders want' },
    { tag: 'ICONIC MONUMENT', line: 'Foster + Partners silhouette' },
    { tag: 'ENTERTAINMENT', line: 'Biennale · concerts · esports' },
    { tag: 'LIFE', line: 'Live, not commute to' },
    { tag: 'DIPLOMACY', line: 'Soft power · World Cup-grade' },
  ];

  const points = angles.map((deg) => {
    const rad = (deg * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad), deg };
  });

  return (
    <div style={S.radialWrap}>
      <svg
        viewBox="0 0 1000 540"
        style={{ width: '100%', height: '100%', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Outer subtle ring */}
        <motion.circle 
          cx={cx} cy={cy} r={r + 30} fill="none" stroke="var(--color-border-light)" strokeWidth="1" strokeDasharray="3 5" 
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        />
        {/* Spokes from center to each node */}
        {points.map((p, i) => (
          <motion.line
            key={i}
            x1={cx}
            y1={cy}
            x2={p.x}
            y2={p.y}
            stroke="var(--color-accent-strong)"
            strokeWidth="1.2"
            opacity="0.55"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.5 + i * 0.1 }}
          />
        ))}
        {/* Node circles */}
        {points.map((p, i) => (
          <motion.g 
            key={`n-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 1 + i * 0.1, type: "spring" }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          >
            <circle cx={p.x} cy={p.y} r="9" fill="var(--color-surface)" stroke="var(--color-accent-strong)" strokeWidth="2" />
            <circle cx={p.x} cy={p.y} r="3.5" fill="var(--color-accent-strong)" />
          </motion.g>
        ))}
        {/* Center disk */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
        >
          <circle cx={cx} cy={cy} r="86" fill="var(--color-gray-900)" />
          <circle cx={cx} cy={cy} r="86" fill="none" stroke="var(--color-accent-strong)" strokeWidth="1.5" />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill="#fff"
            fontSize="22"
            fontWeight="900"
            letterSpacing="-1"
            style={{ fontFamily: FONT_STACK }}
          >
            FUTUR ONE
          </text>
          <text
            x={cx}
            y={cy + 10}
            textAnchor="middle"
            fill="var(--color-accent-strong)"
            fontSize="9"
            fontWeight="800"
            letterSpacing="3"
            style={{ fontFamily: FONT_STACK }}
          >
            MONACO · GCC
          </text>
          <text
            x={cx}
            y={cy + 28}
            textAnchor="middle"
            fill="rgba(255,255,255,0.65)"
            fontSize="9"
            fontWeight="600"
            letterSpacing="1"
            style={{ fontFamily: FONT_STACK }}
          >
            100K m² · sovereign campus
          </text>
        </motion.g>
      </svg>

      {/* Labels HTML positionnés sur les nodes (lecture nette) */}
      {points.map((p, i) => {
        const node = nodes[i];
        // Convert SVG coords (1000×540) to %
        const leftPct = (p.x / 1000) * 100;
        const topPct = (p.y / 540) * 100;
        // Décalage selon position (gauche/droite/haut/bas)
        const isRight = p.x > cx + 30;
        const isLeft = p.x < cx - 30;
        const align = isRight ? 'left' : isLeft ? 'right' : 'center';
        const dx = isRight ? 16 : isLeft ? -16 : 0;
        const dy = p.y < cy ? -28 : 28;
        return (
          <motion.div
            key={`label-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.2 + i * 0.1 }}
            style={{
              position: 'absolute',
              left: `calc(${leftPct}% + ${dx}px)`,
              top: `calc(${topPct}% + ${dy}px)`,
              transform: align === 'right' ? 'translateX(-100%)' : align === 'center' ? 'translateX(-50%)' : 'none',
              textAlign: align,
              maxWidth: 180,
              pointerEvents: 'none',
            }}
          >
            <div style={S.radialTag}>{node.tag}</div>
            <div style={S.radialLine}>{node.line}</div>
          </motion.div>
        );
      })}
    </div>
  );
}

function PhaseStep({ stamp, title, line, accent }) {
  return (
    <div style={S.phaseStep}>
      <div style={{ ...S.phaseDot, ...(accent ? S.phaseDotAccent : null) }} />
      <div style={S.phaseStamp}>{stamp}</div>
      <div style={{ ...S.phaseStepTitle, color: accent ? ACCENT : TEXT_PRIMARY }}>
        {title}
      </div>
      <div style={S.phaseStepLine}>{line}</div>
    </div>
  );
}

/* DualRail — two parallel timelines (Operations vs Infrastructure)
   sharing the same temporal milestones M0 / M12 / M24 / M36+. */
function DualRail() {
  const steps = [
    { 
      stamp: 'M0', 
      op: { title: 'ONBOARDING', line: 'First cohort lands · revenue day one' },
      inf: { title: 'MODULAR LAUNCH', line: 'Modular DC + small founder hub live' }
    },
    { 
      stamp: 'M12', 
      op: { title: 'GROWTH', line: 'Cohorts scale · 150 founders pipeline' },
      inf: { title: 'PHASE 1 ONLINE', line: 'First wings · innovation district' }
    },
    { 
      stamp: 'M24', 
      op: { title: 'HARVESTING', line: 'IP captured · exits · revenues compound' },
      inf: { title: 'CAMPUS + LIFE', line: 'Living quarters · culture · sport' }
    },
    { 
      stamp: 'M36+', 
      op: { title: 'VISIBILITY', line: 'Soft power · global brand · events' },
      inf: { title: 'ICONIC MONUMENT', line: 'Full campus · Foster signature' },
      accent: true
    },
  ];

  return (
    <div style={{ position: 'relative', marginTop: '6vh', width: '100%' }}>
      {/* Labels Operations / Infrastructure */}
      <div style={{ position: 'absolute', top: 0, left: 0, fontSize: T.micro + 2, letterSpacing: LS.widest, fontWeight: W.heavy, color: TEXT_FAINT, textTransform: 'uppercase' }}>OPERATIONS</div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, fontSize: T.micro + 2, letterSpacing: LS.widest, fontWeight: W.heavy, color: TEXT_FAINT, textTransform: 'uppercase' }}>INFRASTRUCTURE</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '3vw', paddingTop: '4vh', paddingBottom: '4vh' }}>
        
        {/* Central Axis */}
        <div style={{ position: 'absolute', top: '50%', left: '4vw', right: '4vw', height: 3, background: 'var(--color-border-light)', transform: 'translateY(-50%)', zIndex: 0 }}>
          <motion.div 
            initial={{ scaleX: 0, transformOrigin: 'left' }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
            style={{ position: 'absolute', inset: 0, background: ACCENT, boxShadow: `0 0 15px ${ACCENT}` }}
          />
        </div>

        {steps.map((step, i) => (
          <div key={`step-${i}`} style={{ display: 'grid', gridTemplateRows: '1fr auto 1fr', gap: '4vh', alignItems: 'center', justifyItems: 'center', zIndex: 1 }}>
            
            {/* Operations Card (Top) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              whileHover={{ y: -5, borderColor: 'var(--color-border-medium)', boxShadow: '0 25px 50px rgba(0,0,0,0.06)' }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 16,
                padding: '3vh 2vw',
                width: '100%',
                boxShadow: '0 15px 30px rgba(0,0,0,0.04)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'end'
              }}
            >
              <div style={{ position: 'absolute', bottom: -16, left: '50%', transform: 'translateX(-50%)', width: 3, height: 16, background: step.accent ? ACCENT : 'var(--color-border-medium)' }} />
              <div style={{ fontSize: 'min(2vh, 18px)', fontWeight: W.black, color: step.accent ? ACCENT : TEXT_PRIMARY, letterSpacing: LS.snug, marginBottom: '0.8vh', textTransform: 'uppercase' }}>{step.op.title}</div>
              <div style={{ fontSize: 'min(1.7vh, 15px)', color: TEXT_DIM, lineHeight: 1.5, fontWeight: W.medium }}>{step.op.line}</div>
            </motion.div>

            {/* Timeline Node */}
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1 + i * 0.15, type: 'spring' }}
              style={{
                width: 'min(8vh, 72px)', height: 'min(8vh, 72px)', borderRadius: '50%', background: 'var(--color-bg-main)',
                border: `4px solid ${step.accent ? ACCENT : TEXT_PRIMARY}`,
                display: 'flex', justifyContent: 'center', alignItems: 'center',
                boxShadow: step.accent ? `0 0 30px rgba(190, 18, 60, 0.3)` : '0 10px 20px rgba(0,0,0,0.06)',
                zIndex: 2,
              }}
            >
              <span style={{ fontSize: 'min(2.2vh, 20px)', fontWeight: W.black, color: step.accent ? ACCENT : TEXT_PRIMARY, letterSpacing: LS.wide }}>{step.stamp}</span>
            </motion.div>

            {/* Infrastructure Card (Bottom) */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.15, duration: 0.5 }}
              whileHover={{ y: 5, borderColor: 'var(--color-border-medium)', boxShadow: '0 25px 50px rgba(0,0,0,0.06)' }}
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border-light)',
                borderRadius: 16,
                padding: '3vh 2vw',
                width: '100%',
                boxShadow: '0 15px 30px rgba(0,0,0,0.04)',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignSelf: 'start'
              }}
            >
              <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', width: 3, height: 16, background: step.accent ? ACCENT : 'var(--color-border-medium)' }} />
              <div style={{ fontSize: 'min(2vh, 18px)', fontWeight: W.black, color: step.accent ? ACCENT : TEXT_PRIMARY, letterSpacing: LS.snug, marginBottom: '0.8vh', textTransform: 'uppercase' }}>{step.inf.title}</div>
              <div style={{ fontSize: 'min(1.7vh, 15px)', color: TEXT_DIM, lineHeight: 1.5, fontWeight: W.medium }}>{step.inf.line}</div>
            </motion.div>

          </div>
        ))}
      </div>
    </div>
  );
}

function QatCard({ pct, title, line, roadmap }) {
  return (
    <motion.div 
      whileHover={{ y: -4, borderColor: 'var(--color-border-medium)', boxShadow: '0 15px 30px rgba(0,0,0,0.06)' }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '2.5vh 2vw',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 16,
        display: 'flex',
        gap: '1.5vw',
        alignItems: 'center',
        boxShadow: '0 5px 15px rgba(0,0,0,0.02)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: ACCENT,
      }} />
      <div style={{ fontSize: 'min(4.5vh, 42px)', fontWeight: W.black, color: ACCENT, letterSpacing: LS.tight, lineHeight: 1, flex: '0 0 auto' }}>{pct}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6vh' }}>
        <div style={{ fontSize: T.micro + 2, letterSpacing: LS.wider, fontWeight: W.black, color: TEXT_PRIMARY, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ fontSize: 'min(1.5vh, 13px)', color: TEXT_DIM, lineHeight: 1.5, fontWeight: W.medium }}>{line}</div>
        {roadmap && <div style={{ fontSize: 'min(1.3vh, 11px)', color: ACCENT, fontWeight: W.bold, marginTop: '0.3vh', letterSpacing: LS.wide }}>{roadmap}</div>}
      </div>
    </motion.div>
  );
}

/* QatarisationCurve — Year-by-year ascent 30% → 50% over 5 years.
   Smooth SVG curve, dot per year, annotated. */
function QatarisationCurve() {
  const W_BOX = 850;
  const H_BOX = 160;
  const padL = 40;
  const padR = 30;
  const padT = 20;
  const padB = 30;
  const years = [
    { label: 'Y1', pct: 30 },
    { label: 'Y2', pct: 35 },
    { label: 'Y3', pct: 40 },
    { label: 'Y4', pct: 45 },
    { label: 'Y5', pct: 50 },
  ];
  const minPct = 25;
  const maxPct = 55;
  const x = (i) => padL + (i * (W_BOX - padL - padR)) / (years.length - 1);
  const y = (pct) =>
    H_BOX - padB - ((pct - minPct) / (maxPct - minPct)) * (H_BOX - padT - padB);

  // Smooth curve via cubic Bezier
  const pts = years.map((yr, i) => ({ x: x(i), y: y(yr.pct), pct: yr.pct, label: yr.label }));
  let path = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i];
    const p1 = pts[i + 1];
    const dx = (p1.x - p0.x) * 0.5;
    path += ` C ${p0.x + dx} ${p0.y}, ${p1.x - dx} ${p1.y}, ${p1.x} ${p1.y}`;
  }

  return (
    <motion.div 
      whileHover={{ borderColor: 'var(--color-border-medium)', boxShadow: '0 15px 30px rgba(0,0,0,0.04)' }}
      transition={{ duration: 0.3 }}
      style={{
        padding: '2vh 2vw',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: 16,
        boxShadow: '0 5px 15px rgba(0,0,0,0.02)',
        position: 'relative',
        width: '100%',
      }}
    >
      <div style={{ fontSize: T.micro, fontWeight: W.heavy, letterSpacing: LS.widest, color: TEXT_FAINT, marginBottom: '2vh', textTransform: 'uppercase' }}>TRAJECTORY · YEAR 1 → YEAR 5</div>
      <svg
        viewBox={`0 0 ${W_BOX} ${H_BOX}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Y-axis grid (30, 40, 50) */}
        {[30, 40, 50].map((v) => {
          const yy = y(v);
          return (
            <g key={`g-${v}`}>
              <line
                x1={padL}
                x2={W_BOX - padR}
                y1={yy}
                y2={yy}
                stroke="var(--color-border-light)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <text
                x={padL - 10}
                y={yy + 4}
                textAnchor="end"
                fill="var(--color-text-muted)"
                fontSize="11"
                fontWeight="700"
                style={{ fontFamily: FONT_STACK }}
              >
                {v}%
              </text>
            </g>
          );
        })}
        {/* Area under curve */}
        <motion.path
          d={`${path} L ${pts[pts.length - 1].x} ${H_BOX - padB} L ${pts[0].x} ${H_BOX - padB} Z`}
          fill="url(#curve-gradient)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        />
        <defs>
          <linearGradient id="curve-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="rgba(190, 18, 60, 0.2)" />
            <stop offset="100%" stopColor="rgba(190, 18, 60, 0)" />
          </linearGradient>
        </defs>
        {/* Curve */}
        <motion.path 
          d={path} 
          stroke={ACCENT} 
          strokeWidth="3" 
          fill="none" 
          strokeLinecap="round" 
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
        />
        {/* Year markers */}
        {pts.map((p, i) => (
          <motion.g 
            key={`pt-${i}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + i * 0.15, duration: 0.4, type: "spring" }}
            style={{ transformOrigin: `${p.x}px ${p.y}px` }}
          >
            <circle cx={p.x} cy={p.y} r="6" fill="var(--color-surface)" stroke={ACCENT} strokeWidth="2.5" />
            {(i === 0 || i === pts.length - 1) && (
              <text
                x={p.x}
                y={p.y - 16}
                textAnchor="middle"
                fill={TEXT_PRIMARY}
                fontSize="13"
                fontWeight="900"
                style={{ fontFamily: FONT_STACK }}
              >
                {p.pct}%
              </text>
            )}
            <text
              x={p.x}
              y={H_BOX - 5}
              textAnchor="middle"
              fill={TEXT_PRIMARY}
              fontSize="12"
              fontWeight="800"
              letterSpacing="1"
              style={{ fontFamily: FONT_STACK }}
            >
              {p.label}
            </text>
          </motion.g>
        ))}
      </svg>
    </motion.div>
  );
}

function GovRow({ label, value }) {
  return (
    <motion.div 
      whileHover={{ x: 5, backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-border-medium)', boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
      transition={{ duration: 0.2 }}
      style={{
        display: 'grid',
        gridTemplateColumns: '160px 1fr',
        gap: '2vw',
        padding: '2.5vh 2vw',
        background: 'var(--color-surface)',
        border: `1px solid var(--color-border-light)`,
        alignItems: 'center',
        borderRadius: 12,
        marginBottom: '1vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '4px',
        height: '100%',
        background: ACCENT,
      }} />
      <div style={{ fontSize: T.micro + 1, letterSpacing: LS.widest, fontWeight: W.heavy, color: ACCENT, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 'min(1.8vh, 16px)', fontWeight: W.medium, color: TEXT_PRIMARY, lineHeight: 1.5 }}>{value}</div>
    </motion.div>
  );
}

function VisionCard({ label, value, bgImage, isMain, period }) {
  return (
    <div
      style={{
        position: 'relative',
        borderRadius: 6,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: isMain ? '4vh 2.5vw' : '2.5vh 2.5vw',
        border: isMain ? `1px solid ${ACCENT}` : `1px solid rgba(255,255,255,0.08)`,
        transform: isMain ? 'translateX(-2vw)' : 'none',
        boxShadow: isMain ? '0 20px 40px rgba(0,0,0,0.5)' : 'none',
        width: isMain ? '106%' : '100%',
        backgroundColor: 'var(--color-gray-900)',
      }}
    >
      {/* Background Image */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: isMain ? 'grayscale(0) brightness(0.6)' : 'grayscale(1) brightness(0.35)',
          zIndex: 0,
        }}
      />
      {/* Gradient Overlay for text readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: isMain
            ? 'linear-gradient(90deg, rgba(190,18,60,0.85) 0%, rgba(0,0,0,0.3) 100%)'
            : 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)',
          zIndex: 1,
        }}
      />

      {/* Content (Left) */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', gap: '0.8vh' }}>
        <div style={{ fontSize: T.micro, letterSpacing: LS.widest, fontWeight: W.heavy, color: isMain ? '#fff' : TEXT_FAINT }}>
          {label}
        </div>
        <div style={{ fontSize: isMain ? 'min(4vh, 32px)' : 'min(3vh, 24px)', fontWeight: W.black, letterSpacing: LS.snug, color: '#fff' }}>
          {value}
        </div>
      </div>

      {/* Vertical Timeline Label (Right) */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          fontSize: T.micro,
          letterSpacing: LS.widest,
          fontWeight: W.bold,
          color: isMain ? '#fff' : TEXT_DIM,
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          opacity: 0.8,
        }}
      >
        {period}
      </div>
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
    color: TEXT_PRIMARY,
    background: 'linear-gradient(135deg, var(--color-surface) 0%, var(--color-bg-main) 100%)',
    fontFamily: FONT_STACK,
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
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
  splitLayout: {
    display: 'flex',
    width: '100%',
    height: '100%',
    position: 'relative',
    zIndex: 2,
  },

  /* Section header (top of every content slide) */
  sectionHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: L.headerHeight,
    padding: `0 ${L.padX}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 60,
    pointerEvents: 'none',
    background: 'transparent',
  },
  sectionHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  sectionNumber: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.wider,
    fontVariantNumeric: 'tabular-nums',
  },
  sectionDivider: {
    fontSize: T.micro,
    opacity: 0.4,
  },
  sectionTitle: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.widest,
    textTransform: 'uppercase',
  },
  sectionHeaderRight: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: TEXT_FAINT,
    textTransform: 'uppercase',
  },
  splitTextLeft: {
    flex: '0 0 55%',
    padding: L.splitPadL,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 3,
  },
  splitTextRight: {
    flex: '0 0 55%',
    padding: L.splitPadR,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    position: 'relative',
    zIndex: 3,
  },
  splitImage: {
    flex: '0 0 45%',
    position: 'relative',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    zIndex: 1,
  },

  eyebrow: {
    fontSize: T.eyebrow,
    letterSpacing: LS.extraWide,
    fontWeight: W.heavy,
    color: ACCENT,
    textTransform: 'uppercase',
    marginBottom: L.marginEyebrow,
  },
  h2: {
    fontSize: T.h2,
    fontWeight: W.black,
    lineHeight: 1.1,
    letterSpacing: LS.tight,
    margin: 0,
    color: TEXT_PRIMARY,
  },
  h3: {
    fontSize: T.h3,
    fontWeight: W.heavy,
    lineHeight: 1.15,
    letterSpacing: LS.snug,
    margin: 0,
    color: TEXT_PRIMARY,
  },
  lead: {
    fontSize: T.lead,
    lineHeight: 1.5,
    color: TEXT_DIM,
    marginTop: '3vh',
    fontWeight: W.regular,
    margin: '3vh 0 0',
  },
  body: {
    fontSize: T.body,
    lineHeight: 1.55,
    color: TEXT_DIM,
    fontWeight: W.regular,
    margin: 0,
  },
  caption: {
    fontSize: T.caption,
    lineHeight: 1.5,
    color: TEXT_DIM,
    fontWeight: W.medium,
    margin: 0,
  },

  /* Closing typography */
  closingStage: {
    position: 'relative',
    zIndex: 2,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: `0 ${L.padX} 80px`,
    textAlign: 'center',
  },
  h2Closing: {
    fontSize: T.h2Closing,
    fontWeight: W.black,
    lineHeight: 0.95,
    letterSpacing: LS.tight,
    maxWidth: 1100,
    margin: 0,
    color: TEXT_PRIMARY,
  },
  closingItalic: {
    marginTop: '4vh',
    fontSize: T.lead,
    fontStyle: 'italic',
    color: TEXT_DIM,
    maxWidth: 820,
    lineHeight: 1.5,
    fontWeight: W.regular,
  },
  closingSeal: {
    marginTop: '6vh',
    padding: '20px 36px',
    border: `1px solid ${ACCENT}`,
    borderRadius: 4,
    fontSize: T.caption,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
  },
  closingDate: {
    marginTop: '3vh',
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.bold,
    color: ACCENT,
    textTransform: 'uppercase',
  },

  /* Cover */
  topBar: {
    position: 'absolute',
    top: '5vh',
    left: 0,
    right: 0,
    padding: `0 ${L.padX}`,
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  bottomBar: {
    position: 'absolute',
    bottom: '5vh',
    left: 0,
    right: 0,
    padding: `0 ${L.padX}`,
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  micro: {
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.bold,
    color: TEXT_FAINT,
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
    padding: `0 ${L.padX}`,
  },
  coverEyebrow: {
    fontSize: T.eyebrow,
    letterSpacing: LS.ultraWide,
    fontWeight: W.heavy,
    color: ACCENT,
    marginBottom: 28,
    textTransform: 'uppercase',
  },
  coverTitle: {
    fontSize: T.h1,
    fontWeight: W.black,
    lineHeight: 0.85,
    letterSpacing: LS.display,
    margin: 0,
    color: TEXT_PRIMARY,
  },
  coverDivider: {
    width: 80,
    height: 3,
    background: ACCENT,
    margin: '4vh 0 3vh',
  },
  coverSubtitle: {
    fontSize: T.subtitle,
    lineHeight: 1.6,
    color: TEXT_DIM,
    fontWeight: W.regular,
    maxWidth: 600,
  },

  /* Pillars */
  threeCol: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: L.gapGrid,
  },
  pillar: {
    paddingTop: 24,
    borderTop: `1px solid ${BORDER_LIGHT}`,
  },
  pillarLabel: {
    fontSize: T.micro + 1,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: TEXT_FAINT,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  pillarValue: {
    fontSize: T.statS,
    fontWeight: W.black,
    letterSpacing: LS.snug,
    lineHeight: 1,
    marginBottom: '1.5vh',
  },
  pillarNote: {
    fontSize: 'min(1.6vh, 13px)',
    color: TEXT_DIM,
    lineHeight: 1.5,
    fontWeight: W.regular,
  },

  /* Who we are stats */
  whoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: L.gapGrid,
  },
  whoStat: {
    padding: '2vh 1.5vw',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    display: 'flex',
    flexDirection: 'column',
  },
  whoStatValue: {
    fontSize: T.statM,
    fontWeight: W.black,
    color: TEXT_PRIMARY,
    letterSpacing: LS.tight,
    lineHeight: 1,
    marginBottom: '1vh',
  },
  whoStatLabel: {
    fontSize: T.micro + 2,
    color: TEXT_DIM,
    fontWeight: W.semibold,
    letterSpacing: LS.wide,
    textTransform: 'uppercase',
    lineHeight: 1.4,
  },
  whoStatLocation: {
    marginTop: '0.6vh',
    fontSize: T.micro,
    color: ACCENT,
    fontWeight: W.heavy,
    letterSpacing: LS.widest,
    textTransform: 'uppercase',
  },

  /* Champion strip */
  championStrip: {
    marginTop: L.marginSection,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '2vw',
    paddingTop: '2vh',
    borderTop: `1px solid var(--color-border-light)`,
  },
  championItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1vh',
  },
  championLabel: {
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: TEXT_FAINT,
    textTransform: 'uppercase',
  },
  championValue: {
    fontSize: T.statXS,
    fontWeight: W.black,
    letterSpacing: LS.snug,
    color: ACCENT,
    lineHeight: 1,
  },
  championDot: {
    fontSize: T.statXS,
    color: 'var(--color-gray-300)',
    paddingBottom: '0.5vh',
  },

  /* Architecture grid */
  archGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2.5vh 2vw',
    maxWidth: 920,
    marginTop: '3.5vh',
  },
  archCard: {
    padding: '2vh 1.5vw',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  archIcon: {
    color: ACCENT,
    marginBottom: '1vh',
    display: 'flex',
    alignItems: 'center',
  },
  archTitle: {
    fontSize: T.micro + 2,
    letterSpacing: LS.wider,
    fontWeight: W.heavy,
    color: TEXT_PRIMARY,
    marginBottom: '0.6vh',
    textTransform: 'uppercase',
  },
  archLine: {
    fontSize: 'clamp(10px, 1.4vh, 14px)',
    color: TEXT_DIM,
    lineHeight: 1.5,
    fontWeight: W.medium,
  },

  /* Callout */
  callout: {
    padding: '2vh 0 2vh 2vw',
    borderLeft: `3px solid ${ACCENT}`,
    marginTop: L.marginSection,
  },
  calloutText: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
  },

  /* Stack grid */
  stackGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: L.gapGrid,
    marginTop: L.marginSection,
  },
  stackCard: {
    padding: '2vh 0',
    borderTop: `1px solid ${BORDER_LIGHT}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5vh',
  },
  stackRole: {
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  stackName: {
    fontSize: 'min(2.5vh, 22px)',
    fontWeight: W.black,
    color: TEXT_PRIMARY,
    marginBottom: '0.5vh',
    letterSpacing: LS.hairline,
  },
  stackLine: {
    fontSize: 'min(1.5vh, 14px)',
    color: TEXT_DIM,
    fontWeight: W.semibold,
  },
  stackLineDim: {
    fontSize: 'min(1.4vh, 12px)',
    color: TEXT_DIM,
    fontWeight: W.regular,
  },

  /* Big stats */
  bigStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2vh 1.5vw',
    marginTop: '3.5vh',
  },
  bigStat: {
    padding: '2vh 1.5vw',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  bigStatValue: {
    fontSize: T.statM,
    fontWeight: W.black,
    color: TEXT_PRIMARY,
    letterSpacing: LS.tight,
    lineHeight: 1,
    marginBottom: '1vh',
    whiteSpace: 'nowrap',
  },
  bigStatLabel: {
    fontSize: T.micro + 2,
    color: TEXT_DIM,
    fontWeight: W.medium,
    lineHeight: 1.4,
    letterSpacing: LS.normal,
    textTransform: 'uppercase',
  },
  /* Alignment Vision 2030 */
  alignGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: L.gapGrid,
    marginTop: L.marginSection,
  },
  alignCard: {
    padding: '2vh 0',
    borderTop: `1px solid ${BORDER_LIGHT}`,
  },
  alignPillar: {
    fontSize: T.micro + 2,
    letterSpacing: LS.wider,
    fontWeight: W.heavy,
    color: ACCENT,
    marginBottom: '1.5vh',
    textTransform: 'uppercase',
  },
  alignLine: {
    fontSize: 'min(1.6vh, 14px)',
    color: TEXT_DIM,
    lineHeight: 1.55,
    fontWeight: W.regular,
  },

  /* Team grid (S02) */
  teamGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: L.gapGrid,
    marginTop: L.marginSection,
  },
  teamCard: {
    padding: '2vh 1.5vw',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6vh',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  teamRole: {
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  teamName: {
    fontSize: 'min(2.4vh, 20px)',
    fontWeight: W.black,
    color: TEXT_PRIMARY,
    letterSpacing: LS.hairline,
  },
  teamLine: {
    fontSize: 'min(1.5vh, 13px)',
    color: TEXT_DIM,
    fontWeight: W.medium,
    lineHeight: 1.5,
  },

  /* Monaco grid (S05) */
  monacoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: L.gapGrid,
    maxWidth: 1200,
  },
  monacoCard: {
    paddingTop: '2vh',
    borderTop: `2px solid ${ACCENT}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '1vh',
  },
  monacoTag: {
    fontSize: T.micro + 1,
    letterSpacing: LS.widest,
    fontWeight: W.black,
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
  },
  monacoLine: {
    fontSize: 'min(1.6vh, 14px)',
    color: TEXT_DIM,
    fontWeight: W.medium,
    lineHeight: 1.55,
  },

  /* Monaco radial diagram (S04) */
  radialWrap: {
    position: 'relative',
    flex: 1,
    width: '100%',
    minHeight: 'min(54vh, 540px)',
    marginTop: '2vh',
  },
  radialTag: {
    fontSize: T.micro + 1,
    fontWeight: W.black,
    letterSpacing: LS.widest,
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
    marginBottom: '0.4vh',
  },
  radialLine: {
    fontSize: T.caption,
    fontWeight: W.medium,
    color: TEXT_DIM,
    lineHeight: 1.4,
  },

  /* Method timeline (S06) */
  timeline: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2.5vw',
    marginTop: L.marginSection,
    paddingTop: '2vh',
  },
  timelineRail: {
    position: 'absolute',
    top: 'calc(2vh + 6px)',
    left: '4%',
    right: '4%',
    height: 1,
    background: BORDER_MEDIUM,
    zIndex: 0,
  },
  phaseStep: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.4vh',
    paddingTop: 0,
    zIndex: 1,
  },
  phaseDot: {
    width: 13,
    height: 13,
    borderRadius: '50%',
    background: SURFACE,
    border: `2px solid ${TEXT_PRIMARY}`,
    marginBottom: '1.5vh',
  },
  phaseDotAccent: {
    background: ACCENT,
    borderColor: ACCENT,
  },
  phaseStamp: {
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  phaseStepTitle: {
    fontSize: 'min(2.6vh, 22px)',
    fontWeight: W.black,
    letterSpacing: LS.hairline,
  },
  phaseStepLine: {
    fontSize: 'min(1.5vh, 13px)',
    color: TEXT_DIM,
    fontWeight: W.medium,
    lineHeight: 1.55,
    maxWidth: 280,
  },

  /* DualRail (S06) — two parallel timelines */
  dualRailWrap: {
    marginTop: '4vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '2vh',
  },
  railRow: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    alignItems: 'flex-start',
    gap: '2vw',
  },
  railLabel: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.widest,
    color: ACCENT,
    textTransform: 'uppercase',
    paddingTop: '2vh',
    minHeight: 24,
  },
  railTrack: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5vw',
    paddingTop: '2.4vh',
  },
  railLine: {
    position: 'absolute',
    top: 'calc(2.4vh + 5px)',
    left: '4%',
    right: '4%',
    height: 1,
    background: BORDER_MEDIUM,
    zIndex: 0,
  },
  railStep: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6vh',
    zIndex: 1,
  },
  railDot: {
    width: 11,
    height: 11,
    borderRadius: '50%',
    background: SURFACE,
    border: `2px solid ${TEXT_PRIMARY}`,
    marginBottom: '0.8vh',
  },
  railDotAccent: {
    background: ACCENT,
    borderColor: ACCENT,
  },
  railStepTitle: {
    fontSize: 'min(1.7vh, 15px)',
    fontWeight: W.black,
    letterSpacing: LS.snug,
    lineHeight: 1.1,
  },
  railStepLine: {
    fontSize: 'min(1.4vh, 12px)',
    color: TEXT_DIM,
    fontWeight: W.medium,
    lineHeight: 1.4,
    maxWidth: 220,
  },
  railStamps: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '1.5vw',
    padding: '0.6vh 0',
    borderTop: `1px solid ${BORDER_LIGHT}`,
    borderBottom: `1px solid ${BORDER_LIGHT}`,
  },
  railStamp: {
    fontSize: T.micro + 1,
    fontWeight: W.heavy,
    letterSpacing: LS.widest,
    color: ACCENT,
    fontVariantNumeric: 'tabular-nums',
    textAlign: 'left',
  },

  /* Qatarisation grid (S07) */
  qatGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: L.gapGrid,
    marginTop: L.marginSection,
    maxWidth: 920,
  },
  qatCard: {
    padding: '2vh 1.5vw',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    display: 'flex',
    gap: '1.5vw',
    alignItems: 'flex-start',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  qatPct: {
    fontSize: T.statS,
    fontWeight: W.black,
    color: ACCENT,
    letterSpacing: LS.tight,
    lineHeight: 1,
    flex: '0 0 auto',
  },
  qatBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6vh',
  },
  qatTitle: {
    fontSize: T.micro + 1,
    letterSpacing: LS.wider,
    fontWeight: W.black,
    color: TEXT_PRIMARY,
    textTransform: 'uppercase',
  },
  qatLine: {
    fontSize: 'min(1.5vh, 13px)',
    color: TEXT_DIM,
    lineHeight: 1.55,
    fontWeight: W.medium,
  },
  qatRoadmap: {
    fontSize: 'min(1.4vh, 12px)',
    color: ACCENT,
    fontWeight: W.bold,
    fontStyle: 'italic',
    marginTop: '0.4vh',
  },
  qatCurveWrap: {
    marginTop: '3vh',
    paddingTop: '2vh',
    borderTop: `1px solid ${BORDER_LIGHT}`,
    maxWidth: 600,
  },
  qatCurveLabel: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.widest,
    color: ACCENT,
    textTransform: 'uppercase',
    marginBottom: '1vh',
  },

  /* Governance grid (S08) */
  govGrid: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: L.marginSection,
    maxWidth: 920,
  },
  govRow: {
    display: 'grid',
    gridTemplateColumns: '180px 1fr',
    gap: '2vw',
    padding: '1.6vh 1.5vw',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8,
    alignItems: 'baseline',
    marginBottom: '1vh',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
  },
  govLabel: {
    fontSize: T.micro,
    letterSpacing: LS.widest,
    fontWeight: W.heavy,
    color: ACCENT,
    textTransform: 'uppercase',
  },
  govValue: {
    fontSize: 'min(1.7vh, 15px)',
    color: TEXT_PRIMARY,
    fontWeight: W.medium,
    lineHeight: 1.45,
  },
};
