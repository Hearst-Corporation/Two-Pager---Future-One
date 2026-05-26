'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin/hearst',           label: 'Dashboard' },
  { href: '/admin/hearst/deals',     label: 'Deals' },
  { href: '/admin/hearst/pipeline',  label: 'Pipeline' },
  { href: '/admin/hearst/financial', label: 'Financial' },
  { href: '/admin/hearst/data-room', label: 'Data Room' },
  { href: '/admin/hearst/sources',   label: 'Sources' },
];

function isActive(href, pathname) {
  if (href === '/admin/hearst') return pathname === '/admin/hearst';
  return pathname === href || pathname.startsWith(href + '/');
}

export function OracleBottomBar() {
  const pathname = usePathname() ?? '/admin/hearst';
  const profileActive = isActive('/admin/hearst/profile', pathname);

  return (
    <nav style={S.nav}>
      <div style={S.track}>
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{ ...S.seg, ...(active ? S.segActive : {}) }}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
      <Link
        href="/admin/hearst/profile"
        aria-label="Profile"
        style={{ ...S.profile, ...(profileActive ? S.segActive : {}) }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M2.5 13.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <span>Profile</span>
      </Link>
    </nav>
  );
}

const S = {
  nav: {
    position: 'sticky',
    top: '-32px',
    zIndex: 20,
    margin: '-32px -40px 24px',
    padding: '0 32px',
    background: 'color-mix(in srgb, var(--cp-bg-deep) 82%, transparent)',
    borderBottom: '1px solid var(--cp-border)',
    backdropFilter: 'blur(24px) saturate(140%)',
    WebkitBackdropFilter: 'blur(24px) saturate(140%)',
    display: 'flex',
    alignItems: 'center',
    minHeight: 48,
  },
  track: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  seg: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '10px 14px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--cp-text-muted)',
    textDecoration: 'none',
    borderRadius: 8,
    transition: 'color 150ms, background 150ms',
    whiteSpace: 'nowrap',
  },
  segActive: {
    color: 'var(--cp-text-primary)',
    background: 'var(--cp-surface-2)',
  },
  profile: {
    marginLeft: 'auto',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    color: 'var(--cp-text-muted)',
    textDecoration: 'none',
    borderRadius: 8,
    transition: 'color 150ms, background 150ms',
  },
};
