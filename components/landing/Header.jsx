'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { PARTICLES_EXPLODE_EVENT } from '../ui/MagneticParticles';
import MagneticButton from '../ui/MagneticButton';

const NAV = [
  { id: 'vision', label: 'About' },
  { id: 'hub', label: 'Hub' },
  { id: 'partners', label: 'Partners' },
  { id: 'life', label: 'Life' },
  { id: 'method', label: 'Method' },
  { id: 'campus', label: 'Campus' },
  { id: 'contact', label: 'Contact' },
];

const REVEAL_DELAY_MS = 1100;

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
          ? 'var(--color-gray-900)'
          : 'linear-gradient(180deg, rgba(0,0,0,.5) 0%, rgba(0,0,0,0) 100%)',
        backdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(14px) saturate(140%)' : 'none',
        borderBottom: scrolled
          ? '1px solid var(--color-border-strong)'
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
        <Image
          src="/hearst-h.svg"
          alt="Hearst"
          width={22}
          height={22}
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

      <nav 
        className="nav-desktop"
        style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 28,
        }}
      >
        {NAV.map((n) => (
          <NavLink key={n.id} item={n} onNav={handleNav} isActive={activeSection === n.id} />
        ))}
        <MagneticButton
          href="#contact"
          onClick={(e) => handleNav(e, 'contact')}
          style={{
            padding: '8px 18px',
            fontSize: 10,
            letterSpacing: 1.2,
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--color-text-inverse)',
            background: 'var(--color-accent-strong)',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'none',
            marginLeft: '12px'
          }}
        >
          Request Briefing
        </MagneticButton>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--color-gray-900)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          zIndex: 1000,
        }}>
          {NAV.map((n) => (
            <NavLink 
              key={n.id} 
              item={n} 
              onNav={(e, id) => {
                setMobileMenuOpen(false);
                handleNav(e, id);
              }} 
              isActive={activeSection === n.id} 
            />
          ))}
        </div>
      )}

      {/* Mobile Toggle */}
      <button 
        className="nav-toggle"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        style={{
          display: 'none',
          background: 'none',
          border: 'none',
          color: 'var(--color-text-inverse)',
          fontSize: 24,
          cursor: 'pointer',
          zIndex: 1100,
        }}
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      <style jsx>{`
        @media (max-width: 900px) {
          .nav-desktop { display: none !important; }
          .nav-toggle { display: block !important; }
        }
      `}</style>
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
        color: active ? 'var(--color-text-inverse)' : 'var(--color-text-muted)',
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
