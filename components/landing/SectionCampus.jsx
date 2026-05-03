'use client';

const FACTS = [
  { value: '100 K', label: 'SQM', sub: 'TOTAL CAMPUS' },
  { value: '150', label: 'STARTUPS', sub: 'MAX CAPACITY' },
  { value: '4 K', label: 'RESIDENTS', sub: 'FOUNDERS & TEAMS' },
  { value: '24/7', label: 'OPERATIONS', sub: 'AI-MANAGED' },
];

export default function SectionCampus() {
  return (
    <section id="campus" style={S.section}>
      <div style={S.imgWrap}>
        <img src="/aerial-campus-red.png" alt="FUTUR ONE campus aerial view" style={S.img} />
        <div style={S.imgOverlay} />
        <div style={S.imgCaption}>
          <div style={S.capEyebrow}>THE CAMPUS · DOHA</div>
          <div style={S.capTitle}>
            Designed by <em>Foster + Partners</em>.
            <br />
            Built by <em>JB Pastor &amp; Fils</em>.
          </div>
        </div>
      </div>

      <div style={S.bottom}>
        <div style={S.bottomLeft}>
          <div style={S.eyebrow}>BY THE NUMBERS</div>
          <h2 style={S.title}>
            A controlled environment,
            <br />
            <span style={S.titleAccent}>at sovereign scale.</span>
          </h2>
          <p style={S.body}>
            One hundred thousand square meters of integrated infrastructure —
            residency, compute and operations under a single sovereign roof.
          </p>
        </div>

        <div style={S.factGrid}>
          {FACTS.map((f) => (
            <div key={f.label} style={S.fact}>
              <div style={S.factVal}>{f.value}</div>
              <div style={S.factLabel}>{f.label}</div>
              <div style={S.factSub}>{f.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const S = {
  section: {
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    paddingBottom: 0,
  },
  imgWrap: {
    position: 'relative',
    width: '100%',
    height: '78vh',
    minHeight: 480,
    overflow: 'hidden',
  },
  img: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  imgOverlay: {
    position: 'absolute',
    inset: 0,
    background:
      'linear-gradient(180deg, rgba(14,16,19,.4) 0%, rgba(14,16,19,.05) 35%, rgba(14,16,19,.85) 100%)',
  },
  imgCaption: {
    position: 'absolute',
    bottom: 48,
    left: 48,
    right: 48,
    color: '#fff',
  },
  capEyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 14,
  },
  capTitle: {
    fontSize: 'clamp(22px, 2.6vw, 36px)',
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: -0.5,
    maxWidth: 720,
  },

  bottom: {
    background: 'var(--color-gray-900)',
    padding: '90px 48px 110px',
    display: 'grid',
    gridTemplateColumns: '1fr 1.2fr',
    gap: 64,
    alignItems: 'center',
    borderTop: '1px solid rgba(255,255,255,.05)',
    maxWidth: 1400,
    margin: '0 auto',
  },
  bottomLeft: {
    maxWidth: 460,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 18,
  },
  title: {
    fontSize: 'clamp(28px, 3.2vw, 44px)',
    fontWeight: 700,
    lineHeight: 1.1,
    letterSpacing: -0.8,
    fontStyle: 'italic',
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  body: {
    marginTop: 22,
    fontSize: 13,
    lineHeight: 1.65,
    color: 'rgba(255,255,255,.6)',
  },

  factGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 0,
    border: '1px solid rgba(255,255,255,.08)',
  },
  fact: {
    padding: '28px 24px',
    borderRight: '1px solid rgba(255,255,255,.08)',
    borderBottom: '1px solid rgba(255,255,255,.08)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 140,
    justifyContent: 'space-between',
  },
  factVal: {
    fontSize: 38,
    fontWeight: 800,
    letterSpacing: -1.4,
    lineHeight: 1,
    color: '#fff',
  },
  factLabel: {
    marginTop: 18,
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: 'var(--color-accent-strong)',
  },
  factSub: {
    marginTop: 3,
    fontSize: 9.5,
    letterSpacing: 1.2,
    fontWeight: 600,
    color: 'rgba(255,255,255,.5)',
  },
};
