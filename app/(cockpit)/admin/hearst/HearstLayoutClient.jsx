'use client';

import { useEffect, Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { CockpitShell } from '@hearst/cockpit-shell';
import { SimulationProvider } from '@/lib/hearst-simulation-context';
import { OracleRailNav } from '@/components/OracleRailNav';
import ChatToggleFAB from '@/components/hearst/ChatToggleFAB';
import StrategicMemoModal from '@/components/hearst/StrategicMemoModal';
import MemoJobBadge from '@/components/hearst/MemoJobBadge';
import MemoToast from '@/components/hearst/MemoToast';
import { CockpitChatBridge } from '@/components/admin/CockpitChatBridge';

// Accent Oracle : SOURCE UNIQUE = --ct-accent dans cockpit-shell/tokens.css.
// On NE passe PAS de `color` ici : ThemeAccent ne pose alors aucun override JS,
// le fallback CSS reste seul maître → zéro flash, et la couleur s'édite dans
// tokens.css (plus de hex câblé en double ici).
const ORACLE_PRODUCTS = [
  { id: 'oracle', name: 'Hearst Oracle', short: 'OR' },
];

const ORACLE_CHAT_CONFIG = {
  productContext: 'Hearst Oracle — infrastructure investment simulator',
};

export default function HearstLayoutClient({ children }) {
  const pathname = usePathname();
  const isFullWidth = pathname.includes('/simulator');

  useEffect(() => {
    document.documentElement.classList.add('oracle-cockpit-root');
    document.body.classList.add('oracle-cockpit-page');
    document.body.classList.add('oracle-chat-docked');
    return () => {
      document.documentElement.classList.remove('oracle-cockpit-root');
      document.body.classList.remove('oracle-cockpit-page');
      document.body.classList.remove('oracle-chat-docked');
    };
  }, []);

  return (
    <SimulationProvider>
      <Suspense fallback={null}>
        <CockpitChatBridge />
      </Suspense>
      <CockpitShell products={ORACLE_PRODUCTS} appId="oracle" chatConfig={ORACLE_CHAT_CONFIG} fullWidth={isFullWidth}>
        <OracleRailNav />
        {children}
        <ChatToggleFAB />
        <StrategicMemoModal />
        <MemoJobBadge />
        <MemoToast />
      </CockpitShell>
    </SimulationProvider>
  );
}
