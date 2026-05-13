'use client';
// components/hearst/AdvisorMount.jsx
// Mounts the floating HEARST Advisor on every HEARST tab.
// - Fetches project + scenarios once (re-fetched after a mutation).
// - Derives the page context from the current pathname (lib/hearst-page-context).
// - The advisor itself handles open/close and persists state to localStorage.

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AdvisorPanel from './AdvisorPanel';
import { getPageContext } from '@/lib/hearst-page-context';

export default function AdvisorMount() {
  const pathname = usePathname();
  const [project, setProject] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const pRes = await fetch('/api/admin/hearst/project');
      if (!pRes.ok) return;
      const { project: proj } = await pRes.json();
      setProject(proj);
      const sRes = await fetch(`/api/admin/hearst/scenarios?project_id=${proj.id}`);
      if (sRes.ok) {
        const { scenarios: sc } = await sRes.json();
        setScenarios(sc || []);
      }
    } catch { /* silent — advisor stays available, falls back to defaults */ }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const pageContext = getPageContext(pathname);

  return (
    <AdvisorPanel
      project={project}
      scenarios={scenarios}
      pageContext={pageContext}
      onMutationDetected={() => setTick(t => t + 1)}
    />
  );
}
