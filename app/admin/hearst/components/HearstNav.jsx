'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../hearst.module.css';

const LINKS = [
  { href: '/admin/hearst', label: 'Overview', exact: true },
  { href: '/admin/hearst/simulator', label: 'Projection' },
  { href: '/admin/hearst/sources', label: 'Sources' },
  { href: '/admin/hearst/financial', label: 'Financial' },
  { href: '/admin/hearst/deals', label: 'Deals' },
  { href: '/admin/hearst/workspace', label: 'Workspace' },
  { href: '/admin/hearst/dossier', label: 'Dossier' },
];

export default function HearstNav() {
  const pathname = usePathname();

  return (
    <nav className={styles.nav} aria-label="Hearst Oracle sections">
      <Link href="/admin/hearst" className={styles.navBrand}>
        FUTUR ONE
        <span className={styles.navMeta}>Hearst Qatar AI Infrastructure</span>
      </Link>

      <ul className={styles.navLinks}>
        {LINKS.map(({ href, label, exact }, idx) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={styles.navLink}
                data-active={active}
                aria-current={active ? 'page' : undefined}
              >
                <span className={styles.navLinkIndex}>0{idx + 1}</span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className={styles.navStatus}>
        <div className={styles.navStatusItem}>
          <span className={styles.liveDotActive}></span>
          LIVE
        </div>
        <div className={styles.navStatusItem}>
          QATAR_DC_01
        </div>
      </div>
    </nav>
  );
}
