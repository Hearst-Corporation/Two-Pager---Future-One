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
    id: 'sim',
    href: '/admin/hearst/simulator',
    label: 'Simulator',
    matchAny: ['/admin/hearst/simulator'],
  },
  {
    id: 'financial',
    href: '/admin/hearst/financial',
    label: 'Financial',
    matchAny: ['/admin/hearst/financial'],
  },
  {
    id: 'workspace',
    href: '/admin/hearst/workspace',
    label: 'Workspace',
    matchAny: ['/admin/hearst/workspace'],
  },
  {
    id: 'dossier',
    href: '/admin/hearst/dossier',
    label: 'Dossier',
    matchAny: ['/admin/hearst/dossier'],
  },
  {
    id: 'sources',
    href: '/admin/hearst/sources',
    label: 'Sources',
    matchAny: ['/admin/hearst/sources'],
  },
];

function isSectionActive(section, pathname) {
  return section.matchAny.some(prefix =>
    pathname === prefix || pathname.startsWith(prefix + '/') || pathname.startsWith(prefix + '?'),
  );
}

export function OracleBottomBar() {
  const pathname = usePathname() ?? '/admin/hearst/simulator';

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
