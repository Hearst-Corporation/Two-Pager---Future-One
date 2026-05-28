'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Avatar from './Avatar';
import { getBrowserClient } from '@/lib/supabase-browser';
import {
  HomeIcon, TodayIcon, PipelineIcon, RoadmapIcon, PartnersIcon, TeamIcon, HearstIcon,
  BellIcon, LogOutIcon, ChevronLeftIcon, BrandMark,
} from './AdminIcons';

const W_COLLAPSED = 64;
const W_EXPANDED  = 232;
const LS_KEY      = 'admin.sidebar.collapsed';

const SIDEBAR_CSS = `
.as-item, .as-iconbtn { position: relative; }
.as-item:hover { background: var(--color-bg-secondary); }
.as-item:hover .as-tooltip { opacity: 1; transform: translateX(0); }
.as-iconbtn:hover { background: var(--color-bg-secondary); }
.as-iconbtn:hover .as-tooltip { opacity: 1; transform: translateX(0); }
.as-tooltip {
  position: absolute; left: calc(100% + 10px); top: 50%;
  transform: translate(-4px, -50%); pointer-events: none;
  background: var(--color-gray-900); color: var(--color-text-inverse);
  font-size: 11px; font-weight: 600; letter-spacing: 0.3px;
  padding: 5px 10px; border-radius: 5px; white-space: nowrap;
  opacity: 0; transition: opacity .14s ease, transform .14s ease; z-index: 60;
  box-shadow: 0 6px 24px color-mix(in srgb, var(--color-gray-900) 20%, transparent);
}
.as-tooltip::before {
  content: ""; position: absolute; left: -3px; top: 50%; margin-top: -3px;
  width: 6px; height: 6px; background: var(--color-gray-900); transform: rotate(45deg);
}
.as-active-bar {
  position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
  background: var(--color-accent-strong); border-radius: 0 3px 3px 0;
}
`;

const NAV = [
  { href: '/admin',          label: 'Home',     Icon: HomeIcon,     match: (p) => p === '/admin' },
  { href: '/admin/today',    label: 'Today',    Icon: TodayIcon,    match: (p) => p.startsWith('/admin/today') },
  { href: '/admin/pipeline', label: 'Pipeline', Icon: PipelineIcon, match: (p) => p.startsWith('/admin/pipeline') || p.startsWith('/admin/operator') },
  { href: '/admin/roadmap',  label: 'Roadmap',  Icon: RoadmapIcon,  match: (p) => p.startsWith('/admin/roadmap') || p.startsWith('/admin/initiative') },
  { href: '/admin/partners', label: 'Partners', Icon: PartnersIcon, match: (p) => p.startsWith('/admin/partners') || p.startsWith('/admin/partner') },
  { href: '/admin/team',     label: 'Team',     Icon: TeamIcon,     match: (p) => p.startsWith('/admin/team') },
  { href: '/admin/hearst',   label: 'HEARST',   Icon: HearstIcon,   match: (p) => p.startsWith('/admin/hearst'), accent: true },
];

export default function AdminSidebar({ me }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const [meOpen, setMeOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Le cockpit /admin/hearst/* a sa propre nav (HearstLeftRail + OracleBottomBar).
  // Masquer la sidebar globale pour éviter le doublon visuel signalé par l'utilisateur.
  // (Early return APRÈS tous les hooks pour respecter les règles React.)
  const inCockpit = pathname?.startsWith('/admin/hearst');

  // Read collapsed pref from localStorage post-mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
    try {
      const v = localStorage.getItem(LS_KEY);
      if (v === '1') setCollapsed(true);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try { localStorage.setItem(LS_KEY, collapsed ? '1' : '0'); } catch { /* ignore */ }
  }, [collapsed, mounted]);

  // Poll notifications
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch('/api/admin/notifications?unread=1&limit=1', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setUnread(j.unread || 0);
      } catch { /* ignore */ }
    }
    tick();
    const t = setInterval(tick, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  async function signOut() {
    const supa = getBrowserClient();
    await supa.auth.signOut();
    await fetch('/api/admin/login', { method: 'DELETE' });
    window.location.href = '/admin/login';
  }

  const W = collapsed ? W_COLLAPSED : W_EXPANDED;

  if (inCockpit) return null;

  return (
    <>
      {/* Hover styles — dangerouslySetInnerHTML to avoid hydration mismatch on quote escaping */}
      <style dangerouslySetInnerHTML={{ __html: SIDEBAR_CSS }} />

      <aside
        style={{ ...S.sidebar, width: W }}
        aria-label="Admin navigation"
      >
        {/* Brand */}
        <Link href="/admin" style={S.brand}>
          <div style={S.brandMarkWrap}>
            <BrandMark size={32} />
          </div>
          {!collapsed && (
            <div style={S.brandWordmark}>
              <span style={S.brandFutur}>FUTUR</span>
              <span style={S.brandOne}>ONE</span>
              <span style={S.brandX}>×</span>
              <span style={S.brandMisa}>MISA</span>
            </div>
          )}
        </Link>

        <div style={S.divider} />

        {/* Main navigation */}
        <nav style={S.nav}>
          {NAV.map(({ href, label, Icon, match, accent }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className="as-item"
                style={{
                  ...S.item,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  color: active
                    ? (accent ? 'var(--color-accent-strong)' : 'var(--color-text-primary)')
                    : 'var(--color-text-muted)',
                  background: active ? 'var(--color-bg-secondary)' : 'transparent',
                }}
              >
                {active && <span className="as-active-bar" />}
                <Icon />
                {!collapsed && <span style={S.itemLabel}>{label}</span>}
                {collapsed && <span className="as-tooltip">{label}</span>}
              </Link>
            );
          })}
        </nav>

        <div style={{ flex: 1 }} />

        {/* Bottom — bell + avatar + collapse */}
        <div style={S.divider} />

        <Link
          href="/admin/notifications"
          className="as-iconbtn"
          style={{
            ...S.bottomItem,
            justifyContent: collapsed ? 'center' : 'flex-start',
            color: pathname.startsWith('/admin/notifications')
              ? 'var(--color-text-primary)'
              : 'var(--color-text-muted)',
          }}
          aria-label="Notifications"
        >
          <div style={S.bellWrap}>
            <BellIcon />
            {unread > 0 && <span style={S.bellBadge}>{unread > 99 ? '99+' : unread}</span>}
          </div>
          {!collapsed && <span style={S.itemLabel}>Notifications</span>}
          {collapsed && <span className="as-tooltip">Notifications{unread > 0 ? ` · ${unread}` : ''}</span>}
        </Link>

        <button
          onClick={() => setMeOpen(v => !v)}
          className="as-iconbtn"
          style={{
            ...S.bottomItem,
            justifyContent: collapsed ? 'center' : 'flex-start',
            background: meOpen ? 'var(--color-bg-secondary)' : 'transparent',
            border: 0, width: '100%', cursor: 'pointer', textAlign: 'left',
          }}
          aria-haspopup="menu"
          aria-expanded={meOpen}
        >
          <Avatar profile={me} size={26} />
          {!collapsed && (
            <span style={{ ...S.itemLabel, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <span style={S.meName}>{me?.full_name?.split(' ')[0] || 'Account'}</span>
              <span style={S.meRole}>{me?.role || 'viewer'}</span>
            </span>
          )}
          {collapsed && <span className="as-tooltip">{me?.full_name || 'Account'}</span>}
        </button>

        {meOpen && (
          <div style={{ ...S.meMenu, left: W + 6 }} onMouseLeave={() => setMeOpen(false)}>
            <div style={S.meMenuHead}>
              <Avatar profile={me} size={38} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  {me?.full_name || '—'}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{me?.email}</div>
                {me?.role && (
                  <div style={S.meRoleChip}>{me.role.toUpperCase()}</div>
                )}
              </div>
            </div>
            <Link href="/admin/hearst/profile" style={S.meItem} onClick={() => setMeOpen(false)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.5"/><path d="M2.5 13.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              <span>Profile</span>
            </Link>
            <Link href="/admin/team" style={S.meItem} onClick={() => setMeOpen(false)}>
              <TeamIcon /><span>Team</span>
            </Link>
            <Link href="/admin/notifications" style={S.meItem} onClick={() => setMeOpen(false)}>
              <BellIcon /><span>Notifications</span>
            </Link>
            <button onClick={signOut} style={{ ...S.meItem, ...S.meItemDanger, background: 'transparent', border: 0, cursor: 'pointer', width: '100%', textAlign: 'left' }}>
              <LogOutIcon /><span>Sign out</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setCollapsed(v => !v)}
          className="as-iconbtn"
          style={{
            ...S.collapseBtn,
            justifyContent: collapsed ? 'center' : 'flex-end',
          }}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform .2s ease',
              color: 'var(--color-text-muted)',
            }}
          >
            <ChevronLeftIcon />
          </span>
          {collapsed && <span className="as-tooltip">Expand sidebar</span>}
        </button>
      </aside>

      {/* Spacer to offset page content from the fixed sidebar */}
      <div style={{ width: W, flexShrink: 0, transition: 'width .2s ease' }} aria-hidden />
    </>
  );
}

const S = {
  sidebar: {
    position: 'fixed',
    top: 0, left: 0, bottom: 0,
    background: 'var(--color-surface)',
    borderRight: '1px solid var(--color-border-light)',
    display: 'flex', flexDirection: 'column',
    padding: '14px 8px',
    zIndex: 50,
    transition: 'width .2s ease',
    overflow: 'visible',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '6px 6px', textDecoration: 'none',
    borderRadius: 6,
  },
  brandMarkWrap: {
    flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  },
  brandWordmark: { display: 'flex', alignItems: 'baseline', gap: 5, minWidth: 0 },
  brandFutur: { fontSize: 12, fontWeight: 800, letterSpacing: 2, color: 'var(--color-accent-strong)' },
  brandOne:   { fontSize: 12, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-primary)' },
  brandX:     { fontSize: 11, color: 'var(--color-text-muted)', margin: '0 1px' },
  brandMisa:  { fontSize: 11, fontWeight: 700, letterSpacing: 1.4, color: 'var(--color-text-muted)' },

  divider: {
    height: 1,
    background: 'var(--color-border-light)',
    margin: '12px 4px',
  },

  nav: {
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  item: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 12px',
    minHeight: 38,
    borderRadius: 6,
    textDecoration: 'none',
    fontSize: 13, fontWeight: 600,
    letterSpacing: 0.1,
    transition: 'background .12s ease, color .12s ease',
  },
  itemLabel: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },

  bottomItem: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '9px 12px',
    minHeight: 38,
    borderRadius: 6,
    textDecoration: 'none',
    fontSize: 13, fontWeight: 600,
    color: 'var(--color-text-muted)',
    transition: 'background .12s ease',
  },
  bellWrap: { position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  bellBadge: {
    position: 'absolute',
    top: -4, right: -6,
    minWidth: 16, height: 16, padding: '0 4px',
    background: 'var(--color-accent-strong)', color: 'var(--color-text-inverse)',
    fontSize: 9, fontWeight: 800,
    borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    lineHeight: 1,
  },
  meName: { fontSize: 13, fontWeight: 700, color: 'var(--color-text-primary)' },
  meRole: { fontSize: 10, fontWeight: 700, letterSpacing: 1.2, color: 'var(--color-text-muted)', textTransform: 'uppercase' },

  meMenu: {
    position: 'fixed',
    bottom: 80,
    minWidth: 260,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    borderRadius: 8,
    boxShadow: '0 20px 50px color-mix(in srgb, var(--color-gray-900) 18%, transparent)',
    padding: 8,
    zIndex: 60,
  },
  meMenuHead: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '8px 10px 12px',
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: 6,
  },
  meRoleChip: {
    display: 'inline-block',
    marginTop: 4,
    fontSize: 9, fontWeight: 800, letterSpacing: 1.2,
    color: 'var(--color-accent-strong)',
    background: 'var(--color-bg-secondary)',
    padding: '1px 6px', borderRadius: 3,
  },
  meItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '8px 10px', borderRadius: 5,
    fontSize: 13, fontWeight: 600,
    color: 'var(--color-text-primary)',
    textDecoration: 'none',
  },
  meItemDanger: { color: 'var(--color-accent-strong)' },

  collapseBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px',
    minHeight: 36,
    borderRadius: 6,
    background: 'transparent',
    border: 0,
    cursor: 'pointer',
    marginTop: 4,
  },
};
