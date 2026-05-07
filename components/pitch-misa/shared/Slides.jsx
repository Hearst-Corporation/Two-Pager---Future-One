'use client';

/* ============================================================
   FUTUR ONE × MISA — PILLAR DECK SLIDES
   ------------------------------------------------------------
   10-slide skeleton, driven by `pillar` prop (see pillars.js).
   Same skeleton for DC / Mining / Hub — only content changes.
   Reuses tokens from /pitch (single design system family).
   ============================================================ */

import { motion } from 'framer-motion';
import {
  FONT_STACK,
  TEXT_PRIMARY,
  TEXT_DIM,
  TEXT_FAINT,
  TEXT_INVERSE,
  SURFACE,
  BORDER_LIGHT,
  ACCENT_BG_05,
  ACCENT_BG_15,
  ACCENT_BORDER_1PX_40,
  INVERSE_85,
  INVERSE_70,
  INVERSE_55,
  INVERSE_40,
  BORDER_INVERSE_8,
  BORDER_INVERSE_12,
  BORDER_INVERSE_15,
  BORDER_INVERSE_20,
  PANEL_DARK_85,
  TEXT_SHADOW_CONFIDENTIAL,
  T,
  W,
  LS,
  L,
} from '../../pitch/tokens';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

/* ============================================================ */
/* SLIDE 00 — COVER                                              */
/* ============================================================ */
export function S00Cover({ pillar }) {
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
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 30%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 45%, color-mix(in srgb, var(--color-bg-main) 20%, transparent) 55%, transparent 70%)',
        }}
      />

      <div style={S.topBar}>
        <div style={S.micro}>FUTUR ONE × MISA</div>
        <div style={{ ...S.micro, color: INVERSE_85, textShadow: TEXT_SHADOW_CONFIDENTIAL }}>
          STRICTLY CONFIDENTIAL
        </div>
      </div>

      <div style={{ ...S.coverCenter, width: '60%' }}>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
          style={S.coverEyebrow}
        >
          {pillar.cover.eyebrow}
        </motion.div>
        <motion.h1
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
          style={S.coverTitle}
        >
          {pillar.cover.title.split('\n').map((line, i) => (
            <span key={i} style={{ display: 'block' }}>
              {line}
            </span>
          ))}
        </motion.h1>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={2}
          style={S.coverDivider}
        />
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={3}
          style={S.coverSubtitle}
        >
          {pillar.cover.subtitle}
          <br />
          <span style={{ marginTop: 18, display: 'inline-block', color: TEXT_DIM, fontSize: T.body }}>
            Presented to the <span style={{ color: TEXT_PRIMARY, fontWeight: W.bold }}>Saudi Ministry of Investment</span> · MISA
          </span>
        </motion.div>
      </div>

      <div style={S.coverPillarBadge}>
        <span style={S.coverPillarCode}>{pillar.code}</span>
        <span style={S.coverPillarLabel}>{pillar.label}</span>
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 01 — THE PILLAR                                         */
/* ============================================================ */
export function S01Pillar({ pillar }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="01" label="THE PILLAR" />

      <div style={S.centerWrap}>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
          style={S.pillarBigCode}
        >
          PILLAR {pillar.code}
        </motion.div>
        <motion.h2
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
          style={S.pillarBigTitle}
        >
          {pillar.label}.
        </motion.h2>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={2}
          style={{ height: 1, width: 80, background: 'var(--color-accent-strong)', margin: '24px 0 28px' }}
        />
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={3}
          style={S.pillarLead}
        >
          {pillar.cover.subtitle}
        </motion.p>
      </div>

      <SlideFooter pillar={pillar} step={1} total={10} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 02 — MARKET THESIS                                      */
/* ============================================================ */
export function S02Thesis({ pillar }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="02" label="MARKET THESIS" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.thesis.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.thesis.title}
          </motion.h2>
        </div>
        <div style={S.splitR}>
          {pillar.thesis.bullets.map((b, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2 + i}
              style={S.bulletRow}
            >
              <span style={S.bulletNum}>{String(i + 1).padStart(2, '0')}</span>
              <span style={S.bulletText}>{b}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={2} total={10} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 03 — THE OPERATOR STACK                                 */
/* ============================================================ */
export function S03Operators({ pillar }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-gray-900)', color: TEXT_INVERSE }}>
      <SlideHeader pillar={pillar} num="03" label="THE OPERATOR STACK" inverse />

      <div style={{ ...S.contentWrap, paddingTop: '12vh' }}>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={{ ...S.eyebrow, color: 'var(--color-accent-strong)' }}>
          {pillar.operatorsHeader.eyebrow}
        </motion.div>
        <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={{ ...S.h2, color: TEXT_INVERSE, fontStyle: 'italic' }}>
          {pillar.operatorsHeader.title}
        </motion.h2>
        <motion.p initial="hidden" animate="show" variants={fadeUp} custom={2} style={{ ...S.lead, color: INVERSE_70, maxWidth: 760, marginTop: 18 }}>
          {pillar.operatorsHeader.subtitle}
        </motion.p>

        <div style={S.opGrid}>
          {pillar.operators.map((op, i) => (
            <motion.div
              key={op.name}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3 + i}
              style={S.opCardCompact}
            >
              <div style={S.opRank}>{op.rank}</div>
              <div style={S.opName}>{op.name}</div>
              <div style={S.opCountry}>{op.country}</div>
              <div style={S.opRoleTag}>{op.role}</div>
              <div style={S.opLine} />
              <div style={S.opOneLiner}>{op.oneLiner}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={3} total={10} inverse />
    </div>
  );
}

/* ============================================================ */
/* SLIDES 04 / 05 / 06 — OPERATOR DEEP-DIVE                      */
/* ============================================================ */
export function OperatorDeepDive({ pillar, idx, step }) {
  const op = pillar.operators[idx];
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num={String(step).padStart(2, '0')} label={`OPERATOR ${idx + 1} OF 3`} />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.opDeepRank}>
            {op.rank}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.opDeepName}>
            {op.name}
          </motion.h2>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2} style={S.opDeepCountry}>
            {op.country} · <span style={{ color: 'var(--color-accent-strong)' }}>{op.role}</span>
          </motion.div>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3} style={{ height: 1, width: 80, background: 'var(--color-accent-strong)', margin: '24px 0 28px' }} />
          <motion.p initial="hidden" animate="show" variants={fadeUp} custom={4} style={S.opDeepOneLiner}>
            {op.oneLiner}
          </motion.p>

          <div style={S.opDeepWhyBlock}>
            <div style={S.opDeepWhyLabel}>WHY THIS OPERATOR</div>
            {op.why.map((w, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={5 + i}
                style={S.opDeepWhyRow}
              >
                <span style={S.opDeepWhyDot} />
                <span style={S.opDeepWhyText}>{w}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div style={S.splitR}>
          <div style={S.opDeepKpiGrid}>
            {op.kpis.map((k, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={3 + i}
                style={S.opDeepKpi}
              >
                <div style={S.opDeepKpiV}>{k.v}</div>
                <div style={S.opDeepKpiL}>{k.l}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <SlideFooter pillar={pillar} step={step} total={10} />
    </div>
  );
}

export const S04Operator1 = ({ pillar }) => <OperatorDeepDive pillar={pillar} idx={0} step={4} />;
export const S05Operator2 = ({ pillar }) => <OperatorDeepDive pillar={pillar} idx={1} step={5} />;
export const S06Operator3 = ({ pillar }) => <OperatorDeepDive pillar={pillar} idx={2} step={6} />;

/* ============================================================ */
/* SLIDE 07 — INTEGRATION ARCHITECTURE                           */
/* ============================================================ */
export function S07Architecture({ pillar }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="07" label="INTEGRATION" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.architecture.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.architecture.title}
          </motion.h2>
        </div>
        <div style={S.splitR}>
          {pillar.architecture.lines.map((row, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2 + i}
              style={S.archRow}
            >
              <div style={S.archTag}>{row.tag}</div>
              <div style={S.archBody}>{row.body}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={7} total={10} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 08 — COMMERCIAL ENVELOPE                                */
/* ============================================================ */
export function S08Commercials({ pillar }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="08" label="COMMERCIALS" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.commercials.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.commercials.title}
          </motion.h2>
          <motion.p initial="hidden" animate="show" variants={fadeUp} custom={2} style={{ ...S.lead, marginTop: 18, color: TEXT_DIM, maxWidth: 480 }}>
            Indicative ranges — to be hardened in due diligence with operator co-investors and MISA advisors.
          </motion.p>
        </div>
        <div style={S.splitR}>
          <div style={S.commTable}>
            {pillar.commercials.rows.map((r, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={2 + i}
                style={S.commRow}
              >
                <div style={S.commLabel}>{r.l}</div>
                <div style={S.commValue}>{r.v}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <SlideFooter pillar={pillar} step={8} total={10} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 09 — THE ASK                                            */
/* ============================================================ */
export function S09Ask({ pillar }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-gray-900)', color: TEXT_INVERSE }}>
      <SlideHeader pillar={pillar} num="09" label="THE ASK" inverse />

      <div style={{ ...S.centerWrap, alignItems: 'flex-start', maxWidth: 1100, padding: '0 8vw' }}>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={{ ...S.eyebrow, color: 'var(--color-accent-strong)' }}>
          {pillar.ask.eyebrow}
        </motion.div>
        <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={{ ...S.h2, color: TEXT_INVERSE, fontStyle: 'italic', maxWidth: 900 }}>
          {pillar.ask.title}
        </motion.h2>

        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2} style={S.askBlock}>
          <div style={S.askLabel}>WE ASK</div>
          <div style={S.askText}>{pillar.ask.ask}</div>
        </motion.div>

        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3} style={{ ...S.askBlock, marginTop: 28 }}>
          <div style={S.askLabel}>WE OFFER</div>
          <div style={S.askText}>{pillar.ask.offer}</div>
        </motion.div>
      </div>

      <SlideFooter pillar={pillar} step={9} total={10} inverse />
    </div>
  );
}

/* ============================================================ */
/* SHARED HEADER / FOOTER                                        */
/* ============================================================ */
function SlideHeader({ pillar, num, label, inverse }) {
  const color = inverse ? INVERSE_70 : TEXT_FAINT;
  const accent = 'var(--color-accent-strong)';
  return (
    <div style={S.slideHeader}>
      <div style={{ ...S.headerL, color }}>
        <span style={{ color: accent, fontWeight: W.heavy }}>FUTUR ONE</span>
        <span style={{ margin: '0 12px', opacity: 0.5 }}>·</span>
        <span>PILLAR {pillar.code} — {pillar.label}</span>
      </div>
      <div style={{ ...S.headerR, color }}>
        <span style={{ fontFamily: 'monospace' }}>{num}</span>
        <span style={{ margin: '0 10px', opacity: 0.5 }}>·</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

function SlideFooter({ pillar, step, total, inverse }) {
  const color = inverse ? INVERSE_55 : TEXT_FAINT;
  return (
    <div style={S.slideFooterMicro}>
      <div style={{ color, fontSize: 10, letterSpacing: 2, fontWeight: W.bold }}>
        PRESENTED TO MISA · STRICTLY CONFIDENTIAL
      </div>
      <div style={{ color, fontSize: 10, letterSpacing: 2, fontFamily: 'monospace', fontVariantNumeric: 'tabular-nums' }}>
        {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </div>
  );
}

/* ============================================================ */
/* STYLES                                                        */
/* ============================================================ */
const S = {
  slide: {
    width: '100%',
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: FONT_STACK,
    color: TEXT_PRIMARY,
    background: 'var(--color-bg-main)',
  },
  bg: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center right',
    backgroundRepeat: 'no-repeat',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
  },
  topBar: {
    position: 'absolute',
    top: 32,
    left: '8vw',
    right: '8vw',
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 5,
  },
  micro: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: TEXT_FAINT,
  },

  /* Slide header / footer (non-cover) */
  slideHeader: {
    position: 'absolute',
    top: 32,
    left: '8vw',
    right: '8vw',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  headerL: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
  },
  headerR: {
    fontSize: T.micro,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
  },
  slideFooterMicro: {
    position: 'absolute',
    bottom: 96,
    left: '8vw',
    right: '8vw',
    display: 'flex',
    justifyContent: 'space-between',
    zIndex: 4,
  },

  /* Cover */
  coverCenter: {
    position: 'absolute',
    top: '50%',
    left: '8vw',
    transform: 'translateY(-50%)',
    zIndex: 4,
  },
  coverEyebrow: {
    fontSize: T.eyebrow,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 28,
  },
  coverTitle: {
    fontSize: T.h1,
    fontWeight: W.heavy,
    letterSpacing: LS.display,
    lineHeight: 0.92,
    margin: 0,
    color: TEXT_PRIMARY,
    fontStyle: 'italic',
  },
  coverDivider: {
    height: 2,
    width: 100,
    background: 'var(--color-accent-strong)',
    margin: '32px 0',
  },
  coverSubtitle: {
    fontSize: T.lead,
    fontWeight: W.medium,
    color: TEXT_DIM,
    maxWidth: 560,
    lineHeight: 1.5,
  },
  coverPillarBadge: {
    position: 'absolute',
    bottom: 96,
    right: '8vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    zIndex: 5,
  },
  coverPillarCode: {
    fontFamily: 'monospace',
    fontSize: 60,
    fontWeight: W.heavy,
    letterSpacing: -2,
    color: 'var(--color-accent-strong)',
    lineHeight: 1,
  },
  coverPillarLabel: {
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: TEXT_DIM,
  },

  /* Generic layout */
  centerWrap: {
    position: 'absolute',
    top: '50%',
    left: '8vw',
    right: '8vw',
    transform: 'translateY(-50%)',
    display: 'flex',
    flexDirection: 'column',
  },
  contentWrap: {
    position: 'relative',
    padding: '0 8vw',
    height: '100%',
    boxSizing: 'border-box',
  },
  split: {
    position: 'absolute',
    top: '12vh',
    bottom: '14vh',
    left: '8vw',
    right: '8vw',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6vw',
  },
  splitL: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  splitR: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  eyebrow: {
    fontSize: T.eyebrow,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 24,
  },
  h2: {
    fontSize: T.h2,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    lineHeight: 1.05,
    margin: 0,
    color: TEXT_PRIMARY,
  },
  lead: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_DIM,
  },

  /* Slide 01 — Pillar */
  pillarBigCode: {
    fontFamily: 'monospace',
    fontSize: T.body,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 16,
  },
  pillarBigTitle: {
    fontSize: T.h1,
    fontWeight: W.heavy,
    letterSpacing: LS.display,
    lineHeight: 0.92,
    margin: 0,
    color: TEXT_PRIMARY,
    fontStyle: 'italic',
  },
  pillarLead: {
    fontSize: T.h3,
    fontWeight: W.medium,
    lineHeight: 1.3,
    color: TEXT_DIM,
    maxWidth: 900,
  },

  /* Slide 02 — Bullets */
  bulletRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 20,
    padding: '18px 0',
    borderBottom: BORDER_LIGHT,
  },
  bulletNum: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: W.heavy,
    letterSpacing: LS.wide,
    color: 'var(--color-accent-strong)',
    minWidth: 32,
    paddingTop: 3,
  },
  bulletText: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.5,
    color: TEXT_PRIMARY,
  },

  /* Slide 03 — Operator stack grid */
  opGrid: {
    marginTop: '5vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
  },
  opCardCompact: {
    background: 'color-mix(in srgb, var(--color-text-inverse) 3%, transparent)',
    border: BORDER_INVERSE_12,
    padding: 28,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 280,
  },
  opRank: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 14,
  },
  opName: {
    fontSize: T.h3,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    lineHeight: 1.05,
    color: TEXT_INVERSE,
    marginBottom: 8,
  },
  opCountry: {
    fontSize: 11,
    fontWeight: W.semibold,
    letterSpacing: LS.wide,
    color: INVERSE_55,
    marginBottom: 14,
  },
  opRoleTag: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    padding: '6px 10px',
    background: ACCENT_BG_15,
    border: ACCENT_BORDER_1PX_40,
    fontSize: 10,
    fontWeight: W.heavy,
    letterSpacing: LS.wider,
    color: 'var(--color-accent-strong)',
    marginBottom: 18,
  },
  opLine: {
    height: 1,
    background: 'color-mix(in srgb, var(--color-text-inverse) 10%, transparent)',
    margin: '0 0 18px',
  },
  opOneLiner: {
    fontSize: 13,
    lineHeight: 1.55,
    color: INVERSE_70,
  },

  /* Operator deep-dive */
  opDeepRank: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 20,
  },
  opDeepName: {
    fontSize: T.h2,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    lineHeight: 1.02,
    margin: 0,
    color: TEXT_PRIMARY,
  },
  opDeepCountry: {
    fontSize: 12,
    fontWeight: W.bold,
    letterSpacing: LS.wide,
    color: TEXT_DIM,
    marginTop: 12,
  },
  opDeepOneLiner: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
    margin: 0,
    maxWidth: 540,
  },
  opDeepWhyBlock: {
    marginTop: 36,
    paddingTop: 24,
    borderTop: BORDER_LIGHT,
  },
  opDeepWhyLabel: {
    fontSize: T.eyebrow,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 18,
  },
  opDeepWhyRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '8px 0',
  },
  opDeepWhyDot: {
    width: 6,
    height: 6,
    background: 'var(--color-accent-strong)',
    marginTop: 8,
    flexShrink: 0,
  },
  opDeepWhyText: {
    fontSize: 14,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
    fontWeight: W.medium,
  },
  opDeepKpiGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 1,
    background: BORDER_LIGHT.split(' ')[2] ?? 'var(--color-border-medium)',
    border: BORDER_LIGHT,
  },
  opDeepKpi: {
    background: 'var(--color-bg-main)',
    padding: 32,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  opDeepKpiV: {
    fontSize: T.statS,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
  },
  opDeepKpiL: {
    fontSize: 10,
    fontWeight: W.heavy,
    letterSpacing: LS.wider,
    color: TEXT_FAINT,
  },

  /* Slide 07 — architecture rows */
  archRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
    padding: '22px 0',
    borderBottom: BORDER_LIGHT,
  },
  archTag: {
    minWidth: 140,
    fontSize: 12,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    paddingTop: 4,
  },
  archBody: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
  },

  /* Slide 08 — commercial table */
  commTable: {
    border: BORDER_LIGHT,
  },
  commRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: BORDER_LIGHT,
  },
  commLabel: {
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.wider,
    color: TEXT_FAINT,
  },
  commValue: {
    fontSize: T.h3,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    color: 'var(--color-accent-strong)',
    fontFamily: 'monospace',
  },

  /* Slide 09 — Ask */
  askBlock: {
    marginTop: 36,
    paddingLeft: 28,
    borderLeft: '2px solid var(--color-accent-strong)',
    maxWidth: 900,
  },
  askLabel: {
    fontSize: T.eyebrow,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 14,
  },
  askText: {
    fontSize: T.h3,
    fontWeight: W.semibold,
    lineHeight: 1.35,
    color: TEXT_INVERSE,
  },
};
