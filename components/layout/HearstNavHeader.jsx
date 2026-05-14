'use client';
/* ============================================================
   OPENCLAW · HEARST NAV HEADER
   ------------------------------------------------------------
   Top navigation bar for the HEARST module.
   Primary tabs + secondary tabs. Dark premium style.
   Fixed height, sits above the three-panel workspace.
   ============================================================ */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getIconByKey } from '@/components/admin/AdminIcons';
import { PRIMARY_NAV, SECONDARY_LINKS, findPrimaryByPath, getPrimaryHref } from '@/lib/design-system/navigation';
import { BG, CARD, TEXT, SP, T, W, LS, BORDER, ACCENT } from '@/lib/design-system/tokens';

export default function HearstNavHeader() {
  const pathname = usePathname();
  const primary = findPrimaryByPath(pathname);
  const childrenTabs = primary?.children || [];
  const showSecondary = childrenTabs.length > 0;
  const about = SECONDARY_LINKS.find(s => s.id === 'about');
  const AboutIcon = about && getIconByKey(about.iconKey);

  return (
    <div style={S.header}>
      <div style={S.topRow}>
        <div style={S.brand}>
          <span style={S.badge}>HEARST</span>
          <div>
            <div style={S.title}>Qatar AI &amp; Data Center Hub</div>
            <div style={S.subtitle}>Source-Backed Evidence Mode</div>
          </div>
        </div>
        {about && (
          <Link href={about.href} style={S.headerLink} title={about.label}>
            {AboutIcon && <AboutIcon width={14} height={14} />}
            <span style={S.headerLinkLabel}>{about.label}</span>
          </Link>
        )}
      </div>

      <div style={S.primaryNav}>
        {PRIMARY_NAV.map(p => {
          const active = p.id === primary?.id;
          const Icon = getIconByKey(p.iconKey);
          const href = getPrimaryHref(p);
          return (
            <Link
              key={p.id}
              href={href}
              style={{ ...S.primaryTab, ...(active ? S.primaryTabActive : {}) }}
            >
              {Icon && (
                <span style={{ ...S.tabIcon, color: active ? ACCENT.main : TEXT.muted }}>
                  <Icon width={14} height={14} />
                </span>
              )}
              <span>{p.label}</span>
              {active && <span style={S.activeIndicator} />}
            </Link>
          );
        })}
      </div>

      {showSecondary && (
        <div style={S.secondaryNav}>
          <div style={S.secondaryTabs}>
            {childrenTabs.map(c => {
              const active = pathname.startsWith(c.href);
              const Icon = getIconByKey(c.iconKey);
              return (
                <Link
                  key={c.href}
                  href={c.href}
                  style={{ ...S.secondaryTab, ...(active ? S.secondaryTabActive : {}) }}
                >
                  {Icon && (
                    <span style={{ ...S.tabIcon, color: active ? ACCENT.main : TEXT.muted }}>
                      <Icon width={13} height={13} />
                    </span>
                  )}
                  <span>{c.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const S = {
  header: {
    flexShrink: 0,
    background: `linear-gradient(180deg, ${BG.elevated} 0%, ${BG.surface} 100%)`,
    borderBottom: `1px solid ${BORDER.color}`,
    padding: `${SP[4]}px ${SP[5]}px 0`,
  },
  topRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: `${SP[4]}px`,
    paddingBottom: `${SP[4]}px`,
    flexWrap: 'wrap',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: `${SP[4]}px`,
    minWidth: 0,
  },
  badge: {
    background: `linear-gradient(135deg, ${ACCENT.main} 0%, ${ACCENT.strong} 100%)`,
    color: TEXT.inverse,
    fontSize: T.mini,
    fontWeight: W.black,
    letterSpacing: LS.capsMax,
    padding: `${SP[1]}px ${SP[3]}px`,
    borderRadius: 4,
    flexShrink: 0,
    boxShadow: `0 0 12px ${ACCENT.glow}`,
  },
  title: {
    fontSize: T.h3,
    fontWeight: W.heavy,
    color: TEXT.primary,
    letterSpacing: LS.tight,
  },
  subtitle: {
    fontSize: T.caption,
    color: TEXT.muted,
    fontStyle: 'italic',
    marginTop: 1,
  },
  headerLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
    color: TEXT.muted,
    fontSize: T.caption,
    fontWeight: W.bold,
    letterSpacing: LS.loose,
    padding: `${SP[1]}px ${SP[2]}px`,
    borderRadius: 4,
    textDecoration: 'none',
    transition: 'color 0.12s ease',
  },
  headerLinkLabel: {
    whiteSpace: 'nowrap',
  },
  primaryNav: {
    display: 'flex',
    alignItems: 'stretch',
    gap: `${SP[1]}px`,
    margin: `0 -${SP[2]}px`,
  },
  primaryTab: {
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
    padding: `${SP[2]}px ${SP[3]}px ${SP[3]}px`,
    fontSize: T.body,
    fontWeight: W.semibold,
    letterSpacing: LS.loose,
    color: TEXT.muted,
    textDecoration: 'none',
    borderRadius: `${CARD.radiusSm}px ${CARD.radiusSm}px 0 0`,
    whiteSpace: 'nowrap',
    transition: 'color 0.12s ease, background 0.12s ease',
  },
  primaryTabActive: {
    color: TEXT.primary,
    fontWeight: W.bold,
    background: 'rgba(255, 255, 255, 0.04)',
  },
  tabIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    height: 2,
    background: ACCENT.main,
    borderRadius: '2px 2px 0 0',
    boxShadow: `0 0 8px ${ACCENT.glow}`,
  },
  secondaryNav: {
    background: BG.surface,
    borderTop: `1px solid ${BORDER.color}`,
    margin: `0 -${SP[5]}px`,
    paddingLeft: `${SP[5]}px`,
    overflowX: 'auto',
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  secondaryTabs: {
    display: 'flex',
    alignItems: 'stretch',
    gap: 0,
    height: 40,
    width: 'max-content',
  },
  secondaryTab: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: `${SP[2]}px`,
    padding: `0 ${SP[3]}px`,
    fontSize: T.small,
    fontWeight: W.semibold,
    letterSpacing: LS.loose,
    color: TEXT.muted,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    borderBottom: '2px solid transparent',
    transition: 'color 0.12s ease, border-color 0.12s ease',
  },
  secondaryTabActive: {
    color: TEXT.primary,
    fontWeight: W.bold,
    borderBottomColor: ACCENT.main,
  },
};
