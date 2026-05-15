'use client';
/* ============================================================
   OPENCLAW · RIGHT PANEL CONTENT
   ------------------------------------------------------------
   Contextual content for the right panel based on active section.
   Displays metrics, actions, and secondary info.
   ============================================================ */

import { usePathname } from 'next/navigation';
import RightContextPanel, { MetricCard, PanelAction } from '@/components/layout/RightContextPanel';
import PanelCard from '@/components/layout/PanelCard';
import DarkBadge from '@/components/ui/DarkBadge';
import StatusIndicator from '@/components/ui/StatusIndicator';
import { getPanelKeysByPath, findPrimaryByPath } from '@/lib/design-system/navigation';
import { TEXT, SP, T, W } from '@/lib/design-system/tokens';

export default function RightPanelContent() {
  const pathname = usePathname();
  const { rightPanel } = getPanelKeysByPath(pathname);
  const primary = findPrimaryByPath(pathname);

  return (
    <RightContextPanel
      header={
        <div style={{ display: 'flex', alignItems: 'center', gap: `${SP[2]}px` }}>
          <StatusIndicator variant="active" size={7} pulse />
          <span style={{ fontSize: T.base, fontWeight: W.bold, color: TEXT.primary }}>
            Live Metrics
          </span>
        </div>
      }
    >
      <PanelContentRenderer panelKey={rightPanel} primary={primary} />
    </RightContextPanel>
  );
}

function PanelContentRenderer({ panelKey, primary }) {
  // Overview metrics
  if (panelKey === 'overview-metrics') {
    return (
      <>
        <MetricCard label="Source Score" value="72" unit="/100" trend="+5%" trendUp />
        <MetricCard label="Data Room" value="18" unit="/25 docs" trend="+2" trendUp />
        <MetricCard label="Project IRR" value="14.2" unit="%" />
        <MetricCard label="MOIC" value="2.4" unit="x" />

        <PanelCard title="Status">
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${SP[2]}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${SP[2]}px` }}>
              <DarkBadge variant="success">On Track</DarkBadge>
              <span style={{ fontSize: T.small, color: TEXT.secondary }}>Base Case</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${SP[2]}px` }}>
              <DarkBadge variant="warning">Review</DarkBadge>
              <span style={{ fontSize: T.small, color: TEXT.secondary }}>Sources</span>
            </div>
          </div>
        </PanelCard>

        <PanelAction label="Export Report" variant="primary" />
        <PanelAction label="Run Audit" />
      </>
    );
  }

  // Model metrics
  if (panelKey === 'model-metrics') {
    return (
      <>
        <MetricCard label="Total MW" value="100" unit="MW" />
        <MetricCard label="PUE" value="1.42" />
        <MetricCard label="CAPEX" value="$680" unit="M" />
        <MetricCard label="Stabilized EBITDA" value="$84" unit="M/yr" />

        <PanelCard title="Assumptions">
          <div style={{ fontSize: T.small, color: TEXT.secondary }}>
            14 of 18 inputs sourced
          </div>
        </PanelCard>

        <PanelAction label="Fill Qatar Defaults" variant="primary" />
        <PanelAction label="Run Stress Test" />
      </>
    );
  }

  // Default / fallback
  return (
    <>
      <MetricCard label="Active Items" value="--" />
      <MetricCard label="Last Updated" value="Now" />

      <PanelCard title={primary?.label || 'Context'}>
        <div style={{ fontSize: T.small, color: TEXT.secondary }}>
          Metrics for {panelKey} will appear here.
        </div>
      </PanelCard>

      <PanelAction label="Action" variant="primary" />
    </>
  );
}
