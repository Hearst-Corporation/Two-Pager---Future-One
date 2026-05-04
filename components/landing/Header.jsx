'use client';

import { useEffect, useState } from 'react';

const NAV = [
  { id: 'vision', label: 'About' },
  { id: 'method', label: 'Method' },
  { id: 'hub', label: 'Hub' },
  { id: 'campus', label: 'Campus' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
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
          'padding .25s ease, background .25s ease, border-color .25s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
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
          <NavLink key={n.id} item={n} onNav={handleNav} />
        ))}
      </nav>
    </header>
  );
}

function NavLink({ item, onNav }) {
  const [hover, setHover] = useState(false);
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
        color: hover ? '#fff' : 'rgba(255,255,255,.78)',
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
          transform: hover ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left center',
          transition: 'transform 0.4s cubic-bezier(.22,.61,.36,1)',
        }}
      />
    </a>
  );
}
