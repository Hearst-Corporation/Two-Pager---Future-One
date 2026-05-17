'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { getIconByKey } from '@/components/admin/AdminIcons';

const RAIL_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',    iconKey: 'home',    href: '/admin/hearst' },
  { id: 'health-check', label: 'Health Check', iconKey: 'chart',   href: '/admin/hearst?view=health' },
  { id: 'alerts',       label: 'Alerts',       iconKey: 'warning', href: '/admin/hearst?view=alerts', badge: 3 },
];

function IconButton({ item, active }) {
  const [hover, setHover] = useState(false);
  const Icon = getIconByKey(item.iconKey);
  return (
    <Link
      href={item.href}
      title={item.label}
      aria-label={item.badge ? `${item.label} — ${item.badge} alertes` : item.label}
      aria-current={active ? 'page' : undefined}
      style={{
        ...S.iconBtn,
        ...(active ? S.iconBtnActive : {}),
        ...(hover && !active ? S.iconBtnHover : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {Icon && <Icon width={16} height={16} />}
      {item.badge != null && (
        <span style={S.badge} aria-hidden="true">
          {item.badge}
        </span>
      )}
    </Link>
  );
}

export default function HearstIconRail() {
  const pathname = usePathname();
  const [avatarHover, setAvatarHover] = useState(false);

  return (
    <aside aria-label="Navigation principale" style={S.outer}>
      <div className="cockpit-glass cockpit-rail-left" style={S.glass}>
        <div style={S.contentLayer}>
          <Link href="/admin/hearst" style={S.brandDot} aria-label="HEARST — Accueil">
            <Image src="/hearst-h.svg" alt="HEARST" width={46} height={50} style={S.brandLogo} />
          </Link>

          <div style={S.spacer} />

          <button
            type="button"
            style={{ ...S.avatar, ...(avatarHover ? S.avatarHover : {}) }}
            title="Adrien"
            aria-label="Profil utilisateur : Adrien"
            onMouseEnter={() => setAvatarHover(true)}
            onMouseLeave={() => setAvatarHover(false)}
          >
            AB
          </button>
        </div>
      </div>
    </aside>
  );
}

const S = {
  outer: {
    position: 'relative',
    zIndex: 'var(--cp-z-rails)',
    flexShrink: 0,
    width: 'var(--cp-rail-left)',
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
    gap: 'var(--cp-space-2)',
    padding: 'var(--cp-space-7) 0',
  },
  brandDot: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 'var(--cp-space-6)',
    textDecoration: 'none',
    transition: 'opacity var(--cp-dur-base) var(--cp-ease-out)',
  },
  brandLogo: {
    filter: 'brightness(0) invert(1)',
    display: 'block',
  },
  iconBtn: {
    position: 'relative',
    width: 'var(--cp-icon-btn-size)',
    height: 'var(--cp-icon-btn-size)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 'var(--cp-radius-lg)',
    color: 'var(--cp-text-muted)',
    textDecoration: 'none',
    transition: 'background var(--cp-dur-base) var(--cp-ease), color var(--cp-dur-base) var(--cp-ease)',
  },
  iconBtnHover: {
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-surface-2)',
  },
  iconBtnActive: {
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-surface-3)',
    zIndex: 'var(--cp-z-content)',
  },
  badge: {
    position: 'absolute',
    top: 'var(--cp-space-1)',
    right: 'var(--cp-space-1)',
    width: 'var(--cp-badge-size)',
    height: 'var(--cp-badge-size)',
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-accent-strong)',
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-micro)',
    fontWeight: 'var(--cp-weight-bold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  spacer: { flex: 1 },
  avatar: {
    width: 'var(--cp-avatar-size)',
    height: 'var(--cp-avatar-size)',
    borderRadius: 'var(--cp-radius-pill)',
    background: 'var(--cp-surface-3)',
    color: 'var(--cp-text-strong)',
    fontSize: 'var(--cp-font-base)',
    fontWeight: 'var(--cp-weight-medium)',
    letterSpacing: 'var(--cp-tracking-wide)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'var(--cp-space-3)',
    boxShadow: 'var(--cp-shadow-xs)',
    transition: 'transform var(--cp-dur-base) var(--cp-ease-out)',
    cursor: 'default',
    border: 'none',
    padding: 0,
    fontFamily: 'inherit',
  },
  avatarHover: {
    transform: 'translateY(-1px)',
  },
};
