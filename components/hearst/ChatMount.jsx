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

export default function ChatMount() {
  const pathname = usePathname();
  const [project, setProject] = useState(null);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const pRes = await fetch('/api/admin/hearst/project');
      if (!pRes.ok) return;
      const { project: proj } = await pRes.json();
      setProject(proj);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  const pageContext = getPageContext(pathname);

  return (
    <ChatContainer
      project={project}
      pageContext={pageContext}
      onMutationDetected={() => setTick(t => t + 1)}
    />
  );
}
