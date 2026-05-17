'use client';
/* ============================================================
   HEARST ADVISOR — CHAT MOUNT
   ------------------------------------------------------------
   Mount point for the HEARST Advisor in the right rail.
   Wraps ChatContainer with fetched project + page context.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ChatContainer from './ChatContainer';
import { getPageContext } from '@/lib/hearst-page-context';
import { useSimulation } from '@/lib/hearst-simulation-context';

const SLIDER_LABELS = {
  total_mw: 'Capacité IT',
  target_occupancy_pct: 'Occupancy cible',
  price_hyperscale_kw_month: 'Prix hyperscale $/kW/mo',
  electricity_price_mwh: 'Prix électricité $/MWh',
  exit_multiple: 'Exit multiple',
  debt_pct: 'Levier dette %',
};

export default function ChatMount() {
  const pathname = usePathname();
  const [project, setProject] = useState(null);
  const [tick, setTick] = useState(0);
  const { overrides } = useSimulation();

  const load = useCallback(async () => {
    try {
      const pRes = await fetch('/api/admin/hearst/project');
      if (!pRes.ok) return;
      const { project: proj } = await pRes.json();
      setProject(proj);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const basePageContext = getPageContext(pathname);

  const pageContext = overrides
    ? {
        ...basePageContext,
        simulation_live: Object.entries(overrides)
          .map(([k, v]) => `${SLIDER_LABELS[k] ?? k}: ${v}`)
          .join(', '),
      }
    : basePageContext;

  return (
    <ChatContainer
      project={project}
      pageContext={pageContext}
      onMutationDetected={() => setTick(t => t + 1)}
    />
  );
}
