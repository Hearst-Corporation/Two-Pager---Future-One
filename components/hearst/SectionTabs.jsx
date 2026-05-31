'use client';

// SectionTabs — barre de tabs internes selon la section du cockpit Hearst.
// À placer en haut de chaque page du hub correspondant.
//
// Usage : <SectionTabs section="modeling" />
//                       "modeling" | "hub" | "library"

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTION_TABS = {
  modeling: [
    { href: '/admin/hearst/simulator',   label: 'Simulator' },
    { href: '/admin/hearst/engine',      label: 'Engine' },
    { href: '/admin/hearst/scenarios',   label: 'Scenarios' },
    { href: '/admin/hearst/financial',   label: 'Financial' },
    { href: '/admin/hearst/assumptions', label: 'Assumptions' },
  ],
  hub: [
    { href: '/admin/hearst/pipeline',  label: 'Pipeline' },
    { href: '/admin/hearst/deals',     label: 'Deals' },
    { href: '/admin/hearst/contracts', label: 'Contracts' },
    { href: '/admin/hearst/data-room', label: 'Data Room' },
  ],
  library: [
    { href: '/admin/hearst/sources',   label: 'Sources' },
    { href: '/admin/hearst/reports',   label: 'Reports' },
    { href: '/admin/hearst/documents', label: 'Exports' },
    { href: '/admin/hearst/timeline',  label: 'Timeline' },
    { href: '/admin/hearst/risks',     label: 'Risks' },
    { href: '/admin/hearst/audit',     label: 'Changelog' },
  ],
};

export default function SectionTabs({ section }) {
  const pathname = usePathname();
  const tabs = SECTION_TABS[section];
  if (!tabs) return null;

  return (
    <nav aria-label={`${section} sub-navigation`} style={S.wrap}>
      {tabs.map(tab => {
        const active = pathname === tab.href || pathname?.startsWith(tab.href + '/');
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            style={{ ...S.pill, ...(active ? S.pillActive : {}) }}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

const S = {
  wrap: {
    display: 'flex',
    gap: 'var(--cp-space-1)',
    padding: 'var(--cp-space-1)',
    background: 'var(--cp-surface-0)',
    border: '1px solid var(--cp-border)',
    borderRadius: 'var(--cp-radius-pill)',
    overflowX: 'auto',
    whiteSpace: 'nowrap',
    scrollbarWidth: 'thin',
    WebkitOverflowScrolling: 'touch',
    alignSelf: 'flex-start',
  },
  pill: {
    display: 'inline-flex',
    alignItems: 'center',
    height: 40,
    padding: '0 var(--cp-space-4)',
    fontSize: 'var(--cp-font-base)',
    fontWeight: 700,
    letterSpacing: 0.3,
    color: 'var(--cp-text-muted)',
    background: 'transparent',
    borderRadius: 'var(--cp-radius-pill)',
    textDecoration: 'none',
    transition: 'background 0.15s ease, color 0.15s ease',
    flexShrink: 0,
  },
  pillActive: {
    background: 'var(--cp-accent-maroon, var(--cp-accent))',
    color: 'var(--cp-text-strong)',
  },
};
