'use client';

// OracleBottomBar — barre de navigation du cockpit Hearst.
//
// Structure CANONIQUE du Cockpit de référence (cockpit-template.html §BOTTOM BAR) :
//   .ct-bottom-bar > .ct-bottom-bar-inner > .ct-bottom-label + .ct-seg-track > .ct-seg-btn
// Le style vit dans cp-tokens.css (porté de la référence) — aucun style inline ici.
// Les segments sont les 4 sections propres d'Oracle (pas les exemples Home/Inbox…).
//
// La .ct-hub-bar native du shell @hearst/cockpit-shell est masquée via cp-tokens.css
// pour éviter le doublon (Oracle est un produit standalone à 4 sections internes).

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SECTIONS = [
  {
    id: 'executive',
    href: '/admin/hearst/executive',
    label: 'Executive',
    matchAny: ['/admin/hearst/executive'],
  },
  {
    id: 'sim',
    href: '/admin/hearst/simulator',
    label: 'Simulator',
    matchAny: ['/admin/hearst/simulator', '/admin/hearst/engine', '/admin/hearst/scenarios', '/admin/hearst/financial', '/admin/hearst/assumptions'],
  },
  {
    id: 'hub',
    href: '/admin/hearst/hub',
    label: 'Hub',
    matchAny: ['/admin/hearst/hub', '/admin/hearst/pipeline', '/admin/hearst/deals', '/admin/hearst/contracts', '/admin/hearst/data-room'],
  },
  {
    id: 'dossier',
    href: '/admin/hearst/dossier',
    label: 'Dossier',
    matchAny: ['/admin/hearst/dossier', '/admin/hearst/library', '/admin/hearst/sources', '/admin/hearst/reports', '/admin/hearst/timeline', '/admin/hearst/risks', '/admin/hearst/audit', '/admin/hearst/documents'],
  },
];

function isSectionActive(section, pathname) {
  return section.matchAny.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'),
  );
}

export function OracleBottomBar() {
  const pathname = usePathname() ?? '/admin/hearst/executive';

  return (
    <nav className="ct-bottom-bar" aria-label="Hearst cockpit sections">
      <div className="ct-bottom-bar-inner">
        <span className="ct-bottom-label">Cockpit</span>
        <div className="ct-seg-track">
          {SECTIONS.map((section) => {
            const active = isSectionActive(section, pathname);
            return (
              <Link
                key={section.id}
                href={section.href}
                className={active ? 'ct-seg-btn active' : 'ct-seg-btn'}
                aria-current={active ? 'page' : undefined}
                title={section.label}
              >
                {section.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
