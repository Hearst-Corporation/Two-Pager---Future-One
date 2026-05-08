'use client';

import { useState } from 'react';
import Link from 'next/link';

/**
 * EntityDetail Layout - Pattern B
 * Layout standardisé pour les pages de détail (Operator, Partner, Initiative)
 *
 * Structure:
 * - TopBar: Navigation retour + actions globales
 * - Header: Tags, titre, métadonnées, assignee
 * - QuickActions: Barre d'actions rapides (toujours visible)
 * - StatusBar: Pipeline de status cliquable
 * - Content: Tabs simplifiés (max 4) + contenu
 */

export function EntityDetailLayout({
  children,
  backHref = '/admin',
  backLabel = '← BACK',
  topRightActions = null,

  // Header props
  primaryTag = null,        // { label: string, color: string }
  secondaryTag = null,      // { label: string, color?: string }
  title,
  subtitle,
  description,
  assignee = null,          // { component: ReactNode }

  // Status bar
  statusBar = null,         // ReactNode

  // Actions
  primaryAction = null,     // ReactNode
  secondaryActions = [],    // ReactNode[]

  // Tabs
  tabs = [],                // [{ id, label, badge?, content }]
  activeTab,
  onTabChange,

  // Linked items banner (optional)
  linkedItems = null,       // ReactNode
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={S.wrap}>
      {/* TOP BAR */}
      <div style={S.topbar}>
        <Link href={backHref} style={S.back}>{backLabel}</Link>
        {topRightActions && <div style={S.topRight}>{topRightActions}</div>}
      </div>

      {/* HEADER & ACTIONS */}
      <header style={S.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={S.tagsRow}>
              {primaryTag && (
                <span style={{ ...S.primaryTag, background: primaryTag.color }}>
                  {primaryTag.label}
                </span>
              )}
              {secondaryTag && (
                <span style={S.secondaryTag}>
                  {secondaryTag.label}
                </span>
              )}
              {assignee && (
                <div style={S.assigneeWrapper}>
                  <span style={S.assigneeLabel}>OWNER</span>
                  {assignee}
                </div>
              )}
            </div>

            <h1 style={S.title}>{title}</h1>
            {subtitle && <div style={S.subtitle}>{subtitle}</div>}
            {description && <p style={S.description}>{description}</p>}
          </div>

          {/* ACTIONS */}
          {(primaryAction || secondaryActions.length > 0) && (
            <div style={S.actionsWrap}>
              {primaryAction}
              {secondaryActions.length > 0 && (
                <div style={{ position: 'relative' }}>
                  <button 
                    style={S.moreBtn} 
                    onClick={() => setMenuOpen(!menuOpen)}
                    onBlur={() => setTimeout(() => setMenuOpen(false), 200)}
                  >
                    •••
                  </button>
                  {menuOpen && (
                    <div style={S.actionsMenu}>
                      {secondaryActions}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* STATUS BAR */}
      {statusBar && (
        <div style={S.statusBarSection}>{statusBar}</div>
      )}

      {/* LINKED ITEMS BANNER */}
      {linkedItems && (
        <div style={S.linkedSection}>{linkedItems}</div>
      )}

      {/* TABS NAVIGATION - Simplified (max 4) */}
      {tabs.length > 0 && (
        <>
          <div style={S.tabs}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => onTabChange?.(tab.id)}
                style={{
                  ...S.tab,
                  borderBottomColor: activeTab === tab.id ? 'var(--color-accent-strong)' : 'transparent',
                  color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                }}
              >
                {tab.label}
                {tab.badge > 0 && <span style={S.tabBadge}>{tab.badge}</span>}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div style={S.tabContent}>
            {tabs.find(t => t.id === activeTab)?.content}
          </div>
        </>
      )}

      {/* OR direct children if no tabs */}
      {tabs.length === 0 && (
        <div style={S.directContent}>{children}</div>
      )}
    </div>
  );
}

// Helper components for consistent styling
export function QuickActionButton({ children, primary = false, accent, onClick, href, target, icon = null, disabled = false }) {
  const style = {
    ...S.quickBtn,
    ...(primary ? S.quickBtnPrimary : {}),
    background: primary ? accent : 'transparent',
    borderColor: primary ? accent : 'var(--color-border-medium)',
    color: primary ? '#fff' : 'var(--color-text-primary)',
    opacity: disabled ? 0.5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    textDecoration: 'none',
  };

  const content = (
    <>
      {icon && <span style={S.quickBtnIcon}>{icon}</span>}
      <div style={S.quickBtnContent}>{children}</div>
    </>
  );

  if (href) {
    return (
      <Link href={href} target={target} rel={target === '_blank' ? 'noopener noreferrer' : undefined} style={style}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} style={style}>
      {content}
    </button>
  );
}

export function LinkedItemCard({ href, accent, code, title, status, statusColor, statusLabel }) {
  return (
    <Link href={href} style={{ ...S.linkedCard, borderLeftColor: accent }}>
      <span style={S.linkedCode}>{code}</span>
      <span style={S.linkedTitle}>{title}</span>
      {status && (
        <span style={{ ...S.linkedStatus, color: statusColor }}>
          {statusLabel || status}
        </span>
      )}
    </Link>
  );
}

const S = {
  wrap: {
    padding: '20px 40px 80px',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    color: 'var(--color-text-primary)',
    maxWidth: 1200,
    margin: '0 auto',
  },

  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 12,
    borderBottom: '1px solid var(--color-border-light)',
  },
  back: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
    textDecoration: 'none',
  },
  topRight: {
    display: 'flex',
    gap: 12,
  },

  header: {
    marginBottom: 24,
  },
  tagsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  primaryTag: {
    display: 'inline-block',
    padding: '4px 10px',
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: '#fff',
  },
  secondaryTag: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-accent-strong)',
  },
  assigneeWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  assigneeLabel: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 2,
    color: 'var(--color-text-muted)',
  },

  title: {
    fontSize: 44,
    fontWeight: 800,
    letterSpacing: -2,
    lineHeight: 1.05,
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: 'var(--color-text-muted)',
    marginTop: 8,
    fontWeight: 600,
  },
  description: {
    fontSize: 15,
    color: 'var(--color-text-secondary)',
    lineHeight: 1.55,
    marginTop: 16,
    maxWidth: 720,
  },

  quickActionsBar: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 20,
    padding: '14px 16px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
  },
  quickBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    border: '1px solid',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 1.5,
    fontFamily: 'inherit',
    transition: 'all .15s ease',
  },
  quickBtnPrimary: {
    borderColor: 'transparent',
  },
  quickBtnIcon: {
    fontSize: 14,
  },
  quickBtnContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
  },

  actionsWrap: { display: 'flex', gap: 10, alignItems: 'center' },
  moreBtn: {
    padding: '10px 14px',
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-medium)',
    color: 'var(--color-text-primary)',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: 2,
  },
  actionsMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    background: 'var(--color-surface)',
    border: '1px solid var(--color-border-light)',
    boxShadow: '0 12px 30px color-mix(in srgb, var(--color-gray-900) 18%, transparent)',
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 200,
  },

  statusBarSection: {
    marginBottom: 24,
  },

  linkedSection: {
    marginBottom: 18,
  },
  linkedCard: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    background: 'var(--color-bg-main)',
    borderLeft: '3px solid',
    border: '1px solid var(--color-border-light)',
    borderLeftWidth: 3,
    textDecoration: 'none',
    color: 'var(--color-text-primary)',
  },
  linkedCode: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 800,
    color: 'var(--color-text-muted)',
  },
  linkedTitle: {
    fontSize: 13,
    fontWeight: 600,
    flex: 1,
  },
  linkedStatus: {
    fontSize: 10,
    fontWeight: 800,
    letterSpacing: 1.5,
  },

  tabs: {
    display: 'flex',
    gap: 28,
    borderBottom: '1px solid var(--color-border-light)',
    marginBottom: 24,
  },
  tab: {
    padding: '12px 0',
    background: 'none',
    border: 0,
    borderBottom: '2px solid transparent',
    fontSize: 11,
    fontWeight: 800,
    letterSpacing: 2,
    cursor: 'pointer',
    fontFamily: 'inherit',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  tabBadge: {
    fontFamily: 'monospace',
    fontSize: 10,
    fontWeight: 700,
    color: 'var(--color-accent-strong)',
  },
  tabContent: {
    minHeight: 200,
  },
  directContent: {
    minHeight: 200,
  },
};
