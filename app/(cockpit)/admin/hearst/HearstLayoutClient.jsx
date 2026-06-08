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
