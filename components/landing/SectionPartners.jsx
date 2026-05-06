'use client';

import { useState, useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import Reveal from '../ui/Reveal';
import CountUp from '../ui/CountUp';

const KPIS = [
  { render: () => (<><CountUp to={500} duration={1800} /> MW</>), label: 'DEPLOYED', sub: 'Across 4 continents' },
  { render: () => 'LEED', label: 'CERTIFIED', sub: 'Hyperscale grade' },
  { render: () => 'PUE 1.2', label: 'LIQUID COOLING', sub: 'Frontier efficiency' },
  { render: () => (<><CountUp to={15} duration={1600} />+ YRS</>), label: 'TRACK RECORD', sub: 'Yondr · Sedenak · A*STAR' },
];

const PARTNERS = [
  {
    logo: '/partners/kontena.svg',
    name: 'KONTENA',
    role: 'HARDWARE',
    body: 'Modular AI/HPC data centers. The KONNECT platform — proprietary modular DC architecture deployed across hyperscale campuses.',
    website: 'kontena.tech',
    image: '/partners/hardware.jpg',
  },
  {
    logo: '/partners/bglobal.svg',
    name: 'B-GLOBAL TECH',
    role: 'ENGINEERING',
    body: 'Data center engineering at frontier scale. 8 offices, 4 continents, 15+ years — engineers behind Yondr 200 MW, Sedenak 500 MW and A*STAR national supercomputer.',
    website: 'b-global.tech',
    image: '/partners/bglobal-yondr-1.jpg',
  },
  {
    logo: '/partners/gatti.svg',
    name: 'GATTI SERVICES',
    role: 'OPERATIONS',
    body: '24/7 Smart Hands operations and Smart PDUs. Real-time power monitoring and mining-grade resilience in every rack.',
    website: 'gatti-services.com',
    image: '/partners/connectivity.jpg',
  },
];

export default function SectionPartners() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"]
  });
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <section id="partners" style={S.section} ref={sectionRef}>
      <motion.video
        src="/clip-01-H-particles.mp4"
        autoPlay
        muted
        loop
        playsInline
        style={{ ...S.videoBg, y, scale: 1.2 }}
      />
      <div style={S.bgTexture} />

      <div style={S.container}>
        {/* HEADER */}
        <div style={S.header}>
          <Reveal>
            <div style={S.eyebrow}>
              <span style={S.eyebrowNum}>03</span>
              <span style={S.eyebrowDivider} />
              THE PARTNER STACK
            </div>
          </Reveal>
          <Reveal delay={60}>
            <h2 style={S.title}>
              We don't outsource excellence.
              <br />
              <span style={S.titleAccent}>We assemble it.</span>
            </h2>
          </Reveal>
          <Reveal delay={120}>
            <p style={S.subtitle}>
              Hearst Qatar partners with the engineers behind <strong>Yondr 200 MW</strong>,{' '}
              <strong>Sedenak 500 MW</strong> and <strong>A*STAR's national supercomputer</strong> —
              hyperscale veterans from Asia to Europe, now building Tier IV at sovereign scale in Qatar.
            </p>
          </Reveal>
        </div>

        {/* KPI BAND */}
        <Reveal delay={80}>
          <div style={S.kpiBand}>
            {KPIS.map((k, i) => (
              <div key={i} style={{ ...S.kpiItem, borderRight: i < KPIS.length - 1 ? '1px solid rgba(255,255,255,.08)' : 'none' }}>
                <div style={S.kpiValue}>{k.render()}</div>
                <div style={S.kpiLabel}>{k.label}</div>
                <div style={S.kpiSub}>{k.sub}</div>
              </div>
            ))}
          </div>
        </Reveal>

        {/* 3 PARTNER CARDS */}
        <div style={S.partnersGrid}>
          {PARTNERS.map((p, i) => (
            <Reveal key={p.name} delay={i * 80} y={28}>
              <PartnerCard partner={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PartnerCard({ partner }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...S.partnerCard,
        transform: hover ? 'translateY(-6px)' : 'translateY(0)',
        boxShadow: hover ? '0 24px 48px -16px rgba(190,18,60,.4)' : '0 0 0 0 rgba(0,0,0,0)',
        borderColor: hover ? 'rgba(190,18,60,.4)' : 'rgba(255,255,255,.08)',
      }}
    >
      <div style={S.partnerImgWrap}>
        <Image
          src={partner.image}
          alt={partner.name}
          fill
          style={{
            ...S.partnerImg,
            transform: hover ? 'scale(1.06)' : 'scale(1)',
          }}
        />
        <div style={S.partnerImgOverlay} />
        <div style={S.partnerRole}>{partner.role}</div>
      </div>
      <div style={S.partnerBody}>
        <div
          style={{
            ...S.partnerAccentBar,
            transform: hover ? 'scaleX(1)' : 'scaleX(0.2)',
            opacity: hover ? 1 : 0.5,
          }}
        />
        <Image src={partner.logo} alt={partner.name} width={120} height={22} style={S.partnerLogo} />
        <p style={S.partnerText}>{partner.body}</p>
        <a
          href={`https://${partner.website}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            ...S.partnerWebsite,
            color: hover ? 'var(--color-accent-soft)' : 'var(--color-accent-strong)',
          }}
        >
          {partner.website} <span style={{ marginLeft: 4 }}>↗</span>
        </a>
      </div>
    </div>
  );
}

const S = {
  section: {
    position: 'relative',
    background: 'var(--color-gray-900)',
    color: 'var(--color-text-inverse)',
    padding: '110px 48px',
    borderTop: '1px solid rgba(255,255,255,.05)',
    overflow: 'hidden',
  },
  bgTexture: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(60% 50% at 80% 0%, rgba(190,18,60,.08) 0%, rgba(0,0,0,0) 60%), linear-gradient(180deg, rgba(14,16,19,.8) 0%, rgba(14,16,19,.95) 100%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  videoBg: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    opacity: 0.3,
  },
  container: {
    position: 'relative',
    maxWidth: 1400,
    margin: '0 auto',
    zIndex: 1,
  },
  header: {
    maxWidth: 760,
    marginBottom: 56,
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.4,
    fontWeight: 700,
    color: 'var(--color-accent-soft)',
    marginBottom: 18,
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  eyebrowNum: {
    fontFamily: 'monospace',
    fontWeight: 800,
    fontSize: 11,
    letterSpacing: 1,
  },
  eyebrowDivider: {
    width: 28,
    height: 1,
    background: 'var(--color-accent-soft)',
    opacity: 0.5,
  },
  title: {
    fontSize: 'clamp(32px, 4.2vw, 60px)',
    fontWeight: 700,
    letterSpacing: -1.2,
    lineHeight: 1.05,
    fontStyle: 'italic',
    margin: 0,
  },
  titleAccent: {
    color: 'var(--color-accent-strong)',
  },
  subtitle: {
    marginTop: 22,
    fontSize: 14,
    lineHeight: 1.7,
    color: 'rgba(255,255,255,.65)',
    maxWidth: 720,
  },

  /* KPI BAND */
  kpiBand: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    border: '1px solid var(--color-border-strong)',
    background: 'rgba(255,255,255,.02)',
    marginBottom: 56,
  },
  kpiItem: {
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  kpiValue: {
    fontSize: 36,
    fontWeight: 800,
    letterSpacing: -1.2,
    lineHeight: 1,
    color: 'var(--color-accent-strong)',
  },
  kpiLabel: {
    marginTop: 14,
    fontSize: 10.5,
    fontWeight: 800,
    letterSpacing: 1.6,
    color: 'var(--color-text-inverse)',
  },
  kpiSub: {
    fontSize: 9.5,
    letterSpacing: 1,
    fontWeight: 500,
    color: 'var(--color-text-muted)',
  },

  /* 3 PARTNER CARDS */
  partnersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: 20,
  },
  partnerCard: {
    background: 'var(--color-gray-850)',
    border: '1px solid rgba(255,255,255,.08)',
    overflow: 'hidden',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1), box-shadow 0.5s ease, border-color 0.4s ease',
    cursor: 'default',
  },
  partnerImgWrap: {
    position: 'relative',
    width: '100%',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
  },
  partnerImg: {
    objectFit: 'cover',
    display: 'block',
    transition: 'transform 0.7s cubic-bezier(.22,.61,.36,1)',
    willChange: 'transform',
  },
  partnerImgOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, var(--color-dark-surface) 100%)',
  },
  partnerRole: {
    position: 'absolute',
    bottom: 14,
    left: 18,
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2.2,
    color: 'var(--color-accent-soft)',
  },
  partnerBody: {
    position: 'relative',
    padding: '26px 24px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    flex: 1,
  },
  partnerAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 60,
    height: 2,
    background: 'var(--color-accent-strong)',
    transformOrigin: 'left center',
    transition: 'transform 0.5s cubic-bezier(.22,.61,.36,1), opacity 0.3s ease',
  },
  partnerLogo: {
    height: 22,
    width: 'auto',
    display: 'block',
    filter: 'brightness(0) invert(1)',
    objectFit: 'contain',
    objectPosition: 'left center',
    maxWidth: '60%',
  },
  partnerText: {
    fontSize: 12.5,
    lineHeight: 1.6,
    color: 'var(--color-text-muted)',
    margin: 0,
    flex: 1,
  },
  partnerWebsite: {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 1,
    textDecoration: 'none',
    transition: 'color 0.25s ease',
    marginTop: 'auto',
  },
};
