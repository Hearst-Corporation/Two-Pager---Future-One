'use client';

import { useEffect, useState } from 'react';
import { PARTICLES_EXPLODE_EVENT } from './MagneticParticles';

const NAV = [
  { id: 'vision', label: 'About' },
  { id: 'hub', label: 'Hub' },
  { id: 'partners', label: 'Partners' },
  { id: 'life', label: 'Life' },
  { id: 'method', label: 'Method' },
  { id: 'campus', label: 'Campus' },
];

const REVEAL_DELAY_MS = 1100;

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
      
      // Calculate progress
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolledProgress = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolledProgress);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    // Intersection Observer for active nav items
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: '-50% 0px -50% 0px' }
    );

    // Wait a tick for DOM to be fully rendered
    setTimeout(() => {
      NAV.forEach((item) => {
        const el = document.getElementById(item.id);
        if (el) observer.observe(el);
      });
    }, 100);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setRevealed(true);
      return;
    }
    const onExplode = () => {
      window.setTimeout(() => setRevealed(true), REVEAL_DELAY_MS);
    };
    window.addEventListener(PARTICLES_EXPLODE_EVENT, onExplode);
    return () => window.removeEventListener(PARTICLES_EXPLODE_EVENT, onExplode);
  }, []);

  const handleNav = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        padding: scrolled ? '12px 48px' : '20px 48px',
        background: scrolled
          ? 'rgba(14, 16, 19, 0.78)'
          : 'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,.06)'
          : '1px solid transparent',
        transition:
          'padding .25s ease, background .25s ease, border-color .25s ease, opacity .8s ease, transform .8s cubic-bezier(.22,.61,.36,1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        opacity: revealed ? 1 : 0,
        transform: revealed ? 'translateY(0)' : 'translateY(-12px)',
        pointerEvents: revealed ? 'auto' : 'none',
      }}
    >
      {/* Progress Bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: 1,
          background: 'var(--color-accent-strong)',
          width: `${scrollProgress}%`,
          transition: 'width 0.1s ease-out',
        }}
      />

      <a
        href="#top"
        onClick={(e) => handleNav(e, 'top')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          textDecoration: 'none',
          color: 'var(--color-text-inverse)',
        }}
      >
        <img
          src="/hearst-h.svg"
          alt="Hearst"
          style={{
            height: 22,
            width: 'auto',
            display: 'block',
            filter: 'brightness(0) invert(1)',
          }}
        />
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.4 }}>
            FUTUR ONE
          </span>
          <span
            style={{
              fontSize: 7.5,
              opacity: 0.55,
              letterSpacing: 1.8,
              fontWeight: 600,
              marginTop: 3,
            }}
          >
            QATAR · BY HEARST
          </span>
        </div>
      </a>

      <nav style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        {NAV.map((n) => (
          <NavLink key={n.id} item={n} onNav={handleNav} isActive={activeSection === n.id} />
        ))}
      </nav>
    </header>
  );
}

function NavLink({ item, onNav, isActive }) {
  const [hover, setHover] = useState(false);
  const active = isActive || hover;
  
  return (
    <a
      href={`#${item.id}`}
      onClick={(e) => onNav(e, item.id)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: 0.6,
        textTransform: 'uppercase',
        color: active ? '#fff' : 'rgba(255,255,255,.78)',
        textDecoration: 'none',
        transition: 'color .2s ease',
        paddingBottom: 4,
      }}
    >
      {item.label}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: 'var(--color-accent-strong)',
          transform: active ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left center',
          transition: 'transform 0.4s cubic-bezier(.22,.61,.36,1)',
        }}
      />
    </a>
  );
}
