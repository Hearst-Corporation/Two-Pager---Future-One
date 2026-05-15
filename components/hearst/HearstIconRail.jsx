'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getIconByKey } from '@/components/admin/AdminIcons';

const RAIL_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    iconKey: 'home',    href: '/admin/hearst' },
  { id: 'health-check', label: 'Health Check', iconKey: 'chart',   href: '/admin/hearst?view=health' },
  { id: 'alerts',       label: 'Alerts',       iconKey: 'warning', href: '/admin/hearst?view=alerts', badge: 3 },
];

export default function HearstIconRail() {
  const pathname = usePathname();

  return (
    <aside aria-label="Navigation principale" style={S.outer}>
      <div className="cockpit-glass cockpit-rail-left" style={S.glass}>
        <div style={S.contentLayer}>
          <Link href="/admin/hearst" style={S.brandDot} aria-label="HEARST">
            <span style={S.brandDotInner} />
          </Link>

          {RAIL_ITEMS.map((item) => {
            const Icon = getIconByKey(item.iconKey);
            const active = item.id === 'dashboard' && pathname === '/admin/hearst';
            return (
              <Link
                key={item.id}
                href={item.href}
                title={item.label}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                className={active ? 'cockpit-btn-glass' : undefined}
                style={{ ...S.iconBtn, ...(active ? S.iconBtnActive : {}) }}
              >
                {Icon && <Icon width={16} height={16} />}
                {item.badge != null && <span style={S.badge}>{item.badge}</span>}
              </Link>
            );
          })}

          <div style={S.spacer} />

          <div style={S.avatar} title="Adrien">AB</div>
        </div>
      </div>
    </aside>
  );
}

const S = {
  outer: {
    position: 'relative',
    zIndex: 20,
    flexShrink: 0,
    width: 88,
    height: '100%',
  },
  glass: {
    height: '100%',
    width: '100%',
    borderTop: 'none',
    borderBottom: 'none',
    borderLeft: 'none',
  },
  contentLayer: {
    position: 'relative',
    zIndex: 1,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    padding: '32px 0',
  },
  brandDot: {
    width: 48,
    height: 48,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.1)',
    boxShadow:
      '0 8px 16px rgba(0, 0, 0, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.3)',
    marginBottom: 24,
    textDecoration: 'none',
  },
  brandDotInner: {
    width: 20,
    height: 20,
    borderRadius: '50%',
    background: '#ffffff',
  },
  iconBtn: {
    position: 'relative',
    width: 56,
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    color: 'rgba(245, 245, 245, 0.40)',
    textDecoration: 'none',
    transition: 'background 0.3s ease, color 0.3s ease',
  },
  iconBtnActive: {
    color: '#ffffff',
    zIndex: 10,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: '50%',
    background: '#ffffff',
    color: '#000000',
    fontSize: 9,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  spacer: { flex: 1 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    letterSpacing: 0.3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)',
  },
};
