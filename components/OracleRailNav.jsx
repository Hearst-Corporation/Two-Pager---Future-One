'use client';

// OracleRailNav — navigation des sections du cockpit Hearst.
//
// Déplacée de la bottom-bar vers le RAIL GAUCHE (88px) : nav verticale
// icône + label. Portalée dans `.ct-rail-left` (rendu par
// @hearst/cockpit-shell, qui n'expose pas de prop de nav).
//
// Le slot est appendé en DERNIER enfant du rail — position sûre pour la
// réconciliation React du shell (React ne touche jamais aux nœuds en
// fin de liste qu'il ne gère pas). Il est ensuite positionné en absolute,
// centré verticalement, dans l'espace vide entre le lanceur (haut) et
// l'avatar profil (bas).
//
// Styles : `.oracle-rail-nav*` dans cp-tokens.css (tokens --cp-* uniquement).

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UI } from '@/lib/ui-strings';

// Demo-first hierarchy: a primary deal journey (Model → Evidence → Decision)
// above the secondary analyst tools. Visible labels come from UI.NAV_* —
// routes, order-independent active matching and icons are unchanged. Every
// route stays reachable; this is wording + grouping only, not a route split.
const SECTIONS = [
  // Primary — the demo deal journey
  { id: 'sim', href: '/admin/hearst/simulator', label: UI.NAV_SIMULATOR, group: 'primary', matchAny: ['/admin/hearst/simulator'] },
  { id: 'sources', href: '/admin/hearst/sources', label: UI.NAV_SOURCES, group: 'primary', matchAny: ['/admin/hearst/sources'] },
  { id: 'dossier', href: '/admin/hearst/dossier', label: UI.NAV_DOSSIER, group: 'primary', matchAny: ['/admin/hearst/dossier'] },
  // Analyst tools — secondary, still fully reachable
  { id: 'financial', href: '/admin/hearst/financial', label: UI.NAV_FINANCIAL, group: 'analyst', matchAny: ['/admin/hearst/financial'] },
  { id: 'deals', href: '/admin/hearst/deals', label: UI.NAV_DEALS, group: 'analyst', matchAny: ['/admin/hearst/deals'] },
  { id: 'workspace', href: '/admin/hearst/workspace', label: UI.NAV_WORKSPACE, group: 'analyst', matchAny: ['/admin/hearst/workspace'] },
];

function isSectionActive(section, pathname) {
  return section.matchAny.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'),
  );
}

function Icon({ id }) {
  const p = {
    width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
    stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round',
    strokeLinejoin: 'round', 'aria-hidden': true,
  };
  switch (id) {
    case 'sim': // sliders / control variables
      return (
        <svg {...p}>
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="16" x2="20" y2="16" />
          <circle cx="9" cy="8" r="2.4" fill="var(--cp-bg-deep)" />
          <circle cx="15" cy="16" r="2.4" fill="var(--cp-bg-deep)" />
        </svg>
      );
    case 'financial': // bar chart
      return (
        <svg {...p}>
          <line x1="5" y1="20" x2="5" y2="13" />
          <line x1="12" y1="20" x2="12" y2="8" />
          <line x1="19" y1="20" x2="19" y2="4" />
        </svg>
      );
    case 'deals': // contract / document
      return (
        <svg {...p}>
          <rect x="5" y="3.5" width="14" height="17" rx="2" />
          <line x1="8.5" y1="9" x2="15.5" y2="9" />
          <line x1="8.5" y1="12.5" x2="15.5" y2="12.5" />
          <line x1="8.5" y1="16" x2="13" y2="16" />
        </svg>
      );
    case 'workspace': // grid
      return (
        <svg {...p}>
          <rect x="4" y="4" width="7" height="7" rx="1.5" />
          <rect x="13" y="4" width="7" height="7" rx="1.5" />
          <rect x="4" y="13" width="7" height="7" rx="1.5" />
          <rect x="13" y="13" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'dossier': // folder
      return (
        <svg {...p}>
          <path d="M4 7.5a2 2 0 0 1 2-2h3l2 2.2h7a2 2 0 0 1 2 2v6.8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
        </svg>
      );
    case 'sources': // database
      return (
        <svg {...p}>
          <ellipse cx="12" cy="6" rx="7" ry="2.6" />
          <path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
          <path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6" />
        </svg>
      );
    default:
      return null;
  }
}

function NavItem({ section, pathname }) {
  const active = isSectionActive(section, pathname);
  const className =
    'oracle-rail-nav-item' +
    (active ? ' active' : '') +
    (section.group === 'analyst' ? ' oracle-rail-nav-item--analyst' : '');
  return (
    <Link
      href={section.href}
      className={className}
      aria-current={active ? 'page' : undefined}
      title={section.label}
    >
      <Icon id={section.id} />
      <span className="oracle-rail-nav-label">{section.label}</span>
    </Link>
  );
}

function NavContent({ pathname, className = 'oracle-rail-nav' }) {
  const primary = SECTIONS.filter((s) => s.group === 'primary');
  const analyst = SECTIONS.filter((s) => s.group === 'analyst');
  return (
    <nav className={className} aria-label={UI.NAV_RAIL_ARIA}>
      {primary.map((section) => (
        <NavItem key={section.id} section={section} pathname={pathname} />
      ))}
      <div className="oracle-rail-nav-sep" aria-hidden="true" />
      {analyst.map((section) => (
        <NavItem key={section.id} section={section} pathname={pathname} />
      ))}
    </nav>
  );
}

export function OracleRailNav() {
  const [railMount, setRailMount] = useState(null);
  const [bodyMount, setBodyMount] = useState(null);
  const pathname = usePathname() ?? '/admin/hearst/simulator';

  useEffect(() => {
    setBodyMount(document.body);

    const findRailMount = () => {
      const rail = document.querySelector('.ct-rail-left');
      if (!rail) {
        setRailMount(null);
        return;
      }
      let slot = rail.querySelector('[data-oracle-railnav-slot]');
      if (!slot) {
        slot = document.createElement('div');
        slot.setAttribute('data-oracle-railnav-slot', '');
        rail.appendChild(slot); // dernier enfant = sûr pour React du shell
      }
      setRailMount(slot);
    };
    findRailMount();
    const observer = new MutationObserver(findRailMount);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      document.querySelector('[data-oracle-railnav-slot]')?.remove();
    };
  }, []);

  const mobileNav = (
    <div className="oracle-mobile-nav-root">
      <NavContent pathname={pathname} className="oracle-mobile-nav oracle-rail-nav" />
    </div>
  );

  return (
    <>
      {railMount ? createPortal(<NavContent pathname={pathname} />, railMount) : null}
      {bodyMount ? createPortal(mobileNav, bodyMount) : null}
    </>
  );
}
