'use client';
/* ============================================================
   OPENCLAW · CHAT MOUNT
   ------------------------------------------------------------
   Mount point for the central chat. Fetches project + scenarios
   and passes them to ChatContainer. Lives in the layout so it
   never unmounts between page navigations.
   ============================================================ */

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import ChatContainer from './ChatContainer';
import { getPageContext } from '@/lib/hearst-page-context';

export default function ChatMount() {
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
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const pageContext = getPageContext(pathname);

  return (
    <ChatContainer
      project={project}
      scenarios={scenarios}
      pageContext={pageContext}
      onMutationDetected={() => setTick(t => t + 1)}
    />
  );
}
