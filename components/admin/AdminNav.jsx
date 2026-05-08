'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import Avatar from './Avatar';
import { getBrowserClient } from '@/lib/supabase-browser';

// Navigation simplifiée - 6 items max pour une UX claire
// Activity supprimé (intégré dans Today et les pages de détail)
const ITEMS = [
  { href: '/admin', label: 'Home', match: (p) => p === '/admin' },
  { href: '/admin/today', label: 'Today', match: (p) => p.startsWith('/admin/today') },
  { href: '/admin/pipeline', label: 'Pipeline', match: (p) => p.startsWith('/admin/pipeline') || p.startsWith('/admin/operator') },
  { href: '/admin/roadmap', label: 'Roadmap', match: (p) => p.startsWith('/admin/roadmap') || p.startsWith('/admin/initiative') },
  { href: '/admin/partners', label: 'Partners', match: (p) => p.startsWith('/admin/partners') || p.startsWith('/admin/partner') },
  { href: '/admin/team', label: 'Team', match: (p) => p.startsWith('/admin/team') },
];

export default function AdminNav({ me }) {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);
  const [meOpen, setMeOpen] = useState(false);

  // Poll unread count every 30s; cheap, avoids websockets for now.
  useEffect(() => {
    let cancelled = false;
    async function tick() {
      try {
        const res = await fetch('/api/admin/notifications?unread=1&limit=1', { cache: 'no-store' });
        if (!res.ok) return;
        const j = await res.json();
        if (!cancelled) setUnread(j.unread || 0);
      } catch {
        /* ignore */
      }
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

  return (
    <nav style={S.nav}>
      <div style={S.brand}>
        <Link href="/admin" style={S.brandLink}>
          <span style={S.brandFutur}>FUTUR</span>
          <span style={S.brandOne}>ONE</span>
          <span style={S.brandX}>×</span>
          <span style={S.brandMisa}>MISA</span>
        </Link>
      </div>

      <div style={S.items}>
        {ITEMS.map((it) => {
          const active = it.match(pathname);
          return (
            <Link
              key={it.href}
              href={it.href}
              style={{
                ...S.item,
                color: active ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                borderBottomColor: active ? 'var(--color-accent-strong)' : 'transparent',
              }}
            >
              {it.label}
            </Link>
          );
        })}
      </div>

      <div style={S.right}>
        <Link href="/admin/notifications" style={S.bell} aria-label="Notifications">
          <BellIcon />
          {unread > 0 && <span style={S.bellBadge}>{unread > 99 ? '99+' : unread}</span>}
        </Link>

        <button onClick={() => setMeOpen((v) => !v)} style={S.meBtn} aria-haspopup="menu">
          <Avatar profile={me} size={32} />
        </button>

        {meOpen && (
          <div style={S.meMenu} onMouseLeave={() => setMeOpen(false)}>
            <div style={S.meMenuHead}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{me?.full_name || '—'}</div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>{me?.email}</div>
              {me?.role && (
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1.5, color: 'var(--color-accent-strong)', marginTop: 6 }}>
                  {me.role.toUpperCase()}
                </div>
              )}
            </div>
            <Link href="/admin/team" style={S.meItem}>Team</Link>
            <Link href="/admin/notifications" style={S.meItem}>Notifications</Link>
            <button onClick={signOut} style={{ ...S.meItem, ...S.meItemDanger }}>Sign out</button>
          </div>
        )}
      </div>
    </nav>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </svg>
  );
}

const S = {
  nav: {
    position: 'sticky',
    top: 0,
    zIndex: 50,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    gap: 24,
    padding: '0 32px',
    background: 'color-mix(in srgb, var(--color-bg-main) 92%, transparent)',
    backdropFilter: 'blur(8px)',
    borderBottom: '1px solid var(--color-border-light)',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  brand: { display: 'flex', alignItems: 'center', minWidth: 180 },
  brandLink: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 6,
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
  },
  brandFutur: { fontSize: 13, fontWeight: 800, letterSpacing: 2, color: 'var(--color-accent-strong)' },
  brandOne: { fontSize: 13, fontWeight: 800, letterSpacing: 2, color: 'var(--color-text-primary)' },
  brandX: { fontSize: 12, color: 'var(--color-text-muted)', margin: '0 2px' },
  brandMisa: { fontSize: 12, fontWeight: 700, letterSpacing: 1.5, color: 'var(--color-text-muted)' },

  items: { display: 'flex', alignItems: 'stretch', gap: 4, height: '100%', flex: 1 },
  item: {
    padding: '0 14px',
    height: '100%',
    display: 'inline-flex',
    alignItems: 'center',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: 0.2,
    textDecoration: 'none',
    borderBottom: '2px solid transparent',
    transition: 'color .12s ease, border-color .12s ease',
  },

  right: { display: 'flex', alignItems: 'center', gap: 12, position: 'relative' },
  bell: {
    position: 'relative',
    width: 36,
    height: 36,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--color-text-secondary)',
    textDecoration: 'none',
    border: '1px solid transparent',
    borderRadius: 4,
  },
  bellBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    padding: '0 4px',
    background: 'var(--color-accent-strong)',
    color: '#fff',
    fontSize: 10,
    fontWeight: 800,
    borderRadius: 8,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
  },
  meBtn: { background: 'transparent', border: 0, padding: 0, cursor: 'pointer' },
  meMenu: {
    position: 'absolute',
    top: 'calc(100% + 6px)',
    right: 0,
    minWidth: 220,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    boxShadow: '0 12px 30px color-mix(in srgb, var(--color-gray-900) 18%, transparent)',
    padding: 6,
    zIndex: 60,
    fontFamily: 'inherit',
  },
  meMenuHead: { padding: '8px 10px', borderBottom: '1px solid var(--color-border-light)', marginBottom: 6 },
  meItem: {
    display: 'block',
    width: '100%',
    textAlign: 'left',
    padding: '8px 10px',
    border: 0,
    background: 'transparent',
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--color-text-primary)',
    textDecoration: 'none',
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  meItemDanger: { color: 'var(--color-accent-strong)' },
};
