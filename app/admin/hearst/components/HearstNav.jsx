'use client';

import { useState, useEffect } from 'react';
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
  const [isOpen, setIsOpen] = useState(false);
  const activeLink = LINKS.find(({ href, exact }) => (
    exact ? pathname === href : pathname.startsWith(href)
  ));

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Close drawer on Escape + lock background scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setIsOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.classList.add(styles.drawerLock);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove(styles.drawerLock);
    };
  }, [isOpen]);

  return (
    <>
      <nav className={styles.nav} aria-label="Hearst Oracle sections">
        <div className={styles.navBrandBlock}>
          <Link href="/admin/hearst" className={styles.navBrand}>
            FUTUR ONE
          </Link>
          <span className={styles.navMeta}>Hearst Qatar AI Infrastructure</span>
        </div>

        {/* Desktop links */}
        <ul className={styles.navLinks}>
          {LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={styles.navLink}
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Mobile hamburger */}
        <button
          className={styles.navHamburger}
          aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
          aria-expanded={isOpen}
          aria-controls="hearst-nav-drawer"
          onClick={() => setIsOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      <button
        type="button"
        className={styles.navScrim}
        data-open={isOpen}
        aria-hidden={!isOpen}
        tabIndex={isOpen ? 0 : -1}
        onClick={() => setIsOpen(false)}
      />

      {/* Mobile drawer */}
      <div
        id="hearst-nav-drawer"
        className={styles.navDrawer}
        data-open={isOpen}
        aria-hidden={!isOpen}
      >
        <div className={styles.navDrawerHead}>
          <div className={styles.navDrawerMeta}>Hearst Qatar AI Infrastructure</div>
          <div className={styles.navDrawerCurrent}>{activeLink?.label || 'Overview'}</div>
        </div>
        <ul className={styles.navDrawerLinks}>
          {LINKS.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={styles.navDrawerLink}
                  data-active={active}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setIsOpen(false)}
                >
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
}
