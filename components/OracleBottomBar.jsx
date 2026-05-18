'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/admin/hearst', label: 'Dashboard' },
  { href: '/admin/hearst/deals', label: 'Deals' },
  { href: '/admin/hearst/pipeline', label: 'Pipeline' },
  { href: '/admin/hearst/financial', label: 'Financial' },
  { href: '/admin/hearst/data-room', label: 'Data Room' },
];

function isActive(href, pathname) {
  if (href === '/admin/hearst') return pathname === '/admin/hearst';
  return pathname === href || pathname.startsWith(href + '/');
}

export function OracleBottomBar() {
  const pathname = usePathname() ?? '/admin/hearst';
  const active = NAV.find((item) => isActive(item.href, pathname));

  return (
    <>
      <span className="ct-bottom-label">● {active?.label ?? 'Oracle'}</span>
      <div className="ct-seg-track">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`ct-seg-btn${isActive(item.href, pathname) ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </>
  );
}
