'use client';

import '@hearst/cockpit-shell/tokens.css';
import './cp-tokens.css';
import { CockpitShell } from '@hearst/cockpit-shell';
import { SimulationProvider } from '@/lib/hearst-simulation-context';
import ChatToggleFAB from '@/components/hearst/ChatToggleFAB';
import StrategicMemoModal from '@/components/hearst/StrategicMemoModal';
import MemoJobBadge from '@/components/hearst/MemoJobBadge';
import MemoToast from '@/components/hearst/MemoToast';
import { ChatIdPersistor } from '@/components/admin/ChatIdPersistor';

const ORACLE_PRODUCTS = [
  // eslint-disable-next-line no-restricted-syntax -- CockpitProduct.color contract requires a hex literal (shell consumes it via color-mix).
  { id: 'oracle', name: 'Hearst Oracle', short: 'OR', color: '#be123c' },
];

// Chat natif CockpitShell (rail droit) — Kimi K2.6 via Hypercli.
// Endpoint par défaut du shell : /api/cockpit-chat (déjà câblé dans
// app/api/cockpit-chat/route.ts → lib/llm/kimi.ts → HYPERCLI_API_KEY).
// On laisse chatConfig minimal — pas d'override apiEndpoint.
//
// Source : ~/.claude/CLAUDE.md « Chat Kimi via Hypercli (kimi-k2.6, clé
// HYPERCLI_API_KEY depuis ~/.claude/api-config/, jamais hardcodée) ».
const ORACLE_CHAT_CONFIG = {
  productContext: 'Hearst Oracle — infrastructure investment simulator',
};

export default function HearstLayout({ children }) {
  return (
    <SimulationProvider>
      <ChatIdPersistor />
      <CockpitShell products={ORACLE_PRODUCTS} appId="oracle" chatConfig={ORACLE_CHAT_CONFIG}>
        {children}
        <ChatToggleFAB />
        {/* Strategic Memo : modale + badge persistant + toast pilotés par
            le store global lib/hearst-memo-job-store.js. Le job survit à
            la fermeture de la modale, badge bottom-right reprend le relais,
            toast à la fin. Mountés UNE seule fois ici. */}
        <StrategicMemoModal />
        <MemoJobBadge />
        <MemoToast />
      </CockpitShell>
    </SimulationProvider>
  );
}
