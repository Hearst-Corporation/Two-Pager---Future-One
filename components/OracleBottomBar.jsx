'use client';

// OracleBottomBar — barre horizontale en bas du cockpit Hearst.
//
// ⚠ Dérogation SPEC §3 explicitement validée par Adrien (option D /cockpit-adrien fix).
// Le shell @hearst/cockpit-shell rend .ct-hub-bar « Overview » destinée au hub
// multi-produits. Oracle est un produit standalone avec 4 sous-sections internes
// (Brief / Sim / Hub / Library) — pas couvert nativement par le shell.
// La .ct-hub-bar du shell est masquée via cp-tokens.css pour éviter le doublon.
// Tokens --cp-* utilisés ici sont des alias 1:1 vers --ct-* (cf. cp-tokens.css)
// → palette respectée. À retirer si/quand le shell expose des sous-sections produit.

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

function isSectionActive(section, pathname) {
  if (section.matchExact && pathname === section.matchExact) return true;
  if (section.matchAny) {
    return section.matchAny.some(prefix =>
      pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'),
    );
  }
  return false;
}

function NavItem({ href, label, icon, active }) {
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
    <nav style={S.bar} aria-label="Hearst cockpit sections">
      <div style={S.cluster}>
        {SECTIONS.map((section) => (
          <NavItem key={section.id} {...section} active={isSectionActive(section, pathname)} />
        ))}
      </div>
    </nav>
  );
}

const S = {
  bar: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 0,
    height: 'var(--cp-bar-bottom, 64px)',
    zIndex: 30,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 24px',
    background: 'var(--cp-surface-1, var(--cp-surface-2))',
    borderTop: '1px solid var(--cp-border)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  },
  cluster: {
    display: 'flex',
    gap: 4,
    padding: 4,
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 999,
    pointerEvents: 'auto',
  },
  item: {
    height: 44,
    minWidth: 88,
    padding: '0 16px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    color: 'var(--cp-text-muted)',
    borderRadius: 999,
    transition: 'color 150ms, background 150ms',
    textDecoration: 'none',
  },
  itemActive: {
    color: 'var(--cp-text-strong)',
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
  },
  itemLabel: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    lineHeight: 1,
  },
};
