'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  {
    href: '/admin/hearst',
    label: 'Dashboard',
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
    href: '/admin/hearst/simulator',
    label: 'Simulator',
    icon: (
      <>
        <path d="M10 1L3 10h5l-1 7 7-10H9l1-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: '/admin/hearst/deals',
    label: 'Deals',
    icon: (
      <>
        <path d="M9 1.5l7.5 4.5v6L9 16.5 1.5 12V6L9 1.5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M1.5 6L9 10.5L16.5 6M9 10.5V16.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      </>
    ),
  },
  {
    href: '/admin/hearst/pipeline',
    label: 'Pipeline',
    icon: (
      <>
        <path d="M2 4h14M2 9h14M2 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="5" cy="4" r="1.5" fill="currentColor" />
        <circle cx="11" cy="9" r="1.5" fill="currentColor" />
        <circle cx="14" cy="14" r="1.5" fill="currentColor" />
      </>
    ),
  },
  {
    href: '/admin/hearst/financial',
    label: 'Financial',
    icon: (
      <>
        <path d="M3 15V6M7 15V3M11 15V8M15 15V1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M2 16h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    href: '/admin/hearst/data-room',
    label: 'Data Room',
    icon: (
      <>
        <path d="M2 4a2 2 0 012-2h4l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4z" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
  {
    href: '/admin/hearst/sources',
    label: 'Sources',
    icon: (
      <>
        <circle cx="9" cy="9" r="7.25" stroke="currentColor" strokeWidth="1.5" />
        <path d="M1.75 9h14.5M9 1.75c1.8 2.2 2.8 4.7 2.8 7.25S10.8 13.9 9 16.25M9 1.75c-1.8 2.2-2.8 4.7-2.8 7.25S7.2 13.9 9 16.25" stroke="currentColor" strokeWidth="1.5" />
      </>
    ),
  },
];

const PROFILE = {
  href: '/admin/hearst/profile',
  label: 'Profile',
  icon: (
    <>
      <circle cx="9" cy="6.5" r="2.75" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 16c0-2.8 2.7-5 6-5s6 2.2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
};

function isActive(href, pathname) {
  if (href === '/admin/hearst') return pathname === '/admin/hearst';
  return pathname === href || pathname.startsWith(href + '/');
}

function NavIcon({ href, label, icon, active }) {
  return (
    <Link
      href={href}
      aria-label={label}
      title={label}
      style={{ ...S.item, ...(active ? S.itemActive : {}) }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        {icon}
      </svg>
    </Link>
  );
}

export function OracleBottomBar() {
  const pathname = usePathname() ?? '/admin/hearst';

  return (
    <nav style={S.rail} aria-label="Oracle sections">
      <div style={S.stack}>
        {NAV.map((item) => (
          <NavIcon key={item.href} {...item} active={isActive(item.href, pathname)} />
        ))}
      </div>
      <NavIcon {...PROFILE} active={isActive(PROFILE.href, pathname)} />
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
    gap: 4,
    pointerEvents: 'auto',
  },
  item: {
    pointerEvents: 'auto',
    width: 40,
    height: 40,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--cp-text-muted)',
    borderRadius: 8,
    transition: 'color 150ms, background 150ms',
    textDecoration: 'none',
  },
  itemActive: {
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-2)',
  },
};
