'use client';

/* ============================================================
   FUTUR ONE — OPERATOR DECK SLIDES
   ------------------------------------------------------------
   10-slide skeleton, driven by `pillar` prop.
   Audience: a Tier-1 operator. Never names competitors.
   The slot is open and exclusive.
   ============================================================ */

import { motion } from 'framer-motion';
import {
  FONT_STACK,
  TEXT_PRIMARY,
  TEXT_DIM,
  TEXT_FAINT,
  TEXT_INVERSE,
  BORDER_LIGHT,
  ACCENT_BG_15,
  ACCENT_BORDER_1PX_40,
  INVERSE_70,
  INVERSE_55,
  BORDER_INVERSE_12,
  TEXT_SHADOW_CONFIDENTIAL,
  T,
  W,
  LS,
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
        <span>{pillar.pillarShort.toUpperCase()}</span>
      </div>
      <div style={{ ...S.headerR, color }}>
        <span style={{ fontFamily: 'monospace' }}>{num}</span>
        <span style={{ margin: '0 10px', opacity: 0.5 }}>·</span>
        <span>{label}</span>
      </div>
    </div>
  );
}

function SlideFooter({ pillar, step, total, inverse, recipient }) {
  const color = inverse ? INVERSE_55 : TEXT_FAINT;
  const tag = recipient
    ? `STRICTLY CONFIDENTIAL · PREPARED FOR ${recipient.toUpperCase()}`
    : 'STRICTLY CONFIDENTIAL · OPERATOR PROPOSAL';
  return (
    <div style={S.slideFooterMicro}>
      <div style={{ color, fontSize: 10, letterSpacing: 2, fontWeight: W.bold }}>{tag}</div>
      <div
        style={{
          color,
          fontSize: 10,
          letterSpacing: 2,
          fontFamily: 'monospace',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {String(step).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </div>
    </div>
  );
}

/* ============================================================ */
/* SLIDE 00 — COVER                                              */
/* ============================================================ */
export function S00Cover({ pillar, recipient }) {
  return (
    <div style={S.slide}>
      <div style={{ ...S.bg, backgroundImage: `url('${pillar.coverImage}')` }} />
      <div
        style={{
          ...S.overlay,
          background:
            'linear-gradient(90deg, var(--color-bg-main) 0%, var(--color-bg-main) 32%, color-mix(in srgb, var(--color-bg-main) 70%, transparent) 48%, color-mix(in srgb, var(--color-bg-main) 18%, transparent) 60%, transparent 75%)',
        }}
      />

      <div style={S.topBar}>
        <div style={S.micro}>FUTUR ONE</div>
        <div style={{ ...S.micro, color: 'var(--color-text-inverse)', textShadow: TEXT_SHADOW_CONFIDENTIAL }}>
          {recipient ? `PREPARED FOR ${recipient.toUpperCase()}` : 'STRICTLY CONFIDENTIAL'}
        </div>
      </div>

      <div style={{ ...S.coverCenter, width: '60%' }}>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.coverEyebrow}>
          {pillar.cover.eyebrow}
        </motion.div>
        <motion.h1 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.coverTitle}>
          {pillar.cover.title.split('\n').map((line, i) => (
            <span key={i} style={{ display: 'block' }}>{line}</span>
          ))}
        </motion.h1>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={2} style={S.coverDivider} />
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={3} style={S.coverSubtitle}>
          {pillar.cover.subtitle.split('\n').map((line, i) => (
            <span key={i} style={{ display: 'block' }}>{line}</span>
          ))}
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
/* SLIDE 01 — VISION                                             */
/* ============================================================ */
export function S01Vision({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="01" label="THE VISION" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.vision.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.vision.title}
          </motion.h2>
        </div>
        <div style={S.splitR}>
          {pillar.vision.bullets.map((b, i) => (
            <motion.div key={i} initial="hidden" animate="show" variants={fadeUp} custom={2 + i} style={S.bulletRow}>
              <span style={S.bulletNum}>{String(i + 1).padStart(2, '0')}</span>
              <span style={S.bulletText}>{b}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={1} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 02 — THE PROJECT                                        */
/* ============================================================ */
export function S02Project({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="02" label="THE PROJECT" />

      <div style={{ ...S.centerWrap, top: '14vh', bottom: '12vh', transform: 'none', justifyContent: 'flex-start' }}>
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
          {pillar.project.eyebrow}
        </motion.div>
        <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={{ ...S.h2, maxWidth: 1100 }}>
          {pillar.project.title}
        </motion.h2>
        <motion.p initial="hidden" animate="show" variants={fadeUp} custom={2} style={{ ...S.lead, marginTop: 20, maxWidth: 920 }}>
          {pillar.project.body}
        </motion.p>

        <div style={{ ...S.statsRow, marginTop: '6vh' }}>
          {pillar.project.stats.map((k, i) => (
            <motion.div key={i} initial="hidden" animate="show" variants={fadeUp} custom={3 + i} style={S.statCard}>
              <div style={S.statV}>{k.v}</div>
              <div style={S.statL}>{k.l}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={2} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 03 — THE SITE                                           */
/* ============================================================ */
export function S03Site({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="03" label="THE SITE" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.site.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.site.title}
          </motion.h2>
        </div>
        <div style={S.splitR}>
          {pillar.site.rows.map((row, i) => (
            <motion.div key={i} initial="hidden" animate="show" variants={fadeUp} custom={2 + i} style={S.tagRow}>
              <div style={S.tagRowTag}>{row.tag}</div>
              <div style={S.tagRowBody}>{row.body}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={3} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 04 — THE SLOT IS REAL  (key slide)                      */
/* ============================================================ */
export function S04SlotIsReal({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-gray-900)', color: TEXT_INVERSE }}>
      <SlideHeader pillar={pillar} num="04" label="THE TRAIN IS LEAVING" inverse />

      <div style={{ ...S.contentWrap, paddingTop: '12vh' }}>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
          style={{ ...S.eyebrow, color: 'var(--color-accent-strong)' }}
        >
          {pillar.slotIsReal.eyebrow}
        </motion.div>
        <motion.h2
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
          style={{ ...S.h2, color: TEXT_INVERSE, fontStyle: 'italic', maxWidth: 1100 }}
        >
          {pillar.slotIsReal.title}
        </motion.h2>

        <div style={S.proofGrid}>
          {pillar.slotIsReal.proofs.map((p, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={2 + i}
              style={S.proofCard}
            >
              <div style={S.proofTag}>{p.tag}</div>
              <div style={S.proofHead}>{p.headline}</div>
              <div style={S.proofBody}>{p.body}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={4} total={10} inverse recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 05 — YOUR ROLE                                          */
/* ============================================================ */
export function S05YourRole({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="05" label="YOUR ROLE" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.yourRole.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.yourRole.title}
          </motion.h2>
          <motion.p initial="hidden" animate="show" variants={fadeUp} custom={2} style={{ ...S.lead, marginTop: 20, maxWidth: 540 }}>
            {pillar.yourRole.body}
          </motion.p>
        </div>
        <div style={S.splitR}>
          <div style={S.roleLabel}>YOU DO</div>
          {pillar.yourRole.youDo.map((line, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3 + i}
              style={S.roleRow}
            >
              <span style={S.roleDot}>✓</span>
              <span style={S.roleText}>{line}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={5} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 06 — WHAT WE WILL NOT DO  (key slide)                   */
/* ============================================================ */
export function S06WontDo({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="06" label="WHAT WE WILL NOT DO" />

      <div
        style={{
          ...S.centerWrap,
          top: '14vh',
          bottom: '12vh',
          transform: 'none',
          justifyContent: 'flex-start',
        }}
      >
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
          {pillar.wontDo.eyebrow}
        </motion.div>
        <motion.h2
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
          style={{ ...S.h2, maxWidth: 1100 }}
        >
          {pillar.wontDo.title}
        </motion.h2>
        <motion.p
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={2}
          style={{ ...S.lead, marginTop: 20, color: TEXT_DIM, maxWidth: 760 }}
        >
          {pillar.wontDo.body}
        </motion.p>

        <div style={{ marginTop: '4vh', maxWidth: 1100 }}>
          {pillar.wontDo.lines.map((row, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3 + i}
              style={S.wontRow}
            >
              <div style={S.wontTag}>{row.tag}</div>
              <div style={S.wontBody}>{row.body}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <SlideFooter pillar={pillar} step={6} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 07 — CAPITAL                                            */
/* ============================================================ */
export function S07Capital({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="07" label="THE CAPITAL" />

      <div style={S.split}>
        <div style={S.splitL}>
          <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
            {pillar.capital.eyebrow}
          </motion.div>
          <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
            {pillar.capital.title}
          </motion.h2>
          <motion.p
            initial="hidden"
            animate="show"
            variants={fadeUp}
            custom={2}
            style={{ ...S.lead, marginTop: 20, maxWidth: 540 }}
          >
            {pillar.capital.body}
          </motion.p>
        </div>
        <div style={S.splitR}>
          <div style={S.commTable}>
            {pillar.capital.rows.map((r, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={3 + i}
                style={S.commRow}
              >
                <div style={S.commLabel}>{r.l}</div>
                <div style={S.commValue}>{r.v}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <SlideFooter pillar={pillar} step={7} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 08 — RISK ALLOCATION                                    */
/* ============================================================ */
export function S08Risk({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-bg-main)' }}>
      <SlideHeader pillar={pillar} num="08" label="RISK ALLOCATION" />

      <div
        style={{
          ...S.centerWrap,
          top: '14vh',
          bottom: '12vh',
          transform: 'none',
          justifyContent: 'flex-start',
        }}
      >
        <motion.div initial="hidden" animate="show" variants={fadeUp} custom={0} style={S.eyebrow}>
          {pillar.risk.eyebrow}
        </motion.div>
        <motion.h2 initial="hidden" animate="show" variants={fadeUp} custom={1} style={S.h2}>
          {pillar.risk.title}
        </motion.h2>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={2}
          style={{ ...S.riskTable, marginTop: 32 }}
        >
          <div style={{ ...S.riskRow, ...S.riskHead }}>
            {pillar.risk.head.map((h, i) => (
              <div key={i} style={{ ...S.riskCell, ...(i === 0 ? S.riskCellName : S.riskCellMark) }}>
                {h}
              </div>
            ))}
          </div>
          {pillar.risk.rows.map((row, i) => (
            <motion.div
              key={i}
              initial="hidden"
              animate="show"
              variants={fadeUp}
              custom={3 + i}
              style={S.riskRow}
            >
              {row.map((cell, j) => (
                <div
                  key={j}
                  style={{
                    ...S.riskCell,
                    ...(j === 0 ? S.riskCellName : S.riskCellMark),
                    ...(cell === '✓' ? S.riskMarkOn : null),
                    ...(cell === 'shared' ? S.riskMarkShared : null),
                  }}
                >
                  {cell}
                </div>
              ))}
            </motion.div>
          ))}
        </motion.div>
      </div>

      <SlideFooter pillar={pillar} step={8} total={10} recipient={recipient} />
    </div>
  );
}

/* ============================================================ */
/* SLIDE 09 — THE 60-DAY PATH  (key slide)                       */
/* ============================================================ */
export function S09Path({ pillar, recipient }) {
  return (
    <div style={{ ...S.slide, background: 'var(--color-gray-900)', color: TEXT_INVERSE }}>
      <SlideHeader pillar={pillar} num="09" label="THE 60-DAY PATH" inverse />

      <div style={{ ...S.contentWrap, paddingTop: '12vh' }}>
        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={0}
          style={{ ...S.eyebrow, color: 'var(--color-accent-strong)' }}
        >
          {pillar.path.eyebrow}
        </motion.div>
        <motion.h2
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={1}
          style={{ ...S.h2, color: TEXT_INVERSE, fontStyle: 'italic', maxWidth: 1100 }}
        >
          {pillar.path.title}
        </motion.h2>

        <div style={S.timelineWrap}>
          <div style={S.timelineLine} />
          <div style={S.timelineGrid}>
            {pillar.path.milestones.map((m, i) => (
              <motion.div
                key={i}
                initial="hidden"
                animate="show"
                variants={fadeUp}
                custom={2 + i}
                style={S.timelineCol}
              >
                <div style={S.timelineDot} />
                <div style={S.timelineDay}>{m.day}</div>
                <div style={S.timelineLabel}>{m.label}</div>
                <div style={S.timelineBody}>{m.body}</div>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.div
          initial="hidden"
          animate="show"
          variants={fadeUp}
          custom={8}
          style={S.askLine}
        >
          {pillar.path.ask}
        </motion.div>
      </div>

      <SlideFooter pillar={pillar} step={9} total={10} inverse recipient={recipient} />
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
  overlay: { position: 'absolute', inset: 0 },
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

  /* COVER */
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
    maxWidth: 600,
    lineHeight: 1.55,
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

  /* GENERIC LAYOUTS */
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
  splitL: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },
  splitR: { display: 'flex', flexDirection: 'column', justifyContent: 'center' },

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

  /* BULLETS (vision) */
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

  /* PROJECT STATS */
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1, background: BORDER_LIGHT.split(' ')[2] ?? 'var(--color-border-medium)', border: BORDER_LIGHT },
  statCard: { background: 'var(--color-bg-main)', padding: 28, display: 'flex', flexDirection: 'column', gap: 8 },
  statV: {
    fontSize: T.statS,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
  },
  statL: { fontSize: 10, fontWeight: W.heavy, letterSpacing: LS.wider, color: TEXT_FAINT, marginTop: 8 },

  /* TAG ROWS (site / wont) */
  tagRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
    padding: '20px 0',
    borderBottom: BORDER_LIGHT,
  },
  tagRowTag: {
    minWidth: 130,
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    paddingTop: 4,
  },
  tagRowBody: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
  },

  /* SLOT IS REAL */
  proofGrid: {
    marginTop: '5vh',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 16,
  },
  proofCard: {
    background: 'color-mix(in srgb, var(--color-text-inverse) 3%, transparent)',
    border: BORDER_INVERSE_12,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 240,
  },
  proofTag: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 14,
  },
  proofHead: {
    fontSize: 22,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    lineHeight: 1.1,
    color: TEXT_INVERSE,
    marginBottom: 12,
  },
  proofBody: { fontSize: 13, lineHeight: 1.55, color: INVERSE_70 },

  /* YOUR ROLE */
  roleLabel: {
    fontSize: T.eyebrow,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 18,
  },
  roleRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    padding: '14px 0',
    borderBottom: BORDER_LIGHT,
  },
  roleDot: {
    width: 22,
    height: 22,
    background: ACCENT_BG_15,
    border: ACCENT_BORDER_1PX_40,
    color: 'var(--color-accent-strong)',
    fontWeight: W.heavy,
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  roleText: {
    fontSize: 14,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
  },

  /* WONT DO */
  wontRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 24,
    padding: '20px 0',
    borderBottom: BORDER_LIGHT,
  },
  wontTag: {
    minWidth: 160,
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    paddingTop: 4,
  },
  wontBody: {
    fontSize: T.lead,
    fontWeight: W.medium,
    lineHeight: 1.55,
    color: TEXT_PRIMARY,
  },

  /* CAPITAL */
  commTable: { border: BORDER_LIGHT },
  commRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: BORDER_LIGHT,
  },
  commLabel: { fontSize: 11, fontWeight: W.heavy, letterSpacing: LS.wider, color: TEXT_FAINT },
  commValue: {
    fontSize: T.h3,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    color: 'var(--color-accent-strong)',
    fontFamily: 'monospace',
  },

  /* RISK TABLE */
  riskTable: { border: BORDER_LIGHT, maxWidth: 1100 },
  riskHead: {
    background: 'color-mix(in srgb, var(--color-accent-strong) 5%, transparent)',
  },
  riskRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr 1fr',
    borderBottom: BORDER_LIGHT,
  },
  riskCell: {
    padding: '14px 18px',
    fontSize: 13,
    fontWeight: W.medium,
    color: TEXT_PRIMARY,
    borderRight: BORDER_LIGHT,
  },
  riskCellName: { fontWeight: W.semibold },
  riskCellMark: {
    textAlign: 'center',
    fontFamily: 'monospace',
    color: TEXT_FAINT,
  },
  riskMarkOn: {
    color: 'var(--color-accent-strong)',
    fontWeight: W.heavy,
    fontSize: 16,
  },
  riskMarkShared: { color: TEXT_DIM, fontSize: 11, fontWeight: W.heavy, letterSpacing: 1 },

  /* TIMELINE */
  timelineWrap: {
    position: 'relative',
    marginTop: '6vh',
    paddingTop: 28,
  },
  timelineLine: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    height: 1,
    background: 'color-mix(in srgb, var(--color-accent-strong) 40%, transparent)',
  },
  timelineGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 24,
    position: 'relative',
  },
  timelineCol: { display: 'flex', flexDirection: 'column' },
  timelineDot: {
    width: 14,
    height: 14,
    background: 'var(--color-accent-strong)',
    borderRadius: '50%',
    border: '3px solid var(--color-gray-900)',
    marginLeft: -1,
    marginTop: -7,
    marginBottom: 18,
  },
  timelineDay: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: W.heavy,
    letterSpacing: LS.extraWide,
    color: 'var(--color-accent-strong)',
    marginBottom: 8,
  },
  timelineLabel: {
    fontSize: 18,
    fontWeight: W.heavy,
    letterSpacing: LS.tight,
    color: TEXT_INVERSE,
    marginBottom: 10,
  },
  timelineBody: {
    fontSize: 12,
    lineHeight: 1.55,
    color: INVERSE_70,
  },
  askLine: {
    marginTop: '5vh',
    paddingLeft: 20,
    borderLeft: '2px solid var(--color-accent-strong)',
    fontSize: T.h3,
    fontWeight: W.semibold,
    fontStyle: 'italic',
    color: TEXT_INVERSE,
    maxWidth: 900,
    lineHeight: 1.35,
  },
};
