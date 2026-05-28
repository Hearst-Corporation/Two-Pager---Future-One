'use client';

// Rail vertical gauche du cockpit Hearst.
// 5 sections regroupent toutes les pages du cockpit :
//   - Brief    : dashboard informatif (vue d'ouverture)
//   - Sim      : simulateur + engine + scenarios + financial + assumptions
//   - Hub      : pipeline + deals + contracts + data-room (CRM ops)
//   - Library  : sources + reports + timeline + risks + audit (référentiel)
//   - Profile  : user profile (bas)
//
// Le nom de la classe (`OracleBottomBar`) est conservé pour ne pas casser
// les imports existants (layout.jsx). La nav est désormais transversale par section.

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  {
    id: 'brief',
    href: '/admin/hearst',
    label: 'Brief',
    matchExact: '/admin/hearst',
    icon: (
      <>
        <rect x="2" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="2" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="2" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="10" y="10" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    id: 'sim',
    href: '/admin/hearst/simulator',
    label: 'Simulator',
    matchAny: ['/admin/hearst/simulator', '/admin/hearst/engine', '/admin/hearst/scenarios', '/admin/hearst/financial', '/admin/hearst/assumptions'],
    icon: (
      <>
        <path d="M10 1L3 10h5l-1 7 7-10H9l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: 'hub',
    href: '/admin/hearst/hub',
    label: 'Hub',
    matchAny: ['/admin/hearst/hub', '/admin/hearst/pipeline', '/admin/hearst/deals', '/admin/hearst/contracts', '/admin/hearst/data-room'],
    icon: (
      <>
        <path d="M9 1.5l7.5 4.5v6L9 16.5 1.5 12V6L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M1.5 6L9 10.5L16.5 6M9 10.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
  {
    id: 'library',
    href: '/admin/hearst/library',
    label: 'Library',
    matchAny: ['/admin/hearst/library', '/admin/hearst/sources', '/admin/hearst/reports', '/admin/hearst/timeline', '/admin/hearst/risks', '/admin/hearst/audit', '/admin/hearst/documents'],
    icon: (
      <>
        <path d="M3 2h12v14H3z M3 5h12 M3 8h12 M3 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
];

const PROFILE = {
  id: 'profile',
  href: '/admin/hearst/profile',
  label: 'Profile',
  matchAny: ['/admin/hearst/profile'],
  icon: (
    <>
      <circle cx="9" cy="6.5" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

function isSectionActive(section, pathname) {
  if (section.matchExact && pathname === section.matchExact) return true;
  if (section.matchAny) {
    return section.matchAny.some(prefix => pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'));
  }
  return false;
}

function NavIcon({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      aria-current={active ? 'page' : undefined}
      style={{ ...S.item, ...(active ? S.itemActive : {}) }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        {icon}
      </svg>
      <span style={S.itemLabel}>{label}</span>
    </Link>
  );
}

export function OracleBottomBar() {
  const pathname = usePathname() ?? '/admin/hearst';

  return (
    <nav style={S.rail} aria-label="Hearst cockpit sections">
      <div style={S.stack}>
        {SECTIONS.map((section) => (
          <NavIcon key={section.id} {...section} active={isSectionActive(section, pathname)} />
        ))}
      </div>
      <NavIcon {...PROFILE} active={isSectionActive(PROFILE, pathname)} />
    </nav>
  );
}

const S = {
  rail: {
    position: 'fixed',
    left: 0,
    top: 80,
    bottom: 80,
    width: 'var(--cp-rail-left, 88px)',
    zIndex: 25,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 0',
    pointerEvents: 'none',
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    pointerEvents: 'auto',
  },
  item: {
    pointerEvents: 'auto',
    width: 56,
    minHeight: 56,
    display: 'inline-flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    padding: '8px 4px',
    color: 'var(--cp-text-muted)',
    borderRadius: 10,
    transition: 'color 150ms, background 150ms',
    textDecoration: 'none',
  },
  itemActive: {
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-2)',
  },
  itemLabel: {
    fontSize: 9,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 1,
  },
};
