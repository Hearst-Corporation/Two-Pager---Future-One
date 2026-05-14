'use client';
/* ============================================================
   OPENCLAW · LEFT PANEL CONTENT
   ------------------------------------------------------------
   Contextual content for the left panel based on active section.
   Changes when navigation changes, but the panel shell is stable.
   ============================================================ */

import { usePathname } from 'next/navigation';
import LeftContextPanel, { PanelSection, PanelNavItem } from '@/components/layout/LeftContextPanel';
import PanelCard from '@/components/layout/PanelCard';
import DarkBadge from '@/components/ui/DarkBadge';
import { getPanelKeysByPath, findPrimaryByPath, findChildByPath, PRIMARY_NAV } from '@/lib/design-system/navigation';
import { TEXT, SP, T, W, ACCENT } from '@/lib/design-system/tokens';

export default function LeftPanelContent() {
  const pathname = usePathname();
  const { leftPanel } = getPanelKeysByPath(pathname);
  const primary = findPrimaryByPath(pathname);
  const activeChild = findChildByPath(pathname);

  return (
    <LeftContextPanel
      header={
        <div>
          <div style={{ fontSize: T.h4, fontWeight: W.bold, color: TEXT.primary }}>
            {primary?.label || 'HEARST'}
          </div>
          <div style={{ fontSize: T.caption, color: TEXT.muted, marginTop: 2 }}>
            {activeChild?.label || 'Overview'}
          </div>
        </div>
      }
    >
      <PanelContentRenderer panelKey={leftPanel} pathname={pathname} />
    </LeftContextPanel>
  );
}

function PanelContentRenderer({ panelKey, pathname }) {
  const primary = findPrimaryByPath(pathname);
  const childrenTabs = primary?.children || [];

  // Default: show child navigation for the active primary group
  if (panelKey === 'default-context' || childrenTabs.length > 0) {
    return (
      <>
        <PanelSection title="Navigation">
          {childrenTabs.map(c => (
            <PanelNavItem
              key={c.href}
              label={c.label}
              active={pathname.startsWith(c.href)}
              onClick={() => { window.location.href = c.href; }}
            />
          ))}
        </PanelSection>

        <PanelSection title="Quick Filters">
          <PanelCard>
            <div style={{ color: TEXT.secondary, fontSize: T.small }}>
              Filters for {primary?.label} will appear here.
            </div>
          </PanelCard>
        </PanelSection>
      </>
    );
  }

  // Overview specific
  if (panelKey === 'overview-context') {
    return (
      <>
        <PanelSection title="Project">
          <PanelNavItem label="Dashboard" active={pathname === '/admin/hearst'} />
          <PanelNavItem label="Health Check" />
          <PanelNavItem label="Alerts" badge={3} />
        </PanelSection>
        <PanelSection title="Scenarios">
          <PanelCard>
            <div style={{ color: TEXT.secondary, fontSize: T.small }}>
              Base Case, Upside, Downside...
            </div>
          </PanelCard>
        </PanelSection>
      </>
    );
  }

  // Fallback
  return (
    <PanelSection title="Context">
      <PanelCard>
        <div style={{ color: TEXT.secondary, fontSize: T.small }}>
          Context for {panelKey}
        </div>
      </PanelCard>
    </PanelSection>
  );
}
