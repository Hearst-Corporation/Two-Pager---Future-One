'use client';

import { CockpitShell } from '@hearst/cockpit-shell';
import { Suspense } from 'react';
import { SimulationProvider } from '@/lib/hearst-simulation-context';
import { OracleRailNav } from '@/components/OracleRailNav';
import ChatToggleFAB from '@/components/hearst/ChatToggleFAB';
import OracleAdvisorRail from '@/components/hearst/OracleAdvisorRail';
import StrategicMemoModal from '@/components/hearst/StrategicMemoModal';
import MemoJobBadge from '@/components/hearst/MemoJobBadge';
import MemoToast from '@/components/hearst/MemoToast';
import { CockpitChatBridge } from '@/components/admin/CockpitChatBridge';

// ThemeAccent (cockpit-shell) fait setProperty('--ct-accent', color) sur <html>.
// INTERDIT var(--cp-accent) ici : --cp-accent = var(--ct-accent) → boucle circulaire → couleurs mortes au mount shell.
const ORACLE_ACCENT_HEX = '#8A1538'; // cockpit-lint-allow — hex obligatoire pour ThemeAccent (pas var(--cp-accent))

const ORACLE_PRODUCTS = [
  // eslint-disable-next-line no-restricted-syntax -- CockpitProduct.color contract requires a hex literal (ThemeAccent → --ct-accent).
  { id: 'oracle', name: 'Hearst Oracle', short: 'OR', color: ORACLE_ACCENT_HEX },
];

const ORACLE_CHAT_CONFIG = {
  productContext: 'Hearst Oracle — infrastructure investment simulator',
};

export default function HearstLayoutClient({ children }) {
  return (
    <SimulationProvider>
      <Suspense fallback={null}>
        <CockpitChatBridge />
      </Suspense>
      <CockpitShell products={ORACLE_PRODUCTS} appId="oracle" chatConfig={ORACLE_CHAT_CONFIG}>
        <OracleRailNav />
        {children}
        <Suspense fallback={null}>
          <OracleAdvisorRail />
        </Suspense>
        <ChatToggleFAB />
        <StrategicMemoModal />
        <MemoJobBadge />
        <MemoToast />
      </CockpitShell>
    </SimulationProvider>
  );
}
