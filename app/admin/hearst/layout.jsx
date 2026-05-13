'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { getIconByKey } from '@/components/admin/AdminIcons';
import { PRIMARY_NAV, SECONDARY_LINKS, findPrimaryByPath, getPrimaryHref } from '@/lib/hearst-nav';
import AdvisorMount from '@/components/hearst/AdvisorMount';

const NAV_CSS = `
.hearst-primary-tab { transition: color .12s ease, background .12s ease; }
.hearst-primary-tab:hover { color: var(--color-text-primary); background: rgba(255,255,255,0.05); }
.hearst-secondary-tab:hover { color: var(--color-text-primary); }
.hearst-secondary-tab:hover .hearst-tab-icon { color: var(--color-text-primary); }
.hearst-secondary-nav::-webkit-scrollbar { display: none; }
.hearst-header-link { transition: color .12s ease; }
.hearst-header-link:hover { color: var(--color-text-inverse); }
`;

export default function HearstLayout({ children }) {
  const pathname = usePathname();
  const primary = findPrimaryByPath(pathname);
  const children_tabs = primary?.children || [];
  const showSecondary = children_tabs.length > 0;
  const about = SECONDARY_LINKS.find(s => s.id === 'about');
  const audit = SECONDARY_LINKS.find(s => s.id === 'audit');
  const AboutIcon = about && getIconByKey(about.iconKey);

  return (
    <div style={S.wrap}>
      <style dangerouslySetInnerHTML={{ __html: NAV_CSS }} />

      {/* Module header — premium dark gradient + primary nav inline */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.brandBlock}>
            <span style={S.badge}>HEARST</span>
            <div>
              <div style={S.title}>Qatar AI &amp; Data Center Hub</div>
              <div style={S.subtitle}>Source-Backed Evidence Mode</div>
            </div>
          </div>
          {about && (
            <Link
              href={about.href}
              className="hearst-header-link"
              style={S.headerLink}
              title={about.label}
            >
              {AboutIcon && <AboutIcon width="16" height="16" />}
              <span style={S.headerLinkLabel}>{about.label}</span>
            </Link>
          )}
        </div>

        {/* Primary nav — 5 grouped tabs */}
        <div style={S.primaryNav}>
          {PRIMARY_NAV.map(p => {
            const active = p.id === primary?.id;
            const Icon = getIconByKey(p.iconKey);
            const href = getPrimaryHref(p);
            return (
              <Link
                key={p.id}
                href={href}
                className="hearst-primary-tab"
                style={{ ...S.primaryTab, ...(active ? S.primaryTabActive : {}) }}
              >
                {Icon && <span style={S.primaryIcon}><Icon width="16" height="16" /></span>}
                <span>{p.label}</span>
                {active && <span style={S.primaryIndicator} />}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Contextual secondary nav (appears only when primary group has children) */}
      {showSecondary && (
        <div style={S.secondaryNav} className="hearst-secondary-nav">
          <div style={S.secondaryTabs}>
            {children_tabs.map(c => {
              const active = pathname.startsWith(c.href);
              const Icon = getIconByKey(c.iconKey);
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  className="hearst-secondary-tab"
                  style={{ ...S.secondaryTab, ...(active ? S.secondaryTabActive : {}) }}
                >
                  {Icon && (
                    <span
                      className="hearst-tab-icon"
                      style={{ color: active ? 'var(--color-accent-strong)' : 'var(--color-text-muted)' }}
                    >
                      <Icon width="14" height="14" />
                    </span>
                  )}
                  <span>{c.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Page content */}
      <div style={S.content}>{children}</div>

      {/* Footer — small Audit trail link */}
      {audit && (
        <div style={S.footer}>
          <Link href={audit.href} className="hearst-header-link" style={S.footerLink}>
            {audit.label} →
          </Link>
        </div>
      )}

      {/* Floating AI Advisor — available on every HEARST tab, page-context aware */}
      <AdvisorMount />
    </div>
  );
}

const S = {
  wrap: { display: 'flex', flexDirection: 'column', minHeight: '100vh' },

  header: {
    background: 'linear-gradient(135deg, var(--color-gray-900) 0%, var(--color-gray-800) 100%)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '20px 32px 0',
  },
  headerTop: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    paddingBottom: 18,
    flexWrap: 'wrap',
  },
  brandBlock: { display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 },
  badge: {
    background: 'var(--color-accent-strong)',
    color: 'var(--color-text-inverse)',
    fontSize: 10,
    fontWeight: 900,
    letterSpacing: 2.4,
    padding: '4px 11px',
    borderRadius: 3,
    flexShrink: 0,
  },
  title: {
    fontSize: 19,
    fontWeight: 800,
    color: 'var(--color-text-inverse)',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.45)',
    fontStyle: 'italic',
    marginTop: 1,
  },
  headerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 0.3,
    padding: '6px 10px',
    borderRadius: 4,
    textDecoration: 'none',
  },
  headerLinkLabel: { whiteSpace: 'nowrap' },

  primaryNav: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 4,
    margin: '0 -8px',
    paddingBottom: 0,
  },
  primaryTab: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '10px 14px 12px',
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 0.1,
    color: 'rgba(255,255,255,0.55)',
    textDecoration: 'none',
    borderRadius: 6,
    whiteSpace: 'nowrap',
  },
  primaryTabActive: {
    color: 'var(--color-text-inverse)',
    fontWeight: 700,
    background: 'rgba(255,255,255,0.06)',
  },
  primaryIcon: { display: 'inline-flex', alignItems: 'center', justifyContent: 'center' },
  primaryIndicator: {
    position: 'absolute',
    left: 12, right: 12, bottom: -1,
    height: 2,
    background: 'var(--color-accent-strong)',
    borderRadius: 2,
  },

  secondaryNav: {
    background: 'var(--color-surface)',
    borderBottom: '1px solid var(--color-border-light)',
    paddingLeft: 32,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  secondaryTabs: { display: 'flex', alignItems: 'stretch', gap: 0, height: 40, width: 'max-content' },
  secondaryTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '0 14px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: 0.1,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid transparent',
    transition: 'color .12s ease, border-color .12s ease',
  },
  secondaryTabActive: {
    color: 'var(--color-text-primary)',
    fontWeight: 700,
    borderBottomColor: 'var(--color-accent-strong)',
  },

  content: {
    flex: 1,
    padding: '28px 32px',
    background: 'var(--color-bg-main)',
  },

  footer: {
    padding: '14px 32px 18px',
    borderTop: '1px solid var(--color-border-light)',
    background: 'var(--color-surface)',
  },
  footerLink: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.3,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
  },
};
